import type { Chapter } from '../types.ts';

export const chapterY10: Chapter = {
  slug: 'y10-bloom',
  part: 'polish',
  number: 10,
  title: 'ブルーム ― しきい値から決める',
  goal: '$\\mathrm{UnrealBloomPass}$ の $3$ つの数字を、どれから決めるべきか言えるようになり、「入れたのに何も滲まない」を明るさの計算から説明できるようになります。',
  requires: ['q03-postprocess', 'y07-tonemapping'],
  threeApis: ['UnrealBloomPass', 'MeshBasicMaterial', 'MeshStandardMaterial', 'CanvasTexture'],
  mathRecall: [
    { slug: 'y07-tonemapping', note: '$1$ を超える明るさ ― ブルームが探しているのは、これ' },
    { slug: 'q02-color', note: 'リニアの目盛りでないと、明るさを比べられない' },
    { slug: 'p07-city-light', note: '夜の窓の明かり。ここに効かせます' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 明るいものだけを、滲ませる

{{ブルーム}}は、強い光のまわりがぼんやり広がって見える効果です。
夜のネオン、逆光、街灯 ― 写真で見慣れているあれです。

処理そのものは単純で、$3$ 手です。

- **明るい画素だけを抜き出す**（しきい値を超えたものだけ）
- **それをぼかす**
- **元の絵に足し戻す**

$1$ 手めがすべてです。**「どこからが明るいか」を決めているのは、あなた**であって、
three ではありません。ここを決めないまま \`strength\` をいじると、
画面全体が眠くなるか、まったく何も起きないかのどちらかになります。
`,
    },
    {
      kind: 'md',
      text: `
## 3 つの数字と、決める順番

\`new UnrealBloomPass(解像度, strength, radius, threshold)\` ―
第 $1$ 引数は画面の大きさなので、実質は $3$ つです。

- **\`threshold\`（しきい値）** … どこからを「明るい」とするか
- **\`strength\`（強さ）** … 足し戻す量
- **\`radius\`（半径）** … 滲みの広がり方

**決める順番は、書いてある順の逆です。**

$1$ 番目に \`threshold\`。ここが決まらないと、ほかの $2$ つは意味を持ちません。
しきい値を越えるものが無ければ、\`strength\` を $10$ にしても画面は変わりません。
逆に低すぎれば、\`strength\` を下げても画面全体がぼんやりしたままです。

$2$ 番目に \`strength\`、最後に \`radius\` ―
**\`radius\` は仕上げの調整で、効きは思ったより小さい**です。
`,
    },
    {
      kind: 'formula',
      tex: 'v = 0.2126\\,R + 0.7152\\,G + 0.0722\\,B, \\qquad \\alpha = \\mathrm{smoothstep}(t,\\; t + 0.01,\\; v)',
      readAloud:
        '画素の明るさ $v$ は、$R$ に $0.2126$、$G$ に $0.7152$、$B$ に $0.0722$ を掛けて足したもの、と読みます。それをしきい値 $t$ と比べ、越えていれば通し、越えていなければ捨てます。幅が $0.01$ しかないので、実質は「越えたか、越えていないか」の $2$ 択です。',
      worked: {
        given:
          '夜の街の窓に \`emissive\` の白と窓テクスチャを与え、\`emissiveIntensity = 1.5\` にしました。しきい値 $0.95$ を越える窓は、どれくらいあるでしょうか。',
        steps: [
          { calc: '窓テクスチャの明るいセル : rgb(204, 173, 112)', note: '$sRGB$ の値' },
          { calc: 'リニアに直すと (0.6038, 0.4179, 0.1620)' },
          { calc: 'v = 0.2126(0.6038) + 0.7152(0.4179) + 0.0722(0.1620) = 0.4389' },
          { calc: '1.5 を掛けて 0.6584', note: 'しきい値 $0.95$ に届かない' },
          { calc: 'いちばん明るいセル rgb(255, 216, 140) では' },
          { calc: 'リニア (1.0000, 0.6867, 0.2623) → v = 0.7227' },
          { calc: '1.5 を掛けて 1.0840', note: 'こちらは越える' },
          { calc: '境目は R が 240 のあたり（1.5 倍して 0.9507）' },
          { calc: '窓の明るさは 170〜254 に散らばっている' },
          { calc: '越えるのは 240 以上 → 明かりのついたセルの 17.6%' },
        ],
        result:
          '**滲むのは、明かりのついた窓のうち $17.6\\%$ だけ**です。残りは点いていても滲みません。これが正解です ― **全部の窓が滲んだら、それはしきい値が低すぎます。** ちなみに街灯は \`new THREE.Color(3.2, 2.3, 1.1)\` なので $v = 2.4047$、しきい値 $1.4$ でも余裕で越えます。**小さくて強いものほど、ブルームがよく効く**のはこのためです。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '緑が支配している',
      text: `
明るさの係数を、もう一度見てください。

- $R$ … $0.2126$
- $G$ … $\\mathbf{0.7152}$
- $B$ … $0.0722$

**緑が $7$ 割**です。人の目が緑にいちばん敏感だからで、これは $sRGB$ の規格そのものです。

だから、こうなります。

- **緑の光** … 値が $1.33$ あれば、しきい値 $0.95$ を越える
- **青の光** … $13.2$ 必要。$10$ 倍

**「青いネオンだけ滲まない」は、バグではありません。**
青を滲ませたいなら、数値を思いきり上げるか、しきい値を下げるしかありません。

しきい値を下げると今度はほかのものまで滲むので、
**青だけを光らせたい場面では、値を $10$ 以上にする**のが素直です。
`,
    },
    {
      kind: 'md',
      text: `
## 夜の街にかける

[](#/ch/p07-city-light)で窓に明かりを点けました。そこにブルームを足します。
**夜景はブルームがいちばん効く題材**です。

\`BLOOM_THRESHOLD\` を上下させて、**何が滲みはじめて、何が滲まなくなるか**を見てください。
`,
    },
    {
      kind: 'sandbox',
      title: '夜の街にブルームをかける',
      guide: { focus: ['ポストプロセス'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ---- ここを書き換えて試してください ---- */
const BLOOM_STRENGTH = 0.55;
const BLOOM_RADIUS = 0.45;
const BLOOM_THRESHOLD = 0.95;   // まずここを動かす

function makeRandom(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 窓のテクスチャ。明かりのセルは 170〜254 の明るさで散らばる
function createWindowTexture() {
  const cell = 16;
  const grid = 8;
  const canvas = document.createElement('canvas');
  canvas.width = cell * grid;
  canvas.height = cell * grid;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const rand = makeRandom(4242);
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      if (rand() > 0.55) continue;
      const level = 170 + Math.floor(rand() * 85);
      ctx.fillStyle = 'rgb(' + level + ',' + Math.floor(level * 0.85) + ',' + Math.floor(level * 0.55) + ')';
      ctx.fillRect(gx * cell + cell * 0.22, gy * cell + cell * 0.2, cell * 0.56, cell * 0.5);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f1c);
scene.fog = new THREE.Fog(0x0b0f1c, 60, 220);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 300);
camera.position.set(-48, 25, 60);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 8, 0);
controls.maxPolarAngle = Math.PI * 0.495;

scene.add(new THREE.HemisphereLight(0x3a4a7a, 0x101018, 0.5));

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: 0x23252e, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---- 建物を並べる ---- */

const windows = createWindowTexture();
const rand = makeRandom(20260730);

const buildingMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b303c,
  roughness: 0.85,
  emissive: 0xffffff,
  emissiveMap: windows,
  // 1 を超える明るさにしておく。ここがブルームのしきい値を越える
  emissiveIntensity: 1.5,
});

for (let i = 0; i < 26; i++) {
  const w = 3 + rand() * 3;
  const d = 3 + rand() * 3;
  const h = 6 + rand() * 26;

  const geometry = new THREE.BoxGeometry(w, h, d);
  // 面の実寸に合わせた UV の割り付け
  const uv = geometry.getAttribute('uv');
  const cols = (size) => Math.max(1, Math.round(size / 2.4)) / 8;
  const rows = Math.max(1, Math.round(h / 3.4)) / 8;
  const faces = [
    { u: cols(d), v: rows }, { u: cols(d), v: rows },
    null, null,
    { u: cols(w), v: rows }, { u: cols(w), v: rows },
  ];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const at = f * 4 + k;
      if (faces[f] === null) uv.setXY(at, 0.06, 0.06);
      else uv.setXY(at, uv.getX(at) * faces[f].u, uv.getY(at) * faces[f].v);
    }
  }

  const building = new THREE.Mesh(geometry, buildingMaterial);
  building.position.set((rand() - 0.5) * 60, h / 2, (rand() - 0.5) * 60);
  scene.add(building);
}

// 街灯。小さくて強いものほど、ブルームがよく効く
const lampMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.3, 1.1) });
const lampGeometry = new THREE.SphereGeometry(0.35, 16, 10);
for (let i = 0; i < 16; i++) {
  const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
  lamp.position.set((rand() - 0.5) * 60, 3.2, (rand() - 0.5) * 60);
  scene.add(lamp);
}

