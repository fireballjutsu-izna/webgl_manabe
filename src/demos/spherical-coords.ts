/**
 * CH.2-22 球面座標 — 緯度・経度・半径の 3 つの数から、x y z を組み立てる。
 *
 * 要点は「先に水平面へ潰す」こと。緯度で高さと水平半径が決まり、
 * その水平半径の円の上を経度が回る。式の cos が 2 回出てくる理由がそこにある。
 */

import * as THREE from 'three';
import {
  createArrow,
  createPoint,
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

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [4.4, 3.2, 5.2],
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  // 球の骨組み。三角形の網ではなく、地球儀のような緯線・経線の格子にする
  // （細かい網だと、中に引く補助線が見えなくなる）
  const framePoints: THREE.Vector3[] = [];
  const R0 = 2;
  const push = (a: THREE.Vector3, b: THREE.Vector3): void => {
    framePoints.push(a, b);
  };
  for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
    const lat = THREE.MathUtils.degToRad(latDeg);
    const f = Math.cos(lat) * R0;
    const y = Math.sin(lat) * R0;
    for (let i = 0; i < 64; i += 1) {
      const t0 = (i / 64) * Math.PI * 2;
      const t1 = ((i + 1) / 64) * Math.PI * 2;
      push(
        new THREE.Vector3(Math.sin(t0) * f, y, Math.cos(t0) * f),
        new THREE.Vector3(Math.sin(t1) * f, y, Math.cos(t1) * f),
      );
    }
  }
  for (let lonDeg = 0; lonDeg < 180; lonDeg += 30) {
    const lon = THREE.MathUtils.degToRad(lonDeg);
    for (let i = 0; i < 64; i += 1) {
      const t0 = -Math.PI / 2 + (i / 64) * Math.PI;
      const t1 = -Math.PI / 2 + ((i + 1) / 64) * Math.PI;
      const f0 = Math.cos(t0) * R0;
      const f1 = Math.cos(t1) * R0;
      push(
        new THREE.Vector3(f0 * Math.sin(lon), Math.sin(t0) * R0, f0 * Math.cos(lon)),
        new THREE.Vector3(f1 * Math.sin(lon), Math.sin(t1) * R0, f1 * Math.cos(lon)),
      );
    }
  }
  const wire = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(framePoints),
    new THREE.LineBasicMaterial({ color: new THREE.Color(cssVar('--border', '#26263c')), fog: false }),
  );
  stage.scene.add(wire);

  // 緯度の輪（同じ緯度の点が並ぶ）と、経度の輪（子午線）
  const parallel = createPolyline(vecColor('b'), 130);
  const meridian = createPolyline(vecColor('a'), 130);
  stage.scene.add(parallel.object, meridian.object);

  // 高さと水平半径の分解
  const heightLine = createSegment(vecColor('normal'), true);
  const flatLine = createSegment(vecColor('guide'), true);
  const radial = createArrow(vecColor('result'), { radius: 0.03, headRadius: 0.09 });
  stage.scene.add(heightLine.object, flatLine.object, radial.object);

  const dot = createPoint(vecColor('result'), 0.11);
  stage.scene.add(dot);

  const labelP = stage.addLabel('点', vecColor('result'));
  const labelLat = stage.addLabel('同じ緯度の輪', vecColor('b'));
  const labelLon = stage.addLabel('同じ経度の輪', vecColor('a'));
  stage.scene.add(labelP, labelLat, labelLon);

  const controls = createControls([
    {
      kind: 'range',
      id: 'lat',
      label: '緯度（北がプラス）',
      min: -90,
      max: 90,
      step: 1,
      value: 35,
      format: (v) => `${v.toFixed(0)}°`,
    },
    {
      kind: 'range',
      id: 'lon',
      label: '経度',
      min: -180,
      max: 180,
      step: 1,
      value: -40,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'range', id: 'r', label: '半径', min: 0.5, max: 2.6, step: 0.05, value: 2 },
  ]);

  const readouts = createReadouts([
    { key: 'flat', label: '水平方向の半径 r cos(緯度)', color: vecColor('guide') },
    { key: 'y', label: 'y = r sin(緯度)', color: vecColor('normal') },
    { key: 'xz', label: 'x と z', color: vecColor('result') },
    { key: 'len', label: '原点からの距離（半径に一致する）' },
  ]);

  const p = new THREE.Vector3();
  const foot = new THREE.Vector3();
  const org = new THREE.Vector3();

  const update = (): void => {
    const lat = THREE.MathUtils.degToRad(controls.num('lat'));
    const lon = THREE.MathUtils.degToRad(controls.num('lon'));
    const r = controls.num('r');

    // まず水平面へ潰す。そこから経度で回す
    const flat = r * Math.cos(lat);
    const y = r * Math.sin(lat);
    p.set(flat * Math.sin(lon), y, flat * Math.cos(lon));

    dot.position.copy(p);
    radial.set(p);
    labelP.position.copy(p).multiplyScalar(1.15);

    foot.set(p.x, 0, p.z);
    heightLine.set(foot, p);
    flatLine.set(org.set(0, 0, 0), foot);

    // 同じ緯度の輪
    const parPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i += 1) {
      const t = (i / 128) * Math.PI * 2;
      parPts.push(new THREE.Vector3(flat * Math.sin(t), y, flat * Math.cos(t)));
    }
    parallel.set(parPts);

    // 同じ経度の輪（子午線）
    const merPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i += 1) {
      const t = -Math.PI / 2 + (i / 128) * Math.PI;
      const f = r * Math.cos(t);
      merPts.push(new THREE.Vector3(f * Math.sin(lon), r * Math.sin(t), f * Math.cos(lon)));
    }
    meridian.set(merPts);

    labelLat.position.set(flat * Math.sin(lon + 2.2), y, flat * Math.cos(lon + 2.2));
    labelLon.position.set(0, -r * 1.12, 0);

    readouts.set('flat', `${fmt(r, 2)} × ${fmt(Math.cos(lat), 3)} = ${fmt(flat, 3)}`);
    readouts.set('y', `${fmt(r, 2)} × ${fmt(Math.sin(lat), 3)} = ${fmt(y, 3)}`);
    readouts.set('xz', `(${fmt(p.x, 3)}, ${fmt(p.z, 3)})`);
    readouts.set('len', fmt(p.length(), 3));
  };

  controls.onChange(update);
  stage.onTheme(() => {
    (wire.material as THREE.LineBasicMaterial).color.set(cssVar('--border', '#26263c'));
    parallel.setColor(vecColor('b'));
    meridian.setColor(vecColor('a'));
    heightLine.setColor(vecColor('normal'));
    flatLine.setColor(vecColor('guide'));
    radial.setColor(vecColor('result'));
    (dot.material as THREE.MeshBasicMaterial).color.set(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '球の上の点', color: vecColor('result') },
      { label: '同じ緯度の輪（経度を変えるとこの上を動く）', color: vecColor('b') },
      { label: '同じ経度の輪（緯度を変えるとこの上を動く）', color: vecColor('a') },
      { label: '高さ y', color: vecColor('normal'), dashed: true },
      { label: '水平方向の半径', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
