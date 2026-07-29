/** 章末の確認クイズ。その場で正誤と解説を出す。 */

import type { QuizQuestion } from '../content/types.ts';
import { setQuizPassed } from '../app/progress.ts';
import { el } from './dom.ts';
import { renderMarkup } from './markup.ts';

const MARKS = ['A', 'B', 'C', 'D', 'E'];

export function createQuiz(slug: string, questions: QuizQuestion[]): HTMLElement {
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
        el('span', { class: 'qz__mark' }, MARKS[ci] ?? String(ci + 1)),
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
        explain.replaceChildren(
          el(
            'span',
            { class: 'qz__verdict', 'data-ok': String(correct) },
            correct ? '○ 正解' : '× 不正解',
          ),
          el('span', { html: renderMarkup(question.explain).replace(/^<p>|<\/p>$/g, '') }),
        );
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
