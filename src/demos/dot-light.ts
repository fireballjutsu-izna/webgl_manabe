/**
 * CH.03 内積の使い道 — 面の明るさは「法線と光の向きの内積」でそのまま決まる。
 * 明るさは three のライトに任せず、内積の値から自分で色を作っている。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { createArrow, fmt, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [3.4, 3, 6],
    target: [0, 0.6, 0],
    grid: 8,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  const panelMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ffffff'),
    side: THREE.DoubleSide,
    fog: false,
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), panelMaterial);
  panel.position.y = 1.2;
  stage.scene.add(panel);

  const normalArrow = createArrow(vecColor('normal'), { radius: 0.024 });
  const lightArrow = createArrow(vecColor('result'), { radius: 0.024 });
  stage.scene.add(normalArrow.object, lightArrow.object);

  const labelN = stage.addLabel('法線 n', vecColor('normal'));
  const labelL = stage.addLabel('光の向き l', vecColor('result'));
  stage.scene.add(labelN, labelL);

  const controls = createControls([
    {
      kind: 'range',
      id: 'tilt',
      label: '面の傾き',
      min: -80,
      max: 80,
      step: 1,
      value: 20,
      format: (v) => `${v.toFixed(0)}°`,
    },
    {
      kind: 'range',
      id: 'light',
      label: '光の向き',
      min: 0,
      max: 360,
      step: 1,
      value: 55,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'check', id: 'clamp', label: 'マイナスを 0 で止める（裏面を暗くする）', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'dot', label: 'n·l', color: vecColor('result') },
    { key: 'bright', label: '明るさ', color: vecColor('normal') },
    { key: 'note', label: '状態', color: vecColor('result') },
  ]);

  const normal = new THREE.Vector3();
  const light = new THREE.Vector3();
  const base = new THREE.Color('#7fd7ff');
  const color = new THREE.Color();
  const center = new THREE.Vector3(0, 1.2, 0);

  const update = (): void => {
    const tilt = THREE.MathUtils.degToRad(controls.num('tilt'));
    const lightAngle = THREE.MathUtils.degToRad(controls.num('light'));

    panel.rotation.set(0, 0, 0);
    panel.rotateY(tilt);
    normal.set(Math.sin(tilt), 0, Math.cos(tilt));

    light.set(Math.cos(lightAngle), 0.55, Math.sin(lightAngle)).normalize();

    normalArrow.set(normal.clone().multiplyScalar(1.4), center);
    lightArrow.set(light.clone().multiplyScalar(1.6), center);

    labelN.position.copy(center).addScaledVector(normal, 1.65);
    labelL.position.copy(center).addScaledVector(light, 1.85);

    const dot = normal.dot(light);
    const brightness = controls.bool('clamp') ? Math.max(0, dot) : (dot + 1) / 2;
    color.copy(base).multiplyScalar(THREE.MathUtils.clamp(brightness, 0.02, 1));
    panelMaterial.color.copy(color);

    readouts.set('dot', fmt(dot, 3));
    readouts.set('bright', fmt(brightness, 3));
    readouts.set(
      'note',
      dot > 0.02 ? '光の当たっている面' : dot < -0.02 ? '光に背を向けた面' : '光と平行（ぎりぎり）',
    );
  };

  controls.onChange(update);
  stage.onTheme(() => {
    normalArrow.setColor(vecColor('normal'));
    lightArrow.setColor(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '面の法線 n', color: vecColor('normal') },
      { label: '光の向き l', color: vecColor('result') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
