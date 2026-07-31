/**
 * CH.1-10 ピタゴラスの定理 — 斜めの長さは、2 辺の「二乗の和」から出る。
 *
 * 3 辺それぞれに正方形を貼ると、小さい 2 枚の面積の合計が大きい 1 枚と等しくなる。
 * 「なぜ足すのではなく二乗するのか」は、この面積の絵がいちばん早い。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import {
  createPolyline,
  createQuad,
  createSegment,
  fmt,
  vecColor,
} from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [2, 2, 16],
    target: [2, 2, 0],
    controls: false,
    labels: true,
  });

  /* ---- 三角形の 3 辺 ---- */

  const sideA = createSegment(vecColor('a'));
  const sideB = createSegment(vecColor('b'));
  const sideC = createSegment(vecColor('result'));
  stage.scene.add(sideA.object, sideB.object, sideC.object);

  const labelA = stage.addLabel('a', vecColor('a'));
  const labelB = stage.addLabel('b', vecColor('b'));
  const labelC = stage.addLabel('c', vecColor('result'));
  stage.scene.add(labelA, labelB, labelC);

  // 直角の目印
  const rightAngle = createPolyline(vecColor('guide'), 4);
  stage.scene.add(rightAngle.object);

  /* ---- 3 辺に貼る正方形（面積が定理そのもの） ---- */

  const squareA = createQuad(vecColor('a'), 0.22);
  const squareB = createQuad(vecColor('b'), 0.22);
  const squareC = createQuad(vecColor('result'), 0.22);
  stage.scene.add(squareA.object, squareB.object, squareC.object);

  const areaA = stage.addLabel('a²', vecColor('a'));
  const areaB = stage.addLabel('b²', vecColor('b'));
  const areaC = stage.addLabel('c²', vecColor('result'));
  stage.scene.add(areaA, areaB, areaC);

  const controls = createControls([
    { kind: 'range', id: 'a', label: '横の辺 a', min: 0.5, max: 4, step: 0.1, value: 3 },
    { kind: 'range', id: 'b', label: '縦の辺 b', min: 0.5, max: 4, step: 0.1, value: 4 },
    { kind: 'check', id: 'squares', label: '3 辺に正方形を貼る（面積で見る）', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'ab', label: '辺の長さ', color: vecColor('a') },
    { key: 'sq', label: 'a² + b²' },
    { key: 'c2', label: 'c²（斜めの二乗）', color: vecColor('result') },
    { key: 'c', label: 'c = √(a² + b²)', color: vecColor('result') },
  ]);

  const O = new THREE.Vector3(0, 0, 0);
  const P = new THREE.Vector3();
  const Q = new THREE.Vector3();
  const edge = new THREE.Vector3();
  const perp = new THREE.Vector3();

  const update = (): void => {
    const a = controls.num('a');
    const b = controls.num('b');
    const c = Math.hypot(a, b);

    P.set(a, 0, 0);
    Q.set(a, b, 0);

    sideA.set(O, P);
    sideB.set(P, Q);
    sideC.set(O, Q);

    labelA.position.set(a / 2, -0.32, 0);
    labelB.position.set(a + 0.3, b / 2, 0);
    labelC.position.set(a / 2 - 0.32, b / 2 + 0.22, 0);

    const m = Math.min(0.35, a * 0.4, b * 0.4);
    rightAngle.set([
      new THREE.Vector3(a - m, 0, 0.01),
      new THREE.Vector3(a - m, m, 0.01),
      new THREE.Vector3(a, m, 0.01),
    ]);

    const show = controls.bool('squares');
    squareA.setVisible(show);
    squareB.setVisible(show);
    squareC.setVisible(show);
    areaA.visible = show;
    areaB.visible = show;
    areaC.visible = show;

    if (show) {
      // a の正方形は下へ、b の正方形は右へ、c の正方形は斜辺の外側へ
      squareA.set(edge.set(a, 0, 0), perp.set(0, -a, 0), O);
      areaA.position.set(a / 2, -a / 2, 0);

      squareB.set(edge.set(0, b, 0), perp.set(b, 0, 0), P);
      areaB.position.set(a + b / 2, b / 2, 0);

      // 斜辺 (a, b) を 90 度回すと (-b, a)。長さは同じ c なので、これで正方形になる
      squareC.set(edge.set(a, b, 0), perp.set(-b, a, 0), O);
      areaC.position.set((a - b) / 2, (a + b) / 2, 0);
    }

    readouts.set('ab', `a = ${fmt(a, 1)} / b = ${fmt(b, 1)}`);
    readouts.set('sq', `${fmt(a * a, 2)} + ${fmt(b * b, 2)} = ${fmt(a * a + b * b, 2)}`);
    readouts.set('c2', fmt(c * c, 2));
    readouts.set('c', fmt(c, 3));
  };

  controls.onChange(update);
  stage.onTheme(() => {
    sideA.setColor(vecColor('a'));
    sideB.setColor(vecColor('b'));
    sideC.setColor(vecColor('result'));
    rightAngle.setColor(vecColor('guide'));
    squareA.setColor(vecColor('a'));
    squareB.setColor(vecColor('b'));
    squareC.setColor(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '辺 a と、その正方形（面積 a²）', color: vecColor('a') },
      { label: '辺 b と、その正方形（面積 b²）', color: vecColor('b') },
      { label: '斜辺 c と、その正方形（面積 c²）', color: vecColor('result') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
