import type { Chapter } from '../types.ts';

export const chapterQ03: Chapter = {
  slug: 'q03-postprocess',
  part: 'polish',
  number: 3,
  title: 'ポストプロセス入門',
  goal: '描き上がった画面に効果をかけられるようになり、色が壊れる・輪郭がギザギザになるという定番の落とし穴を避けられるようになります。',
  requires: ['q02-color', 't11-performance'],
  threeApis: [
    'EffectComposer',
    'RenderPass',
    'OutputPass',
    'UnrealBloomPass',
    'WebGLRenderTarget',
    'WebGLRenderer.info',
    'MeshBasicMaterial',
    'CanvasTexture',
  ],
  mathRecall: [
    { slug: 'q02-color', note: '出口の変換とトーンマッピング' },
    { slug: 'p07-city-light', note: '夜の窓の明かり ― ここに効かせます' },
    { slug: 't11-performance', note: '画面全体をもう一度処理する重さ' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 描き終わった絵に、手を入れる

ここまでは「どう描くか」の話でした。**ポストプロセスは「描き終わったあとで何をするか」**です。

やり方の骨格は単純です。

- **画面ではなく、いったんテクスチャ（{{レンダーターゲット}}）に描く**
- **そのテクスチャを材料にして、画面いっぱいの板を 1 枚描く**
- 板を描くときのフラグメントシェーダで、好きな加工をする

[2-14 フラグメントシェーダ](#/ch/t14-fragment-shader)で書いたものが、そのまま使えます。
ちがうのは、**材料が「3D の面」ではなく「さっき描いた絵そのもの」**という点だけです。

この仕組みを three で扱うのが \`EffectComposer\` です。
`,
    },
    {
      kind: 'md',
      text: `
## 3点セット ― Composer / RenderPass / OutputPass

最小の構成は 3 つです。**この 3 つは必ずこの順**になります。
加工の 1 工程を{{パス}}と呼びます。

- **\`EffectComposer\`** … パスを順番に流す係
- **\`RenderPass\`** … シーンをテクスチャに描く。**必ず最初**
- **\`OutputPass\`** … トーンマッピングと sRGB への変換をする。**必ず最後**

やりたい効果（ブルームなど）は、この 2 つのあいだに挟みます。
`,
    },
    {
      kind: 'code',
      title: '最小のポストプロセス',
      code: `import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(window.innerWidth, window.innerHeight);

composer.addPass(new RenderPass(scene, camera));   // 1. シーンを描く
// ここに効果を挟む
composer.addPass(new OutputPass());                // 3. 色を仕上げる

function animate() {
  requestAnimationFrame(animate);
  composer.render();          // renderer.render(...) の代わりに、これを呼ぶ
}`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'OutputPass を忘れると、色が壊れます',
      text: `
これが第4部でいちばん多い引っかかりです。しかも**エラーは出ません。**
ただ「なんとなく白っぽい、眠い絵」になるだけなので、原因にたどり着きにくい。

[4-02](#/ch/q02-color)でやったとおり、途中の加工は**リニアのまま**やる必要があります。
だから \`RenderPass\` が描き込むテクスチャはリニアで、
**sRGB への変換とトーンマッピングは最後にまとめて 1 回**行います。
その担当が \`OutputPass\` です。

これを付けないと、リニアの数値がそのまま画面に出ます。
**4-02 で \`outputColorSpace\` を Linear にしたときと、まったく同じ見た目**になります。
`,
    },
    {
      kind: 'md',
      text: `
## 見て確かめる

次のコードには**「OutputPass あり」「なし」を切り替えるボタン**が付いています。

ブルームもかかっているので、2 つのことが同時に見えます。
**光っているものが本当に光って見えること**と、
**最後の 1 パスを外すと全体が白っぽくなること**です。
`,
    },
    {
      kind: 'sandbox',
      title: 'OutputPass を外すと、どうなるか',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.DirectionalLight(0xffffff, 2.2).translateZ(6));
scene.add(new THREE.AmbientLight(0x445577, 0.6));

// ふつうの物体（色が正しいかを見るための基準）
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 1.4, 1.4),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.4 }),
);
box.position.x = -1.5;
scene.add(box);

