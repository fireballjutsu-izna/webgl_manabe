import type { Chapter } from '../types.ts';

export const chapterX03: Chapter = {
  slug: 'x03-uniform-sphere',
  part: 'project',
  number: 3,
  title: '球面に一様にばらまく ― 素直な方法は失敗する',
  goal: '球の上に点を偏りなく散らせるようになり、「一様」がどの量に対しての一様なのかを説明できるようになります。',
  requires: ['x02-depth-precision', '13-random'],
  mathRecall: [
    { slug: '13-random', note: '一様乱数の癖' },
    { slug: '05-trig', note: '角度から x と z を出す' },
    { slug: '02-vector', note: '長さ 1 に揃える（正規化）' },
  ],
  threeApis: [
    'Points',
    'PointsMaterial',
    'BufferGeometry',
    'BufferAttribute',
    'MathUtils.randFloatSpread',
    'Vector3.normalize',
    'Vector3.randomDirection',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 星を、球の上にばらまきたい

星空は「うんと遠くの球面に、点をたくさん散らしたもの」です。
$4000$ 個を偏りなく置きたい。

**素直に思いつく方法は、$2$ つとも外れます。**

**$1$. 緯度を $-90°$ 〜 $90°$、経度を $0°$ 〜 $360°$ の一様乱数にする**

点は**北極と南極に密集します。**

地球儀を思い出してください。**緯度 $1$ 度ぶんの帯の面積は、赤道では広く、極では狭い。**
狭いところに同じ数を配れば、そこが混みます。

**$2$. 立方体の中に一様に置いて、長さ $1$ に揃える（{{正規化}}する）**

こんどは**立方体の角の方向に寄ります。**

中心から角までは、辺の中心までより $\\sqrt{3} \\approx 1.73$ 倍遠い。
その遠いぶんだけ多くの点が並んでいて、正規化すると同じ方向に潰れてきます。

**正しいやり方は、意外な形をしています。高さ $y$ を一様に振るのです。**
`,
    },
    {
      kind: 'formula',
      tex: 'y \\sim U(-1, 1),\\quad \\theta \\sim U(0, 2\\pi),\\quad r = \\sqrt{1 - y^2}',
      readAloud:
        '$y$ を $-1$ から $1$ の一様乱数、$\\theta$（シータ）を $0$ から $360$ 度の一様乱数として、$r$ を $\\sqrt{1 - y^2}$ にします。この $r$ は「高さ $y$ で球を水平に切ったときの、切り口の円の半径」です。',
      worked: {
        given: '$y$ を $3$ か所に取って、そのときの切り口の半径 $r$ を見ます。',
        steps: [
          { calc: 'y = 0    : r = ルート(1 - 0)    = 1', note: '赤道。切り口がいちばん大きい' },
          { calc: 'y = 0.6  : r = ルート(1 - 0.36) = 0.8' },
          { calc: 'y = 0.99 : r = ルート(1 - 0.98) = 0.141', note: '極のすぐ手前。切り口が小さい' },
        ],
        result:
          '$y$ を一様に振ると、**極の近くには狭い切り口しか割り当てられません。** そこに落ちる点も少なくなるので、球の表面では一様になります。緯度を一様に振ると、この狭い切り口に赤道と同じ数の点を詰めることになり、極に集まります。',
      },
    },
    {
      kind: 'formula',
      tex: '(x, y, z) = (r\\cos\\theta,\\; y,\\; r\\sin\\theta)',
      readAloud:
        '$x$ は $r\\cos\\theta$、$y$ はそのまま $y$、$z$ は $r\\sin\\theta$。三角関数の章でやった「角度から座標を出す」を、切り口の円の上でやっているだけです。',
      worked: {
        given: '$y = 0.6$（$r = 0.8$）で、$\\theta = 60$ 度のとき。',
        steps: [
          { calc: 'x = 0.8 x cos 60 度 = 0.8 x 0.5   = 0.4' },
          { calc: 'y = 0.6', note: 'y は切り口の高さそのもの' },
          { calc: 'z = 0.8 x sin 60 度 = 0.8 x 0.866 = 0.693' },
          { calc: '確かめ : 0.4^2 + 0.6^2 + 0.693^2' },
          { calc: '       = 0.16 + 0.36 + 0.48 = 1.0', note: '原点からの距離が 1 ＝ 球の上にいる' },
        ],
        result:
          '$(0.4,\\; 0.6,\\; 0.693)$。**[](#/ch/05-trig)の単位円を、高さ $y$ の切り口の上でやっているだけ**です。半径が $1$ ではなく $r$ になっているところだけが違います。',
      },
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: 'みかんの皮',
      text: `
球を水平に等間隔で切ると、どの輪切りの側面も面積が同じになります。

極のあたりは半径が小さいけれど、そのぶん斜めに引き伸ばされていて、ちょうど釣り合うのです。

アルキメデスが見つけた性質で、地図の「ランベルト正積円筒図法」がまさにこれです。

だから高さを一様に選べば、面積に対して一様になります。
緯度を一様に選ぶと、この釣り合いを壊してしまいます。
`,
    },
    {
      kind: 'md',
      text: `
## 3 つを並べて見る

言葉より目で見たほうが早いので、$3$ つの方法で同じ数の点をばらまいて並べます。
**左が緯度経度、中央が立方体＋正規化、右が正しい方法**です。

**最初から見下ろす位置に置いてあります。** 極が正面に来ているので、
左の球の中央が白く塗り潰れているのがすぐ分かります。
ドラッグして横から見ると、こんどは赤道のあたりが薄いのが見えます。
`,
    },
    {
      kind: 'sandbox',
      title: '3 つのばらまき方を見比べる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 100);
// 最初から見下ろす位置に置く。偏りは「極を正面から見る」といちばん分かりやすい
camera.position.set(0, 7.6, 5.6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const COUNT = 2600;

// (A) 緯度と経度を一様に振る → 極に集まる
function byLatLon() {
  const lat = THREE.MathUtils.randFloatSpread(Math.PI);   // -90° 〜 90°
  const lon = Math.random() * Math.PI * 2;
  return new THREE.Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.sin(lon),
  );
}

// (B) 立方体の中に一様に置いて正規化 → 角の方向に寄る
function byCube() {
  return new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2),
  ).normalize();
}

// (C) 高さ y を一様に振る → 面積に対して一様になる
function byHeight() {
  const y = THREE.MathUtils.randFloatSpread(2);
  const r = Math.sqrt(1 - y * y);
  const theta = Math.random() * Math.PI * 2;
  return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
}

function cloud(make, offsetX, color) {
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const v = make();
    positions[i * 3 + 0] = v.x * 1.5 + offsetX;
    positions[i * 3 + 1] = v.y * 1.5;
    positions[i * 3 + 2] = v.z * 1.5;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    color: color,
    size: 2.2,
    sizeAttenuation: false,
  }));
}

scene.add(cloud(byLatLon, -3.9, 0xff7ad9));  // 左：偏る
scene.add(cloud(byCube, 0, 0xffd166));       // 中央：少し偏る
scene.add(cloud(byHeight, 3.9, 0x4fd6ff));   // 右：正しい

// 見出しを画面に置く（three ではなく、ただの DOM）
['緯度経度（極に集まる）', '立方体＋正規化（角に寄る）', '高さを一様に（正しい）']
  .forEach((text, index) => {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText =
      'position:absolute; bottom:26px; transform:translateX(-50%);' +
      'color:#e8e8f2; font:12px sans-serif; pointer-events:none; white-space:nowrap;';
    div.style.left = (17 + index * 33) + '%';
    document.body.appendChild(div);
  });

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
        '左の球は中心（＝極）が塗り潰れています。中央は $8$ 方向にうっすら濃淡が出ます。右だけがどこを見ても同じ密度です。`COUNT` を $400$ に減らすと、密度の差はかえって見分けにくくなります ― **偏りは数が多いほうが見えます。**',
    },
    {
      kind: 'md',
      text: `
## three が用意しているもの

じつは three にそのものがあります。

\`vector.randomDirection()\` は、**球面上の一様な向き**を返します。
中でやっているのは、いま見た「高さを一様に振る」と同じことです。

**それでも導出を見ておく価値があります。** 同じ罠が、あちこちに形を変えて出るからです。

- **円の中に一様に散らす** … 半径を一様に振ると中心に集まる。$r = R\\sqrt{u}$ が正しい
  （[](#/ch/w50-small-forest)の森で使いました）
- **半球に散らす** … $y$ を $0$ 〜 $1$ の一様に
- **球の「中」に散らす** … 向きを一様に取ってから、半径を $R\\sqrt[3]{u}$ にする

**共通しているのは「一様にしたいのは、変数ではなく面積（体積）のほうだ」ということ**です。
変数をそのまま一様に振ると、たいてい外れます。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '捨てる、という手もある',
      text: `
立方体に一様に置いて、半径 1 の球からはみ出した点を捨てる ―
残った点を正規化すれば、正しく一様になります（棄却法）。

考え方はいちばん単純で、証明も要りません。

代償は無駄です。球は立方体の 52.4% しかないので、
約 48% の点を捨てることになります。

星 4000 個なら誤差ですが、毎フレーム回すなら効いてきます。
式が分かっているなら、捨てないほうを選んでください。
`,
    },
    {
      kind: 'md',
      text: `
## 確かめ方 ― 目で見るだけでは足りない

見た目で「一様っぽい」と判断するのは危ういので、**数えて確かめられる**ようにしておきます。

球を高さで $10$ 段に輪切りにして、各段の点の数を数える。
一様なら、**どの段もほぼ同じ数**になるはずです（輪切りの側面積が等しいので）。

$4000$ 個を $10$ 段なら、$1$ 段あたり $400$ 個前後。
緯度経度の方法で数えると、**両端の段だけ $800$ を超え、真ん中は $260$ 前後**になります。

**「見て確かめる」と「数えて確かめる」は別のこと**です。
偏りは、偏っている方向から見ないと見えません ―
だから目視は $1$ 方向では足りず、数えるほうが確実です。
`,
    },
    {
      kind: 'code',
      title: '数えて確かめる',
      code: `// 高さで 10 段に分けて、各段の点の数を数える
function histogram(make, count, bins = 10) {
  const hist = new Array(bins).fill(0);
  for (let i = 0; i < count; i++) {
    const v = make();
    const index = Math.min(bins - 1, Math.floor(((v.y + 1) / 2) * bins));
    hist[index]++;
  }
  return hist;
}

console.log('緯度経度  ', histogram(byLatLon, 4000));
// [ 786, 371, 307, 261, 246, 289, 260, 282, 387, 811 ]  ← 両端が 3 倍以上
// 期待値は [ 819, 361, 295, 268, 256, 256, 268, 295, 361, 819 ]

console.log('高さ一様  ', histogram(byHeight, 4000));
// [ 420, 404, 388, 397, 384, 433, 388, 400, 404, 382 ]  ← どれも 400 前後`,
    },
  ],
  exercises: [
    {
      prompt: `$y = -0.8$、$\\theta = 210°$ のとき、点の座標 $(x, y, z)$ を求めてください。

原点からの距離が $1$ になることも確かめてください。`,
      hint: '$r = \\sqrt{1 - y^2}$ を先に出します。$\\cos 210° = -0.866$、$\\sin 210° = -0.5$。',
      answer: `**$(-0.520,\\; -0.8,\\; -0.300)$ です。**

**切り口の半径**

$r = \\sqrt{1 - (-0.8)^2} = \\sqrt{1 - 0.64} = \\sqrt{0.36} = 0.6$

$y = -0.8$ は南半球のかなり下、切り口は半径 $0.6$ の小さな円です。

**座標**

$x = r\\cos\\theta = 0.6 \\times (-0.866) = -0.520$

$y = -0.8$（そのまま）

$z = r\\sin\\theta = 0.6 \\times (-0.5) = -0.300$

**確かめ**

$(-0.520)^2 + (-0.8)^2 + (-0.300)^2$

$= 0.2703 + 0.64 + 0.09 = 1.0003$

丸めの誤差を除けば $1$。**球の上にいます。**

**この検算を必ずやってください**

球面にばらまくコードの間違いは、**たいてい「球の上に無い」**という形で出ます。

- $r$ を掛け忘れた … $x^2+y^2+z^2 > 1$ になる
- $\\sqrt{}$ を忘れた … $y$ が大きいところで距離が合わない
- $y$ を $-1$〜$1$ ではなく $0$〜$1$ にした … 北半球にしか出ない

**$1$ 点だけ手で計算して、距離が $1$ になるか見る。** $30$ 秒で済みます。

**$y = \\pm 1$ のとき**

$r = 0$ になり、$\\theta$ が何であっても点は極そのものです。
$\\sqrt{}$ の中がわずかに負になると \`NaN\` が出るので、
実装では $\\sqrt{\\max(0,\\, 1-y^2)}$ にしておくと安全です。`,
    },
    {
      prompt: `**円盤**（半径 $R$ の円の内側）に点を一様に散らしたい。

\`const r = Math.random() * R; const a = Math.random() * Math.PI * 2;\`

と書きました。**どこが偏りますか。** 正しい式と、その理由を書いてください。`,
      hint: '半径 $r$ 以内の面積は、$r$ に比例しますか。',
      answer: `**中心に集まります。正しくは $r = R\\sqrt{u}$（$u$ は $0$〜$1$ の一様乱数）。**

**なぜ偏るのか**

半径 $r$ 以内の面積は $\\pi r^2$ ― **$r$ の $2$ 乗**に比例します。

ところが \`Math.random() * R\` は $r$ を一様に振るので、
「$r$ が $0$ 〜 $0.5R$ の点」と「$0.5R$ 〜 $R$ の点」が**同じ数**になります。

面積で言えば、内側は $\\frac{1}{4}$、外側は $\\frac{3}{4}$。
**内側に $3$ 倍の密度**で詰まります。

**正しい式**

「半径 $r$ 以内に入る割合」が面積の割合と一致してほしいので、

$\\dfrac{\\pi r^2}{\\pi R^2} = u \\quad\\Longrightarrow\\quad r = R\\sqrt{u}$

$\\sqrt{}$ が外側へ押し出してくれます。

**確かめ**

$u = 0.25$ のとき $r = 0.5R$。**内側 $\\frac{1}{4}$ の面積に、点の $\\frac{1}{4}$** ― 合っています。

$u$ を一様に振った $r = R\\sqrt{u}$ は、
[](#/ch/w50-small-forest)で木を散らすのに使ったのと同じ式です。

**同じ形の間違い**

| 対象 | 間違い | 正しい |
|---|---|---|
| 円盤 | $r = Ru$ | $r = R\\sqrt{u}$ |
| 球の内側 | $r = Ru$ | $r = R\\sqrt[3]{u}$ |
| 球面 | 緯度を一様 | 高さ $y$ を一様 |

**共通する見分け方**

**「その変数を $2$ 倍にしたとき、面積（体積）は何倍になるか」**を考えてください。

$2$ 倍なら一様でよい。$4$ 倍なら $\\sqrt{}$、$8$ 倍なら $\\sqrt[3]{}$ が要ります。`,
      answerCode: `// 円盤に一様
const u = Math.random();
const r = R * Math.sqrt(u);
const a = Math.random() * Math.PI * 2;
const x = Math.cos(a) * r;
const z = Math.sin(a) * r;

// 球の内側に一様
const dir = new THREE.Vector3().randomDirection();
const radius = R * Math.cbrt(Math.random());
const p = dir.multiplyScalar(radius);`,
    },
    {
      prompt: `「一様にばらまけているか」を、**目で見る以外の方法**で確かめたい。

$4000$ 個を球面に置いたとき、どう数えれば偏りが分かりますか。
緯度経度の方法だと、その数はどうなると予想しますか。`,
      hint: '輪切りの側面積は、どこでも同じでした。',
      answer: `**高さで輪切りにして、各段の個数を数えます。**

**やり方**

$y$（$-1$ 〜 $1$）を $10$ 段に等分し、各点がどの段に落ちたかを数えます。

\`const index = Math.floor(((v.y + 1) / 2) * 10);\`

**みかんの皮の性質から、輪切りの側面積はどの段も等しい。**
だから一様なら、**どの段もほぼ同じ数**になるはずです。

$4000 \\div 10 = 400$ 個前後。

**緯度経度だとどうなるか**

緯度を一様に振ると、点は極に集まります。
極は $y$ が $\\pm 1$ に近いところなので、**両端の段が突出**します。

実測すると、こうなりました。

- 緯度経度 … $[786,\\ 371,\\ 307,\\ 261,\\ 246,\\ 289,\\ 260,\\ 282,\\ 387,\\ 811]$
- 高さ一様 … $[420,\\ 404,\\ 388,\\ 397,\\ 384,\\ 433,\\ 388,\\ 400,\\ 404,\\ 382]$

**両端が $800$ 超、真ん中が $260$ 前後 ― $3.2$ 倍の差**です。

理屈で出る期待値は $[819,\\ 361,\\ 295,\\ 268,\\ 256,\\ 256,\\ 268,\\ 295,\\ 361,\\ 819]$ で、
実測はこれとよく合っています。

**なぜ数えるほうが確実なのか**

**偏りは、偏っている方向から見ないと見えません。**

緯度経度の偏りは真上から見れば一目ですが、横から見ると手前と奥が重なって隠れます。
立方体＋正規化の偏りは、角の方向（斜め）から見ないと分かりません。

**$1$ つの角度で見て大丈夫そうだった、はあてになりません。**

数えるほうは向きに依存しないので、$1$ 回で済みます。

**ばらつきの目安**

完全に一様でも、乱数なのでぴったり $400$ にはなりません。

$n = 400$ の標準偏差はおよそ $19$。
**$\\pm 38$（$2$ 標準偏差）に収まっていれば正常**と見てよく、
上の $382$〜$433$ はほぼその範囲です（$433$ は $1.7$ 標準偏差）。

$811$ は $21$ 標準偏差ぶん離れていて、偶然ではありえません。`,
      answerCode: `function histogram(make, count, bins = 10) {
  const hist = new Array(bins).fill(0);
  for (let i = 0; i < count; i++) {
    const v = make();
    const index = Math.min(bins - 1, Math.floor(((v.y + 1) / 2) * bins));
    hist[index]++;
  }
  return hist;
}

console.log('緯度経度', histogram(byLatLon, 4000));
console.log('高さ一様', histogram(byHeight, 4000));
// 期待値は 400。±40 に収まっていれば正常（標準偏差 √400 = 20）`,
    },
  ],
  quiz: [
    {
      q: '緯度と経度をそれぞれ一様乱数にして球面に点を置くと、点はどこに集まりますか。',
      choices: [
        '北極と南極',
        '赤道',
        'どこにも集まらない（一様になる）',
        '経度 0 度の線上',
      ],
      answer: 0,
      explain:
        '緯度 1 度ぶんの帯の面積は、赤道では広く、極に近づくほど狭くなります。狭い場所に同じ数を割り当てるので、極が混みます。高さ y を一様に振ると、輪切りの側面積がどこでも等しいという性質のおかげで一様になります。',
    },
    {
      q: '円盤に一様に散らしたい。`r = Math.random() * R` だとどうなりますか。',
      choices: [
        '中心に集まる。正しくは `r = R * Math.sqrt(u)`',
        '外周に集まる',
        '一様になる',
        '中心に穴があく',
      ],
      answer: 0,
      explain:
        '半径 r 以内の面積は r の 2 乗に比例します。r を一様に振ると、内側 1/4 の面積に半分の点が入り、3 倍の密度になります。「その変数を 2 倍にしたら面積は何倍か」で判断してください。',
    },
    {
      q: 'ばらまきが一様かどうかを、目で見る以外に確かめるには？',
      choices: [
        '高さで輪切りにして、各段の個数を数える',
        '点の総数を数える',
        '重心が原点にあるか見る',
        '最も近い 2 点の距離を測る',
      ],
      answer: 0,
      explain:
        '輪切りの側面積はどこでも等しいので、一様なら各段の個数もほぼ等しくなります。4000 個を 10 段なら 400 ± 40。偏りは偏っている方向から見ないと見えないので、目視は 1 方向では足りません。',
    },
  ],
};
