import type { Chapter } from '../types.ts';

export const chapterQ03: Chapter = {
  slug: 'q03-postprocess',
  part: 'polish',
  number: 9,
  title: '描き終わった絵に、手を入れる ― 3 点セット',
  goal: '$\\mathrm{EffectComposer}$ の $3$ 点セットを組めるようになり、$\\mathrm{OutputPass}$ を忘れたときに色が壊れる理由を、色の通り道から説明できるようになります。',
  requires: ['y08-color-debug', 'w44-gpu-cost'],
  threeApis: [
    'EffectComposer',
    'RenderPass',
    'OutputPass',
    'WebGLRenderTarget',
    'WebGLRenderer.setRenderTarget',
  ],
  mathRecall: [
    { slug: 'y08-color-debug', note: '出口の変換が抜けると、暗くなる' },
    { slug: 'w44-gpu-cost', note: '画面全体をもう一度処理する重さ' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 描き終わってから、手を入れる

ここまでは「どう描くか」の話でした。ポストプロセスは違います。

**いったん描き終わった絵を、$1$ 枚の画像として受け取って、そこに手を入れます。**

- ブルーム（明るいものを滲ませる）
- ビネット（周辺を落とす）
- 色調の補正
- 被写界深度、モーションブラー

どれも「シーンの中身」ではなく「**できあがった絵**」に対する操作です。
だから $3$ 次元の知識はほとんど要らず、**画像処理**の話になります。

その代わり、**構造が $1$ つ変わります。** 画面に直接描かなくなるのです。
いったん{{レンダーターゲット}}（テクスチャ）へ描き、それを材料にして加工します。
`,
    },
    {
      kind: 'md',
      text: `
## 3 点セット

必要なものは $3$ つだけです。

- **\`EffectComposer\`** … 加工の $1$ 工程を{{パス}}と呼びます。それを順番に通す係
- **\`RenderPass\`** … いつもの描画を、画面ではなくテクスチャへ
- **\`OutputPass\`** … 最後に、トーンマッピングと $sRGB$ への変換をする

$3$ つめが要点で、**忘れると必ず色が壊れます。**

そして描画の呼び出しが変わります。
\`renderer.render(scene, camera)\` ではなく \`composer.render()\` です。
`,
    },
    {
      kind: 'code',
      title: '最小のポストプロセス',
      code: `import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const target = new THREE.WebGLRenderTarget(
  window.innerWidth, window.innerHeight,
  { type: THREE.HalfFloatType, samples: 4 },   // 1 を超える明るさを保ち、輪郭もならす
);

const composer = new EffectComposer(renderer, target);
composer.addPass(new RenderPass(scene, camera));
// ここに好きなパスを足す
composer.addPass(new OutputPass());            // 最後に必ず 1 回

function animate() {
  requestAnimationFrame(animate);
  composer.render();        // renderer.render ではなく composer.render
}`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'OutputPass を忘れると、色が壊れます',
      text: `
[](#/ch/y08-color-debug)で見た「**暗くて濃い**」が、そのまま出ます。

理由も同じです。**出口の変換が $1$ 回ぶん足りない**からです。

- ふつうの描画 … \`renderer\` が最後に $sRGB$ へ変換して画面に出す
- ポストプロセス … 途中はぜんぶ**リニアのまま**テクスチャに描く。
  最後に変換する係が要る ― それが \`OutputPass\`

途中をリニアで通すのは、**そうしないと合成が正しく計算できない**からです。
ぼかしも足し算も、$sRGB$ のままやると[](#/ch/q02-color)で見たとおり狂います。

**症状で見分けられます。** ポストプロセスを入れた瞬間に画面が暗く濃くなったら、
まず \`OutputPass\` を疑ってください。
`,
    },
    {
      kind: 'sandbox',
      title: 'OutputPass を外すと、どうなるか',
      guide: { focus: ['ポストプロセス'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.DirectionalLight(0xffffff, 2.2).translateZ(6));
scene.add(new THREE.AmbientLight(0x445577, 0.6));

// ふつうの物体（色が正しいかを見るための基準）
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 1.4, 1.4),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.4 }),
);
box.position.x = -1.5;
scene.add(box);

// 明るく光るもの（ブルームの対象）
const lamp = new THREE.Mesh(
  new THREE.SphereGeometry(0.55, 32, 20),
  // 1 を大きく超える色にしておくと、しきい値を越えて滲む
  new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.6, 2.2) }),
);
lamp.position.set(1.6, 0.4, 0);
scene.add(lamp);

/* ---- ポストプロセス ---- */

const size = new THREE.Vector2(window.innerWidth, window.innerHeight);

