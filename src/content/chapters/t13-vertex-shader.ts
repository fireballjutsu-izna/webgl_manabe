import type { Chapter } from '../types.ts';

export const chapterT13: Chapter = {
  slug: 't13-vertex-shader',
  part: 'threejs',
  number: 13,
  title: '頂点シェーダ ― 形を動かす',
  goal: 'gl_Position の 1 行の意味が読めるようになり、頂点を動かして波・膨張・ねじれを自分で作れるようになります。',
  requires: ['t12-shader-intro', '05-trig'],
  threeApis: ['ShaderMaterial', 'BufferGeometry', 'Matrix4', 'Clock', 'BufferAttribute'],
  mathRecall: [
    { slug: '05-trig', note: 'sin と cos が波とねじれを作る' },
    { slug: '06-matrix', note: '頂点にかかる行列は右から順に効く' },
    { slug: '04-cross', note: '動かした面の法線は外積で取り直す' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## この1行を分解する

頂点シェーダの定型は、いつもこれでした。

\`gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\`

[1-06 行列と変換](#/ch/06-matrix)でやったとおり、**行列は右から効きます**。
つまりこの 1 行は、右から順にこう読みます。

1. \`vec4(position, 1.0)\` … その頂点の**ローカル座標**（[1-09](#/ch/09-hierarchy)）。
   4 つ目の 1.0 は{{同次座標}}です
2. \`modelViewMatrix\` を掛ける … 物体をシーンの中に置き、さらに
   **カメラを原点とする座標系へ移す**（この座標系をビュー空間と呼びます）
3. \`projectionMatrix\` を掛ける … 視錐台を潰して画面の座標へ（[1-10](#/ch/10-camera)）

**この途中に割り込んで position を書き換えれば、形が変わります。**
それが頂点シェーダでできることのすべてです。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'どの段階で動かすかで意味が変わります',
      text: `
\`position\` を書き換えると**物体といっしょに回る**動き（物体のローカルな変形）になります。
\`modelViewMatrix\` を掛けたあとで動かすと、**カメラから見た向き**を基準にした動きになります。

草を風で揺らすなら前者、常にカメラを向く板（ビルボード）を作るなら後者です。
`,
    },
    {
      kind: 'md',
      text: `
## 波打たせる

いちばん分かりやすい例が波です。[1-05 三角関数](#/ch/05-trig)でやった
\`sin\` を、**位置と時間から作って高さに足す**だけです。

第1部の \`wave-grid\` デモを JavaScript で書いたときは、
毎フレーム CPU で全頂点を計算し、GPU へ送り直していました。
シェーダでやれば、**送るのは時間の数値ひとつ**です。頂点が 10 万個あっても変わりません。
`,
    },
    {
      kind: 'formula',
      tex: 'y\' = y + A\\,\\sin(k\\,x + \\omega t)',
      readAloud:
        '新しい高さは、もとの高さに波を足したものです。A が波の高さ、k が細かさ、ω が進む速さ。第1部の第5章で出てきた式と、まったく同じものです。',
    },
    {
      kind: 'sandbox',
      title: '球を波打たせる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uAmount: { value: 0.25 },   // 揺れの大きさ
    uFrequency: { value: 6.0 }, // 波の細かさ
  },
  vertexShader: \`
    uniform float uTime;
    uniform float uAmount;
    uniform float uFrequency;

    varying vec3 vNormal;
    varying float vBulge;

    void main() {
      // 法線の向きに、うねりの量だけ膨らませる
      // normal は長さ1なので、掛けた量がそのまま膨らみの厚みになる
      float bulge = sin(position.y * uFrequency + uTime * 2.0)
                  * cos(position.x * uFrequency * 0.7 - uTime * 1.3)
                  * uAmount;

      vec3 moved = position + normal * bulge;

      vBulge = bulge;
      vNormal = normal;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(moved, 1.0);
    }
  \`,
  fragmentShader: \`
    varying vec3 vNormal;
    varying float vBulge;

    void main() {
      // 膨らんでいるところを明るく（本物の陰影は次の章で作ります）
      float t = vBulge * 2.0 + 0.5;
      vec3 cool = vec3(0.10, 0.28, 0.52);
      vec3 warm = vec3(0.55, 0.90, 1.00);
      gl_FragColor = vec4(mix(cool, warm, clamp(t, 0.0, 1.0)), 1.0);
    }
  \`,
});

// 分割数が粗いと波もカクカクになる。ここを 16, 12 にすると一目瞭然
const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.3, 128, 96), material);
scene.add(mesh);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  material.uniforms.uTime.value = clock.getElapsedTime();
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
        '`uAmount` を 0.8 にすると激しく波打ちます。`SphereGeometry(1.3, 128, 96)` を `(1.3, 16, 12)` にすると、頂点が足りずに波がカクカクになります ― **頂点シェーダは頂点を増やせません**。',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '頂点シェーダは頂点を増やせません',
      text: `
動かせるのは、**すでにある頂点だけ**です。
粗いジオメトリをなめらかに波打たせることはできません。

だから頂点を動かす表現では、**あらかじめ分割数を上げておく**必要があります。
これは [2-11 速くする](#/ch/t11-performance) の「分割数は下げよう」と正面から衝突します。
**動かす面だけ分割を上げる**のが落としどころです。
`,
    },
    {
      kind: 'md',
      text: `
## ねじる ― 行列を自分で書く

高さに応じて回転量を変えると、ねじれます。
ここで [1-05 三角関数](#/ch/05-trig) と [1-06 行列](#/ch/06-matrix) が同時に効いてきます。

y 軸まわりの回転は、x と z の 2 成分だけを混ぜ合わせる操作でした。
GLSL では \`mat2\` を作って掛けるのがいちばん短く書けます。
`,
    },
    {
      kind: 'formula',
      tex: '\\begin{pmatrix} x\' \\\\ z\' \\end{pmatrix} = \\begin{pmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{pmatrix} \\begin{pmatrix} x \\\\ z \\end{pmatrix}',
      readAloud:
        '平面の中で角度 θ だけ回す行列です。第1部の第6章で見た回転行列の、2 次元版そのものです。y はそのままなので、y 軸まわりの回転になります。',
    },
    {
      kind: 'sandbox',
      title: 'ねじる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(3, 1.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(3, 4, 4);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.6));

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uTwist: { value: 1.2 },   // ねじれの強さ
  },
  vertexShader: \`
    uniform float uTime;
    uniform float uTwist;
    varying vec3 vNormal;

    // 平面の中で角度 angle だけ回す行列（第1部 第6章の 2 次元版）
    mat2 rotate2d(float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return mat2(c, -s, s, c);
    }

    void main() {
      // 高さに応じて回転量を変えると、ねじれになる
      float angle = position.y * uTwist + sin(uTime) * 0.6;
      mat2 rotation = rotate2d(angle);

      vec3 twisted = position;
      twisted.xz = rotation * position.xz;   // y はそのまま、x と z だけ回す

      // 法線も同じだけ回さないと、光の当たり方が形についてこない
      vec3 rotatedNormal = normal;
      rotatedNormal.xz = rotation * normal.xz;
      vNormal = normalize(rotatedNormal);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(twisted, 1.0);
    }
  \`,
  fragmentShader: \`
    varying vec3 vNormal;

    void main() {
      // 仮の陰影。法線と決め打ちの光の向きの内積（第1部 第3章）
      vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
      float brightness = max(dot(normalize(vNormal), lightDir), 0.0);

      vec3 base = vec3(1.0, 0.82, 0.40);
      gl_FragColor = vec4(base * (0.25 + brightness * 0.9), 1.0);
    }
  \`,
});

const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3, 1.2, 24, 96, 24), material);
scene.add(mesh);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  material.uniforms.uTime.value = clock.getElapsedTime();
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
        '`BoxGeometry` の分割数（24, 96, 24）を（1, 1, 1）にすると、角の 8 頂点しか無いのでねじれずに歪むだけになります。法線を回している行を消すと、光が形についてこなくなります。',
    },
    {
      kind: 'md',
      text: `
## 動かした形の法線は、ずれる

これが頂点を動かすときの**いちばん厄介な問題**です。

\`normal\` はもとの形の向きを表しています。頂点を動かしても、
**法線は自動では更新されません**。すると光の当たり方が形と食い違い、
「動いているのに陰影が動かない」という妙な見た目になります。

直し方は 3 つあります。

- **同じ変換を法線にもかける** … ねじれや回転ならこれで足ります（上のサンドボックスの方法）
- **近くの点をもう 2 つ計算して、外積で取り直す** … [1-04 外積](#/ch/04-cross)そのものです。
  正確ですが、頂点シェーダの計算が 3 倍になります
- **気にしない** … 揺れが小さいなら、意外と見た目に出ません

実務では 1 番目か 3 番目で済ませることが多いです。
`,
    },
    {
      kind: 'code',
      title: '外積で法線を取り直す',
      code: `// 「もとの形」を返す関数を1つ用意しておく
vec3 displaced(vec3 p) {
  float lift = sin(p.x * 4.0 + uTime) * 0.2;
  return p + vec3(0.0, lift, 0.0);
}

void main() {
  vec3 here = displaced(position);

  // ほんの少しずらした2点も同じ関数に通す
  float e = 0.01;
  vec3 dx = displaced(position + vec3(e, 0.0, 0.0)) - here;
  vec3 dz = displaced(position + vec3(0.0, 0.0, e)) - here;

  // 2辺の外積が、動かしたあとの面の法線（第1部 第4章）
  vNormal = normalize(cross(dz, dx));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(here, 1.0);
}`,
    },
    {
      kind: 'md',
      text: `
## 頂点シェーダの使いどころ

- **風・波・呼吸** … 草木の揺れ、水面、旗、生き物のふくらみ
- **ビルボード** … 常にカメラを向く板。草や粒子の表現で多用します
- **形状モーフ** … 2 つの形を \`mix\` で行き来する（[1-08 補間](#/ch/08-interp)）
- **大量配置の微調整** … [2-11](#/ch/t11-performance) のインスタンスに、
  頂点シェーダで個体差を付ける

共通しているのは、**JavaScript 側で何もせずに済む**ことです。
uniform に時間を 1 つ渡すだけで、何万頂点が動きます。
`,
      },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Raycaster は動かした形を知りません',
      text: `
頂点シェーダで動かした形は、**GPU の中だけの話**です。
JavaScript 側のジオメトリは元のままなので、[2-08](#/ch/t08-raycaster) の当たり判定は
**波打つ前の形**に対して行われます。

同じ変形を CPU 側でも計算するか、当たり判定用に単純な形を別に置いてください。
`,
    },
  ],
  quiz: [
    {
      q: '`gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);` で、最初に効く（いちばん右の）ものはどれですか。',
      choices: [
        '`vec4(position, 1.0)`（その頂点のローカル座標）',
        '`projectionMatrix`',
        '`modelViewMatrix`',
        '順番は関係ない',
      ],
      answer: 0,
      explain:
        '行列は右から効きます。ローカル座標にまず modelViewMatrix がかかってカメラ基準の座標になり、最後に projectionMatrix で画面の座標になります。',
    },
    {
      q: '粗い分割の板を、頂点シェーダでなめらかに波打たせようとするとどうなりますか。',
      choices: [
        '頂点が足りず、カクカクした折れ線状の波にしかならない',
        '自動的に頂点が増えてなめらかになる',
        'エラーになる',
        '見た目は変わらない',
      ],
      answer: 0,
      explain:
        '頂点シェーダは既にある頂点を動かすだけで、増やすことはできません。動かす面はあらかじめ分割を上げておく必要があります。',
    },
    {
      q: '頂点を動かしたのに、陰影が形についてきません。原因はどれですか。',
      choices: [
        '法線がもとの形のままで、更新されていない',
        'ライトが足りない',
        'uniform が届いていない',
        'カメラの near が小さい',
      ],
      answer: 0,
      explain:
        '`normal` はもとの形の向きです。同じ変換を法線にもかけるか、少しずらした点との外積で取り直す必要があります。',
    },
  ],
};
