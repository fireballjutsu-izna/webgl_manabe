/** CH.02 ベクトルの長さと正規化 — 正規化すると、先端は必ず半径 1 の球に乗る。 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import {
  createArrow,
  createPoint,
  createSegment,
  fmt,
  fmtVec,
  vecColor,
} from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [4, 3.2, 6],
    grid: 6,
    axes: 1.6,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  // 半径 1 の球。正規化した矢印の先端はここから外に出られない
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 20),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(vecColor('guide')),
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      fog: false,
    }),
  );
  stage.scene.add(sphere);

  const arrowV = createArrow(vecColor('a'));
  const arrowUnit = createArrow(vecColor('result'), { radius: 0.036, headRadius: 0.09 });
  const rest = createSegment(vecColor('guide'), true);
  const tip = createPoint(vecColor('result'), 0.06);
  stage.scene.add(arrowV.object, arrowUnit.object, rest.object, tip);

  const labelV = stage.addLabel('v', vecColor('a'));
  const labelU = stage.addLabel('正規化した v', vecColor('result'));
  stage.scene.add(labelV, labelU);

  const controls = createControls([
    { kind: 'range', id: 'x', label: 'v の x', min: -3, max: 3, step: 0.1, value: 2 },
    { kind: 'range', id: 'y', label: 'v の y', min: -3, max: 3, step: 0.1, value: 1.5 },
    { kind: 'range', id: 'z', label: 'v の z', min: -3, max: 3, step: 0.1, value: 0.8 },
    { kind: 'check', id: 'unit', label: '正規化した矢印を重ねる', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'v', label: 'v', color: vecColor('a') },
    { key: 'len', label: '長さ', color: vecColor('a') },
    { key: 'u', label: '正規化後', color: vecColor('result') },
    { key: 'ulen', label: '正規化後の長さ', color: vecColor('result') },
  ]);

  const v = new THREE.Vector3();
  const unit = new THREE.Vector3();

  const update = (): void => {
    v.set(controls.num('x'), controls.num('y'), controls.num('z'));
    const length = v.length();
    arrowV.set(v);
    labelV.position.copy(v).multiplyScalar(0.6).add(new THREE.Vector3(0, 0.25, 0));

    const showUnit = controls.bool('unit') && length > 1e-4;
    if (showUnit) {
      unit.copy(v).normalize();
      arrowUnit.set(unit);
      tip.position.copy(unit);
      // 「正規化で切り落とされた残り」を破線で見せる
      rest.set(unit, v);
      rest.setVisible(length > 1);
      labelU.position.copy(unit).add(new THREE.Vector3(0, 0.28, 0));
    } else {
      unit.set(0, 0, 0);
    }
    arrowUnit.setVisible(showUnit);
    tip.visible = showUnit;
    labelU.visible = showUnit;
    if (!showUnit) rest.setVisible(false);

    readouts.set('v', fmtVec(v, 1));
    readouts.set('len', fmt(length, 3));
    readouts.set('u', length > 1e-4 ? fmtVec(unit, 3) : '—');
    readouts.set('ulen', length > 1e-4 ? fmt(unit.length(), 3) : '—');
  };

  controls.onChange(update);
  stage.onTheme(() => {
    arrowV.setColor(vecColor('a'));
    arrowUnit.setColor(vecColor('result'));
    rest.setColor(vecColor('guide'));
    (sphere.material as THREE.MeshBasicMaterial).color.set(vecColor('guide'));
    (tip.material as THREE.MeshBasicMaterial).color.set(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'もとのベクトル v', color: vecColor('a') },
      { label: '正規化した v（長さ 1）', color: vecColor('result') },
      { label: '半径 1 の球と、切り落とされた残り', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
