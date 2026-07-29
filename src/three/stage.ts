/**
 * すべての 3D デモの土台。
 *
 * SPA で章を行き来するので、破棄漏れは即座に致命傷になる（ブラウザが同時に持てる
 * WebGL コンテキストは 8〜16 程度で、超えると古いキャンバスが黒くなる）。
 * 生成と破棄、描画の停止条件をここ 1 箇所に閉じ込める。
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { cssVar, el } from '../ui/dom.ts';
import { onThemeChange } from '../app/progress.ts';

export interface StageOptions {
  /** カメラの初期位置。 */
  camera?: [number, number, number];
  /** カメラが見る点。 */
  target?: [number, number, number];
  fov?: number;
  /** 床のグリッドを出すか。数値ならその大きさ。 */
  grid?: boolean | number;
  /** 原点の座標軸を出すか。数値ならその長さ。 */
  axes?: boolean | number;
  /** マウスでの回転・ズームを許すか。 */
  controls?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  /** 3D 空間にラベルを置くか（CSS2DRenderer を用意する）。 */
  labels?: boolean;
  /** キャンバス右下に出す操作ヒント。 */
  hint?: string;
  /** 遠景を背景色に溶かす。矢印は fog:false で描くので影響を受けない。 */
  fog?: boolean;
}

export interface Stage {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls | null;
  /** .demo__stage 要素。キャンバスとラベル層を含む。 */
  element: HTMLElement;
  /** 動きを減らす設定が有効か。自動アニメはこれを見て止める。 */
  reduceMotion: boolean;
  /** 毎フレーム呼ばれる処理を登録する。dt・elapsed は秒。 */
  onFrame(fn: (dt: number, elapsed: number) => void): void;
  /** 本描画の直後に呼ばれる。子画面（PiP）などの追加描画に使う。 */
  onAfterRender(fn: () => void): void;
  /** 3D 空間の座標に置く文字ラベルを作る。 */
  addLabel(text: string, color?: string): CSS2DObject;
  /** テーマが変わったときに色を塗り直す処理を登録する。 */
  onTheme(fn: () => void): void;
  dispose(): void;
}

const isReduceMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createStage(options: StageOptions = {}): Stage {
  const element = el('div', { class: 'demo__stage' });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(options.fov ?? 45, 16 / 9, 0.1, 200);
  camera.position.set(...(options.camera ?? [4.5, 3.5, 6]));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(640, 360, false);
  element.appendChild(renderer.domElement);

  let labelRenderer: CSS2DRenderer | null = null;
  if (options.labels) {
    labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = 'demo__overlay';
    element.appendChild(labelRenderer.domElement);
  }

  if (options.hint) {
    element.appendChild(el('div', { class: 'demo__hint' }, options.hint));
  }

  let controls: OrbitControls | null = null;
  if (options.controls !== false) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = options.enableZoom !== false;
    controls.enablePan = options.enablePan ?? false;
    controls.target.set(...(options.target ?? [0, 0, 0]));
    controls.update();
  } else {
    camera.lookAt(new THREE.Vector3(...(options.target ?? [0, 0, 0])));
  }

  /* ---- テーマに追従する色 ---- */

  const gridSize = typeof options.grid === 'number' ? options.grid : 10;
  let grid: THREE.GridHelper | null = null;
  let axes: THREE.AxesHelper | null = null;

  const buildGrid = (): void => {
    if (grid) {
      scene.remove(grid);
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      grid = null;
    }
    if (!options.grid) return;
    grid = new THREE.GridHelper(
      gridSize,
      gridSize,
      new THREE.Color(cssVar('--border-lit', '#3a3a5c')),
      new THREE.Color(cssVar('--border', '#26263c')),
    );
    scene.add(grid);
  };

  const buildAxes = (): void => {
    if (axes) {
      scene.remove(axes);
      axes.dispose();
      axes = null;
    }
    if (!options.axes) return;
    axes = new THREE.AxesHelper(typeof options.axes === 'number' ? options.axes : 2);
    scene.add(axes);
  };

  const themeHandlers: (() => void)[] = [];

  const applyTheme = (): void => {
    const bg = new THREE.Color(cssVar('--bg', '#0a0a12'));
    scene.background = bg;
    scene.fog = options.fog ? new THREE.Fog(bg.getHex(), 14, 42) : null;
    buildGrid();
    buildAxes();
    for (const fn of themeHandlers) fn();
  };

  applyTheme();
  const offTheme = onThemeChange(applyTheme);

  /* ---- サイズ ---- */

  const resize = (): void => {
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    labelRenderer?.setSize(width, height);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(element);

  /* ---- 描画ループ（画面外・非表示のときは止める） ---- */

  const frameHandlers: ((dt: number, elapsed: number) => void)[] = [];
  const afterRenderHandlers: (() => void)[] = [];
  const clock = new THREE.Clock();
  let visible = false;
  let running = false;
  let rafId = 0;

  const tick = (): void => {
    rafId = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    controls?.update();
    for (const fn of frameHandlers) fn(dt, elapsed);
    renderer.render(scene, camera);
    for (const fn of afterRenderHandlers) fn();
    labelRenderer?.render(scene, camera);
  };

  const start = (): void => {
    if (running) return;
    running = true;
    clock.getDelta();
    rafId = requestAnimationFrame(tick);
  };

  const stop = (): void => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
  };

  const sync = (): void => {
    if (visible && !document.hidden) start();
    else stop();
  };

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      sync();
    },
    { rootMargin: '120px' },
  );
  intersectionObserver.observe(element);

  document.addEventListener('visibilitychange', sync);

  /* ---- 破棄 ---- */

  let disposed = false;

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;

    stop();
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', sync);
    offTheme();
    controls?.dispose();

    scene.traverse((object) => {
      const mesh = object as Partial<THREE.Mesh> & { material?: THREE.Material | THREE.Material[] };
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) for (const m of material) disposeMaterial(m);
      else if (material) disposeMaterial(material);
      if (object instanceof CSS2DObject) object.element.remove();
    });
    axes?.dispose();

    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    labelRenderer?.domElement.remove();
  };

  return {
    scene,
    camera,
    renderer,
    controls,
    element,
    reduceMotion: isReduceMotion(),
    onFrame: (fn) => void frameHandlers.push(fn),
    onAfterRender: (fn) => void afterRenderHandlers.push(fn),
    onTheme: (fn) => void themeHandlers.push(fn),
    addLabel(text, color) {
      const node = el('span', { class: 'label3d' }, text);
      if (color) node.style.color = color;
      const label = new CSS2DObject(node);
      return label;
    },
    dispose,
  };
}

function disposeMaterial(material: THREE.Material): void {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) value.dispose();
  }
  material.dispose();
}
