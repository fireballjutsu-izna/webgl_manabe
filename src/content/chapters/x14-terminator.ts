import type { Chapter } from '../types.ts';

export const chapterX14: Chapter = {
  slug: 'x14-terminator',
  part: 'project',
  number: 14,
  title: '夜 ― 昼夜の境目を作り、4 枚を重ねる',
  goal: '太陽の当たっていない側にだけ街の明かりを灯せるようになり、境目の幅を「太陽高度で何度ぶんか」まで意識して決められるようになります。',
  requires: ['x13-clouds', 'b26-dot-facing', 'b36-smoothstep'],
  threeApis: [
    'ShaderMaterial',
    'MeshStandardMaterial.emissive',
    'Object3D.renderOrder',
    'WebGLRenderer.toneMapping',
    'Vector3.dot',
  ],
  mathRecall: [
    { slug: 'b26-dot-facing', note: '内積の符号だけで、前か後ろかが決まる' },
    { slug: 'b36-smoothstep', note: '境目に幅を持たせる。ここでは夕方になる' },
    { slug: 'x12-additive', note: '光を足す描き方と、順番の固定' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## emissive では、できません

夜側にだけ街の光を灯したい。素直に思いつくのは
\`MeshStandardMaterial\` の \`emissive\`（自分で光る色）です。

**これは使えません。**

\`emissive\` は「自分で光っている色」なので、**太陽がどちらにあるかを知りません。**
昼側も夜側も同じように光り、昼の面に街灯が点いた星ができあがります。

必要なのは「**この面は、いま夜か**」の判定です。
そしてそれは、[](#/ch/b26-dot-facing)でやったとおり**内積 $1$ つ**で出ます。

- 法線と太陽の向きの内積が**正** … 太陽のほうを向いている ＝ 昼
- **負** … 背を向けている ＝ 夜

そこで、[](#/ch/x11-atmosphere-rim)の大気と同じ手を使います。
**街明かり専用の薄い層をもう $1$ 枚重ね、明るさを内積から決めます。**
`,
    },
    {
      kind: 'md',
      text: `
## 境目を、ナイフで切らない

内積が負なら点灯、正なら消灯 ― これだと、昼と夜が**線で**分かれます。

本物の地球にそんな線はありません。夕暮れがあり、薄明があり、
**街の明かりは徐々に増えていきます。**

だから境目に**幅**を持たせます。$0$ をまたいで、少し手前から少し先まで。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{夜の強さ} \\;=\\; \\mathrm{smoothstep}(0.08,\\; -0.22,\\; \\mathbf{n} \\cdot \\mathbf{s})',
      readAloud:
        '法線 $\\mathbf{n}$ と太陽の向き $\\mathbf{s}$ の内積が $0.08$ のとき $0$、$-0.22$ のとき $1$ になるようになめらかに変える、と読みます。**しきい値が大きい順に並んでいる**のがこの式の要点で、そう書くと結果が逆向きに動きます。',
      worked: {
        given:
          'まず $3$ か所で通し、そのあと**しきい値そのものを角度に翻訳**します。内積は「太陽から見た天頂角のコサイン」です。',
        steps: [
          { calc: 'n.s = 0.3  (昼) : t = (0.3-0.08)/(-0.3)' },
          { calc: '                = -0.73 → clamp して 0', note: '消灯' },
          { calc: 'n.s = -0.07(夕) : t = (-0.15)/(-0.3) = 0.5' },
          { calc: '                0.5の2乗x(3-1) = 0.5', note: 'ちょうど半分' },
          { calc: 'n.s = -0.5 (夜) : t = 1.93 → clamp して 1', note: '全点灯' },
          { calc: '── 角度に直す ──' },
          { calc: 'n.s = 0.08  : acos = 85.41 度' },
          { calc: '  太陽高度 = 90 - 85.41 = +4.59 度' },
          { calc: 'n.s = -0.22 : acos = 102.71 度' },
          { calc: '  太陽高度 = 90 - 102.71 = -12.71 度' },
          { calc: '帯の幅 = 17.30 度' },
          { calc: '地球なら 17.30 x 111.19 = 1923 km' },
        ],
        result:
          '**太陽が地平線の $4.6$ 度上にいるうちに点きはじめ、$12.7$ 度沈んだところで全点灯**します。地球の薄明の区分と並べると、$-6$ 度までが市民薄明、$-12$ 度までが航海薄明 ― **この帯は、日没前から航海薄明の終わりまでをちょうど覆っています。** 適当に選んだ $2$ つの数が、実際の薄明とほぼ同じ幅になっていました。地球の表面では $1923$ キロメートルの帯です。',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'smoothstep は、引数を逆に書ける',
      text: `
\`smoothstep(0.08, -0.22, x)\` のように**大きいほうを先に**書くと、
値は逆向きに動きます ― $x$ が小さいほど $1$ に近づく関数になります。

\`1.0 - smoothstep(-0.22, 0.08, x)\` と書いても同じですが、
**引数を入れ替えるほうが触る場所が $1$ か所少ない**ので、間違いが減ります。

とくに、あとから幅を調整するときに効きます。
$2$ つの数字を動かすだけで済み、前の \`1.0 -\` を消し忘れる事故が起きません。
`,
    },
    {
      kind: 'md',
      text: `
## 明かりは、陸の上にしか無い

[](#/ch/x09-surface-bake)で焼いた明かりのテクスチャは、
**高さが海面より上で、しかも低いところ**にだけ点を打っていました。

これを $\\alpha$ ではなく**明るさ**として使い、$3$ つを掛け合わせます。

**色 ＝ 暖色 $\\times$ 明かりの点 $\\times$ 夜の強さ $\\times$ 強さ**

$3$ つのうち $1$ つでも $0$ なら、そこは光りません。

- 海の上 … 明かりの点が $0$
- 昼側 … 夜の強さが $0$
- 両方満たす夜の陸 … **点灯**

**条件分岐を $1$ つも書かずに、掛け算だけで済んでいます。**
シェーダでは分岐より掛け算のほうが速く、しかも境目がなめらかになります。
`,
    },
    {
      kind: 'md',
      text: `
## 4 枚を重ねる

ここまでの $4$ 章で作った層を、$1$ つのシーンに集めます。
新しく足すのは**街の明かりの層**と、**描く順番の固定**だけです。

| 半径 | 層 | 回り方 |
|---|---|---|
| $1.000$ | 地表 | 自転する |
| $1.003$ | 街の明かり | **地表と完全に同じ** |
| $1.020$ | 雲 | 地表の $1.5$ 倍 |
| $1.200$ | 大気 | 回さない |

明かりの層に \`lights.rotation.y = planet.rotation.y\` を書くのを忘れると、
**明かりが陸から外れて、海の上で光りはじめます。**
$2$ つの層が「同じものの一部」であるとき、
**回転を共有させるのはコードの責任**です。誰も気づかせてくれません。
`,
    },
    {
      kind: 'sandbox',
      title: '惑星ビューアー（地表・明かり・雲・大気）',
      guide: { focus: ['街の明かり ― 夜側だけ', '描く順番を固定する'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TEX_W = 1024;
const TEX_H = 512;
const SEA = 0.5;
const RADIUS = 1.6;

const maps = createMaps();

/* ---- シーン ---- */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 1.1, 5.6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
// 加算の層を重ねると 1 を超える。切り落とさずに階調を残す
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 2.6;
controls.maxDistance = 24;

// この 1 本を、3 つの層と 1 つのライトが共有する
const sunDirection = new THREE.Vector3(1, 0.2, 0.4).normalize();
const sun = new THREE.DirectionalLight(0xfff2e0, 3.4);
sun.position.copy(sunDirection).multiplyScalar(10);
scene.add(sun, new THREE.AmbientLight(0x22334a, 0.25));

/* ---- 地表 ---- */

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(RADIUS, 96, 64),
  new THREE.MeshStandardMaterial({ map: maps.colorMap, roughness: 0.85, metalness: 0 }),
);
scene.add(planet);

/* ---- 街の明かり ― 夜側だけ ---- */

const lights = new THREE.Mesh(
  new THREE.SphereGeometry(RADIUS * 1.003, 96, 64),
  new THREE.ShaderMaterial({
    uniforms: {
      uLights: { value: maps.lightsMap },
      uSunDirection: { value: sunDirection },
    },
    vertexShader: [
      'varying vec2 vUv;',
      'varying vec3 vNormal;',
      'void main() {',
      '  vUv = uv;',
      '  vNormal = normalize(mat3(modelMatrix) * normal);',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}',
    ].join('\\n'),
    fragmentShader: [
      'uniform sampler2D uLights;',
      'uniform vec3 uSunDirection;',
      'varying vec2 vUv;',
      'varying vec3 vNormal;',
      'void main() {',
      // 内積が正なら昼、負なら夜。0.08 から -0.22 の幅が「夕方」になる
      '  float night = smoothstep(0.08, -0.22, dot(normalize(vNormal), uSunDirection));',
      '  float lamp = texture2D(uLights, vUv).r;',
      // 掛け算だけ。3 つのうち 1 つでも 0 なら光らない
      '  gl_FragColor = vec4(vec3(1.0, 0.82, 0.55) * lamp * night * 2.2, 1.0);',
      '}',
    ].join('\\n'),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  }),
);
scene.add(lights);

/* ---- 雲 ---- */
// MeshStandardMaterial のままなので、夜側で暗くなるのは three がやってくれる

const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(RADIUS * 1.02, 96, 64),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    alphaMap: maps.cloudMap,
    transparent: true,
    depthWrite: false,
    roughness: 1,
  }),
);
scene.add(clouds);

