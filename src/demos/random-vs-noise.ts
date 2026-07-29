/**
 * CH.13 ランダムとノイズ — 一様乱数とノイズの違いを、同じ格子の高さで見比べる。
 * ノイズは依存を増やさないよう、格子点の乱数をなめらかに補間する自前の value noise。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { addStudioLights, fmt, solidMaterial, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const GRID = 34;
const SIZE = 8;

/** 同じシードなら必ず同じ値を返す、決め打ちの疑似乱数。 */
function hash(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/** なめらかにつなぐための重み（両端で傾きが 0 になる） */
const fade = (t: number): number => t * t * (3 - 2 * t);

function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);

  const u = fade(xf);
  const v = fade(yf);

  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 6.5, 9],
    target: [0, 0, 0],
    labels: false,
    hint: 'ドラッグで視点を回転',
  });

  addStudioLights(stage.scene);

  const geometry = new THREE.PlaneGeometry(SIZE, SIZE, GRID, GRID);
  geometry.rotateX(-Math.PI / 2);
  const material = solidMaterial(vecColor('a'), { flatShading: true });
  const terrain = new THREE.Mesh(geometry, material);
  stage.scene.add(terrain);

  const base = geometry.getAttribute('position').clone();
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;

  const controls = createControls([
    { kind: 'select', id: 'mode', label: '高さの決め方', value: 'noise', options: [
      { value: 'random', label: '一様乱数（頂点ごとに無関係）' },
      { value: 'noise', label: 'ノイズ（近い場所は似た値）' },
      { value: 'fbm', label: 'ノイズを重ねる（fBm・地形らしくなる）' },
    ] },
    { kind: 'range', id: 'scale', label: 'ノイズの粗さ', min: 0.3, max: 4, step: 0.1, value: 1.2 },
    { kind: 'range', id: 'amp', label: '高さの幅', min: 0.1, max: 2.5, step: 0.05, value: 1.2 },
    { kind: 'range', id: 'seed', label: 'シード', min: 1, max: 40, step: 1, value: 7, format: (v) => v.toFixed(0) },
    { kind: 'button', id: 'reseed', label: 'シードを変える' },
  ]);

  const readouts = createReadouts([
    { key: 'mode', label: '見えているもの', color: vecColor('result') },
    { key: 'seed', label: 'シード', color: vecColor('normal') },
  ]);

  const build = (): void => {
    const mode = controls.str('mode');
    const scale = controls.num('scale');
    const amp = controls.num('amp');
    const seed = controls.num('seed');

    for (let i = 0; i < position.count; i += 1) {
      const x = base.getX(i);
      const z = base.getZ(i);
      let height: number;

      if (mode === 'random') {
        // 隣どうしがまったく無関係なので、とげとげの砂嵐になる
        height = hash(i, i * 1.7, seed);
      } else if (mode === 'fbm') {
        // 粗い波に細かい波を重ねる。1オクターブごとに細かく・弱くする
        let value = 0;
        let weight = 0.5;
        let frequency = scale;
        for (let octave = 0; octave < 4; octave += 1) {
          value += valueNoise(x * frequency, z * frequency, seed + octave * 13) * weight;
          frequency *= 2;
          weight *= 0.5;
        }
        height = value;
      } else {
        height = valueNoise(x * scale, z * scale, seed);
      }

      position.setY(i, (height - 0.5) * amp * 2);
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();

    readouts.set(
      'mode',
      mode === 'random'
        ? '一様乱数：隣どうしが無関係なので、とげとげになる'
        : mode === 'fbm'
          ? 'ノイズの重ね合わせ：大きなうねりと細かい起伏が同居する'
          : 'ノイズ：近い場所は似た高さになるので、なだらかにつながる',
    );
    readouts.set('seed', fmt(seed, 0));
  };

  controls.onChange(build);
  controls.onClick((id) => {
    if (id !== 'reseed') return;
    controls.set('seed', 1 + Math.floor(Math.random() * 40));
  });
  stage.onTheme(() => material.color.set(vecColor('a')));

  build();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([{ label: '高さを乱数／ノイズで決めた地形', color: vecColor('a') }]),
  ]);

  return { dispose: () => stage.dispose() };
}
