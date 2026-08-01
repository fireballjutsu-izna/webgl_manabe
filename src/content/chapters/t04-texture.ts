import type { Chapter } from '../types.ts';

export const chapterT04: Chapter = {
  slug: 't04-texture',
  part: 'threejs',
  number: 14,
  title: 'テクスチャ ― 面に絵を貼る',
  goal: 'UV が何を表しているのかが分かり、画像を使わずにコードでテクスチャを作れるようになります。',
  requires: ['w13-color-space'],
  threeApis: [
    'Texture',
    'CanvasTexture',
    'TextureLoader',
    'Texture.colorSpace',
    'Texture.needsUpdate',
    'Texture.dispose',
  ],
  mathRecall: [
    { slug: '01-space', note: 'UV も「2 つ組の座標」。考え方は同じ' },
    { slug: '08-interp', note: '三角形の内側は、頂点の UV の補間で埋まる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## UV ― 画像のどこを、面のどこに貼るか

テクスチャを貼るには、**「画像のこの点を、面のこの点に合わせる」**という対応が要ります。
その対応を記録しているのが **{{UV}}** です。

UV は画像の中の位置を表す 2 つ組で、**左下が $(0, 0)$、右上が $(1, 1)$**。
画像が $16$ ピクセルでも $4096$ ピクセルでも、**常に $0$〜$1$** で表します。

そして UV は[](#/ch/w08-attributes)でやった**属性**の 1 つとして、
**頂点ごとに**持たされます。itemSize は 2 です。

三角形の中はその 3 つを混ぜて埋められる ―
[](#/ch/08-interp)の補間が、ここでも働いています。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '型紙とシール',
      text: `
立体に紙を貼るとき、紙のどこを立体のどこに合わせるかを決めますね。
UV はその対応表です。

球のように「平らな紙では包めない形」だと、どこかで必ず伸びたり歪んだりします。
世界地図で北極付近が大きく歪むのと、まったく同じ理由です。

だから UV には「正解」がありません。どこを歪ませるかの選択があるだけです。
`,
    },
    {
      kind: 'md',
      text: `
## なぜ、そこまでして絵を貼るのか

理由は 1 つです。**三角形を増やさずに、情報量を増やせるから。**

$1024 \\times 1024$ のテクスチャは、**100 万個の色**を持てます。
同じ情報を頂点で持とうとしたら、$100$ 万頂点 ―
[](#/ch/w07-index)で見たとおり、それだけで $32$MB です。

テクスチャなら $4$MB。しかも**三角形は 2 枚のままでいい。**

**「形は粗く、絵で細かく」** ― これが 3D の基本戦略です。
このあと出てくる法線マップ・粗さマップも、すべて同じ考え方でできています。
`,
    },
    {
      kind: 'md',
      text: `
## 画像はコードでも作れる

テクスチャは画像ファイルから読むのが普通ですが、
**\`<canvas>\` に描いた絵をそのままテクスチャにする**こともできます。
これが \`CanvasTexture\` です。

このサイトのサンドボックスでは外部ファイルを読めないので、以下はすべてこの方法を使います。

**実務でも便利です。** 市松模様・グラデーション・文字ラベル・ミニマップ ―
「わざわざ画像を用意するほどでもないもの」や
「実行時にしか内容が決まらないもの」には、これがいちばん素直です。
`,
    },
    {
      kind: 'sandbox',
      title: 'コードで作ったテクスチャを貼る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(3, 2.4, 4.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(3, 5, 4);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.7));

// --- canvas に市松模様を描いて、それをテクスチャにする ---
function checkerTexture(size = 256, cells = 8) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const cell = size / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#4fd6ff' : '#12121f';
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  // 向きの目印を 2 つ置く。canvas の左上が UV の (0, 1) 側になる
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(cell * 0.5, size - cell * 0.5, cell * 0.3, 0, Math.PI * 2);   // UV の (0,0)
  ctx.fill();

  ctx.fillStyle = '#ff6b8a';
  ctx.fillRect(size - cell * 0.8, cell * 0.2, cell * 0.6, cell * 0.6);  // UV の (1,1)

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;   // 色として使うなら必ず指定する
  return texture;
}

const texture = checkerTexture();

const box = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 }),
);
scene.add(box);

console.log('画像の大きさ', texture.image.width, 'x', texture.image.height);
console.log('UV の itemSize', box.geometry.attributes.uv.itemSize);
console.log('頂点数', box.geometry.attributes.uv.count);

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
        '**黄色い丸が UV の $(0,0)$、ピンクの四角が $(1,1)$ です。** 6 面すべてに同じ絵が貼られていて、目印の位置から各面の UV の向きが読めます。`cells` を 4 や 16 に変えると模様の細かさが変わります。`BoxGeometry` を `SphereGeometry(1.4, 32, 20)` にすると、極で UV が潰れる様子が見えます。',
    },
    {
      kind: 'md',
      text: `
## 色として使う画像には、colorSpace を指定する

[](#/ch/w13-color-space)でやったとおり、色には 2 つの目盛りがあります。

three は色コードなら自動で判断できますが、**画像は判断できません。**
同じ画像ファイルが、色として使われることもデータとして使われることもあるからです。

- **色として使う**（\`map\`、\`emissiveMap\`）→ \`texture.colorSpace = THREE.SRGBColorSpace\`
- **データとして使う**（\`normalMap\`、\`roughnessMap\`、\`metalnessMap\`、\`aoMap\`）→ **指定しない**

**指定を忘れると、全体が明るく白っぽくなります。**
sRGB で書かれた値を「もうリニアだ」として扱ってしまい、変換を 1 回飛ばすからです。

逆に、データに指定すると**値が歪みます。**
法線マップなら凹凸の向きが狂い、粗さマップなら質感が変わります。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{メモリ} \\;=\\; w \\times h \\times 4 \\times \\tfrac{4}{3}',
      readAloud:
        'テクスチャが GPU 上で占めるバイト数です。1 画素あたり RGBA の 4 バイト。ファイルの中では圧縮されていても、GPU に載るときは展開されます。最後の 3 分の 4 は、次の章で出てくるミップマップの分です。',
      worked: {
        given: '$4096 \\times 4096$ の画像と、$1024 \\times 1024$ の画像で、GPU 上の大きさを比べます。',
        steps: [
          { calc: '4096 x 4096 = 16,777,216 画素' },
          { calc: 'x 4 バイト = 67,108,864 = 67.1 MB' },
          { calc: 'ミップマップ込み x 4/3 = 89.5 MB' },
          { calc: '1024 x 1024 = 1,048,576 画素' },
          { calc: 'x 4 x 4/3 = 5.59 MB' },
          { calc: '89.5 / 5.59 = 16 倍' },
        ],
        result:
          '**$4$K のテクスチャ 1 枚で $89$MB**、$1$K の **16 倍**です。ここが盲点になりがちで、**ファイルは $2$MB の JPEG でも、GPU に載ると $89$MB** になります。圧縮されているのはファイルの中だけだからです。**画面上で数センチにしか映らないものに $4$K は要りません。** 縦横を半分にすればメモリは 4 分の 1。「必要な解像度まで落とす」のは、いちばん効く軽量化のひとつです。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'テクスチャも dispose が要ります',
      text: `
テクスチャは GPU にメモリを確保します。
使い終えたら texture.dispose() を呼んでください。

とくに CanvasTexture を毎フレーム作り直すコードは危険です。
古いものが解放されないまま積み上がり、数秒でメモリを食い尽くします。

canvas の中身を書き換えたいだけなら、作り直さず
texture.needsUpdate = true を立ててください。同じ入れ物を使い回せます。
`,
    },
    {
      kind: 'code',
      title: '中身が変わるテクスチャは、作り直さない',
      code: `import * as THREE from 'three';

const canvas = document.createElement('canvas');
canvas.width = canvas.height = 256;
const ctx = canvas.getContext('2d');

const texture = new THREE.CanvasTexture(canvas);   // 1 回だけ作る
texture.colorSpace = THREE.SRGBColorSpace;

const material = new THREE.MeshBasicMaterial({ map: texture });

function drawScore(score) {
  ctx.fillStyle = '#12121f';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#4fd6ff';
  ctx.font = 'bold 64px monospace';
  ctx.fillText(String(score), 40, 140);

  texture.needsUpdate = true;    // 送り直す。作り直さない
}

// 悪い例：毎回 new すると、古いテクスチャが GPU に残り続ける
// material.map = new THREE.CanvasTexture(canvas);

// 片付け
texture.dispose();
material.dispose();`,
    },
    {
      kind: 'md',
      text: `
## ファイルから読むとき

実際のプロジェクトでは \`TextureLoader\` を使います。
読み込みは**非同期**なので、すぐには絵が出ません（[](#/ch/t09-loader)で詳しく扱います）。
`,
    },
    {
      kind: 'code',
      title: 'TextureLoader で読み込む',
      code: `import * as THREE from 'three';

const loader = new THREE.TextureLoader();

// 色に使うものは colorSpace を指定する
const colorMap = loader.load('/textures/brick_color.jpg');
colorMap.colorSpace = THREE.SRGBColorSpace;

// データとして使うものは指定しない
const normalMap = loader.load('/textures/brick_normal.jpg');
const roughnessMap = loader.load('/textures/brick_rough.jpg');

const material = new THREE.MeshStandardMaterial({
  map: colorMap,
  normalMap,
  roughnessMap,
});

// 読み終わりを待ちたいときはコールバックを使う
loader.load('/textures/brick_color.jpg', (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
  material.map = texture;
  material.needsUpdate = true;      // マップの付け外しは、これが要る
});`,
    },
    {
      kind: 'md',
      text: `
## この先の 4 章

テクスチャは「貼る」だけでは終わりません。困りごとが 4 つ待っています。

- **UV が思ったようになっていない** → 次の章
- **タイルを敷き詰めたい・向きを直したい** → その次
- **遠くがちらつく・近くがぼける** → その次
- **凹凸を出したいが、三角形は増やしたくない** → 最後

順に片付けます。
`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスから \`texture.colorSpace = THREE.SRGBColorSpace;\` の行を消してください。
見た目はどう変わりますか。**なぜ**でしょう。`,
      hint: 'なくても絵は出ます。違いは明るさの出方です。',
      answer: `**全体が明るく、白っぽく浅い色**になります。

canvas に描いた \`#4fd6ff\` という色は、**sRGB の目盛りで書かれています。**
これは CSS の色なので当然です。

three は計算をリニアでやるので、受け取った値を**リニアに直す**必要があります。
\`colorSpace = THREE.SRGBColorSpace\` は「この画像は sRGB です」と伝える指定です。

指定しないと、three は**「もうリニアになっている値だ」**として扱い、
変換を 1 回飛ばします。

**数字で見ると** … $\\text{0x4f} = 79$、$79/255 = 0.31$。
正しく変換すれば $0.31^{2.2} = 0.0776$ になるところが、$0.31$ のまま使われます。
**4 倍明るい**わけです。

明るいだけでなく、**暗い部分ほど強く持ち上がる**ので、
コントラストが浅くなって「洗いざらしたような」見た目になります。

**逆をやると、もっと分かりやすく壊れます。**
法線マップに \`SRGBColorSpace\` を指定すると、
「傾き」を表す数値が $2.2$ 乗されて歪み、**凹凸の向きが狂います。**

**色に使う画像には指定し、データに使う画像には指定しない。**
この理屈は[](#/ch/q02-color)で最後まで追いかけます。`,
    },
    {
      prompt: `$2048 \\times 2048$ のテクスチャを **8 枚**使っています。
GPU 上で合計何 MB になりますか。すべて $512 \\times 512$ に落とすと、何 MB になりますか。`,
      hint: 'ミップマップ込みで $w \\times h \\times 4 \\times 4/3$ です。',
      answer: `**$179$MB → $11.2$MB。$16$ 分の 1 になります。**

**$2048 \\times 2048$ 一枚**

$2048 \\times 2048 = 4{,}194{,}304$ 画素
$\\times 4$ バイト $= 16{,}777{,}216 = 16.8$MB
ミップマップ込みで $\\times 4/3 = 22.4$MB

**8 枚で $179$MB。**

**$512 \\times 512$ 一枚**

$512 \\times 512 \\times 4 \\times 4/3 = 1{,}398{,}101 = 1.40$MB

**8 枚で $11.2$MB。**

**$179 / 11.2 = 16$ 倍。**

縦横を $1/4$ にすると、面積は $1/16$。**メモリは面積に比例します。**

**なぜこれが重要か**

- スマートフォンの GPU メモリは、実質 $200$〜$500$MB 程度しか使えません。
  **テクスチャだけで $179$MB は、それだけで危険水域**です
- 足りなくなると、ブラウザがコンテキストを失って**画面が真っ黒になります**
- 転送にも時間がかかり、初回表示が遅くなります

**判断の基準** … 「画面上で最大何ピクセルに映るか」。
$300$ ピクセルにしか映らないものに $2048$ は要りません。
$512$ で十分です。

**なお、圧縮テクスチャ（KTX2 / Basis）を使えば $1/4$〜$1/6$ になります。**
展開せずに GPU に載せられる形式で、大量のテクスチャを使うなら必須の手です。`,
    },
    {
      prompt: `スコア表示を \`CanvasTexture\` で作りました。毎フレーム数字を描き直します。
次のコードには**重大な問題**があります。何ですか。

\`function update(score) { ctx.fillText(score, 10, 50); material.map = new THREE.CanvasTexture(canvas); }\``,
      hint: '毎フレーム作られたテクスチャは、どこへ行きますか。',
      answer: `**毎フレーム新しいテクスチャが GPU に確保され、古いものが解放されません。**

\`new THREE.CanvasTexture(canvas)\` は、そのたびに
**canvas の中身を GPU へ転送し、新しい領域を確保します。**

$256 \\times 256$ でも 1 枚 $0.35$MB。毎秒 60 回なら **毎秒 $21$MB**。
**10 秒で $210$MB** です。数十秒でメモリを食い尽くし、
コンテキストが失われて画面が真っ黒になります。

しかも \`material.map\` を差し替えているので、
毎フレーム \`needsUpdate\` 相当のシェーダ確認まで走ります。

**直し方**

テクスチャは**最初に 1 回だけ作り**、以後は \`needsUpdate = true\` を立てます。
これは[](#/ch/w09-geometry-edit)の \`BufferAttribute.needsUpdate\` とまったく同じ仕組みです。

**「入れ物は使い回し、中身が変わったことだけ伝える」** ―
three 全体を貫く考え方です。

**さらに言えば、毎フレーム描き直す必要もありません。**
スコアが変わったときだけ \`drawScore()\` を呼べば、
canvas への描画も転送も、変化した瞬間だけで済みます。`,
      answerCode: `// テクスチャは 1 回だけ作る
const texture = new THREE.CanvasTexture(canvas);
texture.colorSpace = THREE.SRGBColorSpace;
const material = new THREE.MeshBasicMaterial({ map: texture });

let lastScore = -1;

function update(score) {
  if (score === lastScore) return;    // 変わったときだけ
  lastScore = score;

  ctx.fillStyle = '#12121f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#4fd6ff';
  ctx.font = 'bold 64px monospace';
  ctx.fillText(String(score), 10, 100);

  texture.needsUpdate = true;         // 送り直すだけ
}`,
    },
  ],
  quiz: [
    {
      q: 'UV 座標の $(0, 0)$ は画像のどこを指しますか。',
      choices: ['左下', '左上', '中心', '右上'],
      answer: 0,
      explain:
        '左下が $(0,0)$、右上が $(1,1)$ です。画像のピクセル数に関係なく、常に $0$〜$1$ で表します。上下が逆に見えるときは、この向きの違いを疑ってください（画像ファイルは左上が原点のものが多いためです）。',
    },
    {
      q: '色として使うテクスチャに `colorSpace` を指定し忘れると、どうなりますか。',
      choices: [
        '全体が明るく白っぽくなる',
        '真っ黒になる',
        '上下が反転する',
        '何も変わらない',
      ],
      answer: 0,
      explain:
        'sRGB で記録された値を「もうリニアだ」として扱い、変換を 1 回飛ばすためです。色に使う画像だけ `THREE.SRGBColorSpace` を指定し、法線マップなどのデータには指定しません。',
    },
    {
      q: '$4096 \\times 4096$ の JPEG（ファイルサイズ 2MB）は、GPU 上でおよそ何 MB を占めますか。',
      choices: ['約 90MB', '2MB のまま', '約 16MB', '約 8MB'],
      answer: 0,
      explain:
        '圧縮されているのはファイルの中だけで、GPU に載るときは展開されます。$4096^2 \\times 4$ バイト $= 67$MB、ミップマップ込みで $89.5$MB です。ファイルサイズを見て安心してはいけません。',
    },
  ],
};