// 明るく光るもの（ブルームの対象）
const lamp = new THREE.Mesh(
  new THREE.SphereGeometry(0.55, 32, 20),
  // 1 を大きく超える色にしておくと、しきい値を越えて滲む
  new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.6, 2.2) }),
);
lamp.position.set(1.6, 0.4, 0);
scene.add(lamp);

/* ---- ポストプロセス ---- */

const size = new THREE.Vector2(window.innerWidth, window.innerHeight);

// MSAA を効かせたレンダーターゲット（後述）
const target = new THREE.WebGLRenderTarget(size.x, size.y, {
  type: THREE.HalfFloatType,
  samples: 4,
});

const composer = new EffectComposer(renderer, target);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(size.x, size.y);

const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(size, 0.9, 0.4, 0.85);
const outputPass = new OutputPass();

composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(outputPass);

/* ---- 切り替え ---- */

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#e8e8f2; font:12px monospace;' +
  'pointer-events:none; white-space:pre;';
document.body.appendChild(readout);

function setOutput(enabled) {
  const has = composer.passes.indexOf(outputPass) >= 0;
  if (enabled && !has) composer.addPass(outputPass);
  if (!enabled && has) composer.removePass(outputPass);
  readout.textContent =
    'OutputPass: ' + (enabled ? 'あり（正しい）' : 'なし') +
    '\\nパスの数 ' + composer.passes.length;
}

function addButton(text, left, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText =
    'position:absolute; bottom:52px; left:' + left + 'px; padding:6px 10px;' +
    'background:#12121f; color:#e8e8f2; border:1px solid #3a3a5c; border-radius:6px;' +
    'font:12px sans-serif; cursor:pointer;';
  button.addEventListener('click', onClick);
  document.body.appendChild(button);
}

addButton('OutputPass あり', 12, () => setOutput(true));
addButton('OutputPass なし', 132, () => setOutput(false));
setOutput(true);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  box.rotation.y += clock.getDelta() * 0.4;
  controls.update();
  composer.render();        // renderer.render ではなく composer.render
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '「なし」に切り替えると、水色の箱がくすんだ白っぽい色になり、背景まで持ち上がります。エラーは 1 つも出ません ― だから気づきにくいのです。`bloomPass` を消すと、`OutputPass` が無くても正しい色に戻ります（パスが 1 つだけなら、three が画面へ直接描くため）。これが「途中に何か挟んだときだけ壊れる」という、いやらしい出方の理由です。',
    },
    {
      kind: 'md',
      text: `
## {{ブルーム}} ― 明るいものを滲ませる

\`UnrealBloomPass\` の引数は 4 つですが、覚えるのは**後ろの 3 つ**だけです。

\`new UnrealBloomPass(解像度, strength, radius, threshold)\`

- **threshold（しきい値）** … **この明るさを超えたものだけ**が滲みます。**いちばん大事**
- **strength（強さ）** … 滲みの量
- **radius（半径）** … 滲みの広がり

**threshold から決めてください。** ここが低すぎると画面全体がぼんやり光り、
「なんとなく眠い絵」になります。**0.8 前後から始めて、光らせたいものだけが越えるように**調整します。

そのために、光らせたいものは **1 を超える色**にしておきます。
\`new THREE.Color(6, 4.6, 2.2)\` のような、16 進数では書けない明るさです。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ブルームは「光」ではなく「カメラの癖」',
      text: `
実際のブルームは、強い光がレンズやセンサーの中で散ることで起きます。
つまり**目に見えている現象ではなく、撮影機材の癖**です。

だから入れすぎると「頑張って加工した写真」になります。
**入れたことに気づかれないくらい**が、たいていちょうどよい量です。

夜景・ネオン・光源が画面に写る場面では効きますが、
昼の屋外に強くかけると、ただ眠い絵になります。
`,
    },
    {
      kind: 'md',
      text: `
## 落とし穴 ― antialias が効かなくなる

\`EffectComposer\` を入れた瞬間、**輪郭がギザギザになった**ことに気づくはずです。

\`new THREE.WebGLRenderer({ antialias: true })\` は
**画面に直接描くときにしか効きません。** ポストプロセスでは
いったんテクスチャに描くので、この設定は素通りされます。

打つ手は 2 つです。

- **レンダーターゲット側で MSAA を有効にする。** \`samples: 4\` を指定する（上のコードがこれ）。
  簡単で品質もよい
- **\`SMAAPass\` を足す。** 画像処理で輪郭をならす方式。古い環境でも動くが、少し眠くなる

\`type: THREE.HalfFloatType\` も併せて指定しています。
既定の 8 ビットだと**1 を超えた明るさが途中で切り捨てられ**、
ブルームのしきい値が意味を失うためです。
`,
    },
    {
      kind: 'md',
      text: `
## 夜の街にかける

[3-07](#/ch/p07-city-light)で窓に明かりを点けました。そこにブルームを足します。
**夜景はブルームがいちばん効く題材**です。

窓の明かりを 1 を超える明るさにしておくのが要点です。
そうしないと、しきい値を越えられず何も滲みません。
`,
    },
    {
      kind: 'sandbox',
      title: '夜の街にブルームをかける',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ---- ここを書き換えて試してください ---- */
const BLOOM_STRENGTH = 0.55;
const BLOOM_RADIUS = 0.45;
const BLOOM_THRESHOLD = 0.95;   // まずここを動かす

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

// 3-06 と同じ、窓のテクスチャ
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
      if (rand() > 0.55) continue;
      const level = 170 + Math.floor(rand() * 85);
      ctx.fillStyle = 'rgb(' + level + ',' + Math.floor(level * 0.85) + ',' + Math.floor(level * 0.55) + ')';
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

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f1c);
scene.fog = new THREE.Fog(0x0b0f1c, 60, 220);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 300);
camera.position.set(-48, 25, 60);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 8, 0);
controls.maxPolarAngle = Math.PI * 0.495;

