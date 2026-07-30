import type { Chapter } from '../types.ts';

export const chapterQ01: Chapter = {
  slug: 'q01-environment',
  part: 'polish',
  number: 1,
  title: '映り込みを作る ― 環境マップ',
  goal: '金属やガラスが黒くなる理由が分かり、画像を1枚も使わずに映り込み用の環境を自分で作れるようになります。',
  requires: ['p08-city-motion', 't03-material', '11-normal-light'],
  threeApis: [
    'PMREMGenerator',
    'Scene.environment',
    'Scene.background',
    'RoomEnvironment',
    'MeshStandardMaterial.envMapIntensity',
    'MeshPhysicalMaterial',
    'ShaderMaterial',
    'WebGLRenderTarget',
  ],
  mathRecall: [
    { slug: '11-normal-light', note: '反射ベクトル ― 何が映るかを決める向き' },
    { slug: 't03-material', note: '粗さと金属度。ここで宿題になっていた話' },
    { slug: 'p02-planet-surface', note: '素材は手続きで作れる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## サイトが放り出していた宿題

[2-03 見た目を決める](#/ch/t03-material)で、こう書きました。

> 金属は「まわりの景色を映すもの」です。映り込む対象（環境マップ）がない空っぽのシーンで
> 金属度を 1 にすると、金属らしくなるどころか**ただ暗くなります**。
> 金属を使うなら環境マップ（\`scene.environment\`）を用意するか、明るい背景を置いてください。

**そして、その作り方を一度も説明していませんでした。** ここで返します。

第4部は、作ったものを「見せられるもの」にする 5 章です。
その 1 つめが**映り込み**。これが入るだけで、同じモデル・同じライトでも別物になります。
`,
    },
    {
      kind: 'md',
      text: `
## 金属が黒いのは、正しい

まず、金属が黒くなるのはバグではありません。**物理的に正しい**動作です。

- **塗装や布や木**は、当たった光を**あらゆる向きに散らして**返します。だから光源さえあれば見えます
- **金属**は、当たった光をほぼ**鏡のように反射する**だけです。**映すものが無ければ、返す光も無い**

[1-11 法線とライティング](#/ch/11-normal-light)で見た反射ベクトルが、そのまま効いています。
金属の色は「その点から反射方向を見たときに、そこに何があるか」で決まります。
何も無ければ黒。当然の結果です。

つまり必要なのは**ライトではなく、まわりの景色**です。それが**環境マップ**で、
これを光源として扱う考え方を {{IBL}} と呼びます。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathbf{r} = 2(\\mathbf{n} \\cdot \\mathbf{v})\\,\\mathbf{n} - \\mathbf{v}',
      readAloud:
        '視線 v が法線 n の面で跳ね返る向き r を出す式です。1-11 でやった反射ベクトルそのもの。金属はこの r の方向にあるものを映します。環境マップは「あらゆる方向に何があるか」を引ける表なので、r を渡すだけで色が返ってきます。',
      worked: {
        given: '真上を向いた面 $\\mathbf{n} = (0,\\,1,\\,0)$ を、斜め上 $\\mathbf{v} = (0.6,\\,0.8,\\,0)$ から見たとき。',
        steps: [
          { calc: 'n . v = 0x0.6 + 1x0.8 + 0x0 = 0.8' },
          { calc: '2 x 0.8 = 1.6' },
          { calc: '1.6 x n = (0, 1.6, 0)' },
          { calc: 'v を引く : (0-0.6, 1.6-0.8, 0-0)' },
          { calc: '        = (-0.6, 0.8, 0)' },
        ],
        result: '$\\mathbf{r} = (-0.6,\\; 0.8,\\; 0)$ ― **左右が反転して、上向き**になりました。環境マップはこの向きを渡すだけで色を返してくれます。**環境マップが無ければ、この $\\mathbf{r}$ を渡す先が無い** ― 金属が黒いのは、計算が失敗しているのではなく、**引く表が無い**からです。',
      },
    },
    {
      kind: 'demo',
      id: 'envmap-compare',
      caption:
        '「映り込ませるもの」を「なし」にした瞬間、金属もガラスも黒く沈みます。これが 2-03 で言っていた状態です。粗さを上げていくと映り込みがぼやけ、金属らしさが「色」ではなく「まわりが映っていること」から来ているのが分かります。ガラスは背景を消すと真っ黒になります ― 透かす先が無いからです。',
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '金属を撮る人は、光ではなく「白い板」を置く',
      text: `
製品写真で金属を撮るとき、プロはライトを増やすのではなく、
**カメラに映らない位置に白いパネルや布**を立てます。金属に映り込ませるためです。

3D でも同じです。金属がうまくいかないときに増やすべきは、ライトではなく**まわりの環境**。
この感覚を持っておくと、迷う時間がかなり減ります。
`,
    },
    {
      kind: 'md',
      text: `
## 環境マップは「画像」でなくてよい

環境マップというと HDRI 画像（\`.hdr\`）を思い浮かべますが、
このサイトは**素材を 1 つも置かない**方針でここまで来ました。第4部でも変えません。

three には、**シーンをそのまま環境マップに焼く**仕組みがあります。

**\`PMREMGenerator.fromScene(scene)\`** ― 渡したシーンを全方位から撮って、
映り込みに使える形（粗さごとにぼかした段を持つテクスチャ）に変換してくれます。

つまり、**映り込ませたいものを three で組み立てればいい**わけです。
`,
    },
    {
      kind: 'code',
      title: '3行で環境マップができる',
      code: `const pmrem = new THREE.PMREMGenerator(renderer);

// 渡すのは「映り込ませたいシーン」。ここでは自分で組んだ空
const target = pmrem.fromScene(skyScene, 0.02);

scene.environment = target.texture;   // これで全マテリアルに映り込む

// 使い終わったら
// target.dispose();
// pmrem.dispose();`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'PMREM という名前の意味',
      text: `
Prefiltered Mipmapped Radiance Environment Map の頭文字です。長いので誰も読んでいません。

大事なのは **prefiltered（あらかじめぼかしてある）**の部分です。
粗い面はまわりの景色が**ぼやけて**映るので、粗さの段階ごとに
ぼかし具合の違う画像をあらかじめ用意しておく必要があります。
その面倒を \`fromScene()\` が全部やってくれます。

第 2 引数（\`0.02\` など）は、いちばんシャープな段にかけるぼかしの量です。
点光源をそのまま焼くとギザギザが出るので、少しだけぼかしておきます。
`,
    },
    {
      kind: 'md',
      text: `
## 2通りの環境を、どちらも素材なしで

**（A）three が持っている部屋を借りる。**
\`three/addons/environments/RoomEnvironment.js\` は、箱を並べただけの
**スタジオのような部屋**をコードで組んだシーンです。画像ではありません。
製品を見せるような、無難で上品な映り込みが欲しいときに便利です。

**（B）自分で空を組む。** 大きな球を \`BackSide\` で置き、
上が空色・下が地面色のグラデーションを[2-14](#/ch/t14-fragment-shader)のシェーダで塗り、
太陽として白い球を 1 つ置く。**たったこれだけで屋外になります。**

大事なのは、環境マップは**近くで見るものではない**ということです。
ぼかされて丸ごと映り込むだけなので、**雑でいい**。
上下の色が違って、明るい点が 1 つあれば、それらしくなります。
`,
    },
    {
      kind: 'sandbox',
      title: '環境マップを自分で作る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0.6, 5.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* ---- (B) 映り込ませるための空を、自分で組む ---- */

function createSkyScene() {
  const sky = new THREE.Scene();

  // 内側を向いた大きな球に、上下のグラデーションを塗る
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(50, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: [
        'varying vec3 vPos;',
        'void main() {',
        '  vPos = position;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}',
      ].join('\\n'),
      fragmentShader: [
        'varying vec3 vPos;',
        'void main() {',
        '  float h = normalize(vPos).y;',
        '  vec3 ground  = vec3(0.16, 0.13, 0.11);',
        '  vec3 horizon = vec3(0.78, 0.70, 0.58);',
        '  vec3 zenith  = vec3(0.20, 0.40, 0.85);',
        // 地平線をはっきり出すのが要点。のっぺりした空は映り込んでも金属に見えない
        '  vec3 c = mix(ground, horizon, smoothstep(-0.05, 0.0, h));',
        '  c = mix(c, zenith, smoothstep(0.0, 0.22, h));',
        // 1 を超える明るさにしておくと、映り込みに芯が出る
        '  gl_FragColor = vec4(c * 1.35, 1.0);',
        '}',
      ].join('\\n'),
    }),
  );
  sky.add(dome);

  // 太陽。ただの白い球でよい（ぼかされて映るので雑でよい）
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(5, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  sun.position.set(20, 24, -14);
  sky.add(sun);

  return sky;
}

/* ---- シーンを環境マップに焼く ---- */

const pmrem = new THREE.PMREMGenerator(renderer);

const roomTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);  // (A) 借りてくる
const skyTarget = pmrem.fromScene(createSkyScene(), 0.02);        // (B) 自分で組む

// environment は「映り込ませるもの」、background は「見えている背景」。別物です
scene.environment = skyTarget.texture;
scene.background = skyTarget.texture;

/* ---- 並べて見る ---- */

const geometry = new THREE.SphereGeometry(0.8, 48, 32);

const metal = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
  color: 0xffffff, metalness: 1, roughness: 0.12,
}));
metal.position.x = -1.9;
scene.add(metal);

