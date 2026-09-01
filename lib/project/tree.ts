/**
 * 부품 트리를 다루는 도구들입니다. 모두 새 트리를 돌려주고, 받은 트리는 고치지
 * 않습니다. 그래야 되돌리기가 예전 상태를 그대로 붙들고 있을 수 있습니다.
 */

import { REGISTRY, clonePropValue, specFor } from "../components/registry";
import type { ComponentNode, ComponentTypeId, Screen } from "./types";

/**
 * 배치 부품을 몇 겹까지 겹쳐 담을 수 있는지입니다. 이보다 깊은 부품은 밖에서
 * 들어온 설계를 정리할 때 버려지므로, 새로 놓을 때도 이 선을 넘지 않습니다.
 */
export const MAX_NEST_DEPTH = 8;

/** 트리에 있는 모든 부품을 위에서 아래 순서로 훑습니다. */
export function* walk(
  nodes: ComponentNode[],
  parent: ComponentNode | null = null,
): Generator<{ node: ComponentNode; parent: ComponentNode | null }> {
  for (const node of nodes) {
    yield { node, parent };
    if (node.children) yield* walk(node.children, node);
  }
}

export function findNode(nodes: ComponentNode[], id: string) {
  for (const { node } of walk(nodes)) {
    if (node.id === id) return node;
  }
  return null;
}

export function countOfType(nodes: ComponentNode[], type: ComponentTypeId) {
  let total = 0;
  for (const { node } of walk(nodes)) {
    if (node.type === type) total += 1;
  }
  return total;
}

/** 이미 쓰고 있는 이름을 피해 버튼1, 버튼2 … 를 지어 줍니다. */
export function nextName(nodes: ComponentNode[], type: ComponentTypeId) {
  const prefix = specFor(type).namePrefix;
  const taken = new Set<string>();
  for (const { node } of walk(nodes)) taken.add(node.name);
  let index = 1;
  while (taken.has(`${prefix}${index}`)) index += 1;
  return `${prefix}${index}`;
}

/** 트리 어디에도 겹치지 않는 짧은 아이디를 만듭니다. */
export function nextId(nodes: ComponentNode[], seed = "c") {
  const taken = new Set<string>();
  for (const { node } of walk(nodes)) taken.add(node.id);
  let index = 1;
  while (taken.has(`${seed}${index}`)) index += 1;
  return `${seed}${index}`;
}

export function createNode(
  nodes: ComponentNode[],
  type: ComponentTypeId,
): ComponentNode {
  const spec = specFor(type);
  const node: ComponentNode = {
    id: nextId(nodes),
    type,
    name: nextName(nodes, type),
    props: {},
  };
  if (spec.acceptsChildren) node.children = [];
  return node;
}

/** 한 화면에 더 놓을 수 있는 부품인지 봅니다. */
export function canAdd(nodes: ComponentNode[], type: ComponentTypeId) {
  const limit = specFor(type).maxPerScreen;
  return limit === undefined || countOfType(nodes, type) < limit;
}

type Location = { parentId: string | null; index: number };

function mapChildren(
  nodes: ComponentNode[],
  parentId: string | null,
  change: (children: ComponentNode[]) => ComponentNode[],
): ComponentNode[] {
  if (parentId === null) return change(nodes);
  return nodes.map((node) => {
    if (node.id === parentId && node.children) {
      return { ...node, children: change(node.children) };
    }
    if (!node.children) return node;
    return { ...node, children: mapChildren(node.children, parentId, change) };
  });
}

export function insertNode(
  nodes: ComponentNode[],
  node: ComponentNode,
  at: Location,
): ComponentNode[] {
  return mapChildren(nodes, at.parentId, (children) => {
    const next = [...children];
    const index = Math.max(0, Math.min(at.index, next.length));
    next.splice(index, 0, node);
    return next;
  });
}

export function removeNode(nodes: ComponentNode[], id: string): ComponentNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children ? { ...node, children: removeNode(node.children, id) } : node,
    );
}

export function updateNode(
  nodes: ComponentNode[],
  id: string,
  change: (node: ComponentNode) => ComponentNode,
): ComponentNode[] {
  return nodes.map((node) => {
    if (node.id === id) return change(node);
    if (!node.children) return node;
    return { ...node, children: updateNode(node.children, id, change) };
  });
}

/**
 * 화면 바로 아래에 놓인 부품이 0입니다. 배치 부품 안에 담길수록 한 칸씩
 * 깊어집니다. 트리에 없으면 -1입니다.
 */