/* ---- ポストプロセス ---- */

const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
const target = new THREE.WebGLRenderTarget(size.x, size.y, {
  type: THREE.HalfFloatType,   // 1 を超える明るさを保つ
  samples: 4,                  // 合成すると antialias が効かないので、ここで MSAA
});

const composer = new EffectComposer(renderer, target);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(size.x, size.y);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(size, BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD));
composer.addPass(new OutputPass());

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#e8e8f2; font:12px monospace;' +
  'pointer-events:none; white-space:pre; text-shadow:0 1px 2px #000;';
readout.textContent =
  'threshold ' + BLOOM_THRESHOLD.toFixed(2) +
  '\\nstrength  ' + BLOOM_STRENGTH.toFixed(2) +
  '\\nradius    ' + BLOOM_RADIUS.toFixed(2);
document.body.appendChild(readout);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render();
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '既定の `0.95` で滲んでいるのは、街灯と、いちばん明るい窓だけです（テクスチャの明かりのセルのうち 17.6%）。`BLOOM_THRESHOLD` を 0.2 にすると建物の壁まで滲みはじめ、街全体が霞みます。1.4 にすると窓は 1 つも越えられず、**街灯だけが光り、窓はただの明るい四角**になります。`emissiveIntensity` を 0.8 に下げると、窓は点いているのにまったく滲みません ― 明るさが 0.58 までしか行かず、しきい値に届かないからです。',
    },
    {
      kind: 'md',
      text: `
## radius は「半径」ではない

名前に反して、\`radius\` はぼかしの半径ではありません。**ぼかしの配合比**です。

\`UnrealBloomPass\` は、抜き出した明るい部分を**$5$ 段階の大きさでぼかしています。**
画面が $1920 \\times 1080$ なら、こうです。

- $960 \\times 540$ … 細かい滲み
- $480 \\times 270$
- $240 \\times 135$
- $120 \\times 68$
- $60 \\times 34$ … 大きく広がる滲み

\`radius\` が変えるのは、この $5$ 枚をどんな比率で混ぜるかです。

- **\`radius = 0\`** … $1.0 : 0.8 : 0.6 : 0.4 : 0.2$。細かいほうが濃い ― **締まった滲み**
- **\`radius = 1\`** … $0.2 : 0.4 : 0.6 : 0.8 : 1.0$。逆転して **広がった滲み**
- **\`radius = 0.45\`** … $0.640 : 0.620 : 0.600 : 0.580 : 0.560$。**ほぼ均等**

$3$ つめを見てください。**$0.45$ 前後では、どの段もほとんど同じ重み**です。
$0.4$ と $0.5$ の違いが分かりにくいのは、このためです。
**効かせたいなら $0$ か $1$ の近くまで振ってください。**
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: 'ブルームは「光」ではなく「カメラの癖」',
      text: `
実際のブルームは、強い光がレンズの中で散ったり、
センサーの隣の画素へ漏れたりして起きます。
つまり**目に見えている現象ではなく、撮影機材の癖**です。

肉眼でネオンを見ても、写真ほどには滲みません。

だから入れすぎると「加工した写真」の顔になります。
**入れたことに気づかれないくらい**が、たいていちょうどよい量です。

- **効く** … 夜景、ネオン、光源が画面に写る場面、逆光
- **効かない** … 昼の屋外。強くかけると、ただ眠い絵になります

**「現実に無いものを足している」**という自覚が、量を決める助けになります。
`,
    },
    {
      kind: 'md',
      text: `
## 何も滲まないときの、見る順番

いちばん多い相談が「入れたのに何も起きない」です。順番に潰してください。

- **\`composer.render()\` を呼んでいるか。** [](#/ch/q03-postprocess)の落とし穴
- **物体の明るさがしきい値を越えているか。** ここがほとんど
- **色が青系ではないか。** 緑の $10$ 分の $1$ しか効きません
- **レンダーターゲットが \`HalfFloatType\` か。** $8$ ビットだと $1$ で頭打ちになり、
  「特別に明るいもの」と「ただの白」の区別が消えます

$4$ つめは見つけにくい割に効きます。
**$1$ を超える明るさを保てる入れ物でないと、しきい値を $1$ 以上にした瞬間、
何も越えられなくなる**からです。
`,
    },
  ],
  exercises: [
    {
      prompt: `青いネオン \`new THREE.Color(0, 0, 4)\` を置きました。しきい値は $0.95$ です。

滲みますか。`,
      hint: '青の係数は $0.0722$ です。',
      answer: `**滲みません。**

**計算**

$v = 0.2126(0) + 0.7152(0) + 0.0722(4) = 0.2888$

しきい値 $0.95$ の $3$ 割にも届きません。

**同じ数値の緑なら**

\`new THREE.Color(0, 4, 0)\` なら $v = 2.861$ ― **余裕で越えます。**

同じ「$4$」なのに、通るか通らないかが変わります。

**越えさせるには**

$0.95 / 0.0722 = 13.2$

**青は $13.2$ 以上**にする必要があります。

**現実的な手**

- **純粋な青をやめる。** \`(0.6, 1.4, 4)\` のように緑を混ぜると、
  見た目は青いまま $v = 1.418$ で越えられます
- **値を上げる。** \`(0, 0, 14)\` ― ただしトーンマッピング後はほぼ白に飛びます

$1$ つめが実務的です。**ネオンの青は、少し緑を混ぜたほうが「光って」見えます。**`,
    },
    {
      prompt: `\`strength\` を $0.55$ から $2.0$ に上げました。

滲む**範囲**は広がりますか。`,
      hint: 'しきい値を通過する画素の数は、どこで決まりますか。',
      answer: `**広がったように見えますが、対象は $1$ 画素も増えていません。**

**しきい値を通るものは変わらない**

明るい部分を抜き出すのは \`threshold\` の仕事で、
\`strength\` はそのあと、**ぼかした結果を足し戻すときの倍率**です。

抜き出す段階には関わりません。

**では、なぜ広がって見えるのか**

ぼかした滲みは、外側ほど薄くなっています。

強さを上げると、**それまで暗くて見えていなかった外側の裾が、見えるようになります。**

$3$ 倍に濃くすれば、裾の $0.01$ が $0.03$ になり、目に入ります。

**範囲そのものを変えたいなら**

- **\`threshold\` を下げる** … 滲む**もの**が増える
- **\`radius\` を上げる** … 大きくぼかした段の比率が上がり、**裾が遠くまで伸びる**

$2$ つの効き方は違います。
前者は「何が光るか」、後者は「どこまで届くか」です。

**\`strength\` は、そのどちらでもありません。**`,
    },
    {
      prompt: `トーンマッピングの**あと**にブルームをかけたら、どうなりますか。`,
      hint: 'トーンマッピングは、$1$ を超えた明るさをどうしますか。',
      answer: `**しきい値を $1$ 以上にできなくなり、明暗の区別も潰れます。**

**トーンマッピングがしていること**

[](#/ch/y07-tonemapping)でやったとおり、$1$ を超えた明るさを $[0, 1]$ に畳みます。

つまり通したあとは、**どの画素も $1$ 以下**です。

**何が起きるか**

- **しきい値 $1$ 以上が無意味。** 越える画素が $1$ つも存在しません
- **明るさの差が縮む。** $\\mathrm{ACES}$ を通すと、
  街灯の $2.40$ は $0.906$ に、明るい窓の $1.08$ は $0.775$ になります

**元の差**

$2.40 / 1.08 = 2.22$ 倍。

トーンマッピング後は $0.906 / 0.775 = 1.17$ 倍 ―
**「街灯のほうがずっと強い」という情報が、半分近く失われています。**

しきい値でその $2$ つを分けたくても、境目が狭くなって分けにくくなります。

**だから順番が決まる**

- **ブルーム** … リニアで、$1$ を超える情報が残っているうち
- **トーンマッピング（\`OutputPass\`）** … そのあと

**畳んでしまったものは、戻せません。**`,
    },
  ],
  quiz: [
    {
      q: 'UnrealBloomPass の 3 つの数字は、どれから決めますか。',
      choices: [
        'threshold。越えるものが無ければ、ほかの 2 つは何をしても効かない',
        'strength。全体の量を決めるのが先',
        'radius。広がりが見た目を決める',
        'どれからでも同じ',
      ],
      answer: 0,
      explain:
        'ブルームは「しきい値を超えた画素を抜き出し、ぼかして足し戻す」処理です。抜き出す段階で何も通らなければ、strength を 10 にしても画面は変わりません。逆に低すぎれば、strength を下げても画面全体がぼんやりしたままです。threshold → strength → radius の順で決めてください。',
    },
    {
      q: '青いネオンだけが滲みません。理由はどれですか。',
      choices: [
        '明るさの計算で青の係数が 0.0722 しかなく、緑の 10 分の 1 だから',
        'HalfFloatType が青を切り捨てるから',
        'ブルームが色相を見ているから',
        '青は sRGB の範囲外だから',
      ],
      answer: 0,
      explain:
        '明るさは 0.2126R + 0.7152G + 0.0722B です。しきい値 0.95 を越えるのに、緑なら 1.33 で足りますが青は 13.2 必要です。純粋な青をやめて少し緑を混ぜると、見た目は青いまま越えられます。',
    },
    {
      q: 'radius を 0.4 から 0.5 に変えても、ほとんど見た目が変わりません。なぜですか。',
      choices: [
        '0.45 付近では 5 段のぼかしの重みがほぼ均等になり、そこが変化の平らな底だから',
        'radius は 0 か 1 しか受け付けないから',
        'strength が低すぎるから',
        'radius は解像度が高いときだけ効くから',
      ],
      answer: 0,
      explain:
        'radius はぼかしの半径ではなく、5 段階のぼかしの配合比です。0 なら 1.0 : 0.8 : 0.6 : 0.4 : 0.2、1 なら逆転して 0.2 : 0.4 : 0.6 : 0.8 : 1.0。0.45 では 0.640 : 0.620 : 0.600 : 0.580 : 0.560 とほぼ均等で、その付近は変化が鈍くなります。効かせたいなら 0 か 1 の近くまで振ってください。',
    },
  ],
};
