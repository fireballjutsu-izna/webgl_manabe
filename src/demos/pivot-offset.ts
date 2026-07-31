/**
 * CH.2-19 回転の中心 — 物体は必ず「自分のローカル原点」のまわりに回る。
 *
 * ドアの蝶番をどこに置くかで、同じ回転がまったく違う動きになる。
 * ピボットをずらす手段は 2 つ（ジオメトリを動かす／入れ物をかぶせる）だが、
 * どちらも「原点まわりに回る」という規則は一切変えていない。
 */

import * as THREE from 'three';
import {
  addStudioLights,
  createPoint,
  createPolyline,
  createSegment,
  fmt,
  solidMaterial,
  vecColor,
} from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const HALF = 1.4; // ドアの半分の幅

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [3.6, 3.6, 5.6],
    target: [0, 0.7, 0],
    grid: 8,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  addStudioLights(stage.scene);

  // 入れ物（これを回す）と、その中のドア。ドアを中でずらすとピボットが動く
  const pivot = new THREE.Group();
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(HALF * 2, 1.6, 0.08),
    solidMaterial(vecColor('a'), { transparent: true, opacity: 0.9 }),
  );
  door.position.y = 0.8;
  pivot.add(door);
  stage.scene.add(pivot);

  // 回す前の位置（比較用の破線）
  const ghost = createPolyline(vecColor('guide'), 6, true);
  stage.scene.add(ghost.object);

  // 右端がなぞる円
  const path = createPolyline(vecColor('result'), 130, true);
  stage.scene.add(path.object);

  const spoke = createSegment(vecColor('result'));
  stage.scene.add(spoke.object);

  const pivotDot = createPoint(vecColor('normal'), 0.1);
  stage.scene.add(pivotDot);

  const labelPivot = stage.addLabel('回転の中心（ローカル原点）', vecColor('normal'));
  const labelEnd = stage.addLabel('右端', vecColor('result'));
  stage.scene.add(labelPivot, labelEnd);

  const controls = createControls([
    {
      kind: 'range',
      id: 'angle',
      label: '回す角度（y 軸）',
      min: -180,
      max: 180,
      step: 1,
      value: 60,
      format: (v) => `${v.toFixed(0)}°`,
    },
    {
      kind: 'range',
      id: 'offset',
      label: '回転の中心の位置',
      min: -1,
      max: 1,
      step: 0.05,
      value: 0,
      format: (v) => (v < -0.98 ? '左端' : v > 0.98 ? '右端' : `中央から ${v.toFixed(2)}`),
    },
    { kind: 'button', id: 'hinge', label: '蝶番を左端に置く', primary: true },
    { kind: 'button', id: 'center', label: '中央に戻す' },
  ]);

  const readouts = createReadouts([
    { key: 'shift', label: 'ドアをローカルで動かした量', color: vecColor('a') },
    { key: 'radius', label: '右端が描く円の半径', color: vecColor('result') },
    { key: 'note', label: '見え方' },
  ]);

  const end = new THREE.Vector3();

  const update = (): void => {
    const rad = THREE.MathUtils.degToRad(controls.num('angle'));
    const f = controls.num('offset');

    // ピボットを f の位置へ動かす ＝ ドアを逆向きに −f だけずらす
    door.position.x = -f * HALF;
    pivot.rotation.y = rad;

    // 右端（ローカルでは x = HALF）のワールド位置
    const localEnd = HALF - f * HALF;
    end.set(Math.cos(rad) * localEnd, 0.02, -Math.sin(rad) * localEnd);

    const radius = Math.abs(localEnd);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i += 1) {
      const t = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * radius, 0.02, Math.sin(t) * radius));
    }
    path.set(radius > 1e-3 ? pts : []);

    spoke.set(new THREE.Vector3(0, 0.02, 0), end);
    pivotDot.position.set(0, 0.02, 0);
    labelPivot.position.set(0, -0.45, 0);
    labelEnd.position.copy(end).add(new THREE.Vector3(0, -0.3, 0));

    // 回す前のドアの輪郭（上から見た線）
    const left = -HALF - f * HALF;
    const right = HALF - f * HALF;
    ghost.set([
      new THREE.Vector3(left, 0.02, 0),
      new THREE.Vector3(right, 0.02, 0),
    ]);

    readouts.set('shift', `${fmt(door.position.x, 2)}（ローカル x）`);
    readouts.set('radius', fmt(radius, 2));
    readouts.set(
      'note',
      Math.abs(f) < 0.02
        ? '中央が中心：その場で回る'
        : Math.abs(f) > 0.98
          ? '端が中心：ドアのように開く'
          : '中心が端に寄るほど、開く動きに近づく',
    );
  };

  controls.onChange(update);
  controls.onClick((id) => {
    if (id === 'hinge') controls.set('offset', -1);
    if (id === 'center') controls.set('offset', 0);
  });
  stage.onTheme(() => {
    (door.material as THREE.MeshStandardMaterial).color.set(vecColor('a'));
    ghost.setColor(vecColor('guide'));
    path.setColor(vecColor('result'));
    spoke.setColor(vecColor('result'));
    (pivotDot.material as THREE.MeshBasicMaterial).color.set(vecColor('normal'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'ドア', color: vecColor('a') },
      { label: '回転の中心', color: vecColor('normal') },
      { label: '右端がなぞる円', color: vecColor('result'), dashed: true },
      { label: '回す前のドアの位置', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
