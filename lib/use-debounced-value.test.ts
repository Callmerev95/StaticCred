// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./use-debounced-value";

describe("useDebouncedValue", () => {
  it("menunda nilai sesuai delay lalu mengejar", () => {
    vi.useFakeTimers();
    try {
      const { result, rerender } = renderHook(
        ({ v }) => useDebouncedValue(v, 250),
        { initialProps: { v: "a" } },
      );
      expect(result.current).toBe("a");
      rerender({ v: "ab" });
      expect(result.current).toBe("a");
      act(() => vi.advanceTimersByTime(250));
      expect(result.current).toBe("ab");
    } finally {
      vi.useRealTimers();
    }
  });
});
