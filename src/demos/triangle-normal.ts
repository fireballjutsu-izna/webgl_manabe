/**
 * CH.1-31 三角形の法線 — 頂点を並べた順番で、面の向きが裏返る。
 *
 * 「モデルが裏返って見えない」の原因はここにあることが多いのに、
 * 文章で読んでも実感が湧かない。順番を入れ替えるボタン 1 つで反転を見せる。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import {
  createArrow,
  createPoint,
  createPolyline,
  fmt,
  fmtVec,
  solidMaterial,
  addStudioLights,
  vecColor,
} from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [4.5, 4, 6.5],
    grid: 8,
    axes: 1.4,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });
  addStudioLights(stage.scene);

  // 面そのもの。表と裏で色を変えて、どちらを見ているか分かるようにする
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
  const front = solidMaterial(vecColor('result'), { side: THREE.FrontSide, transparent: true, opacity: 0.55 });
  const back = solidMaterial(vecColor('negative'), { side: THREE.BackSide, transparent: true, opacity: 0.55 });
  stage.scene.add(new THREE.Mesh(geometry, front), new THREE.Mesh(geometry, back));

  const outline = createPolyline(vecColor('guide'), 8);
  stage.scene.add(outline.object);

  const dots = [
    createPoint(vecColor('a'), 0.1),
    createPoint(vecColor('b'), 0.1),
    createPoint(vecColor('guide'), 0.1),
  ];
  for (const d of dots) stage.scene.add(d);

  const labels = [
    stage.addLabel('P0', vecColor('a')),
    stage.addLabel('P1', vecColor('b')),
    stage.addLabel('P2', 'var(--text-muted)'),
  ];
  for (const l of labels) stage.scene.add(l);

  // 2 本の辺と、その外積である法線
  const edge1 = createArrow(vecColor('a'), { radius: 0.024, headRadius: 0.07 });
  const edge2 = createArrow(vecColor('b'), { radius: 0.024, headRadius: 0.07 });
  const normal = createArrow(vecColor('normal'), { radius: 0.032, headRadius: 0.09 });
  stage.scene.add(edge1.object, edge2.object, normal.object);

  const labelN = stage.addLabel('法線', vecColor('normal'));
  stage.scene.add(labelN);

  const controls = createControls([
    { kind: 'range', id: 'x2', label: 'P2 の x', min: -3, max: 3, step: 0.1, value: -1.5 },
    { kind: 'range', id: 'y2', label: 'P2 の y', min: -3, max: 3, step: 0.1, value: 1.5 },
    { kind: 'range', id: 'z2', label: 'P2 の z', min: -3, max: 3, step: 0.1, value: 0.5 },
    { kind: 'check', id: 'swap', label: 'P1 と P2 を入れ替える（並べる順を逆にする）', value: false },
  ]);

  const readouts = createReadouts([
    { key: 'order', label: '掛ける順番' },
    { key: 'n', label: '法線（長さ 1）', color: vecColor('normal') },
    { key: 'area', label: '外積の長さ ＝ 平行四辺形の面積' },
    { key: 'check', label: '法線と 2 辺の内積' },
  ]);

  const p0 = new THREE.Vector3(0.5, -1, 2);
  const p1 = new THREE.Vector3(2, 0, -1);
  const p2 = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const cross = new THREE.Vector3();
  const unit = new THREE.Vector3();
  const center = new THREE.Vector3();
  const up = new THREE.Vector3(0, 0.3, 0);

  const update = (): void => {
    p2.set(controls.num('x2'), controls.num('y2'), controls.num('z2'));
    const swap = controls.bool('swap');

    // 並べる順が変わると、外積の 2 辺も入れ替わる
    const a = swap ? p2 : p1;
    const b = swap ? p1 : p2;

    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.setXYZ(0, p0.x, p0.y, p0.z);
    attr.setXYZ(1, a.x, a.y, a.z);
    attr.setXYZ(2, b.x, b.y, b.z);
    attr.needsUpdate = true;
    geometry.computeBoundingSphere();

    outline.set([p0, p1, p2, p0]);

    dots[0]!.position.copy(p0);
    dots[1]!.position.copy(p1);
    dots[2]!.position.copy(p2);
    labels[0]!.position.copy(p0).add(up);
    labels[1]!.position.copy(p1).add(up);
    labels[2]!.position.copy(p2).add(up);

    e1.subVectors(a, p0);
    e2.subVectors(b, p0);
    cross.crossVectors(e1, e2);
    const area = cross.length();

    edge1.set(e1, p0);
    edge2.set(e2, p0);

    center.copy(p0).add(a).add(b).divideScalar(3);
    const ok = area > 1e-6;
    normal.setVisible(ok);
    labelN.visible = ok;
    if (ok) {
      unit.copy(cross).divideScalar(area).multiplyScalar(1.6);
      normal.set(unit, center);
      labelN.position.copy(center).addScaledVector(unit, 1.25);
    }

    readouts.set('order', swap ? '(P2 - P0) × (P1 - P0)' : '(P1 - P0) × (P2 - P0)');
    readouts.set('n', ok ? fmtVec(cross.clone().divideScalar(area), 2) : '決まらない（3 点が一直線）');
    readouts.set('area', fmt(area, 3));
    readouts.set(
      'check',
      ok
        ? `辺1 と ${fmt(cross.dot(e1) / area, 3)} / 辺2 と ${fmt(cross.dot(e2) / area, 3)}`
        : '—',
    );
  };

  controls.onChange(update);
  stage.onTheme(() => {
    front.color.set(vecColor('result'));
    back.color.set(vecColor('negative'));
    outline.setColor(vecColor('guide'));
    edge1.setColor(vecColor('a'));
    edge2.setColor(vecColor('b'));
    normal.setColor(vecColor('normal'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '1 本目の辺（P0 → 先に書いた点）', color: vecColor('a') },
      { label: '2 本目の辺（P0 → あとに書いた点）', color: vecColor('b') },
      { label: '外積で出てくる法線', color: vecColor('normal') },
      { label: '面の表（アンバー）と裏（バイオレット）', color: vecColor('result') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
