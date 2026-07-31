/**
 * CH.1-07 座標平面 — 2 つの数で場所が 1 つに決まる。
 *
 * 数学の座標（y が上）と、画面の座標（y が下）を並べて出す。
 * この 2 つの取り違えは、マウスで 3D を触りはじめた人が最初に踏む段差なので、
 * 座標を習うのと同時に見せてしまう。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { createPoint, createSegment, fmt, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { cssVar } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const SPAN = 4;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 0, 11.5],
    controls: false,
    labels: true,
  });

  /* ---- 方眼と軸 ---- */

  const gridPoints: THREE.Vector3[] = [];
  for (let n = -SPAN; n <= SPAN; n += 1) {
    gridPoints.push(new THREE.Vector3(n, -SPAN, 0), new THREE.Vector3(n, SPAN, 0));
    gridPoints.push(new THREE.Vector3(-SPAN, n, 0), new THREE.Vector3(SPAN, n, 0));
  }
  const gridMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(cssVar('--border', '#26263c')),
    fog: false,
  });
  stage.scene.add(
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPoints), gridMaterial),
  );

  const axisX = createSegment(vecColor('guide'));
  axisX.set(new THREE.Vector3(-SPAN, 0, 0.01), new THREE.Vector3(SPAN, 0, 0.01));
  const axisY = createSegment(vecColor('guide'));
  axisY.set(new THREE.Vector3(0, -SPAN, 0.01), new THREE.Vector3(0, SPAN, 0.01));
  stage.scene.add(axisX.object, axisY.object);

  const labelXAxis = stage.addLabel('x', 'var(--text-muted)');
  labelXAxis.position.set(SPAN - 0.25, -0.35, 0);
  const labelYAxis = stage.addLabel('y', 'var(--text-muted)');
  labelYAxis.position.set(0.35, SPAN - 0.25, 0);
  stage.scene.add(labelXAxis, labelYAxis);

  /* ---- 点と、そこへ至る道すじ ---- */

  const dot = createPoint(vecColor('result'), 0.14);
  stage.scene.add(dot);

  const stepX = createSegment(vecColor('a'));
  const stepY = createSegment(vecColor('b'));
  stage.scene.add(stepX.object, stepY.object);

  const labelDot = stage.addLabel('P', vecColor('result'));
  stage.scene.add(labelDot);

  // 画面座標（y が下向き）で見たときの、同じ数字が指す場所
  const ghost = createPoint(vecColor('negative'), 0.11);
  stage.scene.add(ghost);
  const labelGhost = stage.addLabel('画面座標なら、ここ', vecColor('negative'));
  stage.scene.add(labelGhost);

  const controls = createControls([
    { kind: 'range', id: 'x', label: 'x', min: -SPAN, max: SPAN, step: 0.5, value: 3 },
    { kind: 'range', id: 'y', label: 'y', min: -SPAN, max: SPAN, step: 0.5, value: 2 },
    { kind: 'check', id: 'screen', label: '同じ数字を「画面座標」で読むとどこか', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'p', label: '点 P', color: vecColor('result') },
    { key: 'quad', label: 'どの区画か' },
    { key: 'screen', label: '画面座標として読むと', color: vecColor('negative') },
  ]);

  const from = new THREE.Vector3();
  const to = new THREE.Vector3();

  const quadrant = (x: number, y: number): string => {
    if (Math.abs(x) < 1e-6 && Math.abs(y) < 1e-6) return '原点';
    if (Math.abs(x) < 1e-6) return y > 0 ? 'y 軸の上' : 'y 軸の下';
    if (Math.abs(y) < 1e-6) return x > 0 ? 'x 軸の右' : 'x 軸の左';
    if (x > 0 && y > 0) return '右上（x も y もプラス）';
    if (x < 0 && y > 0) return '左上（x がマイナス）';
    if (x < 0 && y < 0) return '左下（どちらもマイナス）';
    return '右下（y がマイナス）';
  };

  const update = (): void => {
    const x = controls.num('x');
    const y = controls.num('y');

    dot.position.set(x, y, 0.03);
    labelDot.position.set(x + 0.05, y + 0.4, 0);

    // 「x のぶん進み、そこから y のぶん上がる」を 2 本の線で見せる
    // 軸の真上に重ねると線が見えなくなるので、わずかにずらして描く
    const off = 0.12;
    stepX.set(from.set(0, off, 0.02), to.set(x, off, 0.02));
    stepX.setVisible(Math.abs(x) > 1e-6);
    stepY.set(from.set(x + off, 0, 0.02), to.set(x + off, y, 0.02));
    stepY.setVisible(Math.abs(y) > 1e-6);

    const showScreen = controls.bool('screen');
    ghost.visible = showScreen;
    labelGhost.visible = showScreen;
    ghost.position.set(x, -y, 0.02);
    labelGhost.position.set(x - 0.9, -y - 0.5, 0);

    readouts.set('p', `(${fmt(x, 1)}, ${fmt(y, 1)})`);
    readouts.set('quad', quadrant(x, y));
    readouts.set('screen', `右へ ${fmt(x, 1)}、下へ ${fmt(y, 1)}`);
  };

  controls.onChange(update);
  stage.onTheme(() => {
    gridMaterial.color.set(cssVar('--border', '#26263c'));
    axisX.setColor(vecColor('guide'));
    axisY.setColor(vecColor('guide'));
    stepX.setColor(vecColor('a'));
    stepY.setColor(vecColor('b'));
    (dot.material as THREE.MeshBasicMaterial).color.set(vecColor('result'));
    (ghost.material as THREE.MeshBasicMaterial).color.set(vecColor('negative'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'x のぶんの移動', color: vecColor('a') },
      { label: 'y のぶんの移動', color: vecColor('b') },
      { label: '着いた点 P', color: vecColor('result') },
      { label: '同じ数字を画面座標で読んだ場合', color: vecColor('negative') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
