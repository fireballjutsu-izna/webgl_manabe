import type { Chapter } from '../types.ts';

export const chapterX37: Chapter = {
  slug: 'x37-car-instancing',
  part: 'project',
  number: 37,
  title: '44 台を 3 回で ― 毎フレーム、行列を書き換える',
  goal: '動くものを $\\mathrm{InstancedMesh}$ で描けるようになり、毎フレーム姿勢を書き換える書き方と、その費用を見積もれるようになります。',
  requires: ['x36-curve-orientation', 'x27-instancing', 'w43-instancing'],
  threeApis: [
    'InstancedMesh',
    'InstancedMesh.setMatrixAt',
    'Object3D.updateMatrix',
    'Object3D.lookAt',
    'InstancedMesh.instanceMatrix',
  ],
  mathRecall: [
    { slug: 'x27-instancing', note: '形を $1$ つ、置き場所を $n$ 個' },
    { slug: '06-matrix', note: '位置と向きを、$1$ つの行列に' },
    { slug: 'w42-draw-calls', note: '回数 × 単価' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 車は、同じ形が大量にある

車を $44$ 台走らせます。$1$ 台は $3$ つの箱でできています（車体・屋根・鼻先）。

素直に $1$ 台ずつ \`Group\` にして \`Mesh\` を $3$ つ入れると、
**$44 \\times 3 = 132$ 回**のドローコールです。

**同じ形が大量にある** ― [](#/ch/x27-instancing)でやった \`InstancedMesh\` の出番です。

車体・屋根・鼻先の $3$ つを、それぞれ $44$ インスタンスの \`InstancedMesh\` にすれば
**$3$ 回**で済みます。
`,
    },
    {
      kind: 'md',
      text: `
## 建物とは、条件が違う

建物のときは「合体か \`InstancedMesh\` か」で合体を選びました。
車では**迷わず \`InstancedMesh\`** です。理由がはっきりしています。

| | 建物 | 車 |
|---|---|---|
| 動くか | 動かない | **毎フレーム動く** |
| 形は同じか | $UV$ が違う | **完全に同じ** |
| 選ぶもの | 合体 | \`InstancedMesh\` |

**動くものは、合体できません。** そして車の形は全部同じなので、
\`InstancedMesh\` の条件をそのまま満たします。

**同じシーンの中で、使い分けるのがふつう**です。
建物は合体、車はインスタンス、地面は単体 ― $1$ つに統一する必要はありません。
`,
    },
    {
      kind: 'md',
      text: `
## 姿勢は、使い捨ての Object3D に作らせる

\`setMatrixAt\` が要求するのは $4\\times4$ の行列です。
位置と向きから行列を組み立てるのは面倒ですが、**three にやらせられます。**

**使い捨ての \`Object3D\` を $1$ つ用意し、そこに位置と向きを作らせて、
できた行列を渡します。**

\`lookAt\` がそのまま使えるので、[](#/ch/x36-curve-orientation)で書いた
「接線を見る」がそっくり通ります。
`,
    },
    {
      kind: 'code',
      title: '毎フレーム、全部の車の行列を書き換える',
      code: `const dummy = new THREE.Object3D();
const lookTarget = new THREE.Vector3();

for (let i = 0; i < cars.length; i++) {
  const car = cars[i];
  car.u = (car.u + dt * car.speed) % 1;

  const position = car.route.getPointAt(car.u);
  const tangent = car.route.getTangentAt(car.u);

  dummy.position.copy(position);
  lookTarget.copy(position).add(tangent);
  dummy.lookAt(lookTarget);
  dummy.updateMatrix();              // position/quaternion から行列を作る

  bodyMesh.setMatrixAt(i, dummy.matrix);
  roofMesh.setMatrixAt(i, dummy.matrix);
}

// 書き換えたら、GPU へ送り直すことを明示する
bodyMesh.instanceMatrix.needsUpdate = true;
roofMesh.instanceMatrix.needsUpdate = true;`,
    },
    {
      kind: 'formula',
      tex: 'W \\;=\\; n_{\\text{car}} \\times n_{\\text{part}} \\times 16',
      readAloud:
        '毎フレーム書き換える浮動小数の個数は、車の台数、部品の数、そして行列の $16$ 個の掛け算です。この数が、$CPU$ から $GPU$ へ毎フレーム送るデータの量になります。',
      worked: {
        given: '車 $44$ 台、部品 $3$ つ（車体・屋根・鼻先）。$60$ フレーム毎秒で走らせます。',
        steps: [
          { calc: 'setMatrixAt の回数' },
          { calc: '  44 x 3 = 132 回 / フレーム' },
          { calc: '書き換える float' },
          { calc: '  132 x 16 = 2112 個' },
          { calc: '  = 8448 バイト = 8.25 KB' },
          { calc: '毎秒では' },
          { calc: '  8.25 x 60 = 495 KB / 秒' },
          { calc: '車のドローコールは 3 回のまま' },
        ],
        result:
          '**毎フレーム $8.25$ キロバイトを送り直しています。** $1$ 秒で $495$ キロバイト ― 転送としては小さい量です。注目してほしいのは、**台数を $10$ 倍にしても、ドローコールは $3$ 回のまま**だということ。増えるのはこの転送量と、$JS$ 側のループ回数だけです。$440$ 台なら $82.5$ KB / フレーム。ここまでは問題なく、**$4400$ 台（$825$ KB / フレーム）あたりから転送が効きはじめます。**',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '動かないインスタンスまで、書き換えないこと',
      text: `
毎フレーム \`setMatrixAt\` を呼ぶのは、**動いているものだけ**にしてください。

止まっている木や街灯を \`InstancedMesh\` で置いた場合、
行列は最初に $1$ 回だけ書けば十分です。

そして \`instanceMatrix.needsUpdate = true\` を毎フレーム立てると、
**中身が同じでも $GPU$ へ送り直されます。**

$10000$ 本の木で毎フレーム $640$ キロバイトを送り直す ―
**何も動いていないのに**、です。

\`needsUpdate\` は「変えたときだけ」。
そのために \`instanceMatrix.setUsage(THREE.StaticDrawUsage)\` を
明示しておくと、意図がコードに残ります。
`,
    },
    {
      kind: 'sandbox',
      title: '台数を変えて、ドローコールと転送量を見る',
      guide: { focus: ['車を InstancedMesh で置く', '毎フレーム、行列を書き換える'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CAR_COUNT = 44;      // 200 や 2000 にしても、車のドローコールは 3 のまま
const LOOPS = 6;           // 経路の数

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x161a26);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 400);
camera.position.set(0, 42, 62);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.495;

scene.add(
  new THREE.HemisphereLight(0x9db8ff, 0x2a2a33, 1.1),
  new THREE.DirectionalLight(0xffe8c4, 1.8).translateY(40).translateZ(20),
);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ color: 0x474b56, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// 経路。街区を囲む矩形を、角だけ丸めた閉じた曲線
const routes = [];
for (let i = 0; i < LOOPS; i++) {
  const cx = (i % 3 - 1) * 34;
  const cz = (Math.floor(i / 3) - 0.5) * 34;
  const w = 12 + (i % 3) * 5;
  const d = 10 + Math.floor(i / 3) * 4;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(cx - w, 0.3, cz - d),
    new THREE.Vector3(cx + w, 0.3, cz - d),
    new THREE.Vector3(cx + w, 0.3, cz + d),
    new THREE.Vector3(cx - w, 0.3, cz + d),
  ], true, 'catmullrom', 0.25);
  routes.push(curve);

  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)),
    new THREE.LineBasicMaterial({ color: 0x39395c }),
  ));
}

