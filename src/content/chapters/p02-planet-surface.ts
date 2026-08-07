import type { Chapter } from '../types.ts';

export const chapterP02: Chapter = {
  slug: 'p02-planet-surface',
  part: 'project',
  number: 5,
  title: '地表を描く ― 3 枚の絵を、1 つの高さから',
  goal: '惑星の地表に何が要るかを自分で決められるようになり、色・凹凸・粗さを別々に作らず 1 つの高さから導く組み立て方が身につきます。',
  requires: ['x04-star-look', 't04-texture', 'w18-normal-map'],
  threeApis: [
    'CanvasTexture',
    'MeshStandardMaterial.map',
    'MeshStandardMaterial.bumpMap',
    'MeshStandardMaterial.bumpScale',
    'MeshStandardMaterial.roughnessMap',
    'MeshStandardMaterial.displacementMap',
    'SphereGeometry',
  ],
  mathRecall: [
    { slug: 't04-texture', note: 'CanvasTexture で絵をコードから作る' },
    { slug: 'w18-normal-map', note: '面の凹凸は、法線を傾けて出す' },
    { slug: 't03-material', note: '粗さと金属度が質感を決める' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 灰色の球が、まだ灰色のまま

[](#/ch/x04-star-look)で星空ができました。骨組みも、奥行きの設定も、点の見せ方も済んでいます。

**残っているのは真ん中の球です。** いまはただの灰色の玉で、惑星には見えません。

ここから $4$ 章かけて、この球に地表を描きます。**画像は $1$ 枚も使いません。**
この章はその $4$ 章ぶんの**設計**です ― 何が要るのかを先に決めてから、作りに入ります。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '設計だけの章を、なぜ挟むのか',
      text: `
「とりあえずノイズで色を作ってみる」から始めると、たいてい途中で作り直しになります。

色を作ってから凹凸を足すと、**色と凹凸がずれます。**
陸の色を塗った場所と、山を立てた場所が別々に決まるからです。

先に「何を情報源にするか」を決めておけば、この作り直しは起きません。
30 分の設計が、3 時間の手戻りを消します。
`,
    },
    {
      kind: 'md',
      text: `
## 色だけ貼っても、惑星にならない

まず結論から言うと、**必要な{{テクスチャ}}は $3$ 枚**です。$1$ 枚ではありません。

| 枚 | 渡す先 | 変わるもの |
|---|---|---|
| **色** | \`map\` | 海の青、陸の緑と茶、極の白 |
| **凹凸** | \`bumpMap\` | 山脈の陰影。形は変えず、光の当たり方だけ変える |
| **粗さ** | \`roughnessMap\` | **海だけつるつるにする** |

$1$ 枚目だけだと、どれだけ色を作り込んでも「**絵を貼った球**」に見えます。
陰影が球そのものの丸みだけで決まっていて、地形が光に反応しないからです。

$2$ 枚目を足すと山脈に影がつきます。ここで「地面」らしくなります。

そして**いちばん効くのは $3$ 枚目**です。
海と陸が同じ粗さだと、太陽の照り返しがどこにも出ません。
海にだけ照り返しが乗った瞬間に、それが**水**になります。
`,
    },
    {
      kind: 'md',
      text: `
## 3 段階を並べて見る

言葉より見たほうが早いので、**同じ球に $1$ 枚ずつ足していったもの**を $3$ つ並べます。

高さの作り方はまだやっていないので、ここでは
$\\sin$ と $\\cos$ を数本混ぜた**仮の地形**を使います
（本物のノイズは[](#/ch/x06-value-noise)から $3$ 章かけて作ります）。

**見るべきは地形の出来ではなく、$1$ 枚足すたびに何が変わるか**です。
（$\\sin$ と $\\cos$ の重ね合わせなので、海に薄い格子模様が残ります。
**規則が目に見えてしまう** ― これがノイズを使う理由でもあります）
`,
    },
    {
      kind: 'sandbox',
      title: '色 → 凹凸 → 粗さ、と 1 枚ずつ足す',
      guide: { focus: ['仮の高さ', '高さから3枚を導く'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TEX_W = 512;
const TEX_H = 256;
const SEA = 0.5;

/* ---- 仮の高さ ---- */
// 本物のノイズはまだ作っていないので、sin と cos を数本混ぜて代用する。
// この章で見たいのは地形の出来ではなく「1枚足すと何が変わるか」なので、これで足りる
function height(lat, lon) {
  return 0.5
    + 0.28 * Math.sin(lon * 3) * Math.cos(lat * 2)        // 大陸のかたまり
    + 0.13 * Math.sin(lon * 5 + 1.3) * Math.cos(lat * 3 + 0.7)
    + 0.10 * Math.sin(lon * 11 + 2.1) * Math.cos(lat * 7 + 1.1)
    + 0.06 * Math.sin(lon * 23) * Math.cos(lat * 17)      // ここから下が山肌。
    + 0.03 * Math.sin(lon * 41 + 0.6) * Math.cos(lat * 31); // 細かい起伏が無いと、凹凸は見えない
}

/* ---- 高さから3枚を導く ---- */
// 3枚を別々に設計しない。高さを1つ決めて、そこから3枚ぶんの値を出す。
// こうしておくと「陸を塗った場所」と「山を立てた場所」が食い違いようがない

function surfaceAt(h, absLat) {
  if (h < SEA) {
    const depth = Math.min(1, (SEA - h) / SEA);
    return {
      r: 14 + (1 - depth) * 40,
      g: 48 + (1 - depth) * 78,
      b: 92 + (1 - depth) * 74,
      bump: 96,      // 海面は平ら
      rough: 46,     // つるつる。ここに照り返しが出る
    };
  }
  const above = (h - SEA) / (1 - SEA);
  const snowLine = 0.62 - absLat * 0.62;
  let r, g, b;
  if (above > snowLine) { r = 232; g = 238; b = 246; }        // 雪
  else if (above < 0.06) { r = 196; g = 182; b = 136; }       // 波打ち際の砂
  else {
    const rock = Math.min(1, above / Math.max(0.001, snowLine));
    r = 62 + rock * 92; g = 96 + rock * 66; b = 58 + rock * 60;
  }
  return { r: r, g: g, b: b, bump: 96 + above * 159, rough: 216 };
}

/* ---- 3枚を焼く ---- */

function bake() {
  const make = () => {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    const ctx = canvas.getContext('2d');
    return { canvas: canvas, ctx: ctx, image: ctx.createImageData(TEX_W, TEX_H) };
  };
  const color = make(), bump = make(), rough = make();

  for (let row = 0; row < TEX_H; row++) {
    const lat = (0.5 - row / (TEX_H - 1)) * Math.PI;
    const absLat = Math.min(1, Math.abs(lat) / (Math.PI / 2));
    for (let col = 0; col < TEX_W; col++) {
      const lon = (col / TEX_W - 0.5) * Math.PI * 2;
      const s = surfaceAt(height(lat, lon), absLat);

      const at = (row * TEX_W + col) * 4;
      color.image.data[at] = s.r;
      color.image.data[at + 1] = s.g;
      color.image.data[at + 2] = s.b;
      color.image.data[at + 3] = 255;
      bump.image.data[at] = bump.image.data[at + 1] = bump.image.data[at + 2] = s.bump;
      bump.image.data[at + 3] = 255;
      rough.image.data[at] = rough.image.data[at + 1] = rough.image.data[at + 2] = s.rough;
      rough.image.data[at + 3] = 255;
    }
  }

  color.ctx.putImageData(color.image, 0, 0);
  bump.ctx.putImageData(bump.image, 0, 0);
  rough.ctx.putImageData(rough.image, 0, 0);

  const colorMap = new THREE.CanvasTexture(color.canvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;   // 色なので指定する
  // 凹凸と粗さは色ではなく数値。colorSpace は指定しない
  return {
    colorMap: colorMap,
    bumpMap: new THREE.CanvasTexture(bump.canvas),
    roughnessMap: new THREE.CanvasTexture(rough.canvas),
  };
}

/* ---- シーン ---- */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 0.9, 8.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const maps = bake();

// 左：色だけ／中央：色＋凹凸／右：色＋凹凸＋粗さ
const recipes = [
  { x: -2.9, label: '色だけ', options: { map: maps.colorMap, roughness: 0.9 } },
  { x: 0, label: '＋凹凸', options: { map: maps.colorMap, bumpMap: maps.bumpMap, bumpScale: 1.6, roughness: 0.9 } },
  { x: 2.9, label: '＋粗さ', options: { map: maps.colorMap, bumpMap: maps.bumpMap, bumpScale: 1.6, roughnessMap: maps.roughnessMap } },
];

const planets = recipes.map((recipe) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 96, 64),
    new THREE.MeshStandardMaterial(Object.assign({ metalness: 0 }, recipe.options)),
  );
  mesh.position.x = recipe.x;
  scene.add(mesh);
  return mesh;
});

// 海の照り返しは「光が真横から当たっているとき」にいちばん出る
const sun = new THREE.DirectionalLight(0xfff2e0, 3.6);
sun.position.set(6, 2.2, 4);
scene.add(sun, new THREE.AmbientLight(0x3a4a6a, 0.3));

recipes.forEach((recipe, index) => {
  const div = document.createElement('div');
  div.textContent = recipe.label;
  div.style.cssText =
    'position:absolute; bottom:22px; transform:translateX(-50%);' +
    'color:#e8e8f2; font:12px sans-serif; pointer-events:none; white-space:nowrap;';
  div.style.left = (18 + index * 32) + '%';
  document.body.appendChild(div);
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  planets.forEach((p) => { p.rotation.y += dt * 0.12; });
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '左は陰影が球の丸みだけで決まっていて、地形が光に反応しません。中央で山肌に影がつきます。右で海が暗く沈み、太陽の照り返しだけが細く残ります ― **この 1 つで「塗った球」から「水のある星」に変わります。** 右の `roughnessMap` を消して `roughness: 0.9` に戻すと、その照り返しが消えます。`bumpScale` を 0 にすると中央が左と同じになります。 **ところで、海に薄い格子模様が見えているはずです。** $\\sin$ と $\\cos$ を重ねただけなので、**規則が目に見えてしまう**のです ― 次の章からノイズを作るのは、これを消すためでもあります。',
    },
    {
      kind: 'md',
      text: `
## 3 枚を、別々に作らない

さて、$3$ 枚要ることは分かりました。**問題はここからです。**

素直にやると、$3$ 枚を別々に作りたくなります。色は色で塗り、山は山で立て、
海の粗さは海の形をもう一度求めて… という具合に。

**これは必ず破綻します。**

- 色の「海」と、粗さの「海」が、$1$ 画素ずれる
- 色を調整して大陸を広げたら、山だけ前の位置に残る
- 山を高くしたら、雪が降っていない山頂ができる

$3$ つの絵が**別々の情報源**を持っているからです。
情報源が $3$ つあれば、$3$ つは必ず食い違います。

**解決は、上のサンドボックスで先に書いてあります。**
$3$ 枚を作るのではなく、**「その地点の高さ」を $1$ つ決めて、そこから $3$ 枚ぶんの値を導きます。**
`,
    },
    {
      kind: 'code',
      title: '情報源は 1 つ、出口が 3 つ',
      code: `// 高さ h（0〜1）と、赤道からの離れ具合 absLat（0〜1）だけを入力にする
function surfaceAt(h, absLat) {
  if (h < SEA) {
    // 海：深いほど暗く濃い青、平ら、つるつる
    return { r: ..., g: ..., b: ..., bump: 96, rough: 46 };
  }
  // 陸：高さで緑→茶→白、高いほど盛り上がり、ざらざら
  return { r: ..., g: ..., b: ..., bump: 96 + above * 159, rough: 216 };
}`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'この形は、このあと何度も出ます',
      text: `
「持つ値は 1 つ。見た目はそこから全部導く」は、実践編で繰り返し使う型です。

- **この惑星** … 高さ 1 つから、色・凹凸・粗さ
- **街の時刻**（[](#/ch/p07-city-light)） … 時刻 1 つから、光の色・強さ・空・影・窓の明かり

どちらも、値を別々に持った瞬間に「朝焼けなのに窓が消えている」
「海なのにざらざら」といった食い違いが入り込みます。

**食い違いを直すのではなく、食い違いようがない形にしておく。** これが安く済みます。
`,
    },
    {
      kind: 'md',
      text: `
## なぜ bumpMap を選ぶのか

凹凸を出す道具は $3$ つあります。ここで選んでおきます。

| 道具 | 何をするか | 費用 |
|---|---|---|
| \`displacementMap\` | **頂点を実際に動かす**。輪郭が凸凹になる | 頂点が要る。球を細かく割らないと効かない |
| \`normalMap\` | 法線を、画像に書いた向きに置き換える | 画像が $3$ チャンネル要る。作るのがやや面倒 |
| \`bumpMap\` | **白黒の高さから法線の傾きを計算**して使う | 画像は $1$ チャンネル。いちばん安い |

惑星は**遠くから丸ごと眺めるもの**なので、輪郭のギザギザは見えません。
見えるのは**面の中の陰影**だけです。だから \`bumpMap\` で足ります。

[](#/ch/w18-normal-map)でやったとおり、$3$ つとも
「面の向き（法線）を変えて、光の当たり方を変える」ことが目的です。
違うのは、その向きをどうやって手に入れるかだけ。

**近づいて輪郭を見せる作品なら \`displacementMap\` が要ります。**
そのときは球の分割数も上げることになり、費用が跳ね上がります ―
だから**先に「どれくらい寄るのか」を決めておく**必要がありました。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'bumpMap は輪郭を変えません',
      text: `
真横から見ると、山脈は**まったく出っ張っていません。**
シルエットは完全な円のままです。

これはバグではなく、\`bumpMap\` の仕様です。
変えているのは法線だけで、頂点は 1 つも動いていません。

見る距離を決めずに「なんか平べったい」と悩むと、ここで時間を溶かします。
**遠景なら気づかれない。寄るなら別の道具が要る。** 先に決めてください。
`,
    },
    {
      kind: 'md',
      text: `
## ここから 4 章の段取り

高さを $1$ つ決めれば $3$ 枚とも決まる ― 設計はこれで済みました。
残るのは「**その高さをどうやって作るか**」です。

- **[](#/ch/x06-value-noise)** … 格子に乱数を置いて、あいだを埋める。ノイズの中身を書く
- **[](#/ch/x07-fbm-terrain)** … 重ねて地形にする。段数はどこまで増やす意味があるか
- **[](#/ch/x08-sphere-seam)** … 球に貼る。継ぎ目と極の歪みを原理的に消す
- **[](#/ch/x09-surface-bake)** … $3$ 枚を $1$ 回のループで焼く。色の作り方と、生成の費用

[](#/ch/p01-planet-setup)で決めた「$1$ つ足すたびに動かす」をここでも守ります。
$4$ 章のどこで止めても、画面には何かが映っています。
`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスの右の球（$3$ 枚とも使っているもの）で、\`roughnessMap\` の行を消して
\`roughness: 0.9\` に差し替えてください。

何が消えますか。そしてなぜ、それが「水に見えなくなる」ことになるのでしょう。`,
      hint: '海と陸の粗さが同じになると、光の返り方はどう変わりますか。',
      answer: `**海の上を流れていた細長い光（照り返し）が消えます。**

**何が起きているか**

粗さは「面がどれだけ光を散らすか」です。

- 粗さが低い（つるつる） … 光は**そろった向き**に返る。太陽の像がそのまま映る
- 粗さが高い（ざらざら） … 光は**あらゆる向き**に散る。どこから見ても同じ明るさ

海だけ \`rough = 46\`（$0.18$ 相当）にしてあるので、海面が鏡に近くなり、
太陽の像が細長く引き伸ばされて映ります。これが照り返しです。

陸は \`rough = 216\`（$0.85$ 相当）なので、散らします。だから土に見えます。

**なぜ「水」になるのか**

人が水を水と見分けているのは、色ではなく**光の返し方**です。

濁った川も澄んだ海も色はまるで違うのに、どちらも水に見えます。
共通しているのは「まわりを映す」ことだけ。

だから、青く塗っても水にはならず、**つるつるにすると水になります。**

**これが 3 枚目がいちばん効く理由です。** 色は $1$ 枚目でいくらでも作り込めますが、
質感は色では作れません。`,
      answerCode: `// 変える前
{ map: maps.colorMap, bumpMap: maps.bumpMap, bumpScale: 1.6, roughnessMap: maps.roughnessMap }

// 変えたあと（照り返しが消える）
{ map: maps.colorMap, bumpMap: maps.bumpMap, bumpScale: 1.6, roughness: 0.9 }`,
    },
    {
      prompt: `\`surfaceAt\` を書き換えて、**海の色だけ**を紫にしてみてください。

そのとき、粗さと凹凸のコードは $1$ 行も触らずに済むはずです。**なぜでしょう。**`,
      hint: '海かどうかを判定しているのは、何か所ですか。',
      answer: `**海かどうかの判定が $1$ か所（\`h < SEA\`）にしかないからです。**

**変えるのはここだけ**

\`if (h < SEA)\` の中の \`r\`・\`g\`・\`b\` を紫に振るだけで、
\`bump: 96\`（平ら）と \`rough: 46\`（つるつる）はそのまま効きます。

紫の海が、ちゃんと照り返しを持ったままになります。

**もし 3 枚を別々に作っていたら**

色の画像を作るループ、凹凸の画像を作るループ、粗さの画像を作るループの
**$3$ か所に \`h < SEA\` が書かれている**ことになります。

海の形を変えたくなったとき、$3$ か所を同じように直さなければなりません。
$1$ か所直し忘れると「色は海なのに、ざらざらの陸」ができます。

**しかも、その間違いはエラーになりません。** ただ少しおかしく見えるだけです。
気づくのは、ずっとあとになります。

**判定を 1 か所にする、ということ**

これは惑星に限った話ではありません。

「同じ条件で分岐するコードが $2$ か所以上にある」と気づいたら、
**分岐を $1$ か所にまとめて、そこから複数の値を返す**形に直せないか考えてください。

$3$ つの出口が同時に動くようになり、食い違う余地が消えます。`,
      answerCode: `if (h < SEA) {
  const depth = Math.min(1, (SEA - h) / SEA);
  return {
    r: 78 + (1 - depth) * 60,     // 紫に振る
    g: 34 + (1 - depth) * 40,
    b: 116 + (1 - depth) * 70,
    bump: 96,     // ここは触らない
    rough: 46,    // ここも触らない ― 紫の海に照り返しが残る
  };
}`,
    },
    {
      prompt: `惑星に**すごく寄って**、山脈の輪郭がギザギザに見えるようにしたい。

\`bumpScale\` を大きくすれば済みますか。済まないなら、何が要りますか。`,
      hint: 'bumpMap は頂点を動かしていますか。',
      answer: `**済みません。\`bumpScale\` をいくら上げても、輪郭は完全な円のままです。**

**理由**

\`bumpMap\` が変えているのは**法線（面の向き）だけ**です。
頂点は $1$ つも動いていません。

だから面の中の陰影は強くなりますが、**シルエットは球のまま**です。
真横から見れば、山脈は $1$ ミリも出っ張っていません。

\`bumpScale\` を上げすぎると、陰影だけが不自然に濃くなって、
「立体なのに平ら」というちぐはぐな見た目になります。

**要るもの**

\`displacementMap\` に切り替えて、**頂点を実際に動かします。**

ただし条件が $2$ つ付きます。

- **球の分割数を上げる。** \`SphereGeometry(1.6, 96, 64)\` は約 $6000$ 頂点。
  これでは山 $1$ つに数頂点しか割り当たらず、動かしてもカクカクした塊にしかなりません
- **法線を取り直す。** 頂点を動かしたら、その面の向きは変わっています。
  取り直さないと、動かす前の陰影のまま光ります

**費用の話**

分割数を $4$ 倍にすると頂点は $16$ 倍です。
遠景の惑星 $1$ つのためにこれを払うのは割に合いません。

**だから設計の段で「どれくらい寄るのか」を決める必要がありました。**
この作品は「星空の中に惑星が浮かび、マウスで眺める」ものなので、
輪郭が見えるほどは寄りません ― それが \`bumpMap\` で足りる根拠です。

**中間の手**

寄る作品なら、\`displacementMap\` を**惑星全体ではなく、寄っている面だけ**に効かせる手もあります。
細かい球に差し替える、地形だけ別のメッシュにする、といったやり方で、
これは「必要なところにだけ費用を払う」という[](#/ch/w44-gpu-cost)の考え方そのものです。`,
    },
  ],
  quiz: [
    {
      q: '色・凹凸・粗さの 3 枚のうち、「塗った球」を「水のある星」に変えるのに、いちばん効くのはどれですか。',
      choices: [
        '粗さ（海だけつるつるにして、太陽の照り返しを出す）',
        '色（海を濃い青にする）',
        '凹凸（山脈に陰影をつける）',
        '3 枚とも同じくらい効く',
      ],
      answer: 0,
      explain:
        '人が水を水と見分けているのは色ではなく光の返し方です。濁った川と澄んだ海は色がまるで違うのに、どちらも水に見えます。共通しているのは「まわりを映す」ことだけなので、青く塗っても水にはならず、つるつるにすると水になります。',
    },
    {
      q: '色・凹凸・粗さを、それぞれ別のループで別々に作ると、どんな不具合が起きますか。',
      choices: [
        '色の「海」と粗さの「海」がずれて、色は海なのにざらざら、という場所ができる',
        '生成が遅くなるだけで、見た目は変わらない',
        'colorSpace の指定が効かなくなる',
        'テクスチャの解像度が揃わなくなる',
      ],
      answer: 0,
      explain:
        '情報源が 3 つあれば、3 つは必ず食い違います。しかもエラーは出ず、少しおかしく見えるだけなので、気づくのがずっとあとになります。高さを 1 つ決めて 3 枚ぶんの値を導けば、食い違う余地そのものが無くなります。',
    },
    {
      q: '`bumpScale` を大きくすると、惑星の輪郭（シルエット）はどうなりますか。',
      choices: [
        '変わらない。完全な円のまま',
        '山脈のぶんギザギザになる',
        '球がひとまわり大きくなる',
        '分割数によっては変わる',
      ],
      answer: 0,
      explain:
        'bumpMap が変えているのは法線だけで、頂点は 1 つも動いていません。面の中の陰影は強くなりますが、シルエットは球のままです。輪郭を変えたいなら displacementMap で頂点を実際に動かし、あわせて分割数を上げ、法線を取り直す必要があります。',
    },
  ],
};
