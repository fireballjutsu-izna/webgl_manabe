import type { Chapter } from '../types.ts';

export const chapterX04: Chapter = {
  slug: 'x04-star-look',
  part: 'project',
  number: 4,
  title: '星を、星らしくする ― 点の描き方',
  goal: '`Points` の大きさが何ピクセルになるかを計算できるようになり、色と明るさのばらし方で「空」に見せられるようになります。',
  requires: ['x03-uniform-sphere', 'w13-color-space'],
  mathRecall: [
    { slug: 'w13-color-space', note: '色相・彩度・明度で色を作る' },
    { slug: '13-random', note: '偏らせたい分布は、乱数を加工して作る' },
  ],
  threeApis: [
    'Points',
    'PointsMaterial',
    'PointsMaterial.size',
    'PointsMaterial.sizeAttenuation',
    'Material.vertexColors',
    'Material.depthWrite',
    'Color.setHSL',
    'BufferGeometry.setAttribute',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 一様にばらまいただけでは、空に見えない

前の章で、偏りなく散らせるようになりました。
それを半径 $1200$ の球面に $4000$ 個置いてみると ―

**ほとんど何も見えません。**

理由は $1$ つで、**点が距離で縮んで消えている**からです。
効いているのは \`PointsMaterial\` の \`sizeAttenuation\` という設定で、
既定では \`true\`（遠いほど小さく）になっています。

まず、その「何ピクセルになるのか」を計算できるようにします。
`,
    },
    {
      kind: 'formula',
      tex: 'P_{\\text{px}} \\;=\\; s \\times \\rho \\times \\frac{h/2}{z}',
      readAloud:
        '`sizeAttenuation: true` のときの、点の**実際の大きさ（デバイスピクセル）**です。$s$ が \\`size\\`、$\\rho$ がピクセル比、$h$ が画面の高さ（CSS ピクセル）、$z$ がカメラからの距離。**距離に反比例します。**',
      worked: {
        given:
          '\\`size: 1.6\\`、ピクセル比 $2$、画面の高さ $900$（CSS ピクセル）。星は**距離 $1200$** にあります。既定のまま（\\`sizeAttenuation: true\\`）だと、何ピクセルで描かれるでしょうか。',
        steps: [
          { calc: 'h / 2 = 900 / 2 = 450' },
          { calc: '450 / z = 450 / 1200' },
          { calc: '        = 0.375' },
          { calc: 'P = 1.6 x 2 x 0.375' },
          { calc: '  = 1.2 デバイスピクセル' },
          { calc: 'CSS では 1.2 / 2 = 0.6 px' },
        ],
        result:
          '**$1.2$ デバイスピクセル ― CSS で言えば $0.6$ ピクセル。$1$ 画素にも満たない**ので、ほとんど消えます。ここで \\`sizeAttenuation: false\\` にすると、式から $\\frac{h/2}{z}$ が丸ごと消えて $P = s \\times \\rho = 3.2$ デバイスピクセル（CSS で $1.6$）になります。**$2.7$ 倍。** 星空のように「うんと遠くに置くが、ちゃんと見えてほしい」ものは、**距離で縮めない**のが正解です。逆に雪や火花のように「近づくと大きく見えてほしい」ものは \\`true\\` のままにします。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'size をいくら上げても、距離には勝てません',
      text: `
sizeAttenuation: true のまま size を 100 にすれば、たしかに見えます。

けれど、それは距離 1200 での話です。
カメラが半分の距離まで寄ると、こんどは 2 倍の大きさになります。

星が「近づくと大きくなる」のは、空として決定的におかしい。
星は遠すぎて、動いても大きさが変わらないから星に見えます。

倍率で殴るのではなく、距離に依存しない指定へ切り替えてください。
`,
    },
    {
      kind: 'md',
      text: `
## 色をばらす ― 白一色は「模様」に見える

実際の星は、青白いものから橙のものまであります。
表面の温度が違うからで、これを**色温度**と呼びます。

全部を白にすると、点の集まりが**模様のように**見えます。
色相をわずかに散らすだけで、一気に「空」になります。

\`Color.setHSL(h, s, l)\` を使います（[](#/ch/w13-color-space)でやった色の作り方です）。

- **色相 $h$** … $0.58$（青白）を中心に、$0.08$ くらいまで散らす。橙寄りも少し混ぜる
- **彩度 $s$** … $0.5$ 前後。上げすぎると色電球の群れになります
- **明度 $l$** … $0.55$ 〜 $1.0$。**ここをばらすのがいちばん効きます**

**明るさをばらすのは、色をばらすより効きます。** 空を見上げたとき、
まず目に入るのは「明るい星がまばらにあり、暗い星が無数にある」という濃淡だからです。
`,
    },
    {
      kind: 'md',
      text: `
## 明るい星は、少ないほうがいい

明度を \`0.55 + Math.random() * 0.45\` にすると、
$0.55$ から $1.0$ まで**均等に**散ります。

これだと**明るい星が多すぎます。** 実際の空は、明るい星ほど数が少ない。

乱数を**べき乗する**だけで偏らせられます。

\`Math.pow(Math.random(), 3)\` は $0$ 寄りに偏った $0$ 〜 $1$ の値です。
これを明るさの「上乗せ」に使えば、**ほとんどの星は暗く、たまに明るい星がある**空になります。
`,
    },
    {
      kind: 'formula',
      tex: 'P(u^{k} \\le t) \\;=\\; t^{1/k}',
      readAloud:
        '$0$〜$1$ の一様乱数 $u$ を $k$ 乗した値が $t$ 以下になる確率です。$k$ を大きくするほど $0$ 寄りに偏ります。**「上位 $x\\%$ だけを明るくしたい」から $k$ を逆算できます。**',
      worked: {
        given: '$k = 3$ のとき、$u^3$ が $0.5$ を超える（＝上半分の明るさになる）星は全体の何 $\\%$ でしょうか。',
        steps: [
          { calc: 'P(u^3 <= 0.5) = 0.5^(1/3)' },
          { calc: '              = 0.7937' },
          { calc: 'つまり 79.4% が 0.5 以下' },
          { calc: '超えるのは 1 - 0.7937' },
          { calc: '         = 0.2063' },
        ],
        result:
          '**$20.6\\%$。** $k = 1$（そのまま）なら $50\\%$ だったので、明るい星が半分以下に減りました。さらに **$u^3 > 0.9$**（かなり明るい）は $1 - 0.9^{1/3} = 1 - 0.9655 = 3.4\\%$ ― **$4000$ 個なら $138$ 個**です。$k$ を $6$ にすれば $u^6 > 0.5$ は $10.9\\%$ まで下がります。**「上位 $x\\%$ を明るくしたい」なら $k = \\dfrac{\\ln t}{\\ln(1-x)}$ で逆算できます** が、実際は $2$ 〜 $4$ を試して目で決めるほうが早い。',
      },
    },
    {
      kind: 'sandbox',
      title: '星空を仕上げる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// false にすると、距離で縮んでほとんど消えます
const KEEP_SIZE = true;

// 明るさの偏り。1 で均等、大きいほど「明るい星がまれ」になります
const BRIGHT_K = 3;

const COUNT = 4000;
const RADIUS = 1200;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060d);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 3000);
camera.position.set(0, 1.4, 6.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 2.6;
controls.maxDistance = 40;

/* ---- 星空 ---- */

function createStars(count, radius) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // 高さを一様に振る（前の章）
    const y = THREE.MathUtils.randFloatSpread(2);
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.random() * Math.PI * 2;

    positions[i * 3 + 0] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;

    // 色相は青白（0.58）を中心に、たまに橙（0.08 あたり）へ振る
    const hue = Math.random() < 0.82
      ? 0.58 - Math.random() * 0.06
      : 0.10 - Math.random() * 0.04;

    // 明るさは 0 寄りに偏らせる。ほとんどの星は暗い
    const bright = 0.42 + Math.pow(Math.random(), BRIGHT_K) * 0.58;

    color.setHSL(hue, 0.45, bright);
    colors[i * 3 + 0] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 1.6,
    sizeAttenuation: !KEEP_SIZE,   // false = 距離で縮めない
    vertexColors: true,            // 頂点ごとの色を使う
    depthWrite: false,             // 手前のものを隠さない
  }));
}

