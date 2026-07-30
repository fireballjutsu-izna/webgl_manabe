import type { Chapter } from '../types.ts';

export const chapterT04: Chapter = {
  slug: 't04-texture',
  part: 'threejs',
  number: 4,
  title: 'テクスチャ ― 面に絵を貼る',
  goal: 'UV が何を表しているのかが分かり、繰り返し・向き・色空間で困らずにテクスチャを貼れるようになります。',
  requires: ['t03-material'],
  threeApis: [
    'Texture',
    'CanvasTexture',
    'TextureLoader',
    'Texture.wrapS',
    'Texture.repeat',
    'Texture.colorSpace',
    'Texture.magFilter',
    'MeshStandardMaterial',
  ],
  mathRecall: [
    { slug: '01-space', note: 'UV も「2つ組の座標」。考え方は同じ' },
    { slug: '08-interp', note: 'ピクセルの間は補間で埋められる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## UV ― 画像のどこを、面のどこに貼るか

テクスチャを貼るには、**「画像のこの点を、面のこの点に合わせる」**という対応が要ります。
その対応を記録しているのが **{{UV}}** です。

UV は画像の中の位置を表す 2 つ組で、**左下が (0, 0)、右上が (1, 1)**。
画像が何ピクセルであっても、常に 0〜1 で表します。

そして UV は**頂点ごとに**持たされます。三角形の中はその 3 つを混ぜて埋められる——
[](#/ch/08-interp)の lerp が、ここでも働いています。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '型紙とシール',
      text: `
立体に紙を貼るとき、紙のどこを立体のどこに合わせるかを決めますね。UV はその対応表です。
球のように「平らな紙では包めない形」だと、どこかで必ず伸びたり歪んだりします。
世界地図で北極付近が大きく歪むのと、まったく同じ理由です。
`,
    },
    {
      kind: 'md',
      text: `
## 画像はコードでも作れる

テクスチャは画像ファイルから読むのが普通ですが、**\`<canvas>\` に描いた絵をそのまま
テクスチャにする**こともできます。これが \`CanvasTexture\` です。

このサイトのサンドボックスでは外部ファイルを読めないので、以下はすべてこの方法を使います。
実務でも、市松模様・グラデーション・文字ラベルなど「わざわざ画像を用意するほどでもないもの」
にはとても便利です。
`,
    },
    {
      kind: 'sandbox',
      title: 'コードで作ったテクスチャを貼る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(2.5, 2, 4);

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
  // 左下が UV の (0,0)。目印を置いて向きを確かめる
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(cell * 0.5, size - cell * 0.5, cell * 0.3, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;  // 色として使うなら必ず指定する
  return texture;
}

const texture = checkerTexture();

// 繰り返しの設定。repeat を 1 より大きくするなら wrap も要る
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(1, 1);   // ← 2, 2 にすると模様が細かくなります

const box = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 }),
);
scene.add(box);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '黄色い丸が UV の (0, 0) 側です。`texture.repeat.set(2, 2)` にすると模様が 4 倍細かくなり、`texture.offset.set(0.5, 0)` にすると横にずれます。`BoxGeometry` を `SphereGeometry(1.2, 32, 20)` に変えると、極で UV が潰れる様子が見えます。',
    },
    {
      kind: 'md',
      text: `
## repeat と wrap ― セットで使う

床のタイルのように**同じ模様を敷き詰めたい**とき、大きな画像を用意する必要はありません。
小さな 1 枚を繰り返せば済みます。

- \`texture.repeat.set(4, 4)\` … 縦横 4 回ずつ繰り返す
- \`texture.wrapS\` / \`wrapT\` … 0〜1 の外側をどう扱うか

**この 2 つはセットです。** 既定の wrap は「端の色を引き伸ばす」なので、
repeat を上げても繰り返さず、端が伸びるだけになります。
繰り返したいなら \`THREE.RepeatWrapping\` を指定してください。

S と T は、それぞれ横方向・縦方向のことです（U と V の別名だと思って構いません）。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '色として使うテクスチャには colorSpace を指定する',
      text: `
色（\`map\`）に使う画像には \`texture.colorSpace = THREE.SRGBColorSpace\` を指定してください。
忘れると、**全体が妙に明るく白っぽくなります**。

いっぽう、粗さ・金属度・法線マップなど「色ではなくデータ」を入れた画像には**指定しません**。
これらは数値としてそのまま読む必要があるためです。
\`TextureLoader\` で読み込んだ画像も同じで、色に使うものだけ指定します。
`,
    },
    {
      kind: 'md',
      text: `
## 拡大したときのぼやけ ― フィルタ

小さな画像を大きく引き伸ばすと、既定ではなめらかにぼやけます（線形補間）。
写真ならこれで正解ですが、**ドット絵やはっきりした模様では困ります**。

そのときは \`texture.magFilter = THREE.NearestFilter\` を指定します。
補間せず、いちばん近いピクセルの色をそのまま使うので、輪郭がくっきり残ります。
`,
    },
    {
      kind: 'md',
      text: `
## 色以外にも貼れる

\`map\`（色）以外にも、マテリアルはいろいろな画像を受け取ります。

- **normalMap** … 面の凹凸を法線の傾きとして記録した画像。
  **形は変えずに、光の当たり方だけで凹凸に見せます**。レンガや布に絶大な効果があります
- **roughnessMap** / **metalnessMap** … 場所ごとに粗さ・金属度を変える
- **aoMap** … 隅の暗がりをあらかじめ焼き付けたもの
- **emissiveMap** … 自分で光っている部分

とくに \`normalMap\` は、**三角形を増やさずに情報量を増やせる**ため、
実用上いちばん効果が大きい貼り物です。
`,
    },
    {
      kind: 'sandbox',
      title: '法線マップで凹凸を作る（形は平らなまま）',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.6, 4.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(2, 3, 2);
scene.add(key, new THREE.AmbientLight(0xffffff, 0.15));

// 法線マップは「傾きを色で記録した画像」。
// R が横の傾き、G が縦の傾き、B が真上成分。傾きゼロは (0.5, 0.5, 1.0) になる
function bumpNormalMap(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 波打った高さを想定して、その傾きを色にする
      const nx = Math.cos((x / size) * Math.PI * 8) * 0.5;
      const ny = Math.cos((y / size) * Math.PI * 8) * 0.5;
      const i = (y * size + x) * 4;
      image.data[i] = (nx * 0.5 + 0.5) * 255;
      image.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      image.data[i + 2] = 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  // 法線マップは「色」ではなくデータなので colorSpace は指定しない
  return texture;
}

const normalMap = bumpNormalMap();

// 左：ただの平らな板　右：同じ板に法線マップだけを足したもの
const geometry = new THREE.PlaneGeometry(1.8, 1.8);

const plain = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
  color: 0xc0c8d8, roughness: 0.5,
}));
plain.position.x = -1.1;
plain.rotation.x = -Math.PI / 3;

