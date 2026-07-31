/**
 * CH.2-08 法線行列 — 非一様に拡大すると、法線を同じ行列で変換してはいけなくなる。
 *
 * 面を横に伸ばすと、面の傾きは「寝る」方向に変わるのに、
 * 法線を同じ行列で変換すると「立つ」方向に変わってしまう。
 * 面と法線の内積を読み出しに出しておけば、0 から外れるのが数字で見える。
 */

import * as THREE from 'three';
import { createArrow, createSegment, fmt, vecColor } from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { cssVar } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const SPAN = 4;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 0, 9],
    controls: false,
    labels: true,
  });

  const gridPoints: THREE.Vector3[] = [];
  for (let n = -SPAN; n <= SPAN; n += 1) {
    gridPoints.push(new THREE.Vector3(n, -SPAN, -0.01), new THREE.Vector3(n, SPAN, -0.01));
    gridPoints.push(new THREE.Vector3(-SPAN, n, -0.01), new THREE.Vector3(SPAN, n, -0.01));
  }
  const gridMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(cssVar('--border', '#26263c')),
    fog: false,
  });
  stage.scene.add(
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPoints), gridMaterial),
  );

  // 変換前の面と法線（破線の目印）
  const faceBefore = createSegment(vecColor('guide'), true);
  const normalBefore = createArrow(vecColor('guide'), { radius: 0.02, headRadius: 0.06 });
  stage.scene.add(faceBefore.object, normalBefore.object);

  // 変換後の面
  const faceAfter = createSegment(vecColor('a'));
  stage.scene.add(faceAfter.object);

  // 法線を 2 通りに変換したもの
  const wrong = createArrow(vecColor('negative'), { radius: 0.035, headRadius: 0.1 });
  const right = createArrow(vecColor('normal'), { radius: 0.035, headRadius: 0.1 });
  stage.scene.add(wrong.object, right.object);

  const labelWrong = stage.addLabel('同じ行列で変換（誤り）', vecColor('negative'));
  const labelRight = stage.addLabel('法線行列で変換（正しい）', vecColor('normal'));
  stage.scene.add(labelWrong, labelRight);

  const controls = createControls([
    { kind: 'range', id: 'angle', label: '面の傾き（度）', min: 0, max: 80, step: 1, value: 30 },
    { kind: 'range', id: 'sx', label: '横方向の拡大 sx', min: 0.3, max: 3, step: 0.1, value: 2.5 },
    { kind: 'range', id: 'sy', label: '縦方向の拡大 sy', min: 0.3, max: 3, step: 0.1, value: 1 },
  ]);

  const readouts = createReadouts([
    { key: 's', label: '拡大' },
    { key: 'wrong', label: '誤った法線と面の内積', color: vecColor('negative') },
    { key: 'right', label: '正しい法線と面の内積', color: vecColor('normal') },
    { key: 'note', label: '内積は 0 なら直交' },
  ]);

  const dir = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const dirAfter = new THREE.Vector3();
  const wrongN = new THREE.Vector3();
  const rightN = new THREE.Vector3();
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();

  const update = (): void => {
    const rad = THREE.MathUtils.degToRad(controls.num('angle'));
    const sx = controls.num('sx');
    const sy = controls.num('sy');

    // 変換前：面の向きと、それに垂直な法線
    dir.set(Math.cos(rad), Math.sin(rad), 0);
    nrm.set(-Math.sin(rad), Math.cos(rad), 0);

    faceBefore.set(from.copy(dir).multiplyScalar(-2.2), to.copy(dir).multiplyScalar(2.2));
    normalBefore.set(nrm.clone().multiplyScalar(1.4));

    // 変換後の面。頂点は拡大行列で運ばれる
    dirAfter.set(dir.x * sx, dir.y * sy, 0).normalize();
    faceAfter.set(
      from.copy(dirAfter).multiplyScalar(-2.6).setZ(0.01),
      to.copy(dirAfter).multiplyScalar(2.6).setZ(0.01),
    );

    // 誤り：法線にも同じ拡大を掛けてしまう
    wrongN.set(nrm.x * sx, nrm.y * sy, 0).normalize();
    // 正しい：逆行列の転置（対角行列なので、成分を割るだけ）
    rightN.set(nrm.x / sx, nrm.y / sy, 0).normalize();

    wrong.set(wrongN.clone().multiplyScalar(2));
    right.set(rightN.clone().multiplyScalar(2));
    labelWrong.position.copy(wrongN).multiplyScalar(2.35);
    labelRight.position.copy(rightN).multiplyScalar(2.35);

    readouts.set('s', `sx = ${fmt(sx, 1)} / sy = ${fmt(sy, 1)}`);
    readouts.set('wrong', fmt(dirAfter.dot(wrongN), 3));
    readouts.set('right', fmt(dirAfter.dot(rightN), 3));
    readouts.set(
      'note',
      Math.abs(sx - sy) < 1e-6
        ? '拡大が縦横で同じときは、どちらでも一致する'
        : '横と縦で拡大率が違うと、誤ったほうは 0 から外れる',
    );
  };

  controls.onChange(update);
  stage.onTheme(() => {
    gridMaterial.color.set(cssVar('--border', '#26263c'));
    faceBefore.setColor(vecColor('guide'));
    normalBefore.setColor(vecColor('guide'));
    faceAfter.setColor(vecColor('a'));
    wrong.setColor(vecColor('negative'));
    right.setColor(vecColor('normal'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '変換後の面', color: vecColor('a') },
      { label: '同じ行列で変換した法線（誤り）', color: vecColor('negative') },
      { label: '法線行列で変換した法線（正しい）', color: vecColor('normal') },
      { label: '変換前の面と法線', color: vecColor('guide'), dashed: true },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
