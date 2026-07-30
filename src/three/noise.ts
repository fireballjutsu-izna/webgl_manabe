/**
 * 3次元の value noise と、それを重ね合わせた fBm。
 *
 * 球にテクスチャを貼るとき、平面のノイズを UV に対して掛けると
 * 経度 0 度の継ぎ目と極で必ず破綻する。方向ベクトルを 3 次元ノイズに渡せば、
 * 継ぎ目も特異点もなくなる。第3部の惑星がこれを使う。
 *
 * 依存は増やさない方針なので、格子点の疑似乱数を自分で書いている。
 */

/** 32bit の整数ハッシュ。同じ (x, y, z, seed) には必ず同じ値を返す。 */
function hash3(x: number, y: number, z: number, seed: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177);
  h = Math.imul(h + Math.imul(seed, 2246822519), 2654435761);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  // 符号なしに直して 0〜1 へ
  return (h >>> 0) / 4294967295;
}

/** 両端で傾きが 0 になる重み。格子の継ぎ目が見えないようにする。 */
const fade = (t: number): number => t * t * (3 - 2 * t);

/** 格子点の乱数を三重線形補間した 3 次元ノイズ。戻り値は 0〜1。 */
export function valueNoise3(x: number, y: number, z: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = fade(x - xi);
  const v = fade(y - yi);
  const w = fade(z - zi);

  const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

  const c000 = hash3(xi, yi, zi, seed);
  const c100 = hash3(xi + 1, yi, zi, seed);
  const c010 = hash3(xi, yi + 1, zi, seed);
  const c110 = hash3(xi + 1, yi + 1, zi, seed);
  const c001 = hash3(xi, yi, zi + 1, seed);
  const c101 = hash3(xi + 1, yi, zi + 1, seed);
  const c011 = hash3(xi, yi + 1, zi + 1, seed);
  const c111 = hash3(xi + 1, yi + 1, zi + 1, seed);

  const x00 = mix(c000, c100, u);
  const x10 = mix(c010, c110, u);
  const x01 = mix(c001, c101, u);
  const x11 = mix(c011, c111, u);

  return mix(mix(x00, x10, v), mix(x01, x11, v), w);
}

export interface FbmOptions {
  octaves?: number;
  /** 1 段ごとに細かさを何倍にするか。 */
  lacunarity?: number;
  /** 1 段ごとに振幅を何倍にするか。 */
  gain?: number;
  seed?: number;
}

/**
 * fBm（重ね合わせたノイズ）。粗い形に細かい凹凸を足していく。
 * 振幅の合計で割るので、戻り値はおおむね 0〜1 に収まる。
 */
export function fbm3(x: number, y: number, z: number, options: FbmOptions = {}): number {
  const octaves = options.octaves ?? 4;
  const lacunarity = options.lacunarity ?? 2;
  const gain = options.gain ?? 0.5;
  const seed = options.seed ?? 0;

  let sum = 0;
  let total = 0;
  let amplitude = 1;
  let frequency = 1;

  for (let i = 0; i < octaves; i++) {
    sum += valueNoise3(x * frequency, y * frequency, z * frequency, seed + i * 101) * amplitude;
    total += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return total > 0 ? sum / total : 0;
}

/** 同じ種なら同じ並びを返す疑似乱数（mulberry32）。街の生成で使う。 */
export function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
