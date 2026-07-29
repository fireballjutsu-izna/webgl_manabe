/** 章の描画。本文・数式・デモ・コード片・クイズを 1 つのデータから組み立てる。 */

import { chapterBySlug, chapterLabel, chapters, partInfo } from '../../content/index.ts';
import { docsUrl } from '../../content/three-docs.ts';
import type { Block, Chapter } from '../../content/types.ts';
import { demos } from '../../demos/registry.ts';
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

/** 第2部の章の冒頭に出す「この章で使う数学」。第1部のどこへ戻ればよいかを示す。 */
function mathRecallCard(chapter: Chapter): HTMLElement | null {
  if (!chapter.mathRecall || chapter.mathRecall.length === 0) return null;

  const list = el('ul', { class: 'recall__list' });
  for (const item of chapter.mathRecall) {
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
        el('span', { class: 'recall__note' }, `― ${item.note}`),
      ),
    );
  }

  return el(
    'aside',
    { class: 'recall' },
    el('div', { class: 'recall__head' }, 'この章で使う数学'),
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
        });
        instances.push(sandbox);
        placeholder.replaceWith(sandbox.element);
        if (block.caption) {
          sandbox.element.insertAdjacentElement(
            'afterend',
            el('p', { class: 'demo__caption sandbox__caption' }, block.caption),
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
