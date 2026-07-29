/** CH.05 三角関数の使い道 — sin を高さに使うと、格子が波になる。 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { addStudioLights, fmt, solidMaterial, vecColor } from '../three/helpers.ts';
import { createControls, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const SEGMENTS = 60;
const SIZE = 8;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 5.2, 8.5],
    target: [0, 0, 0],
    labels: false,
    hint: 'ドラッグで視点を回転',
  });

  addStudioLights(stage.scene);

  const geometry = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
  geometry.rotateX(-Math.PI / 2);
  const material = solidMaterial(vecColor('a'), { wireframe: false, flatShading: true });
  const surface = new THREE.Mesh(geometry, material);
  stage.scene.add(surface);

  const base = geometry.getAttribute('position').clone();
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;

  const controls = createControls([
    { kind: 'range', id: 'amp', label: '振幅（波の高さ）', min: 0, max: 1.5, step: 0.05, value: 0.6 },
    {
      kind: 'range',
      id: 'freq',
      label: '波の細かさ',
      min: 0.2,
      max: 3,
      step: 0.05,
      value: 1,
    },
    { kind: 'range', id: 'speed', label: '進む速さ', min: 0, max: 3, step: 0.1, value: 1 },
    { kind: 'select', id: 'mode', label: '波のかたち', value: 'ripple', options: [
      { value: 'line', label: '一方向に進む波（x だけ使う）' },
      { value: 'ripple', label: '中心から広がる波（距離を使う）' },
      { value: 'cross', label: '2方向の重ね合わせ（x と z）' },
    ] },
  ]);

  const readouts = createReadouts([
    { key: 'formula', label: '高さ y の作り方', color: vecColor('result') },
    { key: 't', label: '経過時間', color: vecColor('normal') },
  ]);

  let elapsed = 0;

  const applyWave = (): void => {
    const amp = controls.num('amp');
    const freq = controls.num('freq');
    const mode = controls.str('mode');

    for (let i = 0; i < position.count; i += 1) {
      const x = base.getX(i);
      const z = base.getZ(i);
      let height: number;
      if (mode === 'line') {
        height = Math.sin(x * freq + elapsed);
      } else if (mode === 'cross') {
        height = (Math.sin(x * freq + elapsed) + Math.sin(z * freq + elapsed * 0.8)) / 2;
      } else {
        const distance = Math.hypot(x, z);
        height = Math.sin(distance * freq * 2 - elapsed * 2);
      }
      position.setY(i, height * amp);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();

    readouts.set(
      'formula',
      mode === 'line'
        ? 'sin(x × 細かさ + 時間) × 振幅'
        : mode === 'cross'
          ? '(sin(x…) + sin(z…)) ÷ 2 × 振幅'
          : 'sin(中心からの距離 × … − 時間) × 振幅',
    );
    readouts.set('t', fmt(elapsed, 1));
  };

  stage.onFrame((dt) => {
    if (!stage.reduceMotion) elapsed += dt * controls.num('speed');
    applyWave();
  });

  controls.onChange(applyWave);
  stage.onTheme(() => material.color.set(vecColor('a')));

  applyWave();

  fillCard(card, stage, [controls.root, readouts.root]);

  return { dispose: () => stage.dispose() };
}
