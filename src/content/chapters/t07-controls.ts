import type { Chapter } from '../types.ts';

export const chapterT07: Chapter = {
  slug: 't07-controls',
  part: 'threejs',
  number: 14,
  title: '視点を操作する',
  goal: 'OrbitControls を思いどおりに設定できるようになり、見せたいものから視点が外れないシーンを作れるようになります。',
  requires: ['t01-first-scene', '07-rotation'],
  threeApis: [
    'OrbitControls',
    'MapControls',
    'PerspectiveCamera',
    'Object3D.lookAt',
    'Spherical',
  ],
  mathRecall: [
    { slug: '07-rotation', note: 'カメラの姿勢は回転そのもの' },
    { slug: '10-camera', note: '注視点と画角で見え方が決まる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 見る側を動かす

3D を見せるとき、いちばん喜ばれる機能が「ぐるぐる回して見られること」です。
自分で実装することもできますが、Three.js には用意されています。

いちばんよく使うのが \`OrbitControls\` で、**注視点のまわりをカメラが回る**という動きをします。
地球儀を回すのではなく、地球儀のまわりを自分が歩く感覚です。

これは three 本体ではなく addons（\`three/addons/\`）に入っています。
必要なものだけ読み込む作りになっているためです。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'damping を有効にしたら update を呼ぶ',
      text: `
\`enableDamping = true\` にすると、指を離したあともすーっと動き続けて気持ちよくなります。
ただしこのとき、**毎フレーム \`controls.update()\` を呼ぶ必要があります**。
呼ばないと、慣性が働かないどころか操作そのものが効かなくなります。

「ドラッグしても回らない」と思ったら、まずここを疑ってください。
`,
    },
    {
      kind: 'sandbox',
      title: 'OrbitControls を設定する',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(5, 4, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;      // 慣性。これを使うなら update が必須
controls.dampingFactor = 0.06;      // 小さいほどよく滑る

controls.target.set(0, 0.8, 0);     // 何のまわりを回るか。カメラの向き先でもある

// 近づきすぎ・離れすぎを防ぐ
controls.minDistance = 3;
controls.maxDistance = 14;

// 地面より下に潜り込ませない（0 が真上、π が真下）
controls.maxPolarAngle = Math.PI / 2 - 0.05;

// 横回転を制限することもできる（展示物を裏から見せたくないときなど）
// controls.minAzimuthAngle = -Math.PI / 3;
// controls.maxAzimuthAngle =  Math.PI / 3;

controls.enablePan = false;         // 平行移動を禁じると、対象から視点が外れない

const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(4, 6, 3);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.6));

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x2b3040, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor, new THREE.GridHelper(30, 30, 0x3a3a5c, 0x26263c));

const tower = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.7, 0.24, 128, 24),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.35 }),
);
tower.position.y = 1.4;
scene.add(tower);

