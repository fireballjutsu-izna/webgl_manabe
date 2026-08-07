import type { Chapter } from '../types.ts';

export const chapterX31: Chapter = {
  slug: 'x31-sun-height',
  part: 'project',
  number: 31,
  title: '太陽の高さが、光の色と強さを決める',
  goal: '太陽の高さ $1$ つから昼夜の明るさと光の色を導けるようになり、境目をなめらかにつなぐ $\\mathrm{smoothstep}$ を $JS$ 側でも使えるようになります。',
  requires: ['p07-city-light', 'b36-smoothstep', 'w23-fill-light'],
  threeApis: [
    'DirectionalLight.intensity',
    'DirectionalLight.color',
    'HemisphereLight',
    'Color.lerpColors',
    'MathUtils.smoothstep',
  ],
  mathRecall: [
    { slug: 'b36-smoothstep', note: '境目に幅を持たせる。ここでは日の出' },
    { slug: '08-interp', note: '$2$ 色を混ぜる。$\\mathrm{lerp}$ そのもの' },
    { slug: 'w23-fill-light', note: '影の中を真っ黒にしない' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 使うのは、y 成分だけ

前の章で太陽の向き $\\mathbf{s}$ が出ました。ここから先で使うのは、
**$y$ 成分（高さ）だけ**です。

$-1$ から $1$ の値で、$0$ が地平線。これ $1$ つから素直に導けます。

- **太陽の強さ** … 高さが $0$ を下回ると $0$ に。地平線の少し下から立ち上げる
- **太陽の色** … 高さが小さいほど赤く（朝焼け・夕焼け）
- **空の色** … 高さで夜の色と昼の色を混ぜる
- **窓の明かり** … 高さが $0$ を下回ると点ける

$4$ つとも「高さを $0$〜$1$ の割合に直してから使う」という同じ形です。
段差なく切り替えるために \`smoothstep\` を使います。
`,
    },
    {
      kind: 'code',
      title: 'smoothstep は 3 行',
      code: `function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// 太陽の高さ -0.05 で 0、0.25 で 1。地平線の少し下から明るくなりはじめる
const daylight = smoothstep(-0.05, 0.25, sunDirection.y);`,
    },
    {
      kind: 'formula',
      tex: '\\text{daylight} \;=\; \\mathrm{smoothstep}(-0.05,\; 0.25,\; s_y)',
      readAloud:
        '太陽の高さ $s_y$ が $-0.05$ のとき $0$、$0.25$ のとき $1$ になるようになめらかに変える、と読みます。この $1$ つの値が、光の強さにも色の混ぜ具合にも使われます。',
      worked: {
        given:
          'しきい値を**太陽高度（度）**に翻訳して、$1$ 日のどこにあたるかを見ます。$s_y = \\sin(\\text{高度})$ です。',
        steps: [
          { calc: 's_y = -0.05 : 高度 = -2.87 度', note: '日没の少し後' },
          { calc: 's_y =  0.25 : 高度 = 14.48 度' },
          { calc: '帯の幅 = 17.35 度' },
          { calc: 's_y = 0（地平線）のとき' },
          { calc: '  t = (0+0.05)/0.30 = 0.1667' },
          { calc: '  0.1667の2乗x(3-0.333)' },
          { calc: '  = 0.0278 x 2.667 = 0.074', note: '日の出の瞬間は 7% の明るさ' },
        ],
        result:
          '**日の出の瞬間、明るさはまだ $7\\%$ しかありません。** 太陽が地平線に顔を出しても、$1$ 日の明るさにはほど遠い ― これは実際の朝そのものです。完全に明るくなるのは高度 $14.5$ 度、日の出から $1$ 時間ほど後です。$17.35$ 度という帯の幅は、[](#/ch/x14-terminator)で惑星の昼夜境界に使った $17.30$ 度と**ほぼ同じ**でした。別の作品で別の目的から選んだ $2$ つの数が、同じところに落ちています。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '夜を「暗くする」だけでは、夜になりません',
      text: `
太陽を弱めただけの夜は、**ただの薄暗い昼**です。

夜らしくするには**足すもの**が要ります。

- **窓の明かり**（\`emissiveIntensity\`）… これがいちばん効きます
- **空の色を青紫へ**（真っ黒にはしない。真っ黒だと建物の輪郭が消えます）
- **環境光をわずかに青く**（月明かりの代わり）

逆に昼は、**影のコントラストがあるほど**それらしくなります。

**夜は光を足し、昼は影を作る** ― 別の作業だと思ってください。
片方のやり方をもう片方に流用すると、どちらも中途半端になります。
`,
    },
    {
      kind: 'md',
      text: `
## 色は、混ぜて作る

太陽の色は $2$ 色を用意して、\`daylight\` で混ぜます。

- 低いとき … 濃いオレンジ（朝焼け・夕焼け）
- 高いとき … わずかに黄色い白

[](#/ch/08-interp)の \`lerp\` そのものです。three なら \`Color.lerpColors(a, b, t)\` の $1$ 行。

**混ぜる先の色を「白」にしない**のが小さなコツです。
真っ白い太陽光は、実は不自然に見えます。
$0xfff2e0$ くらいのわずかに暖かい白のほうが、目に「昼の光」として届きます。
`,
    },
    {
      kind: 'sandbox',
      title: '時刻を動かす（スライダーで朝・昼・夕・夜）',
      guide: { focus: ['時刻から、光と空と窓を導く', 'スライダー'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const CITY = 120;
const ROAD = 3.2;
const MIN_LOT = 9;
const SIDEWALK = 0.9;
const PALETTE = [0x6b7280, 0x7c7468, 0x5f6b7a, 0x8a8378, 0x4f5560, 0x6e6a74];

/* ---- シーン ---- */

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9db4d8, 70, 300);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 700);
camera.position.set(-70, 48, 86);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 8, 0);
controls.maxPolarAngle = Math.PI * 0.495;

/* ---- 光 ---- */

const sun = new THREE.DirectionalLight(0xfff0d8, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
// 影を描く範囲。街全体（120）ではなく、見ている中心のまわりだけに絞る
sun.shadow.camera.left = -46;
sun.shadow.camera.right = 46;
sun.shadow.camera.top = 46;
sun.shadow.camera.bottom = -46;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 400;
sun.shadow.bias = -0.0006;
scene.add(sun);

const sky = new THREE.HemisphereLight(0xbcd4ff, 0x3a3a44, 0.9);
scene.add(sky);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshStandardMaterial({ color: 0x474b56, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ---- 街を組む ---- */

const lots = splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, makeRandom(20260730), []);
const rand = makeRandom(777);
const parts = [];
for (const lot of lots) {
  for (const box of buildingBoxes(lot, rand)) {
    const geometry = new THREE.BoxGeometry(box.w, box.h, box.d);
    scaleBoxUv(geometry, box.w, box.h, box.d);
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

const buildingMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.82,
  emissive: 0xffffff,
  emissiveMap: createWindowTexture(),
  emissiveIntensity: 0,
});

const buildings = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(parts), buildingMaterial);
for (const part of parts) part.dispose();
buildings.castShadow = true;
buildings.receiveShadow = true;
scene.add(buildings);

/* ---- 時刻から、光と空と窓を導く ---- */

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const NIGHT_SKY = new THREE.Color(0x0d1226);
const DAY_SKY = new THREE.Color(0x9db4d8);
const DUSK_SKY = new THREE.Color(0xd9784a);
const SUN_LOW = new THREE.Color(0xff7a3a);
const SUN_HIGH = new THREE.Color(0xfff0d8);

const sunDirection = new THREE.Vector3();
const skyColor = new THREE.Color();
const backgroundColor = new THREE.Color();

function applyTime(t) {
  // 太陽の向き。t = 0.25 で日の出、0.5 で正午、0.75 で日没
  const theta = (t - 0.25) * Math.PI * 2;
  sunDirection.set(Math.cos(theta), Math.sin(theta), 0.35).normalize();
  sun.position.copy(sunDirection).multiplyScalar(220);
  // 影の範囲は、見ている中心のまわりに置く
  sun.target.position.copy(controls.target);
  sun.target.updateMatrixWorld();

  const height = sunDirection.y;
  const daylight = smoothstep(-0.05, 0.25, height);   // 0=夜, 1=昼
  const horizon = 1 - smoothstep(0.0, 0.32, height);  // 地平線に近いほど 1

  sun.intensity = 3.2 * daylight;
  sun.color.lerpColors(SUN_LOW, SUN_HIGH, smoothstep(0.02, 0.34, height));

  // 空の色。夜 → 昼に混ぜてから、日の出・日没のオレンジを足す
  skyColor.lerpColors(NIGHT_SKY, DAY_SKY, daylight);
  backgroundColor.copy(skyColor).lerp(DUSK_SKY, horizon * daylight * 0.85);
  scene.background = backgroundColor;
  scene.fog.color.copy(backgroundColor);

  sky.intensity = 0.12 + daylight * 0.85;
  sky.color.copy(backgroundColor);

  // 窓は、太陽が沈んだぶんだけ点ける。これが夜らしさの主役
  buildingMaterial.emissiveIntensity = 1.4 * (1 - daylight);
}

/* ---- スライダー ---- */

const panel = document.createElement('div');
panel.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#fff; font:12px monospace;' +
  'text-shadow:0 0 6px rgba(0,0,0,0.9); display:flex; align-items:center; gap:8px;';

const slider = document.createElement('input');
slider.type = 'range';
slider.min = '0';
slider.max = '1';
slider.step = '0.001';
slider.value = '0.36';
slider.style.width = '220px';

const label = document.createElement('span');

const playButton = document.createElement('button');
playButton.textContent = '時間を進める';
playButton.style.cssText =
  'padding:4px 8px; background:#12121f; color:#e8e8f2; border:1px solid #3a3a5c;' +
  'border-radius:6px; font:12px sans-serif; cursor:pointer;';

panel.append(slider, label, playButton);
document.body.appendChild(panel);

let time = Number(slider.value);
let playing = false;

playButton.addEventListener('click', () => {
  playing = !playing;
  playButton.textContent = playing ? '止める' : '時間を進める';
});
slider.addEventListener('input', () => {
  time = Number(slider.value);
  playing = false;
  playButton.textContent = '時間を進める';
});

function updateLabel() {
  const minutes = Math.floor(time * 24 * 60);
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  label.textContent = hh + ':' + mm;
}

/* ---- ループ ---- */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (playing) {
    time = (time + dt * 0.04) % 1;   // 25 秒で 1 日
    slider.value = String(time);
  }

  applyTime(time);
  updateLabel();
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- 下ごしらえ：3-05, 3-06 で作ったもの（読み飛ばして可） ---- */

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
    { u: cols(d), v: rows }, { u: cols(d), v: rows },
    null, null,
    { u: cols(w), v: rows }, { u: cols(w), v: rows },
  ];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const at = f * 4 + i;
      if (faces[f] === null) uv.setXY(at, 0.06, 0.06);
      else uv.setXY(at, uv.getX(at) * faces[f].u, uv.getY(at) * faces[f].v);
    }
  }
}
`,
      caption:
        'スライダーを 0 付近（深夜）と 0.5（正午）で往復させてください。窓の明かりが夜だけ点き、日の出と日没で街が赤くなります。`buildingMaterial.emissiveIntensity` の行を消すと、夜が「ただの薄暗い昼」に落ちるのが分かります。時刻 0.26 あたりの、影がいちばん長い瞬間がいちばんきれいです。',
    },
    {
      kind: 'md',
      text: `
