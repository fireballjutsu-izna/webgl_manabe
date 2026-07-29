/** CH.04 外積 — a×b は a にも b にも垂直。長さは平行四辺形の面積になる。 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { createArrow, createQuad, fmt, fmtVec, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [4.2, 3.6, 6.4],
    target: [0, 0.4, 0],
    grid: 8,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  const arrowA = createArrow(vecColor('a'));
  const arrowB = createArrow(vecColor('b'));
  const arrowCross = createArrow(vecColor('result'), { radius: 0.038, headRadius: 0.095 });
  const arrowFlip = createArrow(vecColor('negative'), { radius: 0.022, headRadius: 0.06 });
  const quad = createQuad(vecColor('result'), 0.2);

  stage.scene.add(arrowA.object, arrowB.object, arrowCross.object, arrowFlip.object, quad.object);

  const labelA = stage.addLabel('a', vecColor('a'));
  const labelB = stage.addLabel('b', vecColor('b'));
  const labelC = stage.addLabel('a × b', vecColor('result'));
  const labelF = stage.addLabel('b × a', vecColor('negative'));
  stage.scene.add(labelA, labelB, labelC, labelF);

  const controls = createControls([
    {
      kind: 'range',
      id: 'angle',
      label: 'a と b のなす角',
      min: 0,
      max: 180,
      step: 1,
      value: 62,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'range', id: 'la', label: 'a の長さ', min: 0.5, max: 2.6, step: 0.1, value: 2 },
    { kind: 'range', id: 'lb', label: 'b の長さ', min: 0.5, max: 2.6, step: 0.1, value: 1.6 },
    {
      kind: 'range',
      id: 'twist',
      label: '面ごと傾ける',
      min: -80,
      max: 80,
      step: 1,
      value: 0,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'check', id: 'flip', label: '順番を逆にした b×a も表示', value: true },
    { kind: 'check', id: 'quad', label: '平行四辺形（面積）を表示', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'c', label: 'a×b', color: vecColor('result') },
    { key: 'len', label: '|a×b|（＝面積）', color: vecColor('result') },
    { key: 'da', label: '(a×b)·a', color: vecColor('a') },
    { key: 'db', label: '(a×b)·b', color: vecColor('b') },
  ]);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const cross = new THREE.Vector3();
  const tilt = new THREE.Quaternion();
  const axis = new THREE.Vector3(1, 0, 0);

  const update = (): void => {
    const theta = THREE.MathUtils.degToRad(controls.num('angle'));
    a.set(controls.num('la'), 0, 0);
    b.set(Math.cos(theta), 0, -Math.sin(theta)).multiplyScalar(controls.num('lb'));

    // 面ごと傾けても「垂直である」ことは変わらない、というのを見せる
    tilt.setFromAxisAngle(axis, THREE.MathUtils.degToRad(controls.num('twist')));
    a.applyQuaternion(tilt);
    b.applyQuaternion(tilt);

    cross.copy(a).cross(b);

    arrowA.set(a);
    arrowB.set(b);
    arrowCross.set(cross);

    const showFlip = controls.bool('flip');
    arrowFlip.setVisible(showFlip);
    arrowFlip.set(cross.clone().negate());
    labelF.visible = showFlip;

    quad.setVisible(controls.bool('quad'));
    quad.set(a, b);

    labelA.position.copy(a).multiplyScalar(0.6).add(new THREE.Vector3(0, 0.2, 0));
    labelB.position.copy(b).multiplyScalar(0.6).add(new THREE.Vector3(0, 0.2, 0));
    labelC.position.copy(cross).multiplyScalar(1).add(new THREE.Vector3(0, 0.25, 0));
    labelF.position.copy(cross).multiplyScalar(-1).add(new THREE.Vector3(0, -0.25, 0));

    readouts.set('c', fmtVec(cross, 2));
    readouts.set('len', fmt(cross.length(), 3));
    // 垂直なら内積は 0。丸め誤差ぶんだけ 0 からずれる
    readouts.set('da', fmt(cross.dot(a), 3));
    readouts.set('db', fmt(cross.dot(b), 3));
  };

  controls.onChange(update);
  stage.onTheme(() => {
    arrowA.setColor(vecColor('a'));
    arrowB.setColor(vecColor('b'));
    arrowCross.setColor(vecColor('result'));
    arrowFlip.setColor(vecColor('negative'));
    quad.setColor(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'ベクトル a', color: vecColor('a') },
      { label: 'ベクトル b', color: vecColor('b') },
      { label: 'a × b', color: vecColor('result') },
      { label: 'b × a（逆向きになる）', color: vecColor('negative') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
