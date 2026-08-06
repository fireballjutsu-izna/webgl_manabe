import type { Chapter } from '../types.ts';

export const chapterX21: Chapter = {
  slug: 'x21-seeded-random',
  part: 'project',
  number: 21,
  title: '決め打ちの乱数 ― 同じ種から、同じ街',
  goal: '種を渡せば必ず同じ結果が出る乱数を持てるようになり、用途ごとに列を分ける理由を、実際に壊れる例から説明できるようになります。',
  requires: ['p05-city-layout', 'b39-seed', 'x06-value-noise'],
  threeApis: ['MathUtils.seededRandom'],
  mathRecall: [
    { slug: 'b39-seed', note: '同じ種から、同じばらつきを再現する' },
    { slug: 'b40-distribution', note: '一様かどうかは、数えて確かめる' },
    { slug: 'x06-value-noise', note: '$\\mathrm{Math.imul}$ が要る理由は、ここでやった' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## Math.random() を、そのまま使わない

手続き的に何かを生成するとき、\`Math.random()\` をそのまま使うのは事故です。
理由は $3$ つあり、どれも実際に困ります。

- **さっきの街が二度と出ない。** 「あの配置が良かった」と思っても戻れません
- **不具合を再現できない。** 「たまに建物が道路に食い込む」を追えません
- **見せられない。** 同じ URL を開いた人に、同じものが見えません

$3$ つめが決定的です。**手続き的生成の作品は、種を共有できて初めて作品になります。**

必要なのは「**種を渡したら、必ず同じ並びを返す乱数**」です。
$8$ 行で書けます。
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
      title: '中身は追わなくてかまいません',
      text: `
掛け算と排他的論理和で値をよく散らばらせているだけです。
\`Math.imul\` が要る理由は[](#/ch/x06-value-noise)でやったとおり ―
ふつうの掛け算では、ハッシュが宿っている下位のビットが消えてしまうからです。

**性質だけ覚えてください。**

- 同じ種 → 必ず同じ並び
- 種を $1$ 増やすと、**まったく別の並び**（種 $1$ の最初は $0.6271$、種 $2$ は $0.7343$）
- 速い（\`Math.random()\` と同程度）
- 状態は $32$ ビット $1$ つだけ。$4$ バイトで持ち歩ける

「暗号には使えない」という注意書きが付きますが、街を作るぶんには何の問題もありません。
`,
    },
    {
      kind: 'md',
      text: `
## ちゃんと一様か、数えて確かめる

自分で乱数を持つなら、**偏っていないことを一度は確かめて**おきます。
やり方は[](#/ch/b40-distribution)でやったとおり、たくさん引いて数えるだけです。

ただし「平均が $0.5$ に近い」だけでは足りません。
**どれだけ近ければ合格なのか**を先に決める必要があります。
`,
    },
    {
      kind: 'formula',
      tex: '\\sigma_{\\bar{x}} \\;=\\; \\dfrac{1}{\\sqrt{12\\,n}}',
      readAloud:
        '$0$〜$1$ の一様な乱数を $n$ 回引いたとき、その平均が $0.5$ からどれくらいばらつくか、という式です。一様分布の標準偏差 $1/\\sqrt{12}$ を $\\sqrt{n}$ で割ったもので、$n$ が増えるほど $0.5$ に張りつきます。',
      worked: {
        given: 'mulberry32 に種 $20260730$ を与えて $200$ 万回引き、平均と $10$ 分割の度数を数えました。',
        steps: [
          { calc: '合格の目安 : 1 / ルート(12 x 2000000)' },
          { calc: '           = 1 / 4898.98 = 0.000204' },
          { calc: '実測の平均 = 0.499894' },
          { calc: '0.5 からのずれ = 0.000106' },
          { calc: '0.000106 / 0.000204 = 0.52', note: '目安の半分。合格' },
          { calc: '10 分割の度数（各 10% が期待値）' },
          { calc: '  9.99 10.00 10.02 9.98 10.03' },
          { calc: '  10.00 10.02 9.97 10.00 9.99', note: 'ずれは最大 0.03 ポイント' },
        ],
        result:
          '**平均のずれは $0.000106$ で、目安の $\\sigma$ の $0.52$ 倍**でした。$1\\sigma$ の中に入っているので、偏っているとは言えません。度数も $10$ 個すべてが $9.97$〜$10.03\\%$ に収まっています。**「$0.5$ に近い」ではなく「$\\sigma$ の何倍か」で言えるようになると、合格・不合格を自分で決められます。** $n$ を $100$ 倍にすれば目安は $10$ 分の $1$ になるので、より厳しく検査できます。',
      },
    },
    {
      kind: 'md',
      text: `
## ここからが本題 ― 順番が結果を決めている

決め打ちの乱数には、$1$ つだけ危険な性質があります。

**「何回目に引いたか」が、値を決めています。**

つまり、**途中に $1$ 回でも引く場所を足すと、それ以降の値が全部ずれます。**

街づくりでこれが起きると、こうなります。

- 建物の色を決めるのに、乱数をもう $1$ 回引くようにした
- **街路がまるごと変わった**
- 色を触ったつもりが、街の形が変わっている

**種は同じなのに、同じ街が出てこない。**
決め打ちにした意味が、ここで消えます。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '「同じ種 = 同じ結果」が保証するのは、コードが同じときだけ',
      text: `
決め打ちの乱数が保証しているのは、正確にはこうです。

**「同じ種」と「同じ引く順番」から、同じ並びが出る。**

$2$ つめの条件を見落とすと、次のような不具合になります。

- 昨日のスクリーンショットと同じ街が出せない
- 「種 $42$ の街の、あの角が変です」という報告が再現しない
- 機能を $1$ つ足したら、**過去に作った街が全部変わる**

保存した種は、**コードのその時点のバージョンとセット**でしか意味を持ちません。

**直し方は、列を分けることです。**
`,
    },
    {
      kind: 'md',
      text: `
## 用途ごとに、別の列を持つ

$1$ 本の乱数列を全員で使い回すからぶつかるので、**用途ごとに作ります。**

- \`randLayout = makeRandom(seed)\` … 街区の分割だけに使う
- \`randBuilding = makeRandom(seed + 1)\` … 建物の高さや色だけに使う
- \`randTraffic = makeRandom(seed + 2)\` … 車だけに使う

こうすると、**建物のコードを何回書き換えても、街路は $1$ ミリも動きません。**

種を $1$ つ増やすだけで、まったく別の並びが出るのは確かめたとおりです
（種 $1$ と種 $2$ の最初の値は $0.6271$ と $0.7343$）。
だから \`seed\`・\`seed + 1\`・\`seed + 2\` は、実質的に無関係な $3$ 本の列になります。

**費用は、状態 $32$ ビットが $3$ つ。$12$ バイトです。**
`,
    },
    {
      kind: 'sandbox',
      title: '乱数を 1 回余分に引くと、何が変わるか',
      guide: { focus: ['列を共有する（危ない）', '列を分ける（安全）'] },
      code: `import * as THREE from 'three';

// 「街全体の設定を 1 つ引く」という行を足したときに、
// 街路まで変わってしまうかどうかを、左右で見比べる

const SEED = 20260730;
const CITY = 60;
const ROAD = 2.0;
const MIN_LOT = 5;

const EXTRA_DRAW = true;   // false にすると、この行が無かったことになる

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-70, 70, 42, -42, 0.1, 100);
camera.position.set(0, 40, 0);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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
  const canX = rect.w > MIN_LOT * 2 + ROAD;
  const canZ = rect.d > MIN_LOT * 2 + ROAD;
  if (!canX && !canZ) { out.push(rect); return out; }
  const alongX = canX && (!canZ || rect.w >= rect.d);
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

/* ---- 列を共有する（危ない） ---- */
// 街全体の設定も、街区の分割も、建物の濃さも、同じ 1 本から引く

function buildShared() {
  const rand = makeRandom(SEED);
  if (EXTRA_DRAW) rand();          // 「街全体の設定」を 1 つ引いただけ
  const lots = splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, rand, []);
  return lots.map((lot) => ({ lot: lot, shade: rand() }));
}

/* ---- 列を分ける（安全） ---- */
// 街区の分割は randLayout、それ以外は randDetail。互いに影響しない

function buildSeparate() {
  const randLayout = makeRandom(SEED);
  const randDetail = makeRandom(SEED + 1);
  if (EXTRA_DRAW) randDetail();    // 足すなら detail 側へ。layout は触らない
  const lots = splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, randLayout, []);
  return lots.map((lot) => ({ lot: lot, shade: randDetail() }));
}

function show(items, offsetX, label) {
  for (const item of items) {
    const lot = item.lot;
    if (lot.w <= 0 || lot.d <= 0) continue;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(lot.w, lot.d),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.55, 0.35, 0.22 + item.shade * 0.4),
      }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(offsetX + lot.x + lot.w / 2, 0, lot.z + lot.d / 2);
    scene.add(plane);
  }

  const div = document.createElement('div');
  div.textContent = label + '（' + items.length + ' 区画）';
  div.style.cssText =
    'position:absolute; bottom:18px; transform:translateX(-50%);' +
    'color:#e8e8f2; font:12px sans-serif; pointer-events:none; white-space:nowrap;';
  div.style.left = (offsetX < 0 ? 25 : 75) + '%';
  document.body.appendChild(div);
}

show(buildShared(), -35, '1 本を共有');
show(buildSeparate(), 35, '用途ごとに分ける');

const note = document.createElement('div');
note.textContent =
  'EXTRA_DRAW = ' + EXTRA_DRAW + ' ― 切り替えて、左右のどちらが変わるか見てください';
note.style.cssText =
  'position:absolute; top:14px; left:50%; transform:translateX(-50%);' +
  'color:#9fb4d8; font:12px ui-monospace, monospace; pointer-events:none;';
document.body.appendChild(note);

renderer.render(scene, camera);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '\`EXTRA_DRAW\` を \`false\` に切り替えてください。**右の街路はまったく変わりません**（濃淡だけが変わります）。**左は区画の形も数も別物になります。** 足したのは「乱数を $1$ 回引く」という $1$ 行だけで、街区を割るコードには指一本触れていません。これが、決め打ちの乱数を $1$ 本で使い回したときの壊れ方です。',
    },
    {
      kind: 'md',
      text: `
## 種は、作品の一部として扱う

種を分けたら、次は**種そのものを表に出します。**

- URL に載せる（\`#/city?seed=20260730\`）
- 画面のすみに表示する
- 「別の街」ボタンで種を $1$ 増やす

こうすると、**気に入った街を人に渡せます。**
手続き的生成の作品では、種は設定ではなく**作品の名前**です。

この惑星と街のサンドボックスでは \`SEED\` を定数にしてありますが、
それは書き換えて実行できる場所に置いてあるからで、意味は同じです。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`makeRandom(seed)\` を $2$ 回呼んで $2$ 本の列を作りました。

\`makeRandom(1)\` と \`makeRandom(2)\` は、本当に無関係な並びになりますか。
確かめる方法を $1$ つ挙げてください。`,
      hint: '$2$ 本の列を並べて、関係があるかどうかを数で見ます。',
      answer: `**最初の値を比べるだけでも、まったく違うことは分かります。**

- 種 $1$ … $0.627074,\\; 0.002736,\\; 0.527447$
- 種 $2$ … $0.734251,\\; 0.324998,\\; 0.285296$

**もっとちゃんと確かめるなら**

$2$ 本から同時に引いた値の組 $(a_i,\\; b_i)$ を、点として平面にばらまきます。

- 無関係なら … 正方形が**一様に埋まる**
- 関係があるなら … 線・格子・縞が見える

これは**目で見て分かる**ので、いちばん手軽な検査です。
$1$ 万点も打てば、はっきりします。

数で言うなら**相関係数**を取ります。無関係なら $0$ に近い値になります。

**なぜ種 +1 で別の並びになるのか**

mulberry32 は、状態を $0\\text{x}6\\text{d}2\\text{b}79\\text{f}5$ ずつ進めながら、
毎回それを掛け算と排他的論理和で**よく混ぜて**から返しています。

混ぜる工程があるので、**入り口が $1$ 違うだけで出口は無関係になります。**
これは[](#/ch/x06-value-noise)のハッシュとまったく同じ考え方です。

**混ぜていない乱数だと、こうはなりません。**
線形合同法の下位ビットのように、種の近さが結果の近さとして残るものもあります。`,
    },
    {
      prompt: `街を作ったあとで「建物の窓の数も乱数で決めよう」と思いつきました。

どの列から引きますか。新しい列を作るべきでしょうか。`,
      hint: '窓を変えたときに、何が変わってほしくないですか。',
      answer: `**建物用の列（\`randBuilding\`）から引きます。新しい列は要りません。**

**判断の基準**

列を分ける目的は「**A を触ったときに B が変わらないようにする**」ことです。

窓の数は建物の一部なので、**建物を触ったときに一緒に変わってよい**ものです。
むしろ、同じ列から引くほうが自然です。

**新しい列を作るのは、こういうとき**

- **あとから足す機能**で、既存の見た目を絶対に変えたくない
- 生成の**順番が変わりうる**（並列に処理する、順序が保証されない）
- 一部だけを**作り直したい**（街路はそのままで、車だけ振り直す）

**列を増やしすぎる害もあります**

$10$ 本もあると、どれがどれか分からなくなります。

目安は「**独立に作り直したい単位**」です。この街なら $3$ つで十分です。

- 街路（変わると全部変わる）
- 建物（街路の上に乗るもの）
- 車（毎回振り直してもよいもの）

**$1$ 本だと壊れ、$10$ 本だと管理できない。**
分ける粒度そのものが設計です。`,
    },
    {
      prompt: `$200$ 万回ではなく $2000$ 回だけ引いて平均を出したら $0.4934$ でした。

この乱数は偏っていると言えますか。`,
      hint: '$n = 2000$ のときの $\\sigma$ を計算してください。',
      answer: `**言えません。$\\sigma$ の範囲の中です。**

**計算**

$\\sigma_{\\bar{x}} = \\dfrac{1}{\\sqrt{12 \\times 2000}} = \\dfrac{1}{154.9} = 0.00646$

ずれは $0.5 - 0.4934 = 0.0066$

$0.0066 \\div 0.00646 = 1.02$ ― **ちょうど $1\\sigma$** です。

$1\\sigma$ の外に出る確率は、$1$ 回の試行でも約 $32\\%$ あります。
**偏っていない乱数でも、$3$ 回に $1$ 回はこれくらいずれます。**

**逆に危ないのは、ずれなさすぎるとき**

$2000$ 回引いて平均が $0.50000$ ちょうどだったら、それは**疑うべき**です。

$\\sigma$ が $0.00646$ もあるのに $0.00000$ になるのは、
**乱数ではなく、何か規則的なものを引いている**兆候です。

**教訓**

「$0.5$ に近いから合格」も「$0.5$ から離れたから不合格」も、
**$n$ を言わなければ意味がありません。**

$n = 2000$ なら $\\pm 0.0065$、$n = 200$ 万なら $\\pm 0.0002$ ―
**同じ $0.4934$ が、片方では正常、もう片方では明確な異常です。**`,
    },
  ],
  quiz: [
    {
      q: '手続き的生成で `Math.random()` をそのまま使うと、いちばん困るのはどれですか。',
      choices: [
        '同じ URL を開いた人に同じものが見えず、不具合の再現もできない',
        '生成が遅くなる',
        '値が偏る',
        '0 と 1 が出ない',
      ],
      answer: 0,
      explain:
        '速さも分布も実用上は問題ありません。困るのは再現できないことです。「あの配置が良かった」に戻れず、「たまに建物が道路に食い込む」を追えず、人に同じものを見せられません。種を渡せば同じ並びが返る乱数を自分で持てば、全部解決します。',
    },
    {
      q: '決め打ちの乱数を 1 本だけ作り、街区の分割にも建物の色にも使っています。色の処理で乱数を 1 回余分に引くようにすると何が起きますか。',
      choices: [
        'それ以降の値が全部ずれ、街路の形まで変わる',
        '色だけが変わる。街路は種で決まっているので動かない',
        '何も変わらない',
        'エラーになる',
      ],
      answer: 0,
      explain:
        '決め打ちの乱数が保証するのは「同じ種」と「同じ引く順番」からの再現です。途中に 1 回引く場所を足せば、以降の値はすべてずれます。用途ごとに列を分けて（seed、seed+1、seed+2）おけば、建物のコードを何度書き換えても街路は 1 ミリも動きません。費用は 32 ビットの状態が 3 つ、12 バイトです。',
    },
    {
      q: '一様乱数を n 回引いた平均が 0.5 からどれだけずれてよいか、その目安はどれですか。',
      choices: [
        '1/√(12n)。n = 200 万なら 0.000204',
        '常に 0.001 以内',
        '1/n',
        '決まった目安はない',
      ],
      answer: 0,
      explain:
        '一様分布の標準偏差 1/√12 を √n で割ったものが、平均のばらつきの目安です。200 万回での実測は 0.499894 で、ずれ 0.000106 は目安の 0.52 倍 ― 1σ の中なので偏っているとは言えません。n を言わずに「0.5 に近いから合格」と判断すると、n = 2000 での 0.4934 を異常と誤読します。',
    },
  ],
};
