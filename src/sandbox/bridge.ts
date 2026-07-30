/**
 * サンドボックスの iframe から `import * as THREE from 'three'` を書けるようにする仕掛け。
 *
 * three をもう一部バンドルすると 570KB 増えてしまう。そこで、親ページが既に読み込んでいる
 * three の名前空間を列挙し、「そこから取り出して再エクスポートするだけ」の小さなモジュールを
 * Blob として作って、インポートマップで `three` に対応づける。
 * バンドルは 1 バイトも増えず、教材のコードと実行されるコードが完全に同じ形になる。
 */

import * as THREE from 'three';

/** iframe 側から参照するためのグローバル名。 */
export const BRIDGE_GLOBAL = '__SANDBOX_MODULES__';

/**
 * addons は動的 import で読む。静的に書くと、three を共有する第1部のデモ用チャンクにまで
 * GLTFLoader などが混ざり、第2部を開かない読者にも余計な転送量が乗ってしまう。
 */
const ADDON_LOADERS: Record<string, () => Promise<Record<string, unknown>>> = {
  'three/addons/controls/OrbitControls.js': () =>
    import('three/addons/controls/OrbitControls.js') as Promise<Record<string, unknown>>,
  'three/addons/loaders/GLTFLoader.js': () =>
    import('three/addons/loaders/GLTFLoader.js') as Promise<Record<string, unknown>>,
  'three/addons/utils/BufferGeometryUtils.js': () =>
    import('three/addons/utils/BufferGeometryUtils.js') as Promise<Record<string, unknown>>,
  // Stage が既に静的 import しているので、これを足してもバンドルは増えない
  'three/addons/renderers/CSS2DRenderer.js': () =>
    import('three/addons/renderers/CSS2DRenderer.js') as Promise<Record<string, unknown>>,
};

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

// `export const default = ...` のように書けない名前は再エクスポートから外す
const RESERVED = new Set([
  'default', 'null', 'true', 'false', 'class', 'const', 'let', 'var', 'function',
  'return', 'new', 'delete', 'typeof', 'instanceof', 'in', 'of', 'if', 'else',
  'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'this', 'super',
  'import', 'export', 'extends', 'yield', 'await', 'void', 'with', 'try', 'catch',
  'finally', 'throw', 'enum',
]);

let importMap: Record<string, string> | null = null;

function moduleSource(specifier: string, namespace: Record<string, unknown>): string {
  const names = Object.keys(namespace).filter(
    (name) => IDENTIFIER.test(name) && !RESERVED.has(name),
  );
  const lines = names.map(
    (name) => `export const ${name} = m[${JSON.stringify(name)}];`,
  );
  return [
    `const m = window.parent[${JSON.stringify(BRIDGE_GLOBAL)}][${JSON.stringify(specifier)}];`,
    ...lines,
  ].join('\n');
}

/**
 * インポートマップを組み立てる。Blob URL は 1 度だけ作って以後は使い回す。
 * 失敗した場合（Blob が使えないなど）は null を返し、呼び出し側で実行を諦める。
 */
export async function getImportMap(): Promise<Record<string, string> | null> {
  if (importMap) return importMap;

  try {
    const modules: Record<string, Record<string, unknown>> = {
      three: THREE as unknown as Record<string, unknown>,
    };

    const entries = Object.entries(ADDON_LOADERS);
    const loaded = await Promise.all(entries.map(([, load]) => load()));
    for (const [index, [specifier]] of entries.entries()) {
      modules[specifier] = loaded[index]!;
    }

    (window as unknown as Record<string, unknown>)[BRIDGE_GLOBAL] = modules;

    const map: Record<string, string> = {};
    for (const [specifier, namespace] of Object.entries(modules)) {
      const blob = new Blob([moduleSource(specifier, namespace)], {
        type: 'text/javascript',
      });
      map[specifier] = URL.createObjectURL(blob);
    }

    importMap = map;
    return importMap;
  } catch (error) {
    console.warn('サンドボックスのインポートマップを作れませんでした', error);
    return null;
  }
}

/** この環境でサンドボックスを動かせるか。 */
export function isSandboxSupported(): boolean {
  return (
    typeof URL.createObjectURL === 'function' &&
    typeof Blob === 'function' &&
    HTMLScriptElement.supports?.('importmap') !== false
  );
}
