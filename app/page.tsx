"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type BlockType =
  | "announcement"
  | "journal"
  | "checklist"
  | "schedule"
  | "faq"
  | "choice";

type ThemeId = "violet" | "mint" | "sunset" | "navy";

type BotBlock = {
  id: string;
  type: BlockType;
  icon: string;
  title: string;
  description: string;
  items: string[];
};

type BotConfig = {
  name: string;
  subtitle: string;
  welcome: string;
  emoji: string;
  theme: ThemeId;
  blocks: BotBlock[];
};

type Template = {
  id: string;
  name: string;
  tag: string;
  emoji: string;
  description: string;
  config: BotConfig;
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const makeBlock = (
  type: BlockType,
  icon: string,
  title: string,
  description: string,
  items: string[] = [],
): BotBlock => ({ id: uid(), type, icon, title, description, items });

const cloneConfig = (config: BotConfig): BotConfig => ({
  ...config,
  blocks: config.blocks.map((block) => ({ ...block, id: uid(), items: [...block.items] })),
});

const blockCatalog: Array<{
  type: BlockType;
  icon: string;
  name: string;
  hint: string;
  defaultDescription: string;
  items?: string[];
}> = [
  {
    type: "announcement",
    icon: "📢",
    name: "안내",
    hint: "소식과 공지를 보여줘요",
    defaultDescription: "새로운 안내 내용을 입력해 주세요.",
  },
  {
    type: "journal",
    icon: "✏️",
    name: "기록",
    hint: "생각과 활동을 남겨요",
    defaultDescription: "오늘의 생각이나 활동을 자유롭게 기록해 보세요.",
  },
  {
    type: "checklist",
    icon: "✅",
    name: "체크리스트",
    hint: "미션을 하나씩 완료해요",
    defaultDescription: "완료한 항목에 체크해 보세요.",
    items: ["첫 번째 미션", "두 번째 미션", "마무리 확인"],
  },
  {
    type: "schedule",
    icon: "🗓️",
    name: "일정",
    hint: "순서와 시간을 알려줘요",
    defaultDescription: "오늘의 일정을 확인해 보세요.",
    items: ["09:30 시작하기", "10:00 활동하기", "11:30 함께 나누기"],
  },
  {
    type: "faq",
    icon: "💡",
    name: "질문 답변",
    hint: "자주 묻는 질문에 답해요",
    defaultDescription: "궁금한 질문을 선택해 보세요.",
    items: ["어떻게 시작하나요?", "무엇을 준비하나요?", "도움은 어디서 받나요?"],
  },
  {
    type: "choice",
    icon: "🔀",
    name: "선택",
    hint: "버튼으로 다음 길을 골라요",
    defaultDescription: "어떤 활동을 해볼까요?",
    items: ["첫 번째 선택", "두 번째 선택"],
  },
];

const templates: Template[] = [
  {
    id: "blank",
    name: "빈 챗봇",
    tag: "자유 제작",
    emoji: "✨",
    description: "처음부터 내 아이디어로 만들어요.",
    config: {
      name: "나의 챗봇",
      subtitle: "무엇이든 물어보세요",
      welcome: "안녕하세요! 내가 만든 챗봇이에요. 무엇을 도와드릴까요?",
      emoji: "🤖",
      theme: "violet",
      blocks: [],
    },
  },
  {
    id: "camp",
    name: "AI 캠프 기록봇",
    tag: "추천",
    emoji: "🚀",
    description: "일정, 미션, 배운 내용을 한곳에 모아요.",
    config: {
      name: "나의 AI 캠프봇",
      subtitle: "배우고, 만들고, 기록해요",
      welcome: "반가워요! 오늘 캠프 활동을 함께 시작해 볼까요?",
      emoji: "🚀",
      theme: "violet",
      blocks: [
        makeBlock(
          "schedule",
          "🗓️",
          "오늘의 일정",
          "오늘 진행할 활동 순서예요.",
          ["09:30 AI 만나기", "10:20 챗봇 기획", "11:10 나만의 봇 만들기"],
        ),
        makeBlock(
          "journal",
          "✏️",
          "오늘 배운 내용",
          "오늘 새롭게 알게 된 점을 한 문장으로 남겨 보세요.",
        ),
        makeBlock(
          "checklist",
          "✅",
          "나의 미션",
          "완료한 미션에 체크해 보세요.",
          ["챗봇 이름 정하기", "대화 기능 3개 넣기", "친구에게 테스트 받기"],
        ),
        makeBlock(
          "faq",
          "💡",
          "궁금한 점",
          "자주 묻는 질문을 골라 보세요.",
          ["챗봇은 어떻게 말하나요?", "내 기록은 어디에 있나요?", "친구에게 어떻게 보여주나요?"],
        ),
      ],
    },
  },
  {
    id: "class",
    name: "우리 반 알림봇",
    tag: "학급",
    emoji: "🏫",
    description: "공지, 준비물, 할 일을 쉽게 안내해요.",
    config: {
      name: "우리 반 알림봇",
      subtitle: "오늘도 즐거운 하루!",
      welcome: "안녕하세요! 오늘의 알림과 준비물을 확인해 보세요.",
      emoji: "🏫",
      theme: "mint",
      blocks: [
        makeBlock("announcement", "📢", "오늘의 알림", "내일은 체육 활동이 있어요. 편한 옷을 준비해 주세요."),
        makeBlock(
          "checklist",
          "🎒",
          "준비물",
          "준비한 물건에 체크해 보세요.",
          ["필기도구", "물병", "체육복"],
        ),
        makeBlock(
          "schedule",
          "🗓️",
          "이번 주 일정",
          "우리 반의 이번 주 중요한 일정이에요.",
          ["월요일 독서 활동", "수요일 체육 활동", "금요일 모둠 발표"],
        ),
      ],
    },
  },
  {
    id: "reading",
    name: "독서 활동봇",
    tag: "독서",
    emoji: "📚",
    description: "책을 읽고 생각과 질문을 기록해요.",
    config: {
      name: "나의 독서 친구",
      subtitle: "책 속 생각을 꺼내 봐요",
      welcome: "오늘 읽은 책은 어땠나요? 기억하고 싶은 이야기를 들려주세요.",
      emoji: "📚",
      theme: "sunset",
      blocks: [
        makeBlock("journal", "📝", "인상 깊은 문장", "가장 기억에 남는 문장과 그 이유를 적어 보세요."),
        makeBlock("journal", "💭", "나의 감상", "책을 읽고 든 생각이나 느낌을 자유롭게 남겨 보세요."),
        makeBlock(
          "choice",
          "🗣️",
          "토론 질문",
          "친구들과 이야기해 보고 싶은 질문을 선택해 보세요.",
          ["주인공의 선택에 동의하나요?", "나라면 어떻게 행동했을까요?"],
        ),
      ],
    },
  },
];

const themes: Array<{ id: ThemeId; name: string; color: string; soft: string }> = [
  { id: "violet", name: "보라", color: "#5b4bff", soft: "#eeecff" },
  { id: "mint", name: "민트", color: "#087f68", soft: "#dff8f1" },
  { id: "sunset", name: "노을", color: "#d9572b", soft: "#fff0e8" },
  { id: "navy", name: "남색", color: "#183153", soft: "#e8f0fb" },
];

function encodeConfig(config: BotConfig) {
  const bytes = new TextEncoder().encode(JSON.stringify(config));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeConfig(value: string): BotConfig | null {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as BotConfig;
  } catch {
    return null;
  }
}

export default function Home() {
  const [config, setConfig] = useState<BotConfig>(() => cloneConfig(templates[1].config));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState("준비됨");
  const [shareStatus, setShareStatus] = useState("공유 링크 복사");
  const [toast, setToast] = useState("");
  const [mobileTab, setMobileTab] = useState<"build" | "preview">("build");
  const loadedRef = useRef(false);

  const selectedBlock = useMemo(
    () => config.blocks.find((block) => block.id === selectedId) ?? null,
    [config.blocks, selectedId],
  );

  const activePreview = useMemo(
    () => config.blocks.find((block) => block.id === activePreviewId) ?? null,
    [config.blocks, activePreviewId],
  );

  const theme = themes.find((item) => item.id === config.theme) ?? themes[0];

  useEffect(() => {
    const shared = window.location.hash.startsWith("#bot=")
      ? decodeConfig(window.location.hash.slice(5))
      : null;
    const saved = localStorage.getItem("chatbot-maker-project");
    if (shared) {
      setConfig(shared);
      setToast("공유된 챗봇을 불러왔어요.");
    } else if (saved) {
      try {
        setConfig(JSON.parse(saved) as BotConfig);
      } catch {
        localStorage.removeItem("chatbot-maker-project");
      }
    }
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    setSaveStatus("저장 중…");
    const timer = window.setTimeout(() => {
      localStorage.setItem("chatbot-maker-project", JSON.stringify(config));
      setSaveStatus("자동 저장됨");
    }, 450);
    return () => window.clearTimeout(timer);
  }, [config]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const applyTemplate = (template: Template) => {
    setConfig(cloneConfig(template.config));
    setSelectedId(null);
    setActivePreviewId(null);
    setToast(`${template.name} 템플릿을 적용했어요.`);
  };

  const addBlock = (type: BlockType) => {
    const item = blockCatalog.find((catalogItem) => catalogItem.type === type);
    if (!item) return;
    const block = makeBlock(
      type,
      item.icon,
      item.name,
      item.defaultDescription,
      item.items ? [...item.items] : [],
    );
    setConfig((current) => ({ ...current, blocks: [...current.blocks, block] }));
    setSelectedId(block.id);
    setToast(`${item.name} 기능을 추가했어요.`);
  };

  const updateBlock = (changes: Partial<BotBlock>) => {
    if (!selectedId) return;
    setConfig((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === selectedId ? { ...block, ...changes } : block,
      ),
    }));
  };

  const moveBlock = (direction: -1 | 1) => {
    if (!selectedId) return;
    setConfig((current) => {
      const index = current.blocks.findIndex((block) => block.id === selectedId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.blocks.length) return current;
      const nextBlocks = [...current.blocks];
      [nextBlocks[index], nextBlocks[nextIndex]] = [nextBlocks[nextIndex], nextBlocks[index]];
      return { ...current, blocks: nextBlocks };
    });
  };

  const removeBlock = () => {
    if (!selectedId) return;
    setConfig((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== selectedId),
    }));
    setSelectedId(null);
    setToast("기능을 삭제했어요.");
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#bot=${encodeConfig(config)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("복사 완료!");
      setToast("링크를 받은 사람은 이 챗봇을 바로 볼 수 있어요.");
      window.setTimeout(() => setShareStatus("공유 링크 복사"), 1800);
    } catch {
      window.prompt("아래 공유 링크를 복사해 주세요.", url);
    }
  };

  return (
    <main
      className="app-shell"
      style={
        {
          "--theme": theme.color,
          "--theme-soft": theme.soft,
        } as React.CSSProperties
      }
    >
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            C
          </div>
          <div>
            <strong>챗봇 메이커</strong>
            <span>아이디어를 대화로 만드는 스튜디오</span>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="save-status">
            <span className="status-dot" aria-hidden="true" />
            {saveStatus}
          </span>
          <button className="secondary-button" type="button" onClick={() => setActivePreviewId(null)}>
            미리보기 초기화
          </button>
          <button className="primary-button" type="button" onClick={copyShareLink}>
            {shareStatus}
          </button>
        </div>
      </header>

      <section className="template-strip" aria-labelledby="template-title">
        <div className="template-heading">
          <span className="eyebrow">START</span>
          <div>
            <h1 id="template-title">어떤 챗봇을 만들까요?</h1>
            <p>템플릿으로 빠르게 시작하고 내 아이디어에 맞게 바꿔 보세요.</p>
          </div>
        </div>
        <div className="template-list">
          {templates.map((template) => (
            <button
              className="template-card"
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template)}
            >
              <span className="template-emoji" aria-hidden="true">
                {template.emoji}
              </span>
              <span>
                <span className="template-name">
                  {template.name}
                  <small>{template.tag}</small>
                </span>
                <span className="template-description">{template.description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <nav className="mobile-tabs" aria-label="모바일 작업 화면">
        <button
          type="button"
          className={mobileTab === "build" ? "active" : ""}
          onClick={() => setMobileTab("build")}
        >
          🛠️ 만들기
        </button>
        <button
          type="button"
          className={mobileTab === "preview" ? "active" : ""}
          onClick={() => setMobileTab("preview")}
        >
          💬 미리보기
        </button>
      </nav>

      <div className={`studio ${mobileTab === "preview" ? "show-preview" : "show-build"}`}>
        <aside className="toolbox panel">
          <div className="panel-heading">
            <span className="step-number">1</span>
            <div>
              <h2>기능 고르기</h2>
              <p>필요한 기능을 눌러 추가하세요.</p>
            </div>
          </div>
          <div className="catalog">
            {blockCatalog.map((item) => (
              <button
                className="catalog-item"
                key={item.type}
                type="button"
                onClick={() => addBlock(item.type)}
              >
                <span className="catalog-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.hint}</small>
                </span>
                <span className="add-mark" aria-hidden="true">
                  +
                </span>
              </button>
            ))}
          </div>
          <div className="tip-card">
            <span aria-hidden="true">💡</span>
            <p>
              <strong>만들기 팁</strong>
              기능은 3~5개만 골라도 충분히 멋진 챗봇이 돼요.
            </p>
          </div>
        </aside>

        <section className="editor panel">
          <div className="panel-heading editor-heading">
            <span className="step-number">2</span>
            <div>
              <h2>내 챗봇 꾸미기</h2>
              <p>이름과 대화 내용을 자유롭게 바꿔 보세요.</p>
            </div>
          </div>

          <div className="settings-card identity-settings">
            <div className="settings-title">
              <h3>기본 정보</h3>
              <span>챗봇의 첫인상이에요</span>
            </div>
            <div className="form-grid">
              <label className="emoji-field">
                <span>캐릭터</span>
                <input
                  aria-label="챗봇 캐릭터"
                  maxLength={4}
                  value={config.emoji}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, emoji: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>챗봇 이름</span>
                <input
                  value={config.name}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>한 줄 소개</span>
                <input
                  value={config.subtitle}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, subtitle: event.target.value }))
                  }
                />
              </label>
              <label className="wide-field">
                <span>첫 인사</span>
                <textarea
                  rows={2}
                  value={config.welcome}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, welcome: event.target.value }))
                  }
                />
              </label>
            </div>
            <fieldset className="theme-picker">
              <legend>대표 색상</legend>
              {themes.map((item) => (
                <button
                  aria-label={`${item.name} 테마`}
                  aria-pressed={config.theme === item.id}
                  className={config.theme === item.id ? "selected" : ""}
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setConfig((current) => ({ ...current, theme: item.id }))
                  }
                >
                  <span style={{ backgroundColor: item.color }} />
                  {item.name}
                </button>
              ))}
            </fieldset>
          </div>

          <div className="flow-heading">
            <div>
              <h3>대화 기능</h3>
              <p>카드를 선택하면 내용을 편집할 수 있어요.</p>
            </div>
            <span className="block-count">{config.blocks.length}개 기능</span>
          </div>

          {config.blocks.length === 0 ? (
            <div className="empty-flow">
              <span aria-hidden="true">🧩</span>
              <h3>아직 추가한 기능이 없어요</h3>
              <p>왼쪽에서 기능을 골라 나만의 대화 흐름을 만들어 보세요.</p>
            </div>
          ) : (
            <div className="flow-list">
              {config.blocks.map((block, index) => (
                <button
                  className={`flow-card ${selectedId === block.id ? "selected" : ""}`}
                  key={block.id}
                  type="button"
                  onClick={() => setSelectedId(block.id)}
                >
                  <span className="flow-index">{index + 1}</span>
                  <span className="flow-icon" aria-hidden="true">
                    {block.icon}
                  </span>
                  <span className="flow-copy">
                    <strong>{block.title}</strong>
                    <small>{block.description}</small>
                  </span>
                  <span className="flow-edit">편집</span>
                </button>
              ))}
            </div>
          )}

          {selectedBlock && (
            <div className="settings-card block-settings">
              <div className="settings-title">
                <h3>{selectedBlock.icon} 선택한 기능 편집</h3>
                <button className="text-danger" type="button" onClick={removeBlock}>
                  삭제
                </button>
              </div>
              <div className="form-grid block-form">
                <label className="emoji-field">
                  <span>아이콘</span>
                  <input
                    maxLength={4}
                    value={selectedBlock.icon}
                    onChange={(event) => updateBlock({ icon: event.target.value })}
                  />
                </label>
                <label>
                  <span>버튼 이름</span>
                  <input
                    value={selectedBlock.title}
                    onChange={(event) => updateBlock({ title: event.target.value })}
                  />
                </label>
                <label className="wide-field">
                  <span>챗봇 답변</span>
                  <textarea
                    rows={3}
                    value={selectedBlock.description}
                    onChange={(event) => updateBlock({ description: event.target.value })}
                  />
                </label>
                {selectedBlock.type !== "announcement" &&
                  selectedBlock.type !== "journal" && (
                    <label className="wide-field">
                      <span>목록 항목 <small>한 줄에 하나씩 입력</small></span>
                      <textarea
                        rows={4}
                        value={selectedBlock.items.join("\n")}
                        onChange={(event) =>
                          updateBlock({
                            items: event.target.value
                              .split("\n")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </label>
                  )}
              </div>
              <div className="order-actions">
                <button type="button" onClick={() => moveBlock(-1)}>
                  ↑ 앞으로
                </button>
                <button type="button" onClick={() => moveBlock(1)}>
                  ↓ 뒤로
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="preview-panel">
          <div className="preview-heading">
            <div>
              <span className="step-number">3</span>
              <div>
                <h2>바로 테스트하기</h2>
                <p>버튼을 눌러 실제처럼 대화해 보세요.</p>
              </div>
            </div>
            <span className="live-pill">● LIVE</span>
          </div>
          <div className="phone-frame">
            <div className="phone-speaker" aria-hidden="true" />
            <div className="chat-header">
              <div className="bot-avatar">{config.emoji || "🤖"}</div>
              <div>
                <strong>{config.name || "이름 없는 챗봇"}</strong>
                <span>
                  <i aria-hidden="true" /> {config.subtitle || "대화할 준비가 됐어요"}
                </span>
              </div>
            </div>
            <div className="chat-body">
              <div className="message-row">
                <div className="mini-avatar">{config.emoji || "🤖"}</div>
                <div className="message bot-message">{config.welcome || "안녕하세요!"}</div>
              </div>

              {activePreview && (
                <>
                  <div className="message user-message">{activePreview.title}</div>
                  <div className="message-row">
                    <div className="mini-avatar">{config.emoji || "🤖"}</div>
                    <div className="message bot-message">{activePreview.description}</div>
                  </div>
                  <PreviewInteraction block={activePreview} onToast={setToast} />
                </>
              )}

              {!activePreview && config.blocks.length > 0 && (
                <p className="preview-hint">아래 메뉴를 눌러 대화를 시작하세요.</p>
              )}
              {config.blocks.length === 0 && (
                <div className="preview-empty">
                  <span aria-hidden="true">🧩</span>
                  기능을 추가하면 여기에 버튼이 나타나요.
                </div>
              )}
            </div>
            <div className="quick-actions">
              {config.blocks.map((block) => (
                <button key={block.id} type="button" onClick={() => setActivePreviewId(block.id)}>
                  <span aria-hidden="true">{block.icon}</span>
                  {block.title}
                </button>
              ))}
            </div>
            <div className="chat-input">
              <span>메시지를 입력해 보세요</span>
              <button type="button" aria-label="메시지 보내기">
                ↑
              </button>
            </div>
          </div>
          <p className="preview-note">
            <span aria-hidden="true">🔒</span> 지금 만든 내용은 이 기기에 자동으로 저장돼요.
          </p>
        </aside>
      </div>

      {toast && (
        <div className="toast" role="status">
          <span aria-hidden="true">✓</span>
          {toast}
        </div>
      )}
    </main>
  );
}

function PreviewInteraction({
  block,
  onToast,
}: {
  block: BotBlock;
  onToast: (message: string) => void;
}) {
  if (block.type === "journal") {
    return (
      <div className="preview-interaction journal-interaction">
        <textarea aria-label="미리보기 기록 입력" placeholder="여기에 기록해 보세요…" rows={3} />
        <button type="button" onClick={() => onToast("미리보기 기록을 완료했어요!")}>
          기록 완료
        </button>
      </div>
    );
  }

  if (block.type === "checklist") {
    return (
      <div className="preview-interaction preview-checklist">
        {block.items.map((item, index) => (
          <label key={`${item}-${index}`}>
            <input type="checkbox" />
            <span>{item}</span>
          </label>
        ))}
      </div>
    );
  }

  if (block.type === "schedule") {
    return (
      <ol className="preview-interaction preview-schedule">
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`}>
            <span>{index + 1}</span>
            {item}
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "faq" || block.type === "choice") {
    return (
      <div className="preview-interaction preview-options">
        {block.items.map((item, index) => (
          <button
            key={`${item}-${index}`}
            type="button"
            onClick={() => onToast(`“${item}”을 선택했어요.`)}
          >
            {item}
          </button>
        ))}
      </div>
    );
  }

  return null;
}
