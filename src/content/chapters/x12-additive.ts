import type { Chapter } from '../types.ts';

export const chapterX12: Chapter = {
  slug: 'x12-additive',
  part: 'project',
  number: 12,
  title: '光を足す ― 加算ブレンドと、順番という代償',
  goal: '光るものを加算で重ねられるようになり、半透明の層が増えたときに何が順番を決めているのかを、three の中身まで下りて説明できるようになります。',
  requires: ['x11-atmosphere-rim', 't03-material', 'w12-transparent'],
  threeApis: [
    'Material.blending',
    'Material.depthWrite',
    'Material.transparent',
    'Object3D.renderOrder',
    'WebGLRenderer.toneMapping',
  ],
  mathRecall: [
    { slug: 'w12-transparent', note: '半透明は「描く順番」の問題だった' },
    { slug: 'b05-ratio', note: '$0$ から $1$ に収める、という考え方' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 足すだけの合成

前の章の大気には、$2$ 行の指定が付いていました。

- \`blending: THREE.AdditiveBlending\`
- \`depthWrite: false\`

{{加算ブレンド}}は、名前のとおりです。
**すでに画面にある色に、これから描く色を足します。**

ふつうの半透明が「混ぜる」（$\\alpha$ の比で $2$ 色の間を取る）のに対して、
加算は「重ねる」だけです。この違いから、性質が $3$ つ出てきます。
`,
    },
    {
      kind: 'formula',
      tex: 'C_{\\text{out}} \\;=\\; C_{\\text{src}} + C_{\\text{dst}}',
      readAloud:
        '出てくる色は、これから描く色と、すでにそこにある色の足し算、と読みます。$\\alpha$ も比率も出てきません。ふつうの半透明が $C_{\\text{src}}\\alpha + C_{\\text{dst}}(1-\\alpha)$ なのと見比べてください。',
      worked: {
        given:
          '夜側の、街の明かりが乗っている画素を追いかけます。数字は{{リニアワークフロー}}の値（画面に出る前の、計算のための明るさ）です。',
        steps: [
          { calc: '地表（夜側なので暗い）  : 0.02, 0.02, 0.03' },
          { calc: '街の明かりの層を足す' },
          { calc: '  色(1.0,0.82,0.55) x 強さ2.2' },
          { calc: '  = 2.20, 1.80, 1.21' },
          { calc: '合計 : 2.22, 1.82, 1.24', note: '3 つとも 1 を超えた' },
          { calc: 'そのまま画面に出すと' },
          { calc: '  1.00, 1.00, 1.00', note: '真っ白。暖色が消える' },
        ],
        result:
          '**足し算は $1$ で止まってくれません。** 画面に出せるのは $1$ までなので、$2.22$ も $1.82$ も $1.24$ も等しく $1$ になります。**$3$ つの値の差が消える**ので、オレンジ色だった街の明かりが**白い点**になります。加算を使うときは、この「差が消える」が最大の敵です。',
      },
    },
    {
      kind: 'md',
      text: `
## 加算の 3 つの性質

- **黒は、透明と同じ。** $0$ を足しても変わりません。だから
  「光るところだけ白く塗ったテクスチャ」を放り込めば、
  **透明の指定を $1$ つも書かずに、光る部分だけが乗ります**
- **暗くできない。** 足すことしかできないので、影・煙・すりガラスは作れません。
  そちらはふつうの半透明の仕事です
- **順番を選ばない。** 足し算は入れ替えても答えが同じなので、
  **どの順に描いても結果が変わりません**

$3$ つめが、この章のいちばん大事なところです。

半透明がやっかいなのは[](#/ch/w12-transparent)でやったとおり
「描く順番で結果が変わる」からでした。
**加算はその問題を持っていません。**
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '「順番を選ばない」は、設計上とても強い性質です',
      text: `
順番に依存しないということは、**並べ替えが失敗しても壊れない**ということです。

$3$ 次元の半透明は、原理的に完全な並べ替えができません
（面どうしが交差していると、正しい順番が存在しないことすらあります）。

だから、光るものを**加算にできるなら加算にする**のは、
見た目の好みではなく**壊れにくさを買っている**ことになります。

大気・街の明かり・火花・レンズフレア・光の筋 ―
これらが加算で作られているのは、そういう理由です。
`,
    },
    {
      kind: 'md',
      text: `
## 奥行きを書かせない

もう $1$ 行、\`depthWrite: false\` が必要でした。理由を正確に押さえます。

奥行きの記録（デプスバッファ）は「**この画素は、どれだけ手前まで埋まっているか**」を持っています。
不透明なものを描いたら、そこは埋まったので、後ろのものは描かなくてよい ― そのための記録です。

**半透明のものが、ここに書き込むと壊れます。**

半透明は「後ろが見える」のに、記録の上では「埋まった」ことになるからです。
結果として、**その後ろに描かれるはずだったものが、まるごと消えます。**

しかも消えるのは、模様のある部分だけではありません。
**雲のテクスチャの、雲が $1$ つもない透明な部分でも、球はそこにあります。**
だから空の部分でも記録は埋まり、後ろのものが消えます。
`,
    },
    {
      kind: 'md',
      text: `
## 誰が順番を決めているのか

「後ろに描かれるはずだったもの」と言いましたが、
**そもそも、どの層が先に描かれるのでしょう。**

three は半透明のものを**カメラから遠い順**に並べ替えます。ふつうはこれで正しく並びます。

**ところが、この惑星の層は全部が同心球です。中心が全部 $(0,0,0)$ にあります。**

並べ替えに使われるのは**物体の中心の奥行き**なので、$4$ 枚とも**まったく同じ値**になります。
つまり**遠い順に並べようがありません。**

three の並べ替えは、同点のときに次の順で決めます。

- \`renderOrder\` が違えば、それに従う
- 同じなら、中心の奥行き
- **それも同じなら、\`new THREE.Mesh(...)\` を実行した順**

**同心の層では、いちばん最後の規則で決まります。**
つまり**コードに書いた順番**が、そのまま描画順になります。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '「たまたま動いている」がいちばん多いのが、ここです',
      text: `
コードに書いた順で決まる、ということは、

**行を入れ替えただけで絵が変わる**ということです。

しかも、その入れ替えは「雲の作りかたを整理しよう」といった、
見た目と関係のない作業の途中で起きます。

**そして、加算の層だけなら何も起きません。**（足し算は順番を選ばないので）

壊れるのは、**加算でない半透明が混ざったとき**だけです。
この惑星なら、雲がそれにあたります。

**依存を消す方法は $1$ つです。\`renderOrder\` を明示すること。**

- \`lights.renderOrder = 1;\`
- \`clouds.renderOrder = 2;\`
- \`atmosphere.renderOrder = 3;\`

$3$ 行書いておけば、以後どこに何を書いても順番は動きません。
`,
    },
    {
      kind: 'sandbox',
      title: '奥行きを書くと、後ろの層が消える',
      guide: { focus: ['ここだけが違う ― depthWrite', '層を 3 枚重ねる'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const R = 1.25;
const TEX_W = 256;
const TEX_H = 128;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 0.3, 7.6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 太陽は向こう側。こちらに夜側が向くので、街の明かりが見える
const sunDirection = new THREE.Vector3(0.25, 0.2, -1).normalize();
const sun = new THREE.DirectionalLight(0xfff2e0, 3.0);
sun.position.copy(sunDirection).multiplyScalar(10);
scene.add(sun, new THREE.AmbientLight(0x22334a, 0.4));

const maps = bakeMaps();

/* ---- 層を 3 枚重ねる ---- */
// 雲を先に作っているので、three の並べ替えでも雲が先に描かれる
// （中心が同じなので「遠い順」では決まらず、作った順に落ちる）

function makePlanet(cloudDepthWrite) {
  const group = new THREE.Group();

  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 32),
    new THREE.MeshStandardMaterial({ color: 0x24405e, roughness: 0.9 }),
  ));

  /* ---- ここだけが違う ― depthWrite ---- */
  // 雲 ― ふつうの半透明。混ぜる合成なので、順番が結果を変える
  // cloudDepthWrite 以外は左右でまったく同じ
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.02, 64, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      alphaMap: maps.cloud,
      transparent: true,
      depthWrite: cloudDepthWrite,
      roughness: 1,
    }),
  ));

  // 街の明かり ― 加算。雲より内側にあるので、雲が奥行きを書くと消える
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.003, 64, 32),
    new THREE.ShaderMaterial({
      uniforms: { uLights: { value: maps.lights }, uSunDirection: { value: sunDirection } },
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
  ));

  return group;
}

