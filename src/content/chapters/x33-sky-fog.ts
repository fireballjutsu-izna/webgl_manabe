import type { Chapter } from '../types.ts';

export const chapterX33: Chapter = {
  slug: 'x33-sky-fog',
  part: 'project',
  number: 33,
  title: '空と、遠くの色 ― 夜を真っ黒にしない',
  goal: '空とフォグの色を時刻から導けるようになり、夜の背景を真っ黒にしてはいけない理由を、輪郭という観点から説明できるようになります。',
  requires: ['x32-shadow-range', 'w13-color-space', 'x24-eye-level'],
  threeApis: ['Scene.background', 'Scene.fog', 'Fog.color', 'Color.lerpColors'],
  mathRecall: [
    { slug: '08-interp', note: '$2$ 色を混ぜる。$\\mathrm{lerp}$ そのもの' },
    { slug: 'b36-smoothstep', note: '地平線の近さも、なめらかに' },
    { slug: 'x24-eye-level', note: 'フォグで世界の果てを隠した' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 空も、太陽の高さから導く

空の色は、$2$ 段で作ります。

- **夜の色と昼の色を、\`daylight\` で混ぜる**
- **地平線に近いときだけ、夕焼けのオレンジを足す**

$1$ つめは[](#/ch/08-interp)そのままです。
$2$ つめの「地平線に近いとき」は、**太陽の高さの絶対値**が小さいとき ―
朝と夕方の両方で、同じ式が効きます。
`,
    },
    {
      kind: 'formula',
      tex: 'c \\;=\\; \\mathrm{lerp}\\bigl(\\mathrm{lerp}(c_{\\text{夜}},\\, c_{\\text{昼}},\\, d),\\; c_{\\text{夕}},\\; 0.55\\,h\\bigr), \\quad h = \\mathrm{smoothstep}(0.35,\\, 0,\\, |s_y|)',
      readAloud:
        'まず夜と昼を $\\mathrm{daylight}$ で混ぜ、その結果と夕焼け色を「地平線の近さ $h$」で混ぜます。$h$ は太陽の高さの絶対値が $0.35$ で $0$、$0$ で $1$ になる値。$0.55$ を掛けているのは、夕焼けで空が完全にオレンジにはならないからです。',
      worked: {
        given:
          '$c_{\\text{夜}} = 0\\text{x0d1226}$、$c_{\\text{昼}} = 0\\text{x6f9fd8}$、$c_{\\text{夕}} = 0\\text{xff8a4a}$。太陽の高さごとに、出てくる色を追います。',
        steps: [
          { calc: 's_y = 1.00 : d=1.000 h=0.000' },
          { calc: '  → #6f9fd8', note: '正午の青' },
          { calc: 's_y = 0.25 : d=1.000 h=0.198' },
          { calc: '  → #899dce', note: '少し赤みが差す' },
          { calc: 's_y = 0.05 : d=0.259 h=0.945' },
          { calc: '  → #c27564', note: '日の出直前。いちばん赤い' },
          { calc: 's_y = -0.05: d=0.000 h=0.945' },
          { calc: '  → #bf673c', note: '日没直後' },
          { calc: 's_y = -0.50: d=0.000 h=0.000' },
          { calc: '  → #0d1226', note: '夜' },
        ],
        result:
          '**いちばん赤いのは $s_y = 0.05$、太陽が地平線のわずかに上のとき**です。そこから $10$ 分ほどで $\\#0d1226$ の夜へ落ちていきます。$h$ が $0.35$ から効きはじめるので、**赤くなりはじめるのは太陽高度 $20$ 度あたり** ― 夕方の長さは、この $0.35$ が決めています。$0.55$ を $1.0$ にすると空が真っ赤になり、火星か終末の絵になります。',
      },
    },
    {
      kind: 'md',
      text: `
## フォグの色は、空の色と同じにする

[](#/ch/x24-eye-level)でフォグを入れて、街の果てを隠しました。
時刻が動くようになった以上、**フォグの色も一緒に動かす**必要があります。

そして色は、**空とまったく同じ値**にします。

理由は単純です。フォグは「遠くを背景色に溶かす」ためのもので、
背景と違う色だと**溶けきったところに輪郭が出ます。**

- 空が夕焼けでフォグが青 … 遠くの街が**青くくすんで浮く**
- 空が夜でフォグが灰色 … 地平線に**灰色の帯**が見える

**$1$ つの変数を $2$ か所に渡すだけ**です。
別々に持った瞬間、必ずどこかの時刻で食い違います ―
この章のすべてが、その $1$ 点にかかっています。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '夜空を真っ黒にしないでください',
      text: `
夜の背景に $0\\text{x000000}$ を使うと、**建物の輪郭が背景に溶けて形が読めなくなります。**

この作品では $0\\text{x0d1226}$ を使っています。
リニアの値で $(0.004,\\; 0.006,\\; 0.019)$ ― ほとんど黒ですが、**わずかに青い。**

それだけで、暗い建物のシルエットが背景から立ち上がります。

実際の夜空も真っ黒ではありません。
街の明かりを反射して、青や紫に濁っています。

**輪郭が見えることは、情報です。**
色を情報の唯一の手がかりにしないのと同じで、
**形が見えることは、いちばん失ってはいけない情報**です。
夜の場面は、ここがいちばん壊れやすい場所です。
`,
    },
    {
      kind: 'sandbox',
      title: '真っ黒な夜空と、わずかに青い夜空',
      guide: { focus: ['ここだけが違う ― 空とフォグの色', '夜の街を組み立てる'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---- ここだけが違う ― 空とフォグの色 ---- */

const SKY_LEFT = 0x000000;    // 真っ黒
const SKY_RIGHT = 0x0d1226;   // わずかに青い

// 背景は 1 つのシーンに 1 色しか持てないので、
// キャンバスを 2 枚並べて、同じ街を別々の空の下で描く

document.body.style.margin = '0';
const row = document.createElement('div');
row.style.cssText = 'position:absolute; inset:0; display:flex;';
document.body.appendChild(row);

function makePanel(sky, label) {
  const holder = document.createElement('div');
  holder.style.cssText = 'position:relative; flex:1 1 0; min-width:0;';
  row.appendChild(holder);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(sky);
  scene.fog = new THREE.Fog(sky, 40, 150);   // フォグの色は、必ず空と同じ

  const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 400);
  camera.position.set(0, 14, 62);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  holder.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'display:block; width:100%; height:100%;';

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 8, 0);
  controls.maxPolarAngle = Math.PI * 0.495;

  // 夜。太陽は地面の下なので、街を照らすのは環境光だけ
  scene.add(new THREE.HemisphereLight(0x24314f, 0x14161c, 0.55));
  scene.add(buildCity(sky));

  const div = document.createElement('div');
  div.textContent = label;
  div.style.cssText =
    'position:absolute; bottom:14px; left:50%; transform:translateX(-50%);' +
    'color:#e8e8f2; font:12px sans-serif; pointer-events:none; white-space:nowrap;';
  holder.appendChild(div);

  return { holder: holder, scene: scene, camera: camera, renderer: renderer, controls: controls };
}

/* ---- 夜の街を組み立てる ---- */
// 2 枚のパネルで、まったく同じ街を作る（種が同じなので同じ並びになる）

function buildCity(sky) {
  const group = new THREE.Group();
  const rand = makeRandom(4242);

  for (let i = 0; i < 40; i++) {
    const w = 3 + rand() * 5;
    const d = 3 + rand() * 5;
    const h = 5 + rand() * 26;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9 }),
    );
    box.position.set((rand() - 0.5) * 70, h / 2, (rand() - 0.5) * 50);
    group.add(box);
  }

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x2a2d36, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);
  return group;
}

const panels = [
  makePanel(SKY_LEFT, '真っ黒（0x000000）― 輪郭が消える'),
  makePanel(SKY_RIGHT, 'わずかに青い（0x0d1226）'),
];

function resize() {
  for (const panel of panels) {
    const w = panel.holder.clientWidth;
    const h = panel.holder.clientHeight;
    panel.camera.aspect = w / h;
    panel.camera.updateProjectionMatrix();
    panel.renderer.setSize(w, h, false);
  }
}
resize();
window.addEventListener('resize', resize);

// 2 枚を同じ視点で動かす（左を回すと右も同じだけ回る）
panels[0].controls.addEventListener('change', () => {
  panels[1].camera.position.copy(panels[0].camera.position);
  panels[1].controls.target.copy(panels[0].controls.target);
});

function animate() {
  requestAnimationFrame(animate);
  for (const panel of panels) {
    panel.controls.update();
    panel.renderer.render(panel.scene, panel.camera);
  }
}
animate();

/* ---- 下ごしらえ：決め打ちの乱数 ---- */

function makeRandom(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}`,
      caption:
        '**同じ街、同じ光、同じ建物の色です。**違うのは空とフォグの色 $1$ つだけ。左は建物が背景に溶けて、どこまでがビルなのか分かりません。右は同じ暗さなのに、輪郭が立ち、遠くのビルほど霧に沈んでいくのも見えます。左のパネルをドラッグすると右も同じだけ回るので、どの角度でも比べられます。`SKY_LEFT` を `0x0d1226` にすると左右が揃い、差がこの $1$ 色から出ていることを確かめられます。',
    },
    {
      kind: 'md',
      text: `
## 空を「板」で描かないという選択

この街の空は、\`scene.background\` に色を入れているだけです。
グラデーションも、雲も、星もありません。

もっと凝るなら、$3$ つの道があります。

- **大きな球を内側から描く**（[](#/ch/x11-atmosphere-rim)の大気と同じ手）
- **半球のシェーダで、上下にグラデーションを付ける**
- **キューブマップ（環境マップ）を貼る**（[](#/ch/q01-environment)）

この作品が単色で済ませているのは、**フォグが空との境目を消している**からです。

地平線の付近はフォグで空の色に溶けているので、
**空にグラデーションを付けても、見えるのは上のほうだけ**です。

**足す前に、それが見える場所にあるかを確かめてください。**
`,
    },
  ],
  exercises: [
    {
      prompt: `フォグの色を空と別に持ち、$1$ 日じゅう灰色（$0\\text{x808080}$）に固定したとします。

朝・昼・夜で、それぞれどう見えますか。`,
      hint: 'フォグは遠くを何色に溶かしますか。空は何色ですか。',
      answer: `**どの時刻でも、地平線に灰色の帯が出ます。**

**時刻ごとの見え方**

- **昼**（空 $\\#6f9fd8$）… 遠くが灰色にくすみ、**曇りの日**に見える
- **夕**（空 $\\#bf673c$）… 夕焼けの中に**灰色の壁**。いちばん不自然
- **夜**（空 $\\#0d1226$）… 遠くだけ**明るい灰色**。街の外が光っているように見える

$3$ つめが最悪です。**暗い空の手前に明るい霧**があるので、
物理的にありえない絵になります。

**フォグの役割から考える**

フォグの目的は「遠くを背景に溶かす」ことでした。

溶かす先が背景と違う色なら、**溶けきったところで色が切り替わります。**
それは「隠す」の反対 ― **境目を作っている**ことになります。

**だから同じ変数を渡す**

\`const sky = skyColor(t)\` を作って、\`scene.background\` と \`scene.fog.color\` の
$2$ か所に同じものを渡します。

$2$ 行が同じ値を見ていれば、食い違いようがありません。

**これは[](#/ch/p07-city-light)の「つまみを $1$ つにする」の、いちばん小さな例**です。`,
    },
    {
      prompt: `夕焼けの混ぜ具合 $0.55$ を $1.0$ にすると、どうなりますか。

そして、なぜ $1.0$ が不自然なのでしょう。`,
      hint: '$1.0$ なら、空の色は完全に $c_{\\text{夕}}$ になります。',
      answer: `**空が一面、真っ赤になります。地球の空には見えません。**

**何が起きるか**

$h$ が $0.945$ まで上がる時刻（日の出直前・日没直後）に、
空の色が **$\\#ff8a4a$ そのもの**になります。

画面いっぱいが鮮やかなオレンジ ― 火星か、終末の絵です。

**なぜ不自然か**

実際の夕焼けで真っ赤になるのは、**太陽のある側の、地平線に近い部分だけ**です。

- 頭上 … まだ青い
- 反対側 … 紫がかった青（地球の影）

つまり、**空は $1$ 色ではありません。**

この作品は空を単色で持っているので、その分布を表現できません。
$0.55$ という中途半端な値は、**「一面が赤くはならない」という事実の、単色での近似**です。

**ちゃんとやるなら**

半球のシェーダにして、

- 太陽の方向に近いほど赤く
- 天頂は青いまま

とすれば、$1$ 段リアルになります。

**ただし、この街ではフォグが地平線を隠している**ので、
その差が見えるのは画面の上のほうだけです。

**見えないところに払わない** ― $0.55$ は、その判断の結果です。`,
    },
    {
      prompt: `夜空を $0\\text{x000000}$ にしたとき、輪郭が消えるのはなぜですか。

建物の色は $0\\text{x6b7280}$ で、真っ黒ではありません。`,
      hint: '夜の建物は、どれくらいの明るさで描かれていますか。',
      answer: `**夜の建物が、ほとんど黒に近いところまで暗くなっているからです。**

**夜の明るさ**

夜は太陽が $0$ なので、建物を照らしているのは環境光だけです。

環境光の強さは $0.5$ 程度。$0\\text{x6b7280}$ の建物は、
**リニアで $0.02$ 前後**まで落ちます。

背景が $0.000$ だと、$0.02$ との差は**わずか $0.02$** です。

**人の目は、暗い側の差に強い**

とはいえ $0.02$ は、$sRGB$ に直しても $\\#4a4a4a$ ではなく $\\#2b2b2b$ 程度 ―
**背景の $\\#000000$ とほとんど区別が付きません。**

とくに輪郭のあたりは、法線が視線とすれすれで陰影がさらに落ちるので、
**建物の縁から順に消えていきます。**

**$0\\text{x0d1226}$ が効く理由**

背景がリニアで $(0.004,\\; 0.006,\\; 0.019)$ あると、
建物の $0.02$ との**上下関係が逆転する**ところが出てきます。

- 明るい面 … 背景より明るい
- 暗い面 … **背景より暗い**

どちらでも**背景との差がある**ので、輪郭が読めます。

**真っ黒は「差が $0$ になる方向にしか行けない」色**です。
下限に張り付いているので、暗い物との差を作れません。`,
    },
  ],
  quiz: [
    {
      q: 'フォグの色を空の色と同じにするのはなぜですか。',
      choices: [
        '違う色だと、遠くが溶けきったところに色の境目が出てしまうから',
        'three が同じ色を要求するから',
        '描画が速くなるから',
        'フォグの色は空から自動で決まるから',
      ],
      answer: 0,
      explain:
        'フォグの目的は遠くを背景に溶かすことです。溶かす先が背景と違えば、溶けきった先で色が切り替わり、隠すどころか境目を作ってしまいます。とくに夜は「暗い空の手前に明るい霧」という物理的にありえない絵になります。同じ変数を 2 か所へ渡せば食い違いようがありません。',
    },
    {
      q: '空の色がいちばん赤くなるのは、太陽の高さがいくつのときですか。',
      choices: [
        's_y = 0.05 前後。地平線のわずかに上',
        's_y = 1（正午）',
        's_y = −1（真夜中）',
        's_y = 0.5',
      ],
      answer: 0,
      explain:
        '地平線の近さ h は |s_y| が 0 に近いほど大きくなり、0.35 から効きはじめます。実際に混ぜると s_y = 0.05 で #c27564、−0.05 で #bf673c ― 日の出直前と日没直後がいちばん赤くなります。夕方の長さは、この 0.35 というしきい値が決めています。',
    },
    {
      q: '夜空を 0x000000 にすると建物の輪郭が消えるのはなぜですか。',
      choices: [
        '夜の建物もリニアで 0.02 程度まで暗くなり、真っ黒との差がほとんど無くなるから',
        '建物の色が黒だから',
        'フォグが効きすぎるから',
        '環境光が強すぎるから',
      ],
      answer: 0,
      explain:
        '夜は太陽が 0 なので、0x6b7280 の建物も環境光だけでリニア 0.02 前後まで落ちます。背景が 0 だと差はわずかで、とくに輪郭付近は陰影がさらに落ちるので縁から消えていきます。0x0d1226 なら建物より明るい面と暗い面の両方ができ、どちらでも差が付くのでシルエットが読めます。',
    },
  ],
};
