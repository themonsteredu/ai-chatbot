"use client";

import type { ComponentNode } from "../../../../lib/chatbot-studio";
import type { AppRuntime } from "../use-app-runtime";
import { partStyle } from "../style";

type PartProps = { node: ComponentNode; runtime: AppRuntime };

export function TextboxPart({ node, runtime }: PartProps) {
  const value = runtime.text(node, "value");
  const change = (next: string) => {
    runtime.setProp(node.id, "value", next);
    runtime.fire(node.id, "change");
  };

  return (
    <label className="part-textbox" style={partStyle(node.props)}>
      <span>{runtime.text(node, "label")}</span>
      {runtime.bool(node, "multiline") ? (
        <textarea
          rows={4}
          placeholder={runtime.text(node, "placeholder")}
          value={runtime.interactive ? value : ""}
          readOnly={!runtime.interactive}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => change(event.target.value)}
        />
      ) : (
        <input
          placeholder={runtime.text(node, "placeholder")}
          value={runtime.interactive ? value : ""}
          readOnly={!runtime.interactive}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => change(event.target.value)}
        />
      )}
    </label>
  );
}

export function CheckboxPart({ node, runtime }: PartProps) {
  return (
    <label className="part-checkbox" style={partStyle(node.props)}>
      <input
        type="checkbox"
        checked={runtime.bool(node, "checked")}
        disabled={!runtime.interactive}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          runtime.setProp(node.id, "checked", event.target.checked);
          runtime.fire(node.id, "change");
        }}
      />
      <span>{runtime.text(node, "label")}</span>
    </label>
  );
}

export function SwitchPart({ node, runtime }: PartProps) {
  const on = runtime.bool(node, "on");
  return (
    <label className={`part-switch ${on ? "on" : ""}`} style={partStyle(node.props)}>
      <span>{runtime.text(node, "label")}</span>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        disabled={!runtime.interactive}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          runtime.setProp(node.id, "on", event.target.checked);
          runtime.fire(node.id, "change");
        }}
      />
      <i aria-hidden="true" />
    </label>
  );
}

export function SliderPart({ node, runtime }: PartProps) {
  const min = runtime.num(node, "min");
  const max = runtime.num(node, "max");
  const value = runtime.num(node, "value");

  return (
    <label className="part-slider" style={partStyle(node.props)}>
      <span>
        {runtime.text(node, "label")}
        <b>{value}</b>
      </span>
      <input
        type="range"
        // 학생이 최솟값을 최댓값보다 크게 적어도 화면이 깨지지 않게 합니다.
        min={Math.min(min, max)}
        max={Math.max(min, max)}
        value={Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max))}
        disabled={!runtime.interactive}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          runtime.setProp(node.id, "value", Number(event.target.value));
          runtime.fire(node.id, "change");
        }}
      />
    </label>
  );
}