/* ---- 車を InstancedMesh で置く ---- */
// 形は 3 つ（車体・屋根・鼻先）。台数がいくつでも、車のドローコールは 3 回

const bodyMesh = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1.6, 0.55, 3.2),
  new THREE.MeshStandardMaterial({ roughness: 0.6 }),
  CAR_COUNT,
);
const roofMesh = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1.4, 0.5, 1.5),
  new THREE.MeshStandardMaterial({ roughness: 0.5 }),
  CAR_COUNT,
);
const noseMesh = new THREE.InstancedMesh(
  new THREE.BoxGeometry(0.4, 0.2, 0.2),
  new THREE.MeshBasicMaterial({ color: 0xfff4d0 }),
  CAR_COUNT,
);
scene.add(bodyMesh, roofMesh, noseMesh);

const rand = makeRandom(31337);
const cars = [];
for (let i = 0; i < CAR_COUNT; i++) {
  const route = routes[i % routes.length];
  const color = new THREE.Color().setHSL(rand(), 0.35, 0.45 + rand() * 0.2);
  bodyMesh.setColorAt(i, color);
  roofMesh.setColorAt(i, color);
  cars.push({ route: route, u: rand(), speed: 0.055 + rand() * 0.04 });
}

/* ---- 毎フレーム、行列を書き換える ---- */
// 使い捨ての Object3D に位置と向きを作らせ、その行列を渡す

