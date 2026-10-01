// Klien tipis REST Vercel KV / Upstash Redis (satu perintah per POST).
// Tanpa dependency ekstra; dipakai lib/store.ts saja. Env: KV_REST_API_URL + KV_REST_API_TOKEN
// (kompatibel UPSTASH_REDIS_REST_URL/TOKEN). Lihat ADR-0005.

interface KvEnv {
  url: string;
  token: string;
}

function readEnv(): KvEnv | null {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  if (!url || !token) return null;
  return { url, token };
}

export function kvAvailable(): boolean {
  return readEnv() !== null;
}

async function exec<T>(cmd: Array<string | number>): Promise<T | null> {
  const env = readEnv();
  if (!env) return null;
  const res = await fetch(env.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.token}` },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { result: T | null };
  return data.result;
}

export async function kvGet(key: string): Promise<string | null> {
  return exec<string>(["GET", key]);
}

// true bila key benar-benar ditulis (NX gagal → false), false bila KV mati.
export async function kvSet(
  key: string,
  value: string,
  opts: { nx?: boolean; ex?: number } = {},
): Promise<boolean> {
  const cmd: Array<string | number> = ["SET", key, value];
  if (opts.nx) cmd.push("NX");
  if (opts.ex) cmd.push("EX", opts.ex);
  const result = await exec<string>(cmd);
  return result === "OK";
}

export async function kvIncr(key: string): Promise<number | null> {
  const n = await exec<number>(["INCR", key]);
  return typeof n === "number" ? n : null;
}

export async function kvExpire(key: string, seconds: number): Promise<void> {
  await exec<number>(["EXPIRE", key, seconds]);
}

export async function kvDel(key: string): Promise<void> {
  await exec<number>(["DEL", key]);
}

// Pipeline: banyak perintah dalam satu request (mis. daftar 50 serial batch).
export async function kvExecAll(
  cmds: Array<Array<string | number>>,
): Promise<Array<unknown>> {
  const env = readEnv();
  if (!env) return [];
  const res = await fetch(env.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.token}` },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as Array<unknown>;
  return data.map((item) =>
    item !== null && typeof item === "object" && "result" in item
      ? (item as { result: unknown }).result
      : item,
  );
}
