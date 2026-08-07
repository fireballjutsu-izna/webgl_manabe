import type { Chapter } from '../types.ts';

export const chapterW08: Chapter = {
  slug: 'w08-attributes',
  part: 'threejs',
  number: 8,
  title: '頂点が持てるもの ― 属性',
  goal: '位置以外の情報を頂点に持たせられるようになり、頂点カラーで素材なしのグラデーションが作れるようになります。',
  requires: ['w07-index', 'b34-inverse-lerp'],
  threeApis: [
    'BufferAttribute',
    'BufferAttribute.itemSize',
    'BufferAttribute.count',
    'Material.vertexColors',
    'Color.setHSL',
    'BufferGeometry.attributes',
  ],
  mathRecall: [
    { slug: 'b34-inverse-lerp', note: '高さを 0〜1 の割合に直してから色に使う' },
    { slug: '08-interp', note: '三角形の内側は、頂点の値の補間で埋まる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 位置は、持てるもののひとつでしかない

ここまで頂点に持たせてきたのは位置（\`position\`）だけでした。
けれど頂点は、**好きな情報をいくつでも持てます。**

three が名前を決めて使っているものが 4 つあります。

| 名前 | 1 頂点あたり | 何に使うか |
|---|---|---|
| \`position\` | 3 | どこにあるか。**必須** |
| \`normal\` | 3 | どちらを向いているか。明るさの計算に使う |
| \`uv\` | 2 | テクスチャのどこを貼るか |
| \`color\` | 3 | 頂点ごとの色 |

そして**自分で名前を決めた属性**も追加できます。
それを読むのはシェーダの仕事なので、[](#/ch/t12-shader-intro)で扱います。

いずれにせよ、持たせ方はすべて同じです。
**「1 頂点あたりいくつか」を添えて、平らな配列を渡す。** それだけです。
`,
    },
    {
      kind: 'md',
      text: `
## itemSize ― 「いくつずつで 1 組か」

\`new THREE.BufferAttribute(array, N)\` の $N$ を **itemSize** と呼びます。

前の章では位置なので 3 でした。UV なら 2、色なら 3、
「頂点ごとのサイズ」のような 1 つの数なら 1 です。

**配列の長さ ÷ itemSize が、頂点の数**になります。
そして**すべての属性で、この頂点数が一致していなければなりません。**

一致していないと、three は少ないほうに合わせて残りを無視します。
やはりエラーは出ません。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{count} \\;=\\; \\frac{\\text{array.length}}{\\text{itemSize}}',
      readAloud:
        '属性が何頂点ぶんあるかは、配列の長さを 1 頂点あたりの数で割ったものです。すべての属性でこの数が揃っていなければなりません。',
      worked: {
        given:
          '$1000$ 頂点のジオメトリに position・normal・uv・color を持たせます。**それぞれの配列の長さと、合計のバイト数**を出します。',
        steps: [
          { calc: 'position : 1000 x 3 = 3000 個' },
          { calc: 'normal   : 1000 x 3 = 3000 個' },
          { calc: 'uv       : 1000 x 2 = 2000 個' },
          { calc: 'color    : 1000 x 3 = 3000 個' },
          { calc: '合計 11,000 個の float' },
          { calc: '11,000 x 4 バイト = 44,000 バイト', note: 'float32 は 1 個 4 バイト' },
          { calc: '44,000 / 1000 = 44 バイト / 頂点' },
        ],
        result:
          '**1 頂点あたり 44 バイト**、全体で **44 KB** です。ここで効いてくるのが、**uv は 2 つ**だという点。$1000$ 頂点でも 4000 バイトの差になります。**使わない属性は持たせない**のが基本で、たとえばテクスチャを貼らないなら uv は要りません。読み込んだモデルが妙に重いときは、`geometry.attributes` を出して**何を持っているか**を確かめてください。',
      },
    },
    {
      kind: 'md',
      text: `
## 頂点カラー ― 素材なしで、色を塗り分ける

\`color\` 属性は、**画像を 1 枚も使わずに色の変化を作れる**手段です。

高さで色を変える地形、根元から先へ色が変わる葉、
中心が明るい粒子 ― どれも頂点カラーで作れます。

使うには 2 つ必要です。

- ジオメトリに \`color\` 属性を持たせる
- マテリアルに \`vertexColors: true\` を書く

**片方だけだと効きません。** \`vertexColors\` を書き忘れると、属性は無視されます。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '三角形の内側は、自動で混ざります',
      text: `
頂点にしか色を置いていないのに、面全体に色が付くのはなぜか。

GPU が、三角形の内側の各画素について、3 頂点の値を距離の比で混ぜているからです。
[](#/ch/08-interp) の補間が、3 点に拡張された形で毎画素おこなわれています。

だから頂点が 3 つしかなくても、なめらかなグラデーションになります。
逆に、くっきり分けたいときは頂点を共有しないようにします。
`,
    },
    {
      kind: 'sandbox',
      title: '高さで色が変わる地形',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5.5, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(3, 6, 4);
scene.add(key, new THREE.HemisphereLight(0x8899ff, 0x101020, 0.8));

const N = 40;
const SIZE = 8;
const HEIGHT = 1.6;

const positions = [];
const colors = [];

// 色を作るための入れ物。使い回す（毎回 new すると重い）
const color = new THREE.Color();

for (let iz = 0; iz <= N; iz++) {
  for (let ix = 0; ix <= N; ix++) {
    const x = (ix / N - 0.5) * SIZE;
    const z = (iz / N - 0.5) * SIZE;
    const y = (Math.sin(x * 0.9) * Math.cos(z * 1.1) + Math.sin(x * 2.3 + z) * 0.35) * HEIGHT;

    positions.push(x, y, z);

    // 高さを 0〜1 の割合に直す（逆補間）。実際に出る高さの幅に合わせてある
    const t = THREE.MathUtils.clamp((y + HEIGHT * 1.125) / (HEIGHT * 2.25), 0, 1);

    // 低いところは青、高いところは黄色。色相を 0.62 → 0.12 へ動かす
    color.setHSL(0.62 - t * 0.5, 0.65, 0.25 + t * 0.4);
    colors.push(color.r, color.g, color.b);
  }
}

const indices = [];
for (let iz = 0; iz < N; iz++) {
  for (let ix = 0; ix < N; ix++) {
    const a = iz * (N + 1) + ix;
    indices.push(a, a + N + 1, a + 1);
    indices.push(a + 1, a + N + 1, a + N + 2);
  }
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));   // 1
geometry.setIndex(indices);
geometry.computeVertexNormals();

scene.add(new THREE.Mesh(
  geometry,
  new THREE.MeshStandardMaterial({
    vertexColors: true,      // 2 ← これが無いと color 属性は無視される
    roughness: 0.75,
  }),
));

// 属性の中身を確かめる
for (const [name, attr] of Object.entries(geometry.attributes)) {
  console.log(name, 'itemSize', attr.itemSize, 'count', attr.count);
}

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
        '**画像を 1 枚も使っていません。** `vertexColors: true` を消すと、色が全部消えて白い地形になります（属性は残っているのに無視されます）。`color.setHSL` の数字をいじると配色が変わります ― `0.62 - t * 0.5` の 0.62 が低いところの色相、0.5 が動く幅です。',
    },
    {
      kind: 'md',
      text: `
## 色の値は 0〜1、そして色空間に注意

\`color\` 属性に入れる値は **0 から 1** です。0〜255 ではありません。

そして、three は頂点カラーを**リニア色空間の値として扱います。**
\`Color\` オブジェクトから \`r\`/\`g\`/\`b\` を取り出せば正しく入りますが、
16 進数を手で分解して $255$ で割ると、**思ったより明るい色**になります。

色の通り道の話は第5部でまとめて扱うので、ここでは
**「\`Color\` を経由して値を作る」**とだけ覚えてください。
`,
    },
    {
      kind: 'code',
      title: '色の値の作り方',
      code: `const color = new THREE.Color();

// 良い : Color に解釈させる（色空間の変換が入る）
color.set(0xff8800);
colors.push(color.r, color.g, color.b);

// 良い : HSL で作る。グラデーションはこちらが楽
color.setHSL(0.6, 0.7, 0.5);
colors.push(color.r, color.g, color.b);

// 悪い : 手で割る（色空間の変換が入らないので明るくなる）
colors.push(0xff / 255, 0x88 / 255, 0x00 / 255);

// Color の入れ物は使い回す。ループの中で new すると、その数だけゴミが出る`,
    },
    {
      kind: 'md',
      text: `
## 属性を、あとから覗く

読み込んだモデルや組み込みジオメトリが**何を持っているか**は、
\`geometry.attributes\` を見れば分かります。

デバッグでは、これがいちばん手早い確認方法です。
`,
    },
    {
      kind: 'code',
      title: '中身を確かめる',
      code: `const g = new THREE.SphereGeometry(1, 12, 8);

console.log(Object.keys(g.attributes));   // ['position', 'normal', 'uv']
console.log(g.attributes.position.count); // 頂点数
console.log(g.attributes.uv.itemSize);    // 2
console.log(g.getIndex()?.count);         // インデックスの個数（無ければ null）

// 特定の頂点の値を取り出す
const v = new THREE.Vector3().fromBufferAttribute(g.attributes.position, 0);
console.log('0 番目の頂点', v);

// 使わない属性は捨てられる（読み込んだモデルが重いとき）
g.deleteAttribute('uv');`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'uv が無いのにテクスチャを貼ると、真っ黒か単色になります',
      text: `
自分で組んだジオメトリには uv がありません。

その状態でテクスチャ付きのマテリアルを使うと、
全部の画素が画像の同じ 1 点を読むので、単色に塗りつぶされます。

エラーは出ません。「テクスチャが貼れない」と思ったら、
まず geometry.attributes に uv があるかを確かめてください。
UV の作り方は [](#/ch/t04-texture) からの章で扱います。
`,
    },
  ],
  exercises: [
    {
      prompt: `$2500$ 頂点のジオメトリに position・normal・uv を持たせています。
ここに color を足すと、**メモリは何%増えますか。** 手で計算してください。`,
      hint: '1 頂点あたりの float の個数で比べれば、頂点数は消えます。',
      answer: `**37.5% 増えます。**

**1 頂点あたりの float の個数**

- 追加前 … position 3 + normal 3 + uv 2 = **8 個**
- 追加後 … 8 + color 3 = **11 個**

増える割合 … $11 / 8 = 1.375$、つまり **37.5% 増**

**バイト数で確かめる**

- 追加前 … $2500 \\times 8 \\times 4 = 80{,}000$ バイト
- 追加後 … $2500 \\times 11 \\times 4 = 110{,}000$ バイト
- 差 … $30{,}000$ バイト（$30$ KB）

**頂点数は割り算で消えます。** だから「頂点カラーを足すとメモリが 37.5% 増える」は、
$2500$ 頂点でも $250{,}000$ 頂点でも同じ割合です。

**それでも、たいてい割に合います。**
同じ見た目をテクスチャで作ろうとすれば、$512 \\times 512$ の画像 1 枚で
$512 \\times 512 \\times 4 = 1{,}048{,}576$ バイト ― **1MB** です。
$30$KB のほうが 35 倍軽い。

**逆に効かない場面** … 細かい模様を出したいとき。
頂点カラーの解像度は頂点の密度そのものなので、
$2500$ 頂点なら $50 \\times 50$ の画像と同じ細かさしか出せません。`,
    },
    {
      prompt: `頂点カラーを設定したのに、色がまったく反映されません。
\`geometry.attributes.color\` はちゃんと存在しています。何が足りませんか。`,
      hint: 'ジオメトリ側とマテリアル側、両方に用意が要ります。',
      answer: `**マテリアルの \`vertexColors: true\`** です。

three は既定で頂点カラーを見ません。
属性が存在していても、マテリアルが「読む」と言わなければ無視されます。

**なぜ既定が false なのか** … 頂点カラーを読むかどうかで、
GPU 上のプログラム（シェーダ）自体が変わるからです。
使わないのに読む形で組むと、そのぶん無駄になります。

だから three は「使うと言われたときだけ」その形で組みます。

**あとから変えるときは \`needsUpdate\` が要る**のが、もう1 つの落とし穴です。
\`material.vertexColors = true\` と書いただけでは効きません。
続けて \`material.needsUpdate = true\` も必要です。
シェーダを組み直す必要があるので、three にそれを伝えないといけません。

**似た形の落とし穴** … \`flatShading\`、\`transparent\`、\`side\` も同じで、
あとから変えたら \`needsUpdate = true\` が要ります。`,
      answerCode: `const material = new THREE.MeshStandardMaterial({
  vertexColors: true,       // 最初から書くのがいちばん安全
  roughness: 0.75,
});

// あとから切り替える場合
material.vertexColors = false;
material.needsUpdate = true;    // シェーダを組み直させる`,
    },
    {
      prompt: `地形の高さ $y$ が $-2$ から $+3$ の範囲にあります。
これを **0〜1 の割合 $t$** に直す式を書いてください。
そして $y = 0$ のとき $t$ はいくつですか。`,
      hint: '[](#/ch/b34-inverse-lerp) の逆補間です。',
      answer: `**$t = \\dfrac{y - (-2)}{3 - (-2)} = \\dfrac{y + 2}{5}$**、$y = 0$ のとき **$t = 0.4$** です。

逆補間の式は $t = \\dfrac{\\text{値} - \\min}{\\max - \\min}$ でした。

分母 … $3 - (-2) = 5$（範囲の幅）
分子 … $y - (-2) = y + 2$（下端からの距離）

**$y = 0$ のとき** … $t = (0 + 2) / 5 = 0.4$

$0.5$ ではありません。**範囲の中心は $y = 0.5$** だからです
（$(-2 + 3)/2 = 0.5$）。地面の高さ 0 は、この地形では真ん中より少し下です。

**実務では clamp を忘れないこと。**
ノイズで作った地形は、想定した範囲をはみ出すことがあります。
$t$ が $1.2$ になると色相が一周して**まったく違う色**になり、
「なぜか一部だけ赤い」という見た目になります。

\`THREE.MathUtils.clamp(t, 0, 1)\` を挟んでください。
[](#/ch/b34-inverse-lerp) にあった \`inverseLerp\` は clamp しません。`,
      answerCode: `const MIN_Y = -2, MAX_Y = 3;

const t = THREE.MathUtils.clamp(
  THREE.MathUtils.inverseLerp(MIN_Y, MAX_Y, y),
  0, 1,
);

color.setHSL(0.62 - t * 0.5, 0.65, 0.25 + t * 0.4);`,
    },
  ],
  quiz: [
    {
      q: '`uv` 属性の itemSize はいくつですか。',
      choices: ['2', '3', '1', '4'],
      answer: 0,
      explain:
        'UV は画像の上の位置なので、横と縦の 2 つで足ります。position と normal は空間の向きなので 3 です。「いくつずつで 1 組か」を間違えると、頂点数の数え方がずれて形が壊れます。',
    },
    {
      q: '`color` 属性を設定したのに色が出ません。何が足りませんか。',
      choices: [
        'マテリアルの `vertexColors: true`',
        '`computeVertexNormals()`',
        'インデックス',
        'ライト',
      ],
      answer: 0,
      explain:
        '頂点カラーを読むかどうかでシェーダの組み方自体が変わるため、three は既定で読みません。あとから切り替えるときは `material.needsUpdate = true` も必要です。',
    },
    {
      q: '3 頂点に別々の色を置いた三角形の、内側はどう塗られますか。',
      choices: [
        '3 頂点の色が距離の比で混ざる（画素ごとに補間される）',
        '最初の頂点の色で塗りつぶされる',
        '3 色の平均で塗りつぶされる',
        '塗られない',
      ],
      answer: 0,
      explain:
        'GPU が画素ごとに 3 頂点の値を混ぜます。だから頂点が 3 つしかなくても、なめらかなグラデーションになります。この補間は color だけでなく normal や uv にも同じように効いています。',
    },
  ],
};
