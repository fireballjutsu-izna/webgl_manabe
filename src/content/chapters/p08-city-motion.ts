import type { Chapter } from '../types.ts';

export const chapterP08: Chapter = {
  slug: 'p08-city-motion',
  part: 'project',
  number: 8,
  title: 'ローポリの街 ― 車を走らせて仕上げる',
  goal: '曲線に沿って向きまで正しく走る動きを作れるようになり、まとめ描画とカリングを両立させられるようになります。',
  requires: ['p07-city-light', '12-curve', 't11-performance'],
  threeApis: [
    'CatmullRomCurve3',
    'Curve.getPointAt',
    'Curve.getTangentAt',
    'Object3D.lookAt',
    'Object3D.updateMatrix',
    'InstancedMesh',
    'InstancedMesh.setMatrixAt',
    'Line',
    'BufferGeometryUtils',
    'WebGLRenderer.info',
  ],
  mathRecall: [
    { slug: '12-curve', note: '制御点から曲線を作る' },
    { slug: '04-cross', note: '進む向きから姿勢を組む' },
    { slug: 't11-performance', note: 'InstancedMesh と視錐台カリング' },
    { slug: 'p05-city-layout', note: '街区の四辺は、必ず道路に面している' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 動くものが1つあると、街は生きる

建物が並び、朝と夜が来ました。それでも、まだ**模型**です。
足りないのは動きです。しかも、たくさんは要りません。

**車が数十台、道を流れているだけで街は生きます。**
人も鳥も信号もなくてかまいません。まずは車だけを入れます。

問題は 2 つです。

- **どこを走らせるか。** 道路は「街区の隙間」として現れたので、経路のデータがありません
- **どちらを向かせるか。** 位置だけ動かすと、車は横向きのまま滑っていきます
`,
    },
    {
      kind: 'md',
      text: `
## 経路は、街区の外周をなぞればいい

道路の網を解析する必要はありません。[](#/ch/p05-city-layout)の作り方を思い出してください。

**街区は、四辺すべてが道路に面しています。** 隙間をあけて割ったので、必ずそうなります。

ということは、**街区のまわりを少し外側でぐるっと囲んだ閉じた経路は、
必ず道路の上**にあります。交差点の判定も、道の接続の管理も要りません。

車ごとに街区を 1 つ選び、その外周を回らせます。
角を丸めたいので、[](#/ch/12-curve)でやった \`CatmullRomCurve3\` に
角と辺の中点を渡して、閉じた曲線にします。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '「作らない」で済ませる、2度目',
      text: `
道路そのものを作らずに隙間で表し、経路も作らずに街区の外周で表しました。
どちらも「**すでにある構造を読み替える**」ことで、新しいデータを増やさずに済ませています。

手続き的生成では、これがいちばん効く節約です。
何かが欲しくなったとき、**すでに持っているものから導けないか**を先に考えると、
コードが増えずに機能が増えます。
`,
    },
    {
      kind: 'md',
      text: `
## 向きは、接線から作る

曲線の上を走らせるとき、位置は \`getPointAt(u)\` で取れます。
向きは \`getTangentAt(u)\` ― **その点で曲線が進んでいる方向**です。

あとは「その方向を向く」だけですが、ここに 1 つ知っておくべきことがあります。

**\`Object3D.lookAt()\` は、カメラとそれ以外で向きの意味が逆です。**

- カメラ … \`-Z\` が対象を向く（カメラは自分の後ろ向きに写す）
- それ以外 … **\`+Z\` が対象を向く**

なので、車のジオメトリを**長い辺が Z 軸方向**になるように作っておけば、
\`lookAt(いまの位置 + 接線)\` と書くだけで正しく前を向きます。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathbf{p} = C(u),\\quad \\mathbf{t} = C\'(u),\\quad \\text{向き} = \\mathrm{lookAt}(\\mathbf{p} + \\mathbf{t})',
      readAloud:
        '曲線 C の u の地点の座標が p、その点での接線（進んでいる向き）が t です。p に t を足した点を見るようにすれば、進行方向を向きます。u を 0 から 1 へ進めれば一周します。',
      worked: {
        given: '一周の長さが 48 の経路を、毎秒 4 の速さで走らせます。',
        steps: [
          { calc: '1 秒で進む u : 4 / 48 = 0.0833' },
          { calc: '一周にかかる : 1 / 0.0833 = 12 秒' },
          { calc: '長さ 96 の経路なら' },
          { calc: '  4 / 96 = 0.0417  →  24 秒', note: '倍の長さなので倍の時間' },
        ],
        result: '**経路の長さで割ることで、どの街区でも「毎秒 4」で走ります。** 割らずに `u += 0.0833` と固定で書くと、どの経路も 12 秒で一周してしまい、**大きい街区を回る車ほど速くなります**。[](#/ch/12-curve) の `getPointAt` と同じ「道のりで測る」考え方です。',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'getPoint と getPointAt は別物です',
      text: `
- \`getPoint(t)\` … 曲線の**内部の媒介変数**で位置を返す。制御点が密なところでは**速く、疎なところでは遅く**なる
- \`getPointAt(u)\` … **道のり**で位置を返す。u を一定の速さで進めると、**一定の速さで走る**

車には必ず \`getPointAt\` を使ってください。
\`getPoint\` だと、角のあたりで理由もなく加速・減速します（三角関数の話ではなく、
「制御点の間隔がそのまま速さになる」からです）。

\`getTangentAt\` と \`getTangent\` にも同じ違いがあります。
`,
    },
    {
      kind: 'sandbox',
      title: '1台だけ、街区のまわりを走らせる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ba6cc);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 300);
camera.position.set(-14, 12, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);
controls.maxPolarAngle = Math.PI * 0.495;

const sun = new THREE.DirectionalLight(0xfff0d8, 2.6);
sun.position.set(12, 16, 8);
scene.add(sun, new THREE.HemisphereLight(0xbcd4ff, 0x44444e, 0.7));

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshStandardMaterial({ color: 0x3a3d47, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---- 街区を1つ置く ---- */

const lot = { x: -7, z: -5, w: 14, d: 10 };

const block = new THREE.Mesh(
  new THREE.BoxGeometry(lot.w, 5, lot.d),
  new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.85 }),
);
block.position.set(lot.x + lot.w / 2, 2.5, lot.z + lot.d / 2);
scene.add(block);

/* ---- 街区の外周をなぞる閉じた経路 ---- */
// 角だけだと Catmull-Rom が丸く膨らむので、辺の中点も入れて直線を保つ

function lotLoop(lot, offset, y) {
  const x0 = lot.x - offset;
  const x1 = lot.x + lot.w + offset;
  const z0 = lot.z - offset;
  const z1 = lot.z + lot.d + offset;
  const mx = (x0 + x1) / 2;
  const mz = (z0 + z1) / 2;

  const points = [
    new THREE.Vector3(x0, y, z0), new THREE.Vector3(mx, y, z0),
    new THREE.Vector3(x1, y, z0), new THREE.Vector3(x1, y, mz),
    new THREE.Vector3(x1, y, z1), new THREE.Vector3(mx, y, z1),
    new THREE.Vector3(x0, y, z1), new THREE.Vector3(x0, y, mz),
  ];
  // true = 閉じた曲線。tension を下げると角が四角く、上げると丸くなる
  return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.25);
}

const route = lotLoop(lot, 1.6, 0.05);

// 経路を線で見せる（確認用）
scene.add(new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(route.getSpacedPoints(160)),
  new THREE.LineBasicMaterial({ color: 0xffd166 }),
));

/* ---- 車。長い辺を Z 軸方向にしておく ---- */

const car = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.BoxGeometry(1.1, 0.5, 2.4),   // 幅・高さ・長さ（Z が長い）
  new THREE.MeshStandardMaterial({ color: 0xff6b8a, roughness: 0.5 }),
);
body.position.y = 0.35;
car.add(body);

const roof = new THREE.Mesh(
  new THREE.BoxGeometry(0.95, 0.4, 1.2),
  new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.4 }),
);
roof.position.set(0, 0.78, -0.15);
car.add(roof);

