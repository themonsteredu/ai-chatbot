"use client";

import type { ComponentNode, Expr } from "../../../lib/chatbot-studio";
import { REGISTRY } from "../../../lib/components/registry";

/**
 * 블록의 구멍입니다. 자유롭게 적는 칸이 아니라 고르는 칸이라, 학생이 말이 안 되는
 * 프로그램을 만들 수 없습니다.
 */

const KINDS: Array<{ value: Expr["k"]; label: string; advanced?: boolean }> = [
  { value: "text", label: "글자" },
  { value: "num", label: "숫자" },
  { value: "bool", label: "참·거짓" },
  { value: "prop", label: "부품 값" },
  { value: "var", label: "변수", advanced: true },
  { value: "math", label: "계산", advanced: true },
  { value: "cmp", label: "비교", advanced: true },
  { value: "logic", label: "그리고·또는", advanced: true },
  { value: "join", label: "이어 붙이기", advanced: true },
];

function blankOf(kind: Expr["k"], nodes: ComponentNode[]): Expr {
  switch (kind) {
    case "text":
      return { k: "text", v: "" };
    case "num":
      return { k: "num", v: 0 };
    case "bool":
      return { k: "bool", v: true };
    case "var":
      return { k: "var", name: "" };
    case "prop": {
      const first = nodes.find((node) =>
        REGISTRY[node.type].props.some((prop) => prop.blockReadable),
      );
      const prop = first
        ? REGISTRY[first.type].props.find((item) => item.blockReadable)
        : undefined;
      return { k: "prop", target: first?.id ?? "", prop: prop?.key ?? "" };
    }
    case "math":
      return { k: "math", op: "+", a: { k: "num", v: 1 }, b: { k: "num", v: 1 } };
    case "cmp":
      return { k: "cmp", op: "=", a: { k: "num", v: 1 }, b: { k: "num", v: 1 } };
    case "logic":
      return {
        k: "logic",
        op: "그리고",
        a: { k: "bool", v: true },
        b: { k: "bool", v: true },
      };
    case "join":
      return { k: "join", parts: [{ k: "text", v: "" }, { k: "text", v: "" }] };
  }
}

type ValueSocketProps = {
  value: Expr;
  nodes: ComponentNode[];
  variables: string[];
  advanced: boolean;
  onChange: (value: Expr) => void;
  depth?: number;
};

export function ValueSocket({
  value,
  nodes,
  variables,
  advanced,
  onChange,
  depth = 0,
}: ValueSocketProps) {
  // 너무 깊게 겹치면 중학생이 읽기 어렵습니다. 세 겹에서 멈춥니다.
  const canNest = advanced && depth < 3;
  const kinds = KINDS.filter((kind) => canNest || !kind.advanced);

  const nested = (child: Expr, replace: (next: Expr) => void) => (
    <ValueSocket
      value={child}
      nodes={nodes}
      variables={variables}
      advanced={advanced}
      onChange={replace}
      depth={depth + 1}
    />
  );

  return (
    <span className={`value-socket depth-${depth}`}>
      <select
        aria-label="값 종류"
        value={value.k}
        onChange={(event) =>
          onChange(blankOf(event.target.value as Expr["k"], nodes))
        }
      >
        {kinds.map((kind) => (
          <option key={kind.value} value={kind.value}>
            {kind.label}
          </option>
        ))}
      </select>

      {value.k === "text" && (
        <input
          aria-label="글자 값"
          value={value.v}
          maxLength={200}
          placeholder="글을 적어요"
          onChange={(event) => onChange({ k: "text", v: event.target.value })}
        />
      )}

      {value.k === "num" && (
        <input
          aria-label="숫자 값"
          type="number"
          value={value.v}
          onChange={(event) =>
            onChange({ k: "num", v: Number(event.target.value) || 0 })
          }
        />
      )}

      {value.k === "bool" && (
        <select
          aria-label="참 또는 거짓"
          value={value.v ? "참" : "거짓"}
          onChange={(event) =>
            onChange({ k: "bool", v: event.target.value === "참" })
          }
        >
          <option>참</option>
          <option>거짓</option>
        </select>
      )}

      {value.k === "var" && (
        <select
          aria-label="변수 고르기"
          value={value.name}
          onChange={(event) => onChange({ k: "var", name: event.target.value })}
        >
          <option value="">변수를 골라요</option>
          {variables.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      )}

      {value.k === "prop" && (
        <PropPicker value={value} nodes={nodes} onChange={onChange} />
      )}

      {(value.k === "math" || value.k === "cmp" || value.k === "logic") && (
        <span className="value-operands">
          {nested(value.a, (next) => onChange({ ...value, a: next }))}
          <select
            aria-label="계산 방법"
            value={value.op}
            onChange={(event) =>
              onChange({ ...value, op: event.target.value as never })
            }
          >
            {(value.k === "math"
              ? ["+", "-", "×", "÷"]
              : value.k === "cmp"
                ? ["=", "≠", ">", "<", "≥", "≤"]
                : ["그리고", "또는"]
            ).map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
          {nested(value.b, (next) => onChange({ ...value, b: next }))}
        </span>
      )}

      {value.k === "join" && (
        <span className="value-operands">
          {value.parts.map((part, index) => (
            <span key={index}>
              {nested(part, (next) =>
                onChange({
                  ...value,
                  parts: value.parts.map((one, at) => (at === index ? next : one)),
                }),
              )}
            </span>
          ))}
          {value.parts.length < 4 && (
            <button
              type="button"
              className="socket-add"
              onClick={() =>
                onChange({ ...value, parts: [...value.parts, { k: "text", v: "" }] })
              }
            >
              +
            </button>
          )}
        </span>
      )}
    </span>
  );
}

function PropPicker({
  value,
  nodes,
  onChange,
}: {
  value: Extract<Expr, { k: "prop" }>;
  nodes: ComponentNode[];
  onChange: (value: Expr) => void;
}) {
  const target = nodes.find((node) => node.id === value.target);
  const readable = target
    ? REGISTRY[target.type].props.filter((prop) => prop.blockReadable)
    : [];

  return (
    <>
      <select
        aria-label="부품 고르기"
        value={value.target}
        onChange={(event) => {
          const next = nodes.find((node) => node.id === event.target.value);
          const first = next
            ? REGISTRY[next.type].props.find((prop) => prop.blockReadable)
            : undefined;
          onChange({
            k: "prop",
            target: event.target.value,
            prop: first?.key ?? "",
          });
        }}
      >
        <option value="">부품을 골라요</option>
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.name}
          </option>
        ))}
      </select>
      <select
        aria-label="속성 고르기"
        value={value.prop}
        disabled={readable.length === 0}
        onChange={(event) => onChange({ ...value, prop: event.target.value })}
      >
        {readable.map((prop) => (
          <option key={prop.key} value={prop.key}>
            {prop.label}
          </option>
        ))}
      </select>
    </>
  );
}
