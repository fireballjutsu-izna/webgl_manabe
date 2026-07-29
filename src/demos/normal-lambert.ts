/**
 * CH.11 法線とライティング — 球のあちこちに法線を立て、光の向きを動かして
 * 「明るさ＝法線と光の内積」を目で確かめる。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { createArrow, createSegment, fmt, solidMaterial, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const SAMPLES = 26;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [4.2, 3, 5.4],
    target: [0, 0.2, 0],
    grid: 8,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  // 明暗の差をそのまま見せたいので、光は 1 灯だけにして白飛びしない強さに抑える
  const light = new THREE.DirectionalLight(0xffffff, 1.35);
  const ambient = new THREE.AmbientLight(0xffffff, 0.06);
  stage.scene.add(light, ambient);

  const material = solidMaterial('#8ea3c4', { roughness: 0.9, metalness: 0 });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.3, 48, 32), material);
  stage.scene.add(sphere);

  // 球面上にばらまいた点に法線を立てる（フィボナッチ球でほぼ均等に並べる）
  const normals: { arrow: ReturnType<typeof createArrow>; point: THREE.Vector3 }[] = [];
  for (let i = 0; i < SAMPLES; i += 1) {
    const y = 1 - (i / (SAMPLES - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * Math.PI * (3 - Math.sqrt(5));
    const point = new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
    const arrow = createArrow(vecColor('normal'), {
      radius: 0.012,
      headLength: 0.1,
      headRadius: 0.035,
    });
    stage.scene.add(arrow.object);
    normals.push({ arrow, point });
  }

  const lightArrow = createArrow(vecColor('result'), { radius: 0.026 });
  const reflectArrow = createArrow(vecColor('b'), { radius: 0.02 });
  const probeNormal = createArrow(vecColor('normal'), { radius: 0.026 });
  const surfaceLink = createSegment(vecColor('guide'), true);
  stage.scene.add(
    lightArrow.object,
    reflectArrow.object,
    probeNormal.object,
    surfaceLink.object,
  );

  const labelLight = stage.addLabel('光の向き l', vecColor('result'));
  const labelReflect = stage.addLabel('反射ベクトル', vecColor('b'));
  const labelProbe = stage.addLabel('調べている点の法線 n', vecColor('normal'));
  stage.scene.add(labelLight, labelReflect, labelProbe);

  const controls = createControls([
    {
      kind: 'range',
      id: 'lightYaw',
      label: '光の向き（水平）',
      min: 0,
      max: 360,
      step: 1,
      value: 150,
      format: (v) => `${v.toFixed(0)}°`,
    },
    {
      kind: 'range',
      id: 'lightPitch',
      label: '光の向き（高さ）',
      min: -80,
      max: 80,
      step: 1,
      value: 25,
      format: (v) => `${v.toFixed(0)}°`,
    },
    {
      kind: 'range',
      id: 'probe',
      label: '調べる点（球の上をなぞる）',
      min: 0,
      max: 360,
      step: 1,
      value: 30,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'check', id: 'normals', label: '球全体の法線を表示', value: true },
    { kind: 'check', id: 'reflect', label: '反射ベクトルを表示', value: true },
    { kind: 'check', id: 'flat', label: 'なめらかにせず面ごとに塗る（flatShading）', value: false },
  ]);

  const readouts = createReadouts([
    { key: 'dot', label: 'n·l', color: vecColor('result') },
    { key: 'bright', label: '明るさ（0 で止めたもの）', color: vecColor('normal') },
    { key: 'state', label: 'この点は', color: vecColor('b') },
  ]);

  const lightDir = new THREE.Vector3();
  const probePoint = new THREE.Vector3();
  const probeNormalVec = new THREE.Vector3();
  const reflected = new THREE.Vector3();

  const update = (): void => {
    const yaw = THREE.MathUtils.degToRad(controls.num('lightYaw'));
    const pitch = THREE.MathUtils.degToRad(controls.num('lightPitch'));
    lightDir
      .set(Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), Math.cos(pitch) * Math.sin(yaw))
      .normalize();

    light.position.copy(lightDir).multiplyScalar(6);
    light.target.position.set(0, 0, 0);
    light.target.updateMatrixWorld();

    lightArrow.set(lightDir.clone().multiplyScalar(1.6), lightDir.clone().multiplyScalar(3.2));
    labelLight.position.copy(lightDir).multiplyScalar(3.4);

    const showNormals = controls.bool('normals');
    for (const item of normals) {
      item.arrow.setVisible(showNormals);
      if (showNormals) {
        item.arrow.set(item.point.clone().multiplyScalar(0.42), item.point.clone().multiplyScalar(1.3));
      }
    }

    // 調べる点は、球の赤道をぐるりとなぞる
    const angle = THREE.MathUtils.degToRad(controls.num('probe'));
    probeNormalVec.set(Math.cos(angle), 0.35, Math.sin(angle)).normalize();
    probePoint.copy(probeNormalVec).multiplyScalar(1.3);

    probeNormal.set(probeNormalVec.clone().multiplyScalar(1.1), probePoint);
    labelProbe.position.copy(probePoint).addScaledVector(probeNormalVec, 1.3);
    surfaceLink.set(probePoint, probePoint.clone().addScaledVector(lightDir, 1.6));

    const dot = probeNormalVec.dot(lightDir);
    const brightness = Math.max(0, dot);

    const showReflect = controls.bool('reflect');
    reflectArrow.setVisible(showReflect);
    labelReflect.visible = showReflect;
    if (showReflect) {
      // 入ってきた向き（-l）を法線で跳ね返す
      reflected.copy(lightDir).negate().reflect(probeNormalVec).normalize();
      reflectArrow.set(reflected.clone().multiplyScalar(1.3), probePoint);
      labelReflect.position.copy(probePoint).addScaledVector(reflected, 1.5);
    }

    material.flatShading = controls.bool('flat');
    material.needsUpdate = true;

    readouts.set('dot', fmt(dot, 3));
    readouts.set('bright', fmt(brightness, 3));
    readouts.set(
      'state',
      dot > 0.02 ? '光が当たっています' : dot < -0.02 ? '影になっています' : '光と平行（境目）',
    );
  };

  controls.onChange(update);
  stage.onTheme(() => {
    lightArrow.setColor(vecColor('result'));
    reflectArrow.setColor(vecColor('b'));
    probeNormal.setColor(vecColor('normal'));
    surfaceLink.setColor(vecColor('guide'));
    for (const item of normals) item.arrow.setColor(vecColor('normal'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '法線 n（面がどちらを向いているか）', color: vecColor('normal') },
      { label: '光の向き l', color: vecColor('result') },
      { label: '反射ベクトル', color: vecColor('b') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
