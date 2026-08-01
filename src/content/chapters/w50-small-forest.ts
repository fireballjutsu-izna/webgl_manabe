import type { Chapter } from '../types.ts';

export const chapterW50: Chapter = {
  slug: 'w50-small-forest',
  part: 'threejs',
  number: 50,
  title: '小さな森を、通しで作る',
  goal: '第3部で覚えた道具を 1 つの作品にまとめられるようになり、「部品を作る関数 ＋ 組み立てる本体」という読み方が身につきます。',
  requires: ['w49-onbeforecompile', '13-random'],
  mathRecall: [
    { slug: '13-random', note: '種から同じ並びを作る乱数' },
    { slug: 'b21-circular-motion', note: '角度と半径から座標を出す' },
  ],
  threeApis: [
    'Group',
    'InstancedMesh',
    'InstancedMesh.setMatrixAt',
    'Object3D.updateMatrix',
    'Fog',
    'DirectionalLight.shadow',
    'BufferGeometryUtils',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 第3部の、最後の章

ここまでで、道具は $49$ 章ぶん揃いました。

シーンとカメラ、ジオメトリ、マテリアル、テクスチャ、ライトと影、
時間の刻み方、視点の操作、光線での当たり判定、読み込み、シーングラフ、
ドローコールと画素の費用、シェーダ。

**この章では、何も新しいことを教えません。**
そのかわり、**全部を $1$ つの作品にまとめます。**

作るのは**小さな森**です。素材は使いません ―
木も草も地面も、すべてコードで生やします。
`,
    },
    {
      kind: 'md',
      text: `
## コードの読み方 ― 3 つの層

$100$ 行を超えるコードは、**上から順に読むものではありません。**
$3$ つの層に分かれていると思って読んでください。

**$1$. 部品を作る関数**

\`makeTree(rand)\` のように、**呼ばれるたびに $1$ つ作って返す**関数です。

返すのは \`Group\` ― 幹と葉をまとめた入れ物。
[](#/ch/t10-scene-graph)でやったとおり、
**「一緒に動くもの」を $1$ つにまとめた**形です。

この層は、**シーンのことを何も知りません。** 引数を受け取って、物を返すだけ。

**$2$. 組み立てる本体**

シーン・カメラ・ライトを用意し、部品を並べて \`scene.add\` する層です。

**ここが作品の設計図**になります。
「木を $60$ 本、草を $3000$ 本、霧はここから」がここに書いてあります。

**$3$. 毎フレーム動かす**

\`setAnimationLoop\` の中身。**できるだけ短く**保ちます。

長くなってきたら、それは $1$ か $2$ に書くべきことが混ざっています。

**この $3$ 層は、第4部でもずっと同じ形です。**
`,
    },
    {
      kind: 'md',
      text: `
## 種から、同じ森を作る

\`Math.random()\` を使うと、**再読み込みのたびに別の森**になります。

デバッグには最悪です。「さっきの木の配置がおかしかった」と思っても、
もう二度と同じものは出てきません。

そこで、**種（seed）から決まった並びを作る乱数**を使います。
[](#/ch/13-random)でやった話です。

短くて質のよいものとして \`mulberry32\` がよく使われます。
$1$ 行に $2$ つ、見慣れない書き方が出てくるので、ここで潰しておきます。
`,
    },
    {
      kind: 'code',
      title: 'mulberry32 ― 種から同じ並びを作る',
      code: `function mulberry32(seed) {
  return function () {
    // 32 ビットの世界で足す。桁あふれは切り捨てられる
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;

    let t = seed ^ (seed >>> 15);

    // Math.imul は「32 ビット整数としての掛け算」
    // ふつうの * だと 53 ビットの浮動小数になって、下の桁が失われる
    t = Math.imul(t, 1 | t);

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    // >>> 0 は「符号なし 32 ビットとして読み直す」
    // これがないと負の数が混ざり、0〜1 に収まらない
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260801);

rand();   // 0.7893...  何度読み込んでも、同じ順で同じ値
rand();   // 0.1274...`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'Math.imul と >>> 0 は、何をしているのか',
      text: `
JavaScript の数値は 64 ビットの浮動小数です。
整数として正確に扱えるのは 53 ビットまで。

a * b で 32 ビットどうしを掛けると、結果は最大 64 ビットになり、
下の桁が丸められて失われます。乱数としては致命的です。

Math.imul(a, b) は「32 ビット整数として掛けて、下位 32 ビットを返す」。
C 言語などで整数を掛けたときと同じ振る舞いになります。

>>> 0 は符号なし右シフト 0 ビット。何も動きませんが、
「符号なし 32 ビットとして読み直す」効果だけが残ります。

-1 は 4294967295 に、-2 は 4294967294 に。
これで割り算の分子が必ず 0 以上になり、0〜1 に収まります。

この 2 つは、ビット演算で乱数を書くときの定番です。
`,
    },
    {
      kind: 'md',
      text: `
## 木を、どこに植えるか

$60$ 本の木を「ランダムに」置くと、**必ず固まりと隙間ができます。**
[](#/ch/13-random)でやった、一様乱数の偏りです。

森らしく散らすなら、**黄金角**を使う手があります。
$i$ 番目を角度 $137.5°$ ずつ回して置くだけで、驚くほど均等に散ります
（ひまわりの種の並びと同じ理屈です）。
`,
    },
    {
      kind: 'formula',
      tex: '\\theta_i = i \\cdot 137.5°, \\qquad r_i = R\\sqrt{\\dfrac{i}{N}}',
      readAloud:
        '$i$ 番目の木は、**$137.5°$ ずつ回した向き**の、**半径 $R\\sqrt{i/N}$** のところに置きます。$\\sqrt{}$ が要るのは、**面積が半径の $2$ 乗に比例する**からです ― これがないと中心に密集します。',
      worked: {
        given:
          '半径 $R = 14$ の中に $N = 200$ 本を散らします。**$50$ 番目**の木は、どこに立つでしょうか。',
        steps: [
          { calc: 'θ = 50 x 137.5 = 6,875 度' },
          { calc: '  6,875 - 19 x 360 = 35 度' },
          { calc: 'r = 14 x sqrt(50 / 200)' },
          { calc: '  = 14 x sqrt(0.25)' },
          { calc: '  = 14 x 0.5 = 7' },
          { calc: 'x = 7 cos 35 = 5.734' },
          { calc: 'z = 7 sin 35 = 4.015' },
        ],
        result:
          '**$(5.734,\\; 0,\\; 4.015)$** です。**$\\sqrt{}$ を忘れるとどうなるか**を見ておいてください。$r = 14 \\times \\frac{50}{200} = 3.5$ となり、外側の半分が空きます ― 半径 $7$ の円の中に $50$ 本ではなく、半径 $3.5$ の円に $50$ 本が詰まる。**面積は $\\frac{1}{4}$ なので密度は $4$ 倍**です。$\\sqrt{}$ を入れると「半径 $r$ 以内の本数 $\\propto$ 面積 $\\propto r^2$」が成り立ち、**どこも同じ密度**になります。$137.5°$（黄金角）は、$360°$ と割り切れる比にならないので、**何本置いても線状に揃いません。**',
      },
    },
    {
      kind: 'sandbox',
      title: '小さな森 ― 通しで作る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SEED = 20260801;      // 変えると別の森になります
const TREES = 60;
const GRASS = 3000;
const RADIUS = 14;

/* ==== 1. 部品を作る関数 ================================== */

function makeTree(rand) {
  const tree = new THREE.Group();

  const height = 2.6 + rand() * 2.6;
  const tint = 0.26 + rand() * 0.08;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.16, height, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b4b32, roughness: 0.9 }),
  );
  trunk.position.y = height / 2;
  trunk.castShadow = true;
  tree.add(trunk);

  // 葉は 3 段。上へ行くほど小さくする
  const leafMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(tint, 0.42, 0.32 + rand() * 0.12),
    roughness: 0.85,
    flatShading: true,
  });

  for (let i = 0; i < 3; i++) {
    const r = (1.35 - i * 0.32) * (0.85 + rand() * 0.3);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, 1.7, 7), leafMat);
    cone.position.y = height * 0.62 + i * 0.72;
    cone.rotation.y = rand() * Math.PI;
    cone.castShadow = true;
    tree.add(cone);
  }

  return tree;                 // シーンのことは何も知らない
}

