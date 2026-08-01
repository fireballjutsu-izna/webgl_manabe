import type { Chapter } from '../types.ts';

export const chapterP03: Chapter = {
  slug: 'p03-planet-atmosphere',
  part: 'project',
  number: 3,
  title: '惑星ビューアー ― 大気と雲と、夜',
  goal: '縁が光る大気を自分で書けるようになり、昼と夜の境目に応じて見た目を変えられるようになります。',
  requires: ['p02-planet-surface', 't14-fragment-shader', '03-dot'],
  threeApis: [
    'ShaderMaterial',
    'ShaderMaterial.uniforms',
    'Material.blending',
    'Material.side',
    'Material.depthWrite',
    'MeshStandardMaterial.alphaMap',
    'Vector3.normalize',
    'Vector3.dot',
  ],
  mathRecall: [
    { slug: '03-dot', note: '内積 ― 縁を見つけるのも昼夜を分けるのもこれ' },
    { slug: '11-normal-light', note: '法線と光の向きの関係' },
    { slug: 't12-shader-intro', note: 'uniform と varying の受け渡し' },
    { slug: 't14-fragment-shader', note: '画素ごとに色を決める' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 「惑星らしさ」の8割は、縁にある

前の章で地表はできました。それでもまだ、どこか模型めいて見えます。
足りないのは**縁**です。

写真の地球を思い出してください。**丸い輪郭のすぐ外側に、青い光の帯**があります。
これが大気です。そして人間の目は、この帯があるかどうかで
「本物っぽさ」をほぼ決めてしまいます。

この章でやるのは 3 つです。どれも[](#/ch/03-dot)が主役です。

- **大気の光** … 縁だけを光らせる（内積で「縁かどうか」を測る）
- **雲** … 薄い層をもう 1 枚かぶせる
- **夜の明かり** … 太陽の当たっていない側にだけ、街の光を足す（内積で「夜かどうか」を測る）
`,
    },
    {
      kind: 'md',
      text: `
## 縁かどうかは、内積で分かる

面が「正面を向いている」か「縁で寝ている」かは、**法線と視線の内積**で分かります。

- 正面を向いている面 … 法線が自分のほうを向いている → 内積の大きさが **1 に近い**
- 縁で寝ている面 … 法線が視線と直交している → 内積の大きさが **0 に近い**

つまり、**内積の大きさが 0 に近いところだけを光らせれば、縁が光ります。**
[](#/ch/03-dot)でやった「内積は 2 本の向きの一致度」が、そのまま使えます。
`,
    },
    {
      kind: 'formula',
      tex: 'I = |\\,\\mathbf{n} \\cdot \\mathbf{v}\\,|^{\\,p}',
      readAloud:
        '明るさ I は、法線 n と視線 v の内積の絶対値を p 乗したもの、と読みます。この形は「縁がどれだけ厚いか」を表します。p は 1.5 前後にすると、帯のふちが自然にぼけます。',
      worked: {
        given: '$p = 1.4$（実際のコードの値）で、内積の絶対値を 4 か所で見ます。',
        steps: [
          { calc: '|n.v| = 0.0 : 0.0 の 1.4 乗 = 0',    note: '大気シェルのいちばん外。ここで消える' },
          { calc: '|n.v| = 0.3 : 0.3 の 1.4 乗 = 0.185' },
          { calc: '|n.v| = 0.6 : 0.6 の 1.4 乗 = 0.489' },
          { calc: '|n.v| = 0.9 : 0.9 の 1.4 乗 = 0.863', note: '惑星のふちのすぐ外。いちばん明るい' },
        ],
        result: '**惑星のふちで明るく、外へ行くほど 0 へ落ちます。** いちばん値が大きくなる中心付近は、惑星そのものが隠しているので見えません。結果として、**見えるのは細い帯だけ**になります。$p$ を 4.0 に上げると 0.9 でも 0.66 まで落ち、帯がさらに細く鋭くなります。',
      },
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: 'なぜ縁が明るいのか（本当の理由）',
      text: `
実際の空が縁で明るいのは、**そこを通る光の道のりが長い**からです。

真上を見上げるとき、光は大気層をまっすぐ最短距離で抜けてきます。
一方、地平線のほうを見ると、光は大気層を斜めに、ずっと長く通ってきます。
長く通れば、それだけ散乱した青が積み重なります。夕焼けが赤いのも同じ理屈です。

**内積の大きさは、この「道のりの長さ」の代わり**になっています。
縁ほど内積が 0 に近く、通り抜ける距離が長い ― 向きの計算が、そのまま厚みの計算になっているわけです。
`,
    },
    {
      kind: 'md',
      text: `
## 惑星より少し大きい球を、内側から見る

大気は「惑星より少し大きい、薄い殻」です。三次元でどう置くかというと、こうします。

- 半径を惑星の **1.2 倍**にした球を用意する
- \`side: THREE.BackSide\` にして、**内側の面**を描く
- \`blending: THREE.AdditiveBlending\` で、下にあるものに**足す**
- \`depthWrite: false\` にして、奥行きの記録を汚さない

内側を描くのが要点です。こうすると惑星本体が手前にある部分は惑星に隠され、
**惑星の輪郭のすぐ外側だけが残ります。** それがちょうど大気の帯になります。

しかも都合よく、内側の面の内積の大きさは**惑星の縁でいちばん大きく、殻の外へ向かって 0 になります。**
だから \`|n·v|\` をそのまま明るさにすると、地表に張り付いて外へ薄れる、狙いどおりの帯になります。
`,
    },
    {
      kind: 'sandbox',
      title: '大気だけを作る',
      guide: { focus: ['大気'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 0.8, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 太陽の向き（長さ1に揃えておく。内積で使うので）
const sunDirection = new THREE.Vector3(1, 0.25, 0.5).normalize();

const sun = new THREE.DirectionalLight(0xfff2e0, 3.2);
sun.position.copy(sunDirection).multiplyScalar(10);
scene.add(sun, new THREE.AmbientLight(0x2a3a5a, 0.3));

/* ---- 惑星。この章では地表を作らず、無地にして大気だけを見る ---- */

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(1.6, 96, 64),
  new THREE.MeshStandardMaterial({ color: 0x27405e, roughness: 0.9 }),
);
scene.add(planet);

/* ---- 大気 ---- */

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.6 * 1.2, 96, 64),
  new THREE.ShaderMaterial({
    uniforms: {
      uSunDirection: { value: sunDirection },
      uColor: { value: new THREE.Color(0x4a9dff) },
      uStrength: { value: 2.6 },
    },
    vertexShader: [
      'varying vec3 vNormal;',
      'varying vec3 vViewDir;',
      'void main() {',
      '  vec4 worldPosition = modelMatrix * vec4(position, 1.0);',
      // 回転と一様な拡大だけなら、法線は mat3(modelMatrix) で世界の向きに直せる
      '  vNormal = normalize(mat3(modelMatrix) * normal);',
      '  vViewDir = normalize(cameraPosition - worldPosition.xyz);',
      '  gl_Position = projectionMatrix * viewMatrix * worldPosition;',
      '}',
    ].join('\\n'),
    fragmentShader: [
      'uniform vec3 uSunDirection;',
      'uniform vec3 uColor;',
      'uniform float uStrength;',
      'varying vec3 vNormal;',
      'varying vec3 vViewDir;',
      'void main() {',
      '  vec3 n = normalize(vNormal);',
      // 縁ほど大きくなる。内側の面を見ているので絶対値を取る
      '  float thickness = abs(dot(n, normalize(vViewDir)));',
      '  float band = pow(thickness, 1.4);',
      // 太陽の側だけを明るくする。夜側にはうっすら残す
      '  float sunSide = smoothstep(-0.35, 0.5, dot(n, uSunDirection));',
      '  vec3 color = uColor * band * uStrength * (0.12 + 0.88 * sunSide);',
      '  gl_FragColor = vec4(color, 1.0);',
      '}',
    ].join('\\n'),
    side: THREE.BackSide,            // 内側の面を描く
    blending: THREE.AdditiveBlending, // 下にあるものに足す
    transparent: true,
    depthWrite: false,               // 奥行きの記録を汚さない
  }),
);
scene.add(atmosphere);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // 太陽をゆっくり回して、昼夜の境目が動くのを見る
  sunDirection.set(Math.cos(t * 0.25), 0.25, Math.sin(t * 0.25)).normalize();
  sun.position.copy(sunDirection).multiplyScalar(10);

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
        '`side` を `THREE.FrontSide` に変えると、青い霧が惑星の全面にかぶって台無しになります。`1.6 * 1.2` の 1.2 を 1.02 にすると帯が細くなり、1.6 にすると膨らみすぎて綿あめになります。`pow(thickness, 1.4)` の指数を 4.0 にすると、帯が地表に張り付いて細く鋭くなります。',
    },
    {
      kind: 'md',
      text: `
## 足し算のブレンド ― 黒は勝手に透明になる

\`AdditiveBlending\`（{{加算ブレンド}}）は「**すでに描かれている色に足す**」動作です。
ここから 2 つの性質が出ます。

- **黒い部分は何も起きない。** 0 を足しても変わらないので、透明にする指定は要りません
- **明るいところは飽和して白くなる。** 光や炎の表現に向く一方、暗くはできません

大気・光の筋・火花・レンズフレアは、これで作るのが定石です。
逆に、**煙のように背景を暗くしたいものには使えません。** そちらはふつうの \`transparent\` を使います。

\`depthWrite: false\` を必ず添えてください。半透明のものが奥行きを書き込むと、
その後ろにあるものが「隠された」と判定されて消えます。
[](#/ch/t03-material)で触れた、透明の重なり順の話がここでも出てきます。
`,
    },
    {
      kind: 'md',
      text: `
## 雲は、もう1枚かぶせるだけ

雲は難しく考える必要がありません。**惑星より少しだけ大きい球に、穴あきの白い模様を貼ります。**

模様は前の章と同じ 3 次元ノイズで作ります。ちがうのは**閾値の使い方**だけです。

- 地表 … 高さ 0.5 を境に海と陸に分けた
- 雲 … 高さ 0.55 くらいから上を雲にし、**境目をぼかす**（そうしないと切り絵のようになります）

不透明度は \`alphaMap\` で渡します。白いところが濃い雲、黒いところが晴れです。
材質は \`MeshStandardMaterial\` のままにしておくと、**雲も太陽の光を受ける**ので、
夜側では自然に暗くなります。これは自分で書かなくてよい仕事です。
`,
    },
    {
      kind: 'md',
      text: `
## 夜の明かり ― 内積で「夜」を切り出す

夜側にだけ街の光を足したい。ところが \`MeshStandardMaterial\` の \`emissive\` は
**光の向きを知りません**。全面が一律に光ってしまいます。

そこで、大気と同じ手を使います。**街明かり専用の薄い層をもう 1 枚重ね、
「夜かどうか」を内積で判定して明るさを決めます。**
`,
    },
    {
      kind: 'formula',
      tex: '\\text{夜の強さ} = \\mathrm{smoothstep}(0.08,\\; -0.22,\\; \\mathbf{n} \\cdot \\mathbf{s})',
      readAloud:
        '法線 n と太陽の向き s の内積が 0.08 のとき 0、-0.22 のとき 1 になるようになめらかに変える、と読みます。内積が正なら昼、負なら夜です。境目をぴったり 0 にせず幅を持たせると、夕方の帯ができます。',
      worked: {
        given: '$\\mathrm{smoothstep}(0.08,\\; -0.22,\\; \\mathbf{n} \\cdot \\mathbf{s})$ を、3 か所で通します。**しきい値の並びが大きい→小さいの逆順**なのがこの式の要点です。',
        steps: [
          { calc: 'n.s = 0.3  (昼) : t = (0.3-0.08)/(-0.3)' },
          { calc: '                = -0.73 → clamp して 0', note: '明かりは消えている' },
          { calc: 'n.s = -0.07(夕) : t = (-0.15)/(-0.3) = 0.5' },
          { calc: '                  0.5の2乗x(3-1) = 0.5', note: 'ちょうど半分の明るさ' },
          { calc: 'n.s = -0.5 (夜) : t = (-0.58)/(-0.3)' },
          { calc: '                = 1.93 → clamp して 1', note: '全点灯' },
        ],
        result: '**0 → 0.5 → 1。** 境目を $0$ ちょうどにせず $0.08$ から $-0.22$ までの幅を持たせているので、**約 0.3 ぶんの帯が「夕方」になります**。ここを $0$ と $0$ にすると、昼と夜がナイフで切ったように分かれ、一気に嘘くさくなります。',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'smoothstep の引数は、逆向きに書ける',
      text: `
\`smoothstep(0.08, -0.22, x)\` のように**大きいほうを先に書く**と、値は逆向きに動きます。
つまり「x が小さいほど 1 に近づく」関数になります。

\`1.0 - smoothstep(-0.22, 0.08, x)\` と書いても同じですが、
引数を入れ替えるほうが 1 か所しか触らないので、間違いが減ります。
`,
    },
    {
      kind: 'sandbox',
      title: '惑星ビューアー（地表・雲・大気・夜の明かり）',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TEX_W = 1024;
const TEX_H = 512;
const SEA = 0.5;
const RADIUS = 1.6;

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
  const lights = make();

  for (let row = 0; row < TEX_H; row++) {
    const lat = (0.5 - row / (TEX_H - 1)) * Math.PI;   // 上の行が北極
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const absLat = Math.min(1, Math.abs(lat) / (Math.PI / 2));

    for (let col = 0; col < TEX_W; col++) {
      const lon = (col / TEX_W - 0.5) * Math.PI * 2;
      const dx = cosLat * Math.cos(lon);
      const dy = sinLat;
      const dz = cosLat * Math.sin(lon);
      const at = (row * TEX_W + col) * 4;

      /* 地表 */
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

      /* 雲。閾値の境目をぼかすのが要点 */
      const cloudNoise = fbm(dx * 3.4 - 40, dy * 3.4 - 40, dz * 3.4 - 40, 5, 99);
      // 0.5 で 0、0.72 で 1 になるようになめらかに立ち上げる
      const t = Math.min(1, Math.max(0, (cloudNoise - 0.5) / 0.22));
      const cover = t * t * (3 - 2 * t) * 255;
      cloud.image.data[at] = cover;
      cloud.image.data[at + 1] = cover;
      cloud.image.data[at + 2] = cover;
      cloud.image.data[at + 3] = 255;

      /* 街明かり。陸の低いところに、まばらに置く */
      let glow = 0;
      if (height >= SEA) {
        const above = (height - SEA) / (1 - SEA);
        if (above < 0.3) {
          const town = noise3(dx * 90, dy * 90, dz * 90, 7);
          if (town > 0.72) glow = (town - 0.72) / 0.28 * 255;
        }
      }
      lights.image.data[at] = glow;
      lights.image.data[at + 1] = glow;
      lights.image.data[at + 2] = glow;
      lights.image.data[at + 3] = 255;
    }
  }

  surface.ctx.putImageData(surface.image, 0, 0);
  cloud.ctx.putImageData(cloud.image, 0, 0);
  lights.ctx.putImageData(lights.image, 0, 0);

  const colorMap = new THREE.CanvasTexture(surface.canvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  return {
    colorMap: colorMap,
    cloudMap: new THREE.CanvasTexture(cloud.canvas),
    lightsMap: new THREE.CanvasTexture(lights.canvas),
  };
}

/* ---- シーン ---- */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 1.1, 5.6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;  // 明るい部分の階調を残す
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 2.6;
controls.maxDistance = 24;

const maps = createMaps();
const sunDirection = new THREE.Vector3(1, 0.2, 0.4).normalize();

const sun = new THREE.DirectionalLight(0xfff2e0, 3.4);
sun.position.copy(sunDirection).multiplyScalar(10);
scene.add(sun, new THREE.AmbientLight(0x22334a, 0.25));

/* 惑星本体 */
const planet = new THREE.Mesh(
  new THREE.SphereGeometry(RADIUS, 96, 64),
  new THREE.MeshStandardMaterial({ map: maps.colorMap, roughness: 0.85, metalness: 0 }),
);
scene.add(planet);

/* 街明かり。夜側にだけ足す */
const lights = new THREE.Mesh(
  new THREE.SphereGeometry(RADIUS * 1.003, 96, 64),
  new THREE.ShaderMaterial({
    uniforms: {
      uLights: { value: maps.lightsMap },
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
      // 内積が正なら昼、負なら夜。境目に幅を持たせて夕方を作る
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
scene.add(lights);

/* 雲。太陽の光を受けるので、夜側では自然に暗くなる */
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
scene.add(clouds);

/* 大気 */
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
      '  vec3 color = uColor * pow(thickness, 1.4) * 2.6 * (0.12 + 0.88 * sunSide);',
      '  gl_FragColor = vec4(color, 1.0);',
      '}',
    ].join('\\n'),
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  }),
);
scene.add(atmosphere);

/* ---- ループ ---- */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  // 太陽を回す。uniform は同じ Vector3 を共有しているので、書き換えるだけで全部に届く
  sunDirection.set(Math.cos(t * 0.18), 0.2, Math.sin(t * 0.18)).normalize();
  sun.position.copy(sunDirection).multiplyScalar(10);

  planet.rotation.y += dt * 0.05;
  lights.rotation.y = planet.rotation.y;   // 明かりは地表と一緒に回る
  clouds.rotation.y += dt * 0.075;         // 雲は少し速く流れる

  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- 下ごしらえ：3次元ノイズ（3-02 で作ったもの。読み飛ばして可） ---- */

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
        '待っていると太陽が回り、夜側に街の明かりが浮かびます。`lights.rotation.y = planet.rotation.y` を消すと、明かりが陸から外れて海の上で光りはじめます ― 層を重ねるときは「どれと一緒に回るか」を必ず決める必要がある、という話です。雲の速度を `dt * 0.3` にすると、風が強すぎて嘘くさくなります。',
    },
    {
      kind: 'md',
      text: `
## 4枚の層で、1つの惑星

できあがったものを整理すると、こうなっていました。

- **半径 1.000** … 地表（\`MeshStandardMaterial\` ＋ 色のテクスチャ）
- **半径 1.003** … 街の明かり（自作シェーダ・足し算のブレンド・夜側だけ）
- **半径 1.020** … 雲（\`alphaMap\` で穴を開けた白・光を受ける）
- **半径 1.200** … 大気（自作シェーダ・内側の面・足し算のブレンド）

**1 枚で全部やろうとしないこと**が、この構成の要点です。
それぞれの層が 1 つのことだけを担当しているので、
「雲だけ濃くしたい」「夜の明かりだけ暖色にしたい」を独立に触れます。

**回る速さが層ごとに違う**のも大事です。明かりは地表と完全に同期し、雲だけ少し速い。
これだけで「大気がある星」に見えます。

もう 1 つ、完成版には \`renderer.toneMapping = THREE.ACESFilmicToneMapping\` を入れています。
足し算のブレンドを重ねると明るい部分が 1 を超えて白く潰れるので、
{{トーンマッピング}}で階調を残しています。1 行で効果がはっきり出る設定です。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '層を増やすと、半透明の描画順が効いてきます',
      text: `
半透明のものが増えると、three は**カメラから遠い順**に描こうとします。
たいていはうまくいきますが、層が同心球のように重なると、
わずかな距離の差で順番が入れ替わり、ちらつくことがあります。

**\`depthWrite: false\` を全部の半透明層に付けておく**のがまず打つ手です。
それでも気になるなら、\`renderOrder\` を明示して順番を固定します
（小さい数から描かれます）。
`,
    },
  ],
  exercises: [
    {
      prompt: '1 つ目のサンドボックスで、大気のシェルの半径 \`1.6 * 1.2\` を \`1.6 * 1.02\` にしてください。見た目はどう変わりますか。',
      hint: '大気は、惑星より少し大きい球です。その「少し」の量です。',
      answer: `縁の光の帯が**細く、締まった**見た目になります。逆に 1.4 などにすると、ふわりと広い大気になります。
この 1 つの数字が「地球のような薄い大気」と「金星のような分厚い大気」を分けています。
半径を 1.0 と同じにすると、深度がぶつかって**ちらつく**ので、必ず少し大きくします。`,
    },
    {
      prompt: '\`uStrength\` を 0.5 と 6.0 にしてください。縁の光り方はどう変わりますか。この値は物理的には何にあたりますか。',
      hint: 'フレネルの効き方の鋭さです。',
      answer: `小さいと**全体がぼんやり均一に**光り、大きいと**縁だけが鋭く**光ります。
これは「正面から見た面と、かすめて見た面の差をどれだけ強調するか」で、
実際の大気では、かすめて見るほど空気の層を長く通るために明るくなる、という現象に対応します。
数式そのものは近似ですが、**縁だけ明るいという性質さえ再現できれば、目は納得します**。`,
    },
    {
      prompt: '大気のマテリアルから \`side: THREE.BackSide\` を外して既定（\`FrontSide\`）に戻すと、なぜ縁の光が消えるのでしょう。',
      hint: 'カメラは大気の球の外にいます。手前の面と奥の面、どちらを描いていますか。',
      answer: `\`FrontSide\` だと**手前側の面**が描かれ、それは惑星を隠す位置に来ます。
縁の光は「奥側の内壁を、惑星のへりごしに見ている」ことで成り立っているので、
\`BackSide\` にして**手前を捨て、奥だけを描く**必要があります。
あわせて \`depthWrite: false\` と加算合成にしておかないと、大気が惑星を覆い隠します。`,
    },
  ],
  quiz: [
    {
      q: '大気の殻を `side: THREE.BackSide` で描くのはなぜですか。',
      choices: [
        '惑星の輪郭のすぐ外側だけが残り、内積の大きさも「地表に張り付いて外へ薄れる」形になるから',
        '内側の面のほうが軽いから',
        'BackSide でないと AdditiveBlending が効かないから',
        '法線が反転して明るくなるから',
      ],
      answer: 0,
      explain:
        '手前側の面を描くと、青い霧が惑星の全面にかぶってしまいます。内側の面なら惑星本体に隠され、輪郭の外だけが残ります。しかも内側の面では内積の大きさが惑星の縁で最大・殻の外縁で 0 になるため、明るさの分布まで狙いどおりになります。',
    },
    {
      q: '`AdditiveBlending` を使うと、テクスチャの黒い部分はどうなりますか。',
      choices: [
        '何も足されないので、実質的に透明になる',
        '黒く塗り潰される',
        'エラーになる',
        '白く飛ぶ',
      ],
      answer: 0,
      explain:
        '足し算なので 0 を足しても下の色は変わりません。だから「光るもの」を重ねるときは、透明の指定を細かく作らなくても済みます。逆に、背景を暗くしたい煙のような表現には使えません。',
    },
    {
      q: '街の明かりを `MeshStandardMaterial` の `emissive` で出すと、うまくいかないのはなぜですか。',
      choices: [
        'emissive は光の向きを知らないので、昼側も一律に光ってしまう',
        'emissive はテクスチャを受け付けない',
        'emissive は影を落とさない',
        'emissive は半透明にできない',
      ],
      answer: 0,
      explain:
        'emissive は「自分で光っている色」なので、太陽がどちらにあるかとは無関係です。夜側だけを光らせたいなら、法線と太陽の向きの内積を自分で見る必要があります。専用の層を重ねるのがいちばん手軽な方法です。',
    },
  ],
};
