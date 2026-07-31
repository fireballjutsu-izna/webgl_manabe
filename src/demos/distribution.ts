/**
 * CH.1-40 分布の偏り — 「ランダムに散らす」は、思ったとおりに散らない。
 *
 * 円の中に点をばらまく素朴な書き方（半径と角度をそれぞれ乱数にする）は、
 * 中心に密集する。面積は半径の二乗で増えるのに、半径を一様に選んでいるため。
 * 内側半分の円に入る割合が 25% になるか 50% になるかで、それが数字にも出る。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { createPolyline, fmt, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

/** 決め打ちの乱数。シードを変えない限り、毎回まったく同じ点が出る。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX_POINTS = 4000;
const BINS = 10;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 6.5, 0.01],
    target: [0, 0, 0],
    controls: false,
    labels: true,
  });

  /* ---- 点群 ---- */

  const positions = new Float32Array(MAX_POINTS * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: new THREE.Color(vecColor('a')),
    size: 0.045,
    sizeAttenuation: true,
  });
  stage.scene.add(new THREE.Points(geometry, material));

  /* ---- 外周の円と、面積が半分になる内側の円 ---- */

  const ring = (radius: number, color: string, dashed: boolean) => {
    const line = createPolyline(color, 130, dashed);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i += 1) {
      const t = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
    }
    line.set(pts);
    stage.scene.add(line.object);
    return line;
  };
  const outer = ring(2, vecColor('guide'), false);
  // 半径 1/√2 の円が、面積をちょうど半分に分ける
  const half = ring(2 / Math.SQRT2, vecColor('result'), true);

  const labelHalf = stage.addLabel('面積を半分に分ける円', vecColor('result'));
  labelHalf.position.set(0, 0, 2 / Math.SQRT2 + 0.35);
  stage.scene.add(labelHalf);

  const controls = createControls([
    {
      kind: 'select',
      id: 'kind',
      label: 'ばらまき方',
      value: 'naive',
      options: [
        { value: 'naive', label: '半径も角度もそのまま乱数（素朴な書き方）' },
        { value: 'sqrt', label: '半径に平方根を通す（正しい書き方）' },
        { value: 'reject', label: '正方形に打って、円の外は捨てる' },
      ],
    },
    { kind: 'range', id: 'n', label: '点の数', min: 200, max: MAX_POINTS, step: 100, value: 2000 },
    { kind: 'range', id: 'seed', label: 'シード', min: 1, max: 20, step: 1, value: 1 },
  ]);

  const readouts = createReadouts([
    { key: 'inner', label: '内側の円に入った割合', color: vecColor('result') },
    { key: 'want', label: '面積どおりなら' },
    { key: 'hist', label: '外周に近い 2 割の帯にいる点' },
  ]);

  const update = (): void => {
    const kind = controls.str('kind');
    const n = Math.round(controls.num('n'));
    const rand = mulberry32(Math.round(controls.num('seed')) * 7919);

    const bins = new Array<number>(BINS).fill(0);
    let inner = 0;
    let count = 0;

    while (count < n) {
      let x = 0;
      let z = 0;
      if (kind === 'reject') {
        // 正方形に打って、円からはみ出したら捨てる
        x = rand() * 2 - 1;
        z = rand() * 2 - 1;
        if (x * x + z * z > 1) continue;
      } else {
        const u = rand();
        // 素朴な書き方は半径をそのまま一様に選ぶ。正しくは平方根を通す
        const r = kind === 'sqrt' ? Math.sqrt(u) : u;
        const theta = rand() * Math.PI * 2;
        x = Math.cos(theta) * r;
        z = Math.sin(theta) * r;
      }

      const d = Math.hypot(x, z);
      if (d <= 1 / Math.SQRT2) inner += 1;
      bins[Math.min(BINS - 1, Math.floor(d * BINS))]! += 1;

      positions[count * 3] = x * 2;
      positions[count * 3 + 1] = 0;
      positions[count * 3 + 2] = z * 2;
      count += 1;
    }

    geometry.setDrawRange(0, count);
    (geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    geometry.computeBoundingSphere();

    const outerBand = (bins[BINS - 1]! + bins[BINS - 2]!) / count;

    readouts.set('inner', `${fmt((inner / count) * 100, 1)} %`);
    readouts.set('want', '50.0 %（内側の円は面積のちょうど半分）');
    readouts.set('hist', `${fmt(outerBand * 100, 1)} %（面積どおりなら 36.0 %）`);
  };

  controls.onChange(update);
  stage.onTheme(() => {
    material.color.set(vecColor('a'));
    outer.setColor(vecColor('guide'));
    half.setColor(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'ばらまいた点', color: vecColor('a') },
      { label: '面積を半分に分ける円（半径の 0.707 倍）', color: vecColor('result'), dashed: true },
      { label: '外周', color: vecColor('guide') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
