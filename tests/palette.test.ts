import { describe, expect, it } from "vitest";
import { contrast, luminance, mix, paletteFor, safeHex } from "@/lib/quote";

describe("palette", () => {
  it("falls back to the default accent for anything that is not a 6-digit hex", () => {
    expect(safeHex("#abcdef")).toBe("#ABCDEF");
    expect(safeHex("red")).toBe("#1E3A8A");
    expect(safeHex(undefined)).toBe("#1E3A8A");
    expect(paletteFor("#zzz").accent).toBe("#1E3A8A");
  });

  it("mixes colours and measures contrast", () => {
    expect(mix("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(mix("#FF0000", "#FF0000", 0.3)).toBe("#FF0000");
    expect(luminance("#FFFFFF")).toBeCloseTo(1, 5);
    expect(luminance("#000000")).toBe(0);
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("keeps white text on a dark accent and switches to ink on a light one", () => {
    const navy = paletteFor("#1E3A8A");
    expect(navy.onAccent).toBe("#FFFFFF");
    expect(navy.deep).toBe("#1E3A8A");
    expect(navy.tint).toBe("#EDEFF6");
    const yellow = paletteFor("#FACC15");
    expect(yellow.onAccent).toBe(navy.ink);
    expect(yellow.deep).not.toBe("#FACC15");
    expect(contrast(yellow.deep, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(yellow.tint, "#FFFFFF")).toBeLessThan(1.2);
  });
});
