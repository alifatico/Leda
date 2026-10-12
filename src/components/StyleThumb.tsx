"use client";

import { paletteFor, STYLES, type StyleId } from "@/lib/quote";
import { cx } from "./ui";

/** A thumbnail of a document style, drawn from its tokens in the quote's own colours: header, client block, table, total. */
export function StyleThumb({ id, color }: { id: StyleId; color: string }) {
  const tk = STYLES[id];
  const P = paletteFor(color);
  const rows = tk.layout === "dense" ? 5 : 3;
  const headerFill = tk.tableHeader === "filled";
  const table = (
    <span className="mx-1 mt-1.5 block space-y-[3px]">
      <span
        className={cx("block h-1.5 w-full", headerFill ? "rounded-[1px]" : "border-b")}
        style={headerFill ? { backgroundColor: P.accent } : { borderColor: tk.tableHeader === "double" ? P.ink : tk.layout === "swiss" ? P.ink : P.accent }}
      />
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="flex items-center justify-between" style={tk.zebra && i % 2 === 1 ? { backgroundColor: P.tint } : undefined}>
          <span className="flex items-center gap-[2px]">
            {tk.numbered ? <span className="block h-1 w-1 rounded-sm" style={{ backgroundColor: P.line }} /> : null}
            <span className="block h-1 w-5 rounded-sm bg-slate-200" />
          </span>
          <span className="block h-1 w-2 rounded-sm bg-slate-200" />
        </span>
      ))}
    </span>
  );
  const total = (
    <span
      className={cx("absolute bottom-1.5 right-1 block h-2 w-5", tk.radius ? "rounded-[2px]" : "", tk.payable === "outline" && "border", tk.payable === "rule" && "border-t-[1.5px]")}
      style={tk.payable === "filled" ? { backgroundColor: P.accent } : tk.payable === "panel" ? { backgroundColor: P.tint } : { borderColor: P.accent }}
    />
  );
  const frame = "relative block h-16 w-12 shrink-0 overflow-hidden rounded-[3px] border border-slate-200 bg-white shadow-sm";
  switch (tk.layout) {
    case "hero":
      return (
        <span aria-hidden className={frame}>
          <span className="flex h-4 w-full items-start justify-between px-1 pt-1" style={{ backgroundColor: P.accent }}>
            <span className="block h-1.5 w-1.5 rounded-[1px] bg-white/90" />
            <span className="block h-1.5 w-3 rounded-sm bg-white/90" />
          </span>
          <span className="mx-1 mt-1.5 flex gap-1">
            <span className="block h-2.5 flex-1" />
            <span className="block h-2.5 flex-1 rounded-[2px]" style={{ backgroundColor: P.tint }} />
          </span>
          {table}
          {total}
        </span>
      );
    case "swiss":
      return (
        <span aria-hidden className={frame}>
          <span className="flex items-center gap-[2px] px-1 pt-1.5">
            <span className="block h-1 w-1" style={{ backgroundColor: P.accent }} />
            <span className="block h-[3px] w-3 rounded-sm bg-slate-300" />
          </span>
          <span className="mx-1 mt-1 block h-1.5 w-8 rounded-sm bg-slate-700" />
          <span className="mx-1 mt-1.5 flex justify-between border-y py-[2px]" style={{ borderColor: P.ink }}>
            <span className="block h-1 w-2 rounded-sm bg-slate-200" />
            <span className="block h-1 w-2 rounded-sm bg-slate-200" />
            <span className="block h-1 w-2 rounded-sm bg-slate-200" />
          </span>
          {table}
          {total}
        </span>
      );
    case "masthead":
      return (
        <span aria-hidden className={frame}>
          <span className="mx-auto mt-1.5 block h-1 w-4 rounded-sm bg-slate-300" />
          <span className="mx-auto mt-1 block h-[2px] w-2" style={{ backgroundColor: P.accent }} />
          <span className="mx-auto mt-1 block h-1.5 w-6 rounded-sm" style={{ backgroundColor: P.deep }} />
          <span className="mx-1 mt-1.5 block h-[3px] border-y" style={{ borderColor: P.ink }} />
          {table}
          {total}
        </span>
      );
    case "dense":
      return (
        <span aria-hidden className={frame}>
          <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: P.accent }} />
          <span className="ml-2 mr-1 flex items-center justify-between pt-1.5">
            <span className="block h-1 w-3 rounded-sm bg-slate-300" />
            <span className="block h-1.5 w-3 rounded-sm" style={{ backgroundColor: P.accent }} />
          </span>
          <span className="ml-2 mr-1 mt-1 flex gap-1">
            <span className="block h-2 flex-1" />
            <span className="block h-2 flex-1" style={{ backgroundColor: P.tint }} />
          </span>
          <span className="ml-1">{table}</span>
          {total}
        </span>
      );
    case "sidebar":
      return (
        <span aria-hidden className={frame}>
          <span className="absolute inset-y-0 left-0 w-4 px-1 pt-1.5" style={{ backgroundColor: P.accent }}>
            <span className="block h-2 w-2 rounded-[1px] bg-white/90" />
            <span className="mt-1.5 block h-[2px] w-2 rounded-sm bg-white/70" />
            <span className="mt-[2px] block h-[2px] w-2 rounded-sm bg-white/70" />
          </span>
          <span className="ml-4 block">
            <span className="mx-1 mt-1.5 block h-2 w-5 rounded-sm bg-slate-700" />
            {table}
          </span>
          {total}
        </span>
      );
    default:
      return (
        <span aria-hidden className={frame}>
          <span className="flex items-start justify-between px-1 pt-1.5">
            <span className="block h-1 w-4 rounded-sm bg-slate-300" />
            <span className="block h-1.5 w-3 rounded-sm" style={{ backgroundColor: P.accent }} />
          </span>
          <span className="mx-1 mt-1 flex items-start">
            <span className="block h-[2px] w-2" style={{ backgroundColor: P.accent }} />
            <span className="mt-px block h-px flex-1" style={{ backgroundColor: P.line }} />
          </span>
          <span className="mx-1 mt-1 flex gap-1">
            <span className="block h-2.5 flex-1" />
            <span className="block h-2.5 flex-1 rounded-[1px] border-l-[2px]" style={{ backgroundColor: P.tint, borderColor: P.accent }} />
          </span>
          {table}
          {total}
        </span>
      );
  }
}