scene.add(createStars(COUNT, RADIUS));

/* ---- 惑星の場所に、いまは仮の球を置く ---- */

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(1.6, 64, 48),
  new THREE.MeshStandardMaterial({ color: 0x6f7d95, roughness: 0.85 }),
);
scene.add(planet);

const sun = new THREE.DirectionalLight(0xfff2e0, 3.2);
sun.position.set(5, 2, 3);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x3a4a6a, 0.35));

/* ---- 何ピクセルで描かれるか、計算して出す ---- */

const readout = document.createElement('div');
readout.style.cssText =
  'position:fixed;left:12px;top:12px;padding:8px 12px;border-radius:8px;' +
  'background:rgba(10,10,18,.82);color:#e8e8f2;font:13px/1.7 monospace;' +
  'border:1px solid #3a3a5c;white-space:pre';
document.body.appendChild(readout);

/* ---- 描画ループ ---- */

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  planet.rotation.y += dt * 0.08;

  const dpr = renderer.getPixelRatio();
  const px = KEEP_SIZE
    ? 1.6 * dpr
    : 1.6 * dpr * ((window.innerHeight / 2) / RADIUS);
  readout.textContent =
    (KEEP_SIZE ? 'sizeAttenuation: false' : 'sizeAttenuation: true') + '\\n' +
    '星 ' + COUNT + ' 個 / 半径 ' + RADIUS + '\\n' +
    '1 個の大きさ ' + px.toFixed(2) + ' デバイス px\\n' +
    (px < 1 ? '→ 1 画素に満たない（消える）' : '→ 見える');

  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**`KEEP_SIZE` を `false` にすると、星がほぼ消えます。** 左上の数字が理由です ― $1$ 画素に満たない大きさで描こうとしています。`BRIGHT_K` を $1$ にすると明るい星が増えすぎて、空ではなく**砂を撒いた面**に見えます。$6$ まで上げると、こんどは寂しくなる ― $2$ 〜 $4$ のあいだで、目で決めてください。',
    },
    {
      kind: 'md',
      text: `
## depthWrite: false が要る理由

星は**いちばん遠くにある**ので、何かの手前に来ることはありません。

ところが \`Points\` は、既定では奥行きの記録に書き込みます。
$4000$ 個の点が「ここに何かある」と書き残すと、
**あとから描かれた惑星や月が、星に隠される**ことが起こります。

とくに \`sizeAttenuation: false\` にしていると、点は**遠いのに $2$ ピクセルの面積**を持ちます。
その $2$ ピクセルぶんだけ、手前のものが欠けます。

\`depthWrite: false\` は「読むけれど、書かない」という指定です。
星は自分より手前のものに隠されますが、**自分は誰も隠しません。** これが正しい振る舞いです。

同じ設定が要るのは、**煙・炎・光の粒**など「重ねて足していくもの」全般です。
[](#/ch/w12-transparent)で扱った話が、そのまま効きます。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'またたきは、足さないほうがいい',
      text: `
星をちらちらさせたくなりますが、たいてい失敗します。

本物のまたたきは大気のゆらぎで起きるもので、
宇宙から見た星はまたたきません。惑星ビューアーの視点は宇宙です。

そして、全部が同じ周期でまたたくと機械的に見え、
ばらばらにすると毎フレーム 4000 個の色を書き換えることになります。

明るさをばらすだけで十分に空に見えます。
動かさないことが、いちばん安くていちばん自然です。
`,
    },
    {
      kind: 'md',
      text: `
## ここまでで、骨組みが立ちました

- [](#/ch/p01-planet-setup) … 完成を $1$ 行で書き、段取りを割った
- [](#/ch/x02-depth-precision) … \`near\` を $0.5$、\`far\` を $3000$ に決めた
- [](#/ch/x03-uniform-sphere) … 球面に偏りなく散らせるようになった
- この章 … 点が何ピクセルで描かれるかを計算し、色と明るさをばらした

**画面には星空と、仮の灰色の球があります。**

次の章から、この球を惑星にしていきます。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`size: 3\`、ピクセル比 $1$、画面の高さ $1080$ で、\`sizeAttenuation: true\` のまま
**距離 $800$** に点を置きました。

1. 何デバイスピクセルで描かれますか。
2. 距離 $80$（$10$ 分の $1$）まで寄ると、いくつになりますか。
3. \`sizeAttenuation: false\` ならどうですか。`,
      hint: '$P = s \\times \\rho \\times \\dfrac{h/2}{z}$。',
      answer: `**1. $2.025$ px。2. $20.25$ px。3. $3$ px（距離によらず一定）。**

**1 ― 距離 $800$**

$P = 3 \\times 1 \\times \\dfrac{1080/2}{800} = 3 \\times \\dfrac{540}{800} = 3 \\times 0.675 = 2.025$

**約 $2$ ピクセル。** 見えます。

**2 ― 距離 $80$**

距離が $\\frac{1}{10}$ になったので、$P$ は **$10$ 倍**。

$P = 3 \\times \\dfrac{540}{80} = 3 \\times 6.75 = 20.25$ px

**$20$ ピクセルの丸**です。星としては明らかにおかしい。

**3 ― \`sizeAttenuation: false\`**

式から $\\dfrac{h/2}{z}$ が消えます。

$P = s \\times \\rho = 3 \\times 1 = 3$ px

**距離がいくつでも $3$ px。** カメラが動いても大きさが変わりません。

**どちらを選ぶか**

**「近づいたら大きく見えてほしいか」**で決めます。

- **雪・火花・煙・葉** … 手が届く距離にあるもの。\`true\`
- **星・遠景の光** … 距離が意味を持たないほど遠いもの。\`false\`

**中間はありません。** 迷うということは、その粒がどれくらい遠いのかを
まだ決めていない、ということです。

**ピクセル比の効き方に注意**

\`false\` のとき $P = s \\times \\rho$ なので、**ピクセル比が $2$ の端末では $2$ 倍の大きさ**になります。

デバイスピクセルで見れば正しい（画面が細かいぶん、同じ見た目の大きさ）のですが、
「スマホだけ星が大きい」と感じたら、\`size\` を \`1 / dpr\` で割って調整してください。`,
    },
    {
      prompt: `星の \`depthWrite: false\` を外しました。**何が起きますか。**

星は半径 $1200$、惑星は原点にあり半径 $1.6$、カメラは距離 $6.5$ です。
星のほうが圧倒的に遠いのに、なぜ問題になるのでしょう。`,
      hint: '点は「遠い」のに、画面上では何ピクセルを占めていますか。',
      answer: `**惑星や月の輪郭が、点の形に欠けます。**

**なぜ起きるのか**

深度テストの結論だけを見れば、星（$z \\approx 1200$）は惑星（$z \\approx 6.5$）より奥です。
だから**星が惑星を隠すことはありません。**

問題は**描く順番**です。

\`Points\` を先に \`scene.add\` していると、three は星を先に描きます。
そのとき \`depthWrite: true\` なら、星は**$1200$ という深度を書き残します。**

そのあと惑星を描くと、惑星（$6.5$）のほうが手前なので**上書きされます** ― ここまでは正しい。

**壊れるのは、点の縁**です。

\`PointsMaterial\` は正方形の板として描かれ、**縁まで色が付いています。**
\`transparent\` を使っていないので、縁の画素も「不透明な何か」として深度を書きます。

その結果、\`sizeAttenuation: false\` で $2$ ピクセルある星が、
**画面上の $2$ ピクセル四方に $1200$ という深度を敷き詰めます。**

**あとから描かれる半透明のもの**（大気の光、雲）は深度テストで弾かれ、
**星と重なった画素だけ抜け落ちます。**

**症状の見え方**

- 大気の光の中に、点々と穴があく
- 月が星の前を横切るとき、輪郭がちらつく
- 描く順を変えると症状が変わる ― これが「順番の問題」だと分かる手がかり

**\`depthWrite: false\` の意味**

**「深度を読むけれど、書かない」**。

星は自分より手前のものに正しく隠され、**自分は誰も隠しません。**

同じ設定が要るのは、煙・炎・光の粒など「重ねて足していくもの」全般です
― [](#/ch/w12-transparent)で扱った話が、そのまま効きます。`,
    },
    {
      prompt: `明るさを \`0.42 + Math.pow(Math.random(), k) * 0.58\` で決めています。

1. $k = 1$ と $k = 3$ で、**明るさが上半分**（$0.71$ 以上）になる星の割合はそれぞれ何 $\\%$ ですか。
2. $4000$ 個のうち「かなり明るい星」を **$100$ 個前後**にしたい。
   \`Math.pow(Math.random(), k) > 0.9\` を基準にすると、$k$ はいくつにしますか。`,
      hint: '$P(u^k > t) = 1 - t^{1/k}$。',
      answer: `**1. $50\\%$ と $20.6\\%$。2. $k = 4$（$4000 \\times 2.6\\% = 104$ 個）。**

**1 ― 上半分の割合**

明るさが $0.71$ 以上ということは、$u^k$ が $0.5$ 以上ということです。

$P(u^k > 0.5) = 1 - 0.5^{1/k}$

**$k = 1$**: $1 - 0.5 = 0.5$ ― **$50\\%$**

**$k = 3$**: $1 - 0.5^{1/3} = 1 - 0.7937 = 0.2063$ ― **$20.6\\%$**

$k$ を $3$ にするだけで、明るい星が**半分以下**に減りました。

**2 ― $100$ 個前後にする**

$P(u^k > 0.9) = 1 - 0.9^{1/k}$。これに $4000$ を掛けて $100$ にしたい。

$1 - 0.9^{1/k} = 0.025$

$k$ を順に当てます。

| $k$ | $1 - 0.9^{1/k}$ | $4000$ 個中 |
|---|---|---|
| $2$ | $0.0513$ | $205$ |
| $3$ | $0.0345$ | $138$ |
| $4$ | $0.0260$ | $104$ |
| $5$ | $0.0209$ | $84$ |

**$k = 4$ で $104$ 個。** ちょうどです。

**式で解くなら**

$0.9^{1/k} = 0.975 \\;\\Rightarrow\\; \\dfrac{1}{k}\\ln 0.9 = \\ln 0.975$

$k = \\dfrac{\\ln 0.9}{\\ln 0.975} = \\dfrac{-0.10536}{-0.02532} = 4.16$

**$4.16$。** $4$ に丸めれば十分です。

**実際にはどうするか**

**この計算は「当たりを付ける」ためのもの**で、最後は目で決めます。

$k = 4$ が理屈どおりでも、画面で見て寂しければ $3$ にする。
色や背景の明るさによって、ちょうどよく見える点は動きます。

**ただし、当たりが付いていると試す回数が減ります。**
$1$ から $20$ まで総当たりするのと、$3$ 〜 $5$ を試すのとでは、かかる時間が違います。`,
      answerCode: `// 上位 x 割合を「明るい」にしたいときの k
function kForTopFraction(threshold, fraction) {
  return Math.log(threshold) / Math.log(1 - fraction);
}

// u^k > 0.9 になるのを 2.5%（4000 個中 100 個）にしたい
console.log(kForTopFraction(0.9, 0.025));   // 4.16

const k = 4;
const bright = 0.42 + Math.pow(Math.random(), k) * 0.58;`,
    },
  ],
  quiz: [
    {
      q: '`sizeAttenuation: false` にすると、点の大きさはどう決まりますか。',
      choices: [
        '`size` × ピクセル比。距離によらず一定',
        '距離に応じて自動的に小さくなる',
        'ジオメトリの大きさに比例する',
        '変わらない（この設定に効果はない）',
      ],
      answer: 0,
      explain:
        '既定では size × 比 × (画面高さ/2 ÷ 距離) で、遠いほど小さくなります。距離 1200 に置いた size 1.6 の星は 1 画素に満たず消えます。星のように「遠すぎて大きさが変わらない」ものは false にしてください。',
    },
    {
      q: '星の `depthWrite: false` を外すと、何が起きますか。',
      choices: [
        '星の点が深度を書き残し、あとから描く大気や雲がその画素だけ抜ける',
        '星が惑星に隠される',
        '星が消える',
        '何も変わらない',
      ],
      answer: 0,
      explain:
        '点は遠いのに、画面上では数ピクセルの面積を持ちます。そこに 1200 という深度が敷き詰められ、あとから描く半透明のものが弾かれます。「読むけれど書かない」が、重ねて足していくもの全般の正しい設定です。',
    },
    {
      q: '明るさを `Math.pow(Math.random(), 3)` で決めるのは、なぜですか。',
      choices: [
        '0 寄りに偏らせて、明るい星をまれにするため',
        '計算が速いため',
        '色相を散らすため',
        '乱数の質を上げるため',
      ],
      answer: 0,
      explain:
        'そのままの一様乱数だと明るい星が多すぎて、空ではなく砂を撒いた面に見えます。3 乗すると上半分の明るさになるのは 20.6% だけ。k は 2〜4 のあいだで目で決めてください。',
    },
  ],
};