const rough = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
  color: 0xffd8a8, metalness: 1, roughness: 0.45,   // 同じ金属でも粗いとこうなる
}));
scene.add(rough);

const glass = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({
  color: 0xffffff, metalness: 0, roughness: 0.05,
  transmission: 1,      // 透かす
  thickness: 0.9,       // ガラスの厚み。光の曲がり方に効く
  ior: 1.5,             // 屈折率。ガラスは 1.5 前後
}));
glass.position.x = 1.9;
scene.add(glass);

// 補助のライト。環境マップだけでもう十分明るいので、弱くてよい
const key = new THREE.DirectionalLight(0xffffff, 0.8);
key.position.set(3, 4, 5);
scene.add(key);

let usingSky = true;
setInterval(() => {
  usingSky = !usingSky;
  const texture = usingSky ? skyTarget.texture : roomTarget.texture;
  scene.environment = texture;
  scene.background = texture;
}, 4000);

function animate() {
  requestAnimationFrame(animate);
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
        '4 秒ごとに「自分で組んだ空」と「借りてきた部屋」が入れ替わります。同じ球なのに、まわりが変わるだけで別の材質に見えます。`scene.environment = ...` の行だけを消すと、金属もガラスも真っ黒になります（`background` は残るので、背景だけが明るいちぐはぐな絵になります）。真ん中の球は粗さ 0.45 で、同じ金属でも「くもったアルミ」になります。',
    },
    {
      kind: 'md',
      text: `
## environment と background は、別物

ここは必ず混同するところなので、はっきり分けておきます。

- **\`scene.environment\`** … **映り込ませるもの。** 目には見えない。マテリアルの計算にだけ使われる
- **\`scene.background\`** … **背景として見えるもの。** 映り込みには一切関係しない

だから、次の 4 通りが全部成立します。

- 両方セットする … 屋外にいる感じ。いちばん自然
- environment だけ … **背景は無地なのに、物にはまわりが映る。** 商品写真のような見せ方でよく使う
- background だけ … 背景はきれいなのに**金属は真っ黒**。ちぐはぐで、いちばんよくある失敗
- どちらも無し … 2-03 の状態
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'ガラスは「後ろにあるもの」を透かします',
      text: `
\`transmission: 1\` にしたのに真っ黒、という詰まり方をよくします。

ガラスは**自分の後ろにあるものを見せる**材質です。後ろが真っ黒なら、当然真っ黒なガラスになります。
背景（\`scene.background\`）を出すか、後ろに何かを置いてください。

\`thickness\` は「ガラスの厚み」で、光の曲がり具合に効きます。0 のままだと
ただの半透明な膜のように見えます。\`ior\`（屈折率）はガラスなら 1.5、水なら 1.33 あたりです。
`,
    },
    {
      kind: 'md',
      text: `
## envMapIntensity ― 強すぎるときに触る場所

環境マップを入れると、たいてい**明るくなりすぎます。**
そのときライトを弱めるより先に、**\`material.envMapIntensity\`** を触ってください。

- **1.0** … そのまま。既定値
- **0.3〜0.6** … 映り込みを抑えて、落ち着いた見た目に
- **1.5 以上** … ぎらつかせたいとき

これはマテリアルごとの設定です。**金属だけ強く、床は弱く**、といった調整ができます。

そして環境マップを入れたら、ほぼ必ず**トーンマッピング**が要ります。
明るい部分が 1 を超えて白く潰れるからです。次の章の話です。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '焼くのは1回だけ。毎フレームやらないこと',
      text: `
\`fromScene()\` は全方位を描き直す処理なので、**それなりに重い**です。
起動時に 1 回だけ呼び、あとは使い回してください。

空の色を時間で変えたい（[3-07](#/ch/p07-city-light)のような昼夜）場合でも、
毎フレーム焼き直すのは現実的ではありません。
**数秒に 1 回**焼き直すか、朝・昼・夕・夜の 4 枚を先に焼いておいて混ぜるのが実際の手です。

戻り値は \`WebGLRenderTarget\` なので、要らなくなったら \`dispose()\` を忘れずに。
\`PMREMGenerator\` 自体も \`dispose()\` します。
`,
    },
    {
      kind: 'md',
      text: `
## 第3部の作品に、そのまま効きます

[3-04 惑星ビューアー](#/ch/p04-planet-orbits)と[3-08 ローポリの街](#/ch/p08-city-motion)に、
この章の 3 行を足すとどうなるか。

- **惑星** … 海が空を映すようになります。\`roughnessMap\` で海だけつるつるにしてあったので、
  環境マップが入った瞬間に**海面だけが光を映しはじめます**
- **街** … 建物の窓ガラスやアスファルトに空が映ります。
  とくに夕方（3-07 の時刻 0.75 付近）に効きます

**すでに作ったものに 3 行足すだけで変わる**のが、仕上げの作業の面白いところです。
`,
    },
  ],
  exercises: [
    {
      prompt: '\`scene.environment\` に代入している行をコメントアウトしてください。金属の球はどうなりますか。\`scene.background\` のほうを消すと何が変わりますか。',
      hint: '2 つは名前が似ていますが、まったく別の役割です。',
      answer: `\`environment\` を消すと、**金属が真っ黒に戻ります**（映り込む先が無くなるため）。背景は残ります。
\`background\` を消すと、**背景だけが単色になり、金属の映り込みはそのまま**です。
つまり \`environment\` は「物体に映り込ませるもの」、\`background\` は「後ろに見えているもの」で、
**別々に指定できます**。スタジオの映り込みだけ借りて、背景は好きな色にする、といったことができます。`,
    },
    {
      prompt: '手続きで作った空から、地平線をはっきり出している部分をなだらかにして、上下のグラデーションだけにしてください。金属の見え方はどう変わりますか。',
      hint: '映り込みの中に、目印になる境目があるかどうかです。',
      answer: `金属が**金属に見えなくなり、ただ色の付いた球**になります。
映り込みは「まわりの景色の形」が球面に歪んで映るから金属らしいのであって、
のっぺりしたグラデーションだけだと、歪みが見えず情報がありません。
**環境マップには、はっきりした明暗の境目が要ります**。スタジオ撮影で白いパネルを立てるのと同じ理屈です。`,
    },
    {
      prompt: '\`envMapIntensity\` を 0.2 と 3.0 にしてください。ライトの強さを変えるのと、何が違いますか。',
      hint: '変わるのは、映り込みの明るさだけです。',
      answer: `\`envMapIntensity\` は**映り込みのぶんだけ**の強さで、ライトによる直接の陰影には効きません。
ライトを強くすると、てかりとハイライトが強くなります。
「金属がのっぺり明るすぎる」ときは \`envMapIntensity\` を、
「陰影のコントラストが足りない」ときはライトを触る、と使い分けます。`,
    },
  ],
  quiz: [
    {
      q: '空っぽのシーンで `metalness: 1` の球が真っ黒になります。これはなぜですか。',
      choices: [
        '金属は光を鏡のように反射するだけなので、映すものが無ければ返す光も無いから',
        'ライトの強さが足りないから',
        '`roughness` が高すぎるから',
        'トーンマッピングが効いているから',
      ],
      answer: 0,
      explain:
        'バグではなく物理的に正しい結果です。塗装や布は光をあらゆる向きに散らして返すので光源だけで見えますが、金属は反射方向にあるものを映すだけ。だから必要なのはライトではなく、まわりの景色（環境マップ）です。',
    },
    {
      q: '`scene.environment` と `scene.background` の違いはどれですか。',
      choices: [
        'environment は映り込みに使われるが目には見えず、background は背景として見えるが映り込みには関係しない',
        '同じもので、別名が用意されているだけ',
        'environment は屋外用、background は屋内用',
        'environment は静止画、background は動画にも使える',
      ],
      answer: 0,
      explain:
        '別物なので、片方だけ設定できます。「背景はきれいなのに金属が真っ黒」は background だけを設定したときの典型で、いちばんよくある失敗です。',
    },
    {
      q: '環境マップを HDRI 画像なしで用意する方法はどれですか。',
      choices: [
        '`PMREMGenerator.fromScene()` に、自分で組んだシーンを渡す',
        '`TextureLoader` で PNG を読む',
        '`CanvasTexture` をそのまま `scene.environment` に入れる',
        '環境マップは画像が必須なので、方法は無い',
      ],
      answer: 0,
      explain:
        'グラデーションを塗った大きな球と、白い球を1つ置いただけのシーンで十分それらしくなります。環境マップはぼかされて映り込むだけなので、近くで見るものではありません。three の `RoomEnvironment` も、箱を並べただけのシーンです。',
    },
  ],
};