function animate() {
  requestAnimationFrame(animate);
  controls.update();               // damping を使うなら毎フレーム必要
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '地面より下に回り込もうとしても止まります。`maxPolarAngle` の行を消すと下から覗けるようになり、床の裏側が見えて興ざめすることが分かります。`enablePan` を true に戻すと、右ドラッグで対象から離れられます。',
    },
    {
      kind: 'md',
      text: `
## 覚えておきたい設定

- **target** … 回る中心。**カメラの向き先そのもの**でもあります
- **enableDamping / dampingFactor** … 慣性。ほぼ常に有効にしてよい
- **minDistance / maxDistance** … 寄れる・引ける範囲
- **minPolarAngle / maxPolarAngle** … 上下の回り込み。0 が真上、π が真下。
  **地面に潜らせないなら \`maxPolarAngle = Math.PI / 2\`**
- **minAzimuthAngle / maxAzimuthAngle** … 横方向の制限
- **enablePan** … 平行移動。切ると対象から視点が外れなくなる
- **autoRotate / autoRotateSpeed** … ひとりでに回る。展示用に便利

制限をかけることは、機能を減らすことではありません。
**見せたくないところを見せない**のは立派な演出です。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'lookAt は OrbitControls に上書きされます',
      text: `
\`OrbitControls\` を使っているあいだ、\`camera.lookAt()\` は効きません。
\`update()\` が毎フレーム \`target\` を見るように向きを設定し直すためです。

向き先を変えたいときは \`controls.target\` を動かしてください。
なめらかに移したいなら \`controls.target.lerp(次の目標, k)\` を毎フレーム呼びます
（[](#/ch/t06-loop-clock)の追従と同じ形です）。
`,
    },
    {
      kind: 'md',
      text: `
## ほかの Controls

- **MapControls** … OrbitControls とほぼ同じですが、左ドラッグが平行移動になります。
  地図や俯瞰視点の街を見せるときに自然
- **TrackballControls** … 上下の制限がなく、自由に転がせます。
  分子模型のように「上下の概念がないもの」に向いています
- **FlyControls / FirstPersonControls** … 自分が飛ぶ・歩く
- **PointerLockControls** … カーソルを隠して視点を回す。一人称視点のゲーム向け
- **TransformControls** … カメラではなく**物体**を動かす矢印を出す。エディタ用

いずれも \`three/addons/controls/\` にあり、使い方はよく似ています。
`,
    },
    {
      kind: 'md',
      text: `
## スクロールを奪う問題

ページの途中に 3D を埋め込むと、その上でホイールを回したときに
**ページが動くのか、3D がズームするのか**という衝突が起きます。

読み物の中の 3D なら、既定ではページをスクロールさせて、
クリックされてからズームを有効にするのが親切です
（\`controls.enableZoom = false\` にしておき、キャンバスがクリックされたら true にする）。

このサイトのデモも、同じ考えで作ってあります。
`,
    },
    {
      kind: 'code',
      title: 'クリックされるまでズームを預けない',
      code: `const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;   // 最初はページのスクロールを優先する

renderer.domElement.addEventListener('pointerdown', () => {
  controls.enableZoom = true;
});

// キャンバスの外をクリックしたら戻す
document.addEventListener('pointerdown', (event) => {
  if (!renderer.domElement.contains(event.target)) {
    controls.enableZoom = false;
  }
});`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '後片付け',
      text: `
\`OrbitControls\` はキャンバスにイベントを登録します。
シーンを捨てるときは **\`controls.dispose()\`** を呼んでください。
呼ばないと、消したはずのシーンがイベントを掴んだままになります。
`,
    },
  ],
  exercises: [
    {
      prompt: '\`controls.update()\` の行を消してください。操作したときの手ざわりはどう変わりますか。',
      hint: '慣性（damping）は、指を離したあとも少しずつ動き続ける仕組みです。',
      answer: `**慣性が効かなくなり、指を離した瞬間にぴたりと止まります**（環境によっては操作自体が効かなくなります）。
\`enableDamping\` は「毎フレーム少しずつ目標へ寄せる」仕組みなので、その「毎フレーム」を回す \`update()\` が要ります。
\`enableDamping\` を使ったら \`update()\` を必ず書く、と組で覚えてください。`,
    },
    {
      prompt: '\`controls.maxPolarAngle\` の行を消してください。視点を下へ回すと何ができてしまいますか。',
      hint: '極角は、真上が 0、真下が π です。',
      answer: `**床の下に潜り込めてしまいます。** 床は裏から見ると（背面カリングで）消えるので、世界が透けて見えます。
\`maxPolarAngle\` を $\\pi/2$ より少し手前で止めておけば、地平線より下へは行けなくなります。
\`minDistance\` / \`maxDistance\` も同じ発想で、**見せたくない見え方を、操作の側で塞ぐ**ためのものです。`,
    },
    {
      prompt: '\`controls.enablePan = false\` を \`true\` にして、右ドラッグ（または 2 本指）で平行移動してみてください。何が困りますか。',
      hint: '回転の中心は controls.target です。',
      answer: `\`target\` ごと動くので、**対象が画面の外へ出ていってしまい、戻し方が分からなくなります**。
展示物を 1 つ見せるだけのページなら、平行移動は切っておくほうが親切です。
逆に、広い空間を歩き回らせたいなら必要な機能です。**作品によって正解が変わる**設定の代表です。`,
    },
  ],
  quiz: [
    {
      q: '`enableDamping = true` にしたのに、ドラッグしても視点が動きません。原因はどれですか。',
      choices: [
        '毎フレーム `controls.update()` を呼んでいない',
        '`target` を設定していない',
        'カメラが PerspectiveCamera でない',
        'ライトが足りない',
      ],
      answer: 0,
      explain:
        'damping は毎フレームの更新で慣性を計算する仕組みなので、`update()` を呼ばないと操作そのものが反映されません。',
    },
    {
      q: 'カメラが地面より下に回り込まないようにしたいとき、設定するのはどれですか。',
      choices: [
        '`controls.maxPolarAngle = Math.PI / 2`',
        '`controls.maxDistance = 10`',
        '`controls.enablePan = false`',
        '`camera.near = 1`',
      ],
      answer: 0,
      explain:
        'polar angle は上下方向の角度で、0 が真上、π が真下です。π/2 が水平なので、そこで止めれば地面より下へは回り込めません。',
    },
    {
      q: 'OrbitControls を使っているとき、カメラの向き先を変えるにはどうしますか。',
      choices: [
        '`controls.target` を動かす',
        '`camera.lookAt()` を呼ぶ',
        '`camera.rotation` を直接書き換える',
        'カメラを作り直す',
      ],
      answer: 0,
      explain:
        '`update()` が毎フレーム target を見るように向きを設定し直すので、`lookAt` や `rotation` への直接の変更は上書きされます。',
    },
  ],
};