[
  { x: -2.1, depthWrite: true, label: '雲が depthWrite: true ― 明かりが消える' },
  { x: 2.1, depthWrite: false, label: 'depthWrite: false ― 正しい' },
].forEach((panel, index) => {
  const planet = makePlanet(panel.depthWrite);
  planet.position.x = panel.x;
  scene.add(planet);

  const div = document.createElement('div');
  div.textContent = panel.label;
  div.style.cssText =
    'position:absolute; bottom:18px; transform:translateX(-50%);' +
    'color:#e8e8f2; font:12px sans-serif; pointer-events:none; white-space:nowrap;';
  div.style.left = (25 + index * 50) + '%';
  document.body.appendChild(div);
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---- 下ごしらえ：雲と明かりのテクスチャ（前の章のノイズ。読み飛ばして可） ---- */

function bakeMaps() {
  const cloud = newCanvas();
  const lights = newCanvas();
  for (let row = 0; row < TEX_H; row++) {
    const lat = (0.5 - row / (TEX_H - 1)) * Math.PI;
    const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
    for (let col = 0; col < TEX_W; col++) {
      const lon = (col / TEX_W - 0.5) * Math.PI * 2;
      const dx = cosLat * Math.cos(lon), dy = sinLat, dz = cosLat * Math.sin(lon);
      const at = (row * TEX_W + col) * 4;

      const n = fbm(dx * 3.4 - 40, dy * 3.4 - 40, dz * 3.4 - 40, 5, 99);
      const t = Math.min(1, Math.max(0, (n - 0.5) / 0.22));
      write(cloud.image.data, at, t * t * (3 - 2 * t) * 255);

      const town = noise3(dx * 60, dy * 60, dz * 60, 7);
      write(lights.image.data, at, town > 0.7 ? (town - 0.7) / 0.3 * 255 : 0);
    }
  }
  return { cloud: finish(cloud), lights: finish(lights) };
}

function newCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  return { canvas: canvas, ctx: ctx, image: ctx.createImageData(TEX_W, TEX_H) };
}
function write(data, at, value) {
  data[at] = value; data[at + 1] = value; data[at + 2] = value; data[at + 3] = 255;
}
function finish(target) {
  target.ctx.putImageData(target.image, 0, 0);
  return new THREE.CanvasTexture(target.canvas);
}

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
}`,
      caption:
        '左の惑星には街の明かりが $1$ つも出ません。雲の球が、**雲のない透明な場所まで含めて**奥行きを埋めてしまい、その内側にある明かりの層が全部落とされているからです。`depthWrite` の $1$ 語だけの違いです。左の雲の `alphaMap` を消して真っ白にしても、右は変わりません ― 消えているのは「濃い雲の下」ではなく「球の内側ぜんぶ」だと分かります。',
    },
    {
      kind: 'md',
      text: `
