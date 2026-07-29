/** CH.07 オイラー角 — 3つのリングが重なると、回せる方向が1つ減る（ジンバルロック）。 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { addStudioLights, fmt, solidMaterial, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

function ring(color: string, radius: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.022, 10, 96),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color), fog: false }),
  );
  return mesh;
}

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [4, 3, 5.5],
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  addStudioLights(stage.scene);

  // 外側から内側へ、Three.js の既定の適用順（YXZ ではなく XYZ）に合わせて入れ子にする
  const outer = new THREE.Group(); // y 軸まわり
  const middle = new THREE.Group(); // x 軸まわり
  const inner = new THREE.Group(); // z 軸まわり

  const ringY = ring(vecColor('b'), 2.0);
  ringY.rotation.x = Math.PI / 2;
  const ringX = ring(vecColor('a'), 1.65);
  ringX.rotation.y = Math.PI / 2;
  const ringZ = ring(vecColor('result'), 1.3);

  const craft = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 18), solidMaterial(vecColor('normal')));
  body.rotation.x = -Math.PI / 2; // 機首を +z に向ける
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.32), solidMaterial(vecColor('result')));
  craft.add(body, wing);

  inner.add(ringZ, craft);
  middle.add(ringX, inner);
  outer.add(ringY, middle);
  stage.scene.add(outer);

  const noseLabel = stage.addLabel('機首', vecColor('normal'));
  craft.add(noseLabel);
  noseLabel.position.set(0, 0.45, 0.9);

  const controls = createControls([
    {
      kind: 'range',
      id: 'x',
      label: 'x 軸まわり（ピッチ）',
      min: -180,
      max: 180,
      step: 1,
      value: 0,
      format: (v) => `${v.toFixed(0)}°`,
    },
    {
      kind: 'range',
      id: 'y',
      label: 'y 軸まわり（ヨー）',
      min: -180,
      max: 180,
      step: 1,
      value: 30,
      format: (v) => `${v.toFixed(0)}°`,
    },
    {
      kind: 'range',
      id: 'z',
      label: 'z 軸まわり（ロール）',
      min: -180,
      max: 180,
      step: 1,
      value: 0,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'button', id: 'lock', label: 'ジンバルロックの状態にする', primary: true },
    { kind: 'button', id: 'reset', label: 'もとに戻す' },
  ]);

  const readouts = createReadouts([
    { key: 'state', label: '状態', color: vecColor('result') },
    { key: 'dot', label: 'x 軸リングと z 軸リングの揃い具合', color: vecColor('normal') },
  ]);

  const axisX = new THREE.Vector3();
  const axisZ = new THREE.Vector3();

  const update = (): void => {
    const rx = THREE.MathUtils.degToRad(controls.num('x'));
    const ry = THREE.MathUtils.degToRad(controls.num('y'));
    const rz = THREE.MathUtils.degToRad(controls.num('z'));

    outer.rotation.set(0, ry, 0);
    middle.rotation.set(rx, 0, 0);
    inner.rotation.set(0, 0, rz);

    // 2本の回転軸がどれくらい揃ってしまったかを内積で測る
    middle.updateWorldMatrix(true, false);
    inner.updateWorldMatrix(true, false);
    axisX.set(1, 0, 0).applyQuaternion(middle.getWorldQuaternion(new THREE.Quaternion()));
    axisZ.set(0, 0, 1).applyQuaternion(inner.getWorldQuaternion(new THREE.Quaternion()));

    const alignment = Math.abs(axisX.dot(axisZ));
    readouts.set('dot', fmt(alignment, 3));
    readouts.set(
      'state',
      alignment > 0.98
        ? 'ロック中：2つのリングが重なり、回せる向きが1つ減っています'
        : alignment > 0.7
          ? 'ロックに近づいています'
          : '3方向とも独立して回せます',
    );
  };

  controls.onChange(update);
  controls.onClick((id) => {
    if (id === 'lock') {
      // x 軸まわりを 90°にすると、y 軸リングと z 軸リングが重なる
      controls.set('x', 90);
      controls.set('y', 0);
      controls.set('z', 0);
    }
    if (id === 'reset') {
      controls.set('x', 0);
      controls.set('y', 30);
      controls.set('z', 0);
    }
  });
  stage.onTheme(() => {
    (ringY.material as THREE.MeshBasicMaterial).color.set(vecColor('b'));
    (ringX.material as THREE.MeshBasicMaterial).color.set(vecColor('a'));
    (ringZ.material as THREE.MeshBasicMaterial).color.set(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'y 軸まわりのリング（いちばん外）', color: vecColor('b') },
      { label: 'x 軸まわりのリング', color: vecColor('a') },
      { label: 'z 軸まわりのリング（いちばん内）', color: vecColor('result') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
