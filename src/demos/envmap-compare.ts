/**
 * CH.4-01 環境マップ — 「金属が黒い」の正体を、環境を切り替えて見せる。
 *
 * 環境は 2 通りとも素材なしで作る。addons の RoomEnvironment（部屋）と、
 * ここで手続き的に組んだ空。どちらも PMREMGenerator で映り込み用に焼き直す。
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createStage } from '../three/stage.ts';
import { fmt, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { cssVar } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

/** グラデーションの空と太陽だけの、映り込ませるためのシーン。 */
function createSkyScene(): { scene: THREE.Scene; dispose(): void } {
  const scene = new THREE.Scene();

  const domeGeometry = new THREE.SphereGeometry(50, 32, 24);
  const domeMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: [
      'varying vec3 vPos;',
      'void main() {',
      '  vPos = position;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}',
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vPos;',
      'void main() {',
      '  float h = normalize(vPos).y;',
      // 地平線をはっきり出す。のっぺりした空では、映り込んでも金属に見えない
      '  vec3 c = mix(vec3(0.16, 0.13, 0.11), vec3(0.78, 0.70, 0.58), smoothstep(-0.05, 0.0, h));',
      '  c = mix(c, vec3(0.20, 0.40, 0.85), smoothstep(0.0, 0.22, h));',
      '  gl_FragColor = vec4(c * 1.35, 1.0);',
      '}',
    ].join('\n'),
  });
  const dome = new THREE.Mesh(domeGeometry, domeMaterial);
  scene.add(dome);

  const sunGeometry = new THREE.SphereGeometry(5, 20, 14);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(20, 24, -14);
  scene.add(sun);

  return {
    scene,
    dispose: () => {
      domeGeometry.dispose();
      domeMaterial.dispose();
      sunGeometry.dispose();
      sunMaterial.dispose();
    },
  };
}

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 0.6, 5.4],
    target: [0, 0, 0],
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  // 環境マップだけで十分明るくなるので、ライトは補助にとどめる
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(3, 4, 5);
  stage.scene.add(key);

  /* ---- 環境マップを 2 つ焼く ---- */

  const pmrem = new THREE.PMREMGenerator(stage.renderer);

  const room = pmrem.fromScene(new RoomEnvironment(), 0.04);
  const sky = createSkyScene();
  const skyTarget = pmrem.fromScene(sky.scene, 0.02);

  /* ---- 見比べる 3 つ ---- */

  const geometry = new THREE.SphereGeometry(0.82, 48, 32);

  const metal = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.15,
  });
  const painted = new THREE.MeshStandardMaterial({
    color: 0x7fb2ff,
    metalness: 0,
    roughness: 0.35,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.05,
    transmission: 1,
    thickness: 0.9,
    ior: 1.5,
  });

  const entries: { name: string; note: string; material: THREE.MeshStandardMaterial }[] = [
    { name: '金属', note: 'metalness 1', material: metal },
    { name: '塗装', note: 'metalness 0', material: painted },
    { name: 'ガラス', note: 'transmission 1', material: glass },
  ];

  // このデモだけは背景が明るくなることがあるので、ラベルに暗い下地を敷いて
  // どちらの背景でも読めるようにする
  const chip = (label: { element: HTMLElement }): void => {
    label.element.style.background = 'rgba(8, 8, 16, 0.72)';
    label.element.style.padding = '1px 7px';
    label.element.style.borderRadius = '4px';
  };

  entries.forEach((entry, index) => {
    const mesh = new THREE.Mesh(geometry, entry.material);
    mesh.position.x = (index - 1) * 2;
    stage.scene.add(mesh);

    const label = stage.addLabel(entry.name, vecColor('normal'));
    label.position.set(mesh.position.x, 1.25, 0);
    chip(label);
    stage.scene.add(label);

    const note = stage.addLabel(entry.note, vecColor('normal'));
    note.position.set(mesh.position.x, -1.25, 0);
    chip(note);
    stage.scene.add(note);
  });

  const controls = createControls([
    {
      kind: 'select',
      id: 'env',
      label: '映り込ませるもの',
      value: 'room',
      options: [
        { value: 'none', label: 'なし（2-03 の状態）' },
        { value: 'room', label: '部屋（RoomEnvironment）' },
        { value: 'sky', label: '空（自分で組んだもの）' },
      ],
    },
    { kind: 'range', id: 'intensity', label: '映り込みの強さ envMapIntensity', min: 0, max: 3, step: 0.05, value: 1 },
    { kind: 'range', id: 'rough', label: '粗さ roughness', min: 0, max: 1, step: 0.01, value: 0.15 },
    { kind: 'check', id: 'bg', label: '背景にも同じものを出す', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'env', label: '環境', color: vecColor('a') },
    { key: 'intensity', label: 'envMapIntensity', color: vecColor('result') },
    { key: 'note', label: '見えかた', color: vecColor('b') },
  ]);

  const environmentOf = (id: string): THREE.Texture | null => {
    if (id === 'room') return room.texture;
    if (id === 'sky') return skyTarget.texture;
    return null;
  };

  const update = (): void => {
    const id = controls.str('env');
    const texture = environmentOf(id);
    const intensity = controls.num('intensity');
    const roughness = controls.num('rough');

    stage.scene.environment = texture;
    stage.scene.background = controls.bool('bg') && texture
      ? texture
      : new THREE.Color(cssVar('--bg', '#0a0a12'));

    for (const entry of entries) {
      entry.material.envMapIntensity = intensity;
      entry.material.roughness = entry.material === glass ? Math.min(roughness, 0.4) : roughness;
    }

    readouts.set(
      'env',
      id === 'none' ? 'なし' : id === 'room' ? '部屋' : '自分で組んだ空',
    );
    readouts.set('intensity', fmt(intensity));
    readouts.set(
      'note',
      id === 'none'
        ? '金属もガラスも真っ黒。映すものが無いので当然です'
        : roughness < 0.1
          ? 'つるつる。環境がくっきり映り込む'
          : roughness > 0.7
            ? 'ざらざら。映り込みがぼやけて、色だけが残る'
            : 'ふつうの金属らしい見えかた',
    );
  };

  controls.onChange(update);
  stage.onTheme(update); // テーマが変わると Stage が背景を塗り直すので、選択を戻す
  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '「なし」にすると、2-03 で言っていた「金属がただ暗くなる」状態になります', color: vecColor('a') },
      { label: 'ガラスは「後ろにあるもの」を透かします。背景を出すと初めてガラスらしくなります', color: vecColor('result') },
    ]),
  ]);

  return {
    dispose: () => {
      stage.dispose();
      geometry.dispose();
      for (const entry of entries) entry.material.dispose();
      room.dispose();
      skyTarget.dispose();
      sky.dispose();
      pmrem.dispose();
    },
  };
}
