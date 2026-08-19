"use client";

import { Check, Palette } from "lucide-react";

export const COLOR_CHOICES = [
  { name: "보라", value: "#6956e8" },
  { name: "파랑", value: "#3478f6" },
  { name: "민트", value: "#16a982" },
  { name: "주황", value: "#f26b3a" },
  { name: "분홍", value: "#e65387" },
];

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** 색을 고르지 않은 상태를 허용합니다. 그러면 웹앱 대표 색을 따라갑니다. */
  allowNone?: boolean;
};

export function ColorField({
  label,
  value,
  onChange,
  allowNone = false,
}: ColorFieldProps) {
  return (
    <fieldset className="color-field">
      <legend>{label}</legend>
      <div className="color-swatches">
        {allowNone && (
          <button
            className={`color-none ${value === "" ? "selected" : ""}`}
            type="button"
            title="정하지 않음"
            aria-label="색 정하지 않음"
            onClick={() => onChange("")}
          >
            {value === "" && <Check size={13} aria-hidden="true" />}
          </button>
        )}
        {COLOR_CHOICES.map((color) => (
          <button
            className={value === color.value ? "selected" : ""}
            key={color.value}
            type="button"
            style={{ backgroundColor: color.value }}
            aria-label={`${color.name}색 선택`}
            title={color.name}
            onClick={() => onChange(color.value)}
          >
            {value === color.value && <Check size={13} aria-hidden="true" />}
          </button>
        ))}
        <label className="custom-color" title="직접 색 고르기">
          <Palette size={14} aria-hidden="true" />
          <input
            type="color"
            value={value || "#6956e8"}
            aria-label={`${label} 직접 고르기`}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      </div>
    </fieldset>
  );
}
