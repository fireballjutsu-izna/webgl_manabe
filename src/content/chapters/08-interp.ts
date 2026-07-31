import type { Chapter } from '../types.ts';

export const chapter08: Chapter = {
  slug: '08-interp',
  part: 'basics',
  number: 26,
  title: '補間とイージング',
  goal: '2つの値のあいだをなめらかに行き来させられるようになり、機械的な動きを自然なアニメーションに変えられるようになります。',
  requires: ['b13-vector-add', 'b05-ratio'],
  threeApis: [
    'MathUtils.lerp',
    'Vector3.lerp',
    'Vector3.lerpVectors',
    'Quaternion.slerp',
    'MathUtils.clamp',
    'MathUtils.smoothstep',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## まず、どこで困るか

物体を A から B へ動かすのは簡単です。難しいのは「気持ちよく動かす」ことです。

等速でスッと動く物体は、驚くほど安っぽく見えます。現実のものは、
動きはじめに勢いをためて、止まるときに減速するからです。
この差を作るのが{{イージング}}で、その土台になるのが{{線形補間}}です。
`,
    },
    {
      kind: 'md',
      text: `
## lerp ― すべての土台

やっていることは 1 行で言えます。**2 つの値を、指定した割合で混ぜる**。それだけです。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathrm{lerp}(a,\\, b,\\, t) = a + (b - a)\\,t',
      readAloud:
        'a から b へ向かう差（b 引く a）に、割合 t を掛けて、a に足します。t が 0 なら a のまま、1 なら b にぴったり、0.5 ならちょうど真ん中になります。',
      worked: {
        given: '$a = 10$ から $b = 30$ へ、$t = 0.25$ のときの位置を求めます。',
        steps: [
          { calc: 'b - a   = 30 - 10 = 20', note: 'まず「差」を出す' },
          { calc: '20 x t  = 20 x 0.25 = 5', note: 'その差の 25% ぶん' },
          { calc: 'a + 5   = 10 + 5 = 15' },
        ],
        result: '$t = 0.25$ で **15**。$t = 0$ なら 10、$t = 1$ なら 30 になります。**「差を取って、割合を掛けて、足し戻す」**という 3 歩は、位置でも色でも角度でも同じです。',
      },
    },
    {
      kind: 'md',
      text: `
この式は、数だけでなく **ベクトルにもそのまま使えます**。
位置を lerp すれば直線移動になり、色を lerp すればグラデーションになります。

大事なのは、**t は「時間」ではなく「進み具合」**だということです。
0 から 1 に正規化された割合であり、秒でもフレーム数でもありません。
`,
    },
    {
      kind: 'md',
      text: `
## イージング ― t をひとひねりする

ここからが本題です。イージングは、動きそのものを作り替える難しい処理…ではありません。

**lerp に渡す前に、t をちょっと歪ませるだけです。**

- t をそのまま渡す → 等速
- 序盤の t を小さめに歪ませる → ゆっくり始まる
- 終盤の t を 1 に近づける → 静かに止まる

移動先も lerp も何ひとつ変わりません。t の作り方だけが変わります。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathrm{smoothstep}(t) = t^2\\,(3 - 2t)',
      readAloud:
        'いちばんよく使われる、ゆっくり始まってゆっくり止まる曲線です。t が 0 のとき 0、1 のとき 1 になり、その両端で傾きが 0 になる——つまり出発と停止がなめらかになります。',
      worked: {
        given: '同じ $t$ を smoothstep に通したときの値を、3 か所で見ます。',
        steps: [
          { calc: 't = 0.1 : 0.01 x (3 - 0.2) = 0.01 x 2.8 = 0.028', note: '端では、まだほとんど進まない' },
          { calc: 't = 0.5 : 0.25 x (3 - 1.0) = 0.25 x 2.0 = 0.5', note: '真ん中は変わらない' },
          { calc: 't = 0.9 : 0.81 x (3 - 1.8) = 0.81 x 1.2 = 0.972', note: '端では、また進みが鈍る' },
        ],
        result: '0.1 が 0.028 に、0.9 が 0.972 に**押し出されました**。真ん中はそのまま。これが「ゆっくり始まってゆっくり止まる」の正体で、**式は $t$ を別の $t$ に置き換えているだけ**です。',
      },
    },
    {
      kind: 'demo',
      id: 'lerp-easing',
      caption:
        '上の箱が等速、下の箱がイージングありです。手前のグラフは横が時間、縦が進み具合を表しています。曲線が急なところほど、箱が速く動いていることを見比べてください。',
    },
    {
      kind: 'md',
      text: `
## よく使う4種類

- **linear** … 緩急なし。機械的な動きや、ずっと回り続けるものに
- **ease-out** … 勢いよく出て静かに止まる。UI の表示や、カメラの寄りに最適
- **ease-in-out** … 両端がなめらか。物体の移動全般の第一候補
- **back** … 少し行き過ぎて戻る。ボタンやポップアップに愛嬌が出る

迷ったら ease-out か ease-in-out を選べば、まず外しません。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '毎フレーム lerp する「追従」は、実は等速ではありません',
      text: `
\`pos.lerp(target, 0.1)\` を毎フレーム呼ぶ書き方をよく見かけます。
これは「残り距離の 10% ずつ縮める」動きなので、勝手に ease-out になります。
手軽で見栄えもよいのですが、**フレームレートによって速さが変わる**という弱点があります。
30fps と 120fps で挙動が変わるのが気になる場面では、経過時間を使った書き方に直してください。
`,
    },
    {
      kind: 'code',
      title: 'lerp と イージング',
      code: `import * as THREE from 'three';

// 数どうし
const x = THREE.MathUtils.lerp(0, 10, 0.25); // 2.5

// ベクトルどうし（自分が書き換わる点に注意）
const p = start.clone().lerpVectors(start, end, t);

// イージングは「t を歪ませる関数」でしかない
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => t * t * (3 - 2 * t); // smoothstep

let elapsed = 0;
const duration = 1.2;

function animate(dt) {
  elapsed = Math.min(elapsed + dt, duration);
  const t = elapsed / duration;              // 0→1 の進み具合
  const eased = easeInOut(t);                // ひとひねり

  mesh.position.lerpVectors(start, end, eased);
  mesh.quaternion.slerp(goalQuaternion, eased); // 姿勢は slerp
}

// フレームレートに左右されない追従
function follow(dt) {
  const k = 1 - Math.pow(0.001, dt); // dt に応じた正しい割合
  camera.position.lerp(targetPosition, k);
}`,
    },
    {
      kind: 'md',
      text: `
## 位置は lerp、姿勢は slerp

補間する対象によって道具が変わります。

- **数・位置・色・大きさ** … \`lerp\`
- **姿勢（回転）** … \`slerp\`（クォータニオンを扱う[](#/ch/07-rotation)で正面から見ます）

位置を slerp したり、回転を lerp したりしないこと。これだけ守れば事故は起きません。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 't は必ず 0〜1 に閉じ込める',
      text: `
経過時間から t を作ると、うっかり 1 を超えることがあります。
lerp は 1 を超えても素直に計算してしまうので、物体が目的地を通り過ぎて飛んでいきます。
\`THREE.MathUtils.clamp(t, 0, 1)\` を挟む習慣をつけてください。
`,
    },
  ],
  exercises: [
    {
      prompt: `デモで「自動で往復させる」を入れ、5 つのイージングを順に切り替えてください。
**行き過ぎて戻る（back）**だけが、ほかの 4 つにできないことをしています。それは何でしょう。`,
      hint: 'グラフの縦軸が 0 から 1 の外に出ていないか見てください。',
      answer: `back だけは、進み具合が**一度 1 を超えてから戻ってきます**（始まりでは 0 を下回ります）。
lerp は $t$ が 0〜1 の外でも計算できるので、こうした「行き過ぎ」も同じ式のまま表現できます。
ボタンが押されたときの弾む感じは、たいていこれです。`,
    },
    {
      prompt: `毎フレーム \`mesh.position.lerp(target, 0.1)\` と書いて対象を追いかけると、なめらかに寄っていきます。
ところがこれには**フレームレートで速さが変わる**という欠点があります。なぜでしょう。`,
      hint: '120fps の環境では、60fps の 2 倍の回数だけ 0.1 を掛けることになります。',
      answer: `1 フレームあたり残りの 10% を詰める書き方なので、フレームが多い環境ほど速く着きます。
60fps では 1 秒で残り $0.9^{60}$ ですが、120fps では $0.9^{120}$ と、まったく違う速さになります。
直すには、**経過時間 \`dt\` から係数を作り直します**。`,
      answerCode: `// 悪い例: フレームレートで速さが変わる
mesh.position.lerp(target, 0.1);

// 良い例: 「1 秒で 90% 詰める」を dt から作り直す
const k = 1 - Math.pow(1 - 0.9, dt);
mesh.position.lerp(target, k);`,
    },
  ],
  quiz: [
    {
      q: '`lerp(a, b, t)` で `t = 0` のとき、結果はどれになりますか。',
      choices: ['a', 'b', 'a と b の中間', '0'],
      answer: 0,
      explain:
        't は「どれだけ b 寄りにするか」の割合です。0 なら a のまま、1 なら b、0.5 でちょうど中間になります。',
    },
    {
      q: 'イージングをかけるとき、実際に変えているのは何ですか。',
      choices: [
        'lerp に渡す t の値',
        '移動先の座標',
        'フレームレート',
        'lerp の計算式そのもの',
      ],
      answer: 0,
      explain:
        '移動先も lerp の式も変わりません。0→1 の進み具合をどう歪ませるか、それだけで動きの印象が決まります。',
    },
    {
      q: '2つの**姿勢（回転）**のあいだを補間するとき、使うべきものはどれですか。',
      choices: ['`Quaternion.slerp`', '`Vector3.lerp`', '`MathUtils.lerp` を3つの角度に', '`Matrix4.multiply`'],
      answer: 0,
      explain:
        '位置には lerp、姿勢には slerp です。オイラー角の3つの数値を別々に lerp すると、途中で遠回りしたり不自然にねじれたりします。',
    },
  ],
};
