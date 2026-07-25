"use client";

import {
  ArrowDown,
  ArrowUp,
  Bot,
  Braces,
  GitBranch,
  MousePointerClick,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  ChatbotProject,
  SelectedTarget,
} from "../../lib/chatbot-studio";

type BlockWorkspaceProps = {
  project: ChatbotProject;
  selectedTarget: SelectedTarget;
  onSelect: (target: SelectedTarget) => void;
  onAdd: () => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onDelete: (id: string) => void;
};

export function BlockWorkspace({
  project,
  selectedTarget,
  onSelect,
  onAdd,
  onMove,
  onDelete,
}: BlockWorkspaceProps) {
  return (
    <div className="blocks-editor">
      <aside className="block-palette" aria-label="블록 종류">
        <div className="panel-title">
          <span>블록</span>
          <small>필요한 동작을 골라요</small>
        </div>
        <button className="block-chip event" type="button" onClick={onAdd}>
          <MousePointerClick size={16} aria-hidden="true" />
          버튼을 클릭했을 때
        </button>
        <button
          className="block-chip action"
          type="button"
          onClick={() => onSelect("greeting")}
        >
          <Bot size={16} aria-hidden="true" />
          챗봇이 말하기
        </button>
        <button
          className="block-chip condition"
          type="button"
          onClick={() => onSelect("input")}
        >
          <GitBranch size={16} aria-hidden="true" />
          질문에 맞는 답 찾기
        </button>
        <button
          className="block-chip value"
          type="button"
          onClick={() => onSelect("input")}
        >
          <Braces size={16} aria-hidden="true" />
          입력한 질문
        </button>
        <div className="block-tip">
          <strong>블록은 자동으로 연결돼요</strong>
          <span>
            오른쪽 속성에서 버튼 이름과 챗봇의 답만 바꾸면 완성됩니다.
          </span>
        </div>
      </aside>

      <section className="block-canvas">
        <header className="block-canvas-header">
          <div>
            <span className="canvas-kicker">SCREEN1 · LOGIC</span>
            <h2>질문과 답 연결하기</h2>
          </div>
          <span className="connected-count">
            {project.actions.length}개 연결됨
          </span>
        </header>

        <div className="block-stacks">
          {project.actions.map((action, index) => (
            <article
              className={`block-stack ${
                selectedTarget === action.id ? "selected" : ""
              }`}
              key={action.id}
              onClick={() => onSelect(action.id)}
            >
              <div className="event-block">
                <span className="block-number">{index + 1}</span>
                <MousePointerClick size={17} aria-hidden="true" />
                <span>
                  <b>{action.label}</b> 버튼을 클릭했을 때
                </span>
              </div>
              <div className="block-connector" aria-hidden="true" />
              <div className="action-block">
                <Bot size={17} aria-hidden="true" />
                <span>
                  챗봇이 <b>“{action.response}”</b> 라고 말하기
                </span>
              </div>
              <div className="block-order-actions">
                <button
                  type="button"
                  aria-label={`${action.label} 위로 이동`}
                  disabled={index === 0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onMove(action.id, -1);
                  }}
                >
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`${action.label} 아래로 이동`}
                  disabled={index === project.actions.length - 1}
                  onClick={(event) => {
                    event.stopPropagation();
                    onMove(action.id, 1);
                  }}
                >
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
                <button
                  className="delete-block"
                  type="button"
                  aria-label={`${action.label} 삭제`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(action.id);
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}

          <button className="add-block-stack" type="button" onClick={onAdd}>
            <Plus size={18} aria-hidden="true" />
            새 질문·답 블록 연결
          </button>
        </div>
      </section>
    </div>
  );
}
