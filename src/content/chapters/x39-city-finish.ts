import type { Chapter } from '../types.ts';

export const chapterX39: Chapter = {
  slug: 'x39-city-finish',
  part: 'project',
  number: 39,
  title: 'ローポリの街（完成）と、公開',
  goal: '$15$ 章ぶんの部品が $1$ つのシーンとしてどう並ぶかを読めるようになり、作ったものを公開できる形にするまでの段取りを持てるようになります。',
  requires: ['x38-chunked-merge', 'w40-dispose'],
  threeApis: ['WebGLRenderer.info', 'WebGLRenderer.setAnimationLoop', 'Object3D.traverse'],
  mathRecall: [
    { slug: 'p07-city-light', note: '時刻 $1$ つから、全部が導かれている' },
    { slug: 'x38-chunked-merge', note: '区画ごとの合体。カリングが効く' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 15 章ぶんを、1 つのファイルで読む

これがローポリの街の完成品です。上から順に、こう並んでいます。

| 区画 | 作った章 |
|---|---|
| 決め打ちの乱数・土地の分割 | [](#/ch/x21-seeded-random)・[](#/ch/x22-subdivision) |
| 街区と道路（隙間） | [](#/ch/x23-roads) |
| 建物の高さ・色・窓 | [](#/ch/p06-city-buildings)・[](#/ch/x28-window-uv) |
| 区画ごとの合体 | [](#/ch/x38-chunked-merge) |
| 経路と車 | [](#/ch/p08-city-motion)〜[](#/ch/x37-car-instancing) |
| 時刻から導く光・空・影・窓 | [](#/ch/p07-city-light)〜[](#/ch/x34-street-lights) |

**新しいものは、$1$ つも足していません。**
時刻のスライダーだけが、この章で付いたものです。
`,
    },
    {
      kind: 'sandbox',
      title: 'ローポリの街（完成）',
      guide: { focus: ['車'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const CITY = 120;
const ROAD = 3.2;
const MIN_LOT = 9;
const SIDEWALK = 0.9;
const CHUNKS = 4;          // 街を 4x4 に分けて合体する
const CAR_COUNT = 44;
const PALETTE = [0x6b7280, 0x7c7468, 0x5f6b7a, 0x8a8378, 0x4f5560, 0x6e6a74];
const CAR_COLORS = [0xff6b8a, 0x4fd6ff, 0xffd166, 0xe8e8f2, 0x7cf5a0, 0xb57bff];

/* ---- シーン ---- */

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9db4d8, 70, 320);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 800);
camera.position.set(-58, 44, 72);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 4, 0);
controls.maxPolarAngle = Math.PI * 0.495;
controls.maxDistance = 220;

const sun = new THREE.DirectionalLight(0xfff0d8, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -46;
sun.shadow.camera.right = 46;
sun.shadow.camera.top = 46;
sun.shadow.camera.bottom = -46;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 500;
sun.shadow.bias = -0.0006;
scene.add(sun);

const sky = new THREE.HemisphereLight(0xbcd4ff, 0x3a3a44, 0.9);
scene.add(sky);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1200, 1200),
  new THREE.MeshStandardMaterial({ color: 0x474b56, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ---- 街区と建物 ---- */

const lots = splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, makeRandom(20260730), []);
const rand = makeRandom(777);

// 置く場所で 4x4 の区画に振り分ける。これで視錐台カリングが効く
const buckets = [];
for (let i = 0; i < CHUNKS * CHUNKS; i++) buckets.push([]);

const chunkSize = CITY / CHUNKS;
let boxTotal = 0;

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

    const gx = Math.min(CHUNKS - 1, Math.max(0, Math.floor((box.x + CITY / 2) / chunkSize)));
    const gz = Math.min(CHUNKS - 1, Math.max(0, Math.floor((box.z + CITY / 2) / chunkSize)));
    buckets[gz * CHUNKS + gx].push(geometry);
    boxTotal += 1;
  }
}

const buildingMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.82,
  emissive: 0xffffff,
  emissiveMap: createWindowTexture(),
  emissiveIntensity: 0,
});

let chunkMeshes = 0;
for (const bucket of buckets) {
  if (bucket.length === 0) continue;
  const merged = BufferGeometryUtils.mergeGeometries(bucket);
  for (const part of bucket) part.dispose();

  const mesh = new THREE.Mesh(merged, buildingMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  chunkMeshes += 1;
}

/* ---- 車 ---- */

function lotLoop(lot, offset, y) {
  const x0 = lot.x - offset;
  const x1 = lot.x + lot.w + offset;
  const z0 = lot.z - offset;
  const z1 = lot.z + lot.d + offset;
  const mx = (x0 + x1) / 2;
  const mz = (z0 + z1) / 2;
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(x0, y, z0), new THREE.Vector3(mx, y, z0),
    new THREE.Vector3(x1, y, z0), new THREE.Vector3(x1, y, mz),
    new THREE.Vector3(x1, y, z1), new THREE.Vector3(mx, y, z1),
    new THREE.Vector3(x0, y, z1), new THREE.Vector3(x0, y, mz),
  ], true, 'catmullrom', 0.25);
}

// 大きい街区から順に選ぶ（大通りに面しているほうが見栄えがよい）
const routeLots = lots.slice().sort((a, b) => b.w * b.d - a.w * a.d).slice(0, CAR_COUNT);

const carRand = makeRandom(31337);
const cars = [];
for (let i = 0; i < routeLots.length; i++) {
  const route = lotLoop(routeLots[i], ROAD * 0.42, 0.05);
  // 経路の長さで割る。こうすると、大きい街区でも小さい街区でも「同じ速さ」で走る
  const length = route.getLength();
  cars.push({
    route: route,
    u: carRand(),
    speed: (3.4 + carRand() * 2.6) / length,
    color: new THREE.Color(CAR_COLORS[Math.floor(carRand() * CAR_COLORS.length)]),
  });
}

// 車体と屋根で 2 つの InstancedMesh。台数が増えてもドローコールは 2 回
const bodyMesh = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1.1, 0.5, 2.4),
  new THREE.MeshStandardMaterial({ roughness: 0.45 }),
  cars.length,
);
const roofMesh = new THREE.InstancedMesh(
  new THREE.BoxGeometry(0.95, 0.4, 1.2),
  new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.4 }),
  cars.length,
);
bodyMesh.castShadow = true;
roofMesh.castShadow = true;
scene.add(bodyMesh, roofMesh);

for (let i = 0; i < cars.length; i++) bodyMesh.setColorAt(i, cars[i].color);
bodyMesh.instanceColor.needsUpdate = true;

/* ---- 時刻から光を導く（3-07） ---- */

const NIGHT_SKY = new THREE.Color(0x0d1226);
const DAY_SKY = new THREE.Color(0x9db4d8);
const DUSK_SKY = new THREE.Color(0xd9784a);
const SUN_LOW = new THREE.Color(0xff7a3a);
const SUN_HIGH = new THREE.Color(0xfff0d8);

const sunDirection = new THREE.Vector3();
const skyColor = new THREE.Color();
const backgroundColor = new THREE.Color();

function applyTime(t) {
  const theta = (t - 0.25) * Math.PI * 2;
  sunDirection.set(Math.cos(theta), Math.sin(theta), 0.35).normalize();
  sun.position.copy(sunDirection).multiplyScalar(260);
  sun.target.position.copy(controls.target);
  sun.target.updateMatrixWorld();

  const height = sunDirection.y;
  const daylight = smoothstep(-0.05, 0.25, height);
  const horizon = 1 - smoothstep(0.0, 0.32, height);

  sun.intensity = 3.2 * daylight;
  sun.color.lerpColors(SUN_LOW, SUN_HIGH, smoothstep(0.02, 0.34, height));

  skyColor.lerpColors(NIGHT_SKY, DAY_SKY, daylight);
  backgroundColor.copy(skyColor).lerp(DUSK_SKY, horizon * daylight * 0.85);
  scene.background = backgroundColor;
  scene.fog.color.copy(backgroundColor);

  sky.intensity = 0.12 + daylight * 0.85;
  sky.color.copy(backgroundColor);
  buildingMaterial.emissiveIntensity = 1.4 * (1 - daylight);
}

/* ---- 表示 ---- */

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:44px; color:#fff; font:12px monospace;' +
  'text-shadow:0 0 6px rgba(0,0,0,0.9); pointer-events:none; white-space:pre;';
document.body.appendChild(readout);

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
slider.style.width = '180px';
const label = document.createElement('span');
panel.append(slider, label);
document.body.appendChild(panel);

/* ---- ループ ---- */

const dummy = new THREE.Object3D();
const lookTarget = new THREE.Vector3();
const clock = new THREE.Clock();
let time = Number(slider.value);
let manual = false;

slider.addEventListener('input', () => {
  time = Number(slider.value);
  manual = true;
});

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (!manual) {
    time = (time + dt * 0.012) % 1;   // 放っておくと 80 秒で 1 日
    slider.value = String(time);
  }
  applyTime(time);

  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    car.u = (car.u + dt * car.speed) % 1;

    const position = car.route.getPointAt(car.u);
    const tangent = car.route.getTangentAt(car.u);

    dummy.position.set(position.x, 0.3, position.z);
    lookTarget.set(position.x + tangent.x, 0.3, position.z + tangent.z);
    dummy.lookAt(lookTarget);
    dummy.updateMatrix();
    bodyMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.y = 0.73;
    dummy.updateMatrix();
    roofMesh.setMatrixAt(i, dummy.matrix);
  }
  bodyMesh.instanceMatrix.needsUpdate = true;
  roofMesh.instanceMatrix.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);

  const minutes = Math.floor(time * 24 * 60);
  label.textContent =
    String(Math.floor(minutes / 60)).padStart(2, '0') + ':' +
    String(minutes % 60).padStart(2, '0');

  const info = renderer.info.render;
  readout.textContent =
    '建物の箱 ' + boxTotal + ' 個 / 区画 ' + chunkMeshes + ' 個\\n' +
    '車 ' + cars.length + ' 台\\nドローコール ' + info.calls;
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- 下ごしらえ：3-05 〜 3-07 で作ったもの（読み飛ばして可） ---- */

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

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
`,
      caption:
        '放っておくと $80$ 秒で $1$ 日がめぐります。スライダーを動かすと自動送りが止まります。**街に寄ってからカメラを回すと、ドローコールの数字が動きます** ― [](#/ch/x38-chunked-merge)で入れた区画分割が効いている証拠です（引くと街全体が視野に入るので、数字は止まります）。なお衝突判定はしていないので、交差点で車どうしがすれ違います。**コードの地図で色が付いているところが、この章で足したぶんです。** 残りは[](#/ch/p05-city-layout)から[](#/ch/x38-chunked-merge)までの $14$ 章で作ったもので、下ごしらえは末尾にまとめてあります。',
    },
    {
      kind: 'md',
      text: `
## 影の落とし方に、1 つ手を抜いています

正直に書いておきます。**車は影を落としていません。**

$44$ 台ぶんの影を焼くと、影のカメラから見た描画が
$44$ 回ぶん増えます。遠景では車の影は数画素にしかならないので、
**払う額に見合いません。**

同じ理由で、**街灯も光源ではありません**（[](#/ch/x34-street-lights)）。

**手を抜いた場所は、書き残してください。**
半年後の自分が「なぜ車に影が無いのか」を調べ直さずに済みます。
そして、**寄る作品に作り替えるときに、真っ先に見直す場所**でもあります。
`,
    },
    {
      kind: 'md',
      text: `
## 公開する

作ったものを人に見せられる形にするのが、[](#/ch/q01-environment)からの第5部です。
その前に、この街を公開するなら最低限これだけは要ります。

- **読み込み中を見せる。** テクスチャの生成に数百ミリ秒かかります。
  真っ白のまま待たせないこと（[](#/ch/w36-loading-ui)）
- **画面を離れたら止める。** \`setAnimationLoop(null)\` で描画を止め、
  電池とファンを守ります
- **後片付け。** 別のページへ移るときに \`dispose()\`（[](#/ch/w40-dispose)）
- **種を URL に載せる。** 気に入った街を人に渡せます（[](#/ch/x21-seeded-random)）

$4$ つとも、作品の中身ではありません。
**それでも、これが無いものは「作品」ではなく「デモ」です。**
`,
    },
    {
      kind: 'md',
      text: `
## 第4部で手に入れたもの

$39$ 章かけて、作品を $2$ つ作りました。

**惑星ビューアー**（$19$ 章）

- $3$ 次元ノイズから地表・雲・街の明かり
- 内積 $1$ つから大気の縁と昼夜境界
- 傾いた自転、公転、クリックで寄る視点

**ローポリの街**（$20$ 章）

- 決め打ちの乱数と再帰的な分割から街区
- 構造 × ばらつきで建物
- 時刻 $1$ つから光・空・影・窓
- 曲線に沿う車を、$3$ 回の描画で

**画像もモデルも、$1$ つも使っていません。**

そして、新しい数学もほとんど出てきませんでした。
第1部と第2部で手を動かしたもの ― 内積・三角関数・行列・補間・乱数・再帰 ―
が、そのまま形になっています。

**足りなかったのは知識ではなく、それを組み立てる順番だけ**でした。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ここから先へ',
      text: `
第5部では、この $2$ つを「見せられるもの」に仕上げます。

- **環境マップ**（[](#/ch/q01-environment)）… 金属が黒い理由と、その直し方
- **色の通り道**（[](#/ch/q02-color)）… リニアワークフローとトーンマッピング
- **ポストプロセス**（[](#/ch/q03-postprocess)）… ブルームと、自分で書くパス
- **アプリにする**（[](#/ch/q05-ship-it)）… 品質プリセット・読み込み・公開

**作るところまでは、ここで終わりです。**
残っているのは、**人に見せるまでの距離**です。
`,
    },
  ],
  exercises: [
    {
      prompt: `完成版で、ドローコールがカメラの向きによって変わります。

いくつからいくつまで動きますか。そして、動かなくなったら何を疑いますか。`,
      hint: '区画は $4 \\times 4$ です。地面と車も数えてください。',
      answer: `**おおむね $8$ から $20$ のあいだで動きます。**

**内訳**

- 建物の区画 … $16$ のうち視界に入る $4$〜$6$（＋影の描画ぶん）
- 車 … $3$（車体・屋根・鼻先）
- 地面 … $1$
- 影の描画 … 上と同じものを、光から見てもう $1$ 回

影のパスがあるので、実際の \`calls\` は素朴な予想の $2$ 倍近くになります。

**動かなくなったら**

- **\`CHUNKS\` が $1$ になっている。** 街全体が $1$ つなら、どこを向いても同じ
- **\`frustumCulled = false\` を立てた物がある。** その物は必ず描かれます
- **全部が視界に入っている。** 引きすぎているだけかもしれません

$3$ つめは、**カメラを寄せれば確かめられます。**
寄っても数字が動かないなら、$1$ つめか $2$ つめです。

**数字が動くこと自体が、テストになっている**

「カリングが効いているか」を確かめるのに、
プロファイラも計測コードも要りません。

**画面に \`calls\` を出して、カメラを回すだけ**です。`,
    },
    {
      prompt: `この街を公開するとして、いちばん最初に足すべきものは何ですか。

理由も答えてください。`,
      hint: 'テクスチャの生成には数百ミリ秒かかります。',
      answer: `**読み込み中の表示です。**

**なぜ最初か**

街を開いた人が最初に見るのは、**数百ミリ秒の真っ白な画面**です。

- ノイズから窓のテクスチャを焼く
- $54$ の街区を割る
- $80$ 個の箱を作って合体する

この間、何も出ません。

**回線が遅い環境では、その前に $600$ KB のスクリプトの読み込みもあります。**

**何が起きるか**

$1$ 秒の白い画面は、**「壊れている」と読まれます。**

作品がどれだけ良くても、**そこまで到達してもらえません。**

**いちばん安い解決**

$HTML$ 側に「読み込み中」の文字を置いておき、
最初の描画が終わったら消すだけです ― $5$ 行で済みます。

進捗の割合まで出す必要はありません。
**「動いている」ことが伝われば十分**です。

**次に足すもの**

- **画面を離れたら止める**（電池）
- **種を $URL$ に載せる**（人に渡せる）

$3$ つとも作品の中身ではありませんが、
**これが無いものは作品ではなくデモ**です。`,
    },
    {
      prompt: `第4部の $2$ つの作品で、**同じ道具が別の目的に使われた**例を $3$ つ挙げてください。`,
      hint: '内積、$\\mathrm{smoothstep}$、乱数。',
      answer: `**内積・$\\mathrm{smoothstep}$・乱数が、それぞれ何度も出てきました。**

**内積**

- 大気の厚み（[](#/ch/x11-atmosphere-rim)）… 視線と法線
- 昼夜の境目（[](#/ch/x14-terminator)）… 太陽と法線
- 街の昼夜（[](#/ch/p07-city-light)）… 太陽の高さ、つまり $y$ 成分

$3$ つとも「向きの一致度」ですが、
**厚み・時刻・明るさ**という別のものになりました。

**$\\mathrm{smoothstep}$**

- 雲のふち（[](#/ch/x13-clouds)）
- 昼夜の境目（[](#/ch/x14-terminator)・[](#/ch/x31-sun-height)）
- 空の色の混ぜ具合（[](#/ch/x33-sky-fog)）

どれも「境目に幅を持たせる」で、
**ナイフで切ったような境目を消す**という同じ仕事です。

**乱数**

- 星の配置（[](#/ch/x03-uniform-sphere)）… 球面に一様に
- 地表・雲（[](#/ch/x06-value-noise)）… 格子に置いて補間
- 街区の分割（[](#/ch/x21-seeded-random)）… 決め打ちで再現できる
- 建物の高さ（[](#/ch/p06-city-buildings)）… 構造の上のばらつき

**道具の数は少ないのです。**

新しいことをするたびに新しい道具を覚えるのではなく、
**持っている道具の、別の使い方を見つける** ―
第4部でやったのは、ほとんどそれでした。`,
    },
  ],
  quiz: [
    {
      q: '完成版でカメラを回すとドローコールの数字が動くのはなぜですか。',
      choices: [
        '建物を 4×4 の区画ごとに合体してあるので、視界の外の区画が省かれるから',
        '車が視界から出入りするから',
        'three が自動で最適化するから',
        'フォグで遠くが描かれなくなるから',
      ],
      answer: 0,
      explain:
        '視錐台カリングは物体単位で効きます。街全体を 1 つに合体していたら、どこを向いても同じ回数になります。数字が動くこと自体が「カリングが効いている」テストになっていて、プロファイラも計測コードも要りません。',
    },
    {
      q: 'この街で、意図的に手を抜いている場所はどれですか。',
      choices: [
        '車が影を落としていない。44 台ぶんの影の描画は、遠景では割に合わないから',
        '建物に影が無い',
        '窓が光らない',
        '道路が描かれていない',
      ],
      answer: 0,
      explain:
        '車の影を出すと影のカメラから見た描画が 44 回ぶん増えますが、遠景では数画素にしかなりません。街灯を光源にしていないのも同じ判断です。手を抜いた場所は書き残しておくと、半年後に調べ直さずに済み、寄る作品に作り替えるときに真っ先に見直す場所にもなります。',
    },
    {
      q: 'この街を公開するとき、作品の中身ではないが必要になるものはどれですか。',
      choices: [
        '読み込み中の表示・画面を離れたら止める・後片付け・種を URL に載せる',
        'より高解像度のテクスチャ',
        '車の衝突判定',
        '交差点で曲がる経路',
      ],
      answer: 0,
      explain:
        'テクスチャの生成に数百ミリ秒かかるので、その間の白い画面は「壊れている」と読まれます。作品がどれだけ良くても、そこまで到達してもらえません。4 つとも中身ではありませんが、これが無いものは作品ではなくデモです。',
    },
  ],
};
