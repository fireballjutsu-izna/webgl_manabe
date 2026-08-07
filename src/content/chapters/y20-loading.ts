import type { Chapter } from '../types.ts';

export const chapterY20: Chapter = {
  slug: 'y20-loading',
  part: 'polish',
  number: 20,
  title: '読み込み中に、何を見せるか',
  goal: '重い生成の前に $1$ 枚描くという $1$ 行の違いを、体感ではなくミリ秒で説明できるようになります。',
  requires: ['q05-ship-it'],
  threeApis: ['CanvasTexture', 'WebGLRenderer', 'Clock'],
  mathRecall: [
    { slug: 'x09-surface-bake', note: 'テクスチャの生成。数百ミリ秒かかります' },
    { slug: 't06-loop-clock', note: '描画ループ。$1$ 回はさむ、という話です' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 真っ白は「壊れている」に見える

[](#/ch/x09-surface-bake)の惑星は、テクスチャの生成に数百ミリ秒かかりました。
そのあいだ画面が真っ白だと、**壊れていると思われます。**

しかも $JavaScript$ は $1$ 本の流れなので、生成が終わるまで
**クリックもスクロールも効きません。** 完全に固まって見えます。

順番はこうです。

- **まず何か描く。** 背景色だけでもいい。**キャンバスが出ていること**が大事
- **次に軽いものを出す。** 星空・地面・箱
- **重い生成は、そのあとで。** $1$ フレーム描いてから始める

$3$ つめの「$1$ フレーム描いてから」は、\`requestAnimationFrame\` を $1$ 回はさむだけです。
**$1$ 行の違いで、体感がまるで変わります。**
`,
    },
    {
      kind: 'code',
      title: '重い処理は、1フレーム描いてから',
      code: `// 悪い例：生成が終わるまで画面は真っ白のまま
// const maps = createMaps();
// renderer.render(scene, camera);

// よい例：先に1枚描いて、それから重い処理へ
renderer.render(scene, camera);

requestAnimationFrame(() => {
  const maps = createMaps();          // ここで数百ミリ秒
  planet.material.map = maps.colorMap;
  planet.material.needsUpdate = true;
  animate();
});`,
    },
    {
      kind: 'md',
      text: `
## 測って確かめる

「体感が変わる」で終わらせず、**$2$ つのやり方を同じ場所で計ります。**

ボタンを押すと、$1024 \\times 1024$ のテクスチャを作り直します。
やっていることは同じで、**順番だけが違います。**

- **すぐ作る** … 生成してから、初めて描く
- **$1$ フレーム描いてから作る** … 描いてから、生成する

見るのは **「最初の $1$ 枚が出るまで」** の時間です。
`,
    },
    {
      kind: 'sandbox',
      title: '1 フレーム描いてから始める',
      guide: { focus: ['重いテクスチャの生成', '2 つのやり方'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e121c);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.6, 4.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0x9db8ff, 0x1a1c26, 1.0));
const key = new THREE.DirectionalLight(0xfff0dd, 2.6);
key.position.set(3, 4, 5);
scene.add(key);

// 生成前でも、これは見えている（軽いもの）
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(1.2, 48, 32),
  new THREE.MeshStandardMaterial({ color: 0x39415a, roughness: 0.85 }),
);
scene.add(ball);

/* ---- 重いテクスチャの生成 ---- */

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

// 1024 x 1024 を 1 画素ずつ埋める。x09 でやったのと同じ作り方
function buildTexture(seed) {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  const data = image.data;
  const rand = makeRandom(seed);

  // 粗い格子の値をいくつか作って、画素ごとに混ぜる（値ノイズ）
  const grid = 16;
  const points = new Float32Array((grid + 1) * (grid + 1));
  for (let i = 0; i < points.length; i++) points[i] = rand();

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * grid;
      const gy = (y / size) * grid;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const fx = gx - x0;
      const fy = gy - y0;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const at = (ix, iy) => points[iy * (grid + 1) + ix];
      const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
      const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
      const v = top + (bottom - top) * sy;

      const o = (y * size + x) * 4;
      data[o] = 60 + v * 170;
      data[o + 1] = 90 + v * 150;
      data[o + 2] = 130 + v * 110;
      data[o + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ---- 2 つのやり方 ---- */

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#e8e8f2; font:12px monospace;' +
  'pointer-events:none; white-space:pre; background:rgba(8,10,18,0.72);' +
  'padding:7px 10px; border-radius:5px; line-height:1.6;';
document.body.appendChild(readout);

let seed = 1;
let busy = false;

function reset() {
  if (ball.material.map) ball.material.map.dispose();
  ball.material.map = null;
  ball.material.color.set(0x39415a);
  ball.material.needsUpdate = true;
}

function apply(texture) {
  ball.material.map = texture;
  ball.material.color.set(0xffffff);
  ball.material.needsUpdate = true;
}

// (A) 生成してから描く
function runBlocking() {
  if (busy) return;
  busy = true;
  reset();
  readout.textContent = 'すぐ作る … 生成中';

  const start = performance.now();
  const texture = buildTexture(seed++);
  const built = performance.now();
  apply(texture);

  // ここで初めて 1 枚が出る
  requestAnimationFrame(() => {
    const painted = performance.now();
    show('すぐ作る', painted - start, built - start);
    busy = false;
  });
}

// (B) 1 枚描いてから生成する
function runDeferred() {
  if (busy) return;
  busy = true;
  reset();
  readout.textContent = '1 フレーム描いてから … 生成中';

  const start = performance.now();
  requestAnimationFrame(() => {
    const painted = performance.now();     // もう 1 枚出ている
    const genStart = performance.now();
    const texture = buildTexture(seed++);
    const built = performance.now();
    apply(texture);
    show('1 フレーム描いてから', painted - start, built - genStart);
    busy = false;
  });
}

function show(name, firstPaint, generate) {
  readout.textContent =
    name + '\\n' +
    '最初の 1 枚が出るまで ' + firstPaint.toFixed(1) + ' ms\\n' +
    'テクスチャの生成      ' + generate.toFixed(1) + ' ms';
}

function addButton(text, left, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText =
    'position:absolute; bottom:82px; left:' + left + 'px; padding:6px 12px;' +
    'background:#12121f; color:#e8e8f2; border:1px solid #3a3a5c; border-radius:6px;' +
    'font:12px sans-serif; cursor:pointer;';
  button.addEventListener('click', onClick);
  document.body.appendChild(button);
}

addButton('すぐ作る', 12, runBlocking);
addButton('1 フレーム描いてから', 92, runDeferred);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

runDeferred();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '「テクスチャの生成」の行は、どちらのやり方でもほぼ同じ時間です ― **やっている仕事は変わっていません。** 変わるのは「最初の 1 枚が出るまで」で、「すぐ作る」では生成時間がまるごと乗り、「1 フレーム描いてから」では 1 フレームぶん（十数ミリ秒）で済みます。**その差のあいだ、画面は灰色の球を映して動き続けています。** 押している最中にドラッグしてみてください ― 「すぐ作る」のあいだは、回転も止まります。',
    },
    {
      kind: 'md',
      text: `
## 何が変わって、何が変わらないのか

**変わらないもの**

- **生成にかかる時間。** 同じ計算をしているので、当たり前です
- **全部そろうまでの時間。** むしろ $1$ フレームぶん**遅くなります**

**変わるもの**

- **最初の $1$ 枚が出るまでの時間。** 生成時間ぶん $\\to$ $1$ フレームぶん
- **そのあいだ、画面が生きているか**

つまりこれは**速くする工夫ではなく、待たせ方を変える工夫**です。
全体では少し遅くなっているのに、**体感は明らかによくなります。**

**「何も起きない $300$ ミリ秒」と「何かが見えている $300$ ミリ秒」は別物**だからです。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '1 フレームでは足りないとき',
      text: `
生成が $2$ 秒かかるなら、$1$ フレームはさんでも**$2$ 秒固まります。**
最初の $1$ 枚は出ますが、そこで止まったままです。

そのときは、$2$ つの手があります。

- **分割する。** $1024$ 行を $64$ 行ずつ $16$ 回に分け、
  \`requestAnimationFrame\` をはさみながら進める。**進捗も出せます**
- **別のスレッドへ逃がす。** $\\mathrm{Web}$ $\\mathrm{Worker}$ に生成を任せ、
  \`OffscreenCanvas\` で $\\mathrm{ImageBitmap}$ を作って返す。
  **生成中も画面が完全に動き続けます**

$2$ つめが本命ですが、**まず $1$ つめを試してください。**
分割は数行で書けて、効き方も測れます。

**体感を良くする工夫は、安い順に。**
`,
    },
    {
      kind: 'md',
      text: `
## 読み込み表示を、どこまで作るか

進捗バーを作り込む前に、順番を確かめてください。

- **キャンバスが出ているか。** 背景色だけでも、白いページよりずっとよい
- **軽いものが先に出ているか。** 地面と空だけでも「これから来る」と伝わります
- **時間が読めるか。** $\\mathrm{GLTFLoader}$ なら \`onProgress\` で
  読み込み済みバイト数が取れます。**手で作る生成では、進み具合を自分で数えるしかありません**

$3$ つめが要点です。**進捗バーが動かないなら、無いほうがまし**です。
止まったバーは「壊れている」と読まれます。

代わりに**回り続けるもの**（回転する球、脈打つ点）を出しておけば、
進み具合は分からなくても「生きている」ことは伝わります。
`,
    },
  ],
  exercises: [
    {
      prompt: `「$1$ フレーム描いてから」のやり方は、**全体としては遅くなります。**

それでも良いとされるのは、なぜですか。`,
      hint: '何を測るかで、答えが変わります。',
      answer: `**測る対象が違うからです。**

**全部そろうまで**

$1$ フレームぶん（十数ミリ秒）**遅くなります。**

描画を $1$ 回はさんだのだから、当然です。

**最初の $1$ 枚が出るまで**

生成時間ぶん**速くなります。**

生成が $300$ ミリ秒なら、$300$ ミリ秒 $\\to$ 十数ミリ秒。

**どちらが大事か**

見ている人にとっては、**後者**です。

- **何も出ない $300$ ミリ秒** … 壊れているように見える。クリックも効かない
- **何かが見えている $300$ ミリ秒** … 「読み込み中だ」と分かる

**そして「そろうまで」は、そもそも $1$ 点ではない**

惑星なら、地面 $\\to$ 大気 $\\to$ 雲 $\\to$ 夜の明かり、と段階があります。

**段階的に出てくるほうが、全部そろって一気に出るより速く感じます。**
実際には後者のほうが少し速いのに、です。

**一般化すると**

**体感の速さは、最初の反応までの時間で決まります。**
合計時間ではありません。`,
    },
    {
      prompt: `生成が $2$ 秒かかります。

$1$ フレームはさむだけでは足りません。何をしますか。`,
      hint: '$2$ 秒のあいだ、$JavaScript$ は何本の流れですか。',
      answer: `**分割するか、別のスレッドへ逃がします。**

**なぜ足りないのか**

$1$ フレームはさんでも、**そのあと $2$ 秒固まります。**

最初の $1$ 枚は出ますが、そこで凍りつく ―
クリックもドラッグもスクロールも効きません。

$JavaScript$ は $1$ 本の流れなので、$2$ 秒占有すれば $2$ 秒止まります。

**手 $1$ ― 分割する**

$1024$ 行を $64$ 行ずつ $16$ 回に分け、あいだに \`requestAnimationFrame\` を入れます。

- **$1$ 回あたり $125$ ミリ秒。** まだ長いので、$32$ 回に割れば $62$ ミリ秒
- **進捗が出せる。** 「$16$ 回のうち $7$ 回目」が分かります
- **数行で書ける**

引き換えに、**合計は少し遅くなります**（はさむぶん）。

**手 $2$ ― $\\mathrm{Web}$ $\\mathrm{Worker}$**

生成を別のスレッドへ渡し、\`OffscreenCanvas\` で
$\\mathrm{ImageBitmap}$ を作って返してもらいます。

- **メインの流れは $1$ ミリ秒も止まらない**
- 引き換えに、**コードが増えます。** $\\mathrm{Worker}$ のファイル、
  受け渡し、失敗したときの処理

**どちらから試すか**

**手 $1$ から。** 数行で書けて、効き方も測れます。

それで足りなければ手 $2$ へ。**安い順に試す**のが原則です。`,
    },
    {
      prompt: `手で作る生成に、進捗バーを付けるべきですか。`,
      hint: 'バーが動かないと、人はどう読みますか。',
      answer: `**進み具合を数えられるなら付ける。数えられないなら、付けないほうがましです。**

**動かないバーは、壊れて見える**

「$0\\%$ で止まっているバー」は、無いより悪い。

人はそれを「**フリーズした**」と読みます。

**読み込みなら数えられる**

\`GLTFLoader\` の \`onProgress\` は、読み込み済みバイト数と全体を渡してきます。

割ればそのまま進捗です。

**手で作る生成では、自分で数える**

分割して作るなら、数えられます。

- $16$ 回に割って、$7$ 回目なら $43.75\\%$
- ただし**$1$ 回ごとの時間は均一ではありません。**
  「$43.75\\%$」と出しておいて、残りが $3$ 倍かかることもあります

**数えられないときの代わり**

**回り続けるもの**を出します。

- ゆっくり回転する球
- 脈打つ点

進み具合は分かりませんが、**「生きている」ことは伝わります。**

**選び方**

- **正確に数えられる** … 進捗バー
- **数えられない、または不均一** … 回り続けるもの
- **$100$ ミリ秒以内** … 何も出さない。出すほうがちらついて邪魔です`,
    },
  ],
  quiz: [
    {
      q: '重いテクスチャ生成を始める前にやるべきことはどれですか。',
      choices: [
        '先に 1 フレーム描いて、キャンバスに何かを出しておく',
        'テクスチャの解像度を上げる',
        'ピクセル比を上げる',
        '生成を try/catch で囲む',
      ],
      answer: 0,
      explain:
        '生成中は JavaScript が 1 本の流れを占有するので、その前に何も出ていないと「壊れている」と思われます。requestAnimationFrame を 1 回はさむだけで、最初の 1 枚が出るまでが生成時間ぶんから 1 フレームぶんに縮みます。',
    },
    {
      q: '「1 フレーム描いてから」のやり方は、全体では速くなりますか。',
      choices: [
        'なりません。1 フレームぶん遅くなります。速くなるのは最初の 1 枚が出るまで',
        'なります。生成が速くなるから',
        '変わりません',
        '生成が並列化されるので速くなります',
      ],
      answer: 0,
      explain:
        '同じ計算をしているので、生成にかかる時間は変わりません。変わるのは待たせ方だけです。それでも良いとされるのは、体感の速さが合計時間ではなく最初の反応までの時間で決まるからです ― 「何も起きない 300 ミリ秒」と「何かが見えている 300 ミリ秒」は別物です。',
    },
    {
      q: '手で作る生成に進捗バーを付けるとき、気をつけることはどれですか。',
      choices: [
        '進み具合を数えられないなら、バーより回り続けるものを出す',
        'つねにバーを出す',
        'バーは 0% から始める',
        'バーの色を目立たせる',
      ],
      answer: 0,
      explain:
        '0% で止まったバーは「フリーズした」と読まれ、無いより悪くなります。GLTFLoader の onProgress のようにバイト数が取れるなら数えられますが、手で作る生成では分割して自分で数えるしかありません。数えられないときは、ゆっくり回る球や脈打つ点で「生きている」ことだけ伝えます。',
    },
  ],
};
