import type { Chapter } from '../types.ts';

export const chapterY03: Chapter = {
  slug: 'y03-env-background',
  part: 'polish',
  number: 3,
  title: 'environment と background は、別物',
  goal: '「映り込ませるもの」と「背景として見えるもの」を分けて設定できるようになり、金属が黒いまま・背景だけきれいという食い違いを避けられるようになります。',
  requires: ['y02-pmrem', 'w12-transparent'],
  threeApis: [
    'Scene.environment',
    'Scene.background',
    'Scene.backgroundBlurriness',
    'MeshPhysicalMaterial.transmission',
    'MeshPhysicalMaterial.ior',
  ],
  mathRecall: [
    { slug: 'm34-refract', note: '透明なものの中で、道が曲がる' },
    { slug: 'q01-environment', note: '映すものが無ければ、黒い' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 混同すると、必ず詰まる

ここは全員が一度は混同するところなので、先にはっきり分けます。

- **\`scene.environment\`** … **映り込ませるもの。**
  目には見えない。マテリアルの計算にだけ使われる
- **\`scene.background\`** … **背景として見えるもの。**
  映り込みには一切関係しない

$2$ つは**まったく別の設定**で、片方を入れてももう片方には何も起きません。
`,
    },
    {
      kind: 'md',
      text: `
## 4 通り、どれも成立する

$2$ つが独立しているので、$4$ 通りの組み合わせが全部成り立ちます。

| \`environment\` | \`background\` | 見え方 |
|---|---|---|
| あり | あり | 屋外にいる感じ。いちばん自然 |
| あり | なし | **背景は無地なのに、物にはまわりが映る。** 商品写真の見せ方 |
| なし | あり | 背景はきれいなのに**金属は真っ黒。** いちばん多い失敗 |
| なし | なし | [](#/ch/t03-material)の状態 |

**$3$ 行目が、この章のいちばん大事なところ**です。

$HDR$ の背景を入れて「きれいになった」と思ったのに金属が黒いまま ―
これは \`background\` だけを設定して、\`environment\` を忘れている状態です。

逆に $2$ 行目は**わざとやる**構成です。
白背景の商品写真では、まわりの部屋を映り込ませつつ、背景は白に飛ばします。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '同じテクスチャを、両方に渡してよい',
      text: `
いちばん自然な屋外は、**同じ環境マップを $2$ つに渡す**ことです。

\`scene.environment = envTexture\` と \`scene.background = envTexture\` の $2$ 行です。

背景に写っているものが、そのまま金属に映る ―
**見ている人が「同じ場所にいる」と感じる**のは、この一致からです。

背景がぼやけていてほしいときは \`scene.backgroundBlurriness\` を $0.3$ ほどに。
$0$ から $1$ で、**背景だけ**がぼけます（映り込みは変わりません）。

被写体を目立たせたいときに効きます ―
写真で背景をぼかすのと、狙いは同じです。
`,
    },
    {
      kind: 'formula',
      tex: 'C \\;=\\; C_{\\text{env}}(\\mathbf{r})\\,F(\\theta) \\;+\\; C_{\\text{diffuse}}\\,(1 - F(\\theta))',
      readAloud:
        '面の色は、反射の向きの環境の色にフレネル $F$ を掛けたものと、拡散の色に残りを掛けたものの和です。$F$ は浅い角度ほど大きくなるので、環境マップは面の縁ほど強く効きます。',
      worked: {
        given:
          '非金属（$F_0 = 0.04$）の床を、$3$ つの角度で見ます。$F(\\theta) = F_0 + (1 - F_0)(1 - \\cos\\theta)^5$（[](#/ch/m33-fresnel)の式）。',
        steps: [
          { calc: '真上から : cosθ = 1' },
          { calc: '  F = 0.04 + 0.96 x 0 = 0.040', note: '4% だけ映る' },
          { calc: '斜め 60度 : cosθ = 0.5' },
          { calc: '  (1-0.5)の5乗 = 0.03125' },
          { calc: '  F = 0.04 + 0.96 x 0.03125 = 0.070' },
          { calc: 'かすめる 84度 : cosθ = 0.1' },
          { calc: '  (0.9)の5乗 = 0.590' },
          { calc: '  F = 0.04 + 0.96 x 0.590 = 0.607', note: '61% が映り込み' },
        ],
        result:
          '**真上から見た床は $4\\%$ しか映さないのに、かすめて見ると $61\\%$。** だから環境マップを入れると、**床の遠くのほうが劇的に変わります。** 手前は変わらないのに遠くだけ光るので、「濡れたように見える」と表現されることが多い変化です。金属では $F_0$ が色そのもの（$0.9$ 前後）なので、**どの角度でもほぼ全部が映り込み**になります。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'ガラスは「後ろにあるもの」を透かします',
      text: `
\`transmission: 1\` にしたのに真っ黒、という詰まり方をよくします。

ガラスは**自分の後ろにあるものを見せる**材質です。
**後ろが真っ黒なら、当然、真っ黒なガラス**になります。

- \`scene.background\` を出す
- あるいは、後ろに何かを置く

\`thickness\` は「ガラスの厚み」で、光の曲がり具合に効きます。
$0$ のままだと、ただの半透明な膜のように見えます。

\`ior\`（屈折率）はガラスなら $1.5$、水なら $1.33$ あたり ―
[](#/ch/m34-refract)でやった値がそのまま使えます。
`,
    },
    {
      kind: 'sandbox',
      title: '4 通りの組み合わせを、並べて見る',
      guide: { focus: ['環境マップを作る', 'ここだけが違う ― 何を設定するか'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// scene.environment と scene.background を、4 通りに組み合わせる。
// シーンは 1 つしか背景を持てないので、シーンを 4 つ作り、
// 1 枚のキャンバスを 4 分割してそれぞれに描く
// （環境マップのテクスチャは、レンダラをまたいで共有できない）

const scene0 = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(0, 1.2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setScissorTest(true);        // 区画ごとに描き分ける
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.4, 0);

/* ---- 環境マップを作る ---- */
// 上が空色、下が地面色。その間に明るい帯（窓のつもり）を 1 本

function makeEnvTexture() {
  const source = new THREE.Scene();

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(50, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: [
        'varying vec3 vPos;',
        'void main() {',
        '  vPos = position;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}',
      ].join('\\n'),
      fragmentShader: [
        'varying vec3 vPos;',
        'void main() {',
        '  vec3 d = normalize(vPos);',
        '  vec3 color = mix(vec3(0.10, 0.09, 0.08), vec3(0.30, 0.42, 0.62),',
        '                   smoothstep(-0.1, 0.25, d.y));',
        // 窓のつもりの明るい帯。金属に映ると、これが形として見える
        '  color += vec3(1.8) * smoothstep(0.10, 0.16, d.y) * (1.0 - smoothstep(0.16, 0.26, d.y));',
        '  gl_FragColor = vec4(color, 1.0);',
        '}',
      ].join('\\n'),
    }),
  );
  source.add(sky);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(source, 0.02).texture;
  pmrem.dispose();
  sky.geometry.dispose();
  sky.material.dispose();
  return texture;
}

const envTexture = makeEnvTexture();

/* ---- ここだけが違う ― 何を設定するか ---- */

const panels = [
  { env: true, bg: true, label: 'environment ＋ background' },
  { env: true, bg: false, label: 'environment だけ（商品写真）' },
  { env: false, bg: true, label: 'background だけ（よくある失敗）' },
  { env: false, bg: false, label: 'どちらも無し' },
].map((panel, index) => {
  const scene = new THREE.Scene();

  if (panel.env) scene.environment = envTexture;              // 物に効く
  scene.background = panel.bg ? envTexture : new THREE.Color(0x1a1d24);   // 目に見える

  // ライトは 1 つだけ。違いはすべて environment から来ている
  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(3, 4, 3);
  scene.add(light);

  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0xdedede, metalness: 1, roughness: 0.12 }),
  ));

  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 40, 28),
    new THREE.MeshPhysicalMaterial({
      transmission: 1, thickness: 0.6, ior: 1.5, roughness: 0.05, metalness: 0,
    }),
  );
  glass.position.set(1.9, -0.2, 0.6);
  scene.add(glass);

  const div = document.createElement('div');
  div.textContent = panel.label;
  div.style.cssText =
    'position:absolute; color:#e8e8f2; font:11px sans-serif; pointer-events:none;' +
    'white-space:nowrap; background:rgba(10,12,18,0.7); padding:3px 7px; border-radius:4px;' +
    'transform:translateX(-50%);';
  div.style.left = (index % 2 === 0 ? 25 : 75) + '%';
  div.style.top = (index < 2 ? 44 : 92) + '%';
  document.body.appendChild(div);

  return scene;
});

