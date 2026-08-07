import type { Chapter } from '../types.ts';

export const chapterQ06: Chapter = {
  slug: 'q05-ship-it',
  part: 'polish',
  number: 19,
  title: '品質は、1 つの値から導く',
  goal: '端末に合わせて品質を落とせるようになり、どの設定がいちばん効くのかを、画素数の勘定から説明できるようになります。',
  requires: ['y18-r3f-decide', 'x39-city-finish'],
  threeApis: [
    'WebGLRenderer.setPixelRatio',
    'WebGLRenderer.shadowMap',
    'WebGLRenderer.info',
    'EffectComposer',
    'Clock',
  ],
  mathRecall: [
    { slug: 'p07-city-light', note: '$1$ つの値から全部を導く ― もう一度やります' },
    { slug: 'w44-gpu-cost', note: '数字を見てから直す' },
    { slug: 'y11-postprocess-cost', note: '重い設定をどこで切るか' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## デモと、人に見せられるものの差

ここまでで作ったものは、**自分のパソコンの、自分のブラウザでは**よく動きます。
公開するとなると、あと $5$ つ必要になります。

- **端末に合わせて品質を落とせること**（これがいちばん大きい）
- **読み込み中に何かが見えていること**
- **触り方が分かること**（マウスが無い人も含めて）
- **動かない環境で、壊れないこと**
- **公開する手順があること**

どれも派手ではありませんが、**これが無いと「見せられない」**ので、最後の $4$ 章でまとめてやります。
この章は $1$ つめ ― いちばん効くところです。
`,
    },
    {
      kind: 'md',
      text: `
## 品質は、1 つの値から導く

[](#/ch/p07-city-light)で「時刻という $1$ つの値から、光も空も影も窓も導く」とやりました。
**まったく同じ考え方**を、品質設定にも使います。

「影は入れる？ ポストプロセスは？ ピクセル比は？」を**別々に持たない。**
持つのは **\`quality\`（低・中・高）だけ**にして、残りは全部そこから決めます。

こうしておくと、後から「モバイルは自動で低にする」を**$1$ 行**で足せます。
別々に持っていたら、判定を $5$ か所に書くことになります。
`,
    },
    {
      kind: 'code',
      title: '設定を1か所にまとめる',
      code: `const PRESETS = {
  low:    { pixelRatio: 1,   shadows: false, shadowMap: 512,  post: false, antialias: false },
  medium: { pixelRatio: 1.5, shadows: true,  shadowMap: 1024, post: false, antialias: true },
  high:   { pixelRatio: 2,   shadows: true,  shadowMap: 2048, post: true,  antialias: true },
};

// 端末を見て、初期値を決める
function guessQuality() {
  const coarse = matchMedia('(pointer: coarse)').matches;   // 指で触る端末
  const cores = navigator.hardwareConcurrency ?? 4;
  if (coarse || cores <= 4) return 'low';
  return cores >= 8 ? 'high' : 'medium';
}`,
    },
    {
      kind: 'formula',
      tex: 'N = W \\times H \\times r^{2}',
      readAloud:
        '画面が実際に処理する画素の数 $N$ は、$CSS$ 上の幅 $W$ ・高さ $H$ に、ピクセル比 $r$ の $2$ 乗を掛けたもの、と読みます。$2$ 乗なので、ピクセル比を少し下げるだけで大きく効きます。',
      worked: {
        given:
          '$1920 \\times 1080$ の画面で、ピクセル比を $2$ から下げていきます。$\\mathrm{Retina}$ の端末を思い浮かべてください。',
        steps: [
          { calc: 'r = 2   : 1920 x 1080 x 4 = 8,294,400 画素' },
          { calc: 'r = 1.5 : 1920 x 1080 x 2.25 = 4,665,600 画素', note: '$44\\%$ 減' },
          { calc: 'r = 1   : 1920 x 1080 x 1 = 2,073,600 画素', note: '$75\\%$ 減' },
          { calc: '影のマップ 2048 x 2048 = 4,194,304 画素' },
          { calc: '  1024 に下げると 1,048,576 画素', note: '$75\\%$ 減' },
          { calc: 'ただし影は 1 枚。画面は毎フレーム全部' },
        ],
        result:
          '**ピクセル比を $2$ から $1$ にすると、画素が $4$ 分の $1$ になります。** 影のマップを $2048$ から $1024$ に落としても同じ $4$ 分の $1$ ですが、**減る絶対数が違います** ― 画面は $622$ 万画素減り、影のマップは $315$ 万画素減るだけ。しかも[](#/ch/y11-postprocess-cost)で見たとおり、ポストプロセスの帯域は**画面の画素数にパスの数を掛けた**ものです。$4$ パスなら $r = 2$ で $31.9\\ \\mathrm{GB/s}$、$r = 1$ なら $7.96\\ \\mathrm{GB/s}$。**削るなら、まずピクセル比**です。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '端末の判定を当てにしすぎない',
      text: `
\`hardwareConcurrency\` も \`pointer: coarse\` も、**あくまで目安**です。
高性能なタブレットもあれば、非力なノートパソコンもあります。

同じ機種でも、

- **電源につながっているか。** 電池駆動では $GPU$ の上限が下がります
- **ほかに何が動いているか**
- **外部ディスプレイをつないでいるか。** 画素数が一気に増えます

だから **推測は初期値にだけ使い、切り替えは必ず人が選べるように**してください。
「重い」と感じた人が自分で下げられれば、推測が外れても行き止まりになりません。

さらに堅くするなら、**最初の数秒のフレーム時間を測って、遅ければ自動で下げる**方法もあります。
ただし勝手に変わると驚かれるので、変えたことを画面に出すのを忘れずに。
`,
    },
    {
      kind: 'sandbox',
      title: '品質を切り替える',
      guide: { focus: ['設定は1か所だけ', '1つの値から、全部を決める'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ---- 設定は1か所だけ ---- */

const PRESETS = {
  low:    { pixelRatio: 1,   shadows: false, shadowMap: 512,  post: false },
  medium: { pixelRatio: 1.5, shadows: true,  shadowMap: 1024, post: false },
  high:   { pixelRatio: 2,   shadows: true,  shadowMap: 2048, post: true  },
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e121c);
scene.fog = new THREE.Fog(0x0e121c, 20, 90);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 200);
camera.position.set(-14, 9, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2, 0);
controls.maxPolarAngle = Math.PI * 0.495;

const sun = new THREE.DirectionalLight(0xfff0dd, 3);
sun.position.set(10, 16, 8);
sun.shadow.camera.left = -16;
sun.shadow.camera.right = 16;
sun.shadow.camera.top = 16;
sun.shadow.camera.bottom = -16;
sun.shadow.bias = -0.0006;
scene.add(sun, new THREE.HemisphereLight(0x8fa8ff, 0x202430, 0.7));

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ color: 0x3c4150, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x8d94a8, roughness: 0.6 });
for (let i = 0; i < 40; i++) {
  const h = 1 + (i % 7) * 1.3;
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.scale.set(1.4, h, 1.4);
  box.position.set(((i % 8) - 3.5) * 3.2, h / 2, (Math.floor(i / 8) - 2) * 3.2);
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
}

const lamp = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 24, 16),
  new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4, 2) }),
);
lamp.position.set(0, 7, 0);
scene.add(lamp);

