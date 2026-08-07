import type { Chapter } from '../types.ts';

export const chapterW03: Chapter = {
  slug: 'w03-resize',
  part: 'threejs',
  number: 3,
  title: '大きさに合わせる ― リサイズとピクセル比',
  goal: '画面の大きさが変わっても絵が歪まないようにでき、高精細な画面で重くならない設定ができるようになります。',
  requires: ['w02-render-loop', 'm29-ortho'],
  threeApis: [
    'WebGLRenderer.setSize',
    'WebGLRenderer.setPixelRatio',
    'PerspectiveCamera.aspect',
    'Camera.updateProjectionMatrix',
    'WebGLRenderer.getPixelRatio',
  ],
  mathRecall: [
    { slug: '10-camera', note: '横縦比は投影行列の材料' },
    { slug: 'b05-ratio', note: '比が合っていないと形が伸びる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 窓の形が変われば、絵も直す

ブラウザの窓は、いつでも大きさが変わります。
横向きにしたスマートフォン、分割したウィンドウ、開いた開発者ツール。

そのとき直すものは **2 つ**あります。

- **レンダラの大きさ**（\`renderer.setSize\`）… 何ピクセルぶん描くか
- **カメラの横縦比**（\`camera.aspect\`）… どういう形に写すか

**片方だけだと歪みます。** そして、どちらを忘れたかで歪み方が違います。

- \`setSize\` だけ直した → **絵が引き伸ばされる**（丸が楕円になる）
- \`aspect\` だけ直した → **絵が小さいまま**、余白ができる

下のサンドボックスで、実際に両方を見比べてください。
`,
    },
    {
      kind: 'sandbox',
      title: '横縦比を直す・直さない',
      code: `import * as THREE from 'three';

// ここを false にすると、aspect を直さなくなります
const FIX_ASPECT = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

// 最初は正しい横縦比で作る。だから開いた直後は、どちらの設定でも丸い
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 5.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// キャンバスの外側だけ色を変えて、「表示領域の枠」が見えるようにする
document.body.style.background = '#252540';
document.body.style.display = 'grid';
document.body.style.placeItems = 'center';

// 丸いものを置く。歪みがいちばん分かりやすい
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(0.9, 0.25, 20, 60),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.35 }),
);
scene.add(ring);

const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(2, 3, 4);
scene.add(light, new THREE.HemisphereLight(0x8899ff, 0x101020, 0.6));

// 表示領域を、勝手に伸び縮みさせる（窓をつかんで動かす代わり）
const clock = new THREE.Clock();

let lastW = 0;

function resizeTo(width, height) {
  if (width === lastW) return;               // 変わったときだけ。毎フレーム呼ぶのは無駄
  lastW = width;

  renderer.setSize(width, height);           // 何ピクセル描くか

  if (FIX_ASPECT) {
    camera.aspect = width / height;          // どういう形に写すか
    camera.updateProjectionMatrix();         // ← これを忘れると反映されない
  }
}

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();

  // 幅だけを 0.4 倍 〜 1.0 倍で往復させる
  const f = 0.7 + 0.3 * Math.sin(t * 0.8);
  resizeTo(Math.round(window.innerWidth * f), window.innerHeight);

  renderer.render(scene, camera);
});`,
      caption:
        '**1 行目の `FIX_ASPECT` を `false` にして実行してください。** 幅が狭まるとリングが縦長の楕円につぶれます。`true` に戻すと、幅が変わってもリングは丸いままです。さらに `camera.updateProjectionMatrix()` の行だけをコメントアウトすると、`false` と同じ結果になります ― **代入しただけでは効かない**ことが分かります。',
    },
    {
      kind: 'md',
      text: `
## updateProjectionMatrix ― 材料と、できあがり

\`aspect\` を書き換えたのに直らない。これは非常によくある詰まり方です。

理由は、**\`aspect\` が「答え」ではなく「材料」だから**です。

three が描画で実際に使うのは \`camera.projectionMatrix\`、
つまり[](#/ch/m26-perspective)で組み立てたあの $4\\times4$ 行列です。
\`aspect\` や \`fov\` や \`near\` は、その行列を**作るときに読まれる**値でしかありません。

材料を差し替えても、できあがった行列は勝手に作り直されません。
\`updateProjectionMatrix()\` が「材料をもう一度読んで、行列を組み直せ」の合図です。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'これが要るのは、投影に関わる値だけ',
      text: `
fov / aspect / near / far / zoom を変えたときは updateProjectionMatrix が要ります。

position や rotation や lookAt では要りません。
そちらは別の行列（matrixWorld）で、three が毎フレーム自動で作り直しています。

「カメラをいじったら必ず呼ぶもの」ではない、というのが分かりにくいところです。
写す範囲を変えたときだけ、と覚えてください。
`,
    },
    {
      kind: 'md',
      text: `
## ピクセル比 ― 見えないところで 4 倍重くなる

高精細な画面では、**CSS 上の 1px が、実際には 2〜3 ピクセル**あります。
この倍率が {{ピクセル比}}（\`window.devicePixelRatio\`）です。

three は既定で 1 として扱うので、そのままだと文字や輪郭がぼやけます。
\`renderer.setPixelRatio(window.devicePixelRatio)\` と書けば直ります。

**ただし、これを何も考えずに書くと重くなります。**
縦にも横にも増えるので、**描くピクセル数は比の 2 乗**で増えるからです。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{描くピクセル数} \\;=\\; w \\times h \\times \\text{dpr}^{2}',
      readAloud:
        '横のピクセル数と縦のピクセル数を掛け、さらにピクセル比の 2 乗を掛けたものが、GPU が実際に色を計算する回数です。ピクセル比は縦と横の両方に効くので、2 乗になります。',
      worked: {
        given:
          '$1280 \\times 720$ の表示領域を、**ピクセル比 1 / 2 / 3** で描いたときの実ピクセル数を比べます。',
        steps: [
          { calc: 'dpr = 1 : 1280 x 720 x 1  =    921,600' },
          { calc: 'dpr = 2 : 1280 x 720 x 4  =  3,686,400', note: '2 の 2 乗 = 4 倍' },
          { calc: 'dpr = 3 : 1280 x 720 x 9  =  8,294,400', note: '3 の 2 乗 = 9 倍' },
          { calc: '比べる : (3 / 1) の 2 乗 = 9 倍' },
          { calc: '        (3 / 2) の 2 乗 = 2.25 倍', note: '2 で頭打ちにすると、ここが浮く' },
        ],
        result:
          '**ピクセル比 3 の端末では、1 のときの 9 倍**の計算をしています。しかも 2 と 3 の見た目の差は、目を近づけないと分かりません。だから **2 で頭打ちにするのが定番**です。$8{,}294{,}400 \\to 3{,}686{,}400$ で、**計算量が 55% 減ります。** これは軽量化としてはかなり大きい部類で、しかもコード 1 行で済みます。',
      },
    },
    {
      kind: 'code',
      title: 'ピクセル比は 2 で頭打ちにする',
      code: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 重い場面では 1.5 まで落とすこともある
// 品質を 1 つの値から決める書き方は、第5部で扱います
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));`,
    },
    {
      kind: 'md',
      text: `
## いつ直すか ― resize イベントだけでは足りない

\`window.addEventListener('resize', ...)\` は、**窓そのものの大きさが変わったとき**に呼ばれます。

ところが、窓が変わらなくてもキャンバスの大きさが変わることがあります。

- 横のサイドバーを開閉した
- 親要素の CSS が変わった
- 画面を回転させた（これは resize も来ます）

キャンバスを窓いっぱいに広げるなら \`resize\` で足ります。
**ページの一部に埋め込むなら、\`ResizeObserver\` のほうが確実**です。
「その要素の大きさが変わったとき」を直接見てくれます。
`,
    },
    {
      kind: 'code',
      title: '2 つの書き方',
      code: `// A. キャンバスが窓いっぱいのとき
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// B. ページの一部に埋め込むとき（こちらが確実）
const holder = document.querySelector('#viewer');

const ro = new ResizeObserver(() => {
  const w = holder.clientWidth;
  const h = holder.clientHeight;
  if (w === 0 || h === 0) return;        // 隠れているときは 0 が来る

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});
ro.observe(holder);

// 片付けるときは observer も止める
ro.disconnect();`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '高さ 0 で割らないこと',
      text: `
表示が隠れている要素の clientHeight は 0 になります。

そのまま aspect = w / 0 とすると Infinity が入り、投影行列が壊れて
画面が真っ黒になります。しかもエラーは出ません。

0 のときは何もしない、の 1 行を入れておいてください。
タブ切り替えのある画面では、ほぼ必ず踏みます。
`,
    },
    {
      kind: 'md',
      text: `
## 正射影カメラのときは、aspect ではない

\`OrthographicCamera\` には \`aspect\` がありません。
持っているのは \`left\` / \`right\` / \`top\` / \`bottom\` の 4 つです（[](#/ch/m29-ortho)）。

だからリサイズのときは、**この 4 つを自分で計算し直します。**
「縦の高さを固定して、横だけ広げる」のがいちばん素直な方針です。
`,
    },
    {
      kind: 'code',
      title: '正射影カメラのリサイズ',
      code: `const VIEW_HEIGHT = 10;   // 縦に何単位ぶん写すかを固定する

function resizeOrtho(width, height) {
  const aspect = width / height;
  const halfH = VIEW_HEIGHT / 2;
  const halfW = halfH * aspect;      // 横は、比に応じて広げる

  camera.left = -halfW;
  camera.right = halfW;
  camera.top = halfH;
  camera.bottom = -halfH;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスで \`camera.updateProjectionMatrix()\` の行**だけ**をコメントアウトしてください。
\`FIX_ASPECT\` は \`true\` のままです。何が起きますか。**なぜ**でしょう。`,
      hint: '`camera.aspect = width / height` の代入自体は、ちゃんと実行されています。',
      answer: `**\`FIX_ASPECT\` を \`false\` にしたときと、まったく同じ結果になります。**

つまり \`camera.aspect\` への代入は、**それだけでは何の効果もありません。**

three が描画で使うのは \`camera.projectionMatrix\` という $4\\times4$ の行列です。
\`aspect\` はその行列を**作るときに読まれる材料**にすぎません。

材料を差し替えても、すでに出来上がっている行列は変わりません。
\`updateProjectionMatrix()\` が「材料を読み直して、行列を組み直せ」の合図です。

**fov・aspect・near・far・zoom を変えたら、必ずこれを呼ぶ。**
逆に position や lookAt では要りません（そちらは別の行列で、毎フレーム自動で作られます）。`,
    },
    {
      prompt: `ピクセル比 **3** の端末で、$1600 \\times 900$ の表示領域を描いています。
上限を **2** に変えると、描くピクセル数は**何割減りますか**。手で計算してください。`,
      hint: 'ピクセル比は縦にも横にも効きます。',
      answer: `**約 56% 減ります**（半分以下）。

$1600 \\times 900 = 1{,}440{,}000$ ピクセルの表示領域です。

**ピクセル比 3** … $1{,}440{,}000 \\times 3^2 = 1{,}440{,}000 \\times 9 = 12{,}960{,}000$

**ピクセル比 2** … $1{,}440{,}000 \\times 2^2 = 1{,}440{,}000 \\times 4 = 5{,}760{,}000$

減る割合 … $1 - \\dfrac{4}{9} = \\dfrac{5}{9} = 0.556$

**表示領域の大きさは計算に出てきません。** 比の 2 乗どうしの割り算なので、
$4/9$ は画面の大きさによらず一定です。

$1296$ 万ピクセルというのは、**4K（829 万）を超えています。**
スマートフォンの GPU が毎秒 60 回これを計算するのは、かなり無理があります。
1 行で半分以下にできるなら、まず入れるべき設定です。`,
    },
    {
      prompt: `正射影カメラで、**縦に 20 単位ぶんを常に写したい**。
表示領域が $1200 \\times 600$ のとき、\`left\` と \`right\` はいくつにしますか。`,
      hint: '縦を固定して、横を比に応じて広げます。',
      answer: `**\`left = -20\`、\`right = 20\`** です。

**縦** … 20 単位ぶん写すので、中心から上下に 10 ずつ。$\\text{top} = 10$、$\\text{bottom} = -10$

**横縦比** … $1200 / 600 = 2$

**横** … 縦の半分（10）に比を掛けて $10 \\times 2 = 20$。
だから $\\text{left} = -20$、$\\text{right} = 20$

**確かめ** … 横に 40 単位、縦に 20 単位。比は 2 で、表示領域の比と一致します。
一致していないと、透視投影で \`aspect\` を直さなかったときと同じように歪みます。

**なぜ縦を固定するのか** … 横長の画面でも縦長の画面でも、
「主役の高さが変わらない」ほうが扱いやすいからです。
横が広い画面では、単に左右が余分に見えるだけになります。`,
      answerCode: `const VIEW_HEIGHT = 20;

const halfH = VIEW_HEIGHT / 2;          // 10
const halfW = halfH * (1200 / 600);     // 10 x 2 = 20

camera.left = -halfW;    // -20
camera.right = halfW;    //  20
camera.top = halfH;      //  10
camera.bottom = -halfH;  // -10
camera.updateProjectionMatrix();`,
    },
  ],
  quiz: [
    {
      q: '窓の大きさを変えたとき、直す必要があるのはどれとどれですか。',
      choices: [
        'レンダラの大きさと、カメラの横縦比',
        'レンダラの大きさだけ',
        'カメラの位置と画角',
        'シーンの背景色',
      ],
      answer: 0,
      explain:
        '`setSize` だけだと絵が引き伸ばされ、`aspect` だけだと絵が小さいまま余白ができます。2 つセットで直します。',
    },
    {
      q: '`camera.aspect` を書き換えたのに歪みが直りません。足りないのはどれですか。',
      choices: [
        '`camera.updateProjectionMatrix()` の呼び出し',
        '`scene.add(camera)`',
        '`renderer.dispose()`',
        'カメラの作り直し',
      ],
      answer: 0,
      explain:
        'aspect や fov は投影行列を作るための材料です。書き換えたあとに行列を組み直さないと描画には反映されません。`renderer.setSize()` とセットで呼ぶのが定石です。',
    },
    {
      q: 'ピクセル比を 1 から 3 にすると、描くピクセル数は何倍になりますか。',
      choices: ['9 倍', '3 倍', '6 倍', '変わらない'],
      answer: 0,
      explain:
        '縦にも横にも 3 倍になるので、面積では 2 乗の 9 倍です。だから `Math.min(devicePixelRatio, 2)` で頭打ちにします。2 と 3 の見た目の差はほとんどありません。',
    },
  ],
};
