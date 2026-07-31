/**
 * CH.1-03 関数とグラフ — 「入力を 1 つ入れると出力が 1 つ決まる」を目で見る。
 *
 * 式を選び、つまみを回し、入力 x を動かすと、点 (x, f(x)) が曲線の上を走る。
 * グラフは「あり得る入出力の組を全部いっぺんに描いたもの」だと分かればよい。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import {
  createPoint,
  createPolyline,
  createSegment,
  fmt,
  vecColor,
} from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { cssVar } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const SPAN = 5;
const SAMPLES = 240;

interface Kind {
  /** 表示する式。 */
  label: (a: number, b: number) => string;
  f: (x: number, a: number, b: number) => number;
  /** 定義されていない入力（グラフを描かない範囲）。 */
  undefinedAt?: (x: number) => boolean;
}

const KINDS: Record<string, Kind> = {
  linear: {
    label: (a, b) => `f(x) = ${fmt(a, 1)}x + ${fmt(b, 1)}`,
    f: (x, a, b) => a * x + b,
  },
  square: {
    label: (a, b) => `f(x) = ${fmt(a, 1)}x² + ${fmt(b, 1)}`,
    f: (x, a, b) => a * x * x + b,
  },
  sqrt: {
    label: (a, b) => `f(x) = ${fmt(a, 1)}√x + ${fmt(b, 1)}`,
    f: (x, a, b) => a * Math.sqrt(x) + b,
    undefinedAt: (x) => x < 0,
  },
  abs: {
    label: (a, b) => `f(x) = ${fmt(a, 1)}|x| + ${fmt(b, 1)}`,
    f: (x, a, b) => a * Math.abs(x) + b,
  },
};

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 0, 13.5],
    controls: false,
    labels: true,
  });

  /* ---- 方眼と 2 本の軸 ---- */

  // xy 平面の方眼。GridHelper は xz 平面かつ頂点色なので、ここは自前で組む
  const gridPoints: THREE.Vector3[] = [];
  for (let n = -SPAN; n <= SPAN; n += 1) {
    gridPoints.push(new THREE.Vector3(n, -SPAN, 0), new THREE.Vector3(n, SPAN, 0));
    gridPoints.push(new THREE.Vector3(-SPAN, n, 0), new THREE.Vector3(SPAN, n, 0));
  }
  const gridMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(cssVar('--border', '#26263c')),
    fog: false,
  });
  const grid = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(gridPoints),
    gridMaterial,
  );
  stage.scene.add(grid);

  const axisX = createSegment(vecColor('guide'));
  axisX.set(new THREE.Vector3(-SPAN, 0, 0.01), new THREE.Vector3(SPAN, 0, 0.01));
  const axisY = createSegment(vecColor('guide'));
  axisY.set(new THREE.Vector3(0, -SPAN, 0.01), new THREE.Vector3(0, SPAN, 0.01));
  stage.scene.add(axisX.object, axisY.object);

  const labelX = stage.addLabel('x（入力）', 'var(--text-muted)');
  labelX.position.set(SPAN - 0.9, -0.45, 0);
  const labelY = stage.addLabel('f(x)（出力）', 'var(--text-muted)');
  labelY.position.set(1.25, SPAN - 0.7, 0);
  stage.scene.add(labelX, labelY);

  /* ---- 曲線と、いま選んでいる 1 点 ---- */

  const curve = createPolyline(vecColor('a'), SAMPLES + 2);
  stage.scene.add(curve.object);

  const dot = createPoint(vecColor('result'), 0.13);
  stage.scene.add(dot);

  const dropX = createSegment(vecColor('guide'), true);
  const dropY = createSegment(vecColor('guide'), true);
  stage.scene.add(dropX.object, dropY.object);

  const labelDot = stage.addLabel('(x, f(x))', vecColor('result'));
  stage.scene.add(labelDot);

  const controls = createControls([
    {
      kind: 'select',
      id: 'kind',
      label: '式',
      value: 'linear',
      options: [
        { value: 'linear', label: 'f(x) = a x + b（一次）' },
        { value: 'square', label: 'f(x) = a x² + b（二次）' },
        { value: 'sqrt', label: 'f(x) = a √x + b（平方根）' },
        { value: 'abs', label: 'f(x) = a |x| + b（絶対値）' },
      ],
    },
    { kind: 'range', id: 'a', label: 'a', min: -2, max: 2, step: 0.1, value: 1 },
    { kind: 'range', id: 'b', label: 'b', min: -3, max: 3, step: 0.5, value: 0 },
    { kind: 'range', id: 'x', label: '入力 x', min: -SPAN, max: SPAN, step: 0.1, value: 2 },
  ]);

  const readouts = createReadouts([
    { key: 'expr', label: 'いまの式', color: vecColor('a') },
    { key: 'in', label: '入力 x' },
    { key: 'out', label: '出力 f(x)', color: vecColor('result') },
  ]);

  const points: THREE.Vector3[] = [];

  const update = (): void => {
    const kind = KINDS[controls.str('kind')] ?? KINDS.linear!;
    const a = controls.num('a');
    const b = controls.num('b');
    const x = controls.num('x');

    points.length = 0;
    for (let i = 0; i <= SAMPLES; i += 1) {
      const px = -SPAN + (2 * SPAN * i) / SAMPLES;
      if (kind.undefinedAt?.(px)) continue;
      const py = kind.f(px, a, b);
      // 枠の外に出た区間は描かない（線が枠を突き抜けると読みにくい）
      if (!Number.isFinite(py) || Math.abs(py) > SPAN) continue;
      points.push(new THREE.Vector3(px, py, 0.02));
    }
    curve.set(points);

    const defined = !kind.undefinedAt?.(x);
    const y = defined ? kind.f(x, a, b) : Number.NaN;
    const onScreen = defined && Number.isFinite(y) && Math.abs(y) <= SPAN;

    dot.visible = onScreen;
    labelDot.visible = onScreen;
    dropX.setVisible(onScreen);
    dropY.setVisible(onScreen);

    if (onScreen) {
      dot.position.set(x, y, 0.03);
      labelDot.position.set(x, y + 0.42, 0);
      dropX.set(new THREE.Vector3(x, 0, 0.02), new THREE.Vector3(x, y, 0.02));
      dropY.set(new THREE.Vector3(0, y, 0.02), new THREE.Vector3(x, y, 0.02));
    }

    readouts.set('expr', kind.label(a, b));
    readouts.set('in', fmt(x, 1));
    readouts.set('out', defined ? fmt(y, 2) : '定義なし（√ の中は負にできない）');
  };

  controls.onChange(update);
  stage.onTheme(() => {
    gridMaterial.color.set(cssVar('--border', '#26263c'));
    axisX.setColor(vecColor('guide'));
    axisY.setColor(vecColor('guide'));
    curve.setColor(vecColor('a'));
    dropX.setColor(vecColor('guide'));
    dropY.setColor(vecColor('guide'));
    (dot.material as THREE.MeshBasicMaterial).color.set(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'グラフ（あり得る入出力の組を全部描いたもの）', color: vecColor('a') },
      { label: 'いま選んでいる 1 組 (x, f(x))', color: vecColor('result') },
      { label: '入力と出力を軸まで下ろした線', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
