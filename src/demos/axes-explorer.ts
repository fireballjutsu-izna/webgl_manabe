/** CH.01 3D空間と座標系 — x・y・z を動かして、数の組が位置になることを見る。 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import {
  addStudioLights,
  createArrow,
  createSegment,
  fmt,
  solidMaterial,
  vecColor,
} from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [6.4, 5.4, 8.6],
    grid: 8,
    controls: true,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  addStudioLights(stage.scene);

  // 座標軸（3 本とも同じ太さで、ラベルで区別する）
  const axisLength = 3.2;
  const axisSpecs: { name: 'x' | 'y' | 'z'; dir: THREE.Vector3; color: string }[] = [
    { name: 'x', dir: new THREE.Vector3(1, 0, 0), color: vecColor('a') },
    { name: 'y', dir: new THREE.Vector3(0, 1, 0), color: vecColor('result') },
    { name: 'z', dir: new THREE.Vector3(0, 0, 1), color: vecColor('b') },
  ];

  for (const spec of axisSpecs) {
    const arrow = createArrow(spec.color, { radius: 0.018, headLength: 0.18, headRadius: 0.055 });
    arrow.set(spec.dir.clone().multiplyScalar(axisLength));
    stage.scene.add(arrow.object);

    const label = stage.addLabel(`${spec.name} 軸`, spec.color);
    label.position.copy(spec.dir.clone().multiplyScalar(axisLength + 0.35));
    stage.scene.add(label);
  }

  // 動かす箱
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.7),
    solidMaterial(vecColor('result')),
  );
  stage.scene.add(box);

  // 原点から箱までのベクトル
  const pointer = createArrow(vecColor('normal'), { radius: 0.022 });
  stage.scene.add(pointer.object);

  // 各軸への補助線（破線）
  const guides = [0, 1, 2].map(() => {
    const segment = createSegment(vecColor('guide'), true);
    stage.scene.add(segment.object);
    return segment;
  });

  const posLabel = stage.addLabel('', vecColor('normal'));
  stage.scene.add(posLabel);

  const controls = createControls([
    { kind: 'range', id: 'x', label: 'x（右がプラス）', min: -3, max: 3, step: 0.1, value: 2 },
    { kind: 'range', id: 'y', label: 'y（上がプラス）', min: -3, max: 3, step: 0.1, value: 1.2 },
    { kind: 'range', id: 'z', label: 'z（手前がプラス）', min: -3, max: 3, step: 0.1, value: 1.5 },
    { kind: 'check', id: 'guides', label: '軸への補助線を表示', value: true },
    { kind: 'button', id: 'reset', label: '原点に戻す' },
  ]);

  const readouts = createReadouts([
    { key: 'pos', label: 'position', color: vecColor('normal') },
    { key: 'dist', label: '原点からの距離', color: vecColor('result') },
  ]);

  const position = new THREE.Vector3();
  const origin = new THREE.Vector3();

  const update = (): void => {
    position.set(controls.num('x'), controls.num('y'), controls.num('z'));
    box.position.copy(position);
    pointer.set(position);
    posLabel.position.copy(position).add(new THREE.Vector3(0, 0.6, 0));
    posLabel.element.textContent = `(${fmt(position.x, 1)}, ${fmt(position.y, 1)}, ${fmt(position.z, 1)})`;

    const showGuides = controls.bool('guides');
    // x 成分ぶん → y 成分ぶん → z 成分ぶん、と原点から順にたどる折れ線
    const p1 = new THREE.Vector3(position.x, 0, 0);
    const p2 = new THREE.Vector3(position.x, position.y, 0);
    guides[0]!.set(origin, p1);
    guides[1]!.set(p1, p2);
    guides[2]!.set(p2, position);
    for (const guide of guides) guide.setVisible(showGuides);

    readouts.set('pos', `(${fmt(position.x, 1)}, ${fmt(position.y, 1)}, ${fmt(position.z, 1)})`);
    readouts.set('dist', fmt(position.length()));
  };

  controls.onChange(update);
  controls.onClick((id) => {
    if (id !== 'reset') return;
    controls.set('x', 0);
    controls.set('y', 0);
    controls.set('z', 0);
  });
  stage.onTheme(() => {
    pointer.setColor(vecColor('normal'));
    for (const guide of guides) guide.setColor(vecColor('guide'));
    (box.material as THREE.MeshStandardMaterial).color.set(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'x 軸', color: vecColor('a') },
      { label: 'y 軸', color: vecColor('result') },
      { label: 'z 軸', color: vecColor('b') },
      { label: '原点からの矢印', color: vecColor('normal') },
      { label: '成分ごとの道のり', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
