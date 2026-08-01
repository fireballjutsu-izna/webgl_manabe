import type { Chapter } from '../types.ts';

export const chapterW37: Chapter = {
  slug: 'w37-asset-cost',
  part: 'threejs',
  number: 37,
  title: '素材の重さ ― 転送と、GPU の上と',
  goal: 'ファイルの大きさと GPU が使うメモリが別物であることが分かり、どこを削れば待ち時間が縮むのかを数字で判断できるようになります。',
  requires: ['w36-loading-ui', 'w17-filter'],
  mathRecall: [
    { slug: 'b11-distance', note: '見積もりはすべて、掛け算と割り算だけ' },
  ],
  threeApis: [
    'DRACOLoader',
    'KTX2Loader',
    'GLTFLoader',
    'Texture',
    'CompressedTexture',
    'WebGLRenderer.info',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 重さは、2 種類ある

「モデルが重い」と言うとき、**まったく別の $2$ つ**が混ざっています。

- **転送の重さ** … ファイルの大きさ。**最初の待ち時間**に効く
- **GPU の重さ** … 展開されたあとの大きさ。**動き出してからの詰まり**に効く

この $2$ つは**一致しません。** それどころか、$50$ 倍以上ずれることがあります。

JPEG が $400$ KB だからといって、GPU 上でも $400$ KB ではありません。
**JPEG の圧縮は、回線のためのもの**で、GPU はそれを読めないからです。

読み込みが終わった瞬間、GPU 側では**画素がむき出しに展開されます。**
`,
    },
    {
      kind: 'formula',
      tex: 'M \\;=\\; w \\times h \\times 4 \\times \\tfrac{4}{3}',
      readAloud:
        'GPU 上でテクスチャが占める大きさ $M$ は、**横 $\\times$ 縦 $\\times$ 4 バイト**（RGBA が各 $1$ バイト）に、**ミップマップぶんの $\\frac{4}{3}$** を掛けたものです。$\\frac{4}{3}$ は、半分ずつ縮めた段を全部足すと元の $\\frac{1}{3}$ になるからです。',
      worked: {
        given:
          '$2048 \\times 2048$ の JPEG を読み込みました。**ファイルは $400$ KB** です。GPU 上では何 MB になるでしょうか。',
        steps: [
          { calc: '画素数 = 2048 x 2048' },
          { calc: '      = 4,194,304' },
          { calc: 'RGBA は 1 画素 4 バイト' },
          { calc: '4,194,304 x 4 = 16,777,216 B' },
          { calc: '              = 16.8 MB', note: 'ミップマップ抜き' },
          { calc: 'ミップマップ込み x 4/3' },
          { calc: '16.8 x 4 / 3 = 22.4 MB' },
          { calc: '22.4 MB / 0.4 MB = 56 倍' },
        ],
        result:
          '**$22.4$ MB。ファイルの $56$ 倍**です。$400$ KB という数字を見て安心していると、$8$ 枚で $180$ MB になります ― **スマートフォンなら、それだけで落ちます。** ここで効くのは JPEG の画質設定ではありません。**画素数を減らすか、GPU が直接読める圧縮形式（KTX2 / Basis）にするか**の $2$ つだけです。前者は $2048 \\to 1024$ で $\\frac{1}{4}$、後者は形式にもよりますが**$\\frac{1}{4}$〜$\\frac{1}{8}$** になります。',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ミップマップの 4/3 はどこから来るのか',
      text: `
ミップマップは、半分ずつ縮めた段を全部持ちます。

1 段下は面積が 1/4。その下は 1/16。その下は 1/64 …

1/4 + 1/16 + 1/64 + … = 1/3

だから元の 1 に足して 4/3 です。段の数がいくつでも、
足すと必ず 1/3 に近づきます。

「ミップマップは高くつく」と言われますが、増えるのは 33% だけです。
ちらつきが消える効果を思えば、まず外す理由はありません。
`,
    },
    {
      kind: 'md',
      text: `
## 転送の重さ ― 待ち時間は割り算で出る

こちらは単純です。**バイト数を、回線の速さで割る。**

| 回線 | だいたいの速さ | $5$ MB にかかる時間 |
|---|---|---|
| 光・高速 Wi-Fi | $10$ MB/s | $0.5$ 秒 |
| ふつうの 4G | $1.5$ MB/s | $3.3$ 秒 |
| 混んだ電車の中 | $0.3$ MB/s | $17$ 秒 |

**遅いほうを基準にしてください。** 自分の回線で試すと、
いつまでたっても問題が見えません。

ブラウザの開発者ツールには**回線を遅くする機能**があります。
Network タブの「Slow 4G」を選んで、一度自分のページを開いてみてください。
`,
    },
    {
      kind: 'md',
      text: `
## 何が重いのか ― たいていテクスチャ

実際のモデルを開くと、内訳はだいたいこうなります。

- **テクスチャ … $80$〜$95\\%$**
- 頂点データ … $5$〜$20\\%$
- そのほか（アニメーション・階層）… わずか

**削るならテクスチャからです。** 頂点を必死に減らしても、
$4096 \\times 4096$ の色マップが $1$ 枚あれば台無しになります。

減らし方は $3$ つ。上から順に効きます。

1. **解像度を下げる** … $4096 \\to 2048$ で $\\frac{1}{4}$。
   画面上で $200$ ピクセルにしか映らないものに $4096$ は要りません
2. **枚数を減らす** … 金属度・粗さ・遮蔽を **$1$ 枚の RGB の別チャンネル**に詰める
   （glTF は既定でそうなっています）
3. **形式を変える** … 写真は JPEG（WebP）、法線マップは PNG。
   **法線マップを JPEG にしないでください** ― 圧縮のノイズがそのまま凹凸になります
`,
    },
    {
      kind: 'md',
      text: `
## 圧縮の道具

**Draco** … 頂点データを縮めます。$10$ 分の $1$ になることもあります。
\`DRACOLoader\` を \`GLTFLoader\` に登録して使います。
**展開に時間がかかる**ので、小さいモデルにはかえって不利です。

**KTX2 / Basis** … テクスチャを**GPU が直接読める形**に圧縮します。
転送量が減るうえに、**GPU 上のメモリも減ります。** ここが JPEG との決定的な違いです。
\`KTX2Loader\` を使います。

**Meshopt** … Draco の代わり。展開が速く、圧縮率はやや落ちます。

**gltf-transform** … コマンド 1 つで上の全部をやってくれる道具です。
\`gltf-transform optimize in.glb out.glb\` から始めれば、たいてい半分以下になります。

**どれも「後から」かけられます。** 作り直しは要りません。
`,
    },
    {
      kind: 'code',
      title: 'Draco と KTX2 を有効にする',
      code: `import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

const loader = new GLTFLoader();

// 頂点の圧縮。展開器（wasm）を別に置く必要がある
const draco = new DRACOLoader();
draco.setDecoderPath('/draco/');
loader.setDRACOLoader(draco);

// テクスチャの圧縮。端末が対応している形式を renderer から調べる
const ktx2 = new KTX2Loader();
ktx2.setTranscoderPath('/basis/');
ktx2.detectSupport(renderer);
loader.setKTX2Loader(ktx2);

const gltf = await loader.loadAsync('/models/robot.glb');

// いま GPU に何が載っているかを確かめる
console.log(renderer.info.memory);    // { geometries: 12, textures: 5 }
console.log(renderer.info.render);    // { calls, triangles, ... }`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'テクスチャの辺は 2 のべき乗にしておく',
      text: `
1024、2048、4096 のように、2 のべき乗にしてください。

WebGL2 では 2 のべき乗でなくてもミップマップを作れますが、
KTX2 / Basis の圧縮形式はブロック単位（4x4）で詰めるため、
半端な大きさだと余りが出ます。

1920x1080 のような画面の大きさを、そのままテクスチャにしないこと。
2048x1024 に丸めるほうが、結果として軽くて綺麗です。
`,
    },
    {
      kind: 'sandbox',
      title: '解像度と、GPU が使う量',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 同じ絵を、違う解像度で作る
const SIZES = [256, 512, 1024, 2048];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.15, 7.4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.15, 0);

scene.add(new THREE.AmbientLight(0xffffff, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(2, 4, 5);
scene.add(key);

// 同じ模様を、指定の解像度で描く
function makeTexture(size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1b2036';
  ctx.fillRect(0, 0, size, size);
  const cells = 16;
  const step = size / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      if ((x + y) % 2 === 0) continue;
      ctx.fillStyle = 'hsl(' + ((x * 20 + y * 7) % 360) + ' 62% 58%)';
      ctx.beginPath();
      ctx.arc((x + 0.5) * step, (y + 0.5) * step, step * 0.36, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = '#e8e8f2';
  ctx.lineWidth = Math.max(1, size / 256);
  ctx.font = 'bold ' + size / 8 + 'px monospace';
  ctx.fillStyle = '#e8e8f2';
  ctx.fillText(size + 'px', size * 0.06, size * 0.16);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const label = document.createElement('div');
label.style.cssText =
  'position:fixed;left:12px;bottom:12px;padding:8px 12px;border-radius:8px;' +
  'background:rgba(10,10,18,.82);color:#e8e8f2;font:13px/1.7 monospace;' +
  'border:1px solid #3a3a5c;white-space:pre';
document.body.appendChild(label);

const lines = ['解像度   GPU 上の大きさ（ミップ込み）'];
let totalBytes = 0;

SIZES.forEach((size, i) => {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.6),
    new THREE.MeshBasicMaterial({ map: makeTexture(size) }),
  );
  plane.position.set((i - 1.5) * 1.75, 0.95, 0);
  scene.add(plane);

  // w x h x 4 バイト x 4/3（ミップマップ）
  const bytes = size * size * 4 * (4 / 3);
  totalBytes += bytes;
  lines.push(
    String(size).padStart(4) + 'px  ' + (bytes / 1e6).toFixed(2).padStart(7) + ' MB',
  );
});

lines.push('合計    ' + (totalBytes / 1e6).toFixed(2).padStart(7) + ' MB');

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);

  // GPU に載った枚数は、1 度描いたあとでないと数えられない
  label.textContent =
    lines.join('\\n') + '\\nGPU 上のテクスチャ ' + renderer.info.memory.textures + ' 枚';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**$4$ 枚とも、画面上ではほぼ同じ大きさに見えます。** それでも右端の $1$ 枚だけで $22.4$ MB、左端の $256$px の **$64$ 倍**です。近寄って見比べてから、この画面でその差が要るかどうかを考えてください ― **要らないなら、それはただの $22$ MB です。**',
    },
    {
      kind: 'md',
      text: `
## いつ読むか ― 全部を最初に読まない

削っても足りないなら、**読む時期をずらします。**

- **最初に読む** … 最初の画面に映るものだけ
- **あとで読む** … 近づいたら、その部屋に入ったら、そのタブを開いたら
- **読まない** … 一度も見られないものがある。**測ってから消してください**

three 側の道具は要りません。\`loadAsync\` を呼ぶ時期を変えるだけです。

**先読みも効きます。** 次に行きそうな場所のモデルを、
何もしていない時間に静かに読んでおく。届いていれば一瞬で出せます。

**やりすぎないこと。** 先読みは、使わなければただの無駄な通信です。
`,
    },
    {
      kind: 'md',
      text: `
## 順番に測る

重いと感じたら、上から順に確かめてください。

1. **Network タブを見る** … 何 MB 落ちてきているか。**いちばん大きい $1$ つは何か**
2. **その $1$ つを削る** … たいていテクスチャ $1$ 枚で全体の半分を占めています
3. **\`renderer.info.memory\` を見る** … GPU に何枚載っているか
4. **時期をずらす** … 最初の画面に要らないものを後回しに

**$1$ と $2$ で、たいてい終わります。**
「全部を少しずつ軽くする」より「いちばん大きい $1$ つを半分にする」ほうが、
手間も効果もはるかに良い。
`,
    },
  ],
  exercises: [
    {
      prompt: `$4096 \\times 4096$ のテクスチャを **$4$ 枚**（色・法線・粗さ・遮蔽）使っています。

1. GPU 上で合計何 MB になりますか（ミップマップ込み）。
2. すべて $2048$ に落とすと何 MB になり、何割減りますか。`,
      hint: '$M = w \\times h \\times 4 \\times \\frac{4}{3}$ です。辺を半分にすると面積はどうなりますか。',
      answer: `**1. 約 $358$ MB。2. 約 $89.5$ MB で、$75\\%$ 減。**

**1 ― $4096$ のとき**

画素数を出します。

$4096 \\times 4096 = 16{,}777{,}216$

RGBA で $1$ 画素 $4$ バイト。

$16{,}777{,}216 \\times 4 = 67{,}108{,}864$ B $= 67.1$ MB

ミップマップ込みで $\\frac{4}{3}$ 倍。

$67.1 \\times \\frac{4}{3} = 89.5$ MB ― **$1$ 枚あたり**です。

$4$ 枚あるので

$89.5 \\times 4 = 358$ MB

**$358$ MB。** スマートフォンの GPU に載る量ではありません。

**2 ― $2048$ に落とす**

辺が半分になると、**面積は $\\frac{1}{4}$** です。

$358 \\div 4 = 89.5$ MB

$1 - \\frac{1}{4} = 0.75$ ― **$75\\%$ 減**。

**ここが大事なところ**

「解像度を半分にする」は、直感的には $50\\%$ 減に聞こえます。
実際には **$75\\%$ 減**です。**面積で効く**からです。

もう一段落として $1024$ にすれば $22.4$ MB ― **元の $\\frac{1}{16}$**。

**そして、画面上の見た目はほとんど変わりません。**
画面に $300$ ピクセルで映るものに $4096$ のテクスチャを貼っても、
使われるのはミップマップの下のほうの段だけです。
$4096$ の段は**一度も読まれずにメモリを占めています。**

**判断のしかた**

「そのテクスチャが画面上で最大何ピクセルになるか」を測ってください。
$300$ ピクセルなら $512$ で十分です。
**それより上は、拡大したときのためだけの保険**です。`,
    },
    {
      prompt: `モデルが $8$ MB あり、ふつうの 4G（$1.5$ MB/s）で読み込みます。

1. 待ち時間は何秒ですか。
2. 内訳はテクスチャ $7$ MB・頂点 $1$ MB でした。
   **テクスチャの解像度を半分**にしたとき、待ち時間は何秒になりますか。
3. 代わりに **Draco で頂点を $\\frac{1}{10}$** にしたら何秒ですか。`,
      hint: '転送時間 ＝ バイト数 ÷ 速さ。どちらを削ると分子が大きく減りますか。',
      answer: `**1. $5.3$ 秒　2. $1.8$ 秒　3. $5.1$ 秒**

**1 ― いまの待ち時間**

$\\dfrac{8}{1.5} = 5.33$ 秒

**2 ― テクスチャを半分の解像度に**

辺が半分なら面積は $\\frac{1}{4}$。ファイルの大きさもおおよそ $\\frac{1}{4}$ になります。

$7 \\times \\frac{1}{4} = 1.75$ MB

合計は $1.75 + 1 = 2.75$ MB

$\\dfrac{2.75}{1.5} = 1.83$ 秒

**$5.3 \\to 1.8$ 秒。$3$ 分の $1$ 以下**になりました。

**3 ― Draco で頂点を $\\frac{1}{10}$ に**

$1 \\times \\frac{1}{10} = 0.1$ MB

合計は $7 + 0.1 = 7.1$ MB

$\\dfrac{7.1}{1.5} = 4.73$ 秒

**$5.3 \\to 4.7$ 秒。$0.6$ 秒しか縮みません。**

**何を読み取るか**

Draco は頂点を **$10$ 分の $1$** にしました。圧縮率としては見事です。
それでも待ち時間はほとんど変わりませんでした。

**元が $1$ MB しかなかったからです。**

一方テクスチャは $\\frac{1}{4}$ にしただけで、$3.5$ 秒縮みました。
**元が $7$ MB あったからです。**

**圧縮率ではなく、削れたバイト数を見てください。**

- Draco … $0.9$ MB 削減
- 解像度半分 … $5.25$ MB 削減

**しかも Draco には展開の時間がかかります。**
小さいモデルでは、展開の待ちが転送の節約を上回って**かえって遅くなる**こともあります。

**まず Network タブでいちばん大きいものを見つける。** そこからです。`,
    },
    {
      prompt: `美術館のようなページを作ります。部屋が $6$ つあり、各部屋のモデルは $4$ MB。
いまは最初に全部（$24$ MB）読んでいます。

**最初の待ち時間を $\\frac{1}{6}$ にする**にはどうしますか。
そのとき新しく出てくる問題は何で、どう手当てしますか。`,
      hint: '最初の画面に映っているのは、どの部屋ですか。',
      answer: `**最初の部屋だけ読み、残りは入るときに読みます。**

**やること**

最初に読むのは、$1$ 番目の部屋の $4$ MB だけ。

$\\dfrac{24}{1.5} = 16$ 秒 → $\\dfrac{4}{1.5} = 2.7$ 秒

**$16$ 秒が $2.7$ 秒**になりました。ちょうど $\\frac{1}{6}$ です。

three 側に特別な仕組みは要りません。**\`loadAsync\` を呼ぶ時期を変えるだけ**です。

**新しく出てくる問題**

**部屋を移るたびに $2.7$ 秒待たされます。**

最初の $16$ 秒が消えた代わりに、$2.7$ 秒の待ちが $5$ 回に分かれた ―
合計は変わっていません。**移動のたびに止まるのは、むしろ体験が悪い**とも言えます。

**手当て 1 ― 先読み**

$1$ 番目の部屋を見せている**あいだに**、$2$ 番目を静かに読んでおきます。

見ている時間が $2.7$ 秒より長ければ、移った瞬間にはもう届いています。
**待ち時間が $0$ になる**ので、これがいちばん効きます。

隣接する部屋（行き先の候補）だけを先読みするのが定石です。
$6$ 部屋ぜんぶ先読みしたら、元の $24$ MB に戻ってしまいます。

**手当て 2 ― 軽い代役を先に**

各部屋の**低解像度版**（$0.2$ MB）だけ最初に全部読んでおきます。

$4 + 0.2 \\times 5 = 5$ MB ― $3.3$ 秒。

移った瞬間に**ぼやけた姿が出て**、本物が届いたら差し替わります。
**何も無い時間がゼロ**になるので、体感がかなり違います。

**手当て 3 ― 移動そのものを使う**

部屋のあいだに扉や通路があるなら、**そこを歩いている $2$ 秒**が読み込み時間です。
ゲームでよくある作りで、**待たせていることを気づかせません。**

**まとめ**

**合計の転送量は減っていません。** 減ったのは「待たされていると感じる時間」です。

読み込みの設計は、たいていここに行き着きます ―
**バイトを削るのが半分、いつ読むかを決めるのが半分。**`,
      answerCode: `const rooms = [/* ... */];
const cache = new Map();

function load(index) {
  if (!cache.has(index)) {
    cache.set(index, loader.loadAsync(rooms[index].url));
  }
  return cache.get(index);
}

async function enter(index) {
  showRoom(await load(index));

  // 見ているあいだに、隣を静かに読んでおく
  for (const next of neighborsOf(index)) load(next);
}

await enter(0);`,
    },
  ],
  quiz: [
    {
      q: '2048x2048 の JPEG（ファイル 400 KB）は、GPU 上でおよそ何 MB になりますか。',
      choices: [
        '約 22 MB（ミップマップ込み）',
        '400 KB のまま',
        '約 4 MB',
        '端末によるので決まらない',
      ],
      answer: 0,
      explain:
        '2048 x 2048 x 4 バイト = 16.8 MB、ミップマップ込みで 4/3 倍して 22.4 MB。ファイルの 56 倍です。JPEG の圧縮は回線のためのもので、GPU はそれを読めません。',
    },
    {
      q: 'テクスチャの辺を 4096 から 2048 に落とすと、GPU 上の大きさはどうなりますか。',
      choices: [
        '1/4 になる',
        '1/2 になる',
        '変わらない',
        '1/8 になる',
      ],
      answer: 0,
      explain:
        '面積で効くからです。辺が半分なら画素数は 1/4。「半分にする」が 50% ではなく 75% の削減になるのは、ここが理由です。',
    },
    {
      q: '8 MB のモデル（テクスチャ 7 MB・頂点 1 MB）の待ち時間を縮めたい。効くのはどれですか。',
      choices: [
        'テクスチャの解像度を半分にする',
        'Draco で頂点を 1/10 にする',
        'ファイル名を短くする',
        'ミップマップを切る',
      ],
      answer: 0,
      explain:
        'Draco は頂点を 1/10 にしますが、元が 1 MB なので 0.9 MB しか減りません。テクスチャは 1/4 にするだけで 5.25 MB 減ります。圧縮率ではなく、削れたバイト数を見てください。',
    },
  ],
};
