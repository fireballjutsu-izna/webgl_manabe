/**
 * CH.2-31 反射 — 法線に沿った成分だけを裏返す。
 *
 * 入ってくる向きを「面に沿った成分」と「法線に沿った成分」に分け、
 * 後者だけ符号を反転する。それが反射のすべてで、式の -2(d·n)n はその引き算。
 */

import * as THREE from 'three';
import {
  createArc,
  createArrow,
  createSegment,
  fmt,
  fmtVec,
  vecColor,
} from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 1.15, 8],
    target: [0, 1.15, 0],
    controls: false,
    labels: true,
  });

  // 鏡の面
  const surfaceLine = createSegment(vecColor('guide'));
  stage.scene.add(surfaceLine.object);

  const normal = createArrow(vecColor('normal'), { radius: 0.03, headRadius: 0.09 });
  const incoming = createArrow(vecColor('a'), { radius: 0.038, headRadius: 0.11 });
  const reflected = createArrow(vecColor('result'), { radius: 0.05, headRadius: 0.14 });
  stage.scene.add(normal.object, incoming.object, reflected.object);

  // 分解した 2 つの成分（面に沿った分・法線に沿った分）
  const alongIn = createSegment(vecColor('b'), true);
  const alongOut = createSegment(vecColor('b'), true);
  const perpIn = createSegment(vecColor('negative'), true);
  const perpOut = createSegment(vecColor('negative'), true);
  stage.scene.add(alongIn.object, alongOut.object, perpIn.object, perpOut.object);

  const arcIn = createArc(vecColor('guide'), 40);
  const arcOut = createArc(vecColor('guide'), 40);
  stage.scene.add(arcIn.object, arcOut.object);

  const labelN = stage.addLabel('法線 n', vecColor('normal'));
  const labelD = stage.addLabel('入ってくる向き d', vecColor('a'));
  const labelR = stage.addLabel('反射 r', vecColor('result'));
  stage.scene.add(labelN, labelD, labelR);

  const controls = createControls([
    {
      kind: 'range',
      id: 'incid',
      label: '入ってくる角度（法線から）',
      min: 0,
      max: 85,
      step: 1,
      value: 55,
      format: (v) => `${v.toFixed(0)}°`,
    },
    {
      kind: 'range',
      id: 'tilt',
      label: '面の傾き',
      min: -60,
      max: 60,
      step: 1,
      value: 0,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'check', id: 'parts', label: '2 つの成分に分けて見る', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'dn', label: 'd·n（法線に沿った分）', color: vecColor('negative') },
    { key: 'r', label: '反射 r', color: vecColor('result') },
    { key: 'angles', label: '入る角度 → 出る角度', color: vecColor('normal') },
    { key: 'note', label: '確かめ' },
  ]);

  const n = new THREE.Vector3();
  const d = new THREE.Vector3();
  const r = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const hit = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  const update = (): void => {
    const tilt = THREE.MathUtils.degToRad(controls.num('tilt'));
    const incid = THREE.MathUtils.degToRad(controls.num('incid'));

    // 面の法線と、面に沿った向き
    n.set(-Math.sin(tilt), Math.cos(tilt), 0);
    tangent.set(Math.cos(tilt), Math.sin(tilt), 0);

    // 入ってくる向き（面へ向かって進む向き）
    d.copy(n).multiplyScalar(-Math.cos(incid)).addScaledVector(tangent, Math.sin(incid));

    // 反射：法線に沿った成分だけを裏返す
    const dn = d.dot(n);
    r.copy(d).addScaledVector(n, -2 * dn);

    hit.set(0, 0, 0);

    surfaceLine.set(
      tmp.copy(tangent).multiplyScalar(-3.4),
      new THREE.Vector3(tangent.x * 3.4, tangent.y * 3.4, 0),
    );

    normal.set(tmp.copy(n).multiplyScalar(2.4));
    // 入ってくる矢印は、面の手前から面へ向かって描く
    incoming.set(tmp.copy(d).multiplyScalar(3), hit.clone().addScaledVector(d, -3));
    reflected.set(tmp.copy(r).multiplyScalar(3));

    labelN.position.copy(n).multiplyScalar(2.7);
    labelD.position.copy(d).multiplyScalar(-3.3);
    labelR.position.copy(r).multiplyScalar(3.3);

    const showParts = controls.bool('parts');
    alongIn.setVisible(showParts);
    alongOut.setVisible(showParts);
    perpIn.setVisible(showParts);
    perpOut.setVisible(showParts);
    if (showParts) {
      const start = tmp.copy(d).multiplyScalar(-3).clone();
      const dt = d.dot(tangent) * 3; // 面に沿った分
      const dnPart = dn * 3; // 法線に沿った分（負＝面へ向かう）

      // 入る側：まず法線に沿って降り、そのあと面に沿って原点へ
      const cornerIn = start.clone().addScaledVector(n, dnPart);
      perpIn.set(start, cornerIn);
      alongIn.set(cornerIn, hit);

      // 出る側：まず面に沿って進み、そのあと法線に沿って上がる
      const cornerOut = hit.clone().addScaledVector(tangent, dt);
      alongOut.set(hit, cornerOut);
      perpOut.set(cornerOut, cornerOut.clone().addScaledVector(n, -dnPart));
    }

    arcIn.set(n, tmp.copy(d).multiplyScalar(-1), 1.1);
    arcOut.set(n, r, 1.35);

    readouts.set('dn', fmt(dn, 3));
    readouts.set('r', fmtVec(r, 3));
    const angIn = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(-d.dot(n), -1, 1)));
    const angOut = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(r.dot(n), -1, 1)));
    readouts.set('angles', `${fmt(angIn, 1)}° → ${fmt(angOut, 1)}°`);
    readouts.set(
      'note',
      `長さ ${fmt(d.length(), 3)} → ${fmt(r.length(), 3)}（変わらない）`,
    );
  };

  controls.onChange(update);
  stage.onTheme(() => {
    surfaceLine.setColor(vecColor('guide'));
    normal.setColor(vecColor('normal'));
    incoming.setColor(vecColor('a'));
    reflected.setColor(vecColor('result'));
    alongIn.setColor(vecColor('b'));
    alongOut.setColor(vecColor('b'));
    perpIn.setColor(vecColor('negative'));
    perpOut.setColor(vecColor('negative'));
    arcIn.setColor(vecColor('guide'));
    arcOut.setColor(vecColor('guide'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '入ってくる向き d', color: vecColor('a') },
      { label: '法線 n', color: vecColor('normal') },
      { label: '反射 r', color: vecColor('result') },
      { label: '面に沿った成分（そのまま）', color: vecColor('b'), dashed: true },
      { label: '法線に沿った成分（裏返る）', color: vecColor('negative'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