/* ---- ポストプロセスは、使うときだけ組み立てる ---- */

let composer = null;

function buildComposer() {
  const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
  const target = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: THREE.HalfFloatType,
    samples: 4,
  });
  const made = new EffectComposer(renderer, target);
  made.setPixelRatio(renderer.getPixelRatio());
  made.setSize(size.x, size.y);
  made.addPass(new RenderPass(scene, camera));
  made.addPass(new UnrealBloomPass(size, 0.6, 0.5, 0.9));
  made.addPass(new OutputPass());
  return made;
}

/* ---- 1つの値から、全部を決める ---- */

let quality = 'high';

function applyQuality(name) {
  quality = name;
  const preset = PRESETS[name];

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatio));
  renderer.shadowMap.enabled = preset.shadows;
  sun.castShadow = preset.shadows;
  sun.shadow.mapSize.set(preset.shadowMap, preset.shadowMap);

  // 影の設定を変えたら、作り直させるために古いものを捨てる
  if (sun.shadow.map) {
    sun.shadow.map.dispose();
    sun.shadow.map = null;
  }
  // マテリアルにも、影を使うかどうかの変更を伝える
  boxMaterial.needsUpdate = true;
  ground.material.needsUpdate = true;

  if (preset.post && !composer) composer = buildComposer();
  if (!preset.post && composer) {
    composer.dispose();
    composer = null;
  }
  if (composer) composer.setPixelRatio(renderer.getPixelRatio());
}

