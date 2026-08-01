import type { Chapter } from '../types.ts';

export const chapterT09: Chapter = {
  slug: 't09-loader',
  part: 'threejs',
  number: 16,
  title: 'モデルを読み込む',
  goal: '非同期の読み込みを落ち着いて扱えるようになり、読み込んだモデルの大きさ・向き・材質を自分で整えられるようになります。',
  requires: ['t05-light-shadow', '09-hierarchy'],
  threeApis: [
    'GLTFLoader',
    'LoadingManager',
    'Box3',
    'Box3.setFromObject',
    'Object3D.traverse',
    'Group',
    'Object3D.scale',
  ],
  mathRecall: [
    { slug: '09-hierarchy', note: '読み込んだモデルは入れ子の塊で届く' },
    { slug: '06-matrix', note: '大きさと向きの調整は変換そのもの' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## glTF を使う

3D モデルの形式はたくさんありますが、Web では **{{glTF}}** がほぼ唯一の答えです。
「3D 界の JPEG」と呼ばれることもあります。

- \`.gltf\` … JSON。中身が読めるので、困ったときに開いて確かめられる
- \`.glb\` … それをまとめてバイナリにしたもの。**配信にはこちら**

Three.js は glTF を最もよく面倒みてくれます。OBJ や FBX も読めますが、
マテリアルの再現が甘かったり、ファイルが大きかったりします。
**書き出せるなら glTF にしてください。**
`,
    },
    {
      kind: 'md',
      text: `
## 読み込みは「待つ」処理

ファイルの読み込みには時間がかかります。だから \`load()\` は**すぐには返ってきません**。

これを忘れると、読み込みの直後にモデルを触ろうとして
「まだ何も無い」というエラーになります。**読み終わったあとの処理は、必ず中に書きます。**
`,
    },
    {
      kind: 'code',
      title: 'ファイルから読み込む（基本の形）',
      code: `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

loader.load(
  '/models/robot.glb',
  (gltf) => {
    // 読み終わったあと。ここに続きを書く
    scene.add(gltf.scene);
  },
  (progress) => {
    // 途中経過。読み込み中の表示に使う
    console.log((progress.loaded / progress.total) * 100 + '%');
  },
  (error) => {
    // 失敗したとき。パスの間違いはここに来る
    console.error('読み込めませんでした', error);
  },
);

// await で書くこともできる（こちらのほうが読みやすいことが多い）
async function setup() {
  const gltf = await loader.loadAsync('/models/robot.glb');
  scene.add(gltf.scene);
}`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'gltf そのものではなく gltf.scene を追加します',
      text: `
\`load\` が返す \`gltf\` は、シーン・アニメーション・カメラなどをまとめた**箱**です。
\`scene.add(gltf)\` としても何も起きません。**\`gltf.scene\` を追加してください。**

中身は \`gltf.scene\`（Group）、\`gltf.animations\`（アニメーション）、
\`gltf.cameras\`（書き出されたカメラ）です。
`,
    },
    {
      kind: 'md',
      text: `
## 実際に読み込んでみる

下のサンドボックスでは、外部ファイルを置けないので **glTF をその場で組み立てて**、
それを \`GLTFLoader\` に読ませています。組み立て部分は本題ではないので読み飛ばして構いません。

**大事なのはその後ろ半分**——受け取ったモデルの大きさを揃え、中心を合わせ、
\`traverse\` で中身をひとつずつ整える流れです。実際のファイルでもまったく同じことをします。
`,
    },
    {
      kind: 'sandbox',
      title: 'glTF を読み込んで、整える',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(3, 2.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.7, 0);

const key = new THREE.DirectionalLight(0xffffff, 2.8);
key.position.set(3, 5, 3);
key.castShadow = true;
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.7));

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x2b3040, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// ===== ここから：glTF をその場で組み立てる（本題ではないので読み飛ばして可） =====
function toBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function buildGltf(source, colorHex) {
  const g = source.index ? source.toNonIndexed() : source;
  const position = g.getAttribute('position');
  const normal = g.getAttribute('normal');

  const positionBytes = position.array.byteLength;
  const buffer = new ArrayBuffer(positionBytes + normal.array.byteLength);
  new Float32Array(buffer, 0, position.count * 3).set(position.array);
  new Float32Array(buffer, positionBytes, normal.count * 3).set(normal.array);

  const bounds = new THREE.Box3().setFromBufferAttribute(position);
  const color = new THREE.Color(colorHex);

  return JSON.stringify({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'Gem' }],
    meshes: [{ name: 'Gem', primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, material: 0 }] }],
    materials: [{
      name: 'GemMaterial',
      pbrMetallicRoughness: {
        baseColorFactor: [color.r, color.g, color.b, 1],
        metallicFactor: 0.1,
        roughnessFactor: 0.35,
      },
    }],
    buffers: [{
      byteLength: buffer.byteLength,
      uri: 'data:application/octet-stream;base64,' + toBase64(buffer),
    }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionBytes, target: 34962 },
      { buffer: 0, byteOffset: positionBytes, byteLength: normal.array.byteLength, target: 34962 },
    ],
    accessors: [
      {
        bufferView: 0, componentType: 5126, count: position.count, type: 'VEC3',
        min: bounds.min.toArray(), max: bounds.max.toArray(),
      },
      { bufferView: 1, componentType: 5126, count: normal.count, type: 'VEC3' },
    ],
  });
}

