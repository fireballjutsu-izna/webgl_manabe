import type { Chapter } from '../types.ts';

export const chapterX38: Chapter = {
  slug: 'x38-chunked-merge',
  part: 'project',
  number: 38,
  title: '区画ごとに合体する ― カリングを、取り戻す',
  goal: '合体で失った視錐台カリングを、区画に分けることで取り戻せるようになり、分割数を「回数」と「省ける量」の取引として選べるようになります。',
  requires: ['x37-car-instancing', 'x26-merge-geometry', 'w42-draw-calls'],
  threeApis: [
    'BufferGeometryUtils',
    'Object3D.frustumCulled',
    'WebGLRenderer.info',
    'Box3.setFromObject',
  ],
  mathRecall: [
    { slug: 'x26-merge-geometry', note: '合体すると $1$ 回で描ける' },
    { slug: 'x27-instancing', note: 'その代わり、カリングが効かなくなる' },
    { slug: 'm27-frustum', note: '写る範囲の外は、描かなくてよい' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 残していた宿題

[](#/ch/x26-merge-geometry)で街全体を $1$ つに合体させたとき、
**{{視錐台カリング}}が効かなくなる**と書きました。

ここで直します。やることは単純です。

**箱を置く場所で $4 \\times 4$ の区画に振り分けて、区画ごとに合体します。**

- ドローコールは $1$ 回 → **最大 $16$ 回**（それでも $82$ 回よりずっと少ない）
- そのかわり、**視界の外の区画は自動で省かれます**

$16$ 回のうち実際に描かれるのは、視点によって $4$〜$6$ 回。
**「$1$ 回にする」より「ちょうどいい回数にする」ほうが速い**、というのはこういうことです。
`,
    },
    {
      kind: 'md',
      text: `
## 振り分けは、座標の割り算だけ

区画を決めるのに、難しいことはしません。
**箱の中心の座標を、区画の大きさで割るだけ**です。

街の一辺 $120$ を $4$ で割ると、区画は $30$ 四方。
座標を $0$ 起点に直してから割り、はみ出さないように挟み込みます。

そのあとは区画ごとに \`mergeGeometries\` を呼ぶだけで、
コードとしては[](#/ch/x26-merge-geometry)から**$3$ 行増えるだけ**です。
`,
    },
    {
      kind: 'formula',
      tex: 'C_{\\text{draw}} \\;\\approx\\; k^{2} \\times \\dfrac{A_{\\text{視野}}}{A_{\\text{街}}}, \\qquad V \\;\\approx\\; \\dfrac{N}{k^{2}} \\times C_{\\text{draw}}',
      readAloud:
        '実際に描かれる区画の数は、分割数の $2$ 乗に「街のうち視野に入っている割合」を掛けたものです。処理される頂点は、$1$ 区画あたりの頂点数に、描かれる区画の数を掛けたものになります。',
      worked: {
        given:
          '街 $120 \\times 120$、頂点 $1920$。目線から街の $3$ 分の $1$ が視野に入っているとして、分割数を変えます。',
        steps: [
          { calc: 'k = 1（合体 1 つ）' },
          { calc: '  描く区画 1、頂点 1920', note: '全部処理される' },
          { calc: 'k = 4（16 区画）' },
          { calc: '  16 x 0.33 = 5.3 → 約 5 回' },
          { calc: '  頂点 1920/16 x 5 = 600' },
          { calc: 'k = 8（64 区画）' },
          { calc: '  64 x 0.33 = 21 回' },
          { calc: '  頂点 1920/64 x 21 = 630' },
        ],
        result:
          '**$k = 4$ で頂点は $\\frac{1}{3}$ に減り、ドローコールは $5$ 回。** $k = 8$ にしても頂点はほとんど減らず（$600 \\to 630$）、**ドローコールだけが $4$ 倍**になります。減るのは「視野の外」だけなので、**視野の割合より細かく割っても意味がありません。** 分割は、視野に入る割合と釣り合うところで止めます ― この街なら $4 \\times 4$ です。',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '区画の境目をまたぐ箱は、どちらかに入れる',
      text: `
建物が区画の境目にまたがっていることがあります。

**中心の座標で決めて、はみ出しは気にしません。**

はみ出した建物のぶんだけ、区画の**境界球**が大きくなり、
カリングの判定がわずかに甘くなります ―
「見えていないのに描かれる」区画が、たまに $1$ つ増える程度です。

厳密にやるなら、建物を境目で切るか、
区画ごとの \`boundingBox\` を実際の中身から計算し直します。

**後者は three が自動でやってくれます。**
\`mergeGeometries\` の結果に \`computeBoundingSphere()\` が走るので、
中身に合った球ができます。**何もしなくてよい、が正解**です。
`,
    },
    {
      kind: 'sandbox',
      title: '分割数を変えて、カリングの効きを測る',
      guide: { focus: ['区画に振り分ける', '区画ごとに合体する'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const CITY = 120;
const CHUNKS = 4;      // 1 にすると街全体で 1 つ。8 も試してください

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x161a26);
scene.fog = new THREE.Fog(0x161a26, 60, 260);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 700);
camera.position.set(-58, 44, 72);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 4, 0);
controls.maxPolarAngle = Math.PI * 0.495;

scene.add(
  new THREE.HemisphereLight(0x9db8ff, 0x2a2a33, 0.9),
  new THREE.DirectionalLight(0xffe8c4, 2.0).translateX(60).translateY(90).translateZ(40),
);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshStandardMaterial({ color: 0x474b56, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---- 区画に振り分ける ---- */
// 箱の中心の座標を、区画の大きさで割るだけ

const buckets = [];
for (let i = 0; i < CHUNKS * CHUNKS; i++) buckets.push([]);

const chunkSize = CITY / CHUNKS;
const boxes = collectBoxes();

for (const box of boxes) {
  const geometry = new THREE.BoxGeometry(box.w, box.h, box.d);
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
}

/* ---- 区画ごとに合体する ---- */
// 合体は区画の中だけ。区画をまたいでは繋がない

const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
let chunkMeshes = 0;

for (const bucket of buckets) {
  if (bucket.length === 0) continue;
  const merged = BufferGeometryUtils.mergeGeometries(bucket);
  for (const part of bucket) part.dispose();
  scene.add(new THREE.Mesh(merged, material));   // 境界球は three が計算する
  chunkMeshes += 1;
}

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; bottom:16px; left:16px; color:#9fb4d8;' +
  'font:12px/1.7 ui-monospace, monospace; white-space:pre; pointer-events:none;' +
  'background:rgba(10,12,18,0.78); padding:8px 10px; border-radius:5px;';
document.body.appendChild(readout);

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);

  // 描いた回数は、視点によって変わる。それがカリングの効いている証拠
  readout.textContent =
    'CHUNKS ' + CHUNKS + '（区画 ' + chunkMeshes + ' 個）\\n' +
    '箱 ' + boxes.length + ' 個\\n' +
    'ドローコール ' + renderer.info.render.calls + '\\n' +
    '三角形 ' + renderer.info.render.triangles;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- 下ごしらえ：街区と建物（前の章までで作ったもの） ---- */

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

function collectBoxes() {
  const ROAD = 3.2;
  const MIN_LOT = 9;
  const SIDEWALK = 0.9;
  const PALETTE = [0x6b7280, 0x7c7468, 0x5f6b7a, 0x8a8378, 0x4f5560, 0x6e6a74];

  function splitLots(rect, rand, out) {
    const canX = rect.w > MIN_LOT * 2 + ROAD;
    const canZ = rect.d > MIN_LOT * 2 + ROAD;
    if (!canX && !canZ) { out.push(rect); return out; }
    const alongX = canX && (!canZ || rect.w >= rect.d);
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

  const lots = splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, makeRandom(20260730), []);
  const rand = makeRandom(777);
  const out = [];

  for (const lot of lots) {
    const cx = lot.x + lot.w / 2;
    const cz = lot.z + lot.d / 2;
    const r = Math.min(1, Math.hypot(cx, cz) / (CITY * 0.62));
    const height = 58 * Math.pow(1 - r, 1.8) * (0.45 + rand() * 0.75) + 3.5;
    const stages = height > 26 ? 3 : (height > 14 ? 2 : 1);
    const fractions = stages === 3 ? [0.55, 0.3, 0.15] : (stages === 2 ? [0.7, 0.3] : [1]);
    const color = new THREE.Color(PALETTE[Math.floor(rand() * PALETTE.length)]);
    color.offsetHSL(0, 0, (rand() - 0.5) * 0.08);

    let w = Math.max(1.6, lot.w - SIDEWALK * 2);
    let d = Math.max(1.6, lot.d - SIDEWALK * 2);
    let bottom = 0.35;
    for (let s = 0; s < stages; s++) {
      const h = height * fractions[s];
      out.push({ x: cx, y: bottom + h / 2, z: cz, w: w, h: h, d: d, color: color });
      bottom += h;
      w *= 0.72;
      d *= 0.72;
    }
  }
  return out;
}`,
      caption:
        '引いた状態では街全体が視野に入るので、ドローコールは $17$（$16$ 区画＋地面）のままです。**スクロールで街に寄ってください** ― 視野に入る区画が減り、$8$ 前後まで落ちます。その状態でカメラを回すと、数字が上下します。**それが視界の外の区画が省かれている証拠**です。`CHUNKS` を $1$ にすると、どれだけ寄っても $2$ から動きません。$8$ にすると区画は $64$ 個になり、ドローコールは増えるのに三角形はあまり減らない ― **割りすぎ**の状態が数字で見えます。',
    },
    {
      kind: 'md',
      text: `
## 分割数の選び方

数字を見ると、選び方の目安が出てきます。

| $k$ | ドローコール | 処理される頂点 |
|---|---|---|
| $1$ | $1$ | $1920$（全部） |
| $4$ | 約 $5$ | 約 $600$ |
| $8$ | 約 $21$ | 約 $630$ |

**$k = 4$ から $8$ にしても、頂点はほとんど減りません。**
減らせるのは「視野の外」だけで、そこはすでに $k = 4$ で落ちているからです。

目安はこうです。

- **視野に入る割合が $\\frac{1}{3}$ なら、$k^2$ は $9$〜$16$ あたり**
- それ以上に割っても、ドローコールが増えるだけ
- 割らなさすぎると（$k = 1$）、カリングがまったく効かない

**「$1$ 回にする」は最適ではありません。**
[](#/ch/w42-draw-calls)で $1{,}840$ 回を $40$ 回にしたときも、
$1$ 回にはしませんでした。**ちょうどいい回数がある**、という話です。
`,
    },
  ],
  exercises: [
    {
      prompt: `街を $4$ 倍の広さ（$240 \\times 240$）にしたとき、分割数 $k$ はいくつにしますか。

視野に入る割合は変わらないものとします。`,
      hint: '区画の大きさを保つなら、$k$ はどうなりますか。',
      answer: `**$k = 8$（$64$ 区画）です。区画の大きさを保ちます。**

**考え方**

$120$ の街を $k = 4$ で割ると、区画は $30$ 四方でした。

$240$ の街で区画を $30$ 四方に保つには、$k = 8$。

**なぜ「割合」ではなく「大きさ」なのか**

カリングは**区画単位**で効きます。

区画が大きすぎると、その一部しか見えていなくても全部描かれます。
逆に小さすぎると、ドローコールが増えるだけです。

**ちょうどよい区画の大きさは、視野の大きさで決まります。**

視野に「区画がいくつ入るか」が $5$〜$10$ 個くらいなら、
- 端で無駄に描かれるぶんが少ない
- ドローコールも増えすぎない

街が広くなっても**視野の大きさは変わらない**ので、
区画の大きさも変えず、**$k$ だけを増やします。**

**確かめ方**

サンドボックスの読み出しで、

- ドローコールが $10$ を超えず
- カメラを回すと数字が動く

この $2$ つが成り立っていれば、だいたい合っています。`,
    },
    {
      prompt: `区画の境目をまたぐ建物を、中心の座標だけで振り分けています。

厳密には正しくありませんが、どんな害がありますか。`,
      hint: '区画の境界球は、中身から計算されます。',
      answer: `**その区画の境界球が少し大きくなり、カリングがわずかに甘くなります。**

**何が起きるか**

区画 $A$ の端にある建物が、区画 $B$ の側へはみ出しているとします。

その建物は $A$ に入るので、$A$ の境界球は**はみ出したぶんだけ大きく**なります。

結果として、

- $A$ が視野の外にあっても、**はみ出した部分が視野に入っていれば描かれる**
- つまり「見えていないのに描かれる」区画が、たまに $1$ つ増える

**その程度です。**

**厳密にやるなら**

- 建物を境目で**切る**（ジオメトリを分割する）
- 区画の割り当てを、中心ではなく**外接箱の重なり**で決める

どちらも実装が増えるうえ、$1$ 区画ぶんの無駄と釣り合いません。

**境界球は自動で正しくなる**

安心してよいのは、**\`mergeGeometries\` の結果に対して
three が \`computeBoundingSphere()\` を走らせる**ことです。

中心の座標で振り分けても、**境界球は実際の中身に合った大きさ**になります。
「本当は $30$ 四方だから」と決め打ちで判定しているわけではありません。

**何もしなくてよい、が正解**です。`,
    },
    {
      prompt: `$k = 20$（$400$ 区画）にすると、何が起きますか。`,
      hint: '区画は $6$ 四方になります。街区の大きさは？',
      answer: `**ドローコールが $100$ 回前後に増え、頂点はほとんど減りません。**

**区画の大きさ**

$120 / 20 = 6$ 四方。

街区の平均が $183$（$13$ 四方ほど）なので、
**区画より街区のほうが大きい**状態です。

**何が起きるか**

- $1$ つの建物が、いくつもの区画にまたがる
- 各区画の境界球が、区画の大きさより**ずっと大きく**なる
- **カリングの精度は $k = 4$ とほとんど変わらない**のに、ドローコールだけ増える

**さらに悪いこと**

区画あたりの箱が $1$ 個以下になるので、
**合体している意味がほとんどありません。**

$80$ 個の箱を $400$ の入れ物に配れば、多くの区画は空、
残りは $1$ 個ずつ ― つまり**ほぼ「$1$ つずつ描く」に戻っています。**

**分割の下限**

区画は、**中に入るものが数個以上ある大きさ**にします。

この街なら $30$ 四方（$k = 4$）で $1$ 区画あたり $5$ 個。
$15$ 四方（$k = 8$）で $1.25$ 個 ― **すでに割りすぎ**です。

**「細かく割るほど速い」は、どこかで必ず逆転します。**`,
    },
  ],
  quiz: [
    {
      q: '街全体を 1 つに合体させると、なぜカリングが効かないのですか。',
      choices: [
        'three は物体単位で判定するので、端が少しでも視野に入れば全部描かれるから',
        '合体すると境界球が計算されないから',
        '合体したジオメトリは常に描画されるように three が決めているから',
        'カリングは三角形単位でしか効かないから',
      ],
      answer: 0,
      explain:
        '視錐台カリングの単位は物体です。街全体が 1 つの Mesh なら「その Mesh が視野に入っているか」しか見られず、端がかすっていれば全頂点が処理されます。4×4 に分けて区画ごとに合体すれば、判定も区画単位になり、視野の外の区画は丸ごと省かれます。',
    },
    {
      q: '分割数を 4×4 から 8×8 に増やすと何が起きますか（視野に街の 1/3 が入る場合）。',
      choices: [
        '描かれる区画が約 5 から約 21 に増える一方、処理される頂点は 600 から 630 とほとんど減らない',
        '頂点が半分になる',
        'ドローコールが減る',
        '何も変わらない',
      ],
      answer: 0,
      explain:
        '減らせるのは「視野の外」だけで、そこは 4×4 の時点ですでに落ちています。それ以上細かく割っても、ドローコールが増えるだけです。分割は視野に入る割合と釣り合うところで止めます ― この街なら 4×4、1 区画あたり 5 個ほどが目安です。',
    },
    {
      q: '区画の境目をまたぐ建物を、中心の座標だけで振り分けたときの害はどれですか。',
      choices: [
        'その区画の境界球が少し大きくなり、見えていない区画がたまに 1 つ描かれる',
        '建物が二重に描かれる',
        '建物が消える',
        '合体に失敗する',
      ],
      answer: 0,
      explain:
        'はみ出したぶんだけ境界球が大きくなるので、判定がわずかに甘くなります。ただし境界球は mergeGeometries の結果から three が計算するので、実際の中身に合った大きさになります ―「本当は 30 四方だから」と決め打ちしているわけではありません。1 区画ぶんの無駄と、建物を切る実装は釣り合わないので、何もしないのが正解です。',
    },
  ],
};
