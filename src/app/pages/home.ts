/** トップページ。学び方の案内と、全章の一覧。 */

import { chapterLabel, chapters, chaptersOfPart, PARTS } from '../../content/index.ts';
import { el } from '../../ui/dom.ts';
import { renderMarkup } from '../../ui/markup.ts';
import { getProgress } from '../progress.ts';
import type { PageRenderer } from '../router.ts';

const LEAD = `
Three.js は、箱を 1 つ画面に出すところまでは驚くほど簡単です。ところがその先——
「カメラを対象のまわりに回したい」「壁に沿って滑らせたい」「敵をこちらに向かせたい」——
に進んだ瞬間、{{ベクトル}}や{{行列}}、{{クォータニオン}}といった言葉が一気に押し寄せてきます。

ここは、その壁をこえるための場所です。数学の予備知識は本当にゼロで構いません。
公式を覚えることは求めません。かわりに、**スライダーを動かして 3D が変わるのを見ながら**、
「この数字は何を意味しているのか」を体で分かっていきます。

各章は、Three.js で何ができなくて困るか → 直感 → 図とデモ → はじめて数式 → 実際のコード、
の順に進みます。数式から始まる章はひとつもありません。

**第1部**で数学の土台を作り、**第2部**でそれを Three.js のコードにし、
**第3部**で作品を 2 つ、最初から最後まで組み上げます。
第2部と第3部のコードはすべて、このページの中で書き換えて動かせます。
`;

const HOWTO = `
## 読み進め方

- **上から順に読むのがいちばん近道です。** 章どうしは前提でつながっています（[前提知識マップ](#/map)で確認できます）。
- **デモは必ず触ってください。** スライダーを端まで動かすと、値がおかしくなる境目が見えます。そこが理解の勘所です。
- **分からない言葉には下線が引いてあります。** 触れると短い説明が出ます（[用語集](#/glossary)にも全部あります）。
- **章末のクイズは、間違えても大丈夫です。** どちらを選んでも解説が出ます。
`;

const NAME_STORY = `
## サイト名について

「(アイン、ソフ、オウル)」は 3 つ並んでいるので、つい \`Vector3\` に見えます。
でも中身はカバラの「無・無限・光」で、ベクトルとはまったく関係がありません。

3 つ組を見たらとりあえずベクトルだと思ってしまう——このサイトは、
そういう人になるためのところです。
`;

export const renderHomePage: PageRenderer = (root) => {
  document.title = '(アイン、ソフ、オウル) — Three.js のための数学';

  root.appendChild(
    el(
      'section',
      { class: 'hero' },
      el('h1', { class: 'hero__title' }, '(アイン、ソフ、オウル)'),
      el(
        'p',
        { class: 'hero__sub' },
        `Three.js のための数学と実装 — 全${chapters.length}章`,
      ),
      el('div', { class: 'hero__lead prose', html: renderMarkup(LEAD) }),
    ),
  );

  root.appendChild(el('div', { class: 'prose', html: renderMarkup(HOWTO) }));

  for (const part of PARTS) {
    const partChapters = chaptersOfPart(part.id);
    if (partChapters.length === 0) continue;

    root.appendChild(
      el(
        'div',
        { class: 'part-head' },
        el('h2', { class: 'part-head__title' }, part.title),
        el('p', { class: 'part-head__lead' }, part.lead),
      ),
    );

    root.appendChild(
      el(
        'div',
        { class: 'card-grid' },
        ...partChapters.map((chapter) =>
          el(
            'a',
            { class: 'ch-card', href: `#/ch/${chapter.slug}` },
            getProgress(chapter.slug).read
              ? el('span', { class: 'ch-card__done', title: '読了' }, '✓')
              : null,
            el('div', { class: 'ch-card__num' }, chapterLabel(chapter)),
            el('div', { class: 'ch-card__title' }, chapter.title),
            el('div', { class: 'ch-card__goal' }, chapter.goal),
          ),
        ),
      ),
    );
  }

  root.appendChild(el('div', { class: 'prose', html: renderMarkup(NAME_STORY) }));
};
