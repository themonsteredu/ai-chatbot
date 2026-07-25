"use client";

import { FormEvent, useRef, useState } from "react";
import {
  Backpack,
  BookOpen,
  Bot,
  Heart,
  Home,
  MessageCircle,
  Send,
  Sparkles,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import type {
  ActionIcon,
  ChatbotProject,
  SelectedTarget,
} from "../../lib/chatbot-studio";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

type PhonePreviewProps = {
  project: ChatbotProject;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messageSequence = useRef(0);
  const visibleMessages: ChatMessage[] = [
    { id: "welcome", role: "bot", text: project.greeting },
    ...messages,
  ];

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

  const select = (target: SelectedTarget) => {
    if (!interactive) onSelect?.(target);
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
        className={`phone-screen ${selectedTarget === "screen" ? "component-selected" : ""}`}
        onClick={() => select("screen")}
      >
        <button
          className={`chatbot-header ${selectedTarget === "bot" ? "component-selected" : ""}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            select("bot");
          }}
          aria-label="챗봇 머리글 선택"
        >
          <span className="bot-avatar">
            <Bot size={22} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <span>
            <strong>{project.botName}</strong>
            <small>
              <i aria-hidden="true" />
              {project.subtitle}
            </small>
          </span>
        </button>

        <div className="chat-scroll" aria-live={interactive ? "polite" : "off"}>
          {visibleMessages.map((message) => (
            <button
              className={`phone-message ${message.role} ${
                message.id === "welcome" && selectedTarget === "greeting"
                  ? "component-selected"
                  : ""
              }`}
              key={message.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (message.id === "welcome") select("greeting");
              }}
              disabled={message.id !== "welcome" || interactive}
            >
              {message.role === "bot" && (
                <span className="mini-avatar">
                  <Bot size={13} aria-hidden="true" />
                </span>
              )}
              <span>{message.text}</span>
            </button>
          ))}
        </div>

        <div className="quick-question-grid">
          {project.actions.map((action) => {
            const Icon = iconMap[action.icon];
            return (
              <button
                className={`quick-question ${
                  selectedTarget === action.id ? "component-selected" : ""
                }`}
                key={action.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (interactive) {
                    ask(action.label, action.response);
                  } else {
                    select(action.id);
                  }
                }}
              >
                <span>
                  <Icon size={14} strokeWidth={2.3} aria-hidden="true" />
                </span>
                {action.label}
              </button>
            );
          })}
        </div>

        {project.inputEnabled && (
          <form
            className={`phone-input ${selectedTarget === "input" ? "component-selected" : ""}`}
            onSubmit={submitQuestion}
            onClick={(event) => {
              event.stopPropagation();
              select("input");
            }}
          >
            <input
              aria-label="챗봇에게 질문하기"
              placeholder={project.inputPlaceholder}
              value={interactive ? input : ""}
              readOnly={!interactive}
              onChange={(event) => setInput(event.target.value)}
            />
            <button
              type={interactive ? "submit" : "button"}
              aria-label="질문 보내기"
            >
              <Send size={14} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </form>
        )}
      </section>
      <span className="phone-home-bar" aria-hidden="true" />
    </div>
  );
}
