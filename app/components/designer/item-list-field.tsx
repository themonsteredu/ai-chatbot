"use client";

import { useState } from "react";
import type { ListItem } from "../../../lib/chatbot-studio";

type ItemListFieldProps = {
  label: string;
  help?: string;
  items: ListItem[];
  maxItems: number;
  onChange: (items: ListItem[]) => void;
};

/**
 * 목록을 한 줄에 하나씩 적는 칸입니다.
 *
 * 적는 동안에는 빈 줄이 남아 있어야 엔터로 다음 줄에 이어 쓸 수 있습니다. 그래서
 * 화면에 보이는 글자는 적은 그대로 두고, 실제 항목을 만들 때만 빈 줄을 걸러냅니다.
 */
export function ItemListField({
  label,
  help,
  items,
  maxItems,
  onChange,
}: ItemListFieldProps) {
  const joined = items.map((item) => item.text).join("\n");
  // 다른 부품을 고르면 적던 내용을 놓아 줘야 합니다. 부모가 부품마다 다른 key를
  // 주기 때문에, 부품이 바뀌면 이 칸이 통째로 새로 만들어집니다.
  const [draft, setDraft] = useState<string | null>(null);

  const value = draft ?? joined;

  const change = (next: string) => {
    const lines = next.split("\n").slice(0, maxItems);
    setDraft(lines.join("\n"));
    onChange(
      lines
        .map((line, index) => ({
          id: items[index]?.id ?? `item-${index + 1}-${line.slice(0, 8)}`,
          text: line.trim(),
        }))
        .filter((item) => item.text),
    );
  };

  return (
    <label>
      <span>{label}</span>
      <textarea
        rows={Math.min(Math.max(items.length + 1, 3), 8)}
        value={value}
        onChange={(event) => change(event.target.value)}
        onBlur={() => setDraft(null)}
      />
      <small className="property-help">
        {help ?? "한 줄에 하나씩 적어요"} · 최대 {maxItems}개
      </small>
    </label>
  );
}
