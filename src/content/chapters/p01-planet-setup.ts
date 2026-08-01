import type { Chapter } from '../types.ts';

export const chapterP01: Chapter = {
  slug: 'p01-planet-setup',
  part: 'project',
  number: 1,
  title: '惑星ビューアー ― 骨組みと星空',
  goal: '作るものを先に決めてから手を動かす順番が身につき、球面に点を一様にばらまけるようになります。',
  requires: ['t07-controls', '02-vector', '13-random'],
  threeApis: [
    'Points',
    'PointsMaterial',
    'BufferGeometry',
    'BufferAttribute',
    'BufferGeometry.setAttribute',
    'MathUtils.randFloatSpread',
    'Color.setHSL',
    'OrbitControls',
  ],
  mathRecall: [
    { slug: '02-vector', note: '長さ 1 に揃える（正規化）' },
    { slug: '05-trig', note: '角度から x と z を出す' },
    { slug: '13-random', note: '一様乱数の癖' },
    { slug: 't01-first-scene', note: 'シーン・カメラ・レンダラの3点セット' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## ここからは、作品を作ります

第2部までは「部品の使い方」を 1 つずつ見てきました。第3部は逆で、
**作品を 1 つ決めて、それを完成させるために必要なものを取りに行きます。**

作るのは 2 つです。

- **惑星ビューアー**（この章から 4 章）… 惑星が回り、月がまわり、大気が光る。触って眺めるもの
- **ローポリの街**（後半 4 章）… 街路と建物を手続き的に生成し、朝から夜へ移る風景

**素材は 1 つも用意しません。** 画像もモデルも音も、すべてコードで作ります。
そのぶん「なぜこの形になるのか」が全部見えるので、作ったあとに好きに変えられます。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'まず「完成」を1行で書く',
      text: `
作り始める前に、完成した姿を 1 行で書いてみてください。ここでは次にします。

**「星空の中に惑星が 1 つ浮かび、月がまわり、マウスで自由に眺められる」**

この 1 行があると、迷ったときに戻れます。逆に、書けないまま手を動かすと、
きれいな球は出るのに「で、これは何なのか」が分からないものができあがります。
`,
    },
    {
      kind: 'md',
      text: `
## 段取りを決める

1 行の仕様を、動かせる単位に割ります。**各段階の終わりで必ず画面に何か出る**ように割るのがコツです。

- **この章** … 骨組み（シーン・カメラ・操作・描画ループ）と**星空**。惑星の場所には仮の球を置く
- **[](#/ch/p02-planet-surface)** … 惑星の表面をコードで描く（海・陸・雪・凹凸）
- **[](#/ch/p03-planet-atmosphere)** … 大気の光、雲、昼と夜の境目
- **[](#/ch/p04-planet-orbits)** … 自転と公転、月、クリックで寄っていく視点

「全部できてから動かす」は、どこで間違えたのか分からなくなるので避けます。
**1 つ足すたびに動かす。** これが実践編で唯一いちばん大事な作法です。
`,
    },
    {
      kind: 'md',
      text: `
## 骨組みは第2部の総復習

最初のコードに新しいものはほとんどありません。[](#/ch/t01-first-scene) の 3 点セット、
[](#/ch/t06-loop-clock) の {{描画ループ}}、[](#/ch/t07-controls) の \`OrbitControls\` を並べるだけです。

1 つだけ、これまでと変える点があります。**\`far\` を大きく取ります。**
星空をずっと遠くに置くので、そこまで写る必要があるからです。
`,
    },
    {
      kind: 'sandbox',
      title: '骨組みと星空',
      guide: { focus: ['星空'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---- 骨組み ---- */

const scene = new THREE.Scene();

// 星空を遠くに置くので far を大きく取る
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 1.4, 6.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 2.6;   // 惑星の中に入り込めないようにする
controls.maxDistance = 40;

/* ---- 星空 ---- */

function createStars(count, radius) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // 球面に一様にばらまく。y を一様に振るのが要点（後で理由を見ます）
    const y = THREE.MathUtils.randFloatSpread(2);  // -1 〜 1 の一様
    const r = Math.sqrt(1 - y * y);                // その高さでの断面の半径
    const theta = Math.random() * Math.PI * 2;

    positions[i * 3 + 0] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;

    // 青白い星と橙の星を混ぜる。明るさもばらす
    color.setHSL(0.58 - Math.random() * 0.5 * Math.random(), 0.5, 0.55 + Math.random() * 0.45);
    colors[i * 3 + 0] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 1.6,
    sizeAttenuation: false,  // 距離で小さくしない（大きさをピクセルで決める）
    vertexColors: true,      // 頂点ごとの色を使う
    depthWrite: false,       // 手前のものを隠さない
  }));
}

scene.add(createStars(4000, 1200));

/* ---- 惑星の場所に、いまは仮の球を置く ---- */

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(1.6, 64, 48),
  new THREE.MeshStandardMaterial({ color: 0x6f7d95, roughness: 0.85 }),
);
scene.add(planet);