function makeGround(radius) {
  const geo = new THREE.CircleGeometry(radius + 6, 64);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x2b3a2a, roughness: 0.98 }),
  );
  mesh.receiveShadow = true;
  return mesh;
}

function makeGrass(rand, count, radius) {
  const blade = new THREE.ConeGeometry(0.07, 0.7, 4);
  blade.translate(0, 0.35, 0);

  const mesh = new THREE.InstancedMesh(
    blade,
    new THREE.MeshStandardMaterial({ color: 0x5c8a4a, roughness: 0.9 }),
    count,
  );

  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * radius;      // sqrt で密度を一定に
    dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    dummy.rotation.y = rand() * Math.PI;
    dummy.scale.setScalar(0.6 + rand() * 0.9);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/* ==== 2. 組み立てる本体 ================================== */

const rand = mulberry32(SEED);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141c22);
scene.fog = new THREE.Fog(0x141c22, 26, 78);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 13, 33);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 3, 0);
controls.maxPolarAngle = Math.PI / 2.1;

const sun = new THREE.DirectionalLight(0xffe2b0, 3.4);
sun.position.set(12, 16, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;
sun.shadow.camera.far = 50;
sun.shadow.bias = -0.0012;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0x9dc4ff, 0x2b2a1c, 1.3));

