import type { Chapter } from '../types.ts';

export const chapterX18: Chapter = {
  slug: 'x18-camera-approach',
  part: 'project',
  number: 18,
  title: '寄る ― 毎フレーム、残りを少しずつ詰める',
  goal: 'カメラを目標へなめらかに寄せられるようになり、その動きが画面の速さに依存する理由と、依存しない書き方の作り方を説明できるようになります。',
  requires: ['x17-pick-drag', 'w25-damping', 'w28-camera-move'],
  threeApis: [
    'Vector3.lerp',
    'OrbitControls.target',
    'OrbitControls.update',
    'Clock.getDelta',
    'PerspectiveCamera.position',
  ],
  mathRecall: [
    { slug: 'w25-damping', note: '「残りの何割かを詰める」が追従の基本形' },
    { slug: 'b37-follow', note: '毎フレーム少しずつ近づける' },
    { slug: 'b04-power-root', note: '指数関数。$r^{\\Delta t}$ が鍵になる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 瞬間移動させない

前の章で、押した天体が分かるようになりました。
あとは**そこへカメラを動かす**だけです。

いちばん短いのは \`camera.position.copy(目標)\` ですが、これは**やってはいけません。**

視点が瞬間移動すると、見ている人は
**「どこへ来たのか」も「どこから来たのか」も分かりません。**
$3$ 次元の空間では、位置関係を運んでくれるのは動きだけです。

なめらかに動かす部分は、[](#/ch/08-interp)の \`lerp\` そのものです。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathbf{p} \\;\\leftarrow\\; \\mathbf{p} + (\\mathbf{p}_{\\text{目標}} - \\mathbf{p})\\,k',
      readAloud:
        'いまの位置に、目標までの差の $k$ 倍を足して新しい位置にする、と読みます。$k$ は $0.06$ くらい。毎フレーム残りの $6$ パーセントを詰めるので、近づくほど動く量が減り、勝手に減速して見えます。',
      worked: {
        given: 'カメラが $(0,0,10)$ にいて、目標が $(0,0,4)$、$k = 0.06$ のとき。最初の $3$ フレームを追います。',
        steps: [
          { calc: '1 : 差 = 4 - 10 = -6' },
          { calc: '    -6 x 0.06 = -0.36  →  z = 9.64' },
          { calc: '2 : 差 = 4 - 9.64 = -5.64' },
          { calc: '    -5.64 x 0.06 = -0.338 → z = 9.302', note: '動く量が減った' },
          { calc: '3 : 差 = 4 - 9.302 = -5.302' },
          { calc: '    -5.302 x 0.06 = -0.318 → z = 8.984' },
          { calc: '残りが 1% になるまでのフレーム数' },
          { calc: '  log(0.01) / log(0.94) = 74.4' },
        ],
        result:
          '**$0.36 \\to 0.338 \\to 0.318$ と、勝手に減速していきます。** イージングの関数を $1$ つも書いていないのに「近づくほどゆっくり」が出るのが、この式の気持ちよさです。そして残り $1\\%$ まで **$74.4$ フレーム** ― この「フレーム」という単位が、次の問題になります。',
      },
    },
    {
      kind: 'md',
      text: `
## フレームで数えているものは、画面の速さで変わる

$74.4$ フレームは、時間にすると何秒でしょうか。

**画面によって違います。**

- $60$ フレーム毎秒の画面 … $74.4 \\div 60 = 1.24$ 秒
- $120$ フレーム毎秒の画面 … $74.4 \\div 120 = 0.62$ 秒

**同じコードが、$2$ 倍の速さで動きます。**

高性能な機械で作って調整した「ちょうどよい寄り方」が、
古い機械では**$2$ 倍もったり**します。逆もまた同じです。

カメラの寄りくらいなら許せる差ですが、
**「$3$ 秒で消える」「$1$ 秒で届く」のように、時間が意味を持つものでは致命的**です。
`,
    },
    {
      kind: 'formula',
      tex: 'k \\;=\\; 1 - r^{\\,\\Delta t}',
      readAloud:
        '$1$ 秒あたり残りを $r$ 倍にする、という指定から、そのフレームで詰めるべき割合 $k$ を作る式です。$r = 0.001$ なら「$1$ 秒で残りを $1000$ 分の $1$ にする」。$\\Delta t$ が変わっても、同じ時間で同じところに着きます。',
      worked: {
        given: '$r = 0.001$（$1$ 秒で残りを $\\frac{1}{1000}$ にする）で、$3$ つの画面を比べます。',
        steps: [
          { calc: '30 fps : dt = 0.0333' },
          { calc: '  k = 1 - 0.001^0.0333 = 0.20567' },
          { calc: '60 fps : dt = 0.0167' },
          { calc: '  k = 1 - 0.001^0.0167 = 0.10875' },
          { calc: '120 fps: dt = 0.00833' },
          { calc: '  k = 1 - 0.001^0.00833 = 0.05594' },
          { calc: '残り 1% になるまでの時間' },
          { calc: '  = log(0.01)/log(0.001) = 0.667 秒', note: '3 つとも同じ' },
        ],
        result:
          '**$k$ は画面ごとに違うのに、着く時間は $3$ つとも $0.667$ 秒**です。フレームあたりの割合を固定するのではなく、**$1$ 秒あたりの割合を固定して、そこから毎フレームの $k$ を作り直している**からです。$\\Delta t$ が揺れても（$60$ fps の画面でも実際は揺れます）、合計は同じところへ収束します。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'なぜ「1 - r^dt」で正しくなるのか',
      text: `
毎フレーム残りを $(1-k)$ 倍にしているので、
$n$ フレーム後の残りは $(1-k)^{n}$ です。

$1$ 秒ぶんのフレーム数は $1/\\Delta t$ なので、$1$ 秒後の残りは

$(1-k)^{1/\\Delta t}$

これを $r$ にしたい。両辺を $\\Delta t$ 乗すると $1-k = r^{\\Delta t}$、
つまり $k = 1 - r^{\\Delta t}$ です。

**指数がフレーム数を吸収してくれる**のが要点で、
これは[](#/ch/w25-damping)でやった減衰の式そのものです。

$r$ の意味は「**$1$ 秒放っておいたら、残りが何倍になるか**」。
$0.001$ なら $1000$ 分の $1$、$0.5$ ならまだ半分残っています。
`,
    },
    {
      kind: 'md',
      text: `
## 動かすものは、2 つある

\`OrbitControls\` を使っている画面では、**カメラの位置だけを動かしても足りません。**

コントロールは「注視点（\`controls.target\`）のまわりを回る」仕組みなので、
位置だけ動かすと、**古い注視点を向いたまま横へ滑って**いきます。

だから $2$ つを同時に寄せます。

- \`camera.position\` … 天体から少し離れた位置へ
- \`controls.target\` … 天体の中心へ

$2$ つとも同じ $k$ で詰めれば、**動きは $1$ つのなめらかな寄りに見えます。**
`,
    },
    {
      kind: 'md',
      text: `
## 「少し離れた位置」の作り方

天体の中心へカメラを寄せると、**中に入ってしまいます。**
中心から少し離れたところで止めなければなりません。

素直に「中心の手前 $5$」と書くと、**どちらが手前かが決まりません。**
そこで、**いまの視線の向きをそのまま保ちます。**

- いまのカメラから、いまの注視点への向きを取る
- その逆向きに、天体の中心から距離 $d$ だけ離れた点を作る

こうすると「**同じ角度から見たまま、寄るだけ**」になります。
視点の高さも、まわりこみ具合も変わりません ―
**人が自分で回した向きを、勝手に変えないこと**が、いちばん大事な作法です。
`,
    },
    {
      kind: 'code',
      title: '目標を 2 つ作って、毎フレーム両方を詰める',
      code: `// クリックしたときに、目標を決める（動かすのはループの中）
const center = object.getWorldPosition(new THREE.Vector3());
const distance = object === moon ? 1.6 : 5.2;

desiredTarget.copy(center);
desiredPosition
  .copy(camera.position)
  .sub(controls.target)   // いまの視線の向き
  .normalize()
  .multiplyScalar(distance)
  .add(center);           // 天体の中心から、その向きに distance だけ離れた点

// ループの中。残りの 6 パーセントを詰める
camera.position.lerp(desiredPosition, 0.06);
controls.target.lerp(desiredTarget, 0.06);
controls.update();`,
    },
    {
      kind: 'sandbox',
      title: '2 つの画面速度で、同じコードを走らせる',
      guide: { focus: ['固定の k ― 画面が速いほど速く着く', 'dt から作る k ― どの速さでも同じ'] },
      code: `import * as THREE from 'three';

// 同じページの中で、2 つの画面速度を再現する。
// 「60 fps の機械」と「120 fps の機械」を並べて走らせ、
// 同じ寄り方のコードが、どちらでどう振る舞うかを見る

const START = -6;
const GOAL = 3;
const FIXED_K = 0.06;    // 毎フレーム 6 パーセント詰める
const RATE = 0.001;      // 1 秒で残りを 1000 分の 1 にする

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.DirectionalLight(0xffffff, 2.4).translateZ(6), new THREE.AmbientLight(0xffffff, 0.7));

// 目標の位置に、細い柱を立てておく
scene.add(new THREE.Mesh(
  new THREE.BoxGeometry(0.04, 6.4, 0.04),
  new THREE.MeshBasicMaterial({ color: 0x4a9dff }),
).translateX(GOAL));

const runners = [
  { label: '固定 k = 0.06   /  60 fps の機械', y: 2.1, fps: 60, fixed: true, color: 0xff7ad9 },
  { label: '固定 k = 0.06   / 120 fps の機械', y: 0.7, fps: 120, fixed: true, color: 0xff7ad9 },
  { label: 'k = 1 - 0.001^dt /  60 fps の機械', y: -0.7, fps: 60, fixed: false, color: 0x7ce7ff },
  { label: 'k = 1 - 0.001^dt / 120 fps の機械', y: -2.1, fps: 120, fixed: false, color: 0x7ce7ff },
].map((spec) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 32, 20),
    new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.6 }),
  );
  mesh.position.set(START, spec.y, 0);
  scene.add(mesh);

  const div = document.createElement('div');
  div.style.cssText =
    'position:absolute; left:16px; color:#9fb4d8; font:12px ui-monospace, monospace;' +
    'pointer-events:none; white-space:pre;';
  document.body.appendChild(div);

  return { ...spec, mesh: mesh, div: div, x: START, acc: 0, time: 0, reached: 0 };
});

/* ---- 固定の k ― 画面が速いほど速く着く ---- */
/* ---- dt から作る k ― どの速さでも同じ ---- */

function step(runner, dt) {
  const k = runner.fixed ? FIXED_K : 1 - Math.pow(RATE, dt);
  runner.x += (GOAL - runner.x) * k;
  runner.time += dt;
}

let elapsed = 0;
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  elapsed += dt;

  for (const runner of runners) {
    // その機械のフレーム間隔ぶんだけ、まとめて進める
    const stepTime = 1 / runner.fps;
    runner.acc += dt;
    while (runner.acc >= stepTime) {
      runner.acc -= stepTime;
      step(runner, stepTime);
    }
    runner.mesh.position.x = runner.x;

    const remain = Math.abs(GOAL - runner.x) / Math.abs(GOAL - START);
    // 残り 1% を切った瞬間の時刻を覚えておく。これが「着いた時間」
    if (runner.reached === 0 && remain < 0.01) runner.reached = runner.time;

    runner.div.style.top = (window.innerHeight / 2 - runner.y * 44 - 8) + 'px';
    runner.div.textContent =
      runner.label +
      '   残り ' + (remain * 100).toFixed(1).padStart(5) + ' %' +
      '   残り1%まで ' + (runner.reached > 0 ? runner.reached.toFixed(2) + ' 秒' : '  ―   ');
  }

  // 4 秒ごとに、最初からやり直す
  if (elapsed > 4) {
    elapsed = 0;
    for (const runner of runners) { runner.x = START; runner.acc = 0; runner.time = 0; runner.reached = 0; }
  }

  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '各行の右端に、残り $1\\%$ に達した時刻が出ます。**ピンクの $2$ つ（固定の $k$）は $1.25$ 秒と $0.63$ 秒**、水色の $2$ つ（$\\Delta t$ から作る $k$）は**どちらも $0.68$ 秒**です。計算値（$1.24$ / $0.62$ / $0.667$）よりわずかに大きいのは、$1\\%$ を切ったかどうかをステップの区切りでしか見ていないためで、$1$ ステップぶん行き過ぎた時刻が出ます。動いているあいだも、ピンクは $2$ つが離れていき、水色はぴたりと重なったまま進みます。$4$ 秒ごとに最初へ戻るので何度でも見比べられます。`RATE` を $0.5$ にすると「$1$ 秒で半分」になり、$4$ 秒たっても着きません。',
    },
    {
      kind: 'md',
      text: `
## それでも、この作品は固定の k を使っています

ここまで書いておいて、完成版のコードは \`lerp(desired, 0.06)\` のままです。

理由は $2$ つあります。

- **カメラの寄りは、時間が意味を持たない**。$1.2$ 秒でも $0.6$ 秒でも「なめらかに寄った」で済みます
- **$1$ 行が短い**。読む人にとって \`lerp(目標, 0.06)\` は説明が要りません

**「正しいほうを常に選ぶ」のは、正しい態度ではありません。**
どこで正確さが要るかを決めて、そこにだけ払うほうが、全体としては読みやすくなります。

**払うべき場所**は、たとえばこういうところです。

- 弾が飛ぶ、敵が追ってくる ― 速さが**遊びの公平さ**に直結する
- 演出が「$3$ 秒で終わる」前提で、音と合わせている
- **物理**（跳ね返り・摩擦）。$\\Delta t$ が変わると挙動そのものが変わる

カメラの寄りは、そのどれでもありません。
`,
    },
  ],
  exercises: [
    {
      prompt: `$k = 0.06$ のまま、$30$ フレーム毎秒の機械で動かしたとします。

残り $1\\%$ まで何秒かかりますか。$60$ fps の何倍ですか。`,
      hint: 'フレーム数は変わりません。変わるのは $1$ フレームの長さだけです。',
      answer: `**$2.48$ 秒。$60$ fps の $2$ 倍です。**

**計算**

フレーム数は画面の速さに関係なく $74.4$ フレームです。

$74.4 \\div 30 = 2.48$ 秒

$60$ fps では $1.24$ 秒だったので、ちょうど $2$ 倍。

**まとめると**

| 画面 | 時間 |
|---|---|
| $120$ fps | $0.62$ 秒 |
| $60$ fps | $1.24$ 秒 |
| $30$ fps | $2.48$ 秒 |

**古い機械ほど、遅く感じる**

これは二重に不利です。

- 描画が重いので、そもそも動きがかくつく
- **そのうえ、寄る動きまで倍の時間がかかる**

速い機械で調整すると、遅い機械では
「重いだけでなく、もっさりしている」という印象になります。

**逆は起きない**

遅い機械で調整して速い機械で動かすと、$0.62$ 秒 ―
**速すぎて見失う**ほうへ振れます。

どちらにしても、**開発機と同じ体験は他人の機械では起きません。**
$\\Delta t$ から $k$ を作る書き方は、この不一致を消すためのものです。`,
    },
    {
      prompt: `\`camera.position\` だけを \`lerp\` して、\`controls.target\` を動かさなかったとします。

カメラはどう動きますか。`,
      hint: '\`OrbitControls\` は、注視点のまわりを回ります。カメラはどこを向きますか。',
      answer: `**目標のそばまでは行きますが、そこを見ません。**

**何が起きるか**

\`controls.update()\` は、毎フレーム「カメラを \`target\` のほうへ向ける」処理をします。

\`target\` が原点のままなら、カメラは**原点を向いたまま**移動します。

月に寄ろうとすると、

- カメラは月の近くまで飛んでいく
- でも**顔は惑星のほうを向いたまま**
- 月は画面の端に、あるいは画面の外にいる

**「近くまで来たのに、見えていない」**という奇妙な状態です。

**さらに悪いこと**

そのあと視点を回すと、**原点のまわりを回ります。**

月のそばにいるので、少し回しただけで月が画面から飛び出します。
使う人には「**急に操作が過敏になった**」と感じられます。

**注視点は「回転の中心」でもある**

\`OrbitControls\` の \`target\` は $2$ つの役を持っています。

- カメラが向く先
- **視点を回すときの中心**

寄る動きでは、この $2$ つ**両方**を移す必要があります。
だから位置と注視点を、同じ $k$ で同時に詰めます。`,
      answerCode: `// 位置と注視点、両方を同じ割合で詰める
camera.position.lerp(desiredPosition, 0.06);
controls.target.lerp(desiredTarget, 0.06);
controls.update();   // target が動いたら、必ず update を呼ぶ`,
    },
    {
      prompt: `寄る先を「天体の中心から距離 $d$」で決めています。

$d$ を天体の半径から自動で決めるとしたら、どんな式にしますか。
画角 $45$ 度で、画面の高さの半分を占めさせたい場合を考えてください。`,
      hint: '距離 $z$ で写る高さは $2z\\tan(\\mathrm{fov}/2)$ でした。天体の直径がその半分になればよい。',
      answer: `**$d = \\dfrac{2r}{\\tan(\\mathrm{fov}/2)}$ です。**

**導き方**

天体の直径 $2r$ が、写る高さ $2d\\tan(\\mathrm{fov}/2)$ の**半分**を占めてほしい。

$2r = \\dfrac{1}{2} \\times 2d\\tan(\\mathrm{fov}/2)$

$d = \\dfrac{2r}{\\tan(\\mathrm{fov}/2)}$

**確かめ**

$\\mathrm{fov} = 45$ 度なら $\\tan 22.5° = 0.4142$。

- 惑星（$r = 1.6$）… $d = 3.2 / 0.4142 = 7.73$
- 月（$r = 0.44$）… $d = 0.88 / 0.4142 = 2.12$

作品の決め打ちの値は $5.2$ と $1.6$ でした。
**どちらも計算値より近い** ― つまり画面の半分よりも大きく写します。

**決め打ちで足りている理由**

天体が $2$ つしかないからです。**$2$ つなら目で決めたほうが速い。**

式が要るのは、こういうときです。

- 天体を**あとから増やす**（半径がばらばら）
- **読み込んだモデル**に寄る（大きさが事前に分からない）

後者では \`Box3.setFromObject(object)\` で外接箱を測り、
その大きさから $d$ を出します ―
[](#/ch/w35-fit-model)でやった「届いたモデルを直す」と同じ道具です。

**画角も効くことを忘れずに**

$\\mathrm{fov}$ を $30$ 度に変えると $\\tan 15° = 0.268$ で、$d$ は $1.55$ 倍になります。
**決め打ちの距離は、画角を変えた日に全部おかしくなります。**`,
    },
  ],
  quiz: [
    {
      q: '`position.lerp(target, 0.06)` を毎フレーム呼ぶと、動きはどうなりますか。',
      choices: [
        '残りの 6% ずつ詰めるので、近づくほど動く量が減り、勝手に減速する',
        '一定の速さでまっすぐ進む',
        '最初は遅く、あとで速くなる',
        '目標を行き過ぎて振動する',
      ],
      answer: 0,
      explain:
        '毎回「残りの 6%」なので、残りが減れば動く量も減ります。0.36 → 0.338 → 0.318 と自然に減速し、イージング関数を 1 つも書かずに「近づくほどゆっくり」が出ます。残り 1% までは 74.4 フレームです。',
    },
    {
      q: '`k = 0.06` の固定値が抱える問題はどれですか。',
      choices: [
        '同じコードが 120fps の画面では 60fps の 2 倍速く着く（0.62 秒と 1.24 秒）',
        '目標に永久に着かない',
        'カメラが振動する',
        'OrbitControls と併用できない',
      ],
      answer: 0,
      explain:
        '「毎フレーム 6%」はフレームを単位にしているので、1 秒あたりのフレーム数が変われば結果も変わります。k = 1 - r^dt の形にすると、1 秒あたりの割合を固定して毎フレームの k を作り直すので、30fps でも 120fps でも 0.667 秒で同じところへ着きます。',
    },
    {
      q: '`OrbitControls` を使っている画面で天体に寄るとき、動かすべきものはどれですか。',
      choices: [
        'camera.position と controls.target の両方',
        'camera.position だけ',
        'controls.target だけ',
        'camera.lookAt を毎フレーム呼ぶ',
      ],
      answer: 0,
      explain:
        'target はカメラの向く先であると同時に、視点を回すときの中心でもあります。位置だけ動かすと、目標のそばまで行っても古い注視点を向いたままになり、そのあと視点を回すと遠くの中心のまわりを回るので操作が過敏になります。両方を同じ k で詰めれば、1 つのなめらかな寄りに見えます。',
    },
  ],
};
