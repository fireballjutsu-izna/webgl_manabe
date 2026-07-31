/**
 * CH.1-23 atan2 — 座標から角度を戻す。
 *
 * sin と cos は「角度 → 座標」だった。その逆をやるのが atan2 で、
 * 「マウスのほうを向く」「進行方向に機首を向ける」はすべてこれで書く。
 * 引数の順番が (y, x) であることと、-π〜π を返すことを、絵と数字の両方で見せる。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import {
  createArc,
  createPoint,
  createPolyline,
  createSegment,
  fmt,
  vecColor,
} from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { cssVar } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const SPAN = 3;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 0, 8.5],
    controls: false,
    labels: true,
  });

  /* ---- 方眼・軸・単位円 ---- */

  const gridPoints: THREE.Vector3[] = [];
  for (let n = -SPAN; n <= SPAN; n += 1) {
    gridPoints.push(new THREE.Vector3(n, -SPAN, 0), new THREE.Vector3(n, SPAN, 0));
    gridPoints.push(new THREE.Vector3(-SPAN, n, 0), new THREE.Vector3(SPAN, n, 0));
  }
  const gridMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(cssVar('--border', '#26263c')),
    fog: false,
  });
  stage.scene.add(
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPoints), gridMaterial),
  );

  const axisX = createSegment(vecColor('guide'));
  axisX.set(new THREE.Vector3(-SPAN, 0, 0.01), new THREE.Vector3(SPAN, 0, 0.01));
  const axisY = createSegment(vecColor('guide'));
  axisY.set(new THREE.Vector3(0, -SPAN, 0.01), new THREE.Vector3(0, SPAN, 0.01));
  stage.scene.add(axisX.object, axisY.object);

  // 角度 0 の向き（x 軸のプラス側）。ここから測る、という基準を出しておく
  const zero = createSegment(vecColor('guide'), true);
  zero.set(new THREE.Vector3(0, 0, 0.02), new THREE.Vector3(SPAN, 0, 0.02));
  stage.scene.add(zero.object);

  const circle = createPolyline(vecColor('guide'), 130);
  const circlePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 128; i += 1) {
    const t = (i / 128) * Math.PI * 2;
    circlePoints.push(new THREE.Vector3(Math.cos(t), Math.sin(t), 0));
  }
  circle.set(circlePoints);
  stage.scene.add(circle.object);

  /* ---- 点と、そこまでの線・角度の弧 ---- */

  const ray = createSegment(vecColor('a'));
  stage.scene.add(ray.object);

  const dot = createPoint(vecColor('a'), 0.12);
  stage.scene.add(dot);

  const arc = createArc(vecColor('result'), 64);
  stage.scene.add(arc.object);

  const labelP = stage.addLabel('P', vecColor('a'));
  const labelAngle = stage.addLabel('θ', vecColor('result'));
  stage.scene.add(labelP, labelAngle);

  const controls = createControls([
    { kind: 'range', id: 'x', label: '点 P の x', min: -SPAN, max: SPAN, step: 0.1, value: 1.5 },
    { kind: 'range', id: 'y', label: '点 P の y', min: -SPAN, max: SPAN, step: 0.1, value: 1.5 },
  ]);

  const readouts = createReadouts([
    { key: 'p', label: '点 P', color: vecColor('a') },
    { key: 'rad', label: 'atan2(y, x)', color: vecColor('result') },
    { key: 'deg', label: '度に直すと', color: vecColor('result') },
    { key: 'back', label: '角度から座標に戻すと' },
  ]);

  const p = new THREE.Vector3();
  const xAxis = new THREE.Vector3(1, 0, 0);
  const tmp = new THREE.Vector3();

  const update = (): void => {
    const x = controls.num('x');
    const y = controls.num('y');
    p.set(x, y, 0.03);

    dot.position.copy(p);
    labelP.position.set(x, y + 0.38, 0);
    ray.set(new THREE.Vector3(0, 0, 0.02), new THREE.Vector3(x, y, 0.02));

    const angle = Math.atan2(y, x);
    const len = Math.hypot(x, y);

    // 0 の向きから P の向きまでの弧。長さ 0 のときは角度が決まらない
    const ok = len > 1e-6;
    arc.object.visible = ok;
    labelAngle.visible = ok;
    if (ok) {
      arc.set(xAxis, tmp.set(x, y, 0), 0.75);
      const half = angle / 2;
      labelAngle.position.set(Math.cos(half) * 1.05, Math.sin(half) * 1.05, 0);
    }

    readouts.set('p', `(${fmt(x, 1)}, ${fmt(y, 1)})`);
    readouts.set('rad', ok ? `${fmt(angle, 3)} rad` : '決まらない（原点なので向きが無い）');
    readouts.set('deg', ok ? `${fmt(THREE.MathUtils.radToDeg(angle), 1)}°` : '—');
    readouts.set(
      'back',
      ok
        ? `(cos θ, sin θ) × ${fmt(len, 2)} = (${fmt(Math.cos(angle) * len, 1)}, ${fmt(Math.sin(angle) * len, 1)})`
        : '—',
    );
  };

  controls.onChange(update);
  stage.onTheme(() => {
    gridMaterial.color.set(cssVar('--border', '#26263c'));
    axisX.setColor(vecColor('guide'));
    axisY.setColor(vecColor('guide'));
    zero.setColor(vecColor('guide'));
    circle.setColor(vecColor('guide'));
    ray.setColor(vecColor('a'));
    arc.setColor(vecColor('result'));
    (dot.material as THREE.MeshBasicMaterial).color.set(vecColor('a'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '点 P と、原点からの線', color: vecColor('a') },
      { label: 'atan2 が返す角度', color: vecColor('result') },
      { label: '角度 0 の向きと、半径 1 の円', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
