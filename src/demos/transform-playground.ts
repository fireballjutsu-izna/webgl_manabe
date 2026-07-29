/**
 * CH.06 行列と変換 — 移動・回転・拡大を動かしながら、4x4 行列の中身を見る。
 * 「順番を入れ替えると結果が変わる」ことを、2つの箱の比較で見せる。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { addStudioLights, fmt, solidMaterial, vecColor } from '../three/helpers.ts';
import { createControls, createLegend } from '../ui/controls.ts';
import { el } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [5, 4, 7],
    grid: 10,
    axes: 2,
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  addStudioLights(stage.scene);

  const geometry = new THREE.BoxGeometry(1, 1, 1);

  // 素の形（変換前）
  const ghost = new THREE.Mesh(
    geometry,
    solidMaterial(vecColor('guide'), { transparent: true, opacity: 0.25, wireframe: true }),
  );
  stage.scene.add(ghost);

  // 拡大 → 回転 → 移動 の順（Three.js の既定）
  const boxTRS = new THREE.Mesh(geometry, solidMaterial(vecColor('result')));
  boxTRS.matrixAutoUpdate = false;
  stage.scene.add(boxTRS);

  // 移動 → 回転 の順（順番を入れ替えた比較用）
  const boxSwapped = new THREE.Mesh(
    geometry,
    solidMaterial(vecColor('b'), { transparent: true, opacity: 0.55 }),
  );
  boxSwapped.matrixAutoUpdate = false;
  stage.scene.add(boxSwapped);

  const labelTRS = stage.addLabel('拡大→回転→移動', vecColor('result'));
  const labelSwapped = stage.addLabel('移動→回転', vecColor('b'));
  stage.scene.add(labelTRS, labelSwapped);

  const controls = createControls([
    { kind: 'range', id: 'tx', label: '移動 x', min: -3, max: 3, step: 0.1, value: 2 },
    { kind: 'range', id: 'ty', label: '移動 y', min: -3, max: 3, step: 0.1, value: 0.5 },
    {
      kind: 'range',
      id: 'ry',
      label: 'y 軸まわりの回転',
      min: -180,
      max: 180,
      step: 1,
      value: 40,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'range', id: 'sc', label: '拡大率', min: 0.2, max: 2.5, step: 0.05, value: 1 },
    { kind: 'check', id: 'swap', label: '順番を入れ替えた箱も表示', value: true },
    { kind: 'button', id: 'reset', label: 'もとに戻す' },
  ]);

  // 行列の 16 個の数を、そのまま 4x4 に並べて見せる
  const cells: HTMLElement[] = [];
  const matrixGrid = el('div', {
    style:
      'display:grid;grid-template-columns:repeat(4,1fr);gap:0.15rem 0.5rem;margin-top:0.9rem;padding-top:0.85rem;border-top:1px dashed var(--border);font-family:var(--font-mono);font-size:0.72rem;font-variant-numeric:tabular-nums;',
  });
  for (let i = 0; i < 16; i += 1) {
    const cell = el('span', { style: 'text-align:right;color:var(--text-muted)' }, '0.00');
    cells.push(cell);
    matrixGrid.appendChild(cell);
  }
  const matrixCaption = el(
    'p',
    { class: 'lede', style: 'margin-top:0.5rem;font-size:0.75rem' },
    'この 16 個の数が、移動・回転・拡大をまとめて 1 つにした 4x4 行列です。いちばん右の列に移動量が入っているのが見えます。',
  );

  const matrix = new THREE.Matrix4();
  const translation = new THREE.Matrix4();
  const rotation = new THREE.Matrix4();
  const scale = new THREE.Matrix4();
  const swapped = new THREE.Matrix4();

  const update = (): void => {
    const angle = THREE.MathUtils.degToRad(controls.num('ry'));
    translation.makeTranslation(controls.num('tx'), controls.num('ty'), 0);
    rotation.makeRotationY(angle);
    scale.makeScale(controls.num('sc'), controls.num('sc'), controls.num('sc'));

    // 右から順に適用される。つまり 拡大 → 回転 → 移動
    matrix.copy(translation).multiply(rotation).multiply(scale);
    boxTRS.matrix.copy(matrix);

    // こちらは 移動 → 回転（回転が最後なので、移動ごと振り回される）
    swapped.copy(rotation).multiply(translation).multiply(scale);
    boxSwapped.matrix.copy(swapped);

    const showSwap = controls.bool('swap');
    boxSwapped.visible = showSwap;
    labelSwapped.visible = showSwap;

    labelTRS.position.setFromMatrixPosition(matrix).add(new THREE.Vector3(0, 0.9, 0));
    labelSwapped.position.setFromMatrixPosition(swapped).add(new THREE.Vector3(0, 0.9, 0));

    // Matrix4.elements は列優先で並んでいるので、行優先に読み替えて表示する
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const value = matrix.elements[column * 4 + row]!;
        const cell = cells[row * 4 + column]!;
        cell.textContent = fmt(value, 2);
        cell.style.color =
          Math.abs(value) < 0.005 ? 'var(--text-muted)' : 'var(--neon-cyan)';
      }
    }
  };

  controls.onChange(update);
  controls.onClick((id) => {
    if (id !== 'reset') return;
    controls.set('tx', 2);
    controls.set('ty', 0.5);
    controls.set('ry', 40);
    controls.set('sc', 1);
  });
  stage.onTheme(() => {
    (boxTRS.material as THREE.MeshStandardMaterial).color.set(vecColor('result'));
    (boxSwapped.material as THREE.MeshStandardMaterial).color.set(vecColor('b'));
    (ghost.material as THREE.MeshStandardMaterial).color.set(vecColor('guide'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    matrixGrid,
    matrixCaption,
    createLegend([
      { label: '変換前（原点にある素の箱）', color: vecColor('guide'), dashed: true },
      { label: '拡大→回転→移動（Three.js の順番）', color: vecColor('result') },
      { label: '移動→回転（順番を入れ替えた場合）', color: vecColor('b') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
