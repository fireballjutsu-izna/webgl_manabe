import type { Chapter } from '../types.ts';

export const chapterX08: Chapter = {
  slug: 'x08-sphere-seam',
  part: 'project',
  number: 8,
  title: '球に貼る ― 継ぎ目と極を、原理的に消す',
  goal: '球のテクスチャで必ず起きる継ぎ目と極の歪みを避けられるようになり、平らな画像を球に貼るときに何が失われるのかを数字で言えるようになります。',
  requires: ['x07-fbm-terrain', 'w15-uv'],
  threeApis: ['SphereGeometry', 'CanvasTexture', 'Texture.colorSpace'],
  mathRecall: [
    { slug: 'w15-uv', note: '球の UV は、横が経度・縦が緯度' },
    { slug: '05-trig', note: '緯度と経度から方向ベクトルを作る' },
    { slug: 'x03-uniform-sphere', note: '球の上では「一様」の意味が変わる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 高さはできた。あとは、どこで引くか

[](#/ch/x07-fbm-terrain)で、$3$ 次元の座標を渡せば高さが返る関数ができました。

テクスチャは平らな画像なので、画素には $(u, v)$ しかありません。
**その $2$ つの数を、ノイズにどう渡すか** ― 残っているのはここだけです。

**そして、ここが惑星づくりでいちばん引っかかる場所です。**
`,
    },
    {
      kind: 'md',
      text: `
## 素直にやると、必ず 2 か所で破綻する

球の UV は、[](#/ch/w15-uv)でやったとおり
「**横が経度、縦が緯度**」に対応しています。世界地図と同じ{{正距円筒図法}}です。

なので、つい $(u, v)$ をそのままノイズに渡したくなります。

**そうすると、必ず $2$ つの破綻が起きます。**

- **経度 $0$ 度に、縦の継ぎ目が出る。**
  $u = 0$ と $u = 1$ は球の上では**同じ場所**ですが、
  ノイズにとっては遠く離れた入力なので、値がつながりません
- **極が横に伸びる。**
  画像のいちばん上の行は、球の上では**$1$ 点に潰れます。**
  なのにノイズは横方向にしっかり変化するので、極が渦を巻いたように歪みます

どちらも「たまたまそう見える」ではなく、**貼り方の構造から必ずそうなります。**
解像度を上げても、ノイズの種を変えても消えません。
`,
    },
    {
      kind: 'md',
      text: `
## 直し方は、驚くほど素直

画素の $(u, v)$ ではなく、
**その画素が球の上でどの向きを指しているか（方向ベクトル）でノイズを引きます。**

そのために $2$ 次元ではなく **$3$ 次元のノイズ**が要ります ―
[](#/ch/x06-value-noise)で $3$ 次元版を書いたのは、このためでした。
`,
    },
    {
      kind: 'formula',
      tex: '(x, y, z) = (\\cos\\phi\\cos\\lambda,\\; \\sin\\phi,\\; \\cos\\phi\\sin\\lambda)',
      readAloud:
        '$\\phi$（ファイ）が緯度、$\\lambda$（ラムダ）が経度です。緯度のコサインかける経度のコサインが $x$、緯度のサインが $y$、緯度のコサインかける経度のサインが $z$。三角関数の章でやった「角度から座標」が、また出てきました。この向きをノイズに渡します。',
      worked: {
        given: '緯度 $\\phi = 30$ 度、経度 $\\lambda = 45$ 度の地点の方向ベクトルを出します。',
        steps: [
          { calc: 'cos 30 = 0.866,  sin 30 = 0.5' },
          { calc: 'cos 45 = 0.707,  sin 45 = 0.707' },
          { calc: 'x = 0.866 x 0.707 = 0.612' },
          { calc: 'y = 0.5' },
          { calc: 'z = 0.866 x 0.707 = 0.612' },
          { calc: '確かめ : 0.612の2乗 x 2 + 0.5の2乗' },
          { calc: '       = 0.375 + 0.375 + 0.25 = 1.0' },
        ],
        result:
          'この $(0.612,\\; 0.5,\\; 0.612)$ を**そのままノイズに渡します**。経度 $0$ 度と $360$ 度は**同じ方向ベクトル**になるので、継ぎ目が生まれる余地がありません。UV を渡すと、この $2$ つが別の入力になってしまいます。',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '継ぎ目が消える理由',
      text: `
$u = 0$ と $u = 1$ は、方向に直すと**まったく同じベクトル**になります。

同じ入力なら同じ値が返るので、継ぎ目は原理的に発生しません。

極も同じです。いちばん上の行のすべての画素は、ほぼ同じ「真上」の向きを指すので、
値もほぼ一定になります。

**画像の上では横に引き伸ばされていても、球の上では点に潰れる** ―
その潰れ方に、ノイズの引き方が最初から合っているわけです。

**「継ぎ目を隠す」のではなく「継ぎ目という概念を無くす」** ―
直し方としては、こちらのほうがずっと安く済みます。
`,
    },
    {
      kind: 'md',
      text: `
## 並べて見る

言葉で言われても納得しにくいので、**同じ画面に $2$ つ並べます。**

左が $(u, v)$ をノイズに渡したもの、右が方向ベクトルを渡したものです。
**解像度も色の付け方も、$1$ 文字たがわず同じ**にしてあります ―
違うのは「ノイズに何を渡すか」の $1$ 点だけです。

**経度 $0$ 度が最初から正面に来る**ようにしてあるので、
左の球の真ん中に縦の線が走っているのがすぐ分かります。
上から覗くと、左だけ極が渦を巻いているのも見えます。
`,
    },
    {
      kind: 'sandbox',
      title: 'UV に渡す（破綻）と、方向ベクトルに渡す（正しい）',
      guide: { focus: ['ノイズ ― 2次元と3次元', 'ここだけが違う'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TEX_W = 512;
const TEX_H = 256;
const SEA = 0.5;
const FREQ = 2.2;
const OCTAVES = 5;

/* ---- ノイズ ― 2次元と3次元 ---- */
// 中身は同じ形。渡す座標の数だけが違う

function fade(t) { return t * t * (3 - 2 * t); }
function mix(a, b, t) { return a + (b - a) * t; }

function hash2(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h + Math.imul(seed, 2246822519), 2654435761);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967295;
}
function hash3(x, y, z, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177);
  h = Math.imul(h + Math.imul(seed, 2246822519), 2654435761);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967295;
}

function noise2(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = fade(x - xi), v = fade(y - yi);
  const bottom = mix(hash2(xi, yi, seed), hash2(xi + 1, yi, seed), u);
  const top = mix(hash2(xi, yi + 1, seed), hash2(xi + 1, yi + 1, seed), u);
  return mix(bottom, top, v);
}

function noise3(x, y, z, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
  const x00 = mix(hash3(xi, yi, zi, seed), hash3(xi + 1, yi, zi, seed), u);
  const x10 = mix(hash3(xi, yi + 1, zi, seed), hash3(xi + 1, yi + 1, zi, seed), u);
  const x01 = mix(hash3(xi, yi, zi + 1, seed), hash3(xi + 1, yi, zi + 1, seed), u);
  const x11 = mix(hash3(xi, yi + 1, zi + 1, seed), hash3(xi + 1, yi + 1, zi + 1, seed), u);
  return mix(mix(x00, x10, v), mix(x01, x11, v), w);
}

// 段を重ねる。渡すのが 2 つでも 3 つでも、重ね方は同じ
function fbm(sample) {
  let sum = 0, total = 0, amp = 1, freq = 1;
  for (let i = 0; i < OCTAVES; i++) {
    sum += sample(freq, 1337 + i * 101) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / total;
}

/* ---- ここだけが違う ---- */
// 同じ画素に対して、ノイズへ「UV」を渡すか「方向ベクトル」を渡すか

function heightFromUV(u, v) {
  // u = 0 と u = 1 は球の上では同じ場所なのに、ノイズには別の入力として届く
  return fbm((freq, seed) => noise2(u * 6 * freq, v * 6 * freq, seed));
}

function heightFromDirection(lat, lon) {
  // 経度 0 度と 360 度は、まったく同じベクトルになる。だから継ぎ目が作れない
  const cosLat = Math.cos(lat);
  const x = cosLat * Math.cos(lon) * FREQ + 8;
  const y = Math.sin(lat) * FREQ + 8;
  const z = cosLat * Math.sin(lon) * FREQ + 8;
  return fbm((freq, seed) => noise3(x * freq, y * freq, z * freq, seed));
}

/* ---- 色の付け方は共通 ---- */

function paint(height, absLat, data, at) {
  let r, g, b;
  if (height < SEA) {
    const depth = Math.min(1, (SEA - height) / SEA);
    r = 14 + (1 - depth) * 40;
    g = 48 + (1 - depth) * 78;
    b = 92 + (1 - depth) * 74;
  } else {
    const above = (height - SEA) / (1 - SEA);
    const snowLine = 0.62 - absLat * 0.62;
    if (above > snowLine) { r = 232; g = 238; b = 246; }
    else if (above < 0.06) { r = 196; g = 182; b = 136; }
    else {
      const rock = Math.min(1, above / Math.max(snowLine, 0.001));
      r = 62 + rock * 92; g = 96 + rock * 66; b = 58 + rock * 60;
    }
  }
  data[at] = r; data[at + 1] = g; data[at + 2] = b; data[at + 3] = 255;
}

function bake(useDirection) {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(TEX_W, TEX_H);

  for (let row = 0; row < TEX_H; row++) {
    const lat = (0.5 - row / (TEX_H - 1)) * Math.PI;
    const absLat = Math.min(1, Math.abs(lat) / (Math.PI / 2));
    for (let col = 0; col < TEX_W; col++) {
      const lon = (col / TEX_W - 0.5) * Math.PI * 2;
      const height = useDirection
        ? heightFromDirection(lat, lon)
        : heightFromUV(col / TEX_W, row / TEX_H);
      paint(height, absLat, image.data, (row * TEX_W + col) * 4);
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ---- 2 つ並べる ---- */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 0.5, 6.6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

[
  { x: -1.6, useDirection: false, label: 'UV を渡す（継ぎ目が出る）' },
  { x: 1.6, useDirection: true, label: '方向ベクトルを渡す' },
].forEach((panel, index) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 96, 64),
    new THREE.MeshStandardMaterial({ map: bake(panel.useDirection), roughness: 0.9 }),
  );
  mesh.position.x = panel.x;
  // 経度 0 度（u = 0 と u = 1 の境目）が、最初から正面に来るようにしておく
  mesh.rotation.y = Math.PI / 2;
  scene.add(mesh);

  const div = document.createElement('div');
  div.textContent = panel.label;
  div.style.cssText =
    'position:absolute; bottom:20px; transform:translateX(-50%);' +
    'color:#e8e8f2; font:12px sans-serif; pointer-events:none; white-space:nowrap;';
  div.style.left = (25 + index * 50) + '%';
  document.body.appendChild(div);
});

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(0.5, 1, 3);
scene.add(sun, new THREE.AmbientLight(0xffffff, 0.5));

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
        '左の球の中央に、陸の模様がぶつりと途切れる**縦線**が走っています。ドラッグして上から覗くと、左だけ極で模様が**渦を巻いて**います。右にはどちらもありません。**`heightFromUV` と `heightFromDirection` 以外は、$1$ 行も違いません。** 左の `u * 6` を `u * 12` にして解像度を上げても、継ぎ目は消えません ― 消えないことを確かめておくと、この問題が「粗さの問題ではない」と腑に落ちます。',
    },
    {
      kind: 'md',
      text: `
## 継ぎ目は消えた。でも、画素の偏りは残っている

ここで正直に書いておきます。**方向ベクトルで引いても、直っていない問題が $1$ つあります。**

継ぎ目と渦は消えました。ノイズの側の話だったからです。
**残るのは、テクスチャの側の話** ― 正距円筒図法そのものの歪みです。

画像の $1$ 行は、球の上では緯線 $1$ 本ぶんです。
赤道の緯線は長く、極に近い緯線は短い。
**それなのに、どの行も同じ $1024$ 画素を使っています。**
`,
    },
    {
      kind: 'formula',
      tex: '\\dfrac{w(\\phi)}{w(0)} = \\cos\\phi',
      readAloud:
        '$w(\\phi)$ は、緯度 $\\phi$ の行の 1 画素が球の上で受け持つ横幅です。赤道（$\\phi = 0$）に対する比が、そのまま $\\cos\\phi$ になります。緯度が上がるほど、1 画素の担当する範囲が狭くなる ― つまり、そこだけ無駄に細かい、ということです。',
      worked: {
        given: '$1024 \\times 512$ のテクスチャ。上から $2$ 行目（$\\phi = 89.65$ 度）と、赤道を比べます。',
        steps: [
          { calc: '2 行目の緯度 : (0.5 - 1/511) x 180 = 89.65 度' },
          { calc: 'cos 89.65 度 = 0.00615' },
          { calc: '赤道の何倍か : 1 / 0.00615 = 162.7' },
          { calc: '全行の cos の平均 = 2 / 3.1416 = 0.6366' },
          { calc: '無駄になる割合 : 1 - 0.6366 = 0.3634' },
        ],
        result:
          '$2$ 行目の $1024$ 画素は、球の上では**赤道の $1024$ 画素の $\\frac{1}{163}$ の幅**しか覆っていません。$1024$ 画素で $6$ 画素ぶんの情報を運んでいることになります。全体でならすと、**$36.3\\%$ の画素が引き伸ばしのために消えます。** テクスチャを $2$ 倍にしても、この $36.3\\%$ は $36.3\\%$ のままです ― **割合の問題なので、解像度では直りません。**',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'だから、極に寄る作品では別の貼り方が要ります',
      text: `
この惑星は「星空の中に浮かぶものを、遠くから眺める」作品なので、
$36\\%$ の無駄も、極のあたりのぼやけも、最後まで気になりません。

**気になるのは、極に寄る作品です。**

- 北極点にカメラを置く → その一点に、テクスチャの上端 $1024$ 画素が集まる
- 惑星の上を歩く → 高緯度で、赤道の $100$ 倍以上に引き伸ばされた画素を見る

そのときは**キューブマップ**（立方体の $6$ 面に貼る）に切り替えます。
どの向きでも画素の密度がほぼ揃うので、極も赤道もありません。

**ただし、$6$ 面ぶんの生成コードが要ります。**
遠景の惑星 $1$ つに払う額ではないので、ここでは正距円筒のままにしています。

**「直せるが、直さない」を選んだときは、その理由を書き残しておいてください。**
半年後の自分が、同じ検討をやり直さずに済みます。
`,
    },
    {
      kind: 'md',
      text: `
## 一様の話は、これで 2 回目です

[](#/ch/x03-uniform-sphere)で、星を球面にばらまくときに同じ形の罠が出ました。

- **星のとき** … 緯度を一様に振ると、極に点が集まる
- **今回** … 緯度を等間隔に切ると、極の画素が無駄になる

どちらも「**緯度を等しく刻むことと、面積を等しく刻むことは違う**」という
$1$ つの事実の裏表です。

球を扱うときは、**何かを等間隔に並べる前に「その等間隔は、面積に対して等間隔か」**
を確かめてください。ほとんどの場合、答えは「いいえ」です。
`,
    },
  ],
  exercises: [
    {
      prompt: `緯度 $60$ 度、経度 $120$ 度の地点の方向ベクトル $(x, y, z)$ を求めてください。

原点からの距離が $1$ になることも確かめてください。`,
      hint: '$\\cos 60° = 0.5$、$\\sin 60° = 0.866$、$\\cos 120° = -0.5$、$\\sin 120° = 0.866$。',
      answer: `**$(-0.25,\\; 0.866,\\; 0.433)$ です。**

**計算**

$x = \\cos\\phi\\cos\\lambda = 0.5 \\times (-0.5) = -0.25$

$y = \\sin\\phi = 0.866$

$z = \\cos\\phi\\sin\\lambda = 0.5 \\times 0.866 = 0.433$

**確かめ**

$(-0.25)^2 + 0.866^2 + 0.433^2$

$= 0.0625 + 0.75 + 0.1875 = 1.0$

**球の上にいます。**

**この検算を必ずやってください**

緯度と経度を取り違えると、$\\cos$ と $\\sin$ が入れ替わります。
そのとき**距離は $1$ のままなので、検算では見つかりません** ― 出るのは
「模様が横に寝ている惑星」です。

距離の検算で見つかるのは、こちらの間違いです。

- $\\cos\\phi$ を掛け忘れた … 赤道以外で距離が $1$ を超える
- 度とラジアンを混ぜた … 距離はだいたい合うのに、模様の位置が全部ずれる

**距離の検算は「球の上にいるか」しか見ていません。**
向きが合っているかは、絵にして見るしかありません。

**緯度 60 度が高いこと**

$y = 0.866$ ― かなり上です。そのぶん $\\cos\\phi = 0.5$ と小さいので、
$x$ と $z$ は赤道の半分の範囲でしか動けません。

**この「輪切りの円が小さくなる」が、$\\cos\\phi$ の正体**で、
極の画素が無駄になる理由も、まったく同じ $\\cos\\phi$ です。`,
    },
    {
      prompt: `サンドボックスの左（UV を渡すほう）で、\`u * 6\` と \`v * 6\` を \`u * 12\`、\`v * 12\` に変えてください。

継ぎ目は消えますか。消えないなら、それは何を意味しますか。`,
      hint: '$u = 0$ と $u = 1$ は、$12$ 倍したあとでも同じ入力になりますか。',
      answer: `**消えません。細かくなるだけです。**

**なぜ消えないか**

$u = 0$ を $12$ 倍すれば $0$、$u = 1$ を $12$ 倍すれば $12$。

**別の入力であることは、まったく変わっていません。**

$6$ 倍のときに $0$ と $6$ で値が違ったのと同じように、
$12$ 倍でも $0$ と $12$ で値が違います。

継ぎ目の幅が半分になるので「少しマシになった」ように見えるかもしれませんが、
線がそこにあることは変わりません。

**何を意味するか**

**これは解像度の問題ではなく、構造の問題です。**

解像度・段数・種を変えても、$u = 0$ と $u = 1$ が別の入力である限り、
値がつながる保証はどこにもありません。

**「細かくしたら気にならなくなった」で止めると、いちばん危ない**種類の不具合です。
拡大されたとき、別の画面で見たとき、必ず戻ってきます。

**構造の問題は、構造で直す**

方向ベクトルを渡すと、$u = 0$ と $u = 1$ が**同じベクトル**になります。

同じ入力なら同じ値。つながらない余地が、**そもそも無くなります。**

これは「つながるように調整した」のではなく「つながらないことが起こりえない」状態で、
**この $2$ つはまったく違います。**

前者は設定を変えれば壊れますが、後者は壊れません。`,
      answerCode: `// 細かくしただけ ― 継ぎ目は残る
return fbm((freq, seed) => noise2(u * 12 * freq, v * 12 * freq, seed));

// 構造で直す ― 継ぎ目が起こりえない
const cosLat = Math.cos(lat);
const x = cosLat * Math.cos(lon) * FREQ + 8;
const y = Math.sin(lat) * FREQ + 8;
const z = cosLat * Math.sin(lon) * FREQ + 8;
return fbm((freq, seed) => noise3(x * freq, y * freq, z * freq, seed));`,
    },
    {
      prompt: `$1024 \\times 512$ の正距円筒テクスチャで、緯度 $80$ 度の行の $1$ 画素は、
赤道の $1$ 画素の何分の $1$ の幅を覆っていますか。

そして「解像度を $2048 \\times 1024$ に上げれば、この偏りは改善する」は正しいですか。`,
      hint: '$\\cos 80° = 0.1736$。比の話であることに注意してください。',
      answer: `**約 $\\frac{1}{5.8}$ です。解像度を上げても、偏りは 1 ミリも改善しません。**

**幅の比**

$\\dfrac{w(80°)}{w(0°)} = \\cos 80° = 0.1736$

$1 / 0.1736 = 5.76$ ― 赤道の**約 $\\frac{1}{5.8}$ の幅**しか覆っていません。

逆に言えば、**緯度 $80$ 度のあたりは、赤道の $5.8$ 倍細かく描かれています。**
そのぶんは球の上では見えないので、捨てられます。

**解像度を上げても直らない理由**

$2048 \\times 1024$ にすると、赤道の画素も、緯度 $80$ 度の画素も、**両方が $2$ 倍**になります。

**比は $\\cos 80°$ のままです。**

- $1024$ 幅 … 赤道 $1024$ 画素、緯度 $80$ 度も $1024$ 画素（実質 $178$ 画素ぶん）
- $2048$ 幅 … 赤道 $2048$ 画素、緯度 $80$ 度も $2048$ 画素（実質 $356$ 画素ぶん）

どちらも「実質」は全体の $17.4\\%$ です。

全体でならした無駄は **$1 - \\frac{2}{\\pi} = 36.3\\%$** で、
これも解像度に依存しません。

**何が変わって、何が変わらないか**

| | 解像度を上げると |
|---|---|
| 赤道の細かさ | **良くなる** |
| 極の細かさ | 良くなる（が、もともと過剰） |
| 画素の**偏り** | **変わらない** |
| 生成時間 | $4$ 倍（実測 $209$ → $742$ ミリ秒） |

**偏りを直したいなら、貼り方そのものを変えるしかありません。**
キューブマップなら、どの向きでも画素の密度がほぼ揃います。

**一般則**

**「割合で表される問題」は、量を増やしても直りません。**

$36.3\\%$ は比の話なので、画素をいくら足しても $36.3\\%$ のままです。
ここを取り違えると、$4$ 倍の生成時間を払って何も直らない、ということが起きます。`,
    },
  ],
  quiz: [
    {
      q: '球のテクスチャを 2 次元ノイズで作ると、経度 0 度に縦の継ぎ目が出ます。理由はどれですか。',
      choices: [
        '`u = 0` と `u = 1` は球の上では同じ場所だが、ノイズには別の入力として渡るから',
        'テクスチャの解像度が足りないから',
        '`colorSpace` の指定を忘れているから',
        'SphereGeometry の分割数が少ないから',
      ],
      answer: 0,
      explain:
        '同じ場所に別の入力を渡せば、当然別の値が返ります。解像度を上げても、u = 0 と u = 1 が別の入力であることは変わらないので、継ぎ目は細くなるだけで消えません。画素が指す「方向」で引けば、その 2 つはまったく同じベクトルになり、継ぎ目という概念そのものが無くなります。',
    },
    {
      q: '正距円筒図法で球にテクスチャを貼ると、画素の何割が引き伸ばしのために失われますか。',
      choices: [
        '約 36%（全緯度で cos を平均すると 2/π ≈ 63.7% しか効かない）',
        '約 10%',
        '約 50%',
        '失われない',
      ],
      answer: 0,
      explain:
        '緯度 φ の行の 1 画素は、赤道の cos φ 倍の幅しか覆いません。全緯度で平均すると 2/π ≈ 0.6366 なので、残る 36.3% は引き伸ばしに消えます。これは比の話なので、解像度を上げても割合は変わりません。',
    },
    {
      q: '方向ベクトルでノイズを引いても直らないのは、次のうちどれですか。',
      choices: [
        '極に近い行の画素が、球の上では狭い範囲にしか対応しないこと',
        '経度 0 度の継ぎ目',
        '極で模様が渦を巻くこと',
        'ノイズの格子が縞として見えること',
      ],
      answer: 0,
      explain:
        '継ぎ目も極の渦も、ノイズの引き方が原因なので方向ベクトルで消えます。残るのはテクスチャ側の歪み ― 正距円筒図法そのものの性質です。極に寄る作品ではキューブマップに切り替えることになりますが、遠景の惑星なら払う必要のない費用です。',
    },
  ],
};
