/**
 * デモの一覧。章のデータからは id で参照する。
 * three を含む重いモジュールなので、動的 import で「開いた章のぶんだけ」読み込む。
 */

export interface DemoInstance {
  dispose(): void;
}

/** 受け取った .demo カードの中に、ステージと操作パネルを組み立てる。 */
export type DemoMount = (card: HTMLElement) => DemoInstance;

export interface DemoModule {
  mount: DemoMount;
}

export const demos: Record<string, () => Promise<DemoModule>> = {
  'axes-explorer': () => import('./axes-explorer.ts'),
  'vector-add': () => import('./vector-add.ts'),
  'vector-length': () => import('./vector-length.ts'),
  'dot-angle': () => import('./dot-angle.ts'),
  'dot-light': () => import('./dot-light.ts'),
  'cross-normal': () => import('./cross-normal.ts'),
  'unit-circle': () => import('./unit-circle.ts'),
  'wave-grid': () => import('./wave-grid.ts'),
  'transform-playground': () => import('./transform-playground.ts'),
  'euler-gimbal': () => import('./euler-gimbal.ts'),
  'quaternion-slerp': () => import('./quaternion-slerp.ts'),
  'lerp-easing': () => import('./lerp-easing.ts'),
  'parent-child': () => import('./parent-child.ts'),
  'frustum-viewer': () => import('./frustum-viewer.ts'),
  'normal-lambert': () => import('./normal-lambert.ts'),
  'curve-editor': () => import('./curve-editor.ts'),
  'random-vs-noise': () => import('./random-vs-noise.ts'),
  'capstone-orbit': () => import('./capstone-orbit.ts'),

  // 第2部（比較が効く章にだけ置く）
  'material-compare': () => import('./material-compare.ts'),
  'light-compare': () => import('./light-compare.ts'),
};

export const demoIds: string[] = Object.keys(demos);
