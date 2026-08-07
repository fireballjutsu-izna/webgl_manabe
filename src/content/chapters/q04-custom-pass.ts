import type { Chapter } from '../types.ts';

export const chapterQ04: Chapter = {
  slug: 'q04-custom-pass',
  part: 'polish',
  number: 12,
  title: '自分でパスを書く',
  goal: '画面全体に自分の効果をかけられるようになり、フラグメントシェーダの知識をそのまま画面加工に使えるようになります。',
  requires: ['q03-postprocess', 't14-fragment-shader'],
  threeApis: [
    'ShaderPass',
    'EffectComposer',
    'RenderPass',
    'OutputPass',
    'ShaderMaterial',
    'Uniform',
    'Vector2',
  ],
  mathRecall: [
    { slug: 't14-fragment-shader', note: '画素ごとに色を決める。ここでは材料が「絵」になる' },
    { slug: 't12-shader-intro', note: 'uniform で値を渡す' },
    { slug: 'q03-postprocess', note: 'パスの順番と OutputPass' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 材料が「絵」になっただけ

用意されたパスを並べるところまで来ました。ここからは**自分で書きます。**

とはいえ、新しく覚えることはほとんどありません。
[](#/ch/t14-fragment-shader)で書いたものと**構造は同じ**です。

- あのときは … 3D の面の上で、その画素の色を決めた
- ここでは … **画面いっぱいの板**の上で、その画素の色を決める

ちがうのは、材料に「**さっき描いた絵**」が \`tDiffuse\` という名前で渡ってくることだけです。
`,
    },
    {
      kind: 'md',
      text: `
## ShaderPass の型

\`ShaderPass\` に渡すのは、\`uniforms\` と 2 つのシェーダを持つ**ただのオブジェクト**です。
決まりごとは 2 つだけ。

- **\`uniforms\` に \`tDiffuse\` を用意する。** ここに前のパスの結果が入ってきます（値は \`null\` でよい）
- **頂点シェーダは \`vUv\` を渡すだけ。** どのパスでも同じ内容なので、書き写して構いません
`,
    },
    {
      kind: 'code',
      title: '自前パスのひな形',
      code: `const myPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },   // ← 前のパスの結果が自動で入る。名前は固定
    uAmount: { value: 0.5 },     // ← 自分で好きに足せる
  },
  vertexShader: \`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  \`,
  fragmentShader: \`
    uniform sampler2D tDiffuse;
    uniform float uAmount;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);   // いまの画素の色を読む
      gl_FragColor = color;
    }
  \`,
});

composer.addPass(myPass);   // RenderPass と OutputPass のあいだに挟む`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'ここでもリニアのままです',
      text: `
自前パスに届く色は**リニア**です（[](#/ch/q02-color)の話）。
sRGB への変換は最後の \`OutputPass\` がやります。

だから「見た目の明るさ」を基準に係数を決めると、思ったより効きすぎます。
**0.5 を掛けても、見た目は半分にはなりません**（見た目では 0.73 くらいになります）。
数字は実際に見ながら決めてください。
`,
    },
    {
      kind: 'md',
      text: `
## 同じ画素を読む効果 ― ビネット・色調・走査線

まずは**その画素の色だけ**を材料にする効果です。3 つ組み合わせます。

- **ビネット** … 画面の中心からの距離で暗くする。視線を中央に集める
- **彩度** … 灰色（明るさだけの色）との混ぜ具合を変える。1 を超えると鮮やかに
- **走査線** … \`sin\` で細かい横縞を作る。古い画面の質感

どれも 1〜2 行です。**距離は \`distance(vUv, vec2(0.5))\`、明るさは \`dot(color.rgb, 重み)\`。**
[](#/ch/02-vector)と[](#/ch/03-dot)がここでも顔を出します。
`,
    },
    {
      kind: 'formula',
      tex: 'Y = 0.2126\\,R + 0.7152\\,G + 0.0722\\,B',
      readAloud:
        '色から明るさを取り出す式です。緑がいちばん重く、青がいちばん軽い。人間の目が緑に敏感だからです。単純に3で割った平均にすると、赤や青が不自然に明るくなります。彩度を変えるときは、この明るさとの混ぜ具合をいじります。',
      worked: {
        given: '純粋な赤・緑・青の明るさを、それぞれ計算します。',
        steps: [
          { calc: '赤 (1,0,0) : 0.2126 x 1 = 0.2126' },
          { calc: '緑 (0,1,0) : 0.7152 x 1 = 0.7152' },
          { calc: '青 (0,0,1) : 0.0722 x 1 = 0.0722' },
          { calc: '単純な平均なら、どれも 0.333' },
        ],
        result: '**緑は青の約 10 倍明るく見えます。** 単純平均で白黒にすると、青い空が不自然に明るく、緑の草が沈んだ写真になります。彩度を変えるときも同じで、この $Y$ と元の色を混ぜる割合をいじります ― $0$ でこの $Y$ そのもの（白黒）、$1$ で元の色、$2$ で派手になります。',
      },
    },
    {
      kind: 'sandbox',
      title: '自分の効果を1つ書く',
      guide: { focus: ['自前のパス'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ---- ここを書き換えて試してください ---- */
const VIGNETTE = 0.8;    // 周辺を暗くする量（0 で無効）
const SATURATION = 1.3;  // 1 でそのまま、0 で白黒、2 で派手
const SCANLINE = 0.10;   // 走査線の濃さ（0 で無効）

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10131c);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(2.5, 2.2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const sun = new THREE.DirectionalLight(0xfff0dd, 3);
sun.position.set(4, 6, 3);
scene.add(sun, new THREE.HemisphereLight(0x9db8ff, 0x2a2a33, 0.7));

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x4a4f5e, roughness: 0.9 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
scene.add(floor);

const colors = [0xff6b8a, 0x4fd6ff, 0xffd166, 0x7cf5a0, 0xb57bff];
for (let i = 0; i < 5; i++) {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1 + i * 0.35, 1),
    new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.45 }),
  );
  box.position.set((i - 2) * 1.5, (1 + i * 0.35) / 2 - 1, 0);
  scene.add(box);
}

/* ---- 自前のパス ---- */

const filmPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },       // 前のパスの結果。名前は固定
    uVignette: { value: VIGNETTE },
    uSaturation: { value: SATURATION },
    uScanline: { value: SCANLINE },
    uTime: { value: 0 },
  },
  vertexShader: [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}',
  ].join('\\n'),
  fragmentShader: [
    'uniform sampler2D tDiffuse;',
    'uniform float uVignette;',
    'uniform float uSaturation;',
    'uniform float uScanline;',
    'uniform float uTime;',
    'varying vec2 vUv;',
    'void main() {',
    '  vec4 color = texture2D(tDiffuse, vUv);',
    '',
    '  // (1) ビネット。中心からの距離で暗くする',
    '  float d = distance(vUv, vec2(0.5));',
    '  color.rgb *= 1.0 - smoothstep(0.35, 0.85, d) * uVignette;',
    '',
    '  // (2) 彩度。明るさとの混ぜ具合を変えるだけ',
    '  float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));',
    '  color.rgb = mix(vec3(luma), color.rgb, uSaturation);',
    '',
    '  // (3) 走査線。ゆっくり流す',
    '  float scan = sin((vUv.y + uTime * 0.04) * 700.0) * 0.5 + 0.5;',
    '  color.rgb *= 1.0 - scan * uScanline;',
    '',
    '  gl_FragColor = color;',
    '}',
  ].join('\\n'),
});

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(
  window.innerWidth, window.innerHeight,
  { type: THREE.HalfFloatType, samples: 4 },
));
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(filmPass);
composer.addPass(new OutputPass());   // 最後は必ずこれ

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  filmPass.uniforms.uTime.value = clock.getElapsedTime();
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
        '`SATURATION` を 0 にすると白黒、2.2 にすると毒々しくなります。`VIGNETTE` を 0 にすると周辺が暗くならず、絵が締まらないのが分かります。`700.0` を 90.0 にすると走査線が太くなり、一気に「壊れたモニタ」の質感になります。3 つとも `gl_FragColor` に届くまでの 2〜3 行ずつしかありません。',
    },
    {
      kind: 'md',
      text: `
## 別の画素を読む ― ここからが本番

さっきの 3 つは、**いま処理している画素の色**しか読んでいませんでした。
\`texture2D(tDiffuse, vUv)\` の \`vUv\` が固定だったからです。

**ここをずらすと、できることが一気に増えます。**

- 少しずらして読む → **ぼかし・にじみ・ずれ**
- 中心へ向かってずらす → **放射状のブラー**
- 赤・緑・青を**別々の量だけ**ずらす → **色収差**（レンズの色ずれ）

色収差は、実際のレンズが**色によって曲がり方が違う**ために起きる現象です。
画面の端ほど強く出ます。**わずかに入れると「写真らしさ」が出る**ので、映像でよく使われます。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathbf{uv}_{c} = \\mathbf{uv} + (\\mathbf{uv} - \\mathbf{c}) \\cdot k_{c}',
      readAloud:
        '読む位置を、中心 c から外向きに k 倍だけずらす、と読みます。k を赤・緑・青で少しずつ変えると色収差になり、同じ k で何回も読んで平均すると放射状のブラーになります。中心から離れた画素ほどずれが大きくなるのが、この式の要点です。',
      worked: {
        given: '中心 $\\mathbf{c} = (0.5,\\,0.5)$、ずらし量 $k = 0.006$ で、2 か所の画素を見ます。',
        steps: [
          { calc: '画面の右端寄り uv = (0.9, 0.5)' },
          { calc: '  uv - c = (0.4, 0)' },
          { calc: '  0.4 x 0.006 = 0.0024' },
          { calc: '  読む位置 = (0.9024, 0.5)', note: '少し外側を読む' },
          { calc: '画面の中央 uv = (0.5, 0.5)' },
          { calc: '  uv - c = (0, 0)  →  ずれは 0', note: '中央では何も起きない' },
        ],
        result: '**中心では 0、端では最大。** 実際のレンズも周辺ほど色がずれるので、この形にしておくと、強くしても「壊れた」ではなく「レンズらしい」に留まります。一様にずらすと、ただの二重写しになります。',
      },
    },
    {
      kind: 'sandbox',
      title: '色収差 ― 読む位置を色ごとにずらす',
      guide: { focus: ['読む位置をずらすパス'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ---- ここを書き換えて試してください ---- */
const ABERRATION = 0.006;   // 色のずれ。0.03 にすると露骨になります
const BLUR_STEPS = 6;       // 放射ブラーの回数（1 で無効）
const BLUR_AMOUNT = 0.012;  // 放射ブラーの強さ

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1018);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 1, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

scene.add(new THREE.HemisphereLight(0x9db8ff, 0x22242c, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(3, 5, 4);
scene.add(key);

// 細かい模様があるほど、色のずれが見えます
const grid = new THREE.Group();
const colors = [0xffffff, 0x4fd6ff, 0xff6b8a, 0xffd166];
for (let x = -4; x <= 4; x++) {
  for (let y = -2; y <= 2; y++) {
    const cell = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.2),
      new THREE.MeshStandardMaterial({
        color: colors[(x + y + 8) % colors.length],
        roughness: 0.5,
      }),
    );
    cell.position.set(x * 0.95, y * 0.95 + 1, 0);
    grid.add(cell);
  }
}
scene.add(grid);

/* ---- 読む位置をずらすパス ---- */

const lensPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uAberration: { value: ABERRATION },
    uBlur: { value: BLUR_AMOUNT },
  },
  vertexShader: [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}',
  ].join('\\n'),
  fragmentShader: [
    'uniform sampler2D tDiffuse;',
    'uniform float uAberration;',
    'uniform float uBlur;',
    'varying vec2 vUv;',
    '',
    'void main() {',
    '  vec2 center = vec2(0.5);',
    '  vec2 away = vUv - center;',     // 中心から外向きのベクトル
    '',
    '  // (1) 放射ブラー。中心へ向かって少しずつずらしながら、何回か読んで平均する',
    '  vec3 blurred = vec3(0.0);',
    '  for (int i = 0; i < ' + BLUR_STEPS + '; i++) {',
    '    float t = float(i) / float(' + BLUR_STEPS + ');',
    '    blurred += texture2D(tDiffuse, vUv - away * t * uBlur).rgb;',
    '  }',
    '  blurred /= float(' + BLUR_STEPS + ');',
    '',
    '  // (2) 色収差。赤・緑・青を、別々の量だけ外へずらして読む',
    '  float r = texture2D(tDiffuse, vUv + away * uAberration).r;',
    '  float g = texture2D(tDiffuse, vUv).g;',
    '  float b = texture2D(tDiffuse, vUv - away * uAberration).b;',
    '',
    '  // 中心では効かせず、外へ行くほど効かせる',
    '  float edge = smoothstep(0.15, 0.75, length(away));',
    '  vec3 lens = mix(blurred, vec3(r, g, b), 0.65);',
    '  gl_FragColor = vec4(mix(texture2D(tDiffuse, vUv).rgb, lens, edge), 1.0);',
    '}',
  ].join('\\n'),
});

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(
  window.innerWidth, window.innerHeight,
  { type: THREE.HalfFloatType, samples: 4 },
));
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(lensPass);
composer.addPass(new OutputPass());

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
        '画面の端の四角に、赤と青のふちが出ています。`ABERRATION` を 0.03 にすると露骨に、0 にすると消えます。中心付近では効いていないことに注目してください ― `smoothstep(0.15, 0.75, length(away))` でそうしています。実際のレンズも中心では色ずれが出ないので、この 1 行があるかどうかで「それらしさ」が変わります。',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '読む回数は、そのまま重さです',
      text: `
上のコードは 1 画素あたり **\`BLUR_STEPS\` 回 ＋ 4 回**テクスチャを読んでいます。
フル HD なら 200 万画素なので、**1 フレームで 2000 万回**の読み取りです。

ぼかしを強くしたいからといって回数を増やすのは、いちばん高くつくやり方です。
実際のぼかしは、**縮小した画像に対してかける**か、
**横方向と縦方向に分けて 2 回で済ませる**のが定石です。
\`UnrealBloomPass\` が中でやっているのも、この 2 つです。

\`for\` の回数を GLSL の中で変数にできないのも、ここに理由があります。
**GPU は「何回読むか」を先に知っていたい**のです（上のコードで回数を
JavaScript 側の文字列として埋め込んでいるのは、そのためです）。
`,
    },
    {
      kind: 'md',
      text: `
## 効果を足すときの順番

パスは上から順に流れるので、**順番で結果が変わります。**
迷ったときの目安を置いておきます。

- **ブルーム** … 早め。まだ「絵」がきれいなうちに、光を拾わせる
- **色調・彩度** … 中ほど
- **色収差・歪み・ビネット** … **遅め。** これらは「レンズと画面の癖」なので、いちばん外側
- **\`OutputPass\`** … **必ず最後**

「現実で、どの順番で起きているか」を考えると、たいてい正解に近づきます。
光がレンズを通り、センサーに届き、最後に画面に出る ― その順です。
`,
    },
  ],
  exercises: [
    {
      prompt: `1 つ目のサンドボックスで、\`VIGNETTE\` \`SATURATION\` \`SCANLINE\` を**1 つずつ**無効（0、1、0）にして、
それぞれが何を担っていたかを切り分けてください。`,
      hint: '3 つ全部を一度に見ると、どれが何をしているか分かりません。',
      answer: `\`VIGNETTE\` は周辺の暗さ、\`SATURATION\` は色の濃さ、\`SCANLINE\` は横縞です。
1 つずつ切るのがコツで、**全部入りの絵を見ても、どれが効いているかは分かりません**。
これはシェーダを書くとき全般に効く手順です。効果を足すたびに「0 にして戻せるか」を確かめておくと、
おかしくなったときに原因を 1 つに絞れます。`,
    },
    {
      prompt: '2 つ目のサンドボックスで \`ABERRATION\` を 0.03 にしてください。画面のどこで色ずれが目立ちますか。それはなぜでしょう。',
      hint: 'ずらす量は、中心からの距離に比例させてあります。',
      answer: `**画面の四隅**で目立ち、中心ではほとんど出ません。ずらす量に中心からの距離を掛けているからです。
実際のレンズも、中心より周辺のほうが色ごとの屈折差が大きく出ます。
その性質を真似ると、**強くしても「壊れた」ではなく「レンズらしい」**に留まります。
一様にずらすと、ただの二重写しに見えてしまいます。`,
    },
    {
      prompt: '自分でパスを書くとき、必ず用意しなければならない uniform は何ですか。それはどこから来ますか。',
      hint: 'ShaderPass が、前のパスの結果をどこかへ入れてくれます。',
      answer: `\`uniform sampler2D tDiffuse;\` です。
\`ShaderPass\` は、**前のパスが描いた絵をこの名前の uniform に入れて**からシェーダを走らせます。
名前は決め打ちなので、綴りを変えると何も受け取れません。
あわせて \`varying vec2 vUv;\` で、画面上のどこを見ているかを受け取ります。
この 2 つがそろえば、あとは [](#/ch/t14-fragment-shader) で書いたフラグメントシェーダとまったく同じ書き方でよくなります。`,
    },
  ],
  quiz: [
    {
      q: '自前の `ShaderPass` で、前のパスの結果を受け取る uniform の名前はどれですか。',
      choices: ['`tDiffuse`', '`tInput`', '`tPrevious`', '任意の名前でよい'],
      answer: 0,
      explain:
        '`tDiffuse` という名前は決まっていて、`ShaderPass` が自動で値を差し込みます。宣言だけしておけば（`{ value: null }`）、あとは three が面倒を見ます。ほかの uniform は好きな名前で足せます。',
    },
    {
      q: '色収差を「画面の端だけ」に出すには、どうしますか。',
      choices: [
        '中心からの距離で効き具合を変える（`smoothstep(0.15, 0.75, length(uv - 0.5))` など）',
        '別のパスをもう1つ足す',
        'カメラの fov を変える',
        '`tDiffuse` を2回読む',
      ],
      answer: 0,
      explain:
        '実際のレンズも中心では色ずれが出ません。中心からの距離で混ぜ具合を変える 1 行を入れるだけで、それらしさが大きく変わります。距離は `distance(vUv, vec2(0.5))` でも `length(vUv - 0.5)` でも同じです。',
    },
    {
      q: 'パスを並べる順番として、もっとも自然なのはどれですか。',
      choices: [
        'RenderPass → ブルーム → 色調 → ビネット → OutputPass',
        'RenderPass → OutputPass → ブルーム → ビネット',
        'OutputPass → RenderPass → ブルーム',
        '順番はどれでも同じ結果になる',
      ],
      answer: 0,
      explain:
        '現実で光が通る順に並べると、たいてい正解に近づきます。光を拾うブルームは早め、レンズや画面の癖であるビネットや色収差は遅め、そして OutputPass は必ず最後です。',
    },
  ],
};
