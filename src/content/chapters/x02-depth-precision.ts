import type { Chapter } from '../types.ts';

export const chapterX02: Chapter = {
  slug: 'x02-depth-precision',
  part: 'project',
  number: 2,
  title: '遠くまで写す ― near と far の綱引き',
  goal: '奥行きの精度が near で決まる理由が分かり、遠景を入れても面がちらつかない設定を選べるようになります。',
  requires: ['p01-planet-setup', '10-camera'],
  mathRecall: [
    { slug: '10-camera', note: '視錐台の near と far' },
    { slug: 'b11-distance', note: '精度の見積もりも、割り算だけ' },
  ],
  threeApis: [
    'PerspectiveCamera',
    'PerspectiveCamera.near',
    'PerspectiveCamera.far',
    'WebGLRenderer',
    'Material.polygonOffset',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 星空を遠くに置くと、手前が壊れる

星空を半径 $1200$ のところに置くので、\`far\` はそこまで届く必要があります。
前の章では $3000$ にしました。

ところが \`far\` を伸ばすと、**手前の面がちらちら入れ替わる**ことがあります。
$2$ 枚の面が近くで重なっているとき、フレームごとにどちらが手前か決まらなくなる ―
{{Zファイティング}}と呼ばれる現象です。

**原因は \`far\` ではありません。\`near\` です。**

**見分け方が $1$ つあります。描く順を変えて結果が変わるなら、深度を区別できていません。**

これは直感に反するので、$1$ 回だけ式を見ておきます。
`,
    },
    {
      kind: 'formula',
      tex: 'd(z) \\;=\\; \\frac{f}{f-n}\\left(1 - \\frac{n}{z}\\right)',
      readAloud:
        '距離 $z$ にある面が、奥行きの記録（デプスバッファ）に書き込む値 $d$ です。$0$ が手前、$1$ が奥。**$z$ ではなく $1/z$ で効く**のが要点で、だから手前に精度が偏ります。',
      worked: {
        given:
          '前の章の設定、$n = 0.1$、$f = 3000$。**カメラから $0.2$**（$20$ センチ）のところにある面は、記録のどこに書かれるでしょうか。',
        steps: [
          { calc: 'f / (f - n) = 3000 / 2999.9' },
          { calc: '            = 1.0000333' },
          { calc: '1 - n / z = 1 - 0.1 / 0.2' },
          { calc: '          = 1 - 0.5 = 0.5' },
          { calc: 'd = 1.0000333 x 0.5' },
          { calc: '  = 0.50002' },
        ],
        result:
          '**$0.5$。記録のちょうど真ん中です。** つまり **$0.1$ から $0.2$ までの $10$ センチに、奥行きの精度の半分が使われています。** 残り半分で $0.2$ から $3000$ までを表す ― これが「手前に偏る」の実体です。そして**この $50\\%$ は $f$ を変えても動きません。** $f$ を $3000$ から $100$ に縮めても、半分はやはり $n$ 〜 $2n$ に使われます。**効くのは $n$ のほうだけ**です。',
      },
    },
    {
      kind: 'md',
      text: `
## 精度の半分は、いつも near 〜 2·near に使われる

計算例で見たとおり、**$d = 0.5$ になるのは $z = 2n$ のとき**です。$f$ にはほとんど寄りません。

- $n = 0.01$ … 半分が **$1$ センチから $2$ センチ**に使われる
- $n = 0.1$ … 半分が **$10$ センチから $20$ センチ**
- $n = 1$ … 半分が **$1$ m から $2$ m**

**手前に何も無いのに \`near = 0.01\` にしていると、精度の半分を捨てています。**

「近くも遠くも欲張る」のは、[](#/ch/10-camera)で見たとおり高い買い物です。
ここでは、その代金が具体的に見えました。
`,
    },
    {
      kind: 'formula',
      tex: '\\Delta z \\;\\approx\\; \\frac{z^2\\,(f-n)}{f\\,n\\,(2^{b}-1)}',
      readAloud:
        '距離 $z$ で**見分けられる最小の段差**です。$b$ はデプスバッファのビット数（ふつう $24$）。**$z$ の $2$ 乗に比例し、$n$ に反比例する** ― 遠いほど粗くなり、$n$ を大きくするほど細かくなります。',
      worked: {
        given:
          '$n = 0.1$、$f = 3000$、$b = 24$。**$1000$ 離れたところ**で見分けられる最小の段差は何 m でしょうか。$n = 1$ にしたらどう変わるでしょう。',
        steps: [
          { calc: '2^24 - 1 = 16,777,215' },
          { calc: 'n = 0.1 のとき' },
          { calc: '  分子 1000^2 x 2999.9' },
          { calc: '     = 2.9999e9' },
          { calc: '  分母 3000 x 0.1 x 16,777,215' },
          { calc: '     = 5.0332e9' },
          { calc: '  Δz = 0.596 m' },
          { calc: 'n = 1 のとき  Δz = 0.0596 m' },
        ],
        result:
          '**$0.60$ m と $0.06$ m。$n$ を $10$ 倍にしただけで、精度が $10$ 倍**になりました。$1000$ 離れたところで $60$ センチより薄い段差が表せない、というのが $n = 0.1$ の実力です。看板を壁から $10$ センチ浮かせても、**同じ深さと見なされてちらつきます。** なお $\\Delta z$ は $z^2$ に比例するので、$100$ 離れたところなら $\\frac{1}{100}$ の $6$ mm。**遠くほど急に粗くなる**ことも、この式から読めます。',
      },
    },
    {
      kind: 'sandbox',
      title: 'near を変えて、ちらつきを出す・消す',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 0.05 だと看板が消え、2 だと出ます
const NEAR = 0.05;

const FAR = 3000;
const DIST = 600;      // 板までの距離
const GAP = 0.06;      // 2 枚の板のすきま

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, NEAR, FAR);
camera.position.set(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, -DIST);

scene.add(new THREE.AmbientLight(0xffffff, 2.4));

// 奥の壁
const wall = new THREE.Mesh(
  new THREE.PlaneGeometry(700, 420),
  new THREE.MeshBasicMaterial({ color: 0x2b3350 }),
);
wall.position.z = -DIST;
// 壁をあとに描かせる。深度が区別できていれば、あとに描いても看板は隠れない
wall.renderOrder = 1;
scene.add(wall);

// 手前に GAP だけ浮かせた看板。文字のかわりに縞を描く
const canvas = document.createElement('canvas');
canvas.width = canvas.height = 256;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#ffd166';
ctx.fillRect(0, 0, 256, 256);
ctx.fillStyle = '#0a0a12';
for (let i = 0; i < 8; i++) ctx.fillRect(0, i * 32, 256, 16);
const stripes = new THREE.CanvasTexture(canvas);
stripes.colorSpace = THREE.SRGBColorSpace;

const sign = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 180),
  new THREE.MeshBasicMaterial({ map: stripes }),
);
sign.position.z = -DIST + GAP;      // 壁より 6 センチだけ手前
scene.add(sign);

