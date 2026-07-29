/** デモカードの組み立てを 1 箇所にまとめる。各デモは three のロジックだけ書けばよい。 */

import type { Stage } from '../three/stage.ts';
import { el } from '../ui/dom.ts';

/** ステージ＋操作パネルをカードに流し込む。null は無視される。 */
export function fillCard(card: HTMLElement, stage: Stage, parts: (HTMLElement | null)[]): void {
  card.appendChild(stage.element);
  const panel = el('div', { class: 'demo__panel' });
  for (const part of parts) if (part) panel.appendChild(part);
  card.appendChild(panel);
}
