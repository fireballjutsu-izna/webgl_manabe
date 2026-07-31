/**
 * CH.2-40 再帰的な分割 — 同じ手順を、半分の大きさで繰り返す。
 *
 * 1 本の線分に規則を 1 つ与え、それを自分自身に適用し続ける。
 * 深さのスライダーを 1 ずつ上げると、線の数が何倍に増えるかが読み出しに出る。
 * ここで「深さを 1 増やすと爆発する」を体で分かっておくと、実践部で助かる。
 */

import * as THREE from 'three';
import { createPolyline, fmt, vecColor } from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const MAX_POINTS = 30000;

/** 種から数列を作る小さな乱数（中点変位で使う）。 */
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
    camera: [0, 0.9, 10.4],
    target: [0, 0.9, 0],
    controls: false,
  });

  const shape = createPolyline(vecColor('result'), MAX_POINTS);
  stage.scene.add(shape.object);
  const base = createPolyline(vecColor('guide'), 8, true);
  stage.scene.add(base.object);

  const controls = createControls([
    {
      kind: 'select',
      id: 'rule',
      label: '当てはめる規則',
      value: 'koch',
      options: [
        { value: 'koch', label: '真ん中を三角に折る（コッホ曲線）' },
        { value: 'displace', label: '真ん中をランダムに上下させる（中点変位）' },
        { value: 'smooth', label: '角を削ってなめらかにする' },
      ],
    },
    {
      kind: 'range',
      id: 'depth',
      label: '深さ',
      min: 0,
      max: 6,
      step: 1,
      value: 3,
      format: (v) => `${v.toFixed(0)}`,
    },
    { kind: 'range', id: 'seed', label: '種', min: 1, max: 30, step: 1, value: 5, format: (v) => `${v.toFixed(0)}` },
    { kind: 'range', id: 'rough', label: 'でこぼこの強さ', min: 0.1, max: 1.2, step: 0.05, value: 0.6 },
  ]);

  const readouts = createReadouts([
    { key: 'segs', label: '線分の数', color: vecColor('result') },
    { key: 'growth', label: '深さを 1 増やすたびに' },
    { key: 'len', label: '全体の長さ', color: vecColor('normal') },
    { key: 'note', label: 'ひとこと' },
  ]);

  /** 1 段ぶんの分割。points を受け取って、規則を当てはめた新しい列を返す。 */
  function step(points: THREE.Vector3[], rule: string, rand: () => number, scale: number): THREE.Vector3[] {
    const out: THREE.Vector3[] = [];

    if (rule === 'smooth') {
      // 角を削る：各線分を 1/4 と 3/4 の点で置き換える（チェイキン法）
      out.push(points[0]!.clone());
      for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i]!;
        const b = points[i + 1]!;
        out.push(new THREE.Vector3().lerpVectors(a, b, 0.25));
        out.push(new THREE.Vector3().lerpVectors(a, b, 0.75));
      }
      out.push(points[points.length - 1]!.clone());
      return out;
    }

    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i]!;
      const b = points[i + 1]!;
      out.push(a.clone());

      if (rule === 'koch') {
        // 3 等分して、真ん中を外向きの三角に折る
        const p1 = new THREE.Vector3().lerpVectors(a, b, 1 / 3);
        const p2 = new THREE.Vector3().lerpVectors(a, b, 2 / 3);
        const d = new THREE.Vector3().subVectors(b, a);
        const perp = new THREE.Vector3(-d.y, d.x, 0).multiplyScalar(Math.sqrt(3) / 6);
        const tip = new THREE.Vector3().lerpVectors(a, b, 0.5).add(perp);
        out.push(p1, tip, p2);
      } else {
        // 中点を、線分の長さに比例した量だけ上下にずらす
        const mid = new THREE.Vector3().lerpVectors(a, b, 0.5);
        mid.y += (rand() * 2 - 1) * a.distanceTo(b) * scale;
        out.push(mid);
      }
    }
    out.push(points[points.length - 1]!.clone());
    return out;
  }

  const update = (): void => {
    const rule = controls.str('rule');
    const depth = Math.round(controls.num('depth'));
    const rand = mulberry32(Math.round(controls.num('seed')) * 6151 + 7);
    const scale = controls.num('rough');

    let pts: THREE.Vector3[] = [new THREE.Vector3(-4.6, 0, 0), new THREE.Vector3(4.6, 0, 0)];
    base.set([pts[0]!.clone().setZ(-0.01), pts[1]!.clone().setZ(-0.01)]);

    for (let i = 0; i < depth; i += 1) {
      if (pts.length * 4 > MAX_POINTS) break;
      pts = step(pts, rule, rand, scale);
    }
    shape.set(pts.map((p) => p.clone().setZ(0.01)));

    let len = 0;
    for (let i = 0; i < pts.length - 1; i += 1) len += pts[i]!.distanceTo(pts[i + 1]!);

    const perStep = rule === 'koch' ? 4 : 2;
    readouts.set('segs', `${pts.length - 1}`);
    readouts.set('growth', `${perStep} 倍（深さ 10 なら ${Math.pow(perStep, 10).toLocaleString()} 本）`);
    readouts.set('len', `${fmt(len, 2)}（もとの直線は 9.20）`);
    readouts.set(
      'note',
      rule === 'koch'
        ? '長さが 4/3 倍ずつ増える。深さを上げると無限に伸びる'
        : rule === 'displace'
          ? '同じ種なら、深さを変えても大きな起伏は保たれる'
          : '角が削れて、線が曲線に近づいていく',
    );
  };

  controls.onChange(update);
  stage.onTheme(() => {
    shape.setColor(vecColor('result'));
    base.setColor(vecColor('guide'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '分割してできた形', color: vecColor('result') },
      { label: 'もとの線分（深さ 0）', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
