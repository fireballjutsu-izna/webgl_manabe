/**
 * 演習の 1 問。章末と演習ページ（#/drill）の両方がこれを使う。
 *
 * クイズと違って正誤の判定はしない。手を動かしたかどうかは本人にしか分からないので、
 * 判定を付けても自己申告にしかならず、進捗の意味が薄まる。
 * ただし「解いた」印だけは付けられる ― 通しで解くときに、どこまでやったかが分からないと困るため。
 * あれは点数ではなく、しおりのつもり。
 */

import type { Exercise } from '../content/types.ts';
import { isExerciseDone, setExerciseDone } from '../app/progress.ts';
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

export interface ExerciseItemOptions {
  /** 番号の丸に出す文字。章末では通し番号、演習ページでは章番号を添える。 */
  label: string;
  /** 「解いた」印を出すなら、その保存先。章末では出さない。 */
  mark?: { slug: string; index: number };
  /** 問題文の上に添える出どころ（演習ページで使う）。 */
  source?: HTMLElement;
}

/** 演習 1 問ぶんの表示。 */
export function createExerciseItem(
  exercise: Exercise,
  options: ExerciseItemOptions,
): HTMLElement {
  const item = el(
    'div',
    { class: 'ex' },
    options.source,
    el(
      'div',
      { class: 'ex__q' },
      el('span', { class: 'ex__num' }, options.label),
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

  if (options.mark) {
    const { slug, index } = options.mark;
    const button = el('button', { class: 'ex__done', type: 'button' });
    const sync = (): void => {
      const done = isExerciseDone(slug, index);
      button.textContent = done ? '✓ 解いた' : '解いたことにする';
      button.classList.toggle('ex__done--on', done);
      button.setAttribute('aria-pressed', String(done));
      item.classList.toggle('ex--done', done);
    };
    button.addEventListener('click', () => {
      setExerciseDone(slug, index, !isExerciseDone(slug, index));
      sync();
    });
    sync();
    actions.appendChild(button);
  }

  item.appendChild(actions);
  return item;
}

/** 章末に置く演習のまとまり。 */
export function createExercises(exercises: Exercise[]): HTMLElement {
  const root = el(
    'section',
    { class: 'exercise', 'aria-label': '演習' },
    el('div', { class: 'exercise__head' }, `TRY — 手を動かす（${exercises.length}問）`),
  );

  for (const [index, exercise] of exercises.entries()) {
    root.appendChild(createExerciseItem(exercise, { label: String(index + 1) }));
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
