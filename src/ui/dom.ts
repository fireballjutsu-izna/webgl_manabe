/** DOM を組み立てるための最小限のヘルパー。フレームワークは使わない。 */

export type Child = Node | string | number | null | undefined | false;

type AttrValue = string | number | boolean | null | undefined | EventListener;

/**
 * 要素を作る。
 *   el('a', { class: 'btn', href: '#/' }, 'トップへ')
 *   el('button', { onclick: () => ... }, '押す')
 * 属性名が 'on' で始まる場合はイベントリスナ、'html' の場合は innerHTML として扱う。
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, AttrValue> | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      if (key.startsWith('on') && typeof value === 'function') {
        node.addEventListener(key.slice(2), value as EventListener);
      } else if (key === 'html') {
        node.innerHTML = String(value);
      } else if (value === true) {
        node.setAttribute(key, '');
      } else {
        node.setAttribute(key, String(value));
      }
    }
  }
  append(node, children);
  return node;
}

export function append(parent: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }
}

/** SVG 要素版。 */
export function svgEl(
  tag: string,
  attrs?: Record<string, string | number | null | undefined>,
  ...children: (Node | string)[]
): SVGElement {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined) continue;
      node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** HTML に流し込む前に必ず通す。 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** CSS 変数の実効値を取り出す（3D 側にテーマ色を渡すのに使う）。 */
export function cssVar(name: string, fallback = '#ffffff'): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