// 前がどちらか分かるように、鼻先に印を付ける
const nose = new THREE.Mesh(
  new THREE.BoxGeometry(0.7, 0.16, 0.16),
  new THREE.MeshBasicMaterial({ color: 0xffffff }),
);
nose.position.set(0, 0.45, 1.25);
car.add(nose);

scene.add(car);

/* ---- 走らせる ---- */

const lookTarget = new THREE.Vector3();
const clock = new THREE.Clock();
let u = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // 道のりで進めるので、速さが一定になる
  u = (u + dt * 0.06) % 1;

  const position = route.getPointAt(u);
  const tangent = route.getTangentAt(u);

  car.position.copy(position);
  // 進行方向の少し先を見る。Object3D は +Z が対象を向く
  lookTarget.copy(position).add(tangent);
  car.lookAt(lookTarget);

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
        '白い印が付いているのが車の前です。角でもきちんと前を向いて曲がります。`car.lookAt(lookTarget)` の行を消すと、車が横向きのまま滑っていくのが見えます。`getPointAt` を `getPoint` に変えると、角のあたりで速さが不自然に変わります。`tension` の 0.25 を 0.02 にすると角がほぼ直角になり、0.8 にすると円に近づきます。',
    },
    {
      kind: 'md',
      text: `
## 車は InstancedMesh で

車は**同じ形が大量**にあります。[](#/ch/t11-performance)でやったとおり、
これは \`InstancedMesh\` の出番です。

1 台ずつ Group にして \`Mesh\` を 3 つ入れると、40 台で 120 回のドローコールになります。
\`InstancedMesh\` なら、車体・屋根・鼻先の 3 つで **3 回**です。

姿勢の渡し方も[](#/ch/t11-performance)と同じで、
**使い捨ての \`Object3D\` に位置と向きを作らせて、その行列を渡します。**
\`lookAt\` が使えるので、接線から向きを作る書き方はそのまま通ります。
`,
    },
    {
      kind: 'code',
      title: '毎フレーム、全部の車の行列を書き換える',
      code: `const dummy = new THREE.Object3D();
const lookTarget = new THREE.Vector3();

for (let i = 0; i < cars.length; i++) {
  const car = cars[i];
  car.u = (car.u + dt * car.speed) % 1;

  const position = car.route.getPointAt(car.u);
  const tangent = car.route.getTangentAt(car.u);

  dummy.position.copy(position);
  lookTarget.copy(position).add(tangent);
  dummy.lookAt(lookTarget);
  dummy.updateMatrix();              // position/quaternion から行列を作る

  bodyMesh.setMatrixAt(i, dummy.matrix);
  roofMesh.setMatrixAt(i, dummy.matrix);
}

// 書き換えたら、GPU へ送り直すことを明示する
bodyMesh.instanceMatrix.needsUpdate = true;
roofMesh.instanceMatrix.needsUpdate = true;`,
    },
    {
      kind: 'md',
      text: `
## 約束を果たす ― 区画ごとに合体する

[](#/ch/p06-city-buildings)で、街全体を 1 つに合体させると
**{{視錐台カリング}}が効かなくなる**と書きました。ここで直します。

やることは単純です。**箱を置く場所で 4×4 の区画に振り分けて、区画ごとに合体します。**

- ドローコールは 1 回 → **最大 16 回**（それでも数百回より圧倒的に少ない）
- そのかわり、**視界の外の区画は自動で省かれます**

街の端を向いているときは 16 回のうち 4〜6 回しか実際には描かれません。
**「1 回にする」より「ちょうどいい回数にする」ほうが速い**、というのはこういうことです。

完成版では、カメラを回すと左上の数字が動きます。**それが効いている証拠**です。
`,
    },
    {
      kind: 'sandbox',
      title: 'ローポリの街（完成）',
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

/* ---- 3-05 〜 3-07 で作ったもの ---- */

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
});`,
      caption:
        '放っておくと 80 秒で 1 日がめぐります。スライダーを動かすと自動送りが止まります。**カメラを回してみてください。ドローコールの数字が動きます** ― 視界の外の区画が省かれている証拠です。街全体を 1 つに合体させていたら、この数字は動きません。なお衝突判定はしていないので、交差点で車どうしがすれ違います。',
    },
    {
      kind: 'md',
      text: `
