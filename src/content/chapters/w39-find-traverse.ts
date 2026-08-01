import type { Chapter } from '../types.ts';

export const chapterW39: Chapter = {
  slug: 'w39-find-traverse',
  part: 'threejs',
  number: 39,
  title: '探す・たどる ― 名前と userData',
  goal: '木の中から目的のものを取り出せるようになり、traverse を安全に使い分けられるようになります。',
  requires: ['t10-scene-graph'],
  mathRecall: [
    { slug: '09-hierarchy', note: '探すというのは、木をたどること' },
  ],
  threeApis: [
    'Object3D.traverse',
    'Object3D.traverseVisible',
    'Object3D.getObjectByName',
    'Object3D.getObjectByProperty',
    'Object3D.name',
    'Object3D.userData',
    'Object3D.removeFromParent',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 読み込んだものには、名前が付いている

自分で組んだシーンなら、変数を持っておけば済みます。
**問題は、読み込んだモデル**です。

\`gltf.scene\` の中身がどうなっているかは、作った人しだい。
それでも、**\`name\` だけは頼りにできます** ―
3D ソフトで付けた名前が、そのまま \`object.name\` に入ってくるからです。

だから読み込んだモデルの一部を触りたいときは、まず名前で探します。
`,
    },
    {
      kind: 'code',
      title: 'まず、中身を見る',
      code: `const gltf = await loader.loadAsync('/models/robot.glb');

// 何が入っているのか、最初に 1 度だけ見る
gltf.scene.traverse((object) => {
  console.log(object.type, object.name);
});

// 木の形のまま見たいとき（ブラウザのコンソールで折りたためる）
console.log(gltf.scene);

// 名前で 1 つ取り出す。深いところにあっても見つかる
const door = gltf.scene.getObjectByName('Door');

// name 以外でも探せる
const firstMesh = gltf.scene.getObjectByProperty('isMesh', true);`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'getObjectByName は 1 つしか返さない',
      text: `
見つかった最初の 1 つを返して、そこで止まります。

同じ名前が複数あっても、2 つ目以降は返ってきません。
そして「1 つしか無い」と思い込んでいると、まず気づけません。

3D ソフトが自動で付ける名前は Cube.001、Cube.002 のように
枝番が付くので重複しませんが、手で付けた名前は重複します。

複数あるなら traverse で集めてください。
`,
    },
    {
      kind: 'md',
      text: `
## traverse ― 全部をたどる

\`object.traverse(fn)\` は、**自分自身と、すべての子孫**を順に回ります。

読み込んだモデルの全メッシュに影を設定する、
マテリアルを差し替える、名前を数える ―
「全部に対して同じことをする」なら、これです。

**\`traverseVisible\`** もあります。\`visible = false\` の枝には降りません。
描画されているものだけを数えたいときに使います。
`,
    },
    {
      kind: 'code',
      title: 'traverse で中身をまとめて整える',
      code: `model.traverse((child) => {
  if (!child.isMesh) return;

  // 影は物体ごとの設定。親に付けても子には伝わらない
  child.castShadow = true;
  child.receiveShadow = true;

  // 名前で見分けて、一部だけ差し替える
  if (child.name === 'Glass') {
    child.material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transmission: 1, roughness: 0.05, thickness: 0.5,
    });
  }

  // 読み込んだ材質の一部だけ変えることもできる
  child.material.envMapIntensity = 1.5;
});`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'traverse の中で木を書き換えない',
      text: `
traverse は木をたどりながらコールバックを呼びます。

その最中に add や remove をすると、たどっている途中の並びが変わります。

three は子の数を「回り始めるとき」に読んで固定するので、
途中で減ると添字が配列の外へ出て、
TypeError: Cannot read properties of undefined (reading 'traverse')
で止まります。

しかも止まる前に、1 つおきに何個か消えています ――
「途中まで壊れた状態で例外」がいちばん厄介です。

消したいものがあるときは、いったん配列に集めてから、
traverse の外で消してください。
`,
    },
    {
      kind: 'code',
      title: '安全に消す ― 集めてから、外で',
      code: `// いったん集める
const doomed = [];
scene.traverse((object) => {
  if (object.userData.kind === 'enemy') doomed.push(object);
});

// traverse の外で消す
for (const object of doomed) {
  object.removeFromParent();
}`,
    },
    {
      kind: 'md',
      text: `
## userData ― 自分の情報を持たせる

\`object.userData\` は、好きなものを入れておける置き場です。
**Three.js はここに一切触りません。**

\`mesh.userData = { kind: 'enemy', hp: 100, owner: model }\` のように、
何を入れても構いません。

[](#/ch/w31-hover-click)で「拾えたら本体へ戻る」ために使い、
[](#/ch/w33-pick-cost)で代役コライダーから本体をたどるのにも使いました。

**glTF の追加情報もここに入ります。** Blender のカスタムプロパティは
\`userData\` に、拡張は \`userData.gltfExtensions\` に届きます。

**気をつけること $2$ つ。**

- **\`clone()\` は浅くコピーします。** \`userData\` の中のオブジェクトは共有されます
- **参照を持たせると、片付けのときに困ります。**
  \`userData.owner\` のような相互参照は、消したつもりで残ります
`,
    },
    {
      kind: 'sandbox',
      title: '名前で探す・たどって集める',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(6, 5, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.9, 0);

const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(4, 6, 3);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.6));
scene.add(new THREE.GridHelper(16, 16, 0x3a3a5c, 0x26263c));

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const roofGeo = new THREE.ConeGeometry(0.85, 0.8, 4);
const plain = new THREE.MeshStandardMaterial({ color: 0x5f6b96, roughness: 0.5 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0x2b3040, roughness: 0.8 });

