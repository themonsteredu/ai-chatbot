"use client";

import {
  ArrowDown,
  ArrowUp,
  Braces,
  MonitorPlay,
  Plus,
  Sparkles,
  Timer,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type {
  Action,
  BlockProgram,
  ComponentNode,
  EventBlock,
  EventId,
  Expr,
  Screen,
  SoundName,
  WebAppProject,
} from "../../../lib/chatbot-studio";
import { SCREEN_TARGET } from "../../../lib/chatbot-studio";

/** 소리 내기 블록이 고를 수 있는 소리입니다. */
const SOUNDS: SoundName[] = ["딩동", "짝짝", "삑", "북"];
import { REGISTRY } from "../../../lib/components/registry";
import { ACTION_CHOICES } from "../../../lib/blocks/describe";
import { walk } from "../../../lib/project/tree";
import { PartIcon } from "../runtime/part-icon";
import { ValueSocket } from "./value-socket";

let serial = 0;
const freshId = (prefix: string) => `${prefix}${(serial += 1)}-${Date.now() % 100000}`;

type BlockPaletteProps = {
  project: WebAppProject;
  advanced: boolean;
  onAdvancedChange: (advanced: boolean) => void;
  onChange: (blocks: BlockProgram) => void;
};

/** 이벤트를 고르는 곳입니다. 편집 판(왼쪽)에 놓입니다. */
export function BlockPalette({
  project,
  advanced,
  onAdvancedChange,
  onChange,
}: BlockPaletteProps) {
  const nodes: ComponentNode[] = project.screens.flatMap((screen) =>
    [...walk(screen.children)].map((entry) => entry.node),
  );
  const blocks = project.blocks;

  /** 이벤트를 붙일 수 있는 대상만 모읍니다. */
  const triggerable = nodes.filter(
    (node) => REGISTRY[node.type].events.length > 0,
  );

  const addEvent = (componentId: string, event: EventId) =>
    onChange({
      ...blocks,
      events: [
        ...blocks.events,
        { id: freshId("e"), componentId, event, body: [] },
      ],
    });

  return (
    <>
      <div className="panel-title">
        <span>블록</span>
        <small>‘언제’를 고르면 그 아래에 ‘무엇을 할지’를 붙여요</small>
      </div>

      <div className="block-chip-list">
        <button
          className="block-chip event"
          type="button"
          onClick={() => addEvent(SCREEN_TARGET, "open")}
        >
          <MonitorPlay size={16} aria-hidden="true" />
          화면을 열었을 때
        </button>

        <button
          className="block-chip event"
          type="button"
          onClick={() => addEvent(SCREEN_TARGET, "tick")}
        >
          <Timer size={16} aria-hidden="true" />
          몇 초마다 되풀이
        </button>

        {triggerable.map((node) =>
          REGISTRY[node.type].events.map((event) => (
            <button
              className="block-chip action"
              key={`${node.id}-${event.id}`}
              type="button"
              onClick={() => addEvent(node.id, event.id)}
            >
              <PartIcon type={node.type} size={16} />
              {node.name} {event.label}
            </button>
          )),
        )}
      </div>

      {triggerable.length === 0 && (
        <div className="block-tip">
          <strong>먼저 부품을 놓아 보세요</strong>
          <span>
            버튼이나 입력창을 디자이너에 놓으면 여기에 블록이 생깁니다.
          </span>
        </div>
      )}

      <VariablePanel
        blocks={blocks}
        advanced={advanced}
        nodes={nodes}
        onChange={onChange}
      />

      <label className="block-advanced-toggle">
        <input
          type="checkbox"
          checked={advanced}
          onChange={(event) => onAdvancedChange(event.target.checked)}
        />
        <span>더 보기 (변수·조건·반복)</span>
      </label>
    </>
  );
}

type BlockCanvasProps = {
  project: WebAppProject;
  advanced: boolean;
  onChange: (blocks: BlockProgram) => void;
  onSelectComponent: (id: string) => void;
};

/** 블록을 조립하는 판입니다. 결과 자리(오른쪽)에 놓입니다. */
export function BlockCanvas({
  project,
  advanced,
  onChange,
  onSelectComponent,
}: BlockCanvasProps) {
  const nodes: ComponentNode[] = project.screens.flatMap((screen) =>
    [...walk(screen.children)].map((entry) => entry.node),
  );
  const blocks = project.blocks;
  const variables = blocks.variables.map((variable) => variable.name);

  const replaceEvent = (id: string, next: EventBlock) =>
    onChange({
      ...blocks,
      events: blocks.events.map((event) => (event.id === id ? next : event)),
    });

  const removeEvent = (id: string) =>
    onChange({
      ...blocks,
      events: blocks.events.filter((event) => event.id !== id),
    });

  return (
    <section className="block-canvas">
      <header className="block-canvas-header">
        <div>
          <span className="canvas-kicker">
            {project.appName.toUpperCase()} · WEB APP LOGIC
          </span>
          <h2>내 웹앱의 움직임</h2>
        </div>
        <span className="connected-count">{blocks.events.length}개 블록</span>
      </header>

      <div className="block-stacks">
        {blocks.events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            nodes={nodes}
            screens={project.screens}
            variables={variables}
            advanced={advanced}
            onSelectComponent={onSelectComponent}
            onChange={(next) => replaceEvent(event.id, next)}
            onRemove={() => removeEvent(event.id)}
          />
        ))}

        {blocks.events.length === 0 && (
          <div className="block-empty">
            <Sparkles size={20} aria-hidden="true" />
            <strong>아직 블록이 없어요</strong>
            <span>
              왼쪽에서 ‘언제’를 하나 골라 보세요. 고르면 그 아래에 무엇을 할지
              붙일 수 있어요.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

type EventCardProps = {
  event: EventBlock;
  nodes: ComponentNode[];
  screens: Screen[];
  variables: string[];
  advanced: boolean;
  onSelectComponent: (id: string) => void;
  onChange: (event: EventBlock) => void;
  onRemove: () => void;
};

function EventCard({
  event,
  nodes,
  screens,
  variables,
  advanced,
  onSelectComponent,
  onChange,
  onRemove,
}: EventCardProps) {
  const node = nodes.find((one) => one.id === event.componentId);
  const label =
    event.componentId === SCREEN_TARGET
      ? event.event === "tick"
        ? "이 있는 동안"
        : "열렸을 때"
      : (node &&
          REGISTRY[node.type].events.find((spec) => spec.id === event.event)
            ?.label) ||
        "일어났을 때";

  return (
    <article className="block-stack feature-logic-stack">
      <div className="event-block">
        {node ? (
          <PartIcon type={node.type} size={17} />
        ) : (
          <MonitorPlay size={17} aria-hidden="true" />
        )}
        <span>
          <b
            role={node ? "button" : undefined}
            tabIndex={node ? 0 : undefined}
            onClick={() => node && onSelectComponent(node.id)}
            onKeyDown={(keyEvent) => {
              if (keyEvent.key !== "Enter" || !node) return;
              onSelectComponent(node.id);
            }}
          >
            {event.componentId === SCREEN_TARGET ? "화면" : (node?.name ?? "없어진 부품")}
          </b>{" "}
          {label}
          {event.event === "tick" && (
            <>
              {" "}
              <input
                className="tick-seconds"
                type="number"
                min={1}
                max={600}
                aria-label="몇 초마다"
                value={event.every ?? 1}
                onChange={(input) =>
                  onChange({
                    ...event,
                    every: Math.max(
                      1,
                      Math.min(Number(input.target.value) || 1, 600),
                    ),
                  })
                }
              />{" "}
              초마다
            </>
          )}
        </span>
        <button
          className="delete-block"
          type="button"
          aria-label="이 블록 삭제"
          onClick={onRemove}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>

      <ActionList
        actions={event.body}
        screens={screens}
        nodes={nodes}
        variables={variables}
        advanced={advanced}
        depth={0}
        onChange={(body) => onChange({ ...event, body })}
      />
    </article>
  );
}

type ActionListProps = {
  actions: Action[];
  nodes: ComponentNode[];
  /** 화면 열기 블록이 고를 수 있는 화면입니다. */
  screens: Screen[];
  variables: string[];
  advanced: boolean;
  depth: number;
  onChange: (actions: Action[]) => void;
};

function ActionList({
  actions,
  nodes,
  screens,
  variables,
  advanced,
  depth,
  onChange,
}: ActionListProps) {
  const writable = nodes.filter((node) =>
    REGISTRY[node.type].props.some((prop) => prop.blockWritable),
  );
  /** 목록을 가진 부품입니다. 목록 블록은 여기에만 붙습니다. */
  const listParts = nodes.filter((node) =>
    REGISTRY[node.type].props.some((prop) => prop.kind === "itemlist"),
  );

  const blankAction = (kind: Action["kind"]): Action => {
    const id = freshId("a");
    switch (kind) {
      case "set-prop": {
        const target = writable[0];
        const prop = target
          ? REGISTRY[target.type].props.find((one) => one.blockWritable)
          : undefined;
        return {
          id,
          kind,
          target: target?.id ?? "",
          prop: prop?.key ?? "",
          value: { k: "text", v: "" },
        };
      }
      case "show-message":
        return { id, kind, value: { k: "text", v: "잘했어요!" } };
      case "play-sound":
        return { id, kind, sound: "딩동" };
      case "open-screen":
        return { id, kind, screen: screens[0]?.id ?? "" };
      case "list-add":
      case "list-clear": {
        const first = listParts[0];
        const prop = first
          ? REGISTRY[first.type].props.find((one) => one.kind === "itemlist")
          : undefined;
        const where = { target: first?.id ?? "", prop: prop?.key ?? "items" };
        return kind === "list-clear"
          ? { id, kind, ...where }
          : { id, kind, ...where, value: { k: "text", v: "" } };
      }
      case "set-var":
        return { id, kind, name: variables[0] ?? "", value: { k: "num", v: 0 } };
      case "if":
        return {
          id,
          kind,
          test: { k: "bool", v: true },
          then: [],
        };
      case "repeat":
        return { id, kind, times: { k: "num", v: 3 }, body: [] };
      case "open-screen":
        return { id, kind, screen: "s1" };
    }
  };

  const replace = (index: number, next: Action) =>
    onChange(actions.map((action, at) => (at === index ? next : action)));

  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= actions.length) return;
    const next = [...actions];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const choices = ACTION_CHOICES.filter(
    (choice) => advanced || !choice.advanced,
  );

  return (
    <div className={`action-list depth-${depth}`}>
      {actions.map((action, index) => (
        <div className="block-connector-wrap" key={action.id}>
          <div className="block-connector" aria-hidden="true" />
          <ActionRow
            action={action}
            nodes={nodes}
            screens={screens}
            writable={writable}
            variables={variables}
            advanced={advanced}
            depth={depth}
            first={index === 0}
            last={index === actions.length - 1}
            onChange={(next) => replace(index, next)}
            onMove={(by) => move(index, by)}
            onRemove={() =>
              onChange(actions.filter((unused, at) => at !== index))
            }
          />
        </div>
      ))}

      <div className="add-action-row">
        <select
          aria-label="동작 추가"
          value=""
          onChange={(event) => {
            if (!event.target.value) return;
            onChange([...actions, blankAction(event.target.value as Action["kind"])]);
          }}
        >
          <option value="">＋ 동작 추가</option>
          {choices.map((choice) => (
            <option key={choice.kind} value={choice.kind}>
              {choice.label} — {choice.hint}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

type ActionRowProps = {
  action: Action;
  nodes: ComponentNode[];
  screens: Screen[];
  writable: ComponentNode[];
  variables: string[];
  advanced: boolean;
  depth: number;
  first: boolean;
  last: boolean;
  onChange: (action: Action) => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
};

function ActionRow({
  action,
  nodes,
  screens,
  writable,
  variables,
  advanced,
  depth,
  first,
  last,
  onChange,
  onMove,
  onRemove,
}: ActionRowProps) {
  const socket = (value: Expr, replace: (next: Expr) => void) => (
    <ValueSocket
      value={value}
      nodes={nodes}
      variables={variables}
      advanced={advanced}
      onChange={replace}
    />
  );

  const target = writable.find((node) => node.id === (action as { target?: string }).target);
  const writableProps = target
    ? REGISTRY[target.type].props.filter((prop) => prop.blockWritable)
    : [];
  /** 목록을 가진 부품입니다. 목록 블록은 여기에만 붙습니다. */
  const listParts = nodes.filter((node) =>
    REGISTRY[node.type].props.some((prop) => prop.kind === "itemlist"),
  );

  return (
    <div className={`action-block tone-${action.kind}`}>
      <Braces size={15} aria-hidden="true" />
      <div className="action-body">
        {action.kind === "set-prop" && (
          <>
            <select
              aria-label="바꿀 부품"
              value={action.target}
              onChange={(event) => {
                const next = writable.find((node) => node.id === event.target.value);
                const prop = next
                  ? REGISTRY[next.type].props.find((one) => one.blockWritable)
                  : undefined;
                onChange({ ...action, target: event.target.value, prop: prop?.key ?? "" });
              }}
            >
              <option value="">부품을 골라요</option>
              {writable.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
            <span>의</span>
            <select
              aria-label="바꿀 속성"
              value={action.prop}
              disabled={writableProps.length === 0}
              onChange={(event) => onChange({ ...action, prop: event.target.value })}
            >
              {writableProps.map((prop) => (
                <option key={prop.key} value={prop.key}>
                  {prop.label}
                </option>
              ))}
            </select>
            <span>을(를)</span>
            {socket(action.value, (value) => onChange({ ...action, value }))}
            <span>(으)로 바꾸기</span>
          </>
        )}

        {(action.kind === "list-add" || action.kind === "list-clear") && (
          <>
            <select
              aria-label="목록 고르기"
              value={action.target}
              onChange={(input) => {
                const next = nodes.find((one) => one.id === input.target.value);
                const prop = next
                  ? REGISTRY[next.type].props.find(
                      (one) => one.kind === "itemlist",
                    )
                  : undefined;
                onChange({
                  ...action,
                  target: input.target.value,
                  prop: prop?.key ?? action.prop,
                });
              }}
            >
              <option value="">목록을 골라요</option>
              {listParts.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
            {action.kind === "list-add" ? (
              <>
                <span>에</span>
                {socket(action.value, (value) => onChange({ ...action, value }))}
                <span>한 줄 더하기</span>
              </>
            ) : (
              <span>비우기</span>
            )}
          </>
        )}

        {action.kind === "open-screen" && (
          <>
            <select
              aria-label="열 화면"
              value={action.screen}
              onChange={(input) =>
                onChange({ ...action, screen: input.target.value })
              }
            >
              <option value="">화면을 골라요</option>
              {screens.map((one) => (
                <option key={one.id} value={one.id}>
                  {one.name}
                </option>
              ))}
            </select>
            <span>열기</span>
          </>
        )}

        {action.kind === "play-sound" && (
          <>
            <span>소리</span>
            <select
              aria-label="낼 소리"
              value={action.sound}
              onChange={(event) =>
                onChange({ ...action, sound: event.target.value as SoundName })
              }
            >
              {SOUNDS.map((sound) => (
                <option key={sound} value={sound}>
                  {sound}
                </option>
              ))}
            </select>
            <span>내기</span>
          </>
        )}

        {action.kind === "show-message" && (
          <>
            {socket(action.value, (value) => onChange({ ...action, value }))}
            <span>보여 주기</span>
          </>
        )}

        {action.kind === "set-var" && (
          <>
            <span>변수</span>
            <select
              aria-label="변수 고르기"
              value={action.name}
              onChange={(event) => onChange({ ...action, name: event.target.value })}
            >
              <option value="">변수를 골라요</option>
              {variables.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <span>을(를)</span>
            {socket(action.value, (value) => onChange({ ...action, value }))}
            <span>(으)로 정하기</span>
          </>
        )}

        {action.kind === "if" && (
          <>
            <span>만약</span>
            {socket(action.test, (test) => onChange({ ...action, test }))}
            <span>이라면</span>
            <ActionList
              actions={action.then}
              nodes={nodes}
              screens={screens}
              variables={variables}
              advanced={advanced}
              depth={depth + 1}
              onChange={(then) => onChange({ ...action, then })}
            />
            <span className="action-else">아니면</span>
            <ActionList
              actions={action.otherwise ?? []}
              nodes={nodes}
              screens={screens}
              variables={variables}
              advanced={advanced}
              depth={depth + 1}
              onChange={(otherwise) => onChange({ ...action, otherwise })}
            />
          </>
        )}

        {action.kind === "repeat" && (
          <>
            {socket(action.times, (times) => onChange({ ...action, times }))}
            <span>번 반복하기</span>
            <ActionList
              actions={action.body}
              nodes={nodes}
              screens={screens}
              variables={variables}
              advanced={advanced}
              depth={depth + 1}
              onChange={(body) => onChange({ ...action, body })}
            />
          </>
        )}
      </div>

      <div className="block-order-actions">
        <button
          type="button"
          aria-label="위로 이동"
          disabled={first}
          onClick={() => onMove(-1)}
        >
          <ArrowUp size={13} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="아래로 이동"
          disabled={last}
          onClick={() => onMove(1)}
        >
          <ArrowDown size={13} aria-hidden="true" />
        </button>
        <button
          className="delete-block"
          type="button"
          aria-label="이 동작 삭제"
          onClick={onRemove}
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function VariablePanel({
  blocks,
  advanced,
  nodes,
  onChange,
}: {
  blocks: BlockProgram;
  advanced: boolean;
  nodes: ComponentNode[];
  onChange: (blocks: BlockProgram) => void;
}) {
  const [draft, setDraft] = useState("");
  if (!advanced) return null;

  const add = () => {
    const name = draft.trim().slice(0, 24);
    if (!name || blocks.variables.some((one) => one.name === name)) return;
    onChange({
      ...blocks,
      variables: [...blocks.variables, { name, initial: { k: "num", v: 0 } }],
    });
    setDraft("");
  };

  return (
    <div className="variable-panel">
      <div className="panel-title">
        <span>변수</span>
        <small>기억해 둘 값</small>
      </div>
      {blocks.variables.map((variable) => (
        <div className="variable-row" key={variable.name}>
          <b>{variable.name}</b>
          <ValueSocket
            value={variable.initial}
            nodes={nodes}
            variables={[]}
            advanced={false}
            onChange={(initial) =>
              onChange({
                ...blocks,
                variables: blocks.variables.map((one) =>
                  one.name === variable.name ? { ...one, initial } : one,
                ),
              })
            }
          />
          <label
            className="variable-remember"
            title="켜면 웹앱을 닫았다 열어도 값이 남아요"
          >
            <input
              type="checkbox"
              checked={variable.remember === true}
              onChange={(input) =>
                onChange({
                  ...blocks,
                  variables: blocks.variables.map((one) =>
                    one.name === variable.name
                      ? { ...one, remember: input.target.checked }
                      : one,
                  ),
                })
              }
            />
            기억
          </label>
          <button
            type="button"
            aria-label={`${variable.name} 삭제`}
            onClick={() =>
              onChange({
                ...blocks,
                variables: blocks.variables.filter(
                  (one) => one.name !== variable.name,
                ),
              })
            }
          >
            <Trash2 size={13} aria-hidden="true" />
          </button>
        </div>
      ))}
      <form
        className="variable-add"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <input
          aria-label="새 변수 이름"
          placeholder="예: 점수"
          value={draft}
          maxLength={24}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" aria-label="변수 추가" disabled={!draft.trim()}>
          <Plus size={13} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
