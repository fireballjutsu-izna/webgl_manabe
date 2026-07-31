/**
 * CH.1-14 ベクトルの引き算 — 「行き先 引く 出発点」で、2 点をつなぐ矢印を作る。
 *
 * 引き算を「逆向きの足し算」として教えると計算はできるようになるが、
 * 3D で毎日書くのはこちらの読み方（点から点へ向かう矢印）なので、そちらを主役にする。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import {
  createArrow,
  createPoint,
  createSegment,
  fmt,
  fmtVec,
  vecColor,
} from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [5, 4.2, 8],
    grid: 8,
    axes: 1.6,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  // 原点から各点へ伸びる「位置ベクトル」は補助線あつかいにする
  const toA = createSegment(vecColor('guide'), true);
  const toB = createSegment(vecColor('guide'), true);
  stage.scene.add(toA.object, toB.object);

  const pointA = createPoint(vecColor('a'), 0.11);
  const pointB = createPoint(vecColor('b'), 0.11);
  stage.scene.add(pointA, pointB);

  const between = createArrow(vecColor('result'), { radius: 0.034, headRadius: 0.095 });
  stage.scene.add(between.object);

  const labelA = stage.addLabel('A', vecColor('a'));
  const labelB = stage.addLabel('B', vecColor('b'));
  const labelD = stage.addLabel('B - A', vecColor('result'));
  stage.scene.add(labelA, labelB, labelD);

  const controls = createControls([
    { kind: 'range', id: 'ax', label: 'A の x', min: -3, max: 3, step: 0.5, value: -2 },
    { kind: 'range', id: 'ay', label: 'A の y', min: -3, max: 3, step: 0.5, value: 0 },
    { kind: 'range', id: 'az', label: 'A の z', min: -3, max: 3, step: 0.5, value: 1 },
    { kind: 'range', id: 'bx', label: 'B の x', min: -3, max: 3, step: 0.5, value: 2 },
    { kind: 'range', id: 'by', label: 'B の y', min: -3, max: 3, step: 0.5, value: 3 },
    { kind: 'range', id: 'bz', label: 'B の z', min: -3, max: 3, step: 0.5, value: 1 },
    {
      kind: 'select',
      id: 'dir',
      label: 'どちらを引くか',
      value: 'ba',
      options: [
        { value: 'ba', label: 'B - A（A から B へ）' },
        { value: 'ab', label: 'A - B（B から A へ）' },
      ],
    },
  ]);

  const readouts = createReadouts([
    { key: 'a', label: 'A', color: vecColor('a') },
    { key: 'b', label: 'B', color: vecColor('b') },
    { key: 'd', label: '引き算の結果', color: vecColor('result') },
    { key: 'len', label: 'その長さ（＝ 2 点の距離）', color: vecColor('result') },
  ]);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const diff = new THREE.Vector3();
  const origin = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const up = new THREE.Vector3(0, 0.3, 0);
  // 矢印の中点ラベルは、原点の軸ヘルパーと重なりやすいので高めに逃がす
  const upLabel = new THREE.Vector3(0, 0.6, 0);

  const update = (): void => {
    a.set(controls.num('ax'), controls.num('ay'), controls.num('az'));
    b.set(controls.num('bx'), controls.num('by'), controls.num('bz'));

    pointA.position.copy(a);
    pointB.position.copy(b);
    labelA.position.copy(a).add(up);
    labelB.position.copy(b).add(up);

    toA.set(origin.set(0, 0, 0), a);
    toB.set(origin.set(0, 0, 0), b);

    const fromB = controls.str('dir') === 'ab';
    // 「行き先 引く 出発点」。矢印は出発点から生やさないと意味が伝わらない
    const start = fromB ? b : a;
    diff.copy(fromB ? a : b).sub(fromB ? b : a);
    between.set(diff, start);
    between.setVisible(diff.lengthSq() > 1e-8);

    mid.copy(start).addScaledVector(diff, 0.5).add(upLabel);
    labelD.position.copy(mid);
    labelD.element.textContent = fromB ? 'A - B' : 'B - A';

    readouts.set('a', fmtVec(a, 1));
    readouts.set('b', fmtVec(b, 1));
    readouts.set('d', `${fromB ? 'A - B' : 'B - A'} = ${fmtVec(diff, 1)}`);
    readouts.set('len', fmt(diff.length(), 3));
  };

  controls.onChange(update);
  stage.onTheme(() => {
    toA.setColor(vecColor('guide'));
    toB.setColor(vecColor('guide'));
    between.setColor(vecColor('result'));
    (pointA.material as THREE.MeshBasicMaterial).color.set(vecColor('a'));
    (pointB.material as THREE.MeshBasicMaterial).color.set(vecColor('b'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '点 A', color: vecColor('a') },
      { label: '点 B', color: vecColor('b') },
      { label: '引き算で出てくる矢印', color: vecColor('result') },
      { label: '原点から各点への位置ベクトル', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