// わざと 40 倍の大きさ・横倒しで書き出されたモデルを想定する
const source = new THREE.TorusKnotGeometry(20, 7, 100, 20);
source.rotateX(Math.PI / 2);
const gltfJson = buildGltf(source, 0x4fd6ff);
// ===== ここまで =====

const status = document.createElement('div');
status.style.cssText = 'position:absolute;left:12px;top:12px;color:#9a9ab0;font:13px monospace';
status.textContent = '読み込み中…';
document.body.appendChild(status);

const loader = new GLTFLoader();

// ふだんは loader.load(url, ...) を使う。parse は「もう手元にあるデータ」を読ませる形
loader.parse(gltfJson, '', (gltf) => {
  const model = gltf.scene;

  // (1) 大きさを揃える ― 書き出し時の単位はモデルごとにばらばら
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = 1.6 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(scale);

  // (2) 足元を原点に合わせる ― 中心が原点にあるとは限らない
  const scaled = new THREE.Box3().setFromObject(model);
  const center = scaled.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= scaled.min.y;

  // (3) 中身をひとつずつ整える ― 影の設定は読み込んだままでは付いていない
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);
  status.textContent = 'できあがり（大きさ・位置・影を整えたあと）';
}, (error) => {
  status.textContent = '読み込みに失敗しました';
  console.error(error);
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
        '(1)(2)(3) の各ブロックをコメントアウトしてみてください。(1) を消すと巨大すぎて画面に入らず、(2) を消すと床にめり込み、(3) を消すと影が落ちなくなります。読み込んだモデルは、たいていこの3つの手当てが要ります。',
    },
    {
      kind: 'md',
      text: `
## 読み込んだモデルは、そのままでは使えない

サンドボックスで確かめたとおり、届いたモデルには**ほぼ必ず手当てが要ります**。

- **大きさ** … 書き出し元のソフトによって単位が違います。
  \`Box3\` で実寸を測り、望む大きさになる倍率を掛けます
- **位置** … 中心が原点にあるとは限りません。足元を原点に合わせると扱いやすくなります
- **向き** … Z 軸を上とするソフト（Blender など）から来ると、横倒しになります。
  \`model.rotation.x = -Math.PI / 2\` で起こします
- **影** … \`castShadow\` は付いてきません。\`traverse\` で全メッシュに設定します
- **材質** … 差し替えたいときも \`traverse\` の中で行います
`,
    },
    {
      kind: 'code',
      title: 'traverse で中身をまとめて整える',
      code: `model.traverse((child) => {
  if (!child.isMesh) return;

  child.castShadow = true;
  child.receiveShadow = true;

  // 名前で見分けて、一部だけ差し替える（名前は 3D ソフト側で付けたもの）
  if (child.name === 'Glass') {
    child.material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transmission: 1, roughness: 0.05, thickness: 0.5,
    });
  }

  // 読み込んだ材質の一部だけ変えることもできる
  child.material.envMapIntensity = 1.5;
});

// 名前で1つだけ取り出す
const door = model.getObjectByName('Door');`,
    },
    {
      kind: 'md',
      text: `
## 読み込み中をどう見せるか

複数のファイルを読むなら、\`LoadingManager\` に全体の進み具合を任せられます。
すべてのローダーに同じマネージャを渡すと、まとめて数えてくれます。
`,
    },
    {
      kind: 'code',
      title: 'LoadingManager でまとめて数える',
      code: `const manager = new THREE.LoadingManager();

manager.onProgress = (url, loaded, total) => {
  bar.style.width = (loaded / total) * 100 + '%';
};
manager.onLoad = () => {
  overlay.remove();   // 全部そろってから見せる
};
manager.onError = (url) => {
  console.error('失敗:', url);
};

// すべてのローダーに同じマネージャを渡す
const gltfLoader = new GLTFLoader(manager);
const textureLoader = new THREE.TextureLoader(manager);`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ファイルを小さくする',
      text: `
モデルが重いと、どんなに描画を速くしても最初の待ち時間は縮みません。

- **Draco 圧縮**で頂点データを小さくする（\`DRACOLoader\` を併用します）
- **KTX2 / Basis** でテクスチャを GPU 圧縮形式にする
- そもそも**三角形とテクスチャを減らす**（\`gltf-transform\` などの道具があります）

体感でいちばん効くのは、たいてい最後の 1 つです。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '捨てるときは中身も解放する',
      text: `
\`scene.remove(model)\` だけでは、ジオメトリもテクスチャも GPU に残ったままです。
\`traverse\` で回って \`geometry.dispose()\` と \`material.dispose()\`、
そしてマテリアルが持つテクスチャも \`dispose()\` してください。
詳しくは[](#/ch/t10-scene-graph)で扱います。
`,
    },
  ],
  exercises: [
    {
      prompt: `読み込んだモデルが**画面いっぱいを埋めるほど巨大**だったとします。
「どんな大きさで来ても、高さが 2 になるように揃える」コードを書いてください。`,
      hint: 'まず現在の大きさを測る必要があります。Box3 が使えます。',
      answer: `\`Box3.setFromObject()\` で外接する箱を測り、望む高さとの比を \`scale\` に入れます。
モデルの単位はミリメートルだったりインチだったりと作った人しだいなので、
**読み込んだあとに測って揃える**のがいちばん確実です。
足元を床に合わせたいなら、測った箱の最小 y のぶんだけ下げます。`,
      answerCode: `const box = new THREE.Box3().setFromObject(model);
const size = box.getSize(new THREE.Vector3());

model.scale.multiplyScalar(2 / size.y);

// 足元を y = 0 に揃える（scale のあとにもう一度測る）
const fitted = new THREE.Box3().setFromObject(model);
model.position.y -= fitted.min.y;`,
    },
    {
      prompt: 'モデルが横倒しで出てきました。「Z-up で作られたものを Y-up に直す」には、どの軸をどれだけ回しますか。',
      hint: 'Z が上を向いているものを、Y が上になるように倒します。',
      answer: `x 軸まわりに **−90 度**（$-\\pi/2$）回します。
Blender など Z-up の道具から書き出したモデルでよく起きます。
なお、モデル自身の \`rotation\` を書き換えると**あとでアニメーションを付けたときに困る**ので、
親の \`Group\` を 1 枚かぶせてそちらを回すほうが安全です。`,
      answerCode: `const holder = new THREE.Group();
holder.rotation.x = -Math.PI / 2; // Z-up を Y-up に
holder.add(model);
scene.add(holder);`,
    },
  ],
  quiz: [
    {
      q: '`loader.load()` で読み込んだモデルをシーンに追加するとき、正しいのはどれですか。',
      choices: [
        'コールバックの中で `scene.add(gltf.scene)`',
        '`load()` の直後に `scene.add(gltf)`',
        '`load()` の戻り値を `scene.add()` に渡す',
        '`scene.add(loader)`',
      ],
      answer: 0,
      explain:
        '読み込みは非同期なので、直後にはまだ何もありません。また `gltf` は箱で、シーンに追加するのはその中の `gltf.scene` です。',
    },
    {
      q: '読み込んだモデルの全メッシュに影を落とさせたいとき、使うのはどれですか。',
      choices: [
        '`model.traverse()` で全メッシュを回って `castShadow` を設定する',
        '`model.castShadow = true` と1行書く',
        '`renderer.shadowMap.enabled` だけで足りる',
        'ライトの `castShadow` だけで足りる',
      ],
      answer: 0,
      explain:
        '`castShadow` は物体ごとの設定なので、親の Group に設定しても子には伝わりません。`traverse` で中身をひとつずつ回る必要があります。',
    },
    {
      q: 'Blender から書き出したモデルが横倒しになっています。原因はどれですか。',
      choices: [
        '上とみなす軸が違う（Blender は Z 軸が上、Three.js は Y 軸が上）',
        'スケールが大きすぎる',
        '法線が壊れている',
        'テクスチャが無い',
      ],
      answer: 0,
      explain:
        '`model.rotation.x = -Math.PI / 2` で起こせます。書き出し時に Y-up を選べるなら、そちらで直しておくほうが確実です。',
    },
  ],
};
