import type { Chapter } from '../types.ts';

export const chapterW43: Chapter = {
  slug: 'w43-instancing',
  part: 'threejs',
  number: 43,
  title: 'InstancedMesh ― 同じものを、大量に置く',
  goal: '同じ形を何千個でもドローコール 1 回で置けるようになり、動かす部分だけを更新する組み方が身につきます。',
  requires: ['w42-draw-calls', '13-random'],
  mathRecall: [
    { slug: '06-matrix', note: 'インスタンスの配置は 4x4 行列そのもの' },
    { slug: '13-random', note: '大量配置は乱数やノイズで作る' },
  ],
  threeApis: [
    'InstancedMesh',
    'InstancedMesh.setMatrixAt',
    'InstancedMesh.setColorAt',
    'InstancedMesh.count',
    'Object3D.updateMatrix',
    'Matrix4',
    'Raycaster.intersectObject',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 同じ形なら、1 回で送れる

前の章の \`mergeGeometries\` は「もう動かさないもの」向けでした。
**$1$ つずつ動かしたい**なら、\`InstancedMesh\` です。

これを{{インスタンス化}}と呼びます。考え方は単純で、**形は $1$ つ、配置だけを $N$ 個持つ**。

GPU には「このジオメトリを、この $N$ 個の行列ぶん描いて」と $1$ 回だけ言います。
あとは GPU が $N$ 回まわしてくれます ― **ドローコールは $1$ 回**です。

使い方も素直です。**個数を先に決めて作り、$1$ つずつの配置を行列で渡す。**

[](#/ch/06-matrix)でやった $4 \\times 4$ 行列が、そのまま出てきます。
`,
    },
    {
      kind: 'demo',
      id: 'instancing-compare',
      caption:
        '「描き方」を切り替えると、ドローコールの数字が跳ね上がったり $1$ に戻ったりします。**三角形の数はどちらも同じ**であることに注目してください。減っているのは命令の回数だけです。',
    },
    {
      kind: 'code',
      title: 'InstancedMesh で 1000 本の木を置く',
      code: `import * as THREE from 'three';

const geometry = new THREE.ConeGeometry(0.4, 1.6, 8);
const material = new THREE.MeshStandardMaterial({ color: 0x4a7c59 });

// 個数を先に決める。あとから増やせない
const trees = new THREE.InstancedMesh(geometry, material, 1000);

// 配置を組み立てるための使い捨てオブジェクト（ループの外に 1 つ）
const dummy = new THREE.Object3D();

for (let i = 0; i < 1000; i++) {
  dummy.position.set(
    THREE.MathUtils.randFloatSpread(80),
    0.8,
    THREE.MathUtils.randFloatSpread(80),
  );
  dummy.rotation.y = Math.random() * Math.PI * 2;
  dummy.scale.setScalar(0.8 + Math.random() * 0.5);

  dummy.updateMatrix();                // position/rotation/scale から行列を作る
  trees.setMatrixAt(i, dummy.matrix);  // i 番目の配置として登録する
}

// 途中で配置を変えたら、必ずこれを立てる
trees.instanceMatrix.needsUpdate = true;

scene.add(trees);

// 1 つずつ色を変えることもできる
trees.setColorAt(0, new THREE.Color(0xffd166));
trees.instanceColor.needsUpdate = true;

// 実際に描く数を減らせる（配列は作り直さない）
trees.count = 600;`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'needsUpdate を忘れると変化が届きません',
      text: `
setMatrixAt はメモリ上の配列を書き換えるだけです。
GPU へ送り直すには instanceMatrix.needsUpdate = true が必要です。

これを忘れても、エラーは出ません。
「配置を変えたのに、画面が動かない」という形で出ます。

色を変えたときは instanceColor.needsUpdate = true です。
別の配列なので、片方だけ立てても届きません。
`,
    },
    {
      kind: 'formula',
      tex: 'B \\;=\\; N \\times 16 \\times 4 \\;\\text{バイト}',
      readAloud:
        '配置の配列の大きさは、**個数 $N$ × 行列の要素 $16$ 個 × $1$ 個 $4$ バイト**です。$1$ インスタンスあたり $64$ バイト。毎フレーム全部を送り直すなら、その量が毎フレーム転送されます。',
      worked: {
        given:
          '草を **$10{,}000$ 本**置きます。うち**風で揺れるのは $400$ 本**だけ。全部を $1$ つの \\`InstancedMesh\\` に入れて、毎フレーム全部を更新した場合と、揺れるぶんを分けた場合を比べます。',
        steps: [
          { calc: '1 本あたり 16 x 4 = 64 バイト' },
          { calc: '全部  10,000 x 64' },
          { calc: '     = 640,000 B = 0.64 MB' },
          { calc: '60fps なら毎秒 38.4 MB', note: '0.64 x 60' },
          { calc: '分けた場合 400 x 64' },
          { calc: '     = 25,600 B = 0.026 MB' },
          { calc: '毎秒 1.54 MB' },
          { calc: '比 38.4 / 1.54 = 25 倍' },
        ],
        result:
          '**転送量が $25$ 分の $1$ になります。** ドローコールは $1$ 回から $2$ 回に増えますが（動かないぶんと動くぶん）、$1$ 回 $0.012$ ms なので**増えるのは $0.012$ ms**。対して減るのは毎秒 $36.9$ MB ぶんの書き込みと転送です。**「動くもの」と「動かないもの」を別の \\`InstancedMesh\\` に分ける** ― これが \\`InstancedMesh\\` を使うときのいちばん大事な設計です。動かないほうは**最初に $1$ 回だけ**設定して、二度と触りません。',
      },
    },
    {
      kind: 'sandbox',
      title: '動くものと、動かないものを分ける',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// false にすると、全部を 1 つに入れて毎フレーム全部を更新します
const SPLIT = true;

const STATIC_COUNT = 2400;   // 動かない草
const WINDY_COUNT = 200;     // 風で揺れる草

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.Fog(0x0a0a12, 26, 70);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 9, 26);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2, 0);

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(10, 16, 8);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x241f2e, 1.1));

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshStandardMaterial({ color: 0x1c2a24, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const bladeGeo = new THREE.ConeGeometry(0.16, 1.5, 5);
bladeGeo.translate(0, 0.75, 0);              // 根元を原点にする
const calmMat = new THREE.MeshStandardMaterial({ color: 0x4a7c59, roughness: 0.8 });
const windyMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.7 });