scene.add(makeGround(RADIUS));
scene.add(makeGrass(rand, GRASS, RADIUS + 4));

// 木を、黄金角で散らす
const forest = new THREE.Group();
const GOLDEN = Math.PI * (3 - Math.sqrt(5));      // 137.5 度をラジアンで

for (let i = 0; i < TREES; i++) {
  const tree = makeTree(rand);
  const theta = i * GOLDEN;
  const r = RADIUS * Math.sqrt(i / TREES);
  tree.position.set(Math.cos(theta) * r, 0, Math.sin(theta) * r);
  tree.rotation.y = rand() * Math.PI * 2;
  forest.add(tree);
}
scene.add(forest);

/* ==== 3. 毎フレーム動かす ================================ */

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  sun.position.set(Math.cos(t * 0.08) * 16, 12 + Math.sin(t * 0.08) * 5, 8);
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ==== 下ごしらえ（読み飛ばして可） ======================== */

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = seed ^ (seed >>> 15);
    t = Math.imul(t, 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}`,
      caption:
        '**`SEED` を変えてみてください。** 木の本数も配置の規則も同じままで、**別の森**ができます。同じ種なら何度読み込んでも同じ森 ― これがデバッグを楽にします。太陽はゆっくり動いていて、影がそれについてきます。**部品を作る関数・組み立てる本体・毎フレーム動かす、の $3$ 層になっている**ことを確かめてください。',
    },
    {
      kind: 'md',
      text: `
## この $1$ 本の中に、何が入っているか

たった $1$ 本の木に、これだけの章が効いています。

- **\`Group\`** で幹と葉をまとめる … [](#/ch/t10-scene-graph)
- **\`ConeGeometry\` を $3$ 段**重ねて樹形を作る … [](#/ch/t02-geometry)
- **\`flatShading\`** で面を立たせる … [](#/ch/t03-material)
- **色を HSL でずらす** … [](#/ch/w13-color-space)
- **\`castShadow\`** を $1$ つずつ設定 … [](#/ch/w20-shadow)
- **草は \`InstancedMesh\`** で $3000$ 本を $1$ 回 … [](#/ch/w43-instancing)
- **影の範囲を絞る** … [](#/ch/w21-shadow-quality)
- **フォグの終わりと \`far\`** を合わせる … [](#/ch/w44-gpu-cost)

**新しい道具は $1$ つも使っていません。**
第3部を通して覚えたものを、順番に置いただけです。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '種を固定すると、作業が変わる',
      text: `
「配置がおかしい」と思ったとき、同じ森がもう一度出せることの価値は大きい。

気に入った森が出たら、その種をメモしておけます。
不具合の報告に種を添えてもらえば、手元で同じものを再現できます。

そして、種を URL に入れておけば、
誰かが見つけた森をそのまま人に見せられます。

location.hash から種を読むようにするだけです。
`,
    },
    {
      kind: 'md',
      text: `
## ここから、第4部へ

第3部で、**「Three.js を書く」ための道具はひととおり揃いました。**

第4部では、**もっと大きな作品を、最初から最後まで**作ります。
惑星と、夜の街 ― どちらも素材ゼロ、すべてコードで生成します。

そこで新しく出てくるのは、道具そのものではなく **組み立て方**です。

- $1$ つの値（品質・時刻・季節）から、全体を導く
- ノイズで地形と模様を作る
- 何十行もある部品を、読める形に保つ

**この章の $3$ 層構造が、そのまま大きくなっていきます。**

そして第5部で、公開できる形に仕上げます。
`,
    },
  ],
  exercises: [
    {
      prompt: `半径 $R = 20$ の中に $N = 500$ 本を黄金角で散らします。

**$125$ 番目**の木の位置 $(x, z)$ を求めてください。`,
      hint: '$\\theta = i \\times 137.5°$、$r = R\\sqrt{i/N}$。$\\theta$ は $360$ で割った余りを使います。',
      answer: `**$(-9.998,\\; 0.198)$ です。**

**角度**

$\\theta = 125 \\times 137.5 = 17{,}187.5$ 度

$360$ で割った余りを出します。

