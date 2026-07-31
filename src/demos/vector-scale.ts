/**
 * CH.1-15 スカラー倍 — 向きはそのまま、長さだけ変える。
 *
 * k がマイナスのときに矢印が反転することと、長さが |k| 倍になる（k 倍ではない）ことを、
 * 数字と絵の両方で見せる。ここを取り違えると、速度や力の計算がすべて狂う。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { createArrow, createSegment, fmt, fmtVec, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [6.5, 5, 9.5],
    grid: 8,
    axes: 1.6,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  // k > 1 のとき kv が v を覆ってしまうので、もとの v を太く、k 倍を細く描いて重ねる
  const arrowV = createArrow(vecColor('a'), { radius: 0.055, headRadius: 0.13 });
  const arrowK = createArrow(vecColor('result'), { radius: 0.028, headRadius: 0.075 });
  stage.scene.add(arrowV.object, arrowK.object);

  // k 倍しても向きが変わらない（か、真逆になる）ことを見せる、v を通る直線
  const line = createSegment(vecColor('guide'), true);
  stage.scene.add(line.object);

  const labelV = stage.addLabel('v', vecColor('a'));
  const labelK = stage.addLabel('k v', vecColor('result'));
  stage.scene.add(labelV, labelK);

  const controls = createControls([
    { kind: 'range', id: 'x', label: 'v の x', min: -2, max: 2, step: 0.1, value: 1.5 },
    { kind: 'range', id: 'y', label: 'v の y', min: -2, max: 2, step: 0.1, value: 2 },
    { kind: 'range', id: 'z', label: 'v の z', min: -2, max: 2, step: 0.1, value: 0 },
    { kind: 'range', id: 'k', label: '掛ける数 k', min: -2, max: 2, step: 0.1, value: 2 },
  ]);

  const readouts = createReadouts([
    { key: 'v', label: 'v', color: vecColor('a') },
    { key: 'vlen', label: 'v の長さ', color: vecColor('a') },
    { key: 'kv', label: 'k v', color: vecColor('result') },
    { key: 'klen', label: 'k v の長さ', color: vecColor('result') },
  ]);

  const v = new THREE.Vector3();
  const kv = new THREE.Vector3();
  const far = new THREE.Vector3();
  const near = new THREE.Vector3();
  const up = new THREE.Vector3(0, 0.28, 0);

  const update = (): void => {
    v.set(controls.num('x'), controls.num('y'), controls.num('z'));
    const k = controls.num('k');
    kv.copy(v).multiplyScalar(k);

    arrowV.set(v);
    arrowV.setVisible(v.lengthSq() > 1e-8);
    arrowK.set(kv);
    arrowK.setVisible(kv.lengthSq() > 1e-8);

    labelV.position.copy(v).multiplyScalar(0.55).add(up);
    labelV.visible = v.lengthSq() > 1e-8;
    labelK.position.copy(kv).multiplyScalar(0.75).add(up);
    labelK.visible = kv.lengthSq() > 1e-8;

    // v の向き（と真逆）に伸びる直線。k をどう変えても矢印はこの線から出られない
    if (v.lengthSq() > 1e-8) {
      far.copy(v).setLength(4);
      near.copy(far).negate();
      line.set(near, far);
      line.setVisible(true);
    } else {
      line.setVisible(false);
    }

    readouts.set('v', fmtVec(v, 1));
    readouts.set('vlen', fmt(v.length(), 3));
    readouts.set('kv', `${fmt(k, 1)} × v = ${fmtVec(kv, 2)}`);
    readouts.set('klen', `${fmt(kv.length(), 3)}（|k| = ${fmt(Math.abs(k), 1)} 倍）`);
  };

  controls.onChange(update);
  stage.onTheme(() => {
    arrowV.setColor(vecColor('a'));
    arrowK.setColor(vecColor('result'));
    line.setColor(vecColor('guide'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'もとのベクトル v', color: vecColor('a') },
      { label: 'k 倍した k v', color: vecColor('result') },
      { label: 'v が乗っている直線（k を変えてもここから出られない）', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
