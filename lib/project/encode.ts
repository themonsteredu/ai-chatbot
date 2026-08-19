/**
 * 설계 내용을 주소에 실을 수 있는 문자열로 바꿉니다. 학생이 쓴 글·사진 같은
 * 실행 기록은 여기 들어가지 않고 기기에만 남습니다.
 *
 * 길이가 중요합니다. 홈 화면 설치용 매니페스트는 12,000자, 공유 저장은
 * 200,000자까지만 받습니다. 그래서 기본값과 같은 속성은 빼고 담습니다.
 */

import { propSpec } from "../components/registry";
import { normalizeProject } from "./normalize";
import type { ComponentNode, WebAppProject } from "./types";

/** 홈 화면 설치용 주소에는 사진을 빼야 12,000자 안에 들어갑니다. */
export const MANIFEST_PROJECT_LIMIT = 12000;
export const SHARE_PROJECT_LIMIT = 200000;

export type CompactOptions = { forManifest?: boolean };

function compactNode(
  node: ComponentNode,
  options: CompactOptions,
): ComponentNode {
  const props: ComponentNode["props"] = {};
  for (const [key, value] of Object.entries(node.props)) {
    const spec = propSpec(node.type, key);
    if (!spec) continue;
    if (!Array.isArray(value) && value === spec.default) continue;
    if (options.forManifest && spec.kind === "image") {
      // 설치 주소에서는 사진을 뺍니다. 기기에 저장된 설계에는 그대로 남습니다.
      continue;
    }
    props[key] = value;
  }

  const out: ComponentNode = { id: node.id, type: node.type, name: node.name, props };
  if (node.children && node.children.length > 0) {
    out.children = node.children.map((child) => compactNode(child, options));
  }
  return out;
}

export function compactProject(
  project: WebAppProject,
  options: CompactOptions = {},
) {
  const compact: Record<string, unknown> = {
    version: project.version,
    template: project.template,
    title: project.title,
    appName: project.appName,
    subtitle: project.subtitle,
    accent: project.accent,
    screenBackground: project.screenBackground,
    screens: project.screens.map((screen) => ({
      id: screen.id,
      name: screen.name,
      children: screen.children.map((child) => compactNode(child, options)),
    })),
  };

  // 블록이 없으면 통째로 뺍니다.
  if (
    project.blocks.events.length > 0 ||
    project.blocks.variables.length > 0
  ) {
    compact.blocks = project.blocks;
  }
  return compact;
}

function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function encodeProject(
  project: WebAppProject,
  options: CompactOptions = {},
) {
  return toBase64(JSON.stringify(compactProject(project, options)));
}

export function decodeProject(value: string) {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    return normalizeProject(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

/**
 * QR·공유 링크에 넣을 주소입니다. Vercel의 배포별 주소(해시·브랜치 주소)는
 * 로그인 보호가 걸려 있어 학생이 열면 로그인 화면이 뜹니다. 어떤 주소로
 * 접속해 만들었든 링크는 항상 공개 주소로 만들어지게 합니다.
 */
export function canonicalShareOrigin() {
  const production = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;
  return window.location.origin;
}