## 足しすぎたぶんを、どう畳むか

加算の最初の性質に戻ります。**足し算は $1$ で止まりません。**

計算例で見たとおり、街の明かりのところは $(2.22,\\; 1.82,\\; 1.24)$ まで行きました。
これを画面に出す段で $1$ に切り落とすと $(1,\\; 1,\\; 1)$ ―
**$3$ つの差が消えて、白い点になります。**

**切り落とす代わりに、押し込みます。** それが{{トーンマッピング}}です。

いちばん簡単な形はこれです。
`,
    },
    {
      kind: 'formula',
      tex: "C' \\;=\\; \\dfrac{C}{1 + C}",
      readAloud:
        '新しい明るさは、もとの明るさを「$1$ 足したもの」で割ったもの、と読みます。$C$ がどれだけ大きくなっても結果は $1$ を超えず、しかも大きいものほど大きいまま、という順序が保たれます。',
      worked: {
        given: 'さきほどの街の明かり $(2.20,\\; 1.80,\\; 1.21)$ を通します。',
        steps: [
          { calc: '赤 : 2.20 / (1 + 2.20) = 0.6875' },
          { calc: '緑 : 1.80 / (1 + 1.80) = 0.6434' },
          { calc: '青 : 1.21 / (1 + 1.21) = 0.5475' },
          { calc: '切り落としだと 1.00, 1.00, 1.00' },
        ],
        result:
          '**$3$ つの値の差が残りました。** 赤 $>$ 緑 $>$ 青の並びが保たれているので、街の明かりは**暖色のまま**です。$C$ をいくら大きくしても $1$ に届かない（$C = 100$ で $0.990$）ので、**どれだけ足しても白飛びしません。** three が持っている `ACESFilmicToneMapping` はもっと凝った曲線ですが、**大きいものを $1$ 未満へ押し込み、順序を保つ**という仕事は同じです。同じ色を通すと $(0.900,\\; 0.874,\\; 0.818)$ になります。',
      },
    },
    {
      kind: 'md',
      text: `
