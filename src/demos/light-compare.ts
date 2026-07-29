/** CH.2-05 ライトと影 — 種類を切り替えて、当たり方と影の出かたを見比べる。 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { fmt, solidMaterial, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

type LightKind = 'ambient' | 'hemisphere' | 'directional' | 'point' | 'spot';

const NOTES: Record<LightKind, string> = {
  ambient: '全体を一律に持ち上げるだけ。向きが無いので立体感は出ず、影も落ちない',
  hemisphere: '空の色と地面の色を上下から当てる。屋外の環境光として自然',
  directional: '太陽。位置ではなく向きだけが意味を持ち、平行な光が届く',
  point: '電球。位置があり、離れるほど暗くなる',
  spot: '懐中電灯。円錐状に照らし、外側は当たらない',
};

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [4.5, 3.6, 6],
    target: [0, 0.6, 0],
    labels: false,
    hint: 'ドラッグで視点を回転',
  });

  stage.renderer.shadowMap.enabled = true;
  stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 床と、影を落とすための立体
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), solidMaterial('#8b93a8', { roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  stage.scene.add(floor);

  const pieces: THREE.Mesh[] = [
    new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), solidMaterial('#7fb2ff', { roughness: 0.5 })),
    new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 20), solidMaterial('#ffd166', { roughness: 0.4 })),
    new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 24), solidMaterial('#ff7ad9', { roughness: 0.6 })),
  ];
  pieces[0]!.position.set(-1.7, 0.5, 0);
  pieces[1]!.position.set(0, 0.6, 0.6);
  pieces[2]!.position.set(1.7, 0.6, -0.4);
  for (const piece of pieces) {
    piece.castShadow = true;
    piece.receiveShadow = true;
    stage.scene.add(piece);
  }

  // 光源はすべて作っておき、選ばれたものだけ点ける
  const ambient = new THREE.AmbientLight(0xffffff, 1);
  const hemisphere = new THREE.HemisphereLight(0x9ad7ff, 0x2a2418, 1);
  const directional = new THREE.DirectionalLight(0xffffff, 1);
  const point = new THREE.PointLight(0xffffff, 1, 0, 2);
  const spot = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 7, 0.4, 2);

  for (const light of [directional, point, spot]) {
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
  }
  directional.shadow.camera.left = -6;
  directional.shadow.camera.right = 6;
  directional.shadow.camera.top = 6;
  directional.shadow.camera.bottom = -6;

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(vecColor('result')), fog: false }),
  );

  stage.scene.add(ambient, hemisphere, directional, point, spot, spot.target, marker);

  const lights: Record<LightKind, THREE.Light> = {
    ambient,
    hemisphere,
    directional,
    point,
    spot,
  };

  const controls = createControls([
    {
      kind: 'select',
      id: 'kind',
      label: 'ライトの種類',
      value: 'directional',
      options: [
        { value: 'ambient', label: 'AmbientLight（環境光）' },
        { value: 'hemisphere', label: 'HemisphereLight（空と地面）' },
        { value: 'directional', label: 'DirectionalLight（太陽）' },
        { value: 'point', label: 'PointLight（電球）' },
        { value: 'spot', label: 'SpotLight（懐中電灯）' },
      ],
    },
    { kind: 'range', id: 'intensity', label: '強さ', min: 0, max: 6, step: 0.1, value: 2.4 },
    {
      kind: 'range',
      id: 'angle',
      label: '光源の向き（水平）',
      min: 0,
      max: 360,
      step: 1,
      value: 40,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'range', id: 'height', label: '光源の高さ', min: 0.5, max: 8, step: 0.1, value: 4 },
    { kind: 'check', id: 'shadow', label: '影を落とす', value: true },
  ]);

  const readouts = createReadouts([
    { key: 'note', label: 'この光は', color: vecColor('result') },
    { key: 'shadow', label: '影', color: vecColor('normal') },
    { key: 'pos', label: '光源の高さ', color: vecColor('a') },
  ]);

  const update = (): void => {
    const kind = controls.str('kind') as LightKind;
    const intensity = controls.num('intensity');
    const angle = THREE.MathUtils.degToRad(controls.num('angle'));
    const height = controls.num('height');

    for (const [key, light] of Object.entries(lights)) {
      light.visible = key === kind;
      light.intensity = key === kind ? intensity : 0;
    }

    // 位置を持つ光源だけ動かす
    const x = Math.cos(angle) * 4.5;
    const z = Math.sin(angle) * 4.5;
    directional.position.set(x, height, z);
    point.position.set(x, height, z);
    spot.position.set(x, height, z);
    spot.target.position.set(0, 0, 0);
    spot.target.updateMatrixWorld();

    const positioned = kind === 'directional' || kind === 'point' || kind === 'spot';
    marker.visible = positioned;
    marker.position.set(x, height, z);

    const wantShadow = controls.bool('shadow') && positioned;
    directional.castShadow = wantShadow;
    point.castShadow = wantShadow;
    spot.castShadow = wantShadow;

    readouts.set('note', NOTES[kind]);
    readouts.set(
      'shadow',
      positioned
        ? wantShadow
          ? '落ちる'
          : '切ってあります'
        : '落ちない（向きを持たない光だから）',
    );
    readouts.set('pos', positioned ? fmt(height, 1) : '—');
  };

  controls.onChange(update);
  stage.onTheme(() => {
    (marker.material as THREE.MeshBasicMaterial).color.set(vecColor('result'));
  });

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([{ label: '光源の位置', color: vecColor('result') }]),
  ]);

  return { dispose: () => stage.dispose() };
}
