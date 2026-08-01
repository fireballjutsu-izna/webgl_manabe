import type { Chapter } from '../types.ts';

export const chapterW15: Chapter = {
  slug: 'w15-uv',
  part: 'threejs',
  number: 15,
  title: 'UV ― 立体を、平らな紙に開く',
  goal: '組み込みジオメトリの UV がどうなっているかが読め、自分で UV を付けられるようになります。',
  requires: ['t04-texture', 'm22-spherical'],
  threeApis: [
    'BufferGeometry.setAttribute',
    'SphereGeometry',
    'PlaneGeometry',
    'BufferAttribute.getX',
    'BufferGeometry.attributes',
  ],
  mathRecall: [
    { slug: 'm22-spherical', note: '緯度経度を、そのまま UV に使う' },
    { slug: 'b23-atan2', note: '位置から角度を求めて、それを $0$〜$1$ に直す' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 「正しい UV」は存在しない

球にきれいに絵を貼りたい。ところが、これは**原理的に不可能**です。

球面を、伸ばしたり縮めたりせずに平らな紙にすることはできません。
数学的に証明されている事実で、**世界地図がどれも歪んでいる**のと同じ理由です。

だから UV に「正解」はありません。あるのは選択だけです。

- **どこを歪ませるか**（極か、赤道か、継ぎ目か）
- **どこで切るか**（切らずには開けない）

組み込みジオメトリの UV も、three が**ある選択をした結果**です。
それを知っておくと、思ったように貼れないときの原因が読めます。
`,
    },
    {
      kind: 'md',
      text: `
## 組み込みジオメトリの UV

three がどう決めているかを、3 つ見ておきます。

**\`PlaneGeometry\`** … いちばん素直です。
左下が $(0,0)$、右上が $(1,1)$。歪みはありません。

**\`BoxGeometry\`** … **6 面それぞれに、画像が丸ごと 1 枚ずつ**貼られます。
「箱の展開図」ではありません。同じ絵が 6 回繰り返されます。
展開図のように貼りたければ、UV を自分で書き換えるか、面ごとにマテリアルを分けます。

**\`SphereGeometry\`** … 経度を $u$、緯度を $v$ にした{{正距円筒図法}}です。

- $u = 0$ から $1$ が、経度 $0°$ から $360°$
- $v = 0$ が南極、$v = 1$ が北極

**世界地図と同じ**なので、地図の画像がそのまま貼れます。
そのかわり**極でつぶれます。** 北極では、画像の上端 1 行ぜんぶが 1 点に集まります。
`,
    },
    {
      kind: 'formula',
      tex: 'u = \\frac{1}{2} - \\frac{\\operatorname{atan2}(z,\\, x)}{2\\pi}, \\qquad v = \\frac{1}{2} + \\frac{\\arcsin(y / r)}{\\pi}',
      readAloud:
        '球面上の点から UV を求める式です。$u$ は水平方向の角度を $0$〜$1$ に直したもの、$v$ は上下の角度を $0$〜$1$ に直したもの。[](#/ch/m22-spherical) の緯度経度を、そのまま割合に変換しているだけです。',
      worked: {
        given: '半径 $1$ の球の上の点 $(0,\\; 0.5,\\; 0.866)$ の UV を求めます。',
        steps: [
          { calc: 'atan2(z, x) = atan2(0.866, 0) = pi/2 = 1.5708' },
          { calc: 'u = 0.5 - 1.5708 / 6.2832 = 0.25' },
          { calc: 'asin(y / r) = asin(0.5) = pi/6 = 0.5236' },
          { calc: 'v = 0.5 + 0.5236 / 3.1416 = 0.6667' },
          { calc: '【確かめ】長さ = sqrt(0 + 0.25 + 0.75) = 1', note: '確かに球の上' },
        ],
        result:
          '**$(0.25,\\; 0.667)$** です。$u = 0.25$ は「一周の 4 分の 1 の位置」、$v = 0.667$ は「南極から $2/3$ 上がったところ」 ― **緯度 $30°$ 北**を意味します。**引き算になっているのは、three の `SphereGeometry` が $x$ を負の向きから巻き始めるため**で、この式は three の全頂点と誤差 $0$ で一致します。**北極（$y = 1$）では $\\arcsin(1) = \\pi/2$ で $v = 1$ ですが、$u$ は $\\operatorname{atan2}(0, 0)$ となって決まりません。** これが「極でつぶれる」の正体で、画像の上端 1 行ぜんぶが 1 点に集まります。',
      },
    },
    {
      kind: 'sandbox',
      title: 'UV を、色にして見る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 8.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// UV を目で見るための格子。数字も入れて向きが分かるようにする
function uvGridTexture(size = 512, cells = 8) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cell = size / cells;

  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      // u が右へ増えるほど青→赤、v が上へ増えるほど緑が強くなる
      const u = (x + 0.5) / cells;
      const v = 1 - (y + 0.5) / cells;     // canvas は上が 0、UV は下が 0
      const r = Math.round(40 + u * 200);
      const g = Math.round(40 + v * 190);
      const b = Math.round(240 - u * 200);
      ctx.fillStyle = \`rgb(\${r}, \${g}, \${b})\`;
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  // 格子線
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  for (let i = 0; i <= cells; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, size);
    ctx.moveTo(0, i * cell); ctx.lineTo(size, i * cell);
    ctx.stroke();
  }

  // (0,0) の目印
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px monospace';
  ctx.fillText('0,0', 10, size - 16);
  ctx.fillText('1,1', size - 90, 44);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const map = uvGridTexture();
const material = new THREE.MeshStandardMaterial({ map, roughness: 0.8, side: THREE.DoubleSide });

const shapes = [
  new THREE.PlaneGeometry(1.9, 1.9),
  new THREE.BoxGeometry(1.5, 1.5, 1.5),
  new THREE.SphereGeometry(1, 40, 26),
  new THREE.CylinderGeometry(0.8, 0.8, 1.7, 32),
  new THREE.TorusGeometry(0.8, 0.3, 20, 48),
];

shapes.forEach((geometry, i) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = (i - (shapes.length - 1) / 2) * 2.4;
  if (i === 2) mesh.rotation.y = -1.1;    // 球だけ、継ぎ目が見える向きへ回す
  scene.add(mesh);
});

scene.add(
  new THREE.DirectionalLight(0xffffff, 2.2).translateY(5),
  new THREE.HemisphereLight(0x99bbff, 0x101020, 1.0),
);

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
        '**格子の潰れ方が、UV の歪みそのものです。** 平面は正方形のまま、箱は 6 面に同じ絵が丸ごと、球は極に近づくほど横に潰れます。円柱の上下の蓋は円形に切り取られ、トーラスは全体にきれいに巻かれています。ドラッグして球の真上へ回り込むと、極で 8 つのマス目が 1 点に集まっているのが見えます。',
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'UV の格子は、最初に貼るテクスチャ',
      text: `
モデルを読み込んだとき、まず UV 格子を貼ってみるのが定石です。

- マス目が正方形に近い → UV は素直。テクスチャがきれいに乗る
- 引き伸ばされている → その部分だけ解像度が足りなくなる
- 急に途切れている → そこが継ぎ目。模様が合わない

これを見てから本番のテクスチャを作ると、やり直しが減ります。
`,
    },
    {
      kind: 'md',
      text: `
## 自分で UV を付ける

[](#/ch/w07-index)で作った格子の平面には、UV がありません。
テクスチャを貼っても単色に塗りつぶされます。

付け方は簡単で、**\`position\` を並べたのと同じ順番で、$0$〜$1$ の値を並べる**だけです。
`,
    },
    {
      kind: 'code',
      title: '格子の平面に UV を付ける',
      code: `import * as THREE from 'three';

const N = 40;
const positions = [];
const uvs = [];

for (let iz = 0; iz <= N; iz++) {
  for (let ix = 0; ix <= N; ix++) {
    const u = ix / N;              // 0 〜 1
    const v = iz / N;

    positions.push((u - 0.5) * 10, 0, (v - 0.5) * 10);
    uvs.push(u, v);                // position と同じ順番で並べる
  }
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));   // itemSize は 2

// 円柱に巻きつけるなら、角度を u に使う（[](#/ch/b23-atan2) の atan2）
function cylindricalUV(geometry) {
  const pos = geometry.attributes.position;
  const uv = [];
  for (let i = 0; i < pos.count; i++) {
    const angle = Math.atan2(pos.getZ(i), pos.getX(i));
    uv.push(0.5 + angle / (Math.PI * 2), pos.getY(i) * 0.5 + 0.5);
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
}`,
    },
    {
      kind: 'md',
      text: `
## 継ぎ目 ― 一周したところで、必ず問題が起きる

円柱に UV を巻きつけると、**一周した継ぎ目で模様が飛びます。**

原因は補間です。継ぎ目をまたぐ三角形の 2 頂点は $u = 0.98$ と $u = 0.02$。
三角形の内側は補間で埋められるので、GPU は $0.98 \\to 0.02$ を
**逆向きに一周**して、画像を丸ごと横断してしまいます。

**直し方は 1 つ。** 継ぎ目の頂点を**共有せず、2 つに分けます。**

- 継ぎ目の左側の頂点 … $u = 0.98$
- 継ぎ目の右側の頂点 … $u = 1.0$（同じ位置だが、別の頂点）

[](#/ch/w07-index)で見た「共有できるのは属性がすべて同じ頂点だけ」が、
ここでそのまま効いてきます。**位置が同じでも UV が違えば、別の頂点**です。

three の \`CylinderGeometry\` や \`SphereGeometry\` も、内部で同じことをしています。
だから $(N+1)$ 列の頂点があるわけです。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'UV が無いと、単色になります',
      text: `
自分で組んだジオメトリには uv 属性がありません。

その状態でテクスチャ付きのマテリアルを使うと、
全部の画素が画像の同じ 1 点（たいてい左下）を読むので、単色に塗りつぶされます。

エラーは出ません。
「テクスチャが貼れない」と思ったら、まず geometry.attributes に uv があるか確かめてください。
`,
    },
    {
      kind: 'md',
      text: `
## UV は 2 組持てる

\`uv\` のほかに \`uv1\` という 2 つ目の組を持たせられます。
用途は主に 1 つ ― **\`aoMap\`（隅の暗がり）と \`lightMap\`** です。

これらは「その場所に固有の情報」なので、
タイルのように繰り返す \`map\` とは別の UV が要ります。

- \`map\` … タイルを 20 回繰り返す UV
- \`aoMap\` … 面全体で 1 回だけの、重ならない UV

**\`aoMap\` を設定したのに効かないときは、たいてい \`uv1\` が無い**のが原因です。
`,
    },
  ],
  exercises: [
    {
      prompt: `半径 $2$ の球の上の点 $(2,\\; 0,\\; 0)$ の UV を求めてください。
また、点 $(0,\\; 2,\\; 0)$ ではどうなりますか。`,
      hint: '2 つ目は $\\operatorname{atan2}(0, 0)$ になります。',
      answer: `**$(2, 0, 0)$ は $(0.5,\\; 0.5)$。$(0, 2, 0)$ は $v = 1$ だが $u$ が決まりません。**

**点 $(2, 0, 0)$**

$u$ … $\\operatorname{atan2}(z, x) = \\operatorname{atan2}(0, 2) = 0$
$u = 0.5 - 0 / 2\\pi = 0.5$

$v$ … $\\arcsin(y/r) = \\arcsin(0/2) = 0$
$v = 0.5 + 0 / \\pi = 0.5$

**$(0.5, 0.5)$** ― 画像のちょうど中央です。赤道上の点なので納得できます。

**点 $(0, 2, 0)$ ― 北極**

$v$ … $\\arcsin(2/2) = \\arcsin(1) = \\pi/2$
$v = 0.5 + (\\pi/2)/\\pi = 1.0$ ― 画像の**上端**

$u$ … $\\operatorname{atan2}(0, 0)$ ― **決まりません。**

JavaScript の \`Math.atan2(0, 0)\` は $0$ を返しますが、
これは規約であって、数学的な答えではありません。
**北極では「経度」という概念自体が意味を持たない**からです。

**これが「極でつぶれる」の正体です。**

three の \`SphereGeometry\` は、極にも頂点を並べ、
それぞれに $u = 0, 0.03, 0.06, \\ldots$ と違う値を与えています。
だから**画像の上端 1 行ぜんぶが、極の 1 点に集まります。**

**実務での影響**

- 極の付近だけ、テクスチャが極端に引き伸ばされる
- 惑星のテクスチャは、極の付近を意図的に単調にしておく
- どうしても気になるなら、**立方体を球に変形した UV**（キューブマップ的な貼り方）を使う`,
    },
    {
      prompt: `円柱に UV を巻きつけたら、**継ぎ目に画像が横方向にぎゅっと圧縮された帯**ができました。
なぜですか。どう直しますか。`,
      hint: '継ぎ目をまたぐ三角形の、2 つの頂点の $u$ はいくつですか。',
      answer: `**継ぎ目の頂点を共有しているからです。**

継ぎ目をまたぐ三角形の 2 頂点は、たとえば $u = 0.97$ と $u = 0.0$ になっています。
どちらも空間的には隣り合った位置です。

ところが GPU は、**三角形の内側を補間で埋めます。**
$0.97 \\to 0.0$ を補間すると、画像を**逆向きに丸ごと横断**します。

結果、その細い三角形の中に**画像 1 枚ぶんが圧縮されて**詰め込まれます。
これが「継ぎ目の帯」です。

**直し方は、頂点を分けること。**

継ぎ目の位置に**2 つの頂点を置きます。** 座標はまったく同じですが、UV が違います。

- 一周の終わりの頂点 … $u = 1.0$
- 一周の始まりの頂点 … $u = 0.0$

これで補間は $0.97 \\to 1.0$ になり、正しくつながります。

**[](#/ch/w07-index)の話がそのまま効いてきます。**
「共有できるのは、位置も法線も UV も全部一致する頂点だけ」。
**位置が同じでも UV が違えば、別の頂点**です。

だから $N$ 分割の円柱には $N+1$ 列の頂点が要ります。
three の \`CylinderGeometry\` も内部で同じことをしています。

**同じ問題は法線でも起きます** ― 継ぎ目で法線を平均すると、そこだけ陰影がずれます。
ただし円柱の側面は連続しているので、**法線は共有したほうが良い**という点が違います。
「UV は分けたいが、法線は共有したい」は**両立しません。**
その場合は UV を優先し、法線のずれは目立たないので受け入れます。`,
      answerCode: `// 円柱の側面。継ぎ目のために N+1 列を作る
const N = 32;
const positions = [];
const uvs = [];

for (let iy = 0; iy <= 1; iy++) {
  for (let ix = 0; ix <= N; ix++) {      // ← N ではなく N+1 列
    const u = ix / N;                    // 最後の列は u = 1.0
    const angle = u * Math.PI * 2;       // 最初と最後は同じ角度

    positions.push(Math.cos(angle), iy * 2 - 1, Math.sin(angle));
    uvs.push(u, iy);
  }
}
// ix = 0 と ix = N は同じ位置だが、u が 0 と 1 で別の頂点になる`,
    },
    {
      prompt: `モデルに \`aoMap\`（隅の暗がり）を設定したのに、まったく効きません。
\`map\` は正しく貼れています。何が足りませんか。`,
      hint: '`aoMap` が読む UV は、`map` と同じものですか。',
      answer: `**\`uv1\` 属性が足りません。**

three では、\`aoMap\` と \`lightMap\` は **\`uv1\`（2 つ目の UV）** を読みます。
\`map\` が読む \`uv\` ではありません。

**なぜ分けるのか**

用途が根本的に違うからです。

- **\`map\`** … タイルを 20 回繰り返してもいい。**同じ場所が何度使われても構わない**
- **\`aoMap\`** … 「この隅は暗い」という**その場所に固有の情報**。
  重なってはいけないし、繰り返してもいけない

タイルの UV で AO を貼ると、**20 か所すべてに同じ暗がりが出ます。** 意味がありません。

だから AO 用には「面全体で 1 回だけ、どこも重ならない」UV を別に用意します。
モデリングツールでは「UV2」「ライトマップ UV」と呼ばれるものです。

**手っ取り早い直し方**

UV を繰り返していないなら、\`uv\` をそのまま \`uv1\` にコピーすれば動きます。

\`geometry.setAttribute('uv1', geometry.attributes.uv)\`

glTF を読み込んだ場合、モデル側に 2 つ目の UV が入っていれば
three が自動で \`uv1\` として設定します。入っていなければ、上のコピーが要ります。

**\`aoMap\` が効かないときの確認順**

1. \`uv1\` はあるか（\`geometry.attributes.uv1\`）
2. \`aoMapIntensity\` は $0$ になっていないか（既定は $1$）
3. テクスチャに \`colorSpace\` を**指定していないか**（AO はデータ。指定してはいけない）`,
      answerCode: `// uv をそのまま uv1 として使う（繰り返していない場合のみ有効）
geometry.setAttribute('uv1', geometry.attributes.uv);

const material = new THREE.MeshStandardMaterial({
  map: colorMap,          // uv を読む。repeat してもよい
  aoMap: aoTexture,       // uv1 を読む。重なってはいけない
  aoMapIntensity: 1.0,
});

// aoMap は「色」ではなくデータなので colorSpace は指定しない`,
    },
  ],
  quiz: [
    {
      q: '`BoxGeometry` にテクスチャを貼ると、どうなりますか。',
      choices: [
        '6 面それぞれに、画像が丸ごと 1 枚ずつ貼られる',
        '展開図のように 1 枚が 6 面に分かれて貼られる',
        '前面だけに貼られる',
        '面ごとにランダムな部分が貼られる',
      ],
      answer: 0,
      explain:
        '同じ絵が 6 回繰り返されます。展開図のように貼りたければ、UV を自分で書き換えるか、面ごとにマテリアルを分けます（`Mesh` は材質の配列も受け取れます）。',
    },
    {
      q: '球のテクスチャが極でつぶれるのはなぜですか。',
      choices: [
        '極では経度が定まらず、画像の上端 1 行が 1 点に集まるから',
        'three の実装のバグ',
        '分割数が足りないから',
        'テクスチャの解像度が足りないから',
      ],
      answer: 0,
      explain:
        '$u = 0.5 + \\operatorname{atan2}(z,x)/2\\pi$ は、極（$x = z = 0$）では定義できません。球面を歪みなく平らにするのは数学的に不可能で、世界地図が歪むのと同じ理由です。',
    },
    {
      q: '円柱の継ぎ目に、画像が圧縮された帯が出ます。原因はどれですか。',
      choices: [
        '継ぎ目の頂点を共有していて、$u$ が $0.97 \\to 0$ に補間されるから',
        '分割数が奇数だから',
        'wrap の設定が違うから',
        'テクスチャが正方形でないから',
      ],
      answer: 0,
      explain:
        '三角形の内側は補間で埋められるので、$0.97 \\to 0$ は画像を逆向きに丸ごと横断します。継ぎ目には位置が同じで UV の違う頂点を 2 つ置き、$0.97 \\to 1.0$ になるようにします。',
    },
  ],
};