$17{,}187.5 \\div 360 = 47.7431\\ldots$

$47 \\times 360 = 16{,}920$

$17{,}187.5 - 16{,}920 = 267.5$ 度

**半径**

$r = 20\\sqrt{\\dfrac{125}{500}} = 20\\sqrt{0.25} = 20 \\times 0.5 = 10$

**座標**

$\\cos 267.5° = -0.04362$

$\\sin 267.5° = -0.99905$

$x = 10 \\times (-0.04362) = -0.436$

$z = 10 \\times (-0.99905) = -9.991$

**答えは $(-0.436,\\; -9.991)$** です。

（原点からの距離を確かめてください ―
$\\sqrt{0.436^2 + 9.991^2} = 10.00$。合っています。）

**なぜ $\\sqrt{}$ が要るのか、もう一度**

$i = 125$ は $500$ 本のうち $\\frac{1}{4}$ 番目です。

$\\sqrt{}$ があると、$r = R \\times \\frac{1}{2}$ ―
つまり**半径が半分**のところに来ます。

半径半分の円の面積は全体の $\\frac{1}{4}$。
そこに $\\frac{1}{4}$ の本数が入るので、**密度が一定**です。

$\\sqrt{}$ が無ければ $r = R \\times \\frac{1}{4} = 5$。
面積 $\\frac{1}{16}$ のところに $\\frac{1}{4}$ の本数 ― **密度が $4$ 倍**になります。

