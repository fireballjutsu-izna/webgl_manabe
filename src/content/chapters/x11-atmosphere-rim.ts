import type { Chapter } from '../types.ts';

export const chapterX11: Chapter = {
  slug: 'x11-atmosphere-rim',
  part: 'project',
  number: 11,
  title: '縁が光る ― 内側の面を描くと、厚みが手に入る',
  goal: '大気の殻を内側から描く理由を説明できるようになり、画面に出る内積の範囲を先に計算してから、光り方の指数を選べるようになります。',
  requires: ['p03-planet-atmosphere', 'm33-fresnel', 't14-fragment-shader'],
  threeApis: [
    'ShaderMaterial',
    'ShaderMaterial.uniforms',
    'Material.side',
    'Material.depthWrite',
    'Vector3.dot',
    'Vector3.normalize',
  ],
  mathRecall: [
    { slug: '03-dot', note: '内積は「向きの一致度」。ここでは厚みになる' },
    { slug: 'm33-fresnel', note: '浅い角度ほどよく映る ― 形はこれと同じ' },
    { slug: 'b10-pythagoras', note: '球と直線の交わりは、結局これ 1 つで出る' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 殻を 1 枚置く。ただし、内側を描く

大気は「惑星より少し大きい、薄い殻」です。置き方は $4$ 行で終わります。

- 半径を惑星の $1.2$ 倍にした球を用意する
- \`side: THREE.BackSide\` にして、**内側の面**を描く
- \`blending: THREE.AdditiveBlending\` で、下にあるものに**足す**
- \`depthWrite: false\` にして、奥行きの記録を汚さない

$2$ 行目が要点です。**内側の面を描く。**

ふつうは手前の面を描きます。ここでは逆に、**手前を捨てて、奥の面だけを描きます。**
`,
    },
    {
      kind: 'md',
      text: `
## なぜ内側なのか

カメラは殻の外にいるので、$1$ 本の視線は殻を $2$ 回横切ります。手前の面と、奥の面です。

**手前の面を描くと、惑星の前に青い膜がかかります。** 惑星全体が霞んで終わりです。

**奥の面を描くと、惑星が邪魔をします。**
惑星の輪郭の内側では、奥の面は惑星に隠れて見えません。
見えるのは**輪郭の外側だけ** ― それがそのまま、あの帯になります。

つまり、輪郭の外だけを残す処理を、**惑星自身にやらせている**わけです。
マスクを $1$ 枚も書いていません。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: 'グラスの縁が明るいのと同じこと',
      text: `
水の入っていない薄いグラスを、少し離して見てください。
**まん中は素通しなのに、縁だけが白く光って見えます。**

まん中は、視線がガラスをまっすぐ $2$ 回横切るだけです。合わせて $2$ 枚ぶんの厚み。

縁では、視線がガラスの壁を**なめるように**通ります。
同じ厚みの壁でも、斜めに通れば通る距離は何倍にもなります。

**光るのは、そこにガラスが多いからではありません。通る距離が長いからです。**

大気も同じです。地平線のほうが空が明るいのも、夕焼けが赤いのも、
「そこの空気が濃い」からではなく「**そこを通る道のりが長い**」からです。
`,
    },
    {
      kind: 'md',
      text: `
## 厚みは、内積そのものだった

「道のりが長いところを明るくする」と決めたら、**道のりを計算する**必要があります。

殻の内側の半径を $R$、外側を $R_a$ とします。
視線が中心からどれだけ離れて通るかを $b$ とすると、
帯が見えている範囲は $R \\le b \\le R_a$ です（$b < R$ は惑星が隠します）。

その範囲で、視線が大気の中を通る長さは、**円と直線の交わり**からすぐ出ます。
そして描いている面の法線 $\\mathbf{n}$ と視線 $\\mathbf{v}$ の内積も、同じ $b$ で書けます。

**この $2$ つを並べると、驚くほど簡単な関係になります。**
`,
    },
    {
      kind: 'formula',
      tex: '\\ell(b) \\;=\\; 2\\sqrt{R_a^{2} - b^{2}} \\;=\\; 2\\,R_a\\,\\bigl|\\mathbf{n}\\cdot\\mathbf{v}\\bigr|',
      readAloud:
        '視線が大気の中を通る長さ $\\ell$ は、外側の半径の $2$ 乗から $b$ の $2$ 乗を引いた平方根の $2$ 倍。そしてそれは、外側の半径の $2$ 倍に内積の絶対値を掛けたものに等しい、と読みます。**近似ではなく、そのままイコールです。**',
      worked: {
        given:
          '$R = 1.6$、$R_a = 1.92$（$1.2$ 倍）。$b$ は視線が中心から離れて通る距離です。$2$ か所で、長さと内積の両方を出します。',
        steps: [
          { calc: 'b = R = 1.6 のとき（惑星のふち）' },
          { calc: '  長さ = 2 x sqrt(1.92の2乗 - 1.6の2乗)' },
          { calc: '       = 2 x sqrt(3.6864 - 2.56)' },
          { calc: '       = 2 x sqrt(1.1264) = 2.1226' },
          { calc: '  |n.v| = sqrt(1 - (1.6/1.92)の2乗)' },
          { calc: '        = sqrt(1 - 0.6944) = 0.5528' },
          { calc: '  確かめ : 2 x 1.92 x 0.5528 = 2.1226', note: '一致する' },
          { calc: 'b = 1.92 のとき（殻のいちばん外）' },
          { calc: '  長さ = 0、|n.v| = 0', note: 'ここで帯が消える' },
        ],
        result:
          '**内積の絶対値は、道のりの長さそのもの**でした（定数 $2R_a$ 倍のちがいだけ）。だから `abs(dot(n, v))` を明るさに使うのは、それらしく見せる小細工ではなく、**一様な密度の殻を通る距離を、そのまま計算している**ことになります。カメラの位置にも画角にも依存しません ― $b$ と $R_a$ だけで決まる関係だからです。',
      },
    },
    {
      kind: 'md',
      text: `
## 画面に出るのは、0 から 0.55 までしかない

ここで、書く前に必ず確かめておくべきことがあります。

**内積は $0$ から $1$ まで動く**と思って指数を選ぶと、外します。
**この殻で画面に出るのは $0$ から $0.5528$ までだけ**です。

$|\\mathbf{n}\\cdot\\mathbf{v}| = 0.9$ になるのは $b = 0.837$、
つまり**惑星の内側**です。惑星に隠れて、$1$ 画素も出てきません。

$0.5528$ という上限は $R_a / R$ の比だけで決まります。

- $R_a = 1.02R$ … 上限は $0.198$
- $R_a = 1.20R$ … 上限は $0.553$
- $R_a = 1.60R$ … 上限は $0.781$

**殻を厚くするほど、明るい画素が出てくる**わけです。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'ここを間違えると、指数の選び方を丸ごと外します',
      text: `
$|\\mathbf{n}\\cdot\\mathbf{v}|$ の最大が $1$ だと思っていると、
「$p$ を大きくすれば帯が細く**鋭く**なる」と考えてしまいます。

実際は、最大が $0.5528$ です。$1$ 未満の数を累乗すると**小さくなる**ので、

- $p = 1.4$ … 帯のいちばん明るいところが $0.5528^{1.4} = 0.436$
- $p = 4.0$ … 同じ場所が $0.5528^{4.0} = 0.0934$

**$4.7$ 倍暗くなります。** 細く鋭くなるのではなく、**細くなって、そのうえ消えます。**

$p$ を上げるときは、\`uStrength\` も一緒に上げてください。
**形と明るさは、別のつまみで調整するもの**です。
`,
    },
    {
      kind: 'md',
      text: `
## それでも 1.4 乗する理由

厚みそのものが欲しいなら、$p = 1$ が**物理的に正しい**選択です。上で導いたとおりです。

にもかかわらず、この作品は $1.4$ を使っています。理由は $2$ つあります。

- **一様な密度は嘘だから。** 本物の大気は上へ行くほど薄く、密度は指数関数で減ります。
  だから外側の道のりは、長さのわりに効きません。$1$ より大きい指数は、その減り方の代わりです
- **見た目で決めてよい場所だから。** 帯の広がり方は、
  正しさより「地球に見えるか」で選ぶほうが早く着きます

**$p = 1$ が正しくて、$p = 1.4$ が嘘、ではありません。**
$p = 1$ は「密度が一様な殻」の正解、$1.4$ は「上ほど薄い大気」の安い近似です。

大事なのは、**どちらを選んだか自分で分かっていること**です。
`,
    },
    {
      kind: 'md',
      text: `
## 太陽の側だけを明るくする

もう $1$ つ、内積を使う場所があります。**夜側の大気を暗くする**ことです。

夜の側にも大気はありますが、太陽の光が当たっていないので光りません。
これも法線と太陽の向きの内積で決まります。

\`smoothstep(-0.35, 0.5, dot(n, uSunDirection))\` で $0$ から $1$ に変え、
$0.12 + 0.88 \\times$ その値、として使います。**夜側にも $12\\%$ 残す**のが要点です。
$0$ にすると輪郭の半分が切り落とされたように見えます。
`,
    },
    {
      kind: 'sandbox',
      title: '手前を描く（失敗）と、奥を描く（正解）',
      guide: { focus: ['ここだけが違う ― side', '大気のシェーダ'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const R = 1.2;         // 惑星の半径
const SHELL = 1.2;     // 大気の殻の比

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 0.4, 7.4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 太陽の向き。長さ 1 に揃えておく（内積で使うので）
const sunDirection = new THREE.Vector3(1, 0.25, 0.5).normalize();
const sun = new THREE.DirectionalLight(0xfff2e0, 3.2);
sun.position.copy(sunDirection).multiplyScalar(10);
scene.add(sun, new THREE.AmbientLight(0x2a3a5a, 0.3));

/* ---- 大気のシェーダ ---- */
// 内積の絶対値が、そのまま「大気の中を通る道のりの長さ」になっている

function makeAtmosphereMaterial(side) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSunDirection: { value: sunDirection },
      uColor: { value: new THREE.Color(0x4a9dff) },
      uStrength: { value: 2.6 },
      uPower: { value: 1.4 },
    },
    vertexShader: [
      'varying vec3 vNormal;',
      'varying vec3 vViewDir;',
      'void main() {',
      '  vec4 worldPosition = modelMatrix * vec4(position, 1.0);',
      // 回転と一様な拡大だけなら、法線は mat3(modelMatrix) で世界の向きに直せる
      '  vNormal = normalize(mat3(modelMatrix) * normal);',
      '  vViewDir = normalize(cameraPosition - worldPosition.xyz);',
      '  gl_Position = projectionMatrix * viewMatrix * worldPosition;',
      '}',
    ].join('\\n'),
    fragmentShader: [
      'uniform vec3 uSunDirection;',
      'uniform vec3 uColor;',
      'uniform float uStrength;',
      'uniform float uPower;',
      'varying vec3 vNormal;',
      'varying vec3 vViewDir;',
      'void main() {',
      '  vec3 n = normalize(vNormal);',
      // 内側の面を見ているので符号は負。絶対値を取って厚みにする
      '  float thickness = abs(dot(n, normalize(vViewDir)));',
      '  float band = pow(thickness, uPower);',
      // 夜側にも 12% 残す。0 にすると輪郭が半分に切れて見える
      '  float sunSide = smoothstep(-0.35, 0.5, dot(n, uSunDirection));',
      '  gl_FragColor = vec4(uColor * band * uStrength * (0.12 + 0.88 * sunSide), 1.0);',
      '}',
    ].join('\\n'),
    side: side,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

/* ---- ここだけが違う ― side ---- */
// 左は手前の面、右は奥の面。ほかは 1 文字も違わない

[
  { x: -2.0, side: THREE.FrontSide, label: 'FrontSide（手前の面）― 惑星に膜がかかる' },
  { x: 2.0, side: THREE.BackSide, label: 'BackSide（奥の面）― 輪郭の外だけが残る' },
].forEach((panel, index) => {
  const group = new THREE.Group();
  group.position.x = panel.x;

  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(R, 96, 64),
    new THREE.MeshStandardMaterial({ color: 0x27405e, roughness: 0.9 }),
  ));

  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(R * SHELL, 96, 64),
    makeAtmosphereMaterial(panel.side),
  ));

  scene.add(group);

  const div = document.createElement('div');
  div.textContent = panel.label;
  div.style.cssText =
    'position:absolute; bottom:18px; transform:translateX(-50%);' +
    'color:#e8e8f2; font:12px sans-serif; pointer-events:none; white-space:nowrap;';
  div.style.left = (25 + index * 50) + '%';
  document.body.appendChild(div);
});