// MSAA を効かせたレンダーターゲット（後述）
const target = new THREE.WebGLRenderTarget(size.x, size.y, {
  type: THREE.HalfFloatType,
  samples: 4,
});

const composer = new EffectComposer(renderer, target);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(size.x, size.y);

const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(size, 0.9, 0.4, 0.85);
const outputPass = new OutputPass();

composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(outputPass);

/* ---- 切り替え ---- */

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#e8e8f2; font:12px monospace;' +
  'pointer-events:none; white-space:pre;';
document.body.appendChild(readout);

function setOutput(enabled) {
  const has = composer.passes.indexOf(outputPass) >= 0;
  if (enabled && !has) composer.addPass(outputPass);
  if (!enabled && has) composer.removePass(outputPass);
  readout.textContent =
    'OutputPass: ' + (enabled ? 'あり（正しい）' : 'なし') +
    '\\nパスの数 ' + composer.passes.length;
}

function addButton(text, left, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText =
    'position:absolute; bottom:52px; left:' + left + 'px; padding:6px 10px;' +
    'background:#12121f; color:#e8e8f2; border:1px solid #3a3a5c; border-radius:6px;' +
    'font:12px sans-serif; cursor:pointer;';
  button.addEventListener('click', onClick);
  document.body.appendChild(button);
}

