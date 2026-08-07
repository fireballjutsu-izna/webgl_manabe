import type { Chapter } from '../types.ts';

export const chapterX19: Chapter = {
  slug: 'x19-labels-finish',
  part: 'project',
  number: 19,
  title: 'ラベルを置いて、惑星ビューアーを完成させる',
  goal: '空間の中に HTML の文字を置けるようになり、$19$ 章ぶんの部品が $1$ つのシーンとしてどう並んでいるかを、上から読めるようになります。',
  requires: ['x18-camera-approach', 'm28-ndc', 'w40-dispose'],
  threeApis: [
    'CSS2DRenderer',
    'Object3D.add',
    'Vector3.project',
    'Sprite',
  ],
  mathRecall: [
    { slug: 'm28-ndc', note: 'ワールド座標から画面のピクセルまで' },
    { slug: '09-hierarchy', note: 'ラベルを天体の子にすれば、勝手に付いてくる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 文字だけは、3D で描かないほうがよい

最後に、天体の名前を出します。

$3$ 次元の中に文字を出す方法はいくつもありますが、
**いちばん割に合うのは「HTML をそこに置く」**です。

three の \`CSS2DRenderer\` は、
**ワールド座標を毎フレーム画面のピクセルに直して、\`div\` をそこへ動かす**という、
それだけの仕組みです。$3$ 次元の描画は $1$ 画素も増えません。

得られるものは大きいです。

- **文字がくっきり出る。** 拡大してもぼけません（ブラウザが文字を描くので）
- **CSS がそのまま使える。** 影・太さ・字間・折り返し・ホバー
- **選択できる。コピーできる。読み上げも効く**
`,
    },
    {
      kind: 'formula',
      tex: 'x_{\\text{px}} = \\dfrac{x_{\\text{ndc}} + 1}{2}\\,W, \\qquad y_{\\text{px}} = \\dfrac{1 - y_{\\text{ndc}}}{2}\\,H',
      readAloud:
        '$-1$〜$1$ の正規化デバイス座標を、画面のピクセルに直す式です。$x$ はそのまま、$y$ は上下が逆なので $1$ から引きます。$\\`CSS2DRenderer\\` が毎フレームやっているのは、この計算と \\`transform\\` の書き換えだけです。',
      worked: {
        given:
          'カメラを $(0,0,10)$ に置いて原点を見ます。画角 $45$ 度、画面は $1280 \\times 900$。ワールドの $(2,\\;1,\\;0)$ にラベルを置いたとき、画面のどこに出るかを出します。',
        steps: [
          { calc: 'tan(22.5 度) = 0.4142' },
          { calc: '距離 10 で写る高さの半分' },
          { calc: '  = 10 x 0.4142 = 4.142' },
          { calc: 'y_ndc = 1 / 4.142 = 0.2414' },
          { calc: '横は aspect = 1280/900 = 1.4222 で割る' },
          { calc: 'x_ndc = 2 / (4.142 x 1.4222) = 0.3395' },
          { calc: 'x_px = (0.3395+1)/2 x 1280 = 857.3' },
          { calc: 'y_px = (1-0.2414)/2 x 900 = 341.4' },
        ],
        result:
          '**画面の $(857,\\; 341)$ に \\`div\\` を置けばよい**と分かりました。three の \\`Vector3.project(camera)\\` に同じ点を渡すと $(0.3395,\\; 0.2414)$ が返り、手計算と一致します。**ラベルの仕組みは、この $2$ 行の変換に \\`position: absolute\\` を足しただけ**です。中身が分かっていれば、必要なら自分でも書けます。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '払っているものも、はっきりしています',
      text: `
HTML を空間に置く方法には、避けられない弱点が $3$ つあります。

- **奥行きがない。** 天体の裏側に回ったラベルも、手前に出ます。
  $3$ 次元の描画とは別の層にいるので、深度テストが効きません
- **数が増えると重い。** $1$ つにつき $1$ つの \`div\` が動きます。
  数百個を毎フレーム動かすと、$3$ 次元より先にブラウザのレイアウトが音を上げます
- **キャンバスの絵に写らない。** \`toDataURL\` で保存しても、ラベルは入りません

裏に回ったラベルを消したいなら、
**天体の方向とカメラの向きの内積**を見て \`display\` を切り替えます ―
[](#/ch/b26-dot-facing)でやった「前か後ろか」が、そのまま使えます。

数が多いなら \`Sprite\` に切り替えます。
文字をキャンバスに描いてテクスチャにするので**深度が効き**、
$1000$ 個でも $1$ 回の描画にまとめられます。その代わり、拡大するとぼけます。
`,
    },
    {
      kind: 'md',
      text: `
## ラベルは、天体の子にする

置き方は $2$ 行です。

- \`div\` を作って \`new CSS2DObject(div)\` に渡す
- **天体に \`add\` する**

$2$ つめが要点です。シーンの直下に置いて毎フレーム位置を書き写すこともできますが、
**子にしてしまえば、書き写す行そのものが要りません。**

月が公転しようが、惑星が自転しようが、ラベルは付いてきます。
[](#/ch/09-hierarchy)の親子関係を、$1$ 行で使い切っています。

\`label.position.y\` に少しだけ値を入れて、
**天体の真上に浮かせる**のも子の座標系の中の話です。
`,
    },
    {
      kind: 'md',
      text: `
## 19 章ぶんを、1 つのファイルで読む

これが惑星ビューアーの完成品です。長いのは、$19$ 章ぶんが入っているからです。

上から順に、こう並んでいます。

| 区画 | 作った章 |
|---|---|
| $3$ 枚のテクスチャを焼く | [](#/ch/x09-surface-bake) |
| シーン・カメラ・星空 | [](#/ch/p01-planet-setup)〜[](#/ch/x04-star-look) |
| 惑星（傾き用の入れ物） | [](#/ch/p04-planet-orbits) |
| 街の明かり・雲・大気 | [](#/ch/x11-atmosphere-rim)〜[](#/ch/x14-terminator) |
| 月と軌道の線 | [](#/ch/x16-orbit-motion) |
| **ラベル** | **この章** |
| **クリックで寄る** | [](#/ch/x17-pick-drag)・[](#/ch/x18-camera-approach) |
| 下ごしらえ（ノイズ） | [](#/ch/x06-value-noise) |

**コードの地図**で強調されているのが、この章で足した $2$ 区画です。
残りは、これまでに $1$ 行ずつ書いてきたものがそのまま並んでいます。
`,
    },
    {
      kind: 'sandbox',
      title: '惑星ビューアー（完成）',
      guide: { focus: ['ラベル', 'クリックで寄る'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

/* =========================================================
   これが完成品です。地表、雲・大気・夜の明かり、
   この章の傾き・公転・ラベル・クリックを 1 つにまとめてあります。
   ========================================================= */

const TEX_W = 1024;
const TEX_H = 512;
const SEA = 0.5;

/* ---- 地表・雲・街明かりを、1回のループでまとめて作る ---- */

function createMaps() {
  const make = () => {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    const ctx = canvas.getContext('2d');
    return { canvas: canvas, ctx: ctx, image: ctx.createImageData(TEX_W, TEX_H) };
  };
  const surface = make();
  const cloud = make();
  const lamp = make();

  for (let row = 0; row < TEX_H; row++) {
    const lat = (0.5 - row / (TEX_H - 1)) * Math.PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const absLat = Math.min(1, Math.abs(lat) / (Math.PI / 2));

    for (let col = 0; col < TEX_W; col++) {
      const lon = (col / TEX_W - 0.5) * Math.PI * 2;
      const dx = cosLat * Math.cos(lon);
      const dy = sinLat;
      const dz = cosLat * Math.sin(lon);
      const at = (row * TEX_W + col) * 4;

      const height = fbm(dx * 2.2 + 8, dy * 2.2 + 8, dz * 2.2 + 8, 5, 1337);
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
      surface.image.data[at] = r;
      surface.image.data[at + 1] = g;
      surface.image.data[at + 2] = b;
      surface.image.data[at + 3] = 255;

      const cloudNoise = fbm(dx * 3.4 - 40, dy * 3.4 - 40, dz * 3.4 - 40, 5, 99);
      const t = Math.min(1, Math.max(0, (cloudNoise - 0.5) / 0.22));
      const cover = t * t * (3 - 2 * t) * 255;
      cloud.image.data[at] = cover;
      cloud.image.data[at + 1] = cover;
      cloud.image.data[at + 2] = cover;
      cloud.image.data[at + 3] = 255;

      let glow = 0;
      if (height >= SEA) {
        const above = (height - SEA) / (1 - SEA);
        if (above < 0.3) {
          const town = noise3(dx * 90, dy * 90, dz * 90, 7);
          if (town > 0.72) glow = (town - 0.72) / 0.28 * 255;
        }
      }
      lamp.image.data[at] = glow;
      lamp.image.data[at + 1] = glow;
      lamp.image.data[at + 2] = glow;
      lamp.image.data[at + 3] = 255;
    }
  }

  surface.ctx.putImageData(surface.image, 0, 0);
  cloud.ctx.putImageData(cloud.image, 0, 0);
  lamp.ctx.putImageData(lamp.image, 0, 0);

  const colorMap = new THREE.CanvasTexture(surface.canvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  return {
    colorMap: colorMap,
    cloudMap: new THREE.CanvasTexture(cloud.canvas),
    lampMap: new THREE.CanvasTexture(lamp.canvas),
  };
}

const maps = createMaps();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 3000);
camera.position.set(0, 4, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// ラベル用のレンダラ。キャンバスに重ねるので、位置と当たり判定を外しておく
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 2.4;
controls.maxDistance = 60;

/* ---- 星空 ---- */

function createStars(count, radius) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const y = THREE.MathUtils.randFloatSpread(2);
    const r = Math.sqrt(1 - y * y);
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3 + 0] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0xffffff, size: 1.5, sizeAttenuation: false, depthWrite: false,
  }));
}
scene.add(createStars(3000, 1200));

/* ---- 光 ---- */

const sunDirection = new THREE.Vector3(1, 0.18, 0.35).normalize();
const sun = new THREE.DirectionalLight(0xfff2e0, 3.4);
sun.position.copy(sunDirection).multiplyScalar(40);
scene.add(sun, new THREE.AmbientLight(0x22334a, 0.28));

/* ---- 惑星（傾き用の入れ物をかぶせる） ---- */

const RADIUS = 1.6;

const tilt = new THREE.Group();
tilt.rotation.z = THREE.MathUtils.degToRad(23.4);
scene.add(tilt);

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(RADIUS, 96, 64),
  new THREE.MeshStandardMaterial({ map: maps.colorMap, roughness: 0.85 }),
);
planet.name = '惑星';
tilt.add(planet);

// 夜の街明かり。地表と一緒に回るので、tilt の中に入れる
const lamps = new THREE.Mesh(
  new THREE.SphereGeometry(RADIUS * 1.003, 96, 64),
  new THREE.ShaderMaterial({
    uniforms: {
      uLights: { value: maps.lampMap },
      uSunDirection: { value: sunDirection },
    },
    vertexShader: [
      'varying vec2 vUv;',
      'varying vec3 vNormal;',
      'void main() {',
      '  vUv = uv;',
      '  vNormal = normalize(mat3(modelMatrix) * normal);',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}',
    ].join('\\n'),
    fragmentShader: [
      'uniform sampler2D uLights;',
      'uniform vec3 uSunDirection;',
      'varying vec2 vUv;',
      'varying vec3 vNormal;',
      'void main() {',
      '  float night = smoothstep(0.08, -0.22, dot(normalize(vNormal), uSunDirection));',
      '  float lamp = texture2D(uLights, vUv).r;',
      '  gl_FragColor = vec4(vec3(1.0, 0.82, 0.55) * lamp * night * 2.2, 1.0);',
      '}',
    ].join('\\n'),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  }),
);
tilt.add(lamps);

