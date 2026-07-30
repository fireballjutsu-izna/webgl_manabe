/**
 * CH.2-11 速くする — 同じ見た目を「1個ずつ」と「まとめて1回」で描き比べる。
 * ドローコール数と実測フレーム時間が、そのまま読み出しに出る。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { addStudioLights, fmt, solidMaterial, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const MAX = 4000;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 10, 18],
    target: [0, 0, 0],
    labels: false,
    hint: 'ドラッグで視点を回転',
  });

  addStudioLights(stage.scene);

  const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const material = solidMaterial(vecColor('a'), { roughness: 0.5 });

  // 同じ配置を2通りで用意し、どちらか一方だけを表示する
  const positions: THREE.Vector3[] = [];
  const spins: number[] = [];
  for (let i = 0; i < MAX; i += 1) {
    const angle = i * 0.618 * Math.PI * 2;
    const radius = Math.sqrt(i / MAX) * 9;
    positions.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(i * 0.37) * 1.6,
        Math.sin(angle) * radius,
      ),
    );
    spins.push((i % 7) * 0.3);
  }

  // (1) 1個ずつ Mesh を作る
  const individual = new THREE.Group();
  for (let i = 0; i < MAX; i += 1) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(positions[i]!);
    individual.add(mesh);
  }
  stage.scene.add(individual);

  // (2) まとめて1つの InstancedMesh にする
  const instanced = new THREE.InstancedMesh(geometry, material, MAX);
  const dummy = new THREE.Object3D();
  stage.scene.add(instanced);

  const controls = createControls([
    {
      kind: 'select',
      id: 'mode',
      label: '描き方',
      value: 'instanced',
      options: [
        { value: 'individual', label: '1個ずつ Mesh を作る' },
        { value: 'instanced', label: 'InstancedMesh でまとめる' },
      ],
    },
    {
      kind: 'range',
      id: 'count',
      label: '個数',
      min: 100,
      max: MAX,
      step: 100,
      value: 2000,
      format: (v) => `${v.toFixed(0)} 個`,
    },
    { kind: 'check', id: 'spin', label: '1つずつ回す（毎フレーム行列を更新する）', value: false },
  ]);

  const readouts = createReadouts([
    { key: 'calls', label: 'ドローコール', color: vecColor('result') },
    { key: 'tris', label: '三角形', color: vecColor('a') },
    { key: 'frame', label: '1フレームの時間', color: vecColor('b') },
    { key: 'note', label: '', color: vecColor('normal') },
  ]);

  let frameAverage = 16;

  const applyCount = (): void => {
    const count = Math.round(controls.num('count'));
    const mode = controls.str('mode');

    individual.visible = mode === 'individual';
    instanced.visible = mode === 'instanced';

    individual.children.forEach((child, index) => {
      child.visible = index < count;
    });

    instanced.count = count;
    for (let i = 0; i < count; i += 1) {
      dummy.position.copy(positions[i]!);
      dummy.rotation.set(0, spins[i]!, 0);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;

    readouts.set(
      'note',
      mode === 'instanced'
        ? '同じ形・同じ材質なら、何個あってもドローコールは1回で済む'
        : '1個につき1回ずつ命令を送るので、個数がそのまま負荷になる',
    );
  };

  controls.onChange(applyCount);

  stage.onFrame((dt, elapsed) => {
    // 実測のフレーム時間をならして出す
    frameAverage += (dt * 1000 - frameAverage) * 0.05;

    if (controls.bool('spin')) {
      const count = Math.round(controls.num('count'));
      if (controls.str('mode') === 'instanced') {
        for (let i = 0; i < count; i += 1) {
          dummy.position.copy(positions[i]!);
          dummy.rotation.set(0, spins[i]! + elapsed, 0);
          dummy.updateMatrix();
          instanced.setMatrixAt(i, dummy.matrix);
        }
        instanced.instanceMatrix.needsUpdate = true;
      } else {
        individual.children.forEach((child, index) => {
          if (index < count) child.rotation.y = spins[index]! + elapsed;
        });
      }
    }

    const info = stage.renderer.info.render;
    readouts.set('calls', String(info.calls));
    readouts.set('tris', info.triangles.toLocaleString('ja-JP'));
    readouts.set('frame', `${fmt(frameAverage, 1)} ms`);
  });

  stage.onTheme(() => material.color.set(vecColor('a')));

  applyCount();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '見た目はどちらもまったく同じ。違うのは命令の送り方だけ', color: vecColor('a') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