const bumped = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
  color: 0xc0c8d8, roughness: 0.5, normalMap,
}));
bumped.position.x = 1.1;
bumped.rotation.x = -Math.PI / 3;

scene.add(plain, bumped);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '右の板は頂点がまったく増えていません。法線だけを画像で差し替えて、光の当たり方を変えています。視点を横から見ると、右の板も本当は真っ平らだと分かります。',
    },
    {
      kind: 'md',
      text: `
## ファイルから読むとき

実際のプロジェクトでは \`TextureLoader\` を使います。読み込みは**非同期**なので、
すぐには絵が出ません（[](#/ch/t09-loader)で詳しく扱います）。
`,
    },
    {
      kind: 'code',
      title: 'TextureLoader で読み込む',
      code: `const loader = new THREE.TextureLoader();

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
  material.needsUpdate = true;
});`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '大きすぎる画像は重いだけ',
      text: `
4096×4096 の画像は、メモリ上でおよそ 64MB を占めます（圧縮されるのはファイルの中だけで、
GPU に載るときは展開されます）。画面上で数センチにしか映らないものに
4K のテクスチャは要りません。**必要な解像度まで落とす**のが、いちばん効く軽量化です。
`,
    },
  ],
  exercises: [
    {
      prompt: `1 つ目のサンドボックスで \`texture.repeat.set(2, 2)\` にしてください。模様が細かくなります。
つぎに \`texture.wrapS\` と \`wrapT\` の 2 行を消してください。何が起きますか。`,
      hint: '繰り返しの設定を消すと、1 を超えた UV はどう扱われるでしょう。',
      answer: `繰り返されなくなり、**端の 1 列の色が引き伸ばされます**（既定の \`ClampToEdgeWrapping\`）。
\`repeat\` は「UV を何倍にするか」を決めるだけで、1 を超えた UV をどう扱うかは \`wrapS\` / \`wrapT\` が決めます。
**この 2 つはいつも組で必要**です。「repeat を上げたのに模様が増えず、端だけ伸びた」はこれです。`,
    },
    {
      prompt: '1 つ目のサンドボックスから \`texture.colorSpace = THREE.SRGBColorSpace;\` の行を消してください。見た目はどう変わりますか。',
      hint: 'なくても絵は出ます。違いは明るさの出方です。',
      answer: `**全体が明るく、白っぽく浅い色**になります。
色として作った画像は sRGB で書かれているのに、それを指定しないと three が「もう線形になっている数値」として扱い、
変換を 1 回飛ばしてしまうからです。**色に使う画像には必ず指定し、データに使う画像には指定しない**。
この理屈は [](#/ch/q02-color)「色の通り道」で最後まで追いかけます。`,
    },
    {
      prompt: '2 つ目のサンドボックス（法線マップ）で、\`bumpNormalMap\` の中に \`texture.colorSpace = THREE.SRGBColorSpace;\` を**足して**ください。凹凸はどうなりますか。',
      hint: '法線マップの RGB は、色ではなく「傾き」の数値です。',
      answer: `凹凸の向きが狂い、光の当たり方がおかしくなります。
法線マップの RGB は色ではなく**ベクトルの成分をそのまま入れた数値**なので、sRGB の変換をかけると値が歪みます。
\`map\` には指定し、\`normalMap\` \`roughnessMap\` \`metalnessMap\` には**指定しない**、と覚えてください。`,
    },
  ],
  quiz: [
    {
      q: 'UV 座標の (0, 0) は画像のどこを指しますか。',
      choices: ['左下', '左上', '中心', '右上'],
      answer: 0,
      explain:
        '左下が (0, 0)、右上が (1, 1) です。画像のピクセル数に関係なく、常に 0〜1 で表します。上下が逆に見えるときは、この向きの違いを疑ってください。',
    },
    {
      q: '`texture.repeat.set(4, 4)` を指定したのに繰り返されず、端が引き伸ばされます。足りないのはどれですか。',
      choices: [
        '`wrapS` と `wrapT` に `THREE.RepeatWrapping` を指定すること',
        '`colorSpace` の指定',
        '`magFilter` の指定',
        'テクスチャの読み直し',
      ],
      answer: 0,
      explain:
        '既定の wrap は「端の色を引き伸ばす」設定です。0〜1 の外側をどう扱うかを繰り返しに変えないと、repeat は効きません。',
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
        '色として記録された画像を、そのまま数値として読んでしまうためです。色に使う画像だけ `THREE.SRGBColorSpace` を指定し、法線マップなどのデータには指定しません。',
    },
  ],
};
