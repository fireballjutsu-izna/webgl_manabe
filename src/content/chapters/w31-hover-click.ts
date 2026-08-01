import type { Chapter } from '../types.ts';

export const chapterW31: Chapter = {
  slug: 'w31-hover-click',
  part: 'threejs',
  number: 31,
  title: 'ホバーとクリック ― 状態を持つ',
  goal: 'ホバーの出入りを取りこぼさずに扱えるようになり、ドラッグとクリックを区別できるようになります。',
  requires: ['t08-raycaster'],
  threeApis: [
    'Raycaster.intersectObjects',
    'Object3D.userData',
    'Material.emissive',
    'Object3D.getObjectById',
    'Vector2.distanceTo',
    'Object3D.traverseAncestors',
  ],
  mathRecall: [{ slug: 'w25-damping', note: 'ホバーの見た目も、指数減衰でなめらかにできる' }],
  blocks: [
    {
      kind: 'md',
      text: `
## 「いま何に触れているか」は、状態

前の章で「光線を飛ばして、当たったものを取る」ができました。

ところが**ホバーは、それだけでは作れません。**

必要なのは「当たったもの」ではなく、**変化**だからです。

- **入った** … さっきは当たっていなかったものに、いま当たった → 光らせる
- **出た** … さっき当たっていたものに、いま当たっていない → 戻す
- **変わらない** … 何もしない

つまり**直前に何に当たっていたかを覚えておく**必要があります。
これが「状態を持つ」ということです。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '「出た」を忘れると、光ったまま残ります',
      text: `
いちばん多い不具合がこれです。

当たったときだけ処理を書くと、カーソルが外れたときに元へ戻す処理が走りません。
結果、触れたものが全部光ったまま残ります。

「入った」と「出た」は必ず対で書いてください。
そして途中で例外が出ても戻るように、先に「前のものを戻す」を書くのが安全です。
`,
    },
    {
      kind: 'md',
      text: `
## 3 行で書ける

状態を 1 つ持つだけで、入りと出が両方きれいに書けます。

**\`hovered\` に「いま当たっているもの」を覚えておき、変わったときだけ処理する。**

前の章のサンドボックスで、すでにこの形が出てきていました。
`,
    },
    {
      kind: 'code',
      title: 'ホバーの基本形',
      code: `let hovered = null;

function onPointerMove(event) {
  updatePointer(event);
  const hit = pick();

  if (hit === hovered) return;      // 変わっていないなら何もしない

  if (hovered) leave(hovered);      // 先に「出た」を処理する
  hovered = hit;
  if (hovered) enter(hovered);      // それから「入った」

  canvas.style.cursor = hovered ? 'pointer' : 'default';
}

function enter(object) {
  object.material.emissive.setHex(0x2b5580);
}
function leave(object) {
  object.material.emissive.setHex(0x000000);
}

// キャンバスから出たときも「出た」を起こす。忘れがち
canvas.addEventListener('pointerleave', () => {
  if (hovered) leave(hovered);
  hovered = null;
  canvas.style.cursor = 'default';
});`,
    },
    {
      kind: 'md',
      text: `
## ドラッグとクリックを、区別する

\`click\` イベントには落とし穴があります。

**\`OrbitControls\` で視点を回したあと、指を離した場所で \`click\` が発火します。**

つまり「回そうとしただけ」なのに、そこにあったものが選ばれます。
ユーザーからすれば**まったく身に覚えのない操作**です。

**直し方は、押した位置と離した位置を比べること。**

$5$ ピクセル以上動いていたら、それはドラッグであってクリックではない ―
と判定します。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{クリックとみなす} \\iff \\lVert \\mathbf{p}_{\\text{up}} - \\mathbf{p}_{\\text{down}} \\rVert < \\varepsilon \\;\\wedge\\; t_{\\text{up}} - t_{\\text{down}} < T',
      readAloud:
        '押した位置と離した位置の距離が小さく、かつ押していた時間が短ければ、クリックとみなします。距離だけで判定すると、長押ししてから離した場合もクリックになってしまいます。',
      worked: {
        given:
          '$\\varepsilon = 5$ ピクセル、$T = 400$ ミリ秒とします。**3 つの操作**を判定します。',
        steps: [
          { calc: '(A) down(300,200) up(302,201) 120ms' },
          { calc: '    距離 = sqrt(4 + 1) = 2.24 < 5' },
          { calc: '    時間 120 < 400  → クリック' },
          { calc: '(B) down(300,200) up(340,215) 200ms' },
          { calc: '    距離 = sqrt(1600 + 225) = 42.7', note: '5 を超える' },
          { calc: '    → ドラッグ。クリックではない' },
          { calc: '(C) down(300,200) up(301,200) 900ms' },
          { calc: '    距離 1 < 5 だが、時間 900 > 400' },
          { calc: '    → 長押し。クリックではない' },
        ],
        result:
          '**(A) だけがクリック**です。**(B) は視点を回しただけ** ― これを拾ってしまうのが、いちばん多い誤爆です。**(C) の時間の条件も要ります。** 距離だけで判定すると、長押しメニューを出したいときに区別できません。$\\varepsilon$ は**タッチではもう少し大きく**（$10$ 前後）してください。指はマウスより動きます。',
      },
    },
    {
      kind: 'sandbox',
      title: 'ホバー・クリック・ドラッグの誤爆',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// false にすると、視点を回しただけでクリック判定になります
const GUARD = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 4.5, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const canvas = renderer.domElement;
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0.5, 0);

const key = new THREE.DirectionalLight(0xffffff, 3.0);
key.position.set(3, 6, 4);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x241f2e, 1.4));
scene.add(new THREE.GridHelper(14, 14, 0x3a3a5c, 0x26263c));

// 触れる対象。マテリアルは個別に（色を別々に変えるため）
const targets = [];
const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);

for (let i = 0; i < 7; i++) {
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x5f6b96, roughness: 0.5 }),
  );
  mesh.position.set((i - 3) * 1.25, 0.5, 0);
  mesh.userData.index = i;
  scene.add(mesh);
  targets.push(mesh);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pick() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(targets, false);
  return hits.length > 0 ? hits[0].object : null;
}

// --- ホバー : 直前の対象を覚えておく ---
canvas.addEventListener('pointermove', (event) => {
  updatePointer(event);
  const hit = pick();
  if (hit === hovered) return;

  if (hovered) hovered.material.emissive.setHex(0x000000);   // 先に「出た」
  hovered = hit;
  if (hovered) hovered.material.emissive.setHex(0x2b5580);   // それから「入った」

  canvas.style.cursor = hovered ? 'pointer' : 'default';
});

// キャンバスから出たときも「出た」を起こす
canvas.addEventListener('pointerleave', () => {
  if (hovered) hovered.material.emissive.setHex(0x000000);
  hovered = null;
  canvas.style.cursor = 'default';
});

// --- クリック : ドラッグと区別する ---
const EPS = 5;        // 動いてよいピクセル数
const MAX_MS = 400;   // 押していてよい時間

let downAt = null;
let downTime = 0;

canvas.addEventListener('pointerdown', (event) => {
  downAt = new THREE.Vector2(event.clientX, event.clientY);
  downTime = performance.now();
});

canvas.addEventListener('pointerup', (event) => {
  if (!downAt) return;

  const moved = downAt.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
  const held = performance.now() - downTime;
  downAt = null;

  if (GUARD && (moved > EPS || held > MAX_MS)) {
    console.log('クリックではない（動き', moved.toFixed(1), 'px / 時間', held.toFixed(0), 'ms）');
    return;
  }

  updatePointer(event);
  const hit = pick();
  if (!hit) return;

  hit.material.color.setHSL((hit.userData.index * 0.14 + 0.05) % 1, 0.75, 0.6);
  console.log('クリック :', hit.userData.index, '番');
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**箱の上でドラッグして視点を回し、指を離してみてください。** `GUARD` が `true` なら色は変わらず、コンソールに「クリックではない」と出ます。**`false` にすると、回しただけで色が変わります** ― これが誤爆です。箱に触れると青く光り、外すと戻ります。キャンバスの外へカーソルを出しても、ちゃんと戻ります。',
    },
    {
      kind: 'md',
      text: `
## 何を「当たったもの」とみなすか

読み込んだモデルは、たいてい \`Group\` の中に \`Mesh\` が何十個も入っています。

\`intersectObjects(scene.children, true)\` で拾うと、返ってくるのは
**タイヤの \`Mesh\`** であって、**車そのものではありません。**

**「どの車か」を知るには、親をたどります。**

やり方は 2 つ。

- **\`userData\` に印を付ける** … 読み込んだ直後に \`traverse\` で
  「この \`Mesh\` は車 3 番のもの」と書き込んでおく。**いちばん速い**
- **親をたどる** … \`object.parent\` を \`isSelectable\` が見つかるまで登る

**印を付けるほうがおすすめ**です。毎回たどる必要がなく、
「当たり判定用のまとまり」を自由に決められます。
`,
    },
    {
      kind: 'code',
      title: '当たった Mesh から、まとまりへ',
      code: `import * as THREE from 'three';

// A. 読み込んだ直後に、印を付けておく（速い）
function markSelectable(root, id) {
  root.traverse((o) => {
    if (o.isMesh) o.userData.owner = root;   // どの Group のものか
    o.userData.id = id;
  });
}

const hit = hits[0].object;
const car = hit.userData.owner;              // すぐ取れる

// B. 親をたどる（印を付けられない場合）
function findSelectable(object) {
  let o = object;
  while (o) {
    if (o.userData.selectable) return o;
    o = o.parent;
  }
  return null;
}

// 当たり判定から外したいものにも印を付けられる
floor.userData.ignorePick = true;

const hits2 = raycaster
  .intersectObjects(scene.children, true)
  .filter((h) => !h.object.userData.ignorePick);`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ホバーの見た目も、なめらかにできる',
      text: `
emissive を一瞬で切り替えると、少し安っぽく見えます。

[](#/ch/w25-damping) の指数減衰で寄せると、ふわっと光ります。

目標値を userData に持たせておき、毎フレーム
material.emissive.lerp(target, 1 - Math.exp(-10 * dt)) とするだけです。

ただしマテリアルを共有していると全部が光ってしまうので、
ホバーさせるものは material を個別に持たせてください。
`,
    },
    {
      kind: 'md',
      text: `
## タッチでは、ホバーが存在しない

指には「触れずに近づく」がありません。**ホバーという概念そのものが無い**のです。

だからタッチ端末では、次のことが起きます。

- **ホバーの見た目が出ない**（あるいは、タップした瞬間だけ出る）
- **ホバーで情報を見せる設計は、まったく機能しない**

**対策は、ホバーを「あると嬉しい」ものに留めること。**

必要な情報をホバーでしか見せない作りにすると、タッチ端末で使えなくなります。

- **ホバー** … 「触れる」と伝える合図。名前をちらっと出す程度
- **タップ / クリック** … 情報を出す。操作を確定する

\`pointermove\` は指でも発火しますが（触れて動かしたとき）、
**それはもう「タップ中」なので、ホバーとは別物**です。
`,
    },
  ],
  exercises: [
    {
      prompt: `ホバーの処理を「当たったら光らせる」だけにして、**戻す処理を書かなかった**とします。
何が起きますか。そして \`pointerleave\` を書き忘れると、別にどんな不具合が出ますか。`,
      hint: '「入った」の対になるものは何ですか。',
      answer: `**触れたものが、全部光ったまま残ります。**

ホバーは「当たっている状態」ではなく、**「入った」「出た」という変化**です。

「入った」だけを書くと、カーソルが外れても戻す処理が走らないので、
**触れたものが順に光りっぱなし**になります。

$7$ 個の箱の上をなぞれば、$7$ 個とも光ります。

**\`pointerleave\` を忘れると**

こんどは「**キャンバスの外へカーソルを出したとき**」だけ戻らなくなります。

\`pointermove\` はキャンバスの上でしか発火しないので、
最後に触れていたものが光ったまま、カーソルはページの別の場所にある ―
という中途半端な状態が残ります。

**マウスを速く動かして画面外へ抜けたとき**に、よく起きます。

**書き方の順序も大事です。**

\`if (hovered) leave(hovered)\` を先に書き、そのあとで
\`hovered = hit\` と \`if (hovered) enter(hovered)\` を書く。

**「出た」を先に書く**と、途中で例外が出ても前のものは戻っています。
逆順だと、新しいものを光らせたあとに落ちて、前のものが取り残されます。

**同じ形の落とし穴** … ページを離れるとき、シーンを捨てるとき。
そのときも \`hovered\` を戻してから片付けてください。`,
    },
    {
      prompt: `$\\varepsilon = 5$、$T = 400$ ミリ秒のとき、
**down $(420, 310)$、up $(423, 314)$、押していた時間 $380$ ミリ秒**
はクリックと判定されますか。手で計算してください。`,
      hint: '距離と時間の両方を見ます。',
      answer: `**クリックです。** ぎりぎりですが、両方の条件を満たします。

**距離**

$\\Delta x = 423 - 420 = 3$
$\\Delta y = 314 - 310 = 4$

$\\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$

**ちょうど $5$。** 判定は $< 5$ なので、**厳密には falsy** です。

$3$-$4$-$5$ の直角三角形（[](#/ch/b10-pythagoras)）ですね。

**時間**

$380 < 400$ ― 満たします。

**答えは「境界上」です。**

\`moved > EPS\` で判定していれば $5 > 5$ は偽なので**クリック扱い**。
\`moved >= EPS\` なら**ドラッグ扱い**。

**この境界のあいまいさが、実は重要です。**

$\\varepsilon$ を厳しくしすぎると、手ぶれでクリックできなくなります。
緩めすぎると、視点を回したのに選ばれます。

**目安**

- **マウス** … $\\varepsilon = 5$。手ぶれは $2$〜$3$ px 程度
- **タッチ** … $\\varepsilon = 10$〜$15$。指はもっと動きます
- $T$ は $300$〜$500$ ミリ秒。長押しメニューを作るならその閾値と揃える

**入力の種類で変えるのが確実です。** \`event.pointerType\` で
\`'mouse'\` / \`'touch'\` / \`'pen'\` が分かります。`,
      answerCode: `const EPS = { mouse: 5, touch: 12, pen: 8 };
const MAX_MS = 400;

canvas.addEventListener('pointerup', (event) => {
  if (!downAt) return;

  const moved = downAt.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
  const held = performance.now() - downTime;
  const eps = EPS[event.pointerType] ?? 5;
  downAt = null;

  if (moved > eps || held > MAX_MS) return;   // ドラッグか長押し
  handleClick(event);
});`,
    },
    {
      prompt: `読み込んだ車のモデルをクリックしたら、\`hits[0].object\` が
**「タイヤ」の \`Mesh\`** でした。「どの車か」を知るには、どうしますか。
**2 つの方法**を挙げ、それぞれの利点を答えてください。`,
      hint: 'モデルは Group の入れ子になっています。',
      answer: `**A. \`userData\` に印を付ける。B. 親をたどる。**

**A. 読み込んだ直後に印を付ける（おすすめ）**

\`model.traverse((o) => { if (o.isMesh) o.userData.owner = model; })\` としておけば、
当たったら \`hits[0].object.userData.owner\` で**すぐ取れます。**

**利点**

- **速い。** 毎回たどる必要がない
- **まとまりを自由に決められる。** 車全体でも、ドアだけでも、印の付け方しだい
- **当たり判定から外すものにも印を付けられる**（\`ignorePick\` など）

**B. 親をたどる**

\`let o = hit; while (o && !o.userData.selectable) o = o.parent;\`

**利点**

- **印を付けられないとき**に使える（読み込み処理に手を入れられない場合など）
- 木の構造がそのまま「まとまり」の定義になる

**欠点** … クリックのたびに登るので、深い木では無駄。
そして**「どこまで登るか」の目印が必要**なので、結局 \`userData\` を使うことになりがちです。

**実務では A が基本**で、B は補助です。

**もう 1 つの視点 ― そもそも Mesh を拾わない**

複雑なモデルには、**単純な形の見えないメッシュ**（当たり判定用の箱）を
重ねておき、**そちらだけを \`intersectObjects\` に渡す**という手があります。

三角形の数がけた違いに少ないので**速く**、
「どの車か」も自明です（箱が車 1 台に対応するので）。

これは次の章で扱います。`,
    },
  ],
  quiz: [
    {
      q: 'ホバーの実装で「当たったら光らせる」だけを書くと、何が起きますか。',
      choices: [
        '触れたものが全部光ったまま残る',
        '何も光らない',
        'エラーになる',
        '最初の 1 つだけ光る',
      ],
      answer: 0,
      explain:
        'ホバーは「当たっている状態」ではなく「入った」「出た」という変化です。直前の対象を覚えておき、変わったときだけ処理します。`pointerleave` も忘れずに書いてください。',
    },
    {
      q: '`OrbitControls` で視点を回したあと、意図しないものが選ばれます。どう直しますか。',
      choices: [
        '押した位置と離した位置の距離を測り、閾値を超えたらクリックとみなさない',
        '`click` の代わりに `dblclick` を使う',
        '`controls.enabled = false` にする',
        'Raycaster を作り直す',
      ],
      answer: 0,
      explain:
        'ドラッグの終わりでも `click` は発火します。距離（5px 程度）と時間（400ms 程度）の両方で判定してください。タッチでは指がもっと動くので、閾値を大きくします。',
    },
    {
      q: 'タッチ端末でホバーの設計が機能しないのはなぜですか。',
      choices: [
        '指には「触れずに近づく」が無く、ホバーという概念そのものが存在しないから',
        'イベント名が違うから',
        'Raycaster が対応していないから',
        '解像度が違うから',
      ],
      answer: 0,
      explain:
        'ホバーは「あると嬉しい」ものに留めてください。必要な情報をホバーでしか見せない作りにすると、タッチ端末で使えなくなります。情報はタップ・クリックで出します。',
    },
  ],
};
