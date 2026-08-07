import type { Chapter } from '../types.ts';

export const chapterX09: Chapter = {
  slug: 'x09-surface-bake',
  part: 'project',
  number: 9,
  title: '3 枚を 1 回のループで焼く ― 色の作り方と、生成の費用',
  goal: '色・凹凸・粗さを 1 回のループでまとめて作れるようになり、「なんとなく安っぽい」を解像度ではなく色の作り方で直せるようになります。',
  requires: ['x08-sphere-seam', 'w13-color-space'],
  threeApis: [
    'CanvasTexture',
    'Texture.colorSpace',
    'MeshStandardMaterial.map',
    'MeshStandardMaterial.bumpMap',
    'MeshStandardMaterial.roughnessMap',
  ],
  mathRecall: [
    { slug: 'w13-color-space', note: '色は sRGB、数値は線形。指定を間違えると値がずれる' },
    { slug: 'b36-smoothstep', note: '境目をぼかす' },
    { slug: 't04-texture', note: 'CanvasTexture と colorSpace' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 部品はそろった。あとは焼くだけ

$3$ 章かけて、高さを返す関数ができました。

- [](#/ch/x06-value-noise) … 格子に乱数を置いて、あいだを埋める
- [](#/ch/x07-fbm-terrain) … 重ねて地形にする
- [](#/ch/x08-sphere-seam) … 方向ベクトルで引いて、継ぎ目と極を避ける

[](#/ch/p02-planet-surface)で決めた設計は「**高さ $1$ つから $3$ 枚を導く**」でした。
この章でそれを実装して、惑星を完成させます。
`,
    },
    {
      kind: 'md',
      text: `
## ループは 1 回で済む

素直に書くと、色のループ・凹凸のループ・粗さのループで $3$ 回まわしたくなります。

**$3$ 倍の時間がかかるだけで、何の得もありません。**

高さを $1$ つ求めれば $3$ 枚ぶん決まるのだから、
**$1$ 回のループの中で $3$ つの \`ImageData\` に書き込めば済みます。**

$50$ 万画素ぶんのノイズを $3$ 回引き直す理由は、どこにもありません。

そして[](#/ch/p02-planet-surface)で見たとおり、
$1$ 回にまとめておけば **$3$ 枚が食い違いようがなくなります。**
速さと正しさが同じ方向を向いている、めずらしい場面です。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'colorSpace は、色にだけ',
      text: `
$3$ 枚のうち \`colorSpace = THREE.SRGBColorSpace\` を指定するのは、**色の $1$ 枚だけ**です。

- **色**（\`map\`）… 人が見る色。**指定する**
- **凹凸**（\`bumpMap\`）… 高さを表す数値。**指定しない**
- **粗さ**（\`roughnessMap\`）… 粗さを表す数値。**指定しない**

sRGB の指定は「これは人が見る色だから、明るさの変換をしてから使ってください」という意味です。

凹凸や粗さは見せる色ではなく**計算に使う数値**なので、変換されると値がずれます。
[](#/ch/w13-color-space)でやったとおり、$0.5$ が $0.21$ になるような差が出ます。

**エラーは出ません。** 山の陰影が思ったより弱い、海の照り返しがぼんやりする ―
その程度の狂い方をするので、原因にたどり着きにくい種類の間違いです。
`,
    },
    {
      kind: 'md',
      text: `
## 「安っぽい」の正体は、色の作り方

ここからが、この章のいちばん実用的なところです。

地形ができて $3$ 枚も貼ったのに、**なんとなく安っぽい**ということが起こります。
そこで解像度を上げたくなるのですが、たいてい原因は別のところにあります。

**色を、しきい値で $2$ 色に塗り分けているから**です。

海と陸の境目に何もないと、絵の具で塗ったように見えます。
自然界に「青の次のドットが緑」という場所はありません。

効くのは、こういう $1$ 行です。

- **海の深さで濃淡をつける** … 浅瀬が明るくなり、大陸棚が見えてくる
- **波打ち際に砂の帯を入れる** … 海面のすぐ上だけを砂色に。**$1$ 行で海岸線ができます**
- **雪線を緯度で動かす** … 赤道の山は高くないと雪が積もらず、極では低い丘でも白い
- **陸の色を高さで緑から茶へ** … 標高で植生が変わる、という当たり前を入れる

**どれもコードは $1$〜$2$ 行**です。それでも、画素を $4$ 倍にするよりずっと効きます。
`,
    },
    {
      kind: 'code',
      title: '色を決める部分だけ取り出す',
      code: `if (height < SEA) {
  // 海：深いほど暗く、濃い青。浅瀬が明るくなって大陸棚が見えてくる
  const depth = Math.min(1, (SEA - height) / SEA);
  r = 14 + (1 - depth) * 40;
  g = 48 + (1 - depth) * 78;
  b = 92 + (1 - depth) * 74;
} else {
  const above = (height - SEA) / (1 - SEA);   // 海面からの高さ 0〜1
  const snowLine = 0.62 - absLat * 0.62;      // 極では低いところでも雪

  if (above > snowLine) {
    r = 232; g = 238; b = 246;                // 雪
  } else if (above < 0.06) {
    r = 196; g = 182; b = 136;                // 波打ち際の砂。この 1 行で海岸線ができる
  } else {
    const rock = Math.min(1, above / snowLine);
    r = 62 + rock * 92;                       // 緑 → 茶
    g = 96 + rock * 66;
    b = 58 + rock * 60;
  }
}`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '雪線を緯度で動かす、ということ',
      text: `
\`snowLine = 0.62 - absLat * 0.62\` は、たった 1 行です。

- 赤道（\`absLat = 0\`） … 海面からの高さが $0.62$ を超えないと雪が積もらない
- 極（\`absLat = 1\`） … $0$ を超えれば雪。**海から出た瞬間に白い**

キリマンジャロは赤道直下ですが、$5895$ m あるので山頂に雪があります。
グリーンランドは低地でも真っ白です。

**この 1 行が入っているかどうかで、「地図らしさ」がまるで変わります。**
入れないと、極が緑のままの、どこか熱帯めいた星になります。

**現実の理屈を 1 つ入れると、見た目の説得力が一段上がる** ―
手続き的生成で効くのは、たいていこういう小さな理屈です。
`,
    },
    {
      kind: 'md',
      text: `
## 完成

$4$ 章ぶんを合わせます。**下ごしらえ（ノイズ）は末尾にまとめてある**ので、
開いた直後に見えるのは、この章の本題である「$3$ 枚を焼くところ」です。
`,
    },
    {
      kind: 'sandbox',
      title: '惑星の地表（完成）',
      guide: { focus: ['3枚のテクスチャを1回のループで作る'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TEX_W = 1024;
const TEX_H = 512;
const SEA = 0.5;          // 海面の高さ。上げると島だらけになる
const FREQ = 2.2;         // 基本の細かさ。上げると大陸が小さく細かくなる
const OCTAVES = 5;        // 重ね合わせの段数。1024 幅なら 6 が上限

/* ---- 3枚のテクスチャを1回のループで作る ---- */
// 高さを1つ求めれば3枚とも決まる。3回まわす理由はどこにもない

function createSurface() {
  const make = () => {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    const ctx = canvas.getContext('2d');
    return { canvas: canvas, ctx: ctx, image: ctx.createImageData(TEX_W, TEX_H) };
  };

  const color = make();
  const bump = make();
  const rough = make();

  for (let row = 0; row < TEX_H; row++) {
    // 画像の一番上の行が北極（テクスチャは上下が反転して貼られる）
    const lat = (0.5 - row / (TEX_H - 1)) * Math.PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const absLat = Math.min(1, Math.abs(lat) / (Math.PI / 2));

    for (let col = 0; col < TEX_W; col++) {
      const lon = (col / TEX_W - 0.5) * Math.PI * 2;

      // その画素が指している「向き」でノイズを引く。これが継ぎ目対策
      const height = fbm(
        cosLat * Math.cos(lon) * FREQ + 8,
        sinLat * FREQ + 8,
        cosLat * Math.sin(lon) * FREQ + 8,
      );

      let r, g, b, bumpValue, roughValue;

      if (height < SEA) {
        // 海。深いほど暗く、濃い青
        const depth = Math.min(1, (SEA - height) / SEA);
        r = 14 + (1 - depth) * 40;
        g = 48 + (1 - depth) * 78;
        b = 92 + (1 - depth) * 74;
        bumpValue = 96;      // 海面は平ら
        roughValue = 46;     // つるつる（照り返しが出る）
      } else {
        const above = (height - SEA) / (1 - SEA);   // 海面からの高さ 0〜1
        const snowLine = 0.62 - absLat * 0.62;      // 極では低いところでも雪

        if (above > snowLine) {
          r = 232; g = 238; b = 246;                // 雪
        } else if (above < 0.06) {
          r = 196; g = 182; b = 136;               // 波打ち際の砂
        } else {
          const rock = Math.min(1, above / snowLine);
          r = 62 + rock * 92;                      // 緑 → 茶
          g = 96 + rock * 66;
          b = 58 + rock * 60;
        }
        bumpValue = 96 + above * 159;               // 高いほど白い＝高い
        roughValue = 216;                           // ざらざら
      }

      const at = (row * TEX_W + col) * 4;
      color.image.data[at] = r;
      color.image.data[at + 1] = g;
      color.image.data[at + 2] = b;
      color.image.data[at + 3] = 255;

      bump.image.data[at] = bumpValue;
      bump.image.data[at + 1] = bumpValue;
      bump.image.data[at + 2] = bumpValue;
      bump.image.data[at + 3] = 255;

      rough.image.data[at] = roughValue;
      rough.image.data[at + 1] = roughValue;
      rough.image.data[at + 2] = roughValue;
      rough.image.data[at + 3] = 255;
    }
  }

  color.ctx.putImageData(color.image, 0, 0);
  bump.ctx.putImageData(bump.image, 0, 0);
  rough.ctx.putImageData(rough.image, 0, 0);

  const colorMap = new THREE.CanvasTexture(color.canvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;   // これは「色」なので指定する

  // 凹凸と粗さは色ではなく数値なので、colorSpace は指定しない
  const bumpMap = new THREE.CanvasTexture(bump.canvas);
  const roughnessMap = new THREE.CanvasTexture(rough.canvas);

  return { colorMap: colorMap, bumpMap: bumpMap, roughnessMap: roughnessMap };
}

/* ---- シーン ---- */

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 3000);
camera.position.set(0, 1.2, 5.4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 2.6;
controls.maxDistance = 30;

const surface = createSurface();

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(1.6, 96, 64),
  new THREE.MeshStandardMaterial({
    map: surface.colorMap,
    bumpMap: surface.bumpMap,
    bumpScale: 0.5,
    roughnessMap: surface.roughnessMap,
    metalness: 0,
  }),
);
scene.add(planet);

const sun = new THREE.DirectionalLight(0xfff2e0, 3.4);
sun.position.set(5, 1.5, 3);
scene.add(sun, new THREE.AmbientLight(0x3a4a6a, 0.35));

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  planet.rotation.y += clock.getDelta() * 0.06;
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- 下ごしらえ：3次元ノイズ（前の3章で作ったもの。読み飛ばして可） ---- */

function hash3(x, y, z, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177);
  h = Math.imul(h + Math.imul(seed, 2246822519), 2654435761);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967295;
}

function fade(t) { return t * t * (3 - 2 * t); }
function mix(a, b, t) { return a + (b - a) * t; }

function noise3(x, y, z, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);

  const x00 = mix(hash3(xi, yi, zi, seed), hash3(xi + 1, yi, zi, seed), u);
  const x10 = mix(hash3(xi, yi + 1, zi, seed), hash3(xi + 1, yi + 1, zi, seed), u);
  const x01 = mix(hash3(xi, yi, zi + 1, seed), hash3(xi + 1, yi, zi + 1, seed), u);
  const x11 = mix(hash3(xi, yi + 1, zi + 1, seed), hash3(xi + 1, yi + 1, zi + 1, seed), u);

  return mix(mix(x00, x10, v), mix(x01, x11, v), w);
}

function fbm(x, y, z) {
  let sum = 0, total = 0, amp = 1, freq = 1;
  for (let i = 0; i < OCTAVES; i++) {
    sum += noise3(x * freq, y * freq, z * freq, 1337 + i * 101) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / total;
}`,
      caption:
        '海の上を光がゆっくり流れていくのが `roughnessMap` の効果です。`roughValue = 216` を海の側にも入れると、その照り返しが消えて一気に「塗った球」に戻ります。`bumpScale` を $0$ にすると山脈の陰影が消えます。`SEA` を $0.62$ にすると島だらけの惑星（陸 $18\\%$）になります。**走り出すまで一瞬待ちます** ― $50$ 万画素ぶんのノイズを引いているので、$200$ ミリ秒ほどかかります。',
    },
    {
      kind: 'md',
      text: `
## その 200 ミリ秒の中身

「一瞬待つ」の中で何回計算しているのか、数えておきます。
**待ち時間を減らそうとする前に、何が重いのかを知っておく**ためです。
`,
    },
    {
      kind: 'formula',
      tex: 'N = W \\times H \\times n \\times 2^{3}',
      readAloud:
        '$N$ はハッシュを呼ぶ回数です。$W$ と $H$ がテクスチャの幅と高さ、$n$ が重ね合わせの段数。最後の $2^3 = 8$ は、3 次元ノイズが 1 回につき使う格子点の数です。',
      worked: {
        given: '$1024 \\times 512$、$5$ 段。惑星のテクスチャの実際の設定です。',
        steps: [
          { calc: '画素数     : 1024 x 512 = 524288' },
          { calc: 'noise3 の回数 : 524288 x 5 = 2621440', note: '1 画素につき 5 段' },
          { calc: 'hash3 の回数  : 2621440 x 8 = 20971520', note: '1 回につき格子点 8 つ' },
        ],
        result:
          '**約 $2100$ 万回**のハッシュ計算です。実測で $209$ ミリ秒 ― **$1$ 回あたり $10$ ナノ秒**。$3$ 枚ぶんの書き込みは $150$ 万画素ぶんですが、こちらは単なる代入なので誤差です。**重いのはノイズで、テクスチャの枚数ではありません** ― だから $3$ 枚を $1$ ループにまとめるのが効きます。',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '待ち時間を減らす手',
      text: `
$200$ ミリ秒は、起動が一瞬固まる程度です。気にならないなら何もしなくてかまいません。

気になるなら、手は 3 つあります。

- **粗く作って、あとから作り直す。** まず $256 \\times 128$（実測で $15$ 分の $1$ の時間）で出して、
  すぐ本番の解像度に差し替える。**待ち時間は同じでも、白い画面を見せずに済みます**
- **\`OffscreenCanvas\` と Web Worker に逃がす。** 生成を別のスレッドでやれば、
  そのあいだも画面が動きます。カメラは回せるので、固まって見えません
- **段数を減らす。** $5$ 段を $3$ 段にすると、赤道 $1$ 周が $55$ マスまでしか刻まれず
  海岸線がなめらかになりますが、**実測で $34\\%$ 速くなります**（$229$ → $151$ ミリ秒）

**どれも「速くする」ではなく「待たせ方を変える」ものです。**
$2100$ 万回の計算そのものは、どうやっても $2100$ 万回です。
`,
    },
    {
      kind: 'md',
      text: `
## 手続き的に作る、ということ

$4$ 章かけてやったのは、**画像を用意する代わりに「画像を作る手続き」を書く**ことでした。
これを{{手続き的生成}}と呼びます。利点と欠点があります。

- **利点** … リポジトリが軽い。数値を変えれば無限に別の惑星が作れる。継ぎ目を原理的に消せる
- **利点** … 「なぜこの見た目なのか」が全部コードに書いてある。あとから直せる
- **欠点** … 生成に時間がかかる。読み込みではなく**計算**で待つ
- **欠点** … 「地球そのもの」のような**特定の**見た目は作れない。それは写真の仕事

$4$ つ目は大事なところです。手続きで作れるのは「$\\textbf{それらしいもの}$」であって、
「**それ**」ではありません。火星の実際の地形が要るなら、探査機のデータを持ってくるしかない。

**その線引きを先に引いておくと、無駄な作り込みをせずに済みます。**
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '解像度を上げる前に、伸ばす場所を確かめる',
      text: `
テクスチャを $2048 \\times 1024$ にすると、生成時間は実測で
$209$ ミリ秒から **$742$ ミリ秒**（約 $3.6$ 倍）になります。

その前に、**いま足りないのは解像度なのか**を確かめてください。

近づいたときにぼやけるなら解像度の問題です。
でも「なんとなく安っぽい」のは、たいてい**色の作り方**の問題です。

砂浜の細い帯を入れる、雪の境界を緯度で動かす、海の深さで濃淡をつける ―
こういう **$1$ 行**のほうが、画素を $4$ 倍にするよりずっと効きます。

**しかも 1 行なら、気に入らなければすぐ戻せます。**
`,
    },
    {
      kind: 'md',
      text: `
## 次は、空気と雲

地表ができました。ここから先は、その上に載せるものです。

[](#/ch/p03-planet-atmosphere)から $5$ 章かけて、大気の縁の光・雲・夜の街明かりを足します。
どれも**内積が主役**で、[](#/ch/03-dot)がそのまま効いてきます。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`bumpMap\` と \`roughnessMap\` にも \`colorSpace = THREE.SRGBColorSpace\` を付けてしまいました。

何が起きますか。エラーは出ますか。`,
      hint: 'sRGB の指定は、値をどう変換しますか。',
      answer: `**エラーは出ません。山の陰影が弱くなり、海の照り返しがぼやけます。**

**何が起きているか**

sRGB の指定は「この値は人が見る色として書かれているので、
計算に使う前に線形に直してください」という意味です。

three は $0$〜$1$ の値を、おおむね $2.2$ 乗して渡します。

- \`bumpValue = 96\` → $96/255 = 0.376$ → $0.376^{2.2} = 0.117$
- \`bumpValue = 255\` → $1.0$ → $1.0$

**低いところほど強く下がります。**

**凹凸への影響**

高さの差が圧縮されるので、**山と平地の差が小さくなります。**

\`bumpScale\` を上げれば取り返せますが、
**取り返した先の形は、もう元の地形ではありません**（低いところだけ潰れている）。

**粗さへの影響**

- 海 \`46\` → $0.18$ が $0.022$ になる ― **鏡に近づきすぎる**
- 陸 \`216\` → $0.847$ が $0.694$ になる ― **少しつやが出る**

海と陸の差は逆に広がりますが、海が鏡に近くなりすぎて、
**照り返しが細く鋭くなり、かえって見えにくくなります。**

**気づきにくい理由**

**どれも「壊れた」には見えません。** 山が少しなだらか、海が少しつるつる ―
その程度なので、「こんなものか」と受け入れてしまいます。

**色の枚数と数値の枚数を、コードの上で並べて見比べる**のが確実です。
$3$ 枚のうち $1$ 枚だけに \`colorSpace\` が付いていれば正しく、
$2$ 枚以上に付いていたら間違いです。`,
      answerCode: `// 正しい
const colorMap = new THREE.CanvasTexture(color.canvas);
colorMap.colorSpace = THREE.SRGBColorSpace;   // 色。指定する

const bumpMap = new THREE.CanvasTexture(bump.canvas);        // 数値。指定しない
const roughnessMap = new THREE.CanvasTexture(rough.canvas);  // 数値。指定しない`,
    },
    {
      prompt: `波打ち際の砂の帯（\`above < 0.06\`）を消してください。

見た目はどう変わりますか。そして、この $1$ 行と「テクスチャを $2048$ にする」では、
どちらが**費用に対して**効きますか。`,
      hint: '海岸線に、何色と何色が隣り合うことになりますか。',
      answer: `**海岸線が、青と緑の直接の境目になります。絵の具で塗ったように見えます。**

**何が変わるか**

砂の帯があるとき ― 青 → 砂色 → 緑。$2$ 段階で移ります。

消したとき ― 青 → 緑。**$1$ 画素で切り替わります。**

自然界に「青の隣のドットが緑」という場所はありません。
浅瀬があり、波打ち際があり、草地が始まる。

$1$ 行消しただけで、惑星が急に**地図の塗り絵**に見えてきます。

**費用の比較**

| | 効果 | 費用 |
|---|---|---|
| 砂の帯 $1$ 行 | 海岸線が「地形」になる | **$0$**（実行時間は変わらない） |
| $2048 \\times 1024$ | 近づいたときのぼやけが減る | 生成 $209$ → $742$ ミリ秒、メモリ $4$ 倍 |

**費用ゼロのほうが、見た目には効きます。**

しかも解像度を上げても、**青と緑が直接隣り合っている構造は変わりません。**
境目がくっきりするだけで、むしろ悪化することさえあります。

**一般則**

**解像度は「細かさ」を増やしますが、「情報」は増やしません。**

塗り分けが $2$ 色なら、$4$ 倍の画素で描いても $2$ 色のままです。

$1$ 段階増やす $1$ 行のほうが、情報そのものを増やしています。

**「安っぽい」と感じたら、まず色の段階を数えてください。**
$2$ 段階しかないなら、それが原因です。`,
      answerCode: `// 消したあと（青と緑が直接隣り合う）
if (above > snowLine) {
  r = 232; g = 238; b = 246;
} else {
  const rock = Math.min(1, above / snowLine);
  r = 62 + rock * 92;
  g = 96 + rock * 66;
  b = 58 + rock * 60;
}

// もう 1 段階足すなら（草地の手前に、湿った土を入れる）
} else if (above < 0.06) {
  r = 196; g = 182; b = 136;    // 砂
} else if (above < 0.12) {
  r = 108; g = 122; b = 84;     // 湿った草地
} else {`,
    },
    {
      prompt: `テクスチャの生成に $209$ ミリ秒かかります。**待ち時間を「体感で」短くしたい。**

解像度も段数も落とさずにできることを $1$ つ挙げ、なぜそれで短く**感じる**のかを説明してください。`,
      hint: '計算の総量は変えられません。変えられるのは、そのあいだ何が見えているかです。',
      answer: `**まず粗い解像度で出して、あとから本番に差し替えます。**

**やり方**

$256 \\times 128$ で焼くと、画素数が $\\frac{1}{16}$ なので実測 **$15$ ミリ秒**。

これをすぐ貼って表示し、そのあと $1024 \\times 512$ を焼いて差し替えます。

\`CanvasTexture\` を作り直して \`material.map\` に入れ直すだけです。

**なぜ短く「感じる」のか**

**待ち時間の合計は、むしろ増えています**（$15 + 209 = 224$ ミリ秒）。

短くなるのは、**何も見えない時間**のほうです。

- 何もしないとき … $209$ ミリ秒、**白い画面**
- 粗く先に出すとき … $13$ ミリ秒で**惑星が出る**。あとは、すでに見えているものが良くなるだけ

人が「遅い」と感じるのは、**待っている時間ではなく、何も起きていない時間**です。

**ほかの手**

- **\`OffscreenCanvas\` と Web Worker。** 生成を別スレッドに逃がせば、
  そのあいだもカメラが回せます。**固まらないので、待っていると感じにくい**
- **星空を先に出す。** 惑星より星空のほうがずっと軽いので、
  先に星空だけ出しておけば、白い画面がそもそも出ません

**共通していること**

**総量は変えられません。変えられるのは、待たせ方だけです。**

これは[](#/ch/w36-loading-ui)で扱った話と同じで、
惑星の生成も「読み込み」と同じ性質の待ちです ―
違うのは、待っている相手がネットワークではなく CPU だということだけ。`,
      answerCode: `// createSurface が幅と高さを受け取れるようにしておく（TEX_W / TEX_H を引数に）
const material = new THREE.MeshStandardMaterial({ metalness: 0, bumpScale: 0.5 });
const planet = new THREE.Mesh(new THREE.SphereGeometry(1.6, 96, 64), material);
scene.add(planet);

function apply(surface) {
  material.map = surface.colorMap;
  material.bumpMap = surface.bumpMap;
  material.roughnessMap = surface.roughnessMap;
  material.needsUpdate = true;
}

apply(createSurface(256, 128));    // 約 15 ミリ秒。ここで惑星が見える

// 次のフレームに回して、画面が出てから本番を焼く
requestAnimationFrame(() => {
  requestAnimationFrame(() => apply(createSurface(1024, 512)));
});`,
    },
  ],
  quiz: [
    {
      q: '`bumpMap` と `roughnessMap` に `colorSpace = THREE.SRGBColorSpace` を指定してはいけないのはなぜですか。',
      choices: [
        '色ではなく数値なので、色として変換されると値がずれるから',
        '容量が増えるから',
        '`bumpMap` は必ず線形でなければ動かないから',
        'CanvasTexture では指定できないから',
      ],
      answer: 0,
      explain:
        'sRGB の指定は「これは人が見る色だから、明るさの変換をしてから使ってください」という意味です。凹凸や粗さは計算に使う数値なので、変換されると意図した強さになりません。bumpValue 96 は 0.376 のはずが 0.117 になり、山の陰影が弱くなります。エラーは出ないので気づきにくい間違いです。',
    },
    {
      q: '地表が「なんとなく安っぽい」とき、いちばん先に疑うべきなのはどれですか。',
      choices: [
        '色の段階が少なすぎること（青の隣がいきなり緑になっている、など）',
        'テクスチャの解像度',
        'ノイズの段数',
        '球の分割数',
      ],
      answer: 0,
      explain:
        '解像度は細かさを増やしますが、情報は増やしません。2 色の塗り分けは、4 倍の画素で描いても 2 色のままです。波打ち際に砂の帯を 1 行入れる、海の深さで濃淡をつける、雪線を緯度で動かす ― どれも費用ゼロで、画素を 4 倍にするよりずっと効きます。',
    },
    {
      q: '`1024 × 512`・5 段のテクスチャ生成で、ハッシュ関数は何回呼ばれますか。',
      choices: [
        '約 2100 万回（画素 × 段数 × 格子点 8 つ）',
        '約 52 万回（画素の数だけ）',
        '約 260 万回（画素 × 段数）',
        '約 1500 万回（画素 × 3 枚 × 段数）',
      ],
      answer: 0,
      explain:
        '524288 画素 × 5 段 = 2621440 回の noise3 で、1 回につき格子点を 8 つ引くので 20971520 回です。実測 209 ミリ秒なので 1 回あたり約 10 ナノ秒。重いのはノイズであってテクスチャの枚数ではないので、3 枚を 1 回のループにまとめるのが効きます。',
    },
  ],
};
