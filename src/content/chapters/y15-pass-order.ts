import type { Chapter } from '../types.ts';

export const chapterY15: Chapter = {
  slug: 'y15-pass-order',
  part: 'polish',
  number: 15,
  title: 'どこに挟むか ― 順番で結果が変わる',
  goal: 'パスを並べる順番を「現実で光が通る順」で決められるようになり、順番を入れ替えると何が起きるかを、しきい値の計算で予言できるようになります。',
  requires: ['y14-uv-offset', 'y10-bloom'],
  threeApis: ['EffectComposer', 'ShaderPass', 'UnrealBloomPass', 'OutputPass', 'RenderPass'],
  mathRecall: [
    { slug: 'y10-bloom', note: 'しきい値。前のパスが明るさを変えると、通る画素も変わります' },
    { slug: 'y13-film-grade', note: 'ビネットの倍率' },
    { slug: 'q03-postprocess', note: '$\\mathrm{RenderPass}$ が最初、$\\mathrm{OutputPass}$ が最後' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 並べ方の目安

パスは足した順に流れます。前のパスの出力が、次のパスの入力です。
つまり**順番を変えると、結果が変わります。**

迷ったときの目安は $1$ つだけ。

**現実で、光がどの順に通るかを考えてください。**

光は物に当たって跳ね返り、レンズを通り、センサーに届き、最後に画面に出ます。
その順に並べると、たいてい正解に近づきます。

- **\`RenderPass\`** … 光が物に当たるところ。**必ず最初**
- **ブルーム** … レンズの中で散る。**早め**
- **色調・彩度** … 現像。中ほど
- **色収差・歪み・ビネット** … **レンズと絞りの癖。遅め**
- **走査線・グレイン** … 画面と記録の癖。さらに遅め
- **\`OutputPass\`** … **必ず最後**

そして $1$ つ、**理屈より強い規則**があります。
`,
    },
    {
      kind: 'md',
      text: `
## しきい値を持つパスは、前の影響をまともに受ける

[](#/ch/y10-bloom)のブルームは、**明るさがしきい値を超えたか**で仕事を決めていました。

ということは、**その前に明るさを変えるパスがあると、通る画素の顔ぶれが変わります。**

ビネットを考えてください。四隅を暗くするパスです。

- **ビネット → ブルーム** … 四隅が暗くなってからしきい値を見る。
  **四隅の光は、越えられなくなる**
- **ブルーム → ビネット** … 滲ませてから四隅を暗くする。
  **滲みは作られたうえで、暗くなる**

同じ $2$ つのパス、同じ数字なのに、**四隅で光るか光らないかが変わります。**

これは「好み」ではなく、**計算すれば事前に分かること**です。次の節で数えます。
`,
    },
    {
      kind: 'formula',
      tex: 'v\' = v \\cdot \\bigl(1 - s \\cdot \\mathrm{smoothstep}(a,\\, b,\\, d)\\bigr)',
      readAloud:
        'ビネットを通ったあとの明るさ $v\'$ は、もとの明るさ $v$ に、中心からの距離 $d$ で決まる倍率を掛けたもの、と読みます。この $v\'$ がブルームのしきい値と比べられるので、ビネットを先に置くと通る画素が減ります。',
      worked: {
        given:
          '街灯（明るさ $v = 2.4047$）を $7$ か所に置きます。ビネットは $s = 0.9$、$\\mathrm{smoothstep}(0.20,\\ 0.65,\\ d)$。ブルームのしきい値は $0.95$ です。',
        steps: [
          { calc: '中央 : d = 0 → 倍率 1.0000 → 2.4047', note: '越える' },
          { calc: '左右の中央 : d = 0.3900 → smoothstep 0.3843' },
          { calc: '  倍率 = 1 - 0.9 x 0.3843 = 0.6542 → 1.5730', note: '越える' },
          { calc: '四隅 : d = 0.5174 → smoothstep 0.7907' },
          { calc: '  倍率 = 1 - 0.9 x 0.7907 = 0.2884' },
          { calc: '  2.4047 x 0.2884 = 0.6935', note: 'しきい値 0.95 に届かない' },
        ],
        result:
          '**$7$ 個のうち $4$ 個 ― 四隅だけが、しきい値を越えられなくなります。** 順番を入れ替えれば $7$ 個とも滲み、そのあとで四隅が暗くなるだけです。**どちらが正しいということはありません。** 現実のカメラで四隅が暗くなるのは絞りとレンズの都合なので「ブルーム → ビネット」が物理的には近く、一方「ビネット → ビネットの効いた画に対する滲み」は**画面の四隅を静かにさせたいとき**に効きます。大事なのは、**この違いが計算で予言できる**ということです。',
      },
    },
    {
      kind: 'md',
      text: `
## 入れ替えて、見る

ボタンで順番を入れ替えられるようにしました。
**四隅の街灯**を見てください。滲みが消えたり戻ったりします。
`,
    },
    {
      kind: 'sandbox',
      title: 'ビネットとブルーム、どちらが先か',
      guide: { focus: ['並び替え'] },
      code: `import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ---- ここを書き換えて試してください ---- */
const VIGNETTE = 0.9;        // ビネットの強さ
const BLOOM_THRESHOLD = 0.95;
const BLOOM_STRENGTH = 0.7;
const BLOOM_RADIUS = 0.35;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090b12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x3a4a7a, 0x0a0a10, 0.35));

// 奥行きの手がかり。街灯が浮いて見えないように
const wall = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 50),
  new THREE.MeshStandardMaterial({ color: 0x1b1e2a, roughness: 0.95 }),
);
wall.position.z = -3;
scene.add(wall);

/* ---- 街灯を 3 x 3 に置く。明るさは 0.2126R + 0.7152G + 0.0722B = 2.4047 ---- */

const lampMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.3, 1.1) });
const lampGeometry = new THREE.SphereGeometry(0.22, 24, 16);
const lamps = [];
// 四隅 4 個 + 左右の中央 2 個 + 中央 1 個。上下の中央は、下の表示と重なるので置きません
for (const [fx, fy] of [
  [-0.78, 0.68], [0.78, 0.68],
  [-0.78, 0], [0, 0], [0.78, 0],
  [-0.78, -0.68], [0.78, -0.68],
]) {
  const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
  lamp.userData.frac = { x: fx, y: fy };
  lamps.push(lamp);
  scene.add(lamp);
}

// 画面の決まった割合の位置に置きなおす（縦横比が変わっても四隅は四隅のまま）
function placeLamps() {
  const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
  const halfW = halfH * camera.aspect;
  for (const lamp of lamps) {
    lamp.position.set(lamp.userData.frac.x * halfW, lamp.userData.frac.y * halfH, 0);
  }
}
placeLamps();

/* ---- ビネットのパス ---- */

const vignettePass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uVignette: { value: VIGNETTE },
  },
  vertexShader: [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}',
  ].join('\\n'),
  fragmentShader: [
    'uniform sampler2D tDiffuse;',
    'uniform float uVignette;',
    'varying vec2 vUv;',
    'void main() {',
    '  vec4 color = texture2D(tDiffuse, vUv);',
    '  float d = distance(vUv, vec2(0.5));',
    '  color.rgb *= 1.0 - smoothstep(0.20, 0.65, d) * uVignette;',
    '  gl_FragColor = color;',
    '}',
  ].join('\\n'),
});

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD,
);

const renderPass = new RenderPass(scene, camera);
const outputPass = new OutputPass();

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(
  window.innerWidth, window.innerHeight,
  { type: THREE.HalfFloatType, samples: 4 },
));
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(window.innerWidth, window.innerHeight);

/* ---- 並び替え ---- */

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:50%; transform:translateX(-50%); bottom:10px;' +
  'color:#e8e8f2; font:12px monospace; pointer-events:none; white-space:pre;' +
  'text-align:center; text-shadow:0 1px 2px #000;';
document.body.appendChild(readout);

function setOrder(vignetteFirst) {
  composer.passes.length = 0;
  composer.addPass(renderPass);
  if (vignetteFirst) {
    composer.addPass(vignettePass);
    composer.addPass(bloomPass);
  } else {
    composer.addPass(bloomPass);
    composer.addPass(vignettePass);
  }
  composer.addPass(outputPass);

  const cornerMul = 1 - 0.7907 * VIGNETTE;   // 四隅 d = 0.5174 のときの倍率
  readout.textContent = vignetteFirst
    ? 'ビネット → ブルーム\\n四隅の街灯 2.4047 x ' + cornerMul.toFixed(4) +
      ' = ' + (2.4047 * cornerMul).toFixed(4) + '\\nしきい値 ' + BLOOM_THRESHOLD +
      ' に届かない → 四隅は滲まない'
    : 'ブルーム → ビネット\\n四隅の街灯 2.4047 のまましきい値を通る\\n' +
      '滲んでから ' + cornerMul.toFixed(4) + ' 倍される → 暗いが滲む';
}

function addButton(text, offset, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText =
    'position:absolute; bottom:64px; left:50%; margin-left:' + offset + 'px;' +
    'padding:6px 10px; background:#12121f; color:#e8e8f2;' +
    'border:1px solid #3a3a5c; border-radius:6px; font:12px sans-serif; cursor:pointer;';
  button.addEventListener('click', onClick);
  document.body.appendChild(button);
}

addButton('ビネット → ブルーム', -142, () => setOrder(true));
addButton('ブルーム → ビネット', 6, () => setOrder(false));
setOrder(true);

function animate() {
  requestAnimationFrame(animate);
  composer.render();
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  placeLamps();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '「ビネット → ブルーム」では、四隅の 4 個だけが滲まず、ただの小さな点になります。中央と左右の 3 個は滲んだままです ― 倍率が 0.65 以上で、しきい値を割らないからです。「ブルーム → ビネット」に切り替えると、7 個とも滲みます。`VIGNETTE` を 0.5 に下げると四隅の倍率が 0.6047 になり、明るさは 1.4540 ― どちらの順番でも 7 個とも滲むようになります。**順番の違いが見えるのは、しきい値をまたぐときだけ**です。',
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '順番が効くパス、効かないパス',
      text: `
すべてのパスで順番が問題になるわけではありません。**見分け方があります。**

- **しきい値・条件分岐を持つパス** … ブルーム、輪郭抽出、$SMAA$。
  **前のパスの結果で仕事が変わる。順番が効く**
- **各画素を独立に、掛けたり足したりするだけのパス** … ビネット、色調、グレイン。
  **お互いの順番はほとんど効かない**

$2$ つめの理由は、**掛け算どうしは順番を入れ替えても同じ**だからです。

$0.7 \\times 0.9 = 0.9 \\times 0.7$ ― ビネットのあとに色調でも、逆でも同じ。

**ただし例外が $2$ つ**あります。

- **$0$ や $1$ で頭打ちになる操作**（\`clamp\`、彩度の上げすぎ）。
  潰れたあとでは、もう戻せません
- **非線形な操作**（トーンマッピング、ガンマ）。$1$ つでも挟むと、以降は別の世界です

**「潰す操作」と「しきい値を持つ操作」だけ、順番を気にしてください。**
`,
    },
    {
      kind: 'md',
      text: `
## 第4部までの実装に、戻して足す

ここまでの $4$ 章で書いたものは、そのまま[](#/ch/x39-city-finish)の街に足せます。

おすすめの順で並べるとこうです。

- \`RenderPass\`
- \`UnrealBloomPass\`（しきい値 $0.95$ 前後）
- 自前の \`ShaderPass\`（ビネット $+$ 彩度 $+$ 色収差）
- \`OutputPass\`

自前パスを $1$ つにまとめているのは、[](#/ch/y11-postprocess-cost)の理由です ―
**$3$ つに分けると、読み書きが $3$ 倍**になります。

そして必ず、**入れる前と後をスクリーンショットで並べてください。**
夜の街には効きますが、[](#/ch/p03-planet-atmosphere)の惑星のような
**もともと滲みのある題材には、ほとんど足しません。**
`,
    },
  ],
  exercises: [
    {
      prompt: `\`VIGNETTE\` を $0.9$ から $0.5$ に下げました。

順番を入れ替えても、見た目が変わらなくなります。なぜですか。`,
      hint: '四隅の明るさが、しきい値のどちら側にいるかを計算してください。',
      answer: `**四隅の明るさが、しきい値を割らなくなるからです。**

**計算**

四隅では $\\mathrm{smoothstep}(0.20,\\ 0.65,\\ 0.5174) = 0.7907$。

- **$s = 0.9$** … 倍率 $1 - 0.9 \\times 0.7907 = 0.2884$ → $2.4047 \\times 0.2884 = 0.6935$
- **$s = 0.5$** … 倍率 $1 - 0.5 \\times 0.7907 = 0.6047$ → $2.4047 \\times 0.6047 = 1.4540$

しきい値は $0.95$ です。

**$0.6935$ は割り、$1.4540$ は割らない。**

**だから順番が効かなくなる**

ビネットを先に通しても、四隅の街灯はまだしきい値を越えます。

つまり**どちらの順でも、$7$ 個とも滲みます。**

残るのは「滲みの明るさが違う」だけで、これは**掛け算の順序**の話 ―
$0.6047$ を先に掛けても後に掛けても、ほぼ同じです。

**一般化**

**順番の違いが見えるのは、しきい値をまたぐときだけ**です。

$s$ を上げていくと、$1$ つの点で急に見た目が変わります。

境目を求めると、$2.4047 \\times (1 - 0.7907 s) = 0.95$ から $s = 0.7651$ ―
**$0.77$ を境に、四隅の滲みが消えます。**`,
    },
    {
      prompt: `ビネットと色調補正（\`color.rgb *= vec3(1.05, 1.0, 0.92)\` のような暖色寄せ）は、
どちらを先に置いても結果が同じです。

なぜですか。また、同じにならない書き方の例を挙げてください。`,
      hint: '$2$ つの操作は、それぞれ何をしていますか。',
      answer: `**どちらも掛け算だけだからです。掛け算は順序を入れ替えても同じです。**

**確かめる**

もとの色 $c$、ビネットの倍率 $m$、色調の係数 $t$。

- ビネット先 : $(c \\cdot m) \\cdot t$
- 色調先 : $(c \\cdot t) \\cdot m$

どちらも $c \\cdot m \\cdot t$。**同じです。**

しかも**この $2$ つは $1$ つのパスにまとめられます** ―
まとめれば読み書きが $1$ 回で済みます。

**同じにならない書き方**

$3$ つ挙げます。

- **\`clamp\` や \`min\` が入る。** $\\mathrm{clamp}(c \\cdot m,\\ 0,\\ 1) \\cdot t$ と
  $\\mathrm{clamp}(c \\cdot t,\\ 0,\\ 1) \\cdot m$ は違います。**潰れたあとでは戻せない**
- **加算が混じる。** グレイン（雑音を足す）とビネット（掛ける）。
  $(c + n) \\cdot m \\ne c \\cdot m + n$ ―
  **ビネットを先にすると、四隅で雑音だけが浮きます**
- **彩度が入る。** $Y$ を計算し直すので、前段で明るさが変わっていると結果が変わります

**まとめると**

**掛け算だけなら順不同。頭打ち・足し算・非線形が $1$ つでも入ると、順番が効きます。**`,
    },
    {
      prompt: `$SMAA$（輪郭をならすパス）だけは \`OutputPass\` の**後ろ**に置きます。

一方ブルームは前です。この $2$ つを分けている基準は何ですか。`,
      hint: 'それぞれ、何を見て仕事を決めていますか。',
      answer: `**その効果が「どの目盛りで意味を持つか」です。**

**ブルームが見ているもの**

**$1$ を超える明るさ**です。街灯の $2.4047$ のような値。

\`OutputPass\` のトーンマッピングを通すと、この $2.4047$ は $0.722$ に畳まれ、
**$1$ を超えた情報は失われます。**

だから**リニアのうち、つまり前**に置きます。

**$SMAA$ が見ているもの**

**隣り合う画素の色の差**です。差が大きいところを輪郭とみなします。

ここで $sRGB$ の性質が効きます。$sRGB$ は暗い側に目盛りが厚いので、
**人が「差がある」と感じる量に近い**のです。

- リニア $0.02$ と $0.05$ … 差は $0.03$。ほとんど無いように見える
- $sRGB$ に直すと $0.1517$ と $0.2478$ … 差は $0.0961$。**$3.2$ 倍に見える**

リニアのままだと、**暗い部分の輪郭を見落とします。**

**基準**

- **物理量として意味を持つ効果** … リニアのうち。$\\mathrm{OutputPass}$ より前
- **人の見え方を扱う効果** … $sRGB$ になってから。$\\mathrm{OutputPass}$ より後

$SMAA$ は後者です。ほかに**$UI$ の合成**も、たいてい後者に入ります。`,
    },
  ],
  quiz: [
    {
      q: 'ビネットをブルームより前に置くと、何が起きますか。',
      choices: [
        '四隅の光がしきい値を越えられなくなり、そこだけ滲まなくなる',
        '何も変わらない',
        'ビネットが効かなくなる',
        '全体が暗くなる',
      ],
      answer: 0,
      explain:
        '明るさ 2.4047 の街灯に、四隅の倍率 0.2884 が掛かると 0.6935 ― しきい値 0.95 に届きません。中央や左右の中央では倍率が 0.65〜1.00 なので越えたままです。7 個のうち四隅の 4 個だけが滲まなくなる、という違いが計算で予言できます。',
    },
    {
      q: 'ビネットと色調補正は、どちらを先に置いても結果が同じです。なぜですか。',
      choices: [
        'どちらも各画素に掛け算をするだけで、掛け算は順序を入れ替えても同じだから',
        'three が自動で並べ替えるから',
        'どちらも効果が小さいから',
        '同じパスとして扱われるから',
      ],
      answer: 0,
      explain:
        '(c·m)·t も (c·t)·m も c·m·t です。だから 1 つのパスにまとめてしまうのが得で、読み書きも 1 回で済みます。ただし clamp のような頭打ち、グレインのような加算、彩度のような非線形が 1 つでも入ると順番が効きます。',
    },
    {
      q: 'ブルームは OutputPass の前、SMAA は後ろに置きます。基準は何ですか。',
      choices: [
        'その効果が物理量（1 超えの明るさ）を見るか、人の見え方（色の差）を見るか',
        'パスの重さ',
        'three の実装上の制約',
        'アルファ値を使うかどうか',
      ],
      answer: 0,
      explain:
        'ブルームは 1 を超える明るさを見るので、トーンマッピングで畳まれる前でなければ意味がありません。SMAA は隣の画素との色の差で輪郭を推定するので、人の感覚に近い sRGB のほうが暗部を拾えます ― リニアの 0.02 と 0.05 の差 0.03 は、sRGB では 0.0961 と 3.2 倍に見えます。',
    },
  ],
};
