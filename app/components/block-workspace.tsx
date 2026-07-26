"use client";

import {
  ArrowDown,
  ArrowUp,
  Bot,
  Braces,
  Camera,
  CheckCircle2,
  FileText,
  ListChecks,
  MonitorPlay,
  MousePointerClick,
  NotebookPen,
  Plus,
  Printer,
  Save,
  Trash2,
} from "lucide-react";
import type {
  SelectedTarget,
  WebAppProject,
} from "../../lib/chatbot-studio";

type BlockWorkspaceProps = {
  project: WebAppProject;
  selectedTarget: SelectedTarget;
  onSelect: (target: SelectedTarget) => void;
  onAddAction: () => void;
  onMoveAction: (id: string, direction: -1 | 1) => void;
  onDeleteAction: (id: string) => void;
};

export function BlockWorkspace({
  project,
  selectedTarget,
  onSelect,
  onAddAction,
  onMoveAction,
  onDeleteAction,
}: BlockWorkspaceProps) {
  const connectedCount =
    1 +
    Number(project.checklistEnabled) +
    Number(project.journalEnabled) +
    Number(project.campReportEnabled) * 2 +
    Number(project.buttonEnabled) +
    (project.chatbotEnabled ? project.actions.length : 0);

  return (
    <div className="blocks-editor">
      <aside className="block-palette" aria-label="블록 종류">
        <div className="panel-title">
          <span>블록</span>
          <small>웹앱의 움직임을 확인해요</small>
        </div>
        <button
          className="block-chip event"
          type="button"
          onClick={() => onSelect("header")}
        >
          <MonitorPlay size={16} aria-hidden="true" />
          화면을 열었을 때
        </button>
        <button
          className="block-chip condition"
          type="button"
          onClick={() => onSelect("checklist")}
        >
          <ListChecks size={16} aria-hidden="true" />
          활동을 체크했을 때
        </button>
        <button
          className="block-chip value"
          type="button"
          onClick={() => onSelect("journal")}
        >
          <Save size={16} aria-hidden="true" />
          기록을 저장했을 때
        </button>
        <button
          className="block-chip action"
          type="button"
          onClick={() => onSelect("camp-report")}
        >
          <FileText size={16} aria-hidden="true" />
          캠프 기록을 저장했을 때
        </button>
        <button
          className="block-chip action"
          type="button"
          onClick={() => onSelect("chatbot")}
        >
          <Bot size={16} aria-hidden="true" />
          내 챗봇에게 물었을 때
        </button>
        <div className="block-tip">
          <strong>기능을 넣으면 블록도 생겨요</strong>
          <span>
            디자이너에서 기능을 추가하고, 오른쪽 속성에서 글과 동작을
            바꿔 보세요.
          </span>
        </div>
      </aside>

      <section className="block-canvas">
        <header className="block-canvas-header">
          <div>
            <span className="canvas-kicker">SCREEN1 · WEB APP LOGIC</span>
            <h2>내 웹앱의 움직임</h2>
          </div>
          <span className="connected-count">{connectedCount}개 연결됨</span>
        </header>

        <div className="block-stacks">
          <article
            className={`block-stack feature-logic-stack ${
              selectedTarget === "header" ? "selected" : ""
            }`}
            onClick={() => onSelect("header")}
          >
            <div className="event-block">
              <span className="block-number">1</span>
              <MonitorPlay size={17} aria-hidden="true" />
              <span>
                <b>Screen1</b> 화면을 열었을 때
              </span>
            </div>
            <div className="block-connector" aria-hidden="true" />
            <div className="action-block">
              <Braces size={17} aria-hidden="true" />
              <span>
                앱 제목을 <b>“{project.appName}”</b>으로 보여 주기
              </span>
            </div>
          </article>

          {project.checklistEnabled && (
            <article
              className={`block-stack feature-logic-stack ${
                selectedTarget === "checklist" ? "selected" : ""
              }`}
              onClick={() => onSelect("checklist")}
            >
              <div className="event-block">
                <ListChecks size={17} aria-hidden="true" />
                <span>
                  <b>{project.checklistTitle}</b> 항목을 체크했을 때
                </span>
              </div>
              <div className="block-connector" aria-hidden="true" />
              <div className="action-block mint-block">
                <CheckCircle2 size={17} aria-hidden="true" />
                <span>선택한 활동을 완료로 표시하기</span>
              </div>
            </article>
          )}

          {project.journalEnabled && (
            <article
              className={`block-stack feature-logic-stack ${
                selectedTarget === "journal" ? "selected" : ""
              }`}
              onClick={() => onSelect("journal")}
            >
              <div className="event-block">
                <NotebookPen size={17} aria-hidden="true" />
                <span>
                  <b>{project.journalButtonLabel}</b> 버튼을 클릭했을 때
                </span>
              </div>
              <div className="block-connector" aria-hidden="true" />
              <div className="action-block pink-block">
                <Save size={17} aria-hidden="true" />
                <span>입력한 나의 기록을 이 기기에 저장하기</span>
              </div>
            </article>
          )}

          {project.campReportEnabled && (
            <>
              <article
                className={`block-stack feature-logic-stack ${
                  selectedTarget === "camp-report" ? "selected" : ""
                }`}
                onClick={() => onSelect("camp-report")}
              >
                <div className="event-block">
                  <Camera size={17} aria-hidden="true" />
                  <span>
                    차시별 <b>활동·사진·느낀 점</b>을 입력했을 때
                  </span>
                </div>
                <div className="block-connector" aria-hidden="true" />
                <div className="action-block blue-block">
                  <Save size={17} aria-hidden="true" />
                  <span>12차시 기록을 이 휴대폰에 자동 저장하기</span>
                </div>
              </article>
              <article
                className={`block-stack feature-logic-stack ${
                  selectedTarget === "camp-report" ? "selected" : ""
                }`}
                onClick={() => onSelect("camp-report")}
              >
                <div className="event-block">
                  <Printer size={17} aria-hidden="true" />
                  <span>
                    <b>보고서 인쇄</b>를 눌렀을 때
                  </span>
                </div>
                <div className="block-connector" aria-hidden="true" />
                <div className="action-block pink-block">
                  <FileText size={17} aria-hidden="true" />
                  <span>3일·12차시 활동 보고서 만들기</span>
                </div>
              </article>
            </>
          )}

          {project.buttonEnabled && (
            <article
              className={`block-stack feature-logic-stack ${
                selectedTarget === "button" ? "selected" : ""
              }`}
              onClick={() => onSelect("button")}
            >
              <div className="event-block">
                <MousePointerClick size={17} aria-hidden="true" />
                <span>
                  <b>{project.buttonLabel}</b> 버튼을 클릭했을 때
                </span>
              </div>
              <div className="block-connector" aria-hidden="true" />
              <div className="action-block blue-block">
                <Braces size={17} aria-hidden="true" />
                <span>
                  <b>“{project.buttonMessage}”</b> 보여 주기
                </span>
              </div>
            </article>
          )}

          {project.chatbotEnabled &&
            project.actions.map((action, index) => (
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
                    내 챗봇에서 <b>{action.label}</b>을 눌렀을 때
                  </span>
                </div>
                <div className="block-connector" aria-hidden="true" />
                <div className="action-block">
                  <Bot size={17} aria-hidden="true" />
                  <span>
                    내가 만든 답 <b>“{action.response}”</b> 보여 주기
                  </span>
                </div>
                <div className="block-order-actions">
                  <button
                    type="button"
                    aria-label={`${action.label} 위로 이동`}
                    disabled={index === 0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoveAction(action.id, -1);
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
                      onMoveAction(action.id, 1);
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
                      onDeleteAction(action.id);
                    }}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}

          {project.chatbotEnabled && (
            <button
              className="add-block-stack"
              type="button"
              onClick={onAddAction}
            >
              <Plus size={18} aria-hidden="true" />
              내 챗봇 질문·답 블록 추가
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
