import type { Chapter } from '../types.ts';

export const chapterP05: Chapter = {
  slug: 'p05-city-layout',
  part: 'project',
  number: 20,
  title: '街をどう作るか ― 500 棟を、置く前に決める',
  goal: '「たくさんを安く作る」という後半の主題を、描画回数と生成方針の $2$ つの見積もりから設計できるようになります。',
  requires: ['x19-labels-finish', 'w42-draw-calls', '13-random'],
  threeApis: ['WebGLRenderer.info', 'InstancedMesh', 'BufferGeometryUtils'],
  mathRecall: [
    { slug: 'w42-draw-calls', note: '回数 × 単価。命令の回数で CPU が決まる' },
    { slug: 'b39-seed', note: '同じ種から、同じばらつきを再現する' },
    { slug: 'm40-subdivision', note: '同じ手順を、半分の大きさで' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 惑星とは、難しさの種類が違う

$19$ 章かけて作った惑星は「**$1$ つのものを、丁寧に作る**」話でした。
層は $4$ 枚、月は $1$ つ。数はどれも片手で数えられます。

街は逆です。**建物が $500$ も $1000$ もあります。**

$1$ つずつ丁寧に置いていたら終わりませんし、
そのまま描いたら[](#/ch/w42-draw-calls)でやったとおり{{ドローコール}}で潰れます。

つまり後半の主題は「**たくさんのものを、安く、それらしく作る**」です。
`,
    },
    {
      kind: 'md',
      text: `
## 置く前に、値段を見る

いちばん素直な書き方 ― 建物ごとに \`new THREE.Mesh(...)\` ― が
いくらかかるかを、**コードを書く前に**見積もっておきます。
`,
    },
    {
      kind: 'formula',
      tex: 't_{\\text{CPU}} \\;\\approx\\; N \\times c',
      readAloud:
        '$1$ フレームの CPU の時間は、ドローコールの回数 $N$ と $1$ 回あたりの費用 $c$ の掛け算でおおよそ決まります。$c$ は端末によりますが $0.005$〜$0.02$ ミリ秒くらいです。',
      worked: {
        given: '建物 $500$ 棟＋地面 $1$ 枚。$c = 0.012$ ミリ秒（[](#/ch/w42-draw-calls)で測った値）で見ます。',
        steps: [
          { calc: '1 棟ずつ Mesh にする場合' },
          { calc: '  N = 501' },
          { calc: '  t = 501 x 0.012 = 6.01 ms' },
          { calc: '60fps の予算 16.7 ms に対して' },
          { calc: '  6.01 / 16.7 = 36%', note: '描く前に 3 分の 1 が消える' },
          { calc: 'まとめて 1 回にする場合' },
          { calc: '  N = 2、t = 0.024 ms' },
        ],
        result:
          '**$6.01$ ミリ秒と $0.024$ ミリ秒。$250$ 倍の差**です。しかも**三角形の数はまったく同じ** ― 減るのは命令の回数だけです。$36\\%$ を「まだ余裕がある」と読むこともできますが、これは**建物を置いただけ**の値です。影・車・空が乗る前に $3$ 分の $1$ を使っているので、ここで払わない判断をします。',
      },
    },
    {
      kind: 'md',
      text: `
## 後半 4 章の段取り

見積もりから、作る順番が決まります。

| 章 | やること | 効く数字 |
|---|---|---|
| [](#/ch/x21-seeded-random) | 決め打ちの乱数 | 同じ種 → 同じ街 |
| [](#/ch/x22-subdivision) | 土地を再帰的に割る | 街区 $54$ 個 |
| [](#/ch/x23-roads) | 隙間を道路にする | 道路率 $31.3\\%$ |
| [](#/ch/x24-eye-level) | 目線を下ろす | ここまでの見え方を確かめる |
| [](#/ch/p06-city-buildings) | 建物を生やして $1$ 回で描く | $501 \\to 2$ 回 |
| [](#/ch/p07-city-light) | 朝から夜へ | 時刻 $1$ つから全部 |
| [](#/ch/p08-city-motion) | 車を走らせて仕上げる | 曲線に沿う動き |

**街の形を決めるのが $4$ 章、それを安く描くのが $1$ 章**という配分です。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '「あとで速くする」は、たいてい手遅れになります',
      text: `
$500$ 個の \`Mesh\` を作ってから \`InstancedMesh\` に移すのは、
**書き直しになります。** 位置の持ち方も、色の付け方も、当たり判定も変わるからです。

一方、最初から「まとめて描く」前提で組むと、
**街区のデータ（矩形の配列）を作る部分は、どちらでも同じ**です。

だからこの $4$ 章では、**位置と大きさを決めるところまでを、描画から切り離して**作ります。
出てくるのは \`{ x, z, w, d }\` の配列だけ。
それをどう描くかは、次の章の仕事です。

**「何を作るか」と「どう描くか」を分けておけば、描き方は後から選べます。**
`,
    },
    {
      kind: 'md',
      text: `
## 素材は、やはり 1 つも用意しません

惑星と同じ方針です。画像もモデルも使いません。

街で必要になるのは $3$ つだけです。

- **決め打ちの乱数**（[](#/ch/x21-seeded-random)）… 同じ街を何度でも出す
- **再帰的な分割**（[](#/ch/x22-subdivision)）… 大小の街区が自然に混ざる
- **箱**（[](#/ch/p06-city-buildings)）… 建物は直方体だけ

**ローポリにするのは、手を抜くためではありません。**
形が単純なほど、$1$ 棟あたりの頂点が減り、$1000$ 棟置けるようになります。
そして $1000$ 棟あることのほうが、$1$ 棟が精巧であることより**街に見えます。**
`,
    },
    {
      kind: 'sandbox',
      title: '同じ土地を、2 通りで割ってみる',
      guide: { focus: ['格子で割る', '再帰的に割る'] },
      code: `import * as THREE from 'three';

// 街路の作り方は大きく 2 つ。まず見比べてから、片方を選ぶ

const CITY = 60;
const ROAD = 2.0;

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

/* ---- 格子で割る ---- */
// 等間隔。京都やマンハッタン。書くのはいちばん簡単

function gridLots(n) {
  const out = [];
  const step = CITY / n;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      out.push({
        x: -CITY / 2 + i * step,
        z: -CITY / 2 + j * step,
        w: step - ROAD,
        d: step - ROAD,
      });
    }
  }
  return out;
}

/* ---- 再帰的に割る ---- */
// 1 本の道で 2 つに割り、できた土地をそれぞれまた割る

function splitLots(rect, rand, out, minLot) {
  const canX = rect.w > minLot * 2 + ROAD;
  const canZ = rect.d > minLot * 2 + ROAD;
  if (!canX && !canZ) { out.push(rect); return out; }

  const alongX = canX && (!canZ || rect.w >= rect.d);   // 長い辺の側を割る
  const length = alongX ? rect.w : rect.d;
  const cut = length * (0.35 + rand() * 0.3);           // 真ん中では割らない

  if (alongX) {
    splitLots({ x: rect.x, z: rect.z, w: cut - ROAD / 2, d: rect.d }, rand, out, minLot);
    splitLots({ x: rect.x + cut + ROAD / 2, z: rect.z, w: rect.w - cut - ROAD / 2, d: rect.d }, rand, out, minLot);
  } else {
    splitLots({ x: rect.x, z: rect.z, w: rect.w, d: cut - ROAD / 2 }, rand, out, minLot);
    splitLots({ x: rect.x, z: rect.z + cut + ROAD / 2, w: rect.w, d: rect.d - cut - ROAD / 2 }, rand, out, minLot);
  }
  return out;
}

function show(lots, offsetX, color, label) {
  for (const lot of lots) {
    if (lot.w <= 0 || lot.d <= 0) continue;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(lot.w, lot.d),
      new THREE.MeshBasicMaterial({ color: color }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(offsetX + lot.x + lot.w / 2, 0, lot.z + lot.d / 2);
    scene.add(plane);
  }

  const div = document.createElement('div');
  div.textContent = label + '（' + lots.length + ' 区画）';
  div.style.cssText =
    'position:absolute; bottom:18px; transform:translateX(-50%);' +
    'color:#e8e8f2; font:12px sans-serif; pointer-events:none; white-space:nowrap;';
  div.style.left = (offsetX < 0 ? 25 : 75) + '%';
  document.body.appendChild(div);
}

show(gridLots(6), -35, 0x2f4f6f, '格子 ― 単調');
show(splitLots({ x: -CITY / 2, z: -CITY / 2, w: CITY, d: CITY }, makeRandom(20260730), [], 5),
  35, 0x3f6f4f, '再帰的に割る ― 大小が混ざる');

renderer.render(scene, camera);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '左は格子、右は再帰的に割ったものです。**同じ広さの土地なのに、印象がまるで違います。** 左は $36$ 区画すべてが同じ大きさで、$1$ 秒見れば規則が分かってしまいます。右は大小が混ざり、道の途切れ方も一定ではありません。`gridLots(6)` を `gridLots(9)` にすると細かくなりますが、**単調さは変わりません** ― 分割数の問題ではなく、規則の問題だからです。',
    },
    {
      kind: 'md',
      text: `
## 格子ではなく、割っていくほうを採る

$2$ つの作り方を比べました。

- **格子** … 等間隔に縦横の線を引く。書くのは簡単だが、**すぐ単調に見える**
- **再帰的に割る** … 土地を $1$ 本の道で $2$ つに割り、できた土地をそれぞれまた割る

後者を採ります。書く量もほとんど変わりません（$10$ 行ほど）。

**大小の街区が自然に混ざる**のが決め手です。
現実の街も、区画整理された地区と古い地区が混ざっていて、
その不揃いさが「街らしさ」の正体になっています。

次の章から、この $10$ 行を組み立てていきます。
`,
    },
  ],
  exercises: [
    {
      prompt: `建物を $2000$ 棟に増やしたい。$1$ 棟ずつ \`Mesh\` にすると、CPU の時間はどれだけになりますか。

$c = 0.012$ ミリ秒として計算し、$60$ fps の予算と比べてください。`,
      hint: '回数 × 単価です。予算は $16.7$ ミリ秒。',
      answer: `**$24.0$ ミリ秒。予算を $1.4$ 倍超えます。**

**計算**

$2001 \\times 0.012 = 24.0$ ミリ秒

$24.0 \\div 16.7 = 1.44$

**描く前から予算オーバー**

これは「ドローコールを出すだけ」の時間です。

- 三角形はまだ $1$ つも描かれていません
- 影も、車も、空も乗っていません
- $30$ fps（$33.3$ ミリ秒）ですら、残りは $9$ ミリ秒しかありません

**まとめれば $0.024$ ミリ秒**

$2$ 回にまとめれば $1000$ 分の $1$ です。

そして**三角形の数はまったく同じ** ― GPU の仕事は $1$ ミリ秒も減っていません。

**この差が、後半の設計をほぼ決めています。**

「$500$ 棟か $2000$ 棟か」を自由に選べるのは、
**まとめて描く前提で組んであるから**です。
$1$ 棟ずつ描く作りにしてしまうと、棟数が設計の制約になります。`,
    },
    {
      prompt: `「街区のデータを作る部分」と「それを描く部分」を分けておく利点を、$2$ つ挙げてください。`,
      hint: 'あとから変えたくなるのは、どちらでしょう。',
      answer: `**描き方をあとから選べること、そして街区のデータを描画なしで検査できることです。**

**1. 描き方を選べる**

街区が \`{ x, z, w, d }\` の配列で出てくるなら、それをどう描くかは自由です。

- $1$ つずつ \`Mesh\`（デバッグ中はこれが楽）
- 合体して $1$ つのジオメトリ
- \`InstancedMesh\`

**どれに変えても、街を作るコードは $1$ 行も変わりません。**

**2. 描かずに検査できる**

配列が出てくるだけなら、**画面を見なくても確かめられます。**

- 街区の数は？（$54$ 個）
- 面積の合計は？（道路率 $31.3\\%$）
- 重なっている街区はないか？
- 負の幅を持つ街区は出ていないか？

これらは全部、ただの配列の計算です。
$3$ 次元の描画は、**確かめるのがいちばん高くつく手段**なので、
その前に配列で確かめられることは配列で確かめます。

**一般則**

**「何を作るか」を、データとして取り出せる形にしておく。**

そうすれば、描画・検査・保存・書き出しが全部あとから足せます。
逆に \`Mesh\` の中にしか情報が無いと、数えるだけでシーンを走査することになります。`,
    },
    {
      prompt: `格子の分割数を増やしても「単調さ」が消えないのはなぜですか。

再帰的な分割では、何が単調さを消しているのでしょう。`,
      hint: '目が読み取っているのは、区画の大きさそのものでしょうか。',
      answer: `**目が読んでいるのは「規則」であって、大きさではないからです。**

**格子の場合**

$6 \\times 6$ でも $9 \\times 9$ でも、規則は $1$ つです。

「**すべての区画が同じ大きさで、$1$ 直線に並ぶ**」

この規則は $1$ 秒で読み取れます。読み取ったあとは、
**どこを見ても新しい情報がありません。**

細かくすることは、同じ規則をより多く見せることでしかありません。

**再帰的な分割の場合**

規則はやはり $1$ つですが、性質が違います。

「**大きい土地を割った、その片方をまた割った**」

この規則は、**結果を見ても読み取れません。**
できあがった区画の大小には、生成の履歴が残っているだけで、
目に見える周期がないからです。

**「$35$〜$65$ パーセント」がしていること**

真ん中（$50\\%$ 固定）で割ると、結果は格子に戻ります。
**規則が結果に現れてしまう**からです。

$35$〜$65$ の幅は、その規則を隠すために入れています。
[](#/ch/b40-distribution)でやった「一様に散らすのは難しい」の逆で、
ここでは**規則を見えなくするために乱数を使っています。**`,
    },
  ],
  quiz: [
    {
      q: '建物 500 棟を 1 棟ずつ Mesh にすると、CPU の時間はおよそどれくらいですか（c = 0.012 ms）。',
      choices: [
        '約 6 ms。60fps の予算 16.7 ms の 36% を、描く前に使う',
        '約 0.06 ms。ほとんど無視できる',
        '約 60 ms。まったく動かない',
        '棟数では決まらない',
      ],
      answer: 0,
      explain:
        '501 × 0.012 = 6.01 ms です。まとめて 2 回にすれば 0.024 ms で、250 倍の差になります。三角形の数はどちらも同じ ― 減るのは命令の回数だけです。影や車が乗る前に 3 分の 1 を使うので、ここで払わない判断をします。',
    },
    {
      q: '街区のデータを `{ x, z, w, d }` の配列として作り、描画と分けておく利点はどれですか。',
      choices: [
        '描き方をあとから選べて、しかも描画せずに数や面積を検査できる',
        '描画が速くなる',
        'メモリが減る',
        '乱数が不要になる',
      ],
      answer: 0,
      explain:
        '配列で出てくるなら、Mesh にするか合体するか InstancedMesh にするかは後から選べます。しかも街区の数・面積・重なりはただの配列の計算で確かめられます。3 次元の描画は確かめるのがいちばん高くつく手段なので、その前に配列で確かめられることは配列で確かめます。',
    },
    {
      q: '格子ではなく再帰的な分割を選ぶ理由はどれですか。',
      choices: [
        '大小の街区が自然に混ざり、生成の規則が結果から読み取れなくなるから',
        '格子より描画が速いから',
        '格子ではコードが長くなるから',
        '格子では道路が作れないから',
      ],
      answer: 0,
      explain:
        '格子は「すべて同じ大きさで一直線に並ぶ」という規則が 1 秒で読み取れてしまい、分割数を増やしても単調さは変わりません。再帰的な分割では、できた区画の大小に生成の履歴が残るだけで目に見える周期がありません。真ん中で割ると格子に戻るので、35〜65 パーセントの幅で規則を隠しています。',
    },
  ],
};
