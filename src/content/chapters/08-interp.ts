import type { Chapter } from '../types.ts';

export const chapter08: Chapter = {
  slug: '08-interp',
  part: 'math',
  number: 8,
  title: '補間とイージング',
  goal: '2つの値のあいだをなめらかに行き来させられるようになり、機械的な動きを自然なアニメーションに変えられるようになります。',
  requires: ['02-vector', '07-rotation'],
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
- **姿勢（回転）** … \`slerp\`（[第7章](#/ch/07-rotation)で見たとおり）

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
