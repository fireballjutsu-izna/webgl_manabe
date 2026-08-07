/**
 * 演習ページ。全章の演習を 1 か所に集める。
 *
 * 演習は章の末尾にあるが、そこにあるということは**読み進めながらでないと触れない**ということ。
 * 「演習だけやる」「前の部を復習する」ができなかったので、入口を分けた。
 *
 *   #/drill              … 一覧。部で絞り込める
 *   #/drill/ch/<slug>    … その章の演習だけ
 *   #/drill/run/<part>   … 1 問ずつ通しで解く（part は 'all' も可）
 */

import { chapterLabel, chapters, PARTS, partInfo } from '../../content/index.ts';
import type { Chapter, Exercise, Part } from '../../content/types.ts';
import { el } from '../../ui/dom.ts';
import { createExerciseItem } from '../../ui/exercise.ts';
import { countExercisesDone, isExerciseDone, onProgressChange } from '../progress.ts';
import type { PageRenderer } from '../router.ts';

interface Item {
  chapter: Chapter;
  exercise: Exercise;
  /** 章の中での番号（0 起点）。「解いた」印の保存先になる。 */
  index: number;
}

function allItems(): Item[] {
  const items: Item[] = [];
  for (const chapter of chapters) {
    for (const [index, exercise] of (chapter.exercises ?? []).entries()) {
      items.push({ chapter, exercise, index });
    }
  }
  return items;
}

/** その問題がどの章のものかを示す小さな行。 */
function sourceLine(chapter: Chapter): HTMLElement {
  return el(
    'div',
    { class: 'ex__source' },
    el(
      'a',
      { href: `#/ch/${chapter.slug}` },
      `${chapterLabel(chapter)}　${chapter.title}`,
    ),
  );
}

/* ---- 通しで解く ---- */

function renderRun(root: HTMLElement, part: string): void {
  const scope = part === 'all' ? null : (part as Part);
  const all = allItems().filter((item) => scope === null || item.chapter.part === scope);
  const title = scope === null ? '全部' : partInfo(scope).title;

  document.title = `演習を通しで解く｜(アイン、ソフ、オウル)`;

  root.appendChild(el('h1', { class: 'page-title page-title--wide' }, `通しで解く ― ${title}`));

  if (all.length === 0) {
    root.appendChild(el('p', { class: 'lede lede--wide' }, 'この範囲に演習はありません。'));
    return;
  }

  // 「まだ解いていない問だけ」に絞れるようにする。復習で効く
  // 既定は「解いていない問だけ」。問数が増えるほど、解いた問を毎回めくるのは苦行になる
  let onlyUndone = true;
  let at = 0;

  const stage = el('div', { class: 'drill-run' });
  const position = el('span', { class: 'drill-run__pos' });
  const prev = el('button', { class: 'btn', type: 'button' }, '← 前へ');
  const next = el('button', { class: 'btn btn--primary', type: 'button' }, '次へ →');

  const filterButton = el('button', { class: 'chip', type: 'button' });

  const visible = (): Item[] =>
    onlyUndone ? all.filter((i) => !isExerciseDone(i.chapter.slug, i.index)) : all;

  const draw = (): void => {
    const list = visible();
    // 押したら何が起きるかを書く。状態だけ書くと、押せることが伝わらない
    filterButton.textContent = onlyUndone ? 'すべての問を出す' : '解いていない問だけ出す';
    filterButton.setAttribute('aria-pressed', String(onlyUndone));

    if (list.length === 0) {
      position.textContent = '0 / 0';
      stage.replaceChildren(
        el(
          'p',
          { class: 'lede' },
          'この範囲の演習は、すべて「解いた」印が付いています。おつかれさまでした。',
        ),
      );
      prev.disabled = true;
      next.disabled = true;
      return;
    }

    at = Math.min(at, list.length - 1);
    const item = list[at]!;
    position.textContent = `${at + 1} / ${list.length}`;
    prev.disabled = at === 0;
    next.disabled = at === list.length - 1;

    stage.replaceChildren(
      createExerciseItem(item.exercise, {
        label: String(item.index + 1),
        mark: { slug: item.chapter.slug, index: item.index },
        source: sourceLine(item.chapter),
      }),
    );
  };

  prev.addEventListener('click', () => {
    at = Math.max(0, at - 1);
    draw();
  });
  next.addEventListener('click', () => {
    at += 1;
    draw();
  });
  filterButton.addEventListener('click', () => {
    onlyUndone = !onlyUndone;
    at = 0;
    draw();
  });

  root.appendChild(
    el(
      'div',
      { class: 'drill-head' },
      el('a', { class: 'chip', href: '#/drill' }, '← 一覧へ'),
      filterButton,
      position,
    ),
  );

  root.appendChild(el('div', { class: 'drill-run__card exercise' }, stage));

  root.appendChild(
    el('div', { class: 'drill-run__nav' }, prev, next),
  );

  draw();
}