/* ---- 大気 ---- */

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(RADIUS * 1.2, 96, 64),
  new THREE.ShaderMaterial({
    uniforms: {
      uSunDirection: { value: sunDirection },
      uColor: { value: new THREE.Color(0x4a9dff) },
    },
    vertexShader: [
      'varying vec3 vNormal;',
      'varying vec3 vViewDir;',
      'void main() {',
      '  vec4 worldPosition = modelMatrix * vec4(position, 1.0);',
      '  vNormal = normalize(mat3(modelMatrix) * normal);',
      '  vViewDir = normalize(cameraPosition - worldPosition.xyz);',
      '  gl_Position = projectionMatrix * viewMatrix * worldPosition;',
      '}',
    ].join('\\n'),
    fragmentShader: [
      'uniform vec3 uSunDirection;',
      'uniform vec3 uColor;',
      'varying vec3 vNormal;',
      'varying vec3 vViewDir;',
      'void main() {',
      '  vec3 n = normalize(vNormal);',
      // 内積の絶対値が、そのまま大気の中を通る道のりの長さ
      '  float thickness = abs(dot(n, normalize(vViewDir)));',
      '  float sunSide = smoothstep(-0.35, 0.5, dot(n, uSunDirection));',
      '  gl_FragColor = vec4(uColor * pow(thickness, 1.4) * 2.6 * (0.12 + 0.88 * sunSide), 1.0);',
      '}',
    ].join('\\n'),
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  }),
);
scene.add(atmosphere);