// 太陽。位置ではなく「向き」だけが意味を持つ
const sun = new THREE.DirectionalLight(0xfff2e0, 3.2);
sun.position.set(5, 2, 3);
scene.add(sun);

// 影の側が真っ黒に潰れないよう、ごく弱い環境光を足す
scene.add(new THREE.AmbientLight(0x3a4a6a, 0.35));

/* ---- 描画ループ ---- */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  planet.rotation.y += dt * 0.08;
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
        'ドラッグで見回せます。`createStars(4000, 1200)` の半径を 20 に縮めると、星が惑星のすぐ外に並んで一気に嘘くさくなります。`sizeAttenuation` を true にすると、遠い星が小さくなりすぎてほとんど消えます。',
    },
    {
      kind: 'md',
      text: `
## 球面に一様にばらまく ― 素直な方法は失敗する

星をばらまくとき、最初に思いつくのはこれです。

**「緯度を -90°〜90° の一様乱数、経度を 0°〜360° の一様乱数にする」**

ところがこれをやると、**点は北極と南極に密集します。**
理由は地球儀を思い出せば分かります。**緯度 1 度ぶんの帯の面積は、赤道では広く、極では狭い**からです。
狭い場所に同じ数を配ると、そこが混みます。

もう 1 つ、よくある方法も外れます。
**「立方体の中に一様に置いて、長さ 1 に揃える（正規化する）」**。
[](#/ch/02-vector) でやった{{正規化}}です。これは**立方体の角の方向に寄ります。**
中心から角までは辺の中心までより遠く（$\\sqrt{3}$ 倍）、そのぶん角の方向には多くの点が並んでいるからです。

正しいやり方は意外な形をしています。**高さ $y$ を一様に振る**のです。
`,
    },
    {
      kind: 'formula',
      tex: 'y \\sim U(-1, 1),\\quad \\theta \\sim U(0, 2\\pi),\\quad r = \\sqrt{1 - y^2}',
      readAloud:
        'y を -1 から 1 の一様乱数、θ（シータ）を 0 から 360 度の一様乱数として、r（半径）をルート 1 引く y の 2 乗にする、と読みます。この r は「高さ y で球を水平に切ったときの、切り口の円の半径」です。',
      worked: {
        given: '$y$ を 3 か所に取って、そのときの切り口の半径 $r$ を見ます。',
        steps: [
          { calc: 'y = 0    : r = ルート(1 - 0)    = 1', note: '赤道。切り口がいちばん大きい' },
          { calc: 'y = 0.6  : r = ルート(1 - 0.36) = 0.8' },
          { calc: 'y = 0.99 : r = ルート(1 - 0.98) = 0.141', note: '極のすぐ手前。切り口が小さい' },
        ],
        result: '$y$ を一様に振ると、**極の近くには狭い切り口しか割り当てられません**。そこに落ちる点も少なくなるので、球の表面では一様になります。緯度を一様に振ると、この狭い切り口に赤道と同じ数の点を詰めることになり、極に集まってしまいます。',
      },
    },
    {
      kind: 'formula',
      tex: '(x, y, z) = (r\\cos\\theta,\\; y,\\; r\\sin\\theta)',
      readAloud:
        'x は r かけるコサインシータ、y はそのまま y、z は r かけるサインシータ。三角関数の章でやった「角度から座標を出す」を、切り口の円の上でやっているだけです。',
      worked: {
        given: '$y = 0.6$（$r = 0.8$）で、$\\theta = 60$ 度のとき。',
        steps: [
          { calc: 'x = 0.8 x cos 60 度 = 0.8 x 0.5   = 0.4' },
          { calc: 'y = 0.6', note: 'y は切り口の高さそのもの' },
          { calc: 'z = 0.8 x sin 60 度 = 0.8 x 0.866 = 0.693' },
          { calc: '確かめ : 0.4の2乗 + 0.6の2乗 + 0.693の2乗' },
          { calc: '       = 0.16 + 0.36 + 0.48 = 1.0', note: '原点からの距離が 1 ＝ 球の上にいる' },
        ],
        result: '$(0.4,\\; 0.6,\\; 0.693)$。**[](#/ch/05-trig) の単位円を、高さ $y$ の切り口の上でやっているだけ**です。半径が 1 ではなく $r$ になっているところだけが違います。',
      },
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: 'みかんの皮',
      text: `
球を水平に等間隔で切ると、**どの輪切りの側面も面積が同じ**になります。
細い極のあたりは半径が小さいけれど、そのぶん斜めに引き伸ばされていて、ちょうど釣り合うのです。

これはアルキメデスが見つけた性質で、地図の「ランベルト正積円筒図法」がまさにこれです。
だから**高さを一様に選べば、面積に対して一様**になります。
緯度を一様に選ぶと、この釣り合いを壊してしまいます。
`,
    },
    {
      kind: 'md',
      text: `
## 3つを並べて見る

言葉より目で見たほうが早いので、3 つの方法で同じ数の点をばらまいて並べます。
**左が緯度経度、中央が立方体＋正規化、右が正しい方法**です。

**最初から見下ろす位置に置いてあります。** 極が正面に来ているので、
左の球の中央が白く塗り潰れているのがすぐ分かります。
ドラッグして横から見ると、こんどは赤道のあたりが薄いのが見えます。
`,
    },
    {
      kind: 'sandbox',
      title: '3つのばらまき方を見比べる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
// 最初から見下ろす位置に置く。偏りは「極を正面から見る」といちばん分かりやすい
camera.position.set(0, 7.6, 5.6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const COUNT = 2600;

// (A) 緯度と経度を一様に振る → 極に集まる
function byLatLon() {
  const lat = THREE.MathUtils.randFloatSpread(Math.PI);   // -90° 〜 90°
  const lon = Math.random() * Math.PI * 2;
  return new THREE.Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.sin(lon),
  );
}

// (B) 立方体の中に一様に置いて正規化 → 角の方向に寄る
function byCube() {
  return new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2),
  ).normalize();
}

