import type { Chapter } from '../types.ts';

export const chapterT02: Chapter = {
  slug: 't02-geometry',
  part: 'threejs',
  number: 5,
  title: '形を作る ― ジオメトリ・マテリアル・メッシュ',
  goal: '3 つの部品の分担が分かり、組み込みの形を選んで分割数を狙って決められるようになります。',
  requires: ['w04-blank-screen', '01-space'],
  threeApis: [
    'BufferGeometry',
    'BoxGeometry',
    'SphereGeometry',
    'CylinderGeometry',
    'ConeGeometry',
    'TorusGeometry',
    'TorusKnotGeometry',
    'Mesh',
    'BufferGeometry.dispose',
  ],
  mathRecall: [
    { slug: '01-space', note: '頂点の位置は x・y・z の 3 つ組' },
    { slug: 'b10-pythagoras', note: '球は「原点からの距離が一定」の点の集まり' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 形の正体は、三角形の集まり

球も、箱も、読み込んだキャラクターも、GPU から見ればすべて**三角形の集まり**です。
なめらかな球に見えるものも、拡大すれば平らな三角形が並んでいるだけです。

**GPU は三角形しか描けません。** 円も曲面も知りません。
だから「丸いもの」は、細かい三角形で近似して丸く見せているだけです。

Three.js でその「三角形の集まり」を持っているのが{{ジオメトリ}}（\`BufferGeometry\`）で、
\`BoxGeometry\` や \`SphereGeometry\` は、その並べ方を用意してくれた便利な子クラスにすぎません。
`,
    },
    {
      kind: 'md',
      text: `
## 3 つに分かれている

画面に 1 つの物体を出すのに、Three.js では 3 つの部品を使います。

- **ジオメトリ** … 形だけ。頂点がどこにあるか
- **{{マテリアル}}** … 見た目だけ。何色か、つやつやか、透けるか
- **{{メッシュ}}**（\`Mesh\`）… 「この形に、この見た目を塗って、ここに置く」という指示書

置き場所や向き・大きさを持っているのは **Mesh** です。ジオメトリではありません。
\`geometry.position\` は存在しません。動かすのは常に \`mesh.position\` です。

**この分担が、Three.js の見通しのよさの源です。**
そして次の 2 つの利点を生みます。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '粘土・絵の具・置き台',
      text: `
ジオメトリが粘土でこねた形、マテリアルが塗る絵の具、Mesh が
「その形にその色を塗って、ここに置く」という指示書です。

同じ粘土型から色違いをいくつも作れますし、
逆に同じ絵の具をいろいろな形に塗れます。

だからジオメトリとマテリアルは使い回せます。
100 個の箱を置くのに、粘土型は 1 つで足ります。
`,
    },
    {
      kind: 'md',
      text: `
## まずは組み込みの形から

自分で頂点を並べる前に、用意されているものを知っておくと早いです。
下のコードでは 6 種類を並べています。**引数の数字を変えて、形がどう変わるか見てください。**

とくに **分割数**（\`SphereGeometry\` の 2 番目・3 番目の引数など）は、
なめらかさと重さの両方を決める、いちばん大事なつまみです。
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

// マテリアルは 1 つ。6 個すべてで共有する
const material = new THREE.MeshStandardMaterial({ color: 0x7fb2ff, roughness: 0.45 });

shapes.forEach((geometry, i) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = (i - (shapes.length - 1) / 2) * 1.8;   // 置き場所は Mesh が持つ
  scene.add(mesh);
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);

  // 三角形が何枚あるかは、ここで見られる
  // console.log(renderer.info.render.triangles);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        'ドラッグで視点を回せます。`SphereGeometry(0.65, 24, 16)` の 24 と 16 を 5 と 4 にすると、なめらかな球が一気に多面体になります。最後の 2 行のコメントを外すと、いま何枚の三角形を描いているかが分かります。',
    },
    {
      kind: 'md',
      text: `
## 分割数が、三角形の数を決める

\`SphereGeometry(半径, 横の分割, 縦の分割)\` の 2 つの数は、
球を経線で何本、緯線で何本に切るかを決めています。

そして**三角形の数は、この 2 つの掛け算**で増えます。
片方を 2 倍にすると 2 倍、両方 2 倍にすると **4 倍**です。

ここを何となく決めていると、あとで効いてきます。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{三角形の数} \\;=\\; 2\\,w\\,h - 2\\,w',
      readAloud:
        '球の三角形の数です。横の分割 w と縦の分割 h の升目それぞれが四角形、つまり三角形 2 枚になります。ただし北極と南極の列だけは三角形 1 枚で足りるので、その分を引きます。',
      worked: {
        given:
          '$24 \\times 16$ の球と、$64 \\times 48$ の球で、三角形の数を比べます。**分割を 2〜3 倍にすると、何倍になるでしょう。**',
        steps: [
          { calc: '24 x 16 : 2 x 24 x 16 - 2 x 24' },
          { calc: '        = 768 - 48 = 720 枚' },
          { calc: '64 x 48 : 2 x 64 x 48 - 2 x 64' },
          { calc: '        = 6144 - 128 = 6016 枚' },
          { calc: '6016 / 720 = 8.36 倍' },
        ],
        result:
          '**横を 2.67 倍、縦を 3 倍にしただけで、三角形は 8.4 倍**になりました。掛け算なので、両方を少し上げただけで急に増えます。しかも **画面に小さく映っているなら、この 8.4 倍の差はまったく見えません。**「とりあえず 64」と書く癖は、そのぶんまるごと無駄になります。逆に、**画面いっぱいに映る主役だけ上げる**のは正しい判断です。',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '分割数は「見た目が変わらなくなるまで」下げる',
      text: `
決め方は簡単です。上げていって見た目が変わらなくなったところから、少し下げる。

遠くにあるもの・小さいものほど下げられます。
画面上で 30 ピクセルしかない球に、64 分割は要りません。

これは、いちばん効く軽量化のひとつです。しかも見た目を落とさずに済みます。
`,
    },
    {
      kind: 'md',
      text: `
## 使い回す ― 粘土型は 1 つでいい

同じ形の箱を 100 個置くとき、\`BoxGeometry\` を 100 個作る必要はありません。
**1 つ作って、100 個の Mesh で共有します。**

ジオメトリは GPU 側にメモリを確保するので、100 個作れば 100 個ぶん確保されます。
共有すれば 1 個ぶんで済みます。

マテリアルも同じです。しかもマテリアルの共有には、
**描画がまとまって速くなる**という別の効果もあります（[](#/ch/t11-performance)）。
`,
    },
    {
      kind: 'code',
      title: 'ジオメトリとマテリアルは共有する',
      code: `import * as THREE from 'three';

// 良い例：1つ作って100個で共有する
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x4fd6ff });

for (let i = 0; i < 100; i++) {
  const mesh = new THREE.Mesh(geometry, material);   // 形と色は共有、置き場所だけ別
  mesh.position.set(
    THREE.MathUtils.randFloatSpread(20),
    0,
    THREE.MathUtils.randFloatSpread(20),
  );
  scene.add(mesh);
}

// 悪い例：ループの中で作る（100個ぶんの GPU メモリを使う）
for (let i = 0; i < 100; i++) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),                  // 毎回新しく確保される
    new THREE.MeshStandardMaterial({ color: 0x4fd6ff }),
  );
  scene.add(mesh);
}`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '捨てるときは dispose を呼ぶ',
      text: `
ジオメトリとマテリアルが確保した GPU メモリは、
scene.remove() しても自動では解放されません。

geometry.dispose() と material.dispose() を呼んでください。
共有しているなら、最後に 1 回だけです。

呼び忘れると、シーンを作り直すたびにメモリが増え続けます。
片付けの全体像は [](#/ch/t10-scene-graph) で扱います。
`,
    },
    {
      kind: 'md',
      text: `
## 組み込みで足りないとき

用意されている形は 20 種類ほどあり、たいていのものは組み合わせで作れます。
街の建物は箱、木の幹は円柱、葉は円錐 ― これだけで第4部の作品が組めます。

それでも足りないときは、**頂点を自分で並べます。**
その方法が次の章です。ここからが、Three.js の本当の底です。
`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスで、球を \`SphereGeometry(0.65, 24, 16)\` から \`SphereGeometry(0.65, 6, 4)\` にしてください。
何が変わりますか。トーラスノットの \`90, 12\` も下げてみてください。`,
      hint: '2 番目と 3 番目の数字は、縦横をいくつに分けるかです。',
      answer: `カクカクになります。

丸いものは**細かい平面の集まりで近似している**だけなので、分割数を下げると近似が粗くなります。
$6 \\times 4$ の球は、もはや球には見えません。

**三角形の数** … $2 \\times 6 \\times 4 - 2 \\times 6 = 48 - 12 = 36$ 枚。
$24 \\times 16$ の **720 枚**に対して 20 分の 1 です。

トーラスノットの \`90, 12\` を \`20, 6\` にすると、
つるつるだった管がカクカクの多角形になり、ねじれ方も粗くなります。

**分割数は、見た目と重さの取引です。**
遠くにあるもの、小さく映るものは、分割を下げてもまず気づかれません。
[](#/ch/t11-performance) でこの話に戻ります。`,
    },
    {
      prompt: `画面に $32 \\times 24$ の球を **200 個**置きます。三角形は全部で何枚になりますか。
$16 \\times 12$ に落とすと何枚になり、**何割減りますか。** 手で計算してください。`,
      hint: '$2wh - 2w$ を使います。',
      answer: `**$294{,}400$ 枚 → $71{,}680$ 枚。約 76% 減ります。**

**$32 \\times 24$ のとき**

$2 \\times 32 \\times 24 - 2 \\times 32 = 1536 - 64 = 1472$ 枚

$1472 \\times 200 = 294{,}400$ 枚

**$16 \\times 12$ のとき**

$2 \\times 16 \\times 12 - 2 \\times 16 = 384 - 32 = 352$ 枚

$352 \\times 200 = 70{,}400$ 枚

**減る割合** … $1 - 70400/294400 = 0.761$

**縦横を半分にしただけで、4 分の 1 近くまで落ちます。**
掛け算だからです。$w$ と $h$ の両方が半分になれば、積は 4 分の 1 です。

**そして 200 個も置くなら、1 個は画面上でかなり小さいはずです。**
その大きさで $32 \\times 24$ と $16 \\times 12$ を見分けられる人はいません。

なお、この規模になると三角形の数より**描画命令の回数**のほうが問題になります。
その話は[](#/ch/t11-performance)で扱います。`,
    },
    {
      prompt: `\`geometry\` と \`material\` を for ループの**中**で作るコードと、**外**で作って共有するコード。
100 個置くとき、何がどう違いますか。**3 つ**挙げてください。`,
      hint: '確保されるもの、片付けの手間、描画の速さ。',
      answer: `**1. GPU メモリが 100 倍**

ジオメトリは頂点データを GPU に送ります。中で作れば 100 個ぶん送られます。
外で作れば 1 個ぶんです。形はまったく同じなのに。

**2. 片付けが 100 倍面倒**

\`dispose()\` は作った数だけ呼ぶ必要があります。
共有していれば最後に 1 回。中で作っていれば、
全部の Mesh を \`traverse\` で回って 1 つずつ呼ぶことになります。

**3. 描画がまとまらない**

three は「同じマテリアルのものをまとめて描く」ことができます。
マテリアルが 100 個別々だと、まとめられません。
描画命令の回数が増え、そのぶん CPU 側が忙しくなります（[](#/ch/t11-performance)）。

**逆に、共有していて困ることもあります。**
1 個だけ色を変えたくなったとき、共有しているマテリアルの \`color\` をいじると
**100 個ぜんぶ変わります。** そのときは、その 1 個ぶんだけ別のマテリアルを作ってください。`,
      answerCode: `// 共有しつつ、1 個だけ色を変えたいとき
const shared = new THREE.MeshStandardMaterial({ color: 0x4fd6ff });
const special = shared.clone();       // 複製してから変える
special.color.set(0xffd166);

meshes[42].material = special;

// 片付け（共有ぶんは 1 回、複製したぶんも 1 回）
geometry.dispose();
shared.dispose();
special.dispose();`,
    },
  ],
  quiz: [
    {
      q: '物体の置き場所（position）を持っているのはどれですか。',
      choices: ['Mesh', 'BufferGeometry', 'Material', 'Scene'],
      answer: 0,
      explain:
        'ジオメトリは形だけ、マテリアルは見た目だけを持ちます。「どこに、どの向きで、どの大きさで置くか」は Mesh の担当です。だから同じジオメトリを 100 個の Mesh で共有しても、それぞれ別の場所に置けます。',
    },
    {
      q: '`SphereGeometry` の分割数を縦横とも 2 倍にすると、三角形の数はおよそ何倍になりますか。',
      choices: ['4 倍', '2 倍', '変わらない', '8 倍'],
      answer: 0,
      explain:
        '三角形の数は $2wh - 2w$ で、$w$ と $h$ の掛け算です。両方 2 倍なら積は 4 倍になります。「とりあえず 64」と書くと、そのほとんどが見えない差のために使われます。',
    },
    {
      q: '同じ形の箱を 100 個置きます。`BoxGeometry` はいくつ作るべきですか。',
      choices: [
        '1 つ作って 100 個の Mesh で共有する',
        '100 個作る',
        'Mesh ごとに作り直す',
        '10 個作って 10 個ずつ共有する',
      ],
      answer: 0,
      explain:
        'ジオメトリは形だけを持ち、置き場所は Mesh が持ちます。だから 1 つで足ります。100 個作ると GPU メモリも `dispose()` の回数も 100 倍になります。',
    },
  ],
};
