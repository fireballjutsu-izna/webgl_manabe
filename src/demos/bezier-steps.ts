/**
 * CH.2-35 ベジェ曲線 — 補間を、補間する。
 *
 * 制御点を線で結び、その上を t で補間して新しい点を作る。
 * その点をまた結んで、また補間する。段を重ねて 1 点になったところが、曲線の上の点。
 * de Casteljau のアルゴリズムそのもので、曲線が「lerp の入れ子」だと目で分かる。
 */

import * as THREE from 'three';
import { createPoint, createPolyline, fmt, vecColor } from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { cssVar } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const P0 = new THREE.Vector3(-4.2, -1.8, 0);
const P1 = new THREE.Vector3(-2.4, 2.6, 0);
const P2 = new THREE.Vector3(2.4, -2.6, 0);
const P3 = new THREE.Vector3(4.2, 1.8, 0);

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 0, 12],
    controls: false,
    labels: true,
  });

  const gridPoints: THREE.Vector3[] = [];
  for (let n = -5; n <= 5; n += 1) {
    gridPoints.push(new THREE.Vector3(n, -3.5, -0.02), new THREE.Vector3(n, 3.5, -0.02));
  }
  for (let n = -3; n <= 3; n += 1) {
    gridPoints.push(new THREE.Vector3(-5, n, -0.02), new THREE.Vector3(5, n, -0.02));
  }
  const gridMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(cssVar('--border', '#26263c')),
    fog: false,
  });
  stage.scene.add(
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPoints), gridMaterial),
  );

  // 制御点を結ぶ線（1 段目）と、そのあとの各段
  const level1 = createPolyline(vecColor('guide'), 8, true);
  const level2 = createPolyline(vecColor('b'), 8);
  const level3 = createPolyline(vecColor('normal'), 8);
  stage.scene.add(level1.object, level2.object, level3.object);

  // 曲線そのもの
  const curve = createPolyline(vecColor('result'), 130);
  stage.scene.add(curve.object);

  const ctrlDots = [P0, P1, P2, P3].map(() => createPoint(vecColor('guide'), 0.11));
  const dots2 = [0, 1, 2].map(() => createPoint(vecColor('b'), 0.09));
  const dots3 = [0, 1].map(() => createPoint(vecColor('normal'), 0.09));
  const dotFinal = createPoint(vecColor('result'), 0.14);
  for (const d of [...ctrlDots, ...dots2, ...dots3, dotFinal]) stage.scene.add(d);

  const labels = ['P0', 'P1', 'P2', 'P3'].map((t) => stage.addLabel(t, vecColor('guide')));
  const labelFinal = stage.addLabel('曲線の上の点', vecColor('result'));
  for (const l of [...labels, labelFinal]) stage.scene.add(l);

  const controls = createControls([
    { kind: 'range', id: 't', label: '進み具合 t', min: 0, max: 1, step: 0.005, value: 0.35 },
    { kind: 'check', id: 'auto', label: '自動で往復させる', value: true },
    { kind: 'check', id: 'steps', label: '途中の段を見せる', value: true },
    { kind: 'check', id: 'full', label: '曲線ぜんぶを描く', value: true },
  ]);

  const readouts = createReadouts([
    { key: 't', label: 't', color: vecColor('result') },
    { key: 'l2', label: '1 段目（3 点になる）', color: vecColor('b') },
    { key: 'l3', label: '2 段目（2 点になる）', color: vecColor('normal') },
    { key: 'p', label: '3 段目 ＝ 曲線の上の点', color: vecColor('result') },
  ]);

  /** 4 点を t で 3 段補間して、途中経過ごと返す。 */
  function deCasteljau(t: number): {
    a: THREE.Vector3[];
    b: THREE.Vector3[];
    p: THREE.Vector3;
  } {
    const a = [
      new THREE.Vector3().lerpVectors(P0, P1, t),
      new THREE.Vector3().lerpVectors(P1, P2, t),
      new THREE.Vector3().lerpVectors(P2, P3, t),
    ];
    const b = [
      new THREE.Vector3().lerpVectors(a[0]!, a[1]!, t),
      new THREE.Vector3().lerpVectors(a[1]!, a[2]!, t),
    ];
    return { a, b, p: new THREE.Vector3().lerpVectors(b[0]!, b[1]!, t) };
  }

  let elapsed = 0;

  const update = (): void => {
    const t = controls.num('t');
    const showSteps = controls.bool('steps');

    const { a, b, p } = deCasteljau(t);

    level1.set(showSteps ? [P0, P1, P2, P3] : []);
    level2.set(showSteps ? a : []);
    level3.set(showSteps ? b : []);

    ctrlDots.forEach((d, i) => {
      d.position.copy([P0, P1, P2, P3][i]!);
      d.visible = showSteps;
      labels[i]!.visible = showSteps;
      labels[i]!.position.copy([P0, P1, P2, P3][i]!).add(new THREE.Vector3(0, 0.42, 0));
    });
    dots2.forEach((d, i) => {
      d.position.copy(a[i]!);
      d.visible = showSteps;
    });
    dots3.forEach((d, i) => {
      d.position.copy(b[i]!);
      d.visible = showSteps;
    });

    dotFinal.position.copy(p).setZ(0.05);
    labelFinal.position.copy(p).add(new THREE.Vector3(0, -0.5, 0));

    if (controls.bool('full')) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 128; i += 1) {
        pts.push(deCasteljau(i / 128).p.setZ(0.01));
      }
      curve.set(pts);
    } else {
      // 進んだところまでだけ描く（曲線が「引かれていく」のが見える）
      const steps = Math.max(2, Math.round(t * 128));
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= steps; i += 1) {
        pts.push(deCasteljau((i / steps) * t).p.setZ(0.01));
      }
      curve.set(pts);
    }

    readouts.set('t', fmt(t, 3));
    readouts.set('l2', `(${fmt(a[0]!.x, 2)}, ${fmt(a[0]!.y, 2)}) ほか 2 点`);
    readouts.set('l3', `(${fmt(b[0]!.x, 2)}, ${fmt(b[0]!.y, 2)}) ほか 1 点`);
    readouts.set('p', `(${fmt(p.x, 3)}, ${fmt(p.y, 3)})`);
  };

  controls.onChange(update);
  stage.onFrame((dt) => {
    if (!controls.bool('auto') || stage.reduceMotion) return;
    elapsed += dt * 0.35;
    controls.set('t', (Math.sin(elapsed) * 0.5 + 0.5));
  });
  stage.onTheme(() => {
    gridMaterial.color.set(cssVar('--border', '#26263c'));
    level1.setColor(vecColor('guide'));
    level2.setColor(vecColor('b'));
    level3.setColor(vecColor('normal'));
    curve.setColor(vecColor('result'));
    for (const d of ctrlDots) (d.material as THREE.MeshBasicMaterial).color.set(vecColor('guide'));
    for (const d of dots2) (d.material as THREE.MeshBasicMaterial).color.set(vecColor('b'));
    for (const d of dots3) (d.material as THREE.MeshBasicMaterial).color.set(vecColor('normal'));
    (dotFinal.material as THREE.MeshBasicMaterial).color.set(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '制御点と、それを結ぶ線', color: vecColor('guide'), dashed: true },
      { label: '1 段目の補間（3 点）', color: vecColor('b') },
      { label: '2 段目の補間（2 点）', color: vecColor('normal') },
      { label: '3 段目 ＝ 曲線', color: vecColor('result') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