const dummy = new THREE.Object3D();
const lookTarget = new THREE.Vector3();
const roofOffset = new THREE.Vector3(0, 0.5, -0.2);

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; bottom:16px; left:16px; color:#9fb4d8;' +
  'font:12px/1.7 ui-monospace, monospace; white-space:pre; pointer-events:none;' +
  'background:rgba(10,12,18,0.78); padding:8px 10px; border-radius:5px;';
document.body.appendChild(readout);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);

  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    car.u = (car.u + dt * car.speed) % 1;

    const position = car.route.getPointAt(car.u);    // 弧長で進む（等速）
    const tangent = car.route.getTangentAt(car.u);

    dummy.position.copy(position);
    lookTarget.copy(position).add(tangent);
    dummy.lookAt(lookTarget);
    dummy.updateMatrix();
    bodyMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.copy(position).add(roofOffset.clone().applyQuaternion(dummy.quaternion));
    dummy.updateMatrix();
    roofMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.copy(position).addScaledVector(tangent, 1.7);
    dummy.updateMatrix();
    noseMesh.setMatrixAt(i, dummy.matrix);
  }

  // 書き換えたら、送り直すことを明示する。忘れると車は止まったまま
  bodyMesh.instanceMatrix.needsUpdate = true;
  roofMesh.instanceMatrix.needsUpdate = true;
  noseMesh.instanceMatrix.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);

  readout.textContent =
    '車 ' + CAR_COUNT + ' 台\\n' +
    'ドローコール ' + renderer.info.render.calls + '\\n' +
    'setMatrixAt ' + (CAR_COUNT * 3) + ' 回 / フレーム\\n' +
    '転送 ' + (CAR_COUNT * 3 * 16 * 4 / 1024).toFixed(2) + ' KB / フレーム';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- 下ごしらえ：決め打ちの乱数 ---- */

function makeRandom(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}`,
      caption:
        '白い鼻先が車の前です。読み出しのドローコール $10$ は、**車の $3$ ＋ 軌道の線 $6$ ＋ 地面 $1$**。**`CAR_COUNT` を $400$ にしてください** ― 車は $10$ 倍になりますが、**この $10$ という数字は $1$ も動きません。**増えるのは転送量（$8.25 \\to 82.5$ KB）と $JS$ のループだけです。`bodyMesh.instanceMatrix.needsUpdate` の行を消すと、位置は毎フレーム計算されているのに**車体だけが止まります**（鼻先は動くので、ずれていく様子が見えます）。',
    },
  ],
  exercises: [
    {
      prompt: `車を $4400$ 台にすると、毎フレームの転送量はいくつになりますか。

そのとき何が起きはじめますか。`,
      hint: '$44$ 台で $8.25$ KB でした。',
      answer: `**$825$ KB / フレーム、毎秒 $48$ メガバイトです。**

**計算**

$4400 \\times 3 \\times 16 \\times 4 = 844{,}800$ バイト $= 825$ KB

$60$ fps なら $48.4$ MB / 秒

**何が効きはじめるか**