## 環境光は、別の役をしている

太陽（\`DirectionalLight\`）だけだと、**影の中が真っ黒**になります。

[](#/ch/w23-fill-light)でやったとおり、現実の影の中は
空からの光と地面からの照り返しで満たされています。

このコードでは \`HemisphereLight\` を使い、**上と下で違う色**を渡しています。

- 上（空の色）… 昼は青、夜は暗い紫
- 下（地面の色）… 一日じゅうほぼ変わらない灰

そして**強さも \`daylight\` で変えます。** 夜は弱く、昼は強く。

$2$ つのライトが、それぞれ別の役をしています。

- **太陽** … 形を作る（影とコントラスト）
- **環境光** … 影の中を読めるようにする

夜に太陽が $0$ になっても環境光が残っているので、
街は真っ暗にならず、シルエットが読めます。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`smoothstep(-0.05, 0.25, s_y)\` を \`smoothstep(0, 0, s_y)\` にすると何が起きますか。`,
      hint: '幅が $0$ のとき、$\\mathrm{smoothstep}$ は何になりますか。',
      answer: `**日の出の瞬間に、街が真っ暗から真っ昼間へ切り替わります。**

**何が起きるか**

幅が $0$ だと、\`smoothstep\` はただの段差（$0$ か $1$）になります。

$s_y$ が $0$ を跨いだ $1$ フレームで、

- 太陽の強さ … $0 \\to$ 最大
- 太陽の色 … 夕焼け色 $\\to$ 昼の白
- 空 … 夜空 $\\to$ 青空
- 影 … 無い $\\to$ くっきり

**全部が同時に切り替わります。** 照明のスイッチを入れたようになります。

**$0.30$ の幅が作っているもの**

$-0.05$ から $0.25$ の幅は、太陽高度で $17.35$ 度ぶんです。

その間に、朝焼け・薄明・そして昼が**順に**現れます。

**この帯こそが「朝」であって、日の出は瞬間ではありません。**

**幅を広げると**

$-0.3$ から $0.6$ にすると、朝と夕方が $1$ 日の大半を占めるようになります。

**惑星のような、大気の厚い星**の絵になります。
狙ってやるなら面白い選択です。`,
    },
    {
      prompt: `太陽の色を、低いときも高いときも同じ白（$0\\text{xffffff}$）にしたとします。

見た目はどう変わりますか。`,
      hint: '朝焼け・夕焼けの赤は、どこから来ていましたか。',
      answer: `**朝焼けと夕焼けが消え、$1$ 日じゅう同じ色の街になります。**

**失われるもの**

時刻が伝わる手がかりは、明るさと色の $2$ つです。

色を固定すると、**明るさだけ**になります。

- 朝 … 暗い
- 昼 … 明るい
- 夕 … 暗い
- 夜 … もっと暗い

**朝と夕方が、区別できなくなります。** どちらも「暗い昼」です。

**色が時刻を運んでいる**

実際、写真を見て「朝か夕方か」を判断するとき、
人は明るさではなく**色**を見ています。

**この街では、それを $1$ 行の \`lerpColors\` が担当しています。**

**そして、建物が低彩度である理由もここです**

[](#/ch/p06-city-buildings)でパレットを灰色寄りにしたのは、
**光の色をそのまま受け取れるようにする**ためでした。

もし建物が原色だったら、太陽の色を変えても
街の色はほとんど動きません ― $1$ 行の \`lerpColors\` が効かなくなります。

**$2$ つの章の判断が、ここで噛み合っています。**`,
    },
    {
      prompt: `\`HemisphereLight\` を消して、\`DirectionalLight\` だけにしたとします。

昼と夜、それぞれどう見えますか。`,
      hint: '影の中には、どこからも光が届かなくなります。',
      answer: `**昼は影が真っ黒になり、夜は街が完全に消えます。**

**昼**

太陽の当たらない面 ― 建物の北側、影の中 ― が**純粋な黒**になります。

$3$ 次元の絵としては、これが最も「$CG$ らしい」失敗です。
現実には、影の中にも空からの光が回り込んでいます。

**夜**

こちらが深刻です。

夜は \`daylight\` が $0$ なので、\`DirectionalLight\` の強さも $0$。

環境光が無ければ、**光源が $1$ つも無い**ことになります。

見えるのは窓の明かり（$emissive$）だけ ―
建物の壁も、道も、地面も**完全な黒**です。

**街の形が消えます。**

**$2$ つのライトの役割分担**

| | 役 |
|---|---|
| \`DirectionalLight\` | 形を作る（影・コントラスト） |
| \`HemisphereLight\` | 見えるようにする（影の中・夜） |

**片方だけでは、$1$ 日の半分が成立しません。**

夜の環境光を「わずかに青く、弱く」しておくのは、
月明かりの代わりであると同時に、**シルエットを残すため**です。`,
    },
  ],
  quiz: [
    {
      q: '`smoothstep(-0.05, 0.25, s_y)` の 2 つのしきい値は、太陽高度で言うと何度ですか。',
      choices: [
        '−2.87 度から +14.48 度。幅 17.35 度で、日の出の瞬間はまだ 7% の明るさ',
        '−5 度から +25 度',
        '0 度から 90 度',
        '太陽高度とは関係ない',
      ],
      answer: 0,
      explain:
        's_y は太陽高度のサインなので、asin で角度に戻せます。日の出（s_y = 0）の時点で smoothstep は 0.074 ― まだ 7% しか明るくありません。完全に明るくなるのは高度 14.5 度、日の出から 1 時間ほど後です。この 17.35 度という幅は、惑星の昼夜境界に使った 17.30 度とほぼ同じでした。',
    },
    {
      q: '夜を「太陽を弱めるだけ」で作ると、どうなりますか。',
      choices: [
        'ただの薄暗い昼になる。夜らしくするには窓の明かりなど、足すものが要る',
        '正しく夜になる',
        '真っ黒になる',
        '影が長くなる',
      ],
      answer: 0,
      explain:
        '夜は光を足し、昼は影を作る ― 別の作業です。夜らしさを作るのは、窓の明かり（emissiveIntensity）、真っ黒にしない青紫の空、わずかに青い環境光です。とくに窓がいちばん効きます。',
    },
    {
      q: '`HemisphereLight` を消すと、夜はどう見えますか。',
      choices: [
        '光源が 1 つも無くなり、窓の明かり以外は完全な黒になって街の形が消える',
        '少し暗くなるだけ',
        '影が消える',
        '窓も消える',
      ],
      answer: 0,
      explain:
        '夜は daylight が 0 なので DirectionalLight の強さも 0 です。環境光が無ければ光源がゼロになり、壁も道も地面も真っ黒になります。DirectionalLight は形を作る役、HemisphereLight は見えるようにする役で、片方だけでは 1 日の半分が成立しません。',
    },
  ],
};
