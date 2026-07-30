import type { Chapter } from '../types.ts';

export const chapterP05: Chapter = {
  slug: 'p05-city-layout',
  part: 'project',
  number: 5,
  title: 'ローポリの街 ― 街路をひく',
  goal: '同じ種から必ず同じ街が出る乱数を書けるようになり、再帰的な分割で街区を切り出せるようになります。',
  requires: ['p04-planet-orbits', '13-random', 't10-scene-graph'],
  threeApis: [
    'BoxGeometry',
    'Mesh',
    'Group',
    'MeshStandardMaterial',
    'PlaneGeometry',
    'Object3D.position',
    'Object3D.scale',
    'Fog',
  ],
  mathRecall: [
    { slug: '13-random', note: 'シード ― 同じ種なら同じ並び' },
    { slug: '01-space', note: 'x と z が地面、y が高さ' },
    { slug: 't10-scene-graph', note: 'Group でまとめて片付ける' },
    { slug: 't11-performance', note: 'ドローコール ― ここから本番になります' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 惑星とは、まったく違う難しさ

前半の 4 章は「**1 つのものを丁寧に作る**」でした。後半は逆です。

街には建物が 500 も 1000 もあります。1 つずつ丁寧に置いていたら終わりませんし、
そのまま描いたら[2-11](#/ch/t11-performance)でやったとおり{{ドローコール}}で潰れます。
つまり後半の主題は「**たくさんのものを、安く、それらしく作る**」です。

段取りはこうします。

- **この章** … 街区を切り出す。決め打ちの乱数と、再帰的な分割
- **[3-06](#/ch/p06-city-buildings)** … 建物を生やして、1 回で描く
- **[3-07](#/ch/p07-city-light)** … 朝から夜へ。影と窓の明かり
- **[3-08](#/ch/p08-city-motion)** … 車を走らせて仕上げる
`,
    },
    {
      kind: 'md',
      text: `
## まず、乱数を決め打ちにする

手続き的に何かを生成するとき、**\`Math.random()\` をそのまま使うのは事故です。**
理由は 3 つあり、どれも実際に困ります。

- **さっきの街が二度と出ない。** 「あの配置が良かった」と思っても戻れません
- **不具合を再現できない。** 「たまに建物が道路に食い込む」を追えません
- **見せられない。** 同じ URL を開いた人に、同じものが見えません

なので、**種（{{シード}}）を渡したら必ず同じ並びを返す乱数**を自分で持ちます。
短くて速いもので十分です。次の 8 行が、この章から最後まで街の骨格を決めます。
`,
    },
    {
      kind: 'code',
      title: '決め打ちの疑似乱数（mulberry32）',
      code: `function makeRandom(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = makeRandom(20260730);
rand();  // 0〜1。同じ種からは、必ず同じ並びが出る`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '中身を理解しなくても、使えます',
      text: `
かけ算と排他的論理和を混ぜて、値をよく散らばらせているだけです。
仕組みを追う必要はありません。**性質だけ覚えてください。**

- 同じ種 → 必ず同じ並び
- 種を 1 増やすと、まったく別の並び
- 速い（\`Math.random()\` と同程度）

「暗号には使えない」という注意書きが付きますが、
街を作るぶんには何の問題もありません。
`,
    },
    {
      kind: 'md',
      text: `
## 街区の切り方 ― 大きな土地を割っていく

街路の作り方には、大きく 2 つあります。

**（A）格子。** 等間隔に縦横の線を引く。京都やマンハッタン。素直ですが、**すぐ単調に見えます。**

**（B）再帰的に割る。** 土地を 1 本の道で 2 つに割り、できた土地をそれぞれまた割る。
小さくなったらやめる。こちらは**大小の街区が自然に混ざる**ので、それらしく見えます。

B を採ります。書き方も短く、10 行ほどで済みます。

コツは 2 つあります。**長い辺の側を割る**こと（そうしないと細長い街区ばかりになる）と、
**真ん中ではなく 35〜65 パーセントの位置で割る**こと（真ん中で割ると格子に戻ってしまう）。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{切る位置} = w \\cdot (0.35 + 0.3\\,\\xi), \\quad \\xi \\sim U(0,1)',
      readAloud:
        '幅 w の 35 パーセントから 65 パーセントのあいだのどこかで切る、と読みます。ξ（クサイ）は 0 から 1 の一様乱数です。範囲を狭めると格子に近づき、広げると極端に細い街区が出ます。',
    },
    {
      kind: 'md',
      text: `
## 道路は「作らない」

ここが気持ちのいいところです。**道路をモデリングしません。**

土地を 2 つに割るとき、境目に**道路の幅だけ隙間をあけて**割ります。
すると、残った街区の**あいだが自動的に道路になります。**

道路の形を計算する必要も、交差点を特別扱いする必要もありません。
「街区を置いていったら、隙間が道になっていた」という順番です。
`,
    },
    {
      kind: 'sandbox',
      title: '街区を切り出す（真上から）',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CITY = 120;        // 街全体の一辺
const ROAD = 3.2;        // 道路の幅
const MIN_LOT = 9;       // この2倍＋道路幅より小さい土地は、もう割らない

/* ---- 決め打ちの乱数 ---- */

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

/* ---- 土地を再帰的に割る ---- */
// rect は { x, z, w, d }。x, z は角の座標、w, d は幅と奥行き

function splitLots(rect, rand, out) {
  const canSplitX = rect.w > MIN_LOT * 2 + ROAD;
  const canSplitZ = rect.d > MIN_LOT * 2 + ROAD;

  if (!canSplitX && !canSplitZ) {
    out.push(rect);
    return out;
  }

  // 長い辺の側を割る。どちらも割れるなら長いほうを選ぶ
  const alongX = canSplitX && (!canSplitZ || rect.w >= rect.d);
  const length = alongX ? rect.w : rect.d;
  const cut = length * (0.35 + rand() * 0.3);

  if (alongX) {
    splitLots({ x: rect.x, z: rect.z, w: cut - ROAD / 2, d: rect.d }, rand, out);
    splitLots(
      { x: rect.x + cut + ROAD / 2, z: rect.z, w: rect.w - cut - ROAD / 2, d: rect.d },
      rand, out,
    );
  } else {
    splitLots({ x: rect.x, z: rect.z, w: rect.w, d: cut - ROAD / 2 }, rand, out);
    splitLots(
      { x: rect.x, z: rect.z + cut + ROAD / 2, w: rect.w, d: rect.d - cut - ROAD / 2 },
      rand, out,
    );
  }
  return out;
}

/* ---- シーン ---- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 800);
camera.position.set(0, 165, 1);   // ほぼ真上から

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(20, 80, 30);
scene.add(sun, new THREE.AmbientLight(0xffffff, 0.7));

// 地面（＝道路。街区の隙間がそのまま道になる）
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(CITY + 20, CITY + 20),
  new THREE.MeshStandardMaterial({ color: 0x1a1a24 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---- 街区を並べる ---- */

const city = new THREE.Group();
scene.add(city);

const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#e8e8f2; font:12px monospace;' +
  'pointer-events:none; white-space:pre;';
document.body.appendChild(readout);

let seed = 20260730;
let blockCount = 0;

function build() {
  // 前の街を片付ける（2-10 の dispose）
  for (const child of city.children.slice()) {
    city.remove(child);
    child.material.dispose();
  }

  const rand = makeRandom(seed);
  const lots = splitLots(
    { x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY },
    rand, [],
  );

  for (const lot of lots) {
    const material = new THREE.MeshStandardMaterial({
      // 大きい街区ほど明るくして、大小が混ざっているのを見えるようにする
      color: new THREE.Color().setHSL(0.58, 0.25, 0.2 + Math.min(0.45, lot.w * lot.d / 900)),
    });
    const block = new THREE.Mesh(blockGeometry, material);
    block.scale.set(lot.w, 0.6, lot.d);
    block.position.set(lot.x + lot.w / 2, 0.3, lot.z + lot.d / 2);
    city.add(block);
  }

  blockCount = lots.length;
}

/* ---- ボタン ---- */

function addButton(text, left, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText =
    'position:absolute; bottom:82px; left:' + left + 'px; padding:6px 10px;' +
    'background:#12121f; color:#e8e8f2; border:1px solid #3a3a5c; border-radius:6px;' +
    'font:12px sans-serif; cursor:pointer;';
  button.addEventListener('click', onClick);
  document.body.appendChild(button);
}

addButton('同じシードで作り直す', 12, () => build());
addButton('次のシードへ', 176, () => { seed += 1; build(); });

build();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);

  // 数えるのではなく、実際に測る（2-11）
  readout.textContent =
    'シード ' + seed + '\\n街区 ' + blockCount + ' 区画\\n' +
    'ドローコール ' + renderer.info.render.calls;
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '「同じシードで作り直す」を何度押しても、まったく同じ街区が出ます。「次のシードへ」を押すと別の街になります。この違いが、手続き的生成で最初に手に入れるべきものです。`MIN_LOT` を 20 にすると大きな街区ばかりになり、5 にすると細切れになります。`0.35 + rand() * 0.3` を `0.5` に固定すると、街が格子に戻るのが見えます。',
    },
    {
      kind: 'md',
      text: `
## 目線を下ろす

真上から見ると「地図」ですが、カメラを下ろすと**まだ何も無い**ことが分かります。
街区の板が並んでいるだけです。

それでも、この段階で確かめておきたいことがあります。

- **道路の幅は歩ける広さか。** 上から見て良さそうでも、目線では狭すぎることがよくあります
- **街区の大小は混ざっているか。** 同じ大きさばかりなら、割り方の乱数が効いていません
- **街の外周はどうするか。** 何もないと、世界の果てが見えてしまいます

3 つめには{{フォグ}}を使います。遠くを背景色に溶かしてしまえば、
「この先も街が続いているが、霞んで見えない」という顔になります。
**世界を広げるより、見えなくするほうがずっと安い**という、よく使われる手です。
`,
    },
    {
      kind: 'sandbox',
      title: '目線の高さから見る（まだ建物はありません）',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CITY = 120;
const ROAD = 3.2;
const MIN_LOT = 9;
const SIDEWALK = 0.9;   // 街区のふちに残す歩道の幅

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
        '道路の網目が地面の隙間として見えます。少し暗い内側の四角が、次の章で建物が建つ範囲です。`scene.fog` の行を消すと、街の端がぶつりと途切れて世界の果てが見えます。`controls.maxPolarAngle` を消すと地面の下へ回り込めてしまい、街が浮いていることがばれます。',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'この時点で、すでにドローコールは危ない',
      text: `
街区が 60 区画あると、板と内側で 120 個のメッシュ。地面を足して 121 回のドローコールです。
まだ建物が 1 つも無いのに、[2-11](#/ch/t11-performance)で「気にしはじめる」と言った 100 を超えました。

このまま建物を 1 棟ずつメッシュにすると、**軽く 1000 回**を超えます。
次の章の最初の仕事は、これを **1 回**にすることです。
`,
    },
    {
      kind: 'md',
      text: `
## 分割の作法

再帰で書くときに、必ず入れておくものが 2 つあります。

- **止まる条件を先に書く。** 「これ以上割れない」を関数の頭に置きます。
  忘れると、道路の幅を引き続けて**幅が負の街区**が生まれ、
  裏返ったジオメトリとして描かれます（見た目が壊れるまで気づけません）
- **割れない場合に何を返すかを決める。** ここでは「割らずにそのまま結果へ入れる」です

これは[1-13](#/ch/13-random)のノイズと同じで、
**手続き的生成の不具合は「例外」ではなく「妙な見た目」として出ます。**
だから止まる条件は、動かす前に書いておくほうが早いのです。
`,
    },
  ],
  quiz: [
    {
      q: '手続き的生成で `Math.random()` をそのまま使うと、いちばん困るのはどれですか。',
      choices: [
        '良かった結果を二度と再現できず、不具合も追えない',
        '速度が遅い',
        '偏りがある',
        '負の数が出る',
      ],
      answer: 0,
      explain:
        '品質そのものは十分です。問題は「同じものが二度と出ない」こと。種を渡せば同じ並びを返す乱数に替えるだけで、良い配置を保存でき、不具合も再現できるようになります。',
    },
    {
      q: '土地を再帰的に割るとき、切る位置をつねに 50 パーセントにするとどうなりますか。',
      choices: [
        '街区の大きさが揃って、格子状の単調な街になる',
        '街区が細長くなる',
        '道路が消える',
        '再帰が止まらなくなる',
      ],
      answer: 0,
      explain:
        '毎回半分に割れば、同じ深さの街区はすべて同じ大きさになります。35〜65 パーセントのあいだで散らすと、大小が混ざって街らしくなります。ここは「乱数を入れる場所」として効きが大きい箇所です。',
    },
    {
      q: 'この章では道路をモデリングしていません。道路はどうやって現れていますか。',
      choices: [
        '街区を割るときに道路の幅だけ隙間をあけたので、街区のあいだが道路になっている',
        '地面のテクスチャに描いている',
        '道路用のメッシュを別に生成している',
        'フォグで隠している',
      ],
      answer: 0,
      explain:
        '隙間をあけて割るだけで、交差点も含めて道路網が自動的にできます。「描くものを増やす」のではなく「描かない場所を残す」ほうが、コードも描画も安くなる典型例です。',
    },
  ],
};
