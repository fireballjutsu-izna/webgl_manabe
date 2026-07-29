/** CH.03 内積 — 角度を変えると内積の符号が変わる。0 になるのがちょうど直角。 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { createArc, createArrow, createSegment, fmt, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  // a と b は xy 平面に置くので、正面から見る位置にカメラを構える。
  // 床のグリッドは向きが直交していて紛らわしいので出さない。
  const stage = createStage({
    camera: [0.4, 1.2, 6.4],
    target: [0.4, 1.0, 0],
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  const arrowA = createArrow(vecColor('a'));
  const arrowB = createArrow(vecColor('b'));
  // b を a の向きに落とした影（＝内積の正体）
  const projection = createArrow(vecColor('result'), { radius: 0.036, headRadius: 0.09 });
  const drop = createSegment(vecColor('guide'), true);
  const arc = createArc(vecColor('normal'));

  stage.scene.add(arrowA.object, arrowB.object, projection.object, drop.object, arc.object);

  const labelA = stage.addLabel('a', vecColor('a'));
  const labelB = stage.addLabel('b', vecColor('b'));
  const labelAngle = stage.addLabel('θ', vecColor('normal'));
  const labelProj = stage.addLabel('b の影', vecColor('result'));
  stage.scene.add(labelA, labelB, labelAngle, labelProj);

  const controls = createControls([
    {
      kind: 'range',
      id: 'angle',
      label: 'a と b のなす角',
      min: 0,
      max: 180,
      step: 1,
      value: 55,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'range', id: 'la', label: 'a の長さ', min: 0.5, max: 3, step: 0.1, value: 2.2 },
    { kind: 'range', id: 'lb', label: 'b の長さ', min: 0.5, max: 3, step: 0.1, value: 1.8 },
    { kind: 'check', id: 'proj', label: 'b の「影」を表示', value: true },
    { kind: 'check', id: 'unit', label: '両方の長さを 1 に揃える', value: false },
  ]);

  const readouts = createReadouts([
    { key: 'dot', label: 'a·b', color: vecColor('result') },
    { key: 'cos', label: 'cosθ', color: vecColor('normal') },
    { key: 'deg', label: 'θ', color: vecColor('normal') },
    { key: 'rel', label: '位置関係', color: vecColor('result') },
  ]);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const unitA = new THREE.Vector3();
  const proj = new THREE.Vector3();

  const update = (): void => {
    const forceUnit = controls.bool('unit');
    const lengthA = forceUnit ? 1 : controls.num('la');
    const lengthB = forceUnit ? 1 : controls.num('lb');
    const theta = THREE.MathUtils.degToRad(controls.num('angle'));

    // a は x 軸に固定し、b を xy 平面上で角度 theta だけ開く
    a.set(lengthA, 0, 0);
    b.set(Math.cos(theta) * lengthB, Math.sin(theta) * lengthB, 0);

    arrowA.set(a);
    arrowB.set(b);

    const dot = a.dot(b);
    unitA.copy(a).normalize();
    proj.copy(unitA).multiplyScalar(dot / Math.max(a.length(), 1e-6));

    const showProjection = controls.bool('proj');
    projection.setVisible(showProjection && Math.abs(dot) > 1e-3);
    projection.set(proj);
    drop.setVisible(showProjection);
    drop.set(b, proj);

    arc.set(a, b, Math.min(lengthA, lengthB) * 0.45);

    labelA.position.copy(a).multiplyScalar(0.6).add(new THREE.Vector3(0, 0.22, 0));
    labelB.position.copy(b).multiplyScalar(0.6).add(new THREE.Vector3(0, 0.22, 0));
    labelAngle.position
      .copy(a)
      .normalize()
      .add(b.clone().normalize())
      .normalize()
      .multiplyScalar(Math.min(lengthA, lengthB) * 0.62);
    labelProj.position.copy(proj).add(new THREE.Vector3(0, -0.3, 0));
    labelProj.visible = showProjection && Math.abs(dot) > 1e-3;

    const cos = Math.cos(theta);
    readouts.set('dot', fmt(dot, 3));
    readouts.set('cos', fmt(cos, 3));
    readouts.set('deg', `${controls.num('angle').toFixed(0)}°`);
    readouts.set(
      'rel',
      Math.abs(dot) < 1e-3 ? '直角（そっぽを向いている）' : dot > 0 ? '同じ側を向いている' : '逆側を向いている',
    );
  };

  controls.onChange(update);
  stage.onTheme(() => {
    arrowA.setColor(vecColor('a'));
    arrowB.setColor(vecColor('b'));
    projection.setColor(vecColor('result'));
    drop.setColor(vecColor('guide'));
    arc.setColor(vecColor('normal'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'ベクトル a', color: vecColor('a') },
      { label: 'ベクトル b', color: vecColor('b') },
      { label: 'a の向きに落とした b の影', color: vecColor('result') },
      { label: '影を落とすための垂線', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
