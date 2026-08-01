import type { Chapter } from '../types.ts';

export const chapterW29: Chapter = {
  slug: 'w29-controls-ux',
  part: 'threejs',
  number: 29,
  title: '操作の作法 ― スクロール・タッチ・片付け',
  goal: 'ページに埋め込んだ 3D が他の操作を邪魔しないようにでき、後片付けまで含めて書けるようになります。',
  requires: ['w28-camera-move'],
  threeApis: [
    'OrbitControls.enableZoom',
    'OrbitControls.touches',
    'OrbitControls.mouseButtons',
    'OrbitControls.dispose',
    'WebGLRenderer.dispose',
    'WebGLRenderer.forceContextLoss',
  ],
  mathRecall: [{ slug: 'w25-damping', note: 'damping は毎フレームの update が要る' }],
  blocks: [
    {
      kind: 'md',
      text: `
## ページの中の 3D は、スクロールを奪う

読み物の途中に 3D を埋め込むと、その上でホイールを回したときに
**ページが動くのか、3D がズームするのか**という衝突が起きます。

\`OrbitControls\` は既定でホイールを掴むので、
**読者はページをスクロールできなくなります。**

3D の上に来た瞬間にページが止まる ― これはかなり不快です。
読み進めたいだけなのに、意図しないズームが起きます。

**判断の基準はひとつ。**

- **3D が主役**（ビューアー、ゲーム、全画面）→ ズームを掴んでよい
- **3D が本文の一部**（図解、デモ）→ **ページのスクロールを優先する**

このサイトのデモも、後者の考えで作ってあります。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '地図アプリのやり方',
      text: `
記事に埋め込まれた地図をスクロールしようとして、
地図がズームしてしまった経験は誰にでもあります。

だから多くの地図サービスは、こうしています。

「地図の上でホイールを回しても、ページがスクロールする。
ただし一度クリックすると、そこからはズームが効く」

意思表示があってから操作を預ける、という設計です。
3D も同じでよいはずです。
`,
    },
    {
      kind: 'code',
      title: 'クリックされるまで、ズームを預けない',
      code: `import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;      // 最初はページのスクロールを優先

const canvas = renderer.domElement;

// キャンバスが押されたら、そこからはズームを預かる
canvas.addEventListener('pointerdown', () => {
  controls.enableZoom = true;
  canvas.classList.add('is-active');      // 枠を光らせるなど、状態を見せる
});

// 外を押したら返す
document.addEventListener('pointerdown', (event) => {
  if (!canvas.contains(event.target)) {
    controls.enableZoom = false;
    canvas.classList.remove('is-active');
  }
});

// 別の手 : 修飾キーを押しているあいだだけズーム
canvas.addEventListener('wheel', (event) => {
  controls.enableZoom = event.ctrlKey || event.metaKey;
}, { passive: true });`,
    },
    {
      kind: 'md',
      text: `
## タッチは、もっと厄介

指の操作は、ホイールより衝突が深刻です。

**$1$ 本指のドラッグ**は、ページのスクロールでもあり、
\`OrbitControls\` の回転でもあります。**完全にぶつかります。**

three の既定は、$1$ 本指が回転、$2$ 本指がズームと平行移動。
つまり**縦にスワイプしてもページが動きません。**

**解決は \`touches\` の割り当てを変えること。**

$1$ 本指を無効にし、$2$ 本指だけで操作させます。
これなら $1$ 本指のスワイプはページに通ります。
`,
    },
    {
      kind: 'code',
      title: 'タッチの割り当てを変える',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const controls = new OrbitControls(camera, renderer.domElement);

// 本文に埋め込む 3D : 1 本指はページに渡す
controls.touches = {
  ONE: null,                             // 1 本指では何もしない
  TWO: THREE.TOUCH.DOLLY_ROTATE,         // 2 本指で回転とズーム
};

// 3D が主役なら、既定のままでよい
// controls.touches = {
//   ONE: THREE.TOUCH.ROTATE,
//   TWO: THREE.TOUCH.DOLLY_PAN,
// };

// マウスのボタン割り当ても変えられる
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: null,                           // 右クリックメニューを邪魔しない
};

// CSS 側でも指定が要る。これが無いとブラウザが先に掴む
// canvas { touch-action: pan-y; }        本文の 3D : 縦スワイプはページへ
// canvas { touch-action: none; }         主役の 3D : 全部こちらで扱う`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'touch-action は CSS 側にも要ります',
      text: `
JavaScript で touches を設定しても、それだけでは足りません。

ブラウザはタッチの扱いを CSS の touch-action で決めており、
JavaScript が受け取る前に判断しています。

canvas { touch-action: none; } … 全部 JavaScript が扱う（主役の 3D）
canvas { touch-action: pan-y; } … 縦スワイプはページへ（本文の 3D）

指定を忘れると「1 本指を無効にしたのにページが動かない」
「回そうとするとページがスクロールする」という食い違いが起きます。
`,
    },
    {
      kind: 'md',
      text: `
## 「操作できる」と伝える

3D は、見ただけでは**動かせるかどうか分かりません。**

画像かもしれないし、動画かもしれない。
読者が「触れる」と気づかなければ、機能は無いのと同じです。

**伝える手は 3 つ。**

- **カーソルを変える** … \`canvas { cursor: grab }\`、押している間は \`grabbing\`。
  **いちばん安く、いちばん効く**
- **ゆっくり自動で回す** … \`autoRotate\` で少し動かしておく。
  「動くもの」だと分かり、しかも立体だと伝わります
- **短い案内を出す** … 「ドラッグして回せます」。
  **一度操作されたら消す**のが作法です

**$3$ つとも入れる必要はありません。** カーソルと自動回転で、たいてい足ります。
`,
    },
    {
      kind: 'sandbox',
      title: '本文に埋め込むときの、ひととおり',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(4, 3, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const canvas = renderer.domElement;

// 「触れる」と伝える。いちばん安い手
canvas.style.cursor = 'grab';
canvas.style.touchAction = 'pan-y';        // 縦スワイプはページへ

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0.8, 0);

// 本文に埋め込む前提の設定
controls.enableZoom = false;               // クリックされるまで預からない
controls.enablePan = false;
controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE };
controls.autoRotate = true;                // 「動くもの」だと伝える
controls.autoRotateSpeed = 0.9;

// 触られたら、自動回転をやめてズームを預かる
controls.addEventListener('start', () => {
  controls.autoRotate = false;
  controls.enableZoom = true;
  canvas.style.cursor = 'grabbing';
});
controls.addEventListener('end', () => {
  canvas.style.cursor = 'grab';
});

// 外を押したら、ズームを返す
document.addEventListener('pointerdown', (e) => {
  if (!canvas.contains(e.target)) controls.enableZoom = false;
});

// --- 中身 ---
scene.add(
  new THREE.DirectionalLight(0xffffff, 3).translateY(6).translateZ(4),
  new THREE.HemisphereLight(0x99bbff, 0x332a22, 0.6),
);

const model = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.9, 0.3, 140, 24),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.28, metalness: 0.1 }),
);
model.position.y = 0.8;
scene.add(model);

