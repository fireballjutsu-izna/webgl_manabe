import type { Chapter } from '../types.ts';

export const chapterW18: Chapter = {
  slug: 'w18-normal-map',
  part: 'threejs',
  number: 18,
  title: '法線マップ ― 三角形を増やさずに、凹凸を出す',
  goal: '法線マップが何を記録した画像かが分かり、色以外のマップを使い分けられるようになります。',
  requires: ['w17-filter', 'm08-normal-matrix'],
  threeApis: [
    'MeshStandardMaterial.normalMap',
    'MeshStandardMaterial.normalScale',
    'MeshStandardMaterial.roughnessMap',
    'MeshStandardMaterial.aoMap',
    'MeshStandardMaterial.displacementMap',
    'BufferGeometry.computeTangents',
  ],
  mathRecall: [
    { slug: 'b27-lambert', note: '明るさは法線と光の内積。法線を変えれば陰影が変わる' },
    { slug: 'm08-normal-matrix', note: '法線は、位置とは違う変換をする' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 明るさを決めているのは、法線だけ

[](#/ch/b27-lambert)でやったとおり、面の明るさは**法線と光の向きの内積**で決まります。

ここに、とてつもない抜け道があります。

**目に見えているのは「明るさ」であって、「形」ではない。**

だから**法線だけを差し替えれば、形を変えずに凹凸があるように見せられます。**
これが{{バンプマップ}}の考え方で、その最も一般的な形が**法線マップ**です。

- レンガの目地
- 布の織り目
- 金属の傷
- 皮膚の毛穴

これらを本当の凹凸で作れば、**三角形が数百万枚**要ります。
法線マップなら、**平らな板 2 枚**で済みます。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '舞台の書き割り',
      text: `
舞台の背景は、平らな板に立体的な絵が描いてあります。

客席から見れば、奥行きのある街並みに見えます。
真横から覗けば、ただの板だと分かります。

法線マップはこれと同じです。
正面から見ればレンガの凹凸に見え、
横から見ると輪郭が真っ平らなので、嘘だとばれます。
`,
    },
    {
      kind: 'md',
      text: `
## 法線マップの色が、あの青紫色である理由

法線マップの画像は、たいてい**淡い青紫**をしています。
あれは絵ではなく、**ベクトルの成分をそのまま色にしたもの**です。

[](#/ch/t03-material)の \`MeshNormalMaterial\` とまったく同じ変換です。

- **R** … 法線の $x$（横向きの傾き）
- **G** … 法線の $y$（縦向きの傾き）
- **B** … 法線の $z$（面から立ち上がる向き）

法線の成分は $-1$〜$1$ ですが、色は $0$〜$1$ しか表せません。
だから $(n + 1) / 2$ で移し替えます。

**傾きがゼロ ― つまり面に真っ直ぐ立った法線 $(0, 0, 1)$ は $(0.5,\\, 0.5,\\, 1.0)$。**
$0$〜$255$ なら **$(128, 128, 255)$** ― あの青紫です。

**画像全体がこの色なら、凹凸なし。** 法線マップの「無地」がこの色になります。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathbf{n} \\;=\\; 2\\,\\mathbf{c} - 1, \\qquad \\mathbf{c} \\;=\\; \\frac{\\mathbf{n} + 1}{2}',
      readAloud:
        '色から法線へ、法線から色へ。同じ変換の行きと帰りです。色は $0$ から $1$、法線は $-1$ から $1$ なので、2 倍して 1 を引く、あるいは 1 を足して 2 で割る、それだけです。',
      worked: {
        given: '法線マップの画素が $(200,\\; 128,\\; 220)$ でした。**どちらに傾いた面**でしょう。',
        steps: [
          { calc: 'R : 200 / 255 = 0.784 → 2 x 0.784 - 1 = 0.569' },
          { calc: 'G : 128 / 255 = 0.502 → 2 x 0.502 - 1 = 0.004' },
          { calc: 'B : 220 / 255 = 0.863 → 2 x 0.863 - 1 = 0.725' },
          { calc: 'n = (0.569, 0.004, 0.725)' },
          { calc: '長さ = sqrt(0.324 + 0 + 0.526) = 0.922', note: '1 ではない' },
          { calc: '正規化 : (0.617, 0.004, 0.787)' },
        ],
        result:
          '**$+x$ 方向（右）へ $38°$ 傾いた面**です（$\\arccos(0.787) = 38.1°$）。$G$ がほぼ $0.5$ なので、上下方向の傾きはありません。**長さが $1$ にならない**のは、画像が $8$ ビットで量子化されているためです。GPU は読んだあと正規化するので問題になりません。**$B$ が $0.5$ を下回る画素があったら、その法線マップは壊れています** ― 面の裏側を向いた法線は、接空間ではありえないからです。',
      },
    },
    {
      kind: 'sandbox',
      title: '同じ板を、法線マップの有無で比べる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 法線マップの強さ。0 で無効、マイナスで凹凸が反転します
const STRENGTH = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.2, 4.6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 光を動かすと、凹凸の嘘が「本物らしく」見える
const key = new THREE.DirectionalLight(0xffffff, 3);
scene.add(key, new THREE.AmbientLight(0xffffff, 0.12));

// レンガの目地を、法線マップとして描く
function brickNormalMap(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);

  const ROWS = 6;
  const h = size / ROWS;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const row = Math.floor(y / h);
      const shift = (row % 2) * 0.5;                 // 1 段おきに半分ずらす
      const u = ((x / size) * 3 + shift) % 1;        // 横に 3 個
      const v = (y % h) / h;

      // 目地（境目）に近いほど、傾きを付ける
      const du = Math.abs(u - 0.5) > 0.45 ? Math.sign(u - 0.5) : 0;
      const dv = Math.abs(v - 0.5) > 0.42 ? Math.sign(v - 0.5) : 0;

      // 法線 (-du, -dv, 1) を正規化して、色に移し替える
      const len = Math.hypot(du, dv, 1);
      const i = (y * size + x) * 4;
      image.data[i]     = ((-du / len) * 0.5 + 0.5) * 255;
      image.data[i + 1] = (( dv / len) * 0.5 + 0.5) * 255;   // canvas は上下が逆
      image.data[i + 2] = ((  1 / len) * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  // 法線マップは「色」ではなくデータなので colorSpace は指定しない
  return texture;
}

const normalMap = brickNormalMap();

const geometry = new THREE.PlaneGeometry(1.8, 1.8);
const base = { color: 0xc0b0a0, roughness: 0.75 };

// 左：平らな板
const plain = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial(base));
plain.position.x = -1.05;
plain.rotation.x = -Math.PI / 3.2;

// 右：同じ板に、法線マップだけを足したもの
const bumped = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
  ...base,
  normalMap,
  normalScale: new THREE.Vector2(STRENGTH, STRENGTH),
}));
bumped.position.x = 1.05;
bumped.rotation.x = -Math.PI / 3.2;

scene.add(plain, bumped);

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  // 光をゆっくり回す。凹凸の見え方が変わるのが肝
  const t = clock.getElapsedTime();
  key.position.set(Math.cos(t * 0.6) * 3, 2.5, Math.sin(t * 0.6) * 3 + 1);

  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**右の板は頂点がまったく増えていません。** 法線だけを画像で差し替えて、光の当たり方を変えています。光が回るにつれて目地の陰が動くので、本物の凹凸のように見えます。**`STRENGTH` を `-1` にすると、レンガが凹んで見えます** ― 出っ張りと窪みの違いは、法線の向きだけです。ドラッグして真横から見ると、右の板も真っ平らだと分かります。',
    },
    {
      kind: 'md',
      text: `
## 接空間 ― なぜ「面から見た向き」で記録するのか

法線マップに入っている $(0, 0, 1)$ は、**ワールド座標の上方向ではありません。**
**「その面から真っ直ぐ立った向き」**です。

これを**接空間**（タンジェント空間）と呼びます。

**なぜワールド座標で記録しないのか。** 使い回せなくなるからです。

同じレンガの法線マップを、床にも壁にも天井にも貼りたい。
ワールドの向きで書いてあったら、面ごとに別の画像が要ります。

「面から見てどちらへ傾いているか」で書いておけば、
**どんな向きの面にも同じ画像が貼れます。**
[](#/ch/m17-local-world)でやった「ローカルで持って、変換で世界へ出す」と同じ考え方です。

three は描画時に、UV の向きから**接線ベクトル**を作り、
接空間の法線をワールドの向きへ変換します。**書くことは何もありません。**
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'normalMap に colorSpace を指定してはいけません',
      text: `
法線マップの RGB は色ではなく、ベクトルの成分です。

sRGB の変換をかけると値が 2.2 乗され、たとえば 0.5 が 0.218 になります。
$2c - 1$ で戻すと、傾きゼロのはずが -0.56 ―
すべての面が同じ方向へ大きく傾いた、奇妙な陰影になります。

map には指定し、normalMap / roughnessMap / metalnessMap / aoMap には
指定しない。これは例外なく守ってください。
`,
    },
    {
      kind: 'md',
      text: `
## 色以外のマップ、ひととおり

法線マップと同じ発想で、**面の性質を場所ごとに変える**マップがいくつもあります。

| マップ | 効くもの | 色空間 |
|---|---|---|
| \`map\` | 色 | **sRGB** |
| \`normalMap\` | 法線の向き | 指定しない |
| \`roughnessMap\` | 粗さ（$G$ チャンネル） | 指定しない |
| \`metalnessMap\` | 金属度（$B$ チャンネル） | 指定しない |
| \`aoMap\` | 隅の暗がり（$R$ チャンネル・\`uv1\` を読む） | 指定しない |
| \`emissiveMap\` | 自分で光る部分 | **sRGB** |
| \`alphaMap\` | 透明度 | 指定しない |
| \`displacementMap\` | **本当に頂点を動かす** | 指定しない |

**roughness / metalness / ao は、1 枚の画像に詰め込めます。**
$R$ に AO、$G$ に粗さ、$B$ に金属度を入れた画像を 3 つのスロットに渡すと、
three がそれぞれのチャンネルだけを読みます。**画像が 3 枚 → 1 枚**になります。
glTF ではこれが標準で、「ORM テクスチャ」と呼ばれます。
`,
    },
    {
      kind: 'code',
      title: '1 枚の画像を 3 つのマップとして使う',
      code: `import * as THREE from 'three';

const loader = new THREE.TextureLoader();

// 色。sRGB を指定する
const colorMap = loader.load('/brick_color.jpg');
colorMap.colorSpace = THREE.SRGBColorSpace;

// データ。指定しない
const normalMap = loader.load('/brick_normal.jpg');
const ormMap = loader.load('/brick_orm.jpg');    // R:AO G:粗さ B:金属度

const material = new THREE.MeshStandardMaterial({
  map: colorMap,
  normalMap,

  aoMap: ormMap,          // R だけ読まれる
  roughnessMap: ormMap,   // G だけ読まれる
  metalnessMap: ormMap,   // B だけ読まれる

  // マップは「掛け算される」ので、基準値を 1 にしておく
  roughness: 1.0,
  metalness: 1.0,
});

// aoMap は uv1 を読む。無ければ uv をコピーする
geometry.setAttribute('uv1', geometry.attributes.uv);

// 凹凸の強さ。1 が標準、上げると誇張、マイナスで反転
material.normalScale.set(1.0, 1.0);`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'マップは掛け算されます',
      text: `
roughnessMap を設定したのに効かない、という詰まり方があります。

原因はたいてい roughness が 0 のまま残っていることです。
最終的な粗さは roughness x roughnessMap の値なので、
0 を掛ければ何を貼っても 0 になります。

マップを使うときは、対応する数値を 1.0 にしてください。
color と map も同じ関係で、color が黒だとテクスチャが真っ黒になります。
`,
    },
    {
      kind: 'md',
      text: `
## 法線マップで足りないとき ― displacementMap

法線マップの限界は、**輪郭が変わらない**ことです。

- 真横から見ると平らだとばれる
- 出っ張りが手前のものを隠さない
- 影の形が凹凸に追随しない

これが問題になるなら、**本当に頂点を動かす**しかありません。
それが \`displacementMap\` です。

**ただし、これは頂点シェーダの仕事**で、
[](#/ch/w09-geometry-edit)でやった CPU 側の書き換えとは別物です。
GPU が頂点を動かすので速いのですが、**動かせるのは頂点だけ** ―
分割数が足りなければ効きません。

$2 \\times 2$ の板に displacementMap を貼っても、**4 頂点しか動きません。**
細かい凹凸を出すには $200 \\times 200$ くらいの分割が要り、
そうなると「三角形を増やさない」という利点が消えます。

**使い分け**

- **細かい凹凸**（目地・織り目・傷）→ **法線マップ**。輪郭は変わらないが、十分だます
- **大きな起伏**（地形・波・岩）→ **displacementMap**。輪郭も変わる
- **両方**を組み合わせるのが実務では普通です
`,
    },
    {
      kind: 'md',
      text: `
## ここまでで、テクスチャは終わり

5 章かけて見てきたものを並べます。

- **UV** … 画像のどこを面のどこに貼るか。$0$〜$1$ の 2 つ組
- **repeat / wrap** … 小さな 1 枚を敷き詰める。**いつも組**
- **ミップマップ / anisotropy** … 遠くのちらつきと、斜めのぼやけ
- **各種マップ** … 色だけでなく、法線・粗さ・金属度・AO も画像で

**共通する考え方は 1 つ。**

**「形は粗く、絵で細かく」。**

三角形は高くつきますが、テクスチャは安い。
$1024 \\times 1024$ の画像は $100$ 万個の情報を持てて、$5.6$MB です。
同じ情報を頂点で持てば $32$MB かかり、しかも描画が重くなります。

次の章からはライトに移ります。
**テクスチャで用意した「面の性質」に、光を当てる**段です。
`,
    },
  ],
  exercises: [
    {
      prompt: `法線マップの画素が $(128,\\; 60,\\; 230)$ でした。**どちらに傾いた面**ですか。
そして、傾きの角度はおよそ何度ですか。`,
      hint: '$n = 2c - 1$ で戻し、正規化してから $\\arccos$ を取ります。',
      answer: `**下方向（$-y$）へ、およそ $32°$ 傾いた面**です。

**色から法線へ**

$R$ … $128/255 = 0.502$ → $2 \\times 0.502 - 1 = 0.004$
$G$ … $60/255 = 0.235$ → $2 \\times 0.235 - 1 = -0.529$
$B$ … $230/255 = 0.902$ → $2 \\times 0.902 - 1 = 0.804$

$\\mathbf{n} = (0.004,\\; -0.529,\\; 0.804)$

**正規化**

長さ $= \\sqrt{0.000016 + 0.280 + 0.646} = \\sqrt{0.926} = 0.962$

$\\mathbf{n} = (0.004,\\; -0.550,\\; 0.836)$

**角度**

面から真っ直ぐ立った向きは $(0, 0, 1)$。内積は $z$ 成分そのものなので

$\\arccos(0.836) = 33.3°$

**読み取れること**

- $R \\approx 0.5$ … **横方向の傾きは無い**
- $G$ が $0.5$ より小さい … **下向きに傾いている**（$-y$）
- $B$ が大きい … 全体としては手前を向いている（傾きは急ではない）

**この画素は、レンガの目地の「上の縁」あたり**でしょう。
上から下へ落ち込む斜面なので、法線が下を向きます。

**確かめ方** … $B$ は必ず $0.5$ より大きくなります。
接空間では、法線が面の裏側（$z < 0$）を向くことはありえないからです。
$B < 128$ の画素があったら、その画像は法線マップではないか、壊れています。`,
    },
    {
      prompt: `\`roughnessMap\` を設定したのに、まったく効きません。
画像は正しく読み込めていて、\`colorSpace\` も指定していません。何が原因ですか。`,
      hint: 'マップと数値は、どういう関係で組み合わされますか。',
      answer: `**\`roughness\` が $0$（またはそれに近い値）のまま残っています。**

three では、マップと数値は**掛け算**されます。

$\\text{最終的な粗さ} = \\text{roughness} \\times \\text{roughnessMap の } G$

だから \`roughness: 0\` だと、**何を貼っても $0 \\times$ 何か $= 0$。**
画像は正しく読まれているのに、結果は常に「完全な鏡」になります。

**直し方** … \`roughness = 1.0\` にします。
これで「マップの値がそのまま使われる」状態になります。

**同じ関係のもの**

| 数値 | マップ | 既定値 | 注意 |
|---|---|---|---|
| \`color\` | \`map\` | 白 | 黒にするとテクスチャが真っ黒 |
| \`roughness\` | \`roughnessMap\` | **$1.0$** | $0$ にすると効かない |
| \`metalness\` | \`metalnessMap\` | **$0.0$** | **既定のままだと効かない** |
| \`emissive\` | \`emissiveMap\` | **黒** | **既定のままだと効かない** |

**\`metalnessMap\` と \`emissiveMap\` は、既定値のせいでほぼ必ず引っかかります。**

\`metalness\` の既定は $0$、\`emissive\` の既定は黒。
どちらも掛けると $0$ になるので、**マップを貼っただけでは何も起きません。**

**「マップを使うなら、対応する数値を $1$（または白）にする」** ―
これを習慣にしてください。

**なぜこういう設計なのか** … マップ全体の強さを 1 つの値で調整できるからです。
\`roughness = 0.5\` にすれば、マップの粗さが一律に半分になります。`,
      answerCode: `const material = new THREE.MeshStandardMaterial({
  map: colorMap,
  color: 0xffffff,        // 白。テクスチャの色をそのまま出す

  roughnessMap: ormMap,
  roughness: 1.0,         // マップの値をそのまま使う

  metalnessMap: ormMap,
  metalness: 1.0,         // ← 既定は 0。忘れると効かない

  emissiveMap: glowMap,
  emissive: 0xffffff,     // ← 既定は黒。忘れると光らない
  emissiveIntensity: 1.0,
});`,
    },
    {
      prompt: `地形に岩肌の凹凸を出したい。\`normalMap\` と \`displacementMap\` のどちらを使いますか。
**大きな起伏**（丘・谷）と**細かい凹凸**（岩の表面）で、答えは変わりますか。`,
      hint: '輪郭が変わる必要があるのは、どちらですか。',
      answer: `**両方使います。役割が違うからです。**

**大きな起伏（丘・谷）→ \`displacementMap\`**

理由は 3 つ。

- **輪郭が変わる必要がある。** 丘の稜線が空を切り取らないと、地形に見えません
- **他のものを隠す必要がある。** 丘の向こうの木は見えてはいけません
- **影の形が追随する必要がある。** 丘が谷に影を落とさないと嘘くさい

法線マップはこの 3 つを 1 つも満たしません。**明るさしか変えないから**です。

**細かい凹凸（岩の表面）→ \`normalMap\`**

理由は 1 つ。**分割数が足りないから。**

\`displacementMap\` が動かせるのは**頂点だけ**です。
$1$ センチの凹凸を出すには、$1$ センチごとに頂点が要ります。
$100$ メートル四方なら **$1$ 億頂点** ― 到底無理です。

法線マップなら、頂点は $200 \\times 200$ のままで、
**テクスチャの解像度ぶんの細かさ**が出ます。

**組み合わせるのが実務の標準**です ―
\`displacementMap\` で大きな形を作り、\`normalMap\` で細部を足す。
映画でもゲームでも、これが基本の作りです。

**判断の基準** … 「**輪郭に出るか**」で決めてください。

- 輪郭が変わってほしい → displacement（頂点が要る）
- 明るさだけで足りる → normal（頂点は増やさない）

**なお \`displacementMap\` には落とし穴があります。**
頂点シェーダで動かすので、three は**当たり判定を知りません。**
Raycaster は元の平らな形に当たります。
地形の高さが要るなら、[](#/ch/w09-geometry-edit)のように CPU 側でも計算してください。`,
      answerCode: `const terrain = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100, 256, 256),   // 大きな起伏に必要な分割
  new THREE.MeshStandardMaterial({
    map: colorMap,

    displacementMap: heightMap,     // 大きな形。頂点が動く
    displacementScale: 12,

    normalMap: rockNormal,          // 細部。頂点は増えない
    normalScale: new THREE.Vector2(1.5, 1.5),

    roughnessMap: ormMap,
    roughness: 1.0,
  }),
);
terrain.rotation.x = -Math.PI / 2;

// Raycaster は displacement を見ないので、高さは CPU 側でも計算する`,
    },
  ],
  quiz: [
    {
      q: '法線マップの「凹凸なし」を表す色はどれですか。',
      choices: [
        '$(128, 128, 255)$ の淡い青紫',
        '真っ黒 $(0,0,0)$',
        '真っ白 $(255,255,255)$',
        '中間の灰色 $(128,128,128)$',
      ],
      answer: 0,
      explain:
        '面から真っ直ぐ立った法線 $(0,0,1)$ を $(n+1)/2$ で色に移すと $(0.5, 0.5, 1.0)$ になります。$B$ が必ず $0.5$ を超えるのは、接空間では法線が面の裏を向けないためです。',
    },
    {
      q: '`normalMap` に `colorSpace = SRGBColorSpace` を指定すると何が起きますか。',
      choices: [
        '値が歪んで、すべての面が同じ方向へ大きく傾いた奇妙な陰影になる',
        '何も変わらない',
        '凹凸が強くなる',
        '真っ黒になる',
      ],
      answer: 0,
      explain:
        'RGB は色ではなくベクトルの成分です。$2.2$ 乗されると $0.5$ が $0.218$ になり、$2c-1$ で戻すと $-0.56$ ― 傾きゼロのはずが大きく傾きます。map と emissiveMap だけに指定してください。',
    },
    {
      q: '`roughnessMap` を貼ったのに効きません。まず疑うのはどれですか。',
      choices: [
        '`roughness` が 0 のまま（マップと数値は掛け算される）',
        'UV が無い',
        '`colorSpace` の指定漏れ',
        'ライトが足りない',
      ],
      answer: 0,
      explain:
        '最終的な粗さは `roughness × マップの値` です。0 を掛ければ常に 0 になります。とくに `metalnessMap`（既定 0）と `emissiveMap`（既定は黒）は、既定値のままだと必ず効きません。',
    },
  ],
};