// 同じ配置を作るための、再現性のある乱数
function rand(i, k) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const dummy = new THREE.Object3D();
const total = STATIC_COUNT + WINDY_COUNT;

// SPLIT=false のときは 1 つにまとめる
const calm = new THREE.InstancedMesh(bladeGeo, calmMat, SPLIT ? STATIC_COUNT : total);
scene.add(calm);
const windy = SPLIT ? new THREE.InstancedMesh(bladeGeo, windyMat, WINDY_COUNT) : null;
if (windy) scene.add(windy);

function place(i) {
  const a = rand(i, 1) * Math.PI * 2;
  const r = Math.sqrt(rand(i, 2)) * 34;
  dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  dummy.scale.setScalar(0.7 + rand(i, 3) * 0.8);
}

// 動かないぶんは、最初に 1 回だけ設定して二度と触らない
for (let i = 0; i < (SPLIT ? STATIC_COUNT : total); i++) {
  place(i);
  dummy.rotation.set(0, rand(i, 4) * 6.28, 0);
  dummy.updateMatrix();
  calm.setMatrixAt(i, dummy.matrix);
}
calm.instanceMatrix.needsUpdate = true;

const readout = document.createElement('div');
readout.style.cssText =
  'position:fixed;left:12px;top:12px;padding:8px 12px;border-radius:8px;' +
  'background:rgba(10,10,18,.82);color:#e8e8f2;font:13px/1.7 monospace;' +
  'border:1px solid #3a3a5c;white-space:pre';
document.body.appendChild(readout);

const clock = new THREE.Clock();
let avg = 0;
let last = performance.now();

