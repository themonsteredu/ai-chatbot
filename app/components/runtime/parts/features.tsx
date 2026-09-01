"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Info,
  Loader2,
  NotebookPen,
  Plus,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";
import type { ComponentNode, ListItem } from "../../../../lib/chatbot-studio";
import {
  dayKey,
  dayName,
  dayOf,
  readDays,
  shiftDay,
  writeDay,
  type DayEntry,
} from "../../../../lib/checklist-days";
import type { ChecklistReport } from "../../../../lib/class-checklists";
import {
  CLASS_CODE_KEY,
  STUDENT_NAME_KEY,
} from "../../../../lib/runtime-store";
import type { AppRuntime } from "../use-app-runtime";
import { partStyle } from "../style";

type PartProps = { node: ComponentNode; runtime: AppRuntime };

export function NoticeCardPart({ node, runtime }: PartProps) {
  return (
    <section className="webapp-card notice-card" style={partStyle(node.props)}>
      <span className="feature-card-icon yellow">
        <Info size={15} aria-hidden="true" />
      </span>
      <div>
        <span className="card-eyebrow">NOTICE</span>
        <h3>{runtime.text(node, "title")}</h3>
        <p>{runtime.text(node, "body")}</p>
      </div>
    </section>
  );
}

export function ChecklistPart({ node, runtime }: PartProps) {
  const [draft, setDraft] = useState("");
  const daily = runtime.bool(node, "daily");
  // 자정을 넘겨도 보던 날이 갑자기 바뀌지 않도록, 열었을 때의 오늘을 붙듭니다.
  const [today] = useState(dayKey);
  const [viewDay, setViewDay] = useState(today);
  const state = runtime.partState(node.id);

  // 날마다 새로 시작할 때는 날짜별로 나눠 담고, 아니면 예전처럼 한 벌만 씁니다.
  // 두 모양을 나란히 두어, 스위치를 껐다 켜도 적어 둔 것이 사라지지 않습니다.
  const days = daily ? readDays(state, today) : null;
  const entry: DayEntry = days
    ? dayOf(days, viewDay)
    : {
        checked: Array.isArray(state.checked) ? (state.checked as string[]) : [],
        // 웹앱을 쓰는 사람이 직접 적은 할 일입니다. 설계에 있는 항목과 달리 그
        // 기기에만 남습니다.
        custom: Array.isArray(state.custom) ? (state.custom as ListItem[]) : [],
      };
  const { checked, custom } = entry;
  const all = [...runtime.items(node, "items"), ...custom];

  const save = (patch: Partial<DayEntry>) => {
    const next: DayEntry = { checked, custom, ...patch };
    runtime.setPartState(
      node.id,
      days ? { days: writeDay(days, viewDay, next, today) } : next,
    );
  };

  const toggle = (id: string) => {
    if (!runtime.interactive) return;
    save({
      checked: checked.includes(id)
        ? checked.filter((item) => item !== id)
        : [...checked, id],
    });
    runtime.fire(node.id, "item-checked");
  };

  const add = () => {
    const value = draft.trim();
    if (!runtime.interactive || !value || custom.length >= 20) return;
    // 이미 쓰고 있는 번호를 피해 짓습니다. 지웠다 다시 넣어도 겹치지 않습니다.
    const taken = new Set(custom.map((item) => item.id));
    let serial = custom.length + 1;
    while (taken.has(`my-${serial}`)) serial += 1;
    save({ custom: [...custom, { id: `my-${serial}`, text: value.slice(0, 40) }] });
    setDraft("");
  };

  const remove = (id: string) => {
    save({
      custom: custom.filter((item) => item.id !== id),
      checked: checked.filter((item) => item !== id),
    });
  };

  const goDay = (step: number) => (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    setViewDay((current) => (step === 0 ? today : shiftDay(current, step)));
  };

  return (
    <section className="webapp-card checklist-card" style={partStyle(node.props)}>
      <header>
        <span className="feature-card-icon mint">
          <ClipboardCheck size={15} aria-hidden="true" />
        </span>
        <span>
          <small>CHECK LIST</small>
          <strong>{runtime.text(node, "title")}</strong>
        </span>
        <b>
          {checked.filter((id) => all.some((item) => item.id === id)).length}/
          {all.length}
        </b>
      </header>
      {daily && (
        <nav className="checklist-days" aria-label="날짜 고르기">
          <button
            type="button"
            aria-label="하루 앞으로"
            disabled={!runtime.interactive}
            onClick={goDay(-1)}
          >
            <ChevronLeft size={12} aria-hidden="true" />
          </button>
          <button
            className="checklist-day-name"
            type="button"
            aria-label={`${dayName(viewDay, today)}${viewDay === today ? "" : " · 오늘로 가기"}`}
            disabled={!runtime.interactive || viewDay === today}
            onClick={goDay(0)}
          >
            <b>{dayName(viewDay, today)}</b>
            {viewDay !== today && <span>오늘로</span>}
          </button>
          <button
            type="button"
            aria-label="하루 뒤로"
            disabled={!runtime.interactive}
            onClick={goDay(1)}
          >
            <ChevronRight size={12} aria-hidden="true" />
          </button>
        </nav>
      )}
      <div className="phone-checklist">
        {all.map((item) => (
          <label key={item.id}>
            <input
              type="checkbox"
              checked={checked.includes(item.id)}
              disabled={!runtime.interactive}
              onChange={() => toggle(item.id)}
            />
            <span>{item.text}</span>
            {runtime.interactive && item.id.startsWith("my-") && (
              <button
                className="checklist-remove"
                type="button"
                aria-label={`‘${item.text}’ 지우기`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  remove(item.id);
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
            add();
          }}
        >
          <input
            aria-label="할 일 직접 추가"
            placeholder="할 일을 적고 엔터를 눌러요"
            value={runtime.interactive ? draft : ""}
            maxLength={40}
            readOnly={!runtime.interactive}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button
            type="submit"
            aria-label="할 일 추가"
            disabled={runtime.interactive && !draft.trim()}
            onClick={(event) => event.stopPropagation()}
          >
            <Plus size={13} aria-hidden="true" />
          </button>
        </form>
        {runtime.interactive && (
          <ChecklistSend
            nodeId={node.id}
            report={{
              title: runtime.text(node, "title"),
              items: runtime.items(node, "items"),
              // 날짜를 안 쓰는 목록은 오늘 하루치로 보냅니다.
              days: days ?? { [today]: entry },
            }}
          />
        )}
      </div>
    </section>
  );
}

/**
 * 오늘까지 한 것을 선생님께 보냅니다. 반 코드와 이름은 반에 제출할 때 쓰던 것을
 * 그대로 꺼내 써서, 학생이 다시 적지 않아도 됩니다.
 */
function ChecklistSend({
  nodeId,
  report,
}: {
  nodeId: string;
  report: ChecklistReport;
}) {
  const remembered = (key: string) =>
    typeof window === "undefined" ? "" : (window.localStorage.getItem(key) ?? "");
  const [open, setOpen] = useState(false);
  const [classCode, setClassCode] = useState(() => remembered(CLASS_CODE_KEY));
  const [studentName, setStudentName] = useState(() =>
    remembered(STUDENT_NAME_KEY),
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  const send = async () => {
    const code = classCode.trim();
    const student = studentName.trim();
    if (sending || code.length < 2 || !student) {
      setResult({ ok: false, message: "이름과 반 코드를 적어 주세요." });
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const response = await fetch("/api/class-webapps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-record",
          kind: "checklist",
          classCode: code,
          studentName: student,
          // 부품 아이디로 담아 보내면, 활동 체크를 여러 개 놓아도 서로 지우지
          // 않습니다.
          record: { lists: { [nodeId]: report } },
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.error ?? "보내지 못했어요.");
      window.localStorage.setItem(CLASS_CODE_KEY, code);
      window.localStorage.setItem(STUDENT_NAME_KEY, student);
      setResult({
        ok: true,
        message: "선생님께 보냈어요. 다시 보내면 최신 내용으로 바뀌어요.",
      });
    } catch (caught) {
      setResult({
        ok: false,
        message: caught instanceof Error ? caught.message : "보내지 못했어요.",
      });
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        className="checklist-send-open"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <Send size={10} aria-hidden="true" />
        선생님께 보내기
      </button>
    );
  }

  return (
    <form
      className="checklist-send"
      onClick={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      <input
        aria-label="이름"
        placeholder="이름"
        value={studentName}
        maxLength={20}
        onChange={(event) => setStudentName(event.target.value)}
      />
      <input
        aria-label="반 코드"
        placeholder="반 코드"
        value={classCode}
        maxLength={24}
        onChange={(event) => setClassCode(event.target.value)}
      />
      <button type="submit" disabled={sending}>
        {sending ? (
          <Loader2 size={11} aria-hidden="true" />
        ) : (
          <Send size={11} aria-hidden="true" />
        )}
        보내기
      </button>
      {result && (
        <p className={result.ok ? "ok" : "bad"} role="status">
          {result.message}
        </p>
      )}
    </form>
  );
}

export function JournalPart({ node, runtime }: PartProps) {
  const state = runtime.partState(node.id);
  const value = typeof state.text === "string" ? state.text : "";
  const saved = state.saved === true;

  return (
    <section className="webapp-card journal-card" style={partStyle(node.props)}>
      <header>
        <span className="feature-card-icon blue">
          <NotebookPen size={15} aria-hidden="true" />
        </span>
        <span>
          <small>MY RECORD</small>
          <strong>{runtime.text(node, "title")}</strong>
        </span>
      </header>
      <textarea
        aria-label={runtime.text(node, "title")}
        placeholder={runtime.text(node, "prompt")}
        value={runtime.interactive ? value : ""}
        readOnly={!runtime.interactive}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) =>
          runtime.setPartState(node.id, {
            text: event.target.value,
            saved: false,
          })
        }
      />
      <button
        className="journal-save-button"
        type="button"
        disabled={runtime.interactive && !value.trim()}
        onClick={(event) => {
          event.stopPropagation();
          if (!runtime.interactive || !value.trim()) return;
          // 글은 위의 자동 저장이 이미 담아 둡니다. 여기서는 저장했다고 알려 주고
          // 블록에 연결된 동작을 실행합니다.
          runtime.setPartState(node.id, { saved: true });
          runtime.fire(node.id, "saved");
        }}
      >
        {saved && !runtime.storageFull ? (
          <>
            <Check size={13} aria-hidden="true" />
            저장했어요
          </>
        ) : (
          runtime.text(node, "buttonLabel")
        )}
      </button>
      {runtime.interactive && runtime.storageFull && (
        <p className="journal-storage-warning" role="status">
          저장 공간이 부족해요. 사진이나 기록을 조금 줄여 주세요.
        </p>
      )}
    </section>
  );
}
