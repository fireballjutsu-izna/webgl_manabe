/**
 * CH.2-33 フレネル — 浅い角度で見るほど、よく映る。
 *
 * 左に入射の図、右に反射率の曲線を並べる。
 * 正面（0 度）では 4% しか映らないガラスが、
 * 80 度を超えたあたりから急に鏡になる ― その落差を数字と曲線で見せる。
 */

import * as THREE from 'three';
import {
  createArrow,
  createPoint,
  createPolyline,
  createSegment,
  fmt,
  vecColor,
} from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { cssVar } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

/** 材質ごとの「正面から見たときの反射率」。 */
const F0: Record<string, number> = {
  water: 0.02,
  glass: 0.04,
  plastic: 0.05,
  diamond: 0.17,
  metal: 0.9,
};

/** Schlick の近似。実務のシェーダはほぼこの式を使う。 */
const schlick = (f0: number, cos: number): number => f0 + (1 - f0) * (1 - cos) ** 5;

/* 図の配置（左が入射の図、右が曲線） */
const DIAG_X = -4.2;
const GRAPH_X0 = -0.6;
const GRAPH_W = 5.4;
const GRAPH_Y0 = -1.6;
const GRAPH_H = 3.6;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0.6, 0.2, 10.2],
    target: [0.6, 0.2, 0],
    controls: false,
    labels: true,
  });

  /* ---- 左：入射の図 ---- */

  const surface = createSegment(vecColor('guide'));
  const normalArrow = createArrow(vecColor('normal'), { radius: 0.022, headRadius: 0.07 });
  const viewArrow = createArrow(vecColor('a'), { radius: 0.032, headRadius: 0.1 });
  const reflArrow = createArrow(vecColor('result'), { radius: 0.05, headRadius: 0.14 });
  const throughArrow = createArrow(vecColor('b'), { radius: 0.05, headRadius: 0.14 });
  stage.scene.add(
    surface.object,
    normalArrow.object,
    viewArrow.object,
    reflArrow.object,
    throughArrow.object,
  );

  const labelSurface = stage.addLabel('表面', vecColor('guide'));
  const labelRefl = stage.addLabel('映り込み', vecColor('result'));
  const labelThrough = stage.addLabel('通り抜ける', vecColor('b'));
  stage.scene.add(labelSurface, labelRefl, labelThrough);

  /* ---- 右：反射率の曲線 ---- */

  const axisMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(cssVar('--border-lit', '#3a3a5c')),
    fog: false,
  });
  stage.scene.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(GRAPH_X0, GRAPH_Y0, -0.01),
        new THREE.Vector3(GRAPH_X0 + GRAPH_W, GRAPH_Y0, -0.01),
        new THREE.Vector3(GRAPH_X0, GRAPH_Y0, -0.01),
        new THREE.Vector3(GRAPH_X0, GRAPH_Y0 + GRAPH_H, -0.01),
      ]),
      axisMaterial,
    ),
  );

  const gridMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(cssVar('--border', '#26263c')),
    fog: false,
  });
  const gridPts: THREE.Vector3[] = [];
  for (let i = 1; i <= 4; i += 1) {
    const y = GRAPH_Y0 + (i / 4) * GRAPH_H;
    gridPts.push(new THREE.Vector3(GRAPH_X0, y, -0.02), new THREE.Vector3(GRAPH_X0 + GRAPH_W, y, -0.02));
  }
  for (let i = 1; i <= 3; i += 1) {
    const x = GRAPH_X0 + (i / 3) * GRAPH_W;
    gridPts.push(new THREE.Vector3(x, GRAPH_Y0, -0.02), new THREE.Vector3(x, GRAPH_Y0 + GRAPH_H, -0.02));
  }
  stage.scene.add(
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPts), gridMaterial),
  );

  const curve = createPolyline(vecColor('result'), 130);
  stage.scene.add(curve.object);
  const marker = createSegment(vecColor('normal'), true);
  const markerDot = createPoint(vecColor('normal'), 0.09);
  stage.scene.add(marker.object, markerDot);

  const labelAxisX = stage.addLabel('見る角度（0 = 正面、90 = 真横）', vecColor('guide'));
  const labelAxisY = stage.addLabel('反射率', vecColor('result'));
  stage.scene.add(labelAxisX, labelAxisY);

  const controls = createControls([
    {
      kind: 'range',
      id: 'angle',
      label: '見る角度（法線から）',
      min: 0,
      max: 89,
      step: 1,
      value: 30,
      format: (v) => `${v.toFixed(0)}°`,
    },
    {
      kind: 'select',
      id: 'mat',
      label: '材質',
      value: 'glass',
      options: [
        { value: 'glass', label: 'ガラス（正面で 4%）' },
        { value: 'water', label: '水（2%）' },
        { value: 'plastic', label: 'プラスチック（5%）' },
        { value: 'diamond', label: 'ダイヤモンド（17%）' },
        { value: 'metal', label: '金属（90%）' },
      ],
    },
  ]);

  const readouts = createReadouts([
    { key: 'cos', label: 'cos（見る角度）', color: vecColor('normal') },
    { key: 'r', label: '映り込む割合', color: vecColor('result') },
    { key: 'through', label: '通り抜ける割合', color: vecColor('b') },
    { key: 'note', label: '正面と比べて' },
  ]);

  const tmp = new THREE.Vector3();
  const org = new THREE.Vector3();

  const update = (): void => {
    const deg = controls.num('angle');
    const rad = THREE.MathUtils.degToRad(deg);
    const f0 = F0[controls.str('mat')] ?? 0.04;
    const cos = Math.cos(rad);
    const R = schlick(f0, cos);

    /* 左の図 */
    const base = new THREE.Vector3(DIAG_X, GRAPH_Y0 + 0.4, 0);
    surface.set(
      tmp.set(DIAG_X - 1.7, base.y, 0),
      new THREE.Vector3(DIAG_X + 1.7, base.y, 0),
    );
    labelSurface.position.set(DIAG_X - 2.1, base.y, 0);

    normalArrow.set(tmp.set(0, 1.5, 0), base);

    // 見る向き（表面へ向かって入ってくる）
    const dx = Math.sin(rad);
    const dy = Math.cos(rad);
    viewArrow.set(tmp.set(dx * 2.2, -dy * 2.2, 0), base.clone().add(new THREE.Vector3(-dx * 2.2, dy * 2.2, 0)));
    // 映り込みは、入ってきた側とは反対の斜め上へ跳ね返る
    reflArrow.set(tmp.set(dx * (0.7 + R * 1.9), dy * (0.7 + R * 1.9), 0), base);
    // 残りは通り抜ける
    throughArrow.set(tmp.set(dx * (0.7 + (1 - R) * 1.9), -dy * (0.7 + (1 - R) * 1.9), 0), base);

    const reflLen = 0.7 + R * 1.9 + 0.45;
    labelRefl.position.set(DIAG_X + dx * reflLen, base.y + dy * reflLen, 0);
    labelThrough.position.set(DIAG_X + dx * 2.5, base.y - dy * 2.5, 0);

    /* 右の曲線 */
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i += 1) {
      const a = (i / 128) * 90;
      const v = schlick(f0, Math.cos(THREE.MathUtils.degToRad(a)));
      pts.push(
        new THREE.Vector3(GRAPH_X0 + (a / 90) * GRAPH_W, GRAPH_Y0 + v * GRAPH_H, 0.01),
      );
    }
    curve.set(pts);

    // いまの角度を縦線で、そのときの反射率を点で示す
    const mx = GRAPH_X0 + (deg / 90) * GRAPH_W;
    marker.set(org.set(mx, GRAPH_Y0, 0.02), tmp.set(mx, GRAPH_Y0 + GRAPH_H, 0.02));
    markerDot.position.set(mx, GRAPH_Y0 + R * GRAPH_H, 0.03);

    labelAxisX.position.set(GRAPH_X0 + GRAPH_W / 2, GRAPH_Y0 - 0.45, 0);
    labelAxisY.position.set(GRAPH_X0 - 0.75, GRAPH_Y0 + GRAPH_H, 0);

    readouts.set('cos', fmt(cos, 3));
    readouts.set('r', `${fmt(R * 100, 1)} %`);
    readouts.set('through', `${fmt((1 - R) * 100, 1)} %`);
    readouts.set('note', `正面では ${fmt(f0 * 100, 1)} %。いまは ${fmt(R / f0, 1)} 倍`);
  };

  controls.onChange(update);
  stage.onTheme(() => {
    axisMaterial.color.set(cssVar('--border-lit', '#3a3a5c'));
    gridMaterial.color.set(cssVar('--border', '#26263c'));
    surface.setColor(vecColor('guide'));
    normalArrow.setColor(vecColor('normal'));
    viewArrow.setColor(vecColor('a'));
    reflArrow.setColor(vecColor('result'));
    throughArrow.setColor(vecColor('b'));
    curve.setColor(vecColor('result'));
    marker.setColor(vecColor('normal'));
    (markerDot.material as THREE.MeshBasicMaterial).color.set(vecColor('normal'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '見る向き', color: vecColor('a') },
      { label: '映り込む分（矢印の長さが割合）', color: vecColor('result') },
      { label: '通り抜ける分', color: vecColor('b') },
      { label: '法線と表面', color: vecColor('normal') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
