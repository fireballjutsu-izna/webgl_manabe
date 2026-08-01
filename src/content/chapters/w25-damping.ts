import type { Chapter } from '../types.ts';

export const chapterW25: Chapter = {
  slug: 'w25-damping',
  part: 'threejs',
  number: 25,
  title: '追いかける動き ― lerp の落とし穴',
  goal: 'なめらかな追従をフレームレートに依らない形で書けるようになり、ばね的な動きも作れるようになります.',
  requires: ['t06-loop-clock', 'b37-follow'],
  threeApis: [
    'Vector3.lerp',
    'Vector3.lerpVectors',
    'MathUtils.damp',
    'Quaternion.slerp',
    'MathUtils.lerp',
    'Object3D.quaternion',
  ],
  mathRecall: [
    { slug: 'b37-follow', note: '「残り距離の何割かを詰める」が追従の基本形' },
    { slug: 'b04-power-root', note: '指数関数。$r^{\\Delta t}$ が鍵になる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 世の中でいちばんよく見る、間違ったコード

カメラを目標へなめらかに寄せるとき、この書き方をよく見ます。

\`camera.position.lerp(target, 0.1)\`

「毎フレーム、残り距離の $10\\%$ を詰める」という意味です。
勝手に減速してくれるので見栄えがして、$1$ 行で書けます。

**そして、フレームレート依存です。**

$120$fps では $60$fps の $2$ 倍の回数呼ばれるので、**$2$ 倍近い速さで寄ります。**

[](#/ch/w02-render-loop)で「$dt$ を掛けろ」と言いました。
ところがこの形は、**$dt$ を掛けても直りません。**
`,
    },
    {
      kind: 'md',
      text: `
## なぜ $dt$ を掛けても直らないのか

\`lerp(target, 0.1 * dt * 60)\` と書けば直りそうに見えます。
$60$fps では $0.1$、$120$fps では $0.05$。**一見よさそうです。**

けれど、これは正しくありません。

**追従は掛け算だからです。**

$1$ フレームで残る割合は $0.9$。$2$ フレームでは $0.9 \\times 0.9 = 0.81$。
**足し算ではなく、掛け算で減ります。**

$120$fps で $0.05$ ずつ詰めると、$2$ フレームで残るのは $0.95^2 = 0.9025$。
$60$fps の $1$ フレームぶん $0.9$ とは**一致しません。**

近いので気づきにくいのですが、**フレームレートが大きく違うと差が出ます。**

正しく直すには、**掛け算のまま考える**必要があります。
`,
    },
    {
      kind: 'formula',
      tex: 'k \\;=\\; 1 - r^{\\,\\Delta t}',
      readAloud:
        '$r$ は「1 秒たったときに残っている割合」です。たとえば $r = 0.001$ なら、1 秒で 99.9% 詰まります。これを $\\Delta t$ 乗すれば、そのフレームぶんに残る割合が出るので、1 から引いたものが「詰める割合」になります。',
      worked: {
        given: '「$1$ 秒で $99.9\\%$ 詰める」追従を書きます（$r = 0.001$ ＝ $1$ 秒後に残る割合）。',
        steps: [
          { calc: '60fps  : k = 1 - 0.001^(1/60)' },
          { calc: '         = 1 - 0.8913 = 0.1087' },
          { calc: '120fps : k = 1 - 0.001^(1/120)' },
          { calc: '         = 1 - 0.9441 = 0.0559' },
          { calc: '【確かめ】60fps で 60 回ぶん残る量' },
          { calc: '  (1 - 0.1087)^60 = 0.001', note: 'ちゃんと 0.1% まで詰まった' },
          { calc: '  (1 - 0.0559)^120 = 0.001', note: '120fps でも同じところに着く' },
        ],
        result:
          '**どちらも $1$ 秒後にちょうど $0.001$。** これが正しい直し方です。**単純に $dt$ で割った場合**と比べてみてください ― $0.1087 / 2 = 0.0544$ で、正解の $0.0559$ とはわずかに違います。$1$ フレームでは無視できる差ですが、**$120$ 回積み重なれば効いてきます。** $0.0544$ で $120$ 回なら残るのは $0.00122$。$22\\%$ ずれます。**掛け算のものは、掛け算のまま扱う。** これが原則です。',
      },
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '複利と単利',
      text: `
年利 12% を「月 1% ずつ」と言い換えると、12 か月で 12.68% になります。12% ではありません。

追従も同じで、毎フレーム「残りの何割か」を詰めるのは複利です。
回数が変われば、単純な割り算では合いません。

$r^{\\Delta t}$ という形は、まさに複利の式です。
「1 秒で $r$ 倍になる変化を、$\\Delta t$ 秒ぶんだけ進める」を表しています。
`,
    },
    {
      kind: 'sandbox',
      title: '3 とおりの追従を、並べて比べる',
      code: `import * as THREE from 'three';

// フレームレートを間引いて、違いを目に見えるようにする
// 1: 毎フレーム / 2: 1つ飛ばし / 4: 3つ飛ばし
const SKIP = 4;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(
  new THREE.DirectionalLight(0xffffff, 2.6).translateY(4).translateZ(5),
  new THREE.HemisphereLight(0x99bbff, 0x101020, 0.7),
);

// 目標。左右に往復する
const target = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 24, 16),
  new THREE.MeshBasicMaterial({ color: 0x5a5a78 }),
);
scene.add(target);

function follower(color, y) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 32, 20),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4 }),
  );
  m.position.y = y;
  scene.add(m);
  return m;
}

const a = follower(0xff6b8a, 2.0);    // 固定の lerp（間違い）
const b = follower(0xffd166, 0);      // dt で割った lerp（惜しい）
const c = follower(0x4fd6ff, -2.0);   // r^dt（正しい）

const REMAIN_PER_SEC = 0.001;         // 1 秒で 99.9% 詰める
const clock = new THREE.Clock();
let frame = 0;
let acc = 0;

renderer.setAnimationLoop(() => {
  acc += Math.min(clock.getDelta(), 0.05);
  frame++;
  if (frame % SKIP !== 0) { renderer.render(scene, camera); return; }

  const dt = acc;                     // 間引いたぶん、まとめて進める
  acc = 0;
  const t = clock.getElapsedTime();

  target.position.x = Math.sin(t * 0.7) * 3.6;

  // A : 固定の割合。呼ばれる回数で速さが変わる
  a.position.x += (target.position.x - a.position.x) * 0.1;

  // B : dt に比例させただけ。掛け算なのに足し算で近似している
  b.position.x += (target.position.x - b.position.x) * Math.min(0.1 * dt * 60, 1);

  // C : 掛け算のまま扱う。これが正しい
  const k = 1 - Math.pow(REMAIN_PER_SEC, dt);
  c.position.x += (target.position.x - c.position.x) * k;

  // 目標との距離を出す
  if (frame % 60 === 0) {
    console.log(
      'dt', dt.toFixed(3),
      '/ A', Math.abs(a.position.x - target.position.x).toFixed(2),
      '/ B', Math.abs(b.position.x - target.position.x).toFixed(2),
      '/ C', Math.abs(c.position.x - target.position.x).toFixed(2),
    );
  }

  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**`SKIP` を 1 と 4 で切り替えてください。** `1` なら 3 つともほぼ同じ動きです。`4` にすると ― **ピンク（A）だけが大きく遅れます。** 呼ばれる回数が 4 分の 1 になったのに、1 回あたりの詰め方が同じだからです。アンバー（B）と水色（C）は追従を保ちますが、コンソールの数字を見ると B のほうがわずかにずれています。',
    },
    {
      kind: 'md',
      text: `
## three には、これ用の関数がある

自分で \`Math.pow\` を書かなくても、three が用意しています。

\`THREE.MathUtils.damp(current, target, lambda, dt)\`

\`lambda\` は「速さ」を表す数で、大きいほど速く追いつきます。
中身は $1 - e^{-\\lambda \\Delta t}$ ― 上の式と同じ形です
（$r = e^{-\\lambda}$ と置いたもの）。

**目安**

| lambda | 追いつく速さ |
|---|---|
| $1$ | ゆったり。$1$ 秒で $63\\%$ |
| $3$ | 標準。$1$ 秒で $95\\%$ |
| $6$ | きびきび。$1$ 秒で $99.8\\%$ |
| $12$ | ほぼ即時。$0.5$ 秒で $99.8\\%$ |

**カメラの追従なら $3$〜$6$ くらい**が扱いやすい範囲です。
`,
    },
    {
      kind: 'code',
      title: 'MathUtils.damp を使う',
      code: `import * as THREE from 'three';

const LAMBDA = 4;

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);

  // 1 つの数
  zoom = THREE.MathUtils.damp(zoom, targetZoom, LAMBDA, dt);

  // ベクトル。成分ごとに掛ける
  const k = 1 - Math.exp(-LAMBDA * dt);
  camera.position.lerp(targetPos, k);
  controls.target.lerp(lookAt, k);

  // 回転は slerp。lerp だと途中の長さが縮んで動きが歪む
  mesh.quaternion.slerp(targetQuat, k);

  // 色も同じ形で混ぜられる
  mesh.material.color.lerp(targetColor, k);

  controls.update();
  renderer.render(scene, camera);
});

// 軸ごとに速さを変えると、それらしくなる
// （横は速く、縦はゆっくり追う、など）
camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 6, dt);
camera.position.y = THREE.MathUtils.damp(camera.position.y, ty, 2, dt);`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '指数減衰は、絶対に目標へ届きません',
      text: `
$r^{\\Delta t}$ の形は、残りを掛け算で減らしていくだけなので、
数学的には永遠に 0 になりません。

ふつうは問題になりませんが、
「目標に着いたら次の処理へ」という判定を入れると、永久に進みません。

しきい値を決めてください。
if (v.distanceTo(target) < 0.001) v.copy(target);

あるいは「何秒で着く」を決めて、進み具合を 0 から 1 で持つ形
（[](#/ch/b35-easing) のイージング）に切り替えます。
`,
    },
    {
      kind: 'md',
      text: `
## 追従とイージングは、別のもの

似て見えますが、用途がはっきり分かれます。

**指数減衰（この章）**

- **目標がいつ変わってもよい。** 追いかけている途中で目標が動いても平気
- **いつ着くか決められない**（というより、着かない）
- カメラの追従、マウスの遅延、値のなめらか化

**イージング**（[](#/ch/b35-easing)）

- **始点と終点が決まっている。** $0$ から $1$ の進み具合を作る
- **何秒で着くか決められる**
- UI のアニメーション、決まった移動、演出

**目標が動き続けるなら減衰、決まった所へ行くならイージング。**

混ぜてはいけません。イージングの途中で目標を変えると、
進み具合の意味が壊れて動きが飛びます。
`,
    },
    {
      kind: 'md',
      text: `
## ばね ― もう一段それらしくする

指数減衰は「ぬるっと寄る」動きです。
**行き過ぎて戻る**動き（オーバーシュート）は作れません。

カードがぽんと出る、カメラがわずかに行き過ぎて戻る ―
こうした「生きている感じ」は、**ばね**で作ります。

考え方は物理そのものです。

- **ばねの力** … 目標から離れているほど強く引き戻す。$-k x$
- **抵抗** … 速度に比例してブレーキ。$-c v$

$2$ つの係数で、動きの性格が決まります。

- **抵抗が弱い** … 何度も行き来する（ぷるぷる）
- **ちょうどよい** … $1$ 回だけわずかに行き過ぎて収まる（気持ちいい）
- **抵抗が強い** … 行き過ぎずにゆっくり寄る（指数減衰と同じ）
`,
    },
    {
      kind: 'code',
      title: 'ばねで追いかける',
      code: `// 位置だけでなく、速度も状態として持つのが肝
let pos = 0;
let vel = 0;

const STIFFNESS = 120;    // ばねの硬さ。大きいほど速い
const DAMPING = 14;       // 抵抗。小さいと何度も行き来する

function spring(target, dt) {
  const force = (target - pos) * STIFFNESS - vel * DAMPING;
  vel += force * dt;
  pos += vel * dt;
  return pos;
}

// 「ちょうど 1 回だけ行き過ぎる」係数の目安
//   DAMPING = 2 * Math.sqrt(STIFFNESS) が臨界（行き過ぎない）
//   その 0.6 〜 0.8 倍にすると、1 回だけ行き過ぎて収まる
const critical = 2 * Math.sqrt(STIFFNESS);      // 21.9
const damping = critical * 0.65;                // 14.2 ← 上の値

// dt が跳ねると発散するので、上限は必須
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.033);
  card.position.y = spring(targetY, dt);
  renderer.render(scene, camera);
});`,
    },
  ],
  exercises: [
    {
      prompt: `「$0.5$ 秒で $95\\%$ 詰める」追従を書きたい。
$60$fps のときの $k$ と、$30$fps のときの $k$ を求めてください。
そして、$30$fps で $15$ 回進めたとき、残りがちゃんと $5\\%$ になることを確かめてください。`,
      hint: '$0.5$ 秒で残る割合が $0.05$ です。$1$ 秒あたりの $r$ に直してから使います。',
      answer: `**$60$fps で $k = 0.0950$、$30$fps で $k = 0.1810$** です。

**まず $1$ 秒あたりの $r$ に直す**

$0.5$ 秒で $0.05$ 残るので、$1$ 秒では $0.05^2 = 0.0025$。

つまり $r = 0.0025$ です。

**$60$fps**

$k = 1 - 0.0025^{1/60} = 1 - 0.9050 = 0.0950$

**$30$fps**

$k = 1 - 0.0025^{1/30} = 1 - 0.8190 = 0.1810$

**確かめ ― $30$fps で $15$ 回（$= 0.5$ 秒）**

残る割合は $(1 - 0.1810)^{15} = 0.8190^{15}$

$0.8190^{15} = 0.050$ ― **ちょうど $5\\%$ です。**

**$60$fps で $30$ 回（$= 0.5$ 秒）でも**

$(1 - 0.0950)^{30} = 0.9050^{30} = 0.050$ ― **同じです。**

**フレームレートが $2$ 倍違うのに、$0.5$ 秒後の状態は完全に一致します。**
これが $r^{\\Delta t}$ の効果です。

**単純に $2$ 倍した場合と比べる**

$60$fps 用の $0.0950$ を $30$fps 用に「$2$ 倍」すると $0.1901$。
正解の $0.1810$ より大きすぎます。

$15$ 回進めると $(1 - 0.1901)^{15} = 0.0423$ ―
**$5\%$ ではなく $4.23\%$。$15\%$ ずれています。**

$1$ 回では無視できる差が、積み重なると効いてくる。
**掛け算のものは、掛け算のまま扱ってください。**`,
      answerCode: `import * as THREE from 'three';

// 「HALF 秒で REMAIN だけ残る」から、1 秒あたりの r を出す
const HALF = 0.5, REMAIN = 0.05;
const r = Math.pow(REMAIN, 1 / HALF);      // 0.0025

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const k = 1 - Math.pow(r, dt);
  camera.position.lerp(targetPos, k);
  renderer.render(scene, camera);
});

// three の damp を使うなら、lambda に直す
const lambda = -Math.log(r);               // 5.99
camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, lambda, dt);`,
    },
    {
      prompt: `カメラを目標へ寄せて、**着いたら次の演出を始めたい。**
\`if (camera.position.distanceTo(target) === 0)\` と書いたところ、
**永久に始まりません。** なぜですか。`,
      hint: '残りを掛け算で減らし続けると、どうなりますか。',
      answer: `**指数減衰は、数学的に目標へ届かないからです。**

毎フレーム残りが $0.95$ 倍になるとすると、

$1$ 秒後 … $0.05$
$2$ 秒後 … $0.0025$
$10$ 秒後 … $10^{-13}$

**$0$ に近づきますが、$0$ にはなりません。** 掛け算だからです。

浮動小数の精度の下で、いつかは $0$ に丸められる可能性はありますが、
**それを待つ設計は正しくありません。**

**直し方は 2 つ。**

**1. しきい値で切る**

\`if (camera.position.distanceTo(target) < 0.001) camera.position.copy(target)\`

「十分近い」を「着いた」とみなし、**ぴったり合わせてしまいます。**
実務ではこれで十分です。

しきい値は、**画面上で 1 ピクセル未満になる距離**を目安にしてください。
カメラから $10$ の距離にあるものなら、$0.005$ くらいで見分けがつきません。

**2. そもそも減衰を使わない**

「着く」ことが仕様なら、**イージングのほうが正しい道具**です。

進み具合を $0$ から $1$ で持ち、$1$ になったら着いた ―
**判定が明確**で、しかも「何秒で着く」を指定できます。

**使い分け**

- **目標が動き続ける**（プレイヤーを追うカメラ）→ **減衰**。着く必要がない
- **決まった所へ行く**（演出、UI）→ **イージング**。着く必要がある

**「着いたか」を判定したくなった時点で、道具の選択が間違っている**可能性が高い、
と考えてください。`,
      answerCode: `// A. しきい値で切る
const k = 1 - Math.exp(-4 * dt);
camera.position.lerp(target, k);

if (camera.position.distanceTo(target) < 0.005) {
  camera.position.copy(target);      // ぴったり合わせる
  onArrived();
}

// B. そもそもイージングで書く（「着く」が仕様なら、こちらが正しい）
const DURATION = 1.2;
let elapsed = 0;

function update(dt) {
  elapsed = Math.min(elapsed + dt, DURATION);
  const t = elapsed / DURATION;
  const eased = t * t * (3 - 2 * t);              // smoothstep
  camera.position.lerpVectors(from, to, eased);

  if (elapsed >= DURATION) onArrived();           // 判定が明確
}`,
    },
    {
      prompt: `カードが「ぽんと出て、わずかに行き過ぎてから収まる」動きを作りたい。
**指数減衰では作れません。** なぜですか。何を使いますか。`,
      hint: '減衰は、目標を通り越すことがありますか。',
      answer: `**指数減衰は、目標を通り越さないからです。ばねを使います。**

**なぜ通り越さないか**

$k$ は $0$ から $1$ のあいだの値です。

$\\text{新しい位置} = \\text{現在} + (\\text{目標} - \\text{現在}) \\times k$

$k \\le 1$ なので、進む量は**残り距離を超えません。**
$k = 1$ でちょうど目標、それ未満なら手前で止まる。**構造上、行き過ぎられません。**

**ばねなら行き過ぎます**

ばねは**速度を状態として持ちます。**

1. 目標から離れているほど強く引かれる（$-kx$）
2. 引かれた結果、速度が付く
3. 目標に着いたときも**速度が残っている**ので、通り過ぎる
4. 通り過ぎると逆向きに引かれ、戻ってくる

**「速度を持つ」ことが、行き過ぎの本質**です。
指数減衰は速度を持たず、毎フレーム位置だけを計算し直しています。

**係数の決め方**

$c_{\\text{critical}} = 2\\sqrt{k}$ が**臨界減衰** ―
「行き過ぎずに、いちばん速く収まる」境目です。

- **$c > c_{\\text{critical}}$** … 行き過ぎない（指数減衰とほぼ同じ）
- **$c = c_{\\text{critical}}$** … ぎりぎり行き過ぎない
- **$c \\approx 0.6 c_{\\text{critical}}$** … **$1$ 回だけ行き過ぎて収まる。これが気持ちいい**
- **$c \\ll c_{\\text{critical}}$** … 何度も行き来する（ぷるぷる）

$k = 120$ なら $c_{\\text{critical}} = 2\\sqrt{120} = 21.9$。
その $0.65$ 倍で $14.2$ ― これが「ぽん」の係数です。

**注意点 ― $dt$ の上限は必須**

ばねは差分で積む計算なので、$dt$ が跳ねると**発散します。**
数フレームで画面外へ飛んでいきます。

$0.033$ 秒（$30$fps 相当）くらいで頭打ちにしてください。
[](#/ch/t06-loop-clock)でやった話が、ここで効いてきます。`,
    },
  ],
  quiz: [
    {
      q: '`camera.position.lerp(target, 0.1)` の何が問題ですか。',
      choices: [
        '呼ばれる回数で速さが変わる（フレームレート依存）',
        'lerp は位置に使えない',
        '0.1 が大きすぎる',
        'target を毎フレーム更新できない',
      ],
      answer: 0,
      explain:
        '「毎フレーム残りの 10%」なので、120fps では 60fps の 2 倍の回数だけ詰めます。しかも掛け算で減るので、単純に dt を掛けても正しくは直りません。$k = 1 - r^{\\Delta t}$ の形にします。',
    },
    {
      q: '$k = 1 - r^{\\Delta t}$ の $r$ は何を表していますか。',
      choices: [
        '1 秒たったときに残っている割合',
        '1 フレームで詰める割合',
        '目標までの距離',
        'フレームレート',
      ],
      answer: 0,
      explain:
        '$r = 0.001$ なら「1 秒で 99.9% 詰まる」です。これを $\\Delta t$ 乗すればそのフレームで残る割合になり、1 から引けば詰める割合が出ます。複利の式と同じ形です。',
    },
    {
      q: '「わずかに行き過ぎてから収まる」動きを作りたい。適切なのはどれですか。',
      choices: [
        'ばね（速度を状態として持つ）',
        '指数減衰の lambda を上げる',
        'lerp の係数を 1 より大きくする',
        'イージングの時間を短くする',
      ],
      answer: 0,
      explain:
        '指数減衰は $k \\le 1$ なので構造上、目標を通り越せません。速度を持つばねなら、目標に着いたときも速度が残っているので通り過ぎ、逆向きに引かれて戻ります。抵抗を臨界の 0.6 倍ほどにすると 1 回だけ行き過ぎます。',
    },
  ],
};
