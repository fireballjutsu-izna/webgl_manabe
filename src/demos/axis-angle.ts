/**
 * CH.2-12 軸と角度 — どんな回転も「1 本の軸のまわりに、何度」で書ける。
 *
 * 点は軸に垂直な円をなぞるだけで、軸方向の成分はまったく動かない。
 * ここが見えていれば、クォータニオンは「この軸と角度を持ち歩く入れ物」で済む。
 */

import * as THREE from 'three';
import {
  createArrow,
  createPolyline,
  createSegment,
  fmt,
  fmtVec,
  vecColor,
} from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const AXES: Record<string, [number, number, number]> = {
  y: [0, 1, 0],
  x: [1, 0, 0],
  z: [0, 0, 1],
  xy: [1, 1, 0],
  xyz: [1, 1, 1],
};

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [5.2, 3.8, 7],
    grid: 8,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  // 軸は原点を通る 1 本の線。両側に伸ばして「まわりを回る」感じを出す
  const axisLine = createSegment(vecColor('normal'), true);
  const axisArrow = createArrow(vecColor('normal'), { radius: 0.022, headRadius: 0.07 });
  stage.scene.add(axisLine.object, axisArrow.object);

  const before = createArrow(vecColor('a'), { radius: 0.032, headRadius: 0.1 });
  const after = createArrow(vecColor('result'), { radius: 0.048, headRadius: 0.14 });
  stage.scene.add(before.object, after.object);

  // 点がなぞる円と、その中心へ向かう「軸方向の成分」
  const path = createPolyline(vecColor('guide'), 130, true);
  const alongAxis = createArrow(vecColor('negative'), { radius: 0.045, headRadius: 0.1 });
  const spokeBefore = createSegment(vecColor('guide'), true);
  const spokeAfter = createSegment(vecColor('guide'), true);
  stage.scene.add(path.object, alongAxis.object, spokeBefore.object, spokeAfter.object);

  const labelAxis = stage.addLabel('回転軸', vecColor('normal'));
  const labelBefore = stage.addLabel('p', vecColor('a'));
  const labelAfter = stage.addLabel("p'", vecColor('result'));
  stage.scene.add(labelAxis, labelBefore, labelAfter);

  const controls = createControls([
    {
      kind: 'select',
      id: 'axis',
      label: '回転軸',
      value: 'y',
      options: [
        { value: 'y', label: 'y 軸 (0, 1, 0)' },
        { value: 'x', label: 'x 軸 (1, 0, 0)' },
        { value: 'z', label: 'z 軸 (0, 0, 1)' },
        { value: 'xy', label: '斜め (1, 1, 0)' },
        { value: 'xyz', label: '斜め (1, 1, 1)' },
      ],
    },
    {
      kind: 'range',
      id: 'deg',
      label: '回す角度 θ',
      min: -180,
      max: 180,
      step: 5,
      value: 90,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'range', id: 'px', label: '点 p の x', min: -3, max: 3, step: 0.5, value: 2 },
    { kind: 'range', id: 'py', label: '点 p の y', min: -3, max: 3, step: 0.5, value: 1 },
    { kind: 'range', id: 'pz', label: '点 p の z', min: -3, max: 3, step: 0.5, value: 0 },
  ]);

  const readouts = createReadouts([
    { key: 'axis', label: '軸（長さ 1 に直したもの）', color: vecColor('normal') },
    { key: 'out', label: "回した後の p'", color: vecColor('result') },
    { key: 'along', label: '軸方向の成分（回しても変わらない）', color: vecColor('negative') },
    { key: 'len', label: '軸からの距離（円の半径）', color: vecColor('guide') },
  ]);

  const axis = new THREE.Vector3();
  const p = new THREE.Vector3();
  const q = new THREE.Vector3();
  const center = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const tmp = new THREE.Vector3();

  const update = (): void => {
    axis.set(...(AXES[controls.str('axis')] ?? AXES.y!)).normalize();
    const rad = THREE.MathUtils.degToRad(controls.num('deg'));

    p.set(controls.num('px'), controls.num('py'), controls.num('pz'));
    quat.setFromAxisAngle(axis, rad);
    q.copy(p).applyQuaternion(quat);

    axisLine.set(tmp.copy(axis).multiplyScalar(-2.4), center.copy(axis).multiplyScalar(2.4));
    axisArrow.set(tmp.copy(axis).multiplyScalar(2.4));

    before.set(p);
    after.set(q);
    before.setVisible(p.lengthSq() > 1e-8);
    after.setVisible(q.lengthSq() > 1e-8);

    // 軸方向の成分。p を軸に射影した点が、円の中心になる
    const along = p.dot(axis);
    center.copy(axis).multiplyScalar(along);
    alongAxis.set(center);
    alongAxis.setVisible(Math.abs(along) > 1e-6);

    const radial = tmp.copy(p).sub(center);
    const radius = radial.length();

    if (radius > 1e-6) {
      const u = radial.clone().normalize();
      const v = new THREE.Vector3().crossVectors(axis, u);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 128; i += 1) {
        const t = (i / 128) * Math.PI * 2;
        pts.push(
          center
            .clone()
            .addScaledVector(u, Math.cos(t) * radius)
            .addScaledVector(v, Math.sin(t) * radius),
        );
      }
      path.set(pts);
      spokeBefore.set(center, p);
      spokeAfter.set(center, q);
      spokeBefore.setVisible(true);
      spokeAfter.setVisible(true);
    } else {
      path.set([]);
      spokeBefore.setVisible(false);
      spokeAfter.setVisible(false);
    }

    labelAxis.position.copy(axis).multiplyScalar(2.7);
    labelBefore.position.copy(p).multiplyScalar(1.12);
    labelAfter.position.copy(q).multiplyScalar(1.12);

    readouts.set('axis', fmtVec(axis, 3));
    readouts.set('out', fmtVec(q, 3));
    readouts.set('along', `${fmt(p.dot(axis), 3)} → ${fmt(q.dot(axis), 3)}`);
    readouts.set('len', fmt(radius, 3));
  };

  controls.onChange(update);
  stage.onTheme(() => {
    axisLine.setColor(vecColor('normal'));
    axisArrow.setColor(vecColor('normal'));
    before.setColor(vecColor('a'));
    after.setColor(vecColor('result'));
    path.setColor(vecColor('guide'));
    alongAxis.setColor(vecColor('negative'));
    spokeBefore.setColor(vecColor('guide'));
    spokeAfter.setColor(vecColor('guide'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '回転軸', color: vecColor('normal'), dashed: true },
      { label: '回す前の点 p', color: vecColor('a') },
      { label: "回した後の点 p'", color: vecColor('result') },
      { label: '軸方向の成分（動かない部分）', color: vecColor('negative') },
      { label: '点がなぞる円', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
