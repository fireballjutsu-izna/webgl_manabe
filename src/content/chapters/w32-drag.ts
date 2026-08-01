import type { Chapter } from '../types.ts';

export const chapterW32: Chapter = {
  slug: 'w32-drag',
  part: 'threejs',
  number: 32,
  title: 'ドラッグ ― 平面との交点',
  goal: '光線と平面の交点で物体を引きずれるようになり、つかんだ点がずれない実装が書けるようになります。',
  requires: ['w31-hover-click', 'b28-projection'],
  threeApis: [
    'Plane',
    'Plane.setFromNormalAndCoplanarPoint',
    'Ray.intersectPlane',
    'Raycaster.ray',
    'Camera.getWorldDirection',
    'Object3D.worldToLocal',
  ],
  mathRecall: [
    { slug: 'b28-projection', note: '平面の式 $\\mathbf{n}\\cdot\\mathbf{p} + d = 0$ は、内積そのもの' },
    { slug: '03-dot', note: '交点は「光線の向きと法線の内積」で求まる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 光線だけでは、位置が決まらない

「物体をマウスで引きずる」を作ろうとすると、すぐに壁にぶつかります。

光線は**線**です。その線上のどこに物体を置けばよいのか、決まりません。
手前でも奥でも、線の上ならどこでも「マウスの下」だからです。

**足りないのは、もう 1 つの制約。**

いちばん素直なのが「**この平面の上を動く**」という制約です。
線と平面が交われば、**交点はただ 1 点**に決まります。

- **床の上を滑らせる** … $y = 0$ の平面
- **カメラに正対したまま動かす** … 視線に垂直な平面
- **壁に沿って動かす** … その壁の平面
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '影を動かしている',
      text: `
太陽（カメラ）から棒（光線）を伸ばし、その先が地面に触れたところを見る。

棒の向きを変えれば、地面の上の点が動きます。
棒の長さは関係ありません ― 地面に届いたところが答えだからです。

平面を床から壁に変えれば、こんどは壁の上を動きます。
「どの面に映すか」を決めるのが Plane です。
`,
    },
    {
      kind: 'md',
      text: `
## 平面の表し方

three の \`Plane\` は、**法線 $\\mathbf{n}$ と定数 $d$** の 2 つで平面を表します。

$$\\mathbf{n} \\cdot \\mathbf{p} + d = 0$$

[](#/ch/b28-projection)でやった内積そのものです。
「法線と点の内積が $-d$ になる点の集まり」が、その平面です。

**$d$ の符号が直感に反します。**

$y = 0.5$ の水平面（上向きの法線 $(0,1,0)$）を作りたいとき、

$(0,1,0) \\cdot (x, 0.5, z) + d = 0.5 + d = 0$

なので **$d = -0.5$**。「$0.5$ 上げる」なのに $-0.5$ です。

**符号で迷いたくないなら**、\`setFromNormalAndCoplanarPoint\` を使ってください。
「この向きで、この点を通る平面」と書けます。
`,
    },
    {
      kind: 'formula',
      tex: 't \\;=\\; -\\,\\frac{\\mathbf{n}\\cdot\\mathbf{o} + d}{\\mathbf{n}\\cdot\\mathbf{v}}, \\qquad \\mathbf{p} = \\mathbf{o} + t\\,\\mathbf{v}',
      readAloud:
        '光線と平面の交点です。起点 $\\mathbf{o}$ から向き $\\mathbf{v}$ へ $t$ だけ進んだところが交点になります。分母が 0 に近いとき、つまり光線が平面と平行なときは交点がありません。',
      worked: {
        given:
          'カメラ $\\mathbf{o} = (0,\\,4,\\,6)$ から向き $\\mathbf{v} = (0,\\,-0.5,\\,-0.866)$ へ光線を飛ばし、**$y = 0.5$ の平面**（$\\mathbf{n} = (0,1,0)$、$d = -0.5$）との交点を求めます。',
        steps: [
          { calc: 'n·o = 0x0 + 1x4 + 0x6 = 4' },
          { calc: 'n·v = 0x0 + 1x(-0.5) + 0x(-0.866) = -0.5' },
          { calc: 't = -(4 + (-0.5)) / (-0.5)' },
          { calc: '  = -3.5 / -0.5 = 7' },
          { calc: 'p = (0,4,6) + 7 x (0,-0.5,-0.866)' },
          { calc: '  = (0, 4-3.5, 6-6.062)' },
          { calc: '  = (0, 0.5, -0.062)', note: 'y が 0.5 ＝ 確かに平面上' },
        ],
        result:
          '**$(0,\\; 0.5,\\; -0.062)$** です。$y$ がぴったり $0.5$ になっているので、確かに平面の上です。**分母の $\\mathbf{n}\\cdot\\mathbf{v} = -0.5$ に注目してください。** これは光線が平面をどれだけ斜めに貫くかを表しています。**視線が水平に近づくと $0$ に近づき、$t$ が発散します** ― 交点が無限に遠くへ飛ぶ、つまり**画面の端で物体が飛んでいく**のがこれです。だから床の平面を使うドラッグでは、**視線が水平に近い角度を禁止する**（\\`maxPolarAngle\\` で制限する）のが実務の作法です。',
      },
    },
    {
      kind: 'sandbox',
      title: '床の上を引きずる ― つかんだ点がずれない',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// false にすると、つかんだ位置に関係なく中心が吸い付きます
const KEEP_OFFSET = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 6, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const canvas = renderer.domElement;
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.maxPolarAngle = Math.PI / 2.2;   // 水平まで倒させない（交点が飛ぶため）

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(4, 8, 5);
sun.castShadow = true;
const sc = sun.shadow.camera;
sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 25;
sc.updateProjectionMatrix();
sun.shadow.normalBias = 0.03;
scene.add(sun, new THREE.HemisphereLight(0x99bbff, 0x332a22, 0.6));

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 18),
  new THREE.MeshStandardMaterial({ color: 0x6b7386, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

scene.add(new THREE.GridHelper(18, 18, 0x3a3a5c, 0x26263c));

// 引きずる対象。半径 0.7 なので、中心は y = 0.7 に乗る
const R = 0.7;
const pieces = [];
for (let i = 0; i < 4; i++) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(R, 32, 20),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(i * 0.19, 0.7, 0.55),
      roughness: 0.4,
    }),
  );
  mesh.position.set((i - 1.5) * 2.4, R, 0);
  mesh.castShadow = true;
  scene.add(mesh);
  pieces.push(mesh);
}

