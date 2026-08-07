import type { Chapter } from '../types.ts';

export const chapterX27: Chapter = {
  slug: 'x27-instancing',
  part: 'project',
  number: 27,
  title: '合体の代償と、もう 1 つの道 ― InstancedMesh',
  goal: '合体で失うものを列挙できるようになり、$1$ 回で描きながら個別に動かせる $\\mathrm{InstancedMesh}$ を、使いどころを判断して選べるようになります。',
  requires: ['x26-merge-geometry', 'w43-instancing', 'w33-pick-cost'],
  threeApis: [
    'InstancedMesh',
    'InstancedMesh.setMatrixAt',
    'InstancedMesh.setColorAt',
    'InstancedBufferAttribute',
    'Matrix4.compose',
  ],
  mathRecall: [
    { slug: 'w43-instancing', note: 'インスタンスの配置は $4\\times4$ 行列そのもの' },
    { slug: '06-matrix', note: '位置・回転・大きさを $1$ つの行列に' },
    { slug: 'w33-pick-cost', note: '何を調べないか。カリングの話' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 速くなったが、失ったものがある

前の章で、$82$ 回のドローコールが $2$ 回になりました。
代わりに手放したものを、はっきりさせておきます。

- **個別に動かせない。** $1$ 棟だけ持ち上げる、揺らす、崩す ― どれもできません
- **個別に消せない。** $1$ 棟だけ非表示にできません
- **個別に色を変えられない。** 頂点の色を書き換えれば可能ですが、
  $82.5$ キロバイトの配列のどこがその建物かを、自分で覚えておく必要があります
- **{{視錐台カリング}}が効かない。** 街の端しか見ていなくても、$1920$ 頂点すべてが毎フレーム処理されます

$4$ つめは、サンドボックスで見えます。
$1$ つずつ描いているときは、視点を回すと**ドローコールの数が増えたり減ったり**しました。
合体すると、**常に $2$ で動きません** ― 見えていないものも描いているからです。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '溶接してしまった、という状態です',
      text: `
$80$ 個の箱を溶接して $1$ つの塊にしたようなものです。

運ぶのは楽になりました（$1$ 回で運べます）。
その代わり、**$1$ つだけ外すことはもうできません。**

必要なのは「まとめて運べて、しかも $1$ つずつ外せる」状態です。

それが \`InstancedMesh\` で、
**箱は $1$ つだけ持ち、置き場所を $80$ 個持つ**という形をしています。
`,
    },
    {
      kind: 'md',
      text: `
## 形を 1 つ、置き場所を 80 個

\`InstancedMesh\` は、**同じジオメトリを何度も置く**ための仕組みです。

- ジオメトリ … $1$ つだけ（$24$ 頂点の箱）
- 行列 … インスタンスの数だけ（$80$ 個の $4\\times4$）
- 色 … インスタンスの数だけ（省略可）

$GPU$ は「この形を、この $80$ か所へ」という命令を $1$ 回受け取って描きます。
[](#/ch/w43-instancing)でやったとおり、**配置はすべて $4\\times4$ 行列**です。

大きさも行列に入るので、「同じ箱を、違う大きさで置く」ができます。
建物の $w$・$h$・$d$ は、まさにその拡大率です。
`,
    },
    {
      kind: 'formula',
      tex: 'B_{\\text{合体}} = n\\,v\\,f_v \\times 4, \\qquad B_{\\text{instanced}} = \\bigl(v\\,f_v + 16\\,n\\bigr) \\times 4',
      readAloud:
        '合体は「箱の数 × 頂点数 × $1$ 頂点あたりの float」、インスタンスは「$1$ 箱ぶんの頂点 ＋ 箱の数 × $16$（行列 $1$ つ）」です。$n$ が増えたときの伸び方が、まったく違います。',
      worked: {
        given: '箱 $80$ 個、$1$ 箱 $24$ 頂点。合体は $1$ 頂点 $11$ float（位置・法線・$UV$・色）、インスタンスは $1$ 頂点 $8$ float（色は行列と別に $1$ 個ずつ）。',
        steps: [
          { calc: '合体 : 80 x 24 x 11 x 4' },
          { calc: '     = 84480 バイト = 82.5 KB' },
          { calc: 'インスタンス : (24 x 8 + 16 x 80) x 4' },
          { calc: '     = (192 + 1280) x 4' },
          { calc: '     = 5888 バイト = 5.8 KB' },
          { calc: '比 : 82.5 / 5.8 = 14.2 倍' },
          { calc: '箱 8000 個なら' },
          { calc: '  合体 8.25 MB / インスタンス 512 KB' },
        ],
        result:
          '**$14$ 倍の差**です。合体は箱ごとに頂点を複製するのに対し、インスタンスは**行列 $16$ float だけ**を足すからです。$n$ が大きくなるほど差は開きます。ただし**$14$ 倍といっても $80$ キロバイト**なので、この街ではメモリでは決まりません。**決め手になるのは、個別に触れるかどうか**です。',
      },
    },
    {
      kind: 'md',
      text: `
## それでも、この作品は合体を選んでいます

$3$ つの道を並べます。

| | ドローコール | 個別に動かす | カリング | 形の自由度 |
|---|---|---|---|---|
| $1$ つずつ | $82$ | できる | **効く** | 自由 |
| 合体 | $2$ | できない | 効かない | 自由 |
| \`InstancedMesh\` | $2$ | **できる** | 塊単位 | **同じ形だけ** |

最後の列が効きます。

**\`InstancedMesh\` は、同じジオメトリしか置けません。**
この街の箱は $w$・$h$・$d$ がばらばらですが、
それは「単位立方体を違う倍率で拡大したもの」と見なせるので、**インスタンスで置けます。**

置けないのは、たとえば**屋上に三角屋根を足したいとき**です。
形が $2$ 種類になった瞬間、\`InstancedMesh\` は $2$ つ要ります。

**この街は動かないので、合体で十分**です。
そして次の章で窓の $UV$ を建物ごとに変えるので、
**「同じジオメトリ」という条件のほうが先に壊れます。**
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'setMatrixAt のあとは、needsUpdate を立てる',
      text: `
インスタンスの行列を書き換えたら、**その旨を伝える必要があります。**

\`mesh.instanceMatrix.needsUpdate = true\`

これを忘れると、**書き換えたのに何も起きません。**
エラーも警告も出ません ― $GPU$ には古い配列が載ったままだからです。

色を変えたときも同じで、\`mesh.instanceColor.needsUpdate = true\` が要ります。

**「値を変えたのに絵が変わらない」ときは、まずここを疑ってください。**
three が持つ「送り直す指示」は、ほかに \`geometry.attributes.*.needsUpdate\` と
\`texture.needsUpdate\` があり、どれも同じ形をしています。
`,
    },
    {
      kind: 'sandbox',
      title: '1 回で描きながら、1 つだけ動かす',
      guide: { focus: ['形は 1 つ、置き場所を 80 個', '1 つだけ動かす'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CITY = 120;
const ROAD = 3.2;
const MIN_LOT = 9;
const SIDEWALK = 0.9;
const PALETTE = [0x6b7280, 0x7c7468, 0x5f6b7a, 0x8a8378, 0x4f5560, 0x6e6a74];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x161a26);
scene.fog = new THREE.Fog(0x161a26, 60, 260);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 700);
camera.position.set(-70, 44, 88);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 8, 0);
controls.maxPolarAngle = Math.PI * 0.495;

scene.add(
  new THREE.DirectionalLight(0xffe8c4, 2.6).translateX(80).translateY(110).translateZ(50),
  new THREE.HemisphereLight(0x9db8ff, 0x2a2a33, 0.75),
);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshStandardMaterial({ color: 0x474b56, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const boxes = collectBoxes();

/* ---- 形は 1 つ、置き場所を 80 個 ---- */
// ジオメトリは単位立方体 1 つだけ。大きさも位置も、行列の中に入る

const mesh = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ roughness: 0.85 }),
  boxes.length,
);

const matrix = new THREE.Matrix4();
const quaternion = new THREE.Quaternion();
const position = new THREE.Vector3();
const scale = new THREE.Vector3();

for (let i = 0; i < boxes.length; i++) {
  const box = boxes[i];
  position.set(box.x, box.y, box.z);
  scale.set(box.w, box.h, box.d);
  matrix.compose(position, quaternion, scale);   // 位置・回転・大きさを 1 つの行列へ
  mesh.setMatrixAt(i, matrix);
  mesh.setColorAt(i, box.color);
}
scene.add(mesh);

/* ---- 1 つだけ動かす ---- */
// 合体ではできなかったこと。いちばん高い箱を選んで、上下に揺らす

let tallest = 0;
for (let i = 1; i < boxes.length; i++) {
  if (boxes[i].h > boxes[tallest].h) tallest = i;
}

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; bottom:16px; left:16px; color:#9fb4d8;' +
  'font:12px/1.7 ui-monospace, monospace; white-space:pre; pointer-events:none;' +
  'background:rgba(10,12,18,0.78); padding:8px 10px; border-radius:5px;';
document.body.appendChild(readout);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  const box = boxes[tallest];

  position.set(box.x, box.y + Math.sin(t * 1.4) * 6, box.z);
  scale.set(box.w, box.h, box.d);
  matrix.compose(position, quaternion, scale);
  mesh.setMatrixAt(tallest, matrix);
  mesh.instanceMatrix.needsUpdate = true;   // これを忘れると、書き換えても何も起きない

  controls.update();
  renderer.render(scene, camera);

  readout.textContent =
    '箱 ' + boxes.length + ' 個\\n' +
    'ドローコール ' + renderer.info.render.calls + '\\n' +
    '三角形 ' + renderer.info.render.triangles;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- 下ごしらえ：街区と建物（前の 5 章で作ったもの） ---- */

function makeRandom(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function splitLots(rect, rand, out) {
  const canX = rect.w > MIN_LOT * 2 + ROAD;
  const canZ = rect.d > MIN_LOT * 2 + ROAD;
  if (!canX && !canZ) { out.push(rect); return out; }
  const alongX = canX && (!canZ || rect.w >= rect.d);
  const length = alongX ? rect.w : rect.d;
  const cut = length * (0.35 + rand() * 0.3);
  if (alongX) {
    splitLots({ x: rect.x, z: rect.z, w: cut - ROAD / 2, d: rect.d }, rand, out);
    splitLots({ x: rect.x + cut + ROAD / 2, z: rect.z, w: rect.w - cut - ROAD / 2, d: rect.d }, rand, out);
  } else {
    splitLots({ x: rect.x, z: rect.z, w: rect.w, d: cut - ROAD / 2 }, rand, out);
    splitLots({ x: rect.x, z: rect.z + cut + ROAD / 2, w: rect.w, d: rect.d - cut - ROAD / 2 }, rand, out);
  }
  return out;
}

function collectBoxes() {
  const lots = splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, makeRandom(20260730), []);
  const rand = makeRandom(777);
  const out = [];

  for (const lot of lots) {
    const cx = lot.x + lot.w / 2;
    const cz = lot.z + lot.d / 2;
    const r = Math.min(1, Math.hypot(cx, cz) / (CITY * 0.62));
    const height = 58 * Math.pow(1 - r, 1.8) * (0.45 + rand() * 0.75) + 3.5;

    const stages = height > 26 ? 3 : (height > 14 ? 2 : 1);
    const fractions = stages === 3 ? [0.55, 0.3, 0.15] : (stages === 2 ? [0.7, 0.3] : [1]);

    const color = new THREE.Color(PALETTE[Math.floor(rand() * PALETTE.length)]);
    color.offsetHSL(0, 0, (rand() - 0.5) * 0.08);

    let w = Math.max(1.6, lot.w - SIDEWALK * 2);
    let d = Math.max(1.6, lot.d - SIDEWALK * 2);
    let bottom = 0.35;

    for (let s = 0; s < stages; s++) {
      const h = height * fractions[s];
      out.push({ x: cx, y: bottom + h / 2, z: cz, w: w, h: h, d: d, color: color });
      bottom += h;
      w *= 0.72;
      d *= 0.72;
    }
  }
  return out;
}`,
      caption:
        '左下に**ドローコール $2$**（地面とインスタンス）と出ます。それでいて、いちばん高いビルだけが上下に揺れています ― **合体では書けなかった動き**です。`mesh.instanceMatrix.needsUpdate = true` の行を消すと、値は毎フレーム書き換わっているのに**ビルは止まったまま**になります。エラーは出ません。',
    },
    {
      kind: 'md',
      text: `
## 3 つのうち、どれを選ぶか

判断の順番は、こうです。

- **動かすものがあるか。** あるなら合体は使えません
- **形は $1$ 種類か。** そうなら \`InstancedMesh\`
- **どちらでもない。** 種類ごとに分けて、それぞれを合体か \`InstancedMesh\` に

そして、いちばん大事なことが $1$ つあります。

**まず測る。**

この街は $1$ つずつ描いても $0.98$ ミリ秒でした。**予算の $6\\%$**です。
もしこれが作品の全部なら、**まとめる必要はまったくありません。**

まとめたのは、このあと影・車・空・窓が乗ることを知っているからです。
[](#/ch/w42-draw-calls)の言い方をすれば、
**\`calls\` を見てから決める。** 見ずに最適化するのは、当てずっぽうです。
`,
    },
  ],
  exercises: [
    {
      prompt: `建物の屋上に、三角屋根を付けたくなりました。

\`InstancedMesh\` で描いている場合、どうしますか。`,
      hint: '$1$ つの \`InstancedMesh\` が持てるジオメトリはいくつですか。',
      answer: `**\`InstancedMesh\` をもう $1$ つ作ります。ドローコールは $1$ 回増えます。**

**なぜ増えるのか**

$1$ つの \`InstancedMesh\` はジオメトリを $1$ つしか持てません。

箱と三角屋根は別の形なので、$2$ つ目が要ります。

- 箱用 … $80$ インスタンス
- 屋根用 … 屋根の付く建物の数だけ

**それでも安い**

ドローコールは $2 \\to 3$ です。$1$ つずつ描くなら $80 + 20 = 100$ 回でした。

**形の種類が数種類までなら、\`InstancedMesh\` は十分に有利**です。

**種類が増えていくと、逆転します**

- $5$ 種類 … ドローコール $5$ 回。まだ有利
- $50$ 種類 … $50$ 回。合体（$1$ 回）のほうが有利
- $500$ 種類 … インスタンス化する意味がありません

**分かれ目は「同じ形が何個あるか」**です。
$1$ 種類が $2$ 個しかないなら、インスタンスにする価値はありません。

**混ぜてよい**

木は \`InstancedMesh\`、建物は合体、車は $1$ つずつ ―
**シーンの中で使い分けるのがふつう**です。
どれか $1$ つに統一する必要はありません。`,
    },
    {
      prompt: `合体した街では{{視錐台カリング}}が効きません。

$8000$ 個の箱に増えたとき、これはどれくらい問題になりますか。対策は何ですか。`,
      hint: '街の端だけを見ているとき、画面に出ていない頂点はどれくらいありますか。',
      answer: `**街の端を見ているとき、$9$ 割以上の頂点が無駄に処理されます。**

**何が起きるか**

合体すると、街全体で $1$ つの物体です。

three は「その物体が視野に入っているか」しか見ないので、
**端が $1$ ミリでも視野に入っていれば、全部描きます。**

$8000$ 個 $= 192000$ 頂点が、毎フレーム頂点シェーダを通ります。

**対策 ― 塊に分ける**

街を格子状に、たとえば $4 \\times 4 = 16$ の区画に分け、
**区画ごとに合体します。**

- ドローコール … $1 \\to 16$（まだ十分少ない）
- カリング … **区画単位で効く**

視野に $4$ 区画しか入っていなければ、$\\frac14$ の頂点しか処理されません。

**分け方の目安**

[](#/ch/w42-draw-calls)で見たとおり、**分けるほどカリングは効き、ドローコールは増えます。**

$16$ 分割あたりが、多くの場面でつり合います。
$1000$ 分割すればカリングは完璧ですが、ドローコールが $1000$ 回では本末転倒です。

**そしてやはり、まず測ることです**

$8000$ 個でも、**$GPU$ に余裕があるなら何も問題ありません。**

「カリングが効かない」は事実ですが、
**効かないと困るかどうかは、測るまで分かりません。**`,
    },
    {
      prompt: `\`mesh.setMatrixAt(i, matrix)\` を呼んだのに、建物が動きません。

考えられる原因を $2$ つ挙げてください。`,
      hint: '$1$ つは、この章の警告で触れています。',
      answer: `**\`needsUpdate\` の立て忘れと、行列の作り方の間違いです。**

**1. needsUpdate を立てていない**

\`mesh.instanceMatrix.needsUpdate = true\`

これを忘れると、$JS$ 側の配列は変わっているのに $GPU$ には送られません。

**エラーも警告も出ません。** 値を \`console.log\` すると正しく変わっているので、
「書けているのに動かない」という、いちばん混乱する状態になります。

**2. 行列を作り直していない**

\`Matrix4\` は使い回すので、\`compose\` を呼ばずに \`setMatrixAt\` すると
**前のフレームの行列**がそのまま入ります。

とくに、位置だけ変えたつもりで \`position\` を書き換えても、
\`matrix.compose(...)\` を呼ばなければ行列は古いままです。

**\`Vector3\` を変えても、行列は追いかけてくれません。**

**ほかにも**

- \`i\` の範囲が \`count\` を超えている（静かに無視されます）
- \`mesh.count\` を小さくしてしまい、そのインスタンスが描かれていない
- そもそも、そのインスタンスが視野の外にある

**共通しているのは、どれもエラーが出ないこと**です。

\`InstancedMesh\` は「黙って何もしない」ことが多いので、
**まず $1$ 個だけを極端な位置（原点の真上 $100$）へ動かして、
動くかどうかを確かめる**のが早い切り分けです。`,
    },
  ],
  quiz: [
    {
      q: '合体した街で効かなくなるものはどれですか。',
      choices: [
        '視錐台カリング。街の端しか見ていなくても全頂点が処理される',
        '影',
        'フォグ',
        'マテリアルの色',
      ],
      answer: 0,
      explain:
        '合体すると街全体が 1 つの物体になるので、three は「その物体が視野に入っているか」しか判定できません。端が少しでも視野に入れば全部描きます。8000 個規模になったら、格子状に 16 分割して区画ごとに合体すると、ドローコール 16 回と引き換えにカリングが区画単位で効くようになります。',
    },
    {
      q: '`InstancedMesh` が合体に対して持つ利点はどれですか。',
      choices: [
        '1 回で描きながら、インスタンスを個別に動かせる',
        '形を何種類でも置ける',
        '影が正しく出る',
        'テクスチャを個別に変えられる',
      ],
      answer: 0,
      explain:
        'ジオメトリは 1 つ、置き場所（4×4 行列）をインスタンスの数だけ持ちます。だから 1 回の命令で描きつつ、setMatrixAt で 1 つだけ動かせます。制約は「同じジオメトリしか置けない」ことで、形が 2 種類になれば InstancedMesh も 2 つ必要です。メモリは 80 個で 5.8 KB と、合体の 82.5 KB の 14 分の 1 です。',
    },
    {
      q: '`setMatrixAt` で値を書き換えたのに何も起きないとき、まず疑うべきものはどれですか。',
      choices: [
        '`instanceMatrix.needsUpdate = true` の立て忘れ',
        'ジオメトリの頂点数',
        'マテリアルの透明度',
        'カメラの near',
      ],
      answer: 0,
      explain:
        'JS 側の配列は変わっていても、GPU には送り直されません。エラーも警告も出ず、console.log では正しい値が見えるので、いちばん混乱する種類の不具合になります。three の「送り直す指示」は instanceColor.needsUpdate、geometry.attributes.*.needsUpdate、texture.needsUpdate とどれも同じ形をしています。',
    },
  ],
};
