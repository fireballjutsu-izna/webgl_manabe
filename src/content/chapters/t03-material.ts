import type { Chapter } from '../types.ts';

export const chapterT03: Chapter = {
  slug: 't03-material',
  part: 'threejs',
  number: 10,
  title: '見た目を決める ― マテリアルの選び方',
  goal: '5 種類のマテリアルの違いが分かり、目的に応じて迷わず選べるようになります。',
  requires: ['w09-geometry-edit', '11-normal-light'],
  threeApis: [
    'MeshBasicMaterial',
    'MeshLambertMaterial',
    'MeshPhongMaterial',
    'MeshStandardMaterial',
    'MeshNormalMaterial',
    'Material.side',
    'Material.dispose',
    'Material.wireframe',
  ],
  mathRecall: [
    { slug: '11-normal-light', note: '明るさ ＝ 法線と光の内積' },
    { slug: 'm32-specular', note: 'てかりは「反射とカメラの内積」を何乗かしたもの' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## マテリアルは「光にどう応じるか」の決めごと

同じ球でも、粘土に見えたり、金属に見えたり、発光しているように見えたりします。
違いを生むのは形ではなく{{マテリアル}}です。

そしてマテリアルがやっていることは、結局のところ 1 つに尽きます。

**「この面に光が当たったとき、どんな色を返すか」を決める。**

[](#/ch/11-normal-light)でやった内積の計算が、その中心にいます。
マテリアルの種類の違いは、**その計算をどこまで丁寧にやるか**の違いでしかありません。
`,
    },
    {
      kind: 'md',
      text: `
## 5 つを並べて見る

言葉で説明するより並べたほうが早いので、同じ形・同じ光で見比べます。

**光の強さを 0 にしてみてください。** 消えずに残るものが「光を無視する材質」です。
`,
    },
    {
      kind: 'demo',
      id: 'material-compare',
      caption:
        '粗さ（roughness）を 0 に近づけるとハイライトが小さく鋭くなり、1 に近づけると広がって消えます。金属度を上げると、映り込むものが無い場面では逆に暗くなります。',
    },
    {
      kind: 'md',
      text: `
## 使い分けの指針

| マテリアル | 何をするか | いつ使うか |
|---|---|---|
| \`MeshBasicMaterial\` | 光を一切見ない。指定した色がそのまま出る | 補助表示・切り分け・**いちばん軽い** |
| \`MeshLambertMaterial\` | 内積 1 回ぶんの素直な陰影 | ざらついた面。軽さが要るとき |
| \`MeshPhongMaterial\` | Lambert に、てかりを足したもの | プラスチック・濡れた面 |
| \`MeshStandardMaterial\` | 粗さと金属度で質感を作る | **迷ったらこれ**。現在の標準 |
| \`MeshNormalMaterial\` | 法線の向きをそのまま色にする | 見た目用ではなく**法線を確かめる道具** |

**迷ったら Standard を選んでください。** 速度が問題になったときだけ、
Lambert や Basic を検討します。

Lambert と Phong は「Standard より軽い代わりに、質感の作り込みができない」ものです。
古い書き方だから使わない、ということではありません。
**数千個のものを並べる場面では、いまでも現役の選択肢**です。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '真っ黒なときの切り分けに Basic を使う',
      text: `
物体が真っ黒で「ライトが無いのか、法線が壊れているのか、そもそも映っていないのか」が
分からないときは、いったん MeshBasicMaterial に差し替えてください。

光を無視するので、映っていれば形と位置は正しいと分かり、原因をライトか法線に絞れます。
[](#/ch/w04-blank-screen) で使った 5 つの道具のうちの 1 つです。
`,
    },
    {
      kind: 'md',
      text: `
## MeshNormalMaterial は、目で見るデバッガ

これは見た目のためのマテリアルではありません。
**法線の向きを、そのまま RGB として塗る**ものです。

- 右（$+x$）を向いた面 → **赤が強い**
- 上（$+y$）を向いた面 → **緑が強い**
- 手前（$+z$）を向いた面 → **青が強い**

だから、こう読めます。

- **色がまだらに散っている** → 法線が壊れている
- **黒い面がある** → その面の法線が反対を向いている
- **隣の面と色が急に変わる** → 頂点を共有していない（角がくっきりする）

自分で組んだジオメトリが妙な陰影になるとき、
これに差し替えると**ライトの問題か法線の問題かが一目で分かります。**
`,
    },
    {
      kind: 'formula',
      tex: '\\text{色} \\;=\\; \\frac{\\mathbf{n} + 1}{2}',
      readAloud:
        '法線の各成分は $-1$ から $1$ の範囲にありますが、色は $0$ から $1$ しか表せません。だから 1 を足して 2 で割り、範囲を移し替えています。法線マップの作り方とまったく同じ変換です。',
      worked: {
        given: '上を向いた面の法線 $\\mathbf{n} = (0,\\,1,\\,0)$ は、どんな色になるでしょう。',
        steps: [
          { calc: 'x : (0 + 1) / 2 = 0.5' },
          { calc: 'y : (1 + 1) / 2 = 1.0' },
          { calc: 'z : (0 + 1) / 2 = 0.5' },
          { calc: 'RGB = (0.5, 1.0, 0.5)', note: '0〜255 なら (128, 255, 128)' },
        ],
        result:
          '**淡い緑**です。上を向いた面がみな同じ緑になるので、地面が一様な緑に塗られていれば法線は正しいと分かります。**まだらなら壊れています。** ちなみに手前を向いた面 $(0,0,1)$ は $(0.5,\\,0.5,\\,1.0)$ ― 淡い青。**この $(128, 128, 255)$ という値は、[](#/ch/w18-normal-map)で出てくる「凹凸なしの法線マップ」の色そのもの**です。同じ変換だからです。',
      },
    },
    {
      kind: 'sandbox',
      title: '5 つを並べて、光を消してみる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.4, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ここを 0 にしてみてください。消えずに残るものが「光を無視する材質」です
const LIGHT_POWER = 2.6;

const key = new THREE.DirectionalLight(0xffffff, LIGHT_POWER);
key.position.set(3, 4, 5);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, LIGHT_POWER * 0.25));

const color = 0xffd166;

const materials = [
  ['Basic',    new THREE.MeshBasicMaterial({ color })],
  ['Lambert',  new THREE.MeshLambertMaterial({ color })],
  ['Phong',    new THREE.MeshPhongMaterial({ color, shininess: 30 })],
  ['Standard', new THREE.MeshStandardMaterial({ color, roughness: 0.3 })],
  ['Normal',   new THREE.MeshNormalMaterial()],
];

// 球がいちばん違いを読みやすい。陰影の変化とハイライトが素直に出る
const geometry = new THREE.SphereGeometry(0.66, 48, 32);

materials.forEach(([name, material], i) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = (i - (materials.length - 1) / 2) * 1.6;
  scene.add(mesh);
  console.log(i, name);
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
        '左から Basic / Lambert / Phong / Standard / Normal。**Basic だけが陰影を持たず、平らな円に見えます。** Lambert には陰影がありますが、てかりがありません。Phong と Standard にはハイライトがあり、その出方が違います。**`LIGHT_POWER` を 0 にすると、両端の 2 つだけが残ります。**',
    },
    {
      kind: 'md',
      text: `
## 面の裏表 ― side

既定では**裏面は描かれません**。見えない面を捨てて速くするためです
（[](#/ch/w06-buffer-geometry)でやった背面カリング）。

- \`THREE.FrontSide\`（既定）… 表だけ
- \`THREE.BackSide\` … 裏だけ。**空を表す大きな球の内側**を見せるときに使う
- \`THREE.DoubleSide\` … 両面。板・葉・布など、厚みのないものに

\`DoubleSide\` は描く量が増えるだけでなく、透明や影の扱いも複雑になります。
**本当に両面が見えるものだけ**にしてください。
`,
    },
    {
      kind: 'code',
      title: 'よく使う共通の設定',
      code: `const material = new THREE.MeshStandardMaterial({
  color: 0x4fd6ff,
  side: THREE.DoubleSide,     // 厚みのない板

  wireframe: true,            // 三角形の骨組みだけを描く（デバッグに便利）
  flatShading: true,          // 法線を平均せず、面ごとにくっきりさせる

  emissive: 0x220044,         // 光を受けなくても、この色だけは出す
  emissiveIntensity: 1.0,
});

// あとから変えるときは needsUpdate が要るものがある
material.flatShading = false;
material.needsUpdate = true;   // シェーダの組み方が変わるものは、これが要る

// color や opacity のように「値を差し替えるだけ」のものは不要
material.color.set(0xff6b8a);  // これだけで効く`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'needsUpdate が要るものと、要らないもの',
      text: `
色・不透明度・粗さのように「数値を差し替えるだけ」のものは、代入で効きます。

いっぽう flatShading・vertexColors・side・transparent・マップの付け外しは、
GPU 上のプログラムそのものを組み直す必要があります。
このとき needsUpdate = true が要ります。

見分け方は「シェーダの中身が変わるか」。
迷ったら付けても構いませんが、毎フレーム付けると組み直しが走って重くなります。
`,
    },
    {
      kind: 'md',
      text: `
## 共有し、使い終えたら捨てる

同じ見た目のものが 100 個あるなら、マテリアルは 1 つで足ります。
[](#/ch/t02-geometry)でジオメトリについて言ったのと同じです。

しかもマテリアルの共有には、**描画がまとまって速くなる**という別の効果もあります。
three は同じマテリアルのものを続けて描けるので、
GPU に設定を送り直す回数が減ります（[](#/ch/t11-performance)）。

捨てるときは \`material.dispose()\` を呼んでください。共有しているなら 1 回だけです。
`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスの \`LIGHT_POWER\` を \`0\` にしてください。
**残るのはどれとどれですか。** そしてなぜでしょう。`,
      hint: '光の計算をしないマテリアルは、どれでしたか。',
      answer: `**Basic と Normal** の 2 つが残ります。

**\`MeshBasicMaterial\`** … 光の計算を一切しません。指定した色をそのまま出すだけです。
だからライトが 0 個でも、100 個でも、見た目は変わりません。

**\`MeshNormalMaterial\`** … 法線の向きを色に変換しているだけで、
これも光を見ていません。ライトを増やしても変化しません。

**残りの 3 つ**（Lambert・Phong・Standard）は、
[](#/ch/b27-lambert)のとおり明るさ ＝ 法線と光の内積で決まります。
光が無ければ掛ける相手が無いので、**0 ― つまり真っ黒**です。

**これが切り分けに使える理由**です。
真っ黒な物体を Basic に差し替えて映れば、原因はライト。
差し替えても黒いなら、原因はライト以外（\`scene.add\` 忘れ、カメラ、near/far…）。

**1 行で、候補を半分に割れます。**`,
    },
    {
      prompt: `法線 $\\mathbf{n} = (-1,\\,0,\\,0)$ の面（左を向いた面）は、
\`MeshNormalMaterial\` で何色になりますか。$0$〜$255$ で答えてください。`,
      hint: '$(\\mathbf{n}+1)/2$ を使い、最後に 255 を掛けます。',
      answer: `**$(0,\\; 128,\\; 128)$** ― 濃い青緑（シアン）です。

$x$ … $(-1 + 1)/2 = 0$ → $0 \\times 255 = 0$
$y$ … $(0 + 1)/2 = 0.5$ → $0.5 \\times 255 = 128$
$z$ … $(0 + 1)/2 = 0.5$ → $128$

**右を向いた面 $(1,0,0)$ は $(255, 128, 128)$** ― 明るいピンク。
つまり左右の面は**正反対の色**になります。

**これが役に立つ場面** … 立方体を \`MeshNormalMaterial\` で描くと、
6 面がすべて違う色になります。だから

- 面が 6 色に塗り分かれている → 法線は正しい
- 隣り合う面が同じ色 → その面の法線が間違っている
- どこかが真っ黒 → 成分がすべて負の方向を向いている面がある

と読めます。**目で見るデバッガ**です。

なお \`MeshNormalMaterial\` は**カメラから見た法線**（ビュー空間）を使うので、
視点を回すと色が変わります。ワールド空間の向きを見たいわけではない、という点だけ注意してください。`,
    },
    {
      prompt: `\`material.flatShading = true\` に**あとから**変えたのに、見た目が変わりません。
何が足りませんか。そして \`material.color.set(0xff0000)\` では、なぜ同じ問題が起きないのでしょう。`,
      hint: 'GPU 上のプログラムが変わるのは、どちらですか。',
      answer: `**\`material.needsUpdate = true\`** が足りません。

**2 種類の設定があります。**

**A. 数値を差し替えるだけのもの** … \`color\`、\`opacity\`、\`roughness\`、\`metalness\`
これらは GPU 上のプログラム（シェーダ）に**値として渡される**だけです。
毎フレーム渡し直しているので、代入するだけで次のフレームから効きます。

**B. プログラムの組み方が変わるもの** … \`flatShading\`、\`vertexColors\`、\`side\`、
\`transparent\`、マップの付け外し
これらは**シェーダのコードそのものが変わります。**
たとえば \`flatShading\` は「法線を面ごとに計算し直す」処理を差し込む必要があります。

three は「作ったときの設定でシェーダを 1 回組み、以後は使い回す」ので、
**組み直しが要ることを伝えないといけません。** それが \`needsUpdate = true\` です。

**毎フレーム立ててはいけません。** 立てるたびにシェーダの組み直しが走り、
数十ミリ秒単位で止まります。切り替えの瞬間に 1 回だけです。

**いちばん安全なのは、最初から指定して作ること。**
切り替えたいなら、**2 つのマテリアルを用意して差し替える**ほうが速いこともあります。`,
      answerCode: `// A. 値だけ変わるもの ― 代入で効く
material.color.set(0xff0000);
material.roughness = 0.8;

// B. シェーダが変わるもの ― needsUpdate が要る
material.flatShading = true;
material.needsUpdate = true;

// 頻繁に切り替えるなら、2 つ用意して差し替える
const smooth = new THREE.MeshStandardMaterial({ color, flatShading: false });
const faceted = new THREE.MeshStandardMaterial({ color, flatShading: true });

mesh.material = faceted;   // 組み直しは起きない`,
    },
  ],
  quiz: [
    {
      q: 'ライトを 1 つも置いていないシーンで、色が見える材質はどれですか。',
      choices: [
        'MeshBasicMaterial',
        'MeshStandardMaterial',
        'MeshLambertMaterial',
        'MeshPhongMaterial',
      ],
      answer: 0,
      explain:
        'Basic は光の計算をせず、指定した色をそのまま出します（MeshNormalMaterial も光を必要としません）。他の 3 つは、明るさが法線と光の内積で決まるので、光がなければ真っ黒です。',
    },
    {
      q: '`MeshNormalMaterial` で描いた地面が、一様な淡い緑になりました。何が分かりますか。',
      choices: [
        '上向きの法線が正しく作られている',
        'ライトが緑色になっている',
        'マテリアルの色設定が緑',
        '法線が壊れている',
      ],
      answer: 0,
      explain:
        '$(\\mathbf{n}+1)/2$ で色に変換するので、上向き $(0,1,0)$ は $(0.5, 1, 0.5)$ ― 淡い緑になります。まだらなら法線が壊れています。目で見るデバッガとして使えます。',
    },
    {
      q: '`material.side = THREE.DoubleSide` にあとから変えたのに、裏面が描かれません。足りないのはどれですか。',
      choices: [
        '`material.needsUpdate = true`',
        'ライトの追加',
        '`geometry.computeVertexNormals()`',
        'カメラの更新',
      ],
      answer: 0,
      explain:
        'side はシェーダの組み方に関わる設定なので、変えたあとに組み直しを頼む必要があります。color や roughness のように「値を渡すだけ」のものは代入で効きます。',
    },
  ],
};
