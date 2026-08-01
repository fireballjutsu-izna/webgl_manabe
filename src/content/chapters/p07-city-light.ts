import type { Chapter } from '../types.ts';

export const chapterP07: Chapter = {
  slug: 'p07-city-light',
  part: 'project',
  number: 10,
  title: 'ローポリの街 ― 朝から夜へ',
  goal: '時刻という1つの数値から光・空・影・窓の明かりを導けるようになり、影の粗さを自分で解決できるようになります。',
  requires: ['p06-city-buildings', 't05-light-shadow', '08-interp'],
  threeApis: [
    'DirectionalLight',
    'DirectionalLightShadow',
    'Object3D.castShadow',
    'Object3D.receiveShadow',
    'WebGLRenderer.shadowMap',
    'OrthographicCamera',
    'Color.lerpColors',
    'Fog',
    'MeshStandardMaterial.emissiveIntensity',
    'CameraHelper',
  ],
  mathRecall: [
    { slug: '05-trig', note: '太陽の高さは sin、方角は cos' },
    { slug: '08-interp', note: '色を混ぜる ― 補間' },
    { slug: '03-dot', note: '高さ（内積）で昼夜を切り替える' },
    { slug: 't05-light-shadow', note: '影は「光から見たカメラ」で作られる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 時刻を1つ決めれば、あとは全部ついてくる

街に朝と夜を入れます。ここで大事なのは**変数を増やさないこと**です。

「空の色」「太陽の強さ」「影の向き」「窓の明かり」を別々に持つと、
どこかを直したときに必ず食い違います（朝焼けなのに窓が消えている、など）。

そこで、**時刻 $t$（0 から 1 で 1 日）だけを持ちます。** 残りは全部 $t$ から計算します。

- 太陽の向き … $t$ を角度にして円を描く（[](#/ch/05-trig)）
- 太陽の強さと色 … 太陽の**高さ**から決める
- 空とフォグの色 … 夜の色と昼の色を、高さで混ぜる（[](#/ch/08-interp)）
- 窓の明かり … 太陽が沈んだぶんだけ点ける

**1 つの値から派生させれば、食い違いようがありません。**
これは第1部でやった「同じデータから導く」の考え方そのものです。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathbf{s} = (\\cos\\theta,\\; \\sin\\theta,\\; 0.35),\\quad \\theta = 2\\pi\\left(t - \\tfrac{1}{4}\\right)',
      readAloud:
        '太陽の向き s は、角度 θ のコサインとサインで決まります。θ は時刻 t を角度にしたもので、4 分の 1 引いているのは「t が 0.25 のとき日の出（高さ 0）」に合わせるためです。z 成分の 0.35 は、太陽の通り道を少し傾けて真上を通らないようにするためです。',
      worked: {
        given: '時刻 $t$ を 4 つ取って、太陽の向きを出します。',
        steps: [
          { calc: 't = 0.25 : θ = 0' },
          { calc: '           s = ( 1,  0, 0.35)', note: '日の出。真横から' },
          { calc: 't = 0.5  : θ = 1.5708' },
          { calc: '           s = ( 0,  1, 0.35)', note: '正午。真上' },
          { calc: 't = 0.75 : θ = 3.1416' },
          { calc: '           s = (-1,  0, 0.35)', note: '日没。反対の真横' },
          { calc: 't = 0    : θ = -1.5708' },
          { calc: '           s = ( 0, -1, 0.35)', note: '真夜中。地面の下' },
        ],
        result: '$y$ 成分がそのまま**太陽の高さ**になっているのが分かります。窓の明かりはこの $y$ が負に入ったぶんだけ点き、空の色もここから決まります。**時刻 $t$ ひとつから、光・空・影・窓のすべてが導かれる**のはこのためです。',
      },
    },
    {
      kind: 'md',
      text: `
## 太陽の「高さ」がすべてを決める

向きが決まれば、**その y 成分（高さ）**が使えます。これが $-1$ から $1$ の値で、
0 が地平線です。ここから素直に導けます。

- **太陽の強さ** … 高さが 0 を下回ると 0 に。地平線の少し下から立ち上げる
- **太陽の色** … 高さが小さいほど赤く（朝焼け・夕焼け）
- **空の色** … 高さで夜の色と昼の色を混ぜ、地平線近くではオレンジを足す
- **窓の明かり** … 高さが 0 を下回ると点ける

段差なく切り替えるために \`smoothstep\` を使います。
[](#/ch/t14-fragment-shader)でシェーダの中で使ったものと同じ働きで、
JavaScript 側にも 3 行で書けます。
`,
    },
    {
      kind: 'code',
      title: 'smoothstep は3行',
      code: `function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// 太陽の高さ -0.05 で 0、0.25 で 1。地平線の少し下から明るくなりはじめる
const daylight = smoothstep(-0.05, 0.25, sunDirection.y);`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '夜を「暗くする」だけでは夜になりません',
      text: `
太陽を弱めただけの夜は、ただの薄暗い昼です。夜らしくするには**足すもの**が要ります。

- **窓の明かり**（\`emissiveIntensity\`）… これがいちばん効きます
- **空の色を青紫へ**（真っ黒にはしない。真っ黒だと建物の輪郭が消えます）
- **環境光をわずかに青く**（月明かりの代わり）

逆に昼は、**影のコントラストがあるほど**それらしくなります。
夜は光を足し、昼は影を作る ― 別の作業だと思ってください。
`,
    },
    {
      kind: 'sandbox',
      title: '時刻を動かす（スライダーで朝・昼・夕・夜）',
      guide: { focus: ['時刻から、光と空と窓を導く', 'スライダー'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const CITY = 120;
const ROAD = 3.2;
const MIN_LOT = 9;
const SIDEWALK = 0.9;
const PALETTE = [0x6b7280, 0x7c7468, 0x5f6b7a, 0x8a8378, 0x4f5560, 0x6e6a74];

/* ---- シーン ---- */

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9db4d8, 70, 300);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 700);
camera.position.set(-70, 48, 86);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 8, 0);
controls.maxPolarAngle = Math.PI * 0.495;

/* ---- 光 ---- */

const sun = new THREE.DirectionalLight(0xfff0d8, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
// 影を描く範囲。街全体（120）ではなく、見ている中心のまわりだけに絞る
sun.shadow.camera.left = -46;
sun.shadow.camera.right = 46;
sun.shadow.camera.top = 46;
sun.shadow.camera.bottom = -46;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 400;
sun.shadow.bias = -0.0006;
scene.add(sun);

const sky = new THREE.HemisphereLight(0xbcd4ff, 0x3a3a44, 0.9);
scene.add(sky);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshStandardMaterial({ color: 0x474b56, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ---- 街を組む ---- */

const lots = splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, makeRandom(20260730), []);
const rand = makeRandom(777);
const parts = [];
for (const lot of lots) {
  for (const box of buildingBoxes(lot, rand)) {
    const geometry = new THREE.BoxGeometry(box.w, box.h, box.d);
    scaleBoxUv(geometry, box.w, box.h, box.d);
    geometry.translate(box.x, box.y, box.z);
    const count = geometry.getAttribute('position').count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3 + 0] = box.color.r;
      colors[i * 3 + 1] = box.color.g;
      colors[i * 3 + 2] = box.color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    parts.push(geometry);
  }
}

const buildingMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.82,
  emissive: 0xffffff,
  emissiveMap: createWindowTexture(),
  emissiveIntensity: 0,
});

const buildings = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(parts), buildingMaterial);
for (const part of parts) part.dispose();
buildings.castShadow = true;
buildings.receiveShadow = true;
scene.add(buildings);

/* ---- 時刻から、光と空と窓を導く ---- */

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const NIGHT_SKY = new THREE.Color(0x0d1226);
const DAY_SKY = new THREE.Color(0x9db4d8);
const DUSK_SKY = new THREE.Color(0xd9784a);
const SUN_LOW = new THREE.Color(0xff7a3a);
const SUN_HIGH = new THREE.Color(0xfff0d8);

const sunDirection = new THREE.Vector3();
const skyColor = new THREE.Color();
const backgroundColor = new THREE.Color();

function applyTime(t) {
  // 太陽の向き。t = 0.25 で日の出、0.5 で正午、0.75 で日没
  const theta = (t - 0.25) * Math.PI * 2;
  sunDirection.set(Math.cos(theta), Math.sin(theta), 0.35).normalize();
  sun.position.copy(sunDirection).multiplyScalar(220);
  // 影の範囲は、見ている中心のまわりに置く
  sun.target.position.copy(controls.target);
  sun.target.updateMatrixWorld();

  const height = sunDirection.y;
  const daylight = smoothstep(-0.05, 0.25, height);   // 0=夜, 1=昼
  const horizon = 1 - smoothstep(0.0, 0.32, height);  // 地平線に近いほど 1

  sun.intensity = 3.2 * daylight;
  sun.color.lerpColors(SUN_LOW, SUN_HIGH, smoothstep(0.02, 0.34, height));

  // 空の色。夜 → 昼に混ぜてから、日の出・日没のオレンジを足す
  skyColor.lerpColors(NIGHT_SKY, DAY_SKY, daylight);
  backgroundColor.copy(skyColor).lerp(DUSK_SKY, horizon * daylight * 0.85);
  scene.background = backgroundColor;
  scene.fog.color.copy(backgroundColor);

  sky.intensity = 0.12 + daylight * 0.85;
  sky.color.copy(backgroundColor);

  // 窓は、太陽が沈んだぶんだけ点ける。これが夜らしさの主役
  buildingMaterial.emissiveIntensity = 1.4 * (1 - daylight);
}

/* ---- スライダー ---- */

const panel = document.createElement('div');
panel.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#fff; font:12px monospace;' +
  'text-shadow:0 0 6px rgba(0,0,0,0.9); display:flex; align-items:center; gap:8px;';

const slider = document.createElement('input');
slider.type = 'range';
slider.min = '0';
slider.max = '1';
slider.step = '0.001';
slider.value = '0.36';
slider.style.width = '220px';

const label = document.createElement('span');

const playButton = document.createElement('button');
playButton.textContent = '時間を進める';
playButton.style.cssText =
  'padding:4px 8px; background:#12121f; color:#e8e8f2; border:1px solid #3a3a5c;' +
  'border-radius:6px; font:12px sans-serif; cursor:pointer;';

panel.append(slider, label, playButton);
document.body.appendChild(panel);

let time = Number(slider.value);
let playing = false;

playButton.addEventListener('click', () => {
  playing = !playing;
  playButton.textContent = playing ? '止める' : '時間を進める';
});
slider.addEventListener('input', () => {
  time = Number(slider.value);
  playing = false;
  playButton.textContent = '時間を進める';
});

function updateLabel() {
  const minutes = Math.floor(time * 24 * 60);
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  label.textContent = hh + ':' + mm;
}

/* ---- ループ ---- */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (playing) {
    time = (time + dt * 0.04) % 1;   // 25 秒で 1 日
    slider.value = String(time);
  }

  applyTime(time);
  updateLabel();
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- 下ごしらえ：3-05, 3-06 で作ったもの（読み飛ばして可） ---- */

function makeRandom(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function splitLots(rect, rand, out) {
  const canSplitX = rect.w > MIN_LOT * 2 + ROAD;
  const canSplitZ = rect.d > MIN_LOT * 2 + ROAD;
  if (!canSplitX && !canSplitZ) { out.push(rect); return out; }
  const alongX = canSplitX && (!canSplitZ || rect.w >= rect.d);
  const length = alongX ? rect.w : rect.d;
  const cut = length * (0.35 + rand() * 0.3);
  if (alongX) {
    splitLots({ x: rect.x, z: rect.z, w: cut - ROAD / 2, d: rect.d }, rand, out);
    splitLots({ x: rect.x + cut + ROAD / 2, z: rect.z, w: rect.w - cut - ROAD / 2, d: rect.d }, rand, out);
  } else {
    splitLots({ x: rect.x, z: rect.z, w: rect.w, d: cut - ROAD / 2 }, rand, out);
    splitLots({ x: rect.x, z: rect.z + cut + ROAD / 2, w: rect.w, d: rect.d - cut - ROAD / 2 }, rand, out);
  }
  return out;
}

function buildingBoxes(lot, rand) {
  const cx = lot.x + lot.w / 2;
  const cz = lot.z + lot.d / 2;
  const r = Math.min(1, Math.hypot(cx, cz) / (CITY * 0.62));
  const height = 58 * Math.pow(1 - r, 1.8) * (0.45 + rand() * 0.75) + 3.5;
  const stages = height > 26 ? 3 : (height > 14 ? 2 : 1);
  const fractions = stages === 3 ? [0.55, 0.3, 0.15] : (stages === 2 ? [0.7, 0.3] : [1]);
  const color = new THREE.Color(PALETTE[Math.floor(rand() * PALETTE.length)]);
  color.offsetHSL(0, 0, (rand() - 0.5) * 0.08);

  const boxes = [];
  let w = Math.max(1.6, lot.w - SIDEWALK * 2);
  let d = Math.max(1.6, lot.d - SIDEWALK * 2);
  let bottom = 0.35;
  for (let s = 0; s < stages; s++) {
    const h = height * fractions[s];
    boxes.push({ x: cx, y: bottom + h / 2, z: cz, w: w, h: h, d: d, color: color });
    bottom += h;
    w *= 0.72;
    d *= 0.72;
  }
  return boxes;
}

function createWindowTexture() {
  const cell = 16;
  const grid = 8;
  const canvas = document.createElement('canvas');
  canvas.width = cell * grid;
  canvas.height = cell * grid;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const rand = makeRandom(4242);
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      if (gx === 0 && gy === 0) continue;
      if (rand() > 0.55) continue;
      const level = 150 + Math.floor(rand() * 105);
      ctx.fillStyle = 'rgb(' + level + ',' + Math.floor(level * 0.86) + ',' + Math.floor(level * 0.6) + ')';
      ctx.fillRect(gx * cell + cell * 0.22, gy * cell + cell * 0.2, cell * 0.56, cell * 0.5);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

function scaleBoxUv(geometry, w, h, d) {
  const uv = geometry.getAttribute('uv');
  const cols = (size) => Math.max(1, Math.round(size / 2.4)) / 8;
  const rows = Math.max(1, Math.round(h / 3.4)) / 8;
  const faces = [
    { u: cols(d), v: rows }, { u: cols(d), v: rows },
    null, null,
    { u: cols(w), v: rows }, { u: cols(w), v: rows },
  ];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const at = f * 4 + i;
      if (faces[f] === null) uv.setXY(at, 0.06, 0.06);
      else uv.setXY(at, uv.getX(at) * faces[f].u, uv.getY(at) * faces[f].v);
    }
  }
}
`,
      caption:
        'スライダーを 0 付近（深夜）と 0.5（正午）で往復させてください。窓の明かりが夜だけ点き、日の出と日没で街が赤くなります。`buildingMaterial.emissiveIntensity` の行を消すと、夜が「ただの薄暗い昼」に落ちるのが分かります。時刻 0.26 あたりの、影がいちばん長い瞬間がいちばんきれいです。',
    },
    {
      kind: 'md',
      text: `
## 影の範囲 ― 街全体は写せない

影で必ずぶつかる壁があります。**街は 120 の広さなのに、影の記録は 1 枚の画像しかない。**

[](#/ch/t05-light-shadow)でやったとおり、影は「光から見たカメラ」で撮った距離の記録です。
そのカメラの範囲を街全体（±70）に広げると、2048×2048 の記録でも
**1 ピクセルが 7 センチ四方ぶんの面積**を受け持つことになり、影のふちがギザギザになります。

打つ手は 3 つあります。

- **範囲を狭めて、見ている場所のまわりだけ影を出す。** いちばん効きます
- **フォグで遠くを隠す。** 影が無いことに気づかせない
- **遠くの影を諦める。** ゲームでも普通にやっています

このコードでは 1 つめを採り、\`sun.target\` を **\`controls.target\`（＝いま見ている場所）に
追従させて**います。カメラを動かすと影の範囲もついてきます。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'DirectionalLight の影は position だけでは決まりません',
      text: `
\`DirectionalLight\` の光は「\`position\` から \`target\` へ向かう向き」です。
既定の \`target\` は原点に置かれています。

影の範囲（\`shadow.camera\`）は **target を中心に**取られるので、
target を動かさないまま position だけを動かすと、**影の範囲は原点のまわりから動きません。**

\`light.target.position\` を書き換えたら、\`light.target.updateMatrixWorld()\` を呼んでください。
target は \`scene\` に追加されていないので、three が自動では更新してくれません。
`,
    },
    {
      kind: 'sandbox',
      title: '影の範囲を切り替えて、粗さを見比べる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ba6cc);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 400);
camera.position.set(-16, 13, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2, 0);
controls.maxPolarAngle = Math.PI * 0.495;

// 影の記録はわざと小さめにして、差を分かりやすくする
const SHADOW_MAP = 1024;

const sun = new THREE.DirectionalLight(0xfff0d8, 3);
sun.position.set(14, 18, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(SHADOW_MAP, SHADOW_MAP);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 120;
sun.shadow.bias = -0.0005;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xbcd4ff, 0x44444e, 0.7));

const helper = new THREE.CameraHelper(sun.shadow.camera);
scene.add(helper);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ color: 0x6f7480, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 手前に数棟、確認用に置く
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xc9cdd6, roughness: 0.8 });
const layout = [
  [0, 6, 0, 4], [-7, 9, 3, 3.4], [6, 4, -5, 4.6], [-4, 3.5, -7, 3], [8, 7, 6, 3.2],
];
for (const item of layout) {
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.scale.set(item[3], item[1], item[3]);
  box.position.set(item[0], item[1] / 2, item[2]);
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
}