// (C) 高さ y を一様に振る → 面積に対して一様になる
function byHeight() {
  const y = THREE.MathUtils.randFloatSpread(2);
  const r = Math.sqrt(1 - y * y);
  const theta = Math.random() * Math.PI * 2;
  return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
}

function cloud(make, offsetX, color) {
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const v = make();
    positions[i * 3 + 0] = v.x * 1.5 + offsetX;
    positions[i * 3 + 1] = v.y * 1.5;
    positions[i * 3 + 2] = v.z * 1.5;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    color: color,
    size: 2.2,
    sizeAttenuation: false,
  }));
}

scene.add(cloud(byLatLon, -3.9, 0xff7ad9));  // 左：偏る
scene.add(cloud(byCube, 0, 0xffd166));       // 中央：少し偏る
scene.add(cloud(byHeight, 3.9, 0x4fd6ff));   // 右：正しい

// 見出しを画面に置く（three ではなく、ただの DOM）
['緯度経度（極に集まる）', '立方体＋正規化（角に寄る）', '高さを一様に（正しい）']
  .forEach((text, index) => {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText =
      'position:absolute; bottom:26px; transform:translateX(-50%);' +
      'color:#e8e8f2; font:12px sans-serif; pointer-events:none; white-space:nowrap;';
    div.style.left = (17 + index * 33) + '%';
    document.body.appendChild(div);
  });

