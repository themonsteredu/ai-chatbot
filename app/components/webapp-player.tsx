"use client";

import { Pencil, Rocket } from "lucide-react";
import type { WebAppProject } from "../../lib/chatbot-studio";
import { PhonePreview } from "./phone-preview";
import { PwaInstallButton } from "./pwa-install";

type WebAppPlayerProps = {
  appId: string;
  project: WebAppProject;
  onEdit: () => void;
};

export function WebAppPlayer({
  appId,
  project,
  onEdit,
}: WebAppPlayerProps) {
  return (
    <main
      className="standalone-app-shell"
      style={{ "--standalone-accent": project.accent } as React.CSSProperties}
    >
      <header className="standalone-toolbar">
        <span>
          <i>
            <Rocket size={17} aria-hidden="true" />
          </i>
          <span>
            <small>MY WEB APP</small>
            <strong>{project.appName}</strong>
          </span>
        </span>
        <nav>
          <PwaInstallButton
            accent={project.accent}
            appId={appId}
            appName={project.appName}
            project={project}
            compact
          />
          <button type="button" onClick={onEdit}>
            <Pencil size={13} aria-hidden="true" />
            편집하기
          </button>
        </nav>
      </header>
      <div className="standalone-phone-wrap">
        <PhonePreview project={project} interactive standalone />
      </div>
    </main>
  );
}
