// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LivePreview from "./LivePreview";
import { defaultCardFormState } from "@/lib/form-state";

function createMockCtx() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const ctx = new Proxy(
    {},
    {
      get(_t, p) {
        if (p === "measureText") return () => ({ width: 40 });
        if (p === "canvas") return undefined;
        if (p === "createLinearGradient" || p === "createRadialGradient") {
          return () => ({ addColorStop: () => {} });
        }
        if (typeof p === "string") {
          return (...args: unknown[]) => {
            calls.push({ method: p, args });
          };
        }
        return undefined;
      },
      set() {
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

const contexts: Array<ReturnType<typeof createMockCtx>> = [];

const FORM = {
  ...defaultCardFormState(),
  businessName: "Kopi Senja",
  reviewLink: "https://search.google.com/local/writereview?placeid=ChIJ1",
};

beforeEach(() => {
  contexts.length = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  HTMLCanvasElement.prototype.getContext = function () {
    const m = createMockCtx();
    contexts.push(m);
    return m.ctx;
  } as never;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LivePreview", () => {
  it("empty state saat payload kosong", () => {
    render(
      <LivePreview
        form={defaultCardFormState()}
        qrPayload=""
        sizeId="pvc-h"
        onSizeChange={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.getByText("Belum ada QR")).toBeDefined();
    expect(screen.getByRole("button", { name: /Download PNG/ })).toBeDisabled();
  });

  it("menggambar kartu ke canvas dimensi export", async () => {
    render(
      <LivePreview
        form={FORM}
        qrPayload={FORM.reviewLink}
        sizeId="pvc-h"
        onSizeChange={() => {}}
        onReset={() => {}}
      />,
    );
    const canvas = await screen.findByRole("img", {
      name: /Preview kartu/,
    });
    expect(canvas.getAttribute("width")).toBe("1011");
    expect(canvas.getAttribute("height")).toBe("638");
    await waitFor(() => expect(contexts.length).toBeGreaterThan(0));
    const texts = contexts[0].calls
      .filter((c) => c.method === "fillText")
      .map((c) => String(c.args[0]));
    expect(texts).toContain("Kopi Senja");
  });

  it("badge dimensi dan ringkasan output tampil", () => {
    render(
      <LivePreview
        form={FORM}
        qrPayload={FORM.reviewLink}
        sizeId="pvc-h"
        onSizeChange={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.getByText("1011 × 638 px @ 300 DPI")).toBeDefined();
    expect(
      screen.getByText("Output Piksel: 1011 × 638 px"),
    ).toBeDefined();
  });

  it("ganti ukuran mengubah dimensi canvas", async () => {
    render(
      <LivePreview
        form={FORM}
        qrPayload={FORM.reviewLink}
        sizeId="pvc-h"
        onSizeChange={() => {}}
        onReset={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText("Ukuran kartu"), {
      target: { value: "a6" },
    });
    expect(screen.getByLabelText("Ukuran kartu")).toBeDefined();
  });

  it("zoom 100% mengatur lebar CSS sesuai piksel", async () => {
    render(
      <LivePreview
        form={FORM}
        qrPayload={FORM.reviewLink}
        sizeId="pvc-h"
        onSizeChange={() => {}}
        onReset={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "100%" }));
    const canvas = (await screen.findByRole("img", {
      name: /Preview kartu/,
    })) as unknown as { style: { width: string } };
    expect(canvas.style.width).toBe("1011px");
  });

  it("Salin Ringkasan memakai clipboard dan memberi umpan balik", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <LivePreview
        form={FORM}
        qrPayload={FORM.reviewLink}
        sizeId="pvc-h"
        onSizeChange={() => {}}
        onReset={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Salin Ringkasan" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain("Kopi Senja");
    expect(await screen.findByText("Tersalin ✓")).toBeDefined();
  });

  it("Reset Form memanggil onReset", () => {
    const onReset = vi.fn();
    render(
      <LivePreview
        form={FORM}
        qrPayload={FORM.reviewLink}
        sizeId="pvc-h"
        onSizeChange={() => {}}
        onReset={onReset}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset Form" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("peringatan saat QR terlalu padat", () => {
    render(
      <LivePreview
        form={FORM}
        qrPayload={`https://app.example/review?placeid=${"x".repeat(400)}`}
        sizeId="pvc-h"
        onSizeChange={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.getByRole("alert")).toBeDefined();
  });
});
