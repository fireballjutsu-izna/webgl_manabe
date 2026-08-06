import type { Chapter } from '../types.ts';

export const chapterX34: Chapter = {
  slug: 'x34-street-lights',
  part: 'project',
  number: 34,
  title: '街灯 ― ライトを増やさずに、光らせる',
  goal: '「照らす」と「光って見える」を分けて考えられるようになり、光源を増やさずに夜景を作る $3$ つの手を使い分けられるようになります。',
  requires: ['x33-sky-fog', 'w22-light-cost', 'x12-additive'],
  threeApis: [
    'MeshBasicMaterial',
    'Material.blending',
    'MeshStandardMaterial.emissiveIntensity',
    'PointLight',
    'Sprite',
  ],
  mathRecall: [
    { slug: 'w22-light-cost', note: '「$1$ 画素あたり × 画素数」で総量が決まる' },
    { slug: 'x12-additive', note: '光を足す描き方。順番を選ばない' },
    { slug: 'b36-smoothstep', note: '窓の点きはじめも、なめらかに' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 街灯を 200 個置きたい

夜の街に街灯を置きたくなります。素直にやるなら \`PointLight\` を $200$ 個。

**これは動きません。**

[](#/ch/w22-light-cost)でやったとおり、ライトを $1$ つ増やすと
**すべての画素で、すべてのマテリアルの計算が増えます。**

どれくらいの量なのか、掛け算 $1$ つで出ます。
`,
    },
    {
      kind: 'formula',
      tex: 'C \\;=\\; W \\times H \\times N_{\\text{light}} \\times F',
      readAloud:
        'ライティングの計算回数は、画面の画素数にライトの数を掛け、さらに毎秒のフレーム数を掛けたものです。画素ごとに、ライトの数だけ計算が回るからです。',
      worked: {
        given: '画面 $1280 \\times 900$、$60$ フレーム毎秒。街灯を $\\mathrm{PointLight}$ で置いた場合。',
        steps: [
          { calc: '画素 : 1280 x 900 = 1,152,000' },
          { calc: 'ライト 1 個・1 フレーム' },
          { calc: '  = 115 万回' },
          { calc: 'ライト 200 個・1 フレーム' },
          { calc: '  = 2.30 億回' },
          { calc: '60 fps では' },
          { calc: '  = 138 億回 / 秒', note: 'GPU でも無理' },
        ],
        result:
          '**$1$ 秒あたり $138$ 億回。** しかもこれは「ライティングの計算」だけの回数で、$1$ 回が $1$ 命令ではありません。実際には、three は使うライトの数だけシェーダを作り直すので、$200$ 個のライトを持つシェーダは**そもそもコンパイルが通らないか、通っても実用にならない**速度になります。**画素数は減らせないので、掛ける数のほうを減らすしかありません。**',
      },
    },
    {
      kind: 'md',
      text: `
## 「照らす」と「光って見える」は別のこと

ここで発想を変えます。

街灯に本当に求めているのは何でしょうか。
**まわりを正確に照らすこと**でしょうか。

夜景の写真を思い出してください。実際に見えているのは、

- **光源そのもの**（明るい点）
- **その周りのにじみ**

の $2$ つがほとんどで、「街灯が壁を照らしている様子」は、
よく見ないと分かりません。

**だから、照らすのをやめます。** 光って見えるものだけを置きます。
`,
    },
    {
      kind: 'md',
      text: `
## 3 つの手

- **光っている板を置く。** \`MeshBasicMaterial\` の小さな面。
  **光の影響を受けないマテリアル**なので、夜でもその色のまま明るく見えます
- **地面に丸い明かりを描く。** 半透明の円を伏せて置くだけ。
  照らされているように見えますが、計算上は**ただの模様**です
- **加算ブレンドで光の芯を足す。** [](#/ch/x12-additive)でやった描き方。
  重ねるほど白く飽和するので、**強い光源の芯**に向きます

どれも**ライトの数を $1$ つも増やしません。**
$200$ 個置いても、増えるのはドローコールと三角形だけ ―
しかも合体すれば、そのドローコールも $1$ 回です。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '書き割りの街',
      text: `
舞台の背景に描かれた夜の街は、窓の $1$ つ $1$ つに電球が入っているわけではありません。
**明るい絵の具で塗ってあるだけ**です。

それでも客席からは、光っているように見えます。

$3$ 次元でも同じです。**見る人は、光源の位置を検算しません。**
明るいものがそこにあれば、光っていると解釈します。

**「本当に照らす」必要があるのは、
その光で何かの見え方が変わってほしいときだけ**です。

街灯の下を人が歩き、その人の顔に光が当たる ―
それが見せたい絵なら、そこだけ本物のライトを置きます。$1$ つか $2$ つなら払えます。
`,
    },
    {
      kind: 'md',
      text: `
## 窓は、すでに用意してある

街灯の前に、もっと効くものがあります。**窓の明かり**です。

[](#/ch/x28-window-uv)で窓を \`emissiveMap\` に入れておいたので、
時刻から \`emissiveIntensity\` を導くだけで、街じゅうの窓が一斉に点きます。

\`buildingMaterial.emissiveIntensity = 1.2 * (1 - daylight)\`

**$1$ 行です。** $54$ 棟・$80$ 個の箱すべてが、同じ $1$ つの値を見ています。

$emissive$ は光源ではないので、**ライトの数は $0$ のまま**です。
夜の街を「光っている」ように見せているものの正体は、ほぼこれ $1$ つです。
`,
    },
    {
      kind: 'sandbox',
      title: '3 つの手を、並べて見る',
      guide: { focus: ['光っている板', '地面の丸い明かり', '加算ブレンドの芯'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1226);
scene.fog = new THREE.Fog(0x0d1226, 20, 90);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 300);
camera.position.set(0, 7, 26);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 3, 0);
controls.maxPolarAngle = Math.PI * 0.495;

// 夜。ライトは環境光 1 つだけ。街灯は 1 つもライトを持たない
scene.add(new THREE.HemisphereLight(0x2b3a5e, 0x16181f, 0.75));

// にじみのテクスチャ。中心が明るく、外へ向かって 0 になる 1 枚
function makeGlowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

const glowTexture = makeGlowTexture();

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x33363f, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// 比較のための壁
[-9, 0, 9].forEach((x) => {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(5, 7, 1),
    new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9 }),
  );
  wall.position.set(x, 3.5, -3.5);
  scene.add(wall);
});

