/**
 * CH.10 カメラと投影 — 視錐台を外から眺めながら、そのカメラが実際に何を写しているかを
 * 右下の子画面で同時に見る。
 */

import * as THREE from 'three';
import { createStage } from '../three/stage.ts';
import { addStudioLights, fmt, solidMaterial, vecColor } from '../three/helpers.ts';
import { createControls, createLegend, createReadouts } from '../ui/controls.ts';
import { cssVar } from '../ui/dom.ts';
import { fillCard } from './scaffold.ts';
import type { DemoInstance } from './registry.ts';

export function mount(card: HTMLElement): DemoInstance {
  const stage = createStage({
    camera: [11, 7.5, 12],
    target: [0, 0.5, -3],
    grid: 20,
    labels: true,
    hint: '左下が「そのカメラの映像」',
  });

  addStudioLights(stage.scene);

  // 写される側の被写体を、奥行き方向に並べる
  const subjects: THREE.Mesh[] = [];
  const palette = [vecColor('a'), vecColor('b'), vecColor('result'), vecColor('negative')];
  for (let i = 0; i < 6; i += 1) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8 + i * 0.12, 0.8),
      solidMaterial(palette[i % palette.length]!),
    );
    mesh.position.set(((i % 3) - 1) * 1.8, 0.4 + i * 0.06, -1.5 - i * 2.2);
    subjects.push(mesh);
    stage.scene.add(mesh);
  }

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    solidMaterial(vecColor('guide'), { transparent: true, opacity: 0.25 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  stage.scene.add(floor);

  // 観察対象のカメラ
  let inner: THREE.PerspectiveCamera | THREE.OrthographicCamera = new THREE.PerspectiveCamera(
    50,
    16 / 9,
    1,
    12,
  );
  inner.position.set(0, 1.2, 5);
  inner.lookAt(0, 0.6, -6);
  stage.scene.add(inner);

  let helper = new THREE.CameraHelper(inner);
  stage.scene.add(helper);

  const cameraLabel = stage.addLabel('観察対象のカメラ', vecColor('normal'));
  stage.scene.add(cameraLabel);

  const controls = createControls([
    { kind: 'select', id: 'kind', label: '投影のしかた', value: 'persp', options: [
      { value: 'persp', label: '透視投影（遠くが小さい）' },
      { value: 'ortho', label: '正射影（遠くも同じ大きさ）' },
    ] },
    {
      kind: 'range',
      id: 'fov',
      label: '画角 FOV',
      min: 15,
      max: 110,
      step: 1,
      value: 50,
      format: (v) => `${v.toFixed(0)}°`,
    },
    { kind: 'range', id: 'near', label: '近くの限界 near', min: 0.1, max: 6, step: 0.1, value: 1 },
    { kind: 'range', id: 'far', label: '遠くの限界 far', min: 3, max: 20, step: 0.5, value: 12 },
    { kind: 'range', id: 'z', label: 'カメラを前後に動かす', min: 1, max: 9, step: 0.1, value: 5 },
  ]);

  const readouts = createReadouts([
    { key: 'visible', label: '視錐台に入っている箱', color: vecColor('result') },
    { key: 'range', label: '写る奥行きの範囲', color: vecColor('normal') },
    { key: 'note', label: '状態', color: vecColor('b') },
  ]);

  const frustum = new THREE.Frustum();
  const projScreen = new THREE.Matrix4();
  const box = new THREE.Box3();

  const rebuildCamera = (): void => {
    const near = Math.min(controls.num('near'), controls.num('far') - 0.5);
    const far = controls.num('far');

    stage.scene.remove(inner, helper);
    helper.dispose();

    if (controls.str('kind') === 'ortho') {
      const height = 4;
      inner = new THREE.OrthographicCamera(
        (-height * 16) / 9 / 2,
        (height * 16) / 9 / 2,
        height / 2,
        -height / 2,
        near,
        far,
      );
    } else {
      inner = new THREE.PerspectiveCamera(controls.num('fov'), 16 / 9, near, far);
    }
    inner.position.set(0, 1.2, controls.num('z'));
    inner.lookAt(0, 0.6, -6);
    helper = new THREE.CameraHelper(inner);
    stage.scene.add(inner, helper);
  };

  const update = (): void => {
    rebuildCamera();
    cameraLabel.position.copy(inner.position).add(new THREE.Vector3(0, 0.7, 0));

    inner.updateMatrixWorld();
    projScreen.multiplyMatrices(inner.projectionMatrix, inner.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreen);

    let visible = 0;
    for (const subject of subjects) {
      box.setFromObject(subject);
      const inside = frustum.intersectsBox(box);
      if (inside) visible += 1;
      const material = subject.material as THREE.MeshStandardMaterial;
      material.opacity = inside ? 1 : 0.22;
      material.transparent = !inside;
    }

    readouts.set('visible', `${visible} / ${subjects.length}`);
    readouts.set(
      'range',
      `${fmt(controls.num('near'), 1)} 〜 ${fmt(controls.num('far'), 1)}`,
    );
    readouts.set(
      'note',
      controls.str('kind') === 'ortho'
        ? '正射影：FOV は使われません（範囲は箱型）'
        : controls.num('fov') > 85
          ? '画角が広すぎて、端が引き伸ばされます'
          : '透視投影：遠くのものほど小さく写ります',
    );
  };

  // 右下に「そのカメラが写している映像」を重ねて描く
  stage.onAfterRender(() => {
    const renderer = stage.renderer;
    const width = stage.element.clientWidth;
    const height = stage.element.clientHeight;
    if (width === 0 || height === 0) return;

    const pipWidth = Math.round(width * 0.34);
    const pipHeight = Math.round((pipWidth * 9) / 16);
    // 右下は操作ヒントの定位置なので、子画面は左下に置く
    const x = 10;
    const y = 10;

    helper.visible = false;
    renderer.autoClear = false;
    renderer.setScissorTest(true);

    // 枠
    renderer.setViewport(x - 2, y - 2, pipWidth + 4, pipHeight + 4);
    renderer.setScissor(x - 2, y - 2, pipWidth + 4, pipHeight + 4);
    renderer.setClearColor(new THREE.Color(cssVar('--neon-cyan', '#4fd6ff')), 1);
    renderer.clear(true, true, false);

    // 中身
    renderer.setViewport(x, y, pipWidth, pipHeight);
    renderer.setScissor(x, y, pipWidth, pipHeight);
    renderer.render(stage.scene, inner);

    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.autoClear = true;
    helper.visible = true;
  });

  controls.onChange(update);
  stage.onTheme(update);

  update();

  fillCard(card, stage, [
    controls.root,
    readouts.root,
    createLegend([
      { label: '視錐台（この中だけが写る）', color: vecColor('result') },
      { label: '子画面の枠（＝そのカメラの映像）', color: vecColor('a') },
    ]),
  ]);

  return { dispose: () => stage.dispose() };
}
