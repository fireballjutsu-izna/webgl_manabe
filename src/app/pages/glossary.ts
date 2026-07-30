/** 用語集。本文のホバー定義と同じデータを一覧にしたもの。 */

import { glossary } from '../../content/glossary.ts';
import { chapterBySlug, chapterLabel } from '../../content/index.ts';
import { el } from '../../ui/dom.ts';
import type { PageRenderer } from '../router.ts';

const termId = (term: string): string => `term-${encodeURIComponent(term)}`;

export const renderGlossaryPage: PageRenderer = (root, ctx) => {
  document.title = '用語集｜(アイン、ソフ、オウル)';

  root.appendChild(el('h1', { class: 'page-title' }, '用語集'));
  root.appendChild(
    el(
      'p',
      { class: 'lede' },
      '本文で下線が引かれている言葉の一覧です。読む順番は気にせず、詰まったときに引いてください。',
    ),
  );

  const list = el('div', { class: 'gloss' });

  for (const entry of glossary) {
    const chapter = entry.chapter ? chapterBySlug(entry.chapter) : undefined;
    list.appendChild(
      el(
        'div',
        { class: 'gloss__item', id: termId(entry.term) },
        el(
          'div',
          null,
          el('span', { class: 'gloss__name' }, entry.term),
          entry.reading ? el('span', { class: 'gloss__reading' }, entry.reading) : null,
        ),
        el('p', { class: 'gloss__def' }, entry.def),
        chapter
          ? el(
              'p',
              { class: 'gloss__link' },
              el(
                'a',
                { href: `#/ch/${chapter.slug}` },
                `${chapterLabel(chapter)}　${chapter.title} →`,
              ),
            )
          : null,
      ),
    );
  }

  root.appendChild(list);

  // #/glossary/正規化 のように指定されたら、その項目まで送る
  const target = ctx.segments[1];
  if (target) {
    const node = document.getElementById(termId(target));
    if (node) {
      requestAnimationFrame(() => {
        node.scrollIntoView({ block: 'center' });
        node.style.borderColor = 'var(--neon-lime)';
      });
    }
  }
};