/* ---- 描く順番を固定する ---- */
// 中心が同じ 3 枚は「遠い順」で並べようがないので、作った順に落ちる。
// 行を入れ替えただけで絵が変わらないよう、ここで明示しておく

lights.renderOrder = 1;      // 明かりは雲に隠される
clouds.renderOrder = 2;
atmosphere.renderOrder = 3;

/* ---- ループ ---- */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  // uniform は同じ Vector3 を共有しているので、書き換えるだけで 3 か所に届く
  sunDirection.set(Math.cos(t * 0.18), 0.2, Math.sin(t * 0.18)).normalize();
  sun.position.copy(sunDirection).multiplyScalar(10);

  planet.rotation.y += dt * 0.05;
  lights.rotation.y = planet.rotation.y;   // 明かりは地表と完全に同期
  clouds.rotation.y += dt * 0.075;         // 雲だけ 1.5 倍速い

  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- 下ごしらえ：3枚のテクスチャを1回のループで焼く（前の章のもの） ---- */

function createMaps() {
  const make = () => {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    const ctx = canvas.getContext('2d');
    return { canvas: canvas, ctx: ctx, image: ctx.createImageData(TEX_W, TEX_H) };
  };
  const surface = make();
  const cloud = make();
  const lights = make();

  for (let row = 0; row < TEX_H; row++) {
    const lat = (0.5 - row / (TEX_H - 1)) * Math.PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const absLat = Math.min(1, Math.abs(lat) / (Math.PI / 2));

    for (let col = 0; col < TEX_W; col++) {
      const lon = (col / TEX_W - 0.5) * Math.PI * 2;
      const dx = cosLat * Math.cos(lon);
      const dy = sinLat;
      const dz = cosLat * Math.sin(lon);
      const at = (row * TEX_W + col) * 4;

      const height = fbm(dx * 2.2 + 8, dy * 2.2 + 8, dz * 2.2 + 8, 5, 1337);
      let r, g, b;
      if (height < SEA) {
        const depth = Math.min(1, (SEA - height) / SEA);
        r = 14 + (1 - depth) * 40;
        g = 48 + (1 - depth) * 78;
        b = 92 + (1 - depth) * 74;
      } else {
        const above = (height - SEA) / (1 - SEA);
        const snowLine = 0.62 - absLat * 0.62;
        if (above > snowLine) { r = 232; g = 238; b = 246; }
        else if (above < 0.06) { r = 196; g = 182; b = 136; }
        else {
          const rock = Math.min(1, above / Math.max(snowLine, 0.001));
          r = 62 + rock * 92; g = 96 + rock * 66; b = 58 + rock * 60;
        }
      }
      surface.image.data[at] = r;
      surface.image.data[at + 1] = g;
      surface.image.data[at + 2] = b;
      surface.image.data[at + 3] = 255;

      const cloudNoise = fbm(dx * 3.4 - 40, dy * 3.4 - 40, dz * 3.4 - 40, 5, 99);
      const t = Math.min(1, Math.max(0, (cloudNoise - 0.5) / 0.22));
      const cover = t * t * (3 - 2 * t) * 255;
      cloud.image.data[at] = cover;
      cloud.image.data[at + 1] = cover;
      cloud.image.data[at + 2] = cover;
      cloud.image.data[at + 3] = 255;

      let glow = 0;
      if (height >= SEA) {
        const above = (height - SEA) / (1 - SEA);
        if (above < 0.3) {
          const town = noise3(dx * 90, dy * 90, dz * 90, 7);
          if (town > 0.72) glow = (town - 0.72) / 0.28 * 255;
        }
      }
      lights.image.data[at] = glow;
      lights.image.data[at + 1] = glow;
      lights.image.data[at + 2] = glow;
      lights.image.data[at + 3] = 255;
    }
  }

  surface.ctx.putImageData(surface.image, 0, 0);
  cloud.ctx.putImageData(cloud.image, 0, 0);
  lights.ctx.putImageData(lights.image, 0, 0);

  const colorMap = new THREE.CanvasTexture(surface.canvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  return {
    colorMap: colorMap,
    cloudMap: new THREE.CanvasTexture(cloud.canvas),
    lightsMap: new THREE.CanvasTexture(lights.canvas),
  };
}

function hash3(x, y, z, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177);
  h = Math.imul(h + Math.imul(seed, 2246822519), 2654435761);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967295;
}
function fade(t) { return t * t * (3 - 2 * t); }
function mix(a, b, t) { return a + (b - a) * t; }
function noise3(x, y, z, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
  const x00 = mix(hash3(xi, yi, zi, seed), hash3(xi + 1, yi, zi, seed), u);
  const x10 = mix(hash3(xi, yi + 1, zi, seed), hash3(xi + 1, yi + 1, zi, seed), u);
  const x01 = mix(hash3(xi, yi, zi + 1, seed), hash3(xi + 1, yi, zi + 1, seed), u);
  const x11 = mix(hash3(xi, yi + 1, zi + 1, seed), hash3(xi + 1, yi + 1, zi + 1, seed), u);
  return mix(mix(x00, x10, v), mix(x01, x11, v), w);
}
function fbm(x, y, z, octaves, seed) {
  let sum = 0, total = 0, amp = 1, freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += noise3(x * freq, y * freq, z * freq, seed + i * 101) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / total;
}`,
      caption:
        '待っていると太陽が回り、夜側に街の明かりが浮かびます。**コードの地図で色が付いている $2$ 区画が、この章で足したぶんです。** `lights.rotation.y = planet.rotation.y` を消すと、明かりが陸から外れて海の上で光りはじめます。`smoothstep(0.08, -0.22, ...)` を `smoothstep(0.0, 0.0, ...)` にすると昼夜がナイフで切ったように分かれ、一気に嘘くさくなります。`renderer.toneMapping` の行を消すと、街の明かりが暖色を失って白い点になります。',
    },
    {
      kind: 'md',
      text: `
