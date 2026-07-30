/**
 * CH.3-02 惑星の表面 — 重ね合わせの段数と海面の高さで、惑星の見た目がどう変わるかを見る。
 *
 * テクスチャの生成は 1 枚あたり 13 万画素ぶんのループなので、スライダーを動かしている
 * あいだは作り直さず、フレームの合間に間引いて作り直す。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { fmt, vecColor } from '../three/helpers.ts';
import { fbm3 } from '../three/noise.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const TEX_W = 512;
const TEX_H = 256;
/** 作り直しの間隔（秒）。連続して動かしても詰まらないようにする。 */
const REBUILD_INTERVAL = 0.15;

interface Built {
  land: number;
}

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 0.9, 4.6],
    target: [0, 0, 0],
    hint: 'ドラッグで視点を回転',
  });

  const sun = new THREE.DirectionalLight(0xfff2e0, 3.4);
  sun.position.set(4, 1.5, 3);
  stage.scene.add(sun, new THREE.AmbientLight(0x3a4a6a, 0.4));

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = TEX_W;
  colorCanvas.height = TEX_H;
  const colorCtx = colorCanvas.getContext('2d')!;
  const colorImage = colorCtx.createImageData(TEX_W, TEX_H);

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshStandardMaterial({ map: colorMap, roughness: 0.85 });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 48), material);
  stage.scene.add(planet);

  const controls = createControls([
    { kind: 'range', id: 'octaves', label: '重ね合わせの段数 octaves', min: 1, max: 6, step: 1, value: 5, format: (v) => String(v) },
    { kind: 'range', id: 'freq', label: '基本の細かさ frequency', min: 0.6, max: 5, step: 0.1, value: 2.2 },
    { kind: 'range', id: 'sea', label: '海面の高さ', min: 0, max: 0.85, step: 0.01, value: 0.5 },
    { kind: 'range', id: 'gain', label: '細かい凹凸の強さ gain', min: 0.2, max: 0.75, step: 0.01, value: 0.5 },
  ]);

  const readouts = createReadouts([
    { key: 'land', label: '陸の割合', color: vecColor('result') },
    { key: 'note', label: '見えかた', color: vecColor('b') },
  ]);

  /** 高さと緯度から地表の色を決める。海は深さで、陸は高さと緯度で塗り分ける。 */
  const paint = (height: number, sea: number, absLat: number, out: number[]): void => {
    if (height < sea) {
      // 海。深いほど暗く青い
      const depth = sea > 0 ? Math.min(1, (sea - height) / Math.max(sea, 0.001)) : 0;
      out[0] = 14 + (1 - depth) * 40;
      out[1] = 48 + (1 - depth) * 78;
      out[2] = 92 + (1 - depth) * 74;
      return;
    }
    // 陸。海面からの高さを 0〜1 に伸ばす
    const above = sea < 1 ? (height - sea) / Math.max(1 - sea, 0.001) : 0;
    // 極に近いほど、低いところでも雪が乗る
    const snowLine = 0.62 - absLat * 0.62;
    if (above > snowLine) {
      out[0] = 232;
      out[1] = 238;
      out[2] = 246;
      return;
    }
    if (above < 0.06) {
      // 波打ち際の砂
      out[0] = 196;
      out[1] = 182;
      out[2] = 136;
      return;
    }
    const rock = Math.min(1, above / Math.max(snowLine, 0.001));
    out[0] = 62 + rock * 92;
    out[1] = 96 + rock * 66;
    out[2] = 58 + rock * 60;
  };

  const rgb: number[] = [0, 0, 0];

  const build = (): Built => {
    const octaves = Math.round(controls.num('octaves'));
    const frequency = controls.num('freq');
    const sea = controls.num('sea');
    const gain = controls.num('gain');
    const data = colorImage.data;

    let landPixels = 0;
    let weight = 0;

    for (let row = 0; row < TEX_H; row++) {
      // 画像の上の行が北極。v が 1 のところが上に来る
      const lat = (0.5 - row / (TEX_H - 1)) * Math.PI;
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);
      const absLat = Math.min(1, Math.abs(lat) / (Math.PI / 2));
      // 極の行は面積が小さいので、陸の割合を出すときの重みも小さくする
      const rowWeight = Math.max(cosLat, 0);

      for (let col = 0; col < TEX_W; col++) {
        const lon = (col / TEX_W - 0.5) * Math.PI * 2;
        // UV ではなく「その画素が向いている方向」でノイズを引く。だから継ぎ目が出ない
        const nx = cosLat * Math.cos(lon) * frequency;
        const ny = sinLat * frequency;
        const nz = cosLat * Math.sin(lon) * frequency;

        const height = fbm3(nx + 8, ny + 8, nz + 8, { octaves, gain, seed: 1337 });
        paint(height, sea, absLat, rgb);

        const at = (row * TEX_W + col) * 4;
        data[at] = rgb[0]!;
        data[at + 1] = rgb[1]!;
        data[at + 2] = rgb[2]!;
        data[at + 3] = 255;

        if (height >= sea) landPixels += rowWeight;
        weight += rowWeight;
      }
    }

    colorCtx.putImageData(colorImage, 0, 0);
    colorMap.needsUpdate = true;

    return { land: weight > 0 ? landPixels / weight : 0 };
  };

  const describe = (octaves: number, land: number): string => {
    if (octaves <= 1) return '海岸線がなめらかすぎる。大陸というより染み';
    if (land < 0.06) return 'ほとんど水の惑星';
    if (land > 0.9) return '海がほぼ無い。乾いた星';
    if (octaves >= 5) return '入り江や島が出てきて、地図らしくなる';
    return '大陸の形はできたが、細部が足りない';
  };

  let dirty = true;
  let sinceRebuild = 0;

  controls.onChange(() => {
    dirty = true;
  });

  stage.onFrame((dt) => {
    if (!stage.reduceMotion) planet.rotation.y += dt * 0.07;

    sinceRebuild += dt;
    if (dirty && sinceRebuild >= REBUILD_INTERVAL) {
      dirty = false;
      sinceRebuild = 0;
      const built = build();
      readouts.set('land', `${fmt(built.land * 100)} %`);
      readouts.set('note', describe(Math.round(controls.num('octaves')), built.land));
    }
  });

  const first = build();
  readouts.set('land', `${fmt(first.land * 100)} %`);
  readouts.set('note', describe(Math.round(controls.num('octaves')), first.land));

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '段数 1 と 5 を往復すると、「粗い形」と「細部」が別々の仕事だと分かります', color: vecColor('a') },
      { label: '海面を上げていくと、大陸がちぎれて島になります', color: vecColor('result') },
    ]),
  ]);

  return {
    dispose: () => {
      stage.dispose();
      colorMap.dispose();
    },
  };
}
