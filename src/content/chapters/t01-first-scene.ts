import type { Chapter } from '../types.ts';

export const chapterT01: Chapter = {
  slug: 't01-first-scene',
  part: 'threejs',
  number: 1,
  title: '最初のシーン',
  goal: 'シーン・カメラ・レンダラの役割が分かり、何も映らないときに自分で原因を切り分けられるようになります。',
  requires: ['01-space', '10-camera'],
  threeApis: [
    'Scene',
    'PerspectiveCamera',
    'WebGLRenderer',
    'Mesh',
    'BoxGeometry',
    'MeshStandardMaterial',
    'DirectionalLight',
    'Camera.updateProjectionMatrix',
  ],
  mathRecall: [
    { slug: '01-space', note: '数字3つが空間のどこを指すか' },
    { slug: '10-camera', note: '視錐台・画角・near と far' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 3つ揃わないと、何も映らない

Three.js の絵は、必ずこの 3 つが揃ってはじめて出ます。

- **シーン**（\`Scene\`）… ものを置く世界そのもの。ここに追加しないと存在しないのと同じ
- **カメラ**（\`PerspectiveCamera\`）… どこから、どれくらいの広さで見るか
- **レンダラ**（\`WebGLRenderer\`）… 実際に絵を描いてキャンバスに出す係

**「シーンに何を置いたか」と「カメラがどこから見ているか」は完全に別の話**です。
ここが分かれていることが、最初につまずく一番の理由になります。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '舞台・カメラマン・映写機',
      text: `
シーンは舞台、カメラはカメラマン、レンダラは映写機です。
舞台に役者を立たせても、カメラマンが客席の外を向いていたら何も写りません。
逆にカメラマンが正しく構えていても、映写機を回さなければスクリーンは真っ黒のままです。
`,
    },
    {
      kind: 'md',
      text: `
## 動かしながら読む

下のコードは実際に動いています。**書き換えて「実行する」を押せば、その場で結果が変わります。**
壊しても「最初に戻す」でいつでも元通りになるので、遠慮なくいじってください。

まずは \`camera.position.set(0, 1.2, 4)\` の数字を変えてみるのがおすすめです。
[1-01 3D空間と座標系](#/ch/01-space)でやったとおり、z のプラスが手前でした。
`,
    },
    {
      kind: 'sandbox',
      title: '最初のシーン',
      code: `import * as THREE from 'three';

// 1. シーン ― ものを置く世界
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

// 2. カメラ ― どこから、どれくらいの広さで見るか
const camera = new THREE.PerspectiveCamera(
  50,                                     // 画角（ここだけ度で指定する）
  window.innerWidth / window.innerHeight, // 横縦比
  0.1,                                    // near : これより手前は写らない
  100,                                    // far  : これより奥は写らない
);
camera.position.set(0, 1.2, 4);
camera.lookAt(0, 0, 0);

// 3. レンダラ ― 実際に絵を描く係
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 箱を1つ置く。scene.add を忘れると存在しないのと同じ
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.4 }),
);
scene.add(box);

// 光がないと MeshStandardMaterial は真っ黒になる
const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(3, 4, 5);
scene.add(light, new THREE.HemisphereLight(0x8899ff, 0x101020, 0.6));

// 描画ループ ― 毎フレーム呼ばれる
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  box.rotation.y += dt * 0.8;
  renderer.render(scene, camera);
}
animate();

// 表示領域の大きさが変わったら、カメラとレンダラの両方を合わせる
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '画角を 20 にすると望遠になって箱が大きく写り、100 にすると広角になって歪みます。near を 5 にすると箱がまるごと消えます。',
    },
    {
      kind: 'md',
      text: `
## 描画ループ ― 1回描いて終わりではない

\`renderer.render(scene, camera)\` は「いまの状態を 1 枚描く」命令です。
1 回しか呼ばなければ、静止画が 1 枚出るだけで終わります。

動かすには、毎フレーム呼び続ける必要があります。それが \`requestAnimationFrame\` です。
画面の更新に合わせて呼び戻してくれるので、多くの環境で毎秒 60 回ほど回ります。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'setInterval で回してはいけません',
      text: `
\`setInterval\` はブラウザの描画タイミングと無関係に走るので、カクつきや無駄な計算が起きます。
また、タブが裏に回っても止まりません。**必ず \`requestAnimationFrame\` を使ってください。**
こちらはタブが非表示になると自動で止まります。
`,
    },
    {
      kind: 'md',
      text: `
## 何も映らないときの確認順

真っ黒な画面を前にして途方に暮れないために、**上から順に**確認します。

- **\`scene.add()\` を呼んだか。** 作っただけでは世界に存在しません
- **ライトを置いたか。** \`MeshStandardMaterial\` は光がないと真っ黒です（切り分けには \`MeshBasicMaterial\` が便利）
- **カメラは対象のほうを向いているか。** \`camera.lookAt()\` は**位置を決めたあとに**呼びます
- **near と far の間にいるか。** [1-10 カメラと投影](#/ch/10-camera)の視錐台の話です
- **\`renderer.render()\` を呼んでいるか。** ループを回し忘れていませんか
- **キャンバスを DOM に追加したか。** \`document.body.appendChild(renderer.domElement)\`

次のコードは**わざと壊してあります**。真っ黒な画面が出るはずです。
上の並びを上から順にたどって、原因を見つけて直してみてください。
`,
    },
    {
      kind: 'sandbox',
      title: '直してみる（わざと壊してあります）',
      code: `import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 1, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 20),
  new THREE.MeshStandardMaterial({ color: 0xffd166 }),
);

// ヒント：ここまでで足りないものが 2 つあります。
//   ひとつは「世界に置く」こと、もうひとつは「光」です。

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();`,
      caption:
        '答え：`scene.add(sphere)` と、ライトの追加（たとえば `scene.add(new THREE.DirectionalLight(0xffffff, 2.5))`）の 2 行が抜けています。ライトの代わりに材質を `MeshBasicMaterial` に変えても映ります。',
    },
    {
      kind: 'md',
      text: `
## 大きさの追従 ― 2つセットで直す

画面の大きさが変わったとき、直すものは **2 つ**あります。

- **レンダラの大きさ**（\`renderer.setSize\`）… 描く絵の解像度
- **カメラの横縦比**（\`camera.aspect\` と \`updateProjectionMatrix\`）… どう写すか

片方だけだと絵が引き伸ばされます。とくに \`updateProjectionMatrix()\` の呼び忘れは頻出です。
\`aspect\` はあくまで行列を作るための材料で、書き換えただけでは反映されません。
`,
    },
    {
      kind: 'md',
      text: `
## ピクセル比 ― 高精細な画面での注意

スマートフォンや高解像度ディスプレイでは、CSS 上の 1px が実際には 2〜3 ピクセルあります。
\`renderer.setPixelRatio(window.devicePixelRatio)\` をそのまま使うと、
描くピクセル数が 4〜9 倍になって一気に重くなります。

**2 で頭打ちにするのが定番**です。見た目の差はほとんどありません。
`,
    },
    {
      kind: 'code',
      title: 'ピクセル比は 2 で頭打ちにする',
      code: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '後片付けを忘れずに',
      text: `
1 ページの中でシーンを何度も作り直すなら、使い終わったレンダラは \`renderer.dispose()\` で
片付けてください。ブラウザが同時に持てる WebGL の枠は 8〜16 個ほどしかなく、
使い切ると古いキャンバスから順に真っ黒になります。詳しくは
[2-10 シーンを組み立てる](#/ch/t10-scene-graph)で扱います。
`,
    },
  ],
  quiz: [
    {
      q: '`MeshStandardMaterial` を使った物体が真っ黒に映ります。**まず**確認すべきはどれですか。',
      choices: [
        'シーンにライトを置いたか',
        'カメラの far が小さすぎないか',
        'ピクセル比の設定',
        'ブラウザの拡大率',
      ],
      answer: 0,
      explain:
        '`MeshStandardMaterial` は光を受けて色が決まる材質なので、ライトがないと真っ黒です。切り分けには、光の影響を受けない `MeshBasicMaterial` に一時的に差し替えるのが手早い方法です。',
    },
    {
      q: '`camera.aspect` を書き換えたのに、絵の歪みが直りません。足りないのはどれですか。',
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
      q: '`renderer.render(scene, camera)` を 1 回だけ呼んだ場合、どうなりますか。',
      choices: [
        'その瞬間の状態が1枚描かれるだけで、以降は動かない',
        'エラーになる',
        '自動的に毎フレーム描き続ける',
        '何も描かれない',
      ],
      answer: 0,
      explain:
        'render は「いまの状態を1枚描く」命令です。動かすには `requestAnimationFrame` で呼び続けます。静止画でよければ 1 回で十分で、そのほうが軽くなります。',
    },
  ],
};
