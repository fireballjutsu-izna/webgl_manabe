import type { Chapter } from '../types.ts';

export const chapterP04: Chapter = {
  slug: 'p04-planet-orbits',
  part: 'project',
  number: 4,
  title: '惑星ビューアー ― 軌道と、寄っていく視点',
  goal: '傾いた自転軸と公転を階層で組み立てられるようになり、クリックした対象へなめらかに寄る視点を作れるようになります。',
  requires: ['p03-planet-atmosphere', 't08-raycaster', '09-hierarchy'],
  threeApis: [
    'Group',
    'Object3D.add',
    'Object3D.rotation',
    'Raycaster',
    'Raycaster.setFromCamera',
    'Vector2',
    'Vector3.lerp',
    'BufferGeometry.setFromPoints',
    'Line',
    'LineBasicMaterial',
    'MathUtils.degToRad',
    'CSS2DRenderer',
  ],
  mathRecall: [
    { slug: '09-hierarchy', note: '親を回すと子がついてくる' },
    { slug: '05-trig', note: '円軌道は cos と sin' },
    { slug: '08-interp', note: '補間 ― 寄っていく動きを作る' },
    { slug: 't08-raycaster', note: 'クリックした先に何があるかを調べる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 動きを足して、完成させる

地表・雲・大気・夜の明かりまでできました。最後に**動き**と**触れること**を足します。

- **自転軸を傾ける**（地球なら 23.4 度）
- **月を公転させる**
- **クリックした天体へ、カメラがなめらかに寄る**
- **名前のラベルを空間に置く**

新しい概念はほとんどありません。[](#/ch/09-hierarchy)、
[](#/ch/05-trig)、[](#/ch/08-interp)、[](#/ch/t08-raycaster)を
組み合わせるだけです。**第1部と第2部が同時に効いてくる**のがこの章です。
`,
    },
    {
      kind: 'md',
      text: `
## 自転軸を傾ける ― 入れ物を1枚かぶせる

「惑星を傾けて、そのまま自転させたい」。素直に \`planet.rotation.z = 23.4°\` と
\`planet.rotation.y += dt\` を両方書くと、**うまくいきません。**
\`rotation\` は 3 つの角度をまとめて 1 つの回転にするので、
[](#/ch/07-rotation)で見たとおり、順番の都合で軸が寝てしまいます。

正しいやり方は**階層で分けること**です。

- \`tilt\`（Group）… 傾きだけを持つ。動かさない
- \`planet\`（Mesh）… その子。**自分の y 軸のまわりだけ**を回る

こうすると、planet にとっての「上」は常に傾いた軸のままなので、
**傾いた軸のまわりを自転する**動きになります。
これは[](#/ch/09-hierarchy)でやった「親の座標系の中で子が動く」そのものです。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '「回転を分けたい」と思ったら Group',
      text: `
2 種類の回転を 1 つのオブジェクトに載せようとして詰まったら、**入れ物を 1 枚増やす**のが定石です。

- 傾き＋自転 → \`tilt\` の中に \`planet\`
- 公転＋自転 → \`orbit\` の中に \`moon\`
- 公転の傾き（軌道傾斜）＋公転 → \`inclination\` の中に \`orbit\`

Group は行列を 1 つ増やすだけで、描画の重さはほぼ変わりません。
**迷ったら分ける**ほうが、あとから触れる形になります。
`,
    },
    {
      kind: 'md',
      text: `
## 公転 ― 2つのやり方

月を惑星のまわりに回す方法は 2 つあります。**どちらも正しく、使い分けます。**

**（A）親を回す。** 月を入れた Group の \`rotation.y\` を増やすだけ。
円軌道ならこれがいちばん短く書けます。

**（B）位置を自分で計算する。** \`moon.position.set(R * cos(t), 0, R * sin(t))\`。
こちらは面倒に見えますが、**軌道を自由にできます。**
楕円にしたい、傾けたい、位相をずらして 2 つ回したい ― どれも B なら 1 行です。

この章では**B** を使います。あとで惑星を増やしたときに、
それぞれ違う半径・違う速さ・違う位相にしたくなるからです。
`,
    },
    {
      kind: 'formula',
      tex: '(x, z) = (R\\cos(\\omega t + \\varphi),\\; R\\sin(\\omega t + \\varphi))',
      readAloud:
        'R が軌道の半径、ω（オメガ）が回る速さ、φ（ファイ）が最初の位置のずれ（位相）です。t が時間。三角関数の章の単位円をそのまま大きくして、時間で角度を進めているだけです。φ を変えれば、同じ軌道の別の場所から回りはじめます。',
      worked: {
        given: '$R = 4.6$、$\\omega = 0.35$、$\\varphi = 1.1$ で、$t = 2$ 秒のとき。',
        steps: [
          { calc: '角度 : 0.35 x 2 + 1.1 = 1.8 ラジアン' },
          { calc: 'cos(1.8) = -0.227' },
          { calc: 'sin(1.8) =  0.974' },
          { calc: 'x = 4.6 x (-0.227) = -1.045' },
          { calc: 'z = 4.6 x   0.974  =  4.479' },
          { calc: '確かめ : ルート(1.045の2乗 + 4.479の2乗)' },
          { calc: '       = 4.6', note: '軌道半径どおり。ちゃんと円の上にいる' },
        ],
        result: '$\\varphi$ を 0 にすると、$t = 0$ のとき $(4.6,\\; 0)$ から始まります。**月を 3 つ置くなら、$\\varphi$ だけを $0$、$2.1$、$4.2$ と変えれば、同じ軌道の別々の場所から回りはじめます。**',
      },
    },
    {
      kind: 'md',
      text: `
## 軌道の線も、同じ式で引ける

軌道を見える線にしておくと、動きが読みやすくなります。
**位置を計算する式に、時間の代わりに 0〜360 度を入れて点を並べる**だけです。

同じ式から線と動きの両方を作るので、**ずれる心配がありません。**
片方だけ半径を変えて食い違う、という事故が起きなくなります。
`,
    },
    {
      kind: 'sandbox',
      title: '傾いた自転軸と、月の公転',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 200);
camera.position.set(0, 4.5, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const sunDirection = new THREE.Vector3(1, 0.15, 0.3).normalize();
const sun = new THREE.DirectionalLight(0xfff2e0, 3.2);
sun.position.copy(sunDirection).multiplyScalar(20);
scene.add(sun, new THREE.AmbientLight(0x22334a, 0.3));

/* ---- 傾き用の入れ物を1枚かぶせる ---- */

const tilt = new THREE.Group();
tilt.rotation.z = THREE.MathUtils.degToRad(23.4);   // 傾きはここだけが持つ
scene.add(tilt);

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(1.6, 64, 48),
  new THREE.MeshStandardMaterial({ color: 0x3d6a8f, roughness: 0.8, flatShading: false }),
);
tilt.add(planet);   // planet は「傾いた座標系の中で」y 軸のまわりを回る

// 自転軸を見えるようにする（確認用。要らなければ消してよい）
const axisPoints = [new THREE.Vector3(0, -2.4, 0), new THREE.Vector3(0, 2.4, 0)];
const axis = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(axisPoints),
  new THREE.LineBasicMaterial({ color: 0xff7ad9 }),
);
tilt.add(axis);

/* ---- 月。位置を自分で計算する（軌道を自由にできる） ---- */

const MOON_R = 4.2;          // 軌道の半径
const MOON_SPEED = 0.35;     // 回る速さ
const MOON_PHASE = 1.1;      // 最初の位置のずれ

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.44, 40, 28),
  new THREE.MeshStandardMaterial({ color: 0x9aa3b2, roughness: 1 }),
);
scene.add(moon);

// 軌道の線。動きと同じ式から点を並べるので、ずれない
const orbitPoints = [];
for (let i = 0; i <= 128; i++) {
  const a = (i / 128) * Math.PI * 2;
  orbitPoints.push(new THREE.Vector3(Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R));
}
const orbitLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(orbitPoints),
  new THREE.LineBasicMaterial({ color: 0x3a3a5c }),
);
scene.add(orbitLine);

