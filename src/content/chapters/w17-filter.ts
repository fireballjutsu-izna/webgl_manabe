import type { Chapter } from '../types.ts';

export const chapterW17: Chapter = {
  slug: 'w17-filter',
  part: 'threejs',
  number: 17,
  title: '拡大と縮小 ― ぼやけと、ちらつき',
  goal: 'ミップマップの仕組みが分かり、遠くのちらつきと近くのぼやけを狙って直せるようになります。',
  requires: ['w16-repeat'],
  threeApis: [
    'Texture.magFilter',
    'Texture.minFilter',
    'Texture.generateMipmaps',
    'Texture.anisotropy',
    'WebGLRenderer.capabilities',
    'NearestFilter',
  ],
  mathRecall: [
    { slug: '08-interp', note: '拡大時のぼかしは、隣り合う画素の lerp' },
    { slug: 'b40-distribution', note: '縮小時は「たくさんの画素から 1 つを選ぶ」 ― 標本の偏り' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 画像の大きさと、画面上の大きさは合わない

$256 \\times 256$ の画像を貼った板が、画面上で $800$ ピクセルに映ることもあれば、
$20$ ピクセルにしか映らないこともあります。

つまり、**画像の 1 画素と画面の 1 画素は、まず一致しません。**

- **拡大**（画像 1 画素が画面の何画素にもなる）→ どう埋めるか
- **縮小**（画像の何画素かが画面の 1 画素になる）→ どれを選ぶか

この 2 つは別の問題で、**別の設定**で決めます。

- \`magFilter\` … 拡大するときの決め方
- \`minFilter\` … 縮小するときの決め方

そして**厄介なのは縮小のほう**です。
`,
    },
    {
      kind: 'md',
      text: `
## 拡大 ― ぼかすか、四角く残すか

拡大は簡単で、選択肢は 2 つだけです。

- \`LinearFilter\`（**既定**）… 隣り合う 4 画素を混ぜる。**なめらかにぼける**
- \`NearestFilter\` … いちばん近い 1 画素をそのまま使う。**四角がくっきり残る**

写真なら \`Linear\` で正解です。
**ドット絵、はっきりした模様、色分けのマップ**には \`Nearest\` を使います。

「拡大したらぼやけた」と困ったら、これを疑ってください。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '縮小のほうが、はるかに難しい',
      text: `
1000 人の意見を 1 つにまとめてください、と言われたとします。

いちばん手前の 1 人だけに聞くのは、明らかに乱暴です。
たまたまその人が変わった意見なら、全体を誤って伝えることになります。

しかも、聞く相手が少しずれるたびに答えががらりと変わります。
これが「ちらつき」です。

正しくは、全員の平均を取ります。
けれど毎回 1000 人に聞くのは重い ―
だから「あらかじめまとめておく」のがミップマップです。
`,
    },
    {
      kind: 'md',
      text: `
## 縮小 ― ちらつきの正体

遠くの床が**ざわざわちらつく**、細かい模様が**モアレになる**。
どちらも同じ原因です。

画面の 1 画素が画像の $50 \\times 50$ 画素ぶんを覆っているのに、
**その中の 1 画素だけを読んでいる**からです。

カメラが少し動くと、読む場所が別の画素に飛びます。
$2500$ 画素の中から毎フレーム違う 1 つを選ぶので、色がでたらめに変わる ―
これがちらつきです。

[](#/ch/b40-distribution)でやった**標本の偏り**そのものです。
$2500$ 個から 1 個だけ取って全体を代表させれば、当然ばらつきます。

**正しくは平均を取るべき**ですが、毎フレーム $2500$ 画素を読むのは重すぎます。
`,
    },
    {
      kind: 'md',
      text: `
## ミップマップ ― あらかじめ縮めておく

そこで、**縮小版を先に作っておきます。**

$256 \\times 256$ の画像から、$128$、$64$、$32$、$16$、$8$、$4$、$2$、$1$ と
**半分ずつのものを全部作って持っておく。** これが{{ミップマップ}}です。

描くとき、three（正確には GPU）は
**「この画素は画像のどれくらいの範囲を覆っているか」**を計算し、
それに合った段を選んで読みます。

$50$ 画素ぶんを覆うなら、$1/64$ に縮めた段を読む。
その段の 1 画素には、もとの $64 \\times 64$ 画素の平均が入っているので、
**平均を取ったのと同じ結果が、1 回の読み込みで得られます。**

**ちらつきは消えます。** そしてメモリは $4/3$ 倍にしかなりません。
`,
    },
    {
      kind: 'formula',
      tex: '1 + \\frac{1}{4} + \\frac{1}{16} + \\frac{1}{64} + \\cdots \\;=\\; \\frac{4}{3}',
      readAloud:
        'ミップマップの全段を足した大きさです。縦横が半分になるたびに面積は 4 分の 1 になるので、公比 4 分の 1 の等比級数になります。無限に続けても 3 分の 4 に収まります。',
      worked: {
        given: '$512 \\times 512$ の画像のミップマップは、**全部で何段あり、合計何画素**でしょう。',
        steps: [
          { calc: '512 → 256 → 128 → 64 → 32 → 16 → 8 → 4 → 2 → 1' },
          { calc: '段数 : log2(512) + 1 = 9 + 1 = 10 段' },
          { calc: '画素 : 262144 + 65536 + 16384 + 4096 + ...' },
          { calc: '     = 349,525 画素' },
          { calc: '349525 / 262144 = 1.3333', note: 'ぴったり 4/3' },
          { calc: 'メモリ : 349525 x 4 = 1.40 MB' },
        ],
        result:
          '**10 段、$349{,}525$ 画素 ― 元の $4/3$ 倍**です。追加は **33%** だけ。**ちらつきが完全に消えて、しかも速くなる**（読む範囲が小さいのでキャッシュが効く）ことを考えれば、破格の取引です。だから **three は既定でミップマップを作ります。** わざわざ切る理由は、ほとんどありません。',
      },
    },
    {
      kind: 'sandbox',
      title: 'ミップマップ有り・無しを、奥行きのある床で比べる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 1.4, 6);
camera.lookAt(0, 0, -40);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, -40);

scene.add(
  new THREE.DirectionalLight(0xffffff, 2.0).translateY(10),
  new THREE.HemisphereLight(0x99bbff, 0x101020, 1.0),
);

// 細かい市松模様。縮小のあらが出やすい絵
function checker(size = 256, cells = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cell = size / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#e8e8f2' : '#1b2b46';
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(20, 120);
  return t;
}

// 左：ミップマップ無し。奥がちらつく
const bad = checker();
bad.generateMipmaps = false;
bad.minFilter = THREE.LinearFilter;      // 縮小しても 1 段しか無い

// 右：ミップマップ有り（three の既定）＋ 異方性フィルタ
const good = checker();
good.minFilter = THREE.LinearMipmapLinearFilter;
good.anisotropy = renderer.capabilities.getMaxAnisotropy();

console.log('異方性の上限', renderer.capabilities.getMaxAnisotropy());

[[bad, -3.6], [good, 3.6]].forEach(([map, x]) => {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 240),
    new THREE.MeshBasicMaterial({ map }),   // 光を見ないので模様がそのまま出る
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(x, 0, -110);
  scene.add(floor);
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
        '**左（ミップマップ無し）の奥が、でたらめな模様のざわめきになっています。** 右は奥に行くほどなめらかに灰色へ溶けていきます。**ドラッグして視点を少し動かすと、左だけが激しくちらつきます。** `good.anisotropy` の行を消すと、右も奥がぼやけすぎて模様が早く消えるのが分かります。',
    },
    {
      kind: 'md',
      text: `
## minFilter の 6 通り

\`minFilter\` の選択肢は、**2 つの掛け算**でできています。

- **段の中でどう読むか** … \`Nearest\`（1 画素）か \`Linear\`（4 画素を混ぜる）
- **段と段のあいだをどうするか** … 使わない / \`NearestMipmap\`（近い段 1 つ）/ \`LinearMipmap\`（2 段を混ぜる）

組み合わせて 6 通りありますが、**実務で使うのは 2 つだけ**です。

- **\`LinearMipmapLinearFilter\`**（既定）… いちばん品質が高い。**迷ったらこれ**
- **\`NearestFilter\`** … ドット絵。ミップマップも使わず、四角をそのまま残す

\`NearestMipmapNearestFilter\` のような中間は、
**段の切り替わりが線として見える**ので、あえて選ぶ理由はほとんどありません。
`,
    },
    {
      kind: 'md',
      text: `
## 異方性フィルタ ― 斜めに見た床がぼやける問題

ミップマップには弱点が 1 つあります。

**縦と横を、必ず同じ倍率で縮める**ことです。

床を浅い角度から見ると、**横方向はあまり縮まないのに、奥行き方向は激しく縮みます。**
ミップマップは「激しく縮むほう」に合わせて段を選ぶので、
**横方向も一緒にぼけてしまいます。**

だから遠くの床が、ちらつきはしないものの**べったりぼやける**。

これを直すのが**異方性フィルタ**（\`anisotropy\`）です。
「縦横で縮み方が違う」場合に、**細長い形で複数回サンプリング**して、
横方向の解像度を保ちます。

- \`texture.anisotropy = 1\`（既定）… 使わない
- \`texture.anisotropy = renderer.capabilities.getMaxAnisotropy()\` … 上限まで使う（多くは 16）

**床や地面には、ほぼ必ず入れる価値があります。** 1 行で見違えます。
コストはそれなりにあるので、**斜めに見る大きな面だけ**に付けてください。
`,
    },
    {
      kind: 'code',
      title: '使い分けの実際',
      code: `import * as THREE from 'three';

// A. 写真・自然な模様（既定のまま。何も書かなくていい）
const photo = loader.load('/wood.jpg');
photo.colorSpace = THREE.SRGBColorSpace;

// B. 床・地面。斜めに見るので異方性を上げる
const ground = loader.load('/ground.jpg');
ground.colorSpace = THREE.SRGBColorSpace;
ground.wrapS = ground.wrapT = THREE.RepeatWrapping;
ground.repeat.set(40, 40);
ground.anisotropy = renderer.capabilities.getMaxAnisotropy();

// C. ドット絵。四角をそのまま残す
const pixelArt = loader.load('/sprite.png');
pixelArt.colorSpace = THREE.SRGBColorSpace;
pixelArt.magFilter = THREE.NearestFilter;
pixelArt.minFilter = THREE.NearestFilter;
pixelArt.generateMipmaps = false;          // 段を作っても使わないので、作らない

// D. 実行時に書き換えるテクスチャ（毎フレーム段を作り直すのは重い）
const dynamic = new THREE.CanvasTexture(canvas);
dynamic.generateMipmaps = false;
dynamic.minFilter = THREE.LinearFilter;    // 段が無いので、これにする

// ※ generateMipmaps = false のとき minFilter を既定のままにすると、
//    存在しない段を読もうとしてテクスチャが真っ黒になります`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'generateMipmaps を切ったら、minFilter も直す',
      text: `
generateMipmaps = false にすると、ミップマップの段が作られません。

ところが minFilter の既定は LinearMipmapLinearFilter ―
「段を読む」設定のままです。

存在しない段を読もうとするので、環境によっては
テクスチャが真っ黒になったり、何も貼られなくなったりします。

切るなら minFilter = THREE.LinearFilter もセットで書いてください。
`,
    },
    {
      kind: 'md',
      text: `
## $2$ の冪でなくてもよくなった

古い WebGL では、ミップマップを作れるのは
**縦横が $2$ の冪**（$256$、$512$、$1024$…）の画像だけでした。

WebGL 2 ではこの制限が無くなり、three は WebGL 2 を前提にしているので、
**$300 \\times 200$ のような画像でもミップマップが作られます。**

それでも $2$ の冪にしておく利点はあります。

- **圧縮テクスチャ**（KTX2 / Basis）が使える。メモリが $1/4$〜$1/6$ になる
- 段が最後まできれいに割り切れる

**新しく作るなら、$2$ の冪**にしておくのが無難です。
`,
    },
  ],
  exercises: [
    {
      prompt: `$1024 \\times 1024$ の画像のミップマップは、**何段**あり、**合計何画素**になりますか。
そして、画面上で $40$ ピクセルにしか映らないとき、**どの段**が読まれますか。`,
      hint: '半分ずつ、$1$ になるまで数えます。',
      answer: `**11 段、$1{,}398{,}101$ 画素。$40$ ピクセルなら $32 \\times 32$ の段が読まれます。**

**段数**

$1024 \\to 512 \\to 256 \\to 128 \\to 64 \\to 32 \\to 16 \\to 8 \\to 4 \\to 2 \\to 1$

$\\log_2(1024) + 1 = 10 + 1 = $ **11 段**

**合計画素**

$1024^2 = 1{,}048{,}576$ に対して、全段の合計は $4/3$ 倍。

$1{,}048{,}576 \\times 4/3 = 1{,}398{,}101$ 画素

**メモリ** … $\\times 4$ バイト $= 5.59$MB（元は $4.19$MB）

**どの段が読まれるか**

画面上で $40$ ピクセルということは、画像 $1024$ 画素が $40$ 画素に押し込まれています。
縮小率は $1024/40 = 25.6$ 倍。

**$25.6$ に近い段** … $16$ 倍（$64\\times64$）と $32$ 倍（$32\\times32$）のあいだです。

\`LinearMipmapLinearFilter\` なら、**この 2 段を読んで混ぜます。**
$25.6$ は $16$ と $32$ のあいだの $\\log_2$ で言えば $4.68$ 段目なので、
$4$ 段目と $5$ 段目を $0.68 : 0.32$ で混ぜることになります。

**\`NearestMipmapNearestFilter\` なら $32 \\times 32$ の段だけ**を読みます。
そのぶん速いのですが、**カメラが近づいたとき段が切り替わる瞬間に、
くっきりした線が横切って見えます。**

**この段の選択は GPU が自動でやります。** 私たちが書くことはありません。
書くのは「どう選ぶか（\`minFilter\`）」だけです。`,
    },
    {
      prompt: `毎フレーム書き換える \`CanvasTexture\` で \`generateMipmaps = false\` にしたところ、
**テクスチャがまったく貼られなくなりました**（真っ黒、または白）。
何が足りませんか。そして、なぜ \`generateMipmaps = false\` にしたかったのでしょう。`,
      hint: '`minFilter` の既定は何を読もうとしますか。',
      answer: `**\`minFilter = THREE.LinearFilter\` が足りません。**

\`minFilter\` の既定は \`LinearMipmapLinearFilter\` ―
**「ミップマップの 2 段を読んで混ぜる」**設定です。

\`generateMipmaps = false\` にすると段が作られないので、
**存在しないものを読もうとします。**

WebGL の仕様では、このとき「テクスチャは不完全」と判定され、
**読んだ結果は $(0,0,0,1)$ ― 黒**になります。エラーは出ません。

**直し方**

\`\`minFilter = THREE.LinearFilter\`\` にします。
「段は使わず、いまの解像度で 4 画素を混ぜる」設定です。

**なぜ切りたかったのか**

**ミップマップの生成は、毎回そこそこ重い**からです。

$512 \\times 512$ なら、$256$、$128$、$64$… と 9 段ぶんを作り直します。
画素数にして $174{,}762$ 個の平均計算です。毎フレームやれば効いてきます。

しかも **canvas の中身を書き換えるたびに、全段が作り直されます。**
スコア表示のように「近くで大きく映る」ものなら、
そもそも縮小されないのでミップマップは使われません。**作るだけ無駄**です。

**判断の基準**

- **遠くに映る・斜めに見る** → ミップマップは必須。生成の重さは受け入れる
- **常に手前で、画面に大きく映る** → 切ってよい。\`minFilter\` もセットで直す

**セットで書く。** これを忘れると、原因の分かりにくい真っ黒に出会います。`,
      answerCode: `const texture = new THREE.CanvasTexture(canvas);
texture.colorSpace = THREE.SRGBColorSpace;

// 毎フレーム書き換えるなら、この 2 行はセット
texture.generateMipmaps = false;
texture.minFilter = THREE.LinearFilter;    // ← これを忘れると真っ黒

function update() {
  drawToCanvas();
  texture.needsUpdate = true;              // 段を作り直さないので軽い
}`,
    },
    {
      prompt: `広い床にタイルを敷いたところ、遠くがちらつきはしないものの
**べったりぼやけて、$10$ メートル先で模様が消えてしまいます。**
ミップマップは有効です。何を足しますか。**なぜ効くのか**も説明してください。`,
      hint: '床を浅い角度から見るとき、縦と横で縮み方は同じですか。',
      answer: `**\`texture.anisotropy\` を上げます。**

**なぜぼやけるのか**

ミップマップは、**縦と横を必ず同じ倍率で縮めた**段しか持っていません。

ところが床を浅い角度から見ると、縮み方が方向によって大きく違います。

- **横方向**（画面の左右）… ほとんど縮まない。$2$ 倍程度
- **奥行き方向**（画面の上下）… 激しく縮む。$50$ 倍

GPU は「はみ出さないほう」 ― つまり**激しく縮む $50$ 倍のほう**に合わせて段を選びます。
そうしないとちらつくからです。

結果、**縮む必要のなかった横方向も $50$ 倍に縮んだ段で読まれ**、
持っていた解像度が丸ごと捨てられます。これが「べったりぼやける」の正体です。

**異方性フィルタが何をするか**

「縦横で縮み方が違う」と分かったら、
**細長い形に沿って複数回サンプリング**します。

$16$ 倍の異方性なら、横方向に $16$ 点を読んで平均します。
横方向は高い解像度の段を使えるので、**模様が保たれます。**
奥行き方向は平均されるので、**ちらつきも出ません。**

**書き方**

\`\`texture.anisotropy = renderer.capabilities.getMaxAnisotropy()\`\`

上限は環境によりますが、多くは $16$ です。

**注意点**

- **読む回数が増えるので、そのぶん重くなります。**
  斜めに見る大きな面（床・道路・壁）だけに付けてください
- 正面から見る面には**まったく効果がありません**（縮み方が縦横で同じなので）
- \`needsUpdate\` は不要ですが、**テクスチャを作ったあとすぐ**に設定してください

**床に 1 行足すだけで見違えます。** 費用対効果はかなり高い部類です。`,
      answerCode: `const ground = new THREE.CanvasTexture(canvas);
ground.colorSpace = THREE.SRGBColorSpace;
ground.wrapS = ground.wrapT = THREE.RepeatWrapping;
ground.repeat.set(40, 40);

// 斜めに見る大きな面だけに付ける
ground.anisotropy = renderer.capabilities.getMaxAnisotropy();   // 多くは 16

console.log('この環境の上限', renderer.capabilities.getMaxAnisotropy());

// 正面から見る看板などには付けない（効果が無いのに重くなるだけ）`,
    },
  ],
  quiz: [
    {
      q: '遠くの床がちらつきます。原因はどれですか。',
      choices: [
        '画面の 1 画素が覆う広い範囲から、1 画素だけを読んでいるから',
        'テクスチャの解像度が低いから',
        'ライトが強すぎるから',
        'far が小さいから',
      ],
      answer: 0,
      explain:
        '$2500$ 画素の中から毎フレーム違う 1 つを選べば、色はでたらめに変わります。標本の偏りそのものです。ミップマップは「あらかじめ平均を取った段」を用意して、1 回の読み込みで平均が得られるようにします。',
    },
    {
      q: 'ミップマップを全段持つと、メモリは何倍になりますか。',
      choices: ['約 1.33 倍', '2 倍', '約 1.1 倍', '4 倍'],
      answer: 0,
      explain:
        '縦横が半分になるたびに面積は $1/4$ なので、$1 + 1/4 + 1/16 + \\cdots = 4/3$ です。33% の追加でちらつきが完全に消え、しかもキャッシュが効いて速くなります。だから three は既定で作ります。',
    },
    {
      q: '床を浅い角度から見ると、ちらつきはしないもののべったりぼやけます。効くのはどれですか。',
      choices: [
        '`texture.anisotropy` を上げる',
        '`magFilter` を Nearest にする',
        '`generateMipmaps` を切る',
        '`repeat` を下げる',
      ],
      answer: 0,
      explain:
        'ミップマップは縦横を同じ倍率でしか縮めないので、激しく縮む奥行き方向に合わせた段が選ばれ、縮む必要のない横方向まで一緒にぼけます。異方性フィルタは細長い形で複数回読んで、横方向の解像度を保ちます。',
    },
  ],
};
