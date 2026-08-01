import type { Chapter } from '../types.ts';

export const chapterT06: Chapter = {
  slug: 't06-loop-clock',
  part: 'threejs',
  number: 24,
  title: '時間の刻み方 ― $dt$ の落とし穴',
  goal: '経過時間と差分を使い分けられるようになり、タブ復帰の飛びや誤差の蓄積を防げるようになります。',
  requires: ['w23-fill-light', 'w02-render-loop'],
  threeApis: [
    'Clock',
    'Clock.getDelta',
    'Clock.getElapsedTime',
    'Clock.running',
    'Clock.start',
    'Clock.stop',
  ],
  mathRecall: [
    { slug: 'b22-wave', note: '繰り返す動きは、経過時間から直接決める' },
    { slug: 'b06-float', note: '足し続けると、誤差が積もる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 時間の使い方は、2 通りある

[](#/ch/w02-render-loop)で $dt$ を掛ける理由をやりました。
ここからは、その先の話です。

three の \`Clock\` は 2 つの値をくれます。

- **\`getDelta()\`** … 前のフレームからの経過秒。だいたい $0.0167$
- **\`getElapsedTime()\`** … 始まってからの通算秒。$0, 0.0167, 0.033, \\ldots$

**この 2 つは、使い分けが決まっています。**

- **繰り返す動き**（往復・円運動・波・点滅）→ **経過時間**から**直接決める**
- **積み上げる動き**（移動・回転・入力に応じた変化）→ **差分**を**足していく**

理由は誤差です。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '時計を見るか、歩数を数えるか',
      text: `
「10 時にどこにいるか」を知りたいなら、時計を見ればいい。
何時間歩いたか覚えていなくても、時計は正しい時刻を教えてくれます。

「いまどこにいるか」を歩数から計算すると、
1 歩ごとのわずかな誤差が積もっていきます。

繰り返す動きは時計を見る。
積み上がる動きは歩数を数える。それ以外に方法がありません。
`,
    },
    {
      kind: 'md',
      text: `
## 繰り返す動きは、経過時間から直接

$\\sin$ で上下させる動きを、2 通りに書いてみます。

**差分で書くと** … \`phase += dt * speed; y = Math.sin(phase)\`

これは動きますが、\`phase\` に**毎フレーム誤差が加わります。**
[](#/ch/b06-float)でやったとおり、浮動小数の足し算は正確ではありません。

$1$ 時間動かせば $21$ 万回の足し算。ずれは目に見えるほどになります。

**経過時間で書くと** … \`y = Math.sin(clock.getElapsedTime() * speed)\`

**誤差が積もりません。** 経過時間は毎回「開始からの差」として計算し直されるので、
過去のずれを引きずらないからです。

さらに大きな利点があります。**いつでも「$t$ 秒後の状態」を計算できる。**
巻き戻しも、早送りも、複数のものを同じ式で位相だけずらすのも自由です。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{誤差}_{\\text{差分}} \\;\\approx\\; \\varepsilon \\sqrt{N}, \\qquad \\text{誤差}_{\\text{経過時間}} \\;\\approx\\; \\varepsilon',
      readAloud:
        '差分を足し続けたときの誤差は、足した回数の平方根に比例して増えます。経過時間から直接求めれば、回数によらず一定です。$\\varepsilon$ は 1 回ぶんの丸め誤差です。',
      worked: {
        given:
          '$60$fps で **1 時間**動かします。float32 の丸め誤差を $\\varepsilon \\approx 6 \\times 10^{-8}$ として、両者の誤差を比べます。',
        steps: [
          { calc: 'フレーム数 N = 60 x 3600 = 216,000' },
          { calc: '【差分を足す】' },
          { calc: '  sqrt(216000) = 464.8' },
          { calc: '  6e-8 x 464.8 = 2.79e-5' },
          { calc: '【経過時間から】' },
          { calc: '  6e-8 のまま', note: '回数によらない' },
          { calc: '比 : 2.79e-5 / 6e-8 = 465 倍' },
        ],
        result:
          '**$465$ 倍の差**です。とはいえ $2.8 \\times 10^{-5}$ ラジアンは、$1$ 周の $200$ 万分の 1 ― **見た目には出ません。** では何が問題か。**問題は誤差の大きさではなく、$\\Delta t$ が「一定でない」こと**です。重い処理が入った瞬間、あるいはタブから戻った瞬間、$\\Delta t$ が大きく揺れます。差分で書いていると**その揺れがそのまま位相のずれとして残り、二度と戻りません。** 経過時間で書けば、次のフレームには正しい位置に戻ります。',
      },
    },
    {
      kind: 'sandbox',
      title: '差分と経過時間 ― タブを離れて戻ってみる',
      code: `import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.5, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(
  new THREE.DirectionalLight(0xffffff, 2.6).translateY(4).translateZ(4),
  new THREE.HemisphereLight(0x99bbff, 0x101020, 0.6),
);

const geometry = new THREE.SphereGeometry(0.42, 32, 20);

// A: 差分を足していく（誤差と揺れが積もる）
const byDelta = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xff6b8a }));
byDelta.position.x = -1.6;

// B: 経過時間から直接決める（積もらない）
const byTime = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x4fd6ff }));
byTime.position.x = 1.6;