/* ---- 画面 ---- */

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#e8e8f2; font:12px monospace;' +
  'pointer-events:none; white-space:pre;';
document.body.appendChild(readout);

function addButton(text, left, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText =
    'position:absolute; bottom:70px; left:' + left + 'px; padding:6px 12px;' +
    'background:#12121f; color:#e8e8f2; border:1px solid #3a3a5c; border-radius:6px;' +
    'font:12px sans-serif; cursor:pointer;';
  button.addEventListener('click', onClick);
  document.body.appendChild(button);
}

addButton('低', 12, () => applyQuality('low'));
addButton('中', 62, () => applyQuality('medium'));
addButton('高', 112, () => applyQuality('high'));

// 推測は初期値にだけ使う。切り替えは人に任せる
const coarse = matchMedia('(pointer: coarse)').matches;
const cores = navigator.hardwareConcurrency || 4;
applyQuality(coarse || cores <= 4 ? 'low' : cores >= 8 ? 'high' : 'medium');

/* ---- ループ。フレーム時間も測る ---- */

const clock = new THREE.Clock();
let smoothed = 16;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  smoothed += (dt * 1000 - smoothed) * 0.05;   // なめらかに平均する

  controls.update();
  if (composer) composer.render();
  else renderer.render(scene, camera);

  const info = renderer.info.render;
  readout.textContent =
    '品質 ' + quality +
    '\\nピクセル比 ' + renderer.getPixelRatio().toFixed(2) +
    ' / 影 ' + (renderer.shadowMap.enabled ? 'あり' : 'なし') +
    ' / ポスト ' + (composer ? 'あり' : 'なし') +
    '\\n1 フレーム ' + smoothed.toFixed(1) + ' ms（ドローコール ' + info.calls + '）';
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '「低」に切り替えると影とブルームが消え、ピクセル比が 1 になります。**1 フレームの時間が目に見えて短くなります。** 見た目は確かに落ちますが、動かない 60 点より、動く 80 点のほうが人に見せられます。切り替えているのは `applyQuality` の中だけで、`quality` という 1 つの値から全部が決まっていることに注目してください。3 つのボタンを往復しながら、どの設定を戻したときに数字が動くかを見てください。',
    },
    {
      kind: 'md',
      text: `
## この先の 3 章

- **[](#/ch/y20-loading)** … 読み込み中に、何を見せるか
- **[](#/ch/y21-reach)** … 届く相手を増やす。触り方・キーボード・壊れない
- **[](#/ch/y22-publish)** … 公開する。そして、ここまでの振り返り

どれも「新しく作る」話ではありません。
**すでに作ったものに、$3$ 行足す**話です。
`,
    },
  ],
  exercises: [
    {
      prompt: `品質のプリセットを「低」「中」「高」と切り替えて、フレーム時間の読み出しを見比べてください。

**いちばん効いている設定はどれ**でしょう。`,
      hint: '$1$ つずつ戻して、どれを戻したときに数字が動くかを見てください。',
      answer: `**多くの環境で、いちばん効くのは画素の数です。**

**なぜ桁が違うのか**

画素数は $N = W \\times H \\times r^{2}$ ― **ピクセル比の $2$ 乗**で効きます。

$1920 \\times 1080$ で、

- $r = 2$ … $829$ 万画素
- $r = 1$ … $207$ 万画素

**$622$ 万画素の差**です。しかも**毎フレーム**。

**ほかの設定と比べる**

- **影のマップ $2048 \\to 1024$** … $419$ 万 $\\to 105$ 万画素。$315$ 万減
  ただし影は**光源ごとに $1$ 枚**で、画面の全画素に掛かるわけではありません
- **ポストプロセスを切る** … [](#/ch/y11-postprocess-cost)の帯域がまるごと消える。
  これも大きいが、**そもそも画素数に比例**しています

**つまり**

ポストプロセスの重さも、ピクセル比を下げれば一緒に $4$ 分の $1$ になります。

**画素数は、ほかの全部に掛かる係数**です。

**手順**

「重い」と言われたら、まず \`setPixelRatio\` の上限を下げてください。

見た目の劣化のわりに、いちばん大きく戻ってきます。`,
    },
    {
      prompt: `端末の性能を推測して品質を決める部分は、**初期値を選ぶためだけ**に使っています。

推測した値をそのまま固定してはいけないのは、なぜでしょう。`,
      hint: '推測が当たる保証は、どこにありますか。',
      answer: `**推測は外れるからです。**

**同じ機種でも変わるもの**

- **電源。** 電池駆動では $GPU$ の上限が下がります
- **同時に動いているもの。** 別のタブが $GPU$ を使っていれば、その分減ります
- **外部ディスプレイ。** つないだ瞬間に画素数が跳ね上がります
- **ブラウザ。** 同じ端末でも実装が違います

\`hardwareConcurrency\` が返すのは $CPU$ の論理コア数で、
**$GPU$ の性能とは直接関係ありません。**

$8$ コアの非力な内蔵 $GPU$ もあれば、$4$ コアで強い $GPU$ もあります。

**\`pointer: coarse\` も同じ**

指で触る端末というだけで、性能の話ではありません。
高性能なタブレットは、これに引っかかります。

**だから**

**推測は初期値に、決定は人に。**

「重い」と感じた人が自分で下げられれば、推測が外れても行き止まりになりません。

**逆もある**

推測で「低」にされた高性能な端末の人は、**きれいな絵を見る機会を奪われています。**

上げる方向にも動かせることが大事です。`,
    },
    {
      prompt: `\`applyQuality\` の中で、影の設定を変えたあとに \`sun.shadow.map\` を捨てています。

なぜ必要なのでしょう。`,
      hint: '$\\mathrm{mapSize}$ を変えただけで、すでにあるテクスチャの大きさは変わりますか。',
      answer: `**すでに確保されたテクスチャは、大きさを変えられないからです。**

**何が起きているか**

\`sun.shadow.mapSize.set(1024, 1024)\` は、**次に作るときの大きさ**を指定するだけです。

すでに \`sun.shadow.map\` に $2048$ のレンダーターゲットがあれば、
three はそれを**そのまま使い続けます。**

**だから捨てる**

- \`sun.shadow.map.dispose()\` で $GPU$ のメモリを返す
- \`sun.shadow.map = null\` で「無い」状態にする

次のフレームで three が**新しい大きさで作り直します。**

**\`needsUpdate\` のほうは何か**

\`boxMaterial.needsUpdate = true\` は、**シェーダを組み直させる**ためです。

影を使うかどうかで、シェーダのコードそのものが変わります
（\`#define USE_SHADOWMAP\` が付くかどうか）。

材質の値ではなく**構成**が変わったので、作り直しが要ります。

**共通しているのは**

**「作るときに決まって、あとから変えられないもの」がある**ということです。

[](#/ch/y17-r3f-map)の \`args\` と、まったく同じ話です。`,
    },
  ],
  quiz: [
    {
      q: '品質設定を「影を出すか」「ポストプロセスを使うか」などバラバラに持つと、何が困りますか。',
      choices: [
        '「モバイルは自動で低品質にする」を足すとき、判定を何か所にも書くことになる',
        '描画が重くなる',
        'メモリが増える',
        '影が出なくなる',
      ],
      answer: 0,
      explain:
        'quality という 1 つの値だけを持ち、残りをそこから導けば、切り替えは 1 か所で済みます。第4部で「時刻 1 つから光・空・影・窓を導く」とやったのと、まったく同じ考え方です。',
    },
    {
      q: '重いと言われたとき、まず下げるべき設定はどれですか。',
      choices: [
        'ピクセル比。画素数は 2 乗で効き、ほかの全部に掛かる係数だから',
        '影のマップの解像度',
        'ライトの数',
        'ジオメトリの分割数',
      ],
      answer: 0,
      explain:
        'N = W × H × r² なので、1920 × 1080 でピクセル比 2 → 1 は 829 万画素 → 207 万画素、622 万画素の差です。しかも毎フレーム。ポストプロセスの帯域も画素数に比例するので、ピクセル比を下げればそちらも一緒に 4 分の 1 になります。',
    },
    {
      q: '端末の性能を推測して品質を決めるとき、正しいのはどれですか。',
      choices: [
        '推測は初期値にだけ使い、切り替えは人ができるようにする',
        '推測した値で固定する',
        '推測せず、つねに最高品質にする',
        '推測せず、つねに最低品質にする',
      ],
      answer: 0,
      explain:
        'hardwareConcurrency は CPU の論理コア数で、GPU の性能とは直接関係ありません。電源、他タブ、外部ディスプレイでも変わります。推測で「低」に固定された高性能な端末の人は、きれいな絵を見る機会を奪われる ― 上げる方向にも動かせることが大事です。',
    },
  ],
};
