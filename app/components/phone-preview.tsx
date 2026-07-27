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
  Plus,
  Rocket,
  Send,
  Sparkles,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  FormEvent,
  Fragment,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  ActionIcon,
  ChecklistItem,
  FeatureKind,
  SelectedTarget,
  WebAppProject,
} from "../../lib/chatbot-studio";
import { CampReport } from "./camp-report";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

type PhonePreviewProps = {
  project: WebAppProject;
  interactive?: boolean;
  standalone?: boolean;
  selectedTarget?: SelectedTarget;
  onSelect?: (target: SelectedTarget) => void;
  /** 있으면 편집 화면에서 기능 카드를 끌어 순서를 바꿀 수 있습니다. */
  onReorder?: (moving: FeatureKind, target: FeatureKind) => void;
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
    .toLocaleLowerCase()
    .replace(/[?!.,]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

export function PhonePreview({
  project,
  interactive = false,
  standalone = false,
  selectedTarget,
  onSelect,
  onReorder,
}: PhonePreviewProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  // 편집 화면에서 카드를 끌어 옮길 때의 표시 상태입니다.
  const [dragOverKind, setDragOverKind] = useState<FeatureKind | null>(null);
  // 이 웹앱을 쓰는 사람이 직접 적어 넣은 할 일입니다. 설계에 있는 항목과 달리
  // 그 기기에만 저장됩니다.
  const [customItems, setCustomItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [journalText, setJournalText] = useState("");
  const [journalSaved, setJournalSaved] = useState(false);
  const [buttonResult, setButtonResult] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [runtimeReady, setRuntimeReady] = useState(false);
  const messageSequence = useRef(0);
  const runtimeStorageKey = `my-webapp-runtime-v1:${project.title}`;

  useEffect(() => {
    if (!interactive) return;
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(runtimeStorageKey);
        if (saved) {
          const runtime = JSON.parse(saved) as {
            checkedItems?: unknown;
            customItems?: unknown;
            journalText?: unknown;
          };
          if (Array.isArray(runtime.checkedItems)) {
            setCheckedItems(
              runtime.checkedItems.filter(
                (item): item is string => typeof item === "string",
              ),
            );
          }
          if (Array.isArray(runtime.customItems)) {
            setCustomItems(
              runtime.customItems
                .filter(
                  (item): item is Record<string, unknown> =>
                    Boolean(item) && typeof item === "object",
                )
                .slice(0, 20)
                .map((item, index) => ({
                  id:
                    typeof item.id === "string" && item.id
                      ? item.id
                      : `my-${index + 1}`,
                  text: typeof item.text === "string" ? item.text : "",
                }))
                .filter((item) => item.text),
            );
          }
          if (typeof runtime.journalText === "string") {
            setJournalText(runtime.journalText);
          }
        }
      } catch {
        // A damaged local record should not block the web app from opening.
      } finally {
        setRuntimeReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [interactive, runtimeStorageKey]);

  useEffect(() => {
    if (!interactive || !runtimeReady) return;
    try {
      window.localStorage.setItem(
        runtimeStorageKey,
        JSON.stringify({ checkedItems, customItems, journalText }),
      );
    } catch {
      // The dedicated save actions still provide visible feedback when possible.
    }
  }, [
    checkedItems,
    customItems,
    interactive,
    journalText,
    runtimeReady,
    runtimeStorageKey,
  ]);

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

  // 설계에 들어 있는 항목 뒤에, 쓰는 사람이 직접 적은 항목을 붙입니다.
  const allChecklistItems = [...project.checklistItems, ...customItems];

  const addCustomItem = () => {
    const text = newItemText.trim().slice(0, 40);
    if (!text) return;
    setCustomItems((items) => [
      ...items.slice(0, 19),
      {
        id: `my-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        text,
      },
    ]);
    setNewItemText("");
  };

  const removeCustomItem = (id: string) => {
    setCustomItems((items) => items.filter((item) => item.id !== id));
    setCheckedItems((items) => items.filter((item) => item !== id));
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
    const normalizedQuestion = question
      .toLocaleLowerCase()
      .replace(/[?!.,\s]/g, "");
    const matched = project.actions.find((action) => {
      const labelTokens = tokenize(action.label);
      const normalizedLabel = action.label
        .toLocaleLowerCase()
        .replace(/[?!.,\s]/g, "");
        return (
        normalizedQuestion === normalizedLabel ||
        (labelTokens.length > 0 &&
          labelTokens.every((label) =>
            questionTokens.some(
          (token) => label.includes(token) || token.includes(label),
            ),
          ))
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

  // 기능 카드는 학생이 정한 순서(featureOrder)대로 그립니다.
  const featureSections: Record<FeatureKind, ReactNode> = {
    "notice": project.noticeEnabled ? (
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
    ) : null,
    "checklist": project.checklistEnabled ? (
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
                  {
                    checkedItems.filter((id) =>
                      allChecklistItems.some((item) => item.id === id),
                    ).length
                  }
                  /{allChecklistItems.length}
                </b>
              </header>
              <div className="phone-checklist">
                {allChecklistItems.map((item) => (
                  <label key={item.id}>
                    <input
                      type="checkbox"
                      checked={checkedItems.includes(item.id)}
                      disabled={!interactive}
                      onChange={() => toggleChecklistItem(item.id)}
                    />
                    <span>{item.text}</span>
                    {interactive && item.id.startsWith("my-") && (
                      <button
                        className="checklist-remove"
                        type="button"
                        aria-label={`‘${item.text}’ 지우기`}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          removeCustomItem(item.id);
                        }}
                      >
                        <X size={12} aria-hidden="true" />
                      </button>
                    )}
                  </label>
                ))}
                <form
                  className="checklist-add"
                  onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (interactive) addCustomItem();
                  }}
                >
                  <input
                    aria-label="할 일 직접 추가"
                    placeholder="할 일을 적고 엔터를 눌러요"
                    value={interactive ? newItemText : ""}
                    maxLength={40}
                    readOnly={!interactive}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => setNewItemText(event.target.value)}
                  />
                  <button
                    type="submit"
                    aria-label="할 일 추가"
                    disabled={interactive && !newItemText.trim()}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Plus size={13} aria-hidden="true" />
                  </button>
                </form>
              </div>
            </section>
    ) : null,
    "journal": project.journalEnabled ? (
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
    ) : null,
    "camp-report": project.campReportEnabled ? (
      <CampReport
              project={project}
              interactive={interactive}
              selectedTarget={selectedTarget}
              onSelect={onSelect}
            />
    ) : null,
    "button": project.buttonEnabled ? (
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
    ) : null,
    "chatbot": project.chatbotEnabled ? (
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
                  <small>MY CHATBOT</small>
                  <strong>{project.botName}</strong>
                  <em>{project.greeting}</em>
                </span>
              </div>
              {project.actions.length ? (
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
              ) : (
                <p className="chatbot-empty-help">
                  이 챗봇을 만들 학생이 질문과 답을 추가해요.
                </p>
              )}
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
                챗봇 열기
              </button>
            </section>
    ) : null,
  };

  return (
    <div
      className={`phone ${interactive ? "phone-interactive" : ""} ${
        standalone ? "standalone-phone" : ""
      }`}
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
          {project.featureOrder.map((kind) => {
            const section = featureSections[kind];
            if (!section) return <Fragment key={kind} />;
            if (!onReorder || interactive) {
              return <Fragment key={kind}>{section}</Fragment>;
            }
            return (
              <div
                key={kind}
                className={`feature-slot ${
                  dragOverKind === kind ? "feature-slot-over" : ""
                }`}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(
                    "application/x-webapp-reorder",
                    kind,
                  );
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => {
                  if (
                    !event.dataTransfer.types.includes(
                      "application/x-webapp-reorder",
                    )
                  ) {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverKind(kind);
                }}
                onDragLeave={() => {
                  setDragOverKind((current) =>
                    current === kind ? null : current,
                  );
                }}
                onDrop={(event) => {
                  const moving = event.dataTransfer.getData(
                    "application/x-webapp-reorder",
                  ) as FeatureKind;
                  if (!moving) return;
                  event.preventDefault();
                  event.stopPropagation();
                  onReorder(moving, kind);
                  setDragOverKind(null);
                }}
                onDragEnd={() => setDragOverKind(null)}
              >
                {section}
              </div>
            );
          })}

          {!project.noticeEnabled &&
            !project.checklistEnabled &&
            !project.journalEnabled &&
            !project.campReportEnabled &&
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
          <section className="phone-chatbot-sheet" aria-label="내가 만든 챗봇">
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
                  내가 만든 질문·답만 사용해요
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
                  aria-label="내가 만든 챗봇에게 질문하기"
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
