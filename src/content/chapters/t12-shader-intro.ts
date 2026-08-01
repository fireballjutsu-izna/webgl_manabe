import type { Chapter } from '../types.ts';

export const chapterT12: Chapter = {
  slug: 't12-shader-intro',
  part: 'threejs',
  number: 42,
  title: 'シェーダの入口',
  goal: 'GPU で何が起きているかが分かり、ShaderMaterial に自分の GLSL を書いて動かせるようになります。',
  requires: ['t11-performance', '02-vector'],
  threeApis: [
    'ShaderMaterial',
    'RawShaderMaterial',
    'Uniform',
    'BufferAttribute',
    'Material',
    'Clock',
  ],
  mathRecall: [
    { slug: '02-vector', note: 'GLSL の vec3 は、まさにベクトル' },
    { slug: '06-matrix', note: '頂点は行列を掛けて画面へ運ばれる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## ここまでは、用意されたものを選んでいた

\`MeshStandardMaterial\` は、Three.js が書いてくれたシェーダです。
粗さや金属度といったつまみは用意されていますが、**中身そのもの**には手を出せません。

「頂点を波打たせたい」「特殊な模様を面に描きたい」——
そういうときに、自分でシェーダを書きます。

構えることはありません。**使う道具は第1部でやったベクトル・内積・三角関数がほとんど**です。
新しいのは、書く場所と、実行のされ方だけです。
`,
    },
    {
      kind: 'md',
      text: `
## CPU と GPU ― 実行のされ方が違う

JavaScript は 1 つずつ順番に処理します。GPU はそうではありません。
**同じプログラムを、何万個ものデータに対していっせいに走らせます。**

{{シェーダ}}には 2 種類あり、それぞれ走る回数がまるで違います。

- **頂点シェーダ** … **頂点 1 つにつき 1 回**。仕事は「この頂点を画面のどこに置くか」を決めること
- **フラグメントシェーダ** … **{{フラグメント}}（画素）1 つにつき 1 回**。仕事は「この画素を何色にするか」を決めること

数を実感してください。1920×1080 の画面を埋めるだけで **200 万回**フラグメントシェーダが走ります。
毎秒 60 回描くなら、**1 秒あたり 1 億 2000 万回**です。
だから「1 回の重さ」がそのまま効いてきます。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '全員に同じ指示書を配る',
      text: `
「自分の番号を見て、その位置に立ちなさい」という指示書を、何万人に一斉に配るところを想像してください。
指示書（シェーダ）は 1 枚ですが、受け取る人（頂点や画素）はそれぞれ違う番号を持っています。

**隣の人が何をしているかは分かりません。** これが GPU の重要な制約です。
「隣の画素の色を見て決める」ことは、原則としてできません。
`,
    },
    {
      kind: 'md',
      text: `
## 3種類の入り口 ― uniform・attribute・varying

シェーダに値を届ける道は 3 本あります。**この違いが分かればシェーダの半分は分かった**と言えます。

- **{{uniform}}** … **全員に同じ値**。CPU（JavaScript）から渡す。時間・色・マウス位置など
- **{{attribute}}** … **頂点ごとに違う値**。ジオメトリが持っている。位置・法線・UV など。
  **頂点シェーダでしか読めません**
- **{{varying}}** … **頂点シェーダからフラグメントシェーダへ渡す値**。
  途中の画素では、3 頂点の値が混ぜられて届きます

3 つ目が大事です。頂点は数百個しかないのに画素は数百万個ある——
そのすき間を埋めているのが補間です。[](#/ch/08-interp)の lerp が、
ここでも働いています。
`,
    },
    {
      kind: 'formula',
      tex: 'v_{\\text{画素}} = w_0 v_0 + w_1 v_1 + w_2 v_2, \\qquad w_0 + w_1 + w_2 = 1',
      readAloud:
        '三角形の中のある画素に届く varying の値は、3 つの頂点が持っていた値を、その画素の位置に応じた重みで混ぜたものになります。重みの合計は必ず 1 です。頂点に近いほど、その頂点の値が強く出ます。',
      worked: {
        given: '三角形の 3 頂点が `uv.x` として 0、1、0.5 を持っています。ある画素での重みが $(0.2,\\; 0.5,\\; 0.3)$ だったとき。',
        steps: [
          { calc: '0.2 x 0   = 0' },
          { calc: '0.5 x 1   = 0.5' },
          { calc: '0.3 x 0.5 = 0.15' },
          { calc: '合計 : 0 + 0.5 + 0.15 = 0.65' },
          { calc: '重みの確認 : 0.2 + 0.5 + 0.3 = 1', note: '合計は必ず 1。だから値が範囲の外へ飛び出さない' },
        ],
        result: '`vUv.x` はこの画素で **0.65**。頂点は 3 つしかないのに、そのあいだのすべての画素が固有の値をもらえます。**この混ぜ算を GPU が全画素ぶん自動でやってくれる**のが varying です。',
      },
    },
    {
      kind: 'md',
      text: `
## GLSL の読み方

シェーダは{{GLSL}}という言語で書きます。C に似ていますが、覚えることは多くありません。

- **型がはっきりしている** … \`float\`（小数）、\`vec2\` \`vec3\` \`vec4\`（2〜4 個組）、
  \`mat3\` \`mat4\`（行列）、\`sampler2D\`（テクスチャ）
- **\`main()\` から始まる** … 入口はこれ 1 つ
- **返り値ではなく、決まった変数に代入する** …
  頂点シェーダは \`gl_Position\`、フラグメントシェーダは \`gl_FragColor\`
- **成分は名前で取り出せる** … \`v.x\` \`v.y\` \`v.z\`、色なら \`v.r\` \`v.g\` \`v.b\`、
  \`v.xy\` のようにまとめて取り出すこともできます（これを swizzle と呼びます）

そして **いちばん多いつまずきがこれ**です。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'float に整数を書くとエラーになります',
      text: `
GLSL は型に厳しく、\`float x = 1;\` は**エラー**です。\`1.0\` と書かなければなりません。
\`vec3(1, 0, 0)\` もだめで、\`vec3(1.0, 0.0, 0.0)\` です。

同じ理由で \`float a = 1.0 / 2;\` もエラーになります。\`2.0\` と書いてください。
シェーダが真っ黒になったら、まずここを疑うとたいてい当たります。
`,
    },
    {
      kind: 'md',
      text: `
## three が用意してくれているもの

\`ShaderMaterial\` を使うと、Three.js が**よく使う uniform と attribute を自動で足してくれます**。
自分で宣言する必要はありません。

- \`projectionMatrix\` … カメラの投影行列（[](#/ch/10-camera)）
- \`modelViewMatrix\` … 物体の配置とカメラの位置をまとめた行列（[](#/ch/09-hierarchy)）
- \`position\` \`normal\` \`uv\` … その頂点の位置・法線・UV

だから頂点シェーダの最小形は、いつもこの 1 行になります。
`,
    },
    {
      kind: 'formula',
      tex: '\\texttt{gl\\_Position} = P \\cdot V\\!M \\cdot (x, y, z, 1)',
      readAloud:
        'その頂点の位置に、まず物体の配置とカメラをまとめた行列を掛け、最後に投影行列を掛けます。第1部の第6章でやった「行列は右から効く」がそのまま出ています。4 つ目の 1 は同次座標です。',
      worked: {
        given: 'カメラの画角 50 度、縦横比 1。カメラから 5 だけ奥にある、$x = 1$ の点が画面のどこに出るかを追います。',
        steps: [
          { calc: 'modelViewMatrix のあと : (1, 0, -5)', note: 'カメラから見た座標。奥がマイナス' },
          { calc: '焦点距離 f = 1 / tan(25 度)', note: '画角の半分の tan を取る' },
          { calc: '           = 1 / 0.4663 = 2.1445' },
          { calc: 'x を f 倍   : 2.1445 x 1 = 2.1445' },
          { calc: 'w には -z が入る : 5' },
          { calc: '最後に w で割る : 2.1445 / 5 = 0.4289', note: 'これが「遠くのものが小さくなる」の正体' },
        ],
        result: '画面上では **右へ 0.43**（画面の右端が 1）。**同じ $x = 1$ でも、カメラから 10 奥なら $2.1445 / 10 = 0.214$** と半分になります。遠近感は、この最後の「$w$ で割る」1 回で生まれています。',
      },
    },
    {
      kind: 'sandbox',
      title: 'いちばん小さな ShaderMaterial',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ---- 頂点シェーダ：この頂点を画面のどこに置くか ----
const vertexShader = \`
  // uv は three が用意してくれる attribute（頂点ごとの値）
  // varying に入れると、フラグメントシェーダへ補間されて届く
  varying vec2 vUv;

  void main() {
    vUv = uv;

    // position も three が用意してくれる。この1行が定型
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
\`;

// ---- フラグメントシェーダ：この画素を何色にするか ----
const fragmentShader = \`
  uniform vec3 uColor;   // 全員に同じ値。JavaScript から渡す
  uniform float uTime;

  varying vec2 vUv;      // 頂点シェーダから受け取る（名前を合わせること）

  void main() {
    // 数値は必ず小数で書く。1 ではなく 1.0
    float wave = sin(vUv.x * 20.0 + uTime * 2.0) * 0.5 + 0.5;

    // uv をそのまま色にすると、面のどこにいるかが見える
    vec3 color = mix(uColor, vec3(vUv.x, vUv.y, 1.0), wave);

    gl_FragColor = vec4(color, 1.0);
  }
\`;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uColor: { value: new THREE.Color(0x4fd6ff) },
    uTime: { value: 0 },
  },
});

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 2, 1, 1), material);
scene.add(mesh);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);

  // uniform は JavaScript 側から書き換える。needsUpdate は要らない
  material.uniforms.uTime.value = clock.getElapsedTime();

  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '`vec3(vUv.x, vUv.y, 1.0)` を `vec3(vUv.x, 0.0, 0.0)` に変えると、左から右へ赤くなるだけの単純な絵になります。`20.0` を `3.0` にすると縞が粗くなります。試しに `0.5` を `0.5` から `5` に変えてみてください。エラーになるはずです（整数だからです）。',
    },
    {
      kind: 'md',
      text: `
## uniform の渡し方と更新

\`uniforms\` に \`{ value: ... }\` の形で置くだけです。
更新も \`material.uniforms.uTime.value = ...\` と代入するだけで、
\`needsUpdate\` のような宣言は要りません。

対応は素直です。

- JavaScript の \`number\` → GLSL の \`float\`
- \`THREE.Vector2 / Vector3\` → \`vec2 / vec3\`
- \`THREE.Color\` → \`vec3\`（rgb がそのまま入ります）
- \`THREE.Matrix4\` → \`mat4\`
- \`THREE.Texture\` → \`sampler2D\`
`,
    },
    {
      kind: 'md',
      text: `
## 自分で attribute を足す

ジオメトリに独自の値を持たせて、シェーダから読むこともできます。
[](#/ch/t02-geometry)でやった \`setAttribute\` と同じ要領です。

たとえば頂点ごとに「揺れ始めるタイミング」を持たせておけば、
草がばらばらに揺れる表現が、**JavaScript 側では何もせずに**作れます。
`,
    },
    {
      kind: 'sandbox',
      title: '頂点ごとの値を渡す（attribute）',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 板の各頂点に「ずらし量」を持たせる
const geometry = new THREE.PlaneGeometry(6, 3, 60, 30);
const count = geometry.getAttribute('position').count;
const offsets = new Float32Array(count);
for (let i = 0; i < count; i++) offsets[i] = Math.random();
// 名前は自由。1頂点につき1つの値なので第2引数は 1
geometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));

const material = new THREE.ShaderMaterial({
  wireframe: true,
  uniforms: { uTime: { value: 0 } },
  vertexShader: \`
    uniform float uTime;
    attribute float aOffset;   // 自分で足した attribute。宣言が必要
    varying float vLift;

    void main() {
      // 頂点ごとに違うタイミングで持ち上がる
      float lift = sin(uTime * 2.0 + aOffset * 6.28) * 0.35;
      vLift = lift;

      vec3 moved = position;
      moved.z += lift;   // 板はまだ寝ていないので z が高さ方向

      gl_Position = projectionMatrix * modelViewMatrix * vec4(moved, 1.0);
    }
  \`,
  fragmentShader: \`
    varying float vLift;

    void main() {
      // 持ち上がっているところほど明るく
      float t = vLift * 1.4 + 0.5;
      gl_FragColor = vec4(mix(vec3(0.1, 0.3, 0.5), vec3(0.5, 0.9, 1.0), t), 1.0);
    }
  \`,
});

const mesh = new THREE.Mesh(geometry, material);
mesh.rotation.x = -Math.PI / 2.6;
scene.add(mesh);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  material.uniforms.uTime.value = clock.getElapsedTime();
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '1800 個ほどの頂点が、それぞれ別のタイミングで上下しています。JavaScript 側のループは最初の一度だけで、毎フレームやっているのは uTime に数字を1つ入れることだけです。',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'シェーダが真っ黒／何も出ないとき',
      text: `
- **整数を書いていないか。** \`1\` ではなく \`1.0\`
- **varying の名前と型が、両方のシェーダで一致しているか**
- **\`gl_Position\` に代入したか**
- **コンソールを見る。** GLSL のコンパイルエラーは、行番号つきでコンソールに出ます。
  ここを読まずに悩むのがいちばんの遠回りです
`,
    },
    {
      kind: 'md',
      text: `
## ShaderMaterial と RawShaderMaterial

- **ShaderMaterial** … three が定型の宣言（\`projectionMatrix\` や \`position\` など）を
  自動で足してくれる。**ふつうはこちら**
- **RawShaderMaterial** … 何も足さない。すべて自分で宣言する。
  中で何が起きているかを完全に把握したいときに使う

\`ShaderMaterial\` は便利ですが、**ライトや影は自動では効きません**。
\`MeshStandardMaterial\` のような陰影が欲しいなら、自分で書くか
（[](#/ch/t14-fragment-shader)でやります）、
既存のマテリアルに割り込む \`onBeforeCompile\` を使います。
`,
    },
  ],
  exercises: [
    {
      prompt: '1 つ目のサンドボックスで、\`sin(vUv.x * 20.0 + uTime * 2.0)\` の \`20.0\` を \`20\` に変えてください。何が起きますか。',
      hint: 'GLSL は JavaScript より型に厳しい言語です。',
      answer: `**コンパイルエラー**になり、何も描かれません（エラーパネルに出ます）。
GLSL では \`20\` は整数、\`20.0\` は浮動小数で、**暗黙の変換をしてくれません**。
\`float\` を期待しているところに \`int\` を渡すと、その場で止まります。
GLSL を書きはじめて最初に必ず踏むので、**小数点を付ける癖**を先に付けてしまってください。`,
    },
    {
      prompt: '頂点シェーダの \`varying vec2 vUv;\` を \`varying vec2 vUvs;\` に変え、フラグメント側はそのままにしてください。何が起きますか。',
      hint: '2 つのシェーダは、名前だけでつながっています。',
      answer: `つながりが切れます（環境によってはエラー、または受け取り側が 0 のまま真っ暗になります）。
\`varying\` は**両方のシェーダで同じ名前・同じ型で宣言されて初めて**つながります。
JavaScript のように「渡し忘れたら undefined」で済まず、黙って値が来なくなることもあるので、
**模様が出ないときは、まず名前の綴りを見比べる**のが早道です。`,
    },
    {
      prompt: '2 つ目のサンドボックス（attribute）で、\`new THREE.BufferAttribute(offsets, 1)\` の \`1\` を \`3\` にするとどうなりますか。',
      hint: '最後の数字は「1 頂点あたり何個の数字を使うか」です。',
      answer: `頂点の数が 3 分の 1 として扱われ、**大半の頂点に値が届かなくなります**（環境によってはエラー）。
\`itemSize\` は「1 頂点あたりいくつ」の指定なので、\`float\` の attribute なら 1、
\`vec3\` の attribute なら 3 でなければなりません。
**GLSL 側の型と、この数字は必ず一致させます。**`,
    },
  ],
  quiz: [
    {
      q: 'フラグメントシェーダは、1フレームあたりおよそ何回走りますか。',
      choices: [
        '塗られる画素の数だけ（フル HD なら数百万回）',
        '頂点の数だけ',
        'メッシュの数だけ',
        '1回だけ',
      ],
      answer: 0,
      explain:
        '画素 1 つにつき 1 回です。だから 1 回あたりの重さがそのまま効きます。頂点の数だけ走るのは頂点シェーダのほうです。',
    },
    {
      q: '頂点シェーダからフラグメントシェーダへ値を渡すのに使うのはどれですか。',
      choices: ['varying', 'uniform', 'attribute', 'sampler2D'],
      answer: 0,
      explain:
        'varying で渡した値は、三角形の内側では 3 頂点の値が重みつきで混ぜられて届きます。uniform は全員に同じ値、attribute は頂点ごとの入力です。',
    },
    {
      q: 'GLSL で `float x = 1;` と書くとどうなりますか。',
      choices: [
        'コンパイルエラーになる（`1.0` と書く必要がある）',
        '問題なく動く',
        '警告は出るが動く',
        '0 になる',
      ],
      answer: 0,
      explain:
        'GLSL は型に厳しく、整数と小数を混ぜられません。`vec3(1, 0, 0)` も同じ理由でエラーです。シェーダが動かないときは、まずここを見てください。',
    },
  ],
};
