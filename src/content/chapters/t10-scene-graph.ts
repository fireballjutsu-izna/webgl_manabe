import type { Chapter } from '../types.ts';

export const chapterT10: Chapter = {
  slug: 't10-scene-graph',
  part: 'threejs',
  number: 10,
  title: 'シーンを組み立てる',
  goal: '大きくなっても迷子にならないシーンの組み方が分かり、要らなくなったものを正しく片付けられるようになります。',
  requires: ['t09-loader', '09-hierarchy'],
  threeApis: [
    'Group',
    'Object3D.traverse',
    'Object3D.getObjectByName',
    'Object3D.visible',
    'Object3D.attach',
    'Layers',
    'BufferGeometry',
    'Material',
  ],
  mathRecall: [
    { slug: '09-hierarchy', note: '親の変換は子に丸ごとかぶさる' },
    { slug: '06-matrix', note: 'ワールド行列は親のものとの積' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## シーンは木

Three.js のシーンは、根がひとつの**木**です。\`Scene\` が根で、
その下にオブジェクトがぶら下がり、さらにその下にも……という入れ子になります。

[1-09 座標空間の階層](#/ch/09-hierarchy)でやったとおり、
**親の変換は子に丸ごとかぶさります**。この性質があるからこそ、
「車体を動かせば車輪もついてくる」が無料で手に入ります。

シーンが小さいうちは、何も考えずに \`scene.add()\` していて構いません。
問題になるのは、ものが増えてからです。
`,
    },
    {
      kind: 'md',
      text: `
## Group ― 意味のまとまりを作る

\`THREE.Group\` は形を持たない入れ物です。ただの入れ物ですが、効き目は大きい。

- **まとめて動かす・消す** … 部品ごとに触らなくてよくなります
- **回転の中心をずらす** … 物体の回転は必ず自分の原点まわりですが、
  Group の中でずらして置けば、任意の点を中心に回せます
- **探しやすくする** … 名前を付けておけば、あとから取り出せます

**「一緒に動くもの」「一緒に消えるもの」は同じ Group に入れる。**
この基準で分けておくと、後から困りません。
`,
    },
    {
      kind: 'sandbox',
      title: 'Group でまとめ、名前で取り出す',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(6, 4, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.8, 0);

const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(4, 6, 3);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.6));
scene.add(new THREE.GridHelper(16, 16, 0x3a3a5c, 0x26263c));

// 使い回すジオメトリとマテリアル（1つずつで足りる）
const bodyGeo = new THREE.BoxGeometry(2, 0.7, 1);
const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 20);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.4 });
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x2b3040, roughness: 0.8 });

function makeCar(name, x) {
  // 車 1 台ぶんのまとまり。これを動かせば全部ついてくる
  const car = new THREE.Group();
  car.name = name;
  car.position.x = x;

  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.name = 'body';
  body.position.y = 0.85;
  car.add(body);

  const wheels = new THREE.Group();
  wheels.name = 'wheels';
  for (const [wx, wz] of [[-0.7, 0.6], [0.7, 0.6], [-0.7, -0.6], [0.7, -0.6]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.35, wz);
    wheels.add(wheel);
  }
  car.add(wheels);

  return car;
}

const fleet = new THREE.Group();
fleet.name = 'fleet';
fleet.add(makeCar('car-a', -3), makeCar('car-b', 0), makeCar('car-c', 3));
scene.add(fleet);

// 名前で取り出す。深いところにあっても見つかる
const carB = scene.getObjectByName('car-b');
carB.getObjectByName('body').material = new THREE.MeshStandardMaterial({
  color: 0xffd166, roughness: 0.4,
});

