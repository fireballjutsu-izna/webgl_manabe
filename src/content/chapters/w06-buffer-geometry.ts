import type { Chapter } from '../types.ts';

export const chapterW06: Chapter = {
  slug: 'w06-buffer-geometry',
  part: 'threejs',
  number: 6,
  title: '頂点を自分で並べる ― BufferGeometry',
  goal: '平らな配列から三角形を組み立てられるようになり、面の表裏が頂点の順番で決まることが分かります。',
  requires: ['t02-geometry', 'b31-triangle-normal'],
  threeApis: [
    'BufferGeometry',
    'BufferAttribute',
    'Float32BufferAttribute',
    'BufferGeometry.setAttribute',
    'BufferGeometry.computeVertexNormals',
    'Material.side',
  ],
  mathRecall: [
    { slug: '01-space', note: '頂点の位置は x・y・z の 3 つ組' },
    { slug: 'b31-triangle-normal', note: '面の法線は 2 辺の外積で作れる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 用意されていない形を、作る

組み込みのジオメトリで足りないとき ― たとえば地形、水面、生成した木の葉 ―
頂点を直接並べます。

必要なのは、**数字が平らに並んだ 1 本の配列**だけです。

x, y, z, x, y, z, … と並べ、**3 つで 1 頂点、3 頂点で 1 三角形**と数えます。
区切りは入っていません。「3 つずつで 1 組」という約束だけで読み分けます。

その約束を three に教えるのが、\`new THREE.BufferAttribute(array, 3)\` の **3** です。
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
          { calc: '9 / 3 = 3 頂点', note: 'BufferAttribute の 3 で割る' },
          { calc: '3 頂点 / 3 = 三角形 1 枚' },
        ],
        result:
          '**長さ 9 の配列が、三角形 1 枚**になります。三角形を 2 枚にしたければ長さ 18、100 枚なら長さ 900 です。**配列の長さが 3 の倍数でなかったり、頂点数が 3 の倍数でなかったりすると、余りは黙って無視されます。** エラーは出ません ― 「最後の 1 枚だけ出ない」の原因になります。',
      },
    },
    {
      kind: 'md',
      text: `
## なぜ Float32Array なのか

配列には、ふつうの \`[]\` ではなく \`Float32Array\` を使います。

理由は、**そのまま GPU へ送れるから**です。
JavaScript のふつうの配列は「どんな型でも入る箱の列」なので、
GPU に渡す前に「数値だけを詰め直した領域」へ変換が要ります。

\`Float32Array\` は最初からその形をしています。変換が要りません。

なお \`new THREE.Float32BufferAttribute([...], 3)\` と書けば、
ふつうの配列を渡すだけで中で \`Float32Array\` にしてくれます。短く書きたいときはこちらです。
`,
    },
    {
      kind: 'md',
      text: `
## 表と裏 ― 頂点を並べる向き

三角形には**表と裏**があります。そして、どちらが表かは**頂点を並べた順番**で決まります。

**反時計回りに見える側が表**です。

既定では、裏を向いた三角形は描かれません。
見えない面を捨てて速くする仕組みで、**背面カリング**と呼びます。
閉じた立体では、内側を向いた面は絶対に見えないので、描くだけ無駄だからです。

だから頂点の順番を逆にすると、**三角形が消えます。**
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '右ねじと同じ向きの決め方',
      text: `
[](#/ch/b31-triangle-normal) でやった外積の向きと、まったく同じ規則です。

頂点 0 → 1 → 2 の順にたどる向きに右手の指を回すと、親指が向く側が表。
その親指の向きが、そのまま面の法線になります。

だから「表を向ける」ことと「法線を正しい向きに作る」ことは同じ操作です。
2 つを別々に覚える必要はありません。
`,
    },
    {
      kind: 'sandbox',
      title: '三角形を、頂点から組み立てる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.6, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(2, 4, 5);
scene.add(key, new THREE.HemisphereLight(0x8899ff, 0x101020, 0.7));

// --- 左：反時計回り（表がこちらを向く）---
// 3つずつで1頂点。0 → 1 → 2 の順にたどると反時計回りになっている
const ccw = new Float32Array([
  -2.4, -0.8, 0,   // 頂点0
  -0.8, -0.8, 0,   // 頂点1
  -1.6,  0.8, 0,   // 頂点2
]);

const geomA = new THREE.BufferGeometry();
geomA.setAttribute('position', new THREE.BufferAttribute(ccw, 3));
geomA.computeVertexNormals();     // 法線がないと真っ黒（2辺の外積で作られる）

scene.add(new THREE.Mesh(geomA, new THREE.MeshStandardMaterial({ color: 0x4fd6ff })));

// --- 右：時計回り（裏がこちらを向くので、描かれない）---
const cw = new Float32Array([
  0.8, -0.8, 0,    // 頂点0
  1.6,  0.8, 0,    // 頂点1 ← 左とは 1 と 2 が入れ替わっている
  2.4, -0.8, 0,    // 頂点2
]);

const geomB = new THREE.BufferGeometry();
geomB.setAttribute('position', new THREE.BufferAttribute(cw, 3));
geomB.computeVertexNormals();

scene.add(new THREE.Mesh(geomB, new THREE.MeshStandardMaterial({ color: 0xffd166 })));

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
        '**右の三角形が見えません。** ドラッグして裏側へ回り込むと、こんどは右が見えて左が消えます。`side: THREE.DoubleSide` を足すと両方いつでも見えます。`computeVertexNormals()` を消すと、見えていたほうも真っ黒になります。',
    },
    {
      kind: 'md',
      text: `
## 法線がないと、真っ黒になる

自分で組んだジオメトリには、**法線が入っていません。**

[](#/ch/b27-lambert)でやったとおり、明るさは法線と光の向きの内積で決まります。
法線が無ければ、掛ける相手が無いので計算のしようがありません。

\`geometry.computeVertexNormals()\` を呼ぶと、
[](#/ch/b31-triangle-normal)の要領で **2 辺の外積から**自動的に作ってくれます。

**頂点の位置を書き換えたら、もう一度呼ぶ必要があります。**
形が変われば法線も変わるからです。ここは忘れやすいところです。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'DoubleSide は、便利だけれど逃げ道',
      text: `
side: THREE.DoubleSide を付ければ、表裏を気にせず必ず描かれます。

ただし描く量が増えますし、影の落ち方や透明の重なり順で
思わぬ結果になることがあります。

「葉っぱ 1 枚の板」のように本当に両面が見えるものには正しい選択です。
閉じた立体に付けているなら、たいていは頂点の順番を直すべき場面です。
`,
    },
    {
      kind: 'md',
      text: `
## 面ごとの法線と、頂点ごとの法線

\`computeVertexNormals()\` の名前は「**頂点**の法線を計算する」です。
面の法線ではありません。ここに大事な違いがあります。

- **面ごとに法線を持つ** … 隣どうしで向きが急に変わる → **角がくっきり**
- **頂点ごとに法線を持つ** … 隣の面と平均した向きになる → **なめらか**

three が扱うのは常に頂点の法線です。
だから同じ頂点を複数の面で共有していると、その頂点の法線は自動的に平均され、
**なめらかにつながって見えます。**

逆に「角をくっきり出したい」ときは、**わざと頂点を共有しません。**
同じ位置の頂点を面ごとに別々に持たせれば、それぞれの面の向きが保たれます。

この「共有するかどうか」を制御する仕組みが、次の章のインデックスです。
`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスの右側（\`cw\`）を、見えるように直してください。
**\`side\` は使わないこと。** 頂点の順番だけで直します。`,
      hint: '3 つの頂点のうち、どれか 2 つを入れ替えます。',
      answer: `**頂点 1 と頂点 2 を入れ替えます。**

いまの並びは $(0.8,\\,-0.8)$ → $(1.6,\\,0.8)$ → $(2.4,\\,-0.8)$ で、
画面上でたどると **時計回り**（左下 → 上 → 右下）です。

1 と 2 を入れ替えると $(0.8,\\,-0.8)$ → $(2.4,\\,-0.8)$ → $(1.6,\\,0.8)$ で、
**反時計回り**（左下 → 右下 → 上）になり、表がこちらを向きます。

**どの 2 つを入れ替えても向きは反転します。** 0 と 1 でも、0 と 2 でも構いません。
3 つのうち 2 つを入れ替えると回転の向きが逆になる、というのは
[](#/ch/b31-triangle-normal)で見た外積の反交換性 $a \\times b = -(b \\times a)$ と同じ話です。

**確かめ方** … 直したあとドラッグして裏へ回り込むと、こんどは右が消えて左が見えます。
両方が同時に見えるようになったら、それは \`side\` を付けてしまっています。`,
      answerCode: `const cw = new Float32Array([
  0.8, -0.8, 0,    // 頂点0
  2.4, -0.8, 0,    // 頂点1 ← 入れ替えた
  1.6,  0.8, 0,    // 頂点2 ← 入れ替えた
]);`,
    },
    {
      prompt: `頂点を **1200 個**並べた \`Float32Array\` があります。
配列の長さはいくつで、三角形は何枚になりますか。
また、この配列の長さが \`3601\` だったら何が起きますか。`,
      hint: '1 頂点あたり 3 つ、1 三角形あたり 3 頂点です。',
      answer: `**配列の長さは 3600、三角形は 400 枚**です。

$1200 \\times 3 = 3600$（1 頂点あたり x・y・z の 3 つ）

$1200 / 3 = 400$ 枚（1 三角形あたり 3 頂点）

**長さが 3601 だったら**

$3601 / 3 = 1200.33…$ で割り切れません。
three は**余りを黙って捨てます。** 頂点数は 1200 と数えられ、
最後の 1 つの数字は無視されます。

**エラーは出ません。** ここが厄介なところです。

さらに、頂点数が 3 の倍数でない場合 ― たとえば 1201 頂点なら ―
**最後の 1 頂点は三角形を作れないので、これも黙って捨てられます。**

「地形を生成したら、端の 1 列だけ欠けている」といったバグは、
たいてい配列の長さの計算がずれています。
\`console.log(array.length / 3)\` で頂点数を確かめる癖をつけてください。`,
    },
    {
      prompt: `\`computeVertexNormals()\` を呼び忘れると真っ黒になります。
では、**呼んだのに一部だけ真っ黒**なとき、何を疑いますか。`,
      hint: '法線は 2 辺の外積で作られます。外積が 0 になるのはどんなときでしたか。',
      answer: `**つぶれた三角形**（面積が 0 の三角形）を疑います。

法線は 2 辺の外積で作られます。[](#/ch/b30-cross-area)でやったとおり、
**外積の長さは平行四辺形の面積**でした。

だから

- 3 頂点が**一直線に並んでいる**
- 2 つの頂点が**まったく同じ位置**にある

このどちらかだと、外積が **零ベクトル**になります。
長さ 0 のベクトルは正規化できないので、法線が壊れ、その面は黒くなります。

**よくある原因**

- 地形の生成で、端の頂点の座標を計算し間違えた
- 円を作るとき、$0°$ と $360°$ の頂点を両方入れてしまった
- 半径 0 の点（円錐の頂点など）で、複数の頂点が重なった

**確かめ方** … その面の 3 頂点を \`console.log\` して、
2 つの辺ベクトルの外積の長さを計算してみてください。0 に近ければ当たりです。

**直し方** … つぶれた三角形は描いても意味がないので、そもそも作らないようにします。`,
      answerCode: `// つぶれた三角形を探す
const pos = geometry.getAttribute('position');
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

for (let i = 0; i < pos.count; i += 3) {
  a.fromBufferAttribute(pos, i);
  b.fromBufferAttribute(pos, i + 1);
  c.fromBufferAttribute(pos, i + 2);

  const area = b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
  if (area < 1e-8) console.warn('つぶれた三角形', i / 3, area);
}`,
    },
  ],
  quiz: [
    {
      q: '`new THREE.BufferAttribute(array, 3)` の **3** は何を表していますか。',
      choices: [
        '1 つの頂点が 3 つの数（x・y・z）でできていること',
        '三角形の枚数',
        '頂点の総数',
        '小数点以下の桁数',
      ],
      answer: 0,
      explain:
        '配列は平らに並んでいるだけなので、「いくつずつで 1 組か」を教える必要があります。位置なら 3、UV なら 2 になります。',
    },
    {
      q: '三角形の「表」はどちら側ですか。',
      choices: [
        '頂点を 0 → 1 → 2 の順にたどって、反時計回りに見える側',
        '法線を明示的に指定した側',
        '常にカメラのある側',
        '最初の頂点に近い側',
      ],
      answer: 0,
      explain:
        '外積の右ねじの向きと同じ規則です。既定では裏を向いた面は描かれない（背面カリング）ので、順番を逆にすると三角形が消えます。',
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
        '`geometry.computeVertexNormals()` を呼ぶと、2 辺の外積から法線が作られます。頂点の位置を書き換えたあとも呼び直す必要があります。ライトを置き忘れていないかも合わせて確認してください。',
    },
  ],
};
