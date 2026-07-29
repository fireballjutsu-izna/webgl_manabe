/**
 * CH.14 総合演習 — 階層・三角関数・クォータニオン・補間・ライティングを 1 つの場面に集める。
 * 段階を切り替えると、どの章の道具がどこで効いているかが分かる。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import {
  createArrow,
  createPolyline,
  fmt,
  solidMaterial,
  vecColor,
} from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const STEPS = ['1', '2', '3', '4'] as const;

const STEP_TEXT: Record<string, string> = {
  '1': '第9章：階層だけ。公転用の入れ物を回して、惑星を太陽のまわりに運んでいます。',
  '2': '第5章：三角関数を追加。軌道の傾きと上下のゆらぎを sin と cos で作っています。',
  '3': '第7章：クォータニオン。探査機が、常に惑星のほうを向くよう slerp で旋回します。',
  '4': '第8・11章：イージングとライティング。カメラが目標へなめらかに寄り、影が内積で決まります。',
};

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 7.5, 15],
    target: [0, 0, 0],
    labels: true,
    fog: true,
    hint: 'ドラッグで視点を回転',
  });

  const sunLight = new THREE.PointLight(0xffe6b0, 120, 60, 2);
  const ambient = new THREE.AmbientLight(0x334466, 0.5);
  stage.scene.add(sunLight, ambient);

  // 太陽（自分で光るので Basic）
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 32, 20),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(vecColor('result')), fog: false }),
  );
  stage.scene.add(sun);

  // 第9章：公転用の入れ物
  const orbit = new THREE.Group();
  sun.add(orbit);

  const planet = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 20), solidMaterial('#7fb2ff'));
  planet.position.x = 5.5;
  orbit.add(planet);

  const moonOrbit = new THREE.Group();
  planet.add(moonOrbit);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 14), solidMaterial('#d8d8e8'));
  moon.position.x = 1.3;
  moonOrbit.add(moon);

  // 第7章：常に惑星を向く探査機
  const probe = new THREE.Group();
  const probeBody = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.7, 16), solidMaterial(vecColor('b')));
  probeBody.rotation.x = -Math.PI / 2;
  probe.add(probeBody);
  stage.scene.add(probe);

  const facing = createArrow(vecColor('b'), { radius: 0.016, headLength: 0.16, headRadius: 0.05 });
  stage.scene.add(facing.object);

  const trail = createPolyline(vecColor('a'), 400);
  stage.scene.add(trail.object);

  const labelSun = stage.addLabel('太陽', vecColor('result'));
  const labelPlanet = stage.addLabel('惑星', '#7fb2ff');
  const labelProbe = stage.addLabel('探査機', vecColor('b'));
  stage.scene.add(labelSun, labelPlanet, labelProbe);
  labelSun.position.set(0, 1.5, 0);

  const controls = createControls([
    {
      kind: 'select',
      id: 'step',
      label: '段階',
      value: '4',
      options: [
        { value: '1', label: '① 階層だけ（第9章）' },
        { value: '2', label: '② ＋三角関数（第5章）' },
        { value: '3', label: '③ ＋クォータニオン（第7章）' },
        { value: '4', label: '④ ＋補間とライティング（第8・11章）' },
      ],
    },
    { kind: 'range', id: 'speed', label: '時間の速さ', min: 0, max: 3, step: 0.05, value: 1 },
    { kind: 'range', id: 'tiltDeg', label: '軌道の傾き', min: 0, max: 45, step: 1, value: 18, format: (v) => `${v.toFixed(0)}°` },
    { kind: 'check', id: 'trail', label: '惑星の軌跡を残す', value: true },
    { kind: 'select', id: 'look', label: 'カメラの寄り先', value: 'sun', options: [
      { value: 'sun', label: '太陽' },
      { value: 'planet', label: '惑星' },
    ] },
  ]);

  const readouts = createReadouts([
    { key: 'step', label: 'いま効いている章', color: vecColor('result') },
    { key: 'angle', label: '探査機の向きのずれ', color: vecColor('b') },
    { key: 'dist', label: '太陽と惑星の距離', color: vecColor('a') },
  ]);

  const planetWorld = new THREE.Vector3();
  const toPlanet = new THREE.Vector3();
  const goalQuat = new THREE.Quaternion();
  const lookHelper = new THREE.Object3D();
  const targetPoint = new THREE.Vector3();
  const nose = new THREE.Vector3();
  const trailPoints: THREE.Vector3[] = [];

  let elapsed = 0;

  const stepLevel = (): number => STEPS.indexOf(controls.str('step') as (typeof STEPS)[number]) + 1;

  stage.onFrame((dt) => {
    const speed = stage.reduceMotion ? 0 : controls.num('speed');
    elapsed += dt * speed;
    const level = stepLevel();

    // ① 階層：入れ物を回すだけで、惑星も月もついてくる
    orbit.rotation.y = elapsed * 0.4;
    moonOrbit.rotation.y = elapsed * 2.2;
    planet.rotation.y = elapsed * 1.5;

    // ② 三角関数：軌道を傾け、上下にゆらす
    if (level >= 2) {
      orbit.rotation.z = THREE.MathUtils.degToRad(controls.num('tiltDeg'));
      planet.position.y = Math.sin(elapsed * 0.4) * 0.6;
      sun.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.02);
    } else {
      orbit.rotation.z = 0;
      planet.position.y = 0;
      sun.scale.setScalar(1);
    }

    sun.updateWorldMatrix(true, true);
    planet.getWorldPosition(planetWorld);

    // 探査機は太陽の反対側あたりを、円運動でゆっくり移動する
    probe.position.set(
      Math.cos(elapsed * 0.25) * 7.2,
      2.2 + (level >= 2 ? Math.sin(elapsed * 0.5) * 0.8 : 0),
      Math.sin(elapsed * 0.25) * 7.2,
    );

    // ③ クォータニオン：目標の姿勢を作り、slerp でなめらかに寄せる
    toPlanet.copy(planetWorld).sub(probe.position);
    if (level >= 3 && toPlanet.lengthSq() > 1e-6) {
      lookHelper.position.copy(probe.position);
      lookHelper.lookAt(planetWorld);
      goalQuat.copy(lookHelper.quaternion);
      probe.quaternion.slerp(goalQuat, 1 - Math.pow(0.02, Math.max(dt, 1e-4)));
    }

    nose.set(0, 0, 1).applyQuaternion(probe.quaternion);
    facing.set(nose.clone().multiplyScalar(1.6), probe.position);

    // ④ 補間：カメラの注視点をイージングで寄せる
    if (level >= 4 && stage.controls) {
      targetPoint.copy(controls.str('look') === 'planet' ? planetWorld : sun.position);
      stage.controls.target.lerp(targetPoint, 1 - Math.pow(0.05, Math.max(dt, 1e-4)));
    }

    // 軌跡
    if (controls.bool('trail')) {
      trailPoints.push(planetWorld.clone());
      if (trailPoints.length > 400) trailPoints.shift();
      trail.set(trailPoints);
      trail.object.visible = true;
    } else {
      trailPoints.length = 0;
      trail.object.visible = false;
    }

    labelPlanet.position.copy(planetWorld).add(new THREE.Vector3(0, 0.9, 0));
    labelProbe.position.copy(probe.position).add(new THREE.Vector3(0, 0.6, 0));

    readouts.set('angle', `${fmt(THREE.MathUtils.radToDeg(nose.angleTo(toPlanet.normalize())), 1)}°`);
    readouts.set('dist', fmt(planetWorld.distanceTo(sun.position), 2));
  });

  const syncStep = (): void => {
    readouts.set('step', STEP_TEXT[controls.str('step')] ?? '');
  };

  controls.onChange(syncStep);
  stage.onTheme(() => {
    (sun.material as THREE.MeshBasicMaterial).color.set(vecColor('result'));
    trail.setColor(vecColor('a'));
    facing.setColor(vecColor('b'));
  });

  syncStep();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '惑星の軌跡', color: vecColor('a') },
      { label: '探査機と、その機首の向き', color: vecColor('b') },
      { label: '太陽', color: vecColor('result') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
