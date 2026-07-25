"use client";

import {
  Backpack,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Heart,
  Home,
  Info,
  MessageCircle,
  NotebookPen,
  Rocket,
  Send,
  Sparkles,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  useRef,
  useState,
} from "react";
import type {
  ActionIcon,
  SelectedTarget,
  WebAppProject,
} from "../../lib/chatbot-studio";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

type PhonePreviewProps = {
  project: WebAppProject;
  interactive?: boolean;
  selectedTarget?: SelectedTarget;
  onSelect?: (target: SelectedTarget) => void;
};

const iconMap: Record<ActionIcon, LucideIcon> = {
  book: BookOpen,
  backpack: Backpack,
  home: Home,
  sparkles: Sparkles,
  heart: Heart,
  message: MessageCircle,
};

const tokenize = (value: string) =>
  value
    .replace(/[?!.,]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

export function PhonePreview({
  project,
  interactive = false,
  selectedTarget,
  onSelect,
}: PhonePreviewProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [journalText, setJournalText] = useState("");
  const [journalSaved, setJournalSaved] = useState(false);
  const [buttonResult, setButtonResult] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messageSequence = useRef(0);

  const select = (target: SelectedTarget) => {
    if (!interactive) onSelect?.(target);
  };

  const selectOnKeyboard = (
    event: KeyboardEvent<HTMLElement>,
    target: SelectedTarget,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(target);
    }
  };

  const toggleChecklistItem = (id: string) => {
    if (!interactive) return;
    setCheckedItems((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id],
    );
  };

  const saveJournal = () => {
    if (!interactive || !journalText.trim()) return;
    window.localStorage.setItem(
      `my-webapp-record-${project.title}`,
      journalText.trim(),
    );
    setJournalSaved(true);
  };

  const ask = (question: string, answer: string) => {
    if (!interactive) return;
    messageSequence.current += 1;
    const sequence = messageSequence.current;
    setMessages((current) => [
      ...current.slice(-4),
      { id: `user-${sequence}`, role: "user", text: question },
      { id: `bot-${sequence}`, role: "bot", text: answer },
    ]);
  };

  const submitQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;

    const questionTokens = tokenize(question);
    const matched = project.actions.find((action) => {
      const labelTokens = tokenize(action.label);
      return labelTokens.some((label) =>
        questionTokens.some(
          (token) => label.includes(token) || token.includes(label),
        ),
      );
    });

    ask(question, matched?.response ?? project.fallbackResponse);
    setInput("");
  };

  const visibleMessages: ChatMessage[] = [
    { id: "welcome", role: "bot", text: project.greeting },
    ...messages,
  ];

  const selectableProps = (target: SelectedTarget) =>
    interactive
      ? {}
      : {
          role: "button" as const,
          tabIndex: 0,
          onClick: (event: MouseEvent<HTMLElement>) => {
            event.stopPropagation();
            select(target);
          },
          onKeyDown: (event: KeyboardEvent<HTMLElement>) =>
            selectOnKeyboard(event, target),
        };

  return (
    <div
      className={`phone ${interactive ? "phone-interactive" : ""}`}
      style={
        {
          "--phone-accent": project.accent,
          "--phone-bg": project.screenBackground,
        } as React.CSSProperties
      }
    >
      <div className="phone-hardware">
        <span>9:41</span>
        <span className="phone-island" aria-hidden="true" />
        <span className="phone-status-icons">
          <Wifi size={11} aria-hidden="true" />
          <span className="battery" aria-hidden="true" />
        </span>
      </div>

      <section
        className={`phone-screen webapp-screen ${
          selectedTarget === "screen" ? "component-selected" : ""
        }`}
        onClick={() => select("screen")}
      >
        <header
          className={`app-hero ${
            selectedTarget === "header" ? "component-selected" : ""
          }`}
          {...selectableProps("header")}
        >
          <span className="app-hero-icon">
            <Rocket size={21} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <span>
            <small>MY WEB APP</small>
            <strong>{project.appName}</strong>
            <em>{project.subtitle}</em>
          </span>
        </header>

        <div className="webapp-scroll">
          {project.noticeEnabled && (
            <section
              className={`webapp-card notice-card ${
                selectedTarget === "notice" ? "component-selected" : ""
              }`}
              {...selectableProps("notice")}
            >
              <span className="feature-card-icon yellow">
                <Info size={15} aria-hidden="true" />
              </span>
              <div>
                <span className="card-eyebrow">NOTICE</span>
                <h3>{project.noticeTitle}</h3>
                <p>{project.noticeBody}</p>
              </div>
            </section>
          )}

          {project.checklistEnabled && (
            <section
              className={`webapp-card checklist-card ${
                selectedTarget === "checklist" ? "component-selected" : ""
              }`}
              {...selectableProps("checklist")}
            >
              <header>
                <span className="feature-card-icon mint">
                  <ClipboardCheck size={15} aria-hidden="true" />
                </span>
                <span>
                  <small>CHECK LIST</small>
                  <strong>{project.checklistTitle}</strong>
                </span>
                <b>
                  {checkedItems.length}/{project.checklistItems.length}
                </b>
              </header>
              <div className="phone-checklist">
                {project.checklistItems.map((item) => (
                  <label key={item.id}>
                    <input
                      type="checkbox"
                      checked={checkedItems.includes(item.id)}
                      disabled={!interactive}
                      onChange={() => toggleChecklistItem(item.id)}
                    />
                    <span>{item.text}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {project.journalEnabled && (
            <section
              className={`webapp-card journal-card ${
                selectedTarget === "journal" ? "component-selected" : ""
              }`}
              {...selectableProps("journal")}
            >
              <header>
                <span className="feature-card-icon blue">
                  <NotebookPen size={15} aria-hidden="true" />
                </span>
                <span>
                  <small>MY RECORD</small>
                  <strong>{project.journalTitle}</strong>
                </span>
              </header>
              <textarea
                aria-label={project.journalTitle}
                placeholder={project.journalPrompt}
                value={interactive ? journalText : ""}
                readOnly={!interactive}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => {
                  setJournalText(event.target.value);
                  setJournalSaved(false);
                }}
              />
              <button
                className="journal-save-button"
                type="button"
                disabled={interactive && !journalText.trim()}
                onClick={(event) => {
                  event.stopPropagation();
                  if (interactive) saveJournal();
                  else select("journal");
                }}
              >
                {journalSaved ? (
                  <>
                    <Check size={13} aria-hidden="true" />
                    저장했어요
                  </>
                ) : (
                  project.journalButtonLabel
                )}
              </button>
            </section>
          )}

          {project.buttonEnabled && (
            <section
              className={`action-feature ${
                selectedTarget === "button" ? "component-selected" : ""
              }`}
              {...selectableProps("button")}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (interactive) setButtonResult(project.buttonMessage);
                  else select("button");
                }}
              >
                <CheckCircle2 size={15} aria-hidden="true" />
                {project.buttonLabel}
              </button>
              {buttonResult && (
                <p role="status">
                  <Check size={12} aria-hidden="true" />
                  {buttonResult}
                </p>
              )}
            </section>
          )}

          {project.chatbotEnabled && (
            <section
              className={`webapp-card chatbot-feature ${
                selectedTarget === "chatbot" ? "component-selected" : ""
              }`}
              {...selectableProps("chatbot")}
            >
              <div className="chatbot-feature-heading">
                <span className="bot-avatar compact">
                  <Bot size={18} strokeWidth={2.4} aria-hidden="true" />
                </span>
                <span>
                  <small>AI CHATBOT</small>
                  <strong>{project.botName}</strong>
                  <em>{project.greeting}</em>
                </span>
              </div>
              <div className="chatbot-action-preview">
                {project.actions.slice(0, 3).map((action) => {
                  const Icon = iconMap[action.icon];
                  return (
                    <button
                      className={
                        selectedTarget === action.id
                          ? "component-selected"
                          : ""
                      }
                      key={action.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (interactive) setChatOpen(true);
                        else select(action.id);
                      }}
                    >
                      <Icon size={11} aria-hidden="true" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
              <button
                className="open-chatbot-button"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (interactive) setChatOpen(true);
                  else select("chatbot");
                }}
              >
                <MessageCircle size={13} aria-hidden="true" />
                AI 챗봇 열기
              </button>
            </section>
          )}

          {!project.noticeEnabled &&
            !project.checklistEnabled &&
            !project.journalEnabled &&
            !project.buttonEnabled &&
            !project.chatbotEnabled && (
              <div className="empty-phone-state">
                <PlusBadge />
                <strong>첫 기능을 추가해 보세요</strong>
                <span>왼쪽 팔레트에서 기능을 골라요.</span>
              </div>
            )}
        </div>

        {interactive && chatOpen && (
          <section className="phone-chatbot-sheet" aria-label="AI 챗봇">
            <header>
              <button
                type="button"
                aria-label="웹앱으로 돌아가기"
                onClick={() => setChatOpen(false)}
              >
                <ChevronLeft size={17} aria-hidden="true" />
              </button>
              <span className="bot-avatar compact">
                <Bot size={17} aria-hidden="true" />
              </span>
              <span>
                <strong>{project.botName}</strong>
                <small>
                  <i aria-hidden="true" />
                  지금 질문할 수 있어요
                </small>
              </span>
            </header>

            <div className="chat-scroll" aria-live="polite">
              {visibleMessages.map((message) => (
                <div
                  className={`phone-message ${message.role}`}
                  key={message.id}
                >
                  {message.role === "bot" && (
                    <span className="mini-avatar">
                      <Bot size={13} aria-hidden="true" />
                    </span>
                  )}
                  <span>{message.text}</span>
                </div>
              ))}
            </div>

            <div className="quick-question-grid">
              {project.actions.map((action) => {
                const Icon = iconMap[action.icon];
                return (
                  <button
                    className="quick-question"
                    key={action.id}
                    type="button"
                    onClick={() => ask(action.label, action.response)}
                  >
                    <span>
                      <Icon size={13} aria-hidden="true" />
                    </span>
                    {action.label}
                  </button>
                );
              })}
            </div>

            {project.inputEnabled && (
              <form className="phone-input" onSubmit={submitQuestion}>
                <input
                  aria-label="AI 챗봇에게 질문하기"
                  placeholder={project.inputPlaceholder}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                />
                <button type="submit" aria-label="질문 보내기">
                  <Send size={14} aria-hidden="true" />
                </button>
              </form>
            )}
          </section>
        )}
      </section>
      <span className="phone-home-bar" aria-hidden="true" />
    </div>
  );
}

function PlusBadge() {
  return (
    <span className="empty-plus" aria-hidden="true">
      +
    </span>
  );
}
