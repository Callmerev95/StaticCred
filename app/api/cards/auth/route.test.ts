import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/cards/auth/route";

function post(body: unknown): Request {
  return new Request("http://localhost/api/cards/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  delete process.env.ADMIN_PIN;
});

describe("POST /api/cards/auth", () => {
  it("503 bila ADMIN_PIN belum dipasang", async () => {
    const res = await POST(post({ pin: "1234" }));
    expect(res.status).toBe(503);
  });

  it("401 untuk PIN salah, 200 + cookie sesi untuk PIN benar", async () => {
    process.env.ADMIN_PIN = "1234";
    const wrong = await POST(post({ pin: "0000" }));
    expect(wrong.status).toBe(401);
    expect(wrong.headers.get("set-cookie")).toBeNull();

    const ok = await POST(post({ pin: "1234" }));
    expect(ok.status).toBe(200);
    const cookie = ok.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("cards_admin=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/cards");
  });

  it("400 untuk body rusak", async () => {
    process.env.ADMIN_PIN = "1234";
    const res = await POST(post("bukan-json{"));
    expect(res.status).toBe(400);
  });
});
