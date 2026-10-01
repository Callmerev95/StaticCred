import { afterEach, describe, expect, it, vi } from "vitest";
import { hashPin } from "./pin";
import {
  claimCard,
  getActiveCard,
  listCards,
  rateLimited,
  registerSerials,
  verifyCardPin,
} from "./store";

type Cmd = Array<string | number>;

function setEnv() {
  process.env.KV_REST_API_URL = "https://example.upstash.io";
  process.env.KV_REST_API_TOKEN = "token";
}

function mockFetch(handler: (cmd: Cmd, cmds: Cmd[]) => unknown) {
  globalThis.fetch = (async (_url: unknown, init?: { body?: unknown }) => {
    const body = JSON.parse(String(init?.body)) as Cmd | Cmd[];
    if (body.length === 0 || Array.isArray(body[0])) {
      const items = (body as Cmd[]).map((cmd) => ({
        result: handler(cmd, body as Cmd[]),
      }));
      return Response.json(items);
    }
    return Response.json({ result: handler(body as Cmd, [body as Cmd]) });
  }) as unknown as typeof fetch;
}

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  vi.restoreAllMocks();
});

describe("tanpa KV", () => {
  it("claim unavailable, register 0, active null, pin unavailable", async () => {
    mockFetch(() => null);
    expect(
      await claimCard("G-ABCDEF", { nama: "T", url: "u", pinHash: "h" }),
    ).toBe("unavailable");
    expect(await registerSerials(["G-ABCDEF"], "B")).toBe(0);
    expect(await getActiveCard("G-ABCDEF")).toBeNull();
    expect(await verifyCardPin("G-ABCDEF", "1234")).toBe("unavailable");
  });
});

