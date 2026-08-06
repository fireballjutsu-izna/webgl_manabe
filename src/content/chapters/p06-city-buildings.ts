import type { Chapter } from '../types.ts';

export const chapterP06: Chapter = {
  slug: 'p06-city-buildings',
  part: 'project',
  number: 21,
  title: 'ローポリの街 ― 建物を生やす',
  goal: '数百棟の建物を1回のドローコールで描けるようになり、まとめたあとでも1棟ずつ色を変えられるようになります。',
  requires: ['p05-city-layout', 't11-performance', 't02-geometry'],
  threeApis: [
    'BufferGeometryUtils',
    'BufferGeometry.translate',
    'BufferGeometry.setAttribute',
    'BufferAttribute',
    'Material.vertexColors',
    'MeshStandardMaterial.emissiveMap',
    'CanvasTexture',
    'Texture.wrapS',
    'WebGLRenderer.info',
  ],
  mathRecall: [
    { slug: 't11-performance', note: 'ドローコールを 1 回にまとめる' },
    { slug: 't02-geometry', note: '頂点の属性は自分で足せる' },
    { slug: 't04-texture', note: 'UV は書き換えられる' },
    { slug: '13-random', note: '高さと色のばらつき' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 建物の高さは、どこから決めるか

街区は切れました。あとはそこに建物を生やすだけですが、
**高さをどう決めるか**で街の顔が決まります。

乱数だけで決めると、**低い建物と高い建物が無秩序に混ざって「街」に見えません。**
実際の都市には構造があります。**都心に近いほど高い。** これだけ入れると一気に街になります。

つまり高さは 2 つの掛け算です。

- **場所で決まる部分** … 中心からの距離。都心が高く、郊外が低い
- **ばらつき** … 同じ場所でも建物ごとに違う（乱数）
`,
    },
    {
      kind: 'formula',
      tex: 'h = h_{\\max} \\cdot (1 - r)^{1.8} \\cdot (0.45 + 0.75\\,\\xi)',
      readAloud:
        'r は中心からの距離を 0〜1 にしたもの、ξ は 0〜1 の一様乱数です。1 引く r を 1.8 乗しているのは、都心の高さを際立たせるためです。1 乗（そのまま）にすると高さがなだらかに減って、都心らしさが出ません。',
      worked: {
        given: '$h_{\\max} = 30$、$\\xi = 0.5$ に固定して、都心からの距離だけを変えます。',
        steps: [
          { calc: '乱数のぶん : 0.45 + 0.75 x 0.5 = 0.825' },
          { calc: 'r = 0   : (1-0) の1.8乗 = 1' },
          { calc: '          30 x 1     x 0.825 = 24.8', note: '都心' },
          { calc: 'r = 0.5 : (0.5) の1.8乗 = 0.287' },
          { calc: '          30 x 0.287 x 0.825 = 7.1', note: '中間' },
          { calc: 'r = 1   : 0 の1.8乗 = 0  →  高さ 0', note: '街の端' },
        ],
        result: '**24.8 → 7.1 → 0。** もし 1.8 乗ではなく 1 乗（そのまま）にすると、中間は $30 \\times 0.5 \\times 0.825 = 12.4$ になり、都心との差が半分しか付きません。**1.8 という指数ひとつで「都心らしさ」が出ています。**',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '「それらしさ」は、たいてい1つの構造から出る',
      text: `
中心からの距離で高さを決める、というたった 1 行が効きます。
ここに乱数を足すと、**構造の上にばらつきが乗った**状態になります。

手続き的生成でうまくいかないときは、たいてい**構造が無くて乱数だけ**になっています。
逆に構造だけだと機械的です。**構造 × ばらつき**が基本の形です。
`,
    },
    {
      kind: 'md',
      text: `
## セットバック ― 上に行くほど細くする

箱を 1 つ置くだけだと、のっぺりした直方体が並びます。
高い建物だけ、**上に行くほど footprint を小さくした箱を積む**と、ぐっと街らしくなります。

- 高さ 14 未満 … 箱 1 つ
- 14〜26 … 2 段
- 26 以上 … 3 段（下から 55 / 30 / 15 パーセントの高さ、footprint は 0.72 倍ずつ）

これは単なる見た目の工夫ではなく、実際の高層建築が
日照や斜線制限のためにやっている形です。だから「見たことがある形」になります。
`,
    },
    {
      kind: 'md',
      text: `
## まとめて1回で描く ― ただし色は残す

ここが本題です。建物が 200 棟、箱が 350 個あったら、
素直にメッシュを作れば **350 回のドローコール**です。

[](#/ch/t11-performance)でやったとおり、**動かないものは合体させます**（\`mergeGeometries\`）。
これで 1 回になります。ところが、合体すると困ることが 1 つ出ます。

**マテリアルが 1 つになるので、建物ごとに色を変えられません。**

解決は{{attribute}}です。[](#/ch/t12-shader-intro)でやったとおり、
attribute は「頂点ごとに違う値」を持てます。
そこで**合体する前に、それぞれの箱へ「色」の attribute を書き込んでおきます。**
マテリアル側で \`vertexColors: true\` にすれば、1 つのマテリアルのまま色がばらけます。
`,
    },
    {
      kind: 'code',
      title: '合体する前に、色を頂点へ焼き込む',
      code: `const geometry = new THREE.BoxGeometry(w, h, d);
geometry.translate(x, y, z);          // 合体前に、それぞれの位置へ動かしておく

// 24 個の頂点すべてに、この建物の色を書き込む
const color = new THREE.Color(0x6b7280);
const count = geometry.getAttribute('position').count;
const colors = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  colors[i * 3 + 0] = color.r;
  colors[i * 3 + 1] = color.g;
  colors[i * 3 + 2] = color.b;
}
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// ...これを全部集めて
const merged = BufferGeometryUtils.mergeGeometries(parts);
const material = new THREE.MeshStandardMaterial({ vertexColors: true });
scene.add(new THREE.Mesh(merged, material));   // ドローコールは 1 回`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '合体するものは、属性を揃えておくこと',
      text: `
\`mergeGeometries\` は、**すべてのジオメトリが同じ属性を持っている**ことを求めます。
1 つだけ \`color\` を付け忘れると、その場で失敗します（\`null\` が返ってきて、
次の行で「そんなものは無い」と怒られます）。

属性を足すのは**必ず全部に**。そして \`translate\` は**合体する前に**やります。
合体後は 1 つの物体なので、もう個別には動かせません。
`,
    },
    {
      kind: 'sandbox',
      title: '個別に描く / まとめて描く（ボタンで切り替え）',
      guide: { focus: ['1つの街区から、積み上げる箱の一覧を作る', '箱の一覧を先に作る（描き方は後で決める）'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const CITY = 120;
const ROAD = 3.2;
const MIN_LOT = 9;
const SIDEWALK = 0.9;

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

/* ---- 1つの街区から、積み上げる箱の一覧を作る ---- */

const PALETTE = [0x6b7280, 0x7c7468, 0x5f6b7a, 0x8a8378, 0x4f5560, 0x6e6a74];

function buildingBoxes(lot, rand) {
  const cx = lot.x + lot.w / 2;
  const cz = lot.z + lot.d / 2;

  // 中心からの距離を 0〜1 に。0 が都心
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

/* ---- シーン ---- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x161a26);
scene.fog = new THREE.Fog(0x161a26, 60, 260);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 700);
camera.position.set(-74, 46, 92);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 8, 0);
controls.maxPolarAngle = Math.PI * 0.495;

const sun = new THREE.DirectionalLight(0xffe8c4, 2.6);
sun.position.set(80, 110, 50);
scene.add(sun, new THREE.HemisphereLight(0x9db8ff, 0x2a2a33, 0.75));

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshStandardMaterial({ color: 0x474b56, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---- 箱の一覧を先に作る（描き方は後で決める） ---- */

const lots = splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, makeRandom(20260730), []);
const rand = makeRandom(777);
const allBoxes = [];
for (const lot of lots) {
  for (const box of buildingBoxes(lot, rand)) allBoxes.push(box);
}

const city = new THREE.Group();
scene.add(city);

function clearCity() {
  for (const child of city.children.slice()) {
    city.remove(child);
    child.geometry.dispose();
    child.material.dispose();
  }
}

/* 描き方 (A) 1つずつメッシュにする */
function buildIndividual() {
  clearCity();
  for (const box of allBoxes) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(box.w, box.h, box.d),
      new THREE.MeshStandardMaterial({ color: box.color, roughness: 0.85 }),
    );
    mesh.position.set(box.x, box.y, box.z);
    city.add(mesh);
  }
}

/* 描き方 (B) 合体させて1つにする */
function buildMerged() {
  clearCity();
  const parts = [];
  for (const box of allBoxes) {
    const geometry = new THREE.BoxGeometry(box.w, box.h, box.d);
    geometry.translate(box.x, box.y, box.z);   // 合体前に位置へ動かす

    // 色を頂点に焼き込む。これで1マテリアルでも建物ごとに色が変わる
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

  const merged = BufferGeometryUtils.mergeGeometries(parts);
  for (const part of parts) part.dispose();   // 元は要らない

  city.add(new THREE.Mesh(
    merged,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
  ));
}

/* ---- 表示と操作 ---- */

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#e8e8f2; font:12px monospace;' +
  'pointer-events:none; white-space:pre;';
document.body.appendChild(readout);

let mode = 'まとめて 1 つ';

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

addButton('1つずつメッシュにする', 12, () => { mode = '1 つずつ'; buildIndividual(); });
addButton('まとめて1つにする', 172, () => { mode = 'まとめて 1 つ'; buildMerged(); });

buildMerged();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);

  const info = renderer.info.render;
  readout.textContent =
    '描き方 ' + mode + '\\n箱 ' + allBoxes.length + ' 個\\n' +
    'ドローコール ' + info.calls + '\\n三角形 ' + info.triangles;
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        'ボタンを切り替えても**見た目はまったく変わりません。**変わるのはドローコールの数だけです（数百 → 2）。三角形の数も同じであることに注目してください。減っているのは「命令の回数」だけです。1 つずつのほうは、視界の外にある建物が自動で省かれるので、視点によってはドローコールが少し減ります。',
    },
    {
      kind: 'md',
      text: `
## 合体には代償があります

「常に合体すればいい」わけではありません。**捨てているものが 2 つあります。**

- **個別に動かせない・消せない。** 1 つの物体になったので、当然です
- **{{視錐台カリング}}が効かなくなる。** 街全体が 1 つの物体なので、
  カメラが街の端を向いていても**全部の三角形が GPU へ送られます**

2 つめは大きな街ほど効いてきます。対策は簡単で、**適度な塊に分けて合体すること**です。
街を 4×4 の区画に切り、区画ごとに合体すれば、ドローコールは 16 回で済み、
しかも視界の外の区画は省かれます。

**「1 回にする」ではなく「ちょうどいい回数にする」**のが実際の答えです。
`,
    },
    {
      kind: 'md',
      text: `
## 窓 ― UV を自分で書き換える

夜に窓を光らせたいので、いま準備をしておきます。

窓は 1 枚のテクスチャで済みます。ただし \`BoxGeometry\` の UV は
**どの面も 0〜1** なので、そのまま貼ると**面の大きさに関係なく窓が 1 つ**に伸びます。
細長いビルの側面には、細長い窓が 1 枚。これでは困ります。

そこで、[](#/ch/t04-texture)でやった UV を**自分で書き換えます。**
やることは「面の実寸を窓の間隔で割った数」を UV に掛けるだけです。

\`BoxGeometry\` の面は **+x, -x, +y, -y, +z, -z の順に 4 頂点ずつ**並んでいるので、
どの面がどの向きかは分かっています。屋上（±y）だけは窓を出したくないので、
テクスチャの「窓のない場所」を指す固定の値に潰します。
`,
    },
    {
      kind: 'code',
      title: '箱の面ごとに、UV を実寸に合わせる',
      code: `// 窓の間隔（横 2.4、階高 3.4）。テクスチャは 8x8 個の窓を持っている
function scaleBoxUv(geometry, w, h, d) {
  const uv = geometry.getAttribute('uv');
  const cols = (size) => Math.max(1, Math.round(size / 2.4)) / 8;
  const rows = Math.max(1, Math.round(h / 3.4)) / 8;

  // 面の順番は +x, -x, +y, -y, +z, -z。1面あたり4頂点
  const faces = [
    { u: cols(d), v: rows },   // +x（奥行き × 高さ）
    { u: cols(d), v: rows },   // -x
    null,                      // +y（屋上。窓を出さない）
    null,                      // -y
    { u: cols(w), v: rows },   // +z（幅 × 高さ）
    { u: cols(w), v: rows },   // -z
  ];

  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const at = f * 4 + i;
      if (faces[f] === null) {
        uv.setXY(at, 0.06, 0.06);   // テクスチャの「窓のない一角」を指す
      } else {
        uv.setXY(at, uv.getX(at) * faces[f].u, uv.getY(at) * faces[f].v);
      }
    }
  }
}`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'なぜ emissiveMap なのか',
      text: `
窓を \`map\`（色）に入れてしまうと、**昼も窓が明るいまま**になります。

\`emissiveMap\` に入れておくと、\`emissiveIntensity\` の 1 つの数値で
街全体の窓を一斉に消したり点けたりできます。昼は 0、夜は 1.2。
次の章の昼夜の切り替えが、**これで 1 行になります。**

テクスチャを繰り返して貼るので \`wrapS\` と \`wrapT\` を \`THREE.RepeatWrapping\` にし、
窓の輪郭をぼかしたくないので \`magFilter\` を \`THREE.NearestFilter\` にしておきます。
`,
    },
    {
      kind: 'sandbox',
      title: '街ができました（昼・ドローコール 2 回）',
      guide: { focus: ['窓のテクスチャ（8x8 個。半分ほどを点ける）', '街を組む'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const CITY = 120;
const ROAD = 3.2;
const MIN_LOT = 9;
const SIDEWALK = 0.9;
const PALETTE = [0x6b7280, 0x7c7468, 0x5f6b7a, 0x8a8378, 0x4f5560, 0x6e6a74];

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

/* ---- 窓のテクスチャ（8x8 個。半分ほどを点ける） ---- */

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
      // 左上の1マスは必ず消しておく（屋上がここを指す）
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
    { u: cols(d), v: rows },
    { u: cols(d), v: rows },
    null,
    null,
    { u: cols(w), v: rows },
    { u: cols(w), v: rows },
  ];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const at = f * 4 + i;
      if (faces[f] === null) uv.setXY(at, 0.06, 0.06);
      else uv.setXY(at, uv.getX(at) * faces[f].u, uv.getY(at) * faces[f].v);
    }
  }
}

/* ---- シーン ---- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9db4d8);
scene.fog = new THREE.Fog(0x9db4d8, 70, 300);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 700);
camera.position.set(-70, 40, 88);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 8, 0);
controls.maxPolarAngle = Math.PI * 0.495;

const sun = new THREE.DirectionalLight(0xfff0d8, 2.8);
sun.position.set(90, 120, 60);
scene.add(sun, new THREE.HemisphereLight(0xbcd4ff, 0x3a3a44, 0.9));

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshStandardMaterial({ color: 0x474b56, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---- 街を組む ---- */

const lots = splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, makeRandom(20260730), []);
const rand = makeRandom(777);

const parts = [];
for (const lot of lots) {
  for (const box of buildingBoxes(lot, rand)) {
    const geometry = new THREE.BoxGeometry(box.w, box.h, box.d);
    scaleBoxUv(geometry, box.w, box.h, box.d);   // 窓の割り付け
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

const merged = BufferGeometryUtils.mergeGeometries(parts);
for (const part of parts) part.dispose();

const buildings = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.82,
  emissive: 0xffffff,
  emissiveMap: createWindowTexture(),
  emissiveIntensity: 0,       // 昼は消灯。次の章でここを動かす
}));
scene.add(buildings);

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#0b1220; font:12px monospace;' +
  'pointer-events:none; white-space:pre;';
document.body.appendChild(readout);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  const info = renderer.info.render;
  readout.textContent =
    '建物の箱 ' + parts.length + ' 個\\nドローコール ' + info.calls + '\\n三角形 ' + info.triangles;
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '数百棟の街が、地面と合わせて 2 回のドローコールで描かれています。`emissiveIntensity` を 1.2 にすると、昼なのに窓が点いた妙な街になります ― 次の章で、これを時刻に合わせて動かします。`scaleBoxUv` の呼び出しを消すと、どの面にも窓が 1 つだけ伸びて貼られる様子が見えます。',
    },
    {
      kind: 'md',
      text: `
## 数字で確かめる習慣

このサンドボックスは、画面の左上に**測った数字**を出しています。

\`renderer.info.render.calls\` と \`.triangles\` です。
[](#/ch/t11-performance)で「まずこれを画面に出してください」と書いたとおり、
**思い込みで最適化しても、たいてい原因ではありません。**

ボタンで切り替えて見えたのは、次のことでした。

- 三角形の数は**まったく同じ**
- ドローコールだけが数百から 2 へ
- **見た目は 1 ピクセルも変わらない**

「速くする」とは、たいていこういう作業です。**見た目を犠牲にせずに、命令の数を減らす。**
`,
    },
  ],
  exercises: [
    {
      prompt: '\`PALETTE\` を 1 色だけの配列にしてください。街の印象はどう変わりますか。逆に、彩度の高い色を混ぜるとどうでしょう。',
      hint: '実際の街並みの色を思い出してください。',
      answer: `1 色だと**模型のように**のっぺりします。彩度の高い色を混ぜると、一気に**おもちゃっぽく**なります。
実際の街は「灰・砂・青灰・茶」の狭い範囲に散っているので、
**近い色を 6 つ並べる**だけで「無限に違うが、同じ街」に見えます。
ローポリで説得力を出す勘所は、形よりも**色の散らし方の狭さ**にあります。`,
    },
    {
      prompt: `切り替えボタンで「個別に描く」と「まとめて描く」を行き来してください。
ドローコールの数字と、**見た目**を見比べてください。まとめたときに諦めているものは何でしょう。`,
      hint: '合体すると、1 つの物体になります。',
      answer: `見た目はまったく同じで、ドローコールだけが数百から 1 に減ります。
諦めているのは**個別に動かせること**と、**個別のマテリアル**、そして**視錐台カリング**です。
1 つの巨大な物体になるので、画面に 1 棟でも入っていれば街全体が描かれます。
建物ごとの色は「頂点カラー」に焼き込んで取り戻していますが、
カリングのほうは [](#/ch/p08-city-motion) で**分割して合体する**ことで取り戻します。`,
    },
  ],
  quiz: [
    {
      q: '`mergeGeometries` で合体させたあとも、建物ごとに色を変える方法はどれですか。',
      choices: [
        '合体する前に、それぞれのジオメトリへ color の attribute を書き込み、材質を vertexColors: true にする',
        'マテリアルの配列を渡す',
        '合体後に material.color を毎フレーム変える',
        '合体は色を変えられないので諦める',
      ],
      answer: 0,
      explain:
        'attribute は「頂点ごとに違う値」を持てます。色を頂点に焼き込んでおけば、マテリアルが 1 つでも建物ごとに色がばらけます。`InstancedMesh` の `setColorAt` と考え方は同じです。',
    },
    {
      q: '街全体を1つのジオメトリに合体させると、失うものはどれですか。',
      choices: [
        '視錐台カリング（画面外のものを省く仕組み）',
        'ライティング',
        '影',
        'テクスチャ',
      ],
      answer: 0,
      explain:
        '1 つの物体になるので、「一部だけ画面外」という判定ができません。カメラが街の端を向いていても全部の三角形が送られます。適度な塊（たとえば 4x4 区画）に分けて合体するのが実際の答えです。',
    },
    {
      q: '`BoxGeometry` に窓のテクスチャをそのまま貼ると、どうなりますか。',
      choices: [
        'どの面にも面の大きさに関係なく窓が1つだけ、引き伸ばされて貼られる',
        '窓が正しい大きさで並ぶ',
        'テクスチャが表示されない',
        '上下が反転する',
      ],
      answer: 0,
      explain:
        'BoxGeometry の UV はどの面も 0〜1 なので、テクスチャ 1 枚がその面いっぱいに伸びます。面の実寸を窓の間隔で割った数を UV に掛けてやると、大きさの揃った窓が並びます。',
    },
  ],
};
