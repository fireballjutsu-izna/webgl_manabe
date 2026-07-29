/** Three.js のコード片。表示とコピーだけを行う（その場で編集はしない）。 */

import { el, escapeHtml } from './dom.ts';

const KEYWORDS = [
  'const', 'let', 'var', 'function', 'return', 'new', 'class', 'extends', 'import', 'from',
  'export', 'default', 'if', 'else', 'for', 'while', 'do', 'of', 'in', 'typeof', 'instanceof',
  'await', 'async', 'null', 'undefined', 'true', 'false', 'this', 'void', 'break', 'continue',
];

// 依存を増やさないための最小のトークナイザ。
// 順番が意味を持つ: コメント → 文字列 → 数値 → 予約語 → 大文字始まりの識別子 → 呼び出し名
const TOKEN = new RegExp(
  [
    '(//[^\\n]*|/\\*[\\s\\S]*?\\*/)',
    "('(?:[^'\\\\\\n]|\\\\.)*'|\"(?:[^\"\\\\\\n]|\\\\.)*\"|`(?:[^`\\\\]|\\\\.)*`)",
    '(\\b\\d+(?:\\.\\d+)?\\b)',
    `\\b(${KEYWORDS.join('|')})\\b`,
    '\\b([A-Z][A-Za-z0-9_]*)\\b',
    '\\b([a-zA-Z_$][\\w$]*)(?=\\s*\\()',
  ].join('|'),
  'g',
);

export function highlight(code: string): string {
  let out = '';
  let last = 0;

  for (const match of code.matchAll(TOKEN)) {
    const index = match.index;
    out += escapeHtml(code.slice(last, index));
    const [raw, comment, str, num, keyword, cls, fn] = match;

    if (comment) out += `<span class="tok-com">${escapeHtml(comment)}</span>`;
    else if (str) out += `<span class="tok-str">${escapeHtml(str)}</span>`;
    else if (num) out += `<span class="tok-num">${num}</span>`;
    else if (keyword) out += `<span class="tok-key">${keyword}</span>`;
    else if (cls) out += `<span class="tok-cls">${cls}</span>`;
    else if (fn) out += `<span class="tok-fn">${fn}</span>`;

    last = index + raw.length;
  }

  return out + escapeHtml(code.slice(last));
}

export function createCodeBlock(code: string, title?: string): HTMLElement {
  const source = code.trim();

  const copy = el('button', { class: 'code__copy', type: 'button' }, 'コピー');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(source);
    } catch {
      // 権限がない環境向けのフォールバック
      const ta = el('textarea', { style: 'position:fixed;opacity:0' });
      ta.value = source;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    copy.textContent = 'コピーしました';
    copy.dataset.done = 'true';
    setTimeout(() => {
      copy.textContent = 'コピー';
      delete copy.dataset.done;
    }, 1600);
  });

  return el(
    'div',
    { class: 'code' },
    el(
      'div',
      { class: 'code__head' },
      el('span', { class: 'code__title' }, title ?? 'Three.js'),
      copy,
    ),
    el('pre', null, el('code', { html: highlight(source) })),
  );
}
