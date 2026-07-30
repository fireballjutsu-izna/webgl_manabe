/**
 * 逆引き。症状から、確かめる順に並べた手順と、詳しい章へ。
 *
 * 用語集は言葉から、前提知識マップは章から引く。ここは**起きていることから**引く。
 * 実務で開くのはたいていこれなので、絞り込みを付けて上から目で追えるようにする。
 */

import { chapterBySlug, chapterLabel } from '../../content/index.ts';
import { symptoms, type Symptom } from '../../content/symptoms.ts';
import { el } from '../../ui/dom.ts';
import { renderMarkup } from '../../ui/markup.ts';
import type { PageRenderer } from '../router.ts';

const symptomId = (id: string): string => `sx-${id}`;

function symptomCard(symptom: Symptom): HTMLElement {
  const steps = el('ol', { class: 'sx__checks' });

  for (const check of symptom.checks) {
    const chapter = check.chapter ? chapterBySlug(check.chapter) : undefined;
    steps.appendChild(
      el(
        'li',
        null,
        el('span', { html: renderMarkup(check.text).replace(/^<p>|<\/p>$/g, '') }),
        chapter
          ? el(
              'a',
              { class: 'sx__to', href: `#/ch/${chapter.slug}` },
              `${chapterLabel(chapter)} ${chapter.title} →`,
            )
          : null,
      ),
    );
  }

  return el(
    'section',
    { class: 'sx', id: symptomId(symptom.id) },
    el('h2', { class: 'sx__title' }, symptom.title),
    steps,
  );
}

export const renderHelpPage: PageRenderer = (root, ctx) => {
  document.title = '逆引き｜(アイン、ソフ、オウル)';

  // 見出しは、下のカード列と同じ幅に揃える（本文の行長より広い）
  root.appendChild(el('h1', { class: 'page-title page-title--wide' }, '逆引き ― 症状から探す'));
  root.appendChild(
    el(
      'p',
      { class: 'lede lede--wide' },
      '起きていることから引きます。それぞれ、上から順に確かめてください（安く確かめられるものが先です）。',
    ),
  );

  const cards = symptoms.map((symptom) => ({ symptom, node: symptomCard(symptom) }));

  /* ---- 絞り込み ---- */

  const filter = el('input', {
    class: 'sx-filter',
    type: 'search',
    placeholder: '症状で絞り込む（例：真っ黒、影、重い）',
    'aria-label': '症状で絞り込む',
  }) as HTMLInputElement;

  const count = el('p', { class: 'lede sx-count' });

  const apply = (): void => {
    const needle = filter.value.trim().toLowerCase();
    let shown = 0;

    for (const { symptom, node } of cards) {
      const hay = [symptom.title, ...(symptom.aliases ?? []), ...symptom.checks.map((c) => c.text)]
        .join(' ')
        .toLowerCase();
      const match = needle.length === 0 || hay.includes(needle);
      node.hidden = !match;
      if (match) shown += 1;
    }

    count.textContent =
      needle.length === 0
        ? `全 ${cards.length} 件`
        : shown > 0
          ? `${shown} 件`
          : '当てはまるものがありませんでした。用語集やサイト内検索も試してみてください。';
  };

  filter.addEventListener('input', apply);

  root.appendChild(el('div', { class: 'sx-head' }, filter, count));

  const list = el('div', { class: 'sx-list' }, ...cards.map(({ node }) => node));
  root.appendChild(list);
  apply();

  // #/help/black-screen のように指定されたら、その項目まで送る
  const target = ctx.segments[1];
  if (target) {
    const node = document.getElementById(symptomId(target));
    if (node) {
      requestAnimationFrame(() => {
        node.scrollIntoView({ block: 'center' });
        node.style.borderColor = 'var(--neon-lime)';
      });
    }
  }
};