/* ---- 光っている板 ---- */
// MeshBasicMaterial は光の影響を受けない。夜でもこの色のまま出る

const lamp = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.5, 0.5),
  new THREE.MeshBasicMaterial({ color: 0xffd9a0 }),
);
lamp.position.set(-9, 4.5, 0);
scene.add(lamp);

/* ---- 地面の丸い明かり ---- */
// 半透明の円を伏せて置くだけ。照らしてはいない

const pool = new THREE.Mesh(
  new THREE.PlaneGeometry(9, 9),
  new THREE.MeshBasicMaterial({
    color: 0xffd9a0,
    map: glowTexture,          // 中心が明るく、外へ向かって消える
    transparent: true,
    opacity: 0.55,
    depthWrite: false,         // 半透明が奥行きを書くと、後ろのものが消える
  }),
);
pool.rotation.x = -Math.PI / 2;
pool.position.set(0, 0.02, 0);
scene.add(pool);

const poolLamp = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.5, 0.5),
  new THREE.MeshBasicMaterial({ color: 0xffd9a0 }),
);
poolLamp.position.set(0, 4.5, 0);
scene.add(poolLamp);

/* ---- 加算ブレンドの芯 ---- */
// 下にある色に足すので、重なるほど白く飽和する

const glow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    color: 0xffb45a,
    map: glowTexture,
    blending: THREE.AdditiveBlending,   // 下の色に足す。重なるほど白く飽和する
    transparent: true,
    depthWrite: false,
  }),
);
glow.scale.set(7, 7, 1);
glow.position.set(9, 4.5, 0);
scene.add(glow);

const glowLamp = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.5, 0.5),
  new THREE.MeshBasicMaterial({ color: 0xfff0d0 }),
);
glowLamp.position.set(9, 4.5, 0);
scene.add(glowLamp);

['光っている板だけ', '板 ＋ 地面の丸い明かり', '板 ＋ 加算の芯'].forEach((label, index) => {
  const div = document.createElement('div');
  div.textContent = label;
  div.style.cssText =
    'position:absolute; bottom:18px; transform:translateX(-50%);' +
    'color:#e8e8f2; font:12px sans-serif; pointer-events:none; white-space:nowrap;';
  div.style.left = (20 + index * 30) + '%';
  document.body.appendChild(div);
});

