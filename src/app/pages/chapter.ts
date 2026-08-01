/** 章の描画。本文・数式・デモ・コード片・クイズを 1 つのデータから組み立てる。 */

import { chapterBySlug, chapterLabel, chapters, partInfo } from '../../content/index.ts';
import { docsUrl } from '../../content/three-docs.ts';
import type { Block, Chapter, WorkedExample } from '../../content/types.ts';
import { demos } from '../../demos/registry.ts';
import { el } from '../../ui/dom.ts';
import { createCodeBlock } from '../../ui/code.ts';
import { createExercises } from '../../ui/exercise.ts';
import { renderMarkup, renderTex } from '../../ui/markup.ts';
import { createQuiz } from '../../ui/quiz.ts';
import { getProgress, setRead } from '../progress.ts';
import type { PageRenderer } from '../router.ts';

/**
 * 「実際に計算してみる」。折りたたまない ―
 * これがいちばん必要な人は、開いて見ようとは思わないため。
 */
function workedBlock(worked: WorkedExample): HTMLElement {
  const steps = el('ol', { class: 'worked__steps' });
  for (const step of worked.steps) {
    steps.appendChild(
      el(
        'li',
        null,
        el('code', { class: 'worked__calc' }, step.calc),
        step.note ? el('span', { class: 'worked__note' }, step.note) : null,
      ),
    );
  }

  return el(
    'div',
    { class: 'worked' },
    el('div', { class: 'worked__head' }, '実際に計算してみる'),
    el('p', { class: 'worked__given', html: renderMarkup(worked.given) }),
    steps,
    el('p', { class: 'worked__result', html: renderMarkup(worked.result) }),
  );
}