addButton('OutputPass あり', 12, () => setOutput(true));
addButton('OutputPass なし', 132, () => setOutput(false));
setOutput(true);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  box.rotation.y += clock.getDelta() * 0.4;
  controls.update();
  composer.render();        // renderer.render ではなく composer.render
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '「なし」に切り替えると、水色の箱がくすんだ白っぽい色になり、背景まで持ち上がります。エラーは 1 つも出ません ― だから気づきにくいのです。`bloomPass` を消すと、`OutputPass` が無くても正しい色に戻ります（パスが 1 つだけなら、three が画面へ直接描くため）。これが「途中に何か挟んだときだけ壊れる」という、いやらしい出方の理由です。',
    },

    {
      kind: 'md',
      text: `
## 順番が、すべてを決める

パスは**足した順**に実行されます。この順番には意味があります。

- **\`RenderPass\` は必ず最初。** 絵が無ければ、手の入れようがありません
- **\`OutputPass\` は必ず最後。** 変換したあとに合成すると、また狂います
- **そのあいだが、自由**

「あいだ」に何をどの順で置くかは、効果の性質で決まります。

- **ブルーム** … 明るさを見るので、**トーンマッピングより前**（つまり \`OutputPass\` より前）
- **ビネット・色調** … どちらでも成り立つが、リニアでやるほうが素直
- **輪郭のならし（$SMAA$）** … 色が決まったあと、つまり**いちばん後ろ**

$3$ つめだけが例外で、\`OutputPass\` より後ろに置くこともあります。
**画素の色が確定してからでないと、輪郭を見分けられない**からです。
`,
    },
    {
      kind: 'md',
      text: `
## この先の 3 章

- **[](#/ch/y10-bloom)** … ブルーム。しきい値から決める
- **[](#/ch/y11-postprocess-cost)** … 代償。$\\mathrm{antialias}$ とビット深度と帯域
- **[](#/ch/q04-custom-pass)** … 自分でパスを書く

$2$ つめは、入れる前に読んでおく価値があります。
**ポストプロセスは、思っているより高い**からです。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`composer.render()\` に変えるのを忘れて、\`renderer.render(scene, camera)\` のままにしました。

何が起きますか。`,
      hint: 'パスは誰が実行しますか。',
      answer: `**ポストプロセスがまったく効きません。絵は正しく出ます。**

**なぜエラーにならないのか**

\`EffectComposer\` を作って \`addPass\` しただけでは、**何も起きません。**
パスを実行するのは \`composer.render()\` だからです。

\`renderer.render(scene, camera)\` は、これまでどおり画面に直接描きます。

つまり、

- **絵は正しい**（色も、輪郭も）
- **ブルームもビネットも効かない**
- **エラーも警告も出ない**

**いちばん見つけにくい種類の不具合**です。

**気づき方**

パスのパラメータを極端な値にしてみてください。
ブルームの \`strength\` を $10$ にしても何も変わらないなら、**呼んでいません。**

**逆のミスもある**

\`composer.render()\` に変えたのに \`RenderPass\` を足し忘れると、
**真っ黒な画面**になります ― こちらはすぐ気づきます。

**「何も変わらない」と「真っ黒」は、どちらも $1$ 行の書き忘れ**です。`,
    },
    {
      prompt: `\`OutputPass\` を $2$ 回足すと、どうなりますか。`,
      hint: '変換の回数を数えてください。',
      answer: `**[](#/ch/y08-color-debug)で見た「白っぽくて薄い」になります。**

**なぜか**

\`OutputPass\` はリニア $\\to sRGB$ の変換をします。

$2$ 回通れば、**変換が $1$ 回多い**状態です。

$0.0782$（リニア）が $0.31$ になり、それがもう $1$ 回変換されて $0.58$ ―
$\\#4fd6ff$ が $\\#97ecff$ あたりになります。

**入口の変換が抜けたときと、同じ症状**です。

**つまり $3$ 通りが同じ見た目になる**

- 入口の変換が抜けた
- \`OutputPass\` が $2$ 回
- 出口の変換を手で足した

どれも「リニア $\\to sRGB$ が $1$ 回多い」です。

**だから、数えるのがいちばん速い**

症状から原因を当てるのではなく、
**変換が何回かかっているかを数えてください。**

- 入口 … テクスチャと色の \`colorSpace\`
- 出口 … \`outputColorSpace\` か \`OutputPass\`、**どちらか $1$ つだけ**

$2$ つが両方効いていないか、確かめてください。`,
    },
    {
      prompt: `$SMAA$（輪郭をならすパス）を \`OutputPass\` より前に置くのと、後ろに置くのでは何が違いますか。`,
      hint: '$SMAA$ は何を見て輪郭を判定しますか。',
      answer: `**後ろのほうが正しく判定できます。**

**$SMAA$ がしていること**

隣り合う画素の**色の差**を見て、輪郭を推定し、そこをならします。

**リニアで見ると、差が正しく読めない**

$sRGB$ は暗い側に目盛りが厚い ―
つまり**人が「差がある」と感じる量**に近い目盛りです。

リニアのままでは、暗い部分の差が小さく見えます。

- リニア $0.02$ と $0.05$ … 差は $0.03$。ほとんど無いように見える
- $sRGB$ に直すと $0.16$ と $0.24$ … 差は $0.08$。**$2.7$ 倍に見える**

暗い部分の輪郭を、リニアのままでは**見落とします。**

**だから後ろに置く**

\`OutputPass\` のあと、つまり $sRGB$ になってから輪郭を探すほうが、
**人が見ている輪郭に近いものを検出できます。**

**ブルームは逆**

ブルームは「明るさがしきい値を超えたか」を見るので、
**リニアでないと意味がありません。** $sRGB$ に直したあとでは、
$1$ を超えた情報がもう失われています。

**「その効果は、どの目盛りで意味を持つか」で置き場所が決まります。**`,
    },
  ],
  quiz: [
    {
      q: 'ポストプロセスを入れると、描画の呼び出しはどう変わりますか。',
      choices: [
        '`renderer.render(scene, camera)` ではなく `composer.render()` を呼ぶ',
        '両方を呼ぶ',
        '変わらない',
        'renderer.render を毎フレーム 2 回呼ぶ',
      ],
      answer: 0,
      explain:
        'EffectComposer を作って addPass しただけでは何も起きません。パスを実行するのは composer.render() です。renderer.render のままにしても絵は正しく出て、エラーも警告も出ないまま効果だけが効かないので、いちばん見つけにくい不具合になります。',
    },
    {
      q: '`OutputPass` を忘れると、なぜ色が壊れるのですか。',
      choices: [
        '途中はリニアのまま処理するので、最後に sRGB へ戻す係がいなくなるから',
        'ブルームが二重にかかるから',
        'レンダーターゲットが 8 ビットだから',
        'antialias が効かなくなるから',
      ],
      answer: 0,
      explain:
        '合成をリニアでやるのは、sRGB のまま足すと計算が狂うからです。そのぶん、最後に変換する係が要ります。忘れると「出口の変換が 1 回足りない」状態になり、色の章で見た「暗くて濃い」がそのまま出ます。逆に 2 回足すと「白っぽくて薄い」になります。',
    },
    {
      q: 'ブルームと SMAA（輪郭をならすパス）は、`OutputPass` の前と後ろ、どちらに置きますか。',
      choices: [
        'ブルームは前、SMAA は後ろ。前者は明るさ、後者は人が見る色の差を見るから',
        'どちらも前',
        'どちらも後ろ',
        'ブルームが後ろ、SMAA が前',
      ],
      answer: 0,
      explain:
        'ブルームは「しきい値を超えた明るさ」を見るので、1 を超えた情報が残っているリニアの段階でないと意味がありません。SMAA は隣の画素との色の差で輪郭を推定するので、人の感覚に近い sRGB のほうが暗部の輪郭を拾えます。その効果がどの目盛りで意味を持つかで、置き場所が決まります。',
    },
  ],
};
