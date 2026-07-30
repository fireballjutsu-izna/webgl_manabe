/** CH.2-03 マテリアル — 同じ形・同じ光で、材質だけを並べて見比べる。 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { fmt, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

interface Entry {
  name: string;
  note: string;
  material: THREE.Material;
}

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0, 1.2, 7.2],
    target: [0, 0.1, 0],
    labels: true,
    hint: 'ドラッグで視点を回転',
  });

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 5);
  const ambient = new THREE.AmbientLight(0xffffff, 0.12);
  stage.scene.add(key, ambient);

  const base = 0x7fb2ff;

  const entries: Entry[] = [
    {
      name: 'Basic',
      note: '光を無視する',
      material: new THREE.MeshBasicMaterial({ color: base }),
    },
    {
      name: 'Lambert',
      note: 'ざらついた面',
      material: new THREE.MeshLambertMaterial({ color: base }),
    },
    {
      name: 'Phong',
      note: 'てかりが乗る',
      material: new THREE.MeshPhongMaterial({ color: base, shininess: 60 }),
    },
    {
      name: 'Standard',
      note: '粗さと金属度',
      material: new THREE.MeshStandardMaterial({ color: base, roughness: 0.4, metalness: 0 }),
    },
    {
      name: 'Normal',
      note: '法線をそのまま色に',
      material: new THREE.MeshNormalMaterial(),
    },
  ];

  const geometry = new THREE.SphereGeometry(0.62, 40, 26);

  entries.forEach((entry, index) => {
    const mesh = new THREE.Mesh(geometry, entry.material);
    mesh.position.x = (index - (entries.length - 1) / 2) * 1.55;
    stage.scene.add(mesh);

    const label = stage.addLabel(entry.name, vecColor('normal'));
    label.position.set(mesh.position.x, 0.95, 0);
    stage.scene.add(label);

    const note = stage.addLabel(entry.note, vecColor('guide'));
    note.position.set(mesh.position.x, -0.95, 0);
    stage.scene.add(note);
  });

  const controls = createControls([
    { kind: 'range', id: 'rough', label: '粗さ roughness', min: 0, max: 1, step: 0.01, value: 0.4 },
    { kind: 'range', id: 'metal', label: '金属度 metalness', min: 0, max: 1, step: 0.01, value: 0 },
    { kind: 'range', id: 'light', label: '光の強さ', min: 0, max: 5, step: 0.1, value: 2.2 },
    { kind: 'check', id: 'wire', label: '三角形の骨組みを見る（wireframe）', value: false },
  ]);

  const readouts = createReadouts([
    { key: 'rough', label: 'roughness', color: vecColor('a') },
    { key: 'metal', label: 'metalness', color: vecColor('result') },
    { key: 'note', label: '見えかた', color: vecColor('b') },
  ]);

  const standard = entries[3]!.material as THREE.MeshStandardMaterial;

  const update = (): void => {
    const roughness = controls.num('rough');
    const metalness = controls.num('metal');
    standard.roughness = roughness;
    standard.metalness = metalness;
    key.intensity = controls.num('light');

    const wire = controls.bool('wire');
    for (const entry of entries) {
      // MeshNormalMaterial にも wireframe はある
      (entry.material as THREE.MeshBasicMaterial).wireframe = wire;
    }

    readouts.set('rough', fmt(roughness));
    readouts.set('metal', fmt(metalness));
    readouts.set(
      'note',
      metalness > 0.6
        ? '金属寄り。映り込むものが無いと暗くなる'
        : roughness < 0.15
          ? 'つるつる。ハイライトが小さく鋭い'
          : roughness > 0.85
            ? 'ざらざら。ハイライトが広がって消える'
            : 'ふつうの塗装面',
    );
  };

  controls.onChange(update);
  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '光の強さを 0 にすると Basic と Normal だけが残る', color: vecColor('normal') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