## 惑星ビューアーの、前半が終わりました

$5$ 章かけて $1$ つの惑星ができました。使った道具を数え直すと、こうです。

- **内積** … $3$ か所（大気の厚み・大気の昼夜・街明かりの昼夜）
- **smoothstep** … $3$ か所（雲のふち・大気の昼夜・街明かりの昼夜）
- **$3$ 次元ノイズ** … $3$ 枚のテクスチャすべて
- **画像ファイル** … $0$ 枚

**新しい概念は、$1$ つも使っていません。**
[](#/ch/03-dot)と[](#/ch/b36-smoothstep)と[](#/ch/b41-noise)だけで、ここまで来ました。

次の章からは、この惑星を**動かします。**
傾いた自転、月の公転、クリックで寄っていく視点 ―
[](#/ch/09-hierarchy)の親子関係が主役になります。
`,
    },
  ],
  exercises: [
    {
      prompt: `街の明かりが「日没ちょうど」に点きはじめ、「太陽高度 $-6$ 度」で全点灯するようにしたい。

\`smoothstep\` の $2$ つのしきい値をいくつにすればよいですか。`,
      hint: '内積は「太陽から見た天頂角のコサイン」です。太陽高度 $h$ のとき、内積は $\\sin h$ になります。',
      answer: `**\`smoothstep(0.0, -0.1045, n・s)\` です。**

**変換**

太陽高度 $h$ と内積の関係は $\\mathbf{n}\\cdot\\mathbf{s} = \\sin h$ です。

- $h = 0°$（日没）… $\\sin 0° = 0$
- $h = -6°$ … $\\sin(-6°) = -0.1045$

**もとの設定と比べる**

| | もとの設定 | この設定 |
|---|---|---|
| 点きはじめ | $+4.59$ 度 | $0$ 度 |
| 全点灯 | $-12.71$ 度 | $-6$ 度 |
| 帯の幅 | $17.30$ 度 | $6$ 度 |
| 地球換算 | $1923$ km | $667$ km |

**見た目にどう出るか**

帯が $\\frac13$ に狭くなるので、**昼夜の境目がくっきりします。**

$-6$ 度は**市民薄明**の終わり ― 屋外で新聞が読めなくなるあたりで、
街灯が点く時刻としては現実に近い設定です。

**それでも、もとの $17.30$ 度を選んだ理由**

この惑星は**遠景**です。

- 帯が細いと、遠くから見たときに**線に見えます**
- 惑星の直径が画面の $\\frac13$ ほどなので、$667$ km の帯は数画素しかありません

**現実に合わせると、この距離では見えない。**

$1923$ km あって初めて「じわりと明るくなる」が絵として読めます。
**寄る作品なら $6$ 度、遠景なら $17$ 度** ― 距離で決まる選択です。`,
    },
    {
      prompt: `\`lights.rotation.y = planet.rotation.y\` を消すと、明かりの層は回らなくなります。

しばらく待つと何が見えますか。この不具合は、どうすれば構造的に防げますか。`,
      hint: '地表は回り続けます。明かりの点の位置は、地表のどこに対応していましたか。',
      answer: `**街の明かりが陸から外れ、やがて海の上で光ります。**

**何が起きるか**

明かりのテクスチャは、地表と**同じ緯度経度の並び**で焼かれています。
「この点は、あの大陸のこのあたり」という対応が付いていました。

地表だけが回ると、その対応がずれていきます。

- $10$ 秒後 … 明かりが海岸から少しずれる
- $1$ 分後 … 大陸と無関係な場所で光る
- 十分待つと … 一周してまた合う（**そして、また外れる**）

**厄介なのは、最初の数秒は正しく見えること**です。
スクリーンショットでは見つかりません。

**構造的に防ぐ**

$2$ つの層が「同じものの一部」なら、**別々に回さないことです。**

**明かりを地表の子にして、回すのは \`Group\` $1$ か所だけにします**（下の解答例のコード）。

これなら、回転を書き写す行そのものが存在しません。
**書き忘れようがない形にするのが、いちばん確実な防ぎ方**です。

**一般化すると**

「$A$ と $B$ は必ず同じ値」という制約をコードで表す方法は $2$ つあります。

- **代入する** … \`b = a\`（毎フレーム、忘れずに）
- **共有する** … 親子にする、同じ変数を参照する（**忘れる余地がない**）

**後者が使えるなら、後者を選んでください。**
この作品で雲を別に回しているのは、**雲だけは同じ値でなくてよい**からです。`,
      answerCode: `// 忘れる余地を無くす ― 回転を持つのは Group だけ
const globe = new THREE.Group();
globe.add(planet, lights);
scene.add(globe, clouds, atmosphere);

// ループの中
globe.rotation.y += dt * 0.05;
clouds.rotation.y += dt * 0.075;`,
    },
    {
      prompt: `街の明かりの色を、掛け算ではなく \`if\` で書いたとします。

\`if (night > 0.5 && lamp > 0.0) 色 = 暖色 * 2.2; else 色 = 黒;\`

見た目はどう変わりますか。`,
      hint: '$\\mathrm{smoothstep}$ が作っていた「途中の値」は、この書き方だとどうなりますか。',
      answer: `**昼夜の境目に線が出て、明かりの点も一様な明るさになります。**

**2 つの階調が消える**

掛け算では、$2$ つの連続量がそのまま明るさに乗っていました。

- \`night\` … $0$ から $1$ へ、$17.30$ 度かけて変わる
- \`lamp\` … 明かりの密度。テクスチャの $0$〜$255$

\`if\` にすると、どちらも**通ったか通らないか**の $2$ 値になります。

- 境目 … $\\mathbf{n}\\cdot\\mathbf{s}$ が $-0.07$ を横切る場所に、**くっきりした線**
- 明かり … 濃い街も薄い村も**同じ明るさ**

**「夕方」が消えます。** $1923$ km かけて増えていくはずのものが、$1$ 画素で切り替わります。

**シェーダで if を避ける理由は、もう 1 つあります**

GPU は多数の画素を**まとめて**処理します。
そのまとまりの中で分岐の結果が分かれると、**両方の枝を実行して片方を捨てます。**

つまり \`if\` は、遅くなるうえに階調も失う ―
**この場合、得るものが $1$ つもありません。**

**掛け算で書ける条件は、掛け算で書く**

- 「$A$ かつ $B$」 … $A \\times B$
- 「$A$ または $B$」 … $\\max(A, B)$
- 「$A$ でない」 … $1 - A$

$0$〜$1$ の値に対して、これらは**そのまま論理として働きます。**
しかも途中の値を潰しません。`,
    },
  ],
  quiz: [
    {
      q: '街の明かりを `MeshStandardMaterial` の `emissive` で出すと、うまくいかないのはなぜですか。',
      choices: [
        'emissive は太陽の向きを知らないので、昼側も一律に光ってしまう',
        'emissive はテクスチャを受け付けない',
        'emissive は加算ブレンドと併用できない',
        'emissive は夜側でしか効かない',
      ],
      answer: 0,
      explain:
        'emissive は「自分で光っている色」なので、光源がどこにあるかとは無関係です。夜側だけを光らせるには、法線と太陽の向きの内積を自分で見るしかありません。専用の層を 1 枚重ねて、内積から明るさを決めるのがいちばん手軽です。',
    },
    {
      q: '`smoothstep(0.08, -0.22, n・s)` の 2 つのしきい値は、太陽高度で言うと何度から何度ですか。',
      choices: [
        '+4.59 度から −12.71 度。幅 17.3 度で、地球なら 1923 km の帯',
        '+8 度から −22 度',
        '0 度から −90 度',
        '内積と太陽高度に対応はない',
      ],
      answer: 0,
      explain:
        '内積は太陽から見た天頂角のコサインなので、太陽高度 h に対して sin h に等しくなります。asin(0.08) = 4.59 度、asin(−0.22) = −12.71 度。地球の薄明は −6 度までが市民薄明、−12 度までが航海薄明なので、この帯は日没前から航海薄明の終わりまでをちょうど覆っています。',
    },
    {
      q: '明かりの層に `lights.rotation.y = planet.rotation.y` が必要なのはなぜですか。',
      choices: [
        '明かりのテクスチャは地表と同じ緯度経度で焼かれているので、ずれると海の上で光り出すから',
        '回さないと明かりが暗くなるから',
        '回転を合わせないと depthWrite が効かないから',
        'three が同じ回転を要求するから',
      ],
      answer: 0,
      explain:
        '明かりの点は「陸の、標高の低いところ」に打たれています。地表だけが回ると対応が崩れ、しばらく待つと大陸と無関係な場所 ― つまり海の上で光ります。最初の数秒は正しく見えるので、スクリーンショットでは見つかりません。そもそも別々に回さない（同じ Group の子にする）のが、構造的な防ぎ方です。',
    },
  ],
};
