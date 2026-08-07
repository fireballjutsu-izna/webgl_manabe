import type { Chapter } from '../types.ts';

export const chapterQ06: Chapter = {
  slug: 'q05-ship-it',
  part: 'polish',
  number: 9,
  title: 'アプリにする',
  goal: '端末に合わせて品質を落とせるようになり、作ったものを人に見せられる形で公開できるようになります。',
  requires: ['q04-custom-pass', 'p08-city-motion'],
  threeApis: [
    'WebGLRenderer.setPixelRatio',
    'WebGLRenderer.shadowMap',
    'WebGLRenderer.info',
    'WebGLRenderer.dispose',
    'EffectComposer',
    'Object3D.traverse',
    'Clock',
  ],
  mathRecall: [
    { slug: 'p07-city-light', note: '1 つの値から全部を導く ― もう一度やります' },
    { slug: 't11-performance', note: '数字を見てから直す' },
    { slug: 'q03-postprocess', note: '重い設定をどこで切るか' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## デモと、人に見せられるものの差

ここまでで作ったものは、**自分のパソコンの、自分のブラウザでは**よく動きます。
公開するとなると、あと 5 つ必要になります。

- **端末に合わせて品質を落とせること**（これがいちばん大きい）
- **読み込み中に何かが見えていること**
- **触り方が分かること**（マウスが無い人も含めて）
- **動かない環境で、壊れないこと**
- **公開する手順があること**

どれも派手ではありませんが、**これが無いと「見せられない」**ので、最後にまとめてやります。
`,
    },
    {
      kind: 'md',
      text: `
## 品質は、1つの値から導く

[](#/ch/p07-city-light)で「時刻という 1 つの値から、光も空も影も窓も導く」とやりました。
**まったく同じ考え方**を、品質設定にも使います。

「影は入れる？ ポストプロセスは？ ピクセル比は？」を**別々に持たない。**
持つのは **\`quality\`（低・中・高）だけ**にして、残りは全部そこから決めます。

こうしておくと、後から「モバイルは自動で低にする」を**1 行**で足せます。
別々に持っていたら、判定を 5 か所に書くことになります。
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
      kind: 'callout',
      tone: 'warn',
      title: '端末の判定を当てにしすぎない',
      text: `
\`hardwareConcurrency\` も \`pointer: coarse\` も、**あくまで目安**です。
高性能なタブレットもあれば、非力なノートパソコンもあります。

だから **推測は初期値にだけ使い、切り替えは必ず人が選べるように**してください。
「重い」と感じた人が自分で下げられれば、推測が外れても困りません。

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
        '「低」に切り替えると影とブルームが消え、ピクセル比が 1 になります。**1 フレームの時間が目に見えて短くなります。** 見た目は確かに落ちますが、動かない 60 点より、動く 80 点のほうが人に見せられます。切り替えているのは `applyQuality` の中だけで、`quality` という 1 つの値から全部が決まっていることに注目してください。',
    },
    {
      kind: 'md',
      text: `
## 読み込み中に、何を見せるか

[](#/ch/x09-surface-bake)の惑星は、テクスチャの生成に数百ミリ秒かかりました。
そのあいだ画面が真っ白だと、**壊れていると思われます。**

順番はこうです。

- **まず何か描く。** 背景色だけでもいい。**キャンバスが出ていること**が大事
- **次に軽いものを出す。** 星空・地面・箱
- **重い生成は、そのあとで。** 1 フレーム描いてから始める

「1 フレーム描いてから」は、\`requestAnimationFrame\` を 1 回はさむだけです。
これをやるかどうかで、体感がまるで違います。
`,
    },
    {
      kind: 'code',
      title: '重い処理は、1フレーム描いてから',
      code: `// 悪い例：生成が終わるまで画面は真っ白のまま
// const maps = createMaps();
// renderer.render(scene, camera);

// よい例：先に1枚描いて、それから重い処理へ
renderer.render(scene, camera);

requestAnimationFrame(() => {
  const maps = createMaps();          // ここで数百ミリ秒
  planet.material.map = maps.colorMap;
  planet.material.needsUpdate = true;
  animate();
});`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'もっと本格的にやるなら',
      text: `
生成そのものを別のスレッドへ逃がせます。\`OffscreenCanvas\` と Web Worker を使うと、
**テクスチャを作っているあいだも画面が動き続けます。**

ただし、まずは「1 フレーム描いてから始める」だけで十分なことが多いです。
**体感を良くする工夫は、安い順に試してください。**
`,
    },
    {
      kind: 'md',
      text: `
## 触り方が分かるようにする

3D の画面は、**触れることが見た目から分かりません。** 少なくともこの 3 つを入れてください。

- **一言の案内。** 「ドラッグで回転」の 1 行があるだけで、触ってもらえる率が変わります
  （このサイトのデモが右下に出しているものです）
- **キーボードでも動かせるように。** マウスが使えない人がいます。
  矢印キーでカメラを回すだけでも、まったく触れないよりずっとよい
- **\`prefers-reduced-motion\` を尊重する。** 自動で動き続ける画面が
  つらい人がいます。動きを止めても**中身が伝わる**ように作ってください

3 つめは「配慮」ではなく**設計の問題**です。
自動回転しないと何も分からない画面は、そもそも情報が足りていません。
`,
    },
    {
      kind: 'code',
      title: '動きを減らす設定を見る',
      code: `const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // 自動で動くものだけを止める。手で操作するぶんは残す
  if (!reduceMotion) {
    planet.rotation.y += dt * 0.05;
  }

  controls.update();
  renderer.render(scene, camera);
}`,
    },
    {
      kind: 'md',
      text: `
## 動かない環境で、壊れないようにする

WebGL が使えない環境は、いまでも存在します。古い端末、無効化された設定、
省電力モード、GPU のドライバの問題。

**何も出ないより、理由が出るほうがずっとよい**です。

\`WebGLRenderer\` の生成は、使えない環境では例外を投げます。
囲っておいて、代わりのものを出してください。
`,
    },
    {
      kind: 'code',
      title: '使えないときに、何か見せる',
      code: `let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (error) {
  const notice = document.createElement('p');
  notice.textContent =
    'この環境では 3D を表示できませんでした。' +
    'ブラウザの設定でハードウェアアクセラレーションが有効か確認してください。';
  document.body.appendChild(notice);
  throw error;   // ここで止める（以降のコードは動かせない）
}

// コンテキストが途中で失われることもある（タブの復帰、GPU の再起動など）
renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();   // これを呼ぶと、復帰の望みが残る
  console.warn('WebGL のコンテキストが失われました');
});`,
    },
    {
      kind: 'md',
      text: `
## 公開する

Vite で作った静的なサイトなら、手順は短いです。

- \`npm run build\` で \`dist/\` ができる
- \`dist/\` をそのまま置ける場所へ上げる（GitHub Pages / Netlify / Cloudflare Pages など）
- サブディレクトリで配信するなら、\`vite.config.ts\` の \`base\` を合わせる

**このサイト自身も、まったく同じ作りです。** \`base\` を \`/webgl_manabe/\` にして、
\`main\` に push すると GitHub Actions が \`dist/\` を Pages へ送っています。

公開したあとに必ずやることを 3 つ。

- **スマートフォンで開く。** ここで初めて分かることが多い
- **初回の読み込み時間を測る。** three は圧縮しても 180KB ほどあります
- **人に触ってもらう。** 作った本人は、操作方法を知っているので気づけません
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'ページを離れるときの後片付け',
      text: `
1 ページに 3D を埋め込む場合、**離れるときに解放**してください。
ブラウザが同時に持てる WebGL の枠は 8〜16 個しかありません（[](#/ch/t10-scene-graph)）。

\`renderer.dispose()\` に加えて、ジオメトリ・マテリアル・テクスチャも
\`scene.traverse()\` でたどって解放します。
このサイトの \`src/three/stage.ts\` が、まさにそれをやっている実物です。
`,
    },
    {
      kind: 'md',
      text: `
## 第4部で手に入れたもの

- **[](#/ch/q01-environment)** … 映り込み。金属が黒い理由と、素材なしで環境マップを作る方法
- **[](#/ch/q02-color)** … 色の通り道。リニアと sRGB、そしてトーンマッピング
- **[](#/ch/q03-postprocess)** … ポストプロセス。3 点セットと、\`OutputPass\` を忘れたときの壊れ方
- **[](#/ch/q04-custom-pass)** … 自前のパス。フラグメントシェーダの知識が、そのまま画面加工になる
- **[](#/ch/q05-r3f)** … R3F。同じ three を React から組み立てる、もうひとつの書き方
- **[](#/ch/q05-ship-it)** … 品質・読み込み・触り方・公開

**この 6 章は、どれも「新しく作る」話ではありませんでした。**
すでに作ったものに 3 行足す、設定を 1 か所にまとめる、順番を直す。
仕上げとは、そういう作業です。
`,
    },
    {
      kind: 'md',
      text: `
## そして、ここまで

全42章、おつかれさまでした。

始まりは「Three.js は箱を 1 つ出すところまでは簡単だが、その先で数学の壁にぶつかる」でした。
いま振り返ると、こういう道のりでした。

- **第1部** … 壁をこえるための数学だけを、スライダーを動かしながら
- **第2部** … その数学を、実際に動く Three.js のコードに
- **第3部** … 素材を 1 つも使わずに、作品を 2 つ最初から最後まで
- **第4部** … それを、人に見せられる形に

**数式を覚えることは、最後まで一度も求めませんでした。**
かわりに、内積が大気の縁と昼夜の境目になり、三角関数が軌道と太陽の高さになり、
補間がカメラの寄りと空の色になり、行列が数百のインスタンスの配置になるところまで見ました。

「3 つ並んでいたらベクトルだと思ってしまう人になるための場所です」と、
ホームに書いてありました。**もう、そうなっているはずです。**
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ここから先へ',
      text: `
このサイトが扱わなかったもので、次に面白いところを挙げておきます。

- **アニメーション**（\`AnimationMixer\`・スキニング）… キャラクターを動かす
- **物理エンジン**（Rapier、cannon-es）… 落ちる・当たる・積み上がる
- **WebGPU と TSL** … three の次の描画方式。ノードでシェーダを組み立てる
- **レイマーチング** … 面ではなく距離の場で形を描く。[](#/ch/t14-fragment-shader) の先にある世界

どれも入口は違いますが、**土台は同じ**です。
ベクトル・内積・行列・投影・法線 ― ここまでで手に入れたものが、そのまま効きます。

そして何より、**作りたいものを 1 行で書いてから始めてください。**
[](#/ch/p01-planet-setup)でやったとおりです。
`,
    },
  ],
  exercises: [
    {
      prompt: '品質のプリセットを「低」「中」「高」と切り替えて、フレーム時間の読み出しを見比べてください。**いちばん効いている設定はどれ**でしょう。',
      hint: '1 つずつ戻して、どれを戻したときに数字が動くかを見てください。',
      answer: `多くの環境で、いちばん効くのは**画素の数**（\`setPixelRatio\` と解像度）です。
影の解像度やポストプロセスの有無も効きますが、画素数は**画面の全部に掛かる**ので桁が違います。
「重い」と言われたら、まず \`setPixelRatio\` の上限を下げてみてください。
見た目の劣化のわりに、いちばん大きく戻ってきます。`,
    },
    {
      prompt: `端末の性能を推測して品質を決める部分は、**初期値を選ぶためだけ**に使い、そのあとは人が切り替えられるようにしてあります。
推測した値をそのまま固定してはいけないのはなぜでしょう。`,
      hint: '推測が当たる保証はどこにもありません。',
      answer: `推測は**外れるから**です。同じ機種でも、電源につながっているか、ほかに何が動いているか、
外部ディスプレイをつないでいるかで、出せる性能はまったく変わります。
コア数や画面の大きさから分かるのは大まかな傾向だけです。
**推測は初期値に、決定は人に。** 「重い」と感じた人が自分で下げられれば、推測が外れても行き止まりになりません。`,
    },
    {
      prompt: 'WebGL が使えない環境で開かれたとき、何を出すべきでしょうか。真っ白なページを出さないために、どこに手を入れますか。',
      hint: 'renderer を作るところで例外が出ます。',
      answer: `\`WebGLRenderer\` の生成を \`try / catch\` で囲み、失敗したら**普通の HTML で説明を出します**。
「このページは 3D を使います。対応した環境で開き直してください」と、できれば静止画やテキストの代替を添えて。
何も出ないページは、故障と区別が付きません。
これは \`prefers-reduced-motion\` やキーボード操作と同じで、**届く相手を増やすための最後の 1 手**です。`,
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
        '`quality` という 1 つの値だけを持ち、残りをそこから導けば、切り替えは 1 か所で済みます。第3部で「時刻 1 つから光・空・影・窓を導く」とやったのと、まったく同じ考え方です。',
    },
    {
      q: '重いテクスチャ生成を始める前にやるべきことはどれですか。',
      choices: [
        '先に1フレーム描いて、キャンバスに何かを出しておく',
        'テクスチャの解像度を上げる',
        'ピクセル比を上げる',
        '生成を try/catch で囲む',
      ],
      answer: 0,
      explain:
        '生成中は画面が固まるので、その前に何も出ていないと「壊れている」と思われます。`requestAnimationFrame` を 1 回はさんで、1 枚描いてから重い処理へ入るだけで体感が変わります。もっと本格的にやるなら OffscreenCanvas と Web Worker です。',
    },
    {
      q: '`prefers-reduced-motion: reduce` のとき、止めるべきものはどれですか。',
      choices: [
        '自動で動き続けるもの。手で操作する動きは残す',
        'すべての描画',
        'マウス操作への反応',
        '影とポストプロセス',
      ],
      answer: 0,
      explain:
        '止めるのは「勝手に動くもの」です。操作への反応まで止めると、ただ使えない画面になります。あわせて、動きを止めても中身が伝わるかを確認してください。自動回転しないと何も分からない画面は、そもそも情報が足りていません。',
    },
  ],
};
