// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import BusinessForm from "./BusinessForm";
import { defaultCardFormState, type CardFormState } from "@/lib/form-state";

function Harness({ initial }: { initial?: CardFormState }) {
  const [state, setState] = useState(initial ?? defaultCardFormState());
  return (
    <BusinessForm
      state={state}
      onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
      appUrl="https://app.example"
    />
  );
}

describe("BusinessForm", () => {
  it("tab default Link Langsung dengan field link dan nama", () => {
    render(<Harness />);
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent(
      "Link Langsung",
    );
    expect(screen.getByLabelText(/Link review Google Maps/)).toBeDefined();
    expect(screen.getByLabelText(/Nama tempat usaha/)).toBeDefined();
  });

  it("pindah ke Cetak Kosong menampilkan ID dan target QR", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("tab", { name: "Cetak Kosong" }));
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent(
      "Cetak Kosong",
    );
    expect(screen.getByText(/Kartu kosong \(aktivasi nanti\)/)).toBeDefined();
    const target = screen.getByLabelText(
      "Link target QR",
    ) as unknown as { value: string };
    expect(target.value).toMatch(/\/r\/G-/);
  });

  it("ID Baru mengganti ID kartu", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("tab", { name: "Cetak Kosong" }));
    const before = (
      screen.getByLabelText("Link target QR") as unknown as { value: string }
    ).value;
    const ids = new Set<string>();
    for (let i = 0; i < 10; i += 1) {
      fireEvent.click(screen.getByRole("button", { name: "ID Baru" }));
      ids.add(
        (screen.getByLabelText("Link target QR") as unknown as { value: string })
          .value,
      );
    }
    expect(before).toMatch(/\/r\/G-/);
    expect(ids.size).toBeGreaterThan(1);
  });

  it("counter nama akurat dan helper link memakai hint validator", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText(/Nama tempat usaha/), {
      target: { value: "Kopi Senja" },
    });
    expect(screen.getByText("10/60 karakter")).toBeDefined();
    fireEvent.change(screen.getByLabelText(/Link review Google Maps/), {
      target: {
        value: "https://search.google.com/local/writereview?placeid=ChIJ1",
      },
    });
    expect(screen.getByText(/bintang 5/)).toBeDefined();
  });

  it("collapsible Ubah Teks Kartu membuka empat field", () => {
    render(<Harness />);
    expect(screen.queryByLabelText("Judul")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /Ubah Teks Kartu/ }),
    );
    expect(screen.getByLabelText("Judul")).toBeDefined();
    expect(screen.getByLabelText("Badge")).toBeDefined();
    expect(screen.getByLabelText("CTA")).toBeDefined();
    expect(screen.getByLabelText("Sub-CTA")).toBeDefined();
  });

  it("toggle Serial ID dan segmen Tema Kartu mengubah state", () => {
    render(<Harness />);
    const serial = screen.getByLabelText(/Serial ID/);
    fireEvent.click(serial);
    expect(
      (serial as unknown as { checked: boolean }).checked,
    ).toBe(true);
    const google = screen.getByLabelText("Google", { exact: true });
    fireEvent.click(google);
    expect((google as unknown as { checked: boolean }).checked).toBe(true);
  });
});