/* ---- ループ ---- */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  planet.rotation.y += dt * 0.25;   // 傾いた軸のまわりを自転する

  const a = t * MOON_SPEED + MOON_PHASE;
  moon.position.set(Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R);

  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        'ピンクの線が自転軸です。傾いたまま自転しているのが分かります。`planet.rotation.y` の代わりに `tilt.rotation.y` を増やすと、軸ごと振り回されて「首振り」になります ― これが「回転を分ける」ことの意味です。`MOON_PHASE` を変えると、月が別の位置から回りはじめます。',
    },
    {
      kind: 'md',
      text: `
## クリックした天体へ寄る

[](#/ch/t08-raycaster)でやった \`Raycaster\` で「クリックの先に何があるか」を調べ、
見つかった相手へ**カメラをなめらかに動かします。**

なめらかに動かす部分は、[](#/ch/08-interp)の \`lerp\` そのものです。
毎フレーム、**いまの位置から目標へ少しだけ近づける**。これだけで自然な減速が付きます。

このあとのコードが**完成品**です。[](#/ch/p02-planet-surface) の地表、[](#/ch/p03-planet-atmosphere) の雲・大気・夜の明かり、
この章の傾き・公転・ラベル・クリックが全部入っているので長くなっています。
上から順に読めば、これまでの 3 章がそのまま並んでいるのが分かるはずです。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathbf{p} \\leftarrow \\mathbf{p} + (\\mathbf{p}_{\\text{目標}} - \\mathbf{p}) \\cdot k',
      readAloud:
        'いまの位置に、目標までの差の k 倍を足して新しい位置にする、と読みます。k は 0.05 くらい。毎フレーム残りの 5 パーセントを詰めるので、近づくほど遅くなり、勝手に減速して見えます。',
      worked: {
        given: 'カメラが $(0,\\,0,\\,10)$ にいて、目標が $(0,\\,0,\\,4)$、$k = 0.05$ のとき。最初の 3 フレームを追います。',
        steps: [
          { calc: '1 : 差 = 4 - 10 = -6' },
          { calc: '    -6 x 0.05 = -0.3  →  z = 9.7' },
          { calc: '2 : 差 = 4 - 9.7 = -5.7' },
          { calc: '    -5.7 x 0.05 = -0.285 → z = 9.415', note: '動く量が少し減った' },
          { calc: '3 : 差 = 4 - 9.415 = -5.415' },
          { calc: '    -5.415 x 0.05 = -0.271 → z = 9.144' },
        ],
        result: '**0.3 → 0.285 → 0.271** と、**勝手に減速していきます**。イージングの関数を 1 つも書いていないのに、「近づくほどゆっくり」が出るのがこの式の気持ちよさです。ただし [](#/ch/08-interp) で見たとおり、これは**フレームレートに依存する**ので、厳密にやるなら $k$ を `dt` から作り直します。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'この lerp は、フレームレートに依存します',
      text: `
毎フレーム 5 パーセント詰める書き方は、**120fps の画面では 60fps の 2 倍速く**寄ります。
厳密に揃えたいなら、[](#/ch/t06-loop-clock)でやったとおり時間を使います。

\`k = 1 - Math.pow(0.001, dt)\` のようにすると、「1 秒で 99.9 パーセント詰める」という
フレームレートに依らない指定になります。カメラの寄りくらいなら前者で十分ですが、
ゲームのように速さが意味を持つ場面では後者にしてください。
`,
    },
    {
      kind: 'md',
      text: `
## ドラッグとクリックを区別する

\`OrbitControls\` を付けた画面では、**視点を回しただけでクリック扱いになる**事故が起きます。
「回そうとしたら知らない星に寄っていった」というあれです。

防ぎ方は簡単です。**押した場所と離した場所が近ければクリック**とみなします。
数ピクセルの閾値を置くだけで、体感がまるで変わります。
`,
    },
    {
      kind: 'sandbox',
      title: '惑星ビューアー（完成）',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

/* =========================================================
   これが完成品です。3-02 の地表、3-03 の雲・大気・夜の明かり、
   この章の傾き・公転・ラベル・クリックを 1 つにまとめてあります。
   ========================================================= */

const TEX_W = 1024;
const TEX_H = 512;
const SEA = 0.5;

/* ---- 3次元ノイズ（3-02） ---- */

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
}

/* ---- 地表・雲・街明かりを、1回のループでまとめて作る（3-02, 3-03） ---- */

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
  const lamp = make();

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
          const rock = Math.min(1, above / snowLine);
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
      lamp.image.data[at] = glow;
      lamp.image.data[at + 1] = glow;
      lamp.image.data[at + 2] = glow;
      lamp.image.data[at + 3] = 255;
    }
  }

  surface.ctx.putImageData(surface.image, 0, 0);
  cloud.ctx.putImageData(cloud.image, 0, 0);
  lamp.ctx.putImageData(lamp.image, 0, 0);

  const colorMap = new THREE.CanvasTexture(surface.canvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  return {
    colorMap: colorMap,
    cloudMap: new THREE.CanvasTexture(cloud.canvas),
    lampMap: new THREE.CanvasTexture(lamp.canvas),
  };
}

