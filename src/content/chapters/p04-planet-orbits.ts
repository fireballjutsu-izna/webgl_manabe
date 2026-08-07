import type { Chapter } from '../types.ts';

export const chapterP04: Chapter = {
  slug: 'p04-planet-orbits',
  part: 'project',
  number: 15,
  title: '動かす ― 回転を、どこに持たせるか',
  goal: '$2$ 種類の回転を $1$ つの物体に載せると軸が振り回される理由を数字で言えるようになり、入れ物を増やして分ける設計ができるようになります。',
  requires: ['x14-terminator', '09-hierarchy', 'm10-euler'],
  threeApis: ['Group', 'Object3D.rotation', 'Object3D.add', 'MathUtils.degToRad', 'Euler.order'],
  mathRecall: [
    { slug: '09-hierarchy', note: '親の座標系の中で、子が動く' },
    { slug: 'm10-euler', note: '$3$ つの角度は、順番に効く' },
    { slug: '07-rotation', note: '回転は掛け算。順番を変えると別物になる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 止まっている惑星は、まだ模型です

[](#/ch/x14-terminator)で、$4$ 枚の層が重なった惑星ができました。
太陽が回り、雲が流れ、夜側に街の明かりが灯ります。

**それでも、惑星そのものは真っ直ぐ立ったままです。**

ここから $5$ 章かけて、動きと**触れること**を足します。

- **自転軸を傾ける**（地球なら $23.4$ 度）
- **月を公転させる**
- **クリックした天体を選ぶ**（ドラッグと区別する）
- **選んだ相手へ、カメラがなめらかに寄る**
- **名前のラベルを空間に置く**

新しい概念はほとんど出てきません。
[](#/ch/09-hierarchy)・[](#/ch/05-trig)・[](#/ch/08-interp)・[](#/ch/t08-raycaster)を
**組み合わせるだけ**です。
`,
    },
    {
      kind: 'md',
      text: `
## 素直に書くと、必ず失敗する

「惑星を $23.4$ 度傾けて、そのまま自転させたい」

素直に書くと、こうなります。

- \`planet.rotation.z = 23.4°\`（傾き）
- \`planet.rotation.y += dt\`（自転）

**これは動きません。**

いや、動くのですが、**自転軸が首を振ります。**
地軸が固定されたまま回るのではなく、$23.4$ 度傾いた棒が円錐を描いてぐるぐる回ります。

歳差運動のように見えますが、そんな高級なものではありません。
**$3$ つの角度を $1$ つの回転にまとめる仕組みを、誤解しているだけ**です。
`,
    },
    {
      kind: 'formula',
      tex: 'R \\;=\\; R_x(\\alpha)\\,R_y(\\beta)\\,R_z(\\gamma), \\qquad \\mathbf{u} \\;=\\; R\\,(0,1,0)^{\\mathsf T}',
      readAloud:
        '$3$ つの角度は、$x$・$y$・$z$ の順に掛けた $1$ つの回転になります（three の既定の順番）。物体にとっての「上」がどこを向くかは、その回転を $(0,1,0)$ に掛ければ出ます。$\\beta$（自転）を動かしたとき $\\mathbf{u}$ が動くなら、軸は固定されていません。',
      worked: {
        given:
          '$\\gamma = 23.4$ 度（傾き）を入れたまま、$\\beta$（自転）を $0 \\to 180$ 度まで動かして、上向き $\\mathbf{u}$ を追います。',
        steps: [
          { calc: 'β = 0 度   : u = (-0.3971, 0.9178, 0.0000)' },
          { calc: 'β = 45 度  : u = (-0.2808, 0.9178, 0.2808)' },
          { calc: 'β = 90 度  : u = ( 0.0000, 0.9178, 0.3971)' },
          { calc: 'β = 180 度 : u = ( 0.3971, 0.9178, 0.0000)' },
          { calc: 'y 成分はずっと 0.9178', note: '傾きの角度は保たれている' },
          { calc: '0 度と 180 度の u のなす角' },
          { calc: '  = 46.80 度', note: '傾き 23.4 度のちょうど 2 倍' },
        ],
        result:
          '**軸は $23.4$ 度の半頂角を持つ円錐を、まるごとなぞっています。** $y$ 成分が変わらないので「傾きは合っている」ように見えるのがたちの悪いところで、静止画では気づけません。$R_z$ が先に効いて上を倒し、そのあと $R_y$ が**倒れた上を**回している ― $R_y$ は世界の $y$ 軸のまわりの回転であって、傾いた軸のまわりの回転ではないからです。',
      },
    },
    {
      kind: 'md',
      text: `
## 直し方は、入れ物を 1 枚増やすだけ

やりたいのは「**傾いた座標系の中で、$y$ 軸のまわりに回す**」ことでした。
$1$ つの物体では、それを表せません。**座標系を $2$ つに分けます。**

- \`tilt\`（Group）… 傾きだけを持つ。**動かさない**
- \`planet\`（Mesh）… その子。**自分の $y$ 軸のまわりだけ**を回る

こうすると、planet にとっての「上」は**常に傾いた軸**です。
その軸のまわりに回るので、軸は $1$ ミリも動きません。

数字でも確かめられます。$\\beta$ を $0$・$90$・$180$ 度と変えても、
軸の向きは $(-0.3971,\\; 0.9178,\\; 0)$ のまま**まったく動きません。**
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '「回転を分けたい」と思ったら Group',
      text: `
$2$ 種類の回転を $1$ つの物体に載せようとして詰まったら、
**入れ物を $1$ 枚増やす**のが定石です。

- 傾き ＋ 自転 → \`tilt\` の中に \`planet\`
- 公転 ＋ 自転 → \`orbit\` の中に \`moon\`
- 軌道傾斜 ＋ 公転 → \`inclination\` の中に \`orbit\`

Group は行列を $1$ つ増やすだけで、描画の重さはほぼ変わりません
（頂点も三角形も増えません）。

**迷ったら分ける。** あとから触れる形になります。
`,
    },
    {
      kind: 'md',
      text: `
## この惑星の、階層の設計図

これから作るものを、先に木の形で決めておきます。

| 入れ物 | 持つもの | 中身 |
|---|---|---|
| \`tilt\` | 傾き $23.4$ 度（固定） | 地表・街の明かり・雲 |
| （シーン直下） | ― | 大気・月・軌道の線 |

**大気を \`tilt\` の外に置いている**のが $1$ か所だけの例外です。
大気は一様な殻なので、傾けても回しても同じ絵になります ―
中に入れても害はありませんが、**入れる理由もありません。**

逆に、街の明かりと雲は必ず中に入れます。
**地表と一緒に傾かないと、雲が赤道からずれます。**
`,
    },
    {
      kind: 'sandbox',
      title: '直に書く（首を振る）と、Group で分ける（正しい）',
      guide: { focus: ['左 ― 1 つの物体に 2 つの回転', '右 ― 入れ物を 1 枚かぶせる'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TILT = THREE.MathUtils.degToRad(23.4);
const SPIN = 0.6;   // 自転の速さ

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 1.6, 9.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const sun = new THREE.DirectionalLight(0xfff2e0, 3.2);
sun.position.set(5, 2, 4);
scene.add(sun, new THREE.AmbientLight(0x22334a, 0.35));

function makeGlobe() {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 64, 48),
    new THREE.MeshStandardMaterial({ color: 0x3d6a8f, roughness: 0.8 }),
  );
  // 回っていることが分かるよう、経線を 1 本だけ引く
  const meridian = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI - Math.PI / 2;
    meridian.push(new THREE.Vector3(Math.cos(a) * 1.21, Math.sin(a) * 1.21, 0));
  }
  mesh.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(meridian),
    new THREE.LineBasicMaterial({ color: 0x7ce7ff }),
  ));
  return mesh;
}

function makeAxis(parent) {
  const axis = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -2.0, 0), new THREE.Vector3(0, 2.0, 0),
    ]),
    new THREE.LineBasicMaterial({ color: 0xff7ad9 }),
  );
  parent.add(axis);
  return axis;
}