renderer.setAnimationLoop(() => {
  const now = performance.now();
  avg = avg === 0 ? now - last : avg * 0.92 + (now - last) * 0.08;
  last = now;

  const t = clock.getElapsedTime();

  // 揺らす。SPLIT なら 300 本ぶん、そうでなければ 4,300 本ぶん書き直す
  const target = SPLIT ? windy : calm;
  const n = SPLIT ? WINDY_COUNT : total;
  const offset = SPLIT ? STATIC_COUNT : 0;

  for (let i = 0; i < n; i++) {
    const id = i + offset;
    place(id);
    const sway = Math.sin(t * 1.8 + dummy.position.x * 0.3 + dummy.position.z * 0.2) * 0.35;
    dummy.rotation.set(sway, rand(id, 4) * 6.28, sway * 0.5);
    dummy.updateMatrix();
    target.setMatrixAt(i, dummy.matrix);
  }
  target.instanceMatrix.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);

  const written = n * 64;
  readout.textContent =
    (SPLIT ? '動くぶんだけ更新' : '全部まとめて毎フレーム更新') + '\\n' +
    '草           ' + total.toLocaleString() + ' 本\\n' +
    '毎フレーム書く ' + n.toLocaleString() + ' 本 = ' + (written / 1000).toFixed(1) + ' KB\\n' +
    '毎秒          ' + ((written * 60) / 1e6).toFixed(2) + ' MB\\n' +
    'ドローコール ' + renderer.info.render.calls + '\\n' +
    'フレーム     ' + avg.toFixed(1) + ' ms';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**黄色い草だけが揺れています。** `SPLIT` が `true` なら毎フレーム書き直すのは $200$ 本ぶん（$12.8$ KB）、`false` にすると $2{,}600$ 本ぶん（$166$ KB）― **見た目は変わらないのに $13$ 倍**です。ドローコールは $1$ 回増えるだけ。**「動くもの」と「動かないもの」を分ける**のが、この道具の使い方です。',
    },
    {
      kind: 'md',
      text: `
## 拾えるか ― instanceId

\`InstancedMesh\` は $1$ つのメッシュなので、
[](#/ch/t08-raycaster)の \`intersectObject\` はそのまま使えます。

返ってくる交点に **\`instanceId\`** が入っていて、
「$N$ 個のうち何番目に当たったか」が分かります。

ただし**費用は高い**。three は $N$ 個ぶんの行列を順に当てはめて判定するので、
[](#/ch/w33-pick-cost)の話がそのまま効きます。

$10{,}000$ 本を毎フレーム調べてはいけません。
**代役を置くか、近いものだけに絞ってください。**
`,
    },
    {
      kind: 'code',
      title: '何番目に当たったかを知る',
      code: `const hit = raycaster.intersectObject(trees, false)[0];

if (hit) {
  const id = hit.instanceId;          // 何番目のインスタンスか

  // その 1 本だけ色を変える
  trees.setColorAt(id, new THREE.Color(0xffd166));
  trees.instanceColor.needsUpdate = true;

  // その 1 本の配置を読み出す
  const m = new THREE.Matrix4();
  trees.getMatrixAt(id, m);
  const position = new THREE.Vector3().setFromMatrixPosition(m);
}

// 境界球は「全インスタンスを囲む」ものを別に持つ。
// 配置を書き換えたら、こちらも作り直す
trees.computeBoundingSphere();`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '個数は多めに作って、count で絞る',
      text: `
InstancedMesh の個数は、作るときに決めて後から増やせません。

木を植えたり切ったりするなら、上限ぶん（たとえば 2000）で作っておき、
実際に描く数を trees.count = 1340 のように動かします。

count を減らしても配列は残るので、また増やせます。
作り直しの費用がかからないぶん、はるかに軽い。

上限を超えそうなら、そのときだけ大きい配列で作り直してください。
`,
    },
    {
      kind: 'md',
      text: `
## 使い分け

ここまでで、まとめる道具が $3$ つ出そろいました。

| 道具 | 形 | 動かせるか | 個別に消せるか |
|---|---|---|---|
| ふつうの \`Mesh\` | 自由 | できる | できる |
| \`InstancedMesh\` | **同じ形 $1$ 種** | できる | \`count\` か、拡大 $0$ で隠す |
| \`mergeGeometries\` | 自由 | **できない** | できない |

**迷ったときの順**

1. 同じ形が $50$ 個以上あるか → **\`InstancedMesh\`**
2. 形はばらばらだが、二度と動かないか → **\`mergeGeometries\`**
3. どちらでもない → そのまま \`Mesh\` で置く。$50$ 個くらいなら問題になりません

**$1$ 個や $2$ 個のために \`InstancedMesh\` を使わないでください。**
コードが読みにくくなるだけで、$0.02$ ms も変わりません。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`InstancedMesh\` に $2{,}000$ 個の岩を入れ、毎フレーム全部の \`setMatrixAt\` を呼んでいます。
実際に動くのは、そのうち **$30$ 個**だけです。

1. 毎フレーム書き込んでいるバイト数はいくつですか。$60$ fps なら毎秒何 MB ですか。
2. $2$ つに分けたら、それぞれいくつになりますか。`,
      hint: '$1$ インスタンスの行列は $16$ 個の float。float は $4$ バイトです。',
      answer: `**1. $128{,}000$ B（$7.68$ MB/秒）。2. $1{,}920$ B（$0.115$ MB/秒）― $67$ 分の $1$。**

**1 ― いまの書き込み量**

$1$ インスタンスあたり

$16 \\times 4 = 64$ バイト

$2{,}000$ 個ぶん

$2{,}000 \\times 64 = 128{,}000$ バイト $= 0.128$ MB

$60$ fps なら

$0.128 \\times 60 = 7.68$ MB／秒

**$1$ 秒に $7.68$ MB を書いて、$7.68$ MB を GPU へ送っています。**
$1{,}970$ 個ぶんは、**まったく同じ値を上書きしているだけ**です。

**2 ― 分けたあと**

- 動かない $1{,}970$ 個 … **最初に $1$ 回だけ**。毎フレームは $0$ バイト
- 動く $30$ 個 … $30 \\times 64 = 1{,}920$ バイト

$1{,}920 \\times 60 = 115{,}200$ B $= 0.115$ MB／秒

$\\dfrac{7.68}{0.115} = 66.8$ ― **約 $67$ 分の $1$。**

**払う代償**

ドローコールが $1$ 回増えます（$0.012$ ms）。

$7.57$ MB／秒の書き込みと転送が消えるのに対して、$0.012$ ms。
**比べるまでもありません。**

**注意すべきこと**

$2$ つに分けると、**インスタンスの番号がずれます。**

動く岩の $5$ 番目は、元の配列では $1{,}975$ 番目かもしれません。
\`instanceId\` から元の岩を引くなら、**対応表を持っておいてください。**

**そして \`instanceMatrix.needsUpdate\` は、動かすほうにだけ立てます。**
動かないほうに毎フレーム立てると、書き込みを $0$ にした意味がなくなります
（配列全体が再送されます）。`,
      answerCode: `// 動かないぶん ― 最初に 1 回だけ
const still = new THREE.InstancedMesh(geo, mat, 1970);
for (let i = 0; i < 1970; i++) {
  dummy.updateMatrix();
  still.setMatrixAt(i, dummy.matrix);
}
still.instanceMatrix.needsUpdate = true;   // ここで 1 回だけ

// 動くぶん
const moving = new THREE.InstancedMesh(geo, mat, 30);

renderer.setAnimationLoop(() => {
  for (let i = 0; i < 30; i++) {
    dummy.updateMatrix();
    moving.setMatrixAt(i, dummy.matrix);
  }
  moving.instanceMatrix.needsUpdate = true;  // 動くほうだけ
  renderer.render(scene, camera);
});`,
    },
    {
      prompt: `木を $3$ 種類（針葉樹・広葉樹・枯れ木）、合わせて $1{,}500$ 本置きます。
色は $1$ 本ずつ少しずつ変えたい。

1. \`InstancedMesh\` はいくつ必要ですか。ドローコールは？
2. 色はどうやって変えますか。`,
      hint: '$1$ つの `InstancedMesh` が持てるジオメトリは、いくつですか。',
      answer: `**1. $3$ つ。ドローコールは $3$ 回。2. \`setColorAt()\` です。**

**1 ― なぜ $3$ つか**

\`InstancedMesh\` が持てるジオメトリは **$1$ つだけ**です。
形が $3$ 種類なら、$3$ つ作ります。

$1{,}500$ 本を種類ごとに分け、たとえば

- 針葉樹 $700$ 本 → \`InstancedMesh(coneGeo, mat, 700)\`
- 広葉樹 $600$ 本 → \`InstancedMesh(sphereGeo, mat, 600)\`
- 枯れ木 $200$ 本 → \`InstancedMesh(barkGeo, mat, 200)\`

ドローコールは **$3$ 回**。$1{,}500$ 本を $1$ 本ずつ \`Mesh\` にしたら $1{,}500$ 回です。

**$500$ 倍の差**が、$3$ 行の書き換えで手に入ります。

**2 ― 色を $1$ 本ずつ変える**

\`setColorAt(i, color)\` を使います。
マテリアルは $1$ つのままで、**インスタンスごとの色が別の配列**として渡ります。

\`instanceColor.needsUpdate = true\` を忘れずに
（\`instanceMatrix\` とは**別の配列**なので、片方だけでは届きません）。

**注意 $1$ ― 最初の一度は setColorAt が要る**

\`instanceColor\` は、**\`setColorAt\` を初めて呼んだときに作られます。**
一度も呼んでいないと \`instanceColor\` は \`null\` で、
\`instanceColor.needsUpdate\` は \`TypeError\` になります。

**注意 $2$ ― 色以外は共通**

粗さ・金属度・テクスチャはマテリアルの持ち物なので、$1$ つの \`InstancedMesh\` の中では共通です。

「この木だけつやつやにしたい」なら、**その木を別の \`InstancedMesh\` に分ける**しかありません。

**設計としては**

**「形 × マテリアル」の組み合わせの数が、そのままドローコールの数**になります。

$3$ 形 × $1$ マテリアル $= 3$ 回。
$3$ 形 × $4$ マテリアル $= 12$ 回。

**$10$〜$100$ に収まっているなら、それ以上まとめる必要はありません。**`,
      answerCode: `import * as THREE from 'three';

const kinds = [
  { geo: coneGeo, n: 700, hue: 0.33 },
  { geo: leafGeo, n: 600, hue: 0.28 },
  { geo: barkGeo, n: 200, hue: 0.09 },
];

const dummy = new THREE.Object3D();
const color = new THREE.Color();

for (const kind of kinds) {
  const mesh = new THREE.InstancedMesh(kind.geo, material, kind.n);

  for (let i = 0; i < kind.n; i++) {
    dummy.position.set(rand() * 80 - 40, 0, rand() * 80 - 40);
    dummy.rotation.y = rand() * Math.PI * 2;
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    color.setHSL(kind.hue + rand() * 0.04, 0.45, 0.3 + rand() * 0.2);
    mesh.setColorAt(i, color);       // 先に 1 度呼ぶと instanceColor が作られる
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
}`,
    },
    {
      prompt: `\`InstancedMesh\` で置いた $800$ 個の箱を、クリックで拾えるようにしました。
ところが**カメラをどこへ向けても、画面の外にあるはずの箱まで当たり判定が走ります。**
しかも配置を書き換えたあと、**まったく拾えなくなりました。**

$2$ つの原因を説明してください。`,
      hint: '`InstancedMesh` の境界球は、何を囲んでいますか。',
      answer: `**どちらも「境界球が全インスタンスをまとめて囲んでいる」ことから来ています。**

**原因 $1$ ― 画面外でも判定が走る**

\`InstancedMesh\` は、three から見れば**メッシュ $1$ つ**です。

境界球は「$800$ 個**全部**を囲む $1$ つの球」なので、
$80$ m 四方にばらまいていれば、**半径 $56$ m の巨大な球**になります。

その球はほぼ常に光線に当たるので、粗い判定で落ちません。
そのあと **$800$ 個ぶんの行列を順に当てはめて**判定します。

[](#/ch/w33-pick-cost)の $C \\approx N + \\sum T_i$ で言えば、
$N = 1$（安い）なのに $\\sum T_i$ が $800$ 個ぶん丸ごと残っている状態です。

**対処**

- **範囲で分ける** … 区画ごとに \`InstancedMesh\` を分ければ、遠い区画は境界球で落ちます
- **代役を置く** … 拾える範囲だけ、別の当たり判定用オブジェクトを用意する
- **毎フレーム飛ばさない** … クリックのときだけにする

**原因 $2$ ― 書き換えたら拾えなくなった**

**境界球が、書き換える前の配置のまま残っているからです。**

\`setMatrixAt\` で配置を動かしても、\`boundingSphere\` は自動では更新されません。
[](#/ch/w33-pick-cost)で扱った、頂点を動かしたときとまったく同じ話です。

新しい配置が古い境界球の外に出ていれば、
**粗い判定の段階で落とされて、三角形まで届きません。**

**対処**

\`mesh.computeBoundingSphere()\` を呼びます。

$800$ 個ぶんの行列を走査するので安くはありません ―
**動かしたあとに $1$ 回**であって、毎フレームではありません。

**まとめると**

\`InstancedMesh\` は「描くのは速いが、拾うのは速くない」道具です。

描画のために $1$ つにまとめたことが、
当たり判定では**粗いふるいを $1$ 枚失う**ことになっています。

**速くする工夫は、たいてい別のどこかを不便にします。**
何と引き換えたのかを、覚えておいてください。`,
      answerCode: `// 配置を書き換えたあと、1 回だけ
trees.instanceMatrix.needsUpdate = true;
trees.computeBoundingSphere();

// 拾うのは、クリックのときだけ
canvas.addEventListener('pointerdown', (event) => {
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(trees, false)[0];
  if (hit) console.log('当たったのは', hit.instanceId, '番目');
});`,
    },
  ],
  quiz: [
    {
      q: '同じ木を 1000 本置きたい。ドローコールを 1 回に抑える方法はどれですか。',
      choices: [
        '`InstancedMesh` で 1 つにまとめる',
        'ジオメトリとマテリアルを共有した Mesh を 1000 個作る',
        '`visible` を切り替える',
        'ピクセル比を下げる',
      ],
      answer: 0,
      explain:
        'ジオメトリを共有しても、メッシュが 1000 個あればドローコールは 1000 回です。共有して減るのはメモリだけ。InstancedMesh は「同じものを、違う配置で、まとめて 1 回」描く仕組みです。',
    },
    {
      q: '`setMatrixAt()` で配置を変えたのに、画面が変わりません。足りないのはどれですか。',
      choices: [
        '`instanceMatrix.needsUpdate = true`',
        '`scene.add()` のやり直し',
        '`renderer.render()` の呼び直し',
        '`material.needsUpdate = true`',
      ],
      answer: 0,
      explain:
        '`setMatrixAt` はメモリ上の配列を書き換えるだけです。GPU へ送り直すことを明示しないと反映されません。色を変えたときは `instanceColor.needsUpdate` ― 別の配列なので、片方だけでは届きません。',
    },
    {
      q: '4,000 本の草のうち、揺れるのは 300 本だけです。どう組みますか。',
      choices: [
        '動かない 3,700 本と、揺れる 300 本を別の InstancedMesh に分ける',
        '1 つにまとめて、毎フレーム 4,000 本すべてを setMatrixAt する',
        '揺れる 300 本だけ普通の Mesh にする',
        '毎フレーム InstancedMesh を作り直す',
      ],
      answer: 0,
      explain:
        '1 インスタンスは 64 バイト。4,000 本を毎フレーム書くと 60 fps で毎秒 15.4 MB ですが、300 本なら 1.15 MB です。増えるドローコールは 1 回（0.012 ms）だけ。動かないほうは最初に 1 回設定して二度と触りません。',
    },
  ],
};
