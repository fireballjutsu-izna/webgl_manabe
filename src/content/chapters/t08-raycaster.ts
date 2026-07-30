import type { Chapter } from '../types.ts';

export const chapterT08: Chapter = {
  slug: 't08-raycaster',
  part: 'threejs',
  number: 8,
  title: 'マウスで触る ― Raycaster',
  goal: '画面上のマウス位置から3D空間へ光線を飛ばせるようになり、ホバー・クリック・ドラッグを自分で実装できるようになります。',
  requires: ['t07-controls', '03-dot'],
  threeApis: [
    'Raycaster',
    'Raycaster.setFromCamera',
    'Raycaster.intersectObjects',
    'Vector2',
    'Plane',
    'Ray',
    'Object3D.userData',
  ],
  mathRecall: [
    { slug: '02-vector', note: '光線は「起点＋向き」。まさにベクトル' },
    { slug: '10-camera', note: '画面の点は、視錐台の中の1本の線に対応する' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 画面の1点は、空間の1本の線

マウスがあるのは平らな画面の上、物体があるのは 3D 空間の中。この 2 つをどう結ぶのでしょうか。

答えは「**画面上の 1 点は、空間の中の 1 本の線に対応する**」です。
カメラから、その点を通って奥へまっすぐ伸びる線を考えます。
[1-10 カメラと投影](#/ch/10-camera)で見た視錐台の中を、手前から奥へ貫く線です。

あとはその線と、物体が交わるかを調べるだけ。これをやってくれるのが \`Raycaster\` です。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: 'レーザーポインタ',
      text: `
カメラの位置からレーザーを撃ち、マウスカーソルの方向へまっすぐ飛ばします。
最初に当たったものが「クリックしたもの」です。
奥にあるものにも当たりますが、手前から順に並んで返ってくるので、
ふつうは最初の 1 つだけを見ます。
`,
    },
    {
      kind: 'md',
      text: `
## 正規化デバイス座標 ― 座標の橋渡し

Raycaster に渡すマウス位置は、ピクセルではありません。
**画面の左下が (-1, -1)、右上が (+1, +1)、中心が (0, 0)** という座標に直します。
これを{{正規化デバイス座標}}（NDC）と呼びます。

画面の大きさに関係なく同じ範囲になるので、どんなキャンバスでも同じコードで済みます。
`,
    },
    {
      kind: 'formula',
      tex: 'x_{\\text{ndc}} = \\dfrac{2\\,(p_x - l)}{w} - 1, \\qquad y_{\\text{ndc}} = 1 - \\dfrac{2\\,(p_y - t)}{h}',
      readAloud:
        'マウスの位置からキャンバスの左上（l, t）を引いて幅と高さで割ると 0〜1 になります。それを 2 倍して 1 を引けば -1〜+1 です。y だけ引き算の向きが逆なのは、画面の y が下向き、3D の y が上向きだからです。',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'キャンバスが画面いっぱいでないときは getBoundingClientRect を使う',
      text: `
\`event.clientX / window.innerWidth\` という書き方をよく見ますが、
これはキャンバスが画面いっぱいのときにしか正しくありません。
ページの一部に埋め込んでいるなら、\`canvas.getBoundingClientRect()\` から
キャンバス自身の位置と大きさを取ってください。**ずれの原因の大半はこれです。**
`,
    },
    {
      kind: 'sandbox',
      title: 'ホバーで光らせ、クリックで色を変える',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 4, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.5, 0);

const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(3, 5, 4);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.6));

// 触れる対象を並べる。マテリアルは1つ1つ別にする（色を個別に変えるため）
const targets = [];
const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);

for (let i = 0; i < 5; i++) {
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x3a4a66, roughness: 0.5 }),
  );
  mesh.position.set((i - 2) * 1.4, 0.5, 0);
  mesh.userData.index = i;          // 好きな情報を持たせておける
  scene.add(mesh);
  targets.push(mesh);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;

