import type { Chapter } from '../types.ts';

export const chapterW16: Chapter = {
  slug: 'w16-repeat',
  part: 'threejs',
  number: 16,
  title: '繰り返しと向き ― 小さな 1 枚で、広い床を敷く',
  goal: 'repeat・wrap・offset・rotation を使い分けられるようになり、継ぎ目の見えないタイルを作れるようになります。',
  requires: ['w15-uv'],
  threeApis: [
    'Texture.repeat',
    'Texture.wrapS',
    'Texture.wrapT',
    'Texture.offset',
    'Texture.rotation',
    'Texture.center',
    'Texture.flipY',
  ],
  mathRecall: [
    { slug: 'b05-ratio', note: 'repeat は UV に掛ける倍率。比の話' },
    { slug: 'w13-color-space', note: 'タイルの画像も、色なら colorSpace が要る' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## $100$ メートルの床に、$1$ メートルのタイル

$100 \\times 100$ メートルの床に、細かい模様を貼りたい。

**素直にやると破綻します。** $1$ センチの細かさを出すには $10000 \\times 10000$ の画像 ―
[](#/ch/t04-texture)の計算では **$533$MB** です。載りません。

だから**小さな 1 枚を繰り返します。** $1$ メートル四方のタイルを $100 \\times 100$ 並べる。
画像は $512 \\times 512$ ― **$1.4$MB** で済みます。**380 分の 1** です。

繰り返しに要る設定は 2 つです。

- \`texture.repeat.set(100, 100)\` … UV を何倍にするか
- \`texture.wrapS\` / \`wrapT\` … $0$〜$1$ の**外側**をどう扱うか

**この 2 つはセットです。** 片方だけでは効きません。
`,
    },
    {
      kind: 'md',
      text: `
## repeat は「UV に掛ける」だけ

\`repeat\` がやっていることは、拍子抜けするほど単純です。

**UV に、その数を掛ける。** それだけです。

$u = 0.3$ の頂点は、\`repeat.x = 4\` なら $u = 1.2$ として読まれます。
$1$ を超えた ― そこで \`wrapS\` の出番です。

- \`ClampToEdgeWrapping\`（**既定**）… $1$ を超えたら $1$ に留める → **端の色が引き伸ばされる**
- \`RepeatWrapping\` … 小数部分だけを使う → $1.2$ は $0.2$ として読まれる → **繰り返す**
- \`MirroredRepeatWrapping\` … 1 回おきに裏返す → **継ぎ目が消える**

**既定が「引き伸ばす」なので、\`repeat\` だけ上げても繰り返しません。**
「repeat を上げたのに模様が増えず、端だけ伸びた」は、必ずこれです。

なお **S と T は、U と V の別名**です。同じものを指しています。
`,
    },
    {
      kind: 'formula',
      tex: 'u_{\\text{読む}} \\;=\\; \\bigl(u - c_x\\bigr)\\,R_x + c_x + o_x',
      readAloud:
        'テクスチャの UV に対する変換の全体です。中心 $c$ を基準に $R$ 倍し、$o$ だけずらします。回転も同じ中心のまわりで行われます。四則演算だけなので、順番さえ分かれば結果は必ず予測できます。',
      worked: {
        given:
          '$\\text{repeat} = 4$、$\\text{offset} = 0.5$、$\\text{center} = 0$ のとき、頂点の $u = 0.3$ は画像のどこを読むでしょう。',
        steps: [
          { calc: '(0.3 - 0) x 4 = 1.2', note: 'repeat を掛ける' },
          { calc: '1.2 + 0 + 0.5 = 1.7', note: 'offset を足す' },
          { calc: '【RepeatWrapping なら】' },
          { calc: '  1.7 の小数部 = 0.7' },
          { calc: '【ClampToEdge なら】' },
          { calc: '  1.7 → 1.0 に切り詰め', note: '端の色が伸びる' },
        ],
        result:
          '**wrap が Repeat なら $0.7$、Clamp なら $1.0$** です。まったく違う場所を読みます。**offset を $0.5$ にしたのに、模様が半分ずれない**ことにも注目してください。$\\text{repeat} = 4$ なら、1 タイルの幅は $0.25$。$0.5$ ずらすと**タイル 2 枚ぶん** ― 見た目には元と同じ位置に戻ります。**offset はタイル 1 枚ぶんではなく、UV の $1$ を基準にしています。**',
      },
    },
    {
      kind: 'sandbox',
      title: 'repeat・wrap・offset・rotation を全部いじる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// この 4 つを変えて実行してみてください
const REPEAT = 4;
const WRAP = 'repeat';        // 'repeat' | 'clamp' | 'mirror'
const OFFSET = 0.0;
const ROTATION_DEG = 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(
  new THREE.DirectionalLight(0xffffff, 2.2).translateY(6),
  new THREE.HemisphereLight(0x99bbff, 0x101020, 0.9),
);

// タイル 1 枚ぶんの絵。向きが分かるように非対称にしておく
function tileTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1b2b46';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#4fd6ff';
  ctx.lineWidth = size * 0.05;
  ctx.strokeRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88);

  // 左下（UV の 0,0 側）に印。向きと繰り返しが読める
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(size * 0.25, size * 0.78, size * 0.09, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff6b8a';
  ctx.beginPath();
  ctx.moveTo(size * 0.7, size * 0.22);
  ctx.lineTo(size * 0.85, size * 0.42);
  ctx.lineTo(size * 0.55, size * 0.42);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const texture = tileTexture();

// 1. 繰り返す回数
texture.repeat.set(REPEAT, REPEAT);

// 2. 0〜1 の外側をどう扱うか。repeat とセットで指定する
const wraps = {
  repeat: THREE.RepeatWrapping,
  clamp: THREE.ClampToEdgeWrapping,
  mirror: THREE.MirroredRepeatWrapping,
};
texture.wrapS = texture.wrapT = wraps[WRAP];

// 3. ずらす
texture.offset.set(OFFSET, 0);

// 4. 回す。center を 0.5 にしないと、隅を軸に回ってしまう
texture.center.set(0.5, 0.5);
texture.rotation = THREE.MathUtils.degToRad(ROTATION_DEG);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 8),
  new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

console.log('repeat', REPEAT, '/ wrap', WRAP, '/ offset', OFFSET, '/ rotation', ROTATION_DEG);

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
        '**`WRAP` を `clamp` にすると、タイルが 1 枚だけ左下に貼られ、残りは端の色が伸びます** ― `repeat` を上げても増えません。`mirror` にすると 1 枚おきに裏返り、黄色い丸が向かい合わせに並びます。`ROTATION_DEG` を 45 にすると斜めのタイルになり、`center` の行を消すと隅を軸に回って床からはみ出します。',
    },
    {
      kind: 'md',
      text: `
## rotation は、center とセット

\`texture.rotation\` は既定で **$(0, 0)$ ― UV の左下**を軸に回します。

床全体が斜めにずれて、たいてい望んだ結果になりません。

**\`texture.center.set(0.5, 0.5)\` を先に書いてください。**
画像の中心を軸に回るようになります。

\`offset\` で位置を合わせるより、\`center\` を決めるほうが素直です。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'テクスチャは共有されています',
      text: `
repeat や offset は、テクスチャそのものが持っている値です。
マテリアルの設定ではありません。

だから同じテクスチャを 2 つのマテリアルで共有していると、
片方で repeat を変えるともう片方も変わります。

別々にしたいなら texture.clone() を使ってください。
画像そのもの（GPU 上のデータ）は共有されたまま、
repeat / offset / rotation だけが独立します。メモリは増えません。
`,
    },
    {
      kind: 'md',
      text: `
## 継ぎ目を消す 3 つの手

タイルを敷き詰めると、**格子模様が浮き出て**見えます。
同じ絵が規則正しく並ぶので、人の目が周期を見つけてしまうからです。

**1. タイルそのものを継ぎ目なしに作る**

左端と右端、上端と下端が**そのままつながる**画像にします。
「シームレステクスチャ」と呼ばれるものです。

コードで作るなら簡単で、**周期関数（$\\sin$ や、周期を持つノイズ）を使えば自動的につながります。**

**2. \`MirroredRepeatWrapping\` を使う**

1 枚おきに裏返るので、継ぎ目では必ず**鏡像同士が接し**、模様が連続します。
つなぎ目を作り込まなくても済むかわりに、**鏡像の対称性が見えます。**

**3. 2 つの周期を重ねる**

$\\text{repeat} = 8$ の細かい層と、$\\text{repeat} = 1.3$ の大きなむらを重ねます。
$8$ と $1.3$ は割り切れないので、**周期がずっと合いません。**
規則性が壊れて、格子が見えにくくなります。

実務では **1 と 3 の組み合わせ**がいちばん効きます。
`,
    },
    {
      kind: 'code',
      title: '2 つの周期を重ねて、格子を消す',
      code: `import * as THREE from 'three';

// 細かい層
const detail = tileTexture();
detail.wrapS = detail.wrapT = THREE.RepeatWrapping;
detail.repeat.set(8, 8);

// 大きなむらの層。倍率を「割り切れない数」にするのが肝
const variation = noiseTexture();
variation.wrapS = variation.wrapT = THREE.RepeatWrapping;
variation.repeat.set(1.3, 1.3);       // 8 と 1.3 は周期が合わない

const material = new THREE.MeshStandardMaterial({
  map: detail,
  roughnessMap: variation,   // 粗さにむらを付けるだけでも、格子は目立たなくなる
  roughness: 1.0,
});

// 同じテクスチャを別の repeat で使いたいとき
const near = detail.clone();           // 画像は共有。設定だけ独立
near.repeat.set(24, 24);
near.needsUpdate = true;               // clone したら立てる`,
    },
    {
      kind: 'md',
      text: `
## 上下が逆になるとき ― flipY

読み込んだテクスチャが**上下逆**に貼られることがあります。

原因は原点の食い違いです。

- **画像ファイル** … 左上が原点（PNG も JPEG もそう）
- **UV** … 左下が原点

three は既定で \`texture.flipY = true\` にして、読み込み時に上下を入れ替えています。
だから**ふつうは正しく貼れます。**

問題が起きるのは 2 つの場面です。

- **glTF を読み込んだとき** … glTF の仕様は左上原点なので、
  three の \`GLTFLoader\` は \`flipY = false\` にします。**手で貼り直すと逆になります**
- **\`CanvasTexture\`** … canvas も左上原点なので、flipY が効きます。
  上のサンドボックスで「canvas の左上が UV の $(0,1)$」だったのはこのためです

**上下が逆なら \`texture.flipY\` を疑ってください。**
UV を書き換えるより、こちらを 1 行変えるほうがずっと簡単です。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '大きさの単位を、テクスチャ側で揃える',
      text: `
床の大きさが変わるたびに repeat を計算し直すのは面倒です。

「タイル 1 枚 = 1 メートル」と決めて、
repeat = 床の大きさ、と書けば済みます。

床が 20m x 12m なら repeat.set(20, 12)。
縦横が違ってもタイルは正方形のまま、枚数だけが変わります。

repeat の x と y を別々に指定できるのは、このためです。
`,
    },
  ],
  exercises: [
    {
      prompt: `$\\text{repeat} = 4$、$\\text{offset} = 0.125$、$\\text{center} = 0$ のとき、
頂点の $u = 0.5$ は画像のどこを読みますか。\`RepeatWrapping\` とします。`,
      hint: '$(u - c) R + c + o$ の順です。',
      answer: `**$u = 0.125$** の位置を読みます。

$(0.5 - 0) \\times 4 = 2.0$

$2.0 + 0 + 0.125 = 2.125$

\`RepeatWrapping\` は小数部分だけを使うので、**$0.125$**。

**offset の効き方に注意してください。**

$\\text{repeat} = 4$ なので、**タイル 1 枚は UV の $0.25$ ぶん**です。
$\\text{offset} = 0.125$ は、その**ちょうど半分** ― **タイル半枚ぶんずれます。**

つまり **offset は「タイル何枚ぶん」ではなく「UV の $1$ に対する割合」**です。

**タイル 1 枚ぶんずらしたいなら $\\text{offset} = 1/\\text{repeat}$。**
そして $\\text{offset} = 1$ ちょうどにすると、
$\\text{repeat}$ が整数なら**まったく元に戻ります**（タイル $\\text{repeat}$ 枚ぶん動くので）。

**実務で使う場面**

- **スプライトシート** … 1 枚の画像に並べたコマを、offset を動かして切り替える
- **流れるテクスチャ** … 毎フレーム \`offset.x += dt * 0.1\` でベルトコンベアや川
- **タイルの位置合わせ** … 部屋の隅とタイルの角を合わせる`,
      answerCode: `// スプライトシート：4x4 のコマを切り替える
const COLS = 4, ROWS = 4;
texture.repeat.set(1 / COLS, 1 / ROWS);     // 1 コマぶんだけ切り出す

function setFrame(index) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  texture.offset.set(col / COLS, 1 - (row + 1) / ROWS);   // 上の行から順に
}

// 流れる川
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  riverTexture.offset.y -= dt * 0.15;       // RepeatWrapping なら無限に流れる
  renderer.render(scene, camera);
});`,
    },
    {
      prompt: `\`texture.repeat.set(8, 8)\` を書いたのに繰り返されず、
**タイルが 1 枚だけ左下に貼られて、あとは端の色が伸びています。** 何が足りませんか。
そして、なぜ「1 枚だけ左下」になるのでしょう。`,
      hint: '既定の wrap は何でしたか。',
      answer: `**\`wrapS\` と \`wrapT\` に \`THREE.RepeatWrapping\` を指定していません。**

既定は \`ClampToEdgeWrapping\` ― **「$0$〜$1$ の外は、端の色で埋める」**です。

**なぜ「1 枚だけ左下」になるのか**

\`repeat = 8\` は UV を 8 倍します。だから

- 面の左下（$u = 0$）→ $0 \\times 8 = 0$ → 画像の左端
- $u = 0.125$ → $1.0$ → 画像の右端
- $u = 0.125$ より右 → $1.0$ を超える → **切り詰められて、ずっと右端の色**

つまり**面の左下 $1/8$ の範囲に画像 1 枚が収まり**、そこから先は
画像の右端 1 列の色がずっと引き伸ばされます。

上下も同じなので、**左下の $1/8 \\times 1/8$ の正方形にだけタイルが出ます。**

**直し方**

\`texture.wrapS = texture.wrapT = THREE.RepeatWrapping\` の 1 行です。

**なぜ既定が Clamp なのか**

繰り返さないテクスチャのほうが多いからです。
キャラクターの顔、看板、UI ―
これらで端がループしてしまうと、反対側の色が回り込んで**縁に細い線**が出ます。

**\`repeat\` と \`wrap\` はいつも組。** これは覚えてしまってください。`,
    },
    {
      prompt: `床のタイルが、規則正しく並んで**格子模様が浮き出て**見えます。
タイル画像そのものは継ぎ目なく作ってあります。**格子を目立たなくする方法**を 2 つ挙げ、
それぞれ**なぜ効くか**を説明してください。`,
      hint: '人の目は「周期」を見つけるのが得意です。',
      answer: `**1. 割り切れない倍率で、2 つ目の層を重ねる**

$\\text{repeat} = 8$ の細かい層に、$\\text{repeat} = 1.3$ の大きなむらを重ねます。

**なぜ効くか** … $8$ と $1.3$ の**最小公倍数が非常に大きい**（$8 \\times 1.3 = 10.4$ で、
整数比にならない）ため、**2 つの層の組み合わせが繰り返す周期が、床全体より長くなります。**

人の目は「同じ絵が同じ間隔で並ぶ」ことで周期に気づきます。
組み合わせが毎回違えば、周期が見つけられません。

重ねる層は \`roughnessMap\` でも十分です。色は同じでも、
**光り方にむらがあるだけで格子はかなり消えます。**

**2. \`MirroredRepeatWrapping\` を使う**

1 枚おきに裏返るので、継ぎ目では鏡像同士が接して模様が必ず連続します。

**なぜ効くか** … 継ぎ目の不連続そのものが消えるので、
「ここが境目だ」という手がかりが無くなります。

**ただし別の規則性が生まれます** ― 鏡像の対称性です。
非対称な模様（文字・矢印）だと、裏返しが目立ってかえって悪くなります。
**むら模様（石・土・草）には有効**です。

**3 つ目の手（本命）** … タイルを $2 \\times 2$ の 4 種類作り、
場所によって使い分ける。周期が 2 倍になり、組み合わせが 4 通りになります。
ゲームの地形では標準的な手法です。

**根本的には** … 格子が見えるのは**周期が短いから**です。
周期を長くするか、周期を壊すか、そのどちらかしかありません。`,
      answerCode: `// 割り切れない倍率で 2 層重ねる
const detail = makeTile();
detail.wrapS = detail.wrapT = THREE.RepeatWrapping;
detail.repeat.set(8, 8);

const variation = makeNoise();
variation.wrapS = variation.wrapT = THREE.RepeatWrapping;
variation.repeat.set(1.3, 1.3);        // 8 と周期が合わない

const material = new THREE.MeshStandardMaterial({
  map: detail,
  roughnessMap: variation,             // 光り方にむらを付ける
  roughness: 1.0,
});

// 鏡像で継ぎ目を消す（むら模様に限る）
detail.wrapS = detail.wrapT = THREE.MirroredRepeatWrapping;`,
    },
  ],
  quiz: [
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
        '既定は `ClampToEdgeWrapping` ―「$0$〜$1$ の外は端の色で埋める」です。repeat は UV に倍率を掛けるだけなので、外側の扱いを繰り返しに変えないと効きません。この 2 つはいつも組です。',
    },
    {
      q: '`texture.rotation` を設定したら、模様が斜めにずれて床からはみ出しました。足りないのはどれですか。',
      choices: [
        '`texture.center.set(0.5, 0.5)`',
        '`texture.offset.set(0.5, 0.5)`',
        '`texture.repeat` を上げる',
        '`wrapT` の指定',
      ],
      answer: 0,
      explain:
        '既定の回転の軸は UV の $(0,0)$ ― 左下の隅です。中心を軸に回したいなら `center` を $(0.5, 0.5)$ にします。offset で位置を合わせるより、こちらのほうが素直です。',
    },
    {
      q: 'glTF から読み込んだテクスチャを手で貼り直したら、上下が逆になりました。原因はどれですか。',
      choices: [
        '`texture.flipY` の設定',
        'UV が壊れている',
        '`colorSpace` の指定漏れ',
        'wrap の設定',
      ],
      answer: 0,
      explain:
        '画像ファイルは左上原点、UV は左下原点なので、three は既定で `flipY = true` にして入れ替えます。ただし glTF の仕様は左上原点なので、GLTFLoader は `flipY = false` にします。上下が逆ならまずここを疑ってください。',
    },
  ],
};
