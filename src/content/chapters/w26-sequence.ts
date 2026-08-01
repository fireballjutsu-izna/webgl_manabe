import type { Chapter } from '../types.ts';

export const chapterW26: Chapter = {
  slug: 'w26-sequence',
  part: 'threejs',
  number: 26,
  title: '複数を動かす ― 時間差と、ばらつき',
  goal: 'たくさんのものを個別に動かせるようになり、機械的に見えない動きを作れるようになります。',
  requires: ['w25-damping', 'b39-seed'],
  threeApis: [
    'Object3D.userData',
    'InstancedMesh',
    'InstancedMesh.setMatrixAt',
    'Object3D.matrix',
    'MathUtils.seededRandom',
    'Object3D.updateMatrix',
  ],
  mathRecall: [
    { slug: 'b39-seed', note: '同じ種から、同じばらつきを再現する' },
    { slug: 'b22-wave', note: '位相をずらすと、同じ式で違う動きになる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 100 本の草が、全部そろって揺れる

草を $100$ 本並べて、$\\sin$ で揺らします。

\`grass.rotation.z = Math.sin(t * 2) * 0.2\`

**全部が、寸分たがわず同じタイミングで揺れます。**

風に揺れているようには、まったく見えません。
軍隊の行進のようです。

**この「そろいすぎ」が、作ったものが安っぽく見える最大の原因**です。
そして直すのは驚くほど簡単で、**位相をずらすだけ**です。
`,
    },
    {
      kind: 'md',
      text: `
## 位相をずらす ― いちばん安い解決

$\\sin$ の中に、そのものごとに違う数を足します。

\`Math.sin(t * 2 + offset)\`

\`offset\` が違えば、同じ式でも**別のタイミング**で揺れます。

**この \`offset\` をどう決めるかが、質を分けます。**

- **添字をそのまま** … \`i * 0.5\`。規則正しい波になる。整列した並びには合う
- **位置から作る** … \`x * 0.3 + z * 0.2\`。**風が吹き抜けるように**見える。いちばん自然
- **乱数** … ばらばらに揺れる。密集した葉に合う

**位置から作るのがおすすめ**です。
隣り合ったものは似たタイミングで、遠いものは違うタイミングで揺れます。
これが「風」の見え方そのものです。
`,
    },
    {
      kind: 'formula',
      tex: '\\theta_i \\;=\\; A \\sin\\!\\bigl(\\omega t + \\mathbf{k}\\cdot\\mathbf{p}_i\\bigr)',
      readAloud:
        '$i$ 番目のものの揺れ角です。時間の項に、位置と波数ベクトルの内積を足しています。この内積が位相のずれになり、位置が違えば揺れるタイミングも違ってきます。[](#/ch/w09-geometry-edit) の波の式とまったく同じ形です。',
      worked: {
        given:
          '$\\omega = 2$、$\\mathbf{k} = (0.4,\\; 0,\\; 0.25)$ のとき、$\\mathbf{p}_A = (0,0,0)$ と $\\mathbf{p}_B = (5,0,4)$ の**位相差**と、それが**何秒ぶんのずれ**かを求めます。',
        steps: [
          { calc: 'A の位相 : 0.4x0 + 0.25x0 = 0' },
          { calc: 'B の位相 : 0.4x5 + 0.25x4' },
          { calc: '         = 2.0 + 1.0 = 3.0' },
          { calc: '位相差 = 3.0 ラジアン' },
          { calc: '秒に直す : 3.0 / omega = 3.0 / 2 = 1.5 秒' },
          { calc: '【一周ぶんの距離】2pi / |k|' },
          { calc: '  |k| = sqrt(0.16 + 0.0625) = 0.4717' },
          { calc: '  6.2832 / 0.4717 = 13.3', note: '13.3 離れると一周ずれる' },
        ],
        result:
          '**B は A より $1.5$ 秒遅れて揺れます。** そして **$13.3$ 単位離れると、ちょうど一周ぶんずれて再び同じ動きに戻ります。** ここが調整のポイントで、**$\\mathbf{k}$ が大きいと近くのものどうしでもタイミングが大きく違い、ばらばらに見えます**（風というより痙攣）。**小さすぎると全部そろってしまいます。** 「一周ぶんの距離が、シーンの大きさと同じくらい」を目安にしてください。$\\mathbf{k}$ の向きが、そのまま**風の吹く向き**になります。',
      },
    },
    {
      kind: 'sandbox',
      title: '400 本の草を、4 とおりに揺らす',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 'same' | 'index' | 'random' | 'wave' の 4 つを試してください
const MODE = 'same';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.Fog(0x0a0a12, 24, 60);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 8.5, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.4, 0);

scene.add(
  new THREE.DirectionalLight(0xffffff, 2.6).translateY(8).translateZ(6),
  new THREE.HemisphereLight(0x99bbff, 0x223311, 0.8),
);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x2a3a22, roughness: 1 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// 400 本ぶんを 1 つの InstancedMesh にまとめる（描画呼び出しは 1 回）
const COUNT = 400;
const blade = new THREE.PlaneGeometry(0.22, 1.8);
blade.translate(0, 0.9, 0);      // 根元を原点に持ってくる

const grass = new THREE.InstancedMesh(
  blade,
  new THREE.MeshStandardMaterial({ color: 0x7ec850, roughness: 0.9, side: THREE.DoubleSide }),
  COUNT,
);
scene.add(grass);

// 各本の「性格」を先に決めておく。毎フレーム作り直さない
const rand = THREE.MathUtils.seededRandom;
THREE.MathUtils.seededRandom(7);            // 種を固定

const blades = [];
for (let i = 0; i < COUNT; i++) {
  blades.push({
    x: (rand() - 0.5) * 22,
    z: (rand() - 0.5) * 16,
    yaw: rand() * Math.PI,
    scale: 0.7 + rand() * 0.6,
    phase: rand() * Math.PI * 2,            // 乱数の位相
  });
}

// 風。向きと細かさを決める波数ベクトル
const K = new THREE.Vector2(0.4, 0.25);
const OMEGA = 2.0;
const AMP = 0.28;

const dummy = new THREE.Object3D();
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();

  for (let i = 0; i < COUNT; i++) {
    const b = blades[i];

    // 位相のずらし方を切り替える
    const offset =
      MODE === 'same'   ? 0
    : MODE === 'index'  ? i * 0.4
    : MODE === 'random' ? b.phase
    :                     K.x * b.x + K.y * b.z;   // 'wave' : 位置から作る

    const lean = Math.sin(OMEGA * t + offset) * AMP;

    dummy.position.set(b.x, 0, b.z);
    dummy.rotation.set(0, b.yaw, lean);
    dummy.scale.setScalar(b.scale);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
  }
  grass.instanceMatrix.needsUpdate = true;   // 送り直す

  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**4 つとも試してください。** `same` は全部が完全に同期して、行進のように見えます。`index` は規則正しい波ですが、位置と無関係なのでばらばらに見えます。`random` は落ち着きがなく、痙攣しているようです。**`wave` だけが「風が吹き抜けている」ように見えます** ― 位置の内積で位相を作っているからです。`K` の向きを変えると、風の向きが変わります。',
    },
    {
      kind: 'md',
      text: `
## 性格は、先に決めて持たせる

上のコードで大事なのは、**\`blades\` を毎フレーム作り直していない**ことです。

$400$ 個ぶんの位置・向き・大きさ・位相を、**最初に 1 回だけ**決めて配列に入れています。

**毎フレーム乱数を呼んではいけません。**

\`Math.random()\` を描画ループの中で呼ぶと、**毎フレーム違う値**が返ります。
草が毎フレーム別の場所に飛びます。

「ばらつき」は**固定された性格**であって、毎フレーム変わるものではありません。

**そして、種を固定してください。**

[](#/ch/b39-seed)でやったとおり、種を決めれば**毎回同じ配置**になります。
これは開発中に効きます ― 「さっきのあの見た目」を再現できるからです。
`,
    },
    {
      kind: 'code',
      title: '性格を先に決める',
      code: `import * as THREE from 'three';

// 種を固定すると、リロードしても同じ配置になる
THREE.MathUtils.seededRandom(42);
const rand = THREE.MathUtils.seededRandom;

// 悪い : ループの中で作る（毎フレーム違う値になる）
// renderer.setAnimationLoop(() => {
//   mesh.position.x = Math.random() * 10;   // 毎フレーム飛ぶ
// });

// 良い : 最初に決めて、配列に持つ
const items = [];
for (let i = 0; i < 200; i++) {
  items.push({
    pos: new THREE.Vector3((rand() - 0.5) * 20, 0, (rand() - 0.5) * 20),
    phase: rand() * Math.PI * 2,
    speed: 0.8 + rand() * 0.6,        // 速さもばらけさせる
    scale: 0.7 + rand() * 0.6,
  });
}

// Object3D に持たせる手もある（数が少ないとき）
mesh.userData.phase = rand() * Math.PI * 2;

// ループでは、持っている値を読むだけ
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    meshes[i].position.y = it.pos.y + Math.sin(t * it.speed + it.phase) * 0.3;
  }
});`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '毎フレーム new すると、ゴミが溜まります',
      text: `
ループの中で new THREE.Vector3() を書くと、
毎フレーム 400 個のオブジェクトが作られ、捨てられます。

JavaScript のゴミ集めは、溜まったときにまとめて走ります。
そのとき数ミリ秒〜十数ミリ秒、処理が止まります。

症状は「たまにカクつく」。原因が分かりにくい部類です。

使い回す入れ物を外に出してください。
上のサンドボックスの dummy がまさにそれで、
400 回のループで 1 つの Object3D を使い回しています。
`,
    },
    {
      kind: 'md',
      text: `
## ずらすのは、位相だけではない

**速さもばらけさせる**と、さらに自然になります。

\`Math.sin(t * speed_i + offset_i)\`

速さが全部同じだと、時間がたつにつれて**周期的にそろってしまいます。**
位相をずらしても、$2\\pi/\\omega$ 秒ごとに全体が同じ配置に戻るからです。

速さがばらついていれば、**二度と同じ配置になりません。**

**ばらつかせる幅は控えめに。** $\\pm 20\\%$ くらい。
大きくしすぎると、遅いものと速いものが混在して落ち着きがなくなります。

**大きさと色も同じです。**
同じ緑の草が $400$ 本より、明度をわずかにばらけさせたほうが「群れ」に見えます。
`,
    },
    {
      kind: 'md',
      text: `
## 順番に始める ― ステージング

$20$ 枚のカードを表示するとき、**全部を同時に出すと安っぽく**なります。

**少しずつ時間をずらして出す**と、それだけで洗練されて見えます。
これをステージングと呼びます。

やり方は位相のずらしとほぼ同じですが、
**繰り返さない**（$1$ 回だけ）ので、進み具合を $0$〜$1$ で持ちます。
`,
    },
    {
      kind: 'code',
      title: '順番に出す',
      code: `const STAGGER = 0.06;     // 1 枚あたりの遅れ（秒）
const DURATION = 0.5;     // 1 枚が出きるまでの時間

let elapsed = 0;

function update(dt) {
  elapsed += dt;

  for (let i = 0; i < cards.length; i++) {
    // i 番目は、STAGGER * i 秒だけ遅れて始まる
    const local = elapsed - STAGGER * i;
    const t = THREE.MathUtils.clamp(local / DURATION, 0, 1);

    // イージングを掛ける
    const eased = 1 - Math.pow(1 - t, 3);        // easeOutCubic

    cards[i].position.y = THREE.MathUtils.lerp(-2, 0, eased);
    cards[i].material.opacity = eased;
  }
}

// 全部が出きる時間 = DURATION + STAGGER * (n - 1)
const total = DURATION + STAGGER * (cards.length - 1);

// 順番を変えると印象が変わる
//   中央から外へ : Math.abs(i - center) * STAGGER
//   ランダム     : shuffled[i] * STAGGER
//   距離順       : cards[i].position.distanceTo(origin) * 0.02`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ステージングの遅れは、短くする',
      text: `
1 枚あたりの遅れは 0.03 〜 0.08 秒くらいが目安です。

長くすると「待たされている」と感じます。
20 枚に 0.2 秒ずつ遅らせると、最後の 1 枚は 4 秒後 ― 明らかに遅い。

全体が出きるまでを 1 秒以内に収めてください。
枚数が多いなら、遅れを 枚数 で割って調整します。

const stagger = Math.min(0.06, 0.8 / cards.length);
`,
    },
  ],
  exercises: [
    {
      prompt: `$\\omega = 3$、$\\mathbf{k} = (0.5,\\; 0,\\; 0.3)$ で草を揺らします。
位置 $(4,\\,0,\\,6)$ の草は、原点の草より**何秒遅れて**揺れますか。
また、**風が一周ぶんずれる距離**はいくつですか。`,
      hint: '位相差を $\\omega$ で割ると秒になります。',
      answer: `**$1.267$ 秒遅れます。一周ぶんの距離は $10.77$ です。**

**位相差**

$\\mathbf{k} \\cdot \\mathbf{p} = 0.5 \\times 4 + 0.3 \\times 6 = 2.0 + 1.8 = 3.8$ ラジアン

**秒に直す**

$\\sin(\\omega t + \\phi)$ は $\\sin(\\omega(t + \\phi/\\omega))$ と書けるので、
遅れは $\\phi / \\omega$。

$3.8 / 3 = 1.267$ 秒

**一周ぶんの距離**

$|\\mathbf{k}| = \\sqrt{0.5^2 + 0.3^2} = \\sqrt{0.34} = 0.583$

$\\lambda = \\dfrac{2\\pi}{|\\mathbf{k}|} = \\dfrac{6.2832}{0.583} = 10.77$

**$10.77$ 単位離れると、ちょうど一周ぶんずれて再び同じ動きに戻ります。**

**この値の使い方**

$\\lambda$ が**シーンの大きさと同じくらい**になるように $\\mathbf{k}$ を選びます。

- **$\\lambda$ が小さすぎる**（$\\mathbf{k}$ が大きい）… 隣どうしでタイミングが大きく違う。
  風ではなく**痙攣**に見えます
- **$\\lambda$ が大きすぎる**（$\\mathbf{k}$ が小さい）… 全部そろってしまう

$20 \\times 20$ の草原なら、$\\lambda = 10$〜$20$ くらい ―
つまり **$|\\mathbf{k}| = 0.3$〜$0.6$** が妥当な範囲です。

**風の向きは $\\mathbf{k}$ の向き**です。
$(0.5, 0, 0.3)$ なら、$x$ 方向に強めの斜めの風。
時間とともに $\\mathbf{k}$ を回すと、風向きが変わる演出になります。

**この式は[](#/ch/w09-geometry-edit)の波とまったく同じ**です。
水面も草原も、同じ道具で作れます。`,
      answerCode: `import * as THREE from 'three';

// 風。シーンの大きさから波長を決める
const SCENE_SIZE = 20;
const WAVELENGTH = SCENE_SIZE * 0.7;              // 14
const kLen = (Math.PI * 2) / WAVELENGTH;          // 0.449

let windAngle = 0.6;                              // 風向き（ラジアン）
const K = new THREE.Vector2();

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();

  windAngle += 0.05 * dt;                         // 風向きがゆっくり変わる
  K.set(Math.cos(windAngle), Math.sin(windAngle)).multiplyScalar(kLen);

  for (const b of blades) {
    const phase = K.x * b.x + K.y * b.z;
    b.lean = Math.sin(3 * t + phase) * 0.28;
  }
});`,
    },
    {
      prompt: `草を揺らすコードで、位相を \`Math.random() * Math.PI * 2\` と
**描画ループの中で**計算してしまいました。何が起きますか。`,
      hint: '`Math.random()` は呼ぶたびに違う値を返します。',
      answer: `**草が毎フレーム、まったく違う角度に飛びます。**

$\\sin$ の中身が毎フレームでたらめになるので、
揺れではなく**ノイズ**になります。$400$ 本が毎秒 $60$ 回、ランダムに震える。

**「ばらつき」は固定された性格です。**

「この草は、あの草より少し遅れて揺れる」という**関係**が、
草の個性です。毎フレーム変わってしまえば、関係が存在しません。

**だから性格は、最初に 1 回だけ決めて持たせます。**

配列に持つか、\`mesh.userData\` に入れるか。どちらでも構いません。

**もう 1 つ、深刻な問題があります。**

**種が固定されていないと、リロードのたびに配置が変わります。**

開発中はこれが厄介です。
「さっきの見た目が良かった」と思っても、**二度と再現できません。**

[](#/ch/b39-seed)でやったとおり、種を固定してください。

\`THREE.MathUtils.seededRandom(42)\` としてから \`seededRandom()\` を呼べば、
**毎回まったく同じ配置**になります。

種を変えれば別の配置が得られるので、**「良い種を探す」**という作り方ができます。
これは第4部の作品づくりで実際にやります。

**さらに、性能の問題もあります。**

ループの中で \`new THREE.Vector3()\` を書くのも同じ型の間違いです。
毎フレーム $400$ 個のオブジェクトが作られて捨てられ、
**ゴミ集めが走るたびに数ミリ秒止まります。**

使い回す入れ物を、ループの外に出してください。`,
    },
    {
      prompt: `カードを **$30$ 枚**、順番に表示したい。
$1$ 枚あたりの遅れを $0.15$ 秒、$1$ 枚が出きるのに $0.5$ 秒かかるとき、
**全部が出きるまで何秒**かかりますか。それは適切ですか。`,
      hint: '最後の 1 枚は、いつ始まっていつ終わりますか。',
      answer: `**$4.85$ 秒。長すぎます。**

**計算**

最後（$30$ 枚目、添字 $29$）が始まるのは $0.15 \\times 29 = 4.35$ 秒後。
そこから $0.5$ 秒かけて出るので、終わるのは $4.85$ 秒後。

$\\text{全体} = \\text{DURATION} + \\text{STAGGER} \\times (n - 1)$

**なぜ長すぎるのか**

$5$ 秒近く待たされます。**ユーザーは「遅い」と感じます。**

演出は、**気づかれない程度に効いているのが理想**です。
「演出を見せられている」と意識された時点で、たいてい長すぎます。

**目安 ― 全体を $1$ 秒以内に**

$30$ 枚を $1$ 秒に収めるには、

$1.0 = 0.5 + \\text{STAGGER} \\times 29$

$\\text{STAGGER} = 0.5 / 29 = 0.017$ 秒

**枚数に応じて自動で決めるのが確実です。**

\`const stagger = Math.min(0.06, 0.5 / (n - 1))\`

$10$ 枚なら $0.055$ 秒（$1$ 枚ずつ見える）、
$30$ 枚なら $0.017$ 秒（波のように流れる）。

**もう一段いい手 ― 順番を工夫する**

添字順に出すのが常に最善とは限りません。

- **中央から外へ** … $|i - \\text{center}| \\times \\text{stagger}$。
  遅れの最大値が**半分**になるので、同じ印象で $2$ 倍速く終わります
- **距離順** … 視点に近いものから。自然に見えます
- **ランダム** … 順番を感じさせない。数が多いときに向きます

**$30$ 枚なら、中央から外へがおすすめ**です。
遅れの最大が $15$ ステップぶんになるので、$\\text{stagger} = 0.033$ でも $1$ 秒に収まります。`,
      answerCode: `import * as THREE from 'three';

const n = cards.length;
const DURATION = 0.5;

// 全体を 1 秒以内に収める
const stagger = Math.min(0.06, 0.5 / Math.max(n - 1, 1));

// 中央から外へ。遅れの最大が半分になる
const center = (n - 1) / 2;

function update(dt) {
  elapsed += dt;

  for (let i = 0; i < n; i++) {
    const delay = Math.abs(i - center) * stagger * 2;
    const local = elapsed - delay;
    const t = THREE.MathUtils.clamp(local / DURATION, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);          // easeOutCubic

    cards[i].position.y = THREE.MathUtils.lerp(-2, 0, eased);
    cards[i].material.opacity = eased;
  }
}`,
    },
  ],
  quiz: [
    {
      q: '$100$ 本の草が全部そろって揺れて不自然です。いちばん自然に見えるずらし方はどれですか。',
      choices: [
        '位置と波数ベクトルの内積を位相に足す（風が吹き抜けるように見える）',
        '添字に比例した値を足す',
        '毎フレーム乱数を足す',
        '揺れの振幅をばらけさせる',
      ],
      answer: 0,
      explain:
        '隣り合ったものは似たタイミング、遠いものは違うタイミングで揺れます。これが風の見え方そのものです。$\\mathbf{k}$ の向きが風向き、$2\\pi/|\\mathbf{k}|$ が一周ぶんの距離になります。',
    },
    {
      q: '描画ループの中で `Math.random()` を呼んで位相にすると、何が起きますか。',
      choices: [
        '毎フレーム違う値になるので、揺れではなくノイズになる',
        '少しずつ位相がずれていく',
        '性能が上がる',
        '何も変わらない',
      ],
      answer: 0,
      explain:
        '「ばらつき」は固定された性格であって、毎フレーム変わるものではありません。最初に 1 回だけ決めて配列や userData に持たせます。種を固定すれば、リロードしても同じ配置を再現できます。',
    },
    {
      q: '$30$ 枚のカードを順番に出すとき、全体を何秒に収めるのが目安ですか。',
      choices: [
        '1 秒以内',
        '5 秒くらい',
        '10 秒くらい',
        '長いほど丁寧に見えるので制限しない',
      ],
      answer: 0,
      explain:
        '演出は「気づかれない程度に効いている」のが理想です。意識された時点でたいてい長すぎます。枚数に応じて `Math.min(0.06, 0.5 / (n-1))` のように自動で決め、中央から外へ出すと遅れの最大が半分になります。',
    },
  ],
};
