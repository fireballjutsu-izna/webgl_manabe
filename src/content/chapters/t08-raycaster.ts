import type { Chapter } from '../types.ts';

export const chapterT08: Chapter = {
  slug: 't08-raycaster',
  part: 'threejs',
  number: 30,
  title: 'マウスで触る ― Raycaster と NDC',
  goal: '画面のマウス位置を 3D の光線に変換できるようになり、狙ったものを正しく拾えるようになります。',
  requires: ['w29-controls-ux', '03-dot'],
  threeApis: [
    'Raycaster',
    'Raycaster.setFromCamera',
    'Raycaster.intersectObjects',
    'Vector2',
    'Raycaster.ray',
    'Object3D.userData',
    'Matrix3.getNormalMatrix',
  ],
  mathRecall: [
    { slug: '02-vector', note: '光線は「起点＋向き」。まさにベクトル' },
    { slug: '10-camera', note: '画面の点は、視錐台の中の 1 本の線に対応する' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 画面の 1 点は、空間の 1 本の線

マウスがあるのは平らな画面の上、物体があるのは 3D 空間の中。この 2 つをどう結ぶのでしょうか。

答えは「**画面上の 1 点は、空間の中の 1 本の線に対応する**」です。
カメラから、その点を通って奥へまっすぐ伸びる線を考えます。
[](#/ch/10-camera)で見た視錐台の中を、手前から奥へ貫く線です。

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
      worked: {
        given: 'キャンバスが画面の $(100,\\,50)$ の位置にあり、大きさが $800 \\times 600$。その上の $(500,\\,200)$ をクリックしたとき。',
        steps: [
          { calc: 'x : 500 - 100 = 400', note: 'まずキャンバスの左端からの距離にする' },
          { calc: '    400 / 800 = 0.5', note: '幅で割ると 0〜1' },
          { calc: '    0.5 x 2 - 1 = 0', note: '2 倍して 1 を引くと -1〜+1' },
          { calc: 'y : 200 - 50 = 150' },
          { calc: '    150 / 600 = 0.25' },
          { calc: '    1 - 0.25 x 2 = 0.5', note: 'y だけ引き算の向きが逆' },
        ],
        result: '$(0,\\; 0.5)$ ― **横は中央、縦は上寄り**。もし `getBoundingClientRect()` を使わず画面の座標のまま計算していたら、$x$ は $500/800 \\times 2 - 1 = 0.25$ になり、**中央のはずが右へずれます**。この 100 と 50 のぶんが、そのまま選択のずれになります。',
      },
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
## 返ってくるのは、位置だけではない

\`intersectObjects\` が返す配列の各要素には、**当たった物体だけでなく**、
そのときの情報がひととおり入っています。

| 中身 | 何が入るか |
|---|---|
| \`object\` | 当たった \`Mesh\` |
| \`point\` | 当たった位置（**ワールド座標**） |
| \`distance\` | 光線の起点からの距離 |
| \`face\` | 当たった三角形。\`face.normal\` は**ローカル座標の法線** |
| \`uv\` | その位置の UV（[](#/ch/w15-uv)） |
| \`instanceId\` | \`InstancedMesh\` なら、何番目か |

**\`point\` はワールド、\`face.normal\` はローカル**という食い違いに注意してください。
法線をワールドで使いたいなら、[](#/ch/m08-normal-matrix)の法線行列で変換します。

**\`uv\` が取れる**のは思ったより便利です。
壁のどこをクリックしたかが $0$〜$1$ で分かるので、
そこにテクスチャで印を描き込む、といったことができます。
`,
    },
    {
      kind: 'code',
      title: '当たった向きに、ものを置く',
      code: `import * as THREE from 'three';

const hits = raycaster.intersectObjects(targets, false);
if (hits.length > 0) {
  const hit = hits[0];

  // 位置はワールド座標なので、そのまま使える
  marker.position.copy(hit.point);

  // 法線はローカル座標。ワールドへ直すには法線行列を掛ける
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
  const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();

  // その向きへ立たせる
  marker.lookAt(hit.point.clone().add(worldNormal));

  // わずかに浮かせて、ちらつきを避ける
  marker.position.addScaledVector(worldNormal, 0.01);

  console.log('距離', hit.distance.toFixed(2), '/ UV', hit.uv);
}`,
    },
  ],
  exercises: [
    {
      prompt: `\`updatePointer\` の中の \`getBoundingClientRect()\` を使うのをやめて、
\`window.innerWidth\` / \`window.innerHeight\` で正規化するように書き換えてください。
このサンドボックスでは動いてしまいます。**それでも実際のページでは壊れる**のはなぜでしょう。`,
      hint: 'このサンドボックスの iframe は、たまたまキャンバスが画面いっぱいです。',
      answer: `**キャンバスが画面いっぱいとは限らない**からです。
ページの一部に埋め込んだキャンバスだと、キャンバスの左上と画面の左上がずれるので、
クリックの位置が実際より右下（あるいは左上）にずれ、「少し外したところが選ばれる」ようになります。
\`getBoundingClientRect()\` は**キャンバス自身の位置と大きさ**を返すので、どんな置き方でも正しく合います。`,
      answerCode: `const rect = renderer.domElement.getBoundingClientRect();
pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;`,
    },
    {
      prompt: '\`raycaster.intersectObjects(targets, false)\` の第 2 引数を \`true\` にすると何が変わりますか。どちらを使うべきでしょう。',
      hint: '第 2 引数は「子孫までたどるか」です。',
      answer: `\`true\` にすると、渡した物体の**子孫まで**当たり判定の対象になります。
車を \`Group\` で組んだような場合、当たるのは中の Mesh なので \`true\` が要ります。
ただし \`hits[0].object\` は**タイヤの Mesh** であって車そのものではないので、
「どの車が選ばれたか」を知るには \`object.parent\` をたどるか、\`userData\` に印を付けておきます。`,
    },
    {
      prompt: `壁をクリックしたところに、**壁に貼り付く印**を置きたい。
\`hits[0].point\` と \`hits[0].face.normal\` を使いますが、**そのままでは向きが狂います。**
なぜですか。`,
      hint: '2 つの値は、同じ座標系にありますか。',
      answer: `**\`point\` はワールド座標、\`face.normal\` はローカル座標**だからです。

\`intersectObjects\` が返す情報は、座標系が揃っていません。

- **\`point\`** … ワールド座標。そのまま \`marker.position.copy()\` できる
- **\`face.normal\`** … **ジオメトリのローカル座標**。その物体が回転・拡大されていれば、ずれる
- **\`distance\`** … 光線の起点からの距離（スケールの影響を受ける）

壁が回転していなければ、たまたま合います。**回した瞬間に狂います。**

**直し方は法線行列**（[](#/ch/m08-normal-matrix)）。

\`new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)\` を掛けてから正規化します。

なぜ \`matrixWorld\` をそのまま掛けてはいけないかは、[](#/ch/m08-normal-matrix)のとおりです ―
**軸ごとに倍率が違う拡大では、法線が面に垂直でなくなる**からです。

**もう 1 つ、忘れがちな手当て**

印を \`point\` にぴったり置くと、**壁と同じ位置**になって
奥行きの判定が拮抗し、ちらつきます（Z ファイティング）。

法線方向にわずかに浮かせてください。\`addScaledVector(worldNormal, 0.01)\` くらい。

**\`uv\` を使う手もあります。** 壁のどこをクリックしたかが $0$〜$1$ で分かるので、
\`CanvasTexture\` に印を描き込めば、物体を増やさずに跡を残せます。`,
      answerCode: `import * as THREE from 'three';

const hits = raycaster.intersectObjects(walls, false);
if (hits.length > 0) {
  const hit = hits[0];

  // 法線をワールドへ直す
  const nm = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
  const worldNormal = hit.face.normal.clone().applyMatrix3(nm).normalize();

  marker.position.copy(hit.point).addScaledVector(worldNormal, 0.01);
  marker.lookAt(hit.point.clone().add(worldNormal));
}`,
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
      q: '`intersectObjects` が返す `face.normal` は、どの座標系の値ですか。',
      choices: [
        'ジオメトリのローカル座標',
        'ワールド座標',
        'カメラから見た座標',
        '正規化デバイス座標',
      ],
      answer: 0,
      explain:
        '同じ要素の `point` はワールド座標なので、揃っていません。法線をワールドで使うなら `Matrix3().getNormalMatrix(object.matrixWorld)` を掛けます。物体が回転していないと、たまたま合ってしまうのが厄介です。',
    },
  ],
};