function animate() {
  requestAnimationFrame(animate);
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
        '左の球は中心（＝極）が塗り潰れています。中央は 8 方向にうっすら濃淡が出ます。右だけがどこを見ても同じ密度です。`COUNT` を 400 に減らすと、密度の差はかえって見分けにくくなります ― 偏りは数が多いほうが見えます。',
    },
    {
      kind: 'md',
      text: `
## 星を「星らしく」する小技

一様にばらまいただけでは、まだ星空に見えません。効いたのは次の 3 つです。

- **{{ピクセル比}}の話と同じで、点の大きさは距離で変えない。** \`sizeAttenuation: false\` にすると、
  大きさをピクセルで指定できます。1200 も離れた星が距離で縮んで消えるのを防げます
- **色をばらす。** 実際の星は青白いものから橙のものまであります。\`Color.setHSL\` の色相を少し散らすだけで、
  白一色より一気に「空」らしくなります
- **明るさをばらす。** すべて同じ明るさだと、模様のように見えてしまいます

\`depthWrite: false\` も入れています。点が奥行きの記録を書き換えないようにして、
手前に来た惑星や月を星が隠してしまう事故を防ぎます。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'far を大きくすると、奥行きの精度が落ちます',
      text: `
奥行きの記録（デプスバッファ）の精度は、**\`near\` と \`far\` の比**で決まります。
\`near = 0.1\`、\`far = 3000\` は比が 3 万倍で、じつはかなり乱暴な設定です。
近くで面が重なっているとき、ちらちらと入れ替わる（Z ファイティング）ことがあります。

いちばん効くのは **\`near\` を大きくする**ことです。\`0.1\` より \`0.5\` のほうが精度は上がります。
[](#/ch/10-camera)で見たとおり、near を小さくしすぎるのは
「手前も奥も欲張る」ことで、精度の面で高い買い物になります。
`,
    },
    {
      kind: 'md',
      text: `
## ファイルの分け方

この章のコードはまだ 1 枚に収まりますが、4 章ぶん足すと 400 行を超えます。
**手元で作るなら、最初から分けておくのが楽です。**

- \`main.js\` … 骨組み（シーン・カメラ・レンダラ・ループ）
- \`stars.js\` … 星空を作って返す
- \`planet.js\` … 惑星を作って返す
- \`textures.js\` … テクスチャを生成する関数を集める

分け方の基準は「**そのファイルが返すものを 1 語で言えるか**」です。
言えないなら、まだ 2 つのことをしています。

サイト内のサンドボックスは 1 ファイルで動く必要があるので、以降も 1 枚で書きます。
関数の切れ目が、そのままファイルの切れ目になると思って読んでください。
`,
    },
  ],
  exercises: [
    {
      prompt: `2 つ目のサンドボックス（3 つのばらまき方）を、**真上と真横の両方から**見てください。
(A) と (B) の偏りは、どちらの向きから見たときに分かりやすいですか。それはなぜでしょう。`,
      hint: '(A) は極に、(B) は立方体の角の方向に寄ります。',
      answer: `(A) の極への集中は**真上から**（極を正面に見て）いちばんはっきり出ます。横から見ると手前と奥が重なって隠れてしまいます。
(B) の角への偏りは、**立方体の角の方向、つまり斜めから**見ると分かります。
「偏りは、偏っている方向から見ないと見えない」ので、**確かめるときは視点を複数取る**必要があります。
1 つの角度で見て大丈夫そうだった、はあてになりません。`,
    },
    {
      prompt: '\`controls.minDistance = 2.6\` を \`0\` にして、思いきり寄ってみてください。何が起きますか。この 1 行は何を守っていますか。',
      hint: '惑星の半径と、カメラの near を思い出してください。',
      answer: `惑星の**中に入れてしまい**、球の裏側（背面カリングで消える）を見て世界が消えます。
\`minDistance\` は「作品として見せてよい範囲」を操作の側から守っている 1 行です。
[](#/ch/t07-controls) の \`maxPolarAngle\` で床下に潜れないようにしたのと、まったく同じ考え方です。
**壊れた見え方は、直すのではなく到達できなくする**のがいちばん安くて確実です。`,
    },
  ],
  quiz: [
    {
      q: '緯度と経度をそれぞれ一様乱数にして球面に点を置くと、点はどこに集まりますか。',
      choices: [
        '北極と南極',
        '赤道',
        'どこにも集まらない（一様になる）',
        '経度 0 度の線上',
      ],
      answer: 0,
      explain:
        '緯度 1 度ぶんの帯の面積は、赤道では広く、極に近づくほど狭くなります。狭い場所に同じ数を割り当てるので、極が混みます。高さ y を一様に振ると、輪切りの側面積がどこでも等しいという性質のおかげで一様になります。',
    },
    {
      q: '`sizeAttenuation: false` にすると、点の大きさはどう決まりますか。',
      choices: [
        '距離に関係なく、画面上のピクセル数で決まる',
        '距離に応じて自動的に小さくなる',
        'ジオメトリの大きさに比例する',
        '変わらない（この設定に効果はない）',
      ],
      answer: 0,
      explain:
        '既定では遠いほど小さく描かれます（透視投影と同じ理屈）。星空のようにごく遠くへ置くものは、それだと消えてしまうので、ピクセル指定に切り替えます。逆に雪や火花のように「近づくと大きく見えてほしい」ものは true のままにします。',
    },
    {
      q: '`near = 0.1`、`far = 3000` にしたところ、遠くの面がちらちら入れ替わります。まず試すべきことはどれですか。',
      choices: [
        '`near` を大きくする',
        '`far` をさらに大きくする',
        'ピクセル比を上げる',
        'アンチエイリアスを切る',
      ],
      answer: 0,
      explain:
        '奥行きの精度は near と far の比で決まり、とくに near の小ささが効きます。手前に何も無いなら near を 0.5 や 1 に上げるだけで、遠方の精度がはっきり改善します。',
    },
  ],
};