function updatePointer(event) {
  // キャンバス自身の位置と大きさを基準にする（画面いっぱいとは限らない）
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pick() {
  raycaster.setFromCamera(pointer, camera);
  // 手前から順に並んで返る。最初の1つが「いちばん手前で当たったもの」
  const hits = raycaster.intersectObjects(targets, false);
  return hits.length > 0 ? hits[0].object : null;
}

renderer.domElement.addEventListener('pointermove', (event) => {
  updatePointer(event);
  const hit = pick();
  if (hit === hovered) return;

  if (hovered) hovered.scale.setScalar(1);
  hovered = hit;
  if (hovered) hovered.scale.setScalar(1.25);

  renderer.domElement.style.cursor = hovered ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('click', (event) => {
  updatePointer(event);
  const hit = pick();
  if (!hit) return;
  hit.material.color.setHSL((hit.userData.index * 0.17 + Math.random() * 0.2) % 1, 0.7, 0.6);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '箱に触れると大きくなり、クリックで色が変わります。`intersectObjects(targets, false)` の第2引数を true にすると、子まで再帰的に調べます。調べる対象を絞るほど速くなります。',
    },
    {
      kind: 'md',
      text: `
## 平面との交点 ― ドラッグの作り方

「物体をマウスで引きずる」には、**光線と平面の交点**を使います。

物体をどこへ動かすかは、光線だけでは決まりません（線上のどこでもよいため）。
そこで「この平面の上を動く」という制約を足します。
床の上を滑らせるなら y = 0 の平面、カメラに正対したまま動かすなら視線に垂直な平面です。

Three.js には \`Plane\` と \`Ray.intersectPlane()\` が用意されているので、1 行で求まります。
`,
    },
    {
      kind: 'sandbox',
      title: '床の上を引きずる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 6, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(3, 6, 4);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.6));
scene.add(new THREE.GridHelper(16, 16, 0x3a3a5c, 0x26263c));

const pieces = [0x4fd6ff, 0xffd166, 0xff7ad9].map((color, i) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 20),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4 }),
  );
  mesh.position.set((i - 1) * 2.2, 0.5, 0);
  scene.add(mesh);
  return mesh;
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// y = 0.5 の水平な平面。この上を滑らせる
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5);
const hitPoint = new THREE.Vector3();
const grabOffset = new THREE.Vector3();
let dragging = null;

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  updatePointer(event);
  const hits = raycaster.intersectObjects(pieces, false);
  if (hits.length === 0) return;

  dragging = hits[0].object;
  controls.enabled = false;                       // ドラッグ中は視点を止める

  // つかんだ瞬間のずれを覚えておくと、中心へ飛ばずに自然につかめる
  raycaster.ray.intersectPlane(dragPlane, hitPoint);
  grabOffset.copy(dragging.position).sub(hitPoint);

  renderer.domElement.setPointerCapture(event.pointerId);
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  updatePointer(event);
  // 光線と平面の交点が「マウスの指している床の上の位置」
  if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
    dragging.position.copy(hitPoint).add(grabOffset);
  }
});

function endDrag(event) {
  if (!dragging) return;
  dragging = null;
  controls.enabled = true;
  if (renderer.domElement.hasPointerCapture(event.pointerId)) {
    renderer.domElement.releasePointerCapture(event.pointerId);
  }
}
renderer.domElement.addEventListener('pointerup', endDrag);
renderer.domElement.addEventListener('pointercancel', endDrag);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '球をドラッグすると床の上を滑ります。`grabOffset` の 2 行を消すと、つかんだ瞬間に球の中心がカーソルへ飛びます。ドラッグ中に `controls.enabled = false` を外すと、視点と物体が同時に動いて操作不能になります。',
    },
    {
      kind: 'md',
      text: `
## 当たり判定の中身と、速さ

\`intersectObjects\` は、まず**バウンディングスフィア**（その物体を包む球）で大まかに判定し、
当たりそうなものだけ三角形ごとに調べます。それでも、対象が多いと重くなります。

- **調べる対象を絞る。** シーン全体ではなく、触れるものだけの配列を渡す
- **再帰を切る。** 第 2 引数 \`false\` で子を辿らない
- **毎フレーム調べない。** \`pointermove\` のたびで十分。回転しているだけなら判定は要らない
- **代役を使う。** 複雑なモデルには、単純な形の見えないメッシュを重ねて、そちらで判定する

なお、\`Points\` や \`Line\` には \`raycaster.params\` のしきい値（\`threshold\`）があります。
点や線は面積が無いので、「どれくらい近ければ当たったとみなすか」を決める必要があるためです。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '交点の情報は位置だけではありません',
      text: `
\`intersectObjects\` が返す要素には、当たった物体（\`object\`）のほかに、
**当たった位置**（\`point\`）、**距離**（\`distance\`）、**面の法線**（\`face.normal\`）、
**その面の UV**（\`uv\`）が入っています。

法線が取れるということは、[1-11 法線とライティング](#/ch/11-normal-light)や
[1-04 外積](#/ch/04-cross)でやったことがそのまま使えるということです。
壁に貼り付くマークや、当たった向きに跳ね返るエフェクトが作れます。
`,
    },
  ],
  quiz: [
    {
      q: 'Raycaster に渡すマウス位置は、どんな座標に直しますか。',
      choices: [
        '左下が (-1, -1)、右上が (+1, +1) になる座標',
        'キャンバス上のピクセル座標',
        '左上が (0, 0)、右下が (1, 1) になる座標',
        'ワールド座標',
      ],
      answer: 0,
      explain:
        '正規化デバイス座標（NDC）です。中心が (0, 0) で、画面の大きさに関係なく同じ範囲になります。y は 3D と画面で向きが逆なので、符号を反転させます。',
    },
    {
      q: 'ページの一部に埋め込んだキャンバスで、クリック位置がずれます。原因はどれですか。',
      choices: [
        '`window.innerWidth` を基準にしていて、キャンバスの位置と大きさを見ていない',
        'カメラの near が小さすぎる',
        'Raycaster を毎フレーム作り直している',
        'ライトが足りない',
      ],
      answer: 0,
      explain:
        '`canvas.getBoundingClientRect()` からキャンバス自身の左上位置と大きさを取り、そこを基準に計算してください。',
    },
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
        '光線は線なので、その上のどこに置くかが決まりません。「この平面の上を動く」と決めれば交点が1つに定まります。`Ray.intersectPlane()` で求められます。',
    },
  ],
};
