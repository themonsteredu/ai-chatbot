"use client";

import NextImage from "next/image";
import { CheckCircle2, ImageOff } from "lucide-react";
import type { ComponentNode } from "../../../../lib/chatbot-studio";
import type { AppRuntime } from "../use-app-runtime";
import { partStyle } from "../style";

type PartProps = { node: ComponentNode; runtime: AppRuntime };

export function LabelPart({ node, runtime }: PartProps) {
  const value = runtime.text(node, "text");
  return (
    <p className="part-label" style={partStyle(node.props)}>
      {value || <span className="part-placeholder">글을 적어 보세요</span>}
    </p>
  );
}

export function ImagePart({ node, runtime }: PartProps) {
  const source = runtime.text(node, "src");
  const style = partStyle(node.props);

  if (!source) {
    return (
      <div className="part-image empty" style={style}>
        <ImageOff size={18} aria-hidden="true" />
        <span>속성에서 사진을 넣어 보세요</span>
      </div>
    );
  }

  return (
    <div
      className={`part-image ${runtime.bool(node, "rounded") ? "rounded" : ""}`}
      style={style}
      onClick={() => runtime.fire(node.id, "click")}
    >
      {/* 학생 기기에서 만든 data URL이라 next/image 최적화 대상이 아닙니다. */}
      <NextImage
        src={source}
        alt={runtime.text(node, "alt")}
        width={720}
        height={540}
        unoptimized
      />
    </div>
  );
}

export function ButtonPart({ node, runtime }: PartProps) {
  const style = runtime.text(node, "style") || "solid";
  return (
    // 색은 눌리는 얼굴이 직접 칠합니다. 겉칸을 칠하면 버튼 둘레에 색 테두리만
    // 생기고 정작 버튼은 그대로였습니다.
    <div className="part-button" style={partStyle(node.props, { innerFill: true })}>
      <button
        className={`part-button-face ${style}`}
        type="button"
        disabled={runtime.interactive && !runtime.bool(node, "enabled")}
        onClick={(event) => {
          event.stopPropagation();
          runtime.fire(node.id, "click");
        }}
      >
        <CheckCircle2 size={15} aria-hidden="true" />
        {runtime.text(node, "label")}
      </button>
    </div>
  );
}

export function DividerPart({ node }: PartProps) {
  return <hr className="part-divider" style={partStyle(node.props)} />;
}

export function ListPart({ node, runtime }: PartProps) {
  const items = runtime.items(node, "items");
  const title = runtime.text(node, "title");
  const ordered = runtime.bool(node, "ordered");
  const Tag = ordered ? "ol" : "ul";

  return (
    <section className="part-list" style={partStyle(node.props)}>
      {title && <h4>{title}</h4>}
      <Tag>
        {items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </Tag>
    </section>
  );
}
