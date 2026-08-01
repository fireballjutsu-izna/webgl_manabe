import type { Chapter } from '../types.ts';

export const chapterW36: Chapter = {
  slug: 'w36-loading-ui',
  part: 'threejs',
  number: 36,
  title: '読み込み中を、どう見せるか',
  goal: 'LoadingManager でまとめて進み具合を数えられるようになり、進捗の表示がなぜ嘘になるのかを説明できるようになります。',
  requires: ['w35-fit-model'],
  mathRecall: [
    { slug: 'b11-distance', note: '進捗も「いま何割か」を測る割り算' },
  ],
  threeApis: [
    'LoadingManager',
    'TextureLoader',
    'GLTFLoader',
    'FileLoader',
    'Loader.manager',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 待たせるなら、待っていると分かるように

読み込みに $3$ 秒かかるページを、何も出さずに開いたらどうなるでしょう。

$3$ 秒間、真っ黒です。

**壊れているのか、待てばいいのか、読者には区別がつきません。**
そして、たいていの人は待ちません。

必要なのは $3$ つだけです。

- **始まったことが分かる** … 何か動いているものを出す
- **どのくらい進んだか分かる** … 進捗
- **終わったことが分かる** … 表示を消して、シーンを見せる

**進捗の数字が正確である必要は、実はありません。**
「動いている」ことのほうがずっと大事です ― 止まって見えた瞬間に、人は閉じます。
`,
    },
    {
      kind: 'md',
      text: `
## LoadingManager ― まとめて数える

ローダーを $1$ つずつ数えるのは面倒です。
\`LoadingManager\` に**すべてのローダーを登録すれば**、まとめて数えてくれます。

やることは $1$ つ。**ローダーの引数にマネージャを渡す**だけです。

\`new GLTFLoader(manager)\`、\`new THREE.TextureLoader(manager)\`。

以後、そのローダーが何かを読むたびにマネージャへ報告が上がります。
\`GLTFLoader\` はテクスチャも中で読むので、**そこも自動で数に入ります。**
`,
    },
    {
      kind: 'code',
      title: 'LoadingManager の 4 つの口',
      code: `import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const manager = new THREE.LoadingManager();

manager.onStart = (url, loaded, total) => {
  overlay.hidden = false;
};

manager.onProgress = (url, loaded, total) => {
  // loaded / total は「ファイルの数」。バイト数ではない
  bar.style.width = (loaded / total) * 100 + '%';
  label.textContent = loaded + ' / ' + total;
};

manager.onLoad = () => {
  // 全部そろった。ここで初めて見せる
  overlay.hidden = true;
};

manager.onError = (url) => {
  console.error('失敗:', url);
  // onLoad はこのあとも呼ばれる。失敗しても止まらない
};

// すべてのローダーに、同じマネージャを渡す
const gltfLoader = new GLTFLoader(manager);
const textureLoader = new THREE.TextureLoader(manager);

// 何も渡さなかったローダーは THREE.DefaultLoadingManager に登録される
// （そちらに onLoad を付けても動く）`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '失敗しても onLoad は呼ばれる',
      text: `
onError が呼ばれたあとも、残りが終われば onLoad が来ます。

つまり「読み込み画面は消えたが、モデルが 1 つ足りない」という状態が
ふつうに起こります。

失敗を覚えておく変数を 1 つ持ち、onLoad の中で確かめてください。
何も無いよりは、代わりの箱を置いて「読めませんでした」と出すほうが親切です。

黙って足りないのが、いちばん困ります。
`,
    },
    {
      kind: 'md',
      text: `
## 進捗は、嘘をつく

\`manager.onProgress(url, loaded, total)\` の $2$ つの数は、
**ファイルの「数」**です。**大きさではありません。**

$4$ つのファイルのうち $3$ つ読み終われば $75\\%$ と出ます ―
たとえ残り $1$ つが全体の $99\\%$ を占めていても。

これが「$75\\%$ から動かない」の正体です。
`,
    },
    {
      kind: 'formula',
      tex: 'p_{\\text{数}} = \\frac{n}{N}, \\qquad p_{\\text{量}} = \\frac{\\sum_{i \\le n} B_i}{\\sum_{i} B_i}',
      readAloud:
        '$p_{\\text{数}}$ は「読み終わったファイルの数 $n$ を、全部の数 $N$ で割ったもの」。$p_{\\text{量}}$ は「読み終わったバイト数の合計を、全部のバイト数で割ったもの」です。**LoadingManager が教えてくれるのは前者だけ**で、大きさがそろっていないと大きく食い違います。',
      worked: {
        given:
          '$4$ つのファイルを読みます。大きさは **$10$ KB、$20$ KB、$30$ KB、$5{,}000$ KB**。小さいものから順に届いたとして、**$3$ つ目が終わった時点**の進捗を、両方の数え方で求めます。',
        steps: [
          { calc: 'p数 = 3 / 4 = 0.75', note: 'ファイルの数で数えると' },
          { calc: '全体 = 10 + 20 + 30 + 5,000' },
          { calc: '     = 5,060 KB' },
          { calc: '読めた = 10 + 20 + 30 = 60 KB' },
          { calc: 'p量 = 60 / 5,060 = 0.0119' },
          { calc: '差 = 0.75 - 0.0119 = 0.738' },
        ],
        result:
          '**ファイル数では $75\\%$、実際に届いたのは $1.2\\%$。** $74$ ポイントの開きです。画面には「$75\\%$」と出たまま、残り $98.8\\%$ ぶんの時間を待たされます。**これが「進捗バーが $75\\%$ で止まる」の正体**で、バグではありません ― **数えているものが違う**だけです。回線が $1$ MB/s なら、$75\\%$ の表示のまま**$5$ 秒**待つことになります。直したいなら、**各ファイルの大きさをあらかじめ書いておいて、バイトで重み付けする**しかありません。',
      },
    },
    {
      kind: 'sandbox',
      title: '2 つの進捗を、並べて見る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// サンドボックスからは外部ファイルを取りに行けないので、
// 読み込みの時間だけを setTimeout で真似ています。数え方の話はそのまま同じです。
const FILES = [
  { name: 'ui.png', kb: 10 },
  { name: 'floor.jpg', kb: 20 },
  { name: 'sky.jpg', kb: 30 },
  { name: 'robot.glb', kb: 5000 },
];
const KB_PER_SEC = 1400;          // 回線の速さのつもり

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(3, 5, 4);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.8));
scene.add(new THREE.GridHelper(12, 12, 0x3a3a5c, 0x26263c));

