/**
 * CH.12 曲線とパス — 制御点をドラッグして曲線を変え、その上を球に走らせる。
 * ドラッグは xz 平面（床）へのレイキャストで行う。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import {
  addStudioLights,
  createArrow,
  createPoint,
  createPolyline,
  fmt,
  solidMaterial,
  vecColor,
} from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

const SAMPLES = 220;

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [0.5, 7.5, 8],
    target: [0, 0, 0],
    grid: 12,
    labels: true,
    hint: '白い点をドラッグして形を変えられます',
  });

  addStudioLights(stage.scene);

  const points = [
    new THREE.Vector3(-4, 0, 2.5),
    new THREE.Vector3(-1.5, 0, -3),
    new THREE.Vector3(1.5, 0, 3),
    new THREE.Vector3(4, 0, -2),
  ];

  const handles = points.map((point) => {
    const mesh = createPoint(vecColor('normal'), 0.18);
    mesh.position.copy(point);
    stage.scene.add(mesh);
    return mesh;
  });

  const hull = createPolyline(vecColor('guide'), 8, true);
  const curveLine = createPolyline(vecColor('result'), SAMPLES + 1);
  stage.scene.add(hull.object, curveLine.object);

  const runner = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), solidMaterial(vecColor('a')));
  stage.scene.add(runner);
  const tangent = createArrow(vecColor('b'), { radius: 0.02 });
  stage.scene.add(tangent.object);

  const labelRunner = stage.addLabel('パスを走る球', vecColor('a'));
  stage.scene.add(labelRunner);

  const controls = createControls([
    { kind: 'select', id: 'kind', label: '曲線の種類', value: 'catmull', options: [
      { value: 'catmull', label: 'Catmull-Rom（すべての点を通る）' },
      { value: 'bezier', label: '3次ベジェ（両端だけ通る）' },
    ] },
    { kind: 'range', id: 't', label: 'パス上の位置 t', min: 0, max: 1, step: 0.002, value: 0.2 },
    { kind: 'check', id: 'auto', label: '自動で走らせる', value: true },
    { kind: 'check', id: 'hull', label: '制御点を結ぶ線を表示', value: true },
    { kind: 'check', id: 'closed', label: '端をつないで輪にする（Catmull-Rom のみ）', value: false },
    { kind: 'button', id: 'reset', label: '制御点をもとに戻す' },
  ]);

  const readouts = createReadouts([
    { key: 't', label: 't', color: vecColor('result') },
    { key: 'pos', label: '球の位置', color: vecColor('a') },
    { key: 'len', label: '曲線のおおよその長さ', color: vecColor('normal') },
  ]);

  let curve: THREE.Curve<THREE.Vector3> = new THREE.CatmullRomCurve3(points);
  const samples: THREE.Vector3[] = Array.from({ length: SAMPLES + 1 }, () => new THREE.Vector3());

  const rebuild = (): void => {
    if (controls.str('kind') === 'bezier') {
      curve = new THREE.CubicBezierCurve3(points[0]!, points[1]!, points[2]!, points[3]!);
    } else {
      const spline = new THREE.CatmullRomCurve3(points);
      spline.closed = controls.bool('closed');
      curve = spline;
    }

    for (let i = 0; i <= SAMPLES; i += 1) curve.getPoint(i / SAMPLES, samples[i]!);
    curveLine.set(samples);

    hull.object.visible = controls.bool('hull');
    hull.set(points);

    readouts.set('len', fmt(curve.getLength(), 2));
  };

  const place = (): void => {
    const t = THREE.MathUtils.clamp(controls.num('t'), 0, 1);
    const position = curve.getPoint(t);
    runner.position.copy(position).setY(0.22);
    labelRunner.position.copy(runner.position).add(new THREE.Vector3(0, 0.5, 0));

    const direction = curve.getTangent(t).normalize();
    tangent.set(direction.multiplyScalar(1.1), runner.position);

    readouts.set('t', fmt(t, 3));
    readouts.set('pos', `(${fmt(position.x, 1)}, ${fmt(position.z, 1)})`);
  };

  /* ---- 制御点のドラッグ ---- */

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  let dragging: THREE.Mesh | null = null;

  const canvas = stage.renderer.domElement;

  const toPointer = (event: PointerEvent): void => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  const onPointerDown = (event: PointerEvent): void => {
    toPointer(event);
    raycaster.setFromCamera(pointer, stage.camera);
    const intersects = raycaster.intersectObjects(handles, false);
    const first = intersects[0];
    if (!first) return;
    dragging = first.object as THREE.Mesh;
    // ドラッグ中は視点回転を止める
    if (stage.controls) stage.controls.enabled = false;
    canvas.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!dragging) return;
    toPointer(event);
    raycaster.setFromCamera(pointer, stage.camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return;
    hit.x = THREE.MathUtils.clamp(hit.x, -5.5, 5.5);
    hit.z = THREE.MathUtils.clamp(hit.z, -5.5, 5.5);
    dragging.position.set(hit.x, 0, hit.z);
    const index = handles.indexOf(dragging);
    if (index >= 0) points[index]!.copy(dragging.position);
    rebuild();
    place();
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (!dragging) return;
    dragging = null;
    if (stage.controls) stage.controls.enabled = true;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  /* ---- 更新 ---- */

  let programmatic = false;

  controls.onChange((id) => {
    if (programmatic) return;
    if (id === 't' && controls.bool('auto')) {
      programmatic = true;
      controls.set('auto', false);
      programmatic = false;
    }
    if (id === 'kind' || id === 'hull' || id === 'closed') rebuild();
    place();
  });

  controls.onClick((id) => {
    if (id !== 'reset') return;
    const defaults = [
      new THREE.Vector3(-4, 0, 2.5),
      new THREE.Vector3(-1.5, 0, -3),
      new THREE.Vector3(1.5, 0, 3),
      new THREE.Vector3(4, 0, -2),
    ];
    for (const [index, point] of points.entries()) {
      point.copy(defaults[index]!);
      handles[index]!.position.copy(point);
    }
    rebuild();
    place();
  });

  stage.onFrame((dt) => {
    if (!controls.bool('auto') || stage.reduceMotion) return;
    programmatic = true;
    controls.set('t', (controls.num('t') + dt * 0.12) % 1);
    programmatic = false;
    place();
  });

  stage.onTheme(() => {
    curveLine.setColor(vecColor('result'));
    hull.setColor(vecColor('guide'));
    tangent.setColor(vecColor('b'));
    for (const handle of handles) {
      (handle.material as THREE.MeshBasicMaterial).color.set(vecColor('normal'));
    }
  });

  rebuild();
  place();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '制御点（ドラッグできます）', color: vecColor('normal') },
      { label: '曲線', color: vecColor('result') },
      { label: '制御点を結ぶ線', color: vecColor('guide'), dashed: true },
      { label: '進む向き（接線）', color: vecColor('b') },
    ]),
  ]);

  return {
    dispose: () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      stage.dispose();
    },
  };
}
