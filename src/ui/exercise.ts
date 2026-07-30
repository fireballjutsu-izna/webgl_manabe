/**
 * 章末の演習。読むだけで終わらせないための課題を出す。
 *
 * クイズと違って正誤の判定はしない。手を動かしたかどうかは本人にしか分からないので、
 * 判定を付けても自己申告にしかならず、進捗の意味が薄まる。
 * ここでできるのは「ヒントを見る」と「解答例を見る」を開くことだけ。
 */

import type { Exercise } from '../content/types.ts';
import { createCodeBlock } from './code.ts';
import { el } from './dom.ts';
import { renderMarkup } from './markup.ts';

/** 開閉するボタンと、その中身を 1 組にする。 */
function disclosure(openLabel: string, closeLabel: string, body: HTMLElement): HTMLElement {
  const button = el('button', { class: 'ex__toggle', type: 'button' }, openLabel);
  button.setAttribute('aria-expanded', 'false');
  body.hidden = true;

  button.addEventListener('click', () => {
    body.hidden = !body.hidden;
    button.textContent = body.hidden ? openLabel : closeLabel;
    button.setAttribute('aria-expanded', String(!body.hidden));
  });

  return el('div', { class: 'ex__disclosure' }, button, body);
}

export function createExercises(exercises: Exercise[]): HTMLElement {
  const root = el(
    'section',
    { class: 'exercise', 'aria-label': '演習' },
    el('div', { class: 'exercise__head' }, `TRY — 手を動かす（${exercises.length}問）`),
  );

  for (const [index, exercise] of exercises.entries()) {
    const item = el(
      'div',
      { class: 'ex' },
      el(
        'div',
        { class: 'ex__q' },
        el('span', { class: 'ex__num' }, String(index + 1)),
        el('div', { class: 'ex__prompt', html: renderMarkup(exercise.prompt) }),
      ),
    );

    const actions = el('div', { class: 'ex__actions' });

    if (exercise.hint) {
      actions.appendChild(
        disclosure(
          'ヒントを見る',
          'ヒントを閉じる',
          el('div', { class: 'ex__body', html: renderMarkup(exercise.hint) }),
        ),
      );
    }

    const answer = el('div', { class: 'ex__body ex__body--answer' });
    answer.appendChild(el('div', { html: renderMarkup(exercise.answer) }));
    if (exercise.answerCode) {
      answer.appendChild(createCodeBlock(exercise.answerCode, '解答例'));
    }
    actions.appendChild(disclosure('解答例を見る', '解答例を閉じる', answer));

    item.appendChild(actions);
    root.appendChild(item);
  }

  root.appendChild(
    el(
      'p',
      { class: 'exercise__foot' },
      '答え合わせはありません。解答例はひとつの書き方で、これ以外にも正解はあります。',
    ),
  );

  return root;
}
