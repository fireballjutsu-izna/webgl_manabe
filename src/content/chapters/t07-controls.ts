import type { Chapter } from '../types.ts';

export const chapterT07: Chapter = {
  slug: 't07-controls',
  part: 'threejs',
  number: 27,
  title: '視点を操作する ― OrbitControls',
  goal: 'OrbitControls の仕組みと設定が分かり、見せたい範囲だけを見せる制限をかけられるようになります。',
  requires: ['w26-sequence', 'm22-spherical'],
  threeApis: [
    'OrbitControls',
    'OrbitControls.target',
    'OrbitControls.enableDamping',
    'OrbitControls.minPolarAngle',
    'OrbitControls.autoRotate',
    'OrbitControls.dispose',
  ],
  mathRecall: [
    { slug: 'm22-spherical', note: 'カメラの位置は、注視点を中心とした球面座標そのもの' },
    { slug: 'm24-orbit', note: '方位角・仰角・距離の 3 つで、視点が決まる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 中身は、球面座標そのもの

3D を見せるとき、いちばん喜ばれる機能が「ぐるぐる回して見られること」です。

\`OrbitControls\` がやっていることは、**[](#/ch/m22-spherical)の球面座標そのもの**です。

- **\`target\`** … 球の中心。カメラが回るまわりの点
- **方位角**（$\\theta$）… 横にどれだけ回ったか。左右のドラッグで変わる
- **仰角**（$\\phi$）… 上下にどれだけ回ったか。上下のドラッグで変わる
- **半径**（$r$）… 注視点からの距離。ホイールで変わる

毎フレーム、この 3 つから \`camera.position\` を計算し、
\`camera.lookAt(target)\` を呼んでいるだけです。

**地球儀を回すのではなく、地球儀のまわりを自分が歩く**動きになります。

これは three 本体ではなく addons（\`three/addons/\`）にあります。
必要なものだけ読み込む作りだからです。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathbf{p} \\;=\\; \\mathbf{t} + r\\,(\\sin\\phi\\sin\\theta,\\;\\; \\cos\\phi,\\;\\; \\sin\\phi\\cos\\theta)',
      readAloud:
        'カメラの位置は、注視点 $\\mathbf{t}$ から、距離 $r$ だけ球面座標の向きへ離れた点です。$\\phi$ は真上からの角度で、$0$ が真上、$\\pi$ が真下。$\\theta$ が横向きの回転です。',
      worked: {
        given:
          '注視点 $\\mathbf{t} = (0,\\,1,\\,0)$、距離 $r = 8$、$\\theta = 45°$、$\\phi = 60°$ のとき、**カメラの位置**を求めます。',
        steps: [
          { calc: 'sin(60) = 0.8660,  cos(60) = 0.5' },
          { calc: 'sin(45) = 0.7071,  cos(45) = 0.7071' },
          { calc: 'x = 0 + 8 x 0.8660 x sin45 = 4.899' },
          { calc: 'y = 1 + 8 x 0.5            = 5.000' },
          { calc: 'z = 0 + 8 x 0.8660 x cos45 = 4.899' },
          { calc: '【確かめ】注視点からの距離' },
          { calc: '  sqrt(4.899^2 + 4^2 + 4.899^2) = 8.0', note: 'y は 5-1=4' },
        ],
        result:
          '**$(4.90,\\; 5.00,\\; 4.90)$** です。$\\phi = 60°$ は「真上から $60$ 度倒したところ」なので、水平よりやや上から見下ろす角度。**ここで大事なのは $\\phi$ の範囲**です。$\\phi = 0$（真上）や $\\phi = \\pi$（真下）では、$\\sin\\phi = 0$ で $x$ と $z$ がどちらも $0$ になり、**$\\theta$ が意味を失います** ― [](#/ch/w15-uv)の「極でつぶれる」とまったく同じ現象です。だから \\`OrbitControls\\` は内部で $\\phi$ を $0$ と $\\pi$ のわずかに内側に制限しています。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'damping を有効にしたら update を呼ぶ',
      text: `
enableDamping = true にすると、指を離したあともすーっと動き続けて気持ちよくなります。

ただしこのとき、毎フレーム controls.update() を呼ぶ必要があります。
呼ばないと、慣性が働かないどころか操作そのものが効かなくなります。

中身は [](#/ch/w25-damping) の指数減衰そのもので、
毎フレーム「現在の角度を目標の角度へ少し寄せる」をやっています。
その「毎フレーム」を回すのが update() です。

「ドラッグしても回らない」と思ったら、まずここを疑ってください。
`,
    },
    {
      kind: 'sandbox',
      title: 'OrbitControls の設定を、ひととおり',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.Fog(0x0a0a12, 20, 60);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(6, 5, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// 回る中心。カメラの向き先そのもの
controls.target.set(0, 1, 0);

// 慣性。ほぼ常に有効にしてよい
controls.enableDamping = true;
controls.dampingFactor = 0.06;

// 寄れる・引ける範囲
controls.minDistance = 4;
controls.maxDistance = 20;

// 上下の回り込み。0 が真上、PI が真下
controls.minPolarAngle = 0.2;              // 真上まで行かせない
controls.maxPolarAngle = Math.PI / 2.1;    // 地面に潜らせない

// 横方向の制限（コメントを外すと、正面 90 度だけ見られる）
// controls.minAzimuthAngle = -Math.PI / 4;
// controls.maxAzimuthAngle =  Math.PI / 4;

// 平行移動。切ると、対象から視点が外れなくなる
controls.enablePan = false;

// ひとりでに回る。展示用に便利（update が要る）
controls.autoRotate = true;
controls.autoRotateSpeed = 0.8;

// --- 見るもの ---
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({ color: 0x6b7386, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const pieces = [
  [new THREE.BoxGeometry(1.4, 2.2, 1.4), -2.4, 1.1, 0x4fd6ff],
  [new THREE.SphereGeometry(1, 40, 26),   0,   1.0, 0xffd166],
  [new THREE.ConeGeometry(0.9, 2.2, 32),  2.4, 1.1, 0xff6b8a],
];

for (const [geometry, x, y, color] of pieces) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
  mesh.position.set(x, y, 0);
  mesh.castShadow = true;
  scene.add(mesh);
}

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(5, 8, 4);
sun.castShadow = true;
const c = sun.shadow.camera;
c.left = -8; c.right = 8; c.top = 8; c.bottom = -8; c.near = 1; c.far = 25;
c.updateProjectionMatrix();
sun.shadow.normalBias = 0.02;
scene.add(sun, new THREE.HemisphereLight(0x99bbff, 0x332a22, 0.6));

// いまの視点を、球面座標として読み出す
const spherical = new THREE.Spherical();
let last = 0;

renderer.setAnimationLoop(() => {
  controls.update();               // damping と autoRotate に必須

  const now = performance.now();
  if (now - last > 1000) {
    last = now;
    spherical.setFromVector3(camera.position.clone().sub(controls.target));
    console.log(
      '距離', spherical.radius.toFixed(2),
      '/ 仰角 phi', THREE.MathUtils.radToDeg(spherical.phi).toFixed(1) + '度',
      '/ 方位 theta', THREE.MathUtils.radToDeg(spherical.theta).toFixed(1) + '度',
    );
  }

  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**ドラッグしながら、コンソールの数字を見てください。** 距離・仰角・方位角の 3 つだけで視点が決まっているのが分かります。**下へドラッグしても地面より下へ回り込めません** ― `maxPolarAngle` で止めているからです。`enablePan = false` なので、右ドラッグしても対象から外れません。`controls.update()` を消すと、慣性も自動回転も止まります。',
    },
    {
      kind: 'md',
      text: `
## 制限をかけるのは、演出

| 設定 | 何を決めるか | 効くところ |
|---|---|---|
| \`target\` | 回る中心。**カメラの向き先そのもの** | 主役をどこに置くか |
| \`enableDamping\` | 慣性。ほぼ常に \`true\` | 手ざわり |
| \`minDistance\` / \`maxDistance\` | 寄れる・引ける範囲 | 中に入られない・遠すぎない |
| \`minPolarAngle\` / \`maxPolarAngle\` | 上下の回り込み | **地面に潜らせない** |
| \`minAzimuthAngle\` / \`maxAzimuthAngle\` | 横方向の制限 | 裏側を見せない |
| \`enablePan\` | 平行移動 | 切ると対象から外れない |
| \`autoRotate\` | ひとりでに回る | 展示・待機画面 |

**制限をかけることは、機能を減らすことではありません。**

作ったものには必ず「見せたくない側」があります。
背中を作り込んでいないキャラクター、床下のなにもない空間、
中身が空っぽの建物。

**見せない**のは立派な演出です。
そして「どこを見せるか」を決めておくと、**作り込む範囲も決まります。**
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'lookAt は OrbitControls に上書きされます',
      text: `
OrbitControls を使っているあいだ、camera.lookAt() は効きません。
update() が毎フレーム target を見るように向きを設定し直すためです。

向き先を変えたいときは controls.target を動かしてください。

なめらかに移したいなら、controls.target を
[](#/ch/w25-damping) の指数減衰で寄せます。
そして忘れずに controls.update() を呼ぶこと。

これは「設定したのに効かない」の典型で、
原因が「別の何かが毎フレーム上書きしている」型のものです。
`,
    },
    {
      kind: 'md',
      text: `
## 最初の視点は、コードで決める

読者が最初に見る 1 枚は、**作り手が決めるべき**です。

- **\`camera.position\`** … どこから見るか
- **\`controls.target\`** … 何を見るか

この 2 つが「作品の第一印象」を決めます。

**やりがちな失敗**が 2 つあります。

**1. \`target\` が原点のまま**

キャラクターの足元が画面の中心になり、**顔が上に切れます。**
\`target\` は「主役の中心」に置いてください。

**2. 真正面から見ている**

$\\theta = 0$、$\\phi = \\pi/2$ だと、真横から水平に見ることになります。
**立体感がまったく出ません。**

**斜め上から見下ろす**のが基本です。$\\phi = 60°$〜$75°$ くらい。
`,
    },
    {
      kind: 'code',
      title: '球面座標で、最初の視点を決める',
      code: `import * as THREE from 'three';

// 「距離 10、真上から 65 度、正面から 35 度」を、そのまま書く
const spherical = new THREE.Spherical(
  10,                                  // radius
  THREE.MathUtils.degToRad(65),        // phi : 0 が真上
  THREE.MathUtils.degToRad(35),        // theta : 横回り
);

const target = new THREE.Vector3(0, 1.2, 0);   // 主役の中心

camera.position.setFromSpherical(spherical).add(target);
controls.target.copy(target);
controls.update();

// 逆に、いまの視点を球面座標として読み出す
const s = new THREE.Spherical()
  .setFromVector3(camera.position.clone().sub(controls.target));

console.log(
  '距離', s.radius.toFixed(2),
  'phi', THREE.MathUtils.radToDeg(s.phi).toFixed(1),
  'theta', THREE.MathUtils.radToDeg(s.theta).toFixed(1),
);

// 気に入った視点をコンソールから写して、コードに書き戻す
// ― これが「良い初期視点」を決めるいちばん速い方法です`,
    },
    {
      kind: 'md',
      text: `
## ほかの Controls

用途が違えば、道具も違います。

- **\`MapControls\`** … \`OrbitControls\` とほぼ同じですが、**左ドラッグが平行移動**。
  地図や俯瞰視点の街に自然
- **\`TrackballControls\`** … 上下の制限がなく、自由に転がせる。
  **上下の概念がないもの**（分子模型、隕石）向け
- **\`FlyControls\` / \`FirstPersonControls\`** … 自分が飛ぶ・歩く
- **\`PointerLockControls\`** … カーソルを隠して視点を回す。一人称視点のゲーム向け
- **\`TransformControls\`** … カメラではなく**物体**を動かす矢印を出す。エディタ用

いずれも \`three/addons/controls/\` にあり、使い方はよく似ています。

**迷ったら \`OrbitControls\`。** 「ものを見せる」用途の $9$ 割はこれで足ります。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '後片付け',
      text: `
OrbitControls はキャンバスにイベントを登録します。

シーンを捨てるときは controls.dispose() を呼んでください。
呼ばないと、消したはずのシーンがイベントを掴んだままになります。

症状は「古いシーンのカメラが、新しいシーンの操作で動く」
「ページを離れてもマウスイベントが動き続ける」。

このサイトの Stage も、dispose で controls を片付けています。
`,
    },
  ],
  exercises: [
    {
      prompt: `注視点 $\\mathbf{t} = (0,\\,2,\\,0)$ から、**距離 $12$、真上から $70°$、正面から $-30°$** の
位置にカメラを置きたい。**カメラの座標**を求めてください。`,
      hint: '$\\mathbf{p} = \\mathbf{t} + r(\\sin\\phi\\sin\\theta,\\; \\cos\\phi,\\; \\sin\\phi\\cos\\theta)$ です（**$x$ が $\\sin\\theta$、$z$ が $\\cos\\theta$**）。',
      answer: `**$(9.766,\\; 6.104,\\; -5.638)$** です。

**三角関数の値**

$\\sin(70°) = 0.9397$、$\\cos(70°) = 0.3420$
$\\cos(-30°) = 0.8660$、$\\sin(-30°) = -0.5$

**各成分**

$x = 0 + 12 \\times 0.9397 \\times 0.8660 = 9.766$

$y = 2 + 12 \\times 0.3420 = 2 + 4.104 = 6.104$

$z = 0 + 12 \\times 0.9397 \\times (-0.5) = -5.638$

**確かめ ― 注視点からの距離**

$\\sqrt{9.766^2 + 4.104^2 + 5.638^2} = \\sqrt{95.38 + 16.84 + 31.79} = \\sqrt{144.0} = 12.0$

**ちょうど $12$。** 合っています。

**$\\phi = 70°$ の意味**

真上（$0°$）から $70$ 度倒したところ。水平が $90°$ なので、
**水平よりわずかに上から見下ろす**角度です。

$y$ が $6.1$、水平距離が $\\sqrt{9.766^2 + 5.638^2} = 11.28$ なので、
見下ろす角度は $\\arctan(4.104 / 11.28) = 20°$。$90° - 70° = 20°$ と一致します。

**実務での使い方**

数字を直接書くより、\`THREE.Spherical\` を使うほうが読めます。

\`camera.position.setFromSpherical(new THREE.Spherical(12, phi, theta)).add(target)\`

**そして逆向きも便利です。** 実際にドラッグして「ここが良い」と思った視点を
\`setFromVector3\` で球面座標として読み出し、**そのままコードに書き戻す。**
これが初期視点を決めるいちばん速い方法です。`,
      answerCode: `import * as THREE from 'three';

const target = new THREE.Vector3(0, 2, 0);

const s = new THREE.Spherical(
  12,
  THREE.MathUtils.degToRad(70),
  THREE.MathUtils.degToRad(-30),
);

camera.position.setFromSpherical(s).add(target);
controls.target.copy(target);
controls.update();

// いまの視点を読み出して、コードに書き戻す
const cur = new THREE.Spherical()
  .setFromVector3(camera.position.clone().sub(controls.target));
console.log(cur.radius, THREE.MathUtils.radToDeg(cur.phi), THREE.MathUtils.radToDeg(cur.theta));`,
    },
    {
      prompt: `サンドボックスの \`controls.update()\` を消してください。
**何が起きますか。** そして \`enableDamping = false\` にすると、どう変わりますか。`,
      hint: 'damping の中身は、何でしたか。',
      answer: `**慣性も自動回転も止まり、環境によってはドラッグ自体が効かなくなります。**

**\`enableDamping = true\` のとき**

\`OrbitControls\` は、ドラッグの入力を**目標の角度**として記録するだけで、
**実際の角度はそこへ少しずつ寄せます。**

寄せる処理をやっているのが \`update()\` です。
[](#/ch/w25-damping)でやった指数減衰そのもので、
毎フレーム「現在 → 目標」の残りを詰めています。

だから \`update()\` を呼ばなければ、**目標だけが更新されて実際の角度が動きません。**
つまり**まったく回りません。**

**\`autoRotate\` も同じ**です。角度を毎フレーム進める処理が \`update()\` の中にあります。

**\`enableDamping = false\` にすると**

こんどは**ドラッグは効きます。** 入力が即座に角度へ反映されるからです。

ただし**慣性が無くなり、指を離した瞬間にぴたりと止まります。**
手ざわりは明らかに落ちます。

そして \`autoRotate\` は**やはり効きません。**

**覚え方**

\`enableDamping\` を使ったら \`update()\` を必ず書く ― **組で覚えてください。**

より安全なのは、**常に \`update()\` を呼ぶ**ことです。
費用はごくわずかで、どの設定でも正しく動きます。

**関連する落とし穴**

\`controls.target\` を書き換えたときも、\`update()\` を呼ばないと反映されません。
そして \`camera.lookAt()\` は、\`update()\` に**上書きされます。**
向き先を変えたいなら、必ず \`controls.target\` を動かしてください。`,
    },
    {
      prompt: `キャラクターを見せるビューアーを作ります。
**背中は作り込んでいないので見せたくない。床下にも潜らせたくない。**
どう設定しますか。`,
      hint: '角度に範囲を設けます。',
      answer: `**方位角と仰角の両方に制限をかけます。**

**背中を見せない ― 方位角の制限**

\`\`controls.minAzimuthAngle = -Math.PI / 3\`\`（$-60°$）
\`\`controls.maxAzimuthAngle = Math.PI / 3\`\`（$+60°$）

正面から左右 $60$ 度、合計 $120$ 度の範囲だけ回れます。
横顔は見えますが、背中には回り込めません。

**どこが「正面」かは、初期の \`theta\` で決まります。**
キャラクターが $+z$ を向いているなら、$\\theta = \\pi/2$ が正面。
その前後に範囲を取ってください。

**床下に潜らせない ― 仰角の制限**

\`\`controls.maxPolarAngle = Math.PI / 2\`\`

$\\phi = \\pi/2$ が水平です。それ以上は見上げる方向になり、
床の下に潜ります。

**厳密には $\\pi/2$ ちょうどより、わずかに手前**にするのが安全です。
$\\pi / 2.05$ くらい。水平ぴったりだと床が線に潰れて、ちらつきます。

**真上からも見せないなら**

\`\`controls.minPolarAngle = 0.3\`\`

真上（$\\phi = 0$）に近づくと、方位角が意味を失います
（[](#/ch/w15-uv)の極の問題と同じ）。
**操作していて気持ち悪い**ので、少し手前で止めるのが親切です。

**さらに 3 つ**

- **\`enablePan = false\`** … 平行移動を切る。**対象から視点が外れなくなります。**
  ビューアーではほぼ常に切ってよい設定です
- **\`minDistance\`** … 近づきすぎて中に入るのを防ぐ。キャラの半径より大きく
- **\`maxDistance\`** … 引きすぎて豆粒になるのを防ぐ

**制限は「不親切」ではありません。**

見せたくないところを見せないのは演出です。
そして**見せる範囲が決まれば、作り込む範囲も決まります。**
背中を作らなくてよい、というのは大きな節約です。`,
      answerCode: `import * as THREE from 'three';

const controls = new OrbitControls(camera, renderer.domElement);

controls.target.set(0, 1.2, 0);        // 主役の中心（足元ではない）
controls.enableDamping = true;
controls.dampingFactor = 0.06;

// 背中を見せない。正面 ±60 度
const front = Math.PI / 2;             // キャラが +z を向いている場合
controls.minAzimuthAngle = front - Math.PI / 3;
controls.maxAzimuthAngle = front + Math.PI / 3;

// 床下に潜らせない・真上へ行かせない
controls.minPolarAngle = 0.3;
controls.maxPolarAngle = Math.PI / 2.05;

// 対象から外れない・寄りすぎない・引きすぎない
controls.enablePan = false;
controls.minDistance = 2.5;
controls.maxDistance = 9;

controls.update();`,
    },
  ],
  quiz: [
    {
      q: '`OrbitControls` が内部で使っている座標の表し方はどれですか。',
      choices: [
        '球面座標（注視点からの距離・仰角・方位角）',
        'オイラー角',
        'クォータニオン',
        '同次座標',
      ],
      answer: 0,
      explain:
        '毎フレーム、この 3 つから `camera.position` を計算し、`lookAt(target)` を呼んでいるだけです。真上・真下で方位角が意味を失うのも、球面座標の極の問題そのものです。',
    },
    {
      q: '`enableDamping = true` にしたのに、ドラッグしても回りません。足りないのはどれですか。',
      choices: [
        '毎フレームの `controls.update()`',
        '`controls.enabled = true`',
        'カメラの `updateProjectionMatrix()`',
        '`renderer.domElement` の指定',
      ],
      answer: 0,
      explain:
        'damping の中身は指数減衰で、毎フレーム「現在の角度を目標へ寄せる」処理です。update() を呼ばなければ目標だけが更新され、実際の角度は動きません。組で覚えてください。',
    },
    {
      q: '`OrbitControls` を使っているとき、`camera.lookAt()` はどうなりますか。',
      choices: [
        '`update()` に上書きされて効かない。`controls.target` を動かす',
        'そのまま効く',
        'エラーになる',
        '一度だけ効く',
      ],
      answer: 0,
      explain:
        'update() が毎フレーム target を見るように向きを設定し直します。「設定したのに効かない」の典型で、原因は「別の何かが毎フレーム上書きしている」型です。向き先を変えるなら controls.target を動かしてください。',
    },
  ],
};