const readout = document.createElement('div');
readout.textContent = 'ライトの数 : 1（環境光だけ）';
readout.style.cssText =
  'position:absolute; top:14px; left:16px; color:#9fb4d8;' +
  'font:12px ui-monospace, monospace; pointer-events:none;' +
  'background:rgba(10,12,18,0.78); padding:6px 9px; border-radius:5px;';
document.body.appendChild(readout);

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
        '**$3$ つとも、光源は $1$ つも増えていません**（環境光だけ）。左は板だけ ― 明るい点はあるのに、**まわりが暗いままで嘘に見えます。**中央は地面に丸い明かりを足したもので、いちばん「街灯らしい」。右は加算の芯で、光源そのものが強く見えます。**右の壁は照らされているように見えますが、壁の色は $1$ も変わっていません** ― 視点を横へ回すと、芯が壁の手前に浮いた板であることが分かります。それでも街灯に見えるかどうかが、この章の問いです。',
    },
    {
      kind: 'md',
      text: `
## それでも本物のライトを置くとき

$3$ つの手で足りないのは、**光で何かの見え方が変わってほしい**ときです。

- 街灯の下を通る車の屋根が、通過に合わせて明るくなる
- 看板の光が、隣の壁に色を落とす
- 手に持った灯りが、動くにつれて影を動かす

このとき初めて \`PointLight\` を置きます。**$1$ つか $2$ つなら払えます。**

three には、その中間もあります。

- \`PointLight\` を**近くの $1$ つだけ**有効にし、離れたら消す
- **ライトマップ**（あらかじめ焼いた明かりのテクスチャ）を貼る
- 加算の板を、光源からの距離で**大きさと濃さを変えながら**置く

**「本物か、偽物か」ではなく、「どこまで本物にするか」**です。
そして街全体では、**偽物で足ります。**
`,
    },
  ],
  exercises: [
    {
      prompt: `街灯を \`PointLight\` で $20$ 個だけ置いたとします。

$1$ 秒あたりのライティングの計算回数はいくつですか。$200$ 個と比べてください。`,
      hint: '画素 $1{,}152{,}000$、$60$ フレーム毎秒。',
      answer: `**$13.8$ 億回 / 秒。$200$ 個の $10$ 分の $1$ です。**

**計算**

$1{,}152{,}000 \\times 20 \\times 60 = 1.38 \\times 10^{9}$

$200$ 個なら $138$ 億回だったので、ちょうど $10$ 分の $1$。

**$20$ 個なら動くのか**

環境によっては動きます。ただし、

- **シェーダが重くなる。** 画素ごとに $20$ 回のループ
- **影を持てるのは、そのうち数個まで**（影付きライトはさらに高い）
- **マテリアルの再コンパイルが起きる。** ライトの数が変わるたびに

**$20$ 個は「置ける上限のあたり」**で、余裕はありません。

**そして、その $20$ 個で何が得られるか**

街灯が $20$ 個あっても、街には $200$ 本の道があります。
**$10\\%$ だけ本物**というのは、かえって不揃いに見えます。

**全部偽物にするほうが、絵として揃います。**

$1$ つだけ本物にするなら、**主役の $1$ 本**にします ―
プレイヤーの近く、あるいは画面の中心に来る $1$ 本です。`,
    },
    {
      prompt: `地面の丸い明かりを、\`depthWrite: false\` なしで置いたとします。

何が起きますか。`,
      hint: '[](#/ch/x12-additive)でやった話です。円は半透明ですが、奥行きの記録は？',
      answer: `**円の下（地面）は問題ありませんが、円のあとに描かれる半透明のものが消えます。**

**なぜか**

半透明のものが奥行きを書き込むと、
**その後ろに描かれるはずだったものが「隠された」と判定されます。**

円は完全に透明な部分を持たないので、地面の上ではあまり目立ちませんが、

- 円の上に別の半透明（霧、別の明かり）を重ねたとき
- 円と車のライトが重なったとき

**あとから描かれるほうが、円の奥にあると消えます。**

**もっと分かりやすい失敗**

円を $2$ つ重ねて置くと（街灯が近くに $2$ 本ある場所）、
**後から描かれたほうが、先の円の中で欠けます。**

半透明どうしが交差する円弧が、はっきり見えます。

**規則として覚える**

**半透明のものには、原則 \`depthWrite: false\`。**

例外は「半透明だが、実質的に不透明として扱いたい」場合だけです
（$\\alpha$ が $0.95$ 以上のガラスなど）。

そして順番が問題になるなら、\`renderOrder\` を明示します ―
[](#/ch/x12-additive)でやったとおりです。`,
    },
    {
      prompt: `窓の明かりを \`emissiveIntensity = 1.2 * (1 - daylight)\` で導いています。

これを \`daylight < 0.5 ? 1.2 : 0\` にすると何が変わりますか。`,
      hint: '$\\mathrm{daylight}$ は $0$ から $1$ へなめらかに動きます。',
      answer: `**街じゅうの窓が、同じ $1$ フレームで一斉に点きます。**

**何が起きるか**

\`daylight\` が $0.5$ を跨いだ瞬間、$80$ 個の箱すべての窓が
$0$ から $1.2$ へ飛びます。

**照明のスイッチ**です。夕暮れの数分をかけて、ではありません。

**なめらかな式だと**

$1.2 \\times (1 - \\mathrm{daylight})$ なら、

- $\\mathrm{daylight} = 1.0$（昼）… $0$
- $0.7$ … $0.36$
- $0.3$ … $0.84$
- $0$（夜）… $1.2$

$\\mathrm{daylight}$ 自体が \`smoothstep\` でなめらかなので、
**窓の明るさも、太陽高度 $17$ 度ぶんかけて上がっていきます。**

**現実はどちらに近いか**

実際の街は、**その中間**です。

- 建物ごとに、点く時刻が少しずつ違う
- $1$ 棟の中でも、部屋ごとに違う

**それをやるなら、建物ごとの乱数でしきい値をずらします。**

\`点灯 = smoothstep(0.6 + offset, 0.2 + offset, daylight)\`

$offset$ を建物ごとの乱数（[](#/ch/x21-seeded-random)の建物用の列）から取れば、
**街に「早い家」と「遅い家」ができます。**

$1$ 行で、夕暮れの表情がひとつ増えます。`,
    },
  ],
  quiz: [
    {
      q: '街灯を PointLight で 200 個置くと何が問題ですか。',
      choices: [
        '画素ごとにライトの数だけ計算が回るので、1280×900・60fps で 138 億回 / 秒になる',
        'メモリが足りなくなる',
        'ドローコールが 200 回増える',
        '影が 200 枚必要になる',
      ],
      answer: 0,
      explain:
        'ライティングの計算量は「画素数 × ライト数 × フレーム数」です。画素数は減らせないので、掛ける数のほうを減らすしかありません。さらに three は使うライトの数だけシェーダを作り直すので、200 個ではそもそもコンパイルが通らないか、通っても実用になりません。',
    },
    {
      q: 'ライトを増やさずに街灯を光らせる手として、正しくないものはどれですか。',
      choices: [
        'PointLight の intensity を下げて数を増やす',
        '光っている板（MeshBasicMaterial）を置く',
        '地面に半透明の円を伏せて置く',
        '加算ブレンドで光の芯を足す',
      ],
      answer: 0,
      explain:
        'intensity を下げても、計算が回る回数は 1 つも減りません。費用はライトの数で決まります。残りの 3 つはどれも「照らす」のをやめて「光って見える」だけを作る手で、ライトの数は 0 のままです。見る人は光源の位置を検算しないので、これで足ります。',
    },
    {
      q: '窓の明かりを `emissiveIntensity` で出す利点はどれですか。',
      choices: [
        '光源ではないのでライトの数が増えず、1 つの値で 80 個の箱すべての窓が一斉に変わる',
        '窓が正確にまわりを照らす',
        '影が窓の形に落ちる',
        'ドローコールが減る',
      ],
      answer: 0,
      explain:
        'emissive は「自分で光っている色」なので光源ではなく、ライティングの計算量に影響しません。窓を emissiveMap に入れておけば、時刻から導いた 1 つの数値で街じゅうの窓が点きます。夜の街を光って見せているものの正体は、ほぼこれ 1 つです。',
    },
  ],
};