scene.add(byDelta, byTime);

// 基準になる目盛り。ここに戻ってくるはず
for (const y of [-2, 0, 2]) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.02, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x3a3a5c }),
  );
  line.position.y = y;
  scene.add(line);
}

const clock = new THREE.Clock();
const SPEED = 1.4;

let phase = 0;      // A が持ち歩く状態

renderer.setAnimationLoop(() => {
  // ここを Math.min(..., 0.05) で頭打ちにすると、飛びが小さくなります
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  // A : 位相を積み上げる
  phase += dt * SPEED;
  byDelta.position.y = Math.sin(phase) * 2;

  // B : 経過時間から、その場で決める
  byTime.position.y = Math.sin(t * SPEED) * 2;

  // ずれを監視する
  const gap = byDelta.position.y - byTime.position.y;
  if (Math.abs(gap) > 0.01) {
    console.log('ずれ', gap.toFixed(3), '/ このフレームの dt', dt.toFixed(3));
  }

  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**2 つの球は最初ぴったり揃っています。** 別のタブに切り替えて数秒たってから戻ってきてください ― **ピンク（差分）だけがずれたまま戻りません。** 裏に回っているあいだ `requestAnimationFrame` は止まりますが時計は進むので、復帰したフレームの `dt` が数秒ぶんになります。水色（経過時間）は次のフレームで正しい位置に戻ります。',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'タブから戻ると、一気に飛びます',
      text: `
タブが裏に回ると requestAnimationFrame は止まりますが、時計は進み続けます。

戻ってきた瞬間の getDelta() が数秒ぶんになり、
差分で動かしているものが一気に飛びます。

物理計算なら、壁をすり抜けたり、速度が発散したりします。

対策は上限を設けること。
const dt = Math.min(clock.getDelta(), 0.05);

1 フレームぶんを 50ms 程度で頭打ちにすると、飛びが起きません。
「実時間より遅れる」ことになりますが、飛ぶよりはるかにましです。
`,
    },
    {
      kind: 'md',
      text: `
## $dt$ の上限は、必ず入れる

上のカードは「そういう場合もある」ではなく、**必ず入れるべき 1 行**です。

$dt$ が跳ねる場面は、思ったより多くあります。

- **タブを離れて戻った**（数秒〜数分）
- **重い処理が入った**（モデルの読み込み、シェーダのコンパイル）
- **端末がスリープから復帰した**
- **開発者ツールを開いた瞬間**

そして跳ねた $dt$ は、差分で書いたものすべてを壊します。

**上限の目安は $0.05$ 秒**（$20$fps 相当）。
これより遅いフレームは「そういうことにする」と割り切ります。
`,
    },
    {
      kind: 'code',
      title: '$dt$ を安全に取る',
      code: `import * as THREE from 'three';

const clock = new THREE.Clock();
const MAX_DT = 0.05;      // 20fps 相当。これ以上は頭打ちにする

renderer.setAnimationLoop(() => {
  // 1 フレームに 1 回だけ呼ぶ。2 回目はほぼ 0 が返る
  const dt = Math.min(clock.getDelta(), MAX_DT);
  const t = clock.getElapsedTime();

  update(dt, t);
  renderer.render(scene, camera);
});

// 一時停止したいとき
function pause() {
  clock.stop();            // getElapsedTime も止まる
}
function resume() {
  clock.start();           // ただし elapsedTime が 0 に戻るので注意
}

// 経過時間を保ったまま止めたいなら、自分で積む
let time = 0;
let paused = false;

function update(dt) {
  if (!paused) time += dt;   // 止まっているあいだは進まない
  wave.position.y = Math.sin(time * 2);
}`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'Clock.start() は経過時間を 0 に戻します',
      text: `
名前から「再開」に見えますが、three の Clock.start() は
elapsedTime を 0 にリセットします。

一時停止して再開したいなら、Clock だけでは足りません。
自分で time += dt と積んでおき、止めたいあいだは足さない、
という形にしてください。

これなら「巻き戻し」「早送り」「スローモーション」も
係数を掛けるだけで作れます。
`,
    },
    {
      kind: 'md',
      text: `
## 固定タイムステップ ― 物理が要るとき

物理シミュレーションや、当たり判定が絡む動きでは、
**$dt$ が揺れること自体が問題**になります。

$dt$ が $0.016$ のときと $0.05$ のときで、**計算結果が変わってしまう**からです。
速い弾が壁をすり抜ける、積み上げた箱が震える ― どれも $dt$ の揺れが原因です。

解決は「**時間を一定の刻みでしか進めない**」ことです。

1. 実時間の経過を、貯める（accumulator）
2. 貯まった量が $1/60$ 秒を超えたら、$1/60$ 秒ぶん進める
3. 超えているあいだ、繰り返す
4. 端数は次のフレームへ持ち越す

こうすれば、**物理は常に $1/60$ 秒刻みで動きます。**
描画のフレームレートとは無関係になります。
`,
    },
    {
      kind: 'code',
      title: '固定タイムステップ',
      code: `const FIXED = 1 / 60;          // 物理はこの刻みでしか進めない
const MAX_STEPS = 5;           // 1 フレームで進める上限（暴走を防ぐ）

let accumulator = 0;

renderer.setAnimationLoop(() => {
  accumulator += Math.min(clock.getDelta(), 0.25);

  let steps = 0;
  while (accumulator >= FIXED && steps < MAX_STEPS) {
    stepPhysics(FIXED);        // 常に同じ dt で呼ばれる
    accumulator -= FIXED;
    steps++;
  }

  // 端数ぶんを補間して描くと、なめらかに見える
  const alpha = accumulator / FIXED;
  render(alpha);
});

function render(alpha) {
  // 前の状態と現在の状態を alpha で混ぜる
  mesh.position.lerpVectors(prevPos, currPos, alpha);
  renderer.render(scene, camera);
}

// MAX_STEPS が無いと「重い → 進める量が増える → もっと重い」の悪循環になる`,
    },
    {
      kind: 'md',
      text: `
## どれを使うか ― 判断の表

| 動き | 使うもの | 理由 |
|---|---|---|
| 往復・円運動・波・点滅 | **経過時間** | 誤差も揺れも積もらない |
| 一定速度の移動・回転 | **差分** | 向きが変わるので、積むしかない |
| 入力に応じた動き | **差分** | 同上 |
| 追いかける・減衰する | **差分**（次の章） | 前の値が必要 |
| 物理・当たり判定 | **固定タイムステップ** | $dt$ の揺れ自体が問題 |
| 決まった秒数のアニメ | **自分で積んだ時間** | 進み具合を $0$〜$1$ で持つ |

**迷ったら経過時間。** 積む必要が本当にあるときだけ、差分にしてください。
`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスで、別のタブに $5$ 秒ほど切り替えてから戻ってきてください。
**何が起きますか。** そして \`clock.getDelta()\` を
\`Math.min(clock.getDelta(), 0.05)\` に変えると、どう変わりますか。`,
      hint: '裏に回っているあいだ、ループは止まりますが時計は進みます。',
      answer: `**ピンク（差分）だけが、ずれたまま戻りません。**

**何が起きたか**

タブが裏に回ると \`requestAnimationFrame\` は止まりますが、
\`Clock\` の内部で使われている時刻は進み続けます。

戻ってきた最初のフレームで \`getDelta()\` が **$5$ 秒ぶん**を返します。

- **ピンク** … \`phase += 5 * 1.4 = 7\` ラジアンが一度に加わる。
  $7 / 2\\pi = 1.11$ 周ぶん飛んで、**そのずれが永久に残ります**
- **水色** … \`Math.sin(t * 1.4)\` を計算し直すだけ。
  $t$ には $5$ 秒が正しく含まれているので、**正しい位置に着きます**

**\`Math.min(..., 0.05)\` を入れると**

ピンクの飛びが $0.05 \\times 1.4 = 0.07$ ラジアンに抑えられます。
ほとんど気づかない量です。

**そのかわり、ピンクは水色より $5$ 秒ぶん遅れます。**
実時間より遅れることになりますが、**飛ぶよりはるかにまし**です。

**これは必ず入れる 1 行です。**

$dt$ が跳ねる場面は、タブの切り替え以外にもあります。

- モデルの読み込みやシェーダのコンパイルで、1 フレームが数百ミリ秒かかる
- 端末がスリープから復帰した
- 開発者ツールを開いた瞬間

**物理計算が絡むと、跳ねた $dt$ は致命的です。** 弾が壁をすり抜けたり、
速度が発散して物体が飛んでいったりします。`,
    },
    {
      prompt: `$60$fps で **$10$ 分間**、\`phase += dt * 2\` と積み上げます。
**足し算は何回**行われますか。そして、途中で $1$ 回だけ $0.3$ 秒のフレームがあったとき、
**位相はどれだけずれますか。**`,
      hint: '正常なフレームは $0.0167$ 秒です。',
      answer: `**足し算は $36{,}000$ 回。ずれは $0.567$ ラジアン ― 一周の $9\\%$ です。**

**足し算の回数**

$60 \\times 60 \\times 10 = 36{,}000$ 回

**$0.3$ 秒のフレームによるずれ**

正常なフレームなら、$0.3$ 秒のあいだに $18$ 回のフレームが来て、
それぞれ $0.0167 \\times 2 = 0.0333$ ラジアンずつ進みます。

$18 \\times 0.0333 = 0.6$ ラジアン ― **これが「本来進むべき量」です。**

いっぽう $0.3$ 秒のフレームが $1$ 回来ると、$0.3 \\times 2 = 0.6$ ラジアン。

**同じです。** つまり $dt$ を掛けているかぎり、**遅いフレームでもずれません。**

**ではなぜ問題になるのか。**

$dt$ を **$0.05$ で頭打ち**にしていた場合です。

$0.05 \\times 2 = 0.1$ ラジアンしか進まない。
本来 $0.6$ 進むべきところが $0.1$ なので、**$0.5$ ラジアン遅れます。**

$0.5 / 2\\pi = 8\\%$ 一周ぶん。**そしてこの遅れは永久に残ります。**

**経過時間で書いていれば**

$\\sin(t \\times 2)$ は、$t$ が正しければ常に正しい位置を返します。
遅いフレームがあっても、**次のフレームで正しい位置に戻ります。**

**これが「繰り返す動きは経過時間で」の理由です。**

$dt$ の頭打ちは飛びを防ぐために必要ですが、
**その副作用として、差分で積むものは実時間から遅れていきます。**
繰り返す動きにその遅れを持ち込む理由はありません。`,
    },
    {
      prompt: `一時停止と再開ができるアニメーションを作りたい。
\`clock.stop()\` と \`clock.start()\` を使ったところ、**再開した瞬間に動きが飛びました。**
なぜですか。どう直しますか。`,
      hint: 'three の `Clock.start()` は、名前どおりの動きをしますか。',
      answer: `**\`Clock.start()\` は「再開」ではなく「最初から」だからです。**

three の \`Clock.start()\` は、内部の \`elapsedTime\` を **$0$ にリセット**します。

だから \`getElapsedTime()\` で位置を決めていると、
再開した瞬間に **$t = 0$ の位置へ飛びます。**

$10$ 秒動かして止めて再開すると、**$10$ 秒前の状態に戻る**わけです。

**直し方 ― 時間を自分で持つ**

\`Clock\` は $dt$ を得るためだけに使い、**通算時間は自分で積みます。**
下の解答例のように \`time += dt\` とし、止めたいあいだは足さない、という形です。

「経過時間で書け」と言ったのに積んでいるじゃないか、と思うかもしれません。
**ここで積んでいるのは「アニメーションの時計」であって、位相ではありません。**

位相は毎回 \`time * 2\` として計算し直されるので、
**誤差は $\\sin$ の中には入りません。**

**この形にすると、おまけが 3 つ手に入ります。**

- **スローモーション** … \`time += dt * 0.3\`
- **早送り** … \`time += dt * 3\`
- **巻き戻し** … \`time -= dt\`

どれも 1 行です。\`Clock\` に頼っていると、どれもできません。

**さらに、決まった秒数のアニメも同じ形で書けます。**
\`const progress = Math.min(time / duration, 1)\` で $0$〜$1$ の進み具合が得られ、
そこにイージング（[](#/ch/b35-easing)）を掛ければ完成です。`,
      answerCode: `import * as THREE from 'three';

const clock = new THREE.Clock();
const MAX_DT = 0.05;

let time = 0;          // アニメーションの時計。自分で持つ
let speed = 1;         // 1: 通常 / 0: 停止 / 0.3: スロー / -1: 巻き戻し

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), MAX_DT);
  time += dt * speed;

  // 位相は毎回 time から計算し直す。誤差は積もらない
  mesh.position.y = Math.sin(time * 2) * 2;
  mesh.rotation.y = time * 0.8;

  renderer.render(scene, camera);
});

pauseButton.onclick = () => { speed = speed === 0 ? 1 : 0; };
slowButton.onclick  = () => { speed = 0.25; };`,
    },
  ],
  quiz: [
    {
      q: '往復する動きを書くとき、推奨されるのはどちらですか。',
      choices: [
        '`Math.sin(clock.getElapsedTime() * speed)` ― 経過時間から直接決める',
        '`phase += dt * speed` ― 位相を積み上げる',
        'フレーム数を数える',
        '`setInterval` を使う',
      ],
      answer: 0,
      explain:
        '経過時間なら誤差も揺れも積もりません。重いフレームやタブ復帰で $dt$ が跳ねても、次のフレームには正しい位置に戻ります。積み上げる書き方だと、そのずれが永久に残ります。',
    },
    {
      q: '`const dt = Math.min(clock.getDelta(), 0.05)` の上限は、何のために必要ですか。',
      choices: [
        'タブ復帰などで $dt$ が数秒になったとき、物体が一気に飛ぶのを防ぐため',
        'フレームレートを固定するため',
        '精度を上げるため',
        'メモリを節約するため',
      ],
      answer: 0,
      explain:
        'タブが裏に回るとループは止まりますが時計は進みます。戻った瞬間の $dt$ が数秒ぶんになり、物理計算なら壁をすり抜けたり速度が発散したりします。必ず入れる 1 行です。',
    },
    {
      q: 'three の `Clock.start()` は何をしますか。',
      choices: [
        '経過時間を 0 にリセットして計測を始める（「再開」ではない）',
        '止めた時点から再開する',
        'フレームレートを計測する',
        '`getDelta` を有効にする',
      ],
      answer: 0,
      explain:
        '名前から「再開」に見えますが、`elapsedTime` は 0 に戻ります。一時停止と再開が要るなら、`time += dt` と自分で積んでください。スローや巻き戻しも同じ形で書けます。',
    },
  ],
};
