import type { Chapter } from '../types.ts';

export const chapterX24: Chapter = {
  slug: 'x24-eye-level',
  part: 'project',
  number: 24,
  title: '目線を下ろす ― 地図では分からないこと',
  goal: '真上からの確認では見つからない問題を、目線の高さで洗い出せるようになり、世界を広げずに広く見せる手を使えるようになります。',
  requires: ['x23-roads', 'w28-camera-move', 'm26-perspective'],
  threeApis: ['Fog', 'Scene.fog', 'OrbitControls.maxPolarAngle', 'PerspectiveCamera.fov'],
  mathRecall: [
    { slug: 'm26-perspective', note: '距離 $z$ で写る高さは $2z\\tan(\\mathrm{fov}/2)$' },
    { slug: 'b23-atan2', note: '高さと距離から、見上げる角度を出す' },
    { slug: 'w04-blank-screen', note: 'far の外は写らない。フォグの終わりも同じ考え方' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 真上からは、地図しか分からない

ここまで $3$ 章、ずっと真上から見てきました。
街区の数も、道路率も、大小の混ざりも、真上からなら数えられます。

**それでも、真上からは絶対に分からないことがあります。**

- **道路の幅は、歩ける広さか。** 上から見て良さそうでも、目線では狭すぎることがよくあります
- **街の外周はどうするか。** 何もしないと、世界の果てが見えます
- **地面は $1$ 枚の板か。** 下から覗けば、すぐにばれます

$3$ つとも「そこに立ったとき」にしか出てきません。
だから、建物を建てる前に**一度カメラを下ろします。**
`,
    },
    {
      kind: 'md',
      text: `
## 道幅を、角度で確かめる

道路の幅 $3.2$ が広いのか狭いのかは、数字だけでは決まりません。
**そこに立ったときの見え方**で決まります。

道の真ん中に立って向かいの建物を見上げる角度は、
建物の高さと道幅から出ます。$\\arctan$ ひとつです。
`,
    },
    {
      kind: 'formula',
      tex: 'z \\;\\ge\\; \\dfrac{h - h_{\\text{目}}}{\\tan(\\mathrm{fov}/2)}',
      readAloud:
        '高さ $h$ のものを画面に収めるには、目の高さとの差を、画角の半分のタンジェントで割った距離まで下がる必要がある、と読みます。$m26$ の「距離 $z$ で写る高さ」を、$z$ について解いただけです。',
      worked: {
        given: 'このサンドボックスの設定（画角 $55$ 度、カメラの高さ $6.5$）で、建物の高さごとに必要な距離を出します。',
        steps: [
          { calc: 'tan(55/2 度) = tan(27.5 度) = 0.5206' },
          { calc: '高さ 12 : (12 - 6.5) / 0.5206 = 10.6' },
          { calc: '高さ 20 : (20 - 6.5) / 0.5206 = 25.9' },
          { calc: '高さ 30 : (30 - 6.5) / 0.5206 = 45.1' },
          { calc: '道幅は 3.2 しかない' },
          { calc: '3.2 では、高さ 8.2 までしか収まらない' },
        ],
        result:
          '**道の反対側から見上げても、高さ $8.2$ を超える建物は画面に収まりません。** つまりこの街で高層ビルを建てると、目線では**上が切れた壁**にしか見えません。それが悪いわけではなく ― 実際の都市の路地も同じです ― **「そう見える」と知ったうえで建てるかどうか**です。俯瞰で見せる作品なら $30$ の建物を建ててよく、目線で歩く作品なら $8$ 前後に抑えるか、道幅を広げることになります。',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '世界を広げるより、見えなくするほうが安い',
      text: `
街は $120 \\times 120$ しかありません。
目線を下ろすと、端がぶつりと途切れて**世界の果て**が見えます。

素直な直し方は「街を広げる」ですが、
$4$ 倍の広さにすれば街区も建物も $4$ 倍で、生成も描画も $4$ 倍になります。

**{{フォグ}}なら $1$ 行です。**

\`scene.fog = new THREE.Fog(0x161a26, 40, 190)\`

距離 $40$ から霞みはじめ、$190$ で完全に背景色に溶けます。
街の対角は $60\\sqrt{2} = 84.9$ なので、
**いちばん遠い角でもまだ霞の途中** ― 「この先も続いているが見えない」という顔になります。

背景色と霧の色を**同じにする**のが要点です。違う色にすると、
霧の終わりに輪郭が出て、かえって果てがはっきりします。
`,
    },
    {
      kind: 'md',
      text: `
## 地面の下へ、回り込ませない

もう $1$ つ、$1$ 行で塞げる穴があります。

\`controls.maxPolarAngle = Math.PI * 0.495\`

これを入れないと、視点を下へ回して**地面の裏側**が見えます。
そこにあるのは板 $1$ 枚の裏で、街が薄っぺらい板の上に乗っていることが一目でばれます。

$0.495\\pi$ は $89.1$ 度 ― **水平よりわずかに上**で止まります。
ちょうど $90$ 度（$0.5\\pi$）にすると、真横から見たときに地面が線に潰れて、
$1$ フレームだけ画面が割れたように見えることがあります。

**「見せない」で済むものを、作り込まない。**
床の裏を作るより、回り込めなくするほうが安く、確実です。
`,
    },
    {
      kind: 'sandbox',
      title: '目線の高さから見る（まだ建物はありません）',
      guide: { focus: ['目線のカメラと、フォグ'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CITY = 120;
const ROAD = 3.2;
const MIN_LOT = 9;
const SIDEWALK = 0.9;   // 街区のふちに残す歩道の幅

/* ---- 前の 3 章で作ったもの（決め打ちの乱数と、土地の分割） ---- */

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

function splitLots(rect, rand, out) {
  const canSplitX = rect.w > MIN_LOT * 2 + ROAD;
  const canSplitZ = rect.d > MIN_LOT * 2 + ROAD;
  if (!canSplitX && !canSplitZ) { out.push(rect); return out; }

  const alongX = canSplitX && (!canSplitZ || rect.w >= rect.d);
  const length = alongX ? rect.w : rect.d;
  const cut = length * (0.35 + rand() * 0.3);

  if (alongX) {
    splitLots({ x: rect.x, z: rect.z, w: cut - ROAD / 2, d: rect.d }, rand, out);
    splitLots({ x: rect.x + cut + ROAD / 2, z: rect.z, w: rect.w - cut - ROAD / 2, d: rect.d }, rand, out);
  } else {
    splitLots({ x: rect.x, z: rect.z, w: rect.w, d: cut - ROAD / 2 }, rand, out);
    splitLots({ x: rect.x, z: rect.z + cut + ROAD / 2, w: rect.w, d: rect.d - cut - ROAD / 2 }, rand, out);
  }
  return out;
}

/* ---- 目線のカメラと、フォグ ---- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x161a26);
// 遠くを背景色に溶かす。世界の果てを隠す、いちばん安い方法
scene.fog = new THREE.Fog(0x161a26, 40, 190);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 600);
camera.position.set(-26, 6.5, 34);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 3, 0);
controls.maxPolarAngle = Math.PI * 0.495;   // 地面より下へ回り込めないようにする

const sun = new THREE.DirectionalLight(0xffe8c4, 2.4);
sun.position.set(60, 80, 40);
scene.add(sun, new THREE.HemisphereLight(0x9db8ff, 0x2a2a33, 0.8));

// 道路になる地面
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(600, 600),
  new THREE.MeshStandardMaterial({ color: 0x474b56, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---- 街区を、歩道の高さぶん持ち上げて敷く ---- */

const lots = splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, makeRandom(20260730), []);

// 歩道の高さぶん持ち上げた板を、街区ごとに置く
const slabGeometry = new THREE.BoxGeometry(1, 1, 1);
const slabMaterial = new THREE.MeshStandardMaterial({ color: 0x5f6472, roughness: 0.9 });

for (const lot of lots) {
  const slab = new THREE.Mesh(slabGeometry, slabMaterial);
  slab.scale.set(lot.w, 0.35, lot.d);
  slab.position.set(lot.x + lot.w / 2, 0.175, lot.z + lot.d / 2);
  scene.add(slab);

  // 建物が建つ範囲（歩道を残した内側）。次の章で使う
  const inner = new THREE.Mesh(
    slabGeometry,
    new THREE.MeshStandardMaterial({ color: 0x4b5060, roughness: 0.9 }),
  );
  const w = Math.max(0.5, lot.w - SIDEWALK * 2);
  const d = Math.max(0.5, lot.d - SIDEWALK * 2);
  inner.scale.set(w, 0.38, d);
  inner.position.set(lot.x + lot.w / 2, 0.19, lot.z + lot.d / 2);
  scene.add(inner);
}

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
        '道路の網目が、地面の隙間として見えています。少し暗い内側の四角が、次の章で建物が建つ範囲です。**`scene.fog` の行を消してください** ― 街の端がぶつりと途切れ、$120 \\times 120$ しか無いことが一目でばれます。`controls.maxPolarAngle` を消すと地面の下へ回り込めてしまい、街が板 $1$ 枚であることもばれます。**この $2$ 行が、世界を広げずに広く見せています。**',
    },
    {
      kind: 'md',
      text: `
## この時点の値段を、測っておく

まだ建物は $1$ 棟もありませんが、街区の板だけで**すでに $55$ 回**描いています
（街区 $54$ ＋ 地面 $1$）。

[](#/ch/p05-city-layout)の見積もりでは、ここに $500$ 棟が乗ります。
$1$ 棟ずつ \`Mesh\` にすれば $555$ 回、$0.012$ ミリ秒として $6.7$ ミリ秒 ―
$60$ fps の予算の $40\\%$ です。

**街区の板も、まとめる対象です。**
次の章では建物と一緒に、この $54$ 枚も $1$ 回にまとめます。

数えるのではなく、\`renderer.info.render.calls\` を画面に出しておいてください。
[](#/ch/w42-draw-calls)でやったとおり、**測っていない最適化は当てずっぽう**です。
`,
    },
  ],
  exercises: [
    {
      prompt: `画角を $55$ 度から $75$ 度に広げると、高さ $20$ の建物を収めるのに必要な距離はどう変わりますか。

広角にすれば狭い道でも収まるのなら、なぜそうしないのでしょう。`,
      hint: '$\\tan(75/2°) = 0.7673$。広角で写る絵は、どんな絵でしょう。',
      answer: `**$25.9$ から $17.6$ へ、$3$ 分の $2$ に縮みます。それでも道幅 $3.2$ には遠く及びません。**

**計算**

$\\dfrac{20 - 6.5}{0.7673} = 17.6$

**なぜ広角にしないか**

**1. 遠近が誇張される**

画角を広げると、手前が極端に大きく、奥が極端に小さく写ります。

建物が**手前に倒れ込んでくる**ように見え、街が広場のように見えます。
人が街を歩いているときの見え方（$40$〜$60$ 度あたり）から離れます。

**2. 端が歪む**

$75$ 度では画面の四隅で像が引き伸ばされます。
四角い建物が、隅では平行四辺形のように見えます。

**3. 描く量が増える**

視野に入るものが増えるので、**視錐台カリングで落とせるものが減ります。**
狭い画角は、それだけで最適化です。

**それでも足りない**

$17.6$ に対して道幅は $3.2$ です。$5$ 倍以上足りません。

**画角では解決しません。** 道を広げるか、建物を低くするか、
「上が切れて当たり前」と受け入れるかです。

この作品は俯瞰で見せるので、$3$ つめを選んでいます。`,
    },
    {
      prompt: `\`scene.fog\` の終わりを $190$ から $80$ にすると、何が起きますか。

街の対角は $84.9$ です。`,
      hint: '$84.9$ は $80$ より大きいですか、小さいですか。',
      answer: `**街のいちばん遠い角が、完全に背景色へ溶けて消えます。**

**何が見えるか**

$80$ で完全に霧の色になるので、$84.9$ の角は**背景と区別が付きません。**

見えるのは、自分のまわり $80$ の円だけ。

- 街の外周が見えないので、**果てが見えない**（狙いどおり）
- ただし**見える範囲がとても狭い**

「霧の濃い日」の絵になります。それが欲しいなら正解です。

**逆に、遠すぎるとどうなるか**

$400$ にすると、街の対角 $84.9$ でも霧はほとんど効きません。
**街の端がくっきり見えて、世界の果てが露出します。**

**目安**

- 霧の**終わり**を、**見せたい範囲の $2$ 倍**あたりに置く
- 霧の**始まり**は、その $4$ 分の $1$ あたり

この作品は $40$ と $190$ で、街の対角 $84.9$ の $2.2$ 倍です。
**いちばん遠い角がまだ霞の途中** ― 見えてはいるが、輪郭は溶けている、という位置です。

**フォグは「隠す」道具ではなく「境目をぼかす」道具**です。
完全に隠す位置に置くと、今度は霧の壁が見えます。`,
    },
    {
      prompt: `真上からの確認では見つからず、目線を下ろして初めて分かる問題を、
この章で挙げた $3$ つ以外に $1$ つ考えてください。`,
      hint: '真上からは、高さの情報がまったく見えません。',
      answer: `**たとえば「街区の板と地面の板が、同じ高さにある」問題です。**

**何が起きるか**

街区の板を $y = 0$、地面も $y = 0$ に置くと、
$2$ 枚が完全に重なって{{Zファイティング}}を起こします。

- 真上からは、ちらつきが**模様のように**見えて気づかないことがあります
- **目線を下ろして遠くを見ると、地平線あたりで激しくちらつきます**

距離が遠いほど奥行きの刻みが粗くなるからで、
[](#/ch/x02-depth-precision)でやったとおりです。

この作品では街区を $y = 0.18$、内側を $0.19$ に置いて避けています。

**ほかにも、目線でしか出ないもの**

- **地面の板が近すぎて \`near\` に切られる**（足元が抜ける）
- **影の解像度が足りず、遠くの影がぼやける**
- **道の幅に対して建物が高すぎ、空がまったく見えない**
- **視点の高さが地面すれすれで、すべてが真横から見える**

**共通しているのは「奥行き」と「高さ」に関わること**です。

真上からの視点は、その $2$ つを潰した絵なので、
**潰した軸の問題は原理的に見えません。**

だから、確認は必ず $2$ 方向から行います。`,
    },
  ],
  quiz: [
    {
      q: '画角 55 度・カメラの高さ 6.5 のとき、高さ 20 の建物を画面に収めるには何単位下がる必要がありますか。',
      choices: [
        '約 25.9。(20 − 6.5) ÷ tan(27.5°) で出る',
        '約 20。建物の高さと同じ',
        '約 10。画角には関係しない',
        '下がる必要はない',
      ],
      answer: 0,
      explain:
        '距離 z で写る高さは 2z·tan(fov/2) なので、これを z について解きます。この街の道幅は 3.2 しかないので、道の反対側からでは高さ 8.2 までしか収まりません。俯瞰で見せる作品なら問題ありませんが、目線で歩く作品なら建物を低くするか道を広げることになります。',
    },
    {
      q: '街の端がぶつりと途切れて見えるのを、いちばん安く解決する方法はどれですか。',
      choices: [
        '背景色と同じ色のフォグをかけ、遠くを溶かす',
        '街を 4 倍の広さに作る',
        'far を小さくして、遠くを描かない',
        'カメラを高い位置に固定する',
      ],
      answer: 0,
      explain:
        '街を広げれば生成も描画も 4 倍になりますが、フォグなら 1 行です。距離 40 から霞みはじめ 190 で溶けるようにすると、街の対角 84.9 はまだ霞の途中 ―「この先も続いているが見えない」という顔になります。背景色と霧の色を必ず同じにしてください。違うと霧の終わりに輪郭が出ます。',
    },
    {
      q: '真上からの確認では見つけにくい問題はどれですか。',
      choices: [
        '街区の板と地面が同じ高さにあって、遠くでちらつくこと',
        '街区の数が多すぎること',
        '道路率が高すぎること',
        '街区の大小が混ざっていないこと',
      ],
      answer: 0,
      explain:
        '真上からの視点は奥行きと高さを潰した絵なので、その 2 軸に関わる問題は原理的に見えません。Z ファイティングは真上からだと模様のように見えて気づきにくく、目線を下ろして遠くを見た瞬間にはっきり出ます。奥行きの刻みは距離が遠いほど粗くなるからです。確認は必ず 2 方向から行います。',
    },
  ],
};
