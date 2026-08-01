import type { Chapter } from '../types.ts';

export const chapterW42: Chapter = {
  slug: 'w42-draw-calls',
  part: 'threejs',
  number: 42,
  title: 'ドローコール ― 命令の回数を減らす',
  goal: '何がドローコールを分けているのかが分かり、合体と材質の統一で回数を計画的に減らせるようになります。',
  requires: ['t11-performance'],
  mathRecall: [
    { slug: 'b11-distance', note: '回数 × 単価。掛け算だけ' },
  ],
  threeApis: [
    'BufferGeometryUtils',
    'BufferGeometry.setAttribute',
    'Material.vertexColors',
    'Object3D.frustumCulled',
    'WebGLRenderer.info',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 1 回ごとに、準備の費用がかかる

GPU に「これを描いて」と命令を送るたびに、CPU 側で準備が要ります。
どのシェーダを使うか、どの頂点バッファを読むか、どの値を渡すか ―
毎回それを設定し直します。

**三角形 $1000$ 個を $1$ 回で送る**のと、**$1$ 個を $1000$ 回送る**のとでは、
描く量は同じでも**後者が圧倒的に重い。**

Three.js では、おおまかに **「メッシュ $1$ つ ＝ ドローコール $1$ 回」** です。
木を $1000$ 本置いたら $1000$ 回になります。

**三角形の数ではありません。回数です。** ここを取り違えると、
頂点を削っても $1$ ミリ秒も速くならない、ということになります。
`,
    },
    {
      kind: 'formula',
      tex: 't_{\\text{CPU}} \\;\\approx\\; N \\times c',
      readAloud:
        'CPU 側の時間は、**ドローコールの回数 $N$** と **$1$ 回あたりの費用 $c$** の掛け算でおおよそ決まります。$c$ は端末によりますが、$0.005$ 〜 $0.02$ ms くらいです。',
      worked: {
        given:
          '\\`renderer.info.render.calls\\` が **$1{,}840$**。この端末では $1$ 回あたり **$0.012$ ms** かかると測れました。まとめて **$40$ 回**にしたら、何 ms 縮むでしょうか。',
        steps: [
          { calc: 'いま  1,840 x 0.012' },
          { calc: '     = 22.1 ms' },
          { calc: '60fps の予算 16.7 ms' },
          { calc: '  22.1 > 16.7 → 足りない' },
          { calc: 'まとめたあと 40 x 0.012' },
          { calc: '     = 0.5 ms' },
          { calc: '削減 22.1 - 0.5 = 21.6 ms' },
        ],
        result:
          '**$21.6$ ms 縮みます。** これだけで $60$ fps の予算に収まります。**注目してほしいのは、三角形の数がまったく変わっていないこと。** GPU の仕事は $1$ ミリ秒ぶんも減っていません ― 減ったのは**命令の回数だけ**です。だから「重いから頂点を減らそう」の前に、**まず \\`calls\\` を見てください。** $1{,}840$ が $40$ になる余地があるなら、そちらが先です。なお $c$ は端末によって $2$ 〜 $3$ 倍変わります。**自分の環境で測ってください** ― フレーム時間とドローコールを並べて出しておけば、$2$ 通り試すだけで求まります。',
      },
    },
    {
      kind: 'md',
      text: `
## 何がドローコールを分けるのか

**同じジオメトリと同じマテリアルの組み合わせ**でなければ、まとめられません。

つまり、こうです。

- ジオメトリが違う → 別
- **マテリアルが違う → 別**（色だけ違っても別です）
- 透明なもの → 不透明とは別に、奥から順に描かれる

**$2$ つ目が、いちばんよく踏みます。**

「箱を $100$ 個、色だけ変えて置いた」つもりでも、
\`new MeshStandardMaterial({ color })\` を $100$ 回書いていれば、
**ドローコールは $100$ 回**です。

色を個別にしたいなら、**マテリアルを分けずに色を持たせる**方法が要ります。
`,
    },
    {
      kind: 'md',
      text: `
## 手その 1 ― 頂点に色を持たせる

マテリアルを $1$ つに保ったまま、色を変えられます。

ジオメトリの \`color\` 属性に頂点ごとの色を入れ、
マテリアルに \`vertexColors: true\` を立てるだけです。

[](#/ch/w08-attributes)でやった属性の追加と、まったく同じ手です。

**色の自由度は下がります**（$1$ つのマテリアルなので、粗さや金属度は共通）。
そのかわり、$500$ 棟の街が**ドローコール $1$ 回**で描けます。
`,
    },
    {
      kind: 'md',
      text: `
## 手その 2 ― 動かないものを合体させる

**まったく動かないもの**なら、そもそも $1$ つのジオメトリに合体できます。
\`BufferGeometryUtils.mergeGeometries()\` を使います。

合体すると $1$ つのメッシュになるので、
**個別に動かすことも、個別に消すこともできなくなります。**
そのかわり、いちばん軽い。

- **\`mergeGeometries\`** … 形はばらばらでよい。**もう二度と動かさない**もの（建物・柵・地形）
- **\`InstancedMesh\`** … 同じ形が大量にある。**$1$ つずつ動かしたい**もの（次の章）
`,
    },
    {
      kind: 'code',
      title: '合体させる ＋ 頂点に色を持たせる',
      code: `import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const parts = [];
const color = new THREE.Color();

for (let i = 0; i < 200; i++) {
  const box = new THREE.BoxGeometry(1, 1 + Math.random() * 3, 1);

  // 合体する前に、それぞれの位置へ動かしておく
  box.translate(
    THREE.MathUtils.randFloatSpread(40),
    0.5,
    THREE.MathUtils.randFloatSpread(40),
  );

  // 1 個ごとの色を、頂点の属性として持たせる
  color.setHSL(Math.random() * 0.1 + 0.55, 0.5, 0.4 + Math.random() * 0.3);
  const n = box.getAttribute('position').count;
  const colors = new Float32Array(n * 3);
  for (let v = 0; v < n; v++) color.toArray(colors, v * 3);
  box.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  parts.push(box);
}

// 200 個 → 1 個のジオメトリへ。ドローコールも 200 → 1
const merged = BufferGeometryUtils.mergeGeometries(parts);

const material = new THREE.MeshStandardMaterial({
  vertexColors: true,        // これで頂点の色が効く
  roughness: 0.8,
});
scene.add(new THREE.Mesh(merged, material));

// 元のジオメトリはもう要らない
for (const part of parts) part.dispose();`,
    },
    {
      kind: 'sandbox',
      title: 'まとめる前と、まとめたあと',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// false にすると、1 棟ずつ Mesh を作ります
const MERGE = true;

const COUNT = 500;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.Fog(0x0a0a12, 30, 90);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 16, 42);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 3, 0);

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(12, 20, 10);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x241f2e, 1.1));

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(140, 140),
  new THREE.MeshStandardMaterial({ color: 0x1d2138, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// 街を作る。位置も色も同じで、まとめ方だけが違う
const rand = (i, k) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const parts = [];
const color = new THREE.Color();
const litMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 });