// 雲。少し速く流す
const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(RADIUS * 1.02, 96, 64),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    alphaMap: maps.cloudMap,
    transparent: true,
    depthWrite: false,
    roughness: 1,
  }),
);
tilt.add(clouds);

// 大気
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(RADIUS * 1.2, 96, 64),
  new THREE.ShaderMaterial({
    uniforms: {
      uSunDirection: { value: sunDirection },
      uColor: { value: new THREE.Color(0x4a9dff) },
    },
    vertexShader: [
      'varying vec3 vNormal;',
      'varying vec3 vViewDir;',
      'void main() {',
      '  vec4 worldPosition = modelMatrix * vec4(position, 1.0);',
      '  vNormal = normalize(mat3(modelMatrix) * normal);',
      '  vViewDir = normalize(cameraPosition - worldPosition.xyz);',
      '  gl_Position = projectionMatrix * viewMatrix * worldPosition;',
      '}',
    ].join('\\n'),
    fragmentShader: [
      'uniform vec3 uSunDirection;',
      'uniform vec3 uColor;',
      'varying vec3 vNormal;',
      'varying vec3 vViewDir;',
      'void main() {',
      '  vec3 n = normalize(vNormal);',
      '  float thickness = abs(dot(n, normalize(vViewDir)));',
      '  float sunSide = smoothstep(-0.35, 0.5, dot(n, uSunDirection));',
      '  gl_FragColor = vec4(uColor * pow(thickness, 1.4) * 2.6 * (0.12 + 0.88 * sunSide), 1.0);',
      '}',
    ].join('\\n'),
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  }),
);
scene.add(atmosphere);

