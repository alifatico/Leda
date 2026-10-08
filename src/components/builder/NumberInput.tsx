"use client";

import React, { useState } from "react";
import { Input } from "../ui";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number;
  onChange: (n: number) => void;
};

/** Text-based numeric field: lets the user clear it or type "1," without fighting the caret. */
export function NumberInput({ value, onChange, ...rest }: Props) {
  const [text, setText] = useState(Number.isFinite(value) ? String(value) : "");
  const [lastValue, setLastValue] = useState(value);

  // Sync the text when the value changes from the outside (e.g. an AI draft),
  // without clobbering a half-typed "1," or an emptied field.
  if (value !== lastValue) {
    setLastValue(value);
    const typing = text === "" || /[.,]$/.test(text);
    if (!typing && parseFloat(text.replace(",", ".")) !== value) setText(Number.isFinite(value) ? String(value) : "");
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const normalized = raw.replace(",", ".").trim();
        if (normalized === "") {
          onChange(0);
          return;
        }
        const n = parseFloat(normalized);
        if (Number.isFinite(n)) onChange(n);
      }}
      onBlur={() => setText(Number.isFinite(value) ? String(value) : "0")}
      {...rest}
    />
  );
}
