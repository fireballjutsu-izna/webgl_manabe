import type { Chapter } from '../types.ts';

export const chapterY13: Chapter = {
  slug: 'y13-film-grade',
  part: 'polish',
  number: 13,
  title: 'その画素だけを見る ― ビネット・彩度・走査線',
  goal: 'いま処理している画素の色だけで作れる効果を $3$ つ書けるようになり、彩度を上げすぎると色が壊れる理由を、混ぜ方の式から説明できるようになります。',
  requires: ['q04-custom-pass'],
  threeApis: ['ShaderPass', 'EffectComposer', 'RenderPass', 'OutputPass'],
  mathRecall: [
    { slug: 'q04-custom-pass', note: '$\\mathrm{tDiffuse}$ と $\\mathrm{vUv}$ ― $2$ つの決まりごと' },
    { slug: '02-vector', note: '中心からの距離。ここでは $\\mathrm{vUv}$ 空間で測ります' },
    { slug: '03-dot', note: '明るさは、色と重みの内積' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## いちばん安い効果

自前パスでできることは、**読む位置**で $2$ つに割れます。

- **いま処理している画素だけを読む** … \`texture2D(tDiffuse, vUv)\` を $1$ 回
- **別の位置も読む** … $2$ 回、$4$ 回、$20$ 回

この章は前者です。**$1$ 画素につき $1$ 回しか読まない**ので、
[](#/ch/y11-postprocess-cost)で数えた帯域そのままの値段で済みます。

それでも、できることは意外に多い。$3$ つ書きます。

- **ビネット** … 画面の中心からの距離で暗くする。視線を中央に集める
- **彩度** … 灰色との混ぜ具合を変える。$1$ を超えると鮮やかに
- **走査線** … \`sin\` で細かい横縞を作る。古い画面の質感

どれも $2$〜$3$ 行です。
**距離は \`distance(vUv, vec2(0.5))\`、明るさは \`dot(color.rgb, 重み)\`** ―
[](#/ch/02-vector)と[](#/ch/03-dot)が、ここでも顔を出します。
`,
    },
    {
      kind: 'md',
      text: `
## ビネットは、smoothstep の 2 つの数字で決まる

\`1.0 - smoothstep(0.35, 0.85, d) * uVignette\` と書きます。$d$ は中心からの距離です。

$\\mathrm{vUv}$ は縦横とも $0$ から $1$ なので、**距離の最大値は四隅の $0.7071$**（$\\sqrt{2}/2$）です。
$0.35$ と $0.85$ という $2$ つの数字は、その範囲の中でどこから効かせるかを決めています。

強さ $0.8$ のとき、画面のどこがどれだけ暗くなるかは、こうです。

- **中央**（$d = 0$）… 倍率 $1.000$。まったく効かない
- **端の中央**（$d = 0.5$）… 倍率 $0.827$。わずかに落ちる
- **四隅**（$d = 0.7071$）… 倍率 $0.359$。**$3$ 分の $1$ 以下**

四隅だけが急に暗いのは、$\\mathrm{smoothstep}$ の後半が急だからです。
**「なんとなく効かない」と感じたら、$0.85$ のほうを $0.6$ に下げてください。**
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ビネットは、画面の形に合わせて伸びる',
      text: `
$\\mathrm{vUv}$ 空間は、画面の縦横比に関係なく**つねに正方形**です。

だから \`distance(vUv, vec2(0.5))\` の等距離線は、$\\mathrm{vUv}$ 空間では円でも、
**画面の上では横に引き伸ばされた楕円**になります。

$16:9$ の画面なら、横に $1.78$ 倍伸びた楕円です。

**これは、たいてい望ましい**動きです。
画面の形に沿って暗くなるので、縦長でも横長でも自然に見えます。

真円にしたければ、縦横比を渡して補正します。

- \`vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);\`
- そのうえで \`length(p)\` を測る

ただし**そうすると、縦長の画面で左右が暗くなりすぎます。**
補正しないほうが無難です。
`,
    },
    {
      kind: 'formula',
      tex: 'c\' = Y + s\\,(c - Y), \\qquad Y = 0.2126\\,R + 0.7152\\,G + 0.0722\\,B',
      readAloud:
        '新しい色は、明るさ $Y$ を基準にして、そこから元の色までの差を $s$ 倍したもの、と読みます。$s$ が $0$ なら $Y$ そのもの、つまり白黒。$1$ なら元の色。$1$ を超えると、$Y$ から遠ざかる方向へ引き伸ばされます。',
      worked: {
        given: '緑がかった色 $(0.2,\\ 0.8,\\ 0.3)$ の彩度を上げていきます。',
        steps: [
          { calc: 'Y = 0.2126(0.2) + 0.7152(0.8) + 0.0722(0.3) = 0.6363' },
          { calc: 's = 1.0 : (0.2000, 0.8000, 0.3000)', note: '元の色' },
          { calc: 's = 1.3 : (0.0691, 0.8491, 0.1991)' },
          { calc: 's = 2.2 : (-0.3236, 0.9964, -0.1036)', note: '赤と青が負' },
          { calc: '画面に出るときは 0 でクランプされる' },
          { calc: '実際に出るのは (0.0000, 0.9964, 0.0000)' },
        ],
        result:
          '**$s = 2.2$ では、赤と青が $0$ に張り付いています。** つまり「鮮やかになった」のではなく、**$2$ 成分が潰れて色の情報が消えました。** $s = 1.3$ ではまだ $0.0691$ と $0.1991$ が生きていて、色の関係が保たれています。**彩度を上げるとは、$Y$ から遠ざける操作**であって、$0$ の壁にぶつかった時点でそれ以上は「濃くなる」のではなく「潰れる」だけです。$1.4$ あたりが実用の上限だと思ってください。',
      },
    },
    {
      kind: 'md',
      text: `
## 3 つまとめて書く

$1$ つのパスに $3$ つとも入れます。**別々のパスにする理由がありません** ―
どれも同じ画素を読むだけなので、$1$ 回の読み取りで全部できます。

**$1$ つずつ無効にできるようにしておく**のが要点です。
$3$ つ効いた絵を見ても、どれが何をしているかは分かりません。
`,
    },
    {
      kind: 'sandbox',
      title: '自分の効果を3つ書く',
      guide: { focus: ['自前のパス'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ---- ここを書き換えて試してください ---- */
const VIGNETTE = 0.8;    // 周辺を暗くする量（0 で無効）
const SATURATION = 1.3;  // 1 でそのまま、0 で白黒、2.2 で色が潰れる
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
    '  vec4 color = texture2D(tDiffuse, vUv);   // 読むのは、この 1 回だけ',
    '',
    '  // (1) ビネット。中心からの距離で暗くする。四隅で d = 0.7071',
    '  float d = distance(vUv, vec2(0.5));',
    '  color.rgb *= 1.0 - smoothstep(0.35, 0.85, d) * uVignette;',
    '',
    '  // (2) 彩度。明るさ Y との混ぜ具合を変えるだけ',
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

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#e8e8f2; font:12px monospace;' +
  'pointer-events:none; white-space:pre; text-shadow:0 1px 2px #000;';
readout.textContent =
  'vignette   ' + VIGNETTE.toFixed(2) + '  （四隅の倍率 ' +
  (1 - 0.8017 * VIGNETTE).toFixed(3) + '）\\n' +
  'saturation ' + SATURATION.toFixed(2) + '\\n' +
  'scanline   ' + SCANLINE.toFixed(2);
document.body.appendChild(readout);

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
        '`SATURATION` を 0 にすると白黒、2.2 にすると緑と桃色の箱の色が潰れます（成分が 0 に張り付くため）。`VIGNETTE` を 0 にすると周辺が暗くならず、絵が締まらないのが分かります。`700.0` を 90.0 にすると走査線が太くなり、一気に「壊れたモニタ」の質感になります。3 つとも 2〜3 行ずつで、テクスチャは 1 回しか読んでいません。',
    },
    {
      kind: 'md',
      text: `
## 走査線の 700 という数字

\`sin((vUv.y + uTime * 0.04) * 700.0)\` の $700$ は、**画面の縦に何本の縞を並べるか**です。

$\\sin$ の周期は $2\\pi$ なので、縞の本数は $700 / (2\\pi) = 111.4$ 本になります。

ここで問題が起きます。**画面の縦の画素数より縞が細かいと、模様が壊れます。**

- $1080$ 画素に $111$ 本 … $1$ 本あたり $9.7$ 画素。**きれいに出る**
- $400$ 画素に $111$ 本 … $1$ 本あたり $3.6$ 画素。**うねりが見える**
- $200$ 画素に $111$ 本 … $1$ 本あたり $1.8$ 画素。**縞ではなく、ちらつきになる**

これが{{エイリアシング}}です。**細かすぎる模様は、画素より細かくは描けません。**
画面の高さに応じて本数を変えるか、$90$ 程度まで下げてください。

$\\mathrm{uTime}$ を足しているのは、縞をゆっくり流すためです。
**止まっていると「模様」に見え、流れていると「走査線」に見えます。**
`,
    },
  ],
  exercises: [
    {
      prompt: `\`VIGNETTE\` \`SATURATION\` \`SCANLINE\` を**$1$ つずつ**無効（$0$、$1$、$0$）にしてください。

なぜ $1$ つずつなのでしょうか。`,
      hint: '$3$ つ効いた絵から、どれが何をしているか読み取れますか。',
      answer: `**全部入りの絵を見ても、どれが効いているかは分からないからです。**

**それぞれの担当**

- \`VIGNETTE\` … 周辺の暗さ。四隅で倍率 $0.359$
- \`SATURATION\` … 色の濃さ
- \`SCANLINE\` … 横縞

**混ざると見分けがつかない**

たとえばビネットと彩度は、どちらも「四隅が沈む」ように見えます。

- ビネット … 四隅が**暗く**なる
- 彩度が低い … 全体が**灰色に近づく**ので、暗いところがより沈んで見える

$2$ つ同時に効いていると、**四隅の沈みがどちらのせいか分かりません。**

**これは、シェーダを書くとき全般に効く手順**

効果を足すたびに、

- **$0$（または $1$）にして、元に戻せるか**を確かめる
- **$1$ つだけ極端な値にして**、何が動くか見る

こうしておくと、おかしくなったときに**原因を $1$ つに絞れます。**

逆に、$5$ つ足してから初めて動かすと、**どこが悪いか永遠に分かりません。**`,
    },
    {
      prompt: `\`SATURATION\` を $2.2$ にすると、色が「鮮やか」ではなく「変」になります。

何が起きていますか。`,
      hint: '成分が負になったら、どうなりますか。',
      answer: `**成分が $0$ に張り付いて、色の情報が消えています。**

**計算で見る**

緑がかった $(0.2,\\ 0.8,\\ 0.3)$ で試します。$Y = 0.6363$。

$s = 2.2$ のとき、$c' = Y + 2.2(c - Y)$：

- 赤 : $0.6363 + 2.2(0.2 - 0.6363) = -0.3236$
- 緑 : $0.6363 + 2.2(0.8 - 0.6363) = 0.9964$
- 青 : $0.6363 + 2.2(0.3 - 0.6363) = -0.1036$

**赤と青が負**です。画面には $0$ として出ます。

**出てくる色**

$(0,\\ 0.9964,\\ 0)$ ― **ほぼ純粋な緑**です。

元の色が持っていた「わずかに赤が入った緑」という情報は、消えました。

**$s = 1.3$ なら**

$(0.0691,\\ 0.8491,\\ 0.1991)$ ― どれも正のままで、**関係が保たれています。**

**なぜ「変」に見えるのか**

$0$ に張り付いた成分は、**元の値が違っても同じ $0$** になります。

つまり**違う色が、同じ色になる。** 階調が消えて、べたっとした面になります。

**実用の上限**

$1.4$ あたりです。それ以上は「濃くする」のではなく「潰す」操作になります。

どうしても濃くしたいなら、**彩度ではなく色相ごとに調整**するしかありません。`,
    },
    {
      prompt: `走査線の \`700.0\` を、画面の高さに関係なく固定にしておくと、何が起きますか。`,
      hint: '縞の本数と、画面の画素数を比べてください。',
      answer: `**小さい画面で、縞がちらつきます。**

**縞の本数**

$\\sin$ の周期は $2\\pi$ なので、$700 / (2\\pi) = 111.4$ 本。

これは**画面の高さによらず一定**です。

**画素で割る**

- $1080$ 画素 … $1$ 本あたり $9.7$ 画素。きれいな縞
- $400$ 画素 … $1$ 本あたり $3.6$ 画素。うねりが見える
- $200$ 画素 … $1$ 本あたり $1.8$ 画素。**縞に見えない**

$1$ 本あたり $2$ 画素を切ると、$\\sin$ の山と谷を画素が拾えません。

**何が見えるか**

**もとの縞より粗い、別の模様**が見えます。

しかも \`uTime\` で流しているので、その模様が**ちらつきながら動きます。**

これが{{エイリアシング}}です。

**直し方**

$2$ つあります。

- **画面の高さを渡して、本数を比例させる。**
  \`uHeight / 10.0\` なら、つねに $1$ 本 $10$ 画素
- **本数を下げる。** $90$ なら $14.3$ 本 ― どんな画面でも安全

$2$ つめが簡単で、しかも**「壊れたモニタ」の質感としてはむしろ良い**です。`,
    },
  ],
  quiz: [
    {
      q: 'ビネットの `distance(vUv, vec2(0.5))` は、四隅でいくつになりますか。',
      choices: [
        '0.7071。vUv は縦横とも 0〜1 なので、対角の半分',
        '1.0',
        '画面の縦横比によって変わる',
        '0.5',
      ],
      answer: 0,
      explain:
        'vUv 空間は画面の形によらずつねに正方形なので、中心から四隅までは √2 / 2 = 0.7071 です。等距離線は vUv 空間では円ですが、画面の上では縦横比のぶんだけ引き伸ばされた楕円になります ― たいていはそのほうが自然に見えるので、補正しないのが無難です。',
    },
    {
      q: '彩度を 2.2 まで上げると、なぜ色が「変」になりますか。',
      choices: [
        '成分が負になって 0 に張り付き、違う色が同じ色になるから',
        '明るさ Y の計算が壊れるから',
        'sRGB の範囲を超えるから',
        'GPU の精度が足りないから',
      ],
      answer: 0,
      explain:
        '(0.2, 0.8, 0.3) は Y = 0.6363 で、s = 2.2 では赤が -0.3236、青が -0.1036 になります。画面には 0 として出るので、出てくるのはほぼ純粋な緑です。元の値が違っても同じ 0 になるため階調が消え、べたっとした面になります。実用の上限は 1.4 あたりです。',
    },
    {
      q: '走査線の本数を固定にしたまま、小さい画面で表示すると何が起きますか。',
      choices: [
        '1 本あたりの画素が 2 を切ると縞に見えず、ちらつく別の模様が出る',
        '縞が太くなるだけ',
        '縞が消える',
        '色がずれる',
      ],
      answer: 0,
      explain:
        'sin((vUv.y) * 700.0) の縞は 700 / 2π = 111.4 本で、画面の高さによりません。1080 画素なら 1 本 9.7 画素できれいに出ますが、200 画素では 1.8 画素 ― 山と谷を拾えず、もとの縞より粗い模様がちらつきます。本数を 90 程度まで下げるか、画面の高さに比例させてください。',
    },
  ],
};