## どの曲線を選ぶか

$3$ つを並べます。同じ街の明かり $(2.20,\\; 1.80,\\; 1.21)$ を通した結果です。

| やり方 | 結果 | 見た目 |
|---|---|---|
| 切り落とす | $1.00,\\; 1.00,\\; 1.00$ | 白い点。色が消える |
| $C/(1+C)$ | $0.688,\\; 0.643,\\; 0.548$ | 暖色は残るが、全体に暗い |
| ACES | $0.900,\\; 0.874,\\; 0.818$ | 明るく、色も残る |

この作品では \`renderer.toneMapping = THREE.ACESFilmicToneMapping\` を $1$ 行入れています。

**ただし、ただではありません。**
ACES は $1$ 未満の値も動かします ― $1.0$ を入れると $0.763$ が返ります。
つまり**画面全体が少し暗く、少しコントラストが付いた**状態になります。

加算の層を持たない作品に入れると「なんとなく眠くなった」と感じることがあるのは、これが理由です。
**白飛びが起きていないなら、入れる必要はありません。**
`,
    },
  ],
  exercises: [
    {
      prompt: `大気の層の、いちばん明るい画素は $(0.078,\\; 0.382,\\; 1.134)$ でした。

これを「切り落とす」で処理すると、色はどう変わりますか。$3$ つの数字で答えてください。`,
      hint: '$1$ を超えているのはどれですか。超えていないものはどうなりますか。',
      answer: `**$(0.078,\\; 0.382,\\; 1.000)$ になります。青だけが削られます。**

**何が起きたか**

$1$ を超えているのは青だけなので、赤と緑はそのまま、青だけが $1.134 \\to 1.000$ に切られます。

比で言うと、青が**$12\\%$ 削られた**ことになります。

**見た目にどう出るか**

もとの色は「青がとても強く、緑が中くらい、赤はほぼ無い」空色でした。

青だけを削ると、**相対的に緑が強くなります。**

$0.382 / 1.134 = 0.337$ だった緑の比が、$0.382 / 1.000 = 0.382$ になります。

つまり**帯のいちばん明るいところだけ、わずかに水色寄りになります。**

**これが「白飛びしていないのに色が変わる」の正体**

真っ白に飛ぶより、こちらのほうが厄介です。

- 白飛びは**見れば分かります**
- $1$ 色だけの切り落としは、**そこだけ色相がずれます**

グラデーションの途中で色が曲がるので、
「なんとなく安っぽい」という感想になって、原因にたどり着けません。

**確かめ方**

いちばん明るい画素の値を計算してみて、
**どれか $1$ つでも $1$ を超えていたら**、トーンマッピングを検討してください。

ACES に通すと $(0.176,\\; 0.465,\\; 0.789)$ で、$3$ つとも $1$ 未満に収まります。`,
    },
    {
      prompt: `雲の層と街の明かりの層が、コードに書いた順で描かれることを確かめたい。

サンドボックスの右（正しいほう）で、**明かりの層を雲より先に作る**ように行を入れ替えると、
見た目は変わりますか。変わらないなら、それはなぜですか。`,
      hint: '$2$ つの層の合成は、それぞれ何ですか。片方は足し算です。',
      answer: `**変わりません。片方が加算だからです。**

**なぜ変わらないか**

$2$ つの層がやっていることを式にすると、こうなります。

- 雲 … $C \\leftarrow C_{\\text{雲}}\\alpha + C(1-\\alpha)$（混ぜる）
- 明かり … $C \\leftarrow C + C_{\\text{明}}$（足す）

雲を先にすると $\\;(C_{\\text{地}}\\alpha' + C_{\\text{雲}}\\alpha) + C_{\\text{明}}$

明かりを先にすると $\\;(C_{\\text{地}} + C_{\\text{明}})(1-\\alpha) + C_{\\text{雲}}\\alpha$

**厳密には同じではありません。** $2$ 番目では、明かりが雲の $\\alpha$ のぶん薄まります。

**それでもほぼ見えない理由**

明かりが乗るのは陸の、雲の薄いところです。
$\\alpha$ が小さいので $(1-\\alpha)$ はほぼ $1$ ― 差は数 $\\%$ です。

**厚い雲の下では違いが出ます。** 明かりが先なら雲に隠され、
あとなら雲を突き抜けて光ります。
**物理的に正しいのは「明かりが先」**です（雲は明かりを隠すので）。

**教訓は逆向きです**

「変わらなかった」で済ませないでください。

**この作品では気づかない程度だっただけで、依存は存在しています。**
雲を濃くした日に、突然「明かりが雲を透ける」不具合として出てきます。

だから \`renderOrder\` を明示します ―
**気づかない差は、消したのではなく、まだ見えていないだけ**です。`,
      answerCode: `// 順番を、書いた場所に依存させない
lights.renderOrder = 1;   // 明かりが先（雲に隠される）
clouds.renderOrder = 2;
atmosphere.renderOrder = 3;`,
    },
    {
      prompt: `煙を作りたくなりました。加算ブレンドで作れますか。

作れないなら、何を使いますか。`,
      hint: '煙は、後ろにあるものを明るくしますか、暗くしますか。',
      answer: `**作れません。加算は暗くできないからです。**

**理由**

煙は「後ろの景色を**隠して暗くする**」ものです。

加算は $C_{\\text{out}} = C_{\\text{src}} + C_{\\text{dst}}$ なので、
$C_{\\text{src}}$ を $0$ にしても、いちばん暗くて**もとのまま**です。

**負の色を足すことはできません。**

**使うもの**

ふつうの半透明（\`transparent: true\` ＋ $\\alpha$）です。

$C_{\\text{out}} = C_{\\text{src}}\\alpha + C_{\\text{dst}}(1-\\alpha)$

$C_{\\text{src}}$ を暗い灰色にすれば、後ろの景色は $(1-\\alpha)$ 倍に暗くなります。

**その代わり、順番の問題が戻ってきます**

半透明は混ぜる合成なので、**描く順で結果が変わります。**
煙のパーティクルを何十枚も重ねるなら、並べ替えの費用と、
交差したときの破綻を引き受けることになります。

**使い分けの目安**

| 作るもの | 合成 |
|---|---|
| 光・炎・大気・魔法の光 | 加算（順番に強い） |
| 煙・霧・すりガラス・影 | 半透明（順番に弱い） |

**「明るくするものか、暗くするものか」** で決まります。
迷ったら、**そのものが無いときより画面が明るくなるか**を考えてください。`,
    },
  ],
  quiz: [
    {
      q: '加算ブレンドが「描く順番に強い」のはなぜですか。',
      choices: [
        '足し算は入れ替えても結果が同じなので、並べ替えが失敗しても絵が変わらないから',
        '加算は奥行きの記録を無視するから',
        '加算では three が自動で並べ替えるから',
        '加算は 1 枚しか重ねられないから',
      ],
      answer: 0,
      explain:
        'ふつうの半透明は「混ぜる」ので、順番が変われば結果が変わります。加算は足すだけなので、どの順に足しても合計は同じです。3D の半透明は原理的に完全な並べ替えができないため、光るものを加算にできるなら加算にするのは、壊れにくさを買っていることになります。',
    },
    {
      q: '半透明の層に `depthWrite: true` を残すと、何が起きますか。',
      choices: [
        'その球の内側に描かれるはずだったものが、透明な部分の後ろも含めて消える',
        '半透明が不透明になる',
        '色が暗くなる',
        '奥行きの精度が上がる',
      ],
      answer: 0,
      explain:
        '奥行きの記録は「ここは埋まった」を意味します。半透明のものが書き込むと、後ろが見えるはずなのに「埋まった」ことになり、あとから描かれるものが落とされます。しかも雲が 1 つも無い透明な画素でも球はそこにあるので、記録は埋まります。消えるのは模様の下だけではありません。',
    },
    {
      q: '中心が同じ位置にある半透明の層が 4 枚あるとき、three は何を基準に描く順番を決めますか。',
      choices: [
        'renderOrder → 中心の奥行き → メッシュを作った順。中心が同じなので、実際は「作った順」で決まる',
        'カメラから遠い面から順に、画素ごとに正しく並べ替える',
        '半径の大きいものから順',
        'マテリアルの種類ごとに決まった順',
      ],
      answer: 0,
      explain:
        'three が並べ替えに使うのは物体の中心の奥行きなので、同心球ではすべて同じ値になり、並べようがありません。同点のときの最後の規則は「作った順」です。つまりコードの行の順序が描画順になります。renderOrder を明示すれば、この依存を消せます。',
    },
  ],
};