// 「球の中心が乗る面」。setFromNormalAndCoplanarPoint なら符号で迷わない
const dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, R, 0),
);
console.log('平面の法線', dragPlane.normal, '/ 定数 d', dragPlane.constant);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const hitPoint = new THREE.Vector3();
const grabOffset = new THREE.Vector3();

let dragging = null;

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

canvas.addEventListener('pointerdown', (event) => {
  updatePointer(event);
  const hits = raycaster.intersectObjects(pieces, false);
  if (hits.length === 0) return;

  dragging = hits[0].object;
  controls.enabled = false;              // 視点操作と取り合わない
  canvas.setPointerCapture(event.pointerId);

  // つかんだ瞬間の「中心とカーソルのずれ」を覚えておく
  if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
    grabOffset.copy(dragging.position).sub(hitPoint);
  }
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging) {
    updatePointer(event);
    const over = raycaster.intersectObjects(pieces, false).length > 0;
    canvas.style.cursor = over ? 'grab' : 'default';
    return;
  }

  updatePointer(event);
  // 交点が無い（光線が平面と平行）なら、何もしない
  if (!raycaster.ray.intersectPlane(dragPlane, hitPoint)) return;

  dragging.position.copy(hitPoint);
  if (KEEP_OFFSET) dragging.position.add(grabOffset);

  // 床からはみ出さないようにする
  dragging.position.x = THREE.MathUtils.clamp(dragging.position.x, -8, 8);
  dragging.position.z = THREE.MathUtils.clamp(dragging.position.z, -8, 8);
  dragging.position.y = R;
});

