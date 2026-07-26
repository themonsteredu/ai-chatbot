"use client";

import {
  ExternalLink,
  LibraryBig,
  Pencil,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import type { SavedWebAppSummary } from "../../lib/saved-webapps";

type SavedWebAppLibraryProps = {
  apps: SavedWebAppSummary[];
  activeAppId: string;
  onClose: () => void;
  onDelete: (app: SavedWebAppSummary) => void;
  onEdit: (app: SavedWebAppSummary) => void;
  onOpen: (app: SavedWebAppSummary) => void;
};

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "저장됨";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function SavedWebAppLibrary({
  apps,
  activeAppId,
  onClose,
  onDelete,
  onEdit,
  onOpen,
}: SavedWebAppLibraryProps) {
  return (
    <div
      className="library-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="library-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-title"
      >
        <header>
          <span className="library-icon">
            <LibraryBig size={19} aria-hidden="true" />
          </span>
          <div>
            <small>MY WEB APP LIBRARY</small>
            <h2 id="library-title">내 웹앱 보관함</h2>
            <p>완성한 앱마다 따로 열고, 편집하고, 홈 화면에 저장할 수 있어요.</p>
          </div>
          <button type="button" aria-label="보관함 닫기" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {apps.length === 0 ? (
          <div className="library-empty">
            <Smartphone size={35} aria-hidden="true" />
            <strong>아직 저장한 웹앱이 없어요</strong>
            <p>웹앱을 만든 뒤 위쪽의 ‘내 웹앱으로 저장’을 눌러 보세요.</p>
          </div>
        ) : (
          <div className="library-list">
            {apps.map((app) => (
              <article
                className={app.id === activeAppId ? "active" : ""}
                key={app.id}
              >
                <span
                  className="saved-app-icon"
                  style={{ "--saved-app-accent": app.accent } as React.CSSProperties}
                >
                  <Smartphone size={19} aria-hidden="true" />
                </span>
                <div>
                  <span>
                    {app.id === activeAppId && <b>지금 편집 중</b>}
                    <small>{formatUpdatedAt(app.updatedAt)}</small>
                  </span>
                  <strong>{app.appName}</strong>
                  <p>{app.projectTitle}</p>
                </div>
                <nav aria-label={`${app.appName} 관리`}>
                  <button type="button" onClick={() => onOpen(app)}>
                    <ExternalLink size={14} aria-hidden="true" />
                    앱 열기
                  </button>
                  <button type="button" onClick={() => onEdit(app)}>
                    <Pencil size={14} aria-hidden="true" />
                    편집
                  </button>
                  <button
                    className="danger"
                    type="button"
                    aria-label={`${app.appName} 삭제`}
                    onClick={() => onDelete(app)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </nav>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
