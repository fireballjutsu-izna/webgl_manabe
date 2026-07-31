/**
 * CH.2-37 弧長 — t を等速で進めても、曲線の上は等速にならない。
 *
 * 同じ曲線の上を 2 つの球が走る。
 * 片方は t をそのまま等速で、もう片方は距離で等分した位置を使う。
 * 曲がりのきついところで、前者だけが減速するのが目で見える。
 */

import * as THREE from 'three';
import { createPoint, createPolyline, fmt, vecColor } from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

/** 曲がり方が場所によって大きく違う曲線。ここが要点なので、極端な形にしてある。 */
const POINTS = [
  new THREE.Vector3(-4.5, -1.2, 0),
  new THREE.Vector3(-2.2, 2.2, 0),
  new THREE.Vector3(-1.6, -2.0, 0),
  new THREE.Vector3(1.0, 1.4, 0),
  new THREE.Vector3(4.5, 0.4, 0),
];

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 0.2, 11],
    target: [0, 0.2, 0],
    controls: false,
    labels: true,
  });

  const spline = new THREE.CatmullRomCurve3(POINTS);

  const line = createPolyline(vecColor('guide'), 300);
  stage.scene.add(line.object);
  line.set(spline.getPoints(240));

  // t を等分した目盛りと、距離を等分した目盛り
  const marksT: THREE.Mesh[] = [];
  const marksS: THREE.Mesh[] = [];
  for (let i = 0; i < 21; i += 1) {
    const a = createPoint(vecColor('b'), 0.06);
    const b = createPoint(vecColor('result'), 0.06);
    marksT.push(a);
    marksS.push(b);
    stage.scene.add(a, b);
  }

  const ballT = createPoint(vecColor('b'), 0.17);
  const ballS = createPoint(vecColor('result'), 0.17);
  stage.scene.add(ballT, ballS);

  const labelT = stage.addLabel('t をそのまま進めた球', vecColor('b'));
  const labelS = stage.addLabel('距離で等分した球', vecColor('result'));
  stage.scene.add(labelT, labelS);

  const controls = createControls([
    { kind: 'range', id: 'u', label: '進み具合', min: 0, max: 1, step: 0.002, value: 0.35 },
    { kind: 'check', id: 'auto', label: '自動で往復させる', value: true },
    { kind: 'check', id: 'marks', label: '20 等分した目盛りを出す', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'u', label: '進み具合' },
    { key: 'gap', label: '2 つの球のずれ', color: vecColor('normal') },
    { key: 'speedT', label: 't 側の速さ（等速なら一定）', color: vecColor('b') },
    { key: 'speedS', label: '距離側の速さ', color: vecColor('result') },
  ]);

  const total = spline.getLength();
  const prevT = new THREE.Vector3();
  const prevS = new THREE.Vector3();
  const nowT = new THREE.Vector3();
  const nowS = new THREE.Vector3();

  const update = (): void => {
    const u = controls.num('u');
    const showMarks = controls.bool('marks');

    // t をそのまま使う（getPoint）と、距離で等分する（getPointAt）
    spline.getPoint(u, nowT);
    spline.getPointAt(u, nowS);
    ballT.position.copy(nowT).setZ(0.05);
    ballS.position.copy(nowS).setZ(0.05);
    labelT.position.copy(nowT).add(new THREE.Vector3(0, 0.5, 0));
    labelS.position.copy(nowS).add(new THREE.Vector3(0, -0.5, 0));

    for (let i = 0; i < marksT.length; i += 1) {
      const v = i / (marksT.length - 1);
      marksT[i]!.position.copy(spline.getPoint(v)).setZ(0.02);
      marksS[i]!.position.copy(spline.getPointAt(v)).setZ(0.03);
      marksT[i]!.visible = showMarks;
      marksS[i]!.visible = showMarks;
    }

    // 少し先の点との距離で、その場の速さを測る
    const h = 0.01;
    const u2 = Math.min(1, u + h);
    const speedT = spline.getPoint(u2).distanceTo(nowT) / h;
    const speedS = spline.getPointAt(u2).distanceTo(nowS) / h;

    readouts.set('u', fmt(u, 3));
    readouts.set('gap', fmt(nowT.distanceTo(nowS), 3));
    readouts.set('speedT', fmt(speedT, 2));
    readouts.set('speedS', `${fmt(speedS, 2)}（曲線の長さ ${fmt(total, 2)}）`);
  };

  let elapsed = 0;
  controls.onChange(update);
  stage.onFrame((dt) => {
    if (!controls.bool('auto') || stage.reduceMotion) return;
    elapsed += dt * 0.3;
    controls.set('u', Math.sin(elapsed) * 0.5 + 0.5);
  });
  stage.onTheme(() => {
    line.setColor(vecColor('guide'));
    for (const m of marksT) (m.material as THREE.MeshBasicMaterial).color.set(vecColor('b'));
    for (const m of marksS) (m.material as THREE.MeshBasicMaterial).color.set(vecColor('result'));
    (ballT.material as THREE.MeshBasicMaterial).color.set(vecColor('b'));
    (ballS.material as THREE.MeshBasicMaterial).color.set(vecColor('result'));
  });

  update();
  prevT.copy(nowT);
  prevS.copy(nowS);

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 't をそのまま進めた球（getPoint）', color: vecColor('b') },
      { label: '距離で等分した球（getPointAt）', color: vecColor('result') },
      { label: '曲線', color: vecColor('guide') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