// 中心が同じ 3 枚は「遠い順」で並べようがないので、順番を明示しておく
lamps.renderOrder = 1;
clouds.renderOrder = 2;
atmosphere.renderOrder = 3;

/* ---- 月 ---- */

const MOON_R = 4.6;
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.44, 48, 32),
  new THREE.MeshStandardMaterial({ color: 0x9aa3b2, roughness: 1 }),
);
moon.name = '月';
scene.add(moon);

const orbitPoints = [];
for (let i = 0; i <= 160; i++) {
  const a = (i / 160) * Math.PI * 2;
  orbitPoints.push(new THREE.Vector3(Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R));
}
scene.add(new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(orbitPoints),
  new THREE.LineBasicMaterial({ color: 0x2c2c46 }),
));

/* ---- ラベル ---- */

function addLabel(target, text, offsetY) {
  const div = document.createElement('div');
  div.textContent = text;
  div.style.cssText =
    'color:#e8e8f2; font:11px sans-serif; letter-spacing:0.08em;' +
    'text-shadow:0 0 6px rgba(0,0,0,0.9); white-space:nowrap;';
  const label = new CSS2DObject(div);
  label.position.y = offsetY;
  target.add(label);
}
addLabel(planet, '惑星', RADIUS + 0.5);
addLabel(moon, '月', 0.8);