for (let i = 0; i < COUNT; i++) {
  const h = 1.5 + rand(i, 1) * 9;
  const box = new THREE.BoxGeometry(1.6, h, 1.6);
  box.translate((rand(i, 2) - 0.5) * 90, h / 2, (rand(i, 3) - 0.5) * 90);

  color.setHSL(0.54 + rand(i, 4) * 0.12, 0.45, 0.32 + rand(i, 5) * 0.3);
  const n = box.getAttribute('position').count;
  const colors = new Float32Array(n * 3);
  for (let v = 0; v < n; v++) color.toArray(colors, v * 3);
  box.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  parts.push(box);
}

if (MERGE) {
  // 500 個 → 1 個。マテリアルも 1 つ
  const merged = BufferGeometryUtils.mergeGeometries(parts);
  scene.add(new THREE.Mesh(merged, litMat));
  for (const part of parts) part.dispose();
} else {
  // 1 棟ずつ Mesh を作る。見た目はまったく同じ
  for (const part of parts) scene.add(new THREE.Mesh(part, litMat));
}

const readout = document.createElement('div');
readout.style.cssText =
  'position:fixed;left:12px;top:12px;padding:8px 12px;border-radius:8px;' +
  'background:rgba(10,10,18,.82);color:#e8e8f2;font:13px/1.7 monospace;' +
  'border:1px solid #3a3a5c;white-space:pre';