// --- 片付けを、最初から書いておく ---
function dispose() {
  controls.dispose();
  model.geometry.dispose();
  model.material.dispose();
  renderer.setAnimationLoop(null);
  renderer.dispose();
  canvas.remove();
}
window.addEventListener('pagehide', dispose);

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
        '**カーソルを載せると手の形になり、ゆっくり自動で回っています** ― これだけで「触れる」と伝わります。ドラッグすると自動回転が止まり、そこからホイールのズームが効くようになります。触るまではホイールがページに通るので、読み進める邪魔をしません。最後の `dispose` は、この章の後半の話です。',
    },
    {
      kind: 'md',
      text: `
## 片付け ― 何を捨てるか

シーンを捨てるとき、**JavaScript のゴミ集めに任せられないもの**があります。

GPU 側に確保したものと、DOM に登録したイベントです。

| 捨てるもの | 何が残るか |
|---|---|
| \`geometry.dispose()\` | 頂点データが GPU に残り続ける |
| \`material.dispose()\` | シェーダのプログラムが残る |
| \`texture.dispose()\` | 画像が GPU に残る。**いちばん大きい** |
| \`controls.dispose()\` | **キャンバスのイベントを掴んだまま** |
| \`renderer.dispose()\` | WebGL の資源。**枠は $8$〜$16$ 個しかない** |
| \`setAnimationLoop(null)\` | **見えないシーンを描き続ける** |

**いちばん厄介なのは、最後の 2 つ**です。

ブラウザが同時に持てる WebGL コンテキストは $8$〜$16$ 個ほど。
使い切ると、**古いキャンバスから順に真っ黒**になります。

そして止め忘れたループは、**見えないシーンを描き続けます。**
$3$ つ $4$ つと溜まれば、そのぶん重くなります。
`,
    },
    {
      kind: 'code',
      title: 'シーンをまるごと片付ける',
      code: `import * as THREE from 'three';

function disposeScene(scene) {
  scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose();

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;

      // マテリアルが持っているテクスチャを、全部たどる
      for (const key of Object.keys(material)) {
        const value = material[key];
        if (value && value.isTexture) value.dispose();
      }
      material.dispose();
    }
  });
  scene.clear();
}

function teardown() {
  renderer.setAnimationLoop(null);      // まずループを止める
  controls.dispose();                   // イベントを外す
  resizeObserver.disconnect();

  disposeScene(scene);
  renderer.dispose();
  renderer.domElement.remove();
}

// 共有しているものを二重に捨てないよう、Set で管理する手もある
const owned = new Set();
function track(resource) { owned.add(resource); return resource; }
function releaseAll() { for (const r of owned) r.dispose(); owned.clear(); }`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '共有しているものは、1 回だけ捨てる',
      text: `
[](#/ch/t02-geometry) でやったとおり、ジオメトリとマテリアルは共有するのが基本です。

そのまま traverse で dispose を呼ぶと、
同じものに対して 100 回 dispose することになります。

three の dispose は 2 回目以降を無視するので実害は出ませんが、
「自分で作ったものだけを Set で管理して、最後に 1 回ずつ捨てる」
のほうが確実で、意図もはっきりします。

読み込んだモデルのように「共有していないもの」は traverse で構いません。
`,
    },
    {
      kind: 'md',
      text: `
## 片付けは、最初に書く

片付けのコードは、**シーンを作った直後に書いてください。**

あとから足そうとすると、何を作ったか思い出せません。
テクスチャ $12$ 枚のうち $3$ 枚を捨て忘れる ― といったことが必ず起きます。

**そして症状が出るのは、ずっとあとです。**

- 画面を $10$ 回切り替えたあとに、真っ黒になる
- 長く開いていると、だんだん重くなる
- モバイルで、しばらくすると落ちる

**原因から結果までが遠いので、いちばん見つけにくい種類の不具合**です。

**確かめ方**

\`renderer.info\` を出してください。
シーンを作り直す前後で、\`geometries\` と \`textures\` の数が**元に戻る**はずです。
`,
    },
    {
      kind: 'code',
      title: '漏れを見つける',
      code: `// 作り直す前後で、数が戻るかを見る
console.log('前', renderer.info.memory);      // { geometries: 12, textures: 5 }

teardown();
setup();

console.log('後', renderer.info.memory);      // 同じ数に戻るはず

// 増え続けていたら、どこかで捨て忘れている
// 描画量も見られる
console.log(renderer.info.render);            // { calls, triangles, points, lines }

// プログラム（シェーダ）の数も
console.log(renderer.info.programs.length);

// このサイトの Stage も、同じ考えで片付けています
// （章を移るたびにデモを捨てるので、漏れがあるとすぐ枯渇します）`,
    },
  ],
  exercises: [
    {
      prompt: `記事の中に 3D の図解を埋め込みました。**スマートフォンで縦スワイプすると、
ページがスクロールせずに 3D が回ってしまいます。** どう直しますか。`,
      hint: '設定は JavaScript 側だけで足りますか。',
      answer: `**\`touches.ONE\` を無効にし、CSS の \`touch-action\` も指定します。両方が要ります。**

**1. JavaScript 側**

\`\`controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE }\`\`

$1$ 本指では何もせず、$2$ 本指でだけ回転とズームを受け付けます。

**2. CSS 側**

\`\`canvas { touch-action: pan-y; }\`\`

**これが無いと直りません。**

ブラウザはタッチの扱いを **JavaScript より先に** \`touch-action\` で判断します。
既定の \`touch-action: none\`（three が設定します）だと、
ブラウザは「このイベントはページに渡さない」と決めてしまいます。

そのあと JavaScript 側が「$1$ 本指では何もしない」と判断しても、
**ページのスクロールはもう起きません。**

\`pan-y\` にすると「縦のスクロールはブラウザが扱う」と宣言できます。

**3. できれば、伝える**

$2$ 本指が要ることは、見ただけでは分かりません。
「$2$ 本指で回せます」と小さく出すか、
$1$ 本指でドラッグされたときにその案内を出すのが親切です。

**判断の基準**

- **3D が主役**（全画面のビューアー、ゲーム）→ \`touch-action: none\`。
  $1$ 本指で回してよい
- **3D が本文の一部**（図解、デモ）→ \`touch-action: pan-y\`。
  **読み進める邪魔をしない**

**読み物の中では、後者が正解**です。
「触りたい人だけが触れる」形にしてください。`,
      answerCode: `import * as THREE from 'three';

const canvas = renderer.domElement;

// CSS 側。これが無いと JavaScript の設定が効かない
canvas.style.touchAction = 'pan-y';        // 縦スワイプはページへ

const controls = new OrbitControls(camera, canvas);

// 1 本指では何もしない
controls.touches = {
  ONE: null,
  TWO: THREE.TOUCH.DOLLY_ROTATE,
};

// ホイールも、押されるまでは預からない
controls.enableZoom = false;
canvas.addEventListener('pointerdown', () => { controls.enableZoom = true; });`,
    },
    {
      prompt: `1 ページの中でシーンを何度も作り直すアプリを書いています。
**$10$ 回ほど切り替えると、画面が真っ黒になります。** 原因は何ですか。
そして、**漏れを見つける方法**を答えてください。`,
      hint: 'ブラウザが同時に持てる WebGL の数には、上限があります。',
      answer: `**\`renderer.dispose()\` を呼んでいないため、WebGL コンテキストが枯渇しています。**

**何が起きているか**

ブラウザが同時に持てる WebGL コンテキストは、**$8$〜$16$ 個**ほどです。

\`new THREE.WebGLRenderer()\` のたびに $1$ つ消費され、
捨てなければ残り続けます。

上限を超えると、ブラウザは**古いものから強制的に破棄**します。
その結果、**古いキャンバスが真っ黒**になる ―

ところが古いキャンバスは DOM から消していないので、
画面に真っ黒な領域が残ります。

**症状が「$10$ 回目」に出るのが厄介です。** 原因（$1$ 回目の捨て忘れ）から
結果（$10$ 回目の真っ黒）までが遠すぎて、結び付けにくい。

**直し方**

作り直す前に、必ず片付けます。**順番も大事です。**

1. **\`renderer.setAnimationLoop(null)\`** … まずループを止める
2. **\`controls.dispose()\`** … イベントを外す
3. **ジオメトリ・マテリアル・テクスチャを \`dispose\`**
4. **\`renderer.dispose()\`** … コンテキストを返す
5. **\`renderer.domElement.remove()\`** … DOM からも消す

**ループを最初に止める**のが肝心です。
捨てたあとに描こうとすると、エラーが出ます。

**漏れの見つけ方 ― \`renderer.info.memory\`**

作り直しの前後で数を出してください。

\`console.log(renderer.info.memory)\` → \`{ geometries: 12, textures: 5 }\`

**同じ数に戻れば、漏れはありません。**
増え続けていれば、どこかで捨て忘れています。

**もっと確実な方法** … そもそも**レンダラを作り直さない。**

$1$ つのレンダラを使い回し、シーンの中身だけを入れ替えれば、
コンテキストの枯渇は起きようがありません。

**このサイトの Stage も、そういう作り**です ―
章を移るたびにデモを捨てるので、漏れがあればすぐ枯渇します。`,
      answerCode: `import * as THREE from 'three';

let renderer = null;

function teardown() {
  if (!renderer) return;

  renderer.setAnimationLoop(null);        // 1. まずループを止める
  controls.dispose();                     // 2. イベントを外す

  scene.traverse((o) => {                 // 3. GPU の資源を返す
    o.geometry?.dispose();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m) continue;
      for (const k of Object.keys(m)) if (m[k]?.isTexture) m[k].dispose();
      m.dispose();
    }
  });

  renderer.dispose();                     // 4. コンテキストを返す
  renderer.domElement.remove();           // 5. DOM からも消す
  renderer = null;
}

// 漏れの確認
console.log('前', renderer.info.memory);
teardown(); setup();
console.log('後', renderer.info.memory);   // 同じ数に戻るはず`,
    },
    {
      prompt: `3D のビューアーを作りましたが、**読者が「動かせる」ことに気づきません。**
どう伝えますか。**3 つ**挙げ、それぞれの費用と効き目を答えてください。`,
      hint: 'いちばん安いものから並べてください。',
      answer: `**カーソル → 自動回転 → 案内文、の順です。**

**1. カーソルを変える ― 費用ゼロ、効き目は大**

\`\`canvas { cursor: grab }\`\`、押している間は \`grabbing\`。

CSS $1$ 行です。**マウスを使う人には、これがいちばん確実**に伝わります。
「手の形になる ＝ つかんで動かせる」は、広く共有された合図だからです。

**JavaScript で切り替えると、さらに良くなります。**
\`controls\` の \`start\` / \`end\` イベントで \`grabbing\` と \`grab\` を入れ替えると、
つかんでいる感触が出ます。

**2. ゆっくり自動で回す ― 費用は小、効き目は大**

\`\`controls.autoRotate = true; controls.autoRotateSpeed = 0.8\`\`

$2$ つの効果があります。

- **「動くもの」だと分かる。** 静止画ではないと一目で伝わる
- **立体だと伝わる。** 回ることで奥行きが見え、平面の絵ではないと分かる

**タッチの端末では、これがいちばん効きます**（カーソルが無いので）。

**触られたら止めてください。** 自動で回り続けると、操作の邪魔になります。
\`controls.addEventListener('start', () => { controls.autoRotate = false; })\`

**3. 短い案内を出す ― 費用は中、効き目は確実**

「ドラッグして回せます」「$2$ 本指で操作できます」。

**確実ですが、画面を占有します。**
そして**一度操作されたら消す**のが作法です。出しっぱなしは邪魔です。

**タッチ端末で $2$ 本指を要求するときは、これが必須**に近いです。
$2$ 本指という操作は、言われなければ試しません。

**$3$ つとも入れる必要はありません。**

$1$ と $2$ で、たいていは足ります。
$3$ は「特殊な操作を要求するとき」だけ。

**もう $1$ つの視点** … **最初の $1$ 枚を良くする**ことも、
「触ってみたい」を作ります。斜めから見下ろした、立体感のある構図。
[](#/ch/t07-controls)でやった初期視点の話です。`,
    },
  ],
  quiz: [
    {
      q: '記事に埋め込んだ 3D で、ホイールがページのスクロールを奪います。適切な対応はどれですか。',
      choices: [
        '最初は `enableZoom = false` にし、キャンバスが押されてから預かる',
        '常にズームを有効にする',
        'ホイールイベントを `preventDefault` する',
        '`OrbitControls` を使わない',
      ],
      answer: 0,
      explain:
        '地図サービスと同じ設計です。意思表示があってから操作を預けます。3D が主役（全画面ビューアー）なら最初から掴んでよく、本文の一部ならページのスクロールを優先します。',
    },
    {
      q: 'タッチで 1 本指のスワイプをページに渡したい。JavaScript の `touches` を設定しただけでは足りません。何が要りますか。',
      choices: [
        'CSS の `touch-action`（`pan-y` など）',
        '`preventDefault` の呼び出し',
        '`passive: false` の指定',
        'ビューポートの設定',
      ],
      answer: 0,
      explain:
        'ブラウザは JavaScript より先に `touch-action` でタッチの扱いを決めます。`none` のままだとページのスクロールは起きません。JavaScript と CSS の両方が要ります。',
    },
    {
      q: 'シーンを 10 回作り直すと画面が真っ黒になります。原因はどれですか。',
      choices: [
        '`renderer.dispose()` を呼んでおらず、WebGL コンテキストが枯渇している',
        'メモリリークでブラウザが落ちた',
        'シェーダのコンパイルに失敗した',
        'テクスチャの解像度が高すぎる',
      ],
      answer: 0,
      explain:
        'ブラウザが同時に持てる WebGL コンテキストは 8〜16 個ほどで、上限を超えると古いものから破棄されます。`renderer.info.memory` を作り直しの前後で出して、数が元に戻るかを確かめてください。',
    },
  ],
};
