/** 章末の確認クイズ。その場で正誤と解説を出す。 */

import { chapterBySlug, chapterLabel } from '../content/index.ts';
import type { Chapter, QuizQuestion } from '../content/types.ts';
import { setQuizPassed } from '../app/progress.ts';
import { el } from './dom.ts';
import { renderMarkup } from './markup.ts';

/*
 * 選択肢の番号。A・B・C ではなく 1・2・3 にしてある。
 * 「1 つめ」「2 つめ」と口に出して数えられるほうが、本文の書き方と揃う。
 */
const MARKS = ['1', '2', '3', '4', '5'];

/**
 * 間違えたときだけ出す戻り先。
 *
 * 解説は「なぜそうなるか」までは書いてあるが、それでも腑に落ちない人に必要なのは
 * **前提の章**で、それは画面のいちばん上にある。ここまで読み下してきた人に
 * 戻ってスクロールしろとは言えないので、その場に出す。
 *
 * 設問ごとにリンクを書き分けないのは、設問の大半がその章自身の内容だから ―
 * いま開いている章へのリンクは、何の助けにもならない。
 */
function backLinks(chapter: Chapter): HTMLElement | null {
  const slugs = (chapter.mathRecall?.map((r) => r.slug) ?? chapter.requires).filter(
    (slug) => chapterBySlug(slug) !== undefined,
  );
  if (slugs.length === 0) return null;

  const line = el('div', { class: 'qz__back' }, el('span', null, '腑に落ちなければ '));
  for (const [index, slug] of slugs.entries()) {
    const target = chapterBySlug(slug)!;
    if (index > 0) line.appendChild(el('span', null, '・'));
    line.appendChild(
      el('a', { href: `#/ch/${target.slug}` }, `${chapterLabel(target)} ${target.title}`),
    );
  }
  line.appendChild(el('span', null, ' へ戻ってみてください。'));
  return line;
}

export function createQuiz(slug: string, questions: QuizQuestion[]): HTMLElement {
  const chapter = chapterBySlug(slug);
  const root = el(
    'section',
    { class: 'quiz', 'aria-label': '確認クイズ' },
    el('div', { class: 'quiz__head' }, `CHECK — 確認クイズ（${questions.length}問）`),
  );

  const results = new Array<boolean | null>(questions.length).fill(null);

  questions.forEach((question, qi) => {
    const block = el(
      'div',
      { class: 'qz' },
      el('div', { class: 'qz__q', html: renderMarkup(question.q) }),
    );

    const explain = el('div', { class: 'qz__explain', hidden: true });
    const choices = el('div', { class: 'qz__choices', role: 'group' });
    const buttons: HTMLButtonElement[] = [];

    question.choices.forEach((choice, ci) => {
      const button = el(
        'button',
        { class: 'qz__choice', type: 'button' },
        el('span', { class: 'qz__mark' }, `${MARKS[ci] ?? String(ci + 1)}.`),
        el('span', { html: renderMarkup(choice).replace(/^<p>|<\/p>$/g, '') }),
      );

      button.addEventListener('click', () => {
        if (results[qi] !== null) return;
        const correct = ci === question.answer;
        results[qi] = correct;

        for (const [index, other] of buttons.entries()) {
          other.disabled = true;
          if (index === question.answer) other.dataset.state = 'correct';
          else if (index === ci) other.dataset.state = 'wrong';
        }

        // 色だけでなく、記号と文言の両方で正誤を伝える
        const parts: Node[] = [
          el(
            'span',
            { class: 'qz__verdict', 'data-ok': String(correct) },
            correct ? '○ 正解' : '× 不正解',
          ),
          el('span', { html: renderMarkup(question.explain).replace(/^<p>|<\/p>$/g, '') }),
        ];
        // 正解した人に「戻れ」とは言わない
        const back = correct || !chapter ? null : backLinks(chapter);
        if (back) parts.push(back);

        explain.replaceChildren(...parts);
        explain.hidden = false;

        if (results.every((r) => r === true)) setQuizPassed(slug, true);
      });

      buttons.push(button);
      choices.appendChild(button);
    });

    block.appendChild(choices);
    block.appendChild(explain);
    root.appendChild(block);
  });

  return root;
}