// traverse で全部を回る。条件で絞り込むのが定番
let meshCount = 0;
scene.traverse((object) => {
  if (object.isMesh) meshCount++;
});
console.log('メッシュの数:', meshCount);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  // 隊列ごと回す。子は何も知らないままついてくる
  fleet.rotation.y = time * 0.3;

  // 車輪だけ回す
  scene.traverse((object) => {
    if (object.name === 'wheels') object.rotation.x = time * 4;
  });

  // 3秒ごとに1台だけ消す（visible なら作り直さずに済む）
  const carA = scene.getObjectByName('car-a');
  carA.visible = Math.floor(time / 1.5) % 2 === 0;

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
        '左の車が点滅しているのは `visible` の切り替えです。`fleet.rotation.y` を動かすだけで 3 台が隊列ごと回り、その中で車輪が独立して回っていることに注目してください。',
    },
    {
      kind: 'md',
      text: `
## 名前と userData

**名前**（\`object.name\`）は、3D ソフトで付けたものがそのまま読み込まれます。
\`getObjectByName()\` で深いところからでも取り出せるので、
モデルの一部だけ差し替えたいときの入口になります。

**userData** は、自分で好きな情報を持たせられる置き場です。
Three.js はここに一切触りません。glTF に書かれた追加情報もここに入ります。
\`mesh.userData = { id: 42, kind: 'enemy', hp: 100 }\` のように、何を入れても構いません
（[2-08 Raycaster](#/ch/t08-raycaster)で、クリックされた物体が何なのかを知るのに使いました）。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'traverse の中で木を書き換えない',
      text: `
\`traverse\` は木をたどりながらコールバックを呼びます。
その最中に \`add\` や \`remove\` をすると、**たどっている途中の並びが変わり**、
一部が飛ばされたり二重に処理されたりします。

消したいものがあるときは、いったん配列に集めてから、traverse の外で消してください。
`,
    },
    {
      kind: 'code',
      title: '安全に消す',
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
## 消すことと、片付けること

ここが Three.js でいちばん見落とされるところです。

**\`scene.remove(mesh)\` は、画面から消すだけです。**
ジオメトリもテクスチャも GPU のメモリに残り続けます。
シーンを何度も作り直すページでは、これがじわじわ効いてきて、やがて動かなくなります。

自動では消えません。JavaScript のガベージコレクタは GPU 側のメモリを知らないからです。
**自分で \`dispose()\` を呼ぶ必要があります。**
`,
    },
    {
      kind: 'code',
      title: '木ごと片付ける',
      code: `function disposeTree(root) {
  const materials = new Set();

  root.traverse((object) => {
    if (!object.isMesh) return;

    object.geometry.dispose();

    // 配列のこともある。共有されていることもあるので Set にためる
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) materials.add(material);
  });

  for (const material of materials) {
    // マテリアルが持つテクスチャも解放する
    for (const value of Object.values(material)) {
      if (value && value.isTexture) value.dispose();
    }
    material.dispose();
  }

  root.removeFromParent();
}

// レンダラ自体を捨てるときは
renderer.dispose();
controls.dispose();`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '消すより visible のほうが速い',
      text: `
「一時的に見せたくないだけ」なら、消して作り直すのは無駄です。
\`object.visible = false\` にすれば、その木は描画から外れます。
作り直しの費用（ジオメトリの構築、シェーダの用意）が丸ごと不要になるので、
**出したり消したりを繰り返すものは visible で切り替えてください。**
`,
    },
    {
      kind: 'md',
      text: `
## 大きくなってきたときの整え方

- **命名の規則を決める。** \`enemy/\`、\`ui/\` のように接頭辞を付けると探しやすくなります
- **見た目の階層と、意味の階層を混ぜない。** 見た目のために作った Group に
  ゲームの状態を持たせると、あとで動かしにくくなります
- **参照を持っておく。** 毎フレーム \`getObjectByName\` を呼ぶのは無駄です。
  一度取り出して変数に持ってください（木をたどる処理は安くありません）
- **Layers を使う。** カメラごとに見えるものを分けたいとき、
  \`object.layers\` と \`camera.layers\` で切り分けられます。
  Raycaster にも効くので、「触れるもの」だけを層で分ける手もあります
`,
    },
  ],
  exercises: [
    {
      prompt: '\`fleet\` の中の**すべての車のボディ**を、まとめて同じ色に変えてください。1 台ずつ名前で取り出すのではなく、たどって探します。',
      hint: 'traverse は、自分と子孫を全部たどってくれます。',
      answer: `\`traverse\` で全部たどり、名前が \`body\` のものだけを処理します。
\`getObjectByName\` は**最初に見つかった 1 つ**しか返さないので、同じ名前が複数あるときはたどるほうを使います。
なお、マテリアルは 3 台で共有しているので、\`material.color\` を書き換えると 1 行で全部変わります。
**それが困る場合だけ**、\`clone()\` して個別に持たせてください。`,
      answerCode: `fleet.traverse((object) => {
  if (object.name === 'body') {
    object.material = new THREE.MeshStandardMaterial({ color: 0xffd166 });
  }
});`,
    },
    {
      prompt: `車を 1 台、\`scene.remove(car)\` で消しました。これで後片付けは足りていますか。足りないなら何を足しますか。`,
      hint: 'シーンから外れても、GPU が持っているものは残ります。',
      answer: `足りません。\`remove\` は**シーンのつながりから外すだけ**で、GPU 上のジオメトリ・テクスチャは解放されません。
\`traverse\` して \`geometry.dispose()\` と \`material.dispose()\`（テクスチャがあればそれも）を呼びます。
ただし**共有しているものを捨ててはいけません**。この例では 3 台が同じジオメトリとマテリアルを使っているので、
1 台ぶんだけ捨てると残りの 2 台が壊れます。共有しているうちは捨てない、が原則です。`,
    },
  ],
  quiz: [
    {
      q: '`scene.remove(mesh)` を呼んだあと、GPU 側のメモリはどうなりますか。',
      choices: [
        '解放されない。geometry と material を自分で dispose する必要がある',
        '自動的に解放される',
        'ガベージコレクタが後で解放する',
        'renderer.render を呼んだときに解放される',
      ],
      answer: 0,
      explain:
        'JavaScript のガベージコレクタは GPU 側のメモリを知りません。シーンを作り直すページでは、これが積み重なってやがて動かなくなります。',
    },
    {
      q: '物体を一時的に見せたくないだけのとき、いちばん軽い方法はどれですか。',
      choices: [
        '`object.visible = false`',
        '`scene.remove(object)` して、あとで作り直す',
        'マテリアルを透明にする',
        'カメラの far を縮める',
      ],
      answer: 0,
      explain:
        'visible を切ればその木ごと描画から外れます。作り直しの費用がかからないので、出し入れを繰り返すものには最適です。',
    },
    {
      q: '`traverse` の中で `removeFromParent()` を呼ぶと、何が起きますか。',
      choices: [
        'たどっている途中の並びが変わり、一部が飛ばされることがある',
        'エラーになって止まる',
        '問題なく動く',
        '木が丸ごと消える',
      ],
      answer: 0,
      explain:
        '走査中に子の配列を書き換えるためです。消したいものをいったん配列に集めておき、traverse の外で処理してください。',
    },
  ],
};
