import type { Chapter } from '../types.ts';

export const chapterW21: Chapter = {
  slug: 'w21-shadow-quality',
  part: 'threejs',
  number: 21,
  title: '影の質 ― 縞・ギザギザ・浮き',
  goal: '影の 3 つの不具合を見分けられるようになり、範囲・解像度・bias を狙って調整できるようになります。',
  requires: ['w20-shadow'],
  threeApis: [
    'LightShadow.mapSize',
    'LightShadow.bias',
    'LightShadow.normalBias',
    'LightShadow.radius',
    'WebGLRenderer.shadowMap',
    'PCFSoftShadowMap',
  ],
  mathRecall: [
    { slug: 'b06-float', note: '浮動小数の精度が足りないと、比較が狂う' },
    { slug: 'b05-ratio', note: '範囲を 2 倍にすると、1 画素あたりの受け持ちは 4 倍' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 影は「粗い写真」でしかない

前の章で、影の正体は**光から見た距離の記録**だと分かりました。

その記録は、**決まった大きさの画像**に収められます。three の既定は $512 \\times 512$。
たったこれだけです。

だから影には、必ず 3 種類の不具合が出ます。

- **縞模様になる**（シャドウアクネ）… 精度が足りず、面が自分の影に入る
- **ふちがギザギザ**（エイリアシング）… 画素が足りず、境界が階段になる
- **浮いて見える**（ピーターパン現象）… ずらしすぎて、影が本体から離れる

**この 3 つは互いに引っぱり合います。** 1 つを直すと別の 1 つが悪くなる。
だから「どれを取るか」を意識して調整します。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '短い毛布',
      text: `
頭まで掛ければ足が出る。足を隠せば頭が出る。

シャドウアクネを消そうと bias を大きくすれば、影が浮きます。
影を近づけようと bias を小さくすれば、縞が出ます。

毛布を長くする方法もあります ―
解像度を上げるか、範囲を狭めるか。
どちらも「1 画素あたりの精度」を上げる操作です。
`,
    },
    {
      kind: 'md',
      text: `
## 1. 縞模様（シャドウアクネ）

面が**まだらな縞**になる症状です。前の章の計算例で見たとおり、
**面が自分自身の影に入っている**状態です。

原因は精度です。シャドウマップに記録される距離は有限の桁数しか持てません。
$5.0$ のはずが $4.9997$ や $5.0003$ になる。
すると $5.0 > 4.9997$ が成り立ってしまい、その画素は「影の中」と判定されます。

**直し方は 2 つ。**

- **\`shadow.bias\`** … 比べる前に、距離を少しだけ引く。$-0.0005$ くらいの**負の値**
- **\`shadow.normalBias\`** … 比べる点を、**法線の向きに少しずらす**。$0.02$ くらい

**\`normalBias\` のほうが優秀**です。
アクネは**光に対して斜めの面ほど強く出る**のですが、
\`normalBias\` は法線方向にずらすので、斜めの面ほど大きくずれる ―
つまり**必要なところだけ強く効きます。**

\`bias\` は一律にずらすので、平らな面には効きすぎ、斜めの面には足りません。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{受け持つ面積} \\;=\\; \\left(\\frac{\\text{範囲の幅}}{\\text{mapSize}}\\right)^{2}',
      readAloud:
        'シャドウマップの 1 画素が、世界の中で何平方単位ぶんを受け持っているか。この値が小さいほど影は精細になります。範囲を狭めるか、解像度を上げるか、どちらでも同じ効果です。',
      worked: {
        given:
          '$512 \\times 512$ のシャドウマップで、**範囲 $\\pm 5$**（幅 $10$）と**範囲 $\\pm 50$**（幅 $100$）を比べます。',
        steps: [
          { calc: '範囲 ±5  : 10 / 512 = 0.0195 単位 / 画素' },
          { calc: '           面積 = 0.0195^2 = 0.00038' },
          { calc: '範囲 ±50 : 100 / 512 = 0.195 単位 / 画素' },
          { calc: '           面積 = 0.195^2 = 0.038', note: '100 倍' },
          { calc: '【解像度を 4 倍にすると】' },
          { calc: '範囲 ±50, 2048 : 100 / 2048 = 0.0488' },
          { calc: '           面積 = 0.00238', note: 'まだ ±5 の 6 倍粗い' },
        ],
        result:
          '**範囲を $10$ 倍広げると、粗さは $100$ 倍**になります。いっぽう**解像度を $4$ 倍にしても、改善は $16$ 分の 1 まで** ― しかも**メモリは $16$ 倍**です。$512^2 \\times 4$ バイトが $2048^2 \\times 4$ バイト、$1$MB $\\to$ $16$MB。**だから、まず範囲を狭める。** ただで効きます。解像度を上げるのは、範囲を詰めきってからです。',
      },
    },
    {
      kind: 'sandbox',
      title: '3 つの不具合を、切り替えて見る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 'acne' | 'jaggy' | 'peter' | 'good' の 4 つを試してください
const MODE = 'acne';

// acne の bias が正の値なのは、精度不足を「必ず起きる形」で再現するためです。
// 実機では bias = 0 のままでも、範囲が広い・光が浅い条件で自然に同じ縞が出ます。

const presets = {
  acne:  { size: 512,  range: 14, bias: 0.0016,  normalBias: 0,    soft: false },
  jaggy: { size: 128,  range: 12, bias: 0,       normalBias: 0.03, soft: false },
  peter: { size: 1024, range: 8,  bias: -0.03,   normalBias: 0,    soft: false },
  good:  { size: 1024, range: 8,  bias: 0,       normalBias: 0.03, soft: true  },
};
const P = presets[MODE];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(3.4, 2.6, 5.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = P.soft ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.6, 0);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x9aa2b8, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// 斜めの面を持つものほど、アクネが出やすい
const shapes = [
  [new THREE.SphereGeometry(0.7, 48, 32), -1.6, 0.7],
  [new THREE.BoxGeometry(1.1, 1.1, 1.1),   0.4, 0.55],
  [new THREE.ConeGeometry(0.6, 1.4, 32),   2.2, 0.7],
];

for (const [geometry, x, y] of shapes) {
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0xd8d8e8, roughness: 0.7 }),
  );
  mesh.position.set(x, y, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(5, 3.4, 4);      // 低い角度ほどアクネが出やすい
sun.castShadow = true;

sun.shadow.mapSize.set(P.size, P.size);
sun.shadow.bias = P.bias;
sun.shadow.normalBias = P.normalBias;

const c = sun.shadow.camera;
c.left = -P.range; c.right = P.range; c.top = P.range; c.bottom = -P.range;
c.updateProjectionMatrix();

scene.add(sun, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.5));

console.log(MODE, '/ mapSize', P.size, '/ 範囲', P.range * 2,
            '/ 1画素あたり', ((P.range * 2) / P.size).toFixed(4), '単位');

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
        '**4 つとも試してください。** `acne` は球と円錐に**細かい縞**が走ります（`bias` を正の値にして、精度不足を必ず起きる形で再現しています）。`jaggy` は影のふちが**階段状**。`peter` は影が物体から**離れて浮き**、接地感が消えます。`good` は `normalBias` と `PCFSoftShadowMap` で 3 つとも解決した状態です。コンソールに「1 画素あたり何単位を受け持つか」が出ます。',
    },
    {
      kind: 'md',
      text: `
## 2. ふちのギザギザ

影の境界が**階段状**になる症状です。原因は単純で、**画素が足りない**。

上の計算例のとおり、$1$ 画素が受け持つ面積が広ければ、
その面積の中は「影か、影でないか」の**二択**にしかなりません。中間がない。

**直す順番があります。**

1. **範囲を狭める**（\`shadow.camera\`）… ただで効く。**まずこれ**
2. **\`shadowMap.type\` を \`PCFSoftShadowMap\` に** … 境界の何点かを読んで混ぜる。安い
3. **解像度を上げる**（\`shadow.mapSize\`）… メモリが $4$ 倍ずつ増える。最後の手

**\`PCFSoftShadowMap\` はほぼ常に入れる価値があります。**
費用はわずかで、境界が目に見えて自然になります。
`,
    },
    {
      kind: 'md',
      text: `
## 3. 浮いて見える（ピーターパン現象）

影が物体から**離れて**、地面に貼り付いていないように見える症状です。

原因は \`bias\` の効かせすぎです。
アクネを消そうとして $-0.02$ のような大きな値を入れると、
**影の位置そのものが本体からずれます。**

名前の由来は、影が本体から離れて動く童話です。

**接地感は、3D でいちばん壊れやすいもの**のひとつです。
足元の影がずれるだけで、物体が浮いているように見えます。

**だから \`bias\` はできるだけ $0$ に近く保ち、
アクネは \`normalBias\` で消す**のが現在の作法です。
`,
    },
    {
      kind: 'code',
      title: '調整の順番',
      code: `import * as THREE from 'three';

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true;

// --- 1. まず範囲を、必要なだけに狭める（ただで効く） ---
const c = sun.shadow.camera;
c.left = -8; c.right = 8; c.top = 8; c.bottom = -8;
c.near = 1;                 // 光から見て、この手前は写さない
c.far = 30;                 // ここより奥も写さない
c.updateProjectionMatrix();

// --- 2. 境界をなめらかに（安い） ---
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// --- 3. アクネは normalBias で消す（bias より副作用が少ない） ---
sun.shadow.normalBias = 0.02;      // 0.01 〜 0.05 あたり
sun.shadow.bias = 0;               // できるだけ 0 のままに

// --- 4. それでも足りなければ、解像度を上げる（メモリが 4 倍ずつ） ---
sun.shadow.mapSize.set(2048, 2048);

// 品質を 1 つの値から決める書き方（第5部で扱います）
const QUALITY = 1;                 // 0: 低 / 1: 中 / 2: 高
sun.shadow.mapSize.setScalar([512, 1024, 2048][QUALITY]);
renderer.shadowMap.enabled = QUALITY > 0;`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'mapSize は、作ったあとに変えても効きません',
      text: `
シャドウマップは最初に描画したときに確保されます。
あとから mapSize を変えても、確保済みのものは作り直されません。

実行中に変えるなら、古いものを明示的に捨ててください。

light.shadow.map.dispose();
light.shadow.map = null;
light.shadow.mapSize.set(2048, 2048);

これを忘れると「設定したのに変わらない」になります。
`,
    },
    {
      kind: 'md',
      text: `
## near と far も、精度に効く

\`shadow.camera\` の \`near\` と \`far\` も忘れないでください。

[](#/ch/m27-frustum)でやったとおり、**深度の精度は near で決まります。**
$\\text{near} = 0.1$、$\\text{far} = 1000$ のような広い範囲にすると、
記録される距離の精度が落ち、アクネが出やすくなります。

**光から見て、物体がある範囲だけに詰めてください。**
$\\text{near} = 1$、$\\text{far} = 30$ のように。

これは横の範囲（left/right/top/bottom）を狭めるのと**同じくらい効きます。**
そして忘れられがちです。
`,
    },
    {
      kind: 'md',
      text: `
## 柔らかい影は、作れない

現実の影は、光源が大きいほどふちがぼけます。
太陽の影はくっきり、曇り空ではほとんど影が出ない ―
**光源の見かけの大きさ**で決まります。

three の標準の影は、これを**再現できません。**
光源を点として扱っているので、**影のふちは常に同じ幅**です。

\`shadow.radius\` でぼかす量は増やせますが、
**距離によって変わるわけではない**ので、本物には見えません。

**近似する手はあります。**

- **接地部分だけ濃くする** … 丸影を重ねる
- **\`aoMap\`** … 隅の暗がりを焼き込んでおく
- **VSM / PCSS** … 距離に応じてぼかす手法。addons にはありません

**実務では、そこまでやらないことがほとんどです。**
接地感さえ出ていれば、ふちの柔らかさは気づかれません。
`,
    },
  ],
  exercises: [
    {
      prompt: `$1024 \\times 1024$ のシャドウマップで、範囲を $\\pm 4$ から $\\pm 16$ に広げました。
**1 画素あたりの受け持ちは何倍**になりますか。
同じ精度を保つには、\`mapSize\` をいくつにすればよいですか。`,
      hint: '面積で考えます。',
      answer: `**面積で $16$ 倍。同じ精度には $4096 \\times 4096$ が要ります。**

**1 画素あたりの幅**

- $\\pm 4$（幅 $8$）… $8 / 1024 = 0.00781$ 単位
- $\\pm 16$（幅 $32$）… $32 / 1024 = 0.03125$ 単位 ― **4 倍**

**面積では**

$4^2 = 16$ 倍。

**同じ精度を保つには**

幅が $4$ 倍になったので、解像度も $4$ 倍 ― $1024 \\times 4 = 4096$。

**そのメモリは**

$4096^2 \\times 4$ バイト $= 67$MB。$1024^2 \\times 4 = 4.2$MB の **$16$ 倍**です。

**これは現実的ではありません。**

$67$MB をシャドウマップ 1 枚に使うのは、[](#/ch/t04-texture)で見た
$4$K テクスチャ 1 枚ぶんに相当します。しかも**毎フレーム書き直します。**

**だから、範囲を広げないことのほうが大事**です。

**実務での解き方**

- **影が要る範囲だけに絞る。** 遠くのものの影は、そもそも見えません
- **カスケードシャドウ** … 近くは狭い範囲で高精度、遠くは広い範囲で低精度、
  と 2〜3 枚に分ける手法。広い屋外シーンの標準的な答えです
  （three の標準には入っていません）
- **遠くは影を諦める。** $\\text{far}$ の外は影なし。ほとんど気づかれません`,
    },
    {
      prompt: `影に細かい縞模様が出ています。\`bias\` を $-0.02$ にしたら縞は消えましたが、
**今度は影が物体から離れて浮いて見えます。** どう直しますか。`,
      hint: 'ずらす向きを変えてみてください。',
      answer: `**\`bias\` を $0$ に戻し、\`normalBias\` を $0.02$ くらいにします。**

**なぜ \`bias\` だと浮くのか**

\`bias\` は**光の方向に一律にずらします。**
値を大きくすると、影の判定そのものが「奥へ」動くので、
**影の位置が本体からずれます。** これがピーターパン現象です。

**なぜ \`normalBias\` なら浮きにくいのか**

\`normalBias\` は**比べる点を、面の法線の向きにずらします。**

ここが肝心です。**アクネは、光に対して斜めの面ほど強く出ます。**
斜めの面ほど、1 画素の中での距離の変化が大きいからです。

そして**法線方向にずらす量は、斜めの面ほど「光の方向から見て」大きくなります。**

つまり \`normalBias\` は、**必要なところだけ強く効く**のです。
正面を向いた平らな面ではほとんどずれないので、影も浮きません。

**\`bias\` は一律**なので、平らな面には効きすぎ（浮く）、
斜めの面には足りない（縞が残る）という板挟みになります。

**手順**

1. \`bias = 0\`、\`normalBias = 0\` から始める
2. \`normalBias\` を $0.01$ から少しずつ上げ、縞が消えたところで止める
3. それでも残るなら、**範囲と near/far を詰める**（精度そのものを上げる）
4. \`bias\` は最後の手段。使うなら $-0.001$ 以下の小さな値で

**\`normalBias\` を上げすぎると別の問題が出ます** ―
細い物体（草、髪、柵）の影が痩せて消えます。
ずらした点が、物体の外へ出てしまうからです。`,
      answerCode: `// 良い : 法線方向にずらす。必要なところだけ効く
sun.shadow.bias = 0;
sun.shadow.normalBias = 0.02;

// 悪い : 一律にずらす。平らな面で影が浮く
sun.shadow.bias = -0.02;
sun.shadow.normalBias = 0;

// 精度そのものを上げるほうが、根本的な解決
const c = sun.shadow.camera;
c.left = -8; c.right = 8; c.top = 8; c.bottom = -8;
c.near = 1; c.far = 30;              // near / far も詰める
c.updateProjectionMatrix();`,
    },
    {
      prompt: `影のふちがギザギザです。試せる手を **3 つ**挙げ、
**試す順番と、それぞれの費用**を答えてください。`,
      hint: 'ただで効くものから並べます。',
      answer: `**範囲を狭める → PCFSoftShadowMap → 解像度を上げる、の順です。**

**1. \`shadow.camera\` の範囲を狭める ― 費用ゼロ**

いちばん先に試すべきです。**何も増えません。**

範囲を半分にすれば、1 画素あたりの受け持ちは面積で $1/4$。
$\\pm 20$ を $\\pm 8$ にするだけで、**$6.25$ 倍精細**になります。

\`near\` と \`far\` も忘れずに詰めてください。
[](#/ch/m27-frustum)のとおり、深度の精度は near で決まります。

**2. \`shadowMap.type = THREE.PCFSoftShadowMap\` ― 費用は小さい**

境界の何点かを読んで混ぜるので、階段が滑らかになります。
読む回数が増えるぶんだけ重くなりますが、**わずかです。**

$1$ 行で目に見えて良くなるので、**ほぼ常に入れる価値があります。**

**3. \`shadow.mapSize\` を上げる ― 費用が大きい**

$512 \\to 1024$ で**メモリは $4$ 倍**、書き込む画素数も $4$ 倍。
$1024 \\to 2048$ でさらに $4$ 倍です。

**最後の手段**にしてください。1 と 2 を尽くしてからです。

**4 つ目の手もあります（順番外）**

**「そもそも影を出さない」。**
遠くのもの、小さいもの、動かないものは、
影を切っても気づかれないことがほとんどです。

\`mesh.castShadow = false\` を、影の要らないものに付けて回るのは
**いちばん確実な軽量化**です。三角形もシャドウマップも節約できます。`,
    },
  ],
  quiz: [
    {
      q: '影のふちがギザギザです。**まず**試すべきことはどれですか。',
      choices: [
        '`shadow.camera` の範囲を、影が要る場所まで狭める',
        '`shadow.mapSize` を上げる',
        'ライトの数を増やす',
        'マテリアルを Basic に変える',
      ],
      answer: 0,
      explain:
        '範囲を半分にすれば 1 画素あたりの受け持ちは面積で 4 分の 1 になり、しかも費用はゼロです。解像度を上げるとメモリが 4 倍ずつ増えます。まず範囲、次に PCFSoftShadowMap、最後に解像度の順です。',
    },
    {
      q: 'シャドウアクネ（縞模様）を消すのに、`bias` より `normalBias` が推奨されるのはなぜですか。',
      choices: [
        '斜めの面ほど大きくずらすので、必要なところだけ効き、影が浮きにくいから',
        '計算が速いから',
        '値の範囲が広いから',
        '`bias` は非推奨だから',
      ],
      answer: 0,
      explain:
        'アクネは光に対して斜めの面ほど強く出ます。`normalBias` は法線方向にずらすので、まさに斜めの面ほど効きます。`bias` は一律にずらすため、平らな面で効かせすぎて影が浮きます（ピーターパン現象）。',
    },
    {
      q: '`shadow.mapSize` を実行中に変えたのに、影の粗さが変わりません。なぜですか。',
      choices: [
        'シャドウマップは最初の描画で確保され、あとから作り直されないから',
        '値が 2 の冪でないから',
        '`updateProjectionMatrix` を呼んでいないから',
        'ライトが影を作れない種類だから',
      ],
      answer: 0,
      explain:
        '`light.shadow.map.dispose()` して `null` にしてから設定し直すと、次の描画で作り直されます。作った後に変えても効かない、というのは three ではよくある型です。',
    },
  ],
};