/* ---- 範囲の切り替え ---- */

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#0b1220; font:12px monospace;' +
  'pointer-events:none; white-space:pre;';
document.body.appendChild(readout);

function setRange(half) {
  sun.shadow.camera.left = -half;
  sun.shadow.camera.right = half;
  sun.shadow.camera.top = half;
  sun.shadow.camera.bottom = -half;
  // 投影の設定を変えたら、必ず組み直す（1-10 と同じ話）
  sun.shadow.camera.updateProjectionMatrix();
  helper.update();

  const meters = (half * 2) / SHADOW_MAP;
  readout.textContent =
    '影の範囲 ±' + half + '\\n記録 ' + SHADOW_MAP + 'x' + SHADOW_MAP +
    '\\n1 画素が受け持つ幅 ' + meters.toFixed(3);
}

function addButton(text, left, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText =
    'position:absolute; bottom:82px; left:' + left + 'px; padding:6px 10px;' +
    'background:#12121f; color:#e8e8f2; border:1px solid #3a3a5c; border-radius:6px;' +
    'font:12px sans-serif; cursor:pointer;';
  button.addEventListener('click', onClick);
  document.body.appendChild(button);
}

addButton('街全体をカバー（±70）', 12, () => setRange(70));
addButton('見ている場所だけ（±14）', 186, () => setRange(14));

