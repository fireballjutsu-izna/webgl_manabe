import type { Chapter } from '../types.ts';

export const chapterW48: Chapter = {
  slug: 'w48-shader-debug',
  part: 'threejs',
  number: 48,
  title: 'シェーダが動かないとき ― 値を、色で見る',
  goal: 'GLSL のコンパイルエラーを読めるようになり、真っ黒・真っ白の原因を順番に切り分けられるようになります。',
  requires: ['t14-fragment-shader'],
  mathRecall: [
    { slug: 'b34-inverse-lerp', note: '範囲を 0〜1 に写すのは、逆補間そのもの' },
  ],
  threeApis: [
    'ShaderMaterial',
    'WebGLRenderer.debug',
    'Material.onBeforeCompile',
    'MeshNormalMaterial',
    'MeshDepthMaterial',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## printf が無い

シェーダには **\`console.log\` がありません。**

$1$ 画素ぶんのプログラムが同時に何百万個も走っているので、
「$1$ 個だけ値を出す」ということができないのです。

デバッガもありません。ブレークポイントも置けません。

**使える道具は $1$ つだけ ― 出力の色。**

見たい値を色に写して、画面に出す。それだけです。
慣れれば、これで十分に速く原因にたどり着けます。
`,
    },
    {
      kind: 'md',
      text: `
## まず、コンパイルエラーを読む

GLSL のエラーはブラウザのコンソールに出ます。
three は**シェーダ全文と、エラー箇所の前後**を並べて出してくれます。

\`ERROR: 0:123: '=' : cannot convert from 'int' to 'float'\`

$3$ つの部分に分かれています。

- **\`0:123\`** … $123$ 行目。ただし**three が足した行を含む番号**です
- **\`'=' :\`** … どの記号のところで詰まったか
- 残り … 何が起きたか

**行番号がずれて見えるのは、three が先頭に定義を大量に差し込むから**です。
\`ShaderMaterial\` なら \`precision\`、\`projectionMatrix\`、\`position\` などの宣言が
$40$ 行ほど自動で付きます。

three はエラー箇所の周辺を抜き出して表示してくれるので、
**行番号を数えるより、そこに出ている行を読んでください。**
`,
    },
    {
      kind: 'md',
      text: `
## よく出るエラー 5 つ

**$1$. \`cannot convert from 'int' to 'float'\`**

GLSL に暗黙の型変換はありません。**\`1\` は \`int\`、\`1.0\` が \`float\`。**

\`float x = 1;\` はエラー。\`float x = 1.0;\` と書きます。
\`vec3(0, 0, 1)\` もエラーで、\`vec3(0.0, 0.0, 1.0)\` です。

**$2$. \`undeclared identifier\`**

綴りの間違いか、宣言し忘れ。\`uniform\` を JS 側で渡していても、
**シェーダの側で \`uniform float uTime;\` と宣言しないと使えません。**

**$3$. \`l-value required\`**

\`gl_FragColor.rgb.x = 1.0;\` のような二重の取り出しはできません。
また \`v.xxx = ...\` のように**同じ成分を繰り返した swizzle** にも代入できません。

**$4$. varying の宣言が合っていない**

頂点側で \`varying vec2 vUv;\`、フラグメント側で \`varying vec2 vUV;\` ―
**大文字小文字が違うだけ**でリンクに失敗します。

**$5$. \`No precision specified for (float)\`**

フラグメントシェーダでは精度の指定が要ります。
\`ShaderMaterial\` なら three が付けてくれますが、
\`RawShaderMaterial\` では**自分で \`precision mediump float;\` と書きます。**
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '「エラーは出ないのに真っ黒」がいちばん多い',
      text: `
コンパイルが通ったということは、文法が正しいというだけです。

真っ黒の原因は、たいてい次のどれかです。

- gl_FragColor に alpha を入れ忘れた（vec4 の 4 つ目が 0）
- 掛け算のどこかが 0 になっている
- 法線やライトの向きが逆で、内積が負 → max(dot, 0.0) で 0
- uniform の値が渡っていない（undefined を渡すと 0 になる）
- 面の裏側を見ている（side を指定していない）

どれも「文法としては正しい」ので、コンパイラは何も言いません。
ここから先は、値を色で見るしかありません。
`,
    },
    {
      kind: 'formula',
      tex: 'c \\;=\\; 0.5 + 0.5\\,v \\qquad\\text{または}\\qquad c \\;=\\; \\frac{v - v_{\\min}}{v_{\\max} - v_{\\min}}',
      readAloud:
        '値を色に写す式です。**$-1$ 〜 $1$ の値**（法線など）は $0.5 + 0.5v$ で $0$ 〜 $1$ に。**それ以外の範囲**は、最小値を引いて幅で割ります ― [](#/ch/b34-inverse-lerp)でやった逆補間そのものです。',
      worked: {
        given:
          '法線が $\\mathbf{n} = (1, 2, 3)$ を正規化したもの、つまり $(0.267,\\; 0.535,\\; 0.802)$ でした。これを色にすると、画面には何色が出るでしょうか。',
        steps: [
          { calc: 'r = 0.5 + 0.5 x 0.267' },
          { calc: '  = 0.634' },
          { calc: 'g = 0.5 + 0.5 x 0.535' },
          { calc: '  = 0.767' },
          { calc: 'b = 0.5 + 0.5 x 0.802' },
          { calc: '  = 0.901' },
          { calc: '8bit にすると' },
          { calc: '  (162, 196, 230)' },
        ],
        result:
          '**薄い青**（$162, 196, 230$）です。$3$ 成分ともプラスなので、どれも $0.5$ より明るくなりました。**この写し方を覚えておくと、法線が一目で読めます。** $+y$（真上）を向いた面は $(0.5, 1.0, 0.5)$ ＝ **明るい緑**、$+z$（手前）は $(0.5, 0.5, 1.0)$ ＝ **青**、$+x$（右）は $(1.0, 0.5, 0.5)$ ＝ **赤**（\`normalMatrix\` を掛けた**視点から見た**法線なら、カメラが水平に近いときの話です）。逆を向いていれば、それぞれ暗い側に振れます。**画面が一様な緑なら、法線が全部真上を向いている**ということ ― 法線を計算し忘れた、あるいは上書きしてしまった形です。',
      },
    },
    {
      kind: 'sandbox',
      title: 'デバッグ表示を切り替える',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 0:仕上がり  1:UV  2:法線  3:位置  4:奥行き  5:真っ赤（届いているかの確認）
const MODE = 2;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.4, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const material = new THREE.ShaderMaterial({
  uniforms: {
    uMode: { value: MODE },
    uTime: { value: 0 },
    uLight: { value: new THREE.Vector3(0.5, 0.8, 0.4).normalize() },
  },
  vertexShader: /* glsl */\`
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPos;
    varying vec3 vView;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPos = position;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  \`,
  fragmentShader: /* glsl */\`
    uniform int uMode;
    uniform vec3 uLight;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPos;
    varying vec3 vView;

    void main() {
      vec3 color;

      if (uMode == 1) {
        // UV。左下が黒、右が赤、上が緑。青は 0 のまま
        color = vec3(vUv, 0.0);

      } else if (uMode == 2) {
        // 法線。-1..1 を 0..1 へ写す
        color = vNormal * 0.5 + 0.5;

      } else if (uMode == 3) {
        // ローカル座標。-1.2..1.2 くらいの範囲を 0..1 へ
        color = (vPos + 1.2) / 2.4;

      } else if (uMode == 4) {
        // 奥行き。カメラからの距離を 3..7 の範囲で 0..1 へ写す
        float d = length(vView);
        color = vec3(clamp((d - 3.0) / 4.0, 0.0, 1.0));

      } else if (uMode == 5) {
        // ここに届いているか、それだけを確かめる
        color = vec3(1.0, 0.0, 0.0);

      } else {
        // 仕上がり
        float lambert = max(dot(vNormal, uLight), 0.0);
        color = mix(vec3(0.09, 0.12, 0.22), vec3(0.42, 0.84, 1.0), lambert);
      }

      // 4 つ目（alpha）を忘れると、真っ黒になる
      gl_FragColor = vec4(color, 1.0);
    }
  \`,
});

const shapes = [
  new THREE.TorusKnotGeometry(0.62, 0.2, 128, 24),
  new THREE.SphereGeometry(0.85, 40, 26),
  new THREE.BoxGeometry(1.3, 1.3, 1.3),
];
shapes.forEach((geo, i) => {
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.x = (i - 1) * 2.3;
  scene.add(mesh);
});

const labels = ['仕上がり', 'UV', '法線', '位置', '奥行き', '真っ赤'];
const readout = document.createElement('div');
readout.style.cssText =
  'position:fixed;left:12px;top:12px;padding:8px 12px;border-radius:8px;' +
  'background:rgba(10,10,18,.82);color:#e8e8f2;font:13px/1.7 monospace;' +
  'border:1px solid #3a3a5c;white-space:pre';
readout.textContent = 'MODE ' + MODE + ' : ' + labels[MODE];
document.body.appendChild(readout);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  material.uniforms.uTime.value = clock.getElapsedTime();
  scene.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.5;
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**`MODE` を $0$ から $5$ まで順に変えてみてください。** $2$（法線）では、上を向いた面が緑、右が赤、手前が青になります ― 計算例で見たとおりです。$1$（UV）では、球の継ぎ目や箱の面ごとの貼り方が一目で分かります。**$5$（真っ赤）は「そもそもここまで届いているか」の確認**で、真っ黒のときはまずこれを試します。なおここで出しているのは \`normalMatrix\` を掛けた**視点から見た法線**なので、**カメラを回すと色が変わります** ― ライティングが使うのはこちらの法線なので、確かめたいのもこちらです。',
    },
    {
      kind: 'md',
      text: `
## 真っ黒のときの、順番

上から順に試してください。**$1$ 分で原因が絞れます。**

**$1$. \`gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\` だけにする**

赤くなれば、**フラグメントシェーダには届いています。**
真っ黒のままなら、そもそも描かれていない ―
頂点シェーダか、メッシュの位置・大きさ・カメラの問題です。

**$2$. 頂点シェーダを最小にする**

\`gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\` だけにします。

これで映れば、頂点を動かしている計算のどこかが壊れています。

**$3$. 値を $1$ つずつ色で出す**

$1$ に戻したら、こんどは疑わしい値を色にします。
\`gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);\`

**真っ黒・真っ白・一様な色**が出たら、そこが犯人です。

**$4$. \`side\` と \`transparent\` を疑う**

板の裏を見ていませんか。\`side: THREE.DoubleSide\` にしてみてください。

\`transparent: true\` で alpha が $0$ になっていませんか。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'NaN は真っ黒になる',
      text: `
0 で割った、負の数の平方根を取った、normalize(vec3(0.0)) を呼んだ ―
どれも NaN を生みます。

NaN はどんな計算を通しても NaN のまま伝わり、
最後に色として出るときに 0（真っ黒）になります。

見つけ方は 1 つ。「NaN かどうか」を色にすることです。

x != x は、x が NaN のときだけ true になります。
これを使えば、壊れている画素だけを赤く塗れます。

gl_FragColor = vec4(c.x != c.x ? 1.0 : 0.0, 0.0, 0.0, 1.0);
`,
    },
    {
      kind: 'md',
      text: `
## 借りられる道具

自分で書かなくても、three が用意しているものがあります。

- **\`MeshNormalMaterial\`** … 法線をそのまま色にしたマテリアル。
  \`scene.overrideMaterial\` に入れれば、**シーン全体の法線を一度に見られます**
- **\`WebGLRenderer\` の \`debug.checkShaderErrors\`** … 既定で \`true\`。
  本番では \`false\` にすると起動が少し速くなりますが、**開発中は必ず \`true\`**
- **ブラウザの WebGL 拡張** … Spector.js のような道具で、
  $1$ フレームぶんの命令を全部記録して見られます

**\`scene.overrideMaterial\` は $1$ 行で効くので、覚えておく価値があります。**
シーン全部を法線色や深度色にして、$1$ 回描くだけです。
`,
    },
    {
      kind: 'code',
      title: 'シーン全体を、法線の色で見る',
      code: `import * as THREE from 'three';

// 1 行入れるだけ。もとのマテリアルには触らない
scene.overrideMaterial = new THREE.MeshNormalMaterial();
renderer.render(scene, camera);
scene.overrideMaterial = null;

// 法線が真っ黒／一様なら、法線が壊れているか計算されていない
// geometry.computeVertexNormals() を忘れていませんか

// NaN だけを赤く塗る
const findNaN = /* glsl */\`
  vec3 c = myColor;
  bool broken = (c.x != c.x) || (c.y != c.y) || (c.z != c.z);
  gl_FragColor = broken ? vec4(1.0, 0.0, 0.0, 1.0) : vec4(c, 1.0);
\`;

// uniform が渡っていないと 0 になる。JS 側で確かめる
console.log(material.uniforms.uTime.value);   // undefined になっていないか`,
    },
  ],
  exercises: [
    {
      prompt: `次の $3$ つのエラーを、それぞれ直してください。

**A.** \`ERROR: '=' : cannot convert from 'int' to 'float'\` ― \`float t = 1;\`
**B.** \`ERROR: 'assign' : l-value required\` ― \`vNormal.xxx = vec3(1.0);\`
**C.** コンパイルは通るのに真っ黒。頂点側に \`varying vec2 vUv;\`、
フラグメント側に \`varying vec2 vUV;\``,
      hint: 'GLSL に暗黙の型変換はありません。swizzle は同じ成分を繰り返せますか。',
      answer: `**A は \`1.0\`、B は成分の重複、C は大文字小文字の食い違いです。**

**A ― \`float t = 1;\`**

GLSL に**暗黙の型変換はありません。**

\`1\` は \`int\`、\`1.0\` が \`float\` です。別の型なので代入できません。

\`float t = 1.0;\`

同じ理由で \`vec3(0, 0, 1)\` もエラー。\`vec3(0.0, 0.0, 1.0)\` と書きます。

**慣れるまでいちばん多く踏むエラー**なので、
**「数値には必ず小数点を打つ」**を習慣にしてください。

なお \`for (int i = 0; i < 8; i++)\` の \`0\` と \`8\` は \`int\` なので、そのままで正しい。

**B ― \`vNormal.xxx = vec3(1.0);\`**

\`.xxx\` は「$x$ 成分を $3$ 回並べたもの」です。

**読むぶんには正しい**（\`vec3 v = n.xxx;\` は動きます）。
けれど代入はできません ― **$1$ つの入れ物に $3$ つの値を同時に書くこと**になるからです。

書けるのは、**成分が重複していない swizzle** だけです。

- \`vNormal.xyz = vec3(1.0);\` … 正しい
- \`vNormal.xz = vec2(1.0);\` … 正しい（順序が違ってもよい）
- \`vNormal.xx = vec2(1.0);\` … エラー

**C ― \`vUv\` と \`vUV\`**

**GLSL は大文字小文字を区別します。**

頂点側の \`vUv\` と、フラグメント側の \`vUV\` は**別の変数**です。

フラグメント側の \`vUV\` は、どこからも書き込まれていない
（＝**中身が保証されない**）まま使われます。
多くの環境で $0$ になるので、模様が出ずに真っ黒になります。

**環境によってはリンクエラーになりますが、ならないこともあります。**
「エラーは出ないのに真っ黒」の典型がこれです。

**予防**

varying の宣言は、**頂点側とフラグメント側でコピーして貼ってください。**
手で打ち直すから食い違います。

共通部分を JS 側の定数にして、両方に埋め込む手もあります。`,
      answerCode: `// A
float t = 1.0;

// B ― 重複しない swizzle にする
vNormal.xyz = vec3(1.0);

// C ― 両方で同じ綴りにする。定数にして貼るのが確実
const VARYINGS = /* glsl */\`
  varying vec2 vUv;
  varying vec3 vNormal;
\`;

const material = new THREE.ShaderMaterial({
  vertexShader: VARYINGS + \`void main() { ... }\`,
  fragmentShader: VARYINGS + \`void main() { ... }\`,
});`,
    },
    {
      prompt: `自作の \`ShaderMaterial\` が**真っ黒**です。エラーは出ていません。

**どういう順番で切り分けますか。** $4$ 段階書いて、
それぞれ「その結果からわかること」も添えてください。`,
      hint: 'いちばん単純な出力から始めます。',
      answer: `**赤 → 頂点最小 → 値を色に → side と alpha、の順です。**

**段階 $1$ ― フラグメントを真っ赤にする**

\`gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\` だけにします。

- **赤くなった** … フラグメントシェーダまで届いている。
  **原因は色の計算の中**。段階 $3$ へ
- **真っ黒のまま** … そもそも描かれていない。段階 $2$ へ

**この $1$ 手で、探す範囲が半分になります。**

**段階 $2$ ― 頂点シェーダを最小にする**

\`gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\` だけ。

- **映った** … 頂点を動かす計算が壊れている。
  $0$ で割った、\`uniform\` が \`undefined\`、行列の掛ける順が逆
- **映らない** … シェーダの外。メッシュがシーンに入っているか、
  カメラの \`near\`/\`far\` の外にないか、大きさが $0$ でないか

**段階 $3$ ― 値を $1$ つずつ色にする**

疑わしい値を、順に \`gl_FragColor\` に出します。

\`gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);\`

- **一様な色** … その値が定数になっている（計算されていない）
- **真っ黒** … その値が $0$、または NaN
- **模様が出た** … その値は正しい。次の値へ

**上流から順に**見てください。UV → 法線 → ライトとの内積 → 最終色。

**段階 $4$ ― マテリアルの設定を疑う**

- **\`side\`** … 板の裏を見ていませんか。\`DoubleSide\` にしてみる
- **\`transparent: true\`** … alpha が $0$ になっていませんか
- **\`gl_FragColor\` の $4$ つ目** … \`vec4(color, 1.0)\` の \`1.0\` を忘れていませんか

**この $4$ つ目が、実はいちばん多い。**
\`vec4(color, 0.0)\` と書いてしまうと、計算は全部合っているのに何も見えません。

**なぜこの順番か**

**「疑う範囲を半分にする」を繰り返しているからです。**

段階 $1$ でシェーダの内か外かが決まり、
段階 $2$ で頂点かフラグメントかが決まる。

思いついたところから直し始めると、
**当たるまで何時間でもかかります。**`,
    },
    {
      prompt: `地形の高さ \`vPos.y\` が、$-3$ から $7$ の範囲で分布しています。
これを**白黒の濃淡**で見たい。

1. どう写しますか。
2. 高さ $2$ の点は、どんな色になりますか。
3. 範囲を間違えて $0$ 〜 $10$ で写した場合、高さ $2$ は何色になりますか。`,
      hint: '$c = \\dfrac{v - v_{\\min}}{v_{\\max} - v_{\\min}}$。',
      answer: `**1. $(y+3)/10$。2. $0.5$ の灰色。3. $0.2$ の暗い灰色。**

**1 ― 写し方**

最小値を引いて、幅で割ります。

$c = \\dfrac{y - (-3)}{7 - (-3)} = \\dfrac{y + 3}{10}$

GLSL では \`float c = (vPos.y + 3.0) / 10.0;\`

**\`clamp(c, 0.0, 1.0)\` を付けてください。** 範囲の見積もりが甘いと
$1$ を超えたところが白飛びし、$0$ を下回ったところが真っ黒になって、
**どちらも「そこで何が起きているか」が見えなくなります。**

**2 ― 高さ $2$**

$c = \\dfrac{2 + 3}{10} = \\dfrac{5}{10} = 0.5$

**ちょうど中間の灰色**（$8$ ビットで $128$）です。

**3 ― 範囲を間違えた場合**

$0$ 〜 $10$ で写すと

$c = \\dfrac{2 - 0}{10 - 0} = 0.2$

**暗い灰色**（$51$）になります。

そして**負の高さは全部 $0$ に潰れます** ― 谷底の様子が何も見えません。

**ここが大事なところ**

**デバッグ表示は、範囲を合わせないと嘘をつきます。**

「地形の下半分が真っ黒だ、法線が壊れている」と思って何時間も探したら、
実は写す範囲が間違っていただけ ― これは本当によくあります。

**範囲が分からないときは**

$2$ 段階でやってください。

**a. まず広めの範囲で写して、全体がどこに収まっているかを見る**
（$0.1$ 〜 $0.9$ の灰色に収まっていれば、範囲は妥当）

**b. そのあと範囲を詰めて、細かい違いを見る**

**あるいは、色相で写す。** 値を $0$ 〜 $1$ にしてから虹色に写すと、
白黒より $10$ 倍くらい細かい違いが読めます。`,
      answerCode: `// 範囲を合わせて、はみ出しは clamp する
float c = clamp((vPos.y + 3.0) / 10.0, 0.0, 1.0);
gl_FragColor = vec4(vec3(c), 1.0);

// 白黒より細かく読みたいときは、虹色に写す
vec3 turbo(float t) {
  return clamp(vec3(
    abs(t * 6.0 - 3.0) - 1.0,
    2.0 - abs(t * 6.0 - 2.0),
    2.0 - abs(t * 6.0 - 4.0)
  ), 0.0, 1.0);
}
gl_FragColor = vec4(turbo(c), 1.0);`,
    },
  ],
  quiz: [
    {
      q: '`float t = 1;` がエラーになります。なぜですか。',
      choices: [
        'GLSL に暗黙の型変換がなく、`1` は int だから',
        '変数名が短すぎるから',
        '`float` は使えないから',
        'セミコロンが足りないから',
      ],
      answer: 0,
      explain:
        '`1.0` と書きます。`vec3(0, 0, 1)` も同じ理由でエラーです。数値には必ず小数点を打つ、を習慣にしてください。ただし `for (int i = 0; i < 8; i++)` の 0 と 8 は int なので正しい。',
    },
    {
      q: '自作の ShaderMaterial が真っ黒です。最初に何をしますか。',
      choices: [
        '`gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);` だけにして、赤くなるか見る',
        '法線を計算し直す',
        'ライトを増やす',
        'テクスチャを差し替える',
      ],
      answer: 0,
      explain:
        '赤くなればフラグメントシェーダには届いていて、原因は色の計算の中。真っ黒のままなら、そもそも描かれていません。この 1 手で探す範囲が半分になります。',
    },
    {
      q: '法線を `n * 0.5 + 0.5` で色にしたら、画面が一様な明るい緑でした。何が分かりますか。',
      choices: [
        '法線が全部 +y（真上）を向いている',
        '法線は正しい',
        'ライトが無い',
        'UV が壊れている',
      ],
      answer: 0,
      explain:
        '(0.5, 1.0, 0.5) は +y です。全部が同じ向きということは、computeVertexNormals を忘れたか、頂点を動かしたあとに法線を取り直していないか、シェーダで上書きしています。',
    },
  ],
};
