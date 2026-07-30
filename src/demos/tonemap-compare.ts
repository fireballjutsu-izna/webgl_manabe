/**
 * CH.4-02 色の通り道 — 同じシーンを、2 つのトーンマッピングで左右に並べて見比べる。
 *
 * トーンマッピングはレンダラ単位の設定なので、同時には描けない。
 * 1 フレームのあいだに設定を変えながら 2 回描き、画面を左右に分ける。
 * 5 つ全部を同時に並べないのは、区画が縦長になりすぎて被写体が入らないため。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { fmt, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { el } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const MODES: Record<string, { name: string; value: THREE.ToneMapping }> = {
  none: { name: 'なし', value: THREE.NoToneMapping },
  linear: { name: 'Linear', value: THREE.LinearToneMapping },
  cineon: { name: 'Cineon', value: THREE.CineonToneMapping },
  aces: { name: 'ACES Filmic', value: THREE.ACESFilmicToneMapping },
  neutral: { name: 'Neutral', value: THREE.NeutralToneMapping },
};

const OPTIONS = Object.entries(MODES).map(([value, mode]) => ({ value, label: mode.name }));

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 0.35, 4.6],
    target: [0, 0.1, 0],
    controls: false,
    hint: '左右とも同じシーン・同じ光',
  });

  // 1 を大きく超える明るさを作らないと、トーンマッピングの差は出ない
  const key = new THREE.DirectionalLight(0xfff0dd, 9.6);
  key.position.set(3, 3, 4);
  stage.scene.add(key, new THREE.AmbientLight(0x334466, 0.5));

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0xd94f4f, roughness: 0.3, metalness: 0 }),
  );
  sphere.position.set(-0.35, 0.05, 0);
  stage.scene.add(sphere);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 20),
    // 1 をはるかに超える色。ここが「はみ出した明るさ」の源
    new THREE.MeshBasicMaterial({ color: new THREE.Color(7, 6, 3.8) }),
  );
  lamp.position.set(0.75, 0.8, 0.5);
  stage.scene.add(lamp);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x8d93a3, roughness: 0.85 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.85;
  stage.scene.add(floor);

  const controls = createControls([
    { kind: 'select', id: 'left', label: '左に出すもの', value: 'none', options: OPTIONS },
    { kind: 'select', id: 'right', label: '右に出すもの', value: 'aces', options: OPTIONS },
    { kind: 'range', id: 'exposure', label: '露出 toneMappingExposure', min: 0.1, max: 3, step: 0.05, value: 1 },
    { kind: 'range', id: 'light', label: '光の強さ', min: 0, max: 14, step: 0.2, value: 9.6 },
  ]);

  const readouts = createReadouts([
    { key: 'exposure', label: '露出', color: vecColor('a') },
    { key: 'note', label: '見どころ', color: vecColor('b') },
  ]);

  /* ---- 左右の見出しは画面座標で置く ---- */

  const strip = el('div', { class: 'demo__overlay', style: 'display:flex;' });
  const makeCaption = (): HTMLElement =>
    el('div', {
      style:
        'flex:1; text-align:center; padding-top:0.45rem;' +
        'font-family:var(--font-mono); font-size:0.66rem; letter-spacing:0.08em;' +
        'color:#f5f5ff; text-shadow:0 0 4px #000, 0 0 8px #000;',
    });
  const leftCaption = makeCaption();
  const rightCaption = makeCaption();
  strip.append(leftCaption, rightCaption);
  stage.element.appendChild(strip);

  const update = (): void => {
    key.intensity = controls.num('light');
    stage.renderer.toneMappingExposure = controls.num('exposure');
    leftCaption.textContent = MODES[controls.str('left')]!.name;
    rightCaption.textContent = MODES[controls.str('right')]!.name;

    readouts.set('exposure', fmt(controls.num('exposure')));
    readouts.set(
      'note',
      controls.num('light') > 9
        ? '球の明るい面まで白く潰れるかどうかを見る'
        : controls.num('light') < 2
          ? '暗いところでは差がほとんど出ない。光を強めてください'
          : '光源のまわりの階調と、床の明るさを見比べる',
    );
  };

  controls.onChange(update);
  update();

  const size = new THREE.Vector2();

  stage.onAfterRender(() => {
    const renderer = stage.renderer;
    const camera = stage.camera;
    renderer.getSize(size);
    const half = size.x / 2;
    const fullAspect = camera.aspect;

    // 区画の中に「シーン全体」を収めたいので、区画の縦横比でカメラを組み直す
    camera.aspect = half / size.y;
    camera.updateProjectionMatrix();

    renderer.setScissorTest(true);
    for (const [index, id] of [controls.str('left'), controls.str('right')].entries()) {
      renderer.setViewport(index * half, 0, half, size.y);
      renderer.setScissor(index * half, 0, half, size.y);
      renderer.toneMapping = MODES[id]!.value;
      renderer.render(stage.scene, camera);
    }
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, size.x, size.y);

    camera.aspect = fullAspect;
    camera.updateProjectionMatrix();
  });

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '「なし」と「ACES Filmic」から始めてください。光源のまわりで差が出ます', color: vecColor('normal') },
      { label: '露出は「カメラの絞り」、トーンマッピングは「その後の焼き方」です', color: vecColor('result') },
    ]),
  ]);

  return {
    dispose: () => {
      stage.renderer.setScissorTest(false);
      stage.dispose();
    },
  };
}