/* ---- 画面に出る内積の上限を、その場で計算して出す ---- */

const limit = Math.sqrt(1 - 1 / (SHELL * SHELL));
const note = document.createElement('div');
note.textContent =
  '殻が ' + SHELL + ' 倍 → 画面に出る |n・v| は 0 〜 ' + limit.toFixed(4) +
  '（1.4 乗して ' + Math.pow(limit, 1.4).toFixed(4) + '）';
note.style.cssText =
  'position:absolute; bottom:46px; left:50%; transform:translateX(-50%);' +
  'color:#9fb4d8; font:12px ui-monospace, monospace; pointer-events:none;';
document.body.appendChild(note);

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
        '左は惑星全体に青い膜がかかり、輪郭の外には何もありません。右は逆で、輪郭の外にだけ帯が出ます。**違うのは `side` の $1$ 語だけです。** `SHELL` を $1.02$ に変えると上の表示が $0.198$ に変わり、帯が細く暗くなります ― $1.6$ にすると $0.781$ になって、帯が太く明るくなります。`uPower` を $4.0$ にすると、細くなるのと同時に**ほとんど消える**のが見えます。',
    },
    {
      kind: 'md',
      text: `
## フレネルと、同じ形をしています

[](#/ch/m33-fresnel)でやった「浅い角度ほどよく映る」を思い出してください。
あちらは $(1 - \\mathbf{n}\\cdot\\mathbf{v})^{5}$ の形でした。

- **フレネル** … 内積が $0$ に近いほど**強い**
- **大気の厚み** … 内積が $0$ に近いほど**弱い**（今回）

同じ内積を見ていて、向きが逆です。
今回は「内側の面」を描いているので、
**縁で $0$、惑星のふちで最大**という都合のよい並びになりました。

外側の面で同じことをやろうとすると $(1 - |\\mathbf{n}\\cdot\\mathbf{v}|)$ を使うことになり、
**惑星に隠れないぶん、輪郭の内側にも光が乗ってしまいます。**
$1$ 行の違いに見えて、絵はまったく別物になります。
`,
    },
  ],
  exercises: [
    {
      prompt: `大気の殻を $R_a = 1.6R$（$1.6$ 倍）にしたとき、画面に出る $|\\mathbf{n}\\cdot\\mathbf{v}|$ の上限はいくつですか。

そのとき $p = 1.4$ での帯のいちばん明るい値は、$1.2$ 倍のときの何倍になりますか。`,
      hint: '上限は $\\sqrt{1 - (R/R_a)^{2}}$ です。$R/R_a = 1/1.6 = 0.625$。',
      answer: `**上限は $0.7806$、明るさは約 $1.55$ 倍になります。**

**上限**

$\\sqrt{1 - 0.625^{2}} = \\sqrt{1 - 0.3906} = \\sqrt{0.6094} = 0.7806$

**明るさの比**

$0.7806^{1.4} = 0.7057$

$0.5528^{1.4} = 0.4361$

$0.7057 \\div 0.4361 = 1.618$ 倍

**厚くすると、二重に明るくなる**

殻を厚くすると、明るくなる理由が $2$ つ同時に効きます。

- **帯が太くなる** … 画面上の面積が増える
- **いちばん明るい画素が明るくなる** … $0.436 \\to 0.706$

だから $1.2 \\to 1.6$ は「$1.33$ 倍厚くした」つもりでも、
**受ける印象は $2$ 倍以上変わります。**

**逆向きの注意**

$1.02$ 倍のような薄い殻にすると、上限は $0.198$、$1.4$ 乗して $0.1024$ です。
$1.2$ 倍の $\\frac14$ 以下 ― **薄くしただけのつもりが、ほとんど見えなくなります。**

このとき \`uStrength\` を上げて取り返すことになりますが、
そこまで含めて「$1$ つのつまみ」だと思っておくのが安全です。`,
    },
    {
      prompt: `$|\\mathbf{n}\\cdot\\mathbf{v}| = 0.9$ になるのは、視線が中心からどれだけ離れて通るときですか（$R_a = 1.92$）。

その視線は画面に出ますか。`,
      hint: '$|\\mathbf{n}\\cdot\\mathbf{v}| = \\sqrt{1 - (b/R_a)^{2}}$ を $b$ について解きます。惑星の半径は $1.6$ です。',
      answer: `**$b = 0.837$。惑星に隠れるので、画面には出ません。**

**計算**

$0.9 = \\sqrt{1 - (b/1.92)^{2}}$

両辺を $2$ 乗して $0.81 = 1 - (b/1.92)^{2}$

$(b/1.92)^{2} = 0.19$

$b = 1.92 \\times \\sqrt{0.19} = 1.92 \\times 0.4359 = 0.8369$

**惑星の半径は $1.6$ です。$0.837 < 1.6$ なので、この視線は惑星に当たります。**

奥の面はその手前で遮られ、$1$ 画素も描かれません。

**なぜこれが大事か**

計算例に「$|n \\cdot v| = 0.9$ のとき $0.863$」と書いてあったら、
それは**存在しない画素の明るさ**です。

その数字をもとに \`uStrength\` を決めると、実際の画面は想定の半分の明るさになります。

**画面に出る範囲を先に出す**

シェーダを書く前に、$1$ 行でよいので確かめてください。

$\\sqrt{1 - (R/R_a)^{2}}$

この $1$ つの数が、**そのシェーダの入力の全範囲**です。
入力の範囲を知らずに出力の形（指数）を決めるのは、
**定義域を見ずにグラフを描くのと同じ**ことです。`,
      answerCode: `// シェーダを書く前に、入力の範囲を出しておく
const R = 1.6, RA = 1.6 * 1.2;
const limit = Math.sqrt(1 - (R / RA) ** 2);   // 0.5528
console.log('画面に出る |n.v| は 0 〜', limit.toFixed(4));
console.log('1.4 乗した上限は', Math.pow(limit, 1.4).toFixed(4));  // 0.4361`,
    },
    {
      prompt: `\`smoothstep(-0.35, 0.5, dot(n, uSunDirection))\` の結果を、$0.12 + 0.88 \\times$ その値 として使っています。

$0.12$ を $0$ にすると、見た目はどう変わりますか。なぜそうなりますか。`,
      hint: '夜側の大気は、まったく光らなくてよいでしょうか。',
      answer: `**輪郭の帯が、途中でぷつりと切れます。**

**何が起きるか**

$0$ にすると、太陽と反対側（$\\mathbf{n}\\cdot\\mathbf{s} < -0.35$）の大気は
明るさがちょうど $0$ になります。

帯は輪郭を $1$ 周ぐるりと囲んでいるので、
**その一部だけが完全に消え、残りが三日月のように見えます。**

**なぜ 12% 残すのか**

本物の大気でも、夜側がまったく黒にはなりません。

- 大気の中で光が何度も散乱して、影の側へ回り込む
- 地表からの照り返しがある

$0.12$ はそれを模した数字です。**物理から出した値ではなく、
「切れて見えない最小値」を目で探した値**です。

**この形は覚えておくと使えます**

$a + (1-a) \\times t$

$t$ が $0$ から $1$ まで動くとき、結果は $a$ から $1$ まで動きます。

「**完全に消したくないが、差はしっかり付けたい**」ときに、
影・反射・霧・輪郭の光など、あらゆる場所で出てきます。

$a$ は「**最低保証**」で、この作品では $0.12$ にしています。`,
    },
  ],
  quiz: [
    {
      q: '大気の殻を `side: THREE.BackSide` で描くと、なぜ輪郭の外だけに帯が残るのですか。',
      choices: [
        '輪郭の内側では、奥の面が惑星本体に隠されるから',
        'BackSide では法線が反転して、内側が描かれなくなるから',
        'BackSide でないと AdditiveBlending が効かないから',
        '奥の面のほうが描画が軽いから',
      ],
      answer: 0,
      explain:
        '手前の面を描くと惑星の前に青い膜がかかります。奥の面なら、輪郭の内側では惑星が手前にあって隠れ、残るのは輪郭の外側だけです。マスクを書かずに、惑星自身にマスクの役をさせていることになります。',
    },
    {
      q: '半径 R の惑星を、R_a の殻で包んだとき、画面に出てくる |n・v| の最大値はどれですか。',
      choices: [
        '√(1 − (R/R_a)²)。R_a = 1.2R なら 0.553 で、1 には届かない',
        '常に 1。内積は最大 1 だから',
        'R_a / R。1.2 倍なら 1.2',
        'カメラの距離によって変わるので、事前には決まらない',
      ],
      answer: 0,
      explain:
        '内積が 1 に近い場所は殻の正面、つまり惑星の真後ろ側で、惑星に隠れて描かれません。見えるのは視線が惑星をかすめる b = R から、殻の外縁 b = R_a までで、そこでの内積は √(1 − (R/R_a)²) から 0 までです。カメラの位置には依存しません。',
    },
    {
      q: '`pow(thickness, 1.4)` の指数を 4.0 に上げると、帯はどうなりますか。',
      choices: [
        '細くなり、同時に 4.7 倍暗くなる（0.553⁴ = 0.093）',
        '細く、鋭く明るくなる',
        '太くなる',
        '見た目は変わらない。指数は形を変えないから',
      ],
      answer: 0,
      explain:
        '入力の最大が 0.553 で 1 未満なので、累乗すると必ず小さくなります。0.553 の 1.4 乗は 0.436、4.0 乗は 0.0934 で、いちばん明るいところが 4.7 分の 1 になります。形を鋭くしたいなら、指数を上げると同時に uStrength を上げて明るさを取り戻す必要があります。',
    },
  ],
};
