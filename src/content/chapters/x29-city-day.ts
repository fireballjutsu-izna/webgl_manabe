import type { Chapter } from '../types.ts';

export const chapterX29: Chapter = {
  slug: 'x29-city-day',
  part: 'project',
  number: 29,
  title: '街ができた ― 昼の、ドローコール 2 回',
  goal: '$5$ 章ぶんの部品が $1$ つのシーンとしてどう並ぶかを上から読めるようになり、できあがったものを数字で確かめる習慣を持てるようになります。',
  requires: ['x28-window-uv', 'w42-draw-calls'],
  threeApis: [
    'WebGLRenderer.info',
    'BufferGeometryUtils',
    'MeshStandardMaterial.emissiveMap',
    'Fog',
  ],
  mathRecall: [
    { slug: 'w42-draw-calls', note: '数えるのではなく、測る' },
    { slug: 'x26-merge-geometry', note: '合体して $1$ 回にする' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 5 章ぶんを、1 つのファイルで読む

これが街の完成品（昼）です。上から順に、こう並んでいます。

| 区画 | 作った章 |
|---|---|
| 決め打ちの乱数 | [](#/ch/x21-seeded-random) |
| 土地を再帰的に割る | [](#/ch/x22-subdivision) |
| 街区と道路（隙間） | [](#/ch/x23-roads) |
| 目線のカメラとフォグ | [](#/ch/x24-eye-level) |
| 建物の高さと色 | [](#/ch/p06-city-buildings) |
| 窓のテクスチャと $UV$ | [](#/ch/x28-window-uv) |
| 合体して $1$ 回で描く | [](#/ch/x26-merge-geometry) |

**新しいものは、$1$ つも足していません。**
これまでの $9$ 章で書いてきたものが、そのまま並んでいるだけです。
`,
    },
    {
      kind: 'sandbox',
      title: '街ができました（昼・ドローコール 2 回）',
      guide: { focus: ['窓のテクスチャ（8x8 個。半分ほどを点ける）', '街を組む'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const CITY = 120;
const ROAD = 3.2;
const MIN_LOT = 9;
const SIDEWALK = 0.9;
const PALETTE = [0x6b7280, 0x7c7468, 0x5f6b7a, 0x8a8378, 0x4f5560, 0x6e6a74];

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

function buildingBoxes(lot, rand) {
  const cx = lot.x + lot.w / 2;
  const cz = lot.z + lot.d / 2;
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

/* ---- 窓のテクスチャ（8x8 個。半分ほどを点ける） ---- */

function createWindowTexture() {
  const cell = 16;
  const grid = 8;
  const canvas = document.createElement('canvas');
  canvas.width = cell * grid;
  canvas.height = cell * grid;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const rand = makeRandom(4242);
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      // 左上の1マスは必ず消しておく（屋上がここを指す）
      if (gx === 0 && gy === 0) continue;
      if (rand() > 0.55) continue;
      const level = 150 + Math.floor(rand() * 105);
      ctx.fillStyle = 'rgb(' + level + ',' + Math.floor(level * 0.86) + ',' + Math.floor(level * 0.6) + ')';
      ctx.fillRect(gx * cell + cell * 0.22, gy * cell + cell * 0.2, cell * 0.56, cell * 0.5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

function scaleBoxUv(geometry, w, h, d) {
  const uv = geometry.getAttribute('uv');
  const cols = (size) => Math.max(1, Math.round(size / 2.4)) / 8;
  const rows = Math.max(1, Math.round(h / 3.4)) / 8;
  const faces = [
    { u: cols(d), v: rows },
    { u: cols(d), v: rows },
    null,
    null,
    { u: cols(w), v: rows },
    { u: cols(w), v: rows },
  ];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const at = f * 4 + i;
      if (faces[f] === null) uv.setXY(at, 0.06, 0.06);
      else uv.setXY(at, uv.getX(at) * faces[f].u, uv.getY(at) * faces[f].v);
    }
  }
}

/* ---- シーン ---- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9db4d8);
scene.fog = new THREE.Fog(0x9db4d8, 70, 300);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 700);
camera.position.set(-70, 40, 88);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 8, 0);
controls.maxPolarAngle = Math.PI * 0.495;

const sun = new THREE.DirectionalLight(0xfff0d8, 2.8);
sun.position.set(90, 120, 60);
scene.add(sun, new THREE.HemisphereLight(0xbcd4ff, 0x3a3a44, 0.9));

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshStandardMaterial({ color: 0x474b56, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---- 街を組む ---- */

const lots = splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, makeRandom(20260730), []);
const rand = makeRandom(777);

const parts = [];
for (const lot of lots) {
  for (const box of buildingBoxes(lot, rand)) {
    const geometry = new THREE.BoxGeometry(box.w, box.h, box.d);
    scaleBoxUv(geometry, box.w, box.h, box.d);   // 窓の割り付け
    geometry.translate(box.x, box.y, box.z);

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
}

const merged = BufferGeometryUtils.mergeGeometries(parts);
for (const part of parts) part.dispose();

const buildings = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.82,
  emissive: 0xffffff,
  emissiveMap: createWindowTexture(),
  emissiveIntensity: 0,       // 昼は消灯。次の章でここを動かす
}));
scene.add(buildings);

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#0b1220; font:12px monospace;' +
  'pointer-events:none; white-space:pre;';
document.body.appendChild(readout);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  const info = renderer.info.render;
  readout.textContent =
    '建物の箱 ' + parts.length + ' 個\\nドローコール ' + info.calls + '\\n三角形 ' + info.triangles;
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '$54$ 棟・$80$ 個の箱でできた街が、地面と合わせて **$2$ 回のドローコール**で描かれています。`emissiveIntensity` を $1.2$ にすると、昼なのに窓が点いた妙な街になります ― 次の章で、これを時刻に合わせて動かします。`scaleBoxUv` の呼び出しを消すと、どの面にも窓が $1$ つだけ伸びて貼られる様子が見えます。',
    },
    {
      kind: 'md',
      text: `
## 数字で確かめる習慣

できあがったら、**見た目ではなく数字で**確かめます。
この街では、こうなっているはずです。

| 測るもの | 値 |
|---|---|
| ドローコール | $2$（街と地面） |
| 三角形 | $962$（箱 $80$ 個 × $12$ ＋ 地面 $2$） |
| 街区 | $54$ 個 |
| 箱 | $80$ 個 |
| 合体したジオメトリ | $82.5$ KB |

**このうちどれか $1$ つでも予想と違ったら、そこに何かがあります。**

- ドローコールが $82$ … 合体していない（切り替えを戻し忘れた）
- 三角形が $1922$ … 箱を $2$ 度足している
- 街区が $53$ や $55$ … 乱数の消費順序が変わった（[](#/ch/x21-seeded-random)）

**\`renderer.info.render\` を画面に出したままにしておく**のが、いちばん安上がりです。
数えるのではなく、測る ― [](#/ch/w42-draw-calls)でやったとおりです。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ここまでで、素材はまだ 1 つも使っていません',
      text: `
惑星と街、$2$ つの作品を作ってきて、**外から持ってきたファイルは $0$ 個**です。

- 地表・雲・街の明かり … $3$ 次元ノイズから
- 星 … 球面への一様分布から
- 街区 … 再帰的な分割から
- 建物の高さ・色 … 距離とパレットから
- 窓 … $16$ 画素の四角を $64$ 個並べたキャンバスから

**「なぜこの見た目なのか」が、全部コードに書いてあります。**

画像を $1$ 枚使えば、その瞬間から「なぜこの模様なのか」は
画像の中に消えます。数値を変えても、別のものは出てきません。

素材ゼロは制約に見えて、**作品を自分の手の中に置いておく**やり方でもあります。
`,
    },
    {
      kind: 'md',
      text: `
## 次は、時刻を 1 つ

街はできましたが、**いつも同じ昼**です。

次の章からは、$0$〜$24$ の数字 $1$ つから
光の色・空の色・影の向き・窓の明かりを**全部導きます。**

窓を \`emissiveMap\` に入れておいたのは、そのためでした。
$1$ つの \`emissiveIntensity\` で、街じゅうの窓が一斉に点きます。
`,
    },
  ],
  exercises: [
    {
      prompt: `完成版で \`renderer.info.render.calls\` が $2$ ではなく $82$ になっていました。

何が起きていますか。`,
      hint: '$82$ という数字を、前の章で見た覚えはありませんか。',
      answer: `**合体せずに、箱を $1$ つずつ \`Mesh\` にしています。**

$80$ 個の箱 ＋ 地面 ＋ 街区の板 ― ちょうど $82$ です。

**どこで起きるか**

- 切り替えのスイッチを戻し忘れた
- \`mergeGeometries\` が \`null\` を返していて、
  それに気づかず個別の描画に落ちる分岐に入っている
- 箱を作るループの中で、\`scene.add(mesh)\` を消し忘れている

**$3$ つめがいちばん多い**

合体に書き換えるとき、「配列に集める」を足しても
**元の \`scene.add\` を消し忘れる**ことがあります。

このとき街は**二重に描かれます。**

- 見た目はほぼ同じ（同じ場所に同じものが重なる）
- ドローコールは $82 + 2 = 84$
- 三角形は $960 \\times 2 + 2 = 1922$

**見た目が正しいのに数字が倍**、というのがこの不具合の顔です。

**だから三角形も出しておく**

ドローコールだけを見ていると、$84$ を「まあこんなものか」と流してしまいます。

**三角形が予想のちょうど $2$ 倍**なら、重複を疑ってください。
$3$ 倍なら $3$ 回足しています。`,
    },
    {
      prompt: `この街を「$4$ 倍の広さ」にしたい。\`CITY\` を $120$ から $240$ にすると、
街区・箱・ドローコール・頂点はそれぞれどうなりますか。`,
      hint: '面積は $4$ 倍です。区画の下限は変わりません。',
      answer: `**街区と箱はおよそ $4$ 倍、ドローコールは $2$ のまま、頂点が $4$ 倍です。**

**街区と箱**

区画の下限（\`MIN_LOT\`）が同じなので、区画の大きさはほぼ変わりません。
面積が $4$ 倍なら、区画も**およそ $4$ 倍**（$54 \\to 210$ 前後）。

箱も $80 \\to 320$ 前後です。

**ドローコール**

**$2$ のまま**です。合体しているので、中身がいくつでも $1$ 回で描きます。

**これが合体の効き目**です。$1$ つずつなら $322$ 回になっていました。

**頂点とメモリ**

$1920 \\to 7680$ 頂点、$82.5 \\to 330$ KB。

まだ小さい値ですが、**生成の時間**は目に見えて増えます
（分割の再帰と、$320$ 個ぶんのジオメトリ作成）。

**本当に効いてくるのはカリング**

$4$ 倍の街を目線から見ると、**視界に入るのは一部だけ**です。

それでも合体しているので、$7680$ 頂点すべてが毎フレーム処理されます。

このあたりで、[](#/ch/x27-instancing)で触れた
**「格子状に $16$ 分割して、区画ごとに合体」**が効いてきます。

**規模が変わると、正しい設計も変わる** ― $120$ の街での最適が、
$240$ の街での最適とは限りません。`,
    },
    {
      prompt: `窓の \`emissiveIntensity\` を、昼なのに $1.2$ にしたままだとどう見えますか。

そこから、次の章で何をすればよいかを言ってください。`,
      hint: '昼の街で、窓は光って見えますか。',
      answer: `**昼なのに全部の窓が点いた、停電明けのような街になります。**

**なぜ不自然なのか**

昼の窓が明るく見えないのは、**外のほうが明るいから**です。

実際の窓は昼も点いていることがありますが、
太陽光に負けて**暗い穴**にしか見えません。

$emissive$ は「自分で光っている量」なので、
太陽の強さと関係なく光ります。だから昼に点けると嘘になります。

**次の章ですること**

時刻 $t$（$0$〜$24$）から、$emissiveIntensity$ を導きます。

- 昼（$8$〜$16$ 時）… $0$
- 夕（$16$〜$19$ 時）… $0 \\to 1.2$ へなめらかに
- 夜 … $1.2$
- 朝（$5$〜$7$ 時）… $1.2 \\to 0$ へ

境目をなめらかにするのは、[](#/ch/b36-smoothstep)でやったとおりです。
惑星の昼夜境界とまったく同じ形をしています。

**$1$ つの数字から、全部を導く**

窓だけではありません。太陽の向き・光の色・空の色・影の濃さ ―
**すべてが同じ $t$ から出てきます。**

つまみが $1$ つなら、**朝の街と夜の街が食い違うことが原理的に起きません。**`,
    },
  ],
  quiz: [
    {
      q: '完成した街のドローコールが 2 回である理由はどれですか。',
      choices: [
        '80 個の箱を 1 つのジオメトリに合体し、地面だけ別のマテリアルだから',
        'InstancedMesh を使っているから',
        '建物が 2 棟しかないから',
        'three が自動でまとめるから',
      ],
      answer: 0,
      explain:
        '箱はすべて合体して 1 回、地面は色も粗さも違うマテリアルなのでもう 1 回、合わせて 2 回です。三角形は 962（建物 960 ＋ 地面 2）のままで、GPU の仕事は減っていません。減ったのは CPU が命令を出す回数だけです。',
    },
    {
      q: 'できあがった街を確かめるとき、ドローコールに加えて三角形の数も見ておくのはなぜですか。',
      choices: [
        '同じものを二重に足していると、見た目は正しいのに三角形がちょうど 2 倍になるから',
        '三角形の数で FPS が決まるから',
        'ドローコールは信用できないから',
        '三角形が多いほど良い街だから',
      ],
      answer: 0,
      explain:
        '合体に書き換えるとき、元の scene.add を消し忘れると街が二重に描かれます。同じ場所に同じものが重なるので見た目はほぼ変わらず、ドローコール 84 も「まあこんなものか」と流してしまいがちです。三角形が予想のちょうど 2 倍なら重複、3 倍なら 3 回足しています。',
    },
    {
      q: '窓を `emissiveMap` に入れておいたことが、次の章でどう効きますか。',
      choices: [
        '`emissiveIntensity` 1 つで、時刻に応じて街じゅうの窓を一斉に点け消しできる',
        '影が正しく落ちるようになる',
        'ドローコールがさらに減る',
        'テクスチャの解像度を上げられる',
      ],
      answer: 0,
      explain:
        'emissive は「自分で光っている量」なので、光源とは無関係に光ります。時刻 t から emissiveIntensity を導けば、昼は 0、夕方に立ち上がって夜は 1.2、と 1 つの数値で街全体が変わります。同じ t から太陽の向き・光の色・空の色・影も導くので、朝の街と夜の街が食い違うことが原理的に起きません。',
    },
  ],
};