const maps = createMaps();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 3000);
camera.position.set(0, 4, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// ラベル用のレンダラ。キャンバスに重ねるので、位置と当たり判定を外しておく
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 2.4;
controls.maxDistance = 60;

/* ---- 星空（3-01） ---- */

function createStars(count, radius) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const y = THREE.MathUtils.randFloatSpread(2);
    const r = Math.sqrt(1 - y * y);
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3 + 0] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0xffffff, size: 1.5, sizeAttenuation: false, depthWrite: false,
  }));
}
scene.add(createStars(3000, 1200));

/* ---- 光 ---- */

const sunDirection = new THREE.Vector3(1, 0.18, 0.35).normalize();
const sun = new THREE.DirectionalLight(0xfff2e0, 3.4);
sun.position.copy(sunDirection).multiplyScalar(40);
scene.add(sun, new THREE.AmbientLight(0x22334a, 0.28));

/* ---- 惑星（傾き用の入れ物をかぶせる） ---- */

const RADIUS = 1.6;

const tilt = new THREE.Group();
tilt.rotation.z = THREE.MathUtils.degToRad(23.4);
scene.add(tilt);

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(RADIUS, 96, 64),
  new THREE.MeshStandardMaterial({ map: maps.colorMap, roughness: 0.85 }),
);
planet.name = '惑星';
tilt.add(planet);