scene.add(new THREE.HemisphereLight(0x3a4a7a, 0x101018, 0.5));

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: 0x23252e, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---- 建物を並べる ---- */

const windows = createWindowTexture();
const rand = makeRandom(20260730);

const buildingMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b303c,
  roughness: 0.85,
  emissive: 0xffffff,
  emissiveMap: windows,
  // 1 を超える明るさにしておく。ここがブルームのしきい値を越える
  emissiveIntensity: 1.5,
});

for (let i = 0; i < 26; i++) {
  const w = 3 + rand() * 3;
  const d = 3 + rand() * 3;
  const h = 6 + rand() * 26;

  const geometry = new THREE.BoxGeometry(w, h, d);
  // 3-06 でやった、面の実寸に合わせた UV の割り付け
  const uv = geometry.getAttribute('uv');
  const cols = (size) => Math.max(1, Math.round(size / 2.4)) / 8;
  const rows = Math.max(1, Math.round(h / 3.4)) / 8;
  const faces = [
    { u: cols(d), v: rows }, { u: cols(d), v: rows },
    null, null,
    { u: cols(w), v: rows }, { u: cols(w), v: rows },
  ];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const at = f * 4 + k;
      if (faces[f] === null) uv.setXY(at, 0.06, 0.06);
      else uv.setXY(at, uv.getX(at) * faces[f].u, uv.getY(at) * faces[f].v);
    }
  }

  const building = new THREE.Mesh(geometry, buildingMaterial);
  building.position.set((rand() - 0.5) * 60, h / 2, (rand() - 0.5) * 60);
  scene.add(building);
}

// 街灯。小さくて強いものほど、ブルームがよく効く
const lampMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.3, 1.1) });
const lampGeometry = new THREE.SphereGeometry(0.35, 16, 10);
for (let i = 0; i < 16; i++) {
  const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
  lamp.position.set((rand() - 0.5) * 60, 3.2, (rand() - 0.5) * 60);
  scene.add(lamp);
}

/* ---- ポストプロセス ---- */

const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
const target = new THREE.WebGLRenderTarget(size.x, size.y, {
  type: THREE.HalfFloatType,   // 1 を超える明るさを保つ
  samples: 4,                  // 合成すると antialias が効かないので、ここで MSAA
});

