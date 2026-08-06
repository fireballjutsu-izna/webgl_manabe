import type { Chapter } from '../types.ts';

export const chapterX28: Chapter = {
  slug: 'x28-window-uv',
  part: 'project',
  number: 28,
  title: '窓 ― UV を、建物の実寸に合わせる',
  goal: '$1$ 枚の窓のテクスチャを、大きさのばらばらな建物へ正しい密度で貼れるようになり、昼夜で一斉に点け消しできる形で持てるようになります。',
  requires: ['x27-instancing', 'w15-uv', 'w16-repeat'],
  threeApis: [
    'BufferGeometry.getAttribute',
    'Texture.wrapS',
    'Texture.magFilter',
    'MeshStandardMaterial.emissiveMap',
    'MeshStandardMaterial.emissiveIntensity',
  ],
  mathRecall: [
    { slug: 'w15-uv', note: '立体を平らな紙に開く。$UV$ は $0$〜$1$' },
    { slug: 'w16-repeat', note: '小さな $1$ 枚で、広い面を敷く' },
    { slug: 'b05-ratio', note: '実寸を窓の間隔で割る。比の話' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 箱に、窓を貼る

灰色の箱が並んだだけでは、まだ「街」に足りません。**窓**です。

窓は $1$ 枚の小さなテクスチャで済みます。
$8 \\times 8$ の窓が並んだ画像を $1$ 枚作り、それを全部の建物に貼ります。

**問題は、建物の大きさがばらばらなこと**です。

[](#/ch/w15-uv)でやったとおり、\`BoxGeometry\` の $UV$ は
**どの面も $0$〜$1$** で入っています。
そのまま貼ると、幅 $4$ の建物にも幅 $24$ の建物にも**同じ $8 \\times 8$ 個**の窓が並びます。

つまり、大きい建物の窓は**$6$ 倍に引き伸ばされます。**
`,
    },
    {
      kind: 'md',
      text: `
## 窓の間隔は、建物によらず一定であるべき

現実の建物では、窓の間隔と階高はだいたい決まっています。
大きなビルの窓が $6$ 倍大きいということはありません。

だから $UV$ を、**建物の実寸から計算して**書き換えます。

- 横方向 … 幅を**窓の間隔**（$2.4$）で割った数だけ、窓を並べる
- 縦方向 … 高さを**階高**（$3.4$）で割った数だけ、窓を並べる

テクスチャは $8 \\times 8$ 個の窓を持っているので、
「窓を $5$ 個並べたい」なら $UV$ を $\\frac{5}{8}$ 倍します。
`,
    },
    {
      kind: 'formula',
      tex: 'u_{\\text{scale}} = \\dfrac{\\mathrm{round}(w / s_w)}{N}, \\qquad v_{\\text{scale}} = \\dfrac{\\mathrm{round}(h / s_h)}{N}',
      readAloud:
        '$w$ は面の実寸の幅、$s_w$ は窓の間隔、$N$ はテクスチャに入っている窓の数（片側 $8$ 個）です。実寸を間隔で割って**窓が何個入るか**を出し、テクスチャの窓の数で割ると、$UV$ に掛ける倍率になります。四捨五入するのは、窓を半分で切らないためです。',
      worked: {
        given: '窓の間隔 $s_w = 2.4$、階高 $s_h = 3.4$、テクスチャは $8 \\times 8$ 個。$2$ 棟で計算します。',
        steps: [
          { calc: '幅 12・高さ 20 のビル' },
          { calc: '  横 : round(12 / 2.4) = 5 個' },
          { calc: '      u_scale = 5 / 8 = 0.625' },
          { calc: '  縦 : round(20 / 3.4) = 6 階' },
          { calc: '      v_scale = 6 / 8 = 0.750' },
          { calc: '幅 24・高さ 46 のビル' },
          { calc: '  横 : round(24 / 2.4) = 10 個' },
          { calc: '      u_scale = 10 / 8 = 1.25', note: '1 を超える' },
          { calc: '  縦 : round(46 / 3.4) = 14 階' },
          { calc: '      v_scale = 14 / 8 = 1.75' },
        ],
        result:
          '**小さいビルはテクスチャの一部（$5 \\times 6$ 窓）だけを使い、大きいビルは $1$ を超えて繰り返します。** $1$ を超える $UV$ を扱うために \\`wrapS\\` と \\`wrapT\\` を \\`RepeatWrapping\\` にしておく必要があります ― 既定の \\`ClampToEdgeWrapping\\` のままだと、$1$ を超えた部分が**端の画素の引き伸ばし**になり、縦縞になります。どちらのビルでも、窓 $1$ 個の実寸は $2.4 \\times 3.4$ で揃います。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '面の順番は決まっています',
      text: `
\`BoxGeometry\` の $UV$ は、面ごとに $4$ 頂点ずつ、**決まった順**で並んでいます。

**$+x$、$-x$、$+y$、$-y$、$+z$、$-z$** の順で、$1$ 面あたり $4$ 頂点。

面によって「幅」にあたる実寸が違うことに注意してください。

- $+x$ / $-x$ の面 … 横は**奥行き $d$**、縦は高さ $h$
- $+z$ / $-z$ の面 … 横は**幅 $w$**、縦は高さ $h$
- $+y$ / $-y$ の面（屋上と底） … **窓は要らない**

屋上に窓が貼られると、上から見たときに**屋根がガラスになります。**
そこだけは $UV$ を「テクスチャの窓のない一角」に潰しておきます。
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

\`emissiveMap\` に入れておくと、\`emissiveIntensity\` という**$1$ つの数値**で
街全体の窓を一斉に消したり点けたりできます。昼は $0$、夜は $1.2$。

**次の章の昼夜の切り替えが、これで $1$ 行になります。**

あわせて $2$ つ設定します。

- \`wrapS\` / \`wrapT\` を \`RepeatWrapping\` に … $UV$ が $1$ を超えるため
- \`magFilter\` を \`NearestFilter\` に … 窓の輪郭をぼかしたくないため

$2$ つめは好みですが、ローポリの街には四角い窓のほうが似合います。
`,
    },
    {
      kind: 'sandbox',
      title: 'UV を実寸に合わせる / 合わせない',
      guide: { focus: ['窓のテクスチャを、コードで作る', 'ここだけが違う ― UV を実寸に合わせるか'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SCALE_UV = true;   // false にすると、どの建物にも 8x8 の窓が貼られる

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x161a26);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 200);
camera.position.set(0, 20, 62);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 12, 0);

const sun = new THREE.DirectionalLight(0xffe8c4, 2.2);
sun.position.set(30, 40, 30);
scene.add(sun, new THREE.HemisphereLight(0x9db8ff, 0x2a2a33, 0.7));

/* ---- 窓のテクスチャを、コードで作る ---- */
// 8x8 の窓。左上の一角だけ窓を置かず、屋上の UV をそこへ逃がす

function makeWindowTexture() {
  const N = 8;
  const CELL = 16;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = N * CELL;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffd9a0';

  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      if (row === 0 && col === 0) continue;   // 窓のない一角
      ctx.fillRect(col * CELL + 4, row * CELL + 5, CELL - 8, CELL - 9);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;   // UV が 1 を超えるので必要
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter; // 窓の輪郭をぼかさない
  return texture;
}

const windows = makeWindowTexture();

/* ---- ここだけが違う ― UV を実寸に合わせるか ---- */

function scaleBoxUv(geometry, w, h, d) {
  const uv = geometry.getAttribute('uv');
  const cols = (size) => Math.max(1, Math.round(size / 2.4)) / 8;
  const rows = Math.max(1, Math.round(h / 3.4)) / 8;

  const faces = [
    { u: cols(d), v: rows },   // +x
    { u: cols(d), v: rows },   // -x
    null,                      // +y（屋上）
    null,                      // -y
    { u: cols(w), v: rows },   // +z
    { u: cols(w), v: rows },   // -z
  ];

  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const at = f * 4 + i;
      if (faces[f] === null) uv.setXY(at, 0.06, 0.06);
      else uv.setXY(at, uv.getX(at) * faces[f].u, uv.getY(at) * faces[f].v);
    }
  }
}

const material = new THREE.MeshStandardMaterial({
  color: 0x6b7280,
  roughness: 0.85,
  emissive: 0xffffff,
  emissiveMap: windows,
  emissiveIntensity: 1.1,   // 夜の明るさ。昼は 0 にする
});

// 大きさの違う 3 棟を並べる。窓 1 個の実寸が揃うかどうかを見る
[
  { x: -19.5, w: 5, h: 8, d: 5, at: 18 },
  { x: -8, w: 12, h: 20, d: 9, at: 43 },
  { x: 11, w: 24, h: 34, d: 14, at: 76 },
].forEach((spec) => {
  const geometry = new THREE.BoxGeometry(spec.w, spec.h, spec.d);
  if (SCALE_UV) scaleBoxUv(geometry, spec.w, spec.h, spec.d);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(spec.x, spec.h / 2, 0);
  scene.add(mesh);

  const div = document.createElement('div');
  div.textContent =
    spec.w + ' x ' + spec.h +
    '（窓 ' + Math.max(1, Math.round(spec.w / 2.4)) + ' x ' + Math.max(1, Math.round(spec.h / 3.4)) + '）';
  div.style.cssText =
    'position:absolute; bottom:18px; transform:translateX(-50%);' +
    'color:#9fb4d8; font:12px ui-monospace, monospace; pointer-events:none; white-space:nowrap;';
  div.style.left = spec.at + '%';
  document.body.appendChild(div);
});

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x474b56, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '$3$ 棟とも、窓 $1$ 個の大きさが揃っています。**\\`SCALE_UV\\` を \\`false\\` にしてください** ― どの建物にも $8 \\times 8$ の窓が貼られ、大きいビルの窓が $2$ 倍以上に伸び、小さいビルの窓が細かくなります。屋上を覗くと、\\`true\\` のときは窓が出ていないことも確かめられます。\\`emissiveIntensity\\` を $0$ にすると、昼の顔になります。',
    },
    {
      kind: 'md',
      text: `
## UV を書き換えると、合体できます

ここで、前の章の話が効いてきます。

$UV$ を建物ごとに書き換えるということは、
**建物ごとにジオメトリが違う**ということです。

\`InstancedMesh\` は同じジオメトリしか置けないので、
**この時点で使えなくなります。**

一方、合体は $UV$ が違っても構いません ―
どのみち $1$ 本の配列に並べるだけだからです。

**だからこの街は、合体を選んでいます。**
「速いほうを選ぶ」ではなく、**やりたいことから逆算した**選択です。

（\`InstancedMesh\` でも、インスタンスごとの属性
（\`InstancedBufferAttribute\`）で $UV$ の倍率を送れば実現できます。
ただしシェーダに手を入れることになるので、この街では割に合いません。）
`,
    },
  ],
  exercises: [
    {
      prompt: `\`wrapS\` と \`wrapT\` を \`RepeatWrapping\` にし忘れると、
幅 $24$ のビルはどう見えますか。`,
      hint: '既定は \`ClampToEdgeWrapping\` です。$UV$ が $1$ を超えたとき、何が起きますか。',
      answer: `**窓が $8$ 個並んだあと、右端の画素が横に引き伸ばされます。**

**何が起きるか**

幅 $24$ のビルの $u$ は $0$ から $1.25$ まで動きます。

\`ClampToEdgeWrapping\` は $1$ を超えた $UV$ を **$1$ に切り詰める**ので、
$u > 1$ の範囲はすべて「テクスチャの右端の画素」を指します。

- $u = 0$ 〜 $1$ … 窓が $8$ 個、正しく並ぶ
- $u = 1$ 〜 $1.25$ … 右端の $1$ 画素が、**横に引き伸ばされた縦縞**になる

**縦方向はもっと目立ちます**

高さ $46$ なら $v$ は $1.75$ まで行くので、
**上の $4$ 割が引き伸ばされた縞**になります。

高層ビルほどひどくなるので、**街のいちばん目立つ建物から壊れます。**

**気づき方**

「小さい建物は正しいのに、大きい建物だけおかしい」という症状は、
ほぼ確実に $UV$ が $1$ を超えているサインです。

**繰り返して貼るときは、必ず $2$ つセットで**

\`wrapS\` と \`wrapT\` は別々の設定です。
片方だけ直すと、**横は正しいのに縦だけ縞**という状態になります。`,
    },
    {
      prompt: `窓の間隔 $2.4$ を $1.2$（半分）に変えると、見た目はどう変わりますか。

幅 $12$ のビルで計算してください。`,
      hint: '$\\mathrm{round}(12 / 1.2)$ を計算します。',
      answer: `**窓が横に $10$ 個並びます（$5$ 個の $2$ 倍）。ビルが $2$ 倍大きく見えます。**

**計算**

$\\mathrm{round}(12 / 1.2) = 10$ 個

$u_{\\text{scale}} = 10 / 8 = 1.25$

**なぜ「大きく見える」のか**

窓は、見る人にとって**大きさの基準**です。

窓の大きさは現実でおおよそ決まっているので、
**窓が小さい ＝ 建物が大きい**と、目が自動的に解釈します。

だから同じ $12$ のビルでも、窓を細かくすると巨大に見えます。

**これは強力な道具です**

模型やゲームで「大きさを感じさせたい」とき、
物のサイズを変えるより**基準になるものを置く**ほうが効きます。

- 窓、ドア、階段、手すり
- 人、車
- レンガ、タイルの目地

**逆に、基準が無いと大きさは伝わりません。**
のっぺりした灰色の箱が模型に見えるのは、
大きさを教えてくれるものが $1$ つも無いからです。

**この街では窓が唯一の基準**なので、間隔 $2.4$ は
「街全体のスケール感」を決める数字になっています。`,
    },
    {
      prompt: `屋上（$+y$ の面）の $UV$ を、$(0.06,\\; 0.06)$ に潰しています。

なぜ $(0,\\; 0)$ ではなく $0.06$ なのでしょう。`,
      hint: 'テクスチャの端では、隣の画素と混ざることがあります。',
      answer: `**ちょうど端を指すと、繰り返しの向こう側の画素と混ざるからです。**

**何が起きるか**

$UV$ の $(0, 0)$ はテクスチャの角そのものです。

\`RepeatWrapping\` では、$0$ の手前は**$1$ の側（反対の端）**につながっています。

線形補間（\`minFilter\` のミップマップ）が働くと、
角の画素は**反対側の端の画素と混ざります。**

反対の端には窓があるので、**屋上にうっすら窓の色が乗ります。**

**$0.06$ の意味**

テクスチャは $8 \\times 8$ 個の窓、$1$ 個あたり $0.125$ の幅です。

$0.06$ は最初のセルの**ほぼ中央**を指しています。
そこを窓のない黒にしてあるので、周りの画素も黒 ―
どう混ざっても黒のままです。

**一般則**

**テクスチャの「特定の $1$ 点」を指したいときは、セルの中央を指す。**

端や境目を指すと、フィルタ・ミップマップ・繰り返しの
どれかが必ず隣を巻き込みます。

アトラス（複数の絵を $1$ 枚に詰めたテクスチャ）で
「隣の絵がにじむ」のも、まったく同じ原因です。
そちらでは絵と絵のあいだに余白（パディング）を入れて防ぎます。`,
    },
  ],
  quiz: [
    {
      q: '`BoxGeometry` の UV をそのまま使って窓のテクスチャを貼ると、何が起きますか。',
      choices: [
        '建物の大きさによらず 8×8 個の窓が貼られ、大きいビルほど窓が引き伸ばされる',
        '窓が 1 つも出ない',
        '窓が正しい間隔で並ぶ',
        'テクスチャが読み込めない',
      ],
      answer: 0,
      explain:
        'BoxGeometry の UV はどの面も 0〜1 なので、面の実寸に関係なくテクスチャ 1 枚ぶんが貼られます。幅 4 の建物にも幅 24 の建物にも同じ 8×8 個が並ぶので、大きいビルの窓は 6 倍に伸びます。実寸を窓の間隔で割って UV の倍率を出せば、どの建物でも窓 1 個の実寸が揃います。',
    },
    {
      q: '窓を `map` ではなく `emissiveMap` に入れる利点はどれですか。',
      choices: [
        '`emissiveIntensity` 1 つで、街全体の窓を一斉に点け消しできる',
        '描画が速くなる',
        '窓の形が鮮明になる',
        'UV の書き換えが不要になる',
      ],
      answer: 0,
      explain:
        'map に入れると昼も窓が明るいままになります。emissiveMap なら「自分で光っている量」なので、昼は 0、夜は 1.2 と 1 つの数値で切り替わります。次の章の昼夜の変化が、これで 1 行になります。あわせて wrapS/wrapT を RepeatWrapping に、magFilter を NearestFilter にしておきます。',
    },
    {
      q: 'UV を建物ごとに書き換えると、`InstancedMesh` が使えなくなるのはなぜですか。',
      choices: [
        'InstancedMesh は 1 つのジオメトリしか持てず、UV が違えば別のジオメトリだから',
        'InstancedMesh は emissiveMap に対応していないから',
        'UV の書き換えに時間がかかるから',
        'InstancedMesh では頂点属性が読めないから',
      ],
      answer: 0,
      explain:
        'インスタンスが共有するのはジオメトリそのもので、変えられるのは行列と色だけです。UV を建物ごとに変えるということは、建物ごとに別のジオメトリを持つということなので、条件が壊れます。合体なら UV が違っても構いません ― この街が合体を選んでいるのは、速さではなくやりたいことからの逆算です。',
    },
  ],
};
