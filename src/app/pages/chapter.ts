/** 章の描画。本文・数式・デモ・コード片・クイズを 1 つのデータから組み立てる。 */

import { chapters, chapterBySlug } from '../../content/index.ts';
import type { Block, Chapter } from '../../content/types.ts';
import { demos } from '../../demos/registry.ts';
import type { DemoInstance } from '../../demos/registry.ts';
import { el } from '../../ui/dom.ts';
import { createCodeBlock } from '../../ui/code.ts';
import { renderMarkup, renderTex } from '../../ui/markup.ts';
import { createQuiz } from '../../ui/quiz.ts';
import { getProgress, setRead } from '../progress.ts';
import type { PageRenderer } from '../router.ts';

function formulaBlock(tex: string, readAloud: string): HTMLElement {
  return el(
    'div',
    { class: 'formula' },
    el('div', { class: 'formula__tex', html: renderTex(tex, true) }),
    el(
      'p',
      { class: 'formula__read' },
      el('b', null, '日本語で言うと'),
      readAloud,
    ),
  );
}

const CALLOUT_ICON: Record<string, string> = {
  tip: 'TIP',
  warn: '注意',
  analogy: 'たとえ',
};

function calloutBlock(tone: string, title: string, text: string): HTMLElement {
  return el(
    'aside',
    { class: 'callout', 'data-tone': tone },
    el(
      'div',
      { class: 'callout__title' },
      el('span', { class: 'callout__icon' }, CALLOUT_ICON[tone] ?? 'MEMO'),
      title,
    ),
    el('div', { class: 'callout__body', html: renderMarkup(text) }),
  );
}

function chapterNav(chapter: Chapter): HTMLElement {
  const index = chapters.findIndex((c) => c.slug === chapter.slug);
  const prev = chapters[index - 1];
  const next = chapters[index + 1];

  const nav = el('nav', { class: 'chapter-nav', 'aria-label': '前後の章' });
  if (prev) {
    nav.appendChild(
      el(
        'a',
        { class: 'prev', href: `#/ch/${prev.slug}` },
        el('span', null, '← 前の章'),
        prev.title,
      ),
    );
  }
  if (next) {
    nav.appendChild(
      el(
        'a',
        { class: 'next', href: `#/ch/${next.slug}` },
        el('span', null, '次の章 →'),
        next.title,
      ),
    );
  }
  return nav;
}

export const renderChapterPage: PageRenderer = (root, ctx) => {
  const slug = ctx.segments[1] ?? '';
  const chapter = chapterBySlug(slug);

  if (!chapter) {
    root.appendChild(
      el(
        'div',
        { class: 'notfound' },
        el('h1', { class: 'page-title' }, 'その章は見つかりませんでした'),
        el('p', null, el('a', { href: '#/' }, 'トップへ戻る')),
      ),
    );
    return;
  }

  document.title = `${chapter.title}｜(アイン、ソフ、オウル)`;

  const article = el('article', { class: 'chapter-article' });

  article.appendChild(
    el(
      'header',
      { class: 'chapter-head' },
      el('div', { class: 'chapter-head__num' }, `CH.${String(chapter.number).padStart(2, '0')}`),
      el('h1', { class: 'chapter-head__title' }, chapter.title),
      el(
        'div',
        { class: 'chapter-head__goal' },
        el('b', null, 'この章を読むとできること'),
        chapter.goal,
      ),
    ),
  );

  /* ---- 本文ブロック ---- */

  const instances: DemoInstance[] = [];
  let cancelled = false;
  let prose: HTMLElement | null = null;

  const intoProse = (node: Node): void => {
    prose ??= (() => {
      const created = el('div', { class: 'prose' });
      article.appendChild(created);
      return created;
    })();
    prose.appendChild(node);
  };

  const breakProse = (): void => {
    prose = null;
  };

  const mountDemo = (block: Extract<Block, { kind: 'demo' }>): void => {
    const card = el('div', { class: 'demo' });
    const loading = el(
      'div',
      { class: 'demo__stage' },
      el('p', { class: 'demo__hint' }, 'デモを読み込んでいます…'),
    );
    card.appendChild(loading);
    article.appendChild(card);

    const loader = demos[block.id];
    if (!loader) {
      loading.replaceChildren(el('p', { class: 'demo__hint' }, `デモ ${block.id} は未登録です`));
      return;
    }

    void loader()
      .then((module) => {
        if (cancelled) return;
        loading.remove();
        instances.push(module.mount(card));
        if (block.caption) {
          card.appendChild(el('p', { class: 'demo__caption' }, block.caption));
        }
      })
      .catch((error: unknown) => {
        console.error(`デモ ${block.id} の読み込みに失敗しました`, error);
        if (!cancelled) {
          loading.replaceChildren(
            el('p', { class: 'demo__hint' }, 'このデモは表示できませんでした'),
          );
        }
      });
  };

  for (const block of chapter.blocks) {
    switch (block.kind) {
      case 'md': {
        // 見出しや段落を .prose の直下に置く（あいだの余白は .prose > * + * が付ける）
        const holder = el('div', { html: renderMarkup(block.text) });
        for (const node of Array.from(holder.childNodes)) intoProse(node);
        break;
      }
      case 'formula':
        intoProse(formulaBlock(block.tex, block.readAloud));
        break;
      case 'callout':
        intoProse(calloutBlock(block.tone, block.title, block.text));
        break;
      case 'demo':
        breakProse();
        mountDemo(block);
        break;
      case 'code':
        breakProse();
        article.appendChild(createCodeBlock(block.code, block.title));
        break;
    }
  }

  /* ---- 章末 ---- */

  if (chapter.threeApis.length > 0) {
    article.appendChild(
      el(
        'section',
        { class: 'api-table' },
        el('div', { class: 'api-table__head' }, 'この章に対応する Three.js の API'),
        el(
          'ul',
          { class: 'api-table__list' },
          ...chapter.threeApis.map((api) => el('li', null, el('code', { class: 'api-chip' }, api))),
        ),
      ),
    );
  }

  if (chapter.quiz.length > 0) {
    article.appendChild(createQuiz(chapter.slug, chapter.quiz));
  }

  const readButton = el('button', { class: 'btn', type: 'button' });
  const syncReadButton = (): void => {
    const read = getProgress(chapter.slug).read;
    readButton.textContent = read ? '✓ 読み終えた章' : 'この章を読み終えた';
    readButton.classList.toggle('btn--primary', read);
    readButton.setAttribute('aria-pressed', String(read));
  };
  readButton.addEventListener('click', () => {
    setRead(chapter.slug, !getProgress(chapter.slug).read);
    syncReadButton();
  });
  syncReadButton();

  article.appendChild(
    el(
      'div',
      { class: 'done-bar' },
      readButton,
      el('span', { class: 'lede' }, '進捗はこの端末のブラウザにだけ保存されます。'),
    ),
  );

  article.appendChild(chapterNav(chapter));
  root.appendChild(article);

  return () => {
    cancelled = true;
    for (const instance of instances) instance.dispose();
    instances.length = 0;
  };
};
