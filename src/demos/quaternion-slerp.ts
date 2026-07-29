/**
 * CH.07 クォータニオン — 同じ「始めの姿勢」と「終わりの姿勢」をつないでも、
 * オイラー角を直線で補間した場合と slerp では、通る道すじが違う。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { addStudioLights, createPolyline, fmt, solidMaterial, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const TRAIL = 96;

function makeCraft(color: string): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 18), solidMaterial(color));
  body.rotation.x = -Math.PI / 2;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.24), solidMaterial(color));
  group.add(body, wing);
  return group;
}

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [3.4, 1.6, 6.2],
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  addStudioLights(stage.scene);

  const eulerCraft = makeCraft(vecColor('b'));
  eulerCraft.position.x = -1.5;
  const quatCraft = makeCraft(vecColor('result'));
  quatCraft.position.x = 1.5;
  stage.scene.add(eulerCraft, quatCraft);

  const labelEuler = stage.addLabel('オイラー角を直線で補間', vecColor('b'));
  labelEuler.position.set(-1.5, 1.3, 0);
  const labelQuat = stage.addLabel('クォータニオンの slerp', vecColor('result'));
  labelQuat.position.set(1.5, 1.3, 0);
  stage.scene.add(labelEuler, labelQuat);

  // 機首の先端がどこを通ったかの軌跡
  const eulerTrail = createPolyline(vecColor('b'), TRAIL + 1);
  const quatTrail = createPolyline(vecColor('result'), TRAIL + 1);
  stage.scene.add(eulerTrail.object, quatTrail.object);

  const controls = createControls([
    { kind: 'range', id: 't', label: '補間の進み具合 t', min: 0, max: 1, step: 0.005, value: 0.35 },
    {
      kind: 'range',
      id: 'ex',
      label: '終わりの姿勢：x',
      min: -180,
      max: 180,
      step: 1,
      value: 90,
      format: (v) => `${v.toFixed(0)}°`,
    },
    {
      kind: 'range',
      id: 'ey',
      label: '終わりの姿勢：y',
      min: -180,
      max: 180,
      step: 1,
      value: 160,
      format: (v) => `${v.toFixed(0)}°`,
    },
    {
      kind: 'range',
      id: 'ez',
      label: '終わりの姿勢：z',
      min: -180,
      max: 180,
      step: 1,
      value: 90,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'check', id: 'auto', label: '自動で往復させる', value: true },
    { kind: 'check', id: 'trail', label: '機首の軌跡を残す', value: true },
  ]);

  const readouts = createReadouts([
    { key: 't', label: 't', color: vecColor('normal') },
    { key: 'gap', label: '2機の機首のずれ', color: vecColor('result') },
  ]);

  const startEuler = new THREE.Euler(0, 0, 0);
  const endEuler = new THREE.Euler();
  const startQuat = new THREE.Quaternion().setFromEuler(startEuler);
  const endQuat = new THREE.Quaternion();
  const nose = new THREE.Vector3(0, 0, 1);
  const noseA = new THREE.Vector3();
  const noseB = new THREE.Vector3();

  let programmatic = false;
  let direction = 1;

  const sampleTrails = (): void => {
    const a: THREE.Vector3[] = [];
    const b: THREE.Vector3[] = [];
    const e = new THREE.Euler();
    const q = new THREE.Quaternion();

    for (let i = 0; i <= TRAIL; i += 1) {
      const t = i / TRAIL;
      e.set(
        THREE.MathUtils.lerp(startEuler.x, endEuler.x, t),
        THREE.MathUtils.lerp(startEuler.y, endEuler.y, t),
        THREE.MathUtils.lerp(startEuler.z, endEuler.z, t),
      );
      a.push(nose.clone().applyEuler(e).multiplyScalar(1.1).add(new THREE.Vector3(-1.5, 0, 0)));

      q.copy(startQuat).slerp(endQuat, t);
      b.push(nose.clone().applyQuaternion(q).multiplyScalar(1.1).add(new THREE.Vector3(1.5, 0, 0)));
    }
    eulerTrail.set(a);
    quatTrail.set(b);
  };

  const update = (): void => {
    endEuler.set(
      THREE.MathUtils.degToRad(controls.num('ex')),
      THREE.MathUtils.degToRad(controls.num('ey')),
      THREE.MathUtils.degToRad(controls.num('ez')),
    );
    endQuat.setFromEuler(endEuler);

    const t = controls.num('t');

    // 3つの角度をそれぞれ独立に直線で混ぜる、素朴なやり方
    eulerCraft.rotation.set(
      THREE.MathUtils.lerp(startEuler.x, endEuler.x, t),
      THREE.MathUtils.lerp(startEuler.y, endEuler.y, t),
      THREE.MathUtils.lerp(startEuler.z, endEuler.z, t),
    );

    // 姿勢そのものを最短の回り方でつなぐやり方
    quatCraft.quaternion.copy(startQuat).slerp(endQuat, t);

    const showTrail = controls.bool('trail');
    eulerTrail.object.visible = showTrail;
    quatTrail.object.visible = showTrail;
    if (showTrail) sampleTrails();

    noseA.copy(nose).applyEuler(eulerCraft.rotation);
    noseB.copy(nose).applyQuaternion(quatCraft.quaternion);

    readouts.set('t', fmt(t, 3));
    readouts.set('gap', `${fmt(THREE.MathUtils.radToDeg(noseA.angleTo(noseB)), 1)}°`);
  };

  controls.onChange((id) => {
    if (programmatic) return;
    if (id === 't' && controls.bool('auto')) {
      programmatic = true;
      controls.set('auto', false);
      programmatic = false;
    }
    update();
  });

  stage.onFrame((dt) => {
    if (!controls.bool('auto') || stage.reduceMotion) return;
    let t = controls.num('t') + direction * dt * 0.35;
    if (t > 1) {
      t = 1;
      direction = -1;
    } else if (t < 0) {
      t = 0;
      direction = 1;
    }
    programmatic = true;
    controls.set('t', t);
    programmatic = false;
    update();
  });

  stage.onTheme(() => {
    eulerTrail.setColor(vecColor('b'));
    quatTrail.setColor(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '角度を直線で混ぜた機（遠回りしたり、途中で不自然に傾く）', color: vecColor('b') },
      { label: 'slerp でつないだ機（最短の回り方で一定の速さ）', color: vecColor('result') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