/* ---- 左 ― 1 つの物体に 2 つの回転 ---- */
// rotation.z（傾き）と rotation.y（自転）を同じ Mesh に載せる。
// 3 つの角度は x→y→z の順に 1 つの回転へまとめられるので、
// 「傾けてから世界の y 軸で回す」= 軸ごと振り回す、になる

const bad = makeGlobe();
bad.position.x = -2.2;
bad.rotation.z = TILT;
scene.add(bad);
const badAxis = makeAxis(bad);   // 軸は Mesh の子なので、Mesh と一緒に振られる

/* ---- 右 ― 入れ物を 1 枚かぶせる ---- */
// tilt が傾きだけを持ち、globe はその中で自分の y 軸だけを回る

const tilt = new THREE.Group();
tilt.position.x = 2.2;
tilt.rotation.z = TILT;
scene.add(tilt);

const good = makeGlobe();
tilt.add(good);
makeAxis(tilt);   // 軸は tilt の子。自転しても動かない

[
  { x: -2.2, label: '直に書く ― 軸が円錐を描く' },
  { x: 2.2, label: 'Group で分ける ― 軸が動かない' },
].forEach((panel, index) => {
  const div = document.createElement('div');
  div.textContent = panel.label;
  div.style.cssText =
    'position:absolute; bottom:44px; transform:translateX(-50%);' +
    'color:#e8e8f2; font:12px sans-serif; pointer-events:none; white-space:nowrap;';
  div.style.left = (25 + index * 50) + '%';
  document.body.appendChild(div);
});