// 夜の街明かり（3-03）。地表と一緒に回るので、tilt の中に入れる
const lamps = new THREE.Mesh(
  new THREE.SphereGeometry(RADIUS * 1.003, 96, 64),
  new THREE.ShaderMaterial({
    uniforms: {
      uLights: { value: maps.lampMap },
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
      '  float night = smoothstep(0.08, -0.22, dot(normalize(vNormal), uSunDirection));',
      '  float lamp = texture2D(uLights, vUv).r;',
      '  gl_FragColor = vec4(vec3(1.0, 0.82, 0.55) * lamp * night * 2.2, 1.0);',
      '}',
    ].join('\\n'),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  }),
);
tilt.add(lamps);

// 雲（3-03）。少し速く流す
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
tilt.add(clouds);

// 大気（3-03）
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

/* ---- 月 ---- */

const MOON_R = 4.6;
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.44, 48, 32),
  new THREE.MeshStandardMaterial({ color: 0x9aa3b2, roughness: 1 }),
);
moon.name = '月';
scene.add(moon);

const orbitPoints = [];
for (let i = 0; i <= 160; i++) {
  const a = (i / 160) * Math.PI * 2;
  orbitPoints.push(new THREE.Vector3(Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R));
}
scene.add(new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(orbitPoints),
  new THREE.LineBasicMaterial({ color: 0x2c2c46 }),
));

/* ---- ラベル ---- */

function addLabel(target, text, offsetY) {
  const div = document.createElement('div');
  div.textContent = text;
  div.style.cssText =
    'color:#e8e8f2; font:11px sans-serif; letter-spacing:0.08em;' +
    'text-shadow:0 0 6px rgba(0,0,0,0.9); white-space:nowrap;';
  const label = new CSS2DObject(div);
  label.position.y = offsetY;
  target.add(label);
}
addLabel(planet, '惑星', RADIUS + 0.5);
addLabel(moon, '月', 0.8);