**外周が寂しく、中心がぎゅうぎゅうの森**になる、というのがその意味です。`,
    },
    {
      prompt: `\`mulberry32\` の最後の行から **\`>>> 0\`** を外しました。

\`return ((t ^ (t >>> 14))) / 4294967296;\`

**何が起きますか。** 森はどう変わりますか。`,
      hint: 'JavaScript のビット演算は、結果を何ビットの何として返しますか。',
      answer: `**返る値が $-0.5$ 〜 $0.5$ の範囲になり、木の半分が原点の反対側へ飛びます。**

**何が起きるか**

JavaScript のビット演算（\`^\`、\`&\`、\`|\`、\`<<\`、\`>>\`）は、
**結果を「符号付き $32$ ビット整数」として返します。**

つまり $-2{,}147{,}483{,}648$ 〜 $2{,}147{,}483{,}647$ の範囲。**負の数が出ます。**

これを $4{,}294{,}967{,}296$（$2^{32}$）で割ると、

$-0.5 \\le \\text{結果} < 0.5$

**約半分の呼び出しが負の値**を返します。

**\`>>> 0\` は何をしていたのか**

\`>>>\` は**符号なし**右シフトです。$0$ ビットずらすので値は動きませんが、
**「符号なし $32$ ビットとして読み直す」効果だけ**が残ります。

$-1$ は $4{,}294{,}967{,}295$ に、$-2$ は $4{,}294{,}967{,}294$ に。

これで分子が必ず $0$ 以上になり、$0 \\le \\text{結果} < 1$ に収まります。

**森はどうなるか**

- **草の半径** … \`Math.sqrt(rand())\` に負を渡すと **\`NaN\`**。
  位置が \`NaN\` になった草は**描画されずに消えます**（約半分が消える）
- **木の高さ** … \`2.6 + rand() * 2.6\` が最小 $1.3$ になり、ひょろ長い木が混じる
- **色** … \`setHSL\` の明度が負になり、**真っ黒な木**が出る
- **回転** … 負の角度は問題なし（回る向きが逆になるだけ）

**\`NaN\` が混じるのが、いちばん厄介です。**
エラーは出ず、ただ「なんとなく草がまばら」になります。

**教訓**

**乱数の出口では、範囲を確かめてください。**

\`console.log(Math.min(...arr), Math.max(...arr))\` を $1$ 回流すだけで、
$0$ 以上 $1$ 未満に収まっているかが分かります。

同じことは、自分で書いたノイズ関数にも言えます。
**「$0$〜$1$ のつもり」が実は $-1$〜$1$ だった**は、本当によくある間違いです。`,
      answerCode: `// 出口で範囲を確かめる（1 回だけ流す）
const rand = mulberry32(SEED);
const sample = Array.from({ length: 10000 }, () => rand());
console.log('min', Math.min(...sample), 'max', Math.max(...sample));
// min 0.0000xx  max 0.9999xx  になっていれば正しい

// NaN が混じっていないかも見る
console.log('NaN の数', sample.filter((v) => v !== v).length);`,
    },
    {
      prompt: `この森を、**もっと重くしないまま木を $60$ → $400$ 本**にしたい。

いま木 $1$ 本は \`Group\`（幹 $1$ ＋ 葉 $3$）です。

1. いまのドローコールはおよそいくつですか。$400$ 本にすると？
2. **どう作り直しますか。** 失うものも書いてください。`,
      hint: '木 1 本にメッシュはいくつありますか。マテリアルは共有されていますか。',
      answer: `**1. 約 $245$ → 約 $1{,}605$。2. \`InstancedMesh\` を $2$ つ（幹・葉）にします。**

**1 ― いまのドローコール**

木 $1$ 本は幹 $1$ ＋ 葉 $3$ ＝ **メッシュ $4$ つ。**

しかも \`makeTree\` の中で**マテリアルを毎回 \`new\` している**ので、
$1$ 本ごとに別のマテリアルです ― まとめられません。

$60 \\times 4 = 240$

これに地面 $1$、草 $1$（\`InstancedMesh\`）、影のぶんを足して、**約 $245$**。

$400$ 本にすると

$400 \\times 4 = 1{,}600$ ― **約 $1{,}605$。**

$1$ 回 $0.012$ ms なら $19.3$ ms。**それだけで $60$ fps の予算を超えます。**

**2 ― 作り直し方**

**幹と葉を、それぞれ $1$ つの \`InstancedMesh\` にまとめます。**

- 幹 … $400$ 個 → \`InstancedMesh\` $1$ つ
- 葉 … $400 \\times 3 = 1{,}200$ 個 → \`InstancedMesh\` $1$ つ

ドローコールは **$2$**（＋地面・草・影）。$1{,}600 \\to 2$ です。

$1$ 本ごとの色は \`setColorAt()\` で持たせます
（[](#/ch/w43-instancing)でやった手です）。

**失うもの**

- **形が $1$ 種類に固定されます。** いまは葉の半径が $1$ 本ずつ違いますが、
  \`InstancedMesh\` では**同じジオメトリ**しか使えません。
  太さの違いは \`scale\` で表すことになり、**細長い木は全体が細長くなります**
- **粗さと金属度が共通**になります（マテリアルが $1$ つ）
- **\`makeTree\` が \`Group\` を返せなくなります。**
  「$1$ 本ぶんを作る」という読みやすい形が崩れ、
  「$400$ 本ぶんの行列を配列に詰める」関数になります

**間を取る手**

**木を $3$ 種類だけ作って、それぞれを \`InstancedMesh\` にする。**

ドローコールは $6$（幹 $3$ ＋ 葉 $3$）。
形の違いは $3$ 種類ぶん残り、あとは \`scale\` と色でばらつかせます。

**$400$ 本が全部違う必要は、たぶんありません。**
$3$ 種類 × 大きさ × 色のばらつきで、森は十分に森らしく見えます。

**判断の順**

**$60$ 本のままなら、いまの形のほうが読みやすくて良い。**
$400$ 本にするなら、読みやすさを $1$ 段落として速さを取る ―
**どちらが正しいかは、本数で決まります。**`,
    },
  ],
  quiz: [
    {
      q: '`makeTree(rand)` が `Group` を返す形にしているのは、なぜですか。',
      choices: [
        '幹と葉を「一緒に動くもの」としてまとめ、シーンのことを知らない部品にするため',
        'Group のほうが速いから',
        '`Group` でないと影が落ちないから',
        '`InstancedMesh` にできないから',
      ],
      answer: 0,
      explain:
        '部品を作る関数は、引数を受け取って物を返すだけにします。シーンに add するのは組み立てる本体の仕事です。この分け方は、第4部で作品が大きくなってもそのまま使えます。',
    },
    {
      q: '`r = R * Math.sqrt(i / N)` の `sqrt` を外すと、どうなりますか。',
      choices: [
        '中心に密集し、外周が寂しくなる',
        '外周に密集する',
        '変わらない',
        '木が重なる',
      ],
      answer: 0,
      explain:
        '面積は半径の 2 乗に比例します。sqrt があると「半径 r 以内の本数 ∝ r²」となって密度が一定に。外すと半径半分のところに 1/4 の本数が入り、密度が 4 倍になります。',
    },
    {
      q: '`mulberry32` の最後の `>>> 0` を外すと、何が起きますか。',
      choices: [
        '負の値が返るようになり、`Math.sqrt` に渡したところが NaN になる',
        '速くなる',
        '毎回同じ値が返る',
        '何も変わらない',
      ],
      answer: 0,
      explain:
        'JavaScript のビット演算は符号付き 32 ビットを返します。`>>> 0` は「符号なしとして読み直す」ためのもの。外すと結果が −0.5〜0.5 になり、エラーも出ないまま草が半分消えます。',
    },
  ],
};
