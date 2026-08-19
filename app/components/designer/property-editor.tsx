"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ImageUp,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  ACTION_ICON_LABELS,
  type ActionIcon,
  type ComponentNode,
  type ListItem,
  type PropValue,
  type QaItem,
} from "../../../lib/chatbot-studio";
import type { PropGroup, PropSpec } from "../../../lib/components/registry";
import { REGISTRY } from "../../../lib/components/registry";
import { compressPhoto } from "../../../lib/image";
import { PartIcon } from "../runtime/part-icon";
import { ColorField } from "./color-field";
import { ItemListField } from "./item-list-field";

const GROUP_LABELS: Record<PropGroup, string> = {
  content: "내용",
  style: "꾸미기",
  behavior: "동작",
};

const ALIGNMENTS = [
  { value: "left", label: "왼쪽", Icon: AlignLeft },
  { value: "center", label: "가운데", Icon: AlignCenter },
  { value: "right", label: "오른쪽", Icon: AlignRight },
];

type PropertyEditorProps = {
  node: ComponentNode;
  value: (key: string) => PropValue;
  onChange: (key: string, value: PropValue) => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function PropertyEditor({
  node,
  value,
  onChange,
  onRename,
  onDuplicate,
  onDelete,
}: PropertyEditorProps) {
  const spec = REGISTRY[node.type];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    content: true,
    // 꾸미기는 속성이 많아 처음에는 접어 둡니다.
    style: false,
    behavior: true,
  });

  const groups: PropGroup[] = ["content", "style", "behavior"];

  return (
    <div className="property-form">
      <div className="selected-component-heading">
        <span className={`component-symbol ${spec.tone}`}>
          <PartIcon type={node.type} size={16} />
        </span>
        <div>
          <strong>{spec.name}</strong>
          <small>{node.name}</small>
        </div>
      </div>

      <label>
        <span>부품 이름</span>
        <input
          value={node.name}
          maxLength={24}
          onChange={(event) => onRename(event.target.value)}
        />
        <small className="property-help">블록에서 이 이름으로 고릅니다</small>
      </label>

      {groups.map((group) => {
        const props = spec.props.filter(
          (prop) => prop.group === group && !prop.hidden,
        );
        if (props.length === 0) return null;
        const open = openGroups[group];
        return (
          <section className="property-group" key={group}>
            <button
              className={`property-group-heading ${open ? "open" : ""}`}
              type="button"
              aria-expanded={open}
              onClick={() =>
                setOpenGroups((current) => ({ ...current, [group]: !open }))
              }
            >
              <span>{GROUP_LABELS[group]}</span>
              <small>{props.length}</small>
            </button>
            {open && (
              <div className="property-group-body">
                {props.map((prop) => (
                  <Field
                    key={`${node.id}:${prop.key}`}
                    spec={prop}
                    value={value(prop.key)}
                    onChange={(next) => onChange(prop.key, next)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <div className="property-actions">
        <button className="secondary-button" type="button" onClick={onDuplicate}>
          <Plus size={15} aria-hidden="true" />
          똑같이 하나 더
        </button>
        <button className="danger-button" type="button" onClick={onDelete}>
          <Trash2 size={15} aria-hidden="true" />
          이 부품 삭제
        </button>
      </div>
    </div>
  );
}

type FieldProps = {
  spec: PropSpec;
  value: PropValue;
  onChange: (value: PropValue) => void;
};

/** 목록 칸이 부품마다 새로 만들어지도록, 열쇠에 부품 아이디를 함께 씁니다. */

function Field({ spec, value, onChange }: FieldProps) {
  switch (spec.kind) {
    case "text":
      return (
        <label>
          <span>{spec.label}</span>
          <input
            value={String(value ?? "")}
            maxLength={spec.max}
            onChange={(event) => onChange(event.target.value)}
          />
          {spec.help && <small className="property-help">{spec.help}</small>}
        </label>
      );

    case "textarea": {
      const text = String(value ?? "");
      return (
        <label>
          <span>{spec.label}</span>
          <textarea
            rows={spec.rows ?? 4}
            value={text}
            maxLength={spec.max}
            onChange={(event) => onChange(event.target.value)}
          />
          {spec.max && (
            <small className="field-count">
              {text.length}/{spec.max}
            </small>
          )}
        </label>
      );
    }

    case "number":
      return (
        <label>
          <span>{spec.label}</span>
          <input
            type="number"
            value={Number(value ?? 0)}
            onChange={(event) => onChange(Number(event.target.value) || 0)}
          />
        </label>
      );

    case "range":
      return (
        <label>
          <span>
            {spec.label} <b>{Number(value ?? 0)}</b>
          </span>
          <input
            type="number"
            value={Number(value ?? 0)}
            onChange={(event) => onChange(Number(event.target.value) || 0)}
          />
        </label>
      );

    case "boolean":
      return (
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span>{spec.label}</span>
        </label>
      );

    case "color":
      return (
        <ColorField
          label={spec.label}
          value={String(value ?? "")}
          allowNone
          onChange={onChange}
        />
      );

    case "select":
      return (
        <label>
          <span>{spec.label}</span>
          <select
            value={String(value ?? "")}
            onChange={(event) => onChange(event.target.value)}
          >
            {spec.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );

    case "align":
      return (
        <fieldset className="align-field">
          <legend>{spec.label}</legend>
          <div className="align-choices">
            {ALIGNMENTS.map((item) => (
              <button
                className={value === item.value ? "selected" : ""}
                key={item.value}
                type="button"
                aria-label={item.label}
                title={item.label}
                onClick={() => onChange(item.value)}
              >
                <item.Icon size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>
      );

    case "image":
      return <ImageField spec={spec} value={String(value ?? "")} onChange={onChange} />;

    case "itemlist":
      return (
        <ItemListField
          label={spec.label}
          help={spec.help}
          items={Array.isArray(value) ? (value as ListItem[]) : []}
          maxItems={spec.maxItems ?? 20}
          onChange={onChange}
        />
      );

    case "qalist":
      return (
        <QaListField
          spec={spec}
          items={Array.isArray(value) ? (value as QaItem[]) : []}
          onChange={onChange}
        />
      );
  }
}

function ImageField({ spec, value, onChange }: { spec: PropSpec; value: string; onChange: (value: PropValue) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  return (
    <div className="image-field">
      <span>{spec.label}</span>
      {value ? (
        <div className="image-field-preview">
          {/* 학생 기기에서 만든 data URL이라 미리보기는 그대로 씁니다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="고른 사진 미리보기" />
          <button
            type="button"
            aria-label="사진 빼기"
            onClick={() => onChange("")}
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          className="image-field-drop"
          type="button"
          onClick={() => input.current?.click()}
        >
          <ImageUp size={17} aria-hidden="true" />
          사진 고르기
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setError("");
          try {
            onChange(await compressPhoto(file));
          } catch (caught) {
            setError(
              caught instanceof Error ? caught.message : "사진을 넣지 못했어요.",
            );
          }
        }}
      />
      {error && <small className="property-error">{error}</small>}
    </div>
  );
}

function QaListField({
  spec,
  items,
  onChange,
}: {
  spec: PropSpec;
  items: QaItem[];
  onChange: (value: PropValue) => void;
}) {
  const limit = spec.maxItems ?? 12;

  const patch = (id: string, next: Partial<QaItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...next } : item)));

  return (
    <div className="qa-field">
      <span>{spec.label}</span>
      {items.map((item, index) => (
        <div className="qa-row" key={item.id}>
          <header>
            <b>질문 {index + 1}</b>
            <button
              type="button"
              aria-label={`${item.label} 삭제`}
              onClick={() => onChange(items.filter((one) => one.id !== item.id))}
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </header>
          <input
            aria-label="버튼에 보일 글"
            placeholder="버튼에 보일 글"
            value={item.label}
            maxLength={24}
            onChange={(event) => patch(item.id, { label: event.target.value })}
          />
          <textarea
            aria-label="이 질문에 보여 줄 답"
            placeholder="이 질문에 보여 줄 답"
            rows={3}
            value={item.response}
            maxLength={180}
            onChange={(event) => patch(item.id, { response: event.target.value })}
          />
          <select
            aria-label="버튼 아이콘"
            value={item.icon}
            onChange={(event) =>
              patch(item.id, { icon: event.target.value as ActionIcon })
            }
          >
            {ACTION_ICON_LABELS.map((icon) => (
              <option key={icon.value} value={icon.value}>
                {icon.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        className="secondary-button"
        type="button"
        disabled={items.length >= limit}
        onClick={() =>
          onChange([
            ...items,
            {
              id: `question-${Date.now()}`,
              label: `새 질문 ${items.length + 1}`,
              response: "이 질문을 눌렀을 때 보여 줄 답을 적어 주세요.",
              icon: "message" as ActionIcon,
            },
          ])
        }
      >
        <Plus size={15} aria-hidden="true" />
        질문과 답 추가
      </button>
      {items.length >= limit && (
        <small className="property-help">질문·답은 {limit}개까지 만들 수 있어요.</small>
      )}
    </div>
  );
}
