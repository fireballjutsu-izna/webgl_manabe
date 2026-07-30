import type { Chapter } from '../types.ts';

export const chapterT02: Chapter = {
  slug: 't02-geometry',
  part: 'threejs',
  number: 2,
  title: '形を作る ― ジオメトリ',
  goal: '組み込みの形を選べるようになり、頂点を自分で並べて三角形から形を組み立てられるようになります。',
  requires: ['t01-first-scene', '04-cross'],
  threeApis: [
    'BufferGeometry',
    'BufferAttribute',
    'BoxGeometry',
    'SphereGeometry',
    'TorusKnotGeometry',
    'BufferGeometry.setAttribute',
    'BufferGeometry.setIndex',
    'BufferGeometry.computeVertexNormals',
  ],
  mathRecall: [
    { slug: '01-space', note: '頂点の位置は x・y・z の3つ組' },
    { slug: '04-cross', note: '法線は2辺の外積で作れる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 形の正体は、三角形の集まり

球も、箱も、読み込んだキャラクターも、GPU から見ればすべて**三角形の集まり**です。
なめらかな球に見えるものも、拡大すれば平らな三角形が並んでいるだけです。

Three.js でその「三角形の集まり」を持っているのが{{ジオメトリ}}（\`BufferGeometry\`）で、
\`BoxGeometry\` や \`SphereGeometry\` はその作り方を用意してくれた便利な子クラスにすぎません。

**ジオメトリは形だけを持ちます。**色や質感は{{マテリアル}}（次の章）の担当で、
置き場所や向きは{{メッシュ}}（\`Mesh\`）が持ちます。この 3 つの分担がはっきりしていることが、
Three.js の見通しのよさの源です。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '粘土・絵の具・置き台',
      text: `
ジオメトリが粘土でこねた形、マテリアルが塗る絵の具、Mesh が「その形にその色を塗って、
ここに置く」という指示書です。同じ粘土型から色違いをいくつも作れますし、
逆に同じ絵の具をいろいろな形に塗れます。だから**ジオメトリとマテリアルは使い回せます**。
`,
    },
    {
      kind: 'md',
      text: `
## まずは組み込みの形から

自分で頂点を並べる前に、用意されているものを知っておくと早いです。
下のコードでは 6 種類を並べています。**引数の数字を変えて、形がどう変わるか見てください。**

とくに **分割数**（\`SphereGeometry\` の 2 番目・3 番目の引数など）は、
なめらかさと重さの両方を決める大事なつまみです。
`,
    },
    {
      kind: 'sandbox',
      title: '組み込みジオメトリを並べる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(3, 5, 4);
scene.add(key, new THREE.HemisphereLight(0x8899ff, 0x101020, 0.7));

// 数字を変えてみてください。分割数を下げるとカクカクになります
const shapes = [
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.SphereGeometry(0.65, 24, 16),
  new THREE.CylinderGeometry(0.5, 0.5, 1.2, 24),
  new THREE.ConeGeometry(0.6, 1.2, 24),
  new THREE.TorusGeometry(0.5, 0.2, 16, 40),
  new THREE.TorusKnotGeometry(0.45, 0.15, 90, 12),
];

const material = new THREE.MeshStandardMaterial({ color: 0x7fb2ff, roughness: 0.45 });

shapes.forEach((geometry, i) => {
  const mesh = new THREE.Mesh(geometry, material);   // マテリアルは使い回せる
  mesh.position.x = (i - (shapes.length - 1) / 2) * 1.8;
  scene.add(mesh);
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
        'ドラッグで視点を回せます。`SphereGeometry(0.65, 24, 16)` の 24 と 16 を 5 と 4 にすると、なめらかな球が一気に多面体になります。',
    },
    {
      kind: 'md',
      text: `
## 頂点を自分で並べる

組み込みの形で足りないときは、頂点を直接並べます。
必要なのは、**位置の並んだ 1 本の配列**だけです。

x, y, z, x, y, z, … と平らに並べ、3 つで 1 頂点、3 頂点で 1 三角形と数えます。
この「1 頂点あたり 3 つ」を Three.js に教えるのが \`new THREE.BufferAttribute(array, 3)\` の 3 です。
`,
    },
    {
      kind: 'formula',
      tex: '[\\,x_0, y_0, z_0,\\; x_1, y_1, z_1,\\; x_2, y_2, z_2\\,]',
      readAloud:
        '三角形 1 枚ぶんの配列です。区切りは入っていません。「3 つずつで 1 頂点」という約束だけで読み分けます。頂点が増えても、この並びが続くだけです。',
      worked: {
        given: '頂点 $(-1,\\,0,\\,0)$、$(1,\\,0,\\,0)$、$(0,\\,1,\\,0)$ の三角形 1 枚を、この形に並べます。',
        steps: [
          { calc: '[-1, 0, 0,   1, 0, 0,   0, 1, 0]', note: '区切りは無い。空きは読みやすさのために入れただけ' },
          { calc: '配列の長さ : 9' },
          { calc: '9 / 3 = 3 頂点', note: '3 つずつで 1 頂点、という約束だけで読み分ける' },
          { calc: '3 頂点 / 3 = 三角形 1 枚' },
        ],
        result: '四角形にしたければ 12 個（4 頂点）並べ、インデックスで `[0,1,2, 0,2,3]` と指定します。**頂点を 6 つ並べるより、4 つ＋順番のほうが安い**というのが、インデックスを使う理由です。',
      },
    },
    {
      kind: 'md',
      text: `
## 表と裏 ― 頂点を並べる向き

三角形には表と裏があり、**頂点を反時計回りに並べた側が表**になります。
既定では裏面は描かれない（見えない面を捨てて速くする仕組み）ので、
順番を逆にすると三角形が消えます。

下のコードで、\`positions\` の 2 番目と 3 番目の頂点を入れ替えてみてください。消えるはずです。
`,
    },
    {
      kind: 'sandbox',
      title: '三角形と四角形を、頂点から組み立てる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(2, 4, 5);
scene.add(key, new THREE.HemisphereLight(0x8899ff, 0x101020, 0.7));

// --- 三角形1枚 ---
// 3つずつで1頂点。反時計回りに並べた側が表になる
const positions = new Float32Array([
  -2.4, -0.6, 0,   // 頂点0
  -0.8, -0.6, 0,   // 頂点1
  -1.6,  0.8, 0,   // 頂点2
]);

const triangle = new THREE.BufferGeometry();
triangle.setAttribute('position', new THREE.BufferAttribute(positions, 3));
triangle.computeVertexNormals();  // 法線がないと真っ黒（2辺の外積で作られる）

scene.add(new THREE.Mesh(
  triangle,
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, side: THREE.DoubleSide }),
));

// --- 四角形（インデックスで頂点を使い回す） ---
// 四角形は三角形2枚。4頂点を共有すれば、6頂点ぶん並べずに済む
const quad = new THREE.BufferGeometry();
quad.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
  0.8, -0.6, 0,   // 0 左下
  2.4, -0.6, 0,   // 1 右下
  2.4,  0.8, 0,   // 2 右上
  0.8,  0.8, 0,   // 3 左上
]), 3));
quad.setIndex([0, 1, 2,  0, 2, 3]);   // どの頂点で三角形を作るか
quad.computeVertexNormals();