/* ---- 一覧 ---- */

function renderList(root: HTMLElement, onlySlug: string | undefined): void {
  document.title = '演習｜(アイン、ソフ、オウル)';

  const all = allItems();
  const focused = onlySlug ? all.filter((i) => i.chapter.slug === onlySlug) : all;

  root.appendChild(el('h1', { class: 'page-title page-title--wide' }, '演習'));
  root.appendChild(
    el(
      'p',
      { class: 'lede lede--wide' },
      '全章の演習をここに集めてあります。答え合わせはしません。「解いた」は自分のためのしおりで、章の読了進捗とは別に数えています。',
    ),
  );

  /* 進み具合と、通しで解く入口 */

  const partChips = el('div', { class: 'drill-parts' });
  const list = el('div', { class: 'drill-list' });
  let scope: Part | 'all' = 'all';

  /** いま並べるべき問。部で絞られていれば、その部だけ。 */
  const inScope = (): Item[] =>
    scope === 'all' ? focused : focused.filter((i) => i.chapter.part === scope);

  const summary = el('p', { class: 'lede lede--wide drill-count' });
  const syncSummary = (): void => {
    const items = inScope();
    const done = items.filter((i) => isExerciseDone(i.chapter.slug, i.index)).length;
    summary.textContent = `${done} / ${items.length} 問`;
  };

  const startSection = (chapter: Chapter): HTMLElement =>
    el(
      'section',
      { class: 'drill-ch' },
      el(
        'h2',
        { class: 'drill-ch__title' },
        el('a', { href: `#/ch/${chapter.slug}` }, `${chapterLabel(chapter)}　${chapter.title}`),
      ),
    );

  /*
   * 部を選び直したら、並んでいるものを作り直す。
   *
   * 以前は section を hidden にして隠していたが、それだと全章ぶんの DOM が残り続ける。
   * 195 章・585 問の時点で 10 万ノード・10 万 px を超えていて、
   * 絞り込んでも軽くならなかった。作り直せば、見えているぶんしか持たない。
   */
  const buildList = (): void => {
    const next = document.createDocumentFragment();
    let current: { slug: string; node: HTMLElement } | null = null;

    for (const item of inScope()) {
      if (current === null || current.slug !== item.chapter.slug) {
        const section = startSection(item.chapter);
        current = { slug: item.chapter.slug, node: section };
        next.appendChild(section);
      }

      current.node.appendChild(
        createExerciseItem(item.exercise, {
          label: String(item.index + 1),
          mark: { slug: item.chapter.slug, index: item.index },
        }),
      );
    }

    list.replaceChildren(next);
  };

  const applyScope = (): void => {
    for (const chip of partChips.querySelectorAll('button')) {
      chip.setAttribute('aria-pressed', String(chip.dataset.part === scope));
    }
    const run = root.querySelector<HTMLAnchorElement>('.drill-run-link');
    if (run) run.href = `#/drill/run/${scope}`;
    buildList();
    syncSummary();
  };

  for (const [id, label] of [['all', 'すべて'], ...PARTS.map((p) => [p.id, p.title.replace(/　/, ' ')])] as [
    string,
    string,
  ][]) {
    const chip = el('button', { class: 'chip', type: 'button' }, label);
    chip.dataset.part = id;
    chip.addEventListener('click', () => {
      scope = id as Part | 'all';
      applyScope();
    });
    partChips.appendChild(chip);
  }

  const runLink = el(
    'a',
    { class: 'btn btn--primary drill-run-link', href: '#/drill/run/all' },
    '通しで解く →',
  );

  if (onlySlug) {
    root.appendChild(
      el('div', { class: 'drill-head' }, el('a', { class: 'chip', href: '#/drill' }, '← 全部の演習へ'), summary),
    );
  } else {
    root.appendChild(el('div', { class: 'drill-head' }, partChips, summary, runLink));
  }

  /* 章ごとに並べる */

  root.appendChild(list);
  buildList();
  syncSummary();
  if (!onlySlug) applyScope();

  // 「解いた」を押すたびに、上の数字を合わせる
  const stop = onProgressChange(syncSummary);
  root.addEventListener('drill:teardown', stop, { once: true });
}

export const renderDrillPage: PageRenderer = (root, ctx) => {
  const mode = ctx.segments[1];

  if (mode === 'run') {
    renderRun(root, ctx.segments[2] ?? 'all');
  } else if (mode === 'ch') {
    renderList(root, ctx.segments[2]);
  } else {
    renderList(root, undefined);
  }

  return () => {
    root.dispatchEvent(new Event('drill:teardown'));
  };
};

/** ヘッダーやホームから「演習の進み具合」を出すために使う。 */
export function exerciseTotals(): { done: number; total: number } {
  return { done: countExercisesDone(), total: allItems().length };
}
