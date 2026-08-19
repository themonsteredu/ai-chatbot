"use client";

import { Bot, ChevronLeft, MessageCircle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { ComponentNode } from "../../../../lib/chatbot-studio";
import { matchQuestion } from "../../../../lib/chatbot-match";
import type { AppRuntime } from "../use-app-runtime";
import { QUESTION_ICONS } from "../icons";
import { partStyle } from "../style";

type ChatMessage = { id: string; role: "bot" | "user"; text: string };

type ChatbotPartProps = {
  node: ComponentNode;
  runtime: AppRuntime;
  onOpenSheet: (node: ComponentNode) => void;
};

export function ChatbotPart({ node, runtime, onOpenSheet }: ChatbotPartProps) {
  const questions = runtime.questions(node, "qa");

  return (
    <section
      className="webapp-card chatbot-feature"
      style={partStyle(node.props)}
    >
      <div className="chatbot-feature-heading">
        <span className="bot-avatar compact">
          <Bot size={18} strokeWidth={2.4} aria-hidden="true" />
        </span>
        <span>
          <small>MY CHATBOT</small>
          <strong>{runtime.text(node, "botName")}</strong>
          <em>{runtime.text(node, "greeting")}</em>
        </span>
      </div>
      {questions.length ? (
        <div className="chatbot-action-preview">
          {questions.slice(0, 3).map((item) => {
            const Icon = QUESTION_ICONS[item.icon];
            return (
              <button
                key={item.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenSheet(node);
                }}
              >
                <Icon size={11} aria-hidden="true" />
                {item.label}
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
          onOpenSheet(node);
        }}
      >
        <MessageCircle size={13} aria-hidden="true" />
        챗봇 열기
      </button>
    </section>
  );
}

type ChatbotSheetProps = {
  node: ComponentNode;
  runtime: AppRuntime;
  onClose: () => void;
};

export function ChatbotSheet({ node, runtime, onClose }: ChatbotSheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sequence, setSequence] = useState(0);
  const questions = runtime.questions(node, "qa");

  const ask = (question: string, answer: string) => {
    const next = sequence + 1;
    setSequence(next);
    setMessages((current) => [
      ...current.slice(-8),
      { id: `user-${next}`, role: "user", text: question },
      { id: `bot-${next}`, role: "bot", text: answer },
    ]);
    runtime.fire(node.id, "asked");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    const matched = matchQuestion(question, questions);
    ask(question, matched?.response ?? runtime.text(node, "fallback"));
    setInput("");
  };

  const visible: ChatMessage[] = [
    { id: "welcome", role: "bot", text: runtime.text(node, "greeting") },
    ...messages,
  ];

  return (
    <section className="phone-chatbot-sheet" aria-label="내가 만든 챗봇">
      <header>
        <button type="button" aria-label="웹앱으로 돌아가기" onClick={onClose}>
          <ChevronLeft size={17} aria-hidden="true" />
        </button>
        <span className="bot-avatar compact">
          <Bot size={17} aria-hidden="true" />
        </span>
        <span>
          <strong>{runtime.text(node, "botName")}</strong>
          <small>
            <i aria-hidden="true" />
            내가 만든 질문·답만 사용해요
          </small>
        </span>
      </header>

      <div className="chat-scroll" aria-live="polite">
        {visible.map((message) => (
          <div className={`phone-message ${message.role}`} key={message.id}>
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
        {questions.map((item) => {
          const Icon = QUESTION_ICONS[item.icon];
          return (
            <button
              className="quick-question"
              key={item.id}
              type="button"
              onClick={() => ask(item.label, item.response)}
            >
              <span>
                <Icon size={13} aria-hidden="true" />
              </span>
              {item.label}
            </button>
          );
        })}
      </div>

      {runtime.bool(node, "inputEnabled") && (
        <form className="phone-input" onSubmit={submit}>
          <input
            aria-label="질문 입력"
            placeholder={runtime.text(node, "placeholder")}
            value={input}
            maxLength={60}
            onChange={(event) => setInput(event.target.value)}
          />
          <button type="submit" aria-label="질문 보내기" disabled={!input.trim()}>
            <Send size={15} aria-hidden="true" />
          </button>
        </form>
      )}
    </section>
  );
}
