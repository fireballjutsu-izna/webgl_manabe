import type { Chapter } from '../types.ts';

export const chapterY02: Chapter = {
  slug: 'y02-pmrem',
  part: 'polish',
  number: 2,
  title: '環境マップは、画像でなくてよい ― PMREM で焼く',
  goal: 'シーンから環境マップをその場で作れるようになり、$\\mathrm{PMREM}$ が何を前計算しているのかを、段の数と大きさで説明できるようになります。',
  requires: ['q01-environment', 'w17-filter', 't11-performance'],
  threeApis: [
    'PMREMGenerator',
    'PMREMGenerator.fromScene',
    'RoomEnvironment',
    'Scene.environment',
    'Texture.dispose',
  ],
  mathRecall: [
    { slug: 'w17-filter', note: 'ミップマップ ― 段を先に作っておく' },
    { slug: 'm31-reflect', note: '粗い面は、広い範囲を混ぜて映す' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 落としてこなくていい

まわりの景色そのものを光源として使う考え方を {{IBL}} と呼びます。
環境マップというと $HDR$ の画像を思い浮かべますが、**画像である必要はありません。**

three の \`PMREMGenerator\` は「**シーンを $1$ つ渡すと、それを環境マップに焼く**」道具です。

つまり、

- 板を数枚置いた部屋を組む
- 上下でグラデーションする球を置く
- 前の章で作った空をそのまま使う

どれでも環境マップになります。**素材ゼロの方針は、ここでも変えません。**

いちばん短いのは、three に同梱の \`RoomEnvironment\` を使う $3$ 行です。
`,
    },
    {
      kind: 'code',
      title: '3 行で環境マップができる',
      code: `import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();   // 生成用の一時的な資源を返す（テクスチャは残る）`,
    },
    {
      kind: 'md',
      text: `
## PMREM という名前の意味

**P**re-filtered **M**ipmapped **R**adiance **E**nvironment **M**ap ―
「**あらかじめぼかしておいた、段付きの環境マップ**」です。

なぜぼかしておくのか。**粗さのため**です。

- 粗さ $0$（鏡）… 反射の向きの**$1$ 点**だけを映す
- 粗さ $0.5$ … その向きの**まわりを広く混ぜて**映す
- 粗さ $1$ … ほぼ**全方向の平均**

粗い面のたびに何百回もサンプリングしていたら、とても間に合いません。
そこで**ぼかし具合の違う段を、先に全部作っておきます。**

[](#/ch/w17-filter)のミップマップとまったく同じ発想です。
違うのは、段の作り方が「縮小」ではなく「**その粗さで見たときの平均**」であることです。
`,
    },
    {
      kind: 'formula',
      tex: 'B \;=\; (3\,S) \times (4\,S) \times 4 \times 2\ \\text{バイト}',
      readAloud:
        '$\\mathrm{PMREM}$ が確保するテクスチャの大きさです。$S$ は環境を撮るキューブの一辺。横は $3S$、縦は $4S$（キューブの $6$ 面を十字に並べた形）で、$RGBA$ の $4$ 成分を半精度浮動小数（$2$ バイト）で持ちます。',
      worked: {
        given: '\`fromScene\` の既定は $S = 256$。段の数は $\\log_2 S$ から決まります。',
        steps: [
          { calc: '幅 : 3 x 256 = 768' },
          { calc: '高さ: 4 x 256 = 1024' },
          { calc: '768 x 1024 x 4 x 2' },
          { calc: '  = 6,291,456 バイト = 6.0 MiB' },
          { calc: '段 : log2(256) = 8 が最大' },
          { calc: '  256 → 16 まで 5 段' },
          { calc: '  + 同じ 16 四方でさらにぼかす 5 段' },
          { calc: '  合計 10 段' },
        ],
        result:
          '**$6$ メビバイトのテクスチャ $1$ 枚**で、粗さ $0$ から $1$ までの全部をまかないます。段が $16$ 四方で止まるのは、**それ以上ぼかしても違いが見えない**からです ― 粗さ $1$ は「ほぼ全方向の平均」なので、$16$ 四方でも情報が余っています。$S$ を $512$ にすると $24$ メビバイトで $4$ 倍。**鏡のように滑らかな金属を大きく写すとき以外、$256$ で足ります。**',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'PMREMGenerator は使い捨て、テクスチャは残る',
      text: `
\`pmrem.dispose()\` を呼んでも、**できた環境マップは消えません。**

\`dispose\` が返すのは**生成に使った一時的な資源**（レンダーターゲット、シェーダ）で、
\`fromScene(...).texture\` は別の持ち物です。

だから「作ったら捨てる」が正しい使い方になります。

逆に、**環境マップそのもの**を捨てるときは
\`scene.environment.dispose()\` を自分で呼びます ―
[](#/ch/w40-dispose)でやったとおり、$6$ メビバイトは黙って消えません。

**毎フレーム \`fromScene\` を呼ばないこと。** 環境が変わるとき（時刻が動くなど）だけです。
$1$ 回の生成に数十ミリ秒かかるので、毎フレームやると即座に破綻します。
`,
    },
    {
      kind: 'sandbox',
      title: '環境マップを自分で作る',
      guide: { focus: ['(B) 映り込ませるための空を、自分で組む', 'シーンを環境マップに焼く'] },
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
## 何を映すかは、作品が決める

環境マップの中身は、**まわりに何があってほしいか**で決めます。

- **室内の作品** … 白い壁、天井の四角い照明、床。\`RoomEnvironment\` がこの形です
- **屋外** … 上が空色、下が地面色のグラデーション。$2$ 色で足ります
- **夜の街** … 暗い空と、街明かりのぼんやりした帯

$3$ つめは、[](#/ch/x33-sky-fog)で作った空をそのまま使えます。
**時刻から空の色を導いているので、環境マップも時刻から導けます。**

ただし、時刻が動くたびに焼き直すのは高いので、
**数十フレームに $1$ 回**、あるいは**朝・昼・夕・夜の $4$ 枚を先に焼いて混ぜる**のが実際的です。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`fromScene\` の $S$ を $512$ にすると、テクスチャは何メビバイトになりますか。

そして、どんなときに $512$ が要りますか。`,
      hint: '面積に比例します。',
      answer: `**$24$ メビバイト。$256$ の $4$ 倍です。**

**計算**

$(3 \\times 512) \\times (4 \\times 512) \\times 4 \\times 2 = 1536 \\times 2048 \\times 8 = 25{,}165{,}824$ バイト

$= 24$ MiB

**要るのはどんなときか**

**滑らかな金属を、画面いっぱいに写すとき**です。

粗さ $0$ の面は環境マップの $1$ 点をそのまま拡大するので、
$256$ 四方の解像度がそのまま見えます。

$1000$ 画素の球に映すと、環境マップの $1$ 画素が $4$ 画素に伸びる ―
**映り込みがぼやけて見えます。**

**要らないとき**

- 粗さが $0.3$ 以上 … どうせぼかすので、元の解像度は見えません
- 金属が小さく写る … 画面上で $200$ 画素なら $256$ で十分
- 環境がグラデーションだけ … 情報量が無いので、上げても何も増えません

$3$ つめが多いです。**単色に近い環境を $512$ で焼くのは、
$24$ メビバイトを無駄にしているだけ**です。

**まず $256$ で焼いて、映り込みがぼやけて見えたら上げる。**`,
    },
    {
      prompt: `毎フレーム \`pmrem.fromScene(scene)\` を呼んだとします（環境が変わるので、と考えて）。

何が起きますか。`,
      hint: '$1$ 回の生成にかかる時間を考えてください。',
      answer: `**フレームレートが $1$ 桁まで落ちます。**

**何をしているか**

\`fromScene\` は $1$ 回で、

- シーンをキューブの $6$ 面に描く（$6$ 回の描画）
- それを $10$ 段ぶんぼかす（段ごとに複数回の描画）

合わせて**数十回の描画パス**です。数十ミリ秒かかります。

毎フレーム呼べば、それだけで $1$ フレームの予算を何倍も超えます。

**しかも、たいてい必要ありません**

環境マップが変わるのは、

- 時刻が変わったとき
- 部屋を移動したとき
- 天候が変わったとき

**どれも毎フレームではありません。**

**現実的な更新の仕方**

- **$4$ 枚を先に焼いて、混ぜる。** 朝・昼・夕・夜。$2$ 枚を \`lerp\` するのは安い
- **数十フレームに $1$ 回だけ焼き直す。** 変化がゆっくりなら気づかれません
- **変わったときだけ焼く。** いちばん素直

**「毎フレーム呼ぶもの」と「たまに呼ぶもの」を区別する** ―
[](#/ch/w40-dispose)でも同じ話が出てきました。
高い処理は、呼ぶ回数のほうを減らします。`,
    },
    {
      prompt: `$\\mathrm{PMREM}$ の段が $16$ 四方で止まるのはなぜですか。

粗さ $1$ の面のために、$1$ 四方まで作る必要はないのでしょうか。`,
      hint: '粗さ $1$ の面は、環境の何を見ていますか。',
      answer: `**$16$ 四方でも、粗さ $1$ に必要な情報より多いからです。**

**粗さ $1$ が見ているもの**

粗さが上がるほど、映すのは「反射の向きのまわり」の広い範囲になります。

粗さ $1$ では、**半球ぶんをまるごと平均**したような値です。

その平均は、環境の細かい模様をすべて潰します ―
**$16$ 四方の情報でも、まだ余っている**わけです。

**$1$ 四方まで作ると**

$1$ 四方 ＝ $1$ 画素 ＝ **全方向の平均 $1$ 色**。

これは「どちらを向いても同じ色」を意味します。
粗さ $1$ でも、上を向いた面と下を向いた面では**明るさが違う**はずなので、
潰しすぎです。

**段の数の決まり方**

three では最小の段が $2^4 = 16$（\`LOD_MIN = 4\`）で、
そこから先は**同じ $16$ 四方のまま、ぼかし具合だけ変えた段**を $5$ 枚足しています。

つまり「解像度を下げる」と「ぼかす」を**途中で切り替えて**います。

**解像度で表せる限界まで下げたら、あとはぼかしで表す** ―
$1$ 四方まで下げないのは、そのほうが正確だからです。`,
    },
  ],
  quiz: [
    {
      q: '`PMREMGenerator` が前計算しているものはどれですか。',
      choices: [
        '粗さごとの、ぼかし具合の違う段。粗い面が何百回もサンプリングせずに済むようにする',
        '反射ベクトルの表',
        'ライトの位置',
        '影の形',
      ],
      answer: 0,
      explain:
        '粗さ 0 は 1 点、粗さ 1 はほぼ全方向の平均を映します。毎回サンプリングしていては間に合わないので、ぼかし具合の違う段を先に作っておきます。ミップマップと同じ発想で、違うのは段の作り方が「縮小」ではなく「その粗さで見たときの平均」であることです。',
    },
    {
      q: '`fromScene` の既定（S = 256）で確保されるテクスチャの大きさはどれくらいですか。',
      choices: [
        '768 × 1024 の半精度 RGBA で、約 6 MiB',
        '256 × 256 で 256 KB',
        '6 面ぶんで 1.5 MiB',
        'シーンの内容によって変わる',
      ],
      answer: 0,
      explain:
        '横 3S、縦 4S にキューブの 6 面を十字に並べ、RGBA を半精度（2 バイト）で持ちます。768 × 1024 × 4 × 2 = 6,291,456 バイトです。S を 512 にすると 24 MiB で 4 倍になりますが、粗さ 0.3 以上の面や小さく写る金属では違いが見えないので、まず 256 で焼きます。',
    },
    {
      q: '`pmrem.dispose()` を呼ぶと何が消えますか。',
      choices: [
        '生成に使った一時的な資源だけ。できた環境マップのテクスチャは残る',
        '環境マップも一緒に消える',
        'シーン全体',
        '何も消えない',
      ],
      answer: 0,
      explain:
        'fromScene(...).texture は別の持ち物なので、生成器を捨てても残ります。だから「作ったら生成器は捨てる」が正しい使い方です。環境マップそのものを解放したいときは scene.environment.dispose() を自分で呼びます ― 6 MiB は黙って消えません。',
    },
  ],
};
