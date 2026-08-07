import type { Chapter } from '../types.ts';

export const chapterY14: Chapter = {
  slug: 'y14-uv-offset',
  part: 'polish',
  number: 14,
  title: '読む位置をずらす ― 色収差と放射ブラー',
  goal: '読む位置を中心からの距離に比例してずらせるようになり、$1$ 画素あたりの読み取り回数が値段そのものであることを、数えて確かめられるようになります。',
  requires: ['y13-film-grade'],
  threeApis: ['ShaderPass', 'EffectComposer', 'RenderPass', 'OutputPass'],
  mathRecall: [
    { slug: 'y13-film-grade', note: '$1$ 画素につき $1$ 回だけ読む効果。ここからは増えます' },
    { slug: '02-vector', note: '中心から外向きのベクトル' },
    { slug: 'y11-postprocess-cost', note: '読み取りの回数と帯域' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 別の画素を読む ― ここからが本番

[](#/ch/y13-film-grade)の $3$ つは、**いま処理している画素の色**しか読んでいませんでした。
\`texture2D(tDiffuse, vUv)\` の \`vUv\` が固定だったからです。

**ここをずらすと、できることが一気に増えます。**

- 少しずらして読む → **ぼかし・にじみ・ずれ**
- 中心へ向かってずらす → **放射状のブラー**
- 赤・緑・青を**別々の量だけ**ずらす → **色収差**（レンズの色ずれ）

色収差は、実際のレンズが**色によって曲がり方が違う**ために起きる現象です。
**画面の端ほど強く出ます。** わずかに入れると「写真らしさ」が出るので、映像でよく使われます。

そして、**値段も一気に上がります。** $2$ 回読めば $2$ 倍、$20$ 回読めば $20$ 倍です。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathbf{uv}_{c} = \\mathbf{uv} + (\\mathbf{uv} - \\mathbf{c}) \\cdot k',
      readAloud:
        '読む位置を、中心 $\\mathbf{c}$ から外向きに $k$ 倍だけずらす、と読みます。$k$ を赤・緑・青で少しずつ変えると色収差になり、同じ向きに何回も読んで平均すると放射状のブラーになります。中心から離れた画素ほどずれが大きくなるのが、この式の要点です。',
      worked: {
        given: '中心 $\\mathbf{c} = (0.5,\\,0.5)$、ずらし量 $k = 0.006$ で、$3$ か所の画素を見ます。',
        steps: [
          { calc: '画面の中央 uv = (0.5, 0.5)' },
          { calc: '  uv - c = (0, 0) → ずれは 0', note: '中央では何も起きない' },
          { calc: '右端の中央 uv = (1.0, 0.5)' },
          { calc: '  uv - c = (0.5, 0) → ずれ 0.0030' },
          { calc: '  1920 px 換算で 5.76 px' },
          { calc: '四隅 uv = (1.0, 1.0)' },
          { calc: '  uv - c = (0.5, 0.5) → 長さ 0.7071' },
          { calc: '  ずれは uv で (0.0030, 0.0030)' },
          { calc: '  画面では (5.76, 3.24) px → 長さ 6.61 px' },
        ],
        result:
          '**中心では $0$、四隅では $6.61$ 画素。** 赤を外へ、青を内へずらせば、四隅では**赤と青が $13.2$ 画素離れます。** 実際のレンズも周辺ほど色がずれるので、この形にしておくと、強くしても「壊れた」ではなく「レンズらしい」に留まります。**一様にずらすと、ただの二重写し**です。なお $k$ は画素数に対して定義されていないので、**画面が大きいほどずれも大きくなります** ― $3840 \\times 2160$ なら四隅で $13.2$ 画素です。',
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
camera.position.set(0, 1, 6.9);

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
for (let x = -6; x <= 6; x++) {
  for (let y = -3; y <= 3; y++) {
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

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#e8e8f2; font:12px monospace;' +
  'pointer-events:none; white-space:pre; background:rgba(8,10,18,0.72);' +
  'padding:6px 9px; border-radius:5px;';
readout.textContent =
  'aberration ' + ABERRATION.toFixed(3) + '\\n' +
  'blur steps ' + BLUR_STEPS + '\\n' +
  '1 画素あたりの読み取り ' + (BLUR_STEPS + 4) + ' 回';
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
        '画面の端の四角に、赤と青のふちが出ています。`ABERRATION` を 0.03 にすると露骨に、0 にすると消えます。中心付近では効いていないことに注目してください ― `smoothstep(0.15, 0.75, length(away))` でそうしています。実際のレンズも中心では色ずれが出ないので、この 1 行があるかどうかで「それらしさ」が変わります。左下の読み取り回数にも注目 ― `BLUR_STEPS` を 24 にすると 28 回になり、1920 × 1080 なら 1 フレームで 5800 万回です。',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '読む回数は、そのまま重さです',
      text: `
上のコードは $1$ 画素あたり **\`BLUR_STEPS\` 回 ＋ $4$ 回**テクスチャを読んでいます。

既定の $6$ なら $10$ 回。$1920 \\times 1080$ なら $2{,}073{,}600$ 画素なので、
**$1$ フレームで $2074$ 万回**の読み取りです。$60\\ \\mathrm{fps}$ なら毎秒 $12$ 億回。

ぼかしを強くしたいからといって回数を増やすのは、**いちばん高くつくやり方**です。
実際のぼかしは $2$ つの手で安くします。

- **縮小した画像に対してかける。** 半分にすれば画素が $4$ 分の $1$
- **横方向と縦方向に分けて $2$ 回で済ませる。**
  $21 \\times 21$ の範囲なら、$441$ 回が $42$ 回に

[](#/ch/y10-bloom)の \`UnrealBloomPass\` が中でやっているのは、この $2$ つです。

そして \`for\` の回数を $GLSL$ の中で変数にできないのも、ここに理由があります。
**$GPU$ は「何回読むか」を先に知っていたい** ―
上のコードで回数を $\\mathrm{JavaScript}$ 側の文字列として埋め込んでいるのは、そのためです。
`,
    },
    {
      kind: 'md',
      text: `
## 端の外を読んだら、どうなるか

\`vUv + away * k\` は、$\\mathrm{vUv}$ が $1$ に近いところで **$1$ を超えます。**
テクスチャの外です。

何が返るかは \`wrapS\` / \`wrapT\` の設定で決まります。

- **\`ClampToEdgeWrapping\`（既定）** … 端の画素がそのまま伸びる
- **\`RepeatWrapping\`** … 反対側が現れる。**画面の右端に左端が映り込みます**

レンダーターゲットのテクスチャは既定で \`ClampToEdgeWrapping\` なので、
ふつうは気になりません。ただし**端に細い筋が出る**ことがあります。

$1$ 行で防げます。

- \`vec2 uv = clamp(vUv + away * k, 0.0, 1.0);\`

放射ブラーのほうは**中心へ向かってずらす**（\`vUv - away * t\`）ので、
はみ出しません。**外向きより内向きのほうが安全**です。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`ABERRATION\` を $0.03$ にしてください。

画面のどこで色ずれが目立ちますか。それはなぜでしょう。`,
      hint: 'ずらす量は、中心からの距離に比例させてあります。',
      answer: `**画面の四隅**で目立ち、中心ではほとんど出ません。

**式を見る**

\`vUv + away * uAberration\` の \`away\` は \`vUv - vec2(0.5)\`、
つまり**中心から外向きのベクトル**です。

長さが距離そのものなので、**ずれ量は距離に比例します。**

**数字で**

$k = 0.03$、$1920 \\times 1080$ とすると、

- 中央 … $0$ 画素
- 右端の中央 … $\\mathrm{uv}$ で $0.015$ → $28.8$ 画素
- 四隅 … $\\mathrm{uv}$ で $(0.015,\\ 0.015)$ → 画面では $(28.8,\\ 16.2)$ 画素、長さ $33.0$ 画素

赤を外、青を内へずらすので、**四隅では赤と青が $66.1$ 画素離れます。** 露骨です。

**なぜこの形にするのか**

実際のレンズは、**中心より周辺のほうが色ごとの屈折差が大きく**出ます。

その性質を真似ると、強くしても「壊れた」ではなく「レンズらしい」に留まります。

**一様にずらすと**

\`vUv + vec2(k, 0.0)\` のように定数でずらすと、中心でも同じだけずれます。

これは**ただの二重写し**で、レンズには見えません。`,
    },
    {
      prompt: `\`BLUR_STEPS\` を $6$ から $24$ にしました。

$1920 \\times 1080$ で、$1$ フレームの読み取り回数はどれだけ増えますか。`,
      hint: '色収差のぶんの $4$ 回は変わりません。',
      answer: `**$2074$ 万回から $5806$ 万回へ、$2.8$ 倍です。**

**数える**

$1$ 画素あたりの読み取りは \`BLUR_STEPS\` $+ 4$ 回。

- $6$ ステップ … $10$ 回
- $24$ ステップ … $28$ 回

**画素数を掛ける**

$1920 \\times 1080 = 2{,}073{,}600$ 画素

- $10$ 回 … $2{,}073$ 万回
- $28$ 回 … $5{,}806$ 万回

$60\\ \\mathrm{fps}$ なら、毎秒 $12.4$ 億回が **$34.8$ 億回**です。

**見た目はどれだけ良くなるか**

ほとんど変わりません。**ぼかしの品質は、回数よりも「どこを読むか」で決まります。**

$24$ 回を等間隔に並べても、$6$ 回の隙間を埋めるだけです。

**安くする手**

- **縮小した画像でぼかす。** 半分なら画素が $4$ 分の $1$ で、$6$ ステップのまま $4$ 倍安い
- **横と縦に分ける。** $21 \\times 21$ 相当が $441$ 回 $\\to 42$ 回

**放射ブラーは分離できない**

横縦に分ける手が使えるのは、**ぼかす向きが画面全体で同じとき**だけです。

放射ブラーは画素ごとに向きが違うので、**縮小して回数を減らす**しかありません。`,
    },
    {
      prompt: `色収差を「画面の端だけ」に出すには、どうしますか。

コードのどの $1$ 行がそれをしていますか。`,
      hint: '効かせる量を、何かの関数にしています。',
      answer: `**\`float edge = smoothstep(0.15, 0.75, length(away));\` の $1$ 行です。**

**何をしているか**

\`length(away)\` は中心からの距離。四隅で $0.7071$ です。

\`smoothstep(0.15, 0.75, ...)\` は、

- $0.15$ より内側 … $0$。**まったく効かない**
- $0.75$ より外側 … $1$。**完全に効く**
- あいだ … なめらかに増える

**四隅でいくつになるか**

$d = 0.7071$ のとき $\\mathrm{smoothstep}$ は $0.9854$ ― ほぼ効き切っています。

**その次の行で使う**

\`mix(元の色, レンズを通した色, edge)\` ―
$\\mathrm{edge}$ が $0$ なら元の色そのまま、$1$ ならレンズの色。

**この 1 行が無いと**

中心でも色収差が出ます。

すると「レンズ」ではなく「**印刷のずれ**」に見えます。
実際のレンズは光軸上で色ずれが出ないので、それが不自然さの正体です。

**ずらし量そのものが距離に比例しているのに、なぜもう $1$ 段いるのか**

ずらし量は中心で $0$ ですが、**中心のすぐ隣ではもう $0$ ではありません。**

$\\mathrm{smoothstep}$ で「効かせない領域」をはっきり作ると、
**中心の一帯がきちんと澄んで見えます。**`,
    },
  ],
  quiz: [
    {
      q: '色収差で読む位置をずらす量を、中心からの距離に比例させるのはなぜですか。',
      choices: [
        '実際のレンズも周辺ほど色ごとの屈折差が大きいから。一様にずらすとただの二重写しになる',
        '計算が速くなるから',
        'テクスチャの外を読まないため',
        'GPU の制限',
      ],
      answer: 0,
      explain:
        'away = vUv - vec2(0.5) の長さが距離そのものなので、掛けるだけで比例します。k = 0.006、1920 × 1080 なら中央 0 画素、四隅で 6.61 画素 ― 赤を外・青を内にずらせば四隅で 13.2 画素離れます。定数でずらすと中心でもずれ、レンズには見えません。',
    },
    {
      q: 'BLUR_STEPS を 6 から 24 にすると、1 画素あたりの読み取りは何回になりますか。',
      choices: [
        '28 回（24 + 色収差の 4 回）。1920 × 1080 なら 1 フレーム 5806 万回',
        '24 回',
        '変わらない',
        '96 回',
      ],
      answer: 0,
      explain:
        '見た目はほとんど良くなりません。ぼかしの品質は回数より「どこを読むか」で決まります。安くするなら縮小した画像にかける（半分で画素が 4 分の 1）か、横と縦に分ける（21 × 21 相当が 441 回 → 42 回）。ただし放射ブラーは画素ごとに向きが違うので、分離はできず縮小に頼ります。',
    },
    {
      q: '`vUv + away * k` がテクスチャの外を指したとき、何が返りますか。',
      choices: [
        'レンダーターゲットは既定で ClampToEdgeWrapping なので、端の画素が伸びる',
        '黒が返る',
        'エラーになる',
        '反対側の画素が返る',
      ],
      answer: 0,
      explain:
        '端に細い筋が出ることはあるので、気になるなら clamp(vUv + away * k, 0.0, 1.0) の 1 行で防げます。RepeatWrapping にしてあると反対側が映り込み、画面の右端に左端が現れます。放射ブラーは中心へ向かってずらすのではみ出しません ― 外向きより内向きのほうが安全です。',
    },
  ],
};