function endDrag(event) {
  if (!dragging) return;
  dragging = null;
  controls.enabled = true;
  canvas.releasePointerCapture?.(event.pointerId);
  canvas.style.cursor = 'grab';
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

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
        '**球の端をつかんで動かしてみてください。** `KEEP_OFFSET` が `true` なら、つかんだ点とカーソルの関係が保たれます。**`false` にすると、つかんだ瞬間に球の中心がカーソルへ吸い付きます** ― 少しの差ですが、手ざわりがはっきり違います。ドラッグ中は視点が回りません（`controls.enabled = false`）。',
    },
    {
      kind: 'md',
      text: `
## つかんだ点を、覚えておく

上のコードでいちばん大事なのが \`grabOffset\` です。

**つかんだ瞬間に「物体の中心と、カーソルの当たった点のずれ」を記録**し、
以後はそのずれを足し続けます。

これが無いと、**つかんだ瞬間に物体の中心がカーソルへ飛びます。**

球の端をつまんだつもりなのに、中心が指の下へ吸い付く ―
$1$ フレームで起きるので「がくっ」と見えます。

**$3$ 行で済む手当てなので、必ず入れてください。** 手ざわりが目に見えて変わります。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'ドラッグ中は、視点操作を止める',
      text: `
controls.enabled = false を忘れると、
ドラッグと視点の回転が同時に走ります。

物体を動かそうとしているのにカメラも回るので、
どこへ動かしているのか分からなくなります。

pointerdown で false、pointerup で true。必ず対で書いてください。

setPointerCapture も入れておくと、
カーソルがキャンバスの外へ出てもドラッグが続きます。
外で指を離しても pointerup が届くので、掴んだままにならずに済みます。
`,
    },
    {
      kind: 'md',
      text: `
## 平面を、場面ごとに選ぶ

**A. 床（水平面）**

いちばん多い形。$y$ が固定されるので、俯瞰視点の配置に向きます。

**弱点は、視線が水平に近いとき。** 上の計算例で見たとおり、
$\\mathbf{n}\\cdot\\mathbf{v}$ が $0$ に近づいて交点が無限遠へ飛びます。
\`maxPolarAngle\` で水平近くを禁止してください。

**B. カメラに正対する平面**

「画面の中で動かす」感覚になります。視線に垂直なので、**交点が飛びません。**

つかんだ物体の位置を通り、法線がカメラの向きの平面を、
**つかむたびに作り直す**のが定石です。

**C. 物体の面に沿う平面**

壁に貼ったものを壁沿いに動かす、といった場合。
\`hits[0].face.normal\` から作れます（[](#/ch/t08-raycaster)の法線行列で
ワールドへ直してから）。
`,
    },
    {
      kind: 'code',
      title: '3 種類の平面',
      code: `import * as THREE from 'three';

// A. 床。y = h に固定
const floorPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, 0.7, 0),
);

// B. カメラに正対。つかむたびに作り直す
const camDir = new THREE.Vector3();
function makeCameraPlane(camera, throughPoint) {
  camera.getWorldDirection(camDir);
  return new THREE.Plane().setFromNormalAndCoplanarPoint(camDir.negate(), throughPoint);
}

// C. 当たった面に沿う
function makeSurfacePlane(hit) {
  const nm = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
  const n = hit.face.normal.clone().applyMatrix3(nm).normalize();
  return new THREE.Plane().setFromNormalAndCoplanarPoint(n, hit.point);
}

// 交点が無いことがある。戻り値を必ず見る
const point = new THREE.Vector3();
if (raycaster.ray.intersectPlane(plane, point)) {
  target.position.copy(point).add(grabOffset);
}
// intersectPlane は交点が無ければ null を返し、point は書き換えられない`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '置ける場所を、制限する',
      text: `
交点はどこまでも遠くへ行けるので、そのままだと物体が床の外や画面外へ飛びます。

clamp で範囲を切ってください。

さらに一歩進めるなら、格子に吸い付かせる（スナップ）と操作が楽になります。
Math.round(x / 0.5) * 0.5 で 0.5 刻みに揃います。

配置ツールでは、これがあるかどうかで使い勝手が大きく変わります。
`,
    },
  ],
  exercises: [
    {
      prompt: `カメラ $\\mathbf{o} = (0,\\,5,\\,5)$ から向き $\\mathbf{v} = (0,\\,-0.6,\\,-0.8)$ の光線を、
**$y = 1$ の平面**へ飛ばします。交点を求めてください。`,
      hint: '$t = -(\\mathbf{n}\\cdot\\mathbf{o} + d) / (\\mathbf{n}\\cdot\\mathbf{v})$ です。$y = 1$ の平面なら $d = -1$。',
      answer: `**$(0,\\; 1,\\; -0.333)$** です。

**平面**

$y = 1$、法線 $(0,1,0)$ なので $d = -1$
（$\\mathbf{n}\\cdot\\mathbf{p} + d = 1 - 1 = 0$ を確かめてください）。

**分子**

$\\mathbf{n}\\cdot\\mathbf{o} = 0 \\times 0 + 1 \\times 5 + 0 \\times 5 = 5$

$\\mathbf{n}\\cdot\\mathbf{o} + d = 5 - 1 = 4$

**分母**

$\\mathbf{n}\\cdot\\mathbf{v} = 0 \\times 0 + 1 \\times (-0.6) + 0 \\times (-0.8) = -0.6$

**$t$**

$t = -\\dfrac{4}{-0.6} = 6.667$

**交点**

$\\mathbf{p} = (0,5,5) + 6.667 \\times (0,\\,-0.6,\\,-0.8)$

$= (0,\\;\\; 5 - 4.0,\\;\\; 5 - 5.333) = (0,\\; 1,\\; -0.333)$

**$y$ がぴったり $1$。** 平面の上です。

**分母の意味を確かめておいてください。**

$\\mathbf{n}\\cdot\\mathbf{v} = -0.6$ は「光線が平面をどれだけ斜めに貫くか」です。

- **$-1$ に近い** … 真上から垂直に刺す。$t$ が安定する
- **$0$ に近い** … 平面をかすめる。**$t$ が発散する**

もし $\\mathbf{v} = (0,\\,-0.05,\\,-0.999)$（ほぼ水平）なら
$t = -4 / -0.05 = 80$ ― **交点が $80$ も先**になります。
カメラの高さがわずかに変わるだけで、交点が何十単位も動く。

**これが「画面の端で物体が飛んでいく」の正体**です。`,
    },
    {
      prompt: `ドラッグのサンドボックスで \`KEEP_OFFSET\` を \`false\` にしてください。
**球の端をつかんだとき**、何が起きますか。**なぜ**でしょう。`,
      hint: '`hitPoint` は、球のどこですか。',
      answer: `**つかんだ瞬間に、球の中心がカーソルの下へ飛びます。**

**なぜか**

\`hitPoint\` は「光線と**平面**の交点」です。球の表面ではありません。

球の端をつかんだとき、カーソルの下の平面上の点は、
**球の中心から $0.7$ ほど離れたところ**にあります。

\`dragging.position.copy(hitPoint)\` と書くと、**中心をそこへ移す**ことになります。
つまり、つかんだ位置ぶんだけ球がずれる ― $1$ フレームで「がくっ」と動きます。

**\`grabOffset\` が直すもの**

つかんだ瞬間に

$\\text{offset} = \\text{球の中心} - \\text{カーソル下の平面上の点}$

を記録し、以後は毎回それを足します。

$\\text{新しい中心} = \\text{新しい交点} + \\text{offset}$

**つかんだ点とカーソルの関係が保たれる**ので、
「その場所をつまんで動かしている」感覚になります。

**差はわずかですが、手ざわりははっきり違います。**

半径 $0.7$ の球なら最大 $0.7$ のずれ。画面上では数十ピクセルです。
**大きなものを扱うほど、この差は致命的**になります。

**同じ手当てが要る場面**

- 2D の UI をドラッグするとき（同じ理屈）
- カメラを掴んで動かすとき（\`OrbitControls\` の pan がまさにこれをやっています）
- スライダーのつまみ

**「つかんだ点を覚える」は、ドラッグ全般の定石**だと考えてください。`,
    },
    {
      prompt: `床の平面（$y$ 固定）でドラッグしていると、**視点を水平近くまで倒したときに
物体が突然遠くへ飛びます。** なぜですか。**2 つの対策**を挙げてください。`,
      hint: '交点の式の分母を見てください。',
      answer: `**$\\mathbf{n}\\cdot\\mathbf{v}$ が $0$ に近づき、$t$ が発散するからです。**

$$t = -\\frac{\\mathbf{n}\\cdot\\mathbf{o} + d}{\\mathbf{n}\\cdot\\mathbf{v}}$$

分母 $\\mathbf{n}\\cdot\\mathbf{v}$ は、光線が平面をどれだけ斜めに貫くかを表します。

視線が水平に近づくと、床の法線 $(0,1,0)$ との内積は $0$ に近づきます。

- $\\mathbf{n}\\cdot\\mathbf{v} = -0.5$ → $t = 7$
- $\\mathbf{n}\\cdot\\mathbf{v} = -0.05$ → $t = 70$
- $\\mathbf{n}\\cdot\\mathbf{v} = -0.005$ → $t = 700$

**カーソルを 1 ピクセル動かしただけで、交点が何十単位も動きます。**

そして完全に水平（$\\mathbf{n}\\cdot\\mathbf{v} = 0$）になると、
光線は平面と**平行**なので交点がありません。
\`intersectPlane\` は \`null\` を返します。

**対策 1 ― 視点の角度を制限する**

\`controls.maxPolarAngle = Math.PI / 2.2\` くらい。
水平より手前で止めれば、$\\mathbf{n}\\cdot\\mathbf{v}$ が $0$ に近づきません。

**これがいちばん確実**で、しかも[](#/ch/t07-controls)でやったとおり
「地面に潜らせない」ためにも必要な設定です。

**対策 2 ― カメラに正対する平面を使う**

法線をカメラの向きにすれば、$\\mathbf{n}\\cdot\\mathbf{v} \\approx -1$ で**常に安定**します。

視線に垂直なので、原理的に平行になりません。
「画面の中で動かす」感覚になり、$y$ は固定されなくなります。

**用途で選んでください。** 床に配置するなら 1、自由に動かすなら 2。

**対策 3（併用）** … 戻り値を必ず見る。
\`if (!ray.intersectPlane(plane, point)) return;\` の 1 行で、
交点が無い瞬間に暴れるのを防げます。**これは常に書いてください。**`,
      answerCode: `import * as THREE from 'three';

// 1. 視点を水平まで倒させない
controls.maxPolarAngle = Math.PI / 2.2;

// 2. カメラに正対する平面（つかむたびに作り直す）
const camDir = new THREE.Vector3();
function makeCameraPlane(throughPoint) {
  camera.getWorldDirection(camDir);
  return new THREE.Plane().setFromNormalAndCoplanarPoint(camDir.clone().negate(), throughPoint);
}

// 3. 交点が無い瞬間は、何もしない
if (!raycaster.ray.intersectPlane(dragPlane, hitPoint)) return;`,
    },
  ],
  quiz: [
    {
      q: '物体をマウスで引きずるとき、光線だけでは位置が決まりません。何を足しますか。',
      choices: [
        '動かす面（平面）を決めて、光線との交点を使う',
        'カメラの距離を固定する',
        '物体の大きさを固定する',
        'フレームレートを固定する',
      ],
      answer: 0,
      explain:
        '光線は線なので、その上のどこに置くかが決まりません。「この平面の上を動く」と決めれば交点が 1 つに定まります。`Ray.intersectPlane()` で求められます。',
    },
    {
      q: 'つかんだ瞬間に物体の中心がカーソルへ飛びます。どう直しますか。',
      choices: [
        'つかんだ瞬間の「中心と交点のずれ」を記録し、以後それを足す',
        '`intersectPlane` を毎フレーム呼ばない',
        '`controls.enabled = false` にする',
        '平面を作り直す',
      ],
      answer: 0,
      explain:
        '交点は「平面上の点」であって「つかんだ表面の点」ではありません。3 行の手当てですが、手ざわりが目に見えて変わります。ドラッグ全般の定石です。',
    },
    {
      q: '床の平面でドラッグ中、視点を水平近くまで倒すと物体が遠くへ飛びます。原因はどれですか。',
      choices: [
        '法線と光線の向きの内積が 0 に近づき、交点までの距離が発散するから',
        '浮動小数の誤差',
        'Raycaster の精度不足',
        'カメラの far が小さいから',
      ],
      answer: 0,
      explain:
        '$t$ の分母が $\\mathbf{n}\\cdot\\mathbf{v}$ です。視線が平面と平行に近づくほど 0 に近づき、1 ピクセルの動きが何十単位の移動になります。`maxPolarAngle` で制限するか、カメラに正対する平面を使ってください。',
    },
  ],
};
