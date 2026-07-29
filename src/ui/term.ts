/** 本文中の {{用語}} に、ホバー／フォーカスで短い定義を出す。 */

import { glossary } from '../content/glossary.ts';
import type { GlossaryEntry } from '../content/types.ts';
import { el, escapeHtml } from './dom.ts';

const byTerm = new Map<string, GlossaryEntry>(glossary.map((entry) => [entry.term, entry]));

export function hasTerm(term: string): boolean {
  return byTerm.has(term);
}

export function getTerm(term: string): GlossaryEntry | undefined {
  return byTerm.get(term);
}

let pop: HTMLElement | null = null;
let anchor: HTMLElement | null = null;

function ensurePop(): HTMLElement {
  if (!pop) {
    pop = el('div', { class: 'term-pop', role: 'tooltip', hidden: true });
    document.body.appendChild(pop);
  }
  return pop;
}

function hide(): void {
  if (!pop) return;
  pop.hidden = true;
  anchor = null;
}

function show(target: HTMLElement): void {
  const key = target.dataset.term;
  if (!key) return;
  const entry = byTerm.get(key);
  if (!entry) return;

  const node = ensurePop();
  anchor = target;
  node.innerHTML = '';
  node.appendChild(
    el(
      'span',
      { class: 'term-pop__name' },
      entry.term + (entry.reading ? `（${entry.reading}）` : ''),
    ),
  );
  node.appendChild(el('span', { html: escapeHtml(entry.def) }));
  if (entry.chapter) {
    node.appendChild(
      el(
        'a',
        { class: 'term-pop__more', href: `#/ch/${entry.chapter}` },
        'くわしくはこの章 →',
      ),
    );
  }
  node.hidden = false;

  // 画面からはみ出さない位置に置く
  const rect = target.getBoundingClientRect();
  const size = node.getBoundingClientRect();
  const margin = 8;
  let left = rect.left;
  if (left + size.width > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - size.width - margin);
  }
  const below = rect.bottom + margin;
  const top = below + size.height > window.innerHeight - margin ? rect.top - size.height - margin : below;

  node.style.left = `${Math.max(margin, left)}px`;
  node.style.top = `${Math.max(margin, top)}px`;
}

/** 一度だけ呼ぶ。以後、動的に差し替わる本文にも効く（イベント委譲）。 */
export function installTermPopovers(): void {
  const findTerm = (target: EventTarget | null): HTMLElement | null => {
    if (!(target instanceof Element)) return null;
    return target.closest<HTMLElement>('.term');
  };

  document.addEventListener('pointerover', (event) => {
    const term = findTerm(event.target);
    if (term && term !== anchor) show(term);
  });

  document.addEventListener('pointerout', (event) => {
    const term = findTerm(event.target);
    if (!term) return;
    const next = event.relatedTarget;
    if (next instanceof Node && pop?.contains(next)) return;
    hide();
  });

  // キーボード操作とタッチ操作
  document.addEventListener('focusin', (event) => {
    const term = findTerm(event.target);
    if (term) show(term);
    else if (!(event.target instanceof Node && pop?.contains(event.target))) hide();
  });

  document.addEventListener('click', (event) => {
    const term = findTerm(event.target);
    if (term) {
      event.preventDefault();
      if (term === anchor) hide();
      else show(term);
    } else if (!(event.target instanceof Node && pop?.contains(event.target))) {
      hide();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });

  window.addEventListener('scroll', hide, { passive: true });
  window.addEventListener('hashchange', hide);
}