/* ---- クリックで寄る ---- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const targets = [planet, moon];

// 目標。毎フレーム、いまの値をここへ少しずつ近づける
const desiredTarget = new THREE.Vector3(0, 0, 0);
const desiredPosition = new THREE.Vector3().copy(camera.position);

let downX = 0;
let downY = 0;

renderer.domElement.addEventListener('pointerdown', (event) => {
  downX = event.clientX;
  downY = event.clientY;
});

renderer.domElement.addEventListener('pointerup', (event) => {
  // 押した場所から動いていたら、視点を回しただけなのでクリックとみなさない
  const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
  if (moved > 4) return;

  // 画面の座標を -1〜1 の正規化デバイス座標へ（2-08）
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(targets, false);
  if (hits.length === 0) {
    // 何もない場所をクリックしたら引く
    desiredTarget.set(0, 0, 0);
    desiredPosition.set(0, 4, 12);
    return;
  }

  const object = hits[0].object;
  const center = object.getWorldPosition(new THREE.Vector3());
  const distance = object === moon ? 1.6 : 5.2;

  desiredTarget.copy(center);
  // いまの視線の向きを保ったまま、対象から distance だけ離れた位置へ
  desiredPosition
    .copy(camera.position)
    .sub(controls.target)
    .normalize()
    .multiplyScalar(distance)
    .add(center);
});

/* ---- ループ ---- */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  planet.rotation.y += dt * 0.06;
  lamps.rotation.y = planet.rotation.y;   // 明かりは地表と完全に同期させる
  clouds.rotation.y += dt * 0.085;        // 雲だけ少し速い

  const a = t * 0.3;
  moon.position.set(Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R);
  moon.rotation.y = -a;   // いつも同じ面を惑星に向ける（潮汐固定）

  sunDirection.set(Math.cos(t * 0.12), 0.18, Math.sin(t * 0.12)).normalize();
  sun.position.copy(sunDirection).multiplyScalar(40);

  // 毎フレーム、残りの 6 パーセントを詰める。近づくほど遅くなる
  camera.position.lerp(desiredPosition, 0.06);
  controls.target.lerp(desiredTarget, 0.06);

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- 下ごしらえ：3次元ノイズ（地表の章で作ったもの。読み飛ばして可） ---- */

