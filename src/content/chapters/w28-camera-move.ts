import type { Chapter } from '../types.ts';

export const chapterW28: Chapter = {
  slug: 'w28-camera-move',
  part: 'threejs',
  number: 28,
  title: 'カメラを動かす ― 寄る・追う・収める',
  goal: 'カメラを狙った場所へなめらかに動かせるようになり、対象を自動で画面に収められるようになります。',
  requires: ['t07-controls'],
  threeApis: [
    'Box3.setFromObject',
    'Box3.getBoundingSphere',
    'Vector3.setFromSpherical',
    'Spherical.setFromVector3',
    'PerspectiveCamera.fov',
    'Object3D.getWorldPosition',
  ],
  mathRecall: [
    { slug: 'w25-damping', note: 'なめらかな移動は、指数減衰かイージング' },
    { slug: 'm26-perspective', note: '写る高さ $= 2z\\tan(\\text{fov}/2)$。これを $z$ について解く' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## カメラを動かすのは、2 つの値を動かすこと

\`OrbitControls\` を使っているなら、カメラを動かすとは

- **\`camera.position\`** … どこから
- **\`controls.target\`** … 何を

この **2 つを動かすこと**です。片方だけでは、たいてい狙いから外れます。

たとえば「あの椅子に寄る」とき。
\`camera.position\` だけ動かすと、**椅子ではなく元の注視点を見たまま**近づきます。
\`target\` だけ動かすと、遠くから首を振るだけです。

**両方を、同じ進み具合で動かす。** これが基本形です。
`,
    },
    {
      kind: 'code',
      title: 'カメラ移動の基本形',
      code: `import * as THREE from 'three';

const fromPos = new THREE.Vector3();
const toPos = new THREE.Vector3();
const fromTarget = new THREE.Vector3();
const toTarget = new THREE.Vector3();

let elapsed = 0;
const DURATION = 1.2;
let moving = false;

function moveTo(position, target) {
  fromPos.copy(camera.position);
  fromTarget.copy(controls.target);
  toPos.copy(position);
  toTarget.copy(target);
  elapsed = 0;
  moving = true;
}

function update(dt) {
  if (!moving) return;

  elapsed = Math.min(elapsed + dt, DURATION);
  const t = elapsed / DURATION;
  const eased = t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;      // easeInOutCubic

  // 2 つを、同じ進み具合で動かす
  camera.position.lerpVectors(fromPos, toPos, eased);
  controls.target.lerpVectors(fromTarget, toTarget, eased);
  controls.update();                        // これを忘れると反映されない

  if (elapsed >= DURATION) moving = false;
}

// 操作中は自動移動を止める（ユーザーの入力を奪わない）
controls.addEventListener('start', () => { moving = false; });`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'ユーザーが触ったら、自動移動をやめる',
      text: `
カメラを自動で動かしているあいだにユーザーがドラッグすると、
両方が同時にカメラを動かして、ぶるぶる震えます。

controls の start イベントで自動移動を打ち切ってください。

これは「操作を奪わない」という原則の具体形です。
自動演出より、いま触っている人の入力を必ず優先します。
`,
    },
    {
      kind: 'md',
      text: `
## 直線で動かすと、めり込む

$2$ 点を \`lerp\` で結ぶと、カメラは**直線で移動します。**

ところが対象のまわりを回り込みたいとき、直線は**対象の中を通ります。**
建物の反対側へ回るつもりが、壁をすり抜けていく ― かなり見苦しい絵になります。

**解決は、球面座標で補間すること**です。

[](#/ch/t07-controls)でやったとおり、カメラの位置は
「注視点からの距離・仰角・方位角」の $3$ つで表せます。

**この $3$ つを補間すれば、カメラは球面上を回り込みます。**
距離も一定に保たれるので、寄りながら回る動きも自然に作れます。
`,
    },
    {
      kind: 'formula',
      tex: '\\theta_{\\text{lerp}} \\;=\\; \\theta_0 + \\bigl(\\,(\\theta_1 - \\theta_0 + \\pi) \\bmod 2\\pi - \\pi\\,\\bigr) t',
      readAloud:
        '角度の補間です。単純に引き算すると、$350$ 度から $10$ 度へ行くのに $340$ 度ぶん遠回りしてしまいます。差を $-\\pi$ から $\\pi$ の範囲に折り返すと、必ず近いほうを回ります。',
      worked: {
        given:
          '方位角を $\\theta_0 = 170°$ から $\\theta_1 = -170°$ へ動かします。**素直に引き算した場合**と、**折り返した場合**を比べます。',
        steps: [
          { calc: '【素直に引く】' },
          { calc: '  -170 - 170 = -340 度' },
          { calc: '  340 度ぶん、ほぼ一周する' },
          { calc: '【折り返す】差を -180〜180 に入れる' },
          { calc: '  -340 + 360 = 20 度' },
          { calc: '  20 度ぶんだけ回る', note: '近いほう' },
          { calc: '差 : 340 / 20 = 17 倍' },
        ],
        result:
          '**$340$ 度と $20$ 度 ― $17$ 倍**の差です。$170°$ と $-170°$ は**実際には $20$ 度しか離れていません**（$180$ 度をまたいで隣どうし）。素直に引くと、ほぼ一周する遠回りになります。これは[](#/ch/m14-slerp)でクォータニオンの補間について見た「近いほうを回る」とまったく同じ問題です。**角度を補間するときは、必ず折り返しを入れてください。** three には `MathUtils.euclideanModulo` があり、これを使うと簡潔に書けます。',
      },
    },
    {
      kind: 'sandbox',
      title: '直線で動く・球面で回り込む',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 'linear' | 'spherical' の 2 つを試してください
const MODE = 'linear';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(
  new THREE.DirectionalLight(0xffffff, 3).translateY(8).translateZ(6),
  new THREE.HemisphereLight(0x99bbff, 0x332a22, 0.6),
);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({ color: 0x5a6274, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// 真ん中に大きな建物。直線で動くと、この中を通ってしまう
const tower = new THREE.Mesh(
  new THREE.BoxGeometry(4, 6, 4),
  new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.6 }),
);
tower.position.y = 3;
scene.add(tower);

// 向きが分かるように、正面に印を付ける
const mark = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 1.2, 0.2),
  new THREE.MeshStandardMaterial({ color: 0xff6b8a }),
);
mark.position.set(0, 3.5, 2.1);
scene.add(mark);

const TARGET = new THREE.Vector3(0, 3, 0);
controls.target.copy(TARGET);

// 正面と真後ろ。この 2 点を往復する
const A = new THREE.Spherical(14, THREE.MathUtils.degToRad(70), THREE.MathUtils.degToRad(90));
const B = new THREE.Spherical(14, THREE.MathUtils.degToRad(70), THREE.MathUtils.degToRad(-90));

const posA = new THREE.Vector3().setFromSpherical(A).add(TARGET);
const posB = new THREE.Vector3().setFromSpherical(B).add(TARGET);

// 角度の差を -PI 〜 PI に折り返す
function shortestAngle(from, to) {
  return ((to - from + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

const clock = new THREE.Clock();
const tmp = new THREE.Spherical();

renderer.setAnimationLoop(() => {
  const time = clock.getElapsedTime();
  // 0 → 1 → 0 を往復（smoothstep で緩急を付ける）
  const raw = (Math.sin(time * 0.5) + 1) / 2;
  const t = raw * raw * (3 - 2 * raw);

  if (MODE === 'linear') {
    // 2 点を直線で結ぶ。建物の中を通る
    camera.position.lerpVectors(posA, posB, t);
  } else {
    // 球面座標の 3 つを補間する。回り込む
    tmp.radius = THREE.MathUtils.lerp(A.radius, B.radius, t);
    tmp.phi = THREE.MathUtils.lerp(A.phi, B.phi, t);
    tmp.theta = A.theta + shortestAngle(A.theta, B.theta) * t;
    camera.position.setFromSpherical(tmp).add(TARGET);
  }

  controls.target.copy(TARGET);
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**`linear` では、カメラが建物の中を突き抜けます。** 途中で画面が黄色く埋まるのがそれです（箱の内側にいます）。**`spherical` では、建物のまわりをきれいに回り込みます。** 距離が一定に保たれるからです。ピンクの印で、いま正面のどちら側にいるかが分かります。',
    },
    {
      kind: 'md',
      text: `
## 対象を画面に収める ― フレーミング

読み込んだモデルを、**自動で画面いっぱいに収めたい。**

これは[](#/ch/t01-first-scene)でやった計算の逆算です。

$$\\text{写る高さ} = 2z\\tan(\\text{fov}/2)$$

を $z$ について解けば、「この大きさのものを収めるには、どれだけ離れればよいか」が出ます。

**手順は 4 つ。**

1. **\`Box3\` で対象を囲む**（[](#/ch/w04-blank-screen)で使った道具）
2. **外接球の半径を出す** … どの向きから見ても収まる大きさ
3. **必要な距離を計算する** … $z = r / \\sin(\\text{fov}/2)$
4. **好きな向きから、その距離に置く**

**横も考える必要があります。** 縦長の画面では、横のほうが先にはみ出します。
$\\text{fov}$ は縦方向の画角なので、\`aspect < 1\` のときは横に合わせて距離を増やします。
`,
    },
    {
      kind: 'code',
      title: '対象を画面に収める',
      code: `import * as THREE from 'three';

function frameObject(object, camera, controls, options = {}) {
  const { margin = 1.2, phi = 65, theta = 35 } = options;

  // 1. 対象を囲む
  const box = new THREE.Box3().setFromObject(object);
  const sphere = box.getBoundingSphere(new THREE.Sphere());

  // 2. 縦に収まる距離
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  let distance = sphere.radius / Math.sin(vFov / 2);

  // 3. 横に収まる距離（縦長の画面では、こちらが効く）
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  distance = Math.max(distance, sphere.radius / Math.sin(hFov / 2));

  distance *= margin;               // 少し余裕を持たせる

  // 4. その距離に置く
  const s = new THREE.Spherical(
    distance,
    THREE.MathUtils.degToRad(phi),
    THREE.MathUtils.degToRad(theta),
  );
  camera.position.setFromSpherical(s).add(sphere.center);
  controls.target.copy(sphere.center);

  // near / far も、この大きさに合わせて詰める
  camera.near = distance / 100;
  camera.far = distance * 10;
  camera.updateProjectionMatrix();

  controls.minDistance = sphere.radius * 1.2;
  controls.maxDistance = distance * 3;
  controls.update();
}

// 読み込んだモデルに対して、そのまま呼べる
frameObject(model, camera, controls);`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'near と far も、対象の大きさから決める',
      text: `
[](#/ch/m27-frustum) でやったとおり、深度の精度は near で決まります。

対象の大きさに関係なく near = 0.1 と書いていると、
巨大なモデルでは精度が足りず、面がちらつきます（Z ファイティング）。

フレーミングと同時に near / far も決めてしまうのが確実です。
目安は near = 距離 / 100、far = 距離 x 10。

読み込むモデルの大きさが分からないビューアーでは、これが必須になります。
`,
    },
    {
      kind: 'md',
      text: `
## 追いかけるカメラ

主人公について回るカメラは、**追従**（[](#/ch/w25-damping)）そのものです。

- **目標の位置** … 主人公の位置 ＋ 決まったオフセット
- **目標の注視点** … 主人公の位置（少し上）

この $2$ つを、指数減衰で毎フレーム寄せます。

**大事なのは、遅らせること。**

主人公にぴったり追従させると、**画面全体が主人公と一緒に動く**ので、
動いている感じがまったく出ません。むしろ酔います。

**わざと遅らせる**と、主人公が画面の中で少し先へ進み、
カメラがあとから付いてくる ― これで「走っている」感じが出ます。

$\\lambda$ は $2$〜$5$ くらい。位置と注視点で**別の $\\lambda$** にすると、さらに良くなります。
`,
    },
    {
      kind: 'code',
      title: '主人公を追いかける',
      code: `import * as THREE from 'three';

const OFFSET = new THREE.Vector3(0, 4, 8);     // 主人公から見た、カメラの位置
const LOOK_UP = new THREE.Vector3(0, 1.4, 0);  // 足元ではなく、少し上を見る

const wantPos = new THREE.Vector3();
const wantTarget = new THREE.Vector3();

const LAMBDA_POS = 3;      // 位置はゆっくり追う（遅れが「速さ」に見える）
const LAMBDA_LOOK = 6;     // 注視点は速く追う（見失わない）

function updateCamera(dt) {
  // 主人公の向きに合わせてオフセットを回すと、背後から追う形になる
  wantPos.copy(OFFSET).applyQuaternion(player.quaternion).add(player.position);
  wantTarget.copy(player.position).add(LOOK_UP);

  camera.position.lerp(wantPos, 1 - Math.exp(-LAMBDA_POS * dt));
  controls.target.lerp(wantTarget, 1 - Math.exp(-LAMBDA_LOOK * dt));
  controls.update();
}

// 速く動いているときだけ引く、という手もある
const speed = player.userData.velocity.length();
OFFSET.setZ(8 + speed * 0.4);       // 速いほど引いて、疾走感を出す`,
    },
  ],
  exercises: [
    {
      prompt: `方位角を $\\theta_0 = -160°$ から $\\theta_1 = 150°$ へ動かします。
**素直に引き算**すると何度ぶん回りますか。**折り返す**と何度ですか。
そして、どちら向きに回りますか。`,
      hint: '差を $-180°$ 〜 $180°$ に入れます。',
      answer: `**素直なら $310°$、折り返せば $-50°$。折り返すと「負の向き」に回ります。**

**素直に引く**

$150 - (-160) = 310°$

正の向き（反時計回り）に $310$ 度、ほぼ一周します。

**折り返す**

$310 - 360 = -50°$

$-180 \\le -50 \\le 180$ なので、これが答えです。

**負の向き**（時計回り）に $50$ 度だけ回ります。

**$6.2$ 倍の差。** しかも向きが逆です。

**なぜこうなるか**

$-160°$ と $150°$ は、$180°$ の線をまたいで**隣どうし**です。

$-160°$ から $-180°$ まで $20$ 度、
$-180°$ と $180°$ は同じ場所、
$180°$ から $150°$ まで $30$ 度。**合計 $50$ 度。**

角度は**円をぐるりと回って戻ってくる量**なので、
$-160°$ と $200°$ は同じ場所を指します。
だから引き算だけでは「どちら回りが近いか」が決まりません。

**折り返しの式**

$\\Delta = ((\\theta_1 - \\theta_0 + 180) \\bmod 360) - 180$

$+180$ してから $\\bmod$ し、$-180$ で戻す。これで必ず $-180 \\sim 180$ に入ります。

**JavaScript の注意** … \`%\` は負の数に対して負を返すので、
そのままでは正しく動きません。$+360$ してからもう一度 $\\bmod$ するか、
\`THREE.MathUtils.euclideanModulo\` を使ってください。

**同じ問題は[](#/ch/m14-slerp)でも出てきました。**
クォータニオンの補間でも「近いほうを回る」ために内積の符号を見ています。
**周期を持つものの補間には、必ずこの手当てが要ります。**`,
      answerCode: `import * as THREE from 'three';

// 差を -PI 〜 PI に折り返す
function shortestAngle(from, to) {
  const d = THREE.MathUtils.euclideanModulo(to - from + Math.PI, Math.PI * 2) - Math.PI;
  return d;
}

// 使い方
const theta = A.theta + shortestAngle(A.theta, B.theta) * t;

// 自前で書くなら（euclideanModulo を使わない場合）
function shortest(from, to) {
  return ((to - from + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}`,
    },
    {
      prompt: `画角 $50°$ のカメラで、**外接球の半径が $3$** のモデルを画面に収めたい。
**必要な距離**を求めてください。画面が縦長（$\\text{aspect} = 0.6$）のときは、いくつになりますか。`,
      hint: '$z = r / \\sin(\\text{fov}/2)$。横の画角は $2\\arctan(\\tan(\\text{fov}/2) \\cdot \\text{aspect})$ です。',
      answer: `**縦なら $7.10$、縦長の画面では $11.36$ が要ります。**

**縦に収める距離**

$\\sin(25°) = 0.4226$

$z = 3 / 0.4226 = 7.10$

**横の画角**

$\\tan(25°) = 0.4663$

$\\tan(h/2) = 0.4663 \\times 0.6 = 0.2798$

$h/2 = \\arctan(0.2798) = 15.63° = 0.2728$ ラジアン

**横の画角は $31.3°$** ― 縦の $50°$ よりずっと狭い。

**横に収める距離**

$\\sin(15.63°) = 0.2694$

$z = 3 / 0.2694 = 11.14$

**大きいほうを取る**

$\\max(7.10,\\; 11.14) = 11.14$

**余裕を $1.2$ 倍**見るなら $13.4$。

**何が起きているか**

縦長の画面では、**横のほうが先にはみ出します。**
$\\text{fov}$ は**縦方向の画角**なので、縦だけで計算すると横が切れます。

$7.10$ に置くと、横方向には $2 \\times 7.10 \\times \\tan(15.63°) = 3.97$ しか写りません。
直径 $6$ のモデルは**左右が切れます。**

**スマートフォンの縦持ちは $\\text{aspect} \\approx 0.46$** なので、
さらに厳しくなります。$z = 14.3$ 必要です。

**だから、必ず両方を計算して大きいほうを取る。**
「PC では収まっていたのに、スマホで切れる」の原因がこれです。

**リサイズのたびに計算し直す**必要もあります。
$\\text{aspect}$ が変われば、必要な距離も変わるからです。`,
      answerCode: `import * as THREE from 'three';

function fitDistance(radius, camera, margin = 1.2) {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);

  const forVertical = radius / Math.sin(vFov / 2);
  const forHorizontal = radius / Math.sin(hFov / 2);

  return Math.max(forVertical, forHorizontal) * margin;
}

// リサイズのたびに計算し直す
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  const need = fitDistance(sphere.radius, camera);
  controls.minDistance = sphere.radius * 1.2;
  controls.maxDistance = need * 3;
});`,
    },
    {
      prompt: `主人公を追いかけるカメラを、\`camera.position.copy(player.position).add(offset)\` と
**毎フレームぴったり**追従させました。**何が問題ですか。**`,
      hint: '画面の中で、主人公はどこにいますか。',
      answer: `**主人公が画面の中でまったく動かないので、動いている感じが出ません。**

ぴったり追従すると、**主人公は常に画面の同じ位置**にいます。

動いているのは背景だけ。しかも背景が主人公と逆向きに滑るので、
**主人公が走っているのか、世界が動いているのか分かりません。**

さらに悪いことに、**カメラが主人公の動きをそのまま拾います。**
歩くたびの上下動、方向転換のたびの急な回転 ―
これが画面全体を揺らし、**かなり酔います。**

**直し方 ― わざと遅らせる**

[](#/ch/w25-damping)の指数減衰で追います。

$\\lambda = 3$ くらいにすると、主人公が動き出してから
カメラが付いてくるまでに、わずかな遅れが生まれます。

**その遅れのあいだ、主人公は画面の中で前へ進みます。**
これが「走っている」という感覚を作ります。

同時に、細かい上下動が**減衰で吸収されます。** 酔いが消えます。

**さらに良くする 3 つ**

**1. 位置と注視点で $\\lambda$ を変える**

位置は $\\lambda = 3$（ゆっくり）、注視点は $\\lambda = 6$（速く）。
カメラは遅れて付いてくるが、主人公は見失わない。

**2. 速さでオフセットを変える**

速く動いているときほど引く。疾走感が出ます。

**3. 注視点を少し上に**

足元を見ると、画面の下半分が地面になります。
主人公の胸のあたり（$+1.4$ くらい）を見るのが自然です。

**「ぴったり合わせない」のは、カメラ全般の原則**です。
UI ではぴったりが正解でも、カメラでは遅れが表現になります。`,
    },
  ],
  quiz: [
    {
      q: '対象のまわりを回り込むカメラ移動で、2 点を `lerp` で結ぶと何が起きますか。',
      choices: [
        '直線で移動するので、対象の中を突き抜けることがある',
        '距離が保たれる',
        '必ず近いほうを回る',
        '何も問題はない',
      ],
      answer: 0,
      explain:
        '球面座標の 3 つ（距離・仰角・方位角）を補間すれば、球面上を回り込みます。距離が一定に保たれるので、寄りながら回る動きも自然に作れます。',
    },
    {
      q: '方位角を $170°$ から $-170°$ へ補間します。折り返しを入れないとどうなりますか。',
      choices: [
        '$340$ 度ぶん、ほぼ一周する遠回りになる',
        '$20$ 度だけ回る',
        'エラーになる',
        '動かない',
      ],
      answer: 0,
      explain:
        '$170°$ と $-170°$ は $180$ 度をまたいで隣どうしで、実際には 20 度しか離れていません。差を $-\\pi$〜$\\pi$ に折り返すと、必ず近いほうを回ります。slerp が内積の符号を見るのと同じ手当てです。',
    },
    {
      q: '縦長の画面（aspect < 1）でモデルを収めるとき、縦の画角だけで距離を計算すると何が起きますか。',
      choices: [
        '横がはみ出して切れる',
        '縦が切れる',
        '小さく写りすぎる',
        '問題ない',
      ],
      answer: 0,
      explain:
        '`fov` は縦方向の画角です。縦長の画面では横の画角のほうが狭いので、横が先にはみ出します。両方を計算して大きいほうを取ってください。「PC では収まるのにスマホで切れる」の原因です。',
    },
  ],
};