- **転送。** $CPU$ から $GPU$ へ毎フレーム $825$ KB を送ります
- **$JS$ のループ。** $13200$ 回の \`setMatrixAt\` と、
  $4400$ 回の \`getPointAt\` ＋ \`getTangentAt\`
- **\`lookAt\` の中の行列演算** も $4400$ 回

$2$ つめと $3$ つめのほうが先に効きます。
**曲線の評価は、行列の書き込みより重い**からです。

**ドローコールは、まだ 3 回**

ここが \`InstancedMesh\` の性質です。$4400$ 台でも命令は $3$ つ。

**詰まるのは描画ではなく、姿勢を作る側**になります。

**そうなったときの手**

- 遠くの車は**更新頻度を落とす**（$2$ フレームに $1$ 回）
- 経路の点を**事前に配列へ焼いて**おき、曲線の評価をやめる
- 画面外の車は**そもそも更新しない**

いずれも「描画を速くする」話ではなく、**$JS$ 側を減らす**話です。`,
    },
    {
      prompt: `止まっている街灯を $2000$ 個、\`InstancedMesh\` で置きました。

毎フレーム \`instanceMatrix.needsUpdate = true\` を立てると何が起きますか。`,
      hint: '中身が同じでも、送り直しは起きますか。',
      answer: `**中身がまったく同じ行列を、毎フレーム $128$ KB 送り直します。**

**計算**

$2000 \\times 16 \\times 4 = 128{,}000$ バイト $= 125$ KB / フレーム

$60$ fps なら **$7.5$ MB / 秒**。

**何も動いていないのに**、です。

**\`needsUpdate\` の意味**

これは「$JS$ 側の配列を変えたので、$GPU$ の複製を作り直してください」という指示です。

**変えていないなら、立てる必要がありません。**

three は中身を比較しません（$2000$ 個の行列を比べるほうが高くつくので、当然です）。
立てられたら、そのまま送ります。

**正しい書き方**

行列を書くのは最初の $1$ 回だけ。そのあと $1$ 度だけ \`needsUpdate = true\`。

さらに \`instanceMatrix.setUsage(THREE.StaticDrawUsage)\` を書いておくと、
**「これは変わらない」という意図が $GPU$ にも、読む人にも伝わります。**

**動くものと動かないものを、分ける**

$1$ つの \`InstancedMesh\` に「動く車」と「止まった車」を混ぜると、
全部を毎フレーム送ることになります。

**別の \`InstancedMesh\` に分ければ、動くほうだけ送れます。**`,
    },
    {
      prompt: `車の色を \`setColorAt\` で個別に付けています。

これを毎フレーム呼ぶ必要はありますか。`,
      hint: '色は時間で変わりますか。',
      answer: `**ありません。最初に $1$ 回だけで十分です。**

**理由**

色は車ごとに決まっていて、時間では変わりません。

\`setColorAt\` を毎フレーム呼ぶと、
**行列と同じ量（$1$ 台あたり $3$ float）を無駄に送り直す**ことになります。

**インスタンスの属性は、独立している**

\`InstancedMesh\` が持つのは、

- \`instanceMatrix\` … 位置・回転・大きさ（$16$ float）
- \`instanceColor\` … 色（$3$ float）

**この $2$ つは別々に \`needsUpdate\` を持ちます。**

だから「行列は毎フレーム、色は最初だけ」ができます。

**もし色を変えたくなったら**

たとえばブレーキランプを光らせたいなら、
\`setColorAt\` を**そのフレームだけ**呼び、
\`instanceColor.needsUpdate = true\` を立てます。

**変えたときだけ立てる** ― 行列とまったく同じ規則です。

**そして \`instanceColor\` は、最初に \`setColorAt\` を呼ぶまで存在しません。**
\`instanceColor.needsUpdate\` を先に触ると \`null\` で落ちるので、
順番に注意してください。`,
    },
  ],
  quiz: [
    {
      q: '44 台の車を 1 台 3 メッシュの Group で描くと何回のドローコールになりますか。InstancedMesh なら？',
      choices: [
        '132 回。InstancedMesh なら 3 回',
        '44 回。InstancedMesh なら 1 回',
        '3 回。InstancedMesh でも 3 回',
        '132 回。InstancedMesh なら 44 回',
      ],
      answer: 0,
      explain:
        '1 台につき 3 つのメッシュがあるので 44 × 3 = 132 回です。InstancedMesh なら部品ごとに 1 回、つまり 3 回で済みます。台数を 10 倍にしてもドローコールは 3 のままで、増えるのは毎フレームの転送量と JS 側のループ回数だけです。',
    },
    {
      q: '毎フレーム `setMatrixAt` で姿勢を書き換えるとき、行列はどうやって作りますか。',
      choices: [
        '使い捨ての Object3D に位置と向きを持たせ、updateMatrix() で作らせて matrix を渡す',
        'Matrix4 の要素を 16 個とも手で書く',
        'setPositionAt と setRotationAt を使う',
        'InstancedMesh が自動で作る',
      ],
      answer: 0,
      explain:
        'Object3D に position と lookAt を使わせれば、曲線の接線から向きを作る書き方がそのまま通ります。updateMatrix() が position と quaternion から 4×4 を組み立ててくれるので、行列の中身を書く必要はありません。1 つの dummy を使い回すので、割り当ても増えません。',
    },
    {
      q: '止まっている 2000 個のインスタンスで、毎フレーム `instanceMatrix.needsUpdate = true` を立てると何が起きますか。',
      choices: [
        '中身が同じ行列を毎フレーム 125 KB 送り直す（60fps で 7.5 MB / 秒）',
        '何も起きない。three が中身を比較して省く',
        'エラーになる',
        '描画が速くなる',
      ],
      answer: 0,
      explain:
        'needsUpdate は「JS 側を変えたので GPU の複製を作り直せ」という指示で、three は中身を比較しません（2000 個の行列を比べるほうが高くつくので当然です）。変えていないなら立てる必要はなく、setUsage(StaticDrawUsage) を書いておくと意図もコードに残ります。動くものと動かないものは、別の InstancedMesh に分けるのが定石です。',
    },
  ],
};