// 「読み込んだモデル」のつもり。名前だけを頼りに触る
const village = new THREE.Group();
village.name = 'Village';
for (let i = 0; i < 6; i++) {
  const house = new THREE.Group();
  house.name = 'House_' + i;
  house.position.set((i % 3 - 1) * 3, 0, (Math.floor(i / 3) - 0.5) * 3);

  const wall = new THREE.Mesh(boxGeo, plain);
  wall.name = 'Wall';
  wall.position.y = 0.5;
  house.add(wall);

  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.name = 'Roof';
  roof.position.y = 1.4;
  roof.rotation.y = Math.PI / 4;
  house.add(roof);

  // 3 軒目だけ、ちょっと違う扱いにしたい
  if (i === 2) house.userData.kind = 'shop';

  village.add(house);
}
scene.add(village);

const readout = document.createElement('div');
readout.style.cssText =
  'position:fixed;left:12px;top:12px;padding:8px 12px;border-radius:8px;' +
  'background:rgba(10,10,18,.82);color:#e8e8f2;font:13px/1.7 monospace;' +
  'border:1px solid #3a3a5c;white-space:pre';
document.body.appendChild(readout);

// --- 1. 名前で 1 つ取り出す（最初の 1 つだけ返る）
const first = village.getObjectByName('Roof');
first.material = new THREE.MeshStandardMaterial({ color: 0xff6b8a, roughness: 0.6 });

// --- 2. たどって「全部」集める。同じ名前が 6 つあるので getObjectByName では足りない
const roofs = [];
village.traverse((object) => {
  if (object.name === 'Roof') roofs.push(object);
});
// 最初の 1 つは赤にしたので、残りをアンバーに
const amber = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.6 });
for (const roof of roofs.slice(1)) roof.material = amber;

// --- 3. userData で見分ける
const shops = [];
village.traverse((object) => {
  if (object.userData.kind === 'shop') shops.push(object);
});
for (const shop of shops) shop.position.y = 0.35;

// --- 4. 数える
let meshes = 0;
let groups = 0;
village.traverse((object) => {
  if (object.isMesh) meshes++;
  else if (object.isGroup) groups++;
});

