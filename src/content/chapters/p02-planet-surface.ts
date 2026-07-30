import type { Chapter } from '../types.ts';

export const chapterP02: Chapter = {
  slug: 'p02-planet-surface',
  part: 'project',
  number: 2,
  title: '惑星ビューアー ― 表面をコードで描く',
  goal: '画像を1枚も用意せずに惑星の地表を作れるようになり、球にテクスチャを貼るときの継ぎ目と極の問題を回避できるようになります。',
  requires: ['p01-planet-setup', 't04-texture', '13-random'],
  threeApis: [
    'CanvasTexture',
    'Texture.colorSpace',
    'Texture.needsUpdate',
    'MeshStandardMaterial.map',
    'MeshStandardMaterial.bumpMap',
    'MeshStandardMaterial.roughnessMap',
    'SphereGeometry',
  ],
  mathRecall: [
    { slug: '13-random', note: 'ノイズ ― 近い場所は似た値になる乱数' },
    { slug: '05-trig', note: '緯度と経度から方向ベクトルを作る' },
    { slug: '11-normal-light', note: '凹凸と粗さが明るさを変える理由' },
    { slug: 't04-texture', note: 'UV と CanvasTexture、色空間の指定' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 灰色の球を、惑星にする

前の章で置いた仮の球は、まだただの灰色の玉です。ここに地表を描き込みます。
[2-04](#/ch/t04-texture)でやった {{CanvasTexture|テクスチャ}} を使って、**絵をコードで描いて貼ります。**

必要なのは 3 枚です。1 枚ではありません。

- **色**（\`map\`）… 海の青、陸の緑と茶、極の白
- **凹凸**（\`bumpMap\`）… 山脈の陰影。{{バンプマップ}}は形を変えず、光の当たり方だけを変える
- **粗さ**（\`roughnessMap\`）… **海だけつるつるにする**。ここが効きます

3 枚目が意外に大事です。海と陸が同じ粗さだと、どれだけ色を作り込んでも
「塗った球」に見えてしまいます。海に太陽の照り返しが乗った瞬間に、water らしくなります。
`,
    },
    {
      kind: 'md',
      text: `
## 高さを 1 つ決めれば、3 枚とも決まる

3 枚を別々に考える必要はありません。**まず「その地点の高さ」を 1 つ決めて、
そこから 3 枚ぶんの値を導きます。**

- 高さが海面より低ければ → 色は青（深さで濃淡）、凹凸は平ら、粗さは 0.2（つるつる）
- 高さが海面より高ければ → 色は緑〜茶〜白、凹凸は高さそのまま、粗さは 0.9（ざらざら）

高さを決めるのが{{ノイズ}}です。[1-13](#/ch/13-random)でやったとおり、
ただの乱数では点がばらばらになるだけで地形になりません。
**近い場所は似た値になる**乱数が要ります。
`,
    },
    {
      kind: 'md',
      text: `
## 粗い形と細かい凹凸を、重ねる

ノイズを 1 枚だけ使うと、のっぺりした染みのような大陸になります。
実際の地形は「**大きな起伏の上に、小さな起伏が乗っている**」構造です。

そこで、**細かさを 2 倍・4 倍・8 倍…にしたノイズを、振幅を半分・4 分の 1…にして足していきます。**
これを {{fBm}}（fractional Brownian motion）と呼びますが、名前は覚えなくてかまいません。
やっていることは「**大きな山の上に小さな石を置く**」だけです。
`,
    },
    {
      kind: 'formula',
      tex: 'h(p) = \\sum_{i=0}^{n-1} g^{\\,i}\\, \\mathrm{noise}(2^{i} p)',
      readAloud:
        '高さ h は、i 段目のノイズを「細かさ 2 の i 乗倍・強さ g の i 乗倍」で引いて、全部足したもの、と読みます。g（ゲイン）はふつう 0.5 です。段を進むごとに細かく・弱くなっていくので、大きな形が主役のまま細部が乗ります。',
    },
    {
      kind: 'demo',
      id: 'fbm-octaves',
      caption:
        '段数を 1 にすると海岸線がなめらかすぎて大陸に見えません。5 にすると入り江や島が出てきます。海面の高さを上げていくと、つながっていた大陸がちぎれて島々になります ― 地形を「作る」のではなく「水位を決める」だけで景色が変わるのが、手続き的生成の面白いところです。',
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: 'なぜ「重ねる」とそれらしくなるのか',
      text: `
自然の地形は、遠くから見ても近くで見ても似た凹凸を持っています。
山脈には尾根があり、尾根には岩があり、岩には割れ目があります。
**倍率を変えても同じような見た目になる**この性質を自己相似といい、海岸線や雲、木の枝にも現れます。

細かさを倍にしながら弱く足していく操作は、この自己相似をいちばん安く真似る方法です。
だから「自然っぽさ」が出ます。
`,
    },
    {
      kind: 'md',
      text: `
## 球に貼るときの罠 ― 平面のノイズは必ず破綻する

ここが第3部でいちばん引っかかる場所です。

テクスチャは平らな画像で、球の {{UV}} は「横が経度、縦が緯度」に対応しています。
そこで、つい**画像の座標 $(u, v)$ をそのままノイズに渡してしまいます**（{{正距円筒図法}}のままノイズを引く、ということです）。
すると、必ず 2 つの破綻が起きます。

- **経度 0 度に縦の継ぎ目が出る。** $u = 0$ と $u = 1$ は球の上では同じ場所ですが、
  ノイズにとっては遠く離れた入力なので、値がつながりません
- **極が横方向に伸びる。** 画像の一番上の行は、球の上では 1 点に潰れます。
  なのにノイズは横方向にしっかり変化するので、極が渦を巻いたように歪みます

**解決は驚くほど素直です。** 画素の $(u, v)$ ではなく、
**その画素が球の上でどの向きを指しているか（方向ベクトル）でノイズを引きます。**
そのために 2 次元ではなく **3 次元のノイズ**を使います。
`,
    },
    {
      kind: 'formula',
      tex: '(x, y, z) = (\\cos\\phi\\cos\\lambda,\\; \\sin\\phi,\\; \\cos\\phi\\sin\\lambda)',
      readAloud:
        'φ（ファイ）が緯度、λ（ラムダ）が経度です。緯度のコサインかける経度のコサインが x、緯度のサインが y、緯度のコサインかける経度のサインが z。1-05 と 3-01 でやった「角度から座標」がまた出てきました。この向きをノイズに渡します。',
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '継ぎ目が消える理由',
      text: `
$u = 0$ と $u = 1$ は、方向に直すと**まったく同じベクトル**になります。
同じ入力なら同じ値が返るので、継ぎ目は原理的に発生しません。

極も同じです。一番上の行のすべての画素は、ほぼ同じ「真上」の向きを指すので、
色もほぼ一定になります。**画像の上では横に引き伸ばされていても、球の上では点に潰れる** ―
その潰れ方に、ノイズの引き方が最初から合っているわけです。
`,
    },
    {
      kind: 'md',
      text: `
## 3枚まとめて、1回のループで作る

高さを 1 つ求めれば 3 枚ぶん決まるので、**ループは 1 回で済みます。**
50 万画素ぶんのノイズを 3 回引き直すのは、単純に 3 倍の時間がかかるだけで何の得もありません。

色の画像だけ \`colorSpace\` に \`THREE.SRGBColorSpace\` を指定します。
凹凸と粗さは**色ではなく数値**なので、指定してはいけません。
ここを間違えると、凹凸の強さや粗さがずれます（[2-04](#/ch/t04-texture)で扱った話です）。
`,
    },
    {
      kind: 'sandbox',
      title: '惑星の地表を作る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TEX_W = 1024;
const TEX_H = 512;
const SEA = 0.5;          // 海面の高さ。上げると島だらけになる
const FREQ = 2.2;         // 基本の細かさ。上げると大陸が小さく細かくなる
const OCTAVES = 5;        // 重ね合わせの段数

/* ---- 3次元の value noise ---- */
// 球に貼るので3次元で引く。2次元だと継ぎ目と極で破綻する

function hash3(x, y, z, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177);
  h = Math.imul(h + Math.imul(seed, 2246822519), 2654435761);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967295;
}

// 両端で傾きが 0 になる重み。格子の継ぎ目を見せないため
function fade(t) { return t * t * (3 - 2 * t); }
function mix(a, b, t) { return a + (b - a) * t; }

function noise3(x, y, z, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);

  const x00 = mix(hash3(xi, yi, zi, seed), hash3(xi + 1, yi, zi, seed), u);
  const x10 = mix(hash3(xi, yi + 1, zi, seed), hash3(xi + 1, yi + 1, zi, seed), u);
  const x01 = mix(hash3(xi, yi, zi + 1, seed), hash3(xi + 1, yi, zi + 1, seed), u);
  const x11 = mix(hash3(xi, yi + 1, zi + 1, seed), hash3(xi + 1, yi + 1, zi + 1, seed), u);

  return mix(mix(x00, x10, v), mix(x01, x11, v), w);
}

// 細かさを倍に、強さを半分にしながら足していく
function fbm(x, y, z) {
  let sum = 0, total = 0, amp = 1, freq = 1;
  for (let i = 0; i < OCTAVES; i++) {
    sum += noise3(x * freq, y * freq, z * freq, 1337 + i * 101) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / total;
}

/* ---- 3枚のテクスチャを1回のループで作る ---- */

function createSurface() {
  const make = () => {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    const ctx = canvas.getContext('2d');
    return { canvas: canvas, ctx: ctx, image: ctx.createImageData(TEX_W, TEX_H) };
  };

  const color = make();
  const bump = make();
  const rough = make();

  for (let row = 0; row < TEX_H; row++) {
    // 画像の一番上の行が北極（テクスチャは上下が反転して貼られる）
    const lat = (0.5 - row / (TEX_H - 1)) * Math.PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const absLat = Math.min(1, Math.abs(lat) / (Math.PI / 2));

    for (let col = 0; col < TEX_W; col++) {
      const lon = (col / TEX_W - 0.5) * Math.PI * 2;

      // その画素が指している「向き」でノイズを引く。これが継ぎ目対策
      const height = fbm(
        cosLat * Math.cos(lon) * FREQ + 8,
        sinLat * FREQ + 8,
        cosLat * Math.sin(lon) * FREQ + 8,
      );

      let r, g, b, bumpValue, roughValue;

      if (height < SEA) {
        // 海。深いほど暗く、濃い青
        const depth = Math.min(1, (SEA - height) / SEA);
        r = 14 + (1 - depth) * 40;
        g = 48 + (1 - depth) * 78;
        b = 92 + (1 - depth) * 74;
        bumpValue = 96;      // 海面は平ら
        roughValue = 46;     // つるつる（照り返しが出る）
      } else {
        const above = (height - SEA) / (1 - SEA);   // 海面からの高さ 0〜1
        const snowLine = 0.62 - absLat * 0.62;      // 極では低いところでも雪

        if (above > snowLine) {
          r = 232; g = 238; b = 246;                // 雪
        } else if (above < 0.06) {
          r = 196; g = 182; b = 136;               // 波打ち際の砂
        } else {
          const rock = Math.min(1, above / snowLine);
          r = 62 + rock * 92;                      // 緑 → 茶
          g = 96 + rock * 66;
          b = 58 + rock * 60;
        }
        bumpValue = 96 + above * 159;               // 高いほど白い＝高い
        roughValue = 216;                           // ざらざら
      }

      const at = (row * TEX_W + col) * 4;
      color.image.data[at] = r;
      color.image.data[at + 1] = g;
      color.image.data[at + 2] = b;
      color.image.data[at + 3] = 255;

      bump.image.data[at] = bumpValue;
      bump.image.data[at + 1] = bumpValue;
      bump.image.data[at + 2] = bumpValue;
      bump.image.data[at + 3] = 255;

      rough.image.data[at] = roughValue;
      rough.image.data[at + 1] = roughValue;
      rough.image.data[at + 2] = roughValue;
      rough.image.data[at + 3] = 255;
    }
  }

  color.ctx.putImageData(color.image, 0, 0);
  bump.ctx.putImageData(bump.image, 0, 0);
  rough.ctx.putImageData(rough.image, 0, 0);

  const colorMap = new THREE.CanvasTexture(color.canvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;   // これは「色」なので指定する

  // 凹凸と粗さは色ではなく数値なので、colorSpace は指定しない
  const bumpMap = new THREE.CanvasTexture(bump.canvas);
  const roughnessMap = new THREE.CanvasTexture(rough.canvas);

  return { colorMap: colorMap, bumpMap: bumpMap, roughnessMap: roughnessMap };
}

/* ---- シーン ---- */

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 3000);
camera.position.set(0, 1.2, 5.4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 2.6;
controls.maxDistance = 30;

const surface = createSurface();

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(1.6, 96, 64),
  new THREE.MeshStandardMaterial({
    map: surface.colorMap,
    bumpMap: surface.bumpMap,
    bumpScale: 0.5,
    roughnessMap: surface.roughnessMap,
    metalness: 0,
  }),
);
scene.add(planet);

const sun = new THREE.DirectionalLight(0xfff2e0, 3.4);
sun.position.set(5, 1.5, 3);
scene.add(sun, new THREE.AmbientLight(0x3a4a6a, 0.35));

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  planet.rotation.y += clock.getDelta() * 0.06;
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
        '海の上を光がゆっくり流れていくのが、`roughnessMap` の効果です。`roughValue = 216` を海の側にも入れると、その照り返しが消えて一気に「塗った球」に戻ります。`bumpScale` を 0 にすると山脈の陰影が消えます。`SEA` を 0.62 にすると島だらけの惑星になります。',
    },
    {
      kind: 'md',
      text: `
## 破綻するほうも見ておく

「2 次元のノイズを UV に掛けると破綻する」と言われても、見ないと納得できません。
次のコードは**わざと $(u, v)$ でノイズを引いています。**

**惑星を回して経度 0 度を正面に持ってくると、縦にすっと線が入ります。**
極を上から覗くと、色が放射状に流れているのも見えます。
`,
    },
    {
      kind: 'sandbox',
      title: '継ぎ目が出るほう（2次元ノイズを UV に掛ける）',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 解像度も色の付け方も、前のコードとまったく同じにしてあります。
// ちがうのは「ノイズに何を渡すか」の1点だけです。
const TEX_W = 1024;
const TEX_H = 512;
const SEA = 0.5;

function hash2(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function fade(t) { return t * t * (3 - 2 * t); }
function mix(a, b, t) { return a + (b - a) * t; }

// 2次元の value noise。u と v をそのまま渡す
function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = fade(x - xi), v = fade(y - yi);
  const a = mix(hash2(xi, yi), hash2(xi + 1, yi), u);
  const b = mix(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u);
  return mix(a, b, v);
}
function fbm2(x, y) {
  let sum = 0, total = 0, amp = 1, freq = 1;
  for (let i = 0; i < 5; i++) {
    sum += noise2(x * freq, y * freq) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / total;
}

const canvas = document.createElement('canvas');
canvas.width = TEX_W;
canvas.height = TEX_H;
const ctx = canvas.getContext('2d');
const image = ctx.createImageData(TEX_W, TEX_H);

for (let row = 0; row < TEX_H; row++) {
  const absLat = Math.abs(0.5 - row / (TEX_H - 1)) * 2;

  for (let col = 0; col < TEX_W; col++) {
    const u = col / TEX_W;
    const v = row / TEX_H;

    // ここが問題。u = 0 と u = 1 は球の上では同じ場所なのに、値がつながらない
    const height = fbm2(u * 6, v * 6);

    let r, g, b;
    if (height < SEA) {
      const depth = Math.min(1, (SEA - height) / SEA);
      r = 14 + (1 - depth) * 40;
      g = 48 + (1 - depth) * 78;
      b = 92 + (1 - depth) * 74;
    } else {
      const above = (height - SEA) / (1 - SEA);
      const snowLine = 0.62 - absLat * 0.62;
      if (above > snowLine) { r = 232; g = 238; b = 246; }
      else if (above < 0.06) { r = 196; g = 182; b = 136; }
      else {
        const rock = Math.min(1, above / snowLine);
        r = 62 + rock * 92; g = 96 + rock * 66; b = 58 + rock * 60;
      }
    }

    const at = (row * TEX_W + col) * 4;
    image.data[at] = r;
    image.data[at + 1] = g;
    image.data[at + 2] = b;
    image.data[at + 3] = 255;
  }
}
ctx.putImageData(image, 0, 0);

const map = new THREE.CanvasTexture(canvas);
map.colorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 0.6, 5.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(1.6, 96, 64),
  new THREE.MeshStandardMaterial({ map: map, roughness: 0.9 }),
);
// 経度 0 度（u = 0 と u = 1 の境目）が、最初から正面に来るようにしておく
planet.rotation.y = Math.PI / 2;
scene.add(planet);

const sunLight = new THREE.DirectionalLight(0xffffff, 3);
sunLight.position.set(0.5, 1, 3);
scene.add(sunLight, new THREE.AmbientLight(0xffffff, 0.55));

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  planet.rotation.y += clock.getDelta() * 0.12;   // 継ぎ目が正面を通り過ぎていく
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
        '最初から経度 0 度が正面に来ています。陸の模様がぶつりと途切れる縦線が中央に走っているのが継ぎ目です。上から覗くと、極で模様が放射状に引き伸ばされているのも見えます。解像度も色の付け方も前のコードと同じで、ちがうのは「ノイズに $(u, v)$ を渡したか、方向ベクトルを渡したか」だけです。',
    },
    {
      kind: 'md',
      text: `
## 手続き的に作る、ということ

ここでやったのは、**画像を用意する代わりに「画像を作る手続き」を書く**ことでした。
これを{{手続き的生成}}と呼びます。
利点と欠点があります。

- **利点** … リポジトリが軽い。数値を変えれば無限に別の惑星が作れる。継ぎ目を原理的に消せる
- **利点** … 「なぜこの見た目なのか」が全部コードに書いてある。あとから直せる
- **欠点** … 生成に時間がかかる（この 1024×512 で数百ミリ秒）。読み込みではなく計算で待つ
- **欠点** … 「地球そのもの」のような**特定の**見た目は作れない。それは写真の仕事

重いのが問題になるなら、\`OffscreenCanvas\` と Web Worker に逃がす手があります。
生成を別のスレッドでやれば、そのあいだも画面は動きます。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '解像度を上げる前に、伸ばす場所を確かめる',
      text: `
テクスチャを 2048×1024 にすると、生成時間は 4 倍になります。
その前に、**いま足りないのは解像度なのか**を確かめてください。

近づいたときにぼやけるなら解像度の問題ですが、
「なんとなく安っぽい」のは、たいてい**色の作り方**の問題です。
砂浜の細い帯を入れる、雪の境界を緯度で動かす、といった 1 行のほうが、
画素を 4 倍にするよりずっと効きます。
`,
    },
  ],
  exercises: [
    {
      prompt: `1 つ目のサンドボックスで \`SEA\` を 0.3 と 0.7 にしてください。惑星はどう変わりますか。
つぎに \`FREQ\` を 1.0 と 6.0 にしてください。`,
      hint: 'SEA は「この高さより下を海にする」しきい値、FREQ は模様の細かさです。',
      answer: `\`SEA\` を下げると陸が増えて**大陸だらけ**に、上げると**島がぽつぽつ浮かぶ水の惑星**になります。
\`FREQ\` を下げると大陸が数個の巨大な塊になり、上げると細かい群島になります。
**同じコードのまま、数値 2 つで惑星の性格が決まる**のがこの作り方の強みで、
画像を用意していたら、こうはいきません。`,
    },
    {
      prompt: `2 つ目のサンドボックス（継ぎ目が出るほう）を横に回して、**継ぎ目を探して**ください。
そのあと上から見て、極のあたりも見てください。1 つ目のコードと違うのは 1 か所だけです。どこでしょう。`,
      hint: 'ノイズに何を渡しているかだけが違います。',
      answer: `違いは**ノイズに UV（経度・緯度）を渡すか、方向ベクトル（x, y, z）を渡すか**の 1 点だけです。
UV を渡すと、経度 0 度の左端と右端が別の値になるので**縦の継ぎ目**が出て、
極では経度がぜんぶ 1 点に集まるので**模様が渦を巻いて潰れます**。
方向ベクトルで引けば、球の上のどの点も 3 次元空間のただの 1 点なので、
継ぎ目も極も**そもそも存在しません**。`,
    },
  ],
  quiz: [
    {
      q: '球のテクスチャを2次元ノイズで作ると、経度0度に縦の継ぎ目が出ます。理由はどれですか。',
      choices: [
        '`u = 0` と `u = 1` は球の上では同じ場所だが、ノイズには別の入力として渡るから',
        'テクスチャの解像度が足りないから',
        '`colorSpace` の指定を忘れているから',
        'SphereGeometry の分割数が少ないから',
      ],
      answer: 0,
      explain:
        '同じ場所に別の入力を渡せば、当然別の値が返ります。画素が指す「方向」でノイズを引けば、u=0 と u=1 はまったく同じベクトルになるので、継ぎ目は原理的に発生しません。',
    },
    {
      q: '`bumpMap` と `roughnessMap` に `colorSpace = THREE.SRGBColorSpace` を指定してはいけないのはなぜですか。',
      choices: [
        '色ではなく数値なので、色として変換されると値がずれるから',
        '容量が増えるから',
        '`bumpMap` は必ず線形でなければ動かないから',
        'CanvasTexture では指定できないから',
      ],
      answer: 0,
      explain:
        'sRGB の指定は「これは人が見る色だから、明るさの変換をしてから使ってください」という意味です。凹凸や粗さは見せる色ではなく計算に使う数値なので、変換されると意図した強さになりません。色の map だけに指定します。',
    },
    {
      q: 'ノイズを1段だけ使うと大陸が「染み」のように見えます。段数を増やすと何が変わりますか。',
      choices: [
        '大きな形は保ったまま、海岸線や山肌の細部が増える',
        '大陸の位置が変わる',
        '海の色が濃くなる',
        '生成が速くなる',
      ],
      answer: 0,
      explain:
        '段を進むごとに細かく・弱くなるので、主役はいちばん粗い段のまま、細部だけが乗っていきます。だから「大陸の配置は気に入っているが細部が足りない」というときは、段数だけを増やせば済みます。',
    },
  ],
};