const composer = new EffectComposer(renderer, target);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(size.x, size.y);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(size, BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD));
composer.addPass(new OutputPass());

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render();
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '`BLOOM_THRESHOLD` を 0.2 にすると建物の壁まで滲みはじめ、街全体がぼんやりします。1.4 にすると街灯だけが光ります。`emissiveIntensity` を 0.8（1 未満）に下げると、窓は点いているのに**まったく滲みません** ― しきい値を越えていないからです。`samples: 4` を消すと、建物の輪郭がギザギザになるのが分かります。',
    },
    {
      kind: 'md',
      text: `
## 重さの話

[2-11 速くする](#/ch/t11-performance)で「ポストプロセスを疑え」と書きました。理由はこうです。

- **画面ぜんぶをもう一度処理する。** フル HD なら 1 パスあたり 200 万画素
- **ブルームはさらに重い。** 縮小しながら何段もぼかすので、実質 5〜6 回ぶん
- **パスが増えるほどメモリも増える。** テクスチャを 2 枚以上持ち続ける

現実的な使い方はこうです。

- **効果は 2〜3 個まで。** 足し算で重くなる
- **モバイルでは切る。** この部の最後で、品質設定として切り替えられるようにします
- **\`composer.setPixelRatio\` を抑える。** レンダラと同じく 2 で頭打ちに

そして、**入れる前と後をスクリーンショットで見比べてください。**
重さに見合う変化が無いなら、入れない判断も立派な選択です。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ほかにどんなパスがあるか',
      text: `
\`three/addons/postprocessing/\` には 20 以上のパスが入っています。よく使うものだけ挙げます。

- **\`OutlinePass\`** … 選んだ物体に輪郭線を出す。選択の表現に
- **\`SSAOPass\` / \`GTAOPass\`** … 隙間に自然な影を落とす。重いが効果は大きい
- **\`BokehPass\`** … 被写界深度。手前や奥をぼかす
- **\`SMAAPass\` / \`FXAAPass\`** … 輪郭をならす
- **\`AfterimagePass\`** … 残像。動きのあるものに

どれも「Composer に \`addPass\` する」という形は同じです。
順番だけ注意してください ― **\`OutputPass\` は必ず最後**です。
`,
    },
  ],
  quiz: [
    {
      q: '`EffectComposer` を使うとき `OutputPass` を最後に付けないと、何が起きますか。',
      choices: [
        'エラーは出ないまま、全体が白っぽく眠い色になる',
        'エラーが出て何も描かれない',
        '描画が重くなる',
        '輪郭がギザギザになる',
      ],
      answer: 0,
      explain:
        '途中の加工はリニアのまま行う必要があるため、sRGB への変換とトーンマッピングは最後に一度だけ行います。その担当が OutputPass です。付け忘れるとリニアの数値がそのまま画面に出て、`outputColorSpace` を Linear にしたときと同じ見た目になります。',
    },
    {
      q: '`UnrealBloomPass` を入れたのに何も滲みません。まず確認すべきはどれですか。',
      choices: [
        '光らせたいものの明るさが threshold を超えているか',
        'radius が小さすぎないか',
        'カメラの far が足りているか',
        'ライトの数',
      ],
      answer: 0,
      explain:
        'ブルームは「しきい値を超えた明るさ」だけを滲ませます。`emissiveIntensity` を上げるか、`new THREE.Color(6, 4.6, 2.2)` のように 1 を超える色にして、threshold を越えさせてください。逆に threshold が低すぎると画面全体がぼんやりします。',
    },
    {
      q: '`EffectComposer` を導入したら輪郭がギザギザになりました。理由はどれですか。',
      choices: [
        '`antialias: true` は画面に直接描くときにしか効かず、テクスチャへ描く経路では素通りされるから',
        'ピクセル比が下がったから',
        'トーンマッピングのせい',
        'ブルームが輪郭を削ったから',
      ],
      answer: 0,
      explain:
        'レンダーターゲットに `samples: 4` を指定して MSAA を効かせるか、`SMAAPass` を足します。あわせて `type: THREE.HalfFloatType` も指定しておくと、1 を超える明るさが保たれてブルームのしきい値が正しく働きます。',
    },
  ],
};