document.body.appendChild(readout);

let avg = 0;
let last = performance.now();

renderer.setAnimationLoop(() => {
  const now = performance.now();
  avg = avg === 0 ? now - last : avg * 0.92 + (now - last) * 0.08;
  last = now;

  controls.update();
  renderer.render(scene, camera);

  const r = renderer.info.render;
  readout.textContent =
    (MERGE ? '合体させた' : '1 棟ずつ Mesh') + '\\n' +
    '建物         ' + COUNT + ' 棟\\n' +
    'ドローコール ' + r.calls + '\\n' +
    '三角形       ' + r.triangles.toLocaleString() + '\\n' +
    'フレーム     ' + avg.toFixed(1) + ' ms';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**`MERGE` を切り替えても、見た目はまったく変わりません。** 変わるのはドローコールだけ ― 合体させれば **$2$ 回**（街と床）、$1$ 棟ずつなら **$501$ 回**です。**三角形の数は同じ**であることを確かめてください。減っているのは命令の回数だけです。',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '合体させると、視錐台カリングが効かなくなる',
      text: `
画面の外にあるものは自動で省かれます（frustumCulled、既定で有効）。
判定はメッシュ単位なので、全部を 1 つに合体させると
「画面のどこかに入っている」＝ 常に全部描く、になります。

500 棟のうち 40 棟しか見えていなくても、460 棟ぶんの三角形を送り続けます。

だから広い地形や街は、いくつかの塊に分けてください。
16 分割しておけば、ドローコールは最大 16 で、
見えていない塊は本当に描かれません。

「1 回にする」が常に最善ではありません。
`,
    },
    {
      kind: 'md',
      text: `
## 分ける単位の決め方

$1$ 回にまとめすぎても、細かく分けすぎても損をします。

**目安は「画面に入る／入らない、がはっきり分かれる単位」**です。

- **街・地形** … $50$〜$100$ m 四方の塊に分ける。$16$〜$64$ 分割くらい
- **室内** … 部屋ごと。壁で仕切られていれば、隣の部屋はまず見えない
- **小物** … 種類ごとに $1$ つ（合体ではなく \`InstancedMesh\`）

**分ける数を増やすほどドローコールは増える**ので、
$1000$ 分割しては本末転倒です。

**$10$ 〜 $100$ のあいだ**に収まるなら、たいてい良い設計です。
`,
    },
  ],
  exercises: [
    {
      prompt: `$100$ 個の箱があり、**それぞれ別の \`MeshStandardMaterial\`**（色だけ違う）を持っています。
ジオメトリは共有しています。

1. ドローコールはいくつになりますか。
2. $1$ 回にするには、どうしますか。`,
      hint: '$1$ 回のドローコールで描けるのは、何と何が同じときですか。',
      answer: `**1. $100$ 回。2. 色を頂点属性に移して、マテリアルを $1$ つにします。**

**1 ― なぜ $100$ 回なのか**

$1$ 回のドローコールで描けるのは、
**同じジオメトリ かつ 同じマテリアル**の組み合わせだけです。

ジオメトリを共有していても、**マテリアルが別なら別々に描かれます。**

マテリアルが違うということは、シェーダに渡す値（色・粗さ・金属度・テクスチャ）が
違うということなので、$1$ 回の命令では表現できません。

**「ジオメトリを使い回したから軽い」は誤解**です。
使い回して減るのはメモリで、ドローコールは減りません。

**2 ― $1$ 回にする**

**色を、マテリアルではなくジオメトリに持たせます。**

各頂点に \`color\` 属性を入れ、マテリアルには \`vertexColors: true\` を立てる。
マテリアルは $1$ つで済みます。

さらに $100$ 個のジオメトリを \`mergeGeometries\` で合体させれば、
**ドローコール $1$ 回**です。

**失うもの**

- **粗さ・金属度は共通**になります（マテリアルが $1$ つなので）
- 合体させたら**個別に動かせません**
- **視錐台カリングも効きません**

**動かしたいなら \`InstancedMesh\`**（次の章）を使ってください。
\`setColorAt()\` で $1$ つずつ色を変えられて、しかも個別に動かせます。`,
      answerCode: `import * as THREE from 'three';

// 色をジオメトリに持たせる
const color = new THREE.Color();
for (const box of boxes) {
  color.setHSL(Math.random(), 0.6, 0.5);
  const n = box.getAttribute('position').count;
  const colors = new Float32Array(n * 3);
  for (let v = 0; v < n; v++) color.toArray(colors, v * 3);
  box.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

// マテリアルは 1 つ
const material = new THREE.MeshStandardMaterial({ vertexColors: true });
const merged = BufferGeometryUtils.mergeGeometries(boxes);
scene.add(new THREE.Mesh(merged, material));`,
    },
    {
      prompt: `地形を $500$ m 四方で作ります。カメラからは、だいたい **$1$ 割ぶん**しか画面に入りません。
地形の三角形は全部で $240{,}000$ です。

1. **$1$ つに合体**させた場合、毎フレーム何三角形を送りますか。
2. **$25$ 分割**（$100$ m 四方 × $25$）した場合はどうなりますか。ドローコールは？`,
      hint: '視錐台カリングの判定は、何を単位に行われますか。',
      answer: `**1. $240{,}000$ 三角形・ドローコール $1$。2. 約 $24{,}000$ 三角形・ドローコール $3$ 前後。**

**1 ― $1$ つに合体させた場合**

ドローコールは $1$ 回。ここは理想的です。

ところが**視錐台カリングはメッシュ単位**で判定します。

合体した $1$ つのメッシュは、画面のどこかに入っていれば「見えている」と判定され、
**$240{,}000$ 三角形すべてが毎フレーム GPU に送られます。**

見えているのは $1$ 割なのに、$10$ 割ぶん働いています。

**2 ― $25$ 分割した場合**

$1$ 塊は $240{,}000 \\div 25 = 9{,}600$ 三角形。

画面に入るのは全体の $1$ 割なので、$25$ 塊のうち **$2$〜$3$ 塊**。
（境界にまたがるぶんが出るので、ちょうど $2.5$ にはなりません。）

送られるのは $9{,}600 \\times 3 \\approx 28{,}800$ 三角形 ―
おおよそ**$24{,}000$〜$29{,}000$**。

ドローコールは、描かれた塊の数だけなので **$3$ 前後**。

**まとめると**

| | ドローコール | 三角形 |
|---|---|---|
| 合体 $1$ つ | $1$ | $240{,}000$ |
| $25$ 分割 | $3$ | $約 28{,}800$ |

**ドローコールが $2$ 増える代わりに、三角形が $8$ 分の $1$ 以下**になりました。

$1$ 回あたり $0.012$ ms なら、増えた費用は $0.024$ ms。
削れた三角形 $21$ 万個は、それよりはるかに高くつきます。

**「$1$ 回にする」が常に最善ではない**

まとめる目的は、**回数を $10$〜$100$ の範囲に収めること**であって、
$1$ にすることではありません。

$1$ にすると、こんどはカリングという別の仕組みを殺します。

**分ける単位は「画面に入る／入らないがはっきり分かれる大きさ」**です。`,
    },
    {
      prompt: `\`renderer.info.render.calls\` を出したら **$620$** でした。
シーンにあるのは、地形 $1$ つ・木 $300$ 本・岩 $120$ 個・建物 $80$ 棟・ライト $3$ つです。

1. **$620$ という数はどこから来ていますか。**
2. どこから手をつけますか。`,
      hint: '影を落とすライトがあると、同じものが何回描かれますか。',
      answer: `**$1$. 物体 $501$ 個 ＋ 影のための描き直しです。2. まず木、次に岩。**

**1 ― 内訳**

物体の数を足すと $1 + 300 + 120 + 80 = 501$。

$620 - 501 = 119$。この差はどこから来たのでしょうか。

**影です。** 影を落とすライトが $1$ つあると、
シャドウマップを作るために**もう一度シーンを描きます。**

$3$ つのライトのうち $1$ つが \`castShadow\` なら、
その光から見える物体ぶんだけ、追加のドローコールが出ます。

$119$ 個ぶんが影に写り込む範囲にあった、と読めます。

**ライトの数そのものはドローコールを増やしません**（$1$ 回の描画の中で計算されます）。
増やすのは**影**です。

**2 ― 手のつけ方**

**多いものから。** 木 $300$ 本がいちばん大きい。

- **木** … 同じ形が $300$ 本。**\`InstancedMesh\` で $1$ 回**（種類が $3$ 種なら $3$ 回）
- **岩** … 同じく $120$ 個 → **$1$〜$3$ 回**
- **建物** … 形がばらばらなら \`mergeGeometries\`。ただし**塊に分ける**（前の演習）
- **地形** … $1$ つのままでよいが、広いなら分割する

まとめたあとの見積もりは、こうなります。

$1$（地形）$+ 3$（木）$+ 2$（岩）$+ 8$（建物の塊）$= 14$

影のぶんを足しても $30$ 前後。**$620 \\to 30$。**

**順番の決め方**

**「同じ形が何個あるか」で並べてください。**

$300$ 本を $1$ 回にするのは大きな勝ちですが、
$1$ 個しかない地形をどう工夫しても $1$ 回は $1$ 回です。

**そして、まとめる前と後で \`calls\` を必ず見比べてください。**
思ったほど減っていないなら、マテリアルがどこかで分かれています。`,
    },
  ],
  quiz: [
    {
      q: 'ジオメトリを共有した Mesh を 100 個作りました。マテリアルは 1 個ずつ別です。ドローコールはいくつですか。',
      choices: ['100 回', '1 回', '2 回', '0 回'],
      answer: 0,
      explain:
        '1 回で描けるのは「同じジオメトリ かつ 同じマテリアル」だけです。マテリアルが違えばシェーダに渡す値が違うので、まとめられません。色を頂点属性に移してマテリアルを 1 つにしてください。',
    },
    {
      q: '地形を 1 つのメッシュに合体させました。画面には 1 割しか入っていません。毎フレーム送られる三角形は？',
      choices: [
        '全部。合体すると視錐台カリングがメッシュ単位で効かなくなる',
        '1 割だけ。カリングが効く',
        '半分',
        '描画されない',
      ],
      answer: 0,
      explain:
        'カリングの判定はメッシュ単位です。1 つに合体させると「画面のどこかに入っている」となり、全部が送られます。広いものは塊に分けてください ― まとめる目的は回数を 10〜100 に収めることで、1 にすることではありません。',
    },
    {
      q: '物体は 501 個なのに `calls` が 620 でした。差の 119 はどこから来ましたか。',
      choices: [
        '影。シャドウマップを作るためにシーンをもう一度描いている',
        'ライトが 3 つあるから',
        'アンチエイリアス',
        'OrbitControls',
      ],
      answer: 0,
      explain:
        'ライトの数そのものはドローコールを増やしません（1 回の描画の中で計算されます）。増やすのは影で、`castShadow` のライトごとにシーンをもう一度描きます。',
    },
  ],
};
