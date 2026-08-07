import type { Chapter } from '../types.ts';

export const chapterX13: Chapter = {
  slug: 'x13-clouds',
  part: 'project',
  number: 13,
  title: '雲 ― しきい値をぼかし、被覆率は面積で数える',
  goal: '同じノイズから雲を切り出せるようになり、「どれだけ曇っているか」を、球の上で正しく測れるようになります。',
  requires: ['x12-additive', 'x08-sphere-seam', 'b36-smoothstep'],
  threeApis: [
    'MeshStandardMaterial.alphaMap',
    'Material.transparent',
    'CanvasTexture',
    'Object3D.rotation',
  ],
  mathRecall: [
    { slug: 'b36-smoothstep', note: '境目をぼかす。ここでは雲のふちになる' },
    { slug: 'x08-sphere-seam', note: '緯度ごとに $\\cos\\phi$ 倍。今回は数え方に効く' },
    { slug: 'x07-fbm-terrain', note: '同じ $f\\!B\\!m$ を、種と周波数だけ変えて使う' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 新しい道具は、1 つも要りません

雲は、地表と**まったく同じ作り方**で出てきます。

- [](#/ch/x06-value-noise)の $3$ 次元ノイズを
- [](#/ch/x08-sphere-seam)のとおり**方向ベクトル**で引き
- 種と周波数だけ変える

違うのは**しきい値の使い方**だけです。

- 地表 … $0.5$ を境に、海と陸に**分けた**
- 雲 … $0.5$ から上を雲にし、**境目をぼかす**

この「ぼかす」が、雲を雲に見せている唯一の要素です。
`,
    },
    {
      kind: 'md',
      text: `
## ぼかさないと、切り絵になる

もし \`noise > 0.5 ? 255 : 0\` と書いたら、
雲のふちが**カッターで切ったように**なります。

雲は、端に行くほど薄くなるものです。
その薄い部分を作らないと、白い紙を貼りつけたようにしか見えません。

そこで \`smoothstep\` を使い、$0.5$ から $0.72$ のあいだで
$0 \\to 1$ になめらかに立ち上げます。
`,
    },
    {
      kind: 'formula',
      tex: 'a \\;=\\; \\mathrm{smoothstep}(0.5,\\; 0.72,\\; n),\\qquad t = \\frac{n - 0.5}{0.22},\\quad a = t^{2}(3 - 2t)',
      readAloud:
        'ノイズの値 $n$ を、$0.5$ で $0$、$0.72$ で $1$ になるようになめらかに変えたものが不透明度 $a$ です。まず $0.22$ の幅で $0$〜$1$ の割合 $t$ に直し、それを $t^{2}(3-2t)$ に通します。',
      worked: {
        given: 'ノイズの値を $4$ か所で通します。$f\\!B\\!m$ の出力は $0$〜$1$ で、多くが $0.5$ 付近に集まります。',
        steps: [
          { calc: 'n = 0.48 : t = (0.48-0.5)/0.22' },
          { calc: '         = -0.09 → clamp して 0', note: '晴れ' },
          { calc: 'n = 0.55 : t = 0.05/0.22 = 0.227' },
          { calc: '         0.227の2乗x(3-0.455)' },
          { calc: '         = 0.0515 x 2.545 = 0.131', note: '雲のふち。うっすら' },
          { calc: 'n = 0.61 : t = 0.11/0.22 = 0.5' },
          { calc: '         0.25 x 2 = 0.5', note: 'ちょうど半分' },
          { calc: 'n = 0.75 : t = 1.136 → clamp して 1', note: '厚い雲' },
        ],
        result:
          '**$0.48$ と $0.55$ の差はノイズの上ではわずか $0.07$ ですが、不透明度は $0$ と $0.131$ に分かれます。** そしてその間には、$0.001$ 刻みで少しずつ濃くなる値が並びます ― これが雲のふちです。しきい値を $1$ つの値（幅 $0$）にすると、この列が丸ごと消えて、$0$ と $1$ しかなくなります。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'alphaMap が読むのは、緑のチャンネルです',
      text: `
three の \`alphaMap\` は、テクスチャの**緑**を不透明度として使います。

three の中では \`texture2D(alphaMap, vAlphaMapUv).g\` と書かれています ― 読んでいるのは \`.g\` の $1$ 文字です。

赤に書いて緑を $0$ のままにすると、**雲は $1$ つも出ません。**
真っ黒なテクスチャを渡したのと同じことになります。

この作品では $3$ チャンネルとも同じ値を書いているので気になりませんが、
「チャンネルごとに別の情報を詰める」最適化をやったときに、必ず一度は踏みます。

**そして \`transparent: true\` を忘れると、$\\alpha$ は計算されても使われません。**
$2$ つで $1$ 組です。
`,
    },
    {
      kind: 'md',
      text: `
## どれだけ曇っているのか

雲ができたら、次の質問が出てきます。**「この星は、何割が曇っているのか」**

見た目の調整をするには、この数字が要ります。
「もう少し雲を増やそう」は、増やす前後を比べられて初めて意味を持ちます。

数え方は簡単そうに見えます。**テクスチャの全画素の $\\alpha$ を平均すればよい。**

**それが間違いです。**

[](#/ch/x08-sphere-seam)でやったとおり、正距円筒のテクスチャでは、
**極に近い行の $1$ 画素が球の上で受け持つ面積が、赤道より小さい**からです。

画素をそのまま平均すると、**極のあたりの画素を、実際の $100$ 倍以上重く数えます。**
`,
    },
    {
      kind: 'formula',
      tex: '\\bar{a} \\;=\\; \\frac{\\sum_{\\text{行}} \\cos\\phi \\sum_{\\text{列}} a}{\\sum_{\\text{行}} \\cos\\phi \\cdot W}',
      readAloud:
        '球の上での平均の不透明度は、各画素の $\\alpha$ に、その行の $\\cos\\phi$ を重みとして掛けて足し、重みの合計で割ったもの、と読みます。$\\cos\\phi$ は、その行の画素が球の上で持つ横幅です。',
      worked: {
        given:
          '$1024 \\times 512$ のテクスチャを、しきい値 $0.5$・幅 $0.22$ で焼いて、$2$ とおりに数えます。',
        steps: [
          { calc: 'そのまま平均（画素を等しく数える）' },
          { calc: '  合計 a / (1024 x 512) = 0.170' },
          { calc: 'cos で重みを付けて平均' },
          { calc: '  Σ a cos / Σ cos = 0.203' },
          { calc: '差 : 0.203 - 0.170 = 0.033' },
          { calc: '相対では 0.033 / 0.203 = 16%' },
        ],
        result:
          '**$17.0\\%$ と $20.3\\%$。$16\\%$ ずれています。** この星では極のあたりが晴れているので、極を重く数える「そのまま平均」が**低めに出ました**。逆の模様なら逆にずれます ― **ずれる向きは模様しだいで、大きさだけが構造で決まります。** 解像度を上げても $17.0$ と $20.3$ のままで、$256\\times128$ でも $1024\\times512$ でも変わりません。**測り方の間違いは、標本を増やしても直りません。**',
      },
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '世界地図でグリーンランドを数えるのと同じ',
      text: `
正距円筒の世界地図では、グリーンランドがアフリカと同じくらいの大きさに見えます。
実際は**アフリカが $14$ 倍**です。

「地図の上で緑色の画素を数えて、陸地の割合を出す」をやると、
**高緯度の国が実際より何倍も重く数えられます。**

雲の被覆率も、まったく同じ間違いです。

**地図の上の面積と、球の上の面積は違う。**
それを直す係数が $\\cos\\phi$ で、
[](#/ch/x08-sphere-seam)の「$36.3\\%$ が引き伸ばしに消える」と同じ $\\cos\\phi$ です。

**$1$ つの事実が、貼るときと数えるときの両方で顔を出します。**
`,
    },
    {
      kind: 'md',
      text: `
## この星は、地球よりずっと晴れています

しきい値を変えて測ると、こうなります（面積で重み付けした値）。

| しきい値 | 被覆率 |
|---|---|
| $0.58$ | $6.9\\%$ |
| $0.50$ | $20.3\\%$（この作品） |
| $0.42$ | $41.8\\%$ |
| $0.35$ | $63.9\\%$ |
| $0.30$ | $77.8\\%$ |

**地球の平均雲量は、およそ $67\\%$ です。**
つまり本物らしくするなら $0.35$ あたりが正解で、この作品はその $3$ 分の $1$ しかありません。

わざとです。

**せっかく作った地表が見えなくなる**からです。
[](#/ch/x09-surface-bake)で焼いた大陸と雪と海岸線は、
雲が $67\\%$ あると半分以上が隠れます。

**「本物に合わせる」と「作ったものを見せる」がぶつかったとき、
どちらを取るかは作品が決めます。** ここでは後者を取りました。
`,
    },
    {
      kind: 'md',
      text: `
## 光は、three に任せる

雲のマテリアルは \`MeshStandardMaterial\` のままにします。**自作シェーダにしません。**

そうすると、こうなります。

- 太陽の当たっている側 … 白く明るい
- 夜側 … **自動的に暗くなる**
- 昼夜の境目 … 斜めから照らされて、うっすら陰る

**この $3$ つを、$1$ 行も書かずに手に入れています。**
[](#/ch/b27-lambert)の「明るさ ＝ 法線と光の内積」を、three がやってくれるからです。

大気と街の明かりで自作シェーダを書いたのは、
**既製品にできないことがあったから**でした。
雲にはそれがないので、書きません。

**自作シェーダは、書かずに済むなら書かないほうが良いもの**です。
影・トーンマッピング・環境マップ・霧 ― 既製のマテリアルは、
黙ってこれら全部に対応しています。自作した瞬間に、全部が自分の宿題になります。
`,
    },
    {
      kind: 'sandbox',
      title: '雲を切り出して、被覆率を 2 通りで測る',
      guide: { focus: ['雲を切り出す', '被覆率を 2 通りで数える'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TEX_W = 512;
const TEX_H = 256;
const R = 1.5;

const THRESHOLD = 0.5;   // ここから上を雲にする
const SOFT = 0.22;       // ふちをぼかす幅。0 にすると切り絵になる

/* ---- 雲を切り出す ---- */
// 地表と同じノイズ。種と周波数だけ変えて、しきい値の使い方を変える

function bakeClouds() {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(TEX_W, TEX_H);

  let flatSum = 0;        // 画素を等しく数えた合計
  let weightedSum = 0;    // 球の面積で重みを付けた合計
  let weightTotal = 0;

  for (let row = 0; row < TEX_H; row++) {
    const lat = (0.5 - row / (TEX_H - 1)) * Math.PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    // この行の 1 画素が球の上で持つ横幅の比。極では 0 に近づく
    const weight = Math.max(0, cosLat);

    for (let col = 0; col < TEX_W; col++) {
      const lon = (col / TEX_W - 0.5) * Math.PI * 2;
      // 方向ベクトルで引く。UV で引くと経度 0 度に継ぎ目が出る
      const n = fbm(
        cosLat * Math.cos(lon) * 3.4 - 40,
        sinLat * 3.4 - 40,
        cosLat * Math.sin(lon) * 3.4 - 40,
        5, 99,
      );

      // ここが地表との唯一の違い ― 分けずに、ぼかして立ち上げる
      const t = SOFT > 0
        ? Math.min(1, Math.max(0, (n - THRESHOLD) / SOFT))
        : (n > THRESHOLD ? 1 : 0);
      const alpha = t * t * (3 - 2 * t);

      flatSum += alpha;
      weightedSum += alpha * weight;
      weightTotal += weight;

      const at = (row * TEX_W + col) * 4;
      const value = alpha * 255;
      // alphaMap が読むのは緑。3 つとも書いておくのが安全
      image.data[at] = value;
      image.data[at + 1] = value;
      image.data[at + 2] = value;
      image.data[at + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return {
    texture: new THREE.CanvasTexture(canvas),
    /* ---- 被覆率を 2 通りで数える ---- */
    flat: flatSum / (TEX_W * TEX_H),
    weighted: weightedSum / weightTotal,
  };
}

const clouds = bakeClouds();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 0.9, 5.4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const sun = new THREE.DirectionalLight(0xfff2e0, 3.2);
sun.position.set(6, 2, 4);
scene.add(sun, new THREE.AmbientLight(0x22334a, 0.35));

// 下の球 ― 雲がどこに掛かっているかを見るための、無地の惑星
const planet = new THREE.Mesh(
  new THREE.SphereGeometry(R, 96, 64),
  new THREE.MeshStandardMaterial({ color: 0x2b4a6b, roughness: 0.9 }),
);
scene.add(planet);

// 雲 ― MeshStandardMaterial のままにするので、陰影は three がやってくれる
const cloudLayer = new THREE.Mesh(
  new THREE.SphereGeometry(R * 1.02, 96, 64),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    alphaMap: clouds.texture,
    transparent: true,      // これが無いと alphaMap は無視される
    depthWrite: false,
    roughness: 1,
  }),
);
scene.add(cloudLayer);

const readout = document.createElement('div');
readout.innerHTML =
  'しきい値 ' + THRESHOLD + '（ぼかし幅 ' + SOFT + '）<br>' +
  '画素をそのまま平均 : ' + (clouds.flat * 100).toFixed(1) + '%<br>' +
  '球の面積で平均     : ' + (clouds.weighted * 100).toFixed(1) + '%';
readout.style.cssText =
  'position:absolute; bottom:14px; left:16px; color:#9fb4d8;' +
  'font:12px/1.7 ui-monospace, monospace; pointer-events:none;';
document.body.appendChild(readout);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  planet.rotation.y += dt * 0.05;
  cloudLayer.rotation.y += dt * 0.075;   // 雲だけ 1.5 倍速い
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- 下ごしらえ：3次元ノイズ（地表の章で作ったもの。読み飛ばして可） ---- */

function hash3(x, y, z, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177);
  h = Math.imul(h + Math.imul(seed, 2246822519), 2654435761);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967295;
}
function fade(t) { return t * t * (3 - 2 * t); }
function mix(a, b, t) { return a + (b - a) * t; }
function noise3(x, y, z, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
  const x00 = mix(hash3(xi, yi, zi, seed), hash3(xi + 1, yi, zi, seed), u);
  const x10 = mix(hash3(xi, yi + 1, zi, seed), hash3(xi + 1, yi + 1, zi, seed), u);
  const x01 = mix(hash3(xi, yi, zi + 1, seed), hash3(xi + 1, yi, zi + 1, seed), u);
  const x11 = mix(hash3(xi, yi + 1, zi + 1, seed), hash3(xi + 1, yi + 1, zi + 1, seed), u);
  return mix(mix(x00, x10, v), mix(x01, x11, v), w);
}
function fbm(x, y, z, octaves, seed) {
  let sum = 0, total = 0, amp = 1, freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += noise3(x * freq, y * freq, z * freq, seed + i * 101) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / total;
}`,
      caption:
        '左下に $2$ つの被覆率が出ます。**$17.0\\%$ と $20.3\\%$** ― 同じテクスチャを数え方だけ変えた値です。`SOFT` を $0$ にすると雲が切り絵になり、ふちのぎざぎざがはっきり見えます。`THRESHOLD` を $0.35$ にすると被覆率が $63.9\\%$ になり、地球並みに曇って、下の惑星がほとんど見えなくなります。雲は地表の $1.5$ 倍の速さで回っています。',
    },
  ],
  exercises: [
    {
      prompt: `\`SOFT\` を $0$ にして、しきい値をぼかさずに雲を切り出してください。

見た目はどう変わりますか。被覆率の数字はどう変わりますか。`,
      hint: 'ぼかしを消すと、$\\alpha$ は $0$ か $1$ しか取らなくなります。平均はどちらに寄りますか。',
      answer: `**見た目は切り絵になり、被覆率は $20.3\\% \\to 51.1\\%$ ― $2.5$ 倍に跳ね上がります。**

**見た目**

雲のふちが、$1$ 画素で $0$ から $1$ に飛びます。

- 拡大すると**階段状のぎざぎざ**が見えます
- 遠目には「白い紙を貼った」ように見えます
- 雲が薄くたなびく部分が**丸ごと消えます**

**数字がここまで動く理由**

これが予想より大きいはずです。$f\\!B\\!m$ の出力は**$0.5$ 付近に密集している**からです。

- ぼかしあり … $0.5$〜$0.72$ の画素は $0$〜$1$ の**途中の値**をもらう
- ぼかしなし … その画素が**全部 $1$ になる**

いちばん画素の多い帯を、まるごと「厚い雲」に格上げしたことになります。

**「ふちを整えるだけ」のつもりが、雲の量を 2.5 倍にしていた**

ここが怖いところです。

\`SOFT\` は見た目のためのつまみのつもりで置いたのに、
**被覆率という別の量を、こっそり大きく動かしています。**

もし「雲が多すぎるから \`THRESHOLD\` を上げよう」と調整したあとで
\`SOFT\` を触ったら、その調整は無効になります。

**つまみが独立でないときは、片方を触るたびに、もう片方を測り直してください。**
測る手段（この章の被覆率）を先に用意しておいたのは、そのためです。`,
    },
    {
      prompt: `緯度 $60$ 度から極までの範囲（南北あわせて）は、球の表面積の何割を占めますか。

正距円筒のテクスチャでは、その範囲は縦方向の何割を占めますか。`,
      hint: '緯度 $\\phi$ より上の帽子の面積は $2\\pi R^{2}(1 - \\sin\\phi)$ です。$\\sin 60° = 0.866$。',
      answer: `**面積では $13.4\\%$、テクスチャでは $33.3\\%$ です。**

**球の上での面積**

緯度 $60$ 度より上の帽子（北極側）の面積は

$2\\pi R^{2}(1 - \\sin 60°) = 2\\pi R^{2}(1 - 0.866) = 2\\pi R^{2} \\times 0.134$

球全体は $4\\pi R^{2}$ なので、北だけで

$\\dfrac{2\\pi R^{2} \\times 0.134}{4\\pi R^{2}} = 6.7\\%$

南北あわせて **$13.4\\%$**。

**テクスチャの上での割合**

正距円筒では、行が緯度に**等間隔**で並びます。

緯度 $60$〜$90$ 度は $30$ 度ぶん、全体は $180$ 度ぶんなので

$\\dfrac{30}{180} = 16.7\\%$ ― 南北あわせて **$33.3\\%$**。

**2.5 倍、重く数えている**

$33.3 \\div 13.4 = 2.49$ 倍です。

球の上では $13\\%$ しかない地域が、テクスチャの上では $3$ 分の $1$ を占めています。

**「そのまま平均」が壊れる理由が、この $1$ 行に出ています。**
高緯度の雲は、実際の $2.5$ 倍の発言権を持ちます。

**極に近づくほどひどくなる**

緯度 $80$ 度以上なら、面積では $1.5\\%$、テクスチャでは $11.1\\%$ で **$7.3$ 倍**です。

$\\cos\\phi$ の重みは、この不均衡をちょうど打ち消すために掛けています。`,
    },
    {
      prompt: `雲の \`alphaMap\` に、赤のチャンネルだけ書いたテクスチャを渡しました
（緑と青は $0$ のまま）。

何が起きますか。`,
      hint: 'three の `alphaMap` は、どのチャンネルを読みますか。',
      answer: `**雲が $1$ つも出ません。惑星が無地になります。**

**理由**

three の \`alphaMap\` は**緑**を読みます。

three の中身は \`diffuseColor.a *= texture2D(alphaMap, vAlphaMapUv).g\` です。

緑が全部 $0$ なら、$\\alpha$ はどこでも $0$ です。
雲の層は**完全に透明**になり、下の惑星だけが見えます。

**厄介なのは、エラーが出ないこと**

テクスチャは正しく作られ、正しく転送され、正しく読まれています。
$\\alpha$ が $0$ なだけです。

- コンソールに何も出ません
- \`console.log(texture)\` は正常に見えます
- キャンバスを画面に出せば、赤い雲がちゃんと写っています

**「テクスチャは合っているのに出ない」を疑う順番**

- \`transparent: true\` を付けたか
- **チャンネルは合っているか**（\`alphaMap\` は緑、\`roughnessMap\` も緑、\`metalnessMap\` は青）
- \`colorSpace\` を付けていないか（データのテクスチャに付けると値が歪みます）

**この作品が $3$ チャンネルとも同じ値を書いている理由**

デバッグのときに、そのキャンバスを \`document.body\` に貼れば
**そのまま白黒の雲の絵として読める**からです。

チャンネルに別々の情報を詰めるのは、
**それが必要なほど転送量が問題になってから**で十分です。`,
    },
  ],
  quiz: [
    {
      q: '雲の不透明度を `noise > 0.5 ? 1 : 0` で決めると、何が問題ですか。',
      choices: [
        '雲のふちが 1 画素で 0 から 1 に飛び、切り絵のように見える',
        '被覆率が計算できなくなる',
        'alphaMap が受け付けない',
        'ノイズの継ぎ目が出る',
      ],
      answer: 0,
      explain:
        '雲は端に行くほど薄くなるものです。しきい値を 1 点にすると、その薄い部分が丸ごと消えて、白い紙を貼りつけたように見えます。smoothstep で 0.5 から 0.72 の幅を持たせると、その幅のあいだに少しずつ濃くなる値が並び、それが雲のふちになります。',
    },
    {
      q: '正距円筒のテクスチャで雲の被覆率を出すとき、画素の α をそのまま平均すると何が起きますか。',
      choices: [
        '極に近い画素を、球の上での面積よりずっと重く数えてしまう',
        '赤道付近の画素が重くなりすぎる',
        '解像度が足りないと誤差が出るが、上げれば直る',
        '何も問題ない。画素は等しく数えてよい',
      ],
      answer: 0,
      explain:
        '極に近い行の画素は、球の上では狭い範囲しか受け持ちません。緯度 60 度以上は球の面積の 13.4% ですが、テクスチャの 33.3% を占めます。cos φ を重みに掛けて数えると、この差が打ち消せます。この作品では 17.0% と 20.3% で 16% ずれ、解像度を上げてもずれたままです。',
    },
    {
      q: '雲の層を MeshStandardMaterial のままにしておく利点はどれですか。',
      choices: [
        '夜側で自動的に暗くなる。影・霧・トーンマッピングへの対応も three が持っている',
        '自作シェーダより描画が速い',
        'alphaMap は MeshStandardMaterial でしか使えない',
        '雲は光を受けないので、どのマテリアルでも同じ',
      ],
      answer: 0,
      explain:
        '「明るさ ＝ 法線と光の内積」を three がやってくれるので、昼側は白く、夜側は暗く、境目は斜めに陰ります。1 行も書いていません。自作シェーダにした瞬間、影も霧もトーンマッピングも自分の宿題になります。大気と街の明かりを自作したのは、既製品にできないことがあったからで、雲にはそれがありません。',
    },
  ],
};
