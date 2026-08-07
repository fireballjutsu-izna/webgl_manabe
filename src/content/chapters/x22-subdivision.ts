import type { Chapter } from '../types.ts';

export const chapterX22: Chapter = {
  slug: 'x22-subdivision',
  part: 'project',
  number: 22,
  title: '土地を再帰的に割る ― 街区ができる',
  goal: '$10$ 行の再帰で街区を切り出せるようになり、$3$ つのつまみが区画の数・大きさ・形をどう決めるかを、測った数字で言えるようになります。',
  requires: ['x21-seeded-random', 'm40-subdivision', 'm39-recursion'],
  threeApis: ['PlaneGeometry', 'Mesh', 'OrthographicCamera'],
  mathRecall: [
    { slug: 'm39-recursion', note: '自分を呼ぶ形。止め方を先に決める' },
    { slug: 'm40-subdivision', note: '同じ手順を、半分の大きさで' },
    { slug: 'b05-ratio', note: '$35$〜$65$ パーセント。割合で切る' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 手順は、3 行で言える

土地を割る手順は、言葉にするとこれだけです。

- **もう割れないほど小さければ**、その土地を街区として採用して終わり
- そうでなければ、**長い辺の側**を $1$ 本の道で $2$ つに割る
- できた $2$ つの土地に対して、**同じ手順を繰り返す**

$3$ 行目が[](#/ch/m39-recursion)そのものです。
自分自身を呼ぶので、**深さを決める必要がありません** ―
「小さくなったら止まる」とだけ書いておけば、深いところは勝手に深くなります。
`,
    },
    {
      kind: 'md',
      text: `
## つまみは 3 つだけ

コードに出てくる調整用の値は $3$ つです。この $3$ つが街の性格を決めます。

- \`CITY\` … 街全体の一辺（$120$）
- \`ROAD\` … 道路の幅（$3.2$）
- \`MIN_LOT\` … これ以上小さくは割らない、という下限（$9$）

止まる条件は「\`MIN_LOT * 2 + ROAD\` より広いか」です。
**割ったあとの両方が \`MIN_LOT\` 以上でないと意味がない**ので、$2$ 倍して道路幅を足します。
`,
    },
    {
      kind: 'md',
      text: `
## 真ん中で割ってはいけない

割る位置には、もう $1$ つ大事な決まりがあります。

**ちょうど半分では割りません。**

半分で割ると、できあがるのは格子です。[](#/ch/p05-city-layout)で見たとおり、
$1$ 秒で規則が読み取れてしまいます。
かといって $0$〜$1$ の乱数をそのまま使うと、**幅 $2$ の街区と幅 $98$ の街区**が生まれます。

そこで、範囲を $35$〜$65$ パーセントに絞ります。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{切る位置} \\;=\\; w\\,(0.35 + 0.3\\,\\xi), \\qquad \\xi \\sim U(0,1)',
      readAloud:
        '幅 $w$ の $35$ パーセントから $65$ パーセントのあいだのどこかで切る、と読みます。$\\xi$（クサイ）は $0$ から $1$ の一様乱数です。範囲を狭めると格子に近づき、広げると極端に細い街区が出ます。',
      worked: {
        given: '幅 $w = 100$ の街区を切ります。乱数 $\\xi$ の値ごとに、切れる位置を見ます。',
        steps: [
          { calc: 'ξ = 0   : 100 x (0.35 + 0)    = 35', note: 'いちばん左寄り' },
          { calc: 'ξ = 0.5 : 100 x (0.35 + 0.15) = 50', note: 'ちょうど真ん中' },
          { calc: 'ξ = 1   : 100 x (0.35 + 0.3)  = 65', note: 'いちばん右寄り' },
          { calc: '長い辺を選ぶ効果（実測）' },
          { calc: '  街区の縦横比 平均 1.51' },
          { calc: '  いちばん細い街区でも 2.69', note: '極端な短冊は出ない' },
        ],
        result:
          '切れるのは **$35$〜$65$ のあいだだけ**。もし $0$〜$1$ の乱数をそのまま使うと、幅 $2$ の街区と幅 $98$ の街区が生まれ、**極端に細長い土地**ができます。さらに「長い辺の側を割る」を入れているので、実測でも縦横比は**平均 $1.51$、最大でも $2.69$** に収まりました。**この $2$ つの決まりが、細長い街区を構造的に防いでいます。**',
      },
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '紙を折るのに似ています',
      text: `
$1$ 枚の紙を、長いほうを半分に折る ― これを繰り返すと、
どんどん小さくなりながら**形は正方形に近いまま**保たれます。

$A4$ の紙が $A5$、$A6$ と半分になっても
細長くならないのは、毎回**長い辺を折っている**からです。

いつも同じ辺を折ると、$2$ 回目には細長い短冊になります。

街区の分割で「長い辺の側を割る」と決めているのは、まったく同じ理由です。
**折る辺を選ぶだけで、形が保たれます。**
`,
    },
    {
      kind: 'md',
      text: `
## MIN_LOT が、街の密度を決める

$3$ つのつまみのうち、いちばん効くのが \`MIN_LOT\` です。実際に測るとこうなります。

| \`MIN_LOT\` | 街区の数 | 平均の面積 | 分割の深さ |
|---|---|---|---|
| $20$ | $16$ 個 | $762$ | $4$ |
| $9$ | $54$ 個 | $183$ | $4$〜$7$（平均 $5.9$） |
| $5$ | $128$ 個 | $59$ | $6$〜$8$（平均 $7.2$） |

**下限を半分にすると、区画は $2$ 倍以上に増えます。**
土地を $2$ つに割る操作を $1$ 段深くするたびに、区画は倍になるからです。

深さの幅（$4$〜$7$）にも意味があります。
**同じ深さで止まっていないことが、大小の混ざりの正体**です。
格子ならすべてが同じ深さで、区画も同じ大きさになります。
`,
    },
    {
      kind: 'formula',
      tex: 'n \\;=\\; 2^{d}, \\qquad d \\;=\\; \\log_{2} n',
      readAloud:
        '$1$ 回の分割で土地は $2$ つになるので、深さ $d$ まで均等に割れば区画は $2^d$ 個です。逆に、区画が $n$ 個なら平均の深さはおよそ $\\log_2 n$ になります。',
      worked: {
        given: '\`MIN_LOT\` $= 9$ のときの実測（区画 $54$ 個、深さ $4$〜$7$、平均 $5.9$）と突き合わせます。',
        steps: [
          { calc: 'log2(54) = log(54)/log(2)' },
          { calc: '        = 3.989 / 0.693 = 5.75' },
          { calc: '実測の平均の深さ = 5.9' },
          { calc: '差 = 0.15' },
          { calc: 'MIN_LOT=5 : log2(128) = 7.00' },
          { calc: '  実測 7.2、差 0.2' },
        ],
        result:
          '**予測 $5.75$ に対して実測 $5.9$。** ほぼ二分木どおりです。差の $0.15$ は、割る位置が $35$〜$65$ でばらつくために、深いところと浅いところが出るぶんです。**この式が使えるということは、分割が「だいたい均等な二分木」になっているということ** ― もし実測が $9$ や $10$ なら、どこかで細長い土地ができて片側だけが割られ続けている合図です。**予測と実測を突き合わせると、形を見なくても異常が分かります。**',
      },
    },
    {
      kind: 'sandbox',
      title: 'つまみを回して、区画の数と形を測る',
      guide: { focus: ['土地を再帰的に割る', '測る ― 数・深さ・縦横比'] },
      code: `import * as THREE from 'three';

const SEED = 20260730;
const CITY = 120;
const ROAD = 3.2;
const MIN_LOT = 9;    // 20 と 5 も試してください

const scene = new THREE.Scene();
// 街 120 がちょうど収まるように、画面の縦横比から左右を決める
const HALF = 78;   // 街 120 に対して余白を持たせる
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-HALF * aspect, HALF * aspect, HALF, -HALF, 0.1, 200);
camera.position.set(0, 80, 0);
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

/* ---- 土地を再帰的に割る ---- */
// rect は { x, z, w, d }。x, z は角の座標、w, d は幅と奥行き

function splitLots(rect, rand, out, depth) {
  // 割ったあと、両方が MIN_LOT 以上になるか
  const canX = rect.w > MIN_LOT * 2 + ROAD;
  const canZ = rect.d > MIN_LOT * 2 + ROAD;

  if (!canX && !canZ) {
    rect.depth = depth;
    out.push(rect);
    return out;
  }

  // 長い辺の側を割る。紙を折るときと同じで、形が正方形に近いまま保たれる
  const alongX = canX && (!canZ || rect.w >= rect.d);
  const length = alongX ? rect.w : rect.d;
  const cut = length * (0.35 + rand() * 0.3);   // 真ん中では割らない

  if (alongX) {
    splitLots({ x: rect.x, z: rect.z, w: cut - ROAD / 2, d: rect.d }, rand, out, depth + 1);
    splitLots({ x: rect.x + cut + ROAD / 2, z: rect.z, w: rect.w - cut - ROAD / 2, d: rect.d }, rand, out, depth + 1);
  } else {
    splitLots({ x: rect.x, z: rect.z, w: rect.w, d: cut - ROAD / 2 }, rand, out, depth + 1);
    splitLots({ x: rect.x, z: rect.z + cut + ROAD / 2, w: rect.w, d: rect.d - cut - ROAD / 2 }, rand, out, depth + 1);
  }
  return out;
}

const lots = splitLots(
  { x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY },
  makeRandom(SEED), [], 0,
);

for (const lot of lots) {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(lot.w, lot.d),
    // 深さで色を変える。浅い（大きい）ほど明るい
    new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.55, 0.3, 0.5 - lot.depth * 0.045),
    }),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(lot.x + lot.w / 2, 0, lot.z + lot.d / 2);
  scene.add(plane);
}

/* ---- 測る ― 数・深さ・縦横比 ---- */
// 絵を見て判断せず、配列のまま数える。3D の描画は要らない

const areas = lots.map((l) => l.w * l.d);
const depths = lots.map((l) => l.depth);
const aspects = lots.map((l) => Math.max(l.w, l.d) / Math.min(l.w, l.d));
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

const readout = document.createElement('div');
readout.textContent =
  'MIN_LOT ' + MIN_LOT + '\\n' +
  '街区     ' + lots.length + ' 個\\n' +
  '面積     最小 ' + Math.min(...areas).toFixed(0) +
  ' / 平均 ' + mean(areas).toFixed(0) +
  ' / 最大 ' + Math.max(...areas).toFixed(0) + '\\n' +
  '深さ     ' + Math.min(...depths) + '〜' + Math.max(...depths) +
  '（平均 ' + mean(depths).toFixed(1) + '、log2 は ' +
  (Math.log2(lots.length)).toFixed(2) + '）\\n' +
  '縦横比   平均 ' + mean(aspects).toFixed(2) +
  ' / 最大 ' + Math.max(...aspects).toFixed(2);
readout.style.cssText =
  'position:absolute; bottom:16px; left:16px; color:#9fb4d8;' +
  'font:12px/1.7 ui-monospace, monospace; white-space:pre; pointer-events:none;' +
  'background:rgba(10,12,18,0.78); padding:8px 10px; border-radius:5px;';
document.body.appendChild(readout);

renderer.render(scene, camera);

window.addEventListener('resize', () => {
  const next = window.innerWidth / window.innerHeight;
  camera.left = -HALF * next;
  camera.right = HALF * next;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
});`,
      caption:
        '色の濃さが分割の深さです。**濃淡が混ざっていることが、大小の街区が混ざっていること**そのものです。`MIN_LOT` を $20$ にすると $16$ 区画になり、色もほぼ均一 ― 深さが $4$ で揃うからです。$5$ にすると $128$ 区画。左下の「深さ 平均」と「log2」が近い値であることも確かめてください ― 離れていたら、どこかで片側だけが割られ続けています。`0.35 + rand() * 0.3` を `0.5` に固定すると、格子に戻ります。',
    },
    {
      kind: 'md',
      text: `
## 止め方だけは、慎重に決める

再帰で唯一こわいのは、**止まらないこと**です。

この分割は「割ったあと両方が \`MIN_LOT\` 以上になるか」を先に確かめ、
どちらの辺も割れないときだけ採用して返します。
$1$ 回の分割で必ず幅が縮むので、**有限回で必ず止まります。**

止まらない書き方の代表は、こういうものです。

- **縮む保証がない。** 「$0$〜$100$ パーセントの位置で割る」にすると、
  $0$ パーセントで割ったときに幅が変わらず、同じ土地を無限に割り続けます
- **下限が道路幅より小さい。** \`MIN_LOT\` が \`ROAD\` より小さいと、
  引き算のあとに**幅が負**になり、区画が裏返ります

$35$ パーセントという下限は、見た目のためだけではありません。
**必ず縮むことの保証**にもなっています。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`MIN_LOT\` を $9$ から $4.5$（半分）にすると、街区の数はおよそ何倍になりますか。

深さで考えてください。`,
      hint: '面積が $\\frac14$ になるまで割ると、深さは何段増えますか。',
      answer: `**およそ $4$ 倍です（実測でも $54 \\to 128$ で $2.4$ 倍、$MIN\\_LOT = 5$ でこれ）。**

**深さで考える**

区画の辺の下限が半分になると、面積の下限は $\\frac14$ になります。

$1$ 段割るごとに面積は約半分になるので、
$\\frac14$ にするには**$2$ 段深く**なります。

$2^2 = 4$ 倍。

**実測とのずれ**

$MIN\\_LOT = 9 \\to 5$（半分よりやや大きい）で $54 \\to 128$、$2.4$ 倍でした。

$\\log_2 2.4 = 1.26$ 段ぶんです。

$9 \\to 4.5$ ならもう少し増えて、$3$〜$4$ 倍になります。

**道路幅が効いてくる**

厳密に $4$ 倍にならないのは、**割るたびに道路幅ぶんの土地が消える**からです。

区画が小さくなるほど、$ROAD = 3.2$ の重みは相対的に大きくなります。
$MIN\\_LOT = 5$ では区画の辺が $10$ 前後なので、
**道路が区画と同じくらいの幅**になり、割れる回数が頭打ちになります。

**このことは、道路率にも現れます**（$31.3\\% \\to 47.5\\%$）。
次の章で、そちらから見ます。`,
    },
    {
      prompt: `「長い辺の側を割る」をやめて、**必ず $x$ 方向に割る**ようにしたら何が起きますか。`,
      hint: '$1$ 回割るごとに、$x$ の幅だけが縮みます。',
      answer: `**縦に細長い短冊ばかりになります。**

**何が起きるか**

$x$ だけを割り続けるので、幅だけが縮み、奥行きは $120$ のまま残ります。

- $1$ 段目 … $50 \\times 120$（縦横比 $2.4$）
- $2$ 段目 … $25 \\times 120$（$4.8$）
- $3$ 段目 … $12 \\times 120$（$10$）

**縦横比は $1$ 段ごとに $2$ 倍**になります。

実測の「平均 $1.51$、最大 $2.69$」とはまるで違う世界です。

**しかも、止まるのが早い**

$x$ の幅が \`MIN_LOT * 2 + ROAD\` を切った時点で止まります。
$z$ は一度も割られないので、**区画は $6$ 個くらいしかできません。**

$120 \\times 120$ の土地に、$120$ の長さの短冊が数本 ―
街ではなく、畑に見えます。

**長い辺を選ぶ、の $1$ 行**

判定は \`const alongX = canX && (!canZ || rect.w >= rect.d);\` の $1$ 行だけです。

この \`rect.w >= rect.d\` だけが、形を保っています。
$A4$ の紙を長いほうから折るのと、まったく同じ理屈です。`,
      answerCode: `// 長い辺を選ぶ（正しい）
const alongX = canX && (!canZ || rect.w >= rect.d);

// 必ず x を割る（短冊になる）
const alongX = canX;`,
    },
    {
      prompt: `割る位置を $0$〜$100$ パーセント（\`rand()\` をそのまま）にすると、
見た目のほかに、もう $1$ つ深刻な問題が起きます。何でしょう。`,
      hint: '$\\xi$ がちょうど $0$ に近い値を返したとき、その土地の幅はどうなりますか。',
      answer: `**幅が負の街区ができ、場合によっては再帰が止まりません。**

**幅が負になる**

割る位置が $0$ に近いと、左側の土地は

$\\text{幅} = \\text{cut} - ROAD/2$

で、$\\text{cut}$ が $1.6$ より小さければ**負**になります。

負の幅の \`PlaneGeometry\` は**裏返った面**になり、
ライトの当たり方がおかしくなったり、まったく見えなくなったりします。

**止まらない可能性**

もっと悪いのは、$\\xi$ が $0$ ちょうどに近いときです。

右側の土地の幅は \`rect.w - cut - ROAD / 2\` で、
$\\text{cut}$ がほぼ $0$ なら**ほとんど縮んでいません。**

縮まない土地をまた割るので、**同じ大きさの土地を割り続けます。**
運が悪ければスタックがあふれます。

**$35$ パーセントが保証していること**

$\\xi$ がどんな値でも、切る位置は幅の $35$〜$65$ パーセントの内側です。

- **両側とも、必ず元の $65$ パーセント以下**になる
- 有限回で \`MIN_LOT\` を下回るので、**必ず止まる**

**見た目のための数字が、停止性の保証になっている** ―
再帰では、この $2$ つがしばしば同じ場所に来ます。

**一般則: 再帰の停止は「必ず縮む」で保証する。**
「たぶん縮む」では、いつか止まりません。`,
    },
  ],
  quiz: [
    {
      q: '街区を割るとき「長い辺の側を割る」のはなぜですか。',
      choices: [
        '毎回長いほうを割ると形が正方形に近いまま保たれ、細長い短冊にならないから',
        '長い辺のほうが計算が速いから',
        '短い辺は割れないから',
        '道路を直線にするため',
      ],
      answer: 0,
      explain:
        'A4 の紙を長いほうから半分に折ると A5、A6 と小さくなっても細長くなりません。同じ辺ばかり折ると 2 回目で短冊になります。実測でも街区の縦横比は平均 1.51、最大でも 2.69 に収まりました。必ず x を割る作りにすると、縦横比は 1 段ごとに 2 倍になります。',
    },
    {
      q: '`MIN_LOT` を 9 から 5 にすると、街区の数はどう変わりますか（街 120、道路幅 3.2）。',
      choices: [
        '54 個から 128 個へ。1 段深く割るごとに区画は倍になる',
        '変わらない',
        '半分になる',
        '2 個増える',
      ],
      answer: 0,
      explain:
        '土地を 2 つに割る操作なので、深さが 1 段増えれば区画は倍です。実測の平均の深さは 5.9 と 7.2 で、log2(54) = 5.75、log2(128) = 7.00 とほぼ一致します。予測と実測が離れていたら、どこかで片側だけが割られ続けている合図になります。',
    },
    {
      q: '割る位置を 35〜65 パーセントに絞っている理由として、正しくないものはどれですか。',
      choices: [
        '割る回数が減って、生成が速くなるから',
        '真ん中固定だと格子に戻り、規則が見えてしまうから',
        '0〜100 パーセントだと幅が負の街区ができるから',
        '両側が必ず 65 パーセント以下に縮むので、再帰が必ず止まるから',
      ],
      answer: 0,
      explain:
        '速さのためではありません。この 1 つの範囲が、見た目（格子に戻らない）と正しさ（幅が負にならない、必ず縮むので止まる）の両方を同時に保証しています。再帰では、見た目のための数字が停止性の保証を兼ねることがしばしばあります。',
    },
  ],
};