readout.textContent =
  'getObjectByName("Roof")  → 1 個（赤）\\n' +
  'traverse で集めた Roof   → ' + roofs.length + ' 個\\n' +
  'userData.kind === shop   → ' + shops.length + ' 個（浮いている）\\n' +
  'Mesh ' + meshes + ' / Group ' + groups;

renderer.setAnimationLoop(() => {
  village.rotation.y += 0.0025;
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**屋根は $6$ つあるのに、`getObjectByName("Roof")` で赤くなったのは $1$ つだけ**です。残り $5$ つは `traverse` で集めてアンバーにしています。浮いている $1$ 軒は `userData.kind === "shop"` で選びました ― 名前ではなく、自分で付けた印です。',
    },
    {
      kind: 'md',
      text: `
## 毎フレーム探さない

\`getObjectByName\` も \`traverse\` も、**木を根からたどります。**

$1$ 回なら何ということもありませんが、
**描画ループの中で呼ぶと、毎フレーム全部をたどります。**

$2{,}000$ 個のシーンで $60$ fps なら、毎秒 $12$ 万回の走査です。

**一度取り出して、変数に持ってください。**

読み込みが終わった直後に必要なものを全部取り出し、
オブジェクトにまとめておくのが定石です。
`,
    },
    {
      kind: 'code',
      title: '入口で 1 度だけ、まとめて取り出す',
      code: `// 読み込み直後に 1 回だけ走査して、必要な参照を集める
function indexModel(root) {
  const parts = { doors: [], lights: [], wheels: null };

  root.traverse((object) => {
    if (object.name.startsWith('Door')) parts.doors.push(object);
    else if (object.isLight) parts.lights.push(object);
    else if (object.name === 'Wheels') parts.wheels = object;
  });

  return parts;
}

const parts = indexModel(gltf.scene);

// 以後、描画ループでは探さない
renderer.setAnimationLoop(() => {
  parts.wheels.rotation.x += 0.05;
  renderer.render(scene, camera);
});`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '名前は、自分で付け直してよい',
      text: `
読み込んだ名前が Cube.003 のようで扱いにくいなら、
入口で付け替えてしまうのが早い。

object.name = 'left-door' と書けるので、
「モデルの名前」と「コードが使う名前」を切り離せます。

3D ソフト側で名前が変わっても、直すのは入口の 1 か所で済みます。

接頭辞の規則（ui-、enemy-）を決めておくと、
startsWith で一気に集められるようになります。
`,
    },
  ],
  exercises: [
    {
      prompt: `読み込んだモデルの中に、\`Wheel\` という名前のメッシュが $4$ つあります。
\`const wheel = model.getObjectByName('Wheel')\` で取り出して回したところ、
**$1$ つしか回りません。**

原因と、$4$ つとも回す書き方を書いてください。`,
      hint: '`getObjectByName` は、いくつ返しますか。',
      answer: `**\`getObjectByName\` は、見つかった最初の $1$ つしか返さないからです。**

**何が起きているか**

\`getObjectByName\` は木をたどって、名前が一致した**最初の $1$ つ**を返し、
そこで探索をやめます。

残り $3$ つは見つけられているのに、返ってきません。
**エラーも警告も出ません。**

**「$1$ つしか無い」と思い込んでいると、まず気づけない**類の不具合です。

**直し方 ― たどって集める**

\`traverse\` で全部回り、名前が一致したものを配列にためます。

そのあと配列を回して、$4$ つとも設定します。

**もっと良いのは、$1$ 度だけ集めておくこと**

描画ループの中で毎フレーム \`traverse\` を呼ぶと、毎回木を全部たどります。

読み込み直後に $1$ 度だけ集めて配列に持ち、
ループではその配列を回してください。

**なぜ名前が重複するのか**

3D ソフトが自動で付ける名前は \`Wheel.001\`、\`Wheel.002\` のように
枝番が付くので重複しません。

重複するのは、**人が手で付けた**か、
**同じ部品を複製した**場合です。どちらもよくあります。

**予防**

読み込みの入口で、名前を自分の規則に付け替えてしまうのが確実です。

\`wheels[i].name = 'wheel-' + i\` のようにしておけば、
以後は取り違えません。`,
      answerCode: `// 読み込み直後に 1 度だけ集める
const wheels = [];
model.traverse((object) => {
  if (object.name === 'Wheel') wheels.push(object);
});

// 以後、ループでは探さない
renderer.setAnimationLoop(() => {
  for (const wheel of wheels) wheel.rotation.x += 0.05;
  renderer.render(scene, camera);
});`,
    },
    {
      prompt: `敵を全部消すつもりで、こう書きました。

\`scene.traverse(o => { if (o.userData.kind === 'enemy') o.removeFromParent(); })\`

敵は $6$ 体。**$3$ 体だけ消えたところで \`TypeError\` が出て止まります。**
なぜ $3$ 体で、なぜ例外なのか、両方を説明してください。`,
      hint: '`traverse` は、子の数をいつ読んでいますか。',
      answer: `**たどっている最中に、その配列から要素を抜いているからです。**

**なぜ $3$ 体なのか**

\`traverse\` は子の配列を \`0, 1, 2, …\` と順に見ていきます。

添字 $0$ の敵を消すと、後ろが**前へ詰まります。**
それまで添字 $1$ にいた敵が、添字 $0$ に移る。

ところが \`traverse\` の側は「$0$ は見た」と思って**添字 $1$ へ進みます。**

だから見えるのは $0$ 番目、$2$ 番目、$4$ 番目 ― **$1$ つおき**です。
$6$ 体なら $3$ 体。残るのは $1$、$3$、$5$ 番目の $3$ 体です。

**なぜ例外になるのか**

three の \`traverse\` は、繰り返しの上限を**回り始めるときに読んで固定します。**

\`for (let i = 0, l = children.length; i < l; i++)\` の \`l\` が $6$ のまま、
配列のほうは $3$ に縮んでいます。

だから添字 $3$ で \`children[3]\` が \`undefined\` になり、
そこに \`.traverse()\` を呼ぼうとして落ちます。

\`TypeError: Cannot read properties of undefined (reading 'traverse')\`

**この $2$ つが同時に起きるのが、いちばん厄介**です。
例外で止まったときには、**すでに $3$ 体消えたあと** ―
シーンが中途半端な状態のまま、以降の処理も走りません。

**直し方 ― 集めてから、外で消す**

いったん配列にためて、\`traverse\` が終わってから消します。

配列を作る側は木を書き換えないので、走査は最後まで正しく回ります。

**同じ形の間違いは、あちこちにあります**

「回している最中に、回している対象を変える」は、
JavaScript の配列でも同じです。

\`for (const x of list) list.splice(...)\` は同じ理由で壊れます。

**後ろから回すという手もあります**（\`for (let i = n - 1; i >= 0; i--)\`）が、
\`traverse\` の中身には手が届きません。**集めてから外で、が唯一の手**です。

**確かめ方**

消す前に \`doomed.length\` を出力してください。
$6$ になっていれば集める側は正しく、$3$ なら集める段階で既に間違えています。

**例外が出るぶん、まだ親切なほうです。**
子が $1$ 体だけ、それが最後の添字だった、という場合は
例外にならずに黙って通ります ― **たまたま動いてしまう**ぶん、そちらが厄介です。`,
      answerCode: `// いったん集める（木は書き換えない）
const doomed = [];
scene.traverse((object) => {
  if (object.userData.kind === 'enemy') doomed.push(object);
});

console.log('消す数', doomed.length);   // 6 になるはず

// traverse の外で消す
for (const object of doomed) {
  object.removeFromParent();
}`,
    },
    {
      prompt: `シーンに $2{,}000$ 個のオブジェクトがあります。
描画ループの中で \`scene.getObjectByName('player')\` を呼んでいます。

**$1$ 秒あたり何回**、木のノードをたどることになりますか（$60$ fps）。
どう直しますか。`,
      hint: '`getObjectByName` は、見つかるまで木をたどります。',
      answer: `**最悪で毎秒 $12$ 万回。$1$ 度だけ取り出して変数に持ちます。**

**回数**

\`getObjectByName\` は根から木をたどり、見つかったところで止まります。

いちばん最後に見つかる場合、$1$ 回の呼び出しで $2{,}000$ ノードを見ます。

$2{,}000 \\times 60 = 120{,}000$ 回／秒

平均でも半分の $6$ 万回です。

**それは重いのか**

文字列の比較 $12$ 万回は、いまの CPU なら $1$ ミリ秒前後です。
$60$ fps の $1$ フレームは $16.7$ ミリ秒なので、**$6\\%$ ほど**。

**それ単体では致命的ではありません。** 問題は、こういう呼び出しが
$1$ か所では終わらないことです。

プレイヤー、カメラの注視点、UI、敵の親 ―
$5$ か所あれば $30\\%$ が探索に消えます。**しかも $1$ 個も得るものがない。**

**直し方**

読み込み・組み立てが終わった時点で $1$ 度だけ取り出し、変数に持ちます。

\`const player = scene.getObjectByName('player');\`

以後、ループではその変数を使うだけ。**探索は $0$ 回**になります。

**必要なものをまとめて取り出す**

$1$ つずつ \`getObjectByName\` を呼ぶより、
\`traverse\` を $1$ 回だけ回して必要な参照を全部集めるほうが速い ―
木を $1$ 周するだけで済みます。

**原則**

**探すのは、形が変わったときだけ。**

毎フレーム同じ答えが返ってくる処理は、毎フレーム呼ぶ必要がありません。
これは three に限らず、描画ループの中に置くもの全部に言えることです。`,
      answerCode: `// 組み立てが終わった時点で 1 度だけ
const refs = {};
scene.traverse((object) => {
  if (object.name === 'player') refs.player = object;
  else if (object.name === 'target') refs.target = object;
});

renderer.setAnimationLoop(() => {
  refs.player.position.x += 0.02;   // 探索は 0 回
  controls.target.copy(refs.target.position);
  renderer.render(scene, camera);
});`,
    },
  ],
  quiz: [
    {
      q: '同じ名前のメッシュが 4 つあります。`getObjectByName` は何個返しますか。',
      choices: [
        '1 個。最初に見つかったものだけ',
        '4 個の配列',
        'エラーになる',
        '最後に見つかったもの',
      ],
      answer: 0,
      explain:
        '見つかった時点で探索をやめます。エラーも警告も出ないので、「1 つしか無い」と思い込んでいると気づけません。複数あるなら `traverse` で集めてください。',
    },
    {
      q: '`traverse` の中で `removeFromParent()` を呼ぶと、何が起きますか。',
      choices: [
        '1 つおきに飛ばされ、そのあと添字が配列の外へ出て TypeError で止まる',
        '一部が飛ばされるだけで、エラーは出ない',
        '問題なく動く',
        '木が丸ごと消える',
      ],
      answer: 0,
      explain:
        '子の配列から要素を抜くと後ろが前へ詰まり、走査側は次の添字へ進みます。さらに繰り返しの上限は回り始めるときに固定されるので、縮んだ配列の外を読んで落ちます。6 体なら 3 体消えたところで例外 ― 中途半端に壊れた状態で止まるのが厄介です。集めてから traverse の外で消してください。',
    },
    {
      q: '描画ループの中で `getObjectByName` を呼ぶのは、なぜ避けるべきですか。',
      choices: [
        '毎フレーム木を根からたどるのに、答えは毎回同じだから',
        '名前が変わることがあるから',
        'GPU に負担がかかるから',
        '非同期だから',
      ],
      answer: 0,
      explain:
        '2,000 個のシーンなら毎秒 12 万回の走査です。一度取り出して変数に持てば 0 回になります。探すのは、木の形が変わったときだけで足ります。',
    },
  ],
};