describe("registerSerials", () => {
  it("menghitung yang benar-benar ditulis (NX)", async () => {
    setEnv();
    mockFetch((cmd) =>
      cmd[1] === "pend:G-AAAAAA" ? "OK" : null,
    );
    expect(await registerSerials(["G-AAAAAA", "G-BBBBBB"], "B")).toBe(1);
  });

  it("tanpa perintah bila daftar kosong", async () => {
    setEnv();
    const spy = vi.fn(async () => Response.json({ result: "OK" }));
    globalThis.fetch = spy as unknown as typeof fetch;
    expect(await registerSerials([], "B")).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("claimCard first-wins", () => {
  it("claimed saat NX lolos, taken saat serial sudah ada", async () => {
    setEnv();
    let first = true;
    mockFetch(() => {
      const result = first ? "OK" : null;
      first = false;
      return result;
    });
    const data = { nama: "T", url: "u", pinHash: "h" };
    expect(await claimCard("G-ABCDEF", data)).toBe("claimed");
    expect(await claimCard("G-ABCDEF", data)).toBe("taken");
  });
});

describe("getActiveCard", () => {
  it("parse JSON valid, null untuk rusak/kosong", async () => {
    setEnv();
    const record = {
      v: 1,
      nama: "Toko",
      url: "https://g.page/r/x",
      pinHash: "h",
      createdAt: "t",
      updatedAt: "t",
    };
    mockFetch((cmd) => {
      if (cmd[1] === "card:G-OKKKKK") return JSON.stringify(record);
      if (cmd[1] === "card:G-BADBAD") return "bukan-json";
      return null;
    });
    expect((await getActiveCard("G-OKKKKK"))?.nama).toBe("Toko");
    expect(await getActiveCard("G-BADBAD")).toBeNull();
    expect(await getActiveCard("G-NONONO")).toBeNull();
  });
});

describe("rateLimited", () => {
  it("menolak di atas batas, lolos di bawahnya", async () => {
    setEnv();
    let n = 11;
    const seen: string[] = [];
    mockFetch((cmd) => {
      if (cmd[0] === "INCR") {
        seen.push(cmd.join(":"));
        return n;
      }
      return 1;
    });
    expect(await rateLimited("act", "1.2.3.4", 10)).toBe(true);
    n = 3;
    expect(await rateLimited("act", "1.2.3.4", 10)).toBe(false);
    expect(seen[0]).toContain("1.2.3.4");
  });

  it("IP aneh dibersihkan dari kunci", async () => {
    setEnv();
    const seen: string[] = [];
    mockFetch((cmd) => {
      if (cmd[0] === "INCR") seen.push(cmd.join(":"));
      return 1;
    });
    await rateLimited("act", "a b/c:d", 10);
    const parts = seen[0].split(":");
    expect(parts.slice(1, -1).join(":")).toBe("rl:act:abc:d");
  });
});

describe("verifyCardPin", () => {
  const ID = "G-PINPIN";
  const record = {
    v: 1,
    nama: "T",
    url: "u",
    pinHash: hashPin("1234"),
    createdAt: "t",
    updatedAt: "t",
  };

  it("ok menghapus counter gagal", async () => {
    setEnv();
    const deleted: string[] = [];
    mockFetch((cmd) => {
      if (cmd[0] === "DEL") {
        deleted.push(String(cmd[1]));
        return 1;
      }
      if (cmd[0] === "GET" && cmd[1] === `lk:${ID}`) return null;
      if (cmd[0] === "GET") return JSON.stringify(record);
      return 1;
    });
    expect(await verifyCardPin(ID, "1234")).toBe("ok");
    expect(deleted).toContain(`fp:${ID}`);
  });

  it("locked saat flag kunci ada", async () => {
    setEnv();
    mockFetch((cmd) =>
      cmd[0] === "GET" && cmd[1] === `lk:${ID}` ? "1" : null,
    );
    expect(await verifyCardPin(ID, "1234")).toBe("locked");
  });

  it("kegagalan kelima mengunci", async () => {
    setEnv();
    const locked: string[] = [];
    mockFetch((cmd) => {
      if (cmd[0] === "GET" && cmd[1] === `lk:${ID}`) return null;
      if (cmd[0] === "GET") return JSON.stringify(record);
      if (cmd[0] === "INCR") return 5;
      if (cmd[0] === "SET" && String(cmd[1]) === `lk:${ID}`) {
        locked.push(String(cmd[1]));
        return "OK";
      }
      return 1;
    });
    expect(await verifyCardPin(ID, "0000")).toBe("locked");
    expect(locked).toContain(`lk:${ID}`);
  });

  it("salah sekali tanpa kunci (counter 2)", async () => {
    setEnv();
    mockFetch((cmd) => {
      if (cmd[0] === "GET" && cmd[1] === `lk:${ID}`) return null;
      if (cmd[0] === "GET") return JSON.stringify(record);
      if (cmd[0] === "INCR") return 2;
      return 1;
    });
    expect(await verifyCardPin(ID, "0000")).toBe("wrong");
  });
});

describe("listCards", () => {
  const active = (id: string) =>
    JSON.stringify({
      v: 1,
      nama: `Toko ${id}`,
      url: "https://g.page/r/x",
      pinHash: "h",
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    });
  const pending = JSON.stringify({
    v: 1,
    batch: "BATCH-2026-09-27",
    createdAt: "2026-09-27T00:00:00.000Z",
  });

  // Keyspace fiktif: G-AAAAAA aktif+pending (aktif menang),
  // G-BBBBBB pending, G-CCCCCC aktif.
  function mockKv() {
    const keys: Record<string, string> = {
      "card:G-AAAAAA": active("G-AAAAAA"),
      "pend:G-AAAAAA": pending,
      "pend:G-BBBBBB": pending,
      "card:G-CCCCCC": active("G-CCCCCC"),
      "scan:G-AAAAAA": "3",
      "scan:G-CCCCCC": "bukan-angka",
    };
    const seen: string[] = [];
    mockFetch((cmd) => {
      if (cmd[0] === "SCAN") {
        const pattern = String(cmd[3]).replace("*", "");
        const pages: Record<string, string[][]> = {
          "card:": [["card:G-AAAAAA"], ["card:G-CCCCCC"]],
          "pend:": [["pend:G-AAAAAA", "pend:G-BBBBBB"]],
        };
        seen.push(`scan:${pattern}`);
        const pagesFor = pages[pattern] ?? [[]];
        const idx = seen.filter((s) => s === `scan:${pattern}`).length - 1;
        const page = pagesFor[Math.min(idx, pagesFor.length - 1)];
        const next = idx + 1 >= pagesFor.length ? "0" : String(idx + 1);
        return [next, page];
      }
      if (cmd[0] === "GET") return keys[String(cmd[1])] ?? null;
      return null;
    });
  }

  it("null tanpa KV", async () => {
    mockFetch(() => null);
    expect(await listCards()).toBeNull();
  });

  it("SCAN cursor bertahap, aktif menang, scan dijumlahkan", async () => {
    setEnv();
    mockKv();
    const cards = await listCards();
    expect(cards).toHaveLength(3);
    expect(cards!.map((c) => [c.id, c.status])).toEqual([
      ["G-AAAAAA", "active"],
      ["G-BBBBBB", "pending"],
      ["G-CCCCCC", "active"],
    ]);
    expect(cards![0].nama).toBe("Toko G-AAAAAA");
    expect(cards![0].scan).toBe(3);
    expect(cards![1].batch).toBe("BATCH-2026-09-27");
    expect(cards![1].scan).toBe(0);
    expect(cards![2].scan).toBe(0);
  });

  it("key liar berformat salah dilewati", async () => {
    setEnv();
    mockFetch((cmd) => {
      if (cmd[0] === "SCAN") return ["0", ["card:bukan-serial"]];
      return null;
    });
    expect(await listCards()).toEqual([]);
  });

  it("database kosong → daftar kosong (pipeline tanpa perintah)", async () => {
    setEnv();
    const seen: string[] = [];
    mockFetch((cmd) => {
      if (cmd[0] === "SCAN") return ["0", []];
      seen.push(cmd.join(" "));
      return null;
    });
    expect(await listCards()).toEqual([]);
    expect(seen).toEqual([]);
  });
});