// 左の軸が、いま何度ずれているかを出す
const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; bottom:16px; left:50%; transform:translateX(-50%);' +
  'color:#9fb4d8; font:12px ui-monospace, monospace; pointer-events:none;';
document.body.appendChild(readout);

const up = new THREE.Vector3();
const rest = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), TILT);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();

  bad.rotation.y += dt * SPIN;    // 世界の y 軸のまわりの回転。傾きごと回る
  good.rotation.y += dt * SPIN;   // 傾いた座標系の中の y 軸。軸は動かない

  up.set(0, 1, 0).applyEuler(bad.rotation);
  readout.textContent =
    '左の軸の向き ' + up.toArray().map((v) => v.toFixed(3)).join(', ') +
    '（本来の向きから ' + THREE.MathUtils.radToDeg(up.angleTo(rest)).toFixed(1) + ' 度ずれ）';

  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '左のピンクの軸は、円を描いてぐるぐる回ります。下の数字が $0$ から $46.8$ 度のあいだを行き来し、半周ごとに最大になります。右の軸は $1$ ミリも動きません。**違いは `bad.rotation.z` を Mesh に書いたか、`tilt` という Group に書いたかだけ**です。左の `bad.rotation.z = TILT` を消すと軸は動かなくなります ― つまり首振りは「傾きと自転が同じ物体に載っていること」から出ています。',
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '地球儀の台座と、球',
      text: `
地球儀を思い浮かべてください。**台座が傾きを持ち、球が回ります。**

台座を回せば、地軸ごと振り回されます ― これが左です。
球を回せば、傾いたまま自転します ― これが右です。

**\`Group\` は、この台座**です。

three の \`rotation\` が $3$ つの角度を持っているせいで
「$1$ つの物体で $2$ 種類の回転ができる」と錯覚しますが、
できるのは「$1$ つの向きを $3$ つの角度で表す」ことだけです。

**向きは $1$ つしか持てません。$2$ つ要るなら、物体を $2$ つ用意します。**
`,
    },
    {
      kind: 'md',
      text: `
## この先の 4 章

- **[](#/ch/x16-orbit-motion)** … 月の公転。親を回すか、位置を計算するか
- **[](#/ch/x17-pick-drag)** … クリックで選ぶ。ドラッグと区別する
- **[](#/ch/x18-camera-approach)** … 選んだ相手へ、カメラが寄る
- **[](#/ch/x19-labels-finish)** … ラベルを置いて、惑星ビューアーを完成させる
`,
    },
  ],
  exercises: [
    {
      prompt: `左のサンドボックスで、\`bad.rotation.z = TILT\` を \`bad.rotation.x = TILT\` に変えてください。

首振りは直りますか。直らないなら、なぜですか。`,
      hint: '$3$ つの角度は $x \\to y \\to z$ の順に効きます。$x$ は $y$ より先ですか、あとですか。',
      answer: `**直りません。同じように首を振ります。**

**理由**

three の既定の順番では $R = R_x R_y R_z$ です。

$x$ を使っても $z$ を使っても、**$y$ の回転は「世界の $y$ 軸のまわり」のまま**です。

- $R_z$ で倒す → $R_y$ が倒れた軸を振り回す
- $R_x$ で倒す → $R_y$ が倒れた軸を振り回す

**倒す方向が変わるだけ**で、構造はまったく同じです。

**順番を変えれば直るのか**

\`bad.rotation.order = 'YXZ'\` にすると $R = R_y R_x R_z$ になり、
$y$ が**いちばん外側**に来ます。

すると「まず傾けて、そのあと世界の $y$ で回す」がさらにはっきりして、
**首振りは直るどころか、より素直に首を振ります。**

逆の順（$y$ を内側）にしたければ \`'ZXY'\` などが要りますが、
**そこまで考えるくらいなら Group を $1$ 枚置くほうが速く、読みやすい**です。

**教訓**

$3$ つの角度の順番をいじって解決しようとしはじめたら、
それは「**物体を $2$ つに分けるべき合図**」です。

角度の順番の話は[](#/ch/m10-euler)で見たとおり難しく、
しかも半年後の自分が読んで分かりません。`,
    },
    {
      prompt: `雲の層を \`tilt\` の中ではなく、シーンの直下に置いてしまいました。

しばらく見ていると、何がおかしく見えますか。`,
      hint: '雲は赤道に沿って流れているはずです。地表は何度傾いていますか。',
      answer: `**雲だけが、傾いていない赤道に沿って流れます。**

**見え方**

- 地表の赤道は $23.4$ 度傾いている
- 雲の帯は水平のまま流れる

$2$ つの帯が **$23.4$ 度**で交差します。

しかも雲の層は自分の $y$ 軸で回るので、
**傾いた地表の上を、斜めに横切って**いきます。

**気づきにくい理由**

雲は不定形です。「向きがおかしい」と言われるまで気づきません。

はっきり出るのは**極の付近**です。
地表の北極（傾いている）と、雲の渦の中心（傾いていない）が
$23.4$ 度ずれた場所にできます。

**一般則**

**「同じ天体の一部」であるものは、同じ入れ物に入れる。**

この惑星なら、地表・街の明かり・雲は $1$ つの塊です。
大気だけは一様な殻なので、外でも中でも同じ絵になります
― **害はないが、意味もない**ので、どちらでも構いません。

判断の基準は「**傾けたときに一緒に傾くべきか**」です。`,
    },
    {
      prompt: `月に軌道傾斜（軌道面そのものの傾き）を $5$ 度つけたい。

入れ物をいくつ、どう重ねますか。`,
      hint: '公転と、軌道面の傾きは、別の回転です。',
      answer: `**入れ物を $1$ 枚、公転の外側にかぶせます。**

**構造**

\`inclination\`（Group、$z$ を $5$ 度）
　└ \`orbit\`（Group、$y$ を毎フレーム進める）
　　└ \`moon\`（Mesh）

外側から「傾き → 公転 → 月」の順です。

**位置を計算する書き方なら、入れ物は 1 枚で済む**

月の位置を三角関数で直接置くなら、公転用の Group は要りません。

\`inclination\` の中に月を入れ、その中で $(R\\cos a,\\; 0,\\; R\\sin a)$ を計算すれば、
**軌道面ごと $5$ 度傾きます。**

**傾きを式に混ぜてはいけません**

$y$ に $\\sin$ を足して「それらしく」上下させたくなりますが、

$(R\\cos a,\\; h\\sin a,\\; R\\sin a)$

これは**円錐を切った楕円**であって、傾いた円ではありません。
$x$ と $z$ の半径は変わらないのに $y$ だけ増えるので、
**軌道の長さが場所によって変わります。**

見た目には近いのですが、
「等速で回っているのに速さが変わって見える」という形で出てきます。

**傾きは、回転で表す。式に足さない。**`,
    },
  ],
  quiz: [
    {
      q: '傾いた軸のまわりを自転させたいとき、正しい組み立てはどれですか。',
      choices: [
        'Group に傾きを持たせ、その子の Mesh で rotation.y を増やす',
        '同じ Mesh に rotation.z（傾き）と rotation.y（自転）の両方を書く',
        'rotation.order を変えれば、1 つの Mesh で書ける',
        'quaternion を毎フレーム作り直す',
      ],
      answer: 0,
      explain:
        '1 つの物体が持てる向きは 1 つだけです。rotation の 3 つの角度は「1 つの向きを 3 数で表す」ためのもので、2 種類の回転を独立に持たせるものではありません。同じ Mesh に両方書くと、rotation.y が世界の y 軸のまわりに効くので、傾いた軸ごと振り回されます。',
    },
    {
      q: '`planet.rotation.z = 23.4°` と `planet.rotation.y += dt` を両方書くと、自転軸はどう動きますか。',
      choices: [
        '半頂角 23.4 度の円錐をなぞる。半周で 46.8 度ずれる',
        '動かない。正しく自転する',
        '23.4 度から 0 度へ、だんだん立ってくる',
        '一定の速さで倒れていき、やがて横になる',
      ],
      answer: 0,
      explain:
        '上向きの y 成分は 0.9178 のまま変わらないので、傾きの角度そのものは保たれます。動くのは軸の向く方角で、自転が半周する間に 46.8 度 ― 傾きのちょうど 2 倍 ― ずれます。静止画では分からず、動かして初めて見えるたぐいの誤りです。',
    },
    {
      q: 'Group を 1 枚増やす費用はどれくらいですか。',
      choices: [
        '行列が 1 つ増えるだけ。頂点も三角形もドローコールも増えない',
        'ドローコールが 1 回増える',
        '子の頂点がすべて複製される',
        'メモリ使用量が倍になる',
      ],
      answer: 0,
      explain:
        'Group は空の Object3D で、描くものを持ちません。増えるのはワールド行列の計算 1 つだけです。だから「回転を分けたい」と思ったときに Group を挟むのは、ほぼ無料の設計上の選択になります。迷ったら分けるほうが、あとから触れる形になります。',
    },
  ],
};
