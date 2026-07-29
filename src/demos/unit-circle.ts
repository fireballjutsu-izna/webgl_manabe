/** CH.05 三角関数 — 単位円をまわる点の「横位置＝コサイン、縦位置＝サイン」。 */

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
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const WAVE_LENGTH = 6.4;
const WAVE_SAMPLES = 220;

export function mount(card: HTMLElement): DemoInstance {
  // 単位円と波形は 2 次元のグラフとして読ませたいので、正面から見る位置に構える
  const stage = createStage({
    camera: [-2.3, 0, 7.2],
    target: [-2.3, 0, 0],
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  // 半径 1 の円（xy 平面）
  const circlePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 128; i += 1) {
    const t = (i / 128) * Math.PI * 2;
    circlePoints.push(new THREE.Vector3(Math.cos(t), Math.sin(t), 0));
  }
  const circle = createPolyline(vecColor('guide'), 129);
  circle.set(circlePoints);
  stage.scene.add(circle.object);

  const axisX = createSegment(vecColor('guide'));
  const axisY = createSegment(vecColor('guide'));
  axisX.set(new THREE.Vector3(-1.4, 0, 0), new THREE.Vector3(1.4, 0, 0));
  axisY.set(new THREE.Vector3(0, -1.4, 0), new THREE.Vector3(0, 1.4, 0));
  stage.scene.add(axisX.object, axisY.object);

  const radius = createSegment(vecColor('normal'));
  const cosLeg = createSegment(vecColor('a'));
  const sinLeg = createSegment(vecColor('b'));
  const dropX = createSegment(vecColor('guide'), true);
  const dropY = createSegment(vecColor('guide'), true);
  const dot = createPoint(vecColor('result'), 0.06);
  stage.scene.add(
    radius.object,
    cosLeg.object,
    sinLeg.object,
    dropX.object,
    dropY.object,
    dot,
  );

  // 円の左側に伸びる波形。時間を横軸にした sin / cos のグラフ
  const wave = createPolyline(vecColor('result'), WAVE_SAMPLES + 1);
  const waveBase = createSegment(vecColor('guide'));
  waveBase.set(new THREE.Vector3(-1.05, 0, 0), new THREE.Vector3(-1.05 - WAVE_LENGTH, 0, 0));
  const link = createSegment(vecColor('guide'), true);
  stage.scene.add(wave.object, waveBase.object, link.object);

  const labelCos = stage.addLabel('cosθ', vecColor('a'));
  const labelSin = stage.addLabel('sinθ', vecColor('b'));
  const labelP = stage.addLabel('P', vecColor('result'));
  stage.scene.add(labelCos, labelSin, labelP);

  const controls = createControls([
    {
      kind: 'range',
      id: 'deg',
      label: '角度 θ',
      min: 0,
      max: 720,
      step: 1,
      value: 50,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'select', id: 'wave', label: '波形として描くもの', value: 'sin', options: [
      { value: 'sin', label: 'sinθ（縦位置）' },
      { value: 'cos', label: 'cosθ（横位置）' },
    ] },
    { kind: 'check', id: 'auto', label: '自動でまわす', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'deg', label: 'θ', color: vecColor('normal') },
    { key: 'rad', label: 'ラジアン', color: vecColor('normal') },
    { key: 'cos', label: 'cosθ', color: vecColor('a') },
    { key: 'sin', label: 'sinθ', color: vecColor('b') },
  ]);

  const origin = new THREE.Vector3();
  const p = new THREE.Vector3();
  const wavePoints: THREE.Vector3[] = Array.from(
    { length: WAVE_SAMPLES + 1 },
    () => new THREE.Vector3(),
  );

  let degrees = 50;
  // 自動回転がスライダーを動かすとき、それを「利用者の操作」と誤認しないための目印
  let programmatic = false;

  const update = (): void => {
    const theta = THREE.MathUtils.degToRad(degrees);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    p.set(cos, sin, 0);

    radius.set(origin, p);
    dot.position.copy(p);
    cosLeg.set(origin, new THREE.Vector3(cos, 0, 0));
    sinLeg.set(new THREE.Vector3(cos, 0, 0), p);
    dropX.set(p, new THREE.Vector3(cos, 0, 0));
    dropY.set(p, new THREE.Vector3(0, sin, 0));

    labelP.position.copy(p).multiplyScalar(1.18);
    labelCos.position.set(cos / 2, -0.22, 0);
    labelSin.position.set(cos + 0.22, sin / 2, 0);

    // 現在の角度から過去にさかのぼる形で波形を描く
    const useSin = controls.str('wave') === 'sin';
    for (let i = 0; i <= WAVE_SAMPLES; i += 1) {
      const back = (i / WAVE_SAMPLES) * Math.PI * 4; // 2周ぶん
      const value = useSin ? Math.sin(theta - back) : Math.cos(theta - back);
      wavePoints[i]!.set(-1.05 - (i / WAVE_SAMPLES) * WAVE_LENGTH, value, 0);
    }
    wave.set(wavePoints);
    link.set(p, wavePoints[0]!);

    readouts.set('deg', `${degrees.toFixed(0)}°`);
    readouts.set('rad', fmt(theta, 3));
    readouts.set('cos', fmt(cos, 3));
    readouts.set('sin', fmt(sin, 3));
  };

  controls.onChange((id) => {
    if (programmatic) return;
    if (id === 'deg') {
      degrees = controls.num('deg');
      // 手で動かしたら自動回転は止める
      if (controls.bool('auto')) {
        programmatic = true;
        controls.set('auto', false);
        programmatic = false;
      }
    }
    update();
  });

  stage.onFrame((dt) => {
    if (!controls.bool('auto') || stage.reduceMotion) return;
    degrees = (degrees + dt * 45) % 720;
    programmatic = true;
    controls.set('deg', Math.round(degrees));
    programmatic = false;
    update();
  });

  stage.onTheme(() => {
    circle.setColor(vecColor('guide'));
    radius.setColor(vecColor('normal'));
    cosLeg.setColor(vecColor('a'));
    sinLeg.setColor(vecColor('b'));
    wave.setColor(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '半径（長さ 1）', color: vecColor('normal') },
      { label: 'cosθ ＝ 横位置', color: vecColor('a') },
      { label: 'sinθ ＝ 縦位置', color: vecColor('b') },
      { label: '波形', color: vecColor('result') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
