/**
 * CH.2-09 回転の式 — 点を原点まわりに θ だけ回すと、どこへ行くか。
 *
 * 回転の公式は 3D の話に見えて、中身はすべて 2D の平面の上で起きている。
 * ここで「長さが変わらない」「cos と sin が混ざる」ことを目で見ておくと、
 * オイラー角もクォータニオンも、あとは同じ話の繰り返しになる。
 */

import * as THREE from 'three';
import {
  createArc,
  createArrow,
  createPolyline,
  createSegment,
  fmt,
  vecColor,
} from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { cssVar } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const SPAN = 5;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 0, 15],
    controls: false,
    labels: true,
  });

  /* ---- xy 平面の方眼（GridHelper は xz 平面なので使えない） ---- */

  const gridPoints: THREE.Vector3[] = [];
  for (let n = -SPAN; n <= SPAN; n += 1) {
    gridPoints.push(new THREE.Vector3(n, -SPAN, -0.02), new THREE.Vector3(n, SPAN, -0.02));
    gridPoints.push(new THREE.Vector3(-SPAN, n, -0.02), new THREE.Vector3(SPAN, n, -0.02));
  }
  const gridMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(cssVar('--border', '#26263c')),
    fog: false,
  });
  stage.scene.add(
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPoints), gridMaterial),
  );

  const axisMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(cssVar('--border-lit', '#3a3a5c')),
    fog: false,
  });
  stage.scene.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-SPAN, 0, -0.01),
        new THREE.Vector3(SPAN, 0, -0.01),
        new THREE.Vector3(0, -SPAN, -0.01),
        new THREE.Vector3(0, SPAN, -0.01),
      ]),
      axisMaterial,
    ),
  );

  /* ---- 回る前・回った後・その軌跡 ---- */

  // 半径が変わらないことを示す円（点が通る道）
  const circle = createPolyline(vecColor('guide'), 130, true);
  stage.scene.add(circle.object);

  const before = createArrow(vecColor('a'), { radius: 0.035, headRadius: 0.11 });
  const after = createArrow(vecColor('result'), { radius: 0.05, headRadius: 0.14 });
  stage.scene.add(before.object, after.object);

  // 回った点を x 成分と y 成分に分解して見せる
  const compX = createSegment(vecColor('guide'), true);
  const compY = createSegment(vecColor('guide'), true);
  stage.scene.add(compX.object, compY.object);

  const arc = createArc(vecColor('normal'), 64);
  stage.scene.add(arc.object);

  const labelBefore = stage.addLabel('p（回す前）', vecColor('a'));
  const labelAfter = stage.addLabel("p'（回した後）", vecColor('result'));
  const labelAngle = stage.addLabel('θ', vecColor('normal'));
  stage.scene.add(labelBefore, labelAfter, labelAngle);

  const controls = createControls([
    { kind: 'range', id: 'px', label: '点 p の x', min: -4, max: 4, step: 0.5, value: 3 },
    { kind: 'range', id: 'py', label: '点 p の y', min: -4, max: 4, step: 0.5, value: 4 },
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
    { kind: 'check', id: 'parts', label: 'x 成分と y 成分に分けて見る', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'cs', label: 'cos θ と sin θ' },
    { key: 'x', label: "x' = x cosθ − y sinθ", color: vecColor('result') },
    { key: 'y', label: "y' = x sinθ + y cosθ", color: vecColor('result') },
    { key: 'len', label: '長さ（回しても変わらない）', color: vecColor('normal') },
  ]);

  const p = new THREE.Vector3();
  const q = new THREE.Vector3();
  const org = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  const update = (): void => {
    const px = controls.num('px');
    const py = controls.num('py');
    const rad = THREE.MathUtils.degToRad(controls.num('deg'));
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // これが回転の式そのもの。x と y が混ざるところが要点
    const qx = px * cos - py * sin;
    const qy = px * sin + py * cos;

    p.set(px, py, 0);
    q.set(qx, qy, 0);

    before.set(p);
    after.set(q);
    before.setVisible(p.lengthSq() > 1e-8);
    after.setVisible(q.lengthSq() > 1e-8);

    const radius = p.length();
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i += 1) {
      const t = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius, -0.005));
    }
    circle.set(radius > 1e-6 ? pts : []);

    const showParts = controls.bool('parts');
    compX.setVisible(showParts);
    compY.setVisible(showParts);
    if (showParts) {
      compX.set(org.set(qx, 0, 0), tmp.set(qx, qy, 0));
      compY.set(org.set(0, qy, 0), tmp.set(qx, qy, 0));
    }

    arc.set(p, q, Math.min(radius * 0.45, 1.6));
    labelBefore.position.copy(p).multiplyScalar(1.13);
    labelAfter.position.copy(q).multiplyScalar(1.13);
    tmp.copy(p).normalize().add(q.clone().normalize());
    labelAngle.position.copy(
      tmp.lengthSq() > 1e-6
        ? tmp.normalize().multiplyScalar(Math.min(radius * 0.45, 1.6) + 0.35)
        : org.set(0, 0.5, 0),
    );

    readouts.set('cs', `${fmt(cos, 3)} / ${fmt(sin, 3)}`);
    readouts.set(
      'x',
      `${fmt(px, 1)}×${fmt(cos, 3)} − ${fmt(py, 1)}×${fmt(sin, 3)} = ${fmt(qx, 3)}`,
    );
    readouts.set(
      'y',
      `${fmt(px, 1)}×${fmt(sin, 3)} + ${fmt(py, 1)}×${fmt(cos, 3)} = ${fmt(qy, 3)}`,
    );
    readouts.set('len', `${fmt(radius, 3)} → ${fmt(q.length(), 3)}`);
  };

  controls.onChange(update);
  stage.onTheme(() => {
    gridMaterial.color.set(cssVar('--border', '#26263c'));
    axisMaterial.color.set(cssVar('--border-lit', '#3a3a5c'));
    circle.setColor(vecColor('guide'));
    before.setColor(vecColor('a'));
    after.setColor(vecColor('result'));
    compX.setColor(vecColor('guide'));
    compY.setColor(vecColor('guide'));
    arc.setColor(vecColor('normal'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '回す前の点 p', color: vecColor('a') },
      { label: "回した後の点 p'", color: vecColor('result') },
      { label: '回した角度 θ', color: vecColor('normal') },
      { label: '点が通る円と、成分への分解', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