function formulaBlock(block: Extract<Block, { kind: 'formula' }>): HTMLElement {
  return el(
    'div',
    { class: 'formula' },
    el('div', { class: 'formula__tex', html: renderTex(block.tex, true) }),
    el(
      'p',
      { class: 'formula__read' },
      el('b', null, '日本語で言うと'),
      block.readAloud,
    ),
    block.worked ? workedBlock(block.worked) : null,
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

const RECALL_HEAD: Record<string, string> = {
  math: 'この章の前に読んでおく章',
  threejs: 'この章で使う数学',
  project: 'この章で使う道具',
  polish: 'この章で使う道具',
};

/**
 * 章の冒頭に出す呼び戻し。詰まったときにどこへ戻ればよいかを示す。
 *
 * 第2部より後は `mathRecall` に「何のために戻るのか」まで書いてある。
 * 第1部にはそれが無いが、`requires` は持っているので、そこから作る ―
 * **戻り先が画面に出ていない章を 1 つも残さない**ほうが、独学では効く。
 */
function mathRecallCard(chapter: Chapter): HTMLElement | null {
  const items =
    chapter.mathRecall && chapter.mathRecall.length > 0
      ? chapter.mathRecall
      : chapter.requires.map((slug) => ({ slug, note: '' }));

  if (items.length === 0) return null;

  const list = el('ul', { class: 'recall__list' });
  for (const item of items) {
    const target = chapterBySlug(item.slug);
    if (!target) continue;
    list.appendChild(
      el(
        'li',
        null,
        el(
          'a',
          { href: `#/ch/${target.slug}` },
          `${chapterLabel(target)} ${target.title}`,
        ),
        item.note ? el('span', { class: 'recall__note' }, `― ${item.note}`) : null,
      ),
    );
  }

  if (list.childElementCount === 0) return null;

  return el(
    'aside',
    { class: 'recall' },
    el('div', { class: 'recall__head' }, RECALL_HEAD[chapter.part] ?? 'この章で使う道具'),
    list,
    el(
      'p',
      { class: 'recall__foot' },
      'いま思い出せなくても大丈夫です。詰まったら戻ってきてください。',
    ),
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
        el('span', null, `← 前の章　${chapterLabel(prev)}`),
        prev.title,
      ),
    );
  }
  if (next) {
    nav.appendChild(
      el(
        'a',
        { class: 'next', href: `#/ch/${next.slug}` },
        el('span', null, `次の章　${chapterLabel(next)} →`),
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
      el(
        'div',
        { class: 'chapter-head__num' },
        `${partInfo(chapter.part).title.replace(/　.*$/, '')}　${chapterLabel(chapter)}`,
      ),
      el('h1', { class: 'chapter-head__title' }, chapter.title),
      el(
        'div',
        { class: 'chapter-head__goal' },
        el('b', null, 'この章を読むとできること'),
        chapter.goal,
      ),
    ),
  );

  const recall = mathRecallCard(chapter);
  if (recall) article.appendChild(recall);

  /* ---- 本文ブロック ---- */

  // デモとサンドボックスはどちらも WebGL を掴むので、離脱時にまとめて解放する
  const instances: { dispose(): void }[] = [];
  let cancelled = false;
  let sandboxCount = 0;
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
          card.appendChild(
            el('p', { class: 'demo__caption', html: renderMarkup(block.caption) }),
          );
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

  const mountSandbox = (block: Extract<Block, { kind: 'sandbox' }>): void => {
    const index = sandboxCount;
    sandboxCount += 1;

    const placeholder = el(
      'div',
      { class: 'sandbox' },
      el('div', { class: 'sandbox__stage' }, el('p', { class: 'demo__hint' }, '準備しています…')),
    );
    article.appendChild(placeholder);

    // three と addons を含むので、第2部の章を開いたときだけ読み込む
    void import('../../ui/sandbox.ts')
      .then(({ createSandbox }) => {
        if (cancelled) return;
        const sandbox = createSandbox({
          code: block.code,
          title: block.title,
          storageKey: `${chapter.slug}:${index}`,
          focus: block.guide?.focus,
        });
        instances.push(sandbox);
        placeholder.replaceWith(sandbox.element);
        if (block.caption) {
          sandbox.element.insertAdjacentElement(
            'afterend',
            el('p', {
              class: 'demo__caption sandbox__caption',
              html: renderMarkup(block.caption),
            }),
          );
        }
      })
      .catch((error: unknown) => {
        console.error('サンドボックスの読み込みに失敗しました', error);
        if (!cancelled) {
          placeholder.replaceChildren(
            el('div', { class: 'sandbox__stage' }, el('p', { class: 'demo__hint' }, '実行環境を用意できませんでした')),
            createCodeBlock(block.code, block.title),
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
        intoProse(formulaBlock(block));
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
      case 'sandbox':
        breakProse();
        mountSandbox(block);
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
          ...chapter.threeApis.map((api) => {
            const href = docsUrl(api);
            // 公式ドキュメントに項目があるものだけリンクにする
            const chip = href
              ? el(
                  'a',
                  {
                    class: 'api-chip api-chip--link',
                    href,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    title: `${api} の公式ドキュメント（英語）を開く`,
                  },
                  api,
                )
              : el('code', { class: 'api-chip' }, api);
            return el('li', null, chip);
          }),
        ),
        el(
          'p',
          { class: 'api-table__note' },
          '下線のあるものは、公式ドキュメント（英語）の該当ページを別のタブで開きます。',
        ),
      ),
    );
  }

  // 手を動かしてから、理解を確かめる順にする
  if (chapter.exercises && chapter.exercises.length > 0) {
    article.appendChild(createExercises(chapter.exercises));
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

  const exerciseCount = chapter.exercises?.length ?? 0;

  article.appendChild(
    el(
      'div',
      { class: 'done-bar' },
      readButton,
      // 読んだあと、何をすればよいかを 1 つだけ示す
      exerciseCount > 0
        ? el(
            'a',
            { class: 'btn', href: `#/drill/ch/${chapter.slug}` },
            `この章の演習へ（${exerciseCount}問）`,
          )
        : null,
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
