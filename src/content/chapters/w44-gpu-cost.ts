import type { Chapter } from '../types.ts';

export const chapterW44: Chapter = {
  slug: 'w44-gpu-cost',
  part: 'threejs',
  number: 44,
  title: 'GPU が重いとき ― 画素の数で決まる',
  goal: '画素あたりの費用を見積もれるようになり、ピクセル比・重なり・影・ポストプロセスのどれを削るかを数字で選べるようになります。',
  requires: ['w43-instancing'],
  mathRecall: [
    { slug: 'b11-distance', note: '画素の数は、掛け算で出る' },
  ],
  threeApis: [
    'WebGLRenderer.setPixelRatio',
    'WebGLRenderer.getPixelRatio',
    'LOD',
    'Object3D.frustumCulled',
    'DirectionalLight.shadow',
    'WebGLRenderTarget',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## ウィンドウを縮めて軽くなったなら

[](#/ch/t11-performance)の切り分けで**GPU 側**だと分かったら、
考えることは $1$ つだけです。

**画素を何回塗っているか。**

GPU の仕事は、おおまかに「塗った画素の数 × $1$ 画素あたりの計算」です。
どちらを減らしても効きます。

そして**画素の数は、掛け算で決まります** ― だから効き方が急です。
`,
    },
    {
      kind: 'formula',
      tex: 'P \\;=\\; w \\times h \\times \\text{dpr}^2 \\times k',
      readAloud:
        '塗る画素の数 $P$ は、**CSS 上の幅 × 高さ**に、**ピクセル比の $2$ 乗**を掛けたものです。$k$ は「同じ画素を何回塗り直したか」（重なりの平均枚数）。**$\\text{dpr}$ は $2$ 乗で効きます。**',
      worked: {
        given:
          'フル HD（$1920 \\times 1080$）の画面いっぱいに描いています。端末の \\`devicePixelRatio\\` は **$2$**。ピクセル比を **$1.5$** に落とすと、画素の数はどれだけ減るでしょうか。',
        steps: [
          { calc: 'dpr = 2 のとき' },
          { calc: '  1920 x 2 = 3,840' },
          { calc: '  1080 x 2 = 2,160' },
          { calc: '  3,840 x 2,160 = 8,294,400' },
          { calc: 'dpr = 1.5 のとき' },
          { calc: '  2,880 x 1,620 = 4,665,600' },
          { calc: '比 4,665,600 / 8,294,400' },
          { calc: '  = 0.5625' },
          { calc: '減少 1 - 0.5625 = 43.75%' },
        ],
        result:
          '**$44\\%$ 減ります。** ピクセル比を「$2 \\to 1.5$」と $25\\%$ 下げただけなのに、画素は $44\\%$ 減る ― **$2$ 乗で効く**からです。$1$ に落とせば $\\left(\\frac{1}{2}\\right)^2 = \\frac{1}{4}$、つまり **$75\\%$ 減**。GPU 側が原因なら、**これが $1$ 行で打てる最大の手**です。そして $1.5$ と $2$ の見た目の差は、スマートフォンではまず分かりません ― **文字は $2$ のほうが綺麗ですが、$3$D の絵は $1.5$ でほとんど同じ**です。まず \\`setPixelRatio(Math.min(devicePixelRatio, 1.5))\\` を試してください。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'devicePixelRatio をそのまま渡さない',
      text: `
最近のスマートフォンは devicePixelRatio が 3 や 4 です。

setPixelRatio(window.devicePixelRatio) と書くと、
1080 x 2400 の画面で 3240 x 7200 = 2,300 万画素を塗ることになります。

デスクトップのフル HD の 2.8 倍です。
「スマホだけ極端に重い」の、いちばん多い原因がこれ。

Math.min(window.devicePixelRatio, 2) を上限にしてください。
重ければ 1.5 まで落として構いません。
`,
    },
    {
      kind: 'md',
      text: `
## $k$ ― 同じ画素を、何回塗るか

$P$ の式の $k$ は、**重なりの枚数**です。

不透明なものは奥から手前へ描かれ、**深度テストで手前だけが残ります。**
それでも、**描く順によっては何度も塗ります**（これを{{オーバードロー}}と呼びます）。

**そして透明なものは、深度テストで捨てられません。**
[](#/ch/w12-transparent)でやったとおり、透明は奥から順に、**全部塗ります。**

木の葉を $1$ 枚 $1$ 枚半透明の板で作ると、
$1$ 本の木を見通すあいだに $20$ 枚の板を通ることがあります ―
**その画素は $20$ 回塗られます。**

**画面が大きいほど、この $20$ 倍がそのまま効きます。**
`,
    },
    {
      kind: 'md',
      text: `
## 重なりを減らす手

- **葉を \`alphaTest\` で抜く** … \`transparent: true\` をやめ、
  \`alphaTest: 0.5\` にすると**不透明として扱われ、深度テストが効きます。**
  縁のぼかしは失われますが、$k$ が劇的に下がります
- **透明な面を減らす** … 煙・炎・雲は、**枚数を半分にして $1$ 枚を濃くする**
- **背景を塗らない** … \`scene.background\` があるなら、
  空を覆う大きな球は要りません（$1$ 枚ぶん減ります）
- **手前から描かせる** … 不透明なものは three が自動で手前から並べます。
  \`renderOrder\` をむやみに触ると、この最適化を壊します
`,
    },
    {
      kind: 'sandbox',
      title: '画素の数と、重なりの枚数',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1, 1.5, 2 で切り替えてみてください
const PIXEL_RATIO = 2;

// true にすると、半透明をやめて alphaTest にします
const ALPHA_TEST = false;

const LAYERS = 14;          // 重ねる板の枚数

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 7.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, PIXEL_RATIO));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x241f2e, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 1.8);
key.position.set(3, 5, 6);
scene.add(key);

// 葉のような、穴のあいた模様を作る
const canvas = document.createElement('canvas');
canvas.width = canvas.height = 128;
const ctx = canvas.getContext('2d');
ctx.clearRect(0, 0, 128, 128);
ctx.fillStyle = '#7cf5a0';
for (let i = 0; i < 3; i++) {
  ctx.beginPath();
  ctx.ellipse(64, 64, 58, 13, (i * Math.PI) / 3, 0, Math.PI * 2);
  ctx.fill();
}
const leaf = new THREE.CanvasTexture(canvas);
leaf.colorSpace = THREE.SRGBColorSpace;

// 画面いっぱいに、板を重ねる
const geo = new THREE.PlaneGeometry(3.4, 3.4);
const group = new THREE.Group();
scene.add(group);

for (let i = 0; i < LAYERS; i++) {
  const mat = ALPHA_TEST
    ? new THREE.MeshStandardMaterial({ map: leaf, alphaTest: 0.5, side: THREE.DoubleSide })
    : new THREE.MeshStandardMaterial({ map: leaf, transparent: true, opacity: 0.5, side: THREE.DoubleSide });

  const plane = new THREE.Mesh(geo, mat);
  plane.position.z = -i * 0.16;
  plane.rotation.z = i * 0.42;
  group.add(plane);
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

  group.rotation.z += 0.0015;
  controls.update();
  renderer.render(scene, camera);

  const dpr = renderer.getPixelRatio();
  const px = window.innerWidth * dpr * window.innerHeight * dpr;
  readout.textContent =
    (ALPHA_TEST ? 'alphaTest（不透明扱い）' : '半透明（深度テストが効かない）') + '\\n' +
    'ピクセル比 ' + dpr.toFixed(2) + '\\n' +
    '画素       ' + (px / 1e6).toFixed(2) + ' M\\n' +
    '重ねた板   ' + LAYERS + ' 枚\\n' +
    '全画面 x 枚数 ' + ((px * LAYERS) / 1e6).toFixed(0) + ' M 回\\n' +
    'フレーム   ' + avg.toFixed(1) + ' ms';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**「全画面」にしてから、`PIXEL_RATIO` を $2 \\to 1$ に変えてみてください。** 画素が $\\frac{1}{4}$ になり、フレーム時間もそれに近く減ります。次に `ALPHA_TEST` を `true` にすると、**同じ枚数のまま**深度テストが効くようになり、手前の板に隠れた画素が塗られなくなります ― 見た目は「ふちがくっきりする」だけです。',
    },
    {
      kind: 'md',
      text: `
## 影とポストプロセスは、まるごと 1 画面ぶん

**影**は、光から見たシーンを**もう $1$ 枚描いて**います。
$2048 \\times 2048$ のシャドウマップは $419$ 万画素 ― フル HD の $2$ 倍です。

[](#/ch/w21-shadow-quality)でやったとおり、
**効くのは解像度より範囲**です。範囲を半分にすれば、
同じ解像度で密度が $4$ 倍になります。

**ポストプロセス**は、$1$ パスごとに**画面全体をもう一度塗ります。**

ブルームは内部で何段も縮小・拡大するので、
$1$ 効果で「画面 $2$〜$3$ 枚ぶん」と思ってください。

**どちらも、シーンの中身とは無関係に一定の費用がかかります。**
物体を $1$ つに減らしても、影とポストプロセスの費用は変わりません。
`,
    },
    {
      kind: 'md',
      text: `
## 描かなくていいものを描かない

- **{{視錐台カリング}}** … 画面の外は自動で省かれます（既定で有効）。
  ただし[](#/ch/w42-draw-calls)のとおり、**合体させすぎると効かなくなります**
- **\`LOD\`** … 遠くのものを粗いモデルに差し替える仕組み。
  距離ごとに $2$〜$3$ 段用意して \`lod.addLevel(mesh, distance)\` で登録します
- **描画そのものを止める** … 動きがないときは \`render\` を呼ばない。
  静止画を見ているだけの画面で $60$ fps を回す理由はありません
- **フォグで遠景を隠す** … 見えなくなる距離まで \`far\` を縮められます

**最後の $1$ つが、いちばん安上がりです。**
フォグの終わりと \`camera.far\` を合わせておけば、
「見えないのに描いている」がまとめて消えます。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '端末に合わせて、1 つの値から決める',
      text: `
最初のフレームで軽く測り、その結果からピクセル比・影・
ポストプロセスをまとめて決めてしまうのが実用的です。

品質を high / medium / low の 1 つの値にして、
そこから全部を導く ― 個別に切り替える UI を作るより、
はるかに保守しやすくなります。

読者が選べるようにするなら、その 3 段だけを見せてください。
つまみを 12 個並べても、誰も正しく設定できません。
`,
    },
    {
      kind: 'md',
      text: `
## 削る順番（GPU 側）

$1$ 行で効く順に並べると、こうなります。

1. **ピクセル比を下げる** … $2 \\to 1.5$ で $44\\%$ 減。**$1$ 行**
2. **ポストプロセスを $1$ つ外す** … 画面 $2$〜$3$ 枚ぶん
3. **影の範囲を狭める** … 解像度より先にこちら
4. **透明を \`alphaTest\` に変える** … 重なりの $k$ が下がる
5. **{{アンチエイリアス}}を切る**（\`antialias: false\`）… 効果のわりに見た目の劣化が小さい
6. **シェーダを削る** … 手間が大きい。最後

**$1$ をやらずに $6$ をやる人が、とても多い。**
測ってから、上から順に試してください。
`,
    },
  ],
  exercises: [
    {
      prompt: `スマートフォン（CSS 上 $390 \\times 844$、\`devicePixelRatio\` は **$3$**）で動かします。

1. \`setPixelRatio(devicePixelRatio)\` と書いた場合、塗る画素はいくつですか。
2. 上限を $2$ にした場合、$1.5$ にした場合はそれぞれいくつで、何 $\\%$ 減りますか。`,
      hint: '$P = w \\times h \\times \\text{dpr}^2$。',
      answer: `**1. $296$ 万画素。2. $2$ で $132$ 万（$56\\%$ 減）、$1.5$ で $74$ 万（$75\\%$ 減）。**

**1 ― そのまま渡した場合**

$390 \\times 3 = 1{,}170$、$844 \\times 3 = 2{,}532$

$1{,}170 \\times 2{,}532 = 2{,}962{,}440$ ― **約 $296$ 万画素**

**フル HD（$207$ 万）より多い**ことに注目してください。
$6$ インチの画面で、デスクトップの大画面より $43\\%$ 多く塗っています。

**2 ― 上限をかける**

**$\\text{dpr} = 2$**

$780 \\times 1{,}688 = 1{,}316{,}640$ ― 約 $132$ 万画素

$1 - \\dfrac{2^2}{3^2} = 1 - \\dfrac{4}{9} = 0.556$ ― **$56\\%$ 減**

**$\\text{dpr} = 1.5$**

$585 \\times 1{,}266 = 740{,}610$ ― 約 $74$ 万画素

$1 - \\dfrac{1.5^2}{3^2} = 1 - \\dfrac{2.25}{9} = 0.75$ ― **$75\\%$ 減**

**なぜこれほど効くのか**

$\\text{dpr}$ は**$2$ 乗で効く**からです。

$3 \\to 2$ は「$\\frac{2}{3}$ にした」だけですが、面積は $\\frac{4}{9}$。
$3 \\to 1.5$ は「半分」ですが、面積は $\\frac{1}{4}$。

**GPU 側が原因なら、これが $1$ 行で打てる最大の手です。**

**見た目はどれだけ落ちるか**

$3$ と $2$ の差は、**$3$D の絵ではまず分かりません。**
$2$ と $1.5$ になると、細い線や文字の縁にわずかな粗さが出ます。

**文字は DOM で描いてください。** キャンバスの外に置けば、
ピクセル比を下げても文字だけは常に綺麗なままです。

**まとめ**

\`renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))\`

これを書かずに公開すると、「スマホだけ極端に重い」になります。`,
    },
    {
      prompt: `木の葉を、**半透明の板 $1{,}200$ 枚**で作りました。
画面（$1920 \\times 1080$、$\\text{dpr} = 2$）の中央に木があり、
その領域では**平均 $18$ 枚**の葉が重なっています。木は画面の $\\frac{1}{3}$ を占めます。

1. 葉のせいで塗られる画素は、およそ何回ですか。
2. \`alphaTest\` に変えると、何が変わりますか。`,
      hint: '透明なものは、深度テストで捨てられません。',
      answer: `**1. 約 $5{,}000$ 万回。2. 重なりの $k$ が $18$ から $1$ 前後に落ちます。**

**1 ― いまの塗り回数**

画面全体の画素は

$1920 \\times 2 \\times 1080 \\times 2 = 8{,}294{,}400$

木が占めるのはその $\\frac{1}{3}$

$8{,}294{,}400 \\div 3 = 2{,}764{,}800$

そこを平均 $18$ 枚が重なって塗ります。

$2{,}764{,}800 \\times 18 = 49{,}766{,}400$ ― **約 $5{,}000$ 万回**

**画面全体を $6$ 回塗り直しているのと同じ**です（$4{,}977$ 万 ÷ $829$ 万 $= 6.0$）。

しかも $1$ 画素ごとにマテリアルの計算（ライト・テクスチャ）が走ります。

**2 ― \`alphaTest\` にすると**

\`transparent: true\` をやめ、\`alphaTest: 0.5\` にします。

すると three はその板を**不透明として扱い、深度テストが効きます。**

手前の葉が書き込んだ深度によって、**奥の葉の画素は捨てられます。**
$k$ は $18$ から **$1$ 前後**（見えている葉の枚数）まで落ちます。

$2{,}764{,}800 \\times 1 \\approx 276$ 万回 ― **$18$ 分の $1$。**

**失うもの**

**葉のふちのぼかしが消えます。** $\\alpha$ が $0.5$ 未満の画素は
「無い」ものとして完全に捨てられるので、境界がぎざぎざになります。

対策は $2$ つ。

- **\`alphaToCoverage: true\`** … MSAA を使って境界をなめらかにする
  （\`antialias: true\` が要ります）
- **テクスチャの解像度を上げる** … ふちの階段が細かくなる

**それでも半透明より、ほぼ常に良い取引です。**

**なぜ半透明はこんなに高いのか**

深度テストで捨てられないからです。
[](#/ch/w12-transparent)でやったとおり、透明は**奥から順に全部塗って混ぜます。**

$18$ 枚あれば $18$ 回。$1$ 枚も省けません。

**草・葉・金網・髪 ― 「穴があいているだけ」のものは、
半透明ではなく \`alphaTest\` です。**`,
      answerCode: `// 半透明（深度テストが効かない・重なりぶん全部塗る）
const slow = new THREE.MeshStandardMaterial({
  map: leafTexture,
  transparent: true,
  side: THREE.DoubleSide,
});

// alphaTest（不透明扱い・深度テストが効く）
const fast = new THREE.MeshStandardMaterial({
  map: leafTexture,
  alphaTest: 0.5,
  alphaToCoverage: true,   // ふちのぎざぎざを MSAA でならす
  side: THREE.DoubleSide,
});`,
    },
    {
      prompt: `フレーム時間は $28$ ms、$60$ fps の予算に **$11.3$ ms** 足りません。
ウィンドウを縮めると軽くなるので、GPU 側です。内訳を測ったら、

- ブルーム $6.2$ ms
- 影（$2048^2$、範囲 $200$ m）$4.1$ ms
- シーン本体 $9.8$ ms
- その他 $7.9$ ms

**どこから、どう削りますか。** 削れる量も見積もってください。`,
      hint: '「$1$ 行で効く」ものから並べてください。',
      answer: `**ピクセル比を $2 \\to 1.5$、影の範囲を $200 \\to 60$ m。これで届きます。**

**手 $1$ ― ピクセル比 $2 \\to 1.5$（$1$ 行）**

画素が $44\\%$ 減ります。

画素の数に比例するのは、**ブルーム・シーン本体・その他**です
（影は光から見た別の描画なので、画面のピクセル比とは無関係）。

$(6.2 + 9.8 + 7.9) \\times 0.44 = 23.9 \\times 0.44 = 10.5$ ms

**$10.5$ ms 削れます。** これだけでほぼ届きました。

**手 $2$ ― 影の範囲を $200 \\to 60$ m**

シャドウマップの解像度はそのままに、範囲を狭めます。

描く量そのものは変わりませんが、**範囲外の物体が描画から外れる**ので、
実際には $2$ 〜 $3$ ms 減ることが多い。ここでは控えめに **$1.5$ ms** とします。

しかも[](#/ch/w21-shadow-quality)のとおり、
**範囲を狭めると影の品質は上がります** ― 珍しく、両取りできる手です。

**合計**

$10.5 + 1.5 = 12.0$ ms

$28 - 12.0 = 16.0$ ms ― **予算 $16.7$ ms に収まりました。**

**なぜブルームを外さなかったのか**

$6.2$ ms は確かに大きい。**外せば一発で届きます。**

けれどブルームは**見た目に直結する効果**です。
ピクセル比 $1.5$ は言われなければ気づきませんが、
ブルームが消えたことは一目で分かります。

**気づかれない手から順に打つ。** これが順番の理由です。

**それでも足りなかったら**

$3$. ブルームの解像度を半分にする（$6.2 \\to 2$ ms 前後）。
効果は残したまま、費用だけ落とせます。

$4$. \`antialias: false\`。ピクセル比 $1.5$ なら、切っても差は小さい。

$5$. それでも駄目なら、ブルームを外す。

**そして、直したあとにもう一度測ってください。**
見積もりが外れることは、ふつうにあります。`,
    },
  ],
  quiz: [
    {
      q: 'ピクセル比を 2 から 1.5 に下げると、塗る画素はどれだけ減りますか。',
      choices: ['約 44%', '25%', '50%', '変わらない'],
      answer: 0,
      explain:
        '画素は面積なので dpr は 2 乗で効きます。(1.5/2)² = 0.5625、つまり 44% 減。1 に落とせば 75% 減です。GPU 側が原因なら、1 行で打てる最大の手です。',
    },
    {
      q: '半透明の葉が 18 枚重なっています。`alphaTest: 0.5` に変えると何が起きますか。',
      choices: [
        '不透明として扱われ、深度テストで奥の画素が捨てられる',
        '描画順が変わるだけで、費用は同じ',
        '葉が消える',
        'ドローコールが減る',
      ],
      answer: 0,
      explain:
        '透明なものは深度テストで捨てられないので、18 枚ぶん全部塗ります。alphaTest なら手前の葉が深度を書き込み、奥は捨てられます。失うのはふちのぼかしだけ（alphaToCoverage でならせます）。',
    },
    {
      q: 'スマートフォンだけ極端に重い。まず疑うのはどれですか。',
      choices: [
        '`setPixelRatio(window.devicePixelRatio)` と書いている（dpr が 3 や 4）',
        'ドローコールが多い',
        'モデルの三角形が多い',
        'JavaScript が遅い',
      ],
      answer: 0,
      explain:
        'dpr 3 の 390x844 は 296 万画素 ― フル HD より多く塗ります。Math.min(devicePixelRatio, 2) を上限にしてください。これを書かずに公開すると、まずここで詰まります。',
    },
  ],
};
