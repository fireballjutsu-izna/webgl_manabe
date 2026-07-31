/**
 * CH.2-03 行列の列は「新しい軸」 — 行列を数の表ではなく、軸の移動先として見る。
 *
 * 2 本の基底ベクトルを動かすと、格子ごと変形する。
 * 「行列が何をしているか」を一度この形で見ておくと、
 * 掛ける順番も逆行列も行列式も、全部この絵の上で説明できるようになる。
 */

import * as THREE from 'three';
import { createArrow, createPolyline, createQuad, fmt, vecColor } from '../three/helpers.ts';
import { createStage } from '../three/stage.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { cssVar } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const SPAN = 4;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 0, 14],
    controls: false,
    labels: true,
  });

  /* ---- 変換前の格子（動かない目印） ---- */

  const basePoints: THREE.Vector3[] = [];
  for (let n = -SPAN; n <= SPAN; n += 1) {
    basePoints.push(new THREE.Vector3(n, -SPAN, -0.01), new THREE.Vector3(n, SPAN, -0.01));
    basePoints.push(new THREE.Vector3(-SPAN, n, -0.01), new THREE.Vector3(SPAN, n, -0.01));
  }
  const baseMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(cssVar('--border', '#26263c')),
    fog: false,
  });
  stage.scene.add(
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(basePoints), baseMaterial),
  );

  /* ---- 変換後の格子（i と j に合わせて曲がる） ---- */

  const gridGeometry = new THREE.BufferGeometry();
  const gridCount = (2 * SPAN + 1) * 4;
  gridGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(gridCount * 3), 3),
  );
  const gridMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(cssVar('--border-lit', '#3a3a5c')),
    fog: false,
  });
  const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
  grid.frustumCulled = false;
  stage.scene.add(grid);

  /* ---- 2 本の基底ベクトルと、それが張る面 ---- */

  const area = createQuad(vecColor('result'), 0.2);
  stage.scene.add(area.object);

  const arrowI = createArrow(vecColor('a'), { radius: 0.04, headRadius: 0.11 });
  const arrowJ = createArrow(vecColor('b'), { radius: 0.04, headRadius: 0.11 });
  stage.scene.add(arrowI.object, arrowJ.object);

  const labelI = stage.addLabel('i（x 軸の行き先）', vecColor('a'));
  const labelJ = stage.addLabel('j（y 軸の行き先）', vecColor('b'));
  stage.scene.add(labelI, labelJ);

  // 変換される 1 点。行列がこの点をどこへ運ぶかを見せる
  const before = createPolyline(vecColor('guide'), 4, true);
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 20, 14),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(vecColor('normal')), fog: false }),
  );
  stage.scene.add(before.object, dot);
  const labelP = stage.addLabel('p', vecColor('normal'));
  stage.scene.add(labelP);

  const controls = createControls([
    { kind: 'range', id: 'ix', label: 'i の x', min: -3, max: 3, step: 0.1, value: 1 },
    { kind: 'range', id: 'iy', label: 'i の y', min: -3, max: 3, step: 0.1, value: 0 },
    { kind: 'range', id: 'jx', label: 'j の x', min: -3, max: 3, step: 0.1, value: 0.6 },
    { kind: 'range', id: 'jy', label: 'j の y', min: -3, max: 3, step: 0.1, value: 1.4 },
    { kind: 'range', id: 'px', label: '点 p の x', min: -3, max: 3, step: 0.5, value: 2 },
    { kind: 'range', id: 'py', label: '点 p の y', min: -3, max: 3, step: 0.5, value: 1 },
  ]);

  const readouts = createReadouts([
    { key: 'm', label: '行列（列が i と j）' },
    { key: 'p', label: '変換前の p', color: vecColor('guide') },
    { key: 'out', label: '変換後の p', color: vecColor('normal') },
    { key: 'det', label: '面積の倍率（行列式）', color: vecColor('result') },
  ]);

  const i = new THREE.Vector3();
  const j = new THREE.Vector3();
  const out = new THREE.Vector3();
  const org = new THREE.Vector3();

  const update = (): void => {
    i.set(controls.num('ix'), controls.num('iy'), 0);
    j.set(controls.num('jx'), controls.num('jy'), 0);
    const px = controls.num('px');
    const py = controls.num('py');

    // 変換後の格子。もとの格子点 (m, n) は m*i + n*j へ移る
    const attr = gridGeometry.getAttribute('position') as THREE.BufferAttribute;
    let k = 0;
    const put = (a: number, b: number): void => {
      attr.setXYZ(k, i.x * a + j.x * b, i.y * a + j.y * b, 0);
      k += 1;
    };
    for (let n = -SPAN; n <= SPAN; n += 1) {
      put(n, -SPAN);
      put(n, SPAN);
      put(-SPAN, n);
      put(SPAN, n);
    }
    attr.needsUpdate = true;
    gridGeometry.setDrawRange(0, k);
    gridGeometry.computeBoundingSphere();

    arrowI.set(i);
    arrowJ.set(j);
    arrowI.setVisible(i.lengthSq() > 1e-8);
    arrowJ.setVisible(j.lengthSq() > 1e-8);
    labelI.position.copy(i).multiplyScalar(0.6).add(new THREE.Vector3(0, -0.4, 0));
    labelJ.position.copy(j).multiplyScalar(0.6).add(new THREE.Vector3(0, 0.4, 0));

    area.set(i, j, org.set(0, 0, 0));

    // 点 p の行き先。x 成分は i の本数、y 成分は j の本数
    out.set(i.x * px + j.x * py, i.y * px + j.y * py, 0.02);
    dot.position.copy(out);
    labelP.position.copy(out).add(new THREE.Vector3(0, 0.4, 0));
    before.set([
      new THREE.Vector3(px, py, 0.01),
      new THREE.Vector3(out.x, out.y, 0.01),
    ]);

    const det = i.x * j.y - i.y * j.x;

    readouts.set('m', `[ ${fmt(i.x, 1)}  ${fmt(j.x, 1)} ; ${fmt(i.y, 1)}  ${fmt(j.y, 1)} ]`);
    readouts.set('p', `(${fmt(px, 1)}, ${fmt(py, 1)})`);
    readouts.set('out', `${fmt(px, 1)}·i + ${fmt(py, 1)}·j = (${fmt(out.x, 2)}, ${fmt(out.y, 2)})`);
    readouts.set(
      'det',
      Math.abs(det) < 1e-6
        ? '0（面がつぶれた。もとに戻せない）'
        : `${fmt(det, 2)}${det < 0 ? '（裏返っている）' : ''}`,
    );
  };

  controls.onChange(update);
  stage.onTheme(() => {
    baseMaterial.color.set(cssVar('--border', '#26263c'));
    gridMaterial.color.set(cssVar('--border-lit', '#3a3a5c'));
    arrowI.setColor(vecColor('a'));
    arrowJ.setColor(vecColor('b'));
    area.setColor(vecColor('result'));
    before.setColor(vecColor('guide'));
    (dot.material as THREE.MeshBasicMaterial).color.set(vecColor('normal'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: 'i ― もとの x 軸が行く先（行列の 1 列目）', color: vecColor('a') },
      { label: 'j ― もとの y 軸が行く先（行列の 2 列目）', color: vecColor('b') },
      { label: 'i と j が張る面（面積が行列式）', color: vecColor('result') },
      { label: '点 p が運ばれた先', color: vecColor('normal') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