setRange(70);

function animate() {
  requestAnimationFrame(animate);
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
        '±70 では影のふちがギザギザで、箱の足元がにじみます。±14 に切り替えると、同じ 1024×1024 の記録でくっきりします。白い枠が「光から見たカメラ」の範囲です。±14 では枠の外に出た箱の影が消えることにも注目してください ― これが「遠くの影を諦める」の正体です。',
    },
    {
      kind: 'md',
      text: `
## 街灯を、ライトを増やさずに置く

夜の街に街灯を置きたくなります。ところが[](#/ch/t05-light-shadow)でやったとおり、
**ライトを 1 つ増やすとすべてのマテリアルの計算が増えます。** 街灯を 200 個置いたら終わりです。

実際に使われる手はこうです。

- **光っている板を置く。** \`MeshBasicMaterial\` の小さな面。周りを照らさないが、**光源そのものは見える**
- **地面に丸い明かりを描く。** 半透明の円を伏せて置くだけ。照らされているように見える
- **{{加算ブレンド}}で光の芯を足す。** [](#/ch/p03-planet-atmosphere)の大気と同じやり方

**「照らす」ことと「光って見える」ことは別**だと割り切るのが、この手の節約の勘所です。
夜景の写真を思い出すと、実際に見えているのは**光源と、その周りのにじみ**だけです。
`,
    },
    {
      kind: 'md',
      text: `
## 空の色を、真っ黒にしない

最後に細かいけれど効く話をします。**夜空を真っ黒（\`0x000000\`）にしないでください。**

真っ黒にすると、建物の輪郭が背景に溶けて**形が読めなくなります。**
実際の夜空も、街の明かりを反射して青紫に濁っています。

このコードでは \`0x0d1226\` を使っています。ほとんど黒ですが、**わずかに青い。**
これだけで建物のシルエットが背景から立ち上がります。

第1部のスタイルの話で「色を唯一の情報チャネルにしない」と書きましたが、
**輪郭が見えることも情報**です。夜の場面では、ここがいちばん壊れやすい場所です。
`,
    },
  ],
  exercises: [
    {
      prompt: `時刻のスライダーをゆっくり動かし、**窓の明かりが点きはじめる瞬間**を探してください。
そのとき、空・太陽の色・影の長さは、それぞれどうなっていますか。`,
      hint: '窓は「太陽が沈んだぶんだけ」点きます。',
      answer: `日没のあたり（太陽の高さが 0 を割るころ）から、空がオレンジから紺に落ちるのに合わせて点きはじめます。
**5 つのものが、すべて 1 つの値 \`t\` から導かれている**のがこの章の要点です。
バラバラに調整していたら、夕焼けなのに窓が真っ暗、といった食い違いが必ず出ます。
**1 つの値から全部を導く**と、どこを切り取っても辻褄が合います。`,
    },
    {
      prompt: '影の範囲を切り替えるサンドボックスで、範囲を街全体（120）にしたときと、見ている中心のまわりだけにしたときの影を見比べてください。解像度は同じです。',
      hint: '同じ枚数の記録を、広い面積に配るか狭い面積に配るかの違いです。',
      answer: `範囲を狭めたほうが**はっきり**します。影の記録の大きさは同じなので、狭い範囲に配ったほうが 1 メートルあたりの密度が上がるからです。
広い世界で影をきれいに出す定石は、**影の範囲をカメラに追従させて、見ているあたりだけに絞る**ことです。
そのとき \`shadow.camera\` を書き換えたら、\`updateProjectionMatrix()\` を忘れないでください（[](#/ch/10-camera) と同じ話です）。`,
    },
  ],
  quiz: [
    {
      q: '空の色・太陽の強さ・窓の明かりを、それぞれ別の変数で持つと何が起きますか。',
      choices: [
        'どれかを直したときに食い違いが出る（朝焼けなのに窓が消えているなど）',
        '描画が重くなる',
        '影が出なくなる',
        'メモリが増える',
      ],
      answer: 0,
      explain:
        '時刻という1つの値から全部を導けば、食い違いようがありません。派生させられるものを別々に持たないのは、章のデータでも同じ考え方です。',
    },
    {
      q: '`DirectionalLight` の `position` を動かしたのに、影の範囲が付いてきません。原因はどれですか。',
      choices: [
        '影の範囲は `light.target` を中心に取られるので、target も動かす必要がある',
        '`shadow.mapSize` が小さい',
        '`castShadow` が false',
        '`shadowMap.enabled` が false',
      ],
      answer: 0,
      explain:
        'DirectionalLight の光は position から target への向きで、影のカメラは target を中心に置かれます。target の position を書き換えたら `updateMatrixWorld()` も呼んでください（target は scene に入っていないので自動更新されません）。',
    },
    {
      q: '夜の街に街灯を 200 個置きたいとき、`PointLight` を 200 個使うのが良くない理由はどれですか。',
      choices: [
        'ライトの数だけ全マテリアルの計算が増えて、描画が破綻する',
        '影が出ないから',
        '色が混ざるから',
        'ドローコールが増えるから',
      ],
      answer: 0,
      explain:
        'ライトはドローコールを増やしませんが、シェーダの計算量を増やします。「光って見える」だけなら、光る板や加算ブレンドのにじみで足ります。周りを実際に照らす必要があるものだけをライトにしてください。',
    },
  ],
};
