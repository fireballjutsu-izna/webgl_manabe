import type { Chapter } from '../types.ts';

export const chapterX26: Chapter = {
  slug: 'x26-merge-geometry',
  part: 'project',
  number: 26,
  title: 'まとめて 1 回で描く ― 合体と、頂点に焼く色',
  goal: '動かないものをジオメトリごと合体させて描画回数を減らせるようになり、$1$ つのマテリアルのまま色をばらけさせる方法を使えるようになります。',
  requires: ['p06-city-buildings', 'w42-draw-calls', 't12-shader-intro'],
  threeApis: [
    'BufferGeometryUtils',
    'BufferGeometry.translate',
    'BufferAttribute',
    'MeshStandardMaterial.vertexColors',
    'WebGLRenderer.info',
  ],
  mathRecall: [
    { slug: 'w42-draw-calls', note: '回数 × 単価。減らすのは回数のほう' },
    { slug: 't12-shader-intro', note: 'attribute は「頂点ごとに違う値」' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 箱が 80 個ある

前の章で、建物の位置・大きさ・高さ・色が決まりました。
箱は **$80$ 個**です。

素直に $1$ つずつ \`Mesh\` にすると、地面と合わせて **$82$ 回**のドローコール。
$c = 0.012$ ミリ秒として **$0.98$ ミリ秒**です。

$60$ fps の予算 $16.7$ ミリ秒に対して $6\\%$ ― **まだ余裕があります。**

それでもまとめるのは、$2$ つの理由からです。

- **これから増える。** 影・車・空・窓が乗ります
- **$1$ 回にする費用が、ほぼゼロ。** $10$ 行ほどで済みます

[](#/ch/w42-draw-calls)でやったとおり、**動かないものは合体させます。**
`,
    },
    {
      kind: 'md',
      text: `
## 合体すると、色を失う

\`mergeGeometries\` は、複数のジオメトリを $1$ つに繋げます。
これでドローコールは $1$ 回になりますが、困ることが $1$ つ出ます。

**マテリアルが $1$ つになるので、建物ごとに色を変えられません。**

解決は {{attribute}} です。[](#/ch/t12-shader-intro)でやったとおり、
attribute は「**頂点ごとに違う値**」を持てます。

そこで**合体する前に、それぞれの箱へ「色」の attribute を書き込んでおきます。**
マテリアル側で \`vertexColors: true\` にすれば、$1$ つのマテリアルのまま色がばらけます。
`,
    },
    {
      kind: 'code',
      title: '合体する前に、色を頂点へ焼き込む',
      code: `const geometry = new THREE.BoxGeometry(w, h, d);
geometry.translate(x, y, z);          // 合体前に、それぞれの位置へ動かしておく

// 24 個の頂点すべてに、この建物の色を書き込む
const color = new THREE.Color(0x6b7280);
const count = geometry.getAttribute('position').count;
const colors = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  colors[i * 3 + 0] = color.r;
  colors[i * 3 + 1] = color.g;
  colors[i * 3 + 2] = color.b;
}
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// ...これを全部集めて
const merged = BufferGeometryUtils.mergeGeometries(parts);
const material = new THREE.MeshStandardMaterial({ vertexColors: true });
scene.add(new THREE.Mesh(merged, material));   // ドローコールは 1 回`,
    },
    {
      kind: 'md',
      text: `
## 合体した街の大きさを、数えておく

合体すると、頂点が $1$ 本の配列に並びます。どれくらいの量になるのか出しておきます。
`,
    },
    {
      kind: 'formula',
      tex: 'B \\;=\\; n \\times v \\times f \\times 4\\ \\text{バイト}',
      readAloud:
        '合体したジオメトリの大きさは、箱の数 $n$、$1$ 箱あたりの頂点数 $v$、$1$ 頂点あたりの浮動小数の個数 $f$ の掛け算です。$1$ つの float が $4$ バイトなので、最後に $4$ を掛けます。',
      worked: {
        given: '箱 $80$ 個。\`BoxGeometry\` は $1$ 箱で $24$ 頂点（面ごとに法線と $UV$ が違うので、角が $3$ 回ずつ現れます）。$1$ 頂点が持つのは位置 $3$ ・法線 $3$ ・$UV$ $2$ ・色 $3$ の $11$ 個。',
        steps: [
          { calc: '頂点 : 80 x 24 = 1920' },
          { calc: 'float: 1920 x 11 = 21120' },
          { calc: 'バイト: 21120 x 4 = 84480' },
          { calc: '       = 82.5 KB' },
          { calc: '三角形: 80 x 12 = 960' },
        ],
        result:
          '**$82.5$ キロバイト。** 画像 $1$ 枚より小さい量です。$8$ 個の頂点で足りそうな箱が $24$ 頂点になるのは、**角で法線と $UV$ が食い違う**ためで、共有できません。色の attribute を足したぶん（$1$ 頂点あたり $3$ float、全体で $23$ KB）も、この中に入っています。**ドローコールを $82$ から $2$ に減らす代償が $23$ キロバイト**なら、迷う理由がありません。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '合体するものは、属性を揃えておくこと',
      text: `
\`mergeGeometries\` は、**すべてのジオメトリが同じ属性を持っている**ことを求めます。

$1$ つだけ \`color\` を付け忘れると、その場で失敗します
（\`null\` が返ってきて、次の行で「そんなものは無い」と怒られます）。

属性を足すのは**必ず全部に**。そして \`translate\` は**合体する前に**やります。
合体後は $1$ つの物体なので、もう個別には動かせません。

**地面だけは別のマテリアル**（色も粗さも違う）なので、合体しません。
だからドローコールは $1$ ではなく $2$ です。
`,
    },
    {
      kind: 'sandbox',
      title: '個別に描く / まとめて描く（ボタンで切り替え）',
      guide: { focus: ['1つの街区から、積み上げる箱の一覧を作る', '箱の一覧を先に作る（描き方は後で決める）'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const CITY = 120;
const ROAD = 3.2;
const MIN_LOT = 9;
const SIDEWALK = 0.9;

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
  const canSplitX = rect.w > MIN_LOT * 2 + ROAD;
  const canSplitZ = rect.d > MIN_LOT * 2 + ROAD;
  if (!canSplitX && !canSplitZ) { out.push(rect); return out; }
  const alongX = canSplitX && (!canSplitZ || rect.w >= rect.d);
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

/* ---- 1つの街区から、積み上げる箱の一覧を作る ---- */

const PALETTE = [0x6b7280, 0x7c7468, 0x5f6b7a, 0x8a8378, 0x4f5560, 0x6e6a74];

function buildingBoxes(lot, rand) {
  const cx = lot.x + lot.w / 2;
  const cz = lot.z + lot.d / 2;

  // 中心からの距離を 0〜1 に。0 が都心
  const r = Math.min(1, Math.hypot(cx, cz) / (CITY * 0.62));
  const height = 58 * Math.pow(1 - r, 1.8) * (0.45 + rand() * 0.75) + 3.5;

  const stages = height > 26 ? 3 : (height > 14 ? 2 : 1);
  const fractions = stages === 3 ? [0.55, 0.3, 0.15] : (stages === 2 ? [0.7, 0.3] : [1]);

  const color = new THREE.Color(PALETTE[Math.floor(rand() * PALETTE.length)]);
  color.offsetHSL(0, 0, (rand() - 0.5) * 0.08);

  const boxes = [];
  let w = Math.max(1.6, lot.w - SIDEWALK * 2);
  let d = Math.max(1.6, lot.d - SIDEWALK * 2);
  let bottom = 0.35;

  for (let s = 0; s < stages; s++) {
    const h = height * fractions[s];
    boxes.push({ x: cx, y: bottom + h / 2, z: cz, w: w, h: h, d: d, color: color });
    bottom += h;
    w *= 0.72;
    d *= 0.72;
  }
  return boxes;
}

/* ---- シーン ---- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x161a26);
scene.fog = new THREE.Fog(0x161a26, 60, 260);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 700);
camera.position.set(-74, 46, 92);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 8, 0);
controls.maxPolarAngle = Math.PI * 0.495;

const sun = new THREE.DirectionalLight(0xffe8c4, 2.6);
sun.position.set(80, 110, 50);
scene.add(sun, new THREE.HemisphereLight(0x9db8ff, 0x2a2a33, 0.75));

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshStandardMaterial({ color: 0x474b56, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---- 箱の一覧を先に作る（描き方は後で決める） ---- */

const lots = splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, makeRandom(20260730), []);
const rand = makeRandom(777);
const allBoxes = [];
for (const lot of lots) {
  for (const box of buildingBoxes(lot, rand)) allBoxes.push(box);
}

const city = new THREE.Group();
scene.add(city);

function clearCity() {
  for (const child of city.children.slice()) {
    city.remove(child);
    child.geometry.dispose();
    child.material.dispose();
  }
}

/* 描き方 (A) 1つずつメッシュにする */
function buildIndividual() {
  clearCity();
  for (const box of allBoxes) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(box.w, box.h, box.d),
      new THREE.MeshStandardMaterial({ color: box.color, roughness: 0.85 }),
    );
    mesh.position.set(box.x, box.y, box.z);
    city.add(mesh);
  }
}

/* 描き方 (B) 合体させて1つにする */
function buildMerged() {
  clearCity();
  const parts = [];
  for (const box of allBoxes) {
    const geometry = new THREE.BoxGeometry(box.w, box.h, box.d);
    geometry.translate(box.x, box.y, box.z);   // 合体前に位置へ動かす

    // 色を頂点に焼き込む。これで1マテリアルでも建物ごとに色が変わる
    const count = geometry.getAttribute('position').count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3 + 0] = box.color.r;
      colors[i * 3 + 1] = box.color.g;
      colors[i * 3 + 2] = box.color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    parts.push(geometry);
  }

  const merged = BufferGeometryUtils.mergeGeometries(parts);
  for (const part of parts) part.dispose();   // 元は要らない

  city.add(new THREE.Mesh(
    merged,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
  ));
}

/* ---- 表示と操作 ---- */

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#e8e8f2; font:12px monospace;' +
  'pointer-events:none; white-space:pre;';
document.body.appendChild(readout);

let mode = 'まとめて 1 つ';

function addButton(text, left, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText =
    'position:absolute; bottom:82px; left:' + left + 'px; padding:6px 10px;' +
    'background:#12121f; color:#e8e8f2; border:1px solid #3a3a5c; border-radius:6px;' +
    'font:12px sans-serif; cursor:pointer;';
  button.addEventListener('click', onClick);
  document.body.appendChild(button);
}

addButton('1つずつメッシュにする', 12, () => { mode = '1 つずつ'; buildIndividual(); });
addButton('まとめて1つにする', 172, () => { mode = 'まとめて 1 つ'; buildMerged(); });

buildMerged();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);

  const info = renderer.info.render;
  readout.textContent =
    '描き方 ' + mode + '\\n箱 ' + allBoxes.length + ' 個\\n' +
    'ドローコール ' + info.calls + '\\n三角形 ' + info.triangles;
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        'ボタンを切り替えても**見た目はまったく変わりません。**変わるのはドローコールの数だけです（$82 \\to 2$）。**三角形の数は同じ**であることに注目してください ― 減っているのは命令の回数だけです。$1$ つずつのほうは、視界の外にある建物が自動で省かれるので、**視点を回すとドローコールが増えたり減ったり**します。合体したほうは常に $2$ で動きません。これが次の章の話につながります。',
    },
    {
      kind: 'md',
      text: `
## 三角形は、1 つも減っていない

切り替えて確かめてほしいのは、**三角形の数が変わらない**ことです。

- $1$ つずつ … ドローコール $82$、三角形 $960$
- 合体 … ドローコール $2$、三角形 $960$

$GPU$ の仕事は $1$ ミリ秒ぶんも減っていません。
減ったのは **CPU が命令を出す回数**だけです。

だから「重い」と感じたときは、まず \`renderer.info.render.calls\` を見てください。
そこが $4$ 桁なら、頂点を減らすより先にやることがあります。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`geometry.translate(x, y, z)\` を合体の**あと**にやろうとすると、どうなりますか。`,
      hint: '合体後のジオメトリは、いくつの物体ですか。',
      answer: `**$80$ 個の箱が、まとめて同じ方向へ動きます。**

**なぜか**

合体したあとは、$1920$ 頂点を持つ**$1$ つのジオメトリ**です。

\`translate\` はその全頂点に同じ移動を足すので、
街全体が平行移動するだけになります。

**個別の位置は、合体の瞬間に「焼き込まれ」ます**

合体前に \`translate\` しておけば、各箱の頂点座標そのものが
すでにその場所を指しています。

合体は、その座標を並べて $1$ 本の配列にするだけ ―
**位置の情報は座標の中に溶けて、区別が消えます。**

**これが次の章の主題です**

「まとめて速くする」と「個別に触る」は、**同時には成り立ちません。**

- 合体 … 速い。動かせない
- $1$ つずつ … 遅い。動かせる
- \`InstancedMesh\` … 速い。**動かせる**（ただし条件つき）

$3$ つめが何を条件にしているのかを、次の章で見ます。`,
    },
    {
      prompt: `色の attribute を、$80$ 個のうち $1$ つだけ付け忘れました。

どこで、どんな形で気づきますか。`,
      hint: '\`mergeGeometries\` は何を返しますか。',
      answer: `**合体の行では静かに \`null\` が返り、次の行で落ちます。**

**起きること**

\`mergeGeometries\` は属性の食い違いを見つけると、
**例外を投げずに \`null\` を返します**（コンソールに警告は出ます）。

そのあと \`new THREE.Mesh(null, material)\` となり、
描画のどこかで「そんなものは無い」と落ちます。

**エラーの出る場所が、原因から遠い**

落ちるのは \`Mesh\` を作った行か、最初の描画のときです。

**原因は「$80$ 個のうち $1$ つの箱に属性を足し忘れた」ところ**にありますが、
そこには何のしるしも残りません。

**防ぎ方**

属性を足す処理を、箱を作る関数の**中**に入れてしまうことです。

\`makeBox()\` が「位置を移した、色つきのジオメトリ」を返すようにすれば、
呼ぶ側が足し忘れる余地がありません。

**足し忘れられる形にしておかない**、が唯一の確実な対策です。

**返り値を確かめる手もあります**

\`if (merged === null) throw new Error('属性が揃っていません')\` の $1$ 行で、
落ちる場所が原因のそばに移ります。

**$null$ を返す関数は、その場で確かめる。**`,
    },
    {
      prompt: `箱を $80$ 個から $8000$ 個に増やしたとき、合体したジオメトリは何メガバイトになりますか。

それは問題になりますか。`,
      hint: '$80$ 個で $82.5$ KB でした。比例します。',
      answer: `**$8.25$ メガバイト。多くの場面で問題になりません。**

**計算**

$82.5\\ \\text{KB} \\times 100 = 8250\\ \\text{KB} = 8.25\\ \\text{MB}$

**問題になるかどうか**

$GPU$ のメモリとしては、$8$ メガバイトは小さい部類です
（$2048 \\times 2048$ のテクスチャ $1$ 枚が $16$ MB）。

$8000$ 個の箱を $1$ 回のドローコールで描けるなら、**むしろ安い買い物**です。

**問題になるのは、別のところ**

- **合体そのものに時間がかかる。** $8000$ 個ぶんの配列を作って繋ぐので、
  読み込み時に数百ミリ秒かかることがあります
- **視錐台カリングがまったく効かない。** 街の端しか見ていなくても、
  $8000$ 個ぶんの頂点が毎フレーム処理されます
- **一部だけ更新できない。** $1$ 棟の色を変えるのに、$8.25$ MB を作り直します

**メモリではなく、この $3$ つで判断してください。**

$2$ つめが効きはじめたら、街を格子状の塊に分けて
「見えている塊だけ描く」に切り替えます ―
[](#/ch/w42-draw-calls)で見た、**$16$ 分割の話**です。`,
    },
  ],
  quiz: [
    {
      q: '`mergeGeometries` で 80 個の箱を 1 つにすると、何が減りますか。',
      choices: [
        'ドローコールの回数だけ。三角形の数は 960 のまま変わらない',
        '三角形の数とドローコールの両方',
        '頂点の数',
        'メモリ使用量',
      ],
      answer: 0,
      explain:
        '合体は頂点を 1 本の配列に並べ直すだけなので、GPU の仕事は 1 ミリ秒も減りません。減るのは CPU が命令を出す回数です（82 回から 2 回）。むしろメモリは色の attribute を足したぶん増えます ― 82.5 KB のうち 23 KB が色です。',
    },
    {
      q: '合体したあとも建物ごとに色を変えられるのは、なぜですか。',
      choices: [
        '色を頂点の attribute として焼き込み、vertexColors: true にしているから',
        'マテリアルを 80 個持っているから',
        'mergeGeometries が色を保存してくれるから',
        'テクスチャで色を分けているから',
      ],
      answer: 0,
      explain:
        'attribute は頂点ごとに違う値を持てます。合体する前に、各箱の 24 頂点すべてへその建物の色を書き込んでおけば、マテリアルは 1 つのままで色がばらけます。ただし全部のジオメトリに同じ属性が必要で、1 つでも付け忘れると mergeGeometries は null を返します。',
    },
    {
      q: '`geometry.translate(x, y, z)` を合体のあとに呼ぶと何が起きますか。',
      choices: [
        '80 個すべてが同じ方向へまとめて動く。合体後は 1 つの物体だから',
        '指定した箱だけが動く',
        'エラーになる',
        '何も起きない',
      ],
      answer: 0,
      explain:
        '合体後は 1920 頂点を持つ 1 つのジオメトリで、translate は全頂点に同じ移動を足します。個別の位置は合体の瞬間に座標の中へ焼き込まれ、区別が消えます。速くまとめることと個別に触ることは同時には成り立たず、その間を取るのが InstancedMesh です。',
    },
  ],
};
