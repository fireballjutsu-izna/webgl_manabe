/**
 * 前提知識マップ。章の requires をそのまま辺にした階層グラフ。
 * グラフ描画ライブラリは使わず、「依存の深さ＝列」で段組みするだけの自前レイアウト。
 */

import { chapterLabel, chapters, PARTS } from '../../content/index.ts';
import type { Chapter, Part } from '../../content/types.ts';
import { el, svgEl } from '../../ui/dom.ts';
import { getProgress } from '../progress.ts';
import type { PageRenderer } from '../router.ts';

const NODE_W = 168;
const NODE_H = 46;
const COL_GAP = 232;
const ROW_GAP = 64;
const PAD = 16;

function computeDepths(list: Chapter[]): Map<string, number> {
  const depth = new Map<string, number>();
  const bySlug = new Map(list.map((c) => [c.slug, c]));

  const walk = (slug: string, seen: Set<string>): number => {
    const cached = depth.get(slug);
    if (cached !== undefined) return cached;
    if (seen.has(slug)) return 0; // 循環していても止まるようにする
    seen.add(slug);

    const chapter = bySlug.get(slug);
    // 表示対象の外にある前提は、深さの計算では無視する
    const requires = (chapter?.requires ?? []).filter((r) => bySlug.has(r));
    const value =
      requires.length === 0 ? 0 : Math.max(...requires.map((r) => walk(r, seen) + 1));
    depth.set(slug, value);
    return value;
  };

  for (const chapter of list) walk(chapter.slug, new Set());
  return depth;
}

function buildGraph(list: Chapter[]): SVGElement {
  const depths = computeDepths(list);
  const rows = new Map<number, number>();
  const pos = new Map<string, { x: number; y: number }>();
  const visible = new Set(list.map((c) => c.slug));

  for (const chapter of list) {
    const column = depths.get(chapter.slug) ?? 0;
    const row = rows.get(column) ?? 0;
    rows.set(column, row + 1);
    pos.set(chapter.slug, {
      x: PAD + column * COL_GAP,
      y: PAD + row * (NODE_H + ROW_GAP),
    });
  }

  const columns = Math.max(...depths.values(), 0) + 1;
  const maxRows = Math.max(...rows.values(), 1);
  const width = PAD * 2 + (columns - 1) * COL_GAP + NODE_W;
  const height = PAD * 2 + maxRows * (NODE_H + ROW_GAP) - ROW_GAP;

  const svg = svgEl('svg', {
    class: 'map-svg',
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    role: 'img',
    'aria-label': '章の前提関係を表した図',
  });

  const marker = svgEl(
    'marker',
    {
      id: 'map-arrow',
      viewBox: '0 0 10 10',
      refX: '9',
      refY: '5',
      markerWidth: '7',
      markerHeight: '7',
      orient: 'auto-start-reverse',
    },
    // marker の中では currentColor が参照元から継承されないので、色を直接指定する
    svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: 'var(--border-lit)' }),
  );
  svg.appendChild(svgEl('defs', {}, marker));

  // 辺を先に描いて、ノードの下に潜らせる
  const edgeLayer = svgEl('g', { color: 'var(--border-lit)' });
  for (const chapter of list) {
    const to = pos.get(chapter.slug);
    if (!to) continue;
    for (const required of chapter.requires) {
      if (!visible.has(required)) continue;
      const from = pos.get(required);
      if (!from) continue;
      const x1 = from.x + NODE_W;
      const y1 = from.y + NODE_H / 2;
      // 矢じりが箱の枠に重なって見えなくなるので、少し手前で止める
      const x2 = to.x - 7;
      const y2 = to.y + NODE_H / 2;
      const mid = (x1 + x2) / 2;
      edgeLayer.appendChild(
        svgEl('path', {
          class: 'map-edge',
          d: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`,
        }),
      );
    }
  }
  svg.appendChild(edgeLayer);

  for (const chapter of list) {
    const at = pos.get(chapter.slug);
    if (!at) continue;
    const done = getProgress(chapter.slug).read;

    const node = svgEl('a', {
      class: 'map-node',
      href: `#/ch/${chapter.slug}`,
      'data-done': String(done),
    });
    node.appendChild(svgEl('rect', { x: at.x, y: at.y, width: NODE_W, height: NODE_H }));
    node.appendChild(
      svgEl(
        'text',
        { class: 'map-node__num', x: at.x + 10, y: at.y + 17 },
        `${chapterLabel(chapter)}${done ? '  ✓' : ''}`,
      ),
    );
    // 「内積 ― 角度を測る」のような副題つきの見出しは、箱に収まる前半だけを出す
    const shortTitle = chapter.title.split(' ― ')[0] ?? chapter.title;
    node.appendChild(svgEl('text', { x: at.x + 10, y: at.y + 34 }, shortTitle));
    node.appendChild(svgEl('title', {}, chapter.title));
    svg.appendChild(node);
  }

  return svg;
}

export const renderMapPage: PageRenderer = (root) => {
  document.title = '前提知識マップ｜(アイン、ソフ、オウル)';

  root.appendChild(el('h1', { class: 'page-title' }, '前提知識マップ'));
  root.appendChild(
    el(
      'p',
      { class: 'lede' },
      '矢印は「これを先に読んでおくと分かる」という向きです。上から順に読めば矢印は自然に満たされますが、' +
        '特定の章だけ必要になったときは、この図をたどって寄り道の量を見積もってください。' +
        '図は右側に続いています（横にスクロールできます）。',
    ),
  );

  const wrap = el('div', { class: 'map-wrap' });

  const filters: { id: 'all' | Part; label: string }[] = [
    { id: 'all', label: '全体' },
    ...PARTS.map((part) => ({ id: part.id, label: part.title.replace(/　.*$/, '') })),
  ];

  const buttons = new Map<string, HTMLButtonElement>();
  const show = (id: 'all' | Part): void => {
    const list = id === 'all' ? chapters : chapters.filter((c) => c.part === id);
    wrap.replaceChildren(buildGraph(list));
    for (const [key, button] of buttons) {
      button.setAttribute('aria-pressed', String(key === id));
      button.classList.toggle('btn--primary', key === id);
    }
  };

  const bar = el('div', { class: 'map-filter', role: 'group', 'aria-label': '表示する範囲' });
  for (const filter of filters) {
    const button = el('button', { class: 'btn', type: 'button' }, filter.label);
    button.addEventListener('click', () => show(filter.id));
    buttons.set(filter.id, button);
    bar.appendChild(button);
  }

  root.appendChild(bar);
  root.appendChild(wrap);
  show('all');
};