function hash3(x, y, z, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177);
  h = Math.imul(h + Math.imul(seed, 2246822519), 2654435761);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967295;
}
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
function fbm(x, y, z, octaves, seed) {
  let sum = 0, total = 0, amp = 1, freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += noise3(x * freq, y * freq, z * freq, seed + i * 101) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / total;
}
`,
      caption:
        '惑星や月をクリックすると寄っていき、何もない場所をクリックすると引きます。ドラッグでは寄りません（$4$ ピクセルの閾値）。名前のラベルは天体に付いているので、寄れば一緒に付いてきます。**コードの地図で色が付いている $2$ 区画が、この章で足したぶんです。** 残りは[](#/ch/p01-planet-setup)から[](#/ch/x18-camera-approach)までの $18$ 章で作ったものが、そのまま並んでいます。最初にテクスチャを焼くので、走り出すまで一瞬待ちます。ラベルの `div` に `background` を付けると、そこだけ HTML であることがはっきり分かります。',
    },
    {
      kind: 'md',
      text: `
## 惑星ビューアーは、ここで完成です

$19$ 章かけて、画像を $1$ 枚も使わずに惑星を $1$ つ作りました。
使った道具を数え直すと、こうなります。

- **内積** … 大気の厚み・昼夜の境目・面の向き
- **三角関数** … 星のばらまき・方向ベクトル・公転
- **$3$ 次元ノイズ** … 地表・雲・街の明かり
- **親子関係** … 傾きと自転、ラベル
- **$\\mathrm{lerp}$** … カメラの寄り

**新しい数学は、$1$ つも出てきませんでした。**
第1部と第2部で手を動かしたものが、そのまま形になっています。