export function depthOf(
  nodes: ComponentNode[],
  id: string,
  depth = 0,
): number {
  for (const node of nodes) {
    if (node.id === id) return depth;
    if (!node.children) continue;
    const found = depthOf(node.children, id, depth + 1);
    if (found >= 0) return found;
  }
  return -1;
}

export function locate(
  nodes: ComponentNode[],
  id: string,
  parentId: string | null = null,
): Location | null {
  const index = nodes.findIndex((node) => node.id === id);
  if (index >= 0) return { parentId, index };
  for (const node of nodes) {
    if (!node.children) continue;
    const found = locate(node.children, id, node.id);
    if (found) return found;
  }
  return null;
}

/**
 * 팔레트를 눌러서 부품을 놓을 자리입니다. 지금 고른 곳을 따라갑니다.
 *
 * 배치 부품을 골라 두었으면 그 안 맨 끝에, 배치 부품 안의 부품을 골라 두었으면
 * 그 부품 바로 뒤에 놓습니다. 그 밖에는 화면 맨 끝입니다. 태블릿에서는 끌어
 * 놓기가 아예 안 되므로, 눌러서도 배치 부품을 채울 수 있어야 합니다.
 */
export function placeNear(nodes: ComponentNode[], selectedId: string): Location {
  const end: Location = { parentId: null, index: nodes.length };
  const node = selectedId ? findNode(nodes, selectedId) : null;
  if (!node) return end;

  if (acceptsChildren(node)) {
    // 너무 깊이 겹친 부품은 설계를 정리할 때 통째로 버려집니다.
    if (depthOf(nodes, node.id) + 1 > MAX_NEST_DEPTH) return end;
    return { parentId: node.id, index: node.children?.length ?? 0 };
  }

  const at = locate(nodes, selectedId);
  return at?.parentId ? { parentId: at.parentId, index: at.index + 1 } : end;
}

/** 어떤 부품을 자기 자신이나 자기 안쪽으로 옮기면 트리가 끊깁니다. */
export function isInside(
  nodes: ComponentNode[],
  outerId: string,
  innerId: string,
) {
  const outer = findNode(nodes, outerId);
  if (!outer?.children) return false;
  for (const { node } of walk(outer.children)) {
    if (node.id === innerId) return true;
  }
  return false;
}

export function moveNode(
  nodes: ComponentNode[],
  id: string,
  to: Location,
): ComponentNode[] {
  if (id === to.parentId || isInside(nodes, id, to.parentId ?? "")) return nodes;
  const node = findNode(nodes, id);
  if (!node) return nodes;

  const from = locate(nodes, id);
  const without = removeNode(nodes, id);
  // 같은 줄 안에서 위로 끌어올릴 때 자기 자리를 빼고 세면 한 칸씩 밀립니다.
  const shift =
    from && from.parentId === to.parentId && from.index < to.index ? 1 : 0;
  return insertNode(without, node, { ...to, index: to.index - shift });
}

/** 부품과 그 안쪽까지 통째로 복제합니다. 아이디와 이름은 새로 짓습니다. */
export function duplicateNode(
  nodes: ComponentNode[],
  id: string,
): { nodes: ComponentNode[]; created: ComponentNode | null } {
  const source = findNode(nodes, id);
  const at = locate(nodes, id);
  if (!source || !at) return { nodes, created: null };

  let working = nodes;
  const copy = (node: ComponentNode): ComponentNode => {
    const next: ComponentNode = {
      id: nextId(working, "c"),
      type: node.type,
      name: nextName(working, node.type),
      props: Object.fromEntries(
        Object.entries(node.props).map(([key, value]) => [
          key,
          clonePropValue(value),
        ]),
      ),
    };
    // 이름과 아이디가 겹치지 않도록, 만든 마디를 바로 장부에 올립니다.
    working = [...working, next];
    if (node.children) next.children = node.children.map(copy);
    return next;
  };

  const created = copy(source);
  return {
    nodes: insertNode(nodes, created, { ...at, index: at.index + 1 }),
    created,
  };
}

export function screenOf(screens: Screen[], id: string) {
  return screens.find((screen) => screen.id === id) ?? screens[0];
}

/** 트리에 실제로 있는 부품 아이디만 모읍니다. 블록이 가리키는 곳을 확인할 때 씁니다. */
export function nodeIndex(nodes: ComponentNode[]) {
  const index: Record<string, ComponentNode> = {};
  for (const { node } of walk(nodes)) index[node.id] = node;
  return index;
}

export function acceptsChildren(node: ComponentNode) {
  return REGISTRY[node.type].acceptsChildren;
}
