/** CH.09 座標空間の階層 — 子のローカル座標は変えていないのに、世界での位置は動く。 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import {
  addStudioLights,
  createArrow,
  createSegment,
  fmtVec,
  solidMaterial,
  vecColor,
} from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [5, 4.6, 6.5],
    grid: 10,
    axes: 2,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  addStudioLights(stage.scene);

  // 親：円盤
  const parent = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.12, 48),
    solidMaterial(vecColor('a'), { transparent: true, opacity: 0.65 }),
  );
  parent.add(disc);

  // 親のローカル軸（親といっしょに回る物差し）
  const parentAxes = new THREE.AxesHelper(1.9);
  parent.add(parentAxes);

  // 子：箱
  const child = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), solidMaterial(vecColor('result')));
  parent.add(child);

  stage.scene.add(parent);

  // ワールド原点から子までの矢印と、親から子までの矢印
  const worldArrow = createArrow(vecColor('normal'), { radius: 0.022 });
  const localArrow = createArrow(vecColor('result'), { radius: 0.022 });
  const parentLink = createSegment(vecColor('guide'), true);
  stage.scene.add(worldArrow.object, localArrow.object, parentLink.object);

  const labelParent = stage.addLabel('親', vecColor('a'));
  const labelChild = stage.addLabel('子', vecColor('result'));
  stage.scene.add(labelParent, labelChild);

  const controls = createControls([
    { kind: 'range', id: 'px', label: '親の位置 x', min: -3, max: 3, step: 0.1, value: 1.2 },
    { kind: 'range', id: 'pz', label: '親の位置 z', min: -3, max: 3, step: 0.1, value: 0 },
    {
      kind: 'range',
      id: 'pr',
      label: '親の回転（y 軸）',
      min: -180,
      max: 180,
      step: 1,
      value: 35,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'range', id: 'ps', label: '親の拡大率', min: 0.4, max: 2, step: 0.05, value: 1 },
    { kind: 'range', id: 'cx', label: '子のローカル位置 x', min: -1.5, max: 1.5, step: 0.1, value: 1.2 },
    { kind: 'range', id: 'cy', label: '子のローカル位置 y', min: 0, max: 2, step: 0.1, value: 0.4 },
    { kind: 'check', id: 'detach', label: '親から切り離す（ワールドに直接ぶら下げる）', value: false },
    { kind: 'button', id: 'spin', label: '親をひと回りさせる' },
  ]);

  const readouts = createReadouts([
    { key: 'local', label: '子の position（ローカル）', color: vecColor('result') },
    { key: 'world', label: '子のワールド座標', color: vecColor('normal') },
    { key: 'parent', label: '親の position', color: vecColor('a') },
  ]);

  const worldPosition = new THREE.Vector3();
  const parentPosition = new THREE.Vector3();

  let spinning = 0;
  let detached = false;

  const update = (): void => {
    parent.position.set(controls.num('px'), 0, controls.num('pz'));
    parent.rotation.y = THREE.MathUtils.degToRad(controls.num('pr'));
    parent.scale.setScalar(controls.num('ps'));

    if (controls.bool('detach') !== detached) {
      detached = controls.bool('detach');
      // attach は「見た目の位置を保ったまま」付け替える。add との違いがここに出る
      if (detached) stage.scene.attach(child);
      else parent.attach(child);
    }

    if (!detached) child.position.set(controls.num('cx'), controls.num('cy'), 0);

    parent.updateWorldMatrix(true, true);
    child.getWorldPosition(worldPosition);
    parent.getWorldPosition(parentPosition);

    worldArrow.set(worldPosition);
    localArrow.set(worldPosition.clone().sub(parentPosition), parentPosition);
    parentLink.set(parentPosition, worldPosition);

    labelParent.position.copy(parentPosition).add(new THREE.Vector3(0, 0.5, 0));
    labelChild.position.copy(worldPosition).add(new THREE.Vector3(0, 0.5, 0));

    readouts.set('local', fmtVec(child.position, 2));
    readouts.set('world', fmtVec(worldPosition, 2));
    readouts.set('parent', fmtVec(parent.position, 2));
  };

  controls.onChange(update);
  controls.onClick((id) => {
    if (id === 'spin') spinning = 360;
  });

  stage.onFrame((dt) => {
    if (spinning <= 0 || stage.reduceMotion) return;
    const step = Math.min(spinning, dt * 90);
    spinning -= step;
    let next = controls.num('pr') + step;
    if (next > 180) next -= 360;
    controls.set('pr', Math.round(next));
  });

  stage.onTheme(() => {
    (disc.material as THREE.MeshStandardMaterial).color.set(vecColor('a'));
    (child.material as THREE.MeshStandardMaterial).color.set(vecColor('result'));
    worldArrow.setColor(vecColor('normal'));
    localArrow.setColor(vecColor('result'));
    parentLink.setColor(vecColor('guide'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '親（円盤とそのローカル軸）', color: vecColor('a') },
      { label: '親から見た子の位置', color: vecColor('result') },
      { label: 'ワールド原点から見た子の位置', color: vecColor('normal') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