/* ---- 1 枚のキャンバスを 4 つに割って描く ---- */

renderer.setAnimationLoop(() => {
  controls.update();

  const w = Math.floor(renderer.domElement.clientWidth / 2);
  const h = Math.floor(renderer.domElement.clientHeight / 2);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  for (let i = 0; i < panels.length; i++) {
    const x = (i % 2) * w;
    const y = (i < 2 ? h : 0);        // 画面の下が y = 0
    renderer.setViewport(x, y, w, h);
    renderer.setScissor(x, y, w, h);
    renderer.render(panels[i], camera);
  }
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**右上（environment だけ）を見てください** ― 背景は無地なのに、金属の球にはちゃんと空と窓が映っています。**左下（background だけ）が、いちばんよくある失敗**です。背景はきれいなのに金属は真っ黒で、ガラスだけが背景を透かしています。左上を回すと $4$ つとも同じ視点になるので、どの角度でも比べられます。',
    },
    {
      kind: 'md',
      text: `
## 背景を「見せない」という選択も

背景として環境マップを出さない構成は、手抜きではありません。

- **商品写真** … 白や単色。被写体だけを見せる
- **図解** … 背景が情報を持たないほうが、伝わる
- **$UI$ の一部として置く $3D$** … ページの背景色に溶かす

いずれも \`environment\` だけを設定します。
**金属はちゃんと映り込み、背景は静かなまま**です。

このサイトのサンドボックスも、ほとんどがこの構成です ―
背景に景色があると、**説明したい形が読みにくくなる**からです。
`,
    },
  ],
  exercises: [
    {
      prompt: `$HDR$ の背景画像を \`scene.background\` に入れたのに、金属が黒いままです。

原因と、直し方を答えてください。`,
      hint: '$2$ つの設定のうち、どちらを入れましたか。',
      answer: `**\`scene.environment\` を設定していないからです。**

**直し方**

同じテクスチャを \`environment\` にも渡します。

\`scene.environment = texture\`

$HDR$ の画像なら、$\\mathrm{PMREM}$ に通してから渡すのが正しい手順です
（粗さごとの段が作られます）。

\`scene.environment = pmrem.fromEquirectangular(texture).texture\`

**なぜ間違えるのか**

「背景を入れた ＝ まわりに景色を置いた」と感じるからです。

でも three にとって、\`background\` は**カメラの後ろに貼った $1$ 枚の絵**でしかありません。
マテリアルの計算には、$1$ ミリも関与しません。

**逆も同じ**

\`environment\` だけ入れて「背景が変わらない」と悩むこともあります。
こちらは**わざとそうする構成**（商品写真）でもあるので、
どちらが欲しいのかを先に決めてください。

**覚え方**

- \`environment\` … **物に効く**
- \`background\` … **目に見える**

$2$ つとも欲しいなら、**同じテクスチャを $2$ 回渡す。**`,
    },
    {
      prompt: `非金属の床を、視線が $80$ 度（かすめる角度）で見たときのフレネルの値を求めてください。

$F_0 = 0.04$、$\\cos 80° = 0.174$。`,
      hint: '$F = F_0 + (1 - F_0)(1 - \\cos\\theta)^5$。',
      answer: `**$F = 0.410$。$41.0\\%$ が映り込みです。**

**計算**

$1 - 0.174 = 0.826$

$0.826^5 = 0.3846$

$F = 0.04 + 0.96 \\times 0.3846 = 0.410$

**真上と比べると $10$ 倍**

- 真上から … $0.040$
- $80$ 度 … $0.410$

**同じ床が、見る角度だけで $10$ 倍映るようになります。**

**これが「濡れた道路」の正体**

雨上がりの道が光って見えるのは、水膜のせいだけではありません。

**遠くの路面を、かすめる角度で見ている**からです。

足元の路面は真上に近い角度なので、$4\\%$ しか映しません。
だから**手前は普通で、遠くだけ光る** ― あの見え方になります。

**$3$ 次元でも同じことが起きます**

環境マップを入れた瞬間、床の遠くだけが変わります。

「床のマテリアルを変えていないのに、遠くだけ光り出した」と驚くのは、
このフレネルの効果です。**正しい挙動**です。`,
    },
    {
      prompt: `\`transmission: 1\` のガラス球が真っ黒です。\`environment\` は設定してあります。

何が足りませんか。`,
      hint: 'ガラスは何を見せる材質でしたか。',
      answer: `**\`scene.background\`（またはガラスの後ろに置くもの）です。**

**なぜ environment では足りないのか**

\`environment\` は**映り込み**に使われます。ガラスにも少しは映りますが、
ガラスの見た目のほとんどは**透かした先**です。

透かした先に何も無ければ ― つまり背景が真っ黒なら ― **真っ黒なガラス**になります。

**確かめ方**

ガラスの後ろに、色の付いた箱を $1$ つ置いてください。

**その箱がガラス越しに歪んで見えたら、透過は正しく動いています。**
背景が無いだけです。

**関連する設定**

- \`thickness\` … $0$ だと歪みません。ガラスの厚みに合わせて $0.5$〜$2$
- \`ior\` … ガラス $1.5$、水 $1.33$、ダイヤ $2.42$
- \`roughness\` … 上げると**すりガラス**になります

**transmission は高い**

\`transmission\` を使うと、three は**シーンをもう $1$ 回描いて**
その結果をガラスの向こう側として使います。

つまり**描画が $2$ 回**になります。
ガラスを $10$ 個置いても $2$ 回のままですが、**$0$ 個と $1$ 個の差は大きい** ―
「ガラスを $1$ つ置いたら急に重くなった」の原因はこれです。`,
    },
  ],
  quiz: [
    {
      q: '`scene.environment` と `scene.background` の関係はどれですか。',
      choices: [
        '完全に独立している。environment は物に効き、background は目に見えるだけ',
        'background を設定すると environment も自動で設定される',
        'environment を設定すると background も変わる',
        '同じものの別名',
      ],
      answer: 0,
      explain:
        'background はカメラの後ろに貼った 1 枚の絵で、マテリアルの計算には関与しません。だから background だけ入れると「背景はきれいなのに金属は真っ黒」になります ― これがいちばん多い失敗です。両方欲しいなら、同じテクスチャを 2 回渡します。',
    },
    {
      q: '非金属の床に環境マップを入れると、どこがいちばん変わりますか。',
      choices: [
        '遠く。かすめる角度ではフレネルが 4% から 40% 以上に上がるから',
        '手前。近いほど映り込みが強いから',
        '全体が均一に明るくなる',
        '変わらない',
      ],
      answer: 0,
      explain:
        'F = F₀ + (1 − F₀)(1 − cos θ)⁵ なので、真上から見た床は 4%、80 度でかすめて見ると 41% です。同じ床が角度だけで 10 倍映ります。雨上がりの道が「手前は普通で遠くだけ光る」のと同じ現象で、床のマテリアルを変えていないのに遠くだけ変わるのは正しい挙動です。',
    },
    {
      q: '`transmission: 1` のガラスが真っ黒なとき、足りないものはどれですか。',
      choices: [
        '背景か、ガラスの後ろに置くもの。ガラスは後ろにあるものを見せる材質だから',
        'environment',
        'ライト',
        'metalness',
      ],
      answer: 0,
      explain:
        'ガラスの見た目のほとんどは透かした先です。透かす先が真っ黒なら真っ黒なガラスになります。後ろに色の付いた箱を 1 つ置いて、それが歪んで見えれば透過は正しく動いています。なお transmission はシーンをもう 1 回描くので、0 個と 1 個の差は大きく出ます。',
    },
  ],
};
