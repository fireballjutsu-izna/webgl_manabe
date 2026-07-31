/**
 * CH.2-23 球面への一様分布 — 緯度をそのまま一様に選ぶと、極に溜まる。
 *
 * 帯の面積は「高さ」だけで決まる（アルキメデスの定理）ので、
 * 高さ y を一様に選ぶのが正解になる。それを数で見せるために、
 * 面積がちょうど半分の「極冠」に入った点の割合を数えている。
 */

import * as THREE from 'three';
import { createPolyline, fmt, vecColor } from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { cssVar } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const MAX = 4000;
const R = 2;

/** 章の中で説明している、種から数列を作る小さな乱数。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [4.2, 3.4, 5.4],
    labels: false,
    hint: 'ドラッグで視点を回転',
  });

  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.SphereGeometry(R * 0.99, 12, 6)),
    new THREE.LineBasicMaterial({ color: new THREE.Color(cssVar('--border', '#26263c')), fog: false }),
  );
  stage.scene.add(wire);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
  const material = new THREE.PointsMaterial({
    size: 0.055,
    color: new THREE.Color(vecColor('a')),
    fog: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  stage.scene.add(points);

  // 面積がちょうど半分になる境目（|y| = R/2）。ここより外が極冠
  const upper = createPolyline(vecColor('result'), 130);
  const lower = createPolyline(vecColor('result'), 130);
  stage.scene.add(upper.object, lower.object);

  const controls = createControls([
    {
      kind: 'select',
      id: 'kind',
      label: '選び方',
      value: 'naive',
      options: [
        { value: 'naive', label: '緯度と経度をそのまま一様に選ぶ（素朴）' },
        { value: 'height', label: '高さ y を一様に選ぶ（正しい）' },
        { value: 'normal', label: '正規分布の 3 成分を正規化（正しい）' },
      ],
    },
    {
      kind: 'range',
      id: 'count',
      label: '点の数',
      min: 200,
      max: MAX,
      step: 100,
      value: 2000,
      format: (v) => `${v.toFixed(0)}`,
    },
    { kind: 'range', id: 'seed', label: '種', min: 1, max: 40, step: 1, value: 7, format: (v) => `${v.toFixed(0)}` },
  ]);

  const readouts = createReadouts([
    { key: 'cap', label: '極冠に入った割合', color: vecColor('result') },
    { key: 'want', label: '面積から期待される割合' },
    { key: 'note', label: '判定' },
  ]);

  const update = (): void => {
    const kind = controls.str('kind');
    const count = Math.round(controls.num('count'));
    const rand = mulberry32(Math.round(controls.num('seed')) * 7919 + 13);

    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    let cap = 0;

    for (let i = 0; i < count; i += 1) {
      let x = 0;
      let y = 0;
      let z = 0;

      if (kind === 'naive') {
        // 緯度を一様に選ぶ。北へ行くほど輪が小さいのに、同じ数だけ配ってしまう
        const lat = (rand() * 2 - 1) * (Math.PI / 2);
        const lon = rand() * Math.PI * 2;
        const flat = Math.cos(lat);
        x = flat * Math.sin(lon);
        y = Math.sin(lat);
        z = flat * Math.cos(lon);
      } else if (kind === 'height') {
        // 高さを一様に選ぶ。帯の面積が高さに比例するので、これで揃う
        y = rand() * 2 - 1;
        const flat = Math.sqrt(Math.max(0, 1 - y * y));
        const lon = rand() * Math.PI * 2;
        x = flat * Math.sin(lon);
        z = flat * Math.cos(lon);
      } else {
        // 正規分布は向きに偏りがないので、正規化すれば球面に一様に散る
        const g = (): number => {
          const u = Math.max(rand(), 1e-9);
          const v = rand();
          return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        };
        x = g();
        y = g();
        z = g();
        const len = Math.hypot(x, y, z) || 1;
        x /= len;
        y /= len;
        z /= len;
      }

      if (Math.abs(y) > 0.5) cap += 1;
      attr.setXYZ(i, x * R, y * R, z * R);
    }

    attr.needsUpdate = true;
    geometry.setDrawRange(0, count);
    geometry.computeBoundingSphere();

    const ring = (h: number, out: ReturnType<typeof createPolyline>): void => {
      const r = Math.sqrt(1 - h * h) * R;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 128; i += 1) {
        const t = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * r, h * R, Math.sin(t) * r));
      }
      out.set(pts);
    };
    ring(0.5, upper);
    ring(-0.5, lower);

    const ratio = (cap / count) * 100;
    readouts.set('cap', `${fmt(ratio, 1)} %`);
    readouts.set('want', '50.0 %');
    readouts.set(
      'note',
      Math.abs(ratio - 50) < 3
        ? '面積どおり。偏りは見られない'
        : `${fmt(ratio - 50, 1)} ポイント多い。極に溜まっている`,
    );
  };

  controls.onChange(update);
  stage.onTheme(() => {
    (wire.material as THREE.LineBasicMaterial).color.set(cssVar('--border', '#26263c'));
    material.color.set(vecColor('a'));
    upper.setColor(vecColor('result'));
    lower.setColor(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '球面に配った点', color: vecColor('a') },
      { label: '面積がちょうど半分になる境目', color: vecColor('result') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
