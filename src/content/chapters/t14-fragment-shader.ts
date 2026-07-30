import type { Chapter } from '../types.ts';

export const chapterT14: Chapter = {
  slug: 't14-fragment-shader',
  part: 'threejs',
  number: 14,
  title: 'フラグメントシェーダ ― 色を決める',
  goal: 'UV から模様を作れるようになり、法線と光の内積で陰影を自分の手で書けるようになります。',
  requires: ['t13-vertex-shader', '11-normal-light'],
  threeApis: ['ShaderMaterial', 'Texture', 'Uniform', 'Vector2', 'Vector3', 'Color'],
  mathRecall: [
    { slug: '03-dot', note: '明るさは内積ひとつで決まる' },
    { slug: '11-normal-light', note: 'ランバート反射と反射ベクトル' },
    { slug: '13-random', note: 'ノイズで自然なばらつきを作る' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 画素ごとに、自分がどこにいるかを知っている

フラグメントシェーダの仕事は 1 つだけ——**この画素を何色にするか**を決めることです。

手がかりになるのは、頂点シェーダから \`varying\` で届いた値です。
なかでも **UV**（[](#/ch/t04-texture)）が主役になります。
「面の中で自分がどこにいるか」が 0〜1 で分かるので、そこから模様を組み立てます。

**画像を貼るのではなく、計算で模様を作る**——これがシェーダの醍醐味です。
拡大しても粗くならず、ファイルも要りません。
`,
    },
    {
      kind: 'md',
      text: `
## 模様を作る4つの道具

覚えるのはこれだけで、驚くほど多くの模様が作れます。

- **\`fract(x)\`** … 小数部分だけを取り出す。**繰り返しを作る心臓部**。
  \`fract(uv.x * 5.0)\` で、0〜1 が 5 回繰り返されます
- **\`step(edge, x)\`** … x が edge 未満なら 0、以上なら 1。**くっきりした境目**
- **\`smoothstep(a, b, x)\`** … step のふちをなめらかにしたもの。
  [](#/ch/08-interp)で出てきた曲線そのものです
- **\`mix(a, b, t)\`** … 2 つを t の割合で混ぜる。**GLSL の lerp** です

そして距離。\`length(uv - vec2(0.5))\` で中心からの距離が出れば、
[](#/ch/02-vector)でやったとおり、円が描けます。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathrm{smoothstep}(a, b, x) = t^2(3 - 2t), \\quad t = \\mathrm{clamp}\\!\\left(\\tfrac{x-a}{b-a}, 0, 1\\right)',
      readAloud:
        'x が a のとき 0、b のとき 1 になり、そのあいだをなめらかに繋ぐ関数です。第1部の第8章で出てきたイージングの式と同じものが、ここでも使われています。ふちのギザギザを消すのに欠かせません。',
      worked: {
        given: '$a = 0.3$、$b = 0.5$ として、3 つの $x$ を通します。',
        steps: [
          { calc: 'x = 0.25 : t = (0.25-0.3)/0.2 = -0.25' },
          { calc: '           clamp して t = 0  → 0', note: '範囲より手前は 0 で止まる' },
          { calc: 'x = 0.40 : t = (0.40-0.3)/0.2 = 0.5' },
          { calc: '           0.5の2乗 x (3-1) = 0.5' },
          { calc: 'x = 0.55 : t = (0.55-0.3)/0.2 = 1.25' },
          { calc: '           clamp して t = 1  → 1', note: '範囲より先は 1 で止まる' },
        ],
        result: '**0 → 0.5 → 1** と、$a$ と $b$ のあいだだけでなめらかに切り替わりました。`if (x > 0.4)` と書くとふちがギザギザになりますが、これなら 0.2 ぶんの幅でぼけます。**境目をぼかす道具**として、模様のふち・影のふち・霧の切れ目に使います。',
      },
    },
    {
      kind: 'sandbox',
      title: 'UV から模様を作る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 4.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uCells: { value: 6.0 },   // 何回繰り返すか
  },
  vertexShader: \`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  \`,
  fragmentShader: \`
    uniform float uTime;
    uniform float uCells;
    varying vec2 vUv;

    void main() {
      // (1) fract で繰り返す ― 0〜1 が uCells 回くり返される
      vec2 cell = fract(vUv * uCells);

      // (2) 各マスの中心からの距離 ― これがベクトルの長さそのもの
      float d = length(cell - vec2(0.5));

      // (3) smoothstep でふちをなめらかに切る ― step だとギザギザになる
      float radius = 0.28 + sin(uTime * 1.5) * 0.10;
      float circle = 1.0 - smoothstep(radius, radius + 0.02, d);

      // (4) 斜めの縞。fract を使わず sin でもよい
      float stripe = step(0.5, fract((vUv.x + vUv.y) * 8.0 - uTime * 0.3));

      vec3 background = mix(vec3(0.05, 0.07, 0.12), vec3(0.10, 0.13, 0.22), stripe);
      vec3 color = mix(background, vec3(0.31, 0.84, 1.00), circle);

      gl_FragColor = vec4(color, 1.0);
    }
  \`,
});

scene.add(new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), material));

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
        '`smoothstep` を `step(radius, d)` に置き換えると、円のふちが階段状にギザギザになります。`fract(vUv * uCells)` の fract を外すと、繰り返しが消えて 1 つの大きな模様になります。',
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'if より mix と step',
      text: `
GPU は「隣とまとめて同じ計算をする」ことで速さを稼いでいます。
\`if\` で処理が枝分かれすると、**両方の枝を計算してから捨てる**ことになりがちで、
かえって遅くなります。

\`step\` や \`smoothstep\` で 0/1 の値を作り、\`mix\` で混ぜる書き方に置き換えると、
枝分かれなしで同じことができます。慣れるとこちらのほうが短く書けます。
`,
    },
    {
      kind: 'md',
      text: `
## 陰影を自分で書く

ここが第1部の総決算です。[](#/ch/03-dot)と
[](#/ch/11-normal-light)でやったことを、そのまま GLSL に書きます。

明るさは、**法線と光の向きの内積**でした。マイナスは 0 で止めます。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{明るさ} = \\max\\!\\left(0,\\; \\mathbf{n}\\cdot\\mathbf{l}\\right)',
      readAloud:
        '第1部の第11章で出てきた式と、一字一句同じものです。GLSL では max(dot(n, l), 0.0) と書きます。dot がそのまま内積の関数として用意されています。',
      worked: {
        given: '真上を向いた面 $\\mathbf{n} = (0,\\,1,\\,0)$ に、斜めの光 $\\mathbf{l} = (0.6,\\,0.8,\\,0)$ が当たったとき。',
        steps: [
          { calc: 'dot(n, l) = 0x0.6 + 1x0.8 + 0x0 = 0.8' },
          { calc: 'max(0.8, 0.0) = 0.8', note: 'プラスなのでそのまま' },
          { calc: '裏から  l = (0, -1, 0) なら' },
          { calc: '  dot = -1  →  max(-1, 0.0) = 0', note: 'マイナスの明るさは存在しない' },
        ],
        result: '[](#/ch/11-normal-light) で手で計算したのと、**一字一句同じ結果**です。違うのは、そこでは 1 点だったのが、ここでは**画素ごとに GPU が同時にやっている**という点だけ。数学は 1 つも増えていません。',
      },
    },
    {
      kind: 'md',
      text: `
注意が 1 つあります。**法線は varying で渡すと補間で長さが狂います。**
長さ 1 の 2 本を混ぜても、途中は長さ 1 になりません
（[](#/ch/02-vector)の正規化の話です）。
そのため、**フラグメントシェーダ側でもう一度 \`normalize\` します**。
`,
    },
    {
      kind: 'sandbox',
      title: '内積で陰影を作る（自作ランバート＋てかり）',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 4.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uBaseColor: { value: new THREE.Color(0x7fb2ff) },
    uShininess: { value: 32.0 },
  },
  vertexShader: \`
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      // 法線と位置を「カメラから見た座標系」に揃えてから渡す
      vNormal = normalMatrix * normal;

      vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = viewPosition.xyz;

      gl_Position = projectionMatrix * viewPosition;
    }
  \`,
  fragmentShader: \`
    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform float uShininess;

    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      // 補間で長さが狂っているので、必ず正規化し直す
      vec3 n = normalize(vNormal);

      // 光の向き。時間でぐるりと回す
      vec3 l = normalize(vec3(cos(uTime * 0.7), 0.6, sin(uTime * 0.7)));

      // --- ランバート：明るさ＝法線と光の内積（第1部 第3章・第11章） ---
      float diffuse = max(dot(n, l), 0.0);

      // --- てかり：反射ベクトルとカメラの向きの内積 ---
      vec3 toCamera = normalize(-vViewPosition);   // ビュー空間ではカメラが原点
      vec3 reflected = reflect(-l, n);             // 第1部 第11章の反射ベクトル
      float specular = pow(max(dot(reflected, toCamera), 0.0), uShininess);

      // 影の中が真っ黒に潰れないよう、わずかに底上げする
      vec3 ambient = uBaseColor * 0.12;

      vec3 color = ambient + uBaseColor * diffuse + vec3(1.0) * specular * 0.6;

      gl_FragColor = vec4(color, 1.0);
    }
  \`,
});

scene.add(new THREE.Mesh(new THREE.TorusKnotGeometry(1.0, 0.34, 200, 32), material));

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
        'ライトを 1 つも置いていないのに陰影がついています。すべて内積で計算しているからです。`uShininess` を 4 にするとてかりが広がって粘土のようになり、200 にすると鋭くなって金属らしくなります。`normalize(vNormal)` の normalize を外すと、面の中央あたりの明るさが崩れます。',
    },
    {
      kind: 'md',
      text: `
## いま書いたものが、Standard の中身

驚くかもしれませんが、**\`MeshStandardMaterial\` がやっていることも、根っこは同じ**です。
内積で明るさを出し、反射で光沢を作る。そこに物理的な正しさのための補正や、
環境マップ、影、複数ライトへの対応が積み重なっているだけです。

だから**シェーダは「特別な魔法」ではありません**。
第1部でやったベクトルと内積を、GPU の上で書いているだけです。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '自作シェーダにライトや影は自動で効きません',
      text: `
\`ShaderMaterial\` は白紙です。\`scene.add(light)\` してもシェーダには何も届きません。
上のサンドボックスのように、**光の向きを自分で uniform として渡す**必要があります。

three のライトを使いたいなら、\`onBeforeCompile\` で既存のマテリアルに割り込むか、
\`lights: true\` を指定して three が用意する uniform を使います。
ただしどちらも急に難しくなるので、**まずは自分で光を渡す**ところから始めてください。
`,
    },
    {
      kind: 'md',
      text: `
## 重さの感覚

フラグメントシェーダは**画素ごとに走る**ことを、いつも意識してください。

- 1 行増やすと、フル HD なら 1 フレームあたり 200 万回ぶん増えます
- \`pow\`、\`sin\`、\`normalize\` は安くありません。**ループの外に出せるものは出す**
- 頂点シェーダでできる計算は、**頂点シェーダでやる**（回数が桁違いに少ない）
- 透明を重ねると、同じ画素を何度も塗り直すことになります

「頂点シェーダに寄せられないか」を先に考えるのが、いちばん効く節約です。
`,
    },
    {
      kind: 'md',
      text: `
## ここまで来ました

第2部もこれで終わりです。振り返ると、やってきたのはこういうことでした。

- シーン・カメラ・レンダラを組み、描画ループを回した
- 形を作り、材質を選び、絵を貼り、光を当てた
- 時間で動かし、視点を操り、マウスで触れるようにした
- モデルを読み込み、シーンを整理し、速くした
- そして、GPU の上で自分の計算を走らせた

**第1部の数学が、どの場面でも顔を出していた**はずです。
ベクトルと内積が分かっていれば、シェーダまで地続きでした。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'この先に進むなら',
      text: `
- **ポストプロセス**（\`EffectComposer\`）… 描き上がった画面全体に効果をかける。ブルームなど
- **物理エンジン**（Rapier、cannon-es）… 落下・衝突・積み重なり
- **React Three Fiber** … React の書き方で Three.js を組み立てる（[](#/ch/q05-r3f)）
- **ノイズと距離場** … シェーダで地形や雲、レイマーチングの世界へ

どれも入口は違いますが、**土台は同じ**です。ここまでで作った土台は、そのまま使えます。
`,
    },
  ],
  exercises: [
    {
      prompt: '1 つ目のサンドボックスで \`uCells\` を 1.0、6.0、40.0 と変えてください。40.0 のとき模様がちらつくのはなぜでしょう。',
      hint: '1 画素の中に、模様が何本も入ってしまっていませんか。',
      answer: `1 画素あたりに模様が細かく入りすぎて、**画素ごとにどこを拾うかが飛び飛びになる**からです（エイリアシング）。
[](#/ch/05-trig) の「波の細かさを上げると格子が崩れる」とまったく同じ現象で、
**測る点より細かい模様は、正しく測れない**という一般則です。
実務では、細かくしすぎない、ミップマップに任せる、\`fwidth\` で境目をぼかす、といった手を使います。`,
    },
    {
      prompt: '2 つ目のサンドボックス（自作ランバート）で \`uShininess\` を 2.0 と 128.0 にしてください。てかりはどう変わりますか。それは現実の何に対応しますか。',
      hint: 'てかりの広さを見てください。',
      answer: `2.0 では**広くぼんやり**、128.0 では**狭く鋭く**光ります。
広いてかりはざらついた表面（つや消し）、狭いてかりは磨かれた表面に対応します。
\`MeshStandardMaterial\` の \`roughness\` が担っているのと同じ役割で、
向きは逆（\`roughness\` が小さいほど、この \`shininess\` が大きいほう）です。`,
    },
    {
      prompt: '\`vNormal = normalMatrix * normal;\` の \`normalMatrix\` を、ただの \`modelViewMatrix\` に置き換えられない理由を説明してください。',
      hint: '拡大率が縦横で違う（非一様な scale）物体を想像してください。',
      answer: `**法線は位置と同じようには変換できない**からです。
たとえば x 方向にだけ 2 倍に引き伸ばすと、面の傾きは「2 倍」ではなく逆に寝る方向へ変わります。
そのため法線には、モデルビュー行列の**逆行列の転置**（\`normalMatrix\`）を使います。
three が自動で用意してくれているので、\`ShaderMaterial\` では \`normalMatrix\` と書くだけで済みます。`,
    },
  ],
  quiz: [
    {
      q: '`fract(uv.x * 5.0)` は何をしますか。',
      choices: [
        '0〜1 の値を 5 回繰り返す（模様の繰り返しを作る）',
        '値を 5 分の 1 にする',
        '5 以上を切り捨てる',
        '5 段階に量子化する',
      ],
      answer: 0,
      explain:
        '`fract` は小数部分だけを取り出します。5 倍してから小数部分を取ると、0→1 が 5 回繰り返されます。タイル状の模様を作る心臓部です。',
    },
    {
      q: 'varying で渡した法線を、フラグメントシェーダで `normalize` し直すのはなぜですか。',
      choices: [
        '補間の途中では長さが 1 でなくなるから',
        '向きが逆になるから',
        '型が変わるから',
        'GPU の仕様で必須だから',
      ],
      answer: 0,
      explain:
        '長さ 1 の 2 本を混ぜても、途中の値の長さは 1 になりません。内積で明るさを出すには長さ 1 である必要があるので、使う直前に正規化します。',
    },
    {
      q: '`ShaderMaterial` で書いたマテリアルに、`scene.add(new THREE.DirectionalLight(...))` の光は届きますか。',
      choices: [
        '届かない。光の向きは自分で uniform として渡す必要がある',
        '自動的に届く',
        'ライトの数だけ自動で uniform が増える',
        'AmbientLight だけ届く',
      ],
      answer: 0,
      explain:
        '`ShaderMaterial` は白紙です。three のライトを使いたければ `lights: true` を指定するか、既存マテリアルに `onBeforeCompile` で割り込みます。まずは自分で渡すのが分かりやすい方法です。',
    },
  ],
};