/* ---- クリックで寄る ---- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const targets = [planet, moon];

// 目標。毎フレーム、いまの値をここへ少しずつ近づける
const desiredTarget = new THREE.Vector3(0, 0, 0);
const desiredPosition = new THREE.Vector3().copy(camera.position);

let downX = 0;
let downY = 0;

renderer.domElement.addEventListener('pointerdown', (event) => {
  downX = event.clientX;
  downY = event.clientY;
});

renderer.domElement.addEventListener('pointerup', (event) => {
  // 押した場所から動いていたら、視点を回しただけなのでクリックとみなさない
  const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
  if (moved > 4) return;

  // 画面の座標を -1〜1 の正規化デバイス座標へ（2-08）
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(targets, false);
  if (hits.length === 0) {
    // 何もない場所をクリックしたら引く
    desiredTarget.set(0, 0, 0);
    desiredPosition.set(0, 4, 12);
    return;
  }

  const object = hits[0].object;
  const center = object.getWorldPosition(new THREE.Vector3());
  const distance = object === moon ? 1.6 : 5.2;

  desiredTarget.copy(center);
  // いまの視線の向きを保ったまま、対象から distance だけ離れた位置へ
  desiredPosition
    .copy(camera.position)
    .sub(controls.target)
    .normalize()
    .multiplyScalar(distance)
    .add(center);
});

/* ---- ループ ---- */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  planet.rotation.y += dt * 0.06;
  lamps.rotation.y = planet.rotation.y;   // 明かりは地表と完全に同期させる
  clouds.rotation.y += dt * 0.085;        // 雲だけ少し速い

  const a = t * 0.3;
  moon.position.set(Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R);
  moon.rotation.y = -a;   // いつも同じ面を惑星に向ける（潮汐固定）

  sunDirection.set(Math.cos(t * 0.12), 0.18, Math.sin(t * 0.12)).normalize();
  sun.position.copy(sunDirection).multiplyScalar(40);

  // 毎フレーム、残りの 6 パーセントを詰める。近づくほど遅くなる
  camera.position.lerp(desiredPosition, 0.06);
  controls.target.lerp(desiredTarget, 0.06);

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '惑星や月をクリックすると寄っていき、何もない場所をクリックすると引きます。ドラッグでは寄りません（4 ピクセルの閾値）。`camera.position.lerp` の `0.06` を `0.5` にすると瞬間移動に近くなり、`0.01` にすると眠くなるほど遅くなります。月の `rotation.y = -a` を消すと、月がゆっくり自転して裏側が見えるようになります。最初にテクスチャを作るので、走り出すまで一瞬待ちます。',
    },
    {
      kind: 'md',
      text: `
## {{潮汐固定}}という小ネタ

完成版には 1 行だけ、説明のない行があります。

**\`moon.rotation.y = -a\`** ― 公転の角度と逆向きに、同じだけ自転させています。

これで月は**いつも同じ面を惑星に向け続けます。** 実際の月がそうなっているからです
（だから地球からは月の裏側が見えません）。公転で向きが変わるぶんを自転で打ち消している、
と読めば[](#/ch/09-hierarchy)の話そのものです。

こういう 1 行が効きます。**物理的に正しいことをすると、理由が分からなくても「らしく」見えます。**
`,
    },
    {
      kind: 'md',
      text: `
## 惑星ビューアーは、ここで完成

4 章かけて作ったものを振り返ります。

- **[](#/ch/p01-planet-setup)** … 骨組みと星空。球面に一様にばらまく方法
- **[](#/ch/p02-planet-surface)** … 地表をノイズで描く。方向でノイズを引いて継ぎ目を消す
- **[](#/ch/p03-planet-atmosphere)** … 大気・雲・夜の明かり。内積で縁と昼夜を切り出す
- **[](#/ch/p04-planet-orbits)** … 傾いた自転、公転、クリックで寄る視点、ラベル

**素材は 1 つも使っていません。** すべてコードから出ています。

伸ばすなら、次が面白いところです。どれも今あるコードの延長で書けます。

- **惑星を増やす。** 半径・速さ・位相を変えた配列を回すだけです
- **土星の環。** \`RingGeometry\` に、半径方向の濃淡テクスチャを貼ります
- **軌道を楕円にする。** \`x = a·cos t\`、\`z = b·sin t\` と半径を 2 つにするだけ
- **軌道傾斜。** 公転用の Group をもう 1 枚かぶせて傾けます
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '次は街を作ります',
      text: `
惑星は「1 つのものを丁寧に作る」練習でした。
後半 4 章のローポリの街は、**逆に「たくさんのものを安く作る」**練習になります。

同じ手続き的生成ですが、効いてくる技術がまるで違います。
[](#/ch/t11-performance)でやったドローコールの話が、そこで本番を迎えます。
`,
    },
  ],
  exercises: [
    {
      prompt: '\`tilt.rotation.z\` の 23.4 度を 0 度と 90 度にしてください。自転軸（ピンクの線）と、昼夜の境目はどう変わりますか。',
      hint: '90 度にすると、軸が横倒しになります。',
      answer: `0 度では軸がまっすぐ立ち、昼夜の境目が**縦の線**になります。
90 度では軸が横倒しになり、**片方の極がずっと昼、反対の極がずっと夜**になります（天王星がこの状態です）。
季節が生まれるのはこの傾きのおかげで、**Group を 1 枚かぶせた、たった 1 行**がそれを担っています。`,
    },
    {
      prompt: '完成版の \`MOON_R\`（4.6）を 2.2 にしてください。何が起きますか。安全に近づけるにはどこを直せばよいでしょう。',
      hint: '惑星の半径 \`RADIUS\` は 1.6 で、大気はその 1.2 倍の球です。',
      answer: `月が**大気の中にめり込みます**（惑星の半径 1.6、大気 1.92 なので、2.2 では余裕がありません）。
軌道の半径は「一番外側にあるものの半径 ＋ 月の半径 ＋ 余裕」より大きく取ります。
数値を直接いじるより、\`RADIUS * 1.2 + 0.44 + 0.3\` のように**中身から計算させておく**と、
惑星の大きさを変えたときに勝手に付いてきます。`,
    },
    {
      prompt: '完成版で、クリック判定に 4 ピクセルの「ずれの許容」を入れているのはなぜでしょう。これを 0 にすると何が困りますか。',
      hint: '視点を回すときも、ボタンを押して離しています。',
      answer: `**視点を回しただけのつもりが、選択として扱われてしまう**からです。
OrbitControls のドラッグも \`pointerdown\` と \`pointerup\` の組なので、区別する手がかりが要ります。
そこで「押してから離すまでに、指が 4 ピクセルより動いていなければクリック」とみなします。
0 にすると、ほんのわずかな手ぶれでも回転扱いになり、**クリックがほとんど効かなくなります**。`,
    },
  ],
  quiz: [
    {
      q: '傾いた軸のまわりを自転させたいとき、正しい組み立てはどれですか。',
      choices: [
        '傾きを持つ Group の子にメッシュを入れ、メッシュの rotation.y だけを増やす',
        'メッシュの rotation.z に傾き、rotation.y に自転を入れる',
        'メッシュの rotation.x と rotation.y を同時に増やす',
        'カメラを傾ける',
      ],
      answer: 0,
      explain:
        '`rotation` は 3 つの角度をまとめて 1 つの回転にするので、傾きと自転を同じオブジェクトに入れると軸が寝ます。入れ物を 1 枚かぶせて役割を分ければ、子は「傾いた座標系の中で」まっすぐ回ります。',
    },
    {
      q: '公転を「親の Group を回す」ではなく「位置を三角関数で計算する」ほうが有利なのはどんなときですか。',
      choices: [
        '軌道を楕円にしたい、位相をずらして複数を回したいとき',
        '円軌道を1つだけ作るとき',
        '影を落としたいとき',
        'ドローコールを減らしたいとき',
      ],
      answer: 0,
      explain:
        '円軌道が1つなら親を回すほうが短く書けます。半径を2つにして楕円にする、位相をずらす、速さを個別に変える ― といった自由度が要るときは、位置を自分で計算するほうが素直です。',
    },
    {
      q: '`OrbitControls` がある画面で、ドラッグとクリックを区別する簡単な方法はどれですか。',
      choices: [
        '押した位置と離した位置の距離が数ピクセル以内ならクリックとみなす',
        '`controls.enabled` を毎フレーム切り替える',
        '`click` イベントの代わりに `dblclick` を使う',
        'Raycaster の `far` を小さくする',
      ],
      answer: 0,
      explain:
        'pointerdown の座標を覚えておき、pointerup で距離を測るだけです。閾値は 4〜8 ピクセルが体感に合います。これがないと、視点を回すたびに意図しない選択が起きます。',
    },
  ],
};
