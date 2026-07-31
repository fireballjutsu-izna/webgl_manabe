/**
 * CH.2-15 lookAt — 「向ける」の 1 行が、裏で 3 本の軸を組み立てている。
 *
 * ふつうの物体は +z が的を向き、カメラは −z が的を向く。
 * さらに up と重なると軸が作れなくなる。どちらも lookAt の落とし穴で、
 * 実際に three の lookAt を呼んで、その結果の軸を描いている。
 */

import * as THREE from 'three';
import {
  createArrow,
  createPoint,
  createSegment,
  fmt,
  fmtVec,
  solidMaterial,
  addStudioLights,
  vecColor,
} from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [6, 4.2, 7],
    grid: 10,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  addStudioLights(stage.scene);

  // 実際に three に向きを決めさせる。物体とカメラで結果が違うことを見せたいので両方持つ
  const object = new THREE.Object3D();
  const camera = new THREE.PerspectiveCamera();
  stage.scene.add(object, camera);

  // 機体。機首は +z（three のふつうの物体が「正面」とみなす向き）
  const craft = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 1.3, 18),
    solidMaterial(vecColor('guide')),
  );
  body.rotation.x = Math.PI / 2;
  body.position.z = 0.15;
  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.07, 0.34),
    solidMaterial(vecColor('guide')),
  );
  craft.add(body, wing);
  stage.scene.add(craft);

  const axisX = createArrow(vecColor('b'), { radius: 0.026, headRadius: 0.08 });
  const axisY = createArrow(vecColor('normal'), { radius: 0.026, headRadius: 0.08 });
  const axisZ = createArrow(vecColor('result'), { radius: 0.038, headRadius: 0.11 });
  stage.scene.add(axisX.object, axisY.object, axisZ.object);

  const worldUp = createSegment(vecColor('guide'), true);
  const toTarget = createSegment(vecColor('a'), true);
  stage.scene.add(worldUp.object, toTarget.object);

  const targetDot = createPoint(vecColor('a'), 0.11);
  stage.scene.add(targetDot);

  const labelX = stage.addLabel('x（右）', vecColor('b'));
  const labelY = stage.addLabel('y（上）', vecColor('normal'));
  const labelZ = stage.addLabel('z', vecColor('result'));
  const labelTarget = stage.addLabel('的', vecColor('a'));
  const labelUp = stage.addLabel('世界の up', vecColor('guide'));
  labelUp.position.set(-2.8, 3.3, 0);
  stage.scene.add(labelX, labelY, labelZ, labelTarget, labelUp);

  const controls = createControls([
    { kind: 'range', id: 'tx', label: '的の x', min: -4, max: 4, step: 0.25, value: 3 },
    { kind: 'range', id: 'ty', label: '的の y', min: -4, max: 4, step: 0.25, value: 1 },
    { kind: 'range', id: 'tz', label: '的の z', min: -4, max: 4, step: 0.25, value: 2 },
    { kind: 'check', id: 'cam', label: 'カメラとして向ける（−z が的を向く）', value: false },
    { kind: 'button', id: 'up', label: '真上を狙う（up と重なる）', primary: true },
    { kind: 'button', id: 'reset', label: 'もとに戻す' },
  ]);

  const readouts = createReadouts([
    { key: 'dir', label: '的へ向かう向き' },
    { key: 'front', label: '機首（+z 軸）が向いた先', color: vecColor('result') },
    { key: 'align', label: '的の向きと up の揃い具合', color: vecColor('normal') },
    { key: 'note', label: '状態' },
  ]);

  const target = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const ex = new THREE.Vector3();
  const ey = new THREE.Vector3();
  const ez = new THREE.Vector3();
  const org = new THREE.Vector3();

  const update = (): void => {
    target.set(controls.num('tx'), controls.num('ty'), controls.num('tz'));
    const asCamera = controls.bool('cam');

    // three 本体に計算させる。物体とカメラで lookAt の中身が違う
    const subject: THREE.Object3D = asCamera ? camera : object;
    subject.position.set(0, 0, 0);
    subject.lookAt(target);

    craft.quaternion.copy(subject.quaternion);

    ex.set(1, 0, 0).applyQuaternion(subject.quaternion);
    ey.set(0, 1, 0).applyQuaternion(subject.quaternion);
    ez.set(0, 0, 1).applyQuaternion(subject.quaternion);

    axisX.set(ex.clone().multiplyScalar(1.5));
    axisY.set(ey.clone().multiplyScalar(1.5));
    axisZ.set(ez.clone().multiplyScalar(2.2));
    labelX.position.copy(ex).multiplyScalar(1.75);
    labelY.position.copy(ey).multiplyScalar(1.75);
    labelZ.position.copy(ez).multiplyScalar(2.45);

    targetDot.position.copy(target);
    labelTarget.position.copy(target).add(new THREE.Vector3(0, 0.35, 0));
    toTarget.set(org.set(0, 0, 0), target);
    worldUp.set(org.set(-2.8, 0, 0), new THREE.Vector3(-2.8, 3, 0));

    dir.copy(target).normalize();
    const align = Math.abs(dir.y); // up は (0, 1, 0)
    const front = ez.dot(dir);

    readouts.set('dir', fmtVec(dir, 3));
    readouts.set('front', `${fmt(front, 3)}（1 なら的のほう、−1 なら真逆）`);
    readouts.set('align', fmt(align, 3));
    readouts.set(
      'note',
      target.lengthSq() < 1e-6
        ? '的が原点と同じ位置。向きが決まらない'
        : align > 0.999
          ? '的の向きが up と重なり、右と上が決められない'
          : asCamera
            ? 'カメラ扱い：−z が的を向く。機首（+z）は逆を向く'
            : 'ふつうの物体：+z が的を向く',
    );
  };

  controls.onChange(update);
  controls.onClick((id) => {
    if (id === 'up') {
      controls.set('tx', 0);
      controls.set('ty', 3);
      controls.set('tz', 0);
    }
    if (id === 'reset') {
      controls.set('tx', 3);
      controls.set('ty', 1);
      controls.set('tz', 2);
      controls.set('cam', false);
    }
  });
  stage.onTheme(() => {
    axisX.setColor(vecColor('b'));
    axisY.setColor(vecColor('normal'));
    axisZ.setColor(vecColor('result'));
    worldUp.setColor(vecColor('guide'));
    toTarget.setColor(vecColor('a'));
    (targetDot.material as THREE.MeshBasicMaterial).color.set(vecColor('a'));
    (body.material as THREE.MeshStandardMaterial).color.set(vecColor('guide'));
    (wing.material as THREE.MeshStandardMaterial).color.set(vecColor('guide'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '的と、そこへ向かう向き', color: vecColor('a'), dashed: true },
      { label: 'z 軸（機首の向き）', color: vecColor('result') },
      { label: 'x 軸（右）', color: vecColor('b') },
      { label: 'y 軸（上）', color: vecColor('normal') },
      { label: '世界の up (0, 1, 0)', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
