import type { Chapter } from '../types.ts';

export const chapterT09: Chapter = {
  slug: 't09-loader',
  part: 'threejs',
  number: 34,
  title: 'モデルを読み込む ― 「待つ」という書き方',
  goal: '非同期の読み込みを落ち着いて扱えるようになり、読み込めなかったときに原因を切り分けられるようになります。',
  requires: ['w33-pick-cost', '09-hierarchy'],
  threeApis: [
    'GLTFLoader',
    'Loader.load',
    'Loader.loadAsync',
    'Group',
    'Box3',
    'Box3.setFromObject',
  ],
  mathRecall: [
    { slug: '09-hierarchy', note: '読み込んだモデルは入れ子の塊で届く' },
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

**\`GLTFLoader\` は addons にあります。** three の本体には入っていないので、
\`three/addons/loaders/GLTFLoader.js\` から読み込みます。
`,
    },
    {
      kind: 'md',
      text: `
## 読み込みは「待つ」処理

ここまでの章で書いてきたコードは、**上から下へ順に実行され、書いた順に効きました。**
読み込みだけは違います。

ファイルを取りに行くには時間がかかります。数十ミリ秒のこともあれば、
回線しだいで数秒かかることもある。その間ブラウザを止めるわけにいかないので、
\`load()\` は**モデルを返さずに、すぐ次の行へ進みます。**

これを忘れると、こう書いてしまいます。
`,
    },
    {
      kind: 'code',
      title: 'よくある間違いと、正しい形',
      code: `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// --- 間違い。model はまだ存在しない
let model;
loader.load('/models/robot.glb', (gltf) => { model = gltf.scene; });
model.position.y = 1;          // TypeError: model is undefined

// --- 正しい形 1。続きは「中に」書く
loader.load(
  '/models/robot.glb',
  (gltf) => {
    // 読み終わったあと。ここに続きを書く
    gltf.scene.position.y = 1;
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

// --- 正しい形 2。await のほうが読みやすいことが多い
async function setup() {
  const gltf = await loader.loadAsync('/models/robot.glb');
  gltf.scene.position.y = 1;
  scene.add(gltf.scene);
}
setup();`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'gltf そのものではなく gltf.scene を追加します',
      text: `
load が返す gltf は、シーン・アニメーション・カメラなどをまとめた箱です。
scene.add(gltf) としても何も起きません。gltf.scene を追加してください。

中身は gltf.scene（Group）、gltf.animations（アニメーション）、
gltf.cameras（書き出されたカメラ）、gltf.asset（作った道具の情報）です。

エラーも警告も出ないので、「読めているのに何も映らない」という
いちばん気づきにくい形で詰まります。
`,
    },
    {
      kind: 'md',
      text: `
## 複数のファイルを待つ

モデルが 3 つあるなら、**順番に待つ必要はありません。**
同時に投げて、全部そろうのを待つほうが速い。

\`Promise.all\` を使います。$3$ つがそれぞれ $0.4$ 秒かかるとして、
順番に待つと $1.2$ 秒、同時に投げれば **$0.4$ 秒**です。

読み込みは「CPU が忙しい」のではなく「返事を待っている」だけなので、
待つ相手を増やしても遅くなりません。
`,
    },
    {
      kind: 'code',
      title: '同時に投げて、まとめて待つ',
      code: `const loader = new GLTFLoader();

async function loadAll() {
  const [robot, tree, rock] = await Promise.all([
    loader.loadAsync('/models/robot.glb'),
    loader.loadAsync('/models/tree.glb'),
    loader.loadAsync('/models/rock.glb'),
  ]);

  scene.add(robot.scene, tree.scene, rock.scene);
}

// 1 つ失敗しただけで全部が止まるのが困るなら allSettled
const results = await Promise.allSettled([...]);
for (const r of results) {
  if (r.status === 'fulfilled') scene.add(r.value.scene);
  else console.warn('1 つ読めませんでした', r.reason);
}`,
    },
    {
      kind: 'md',
      text: `
## 実際に読み込んでみる

下のサンドボックスでは、外部ファイルを置けないので **glTF をその場で組み立てて**、
それを \`GLTFLoader\` に読ませています。組み立て部分は本題ではないので読み飛ばして構いません。

**大事なのは、読み込んだあとに何が届くか**です。
コンソールに出る大きさを見てください ― そして、画面をよく見てください。
`,
    },
    {
      kind: 'sandbox',
      title: 'glTF を読み込む ― 届いたものを、そのまま置く',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(3, 2.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const key = new THREE.DirectionalLight(0xffffff, 2.8);
key.position.set(3, 5, 4);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.9));
const grid = new THREE.GridHelper(80, 20, 0x3a3a5c, 0x26263c);
scene.add(grid);

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

// わざと巨大・横倒し・中心ずれで書き出されたモデルを想定する
const source = new THREE.TorusKnotGeometry(20, 7, 100, 20);
source.rotateX(Math.PI / 2);
const gltfJson = buildGltf(source, 0x4fd6ff);
// ===== ここまで =====

const status = document.createElement('div');
status.style.cssText =
  'position:fixed;left:12px;top:12px;padding:6px 10px;border-radius:8px;' +
  'background:rgba(10,10,18,.8);color:#9a9ab0;font:13px/1.6 monospace;white-space:pre';
status.textContent = '読み込み中…';
document.body.appendChild(status);

const loader = new GLTFLoader();

// ふだんは loader.load(url, ...) を使う。parse は「もう手元にあるデータ」を読ませる形
loader.parse(gltfJson, '', (gltf) => {
  const model = gltf.scene;

  // 何も直さずに、届いたまま置く
  scene.add(model);

  // 届いたものの実寸を測る。ここを見るのがすべての出発点
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  console.log('大きさ', size, '中心', center);

  status.textContent =
    '読み込めました\\n' +
    '大きさ ' + size.x.toFixed(1) + ' x ' + size.y.toFixed(1) + ' x ' + size.z.toFixed(1) + '\\n' +
    'グリッドの 1 マスが 4 です';

  // 見えるところまでカメラを引く（モデルには一切触っていない）
  const radius = size.length() / 2;
  const dist = radius / Math.sin((camera.fov * Math.PI) / 180 / 2);
  camera.position.copy(center).add(new THREE.Vector3(0.6, 0.5, 1).normalize().multiplyScalar(dist));
  controls.target.copy(center);
}, (error) => {
  status.textContent = '読み込みに失敗しました';
  console.error(error);
});

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
        '**読み込めています。それでも、このままでは使えません。** 大きさは $67 \\times 34 \\times 70$（グリッドの 1 マスは 4 です）、平たく寝ていて、中心も原点からずれています。カメラを引いてようやく画面に入りました ― **モデル側は一切直していません。** 届いたモデルを直す手順が、次の章です。',
    },
    {
      kind: 'md',
      text: `
## 読み込めなかったとき

エラーコールバックに来たら、まず**ブラウザの Network タブ**を開いてください。
three のエラーメッセージより、そこに出ている数字のほうが雄弁です。

- **404** … パスが違う。\`/models/robot.glb\` の \`/\` の有無、大文字小文字、拡張子
- **CORS のエラー** … 別のドメインから読もうとしている。
  サーバ側が \`Access-Control-Allow-Origin\` を返していないと読めません
- **200 なのに失敗** … 中身が壊れているか、\`.gltf\` が参照している
  \`.bin\` やテクスチャのほうが 404 になっています
- **file:// で開いている** … ローカルのファイルを直接開くと、
  ブラウザがほぼすべての読み込みを拒否します。**必ずローカルサーバを立ててください**

**最後のものが、いちばん多い。** \`index.html\` をダブルクリックで開いていませんか。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '届いたときには、もう要らないかもしれない',
      text: `
読み込みは待つ処理なので、待っているあいだに状況が変わることがあります。

ユーザーが別の画面へ移った、シーンを作り直した、
あるいはコンポーネントが破棄された ―
そのあとに読み込みが完了して scene.add() が走ると、
消したはずのものが復活したり、もう無いシーンに追加して例外になったりします。

「まだ生きているか」を示す印を 1 つ持ち、
コールバックの先頭で確かめてください。3 行で防げます。
`,
    },
    {
      kind: 'code',
      title: '取り消せるようにしておく',
      code: `let alive = true;

loader.load('/models/robot.glb', (gltf) => {
  if (!alive) return;          // もう要らない。何もしない
  scene.add(gltf.scene);
});

// 画面を離れるとき
function cleanup() {
  alive = false;
}

// fetch を使う自作のローダーなら AbortController で通信ごと止められる
const ac = new AbortController();
fetch(url, { signal: ac.signal });
// ac.abort();`,
    },
  ],
  exercises: [
    {
      prompt: `次のコードは、必ず \`TypeError\` になります。**なぜ**ですか。
2 通りの直し方を書いてください。

\`let model; loader.load(url, (gltf) => { model = gltf.scene; }); scene.add(model);\``,
      hint: '`load()` を呼んだ直後、`model` には何が入っていますか。',
      answer: `**\`load()\` が返ってきた時点では、まだ読み込みが終わっていないからです。**

**何が起きているか**

\`loader.load(url, cb)\` は、通信を**始めるだけ**で、すぐ次の行へ進みます。
コールバック \`cb\` が呼ばれるのは、ファイルが届いたあと ― 早くても数ミリ秒後です。

\`scene.add(model)\` はその**前**に実行されるので、\`model\` は \`undefined\` のままです。

**「上から順に効く」というこれまでの前提が、ここだけ通用しません。**

**直し方 1 ― 続きを、中に書く**

読み終わったあとにやることは、すべてコールバックの中に置きます。

\`loader.load(url, (gltf) => { scene.add(gltf.scene); })\`

いちばん確実ですが、続きが長くなると入れ子が深くなります。

**直し方 2 ― \`await\` で待つ**

\`loadAsync\` は Promise を返すので、\`await\` で「終わるまでここで待つ」と書けます。

\`const gltf = await loader.loadAsync(url); scene.add(gltf.scene);\`

**見た目が上から順になる**ので読みやすく、複数のモデルを読むときに特に効きます。
ただし \`await\` は \`async\` 関数の中でしか書けません。

**どちらでも同じ**です。読みやすいほうを選んでください。`,
      answerCode: `// 直し方 1
loader.load(url, (gltf) => {
  scene.add(gltf.scene);
});

// 直し方 2
async function setup() {
  const gltf = await loader.loadAsync(url);
  scene.add(gltf.scene);
}
setup();`,
    },
    {
      prompt: `$4$ つのモデルがあり、それぞれ読み込みに $0.3$ 秒かかります。

1. \`await\` を $4$ 回並べて順に待つと、合計何秒かかりますか。
2. \`Promise.all\` で同時に投げると何秒ですか。**なぜ**そうなりますか。`,
      hint: '読み込みのあいだ、CPU は何をしていますか。',
      answer: `**1. $1.2$ 秒。2. $0.3$ 秒。**

**1 ― 順に待つ場合**

$0.3 \\times 4 = 1.2$ 秒

$1$ つ目が届くまで $2$ つ目の要求すら出しません。
$4$ 回ぶんの往復が、そのまま足し算になります。

**2 ― 同時に投げる場合**

$4$ つの要求をいっぺんに出して、**いちばん遅いものが届くまで**待ちます。

$\\max(0.3,\\, 0.3,\\, 0.3,\\, 0.3) = 0.3$ 秒

**$4$ 倍速い。**

**なぜそうなるのか**

読み込みのあいだ、CPU は**何もしていません。** サーバの返事を待っているだけです。

「$0.3$ 秒ぶんの仕事」ではなく「$0.3$ 秒ぶんの待ち時間」なので、
**待つ相手を増やしても待ち時間は増えません。**

$4$ 人に同時に電話をかけて、全員の返事がそろうのを待つのと同じです。
$1$ 人ずつかけ直す理由がありません。

**ただし、いくらでも同時に投げてよいわけではありません。**

ブラウザは同じサーバへの同時接続数を制限しています（HTTP/1.1 で $6$ 本程度）。
$50$ 個のモデルを同時に投げても、実際には $6$ 本ずつ順番待ちになります。

それでも $1$ つずつよりはるかに速いので、**まず \`Promise.all\` を使ってください。**

**$1$ つ失敗したら全部止まるのが困る**なら \`Promise.allSettled\` にします。
届いたものだけ表示して、失敗したものは代わりの形で埋める ―
実務ではこちらのほうが親切です。`,
    },
    {
      prompt: `モデルを読み込んでいる最中に、ユーザーが別の画面へ移りました。
$0.5$ 秒後に読み込みが完了し、コールバックが走ります。

**何が起きますか。** どう防ぎますか。`,
      hint: '読み込みを始めたときのシーンは、まだ生きていますか。',
      answer: `**消したはずのシーンにモデルが追加されるか、もう無いものを触って例外になります。**

**起きること**

コールバックは「読み込みを始めたときの状況」を覚えたまま実行されます。

- \`scene.add(gltf.scene)\` … すでに捨てたシーンに足す。**メモリが解放されない**
- 画面を作り直していた場合 … **前の画面のモデルが新しい画面に出てくる**
- 参照していた変数が \`null\` にされていた場合 … \`TypeError\`

**いちばん厄介なのは、$1$ 番目です。** エラーが出ないので気づけません。
画面を行ったり来たりするたびに、捨てたはずのモデルが GPU にたまり続けます。

**防ぎ方 ― 「まだ生きているか」の印を持つ**

\`let alive = true;\` を用意し、コールバックの先頭で確かめます。

\`if (!alive) return;\`

画面を離れるときに \`alive = false\` にするだけです。**$3$ 行で防げます。**

**通信そのものを止めたいなら**

\`GLTFLoader\` には中断の口がありませんが、
自分で \`fetch\` して \`loader.parse()\` に渡す形にすれば、
\`AbortController\` で通信ごと止められます。

**ただし、たいていは止める必要がありません。**
数百 KB のファイルなら、届いてから捨てるほうが実装が単純で、事故も少なくて済みます。
**まず \`alive\` の印を入れてください。**

**同じ問題は、\`setTimeout\` や \`addEventListener\` にもあります。**
「あとで走るもの」を仕掛けたら、**片付ける段取りも一緒に書く** ―
これは three に限らず、画面を持つプログラム全般の作法です。`,
      answerCode: `let alive = true;

loader.load(url, (gltf) => {
  if (!alive) return;
  scene.add(gltf.scene);
});

// 画面を離れるとき（片付けの関数にまとめておく）
function cleanup() {
  alive = false;
  controls.dispose();
  renderer.setAnimationLoop(null);
}`,
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
        '読み込みは非同期なので、直後にはまだ何もありません。また `gltf` は箱で、シーンに追加するのはその中の `gltf.scene` です。`scene.add(gltf)` はエラーも出ないので、いちばん気づきにくい形で詰まります。',
    },
    {
      q: '3 つのモデルを読みます。もっとも速いのはどれですか（各 0.3 秒）。',
      choices: [
        '`Promise.all` で同時に投げて、まとめて待つ',
        '`await` を 3 回並べて順に待つ',
        '1 つ目のコールバックの中で 2 つ目を読む',
        '`requestAnimationFrame` の中で 1 つずつ読む',
      ],
      answer: 0,
      explain:
        '読み込み中の CPU は待っているだけなので、同時に投げても遅くなりません。順に待つと 0.9 秒、同時なら 0.3 秒です。',
    },
    {
      q: 'ローカルで `index.html` をダブルクリックして開いたら、モデルが読み込めません。原因はどれですか。',
      choices: [
        '`file://` では、ブラウザがファイルの読み込みを拒否する',
        'glTF が壊れている',
        'GLTFLoader のバージョンが古い',
        'WebGL が無効になっている',
      ],
      answer: 0,
      explain:
        'CORS の制約で `file://` からの読み込みはほぼすべて拒否されます。`npx vite` や `python -m http.server` でローカルサーバを立ててください。読み込みが動かないときに、いちばん多い原因です。',
    },
  ],
};
