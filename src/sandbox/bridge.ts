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
 *
 * さらに、ここに並べたものを全部先読みすると、ブルームのコードを 1 行も読まない人にも
 * postprocessing 一式が降ってくる。そこで **利用者のコードが実際に import しているものだけ**
 * を読む（下の neededSpecifiers）。
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

  // 第4部
  'three/addons/environments/RoomEnvironment.js': () =>
    import('three/addons/environments/RoomEnvironment.js') as Promise<Record<string, unknown>>,
  'three/addons/postprocessing/EffectComposer.js': () =>
    import('three/addons/postprocessing/EffectComposer.js') as Promise<Record<string, unknown>>,
  'three/addons/postprocessing/RenderPass.js': () =>
    import('three/addons/postprocessing/RenderPass.js') as Promise<Record<string, unknown>>,
  'three/addons/postprocessing/ShaderPass.js': () =>
    import('three/addons/postprocessing/ShaderPass.js') as Promise<Record<string, unknown>>,
  'three/addons/postprocessing/OutputPass.js': () =>
    import('three/addons/postprocessing/OutputPass.js') as Promise<Record<string, unknown>>,
  'three/addons/postprocessing/UnrealBloomPass.js': () =>
    import('three/addons/postprocessing/UnrealBloomPass.js') as Promise<Record<string, unknown>>,
  'three/addons/postprocessing/SMAAPass.js': () =>
    import('three/addons/postprocessing/SMAAPass.js') as Promise<Record<string, unknown>>,
};

/**
 * コードが実際に import している specifier を拾う。
 * 対応表に無いものは落とす（インポートマップに載らないので、
 * ブラウザが「解決できない」と言い、runtime.ts の explainError が日本語で補足する）。
 */
function neededSpecifiers(code: string): string[] {
  const found = new Set<string>(['three']); // three は常に渡す
  const patterns = [
    /\bfrom\s*['"]([^'"]+)['"]/g, // import ... from '...'
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // import('...')
    /\bimport\s+['"]([^'"]+)['"]/g, // import '...'
  ];
  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier) found.add(specifier);
    }
  }
  return [...found].filter(
    (specifier) => specifier === 'three' || specifier in ADDON_LOADERS,
  );
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

// `export const default = ...` のように書けない名前は再エクスポートから外す
const RESERVED = new Set([
  'default', 'null', 'true', 'false', 'class', 'const', 'let', 'var', 'function',
  'return', 'new', 'delete', 'typeof', 'instanceof', 'in', 'of', 'if', 'else',
  'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'this', 'super',
  'import', 'export', 'extends', 'yield', 'await', 'void', 'with', 'try', 'catch',
  'finally', 'throw', 'enum',
]);

/** specifier → 親側の名前空間。iframe からはこの入れ物を辿って取り出す。 */
const modules: Record<string, Record<string, unknown>> = {};
/** specifier → Blob URL。一度作ったものは使い回す。 */
const urls = new Map<string, string>();

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
 * そのコードのためのインポートマップを組み立てる。
 * 実際に import されているものだけを読み、Blob URL は一度作ったら使い回す。
 * 失敗した場合（Blob が使えないなど）は null を返し、呼び出し側で実行を諦める。
 */
export async function getImportMap(code: string): Promise<Record<string, string> | null> {
  try {
    const specifiers = neededSpecifiers(code);
    const missing = specifiers.filter((specifier) => !urls.has(specifier));

    if (missing.length > 0) {
      const loaded = await Promise.all(
        missing.map((specifier) =>
          specifier === 'three'
            ? Promise.resolve(THREE as unknown as Record<string, unknown>)
            : ADDON_LOADERS[specifier]!(),
        ),
      );
      for (const [index, specifier] of missing.entries()) {
        modules[specifier] = loaded[index]!;
      }
      // iframe から辿れるように、名前空間の入れ物を親へ置く（同じ参照を使い続ける）
      (window as unknown as Record<string, unknown>)[BRIDGE_GLOBAL] = modules;

      for (const specifier of missing) {
        const blob = new Blob([moduleSource(specifier, modules[specifier]!)], {
          type: 'text/javascript',
        });
        urls.set(specifier, URL.createObjectURL(blob));
      }
    }

    const map: Record<string, string> = {};
    for (const specifier of specifiers) map[specifier] = urls.get(specifier)!;
    return map;
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
