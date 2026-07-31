/**
 * CH.1-01 数直線 — 負の数は「反対向き」、足し算は「その向きに進む」。
 *
 * 3D の前に、まず 1 本の直線の上で符号と足し算を目で見る。
 * ここで「マイナスは向き」だと納得しておくと、あとのベクトルが素直に入る。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import {
  createArrow,
  createPoint,
  createSegment,
  fmt,
  vecColor,
} from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

/** 目盛りを打つ範囲。 */
const MIN = -6;
const MAX = 6;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 0, 11],
    controls: false,
    labels: true,
  });

  /* ---- 数直線そのもの（軸・目盛り・数字） ---- */

  const axis = createSegment(vecColor('guide'));
  axis.set(new THREE.Vector3(MIN - 0.4, 0, 0), new THREE.Vector3(MAX + 0.4, 0, 0));
  stage.scene.add(axis.object);

  const ticks: ReturnType<typeof createSegment>[] = [];
  for (let n = MIN; n <= MAX; n += 1) {
    const tick = createSegment(vecColor('guide'));
    const half = n === 0 ? 0.3 : 0.16;
    tick.set(new THREE.Vector3(n, -half, 0), new THREE.Vector3(n, half, 0));
    stage.scene.add(tick.object);
    ticks.push(tick);

    const label = stage.addLabel(String(n), 'var(--text-muted)');
    label.position.set(n, -0.55, 0);
    stage.scene.add(label);
  }

  /* ---- a と、その反転 ---- */

  const pointA = createPoint(vecColor('a'), 0.16);
  const pointNeg = createPoint(vecColor('negative'), 0.13);
  const pointSum = createPoint(vecColor('result'), 0.16);
  stage.scene.add(pointA, pointNeg, pointSum);

  const labelA = stage.addLabel('a', vecColor('a'));
  const labelNeg = stage.addLabel('-a', vecColor('negative'));
  const labelSum = stage.addLabel('a + b', vecColor('result'));
  stage.scene.add(labelA, labelNeg, labelSum);

  // 原点から a までの隔たり（＝絶対値）を破線で見せる
  const absSpan = createSegment(vecColor('guide'), true);
  stage.scene.add(absSpan.object);
  const labelAbs = stage.addLabel('|a|', 'var(--text-muted)');
  stage.scene.add(labelAbs);

  /* ---- 足し算を「移動」として見せる 2 本の矢印 ---- */

  const stepA = createArrow(vecColor('a'), { radius: 0.035, headLength: 0.3, headRadius: 0.11 });
  const stepB = createArrow(vecColor('b'), { radius: 0.035, headLength: 0.3, headRadius: 0.11 });
  const handoff = createSegment(vecColor('guide'), true);
  stage.scene.add(stepA.object, stepB.object, handoff.object);

  const controls = createControls([
    { kind: 'range', id: 'a', label: 'a', min: MIN, max: MAX, step: 0.5, value: 3 },
    { kind: 'range', id: 'b', label: 'b（a に足す数）', min: MIN, max: MAX, step: 0.5, value: -5 },
    { kind: 'check', id: 'neg', label: '-a（符号を反転した点）も出す', value: true },
    { kind: 'check', id: 'sum', label: 'a + b を「移動」として見る', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'a', label: 'a', color: vecColor('a') },
    { key: 'neg', label: '-a', color: vecColor('negative') },
    { key: 'abs', label: '|a|（0 からの隔たり）' },
    { key: 'sum', label: 'a + b', color: vecColor('result') },
  ]);

  const tmp = new THREE.Vector3();
  const origin = new THREE.Vector3();

  const update = (): void => {
    const a = controls.num('a');
    const b = controls.num('b');
    const sum = a + b;

    pointA.position.set(a, 0, 0);
    labelA.position.set(a, 0.42, 0);

    const showNeg = controls.bool('neg');
    pointNeg.visible = showNeg;
    labelNeg.visible = showNeg;
    pointNeg.position.set(-a, 0, 0);
    labelNeg.position.set(-a, -1.0, 0);

    absSpan.set(new THREE.Vector3(0, 0.95, 0), new THREE.Vector3(a, 0.95, 0));
    absSpan.setVisible(Math.abs(a) > 1e-6);
    labelAbs.visible = Math.abs(a) > 1e-6;
    labelAbs.position.set(a / 2, 1.25, 0);

    const showSum = controls.bool('sum');
    // 数直線の下に 2 段用意して「0 から a へ」「a から a+b へ」を階段状に並べる。
    // 同じ高さに置くと、b が戻る向きのときに a の矢印を上書きしてしまう。
    stepA.set(tmp.set(a, 0, 0), origin.set(0, -1.5, 0));
    stepA.setVisible(showSum && Math.abs(a) > 1e-6);
    stepB.set(tmp.set(b, 0, 0), origin.set(a, -2.2, 0));
    stepB.setVisible(showSum && Math.abs(b) > 1e-6);
    // a の終わりと b の始まりが同じ場所であることを、縦線でつなぐ
    handoff.set(new THREE.Vector3(a, -1.5, 0), new THREE.Vector3(a, -2.2, 0));
    handoff.setVisible(showSum && Math.abs(a) > 1e-6 && Math.abs(b) > 1e-6);
    pointSum.visible = showSum;
    labelSum.visible = showSum;
    pointSum.position.set(sum, -2.2, 0);
    labelSum.position.set(sum, -2.7, 0);

    readouts.set('a', fmt(a, 1));
    readouts.set('neg', fmt(-a, 1));
    readouts.set('abs', fmt(Math.abs(a), 1));
    readouts.set('sum', `${fmt(a, 1)} + ${fmt(b, 1)} = ${fmt(sum, 1)}`);
  };

  controls.onChange(update);
  stage.onTheme(() => {
    axis.setColor(vecColor('guide'));
    for (const tick of ticks) tick.setColor(vecColor('guide'));
    absSpan.setColor(vecColor('guide'));
    handoff.setColor(vecColor('guide'));
    stepA.setColor(vecColor('a'));
    stepB.setColor(vecColor('b'));
    (pointA.material as THREE.MeshBasicMaterial).color.set(vecColor('a'));
    (pointNeg.material as THREE.MeshBasicMaterial).color.set(vecColor('negative'));
    (pointSum.material as THREE.MeshBasicMaterial).color.set(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'a と、a のぶんの移動', color: vecColor('a') },
      { label: 'b のぶんの移動', color: vecColor('b') },
      { label: '-a（0 をはさんだ反対側）', color: vecColor('negative') },
      { label: 'a + b（着いた先）', color: vecColor('result') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