const contents = new THREE.Group();
contents.visible = false;
scene.add(contents);
for (let i = 0; i < 4; i++) {
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.6, 1),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(i * 0.16, 0.65, 0.55), roughness: 0.4, flatShading: true,
    }),
  );
  mesh.position.set((i - 1.5) * 1.7, 0.9, 0);
  contents.add(mesh);
}

// ===== 読み込み画面 =====
const overlay = document.createElement('div');
overlay.style.cssText =
  'position:fixed;inset:0;display:flex;flex-direction:column;gap:14px;' +
  'align-items:center;justify-content:center;background:#0a0a12;' +
  'color:#e8e8f2;font:14px/1.8 monospace';
document.body.appendChild(overlay);

function makeBar(title, color) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'width:min(74vw,360px)';
  const label = document.createElement('div');
  label.textContent = title;
  const track = document.createElement('div');
  track.style.cssText = 'height:10px;border-radius:5px;background:#26263c;overflow:hidden';
  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;width:0%;background:' + color + ';transition:width .12s linear';
  track.appendChild(fill);
  wrap.append(label, track);
  overlay.appendChild(wrap);
  return { label, fill, title };
}

const byCount = makeBar('ファイルの数で数える', '#ff6b8a');
const byBytes = makeBar('バイトで数える', '#7cf5a0');
const now = document.createElement('div');
now.style.color = '#9a9ab0';
overlay.appendChild(now);

function draw(bar, p) {
  bar.fill.style.width = (p * 100).toFixed(1) + '%';
  bar.label.textContent = bar.title + '  ' + (p * 100).toFixed(1) + '%';
}

// ===== 読み込みを真似る =====
const totalKb = FILES.reduce((sum, f) => sum + f.kb, 0);
let doneCount = 0;
let doneKb = 0;

