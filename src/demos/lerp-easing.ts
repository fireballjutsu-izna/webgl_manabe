/** CH.08 補間とイージング — 同じ距離を同じ時間で動いても、緩急で印象がまるで変わる。 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import {
  addStudioLights,
  createPolyline,
  createSegment,
  fmt,
  solidMaterial,
  vecColor,
} from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

type Easing = (t: number) => number;

const EASINGS: Record<string, { label: string; fn: Easing }> = {
  linear: { label: '緩急なし（linear）', fn: (t) => t },
  inOut: {
    label: 'ゆっくり始まってゆっくり止まる（ease-in-out）',
    fn: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  },
  out: { label: '勢いよく出て静かに止まる（ease-out）', fn: (t) => 1 - (1 - t) ** 3 },
  in: { label: 'そろりと出て加速する（ease-in）', fn: (t) => t ** 3 },
  back: {
    label: '行き過ぎて戻る（back）',
    fn: (t) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2,
  },
};

const GRAPH_SAMPLES = 80;

export function mount(card: HTMLElement): DemoInstance {
  // 走路とグラフを縦に並べた「板」なので、正面から見る位置に構える
  const stage = createStage({
    camera: [0, 0.2, 7.6],
    target: [0, -0.7, 0],
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  addStudioLights(stage.scene);

  const START_X = -3.2;
  const END_X = 3.2;

  // 走路
  const track = createSegment(vecColor('guide'), true);
  track.set(new THREE.Vector3(START_X, 0, 0), new THREE.Vector3(END_X, 0, 0));
  stage.scene.add(track.object);

  const linearBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), solidMaterial(vecColor('b')));
  linearBox.position.set(START_X, 0.9, 0);
  const easedBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), solidMaterial(vecColor('result')));
  easedBox.position.set(START_X, 0.25, 0);
  stage.scene.add(linearBox, easedBox);

  const labelLinear = stage.addLabel('緩急なし', vecColor('b'));
  const labelEased = stage.addLabel('イージングあり', vecColor('result'));
  stage.scene.add(labelLinear, labelEased);

  // 手前にイージング曲線のグラフを描く（横が時間、縦が進み具合）
  const GRAPH_X = -1.75;
  const GRAPH_Y = -2.6;
  const GRAPH_W = 3.5;
  const GRAPH_H = 1.9;
  const graphFrame = createPolyline(vecColor('guide'), 5);
  graphFrame.set([
    new THREE.Vector3(GRAPH_X, GRAPH_Y, 0),
    new THREE.Vector3(GRAPH_X + GRAPH_W, GRAPH_Y, 0),
    new THREE.Vector3(GRAPH_X + GRAPH_W, GRAPH_Y + GRAPH_H, 0),
    new THREE.Vector3(GRAPH_X, GRAPH_Y + GRAPH_H, 0),
    new THREE.Vector3(GRAPH_X, GRAPH_Y, 0),
  ]);
  const graphLinear = createPolyline(vecColor('b'), 2, true);
  graphLinear.set([
    new THREE.Vector3(GRAPH_X, GRAPH_Y, 0),
    new THREE.Vector3(GRAPH_X + GRAPH_W, GRAPH_Y + GRAPH_H, 0),
  ]);
  const graphCurve = createPolyline(vecColor('result'), GRAPH_SAMPLES + 1);
  const graphMarker = createSegment(vecColor('normal'));
  stage.scene.add(graphFrame.object, graphLinear.object, graphCurve.object, graphMarker.object);

  const graphLabel = stage.addLabel('横＝時間　縦＝進み具合', vecColor('guide'));
  graphLabel.position.set(GRAPH_X + GRAPH_W / 2, GRAPH_Y - 0.3, 0);
  stage.scene.add(graphLabel);

  const controls = createControls([
    { kind: 'range', id: 't', label: '時間 t', min: 0, max: 1, step: 0.005, value: 0.3 },
    {
      kind: 'select',
      id: 'ease',
      label: 'イージング',
      value: 'inOut',
      options: Object.entries(EASINGS).map(([value, item]) => ({ value, label: item.label })),
    },
    { kind: 'check', id: 'auto', label: '自動で往復させる', value: true },
  ]);

  const readouts = createReadouts([
    { key: 't', label: 't（時間）', color: vecColor('b') },
    { key: 'e', label: 'イージング後の進み具合', color: vecColor('result') },
    { key: 'x', label: '位置 x', color: vecColor('normal') },
  ]);

  const curvePoints: THREE.Vector3[] = Array.from(
    { length: GRAPH_SAMPLES + 1 },
    () => new THREE.Vector3(),
  );

  let programmatic = false;
  let direction = 1;

  const redrawCurve = (): void => {
    const ease = EASINGS[controls.str('ease')]?.fn ?? EASINGS.linear!.fn;
    for (let i = 0; i <= GRAPH_SAMPLES; i += 1) {
      const t = i / GRAPH_SAMPLES;
      curvePoints[i]!.set(
        GRAPH_X + t * GRAPH_W,
        GRAPH_Y + THREE.MathUtils.clamp(ease(t), -0.25, 1.25) * GRAPH_H,
        0,
      );
    }
    graphCurve.set(curvePoints);
  };

  const update = (): void => {
    const t = controls.num('t');
    const ease = EASINGS[controls.str('ease')]?.fn ?? EASINGS.linear!.fn;
    const eased = ease(t);

    // どちらも同じ lerp。違うのは「渡す値をひとひねりするかどうか」だけ
    linearBox.position.x = THREE.MathUtils.lerp(START_X, END_X, t);
    easedBox.position.x = THREE.MathUtils.lerp(START_X, END_X, eased);

    // 箱に重ならないよう、片方は上、もう片方は走路の下に置く
    labelLinear.position.set(linearBox.position.x, 1.55, 0);
    labelEased.position.set(easedBox.position.x, -0.45, 0);

    graphMarker.set(
      new THREE.Vector3(GRAPH_X + t * GRAPH_W, GRAPH_Y, 0),
      new THREE.Vector3(GRAPH_X + t * GRAPH_W, GRAPH_Y + eased * GRAPH_H, 0),
    );

    readouts.set('t', fmt(t, 3));
    readouts.set('e', fmt(eased, 3));
    readouts.set('x', fmt(easedBox.position.x, 2));
  };

  controls.onChange((id) => {
    if (programmatic) return;
    if (id === 'ease') redrawCurve();
    if (id === 't' && controls.bool('auto')) {
      programmatic = true;
      controls.set('auto', false);
      programmatic = false;
    }
    update();
  });

  stage.onFrame((dt) => {
    if (!controls.bool('auto') || stage.reduceMotion) return;
    let t = controls.num('t') + direction * dt * 0.4;
    if (t > 1) {
      t = 1;
      direction = -1;
    } else if (t < 0) {
      t = 0;
      direction = 1;
    }
    programmatic = true;
    controls.set('t', t);
    programmatic = false;
    update();
  });

  stage.onTheme(() => {
    track.setColor(vecColor('guide'));
    graphFrame.setColor(vecColor('guide'));
    graphLinear.setColor(vecColor('b'));
    graphCurve.setColor(vecColor('result'));
    graphMarker.setColor(vecColor('normal'));
  });

  redrawCurve();
  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '緩急なしの箱と、その直線グラフ', color: vecColor('b'), dashed: true },
      { label: 'イージングをかけた箱と、その曲線', color: vecColor('result') },
      { label: 'いまの時間の位置', color: vecColor('normal') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
