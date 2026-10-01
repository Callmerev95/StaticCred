import { afterEach, describe, expect, it } from "vitest";
import {
  CARDS_SESSION_HOURS,
  cardsAuthConfigured,
  issueCardsSession,
  verifyAdminPin,
  verifyCardsSession,
} from "./cards-auth";

afterEach(() => {
  delete process.env.ADMIN_PIN;
});

describe("cardsAuthConfigured", () => {
  it("false tanpa env, true dengan env", () => {
    expect(cardsAuthConfigured()).toBe(false);
    process.env.ADMIN_PIN = "1234";
    expect(cardsAuthConfigured()).toBe(true);
  });
});

describe("verifyAdminPin", () => {
  it("false tanpa env, benar/salah dengan waktu-konstan", () => {
    expect(verifyAdminPin("1234")).toBe(false);
    process.env.ADMIN_PIN = "1234";
    expect(verifyAdminPin("1234")).toBe(true);
    expect(verifyAdminPin("0000")).toBe(false);
    expect(verifyAdminPin("12345")).toBe(false);
  });
});

describe("verifyCardsSession", () => {
  it("false tanpa cookie/env; true untuk sesi terbitan sendiri", () => {
    expect(verifyCardsSession(undefined)).toBe(false);
    process.env.ADMIN_PIN = "1234";
    expect(verifyCardsSession(undefined)).toBe(false);
    expect(verifyCardsSession(issueCardsSession())).toBe(true);
  });

  it("menolak tanda tangan rusak dan PIN berbeda", () => {
    process.env.ADMIN_PIN = "1234";
    const session = issueCardsSession();
    const tampered = session.slice(0, -1) + (session.endsWith("0") ? "1" : "0");
    expect(verifyCardsSession(tampered)).toBe(false);
    expect(verifyCardsSession("bukan-format")).toBe(false);
    process.env.ADMIN_PIN = "9999";
    expect(verifyCardsSession(session)).toBe(false);
  });

  it("menolak sesi kedaluwarsa", () => {
    process.env.ADMIN_PIN = "1234";
    const old =
      Date.now() - (CARDS_SESSION_HOURS + 1) * 3_600_000;
    expect(verifyCardsSession(`${old}.${"0".repeat(64)}`)).toBe(false);
  });
});
