import type { Chapter } from '../types.ts';

export const chapterW07: Chapter = {
  slug: 'w07-index',
  part: 'threejs',
  number: 7,
  title: 'インデックス ― 頂点を使い回す',
  goal: '番号で三角形を組めるようになり、頂点を共有すべき場所と、あえて共有しない場所を判断できるようになります。',
  requires: ['w06-buffer-geometry'],
  threeApis: [
    'BufferGeometry.setIndex',
    'BufferGeometry.getIndex',
    'BufferGeometry.toNonIndexed',
    'PlaneGeometry',
    'BufferGeometry.getAttribute',
  ],
  mathRecall: [{ slug: 'b31-triangle-normal', note: '頂点の並ぶ向きが、面の向きを決める' }],
  blocks: [
    {
      kind: 'md',
      text: `
## 同じ点を、何度も書いている

四角形を 1 枚作ります。三角形 2 枚なので、前の章のやり方だと **6 頂点**並べます。

ところが、四角形の角は **4 つ**しかありません。
2 つの頂点は、まったく同じ座標を 2 回書いていることになります。

四角形 1 枚なら大した話ではありません。
**しかし地形を $200 \\times 200$ で作ると、これが 4 万回起きます。**

そこで、こうします。

**頂点は 4 つだけ用意して、「何番と何番と何番で三角形を作る」という番号の列を、別に渡す。**

これが{{インデックス}}です。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '出席番号で呼ぶ',
      text: `
名簿に名前を 4 つ書いておいて、班分けは「1番・2番・3番」「1番・3番・4番」と
番号で指定する。名前を書き直すより、ずっと短くて済みます。

しかも、あとで 3 番の人の名前が変わったとき、直すのは名簿の 1 か所だけです。
番号で呼んでいる側は、何も直さなくて構いません。

頂点の位置を書き換えるとき、これがそのまま効いてきます。
`,
    },
    {
      kind: 'md',
      text: `
## 書き方

\`setIndex()\` に番号の配列を渡すだけです。

3 つずつで 1 三角形。番号は \`position\` 属性の**何番目の頂点か**を指します。
`,
    },
    {
      kind: 'code',
      title: '四角形を 4 頂点で作る',
      code: `import * as THREE from 'three';

const quad = new THREE.BufferGeometry();

// 角は 4 つだけ
quad.setAttribute('position', new THREE.Float32BufferAttribute([
  -1, -1, 0,   // 0 左下
   1, -1, 0,   // 1 右下
   1,  1, 0,   // 2 右上
  -1,  1, 0,   // 3 左上
], 3));

// どの頂点で三角形を作るか。3つずつで1枚
quad.setIndex([
  0, 1, 2,     // 右下の三角形
  0, 2, 3,     // 左上の三角形
]);

quad.computeVertexNormals();

// 番号の順番も、反時計回りでなければならない
// [0, 2, 1] と書くと裏を向いて消える`,
    },
    {
      kind: 'md',
      text: `
## どれくらい得か

節約の量は「1 つの頂点が、いくつの三角形に使われているか」で決まります。

四角形なら 6 → 4 で 3 分の 1 の節約。たいしたことはありません。
ところが**格子状の面**になると、内側の頂点は **6 枚の三角形**に共有されます。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{頂点数} = (n+1)^{2}, \\qquad \\text{インデックス無しの頂点数} = 6\\,n^{2}',
      readAloud:
        '縦横 n 分割の格子平面を作ったときの数です。インデックスを使えば格子点の数だけで済みますが、使わないと三角形 2 掛ける 3 頂点ぶんを升目の数だけ並べることになります。',
      worked: {
        given: '$200 \\times 200$ に分割した地形で、インデックスを**使う場合と使わない場合**の頂点数を比べます。',
        steps: [
          { calc: 'インデックス有り : (200 + 1)^2' },
          { calc: '                 = 201 x 201 = 40,401 頂点' },
          { calc: 'インデックス無し : 6 x 200^2' },
          { calc: '                 = 6 x 40,000 = 240,000 頂点' },
          { calc: '240,000 / 40,401 = 5.94 倍' },
          { calc: 'position だけで : 240,000 x 3 x 4 バイト = 2.88 MB', note: 'float は 4 バイト' },
          { calc: '            対して 40,401 x 3 x 4 = 0.48 MB' },
        ],
        result:
          '**頂点数がほぼ 6 分の 1** になります。position だけで **2.88MB が 0.48MB** です。normal と uv も付ければ差は 3 倍に開きます。**しかも三角形の枚数は変わりません** ― どちらも 80,000 枚です。減っているのは「同じ点を何度も書いている」ぶんだけで、**見た目はまったく同じ**です。',
      },
    },
    {
      kind: 'sandbox',
      title: '格子の平面を、インデックスで組む',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 4, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(
  new THREE.DirectionalLight(0xffffff, 2.4).translateY(5),
  new THREE.HemisphereLight(0x8899ff, 0x101020, 0.7),
);

const N = 12;        // 分割数。上げてみてください
const SIZE = 6;

// --- 1. 格子点を並べる。(N+1) x (N+1) 個 ---
const positions = [];
for (let iz = 0; iz <= N; iz++) {
  for (let ix = 0; ix <= N; ix++) {
    const x = (ix / N - 0.5) * SIZE;
    const z = (iz / N - 0.5) * SIZE;
    const y = Math.sin(x * 1.2) * Math.cos(z * 1.2) * 0.6;   // 波打たせる
    positions.push(x, y, z);
  }
}

// --- 2. 升目ごとに、三角形2枚ぶんの番号を並べる ---
const indices = [];
for (let iz = 0; iz < N; iz++) {
  for (let ix = 0; ix < N; ix++) {
    const a = iz * (N + 1) + ix;      // 左手前
    const b = a + 1;                  // 右手前
    const c = a + (N + 1);            // 左奥
    const d = c + 1;                  // 右奥

    indices.push(a, c, b);            // 上から見て反時計回りになる並び
    indices.push(b, c, d);
  }
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setIndex(indices);
geometry.computeVertexNormals();

scene.add(new THREE.Mesh(
  geometry,
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.5, side: THREE.DoubleSide }),
));

// 頂点の位置に、格子を重ねて見せる
scene.add(new THREE.LineSegments(
  new THREE.WireframeGeometry(geometry),
  new THREE.LineBasicMaterial({ color: 0x5a5a78 }),
));

console.log('頂点数', positions.length / 3);
console.log('三角形', indices.length / 3);
console.log('インデックスを使わなければ', indices.length, '頂点必要だった');

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
        '`N` を 12 から 60 に上げると、コンソールの数字が跳ね上がります（169 頂点 → 3721 頂点、三角形 288 枚 → 7200 枚）。`indices.push(a, c, b)` を `(a, b, c)` に変えると裏返って消えます（`side` を外して試すと分かりやすいです）。三角形 2 枚の番号の組み方が、この章の核心です。',
    },
    {
      kind: 'md',
      text: `
## 立方体は、8 頂点にはならない

「立方体なら 36 頂点が 8 頂点になる」― これは**半分だけ正しい**話です。

位置だけを見れば、確かに角は 8 つです。
ところが頂点が持つのは位置だけではありません。**法線**も持っています。

立方体の角に集まる 3 つの面は、それぞれ違う向きを向いています。
1 つの頂点は 1 つの法線しか持てないので、**3 面で共有すると法線が平均され、角が丸くなります。**

だから three の \`BoxGeometry\` は **24 頂点**（6 面 × 4 隅）で作られています。
位置は重複していますが、法線が違うので共有できません。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '共有できるのは、属性が「すべて」同じ頂点だけ',
      text: `
インデックスで頂点を共有できるのは、位置も法線も UV も、
全部が一致している場合だけです。

1 つでも違えば、それは別の頂点として並べるしかありません。
GPU は「位置だけ共有して法線は別」という持ち方ができないからです。

だから、角がくっきりした形ほどインデックスの効きは悪くなり、
なめらかな形（球・地形・キャラクター）ほどよく効きます。
`,
    },
    {
      kind: 'md',
      text: `
## 逆向きの操作 ― toNonIndexed

まれに、**わざとインデックスを外したい**ことがあります。

- 面ごとに違う色を付けたい（頂点カラーが面ごとに必要）
- 面をバラバラに飛ばす演出をしたい
- 角をくっきりさせたい（法線を平均させたくない）

そのときは \`geometry.toNonIndexed()\` を呼ぶと、
共有をほどいて頂点を並べ直した**新しいジオメトリ**を返してくれます。

頂点数は増えますが、面ごとの独立が手に入ります。
`,
    },
    {
      kind: 'code',
      title: '共有をほどいて、角をくっきりさせる',
      code: `// 球の面を、平らな多面体として見せる（フラットシェーディング）
const smooth = new THREE.SphereGeometry(1, 12, 8);

const flat = smooth.toNonIndexed();     // 共有をほどく
flat.computeVertexNormals();            // 面ごとの法線になる

smooth.dispose();                       // 元は要らないので捨てる

// なお、同じ見た目はマテリアル側でも作れる（こちらのほうが安い）
const material = new THREE.MeshStandardMaterial({ flatShading: true });`,
    },
  ],
  exercises: [
    {
      prompt: `$50 \\times 50$ に分割した地形を作ります。
インデックスを使う場合と使わない場合で、**頂点数**はそれぞれいくつですか。
また、位置・法線・UV をすべて持たせたとき、**メモリの差は何 MB** ですか。手で計算してください。`,
      hint: '1 頂点あたり position 3 + normal 3 + uv 2 = 8 個の float。float は 4 バイトです。',
      answer: `**2601 頂点 と 15000 頂点。差は約 0.40 MB です。**

**インデックス有り** … $(50+1)^2 = 51 \\times 51 = 2601$ 頂点

**インデックス無し** … $6 \\times 50^2 = 6 \\times 2500 = 15000$ 頂点

$15000 / 2601 = 5.77$ 倍です。

**1 頂点あたりのバイト数**

position 3 + normal 3 + uv 2 = **8 個の float** = $8 \\times 4 = 32$ バイト

**メモリ**

インデックス有り … $2601 \\times 32 = 83{,}232$ バイト $= 0.083$ MB
インデックス無し … $15000 \\times 32 = 480{,}000$ バイト $= 0.48$ MB

差は **0.397 MB**。

**ただし、インデックス自体にもメモリが要ります。**
三角形 5000 枚 × 3 = 15000 個の番号。頂点数が 65536 以下なら 16 ビット（2 バイト）で足りるので、
$15000 \\times 2 = 30{,}000$ バイト $= 0.03$ MB。

**差し引き 0.367 MB の節約**です。それでも 4 分の 1 以下になっています。

**頂点数が 65536 を超えると 32 ビットの番号が必要になり**、インデックスのぶんが倍になります。
それでも共有の効果のほうがずっと大きいので、判断は変わりません。`,
    },
    {
      prompt: `立方体を「位置だけ見れば 8 頂点だから」と 8 頂点＋インデックスで作りました。
\`computeVertexNormals()\` を呼んだところ、**角が丸く見えます。** なぜですか。`,
      hint: '1 つの頂点が持てる法線は、いくつですか。',
      answer: `**1 つの頂点は、法線を 1 つしか持てないからです。**

立方体の 1 つの角には、3 つの面が集まります。
それぞれの面の法線は $(1,0,0)$、$(0,1,0)$、$(0,0,1)$ のように**全部違う向き**です。

\`computeVertexNormals()\` は、その頂点を使っている全部の面の法線を**平均**します。
結果、その角の法線は $(0.577,\\,0.577,\\,0.577)$ ― **斜め 45 度**になります。

法線が斜めを向けば、[](#/ch/b27-lambert)のとおり明るさもなめらかに変化します。
つまり **球のように陰影が付き、角が丸く見えます。**

**だから three の \`BoxGeometry\` は 24 頂点**（6 面 × 4 隅）で作られています。
位置は重複しますが、面ごとに独立した法線を持てます。

**共有できるのは、位置も法線も UV も全部一致する頂点だけ**です。
1 つでも違えば別の頂点として並べるしかありません。

**逆に言えば** … 球や地形のようになめらかな形では、この平均こそが欲しい効果です。
だからインデックスがよく効きます。角がくっきりした形ほど、効きは悪くなります。`,
    },
    {
      prompt: `サンドボックスの \`indices.push(a, c, b)\` を \`indices.push(a, b, c)\` に変えると、面が消えます。
**なぜか**を、格子の座標から説明してください。`,
      hint: '$\\vec{ab}$ と $\\vec{ac}$ の外積を、実際に計算してみてください。',
      answer: `**外積を計算すると、法線が真下を向くからです。**

表裏は目で追うと間違えます。**計算したほうが確実**です。

格子の間隔を $h$ とすると、3 頂点の位置関係はこうです。

- **a** … 基準点
- **b** … $a$ から $x$ に $h$ 進んだ点 → $\\vec{ab} = (h,\\,0,\\,0)$
- **c** … $a$ から $z$ に $h$ 進んだ点 → $\\vec{ac} = (0,\\,0,\\,h)$

[](#/ch/b31-triangle-normal)のとおり、面の法線は $\\vec{ab} \\times \\vec{ac}$ です。

$\\vec{ab} \\times \\vec{ac} = (0 \\cdot h - 0 \\cdot 0,\\;\\; 0 \\cdot 0 - h \\cdot h,\\;\\; h \\cdot 0 - 0 \\cdot 0) = (0,\\,-h^2,\\,0)$

**法線が $-y$、つまり真下を向いています。** 上から見れば裏側なので、描かれません。

$a \\to c \\to b$ にすると外積の順が入れ替わり、
$\\vec{ac} \\times \\vec{ab} = (0,\\,+h^2,\\,0)$ ― **真上を向きます。**

$a \\times b = -(b \\times a)$ という反交換性が、そのまま「頂点を 2 つ入れ替えると裏返る」に対応しています。

**実務での使い方** … 地形やメッシュを自分で組んで「なぜか真っ黒／消える」ときは、
最初の 1 枚の三角形について外積を \`console.log\` してください。
$y$ 成分の符号を見るだけで、順番が正しいか一目で分かります。`,
      answerCode: `// 迷ったら、その場で外積して確かめる
const A = new THREE.Vector3(0, 0, 0);
const B = new THREE.Vector3(1, 0, 0);   // 右手前
const C = new THREE.Vector3(0, 0, 1);   // 左奥

const n = new THREE.Vector3()
  .subVectors(B, A)
  .cross(new THREE.Vector3().subVectors(C, A));

console.log(n);   // (0, -1, 0) → 下向き。順番を入れ替える必要がある`,
    },
  ],
  quiz: [
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
        '格子状の面では頂点数がほぼ 6 分の 1 になります。GPU は同じ頂点の計算結果を使い回せるので、転送量とメモリだけでなく処理も軽くなります。',
    },
    {
      q: 'three の `BoxGeometry` の頂点数はいくつですか。',
      choices: [
        '24（6 面 × 4 隅）',
        '8（立方体の角の数）',
        '36（三角形 12 枚 × 3）',
        '12（辺の数）',
      ],
      answer: 0,
      explain:
        '位置だけなら 8 で足りますが、角に集まる 3 面は法線が違います。1 頂点は法線を 1 つしか持てないので、共有すると角が丸くなってしまいます。だから面ごとに独立した 24 頂点で作られています。',
    },
    {
      q: '`geometry.toNonIndexed()` は何をしますか。',
      choices: [
        '共有をほどいて頂点を並べ直した、新しいジオメトリを返す',
        'インデックスを最適化する',
        '頂点を減らす',
        'ジオメトリを削除する',
      ],
      answer: 0,
      explain:
        '面ごとに違う色を付けたい、面をバラバラに飛ばしたい、角をくっきりさせたい、といったときに使います。頂点数は増えますが、面ごとの独立が手に入ります。',
    },
  ],
};