scene.add(new THREE.Mesh(
  quad,
  new THREE.MeshStandardMaterial({ color: 0xffd166, side: THREE.DoubleSide }),
));

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
        '`side: THREE.DoubleSide` を消してから頂点の順番を入れ替えると、面が消えます。`computeVertexNormals()` を消すと真っ黒になります。',
    },
    {
      kind: 'md',
      text: `
## インデックス ― 頂点の使い回し

四角形は三角形 2 枚ですが、素直に並べると 6 頂点必要です。
ところが実際の角は 4 つしかなく、2 頂点は重複しています。

そこで**頂点は 4 つだけ用意して、「何番と何番と何番で三角形を作る」という番号の列**を別に渡します。
これが{{インデックス}}です。立方体なら 36 頂点が 8 頂点に、球ならもっと劇的に減ります。

メモリと転送量が減るうえ、GPU は同じ頂点の計算結果を使い回せるので速くなります。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '法線がないと真っ黒になります',
      text: `
自分で組んだジオメトリには法線が入っていません。[](#/ch/11-normal-light)
でやったとおり、明るさは法線と光の内積で決まるので、法線がなければ計算のしようがありません。
\`geometry.computeVertexNormals()\` を呼ぶと、[](#/ch/04-cross)の要領で
2 辺の外積から自動的に作ってくれます。
`,
    },
    {
      kind: 'md',
      text: `
## 頂点が持てるもの

位置以外にも、頂点ごとに情報を持たせられます。よく使うのはこの 3 つです。

- **position** … 位置（必須）
- **normal** … その頂点が向いている向き。明るさの計算に使う
- **uv** … テクスチャのどこを貼るか（[](#/ch/t04-texture)で扱います）

ほかに \`color\` を持たせて頂点ごとに色を変えることもできますし、
自分で決めた名前の属性を追加して、シェーダから読むこともできます
（[](#/ch/t12-shader-intro)）。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '分割数は「見た目が変わらなくなるまで」下げる',
      text: `
球の分割数を 64 から 24 に落としても、小さく映るなら見分けはつきません。
それでいて三角形の数は 7 分の 1 以下になります。
**遠くにあるもの・小さいものほど分割数を下げる**のが、いちばん効く軽量化です。
`,
    },
    {
      kind: 'md',
      text: `
## 後片付け

ジオメトリは GPU 側にメモリを確保します。作り直して捨てるときは
\`geometry.dispose()\` を呼んでください。呼ばないぶんだけ確保されたまま残り続けます。

逆に、**使い回すなら 1 つ作って共有する**のが正解です。
同じ形の箱を 100 個置くなら、\`BoxGeometry\` は 1 つで足ります。
`,
    },
    {
      kind: 'code',
      title: 'ジオメトリとマテリアルは共有する',
      code: `// 良い例：1つ作って100個で共有する
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x4fd6ff });

for (let i = 0; i < 100; i++) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    THREE.MathUtils.randFloatSpread(20),
    0,
    THREE.MathUtils.randFloatSpread(20),
  );
  scene.add(mesh);
}

// 捨てるときは自分で解放する（共有しているなら最後に1回だけ）
geometry.dispose();
material.dispose();`,
    },
  ],
  exercises: [
    {
      prompt: '1 つ目のサンドボックスで、球の \`SphereGeometry(0.65, 24, 16)\` を \`SphereGeometry(0.65, 6, 4)\` にしてください。何が変わりますか。トーラスノットの \`90, 12\` も下げてみてください。',
      hint: '2 番目と 3 番目の数字は、縦横をいくつに分けるかです。',
      answer: `カクカクになります。丸いものは**細かい平面の集まりで近似している**だけなので、分割数を下げると近似が粗くなるからです。
分割数は見た目と重さの取引です。遠くにあるもの、小さく映るものは、分割を下げてもまず気づかれません。
第2部 [](#/ch/t11-performance) でこの話に戻ります。`,
    },
    {
      prompt: `2 つ目のサンドボックスで、三角形のマテリアルから \`side: THREE.DoubleSide\` を消してください。
そのうえで、\`positions\` の**頂点 0 と頂点 1 を入れ替えて**ください。何が起きますか。`,
      hint: '既定では、三角形は片側からしか見えません。どちら側が「表」になるかは、頂点を並べた向きで決まります。',
      answer: `三角形が**見えなくなります**（裏を向くため）。
Three.js は既定で、頂点を**反時計回りに見える側**を表とし、裏面は描きません（背面カリング）。
順番を入れ替えると時計回りになるので、表が反対側を向きます。
「モデルの一部だけが消える」「内側から見ると壁が透ける」は、たいていこれです。
直し方は 2 つ。頂点の順番を直すか、\`side: THREE.DoubleSide\` を付けるかです（後者は描く量が増えます）。`,
    },
  ],
  quiz: [
    {
      q: '`BufferGeometry` に位置を渡すとき、`new THREE.BufferAttribute(array, 3)` の **3** は何を表していますか。',
      choices: [
        '1つの頂点が3つの数（x・y・z）でできていること',
        '三角形の枚数',
        '頂点の総数',
        '小数点以下の桁数',
      ],
      answer: 0,
      explain:
        '配列は平らに並んでいるだけなので、「いくつずつで1組か」を教える必要があります。位置なら3、UV なら2 になります。',
    },
    {
      q: '自分で頂点を並べて作った面が真っ黒に描画されます。原因として最も多いのはどれですか。',
      choices: [
        '法線がないので明るさを計算できない',
        'インデックスを渡していない',
        'カメラが近すぎる',
        '頂点の数が奇数',
      ],
      answer: 0,
      explain:
        '`geometry.computeVertexNormals()` を呼ぶと、2辺の外積から法線が作られます。ライトを置き忘れていないかも合わせて確認してください。',
    },
    {
      q: 'インデックスを使う利点はどれですか。',
      choices: [
        '重複する頂点をひとつにまとめられ、データが小さく描画も速くなる',
        '法線が自動で作られる',
        '色を頂点ごとに変えられる',
        '面の裏表が自動で決まる',
      ],
      answer: 0,
      explain:
        '四角形なら6頂点が4頂点に減ります。GPU は同じ頂点の計算結果を使い回せるので、転送量とメモリだけでなく処理も軽くなります。',
    },
  ],
};
