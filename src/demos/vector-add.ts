/** CH.02 ベクトル — 足し算は「継ぎ足し」、スカラー倍は「長さの伸び縮み」。 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { createArrow, createQuad, createSegment, fmtVec, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [4, 4, 7.5],
    grid: 8,
    axes: 2,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  const arrowA = createArrow(vecColor('a'));
  const arrowB = createArrow(vecColor('b'));
  const arrowSum = createArrow(vecColor('result'), { radius: 0.038, headRadius: 0.095 });
  // b を a の先端から継ぎ足したもの（同じ b の平行移動なので破線ではなく細い実線）
  const shiftedB = createArrow(vecColor('b'), { radius: 0.018, headRadius: 0.055 });
  const closing = createSegment(vecColor('guide'), true);
  const quad = createQuad(vecColor('result'));

  stage.scene.add(
    arrowA.object,
    arrowB.object,
    arrowSum.object,
    shiftedB.object,
    closing.object,
    quad.object,
  );

  const labelA = stage.addLabel('a', vecColor('a'));
  const labelB = stage.addLabel('b', vecColor('b'));
  const labelSum = stage.addLabel('a + b', vecColor('result'));
  stage.scene.add(labelA, labelB, labelSum);

  const controls = createControls([
    { kind: 'range', id: 'ax', label: 'a の x', min: -3, max: 3, step: 0.1, value: 2.4 },
    { kind: 'range', id: 'ay', label: 'a の y', min: -3, max: 3, step: 0.1, value: 0.6 },
    { kind: 'range', id: 'az', label: 'a の z', min: -3, max: 3, step: 0.1, value: 0 },
    { kind: 'range', id: 'bx', label: 'b の x', min: -3, max: 3, step: 0.1, value: -0.4 },
    { kind: 'range', id: 'by', label: 'b の y', min: -3, max: 3, step: 0.1, value: 2.2 },
    { kind: 'range', id: 'bz', label: 'b の z', min: -3, max: 3, step: 0.1, value: 1.2 },
    {
      kind: 'range',
      id: 'k',
      label: '結果を k 倍する',
      min: -2,
      max: 2,
      step: 0.1,
      value: 1,
      format: (v) => `${v.toFixed(1)} 倍`,
    },
    { kind: 'select', id: 'op', label: '計算', value: 'add', options: [
      { value: 'add', label: 'a + b（足し算）' },
      { value: 'sub', label: 'a − b（引き算）' },
    ] },
    { kind: 'check', id: 'quad', label: '平行四辺形を表示', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'a', label: 'a', color: vecColor('a') },
    { key: 'b', label: 'b', color: vecColor('b') },
    { key: 'r', label: '結果', color: vecColor('result') },
  ]);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const operand = new THREE.Vector3();
  const result = new THREE.Vector3();

  const update = (): void => {
    a.set(controls.num('ax'), controls.num('ay'), controls.num('az'));
    b.set(controls.num('bx'), controls.num('by'), controls.num('bz'));

    const subtract = controls.str('op') === 'sub';
    // 引き算は「逆向きの b を足す」のと同じ。ここを同じ処理にしておくと納得しやすい
    operand.copy(b).multiplyScalar(subtract ? -1 : 1);
    result.copy(a).add(operand).multiplyScalar(controls.num('k'));

    arrowA.set(a);
    arrowB.set(b);
    arrowSum.set(result);
    shiftedB.set(operand, a);
    closing.set(a.clone().add(operand), result);
    closing.setVisible(Math.abs(controls.num('k') - 1) > 0.001);

    quad.setVisible(controls.bool('quad'));
    quad.set(a, operand);

    labelA.position.copy(a).multiplyScalar(0.55).add(new THREE.Vector3(0, 0.25, 0));
    labelB.position.copy(b).multiplyScalar(0.55).add(new THREE.Vector3(0, 0.25, 0));
    labelSum.position.copy(result).add(new THREE.Vector3(0, 0.3, 0));
    labelSum.element.textContent =
      controls.num('k') === 1 ? (subtract ? 'a − b' : 'a + b') : `${controls.num('k').toFixed(1)}(a ${subtract ? '−' : '+'} b)`;

    readouts.set('a', fmtVec(a, 1));
    readouts.set('b', fmtVec(b, 1));
    readouts.set('r', fmtVec(result, 1));
  };

  controls.onChange(update);
  stage.onTheme(() => {
    arrowA.setColor(vecColor('a'));
    arrowB.setColor(vecColor('b'));
    shiftedB.setColor(vecColor('b'));
    arrowSum.setColor(vecColor('result'));
    quad.setColor(vecColor('result'));
    closing.setColor(vecColor('guide'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'ベクトル a', color: vecColor('a') },
      { label: 'ベクトル b（細い方は a の先に継ぎ足したもの）', color: vecColor('b') },
      { label: '計算結果', color: vecColor('result') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
