// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import QrOverlay from "./QrOverlay";

const card = {
  id: "G-ABCDEF",
  status: "active" as const,
  nama: "Toko",
  url: "https://g.page/r/x",
  scan: 3,
};

describe("QrOverlay", () => {
  it("tampil judul + tombol, Tutup memanggil onClose", () => {
    const onClose = vi.fn();
    render(
      <QrOverlay card={card} payload="https://app/r/G-ABCDEF" onClose={onClose} />,
    );
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("QR Code - G-ABCDEF")).toBeDefined();
    expect(
      screen.getByRole("img", { name: "QR menuju kartu G-ABCDEF" }),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape menutup overlay", () => {
    const onClose = vi.fn();
    render(
      <QrOverlay card={card} payload="https://app/r/G-ABCDEF" onClose={onClose} />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Salin Link menyalin payload, tanpa tombol unduh", async () => {
    const onClose = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <QrOverlay card={card} payload="https://app/r/G-ABCDEF" onClose={onClose} />,
    );
    expect(
      screen.queryByRole("button", { name: /unduh/i }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Salin Link" }));
    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("https://app/r/G-ABCDEF"),
    );
    await vi.waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Tersalin" }),
      ).toBeDefined(),
    );
  });
});