function loadOne(file) {
  return new Promise((resolve) => {
    const ms = (file.kb / KB_PER_SEC) * 1000;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / ms, 1);
      draw(byCount, doneCount / FILES.length);
      draw(byBytes, (doneKb + file.kb * t) / totalKb);
      now.textContent = file.name + ' (' + file.kb + ' KB)';
      if (t < 1) requestAnimationFrame(tick);
      else {
        doneCount++;
        doneKb += file.kb;
        draw(byCount, doneCount / FILES.length);
        resolve();
      }
    };
    tick();
  });
}

(async () => {
  for (const file of FILES) await loadOne(file);
  overlay.remove();
  contents.visible = true;
})();

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
        '**上の赤いバーが `LoadingManager` の数え方**（ファイルの数）、**下の緑がバイトの数え方**です。最初の $3$ つは一瞬で終わって赤が $75\\%$ まで飛び、そこから緑がじりじり進むあいだ、**赤は止まったまま**です。「やり直す」を押せば何度でも見られます。',
    },
    {
      kind: 'md',
      text: `
## バイトで数えたいなら

\`LoadingManager\` はバイトを知りません。数えたいなら、自分で用意します。

**大きさをあらかじめ書いておく**のがいちばん確実です。
ビルドのときにファイルサイズを書き出して、\`assets.json\` のような表にしておく。

個々のローダーの \`onProgress\` にはバイト数が来ますが、**当てになりません。**

\`progress.lengthComputable\` が \`false\` のとき、\`progress.total\` は $0$ です。
サーバが \`Content-Length\` を返していない（gzip で送っているなど）と、こうなります。
**必ず \`lengthComputable\` を確かめてから使ってください。**
`,
    },
    {
      kind: 'code',
      title: '大きさを知っているなら、重み付けできる',
      code: `// ビルド時に書き出しておいた表
const SIZES = { '/models/robot.glb': 5_120_000, '/tex/floor.jpg': 20_480 };
const totalBytes = Object.values(SIZES).reduce((a, b) => a + b, 0);

const loadedBytes = new Map();

function onFileProgress(url, event) {
  // Content-Length が無いと total は 0 になる。そのときは表の値を使う
  const total = event.lengthComputable ? event.total : (SIZES[url] ?? 0);
  const loaded = total > 0 ? Math.min(event.loaded, total) : 0;
  loadedBytes.set(url, loaded);

  let sum = 0;
  for (const v of loadedBytes.values()) sum += v;
  bar.style.width = (sum / totalBytes) * 100 + '%';
}

const loader = new GLTFLoader(manager);
loader.load(url, onDone, (event) => onFileProgress(url, event));`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '一瞬で終わるときは、出さない',
      text: `
キャッシュが効いていれば、読み込みは 30 ミリ秒で終わります。

そこで読み込み画面を出すと、ぱっと光ってすぐ消える ―
何が起きたのか分からず、ちらついただけに見えます。

200 ミリ秒たっても終わらなかったら出す、という遅らせ方が定番です。
setTimeout を 1 つ置き、それより早く終わったらキャンセルするだけです。

逆に、いったん出したら最低 400 ミリ秒は残してください。
出た瞬間に消えるのも、同じくちらつきです。
`,
    },
    {
      kind: 'md',
      text: `
## 全部そろうまで待つか、出せるものから出すか

**A. そろってから見せる**

\`manager.onLoad\` で読み込み画面を消し、完成した状態だけを見せます。

作品として見せたいときは、こちらです。
**中途半端な姿を見せない**ぶん、印象がよくなります。

**B. 届いたものから出す**

地形が届いたら地形を出し、木が届いたら木を足していく。

待ち時間の体感が短くなり、**大きなシーンではこちらが優勢**です。
ただし、順番を設計しないと「主役が最後に出てくる」ことになります。

**優先順位を決めてください。**
$1$ 番目は必ず**カメラの前にあるもの**、遠景と装飾は後回し。
それだけで、体感はずいぶん変わります。

**C. 軽い代役を先に出す**

低解像度のテクスチャや簡素な形を先に読み、届いたら差し替える。
手間はかかりますが、**$1$ 秒目から何かが見えている**のは強い。
`,
    },
  ],
  exercises: [
    {
      prompt: `$5$ つのファイルを読みます。大きさは $40$ KB、$60$ KB、$100$ KB、$800$ KB、$3{,}000$ KB。
小さいものから順に届きます。

**$4$ つ目が終わった時点**で、
（1）\`LoadingManager\` は何 $\\%$ と表示しますか。
（2）実際には何 $\\%$ 届いていますか。`,
      hint: 'マネージャが数えているのは、ファイルの「数」です。',
      answer: `**（1）$80\\%$、（2）$25\\%$ です。**

**（1）ファイルの数**

$p_{\\text{数}} = \\dfrac{4}{5} = 0.8$ ― **$80\\%$**

**（2）バイト**

全体を足します。

$40 + 60 + 100 + 800 + 3{,}000 = 4{,}000$ KB

$4$ つ目までの合計は

$40 + 60 + 100 + 800 = 1{,}000$ KB

$p_{\\text{量}} = \\dfrac{1{,}000}{4{,}000} = 0.25$ ― **$25\\%$**

**差は $55$ ポイント。**

**何が起きて見えるか**

バーは $80\\%$ まですいすい進み、そこで**止まります。**

残り $3{,}000$ KB は全体の $75\\%$ です。
回線が $1$ MB/s なら、$80\\%$ の表示のまま**約 $3$ 秒**待たされます。

**読者から見れば、フリーズです。**

**どう直すか**

$2$ つあります。

**a. バイトで重み付けする** … 各ファイルの大きさを表にしておき、
自分で $p_{\\text{量}}$ を計算します。正確ですが、表の保守が要ります。

**b. そもそも数字を出さない** … 動いていることだけを見せます。
くるくる回るものか、行き来するバーで十分です。

**b が有効なのは、$80\\%$ で止まったバーは「壊れている」に見えるからです。**
不正確な数字より、数字が無いほうが良い ―
**進捗表示の目的は「動いている」と伝えることであって、測ることではありません。**`,
    },
    {
      prompt: `\`manager.onLoad\` で読み込み画面を消す作りにしました。
ところが**モデルが $1$ つ $404$ で読めなかったとき**、読み込み画面は消えます。

何が起きますか。どう手当てしますか。`,
      hint: '`onError` が呼ばれたあと、`onLoad` は呼ばれますか。',
      answer: `**読み込み画面は消え、そこにあるはずのものが黙って無いままになります。**

**なぜ**

\`LoadingManager\` は、失敗したものも「終わった」と数えます。
だから \`onError\` が呼ばれたあとでも、残りが終われば \`onLoad\` が来ます。

これは仕様として妥当です ― $1$ つ失敗しただけで永久に読み込み画面が残るほうが困ります。

**何が困るか**

**エラーがコンソールにしか出ません。** 画面上は正常に見える。

「なんか主人公がいないんですけど」という報告が来て、
再現しようとすると自分の環境ではキャッシュが効いていて出ない ―
いちばん厄介な形の不具合です。

**手当て**

失敗を覚えておいて、\`onLoad\` の中で確かめます。

必須のものが欠けているなら、**黙って進まない。**
代わりの箱でもよいので、何か置いてください。

**「読み込めなかった」と画面に出すこと**が、いちばん親切です。
何も無いより、赤い箱が置いてあって「robot.glb が読めませんでした」と
書いてあるほうが、原因にたどり着けます。

**必須かどうかを分けておく**

装飾の $1$ つが欠けても進んでよいものと、
主役が欠けたら進めないものは違います。

\`required: true\` の印を付けておき、必須のものが失敗したときだけ
止めて知らせる ― この区別があると、運用が楽になります。`,
      answerCode: `const failed = [];

manager.onError = (url) => {
  failed.push(url);
  console.error('読み込めませんでした:', url);
};

manager.onLoad = () => {
  overlay.hidden = true;

  if (failed.length > 0) {
    banner.textContent = failed.length + ' 個のファイルが読み込めませんでした';
    banner.hidden = false;

    // 必須のものが欠けたなら、代役を置く
    for (const url of failed) {
      if (REQUIRED.has(url)) scene.add(makePlaceholder(url));
    }
  }
};`,
    },
    {
      prompt: `キャッシュが効いている $2$ 回目以降、読み込みが $30$ ミリ秒で終わります。
読み込み画面が**ぱっと光ってすぐ消え**、ちらついて見えます。

$2$ つの手当てを、それぞれ何ミリ秒で組むか決めて書いてください。`,
      hint: '「出すのを遅らせる」と「出したら残す」の 2 つです。',
      answer: `**出すのを $200$ ミリ秒遅らせ、いったん出したら $400$ ミリ秒は残します。**

**手当て 1 ― 出すのを遅らせる**

読み込みを始めた瞬間には出しません。
\`setTimeout\` で $200$ ミリ秒後に出す予約をし、
それより早く終わったら**予約を取り消します。**

$30$ ミリ秒で終わるなら、読み込み画面は**一度も出ません。** これが正解です。

**なぜ $200$ ミリ秒か**

人が「待たされた」と感じ始めるのがおよそ $0.1$〜$0.2$ 秒だからです。
それ以下なら、待っている自覚がありません ―
そこに画面を出すのは、無い問題を知らせているのと同じです。

**手当て 2 ― いったん出したら、残す**

$210$ ミリ秒で終わった場合、$200$ ミリ秒で出た画面が $10$ ミリ秒で消えます。
これも同じちらつきです。

出した時刻を覚えておき、**$400$ ミリ秒たつまでは消しません。**

**なぜ $400$ ミリ秒か**

出たものを認識して読み取るのに、それくらいかかるからです。
それより短いと「何か光った」しか残りません。

**組み合わせると**

- $30$ ミリ秒で完了 … 何も出ない
- $210$ ミリ秒で完了 … $200$ で出て、$600$ で消える
- $3$ 秒で完了 … $200$ で出て、$3$ 秒で消える

**どの場合でも、ちらつきません。**

**この考え方は three に限りません。** 読み込み表示のある画面すべてで同じです。
数字は $200$/$400$ でなくてもよいので、**「遅らせる」と「残す」を対で入れる**ことだけ覚えてください。`,
      answerCode: `let shownAt = 0;
let timer = setTimeout(() => {
  overlay.hidden = false;
  shownAt = performance.now();
}, 200);

manager.onLoad = () => {
  clearTimeout(timer);              // まだ出ていなければ、出さずに済む

  if (shownAt === 0) return;        // 一度も出ていない
  const shownFor = performance.now() - shownAt;
  const wait = Math.max(0, 400 - shownFor);
  setTimeout(() => { overlay.hidden = true; }, wait);
};`,
    },
  ],
  quiz: [
    {
      q: '`manager.onProgress(url, loaded, total)` の `loaded` と `total` は、何を数えていますか。',
      choices: [
        'ファイルの数',
        '受信したバイト数',
        '経過時間',
        '三角形の数',
      ],
      answer: 0,
      explain:
        'ファイルの数です。だから 4 つのうち 3 つ読めば 75% と出ます ― 残り 1 つが全体の 99% を占めていても。「進捗バーが止まる」の正体はこれで、バグではありません。',
    },
    {
      q: 'モデルが 1 つ 404 で読めませんでした。`manager.onLoad` はどうなりますか。',
      choices: [
        '残りが終われば呼ばれる。失敗しても止まらない',
        '呼ばれない',
        '例外が投げられる',
        '`onError` のあと、もう一度読み直す',
      ],
      answer: 0,
      explain:
        '読み込み画面は消えて、そこにあるはずのものが黙って無いままになります。失敗を覚えておいて `onLoad` の中で確かめ、代役を置くか知らせてください。',
    },
    {
      q: 'キャッシュが効いて 30 ミリ秒で読み込みが終わり、読み込み画面がちらつきます。どうしますか。',
      choices: [
        '出すのを 200 ミリ秒ほど遅らせ、早く終わったら出さない',
        '読み込み画面をやめる',
        'わざと待たせる',
        '`onProgress` を使わない',
      ],
      answer: 0,
      explain:
        '`setTimeout` で予約し、それより早く終わったら取り消すだけです。あわせて「いったん出したら 400 ミリ秒は残す」も対で入れてください。出た瞬間に消えるのも、同じちらつきです。',
    },
  ],
};