## 影の落とし方に、1つ手を抜いています

車は \`castShadow = true\` にしていますが、**\`receiveShadow\` は付けていません。**
車の上に建物の影が落ちません。

これは意図的な手抜きです。車は小さく動いているので、影を受けていないことに気づく人はまずいません。
そのぶん影の描画が軽くなります。

**どこで手を抜くかを選ぶのも実装です。** 全部を正しくやると重くなり、
重いものは結局公開できません。「気づかれない場所から削る」のが順番です。
`,
    },
    {
      kind: 'md',
      text: `
## 公開する

作ったものは、公開しないと誰にも見てもらえません。
Vite で作った静的なサイトなら、手順はごく短いです。

- \`npm run build\` … \`dist/\` に出力される
- \`dist/\` をそのまま置ける場所（GitHub Pages / Netlify / Cloudflare Pages など）へ上げる
- サブディレクトリで配信するなら、\`vite.config.ts\` の \`base\` を合わせる

このサイト自身も同じ作りです。\`base\` を \`/webgl_manabe/\` にして、
\`main\` へ push すると GitHub Actions が \`dist/\` を Pages へ送っています。

**忘れがちなこと**を 2 つ挙げておきます。

- **モバイルで一度は開く。** {{ピクセル比}}と影の設定は、そこで初めて痛い目に遭います
- **初回の読み込み時間を測る。** three は圧縮しても 180KB 前後あります。
  惑星のテクスチャ生成のような重い処理は、**画面に何か出したあとに**回してください
`,
    },
    {
      kind: 'md',
      text: `
## 第3部で手に入れたもの

作品を 2 つ、最初から最後まで作りました。**素材は 1 つも使っていません。**

- **惑星ビューアー** … 1 つのものを丁寧に。球面の分布、方向で引くノイズ、内積で作る大気、階層と軌道
- **ローポリの街** … たくさんのものを安く。決め打ちの乱数、再帰的な分割、まとめ描画、時刻から導く光

**共通していたのは 3 つ**です。

- **構造 × ばらつき。** 乱数だけでは形にならず、構造だけでは機械的になる
- **すでにあるものから導く。** 道路も経路も、街区から読み替えるだけで手に入った
- **数字を見る。** ドローコールも、コントラストも、生成時間も、測ってから直す

そして何より、**第1部の数学が最後まで使われ続けた**はずです。
内積は大気と昼夜に、三角関数は軌道と太陽に、補間はカメラと空の色に、
行列はインスタンスの配置に。**「Three.js のための数学」は、ここまで届いています。**
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ここから先へ',
      text: `
どれも、いま持っている土台の延長で書けます。

- **街に人と信号を足す。** 車と同じ仕組みで、経路と速さを変えるだけ
- **建物に窓の凹凸を付ける。** [](#/ch/p02-planet-surface) のバンプマップを facade に貼る
- **ポストプロセス**（\`EffectComposer\`）。夜景にブルームを乗せると化けます
- **物理エンジン**（Rapier など）。落ちる・当たる・積み上がる
- **地形**。[](#/ch/p02-planet-surface) のノイズを平面の頂点の高さに使えば、そのまま山になります

作りたいものが決まっているなら、**それを 1 行で書いてから始めてください。**
[](#/ch/p01-planet-setup) でやったとおりです。
`,
    },
  ],
  exercises: [
    {
      prompt: '完成版の \`CHUNKS\` を 1 にしてください。見た目は変わりませんが、街の端に立って中心の反対を向いたとき、負荷はどうなりますか。',
      hint: '1 つに合体した物体は、一部でも画面に入れば全体が描かれます。',
      answer: `**画面に何も入っていなくても、街全体が描かれます**。
視錐台カリングは物体の単位で効くので、街を 1 つに合体させると「街が見えているか」しか判定できません。
4×4 に分けておけば、見えていない区画は丸ごと省かれます。
**ドローコールを 1 回に減らすのと、カリングを効かせるのは相反する**ので、
「ほどよく分ける」で両方を取ります。16 個ぶんのドローコールは安いものです。`,
    },
    {
      prompt: '車の速さを \`(3.4 + 乱数) / route.getLength()\` としています。経路の長さで割らないと何が起きますか。',
      hint: 't は 0〜1 で一周します。経路の長さは街区ごとに違います。',
      answer: `**大きい街区を回る車ほど速くなります**。$t$ を一定の速さで進めると「一周にかかる時間」が同じになるので、
長い経路ほど実際の速さが上がってしまうからです。
経路の長さで割れば「1 秒あたり何メートル進むか」を指定したことになり、
街区の大小にかかわらず**同じ速さ**で走ります。[](#/ch/12-curve) の \`getPointAt\` と同じ、「道のりで測る」考え方です。`,
    },
  ],
  quiz: [
    {
      q: '街区のまわりを一周する経路が、必ず道路の上を通るのはなぜですか。',
      choices: [
        '街区は道路の幅だけ隙間をあけて切り出したので、四辺すべてが道路に面している',
        '道路を先にモデリングしたから',
        'Catmull-Rom 曲線が道路に吸着するから',
        '偶然そうなっている',
      ],
      answer: 0,
      explain:
        '生成の手順そのものが保証しています。道路網を解析したり交差点を管理したりせずに経路が手に入るのは、「すでにある構造を読み替えた」からです。',
    },
    {
      q: '曲線に沿って一定の速さで走らせたいとき、使うべきメソッドはどちらですか。',
      choices: [
        '`getPointAt(u)`（道のりで指定する）',
        '`getPoint(t)`（内部の媒介変数で指定する）',
        'どちらでも同じ',
        '`getPoints()` で点を取り出して自分で補間する',
      ],
      answer: 0,
      explain:
        '`getPoint` は制御点の間隔がそのまま速さになるので、角のあたりで加速・減速します。`getPointAt` は道のりで測るので、u を一定の速さで進めれば実際の速さも一定です。`getTangentAt` にも同じ違いがあります。',
    },
    {
      q: '街全体を1つに合体させる代わりに、4x4 の区画ごとに合体させる利点はどれですか。',
      choices: [
        '視界の外の区画が自動で省かれるので、実際に描かれる量が減る',
        '三角形の数が減る',
        '影が正確になる',
        'メモリが減る',
      ],
      answer: 0,
      explain:
        '1 つの物体だと「一部だけ画面外」の判定ができません。区画に分ければドローコールは最大 16 回になりますが、視錐台カリングが働くので、実際に送られる三角形はぐっと減ります。カメラを回すとドローコールの数字が動くのが、その証拠です。',
    },
  ],
};
