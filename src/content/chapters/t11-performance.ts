import type { Chapter } from '../types.ts';

export const chapterT11: Chapter = {
  slug: 't11-performance',
  part: 'threejs',
  number: 41,
  title: '速くする ― まず、測る',
  goal: '重さの原因を CPU・GPU・メモリに切り分けられるようになり、「何ミリ秒削ればよいか」を数字で言えるようになります。',
  requires: ['w40-dispose', '13-random'],
  threeApis: [
    'WebGLRenderer.info',
    'WebGLRenderer.setPixelRatio',
    'Clock',
  ],
  mathRecall: [
    { slug: 'b11-distance', note: '予算も超過も、割り算と引き算だけ' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 「重い」は 3 つある

「重い」には主に $3$ つの原因があり、**対処法がまったく違います**。
当てずっぽうで直そうとすると、時間だけが溶けます。

- **CPU が忙しい** … 命令を送る回数（{{ドローコール}}）が多すぎる。**いちばん多い原因**
- **GPU が忙しい** … 画素あたりの計算が重い。大きな画面、透明の重ね、重いシェーダ
- **メモリが足りない** … テクスチャが大きすぎる、解放漏れ

**この $3$ つは、直し方に何の共通点もありません。**
ドローコールを $1000$ から $1$ に減らしても、原因が GPU 側なら $1$ ミリ秒も速くなりません。

だから最初にやるのは、**どれなのかを決めること**です。
`,
    },
    {
      kind: 'md',
      text: `
## 切り分けは、ウィンドウの大きさで

いちばん安上がりな実験がこれです。

**ウィンドウを半分の大きさにして、軽くなるかどうかを見る。**

- **軽くなった** → **GPU 側**。画素の数が効いている
- **変わらない** → **CPU 側**。ドローコールか、JavaScript そのもの

ウィンドウを縮めても、シーンの中身もドローコールも変わりません。
変わるのは**塗る画素の数だけ**です。だからこの $1$ 回で切り分けられます。

**シーンを何度も作り直すうちに重くなる**なら、
それは $3$ つ目 ― [](#/ch/w40-dispose)の解放漏れです。
`,
    },
    {
      kind: 'md',
      text: `
## 数字を見る ― renderer.info

\`renderer.info\` は、いま何が起きているかを教えてくれます。

- \`info.render.calls\` … $1$ フレームのドローコール数
- \`info.render.triangles\` … 三角形の数
- \`info.memory.geometries\` / \`.textures\` … GPU に載っている数

**まずこれを画面に出してください。数字を見ずに最適化を始めてはいけません。**

目安として、ドローコールが $100$ を超えたら気にしはじめ、
$1000$ を超えていたら確実に減らす価値があります。

**そして、フレーム時間を測ってください。** これが本命です。
`,
    },
    {
      kind: 'formula',
      tex: 't_{\\text{予算}} = \\frac{1000}{\\text{fps}} \\qquad \\Delta = t_{\\text{実測}} - t_{\\text{予算}}',
      readAloud:
        '目指す fps から、**$1$ フレームに使ってよいミリ秒**が決まります（$60$ fps なら $16.7$ ms）。実測との差 $\\Delta$ が、**削らなければならない量**です。',
      worked: {
        given:
          'フレーム時間を測ったら **$1$ フレーム $24$ ms** でした。いまは何 fps で、$60$ fps にするには何 ms 削る必要があるでしょうか。',
        steps: [
          { calc: 'いまの fps = 1000 / 24' },
          { calc: '            = 41.7 fps' },
          { calc: '60 fps の予算 = 1000 / 60' },
          { calc: '              = 16.7 ms' },
          { calc: 'Δ = 24 - 16.7 = 7.3 ms', note: '削るべき量' },
          { calc: '30 fps なら予算 33.3 ms' },
          { calc: '  33.3 - 24 = 9.3 ms 余る' },
        ],
        result:
          '**$41.7$ fps。$60$ fps にするには $7.3$ ms 削る必要があります。** ここが大事なところで、「速くする」という漠然とした話が、**$7.3$ ms という具体的な目標**に変わりました。何をどう削るかを決められるようになります ― たとえばポストプロセスが $5$ ms 使っているなら、それを外すだけで $7.3$ のうち $5$ が片づく。**逆に $0.2$ ms しか使っていないところをいくら磨いても、絶対に届きません。** なお $30$ fps でよいなら、いまのままで $9.3$ ms も余っています。**目標を決めずに測ると、いつまでも「もっと速く」が続きます。**',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'フレーム時間は fps より読みやすい',
      text: `
fps は割り算の結果なので、変化の大きさが直感に合いません。

120 fps → 60 fps は「半分」に見えますが、増えたのは 8.3 ms。
30 fps → 20 fps も「3 分の 1 減った」ですが、増えたのは 16.7 ms ― 倍です。

ミリ秒で見れば、足し算と引き算で扱えます。

「この効果は 3 ms」「影で 4 ms」と積み上げれば、
予算に収まるかどうかがその場で分かります。
`,
    },
    {
      kind: 'sandbox',
      title: '数字を出す ― 負荷を上げ下げして見る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 個別のメッシュを何個置くか。増やすとドローコールが増える
const COUNT = 600;

// 画素の数に効く。1 にすると GPU 側が一気に軽くなる
const PIXEL_RATIO = Math.min(window.devicePixelRatio, 2);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.Fog(0x0a0a12, 18, 46);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 7, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(PIXEL_RATIO);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2, 0);

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(6, 10, 6);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x241f2e, 1.1));

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 90),
  new THREE.MeshStandardMaterial({ color: 0x232840, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// わざと 1 個ずつ Mesh を作る。ドローコールが COUNT ぶん増える
const geo = new THREE.ConeGeometry(0.35, 1.5, 8);
const mat = new THREE.MeshStandardMaterial({ color: 0x4a7c59, roughness: 0.7 });

for (let i = 0; i < COUNT; i++) {
  const cone = new THREE.Mesh(geo, mat);
  const a = i * 2.399;                       // 黄金角でばらまく
  const r = Math.sqrt(i / COUNT) * 32;
  cone.position.set(Math.cos(a) * r, 0.75, Math.sin(a) * r);
  cone.rotation.y = a;
  scene.add(cone);
}

const readout = document.createElement('div');
readout.style.cssText =
  'position:fixed;left:12px;top:12px;padding:8px 12px;border-radius:8px;' +
  'background:rgba(10,10,18,.82);color:#e8e8f2;font:13px/1.7 monospace;' +
  'border:1px solid #3a3a5c;white-space:pre';
document.body.appendChild(readout);

// フレーム時間は 1 回だけ測ってもばらつく。ならして見る
let avg = 0;
let last = performance.now();

renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = now - last;
  last = now;
  avg = avg === 0 ? dt : avg * 0.92 + dt * 0.08;

  controls.update();
  renderer.render(scene, camera);

  const r = renderer.info.render;
  const budget = 1000 / 60;
  readout.textContent =
    'フレーム   ' + avg.toFixed(1) + ' ms  (' + (1000 / avg).toFixed(0) + ' fps)\\n' +
    '60fps の予算 ' + budget.toFixed(1) + ' ms  差 ' + (avg - budget).toFixed(1) + ' ms\\n' +
    'ドローコール ' + r.calls + '\\n' +
    '三角形       ' + r.triangles.toLocaleString() + '\\n' +
    '画素比       ' + renderer.getPixelRatio();
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**まず「全画面」で開いて、ウィンドウの大きさを変えてみてください。** フレーム時間が変われば GPU 側、変わらなければ CPU 側です。そのあと `COUNT` を $600 \\to 60$ にすると**ドローコールだけ**が減り、`PIXEL_RATIO` を $1$ にすると**画素だけ**が減ります。**どちらが効いたかを、数字で確かめてから直してください。**',
    },
    {
      kind: 'md',
      text: `
## 平均だけを見ない

フレーム時間の**平均が $14$ ms でも、体験は良くない**ことがあります。

$100$ フレームのうち $95$ が $10$ ms、$5$ が $90$ ms だと、平均は $14$ ms。
けれど画面は $1$ 秒に $3$ 回、はっきり引っかかります。

**人が「重い」と感じるのは、平均ではなく引っかかりのほうです。**

引っかかりの原因は、たいてい**毎フレームやらなくてよいこと**です。

- ジオメトリやテクスチャを、そのフレームで初めて作った
- シェーダのコンパイルが走った（そのマテリアルを初めて描いた）
- ガベージコレクタが動いた（毎フレーム \`new\` していませんか）

**最初の $2$ つは、始まる前に一度描いておけば消えます。**
画面の外で $1$ フレーム描く、あるいは \`renderer.compile(scene, camera)\` を呼びます。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '毎フレーム new しない',
      text: `
描画ループの中で new THREE.Vector3() と書くと、
60 fps で毎秒 60 個、10 か所あれば 600 個のごみが生まれます。

すぐには問題になりません。
ガベージコレクタがまとめて掃除するとき、数ミリ秒止まります。

これが「ときどき引っかかる」の正体です。

使い回す変数をループの外に 1 つ作ってください。
three 自身が Vector3 を引数に取る書き方（getSize(v) など）をしているのは、
同じ理由です。
`,
    },
    {
      kind: 'md',
      text: `
## 手をつける順番

効果が大きい順に並べると、たいていこうなります。

1. **モデルとテクスチャを軽くする** … [](#/ch/w37-asset-cost)。読み込み時間にも効く
2. **ドローコールをまとめる** … 次の $2$ 章
3. **画素の数を減らす** … ピクセル比・影・ポストプロセス
4. **シェーダを削る**

**ただし、この順番は「よくある場合」でしかありません。**
測った結果が違うことを言っているなら、**測ったほうが正しい。**

そして最後にもう一度。**必ず数字を見てから始めてください。**
思い込みで直したところは、たいてい原因ではありません。
`,
    },
  ],
  exercises: [
    {
      prompt: `フレーム時間を測ったら **$38$ ms** でした。

1. いまは何 fps ですか。
2. $60$ fps にするには何 ms 削る必要がありますか。
3. $30$ fps でよいなら、何 ms 削ればよいですか。`,
      hint: '$t_{\\text{予算}} = 1000 / \\text{fps}$、$\\Delta = t_{\\text{実測}} - t_{\\text{予算}}$。',
      answer: `**1. $26.3$ fps　2. $21.3$ ms　3. $4.7$ ms**

**1 ― いまの fps**

$\\dfrac{1000}{38} = 26.3$ fps

**2 ― $60$ fps を目指す**

予算は $\\dfrac{1000}{60} = 16.7$ ms

$\\Delta = 38 - 16.7 = 21.3$ ms

**いまの半分以上を削る必要があります。**

**3 ― $30$ fps でよいなら**

予算は $\\dfrac{1000}{30} = 33.3$ ms

$\\Delta = 38 - 33.3 = 4.7$ ms

**$21.3$ と $4.7$ では、やることがまったく違います。**

**なぜ目標を先に決めるのか**

$4.7$ ms なら、ピクセル比を下げるか影の解像度を落とすだけで届きます ― **$30$ 分の作業**です。

$21.3$ ms は、**作り方を変えないと届きません。**
ドローコールをまとめ、ポストプロセスを外し、シェーダを削る ― **数日の作業**です。

**目標を決めずに測ると、いつまでも「もっと速く」が続きます。**

**どちらを目指すべきか**

作品の性質で決めてください。

- **視点をぐりぐり動かすもの** … $60$ fps。動かすと差がはっきり見える
- **ゆっくり眺めるもの・見るだけのもの** … $30$ fps で十分なことが多い
- **VR** … $72$ 〜 $90$ fps。ここは妥協できません

**そして、スマートフォンで測ってください。**
手元の PC で $60$ fps でも、スマートフォンでは $3$ 分の $1$ ということがふつうにあります。`,
    },
    {
      prompt: `次の $3$ つの計測結果から、それぞれ**原因はどちら側**か、**次に何をするか**を答えてください。

**A.** ウィンドウを半分にしても $24$ ms のまま。ドローコール $1{,}840$
**B.** ウィンドウを半分にしたら $22$ ms → $9$ ms。ドローコール $37$
**C.** 開いた直後は $12$ ms。画面を $10$ 回行き来したあと $40$ ms。ドローコールは変わらず $37$`,
      hint: 'ウィンドウの大きさで変わるのは、何の数ですか。',
      answer: `**A は CPU 側、B は GPU 側、C はメモリの解放漏れです。**

**A ― CPU 側（ドローコール）**

ウィンドウを縮めても変わらない ＝ **画素の数は関係ない。**

ドローコール $1{,}840$ は明らかに多すぎます。
$1$ 回あたりの準備の費用が積み上がって CPU を食い切っています。

**次にやること**: 同じ形・同じ材質のものを \`InstancedMesh\` でまとめる。
動かないものは \`mergeGeometries\` で合体させる。**次の $2$ 章の話です。**

**B ― GPU 側（画素）**

画素の数が $\\frac{1}{4}$（縦横それぞれ半分）になって $22 \\to 9$ ms。

ドローコール $37$ は少ないので、CPU 側は問題ありません。

**次にやること**: ピクセル比を下げる、透明の重ねを減らす、
影の解像度と範囲を見直す、ポストプロセスを疑う。

**C ― 解放漏れ**

**開いた直後は速い**のが決定的です。シーンの中身は同じ（ドローコール $37$）なのに、
行き来した回数だけ遅くなっている。

**次にやること**: \`renderer.info.memory\` を出して、
画面を切り替える前後で数字が戻るか確かめる。
戻らなければ [](#/ch/w40-dispose)の \`dispose\` 漏れです。

**この $3$ つを取り違えると、何日も無駄になります**

A に対してピクセル比を下げても $1$ ミリ秒も変わりません。
B に対して \`InstancedMesh\` を導入しても、同じく変わりません。

そして C は、**どちらの手当てをしても直りません。**
測り直すたびに数字が違うので、「直った気がする」を繰り返すことになります。

**ウィンドウを縮める。$5$ 秒で終わる実験です。**`,
    },
    {
      prompt: `フレーム時間の**平均が $14$ ms**なのに、「かくつく」と言われました。
測り直すと、$100$ フレームのうち $95$ が $10$ ms、$5$ が **$90$ ms** です。

1. 平均が $14$ ms になることを確かめてください。
2. **何が起きていると考えられますか。** $3$ つ挙げてください。`,
      hint: '$90$ ms かかったフレームは、他のフレームと何が違いますか。',
      answer: `**1. 確かに $14$ ms。2. 作りかけの生成・シェーダのコンパイル・ガベージコレクタです。**

**1 ― 平均の確認**

$\\dfrac{95 \\times 10 + 5 \\times 90}{100} = \\dfrac{950 + 450}{100} = \\dfrac{1400}{100} = 14$ ms

**平均は「$60$ fps の予算 $16.7$ ms 以内」に収まっています。**
数字だけ見れば合格です。

**それでも、$1$ 秒間に約 $3$ 回**（$60$ フレーム中 $3$ フレーム）、
**$90$ ms ＝ $0$.$1$ 秒近く止まります。** 目にははっきり見えます。

**人が「重い」と感じるのは、平均ではなく引っかかりのほうです。**

**2 ― 原因の候補**

**a. そのフレームで初めて何かを作った**

ジオメトリやテクスチャを描画ループの中で生成していませんか。
GPU への転送はその場で起きるので、大きなテクスチャなら $10$ ms 単位でかかります。

**b. シェーダのコンパイルが走った**

three はマテリアルを**初めて描くとき**にシェーダをコンパイルします。
新しいマテリアルが画面に入った瞬間、そのフレームだけ跳ねます。

**始まる前に \`renderer.compile(scene, camera)\` を呼ぶ**か、
画面の外で $1$ フレーム描いておけば消えます。

**c. ガベージコレクタ**

描画ループの中で \`new THREE.Vector3()\` を書いていませんか。
$60$ fps で $10$ か所なら毎秒 $600$ 個のごみが生まれ、
たまったところで掃除が走ります ― **数ミリ秒、JavaScript が止まります。**

使い回す変数をループの外に作ってください。

**見つけ方**

フレーム時間を**配列にためて、最悪値と上位 $5\\%$ を出してください。**

平均だけを表示していると、この問題は永遠に見えません。
`,
      answerCode: `const times = [];
let last = performance.now();

renderer.setAnimationLoop(() => {
  const now = performance.now();
  times.push(now - last);
  last = now;
  if (times.length > 240) times.shift();

  renderer.render(scene, camera);

  // 平均だけでなく、悪いほうも見る
  const sorted = [...times].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  readout.textContent =
    '平均 ' + (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) + ' ms\\n' +
    '上位 5% ' + p95.toFixed(1) + ' ms\\n' +
    '最悪 ' + sorted[sorted.length - 1].toFixed(1) + ' ms';
});`,
    },
  ],
  quiz: [
    {
      q: 'ウィンドウを小さくすると軽くなります。原因はどちら側にありますか。',
      choices: [
        'GPU 側（画素あたりの計算が重い）',
        'CPU 側（ドローコールが多い）',
        'メモリ不足',
        'ネットワーク',
      ],
      answer: 0,
      explain:
        '画素の数が減って軽くなったということは、画素あたりの処理が効いています。ピクセル比・透明の重ね・ポストプロセス・影を疑ってください。ドローコールが原因なら、大きさを変えても変わりません。',
    },
    {
      q: 'フレーム時間が 24 ms でした。60 fps にするには何 ms 削りますか。',
      choices: ['7.3 ms', '24 ms', '16.7 ms', '41.7 ms'],
      answer: 0,
      explain:
        '60 fps の予算は 1000 / 60 = 16.7 ms。24 − 16.7 = 7.3 ms です。「速くする」を「7.3 ms 削る」に変えると、どこに手をつけるかを数字で決められます。',
    },
    {
      q: 'フレーム時間の平均は 14 ms なのに、かくついて見えます。まず何を疑いますか。',
      choices: [
        '数フレームだけ極端に遅い（生成・シェーダのコンパイル・GC）',
        'ドローコールが多い',
        'テクスチャが大きい',
        'モニタのリフレッシュレート',
      ],
      answer: 0,
      explain:
        '95 フレームが 10 ms、5 フレームが 90 ms でも平均は 14 ms です。平均だけを表示していると永遠に見えません。上位 5% と最悪値を出してください。',
    },
  ],
};
