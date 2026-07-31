/**
 * CH.2-26 透視投影 — 遠いものが小さくなるのは、奥行きで割っているから。
 *
 * 真上から見た図。カメラは原点にいて、上（画面の奥）を見ている。
 * 点とカメラを結んだ直線が、投影面のどこを横切るか ― それが写る位置になる。
 * 同じ横位置の点でも、奥にあるほど中央に寄るのが目で見える。
 */

import * as THREE from 'three';
import { createPoint, createPolyline, createSegment, fmt, vecColor } from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { cssVar } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const SPAN = 7;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 3.6, 14],
    target: [0, 3.6, 0],
    controls: false,
    labels: true,
  });

  /* ---- 方眼（横が x、上が奥行き） ---- */

  const gridPoints: THREE.Vector3[] = [];
  for (let n = -SPAN; n <= SPAN; n += 1) {
    gridPoints.push(new THREE.Vector3(n, 0, -0.02), new THREE.Vector3(n, SPAN + 2, -0.02));
  }
  for (let n = 0; n <= SPAN + 2; n += 1) {
    gridPoints.push(new THREE.Vector3(-SPAN, n, -0.02), new THREE.Vector3(SPAN, n, -0.02));
  }
  const gridMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(cssVar('--border', '#26263c')),
    fog: false,
  });
  stage.scene.add(
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPoints), gridMaterial),
  );

  // 視錐台の左右の縁
  const edgeL = createPolyline(vecColor('guide'), 4, true);
  const edgeR = createPolyline(vecColor('guide'), 4, true);
  stage.scene.add(edgeL.object, edgeR.object);

  // 投影面（ここに写る）
  const screen = createSegment(vecColor('normal'));
  stage.scene.add(screen.object);

  // カメラから点へ伸ばした直線
  const ray = createPolyline(vecColor('a'), 4, true);
  stage.scene.add(ray.object);

  const eye = createPoint(vecColor('normal'), 0.11);
  const worldDot = createPoint(vecColor('a'), 0.13);
  const screenDot = createPoint(vecColor('result'), 0.13);
  stage.scene.add(eye, worldDot, screenDot);

  // 比較用：同じ横位置で奥行きだけ違う点
  const ghostDot = createPoint(vecColor('guide'), 0.1);
  const ghostRay = createPolyline(vecColor('guide'), 4, true);
  const ghostScreen = createPoint(vecColor('guide'), 0.1);
  stage.scene.add(ghostDot, ghostRay.object, ghostScreen);

  const labelEye = stage.addLabel('カメラ', vecColor('normal'));
  const labelScreen = stage.addLabel('投影面', vecColor('normal'));
  const labelP = stage.addLabel('点', vecColor('a'));
  const labelHit = stage.addLabel('写る位置', vecColor('result'));
  stage.scene.add(labelEye, labelScreen, labelP, labelHit);

  const controls = createControls([
    { kind: 'range', id: 'px', label: '点の横位置 x', min: -5, max: 5, step: 0.25, value: 2 },
    { kind: 'range', id: 'pz', label: '点の奥行き（カメラからの距離）', min: 1, max: 6.5, step: 0.25, value: 4 },
    {
      kind: 'range',
      id: 'fov',
      label: '画角 FOV',
      min: 20,
      max: 110,
      step: 1,
      value: 60,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'check', id: 'ghost', label: '同じ横位置で、2 倍奥にある点も出す', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'd', label: '投影面までの距離', color: vecColor('normal') },
    { key: 'divide', label: '横位置 ÷ 奥行き', color: vecColor('result') },
    { key: 'ndc', label: '画面での位置（−1 〜 +1）', color: vecColor('result') },
    { key: 'ghost', label: '2 倍奥の点の、画面での位置', color: vecColor('guide') },
  ]);

  const update = (): void => {
    const px = controls.num('px');
    const pz = controls.num('pz');
    const half = THREE.MathUtils.degToRad(controls.num('fov')) / 2;

    // 投影面は「画面の端がちょうど x = ±1 になる」距離に置く
    const d = 1 / Math.tan(half);

    const edgeLen = SPAN + 2;
    const ex = Math.tan(half) * edgeLen;
    edgeL.set([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-ex, edgeLen, 0)]);
    edgeR.set([new THREE.Vector3(0, 0, 0), new THREE.Vector3(ex, edgeLen, 0)]);

    const sx = Math.tan(half) * d; // ＝ 1
    screen.set(new THREE.Vector3(-sx, d, 0.01), new THREE.Vector3(sx, d, 0.01));
    labelScreen.position.set(-sx - 0.9, d, 0);

    // ここが透視投影の全部：横位置を奥行きで割り、画角の倍率を掛ける
    const ratio = px / pz;
    const ndc = ratio / Math.tan(half);
    // 投影面は「端がちょうど ±1」の距離に置いてあるので、当たる位置がそのまま NDC になる
    const hitX = ndc;

    worldDot.position.set(px, pz, 0.02);
    screenDot.position.set(hitX, d, 0.03);
    eye.position.set(0, 0, 0.02);

    ray.set([new THREE.Vector3(0, 0, 0.01), new THREE.Vector3(px * 1.35, pz * 1.35, 0.01)]);

    labelEye.position.set(0, -0.5, 0);
    labelP.position.set(px, pz + 0.45, 0);
    labelHit.position.set(hitX, d - 0.5, 0);

    const showGhost = controls.bool('ghost');
    ghostDot.visible = showGhost;
    ghostScreen.visible = showGhost;
    ghostRay.object.visible = showGhost;
    const gz = pz * 2;
    const gndc = px / gz / Math.tan(half);
    if (showGhost) {
      ghostDot.position.set(px, gz, 0.02);
      ghostScreen.position.set(gndc, d, 0.03);
      ghostRay.set([new THREE.Vector3(0, 0, 0.005), new THREE.Vector3(px * 1.1, gz * 1.1, 0.005)]);
    }

    readouts.set('d', fmt(d, 3));
    readouts.set('divide', `${fmt(px, 2)} ÷ ${fmt(pz, 2)} = ${fmt(ratio, 3)}`);
    readouts.set(
      'ndc',
      `${fmt(ratio, 3)} ÷ ${fmt(Math.tan(half), 3)} = ${fmt(ndc, 3)}` +
        (Math.abs(ndc) > 1 ? '（画面の外）' : ''),
    );
    readouts.set('ghost', showGhost ? `${fmt(gndc, 3)}（ちょうど半分）` : '—');
  };

  controls.onChange(update);
  stage.onTheme(() => {
    gridMaterial.color.set(cssVar('--border', '#26263c'));
    edgeL.setColor(vecColor('guide'));
    edgeR.setColor(vecColor('guide'));
    screen.setColor(vecColor('normal'));
    ray.setColor(vecColor('a'));
    ghostRay.setColor(vecColor('guide'));
    (eye.material as THREE.MeshBasicMaterial).color.set(vecColor('normal'));
    (worldDot.material as THREE.MeshBasicMaterial).color.set(vecColor('a'));
    (screenDot.material as THREE.MeshBasicMaterial).color.set(vecColor('result'));
    (ghostDot.material as THREE.MeshBasicMaterial).color.set(vecColor('guide'));
    (ghostScreen.material as THREE.MeshBasicMaterial).color.set(vecColor('guide'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'カメラと投影面', color: vecColor('normal') },
      { label: '世界にある点', color: vecColor('a') },
      { label: '投影面に写る位置', color: vecColor('result') },
      { label: '視錐台の縁と、2 倍奥の点', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