const readout = document.createElement('div');
readout.style.cssText =
  'position:fixed;left:12px;top:12px;padding:8px 12px;border-radius:8px;' +
  'background:rgba(10,10,18,.82);color:#e8e8f2;font:13px/1.7 monospace;' +
  'border:1px solid #3a3a5c;white-space:pre';

// 式をそのまま置いておく。数字と画面を見比べられるように
const step = (DIST * DIST * (FAR - NEAR)) / (FAR * NEAR * (Math.pow(2, 24) - 1));
readout.textContent =
  'near ' + NEAR + ' / far ' + FAR + '\\n' +
  '精度の半分は ' + NEAR + ' 〜 ' + (NEAR * 2) + ' に使われる\\n' +
  '距離 ' + DIST + ' での最小段差 ' + step.toFixed(3) + ' m\\n' +
  '2 枚のすきま        ' + GAP.toFixed(3) + ' m\\n' +
  (GAP < step ? '→ 見分けられない（あとに描いた壁が勝つ）' : '→ 見分けられる');
document.body.appendChild(readout);

renderer.setAnimationLoop(() => {
  // わずかに揺らすと、ちらつきがはっきり見える
  camera.position.x = Math.sin(performance.now() * 0.0006) * 8;
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**看板が消えています。** $6$ センチ手前にあるのに、あとから描かれた壁に上書きされました ― $2$ 枚の深度が**同じ整数に落ちている**からです。`NEAR` を $2$ にすると、`far` も距離もすきまも変えていないのに**看板が出ます。** 変えたのは手前の $1$ 面だけ。**「描く順を変えると結果が変わる」のが、深度を区別できていないことの証拠**です ― 実機ではこれが、カメラの動きに合わせてちらつく形で出ます。左上の数字が、そのまま理由になっています。',
    },
    {
      kind: 'md',
      text: `
## 直し方は、上から順に

**$1$. \`near\` を上げる**

いちばん効いて、いちばん安い。カメラが物体に $10$ センチまで寄らないなら、
\`near = 0.1\` である必要はありません。

**作品ごとに測ってください。** \`controls.minDistance\` を決めているなら、
そこから逆算できます。

**$2$. すきまを広げる**

$6$ センチが足りないなら $50$ センチにする。物理的に離せるなら、これがいちばん確実です。

**$3$. \`polygonOffset\` を使う**

「同じ面に貼りつけたい」ものには、深度だけをずらす仕組みがあります。
床のラインや、壁のシールに向いています。

**$4$. \`logarithmicDepthBuffer: true\`**

$1/z$ ではなく対数で分布させます。手前も奥も要る作品（宇宙もの・飛行もの）では効きます。
ただし**少し重く、対応していない環境もある**ので、$1$ 〜 $3$ で足りるならそちらを。

**$5$. 遠景を別に描く**

星空だけ \`far\` の大きい別のカメラで先に描き、深度を消してから本編を描く。
手間はかかりますが、精度をいっさい犠牲にしません。
`,
    },
    {
      kind: 'code',
      title: 'polygonOffset ― 貼りつけたい面をずらす',
      code: `import * as THREE from 'three';

// 床のライン。床と同じ高さに置きたいが、そのままだとちらつく
const line = new THREE.Mesh(
  geometry,
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    polygonOffset: true,
    polygonOffsetFactor: -1,   // 面の傾きに応じてずらす量
    polygonOffsetUnits: -1,    // 一定量ずらす
  }),
);

// 宇宙ものなど、手前も奥も要るとき
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  logarithmicDepthBuffer: true,   // 少し重い。1〜3 で足りるなら使わない
});

// near は「寄れる距離」から決める
controls.minDistance = 2.6;
camera.near = 0.5;                // 2.6 まで寄れるなら 0.1 は要らない
camera.updateProjectionMatrix();   // near/far を変えたら必ず呼ぶ`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'near や far を変えたら updateProjectionMatrix',
      text: `
camera.near = 0.5 と書いただけでは、画面は変わりません。

投影行列は毎フレーム作り直されるわけではなく、
updateProjectionMatrix() を呼んだときだけ作られます。

aspect を変えたときにこれを呼ぶのは覚えていても、
near と far のときに忘れる ― これがよくある詰まり方です。

エラーは出ません。「値を変えたのに何も起きない」という形で出ます。
`,
    },
    {
      kind: 'md',
      text: `
## この作品では

惑星ビューアーの設定を決めておきます。

- \`controls.minDistance = 2.6\` … 惑星（半径 $1.6$）の中に入れない
- したがって**カメラは $2.6$ より近づかない**
- だから \`near\` は $0.5$ で足りる（$0.1$ にする理由がない）
- \`far = 3000\` … 星空が半径 $1200$ なので必要

$n = 0.5$、$f = 3000$ なら、精度の半分は $0.5$ 〜 $1.0$ に使われます。
**カメラが行けない場所なので、無駄になりません。**

次の章から、この骨組みの上に星空を載せていきます。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`near = 0.01\`、\`far = 5000\` で作っています。

1. 奥行きの精度の**半分**は、どの範囲に使われていますか。
2. $500$ 離れたところで見分けられる最小の段差は何 m ですか（$b = 24$）。
3. \`near\` を $0.5$ にすると、それぞれどうなりますか。`,
      hint: '$d = 0.5$ になるのは $z = 2n$ のとき。$\\Delta z \\approx \\dfrac{z^2(f-n)}{f\\,n\\,(2^b-1)}$。',
      answer: `**1. $0.01$ 〜 $0.02$ m（$1$ 〜 $2$ センチ）。2. $1.49$ m。3. $0.5$ 〜 $1.0$ m と $0.0298$ m。**

**1 ― 半分が使われる範囲**

$d = 0.5$ になるのは $z = 2n$ のときなので、

$0.01$ 〜 $0.02$ ― **わずか $1$ センチの帯**です。

奥行きの記録は $24$ ビット、約 $1{,}678$ 万段階あります。
その **$839$ 万段階が、カメラの前 $1$ 〜 $2$ センチ**に使われています。

**そこに何かありますか。** たいてい何もありません。

**2 ― $500$ での最小段差**

$\\Delta z = \\dfrac{500^2 \\times (5000 - 0.01)}{5000 \\times 0.01 \\times 16{,}777{,}215}$

分子 $= 250{,}000 \\times 4999.99 = 1.2500 \\times 10^9$

分母 $= 5000 \\times 0.01 \\times 16{,}777{,}215 = 8.3886 \\times 10^8$

$\\Delta z = 1.490$ m

**$500$ 離れたところでは、$1.5$ m より薄い段差が表せません。**
建物の壁に $1$ m 浮かせた看板を置いても、ちらつきます。

**3 ― \`near = 0.5\` にすると**

半分が使われる範囲は $0.5$ 〜 $1.0$ m。

最小段差は $n$ に反比例するので

$1.490 \\times \\dfrac{0.01}{0.5} = 0.0298$ m ― **約 $3$ センチ。$50$ 倍細かく**なりました。

**\`far\` は $1$ ミリも変えていません。**

**判断のしかた**

**「カメラはどこまで寄れるか」から \`near\` を決めてください。**

\`controls.minDistance\` があるならそこから。
一人称視点なら、壁にめり込まない距離（$0.1$ 〜 $0.3$ m）。

$0.01$ という値には、たいてい根拠がありません
― 何となく小さくしただけです。`,
    },
    {
      prompt: `\`camera.near = 0.5\` と書き換えたのに、**画面がまったく変わりません。**
ちらつきも直りません。

**何が足りませんか。** 同じ形の間違いを、もう $1$ つ挙げてください。`,
      hint: '投影行列は、いつ作り直されますか。',
      answer: `**\`camera.updateProjectionMatrix()\` を呼んでいません。**

**なぜ変わらないのか**

カメラが描画に使うのは \`near\` や \`fov\` そのものではなく、
それらから組み立てた**投影行列**です。

行列は毎フレーム作り直されるわけではありません。
\`updateProjectionMatrix()\` を呼んだときだけ作られます。

だから \`near\` を書き換えても、行列は古いまま。**何も起きません。**

**エラーは出ません。** 「値を変えたのに反応しない」という形でだけ現れます。

**リサイズのときは覚えているのに**

\`camera.aspect = ...; camera.updateProjectionMatrix();\` は
リサイズ処理の定型なので、こちらは忘れません。

忘れるのは \`near\` / \`far\` / \`fov\` / \`zoom\` を触ったときです。
**同じ関数を呼ぶ必要がある**、と覚えてください。

**同じ形の間違い**

**\`OrthographicCamera\` の \`left\` / \`right\` / \`top\` / \`bottom\`。**
リサイズに合わせてこれらを書き換えたのに、
\`updateProjectionMatrix()\` を呼ばずに「正射影だけリサイズに追随しない」となります。

もう $1$ つ挙げるなら、[](#/ch/t10-scene-graph)で扱った
**\`position\` を書き換えた直後の \`matrixWorld\`** です。

**共通しているのは「値と、値から作られたものが、別に存在する」という構図**です。
値のほうを書き換えても、作られたもののほうは自分で更新しないかぎり古いまま ―
three のあちこちに同じ形があります。`,
      answerCode: `// near / far / fov / zoom を変えたら
camera.near = 0.5;
camera.updateProjectionMatrix();

// 正射影の枠を変えたときも同じ
orthoCamera.left = -w / 2;
orthoCamera.right = w / 2;
orthoCamera.updateProjectionMatrix();

// position を変えた直後にワールド座標を読むなら
object.position.set(1, 2, 3);
object.updateMatrixWorld(true);
object.getWorldPosition(v);`,
    },
    {
      prompt: `宇宙を舞台にした作品を作ります。**手前 $1$ m の宇宙船のコックピット**も、
**$10$ 万 km 先の惑星**も、どちらも写す必要があります。

$1$ つの \`PerspectiveCamera\` でこれをやると何が起きますか。
**$3$ つの手当て**を、それぞれの代償とともに挙げてください。`,
      hint: '$n = 1$、$f = 10^8$ で $\\Delta z$ を出してみてください。',
      answer: `**どちらかが必ず壊れます。**

**何が起きるか**

$n = 1$、$f = 10^8$（$10$ 万 km を m で）とすると、
惑星のあたり（$z = 10^8$）での最小段差は

$\\Delta z = \\dfrac{(10^8)^2 \\times 10^8}{10^8 \\times 1 \\times 16{,}777{,}215} \\approx 6.0 \\times 10^8$ m

**$60$ 万 km。** 惑星の手前と奥の区別が、まったく付きません。

逆に $n$ を上げれば手前のコックピットが切れる。**両立しません。**

**手当て $1$ ― 遠景を別に描く（いちばん確実）**

星と惑星を「遠景カメラ」で先に描き、**深度だけ消して**から、
近景カメラで宇宙船を描きます。

$2$ つのカメラは \`fov\` と向きを共有し、\`near\`/\`far\` だけ変えます。

- 遠景 … $n = 10^4$、$f = 10^9$
- 近景 … $n = 0.1$、$f = 10^4$

**代償**: 描画が $2$ 回になります。$2$ つの世界が重なる場所（惑星の輪郭に船がかかる等）は、
自分で辻褄を合わせる必要があります。

**手当て $2$ ― \`logarithmicDepthBuffer: true\`**

$1/z$ ではなく対数で分布させます。$1$ 行で済みます。

**代償**: 少し重くなり、頂点シェーダで深度を書き直すので
一部の最適化（早期深度テスト）が効かなくなります。対応しない環境もあります。

**手当て $3$ ― 単位を変える**

$10$ 万 km を $10^8$ で表す必要はありません。**$1$ 単位 $=$ $1000$ km** にすれば $100$ です。

宇宙船は $10^{-5}$ 単位になりますが、**船だけ別のスケールで描く**（手当て $1$ と組み合わせる）。

**代償**: 数値が直感から離れます。「$1$ は何 m か」をコード全体で守り続ける規律が要ります。

**実際にどうするか**

**手当て $1$ ＋ $3$ の組み合わせ**が定番です。

$\\Delta z \\propto \\dfrac{z^2}{n}$ を見れば分かるとおり、
**$z$ の幅を狭めるのがいちばん効く** ― だから世界を層に割ります。`,
    },
  ],
  quiz: [
    {
      q: '`near = 0.1`、`far = 3000` のとき、奥行きの精度の半分はどこに使われていますか。',
      choices: [
        '0.1 〜 0.2（near 〜 2·near）',
        '1500 のあたり（真ん中）',
        '2900 〜 3000（far の近く）',
        '均等に分かれている',
      ],
      answer: 0,
      explain:
        'd = 0.5 になるのは z = 2n のときで、far にはほとんど寄りません。手前に何も無いのに near を小さくすると、精度の半分をそこに捨てることになります。',
    },
    {
      q: '遠くの面がちらつきます。いちばん効いて、いちばん安い手当てはどれですか。',
      choices: [
        '`near` を大きくする',
        '`far` を大きくする',
        'アンチエイリアスを切る',
        'ピクセル比を上げる',
      ],
      answer: 0,
      explain:
        'Δz は near に反比例します。near を 10 倍にすれば精度が 10 倍。カメラが寄れる距離（controls.minDistance など）から逆算して決めてください。0.01 という値には、たいてい根拠がありません。',
    },
    {
      q: '`camera.near = 0.5` と書いたのに何も変わりません。足りないのはどれですか。',
      choices: [
        '`camera.updateProjectionMatrix()`',
        '`renderer.render()` の呼び直し',
        '`scene.add(camera)`',
        '`controls.update()`',
      ],
      answer: 0,
      explain:
        'カメラが使うのは値そのものではなく、値から作った投影行列です。行列は updateProjectionMatrix() を呼んだときだけ作られます。エラーは出ず、「反応しない」という形でだけ現れます。',
    },
  ],
};