次からは**街**を作ります。惑星が「丸いものの上に模様を描く」話だったのに対し、
街は「**平らな地面を、決まりに従って分割していく**」話です。
[](#/ch/b39-seed)の決め打ちの乱数と、[](#/ch/m40-subdivision)の再帰的な分割が主役になります。
`,
    },
  ],
  exercises: [
    {
      prompt: `惑星の裏側に回ったラベルを隠したい。

どんな判定を書きますか。`,
      hint: 'カメラから見て、ラベルが天体の手前にあるか奥にあるかを知りたい。',
      answer: `**天体からラベルへの向きと、天体からカメラへの向きの内積を見ます。**

**考え方**

ラベルは天体の中心から見て、ある方向にあります。
カメラも、天体の中心から見てある方向にあります。

その $2$ つの向きの内積が

- **正** … ラベルはカメラ側 ＝ 手前。出してよい
- **負** … ラベルは向こう側 ＝ 裏。隠す

[](#/ch/b26-dot-facing)でやった「前か後ろか」そのものです。

**実装**

毎フレーム、ラベルのワールド位置と天体の中心、カメラの位置から
$2$ 本のベクトルを作って内積を取り、\`div.style.display\` を切り替えます。

**急に消えると目障りです**

$0$ を境に \`display\` を切り替えると、**ぱっと消えて、ぱっと出ます。**

境目に幅を持たせて \`opacity\` を動かすほうが自然です ―
ここでも[](#/ch/b36-smoothstep)が使えます。

$-0.1$ から $0.1$ のあいだで $0 \\to 1$ にすれば、回り込むにつれて薄れていきます。

**ただし、この作品では何もしていません**

天体が $2$ つ、ラベルも $2$ つ。しかも遠景なので、
**裏に回ったラベルが問題になる場面がありません。**

$100$ 個のラベルがあるときに初めて要る処理です。`,
      answerCode: `// 天体の中心から見て、ラベルとカメラが同じ側にいるか
const center = planet.getWorldPosition(new THREE.Vector3());
const toLabel = label.getWorldPosition(new THREE.Vector3()).sub(center).normalize();
const toCamera = camera.position.clone().sub(center).normalize();

// -0.1〜0.1 で薄れさせる（いきなり消さない）
const t = THREE.MathUtils.smoothstep(toLabel.dot(toCamera), -0.1, 0.1);
label.element.style.opacity = String(t);`,
    },
    {
      prompt: `ラベルを $500$ 個置きたくなりました。\`CSS2DObject\` のままで大丈夫でしょうか。

だめなら、何に替えますか。`,
      hint: 'ラベル $1$ つにつき、何が $1$ つ増えますか。それを毎フレーム動かすのは誰ですか。',
      answer: `**だめです。\`Sprite\` に替えます。**

**何が起きるか**

\`CSS2DObject\` は $1$ つにつき \`div\` を $1$ つ持ちます。

毎フレーム、$500$ 個の \`div\` の \`transform\` が書き換わります。

- ブラウザは $500$ 要素のレイアウトと合成をやり直す
- **$3$ 次元の描画より、こちらが先に重くなります**
- しかも重さが**描画の外**にあるので、three の統計に出ません

「$3$ 次元は軽いのに、なぜかカクつく」という、
原因の見つけにくい重さになります。

**Sprite なら**

文字をキャンバスに描いてテクスチャにし、常にカメラを向く板に貼ります。

- **深度が効く** … 裏に回れば勝手に隠れる
- **まとめられる** … 同じテクスチャなら $1$ 回の描画にできる
- **拡大するとぼける** … これが代償

**判断の目安**

| 数 | 向いているもの |
|---|---|
| 〜数十 | \`CSS2DObject\`。読みやすさと CSS の自由が勝つ |
| 数百〜 | \`Sprite\`。深度も効くし、まとめられる |
| 数千〜 | $1$ 枚のテクスチャに文字を敷き詰めて、$1$ 回で描く |

**そして、たいていの作品は数十で足ります。**
$500$ 個のラベルが本当に要るのかを、先に疑ってください。`,
    },
    {
      prompt: `完成版で、\`labelRenderer.render(scene, camera)\` の行を消すとどうなりますか。

\`renderer.render\` だけでは足りないのはなぜですか。`,
      hint: 'ラベルは、キャンバスの中にありますか。',
      answer: `**ラベルが動かなくなります（初期位置に貼りついたまま）。**

**なぜ 2 回描くのか**

$2$ つのものは、まったく別の場所にあります。

- \`renderer\` … WebGL のキャンバスに、$3$ 次元を描く
- \`labelRenderer\` … キャンバスの上に重ねた \`div\` の位置を書き換える

**後者は「描画」ではなく「$500$ 個の \`style.transform\` の更新」**です。
$3$ 次元の描画とは何の関係もないので、\`renderer.render\` が面倒を見ることはありません。

**リサイズも 2 回要ります**

同じ理由で、\`resize\` のときも $2$ つとも呼びます。

片方を忘れると、**窓を変えたときだけラベルがずれる**という、
気づくのに時間のかかる不具合になります。

**この構造は他でも出てきます**

「$3$ 次元の描画」と「その上に重ねた別のもの」を持つとき、
更新の呼び出しは常に $2$ 系統になります。

- ポストプロセスの \`composer.render()\`
- $2$ つめのカメラで小窓を描く \`renderer.setViewport\`
- \`CSS3DRenderer\`

**「描く場所が $2$ つあるなら、更新も $2$ つ」** ―
$1$ つにまとめられないかを考えるより、$2$ つ呼ぶことを忘れないほうが確実です。`,
    },
  ],
  quiz: [
    {
      q: '`CSS2DObject` は、どんな仕組みでラベルを空間に置いていますか。',
      choices: [
        'ワールド座標を画面のピクセルに直して、div の transform を毎フレーム書き換えている',
        '文字をテクスチャにして、板に貼っている',
        '3D のフォントデータから文字の形を作っている',
        'キャンバスに直接文字を描いている',
      ],
      answer: 0,
      explain:
        'やっているのは座標変換と CSS の書き換えだけで、3 次元の描画は 1 画素も増えません。だから文字がくっきり出て、CSS がそのまま使え、選択もコピーもできます。代わりに深度が効かず、数が増えるとブラウザのレイアウトが重くなり、キャンバスの保存画像にも写りません。',
    },
    {
      q: 'ラベルを天体の子（`planet.add(label)`）にする利点はどれですか。',
      choices: [
        '天体が自転しても公転しても、位置を書き写す行なしで付いてくる',
        '深度テストが効くようになる',
        '描画が速くなる',
        'CSS が使えるようになる',
      ],
      answer: 0,
      explain:
        '親の変換は子に丸ごとかぶさるので、月がどこへ動こうとラベルは付いてきます。シーン直下に置いて毎フレーム位置をコピーすることもできますが、その行は書き忘れる余地があり、書き忘れても最初の数秒は正しく見えます。忘れる余地のない形を選ぶほうが確実です。',
    },
    {
      q: '`labelRenderer.render(scene, camera)` を呼ばないと何が起きますか。',
      choices: [
        'ラベルの div が動かず、初期位置に貼りついたままになる',
        'ラベルがまったく表示されない',
        '3D の描画も止まる',
        '何も起きない。renderer.render が両方やる',
      ],
      answer: 0,
      explain:
        'div の位置を更新しているのは labelRenderer です。renderer.render は WebGL のキャンバスにしか関知しません。同じ理由でリサイズのときも 2 つとも呼ぶ必要があり、片方を忘れると「窓を変えたときだけラベルがずれる」という見つけにくい不具合になります。',
    },
  ],
};
