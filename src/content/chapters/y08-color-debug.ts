import type { Chapter } from '../types.ts';

export const chapterY08: Chapter = {
  slug: 'y08-color-debug',
  part: 'polish',
  number: 8,
  title: '色がおかしいときの、切り分けの順番',
  goal: '色の症状から原因を絞り込めるようになり、「白っぽい」と「暗い」が正反対の原因から出ていることを、数値で言えるようになります。',
  requires: ['y07-tonemapping', 'w48-shader-debug'],
  threeApis: [
    'WebGLRenderer.outputColorSpace',
    'Texture.colorSpace',
    'WebGLRenderer.toneMapping',
    'Color.getHexString',
  ],
  mathRecall: [
    { slug: 'w48-shader-debug', note: '値を色で見る。$1$ つずつ変える' },
    { slug: 'q02-color', note: '入口と出口の $2$ つの変換' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 症状は似ているが、原因は正反対

色の問題は、**症状が似ているのに原因が正反対**であることが多く、
当てずっぽうで触ると迷子になります。

いちばん多い $2$ つを、先に数値で分けておきます。

同じ \`#4fd6ff\` が、変換をどちらか片方だけ落としたときに何色で出るか ―
これを覚えておくと、**画面を見ただけで原因が分かります。**
`,
    },
    {
      kind: 'formula',
      tex: 'c_{\\text{出}} \\;=\\; g\\bigl(f^{-1}(c_{\\text{入}})\\bigr), \\qquad f: sRGB \\to \\text{linear},\\quad g: \\text{linear} \\to sRGB',
      readAloud:
        '正しい通り道は、入口で $sRGB$ をリニアに直し、出口でリニアを $sRGB$ に戻す、という $2$ 段です。どちらか片方が抜けると、変換が $1$ 回ぶん余るか足りないかになります。',
      worked: {
        given: '`#4fd6ff`（リニアでは $0.0782,\\; 0.6724,\\; 1.0$）が、$4$ 通りの状態でどう表示されるか。',
        steps: [
          { calc: '正しい      : #4fd6ff' },
          { calc: '出口が抜けた: #14abff', note: '暗い・青が濃い' },
          { calc: '入口が抜けた: #97ecff', note: '白っぽい・薄い' },
          { calc: '二重に変換  : #14abff', note: '出口抜けと同じ' },
          { calc: 'R 成分で見ると' },
          { calc: '  正しい 79 / 出口抜け 20 / 入口抜け 151' },
        ],
        result:
          '**「白っぽくて薄い」のは入口の変換が抜けたとき、「暗くて濃い」のは出口が抜けたとき**です。逆に覚えていると、直すつもりで逆方向へ動かすことになります。もう $1$ つ、**色相まで変わる**ことにも注目してください ― $R$ は $79 \\to 20$（$4$ 分の $1$）なのに $B$ は $255$ のままなので、**暗い成分ほど強く沈みます。** 「暗くなった」だけでなく「青くなった」と感じるのは、これが理由です。',
      },
    },
    {
      kind: 'md',
      text: `
## 切り分けの順番

上から順に見てください。**当てはまった時点で止めます。**

| 症状 | 原因 | 触る場所 |
|---|---|---|
| 全体が**白っぽくて薄い** | 入口の変換が抜けている | テクスチャの \`colorSpace\` |
| 全体が**暗くて濃い** | 出口の変換が抜けている | \`renderer.outputColorSpace\` |
| **明るいところだけ**白い塊 | トーンマッピングが無い | \`renderer.toneMapping\` |
| **法線や粗さだけ**おかしい | データのテクスチャに \`colorSpace\` を指定した | その指定を外す |
| デザインツールと違う | トーンマッピングと露出が効いている | 比べるときは \`NoToneMapping\` に戻す |

$5$ 行目が見落とされがちです。
**トーンマッピングを入れた画面と、デザインツールの色は、そもそも一致しません。**
色を合わせたいときは、いったん切って比べてください。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'まず 1 つだけ変えて、変化を見る',
      text: `
色の問題は**原因が重なりやすい**のが厄介なところです。

- 出口の変換が抜けていて、
- そのうえテクスチャの指定も間違っていて、
- トーンマッピングも入っていない

この状態で $3$ つを同時に直すと、**どれが効いたのか分かりません。**
そして $1$ つだけ直したとき、**別の間違いに打ち消されて何も変わらない**ことがあります。

[](#/ch/w48-shader-debug)でやったとおりです。

**\`MeshBasicMaterial\` の板を $1$ 枚置いて、既知の色を出す** ―
これが、いちばん速い切り分けの道具です。
光もトーンマッピングも通らないので、**色管理だけを見られます。**
`,
    },
    {
      kind: 'sandbox',
      title: '4 つの失敗を、並べて見分ける',
      guide: { focus: ['基準の色を、CSS で出す', '4 つの状態を並べる'] },
      code: `import * as THREE from 'three';

// 同じ #4fd6ff を、4 つの状態で描く。
// どれが「白っぽい」でどれが「暗い」かを、目と数値の両方で確かめる

const HEX = 0x4fd6ff;

/* ---- 基準の色を、CSS で出す ---- */
// 上端に細い帯を置いておく。three 側の正解と、境目が見えなければ合っている

document.body.style.margin = '0';
const strip = document.createElement('div');
strip.style.cssText =
  'position:absolute; bottom:34px; left:0; right:0; height:44px;' +
  'background:#4fd6ff; z-index:1;';
document.body.appendChild(strip);

const label = document.createElement('div');
label.textContent = 'CSS #4fd6ff（基準）';
label.style.cssText =
  'position:absolute; bottom:46px; left:14px; z-index:2;' +
  'color:#0b1a22; font:12px ui-monospace, monospace;';
document.body.appendChild(label);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setScissorTest(true);
document.body.appendChild(renderer.domElement);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
camera.position.z = 1;

/* ---- 4 つの状態を並べる ---- */

const linear = new THREE.Color(HEX);                       // 入口を通した値
const raw = new THREE.Color().setRGB(                      // 入口を通さない値
  ((HEX >> 16) & 255) / 255,
  ((HEX >> 8) & 255) / 255,
  (HEX & 255) / 255,
  THREE.LinearSRGBColorSpace,
);

const cases = [
  { label: '正しい', color: linear, out: THREE.SRGBColorSpace },
  { label: '出口が抜けた（暗い）', color: linear, out: THREE.LinearSRGBColorSpace },
  { label: '入口が抜けた（白っぽい）', color: raw, out: THREE.SRGBColorSpace },
  { label: '二重に変換（暗い）', color: new THREE.Color().setRGB(
      linear.r, linear.g, linear.b, THREE.SRGBColorSpace,
    ), out: THREE.SRGBColorSpace },
].map((entry) => {
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    // MeshBasicMaterial は光の影響を受けない。色管理だけを見られる
    new THREE.MeshBasicMaterial({ color: entry.color }),
  ));

  const div = document.createElement('div');
  div.textContent = entry.label;
  div.style.cssText =
    'position:absolute; bottom:8px; transform:translateX(-50%); z-index:2;' +
    'color:#e8e8f2; font:11px ui-monospace, monospace; white-space:nowrap;' +
    'background:rgba(10,12,18,0.75); padding:3px 7px; border-radius:4px;';
  document.body.appendChild(div);

  return { scene: scene, out: entry.out, div: div };
});

renderer.setAnimationLoop(() => {
  const w = Math.floor(renderer.domElement.clientWidth / cases.length);
  const h = renderer.domElement.clientHeight;

  for (let i = 0; i < cases.length; i++) {
    cases[i].div.style.left = ((i + 0.5) / cases.length * 100) + '%';
    renderer.outputColorSpace = cases[i].out;   // ここだけが違う
    renderer.setViewport(i * w, 0, w, h);
    renderer.setScissor(i * w, 0, w, h);
    renderer.render(cases[i].scene, camera);
  }
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '下の帯が $CSS$ の `#4fd6ff` です。**いちばん左だけが、帯と境目なく繋がります。** $2$ 番目と $4$ 番目は $\\#14abff$ ― 暗く、青が濃く見えます。$3$ 番目は $\\#97ecff$ で、**白っぽく薄い。** この $2$ 方向を覚えておくと、画面を見ただけでどちらの変換が抜けているか分かります。$2$ 番目と $4$ 番目が同じ色なのは、**「出口を落とす」と「入口を余分にかける」が同じ結果になる**からです。',
    },
    {
      kind: 'md',
      text: `
## ポストプロセスを足すと、ここが移動します

次の章で \`EffectComposer\` を導入すると、**トーンマッピングと $sRGB$ への変換は
「いちばん最後」に一度だけ**行う必要が出てきます。

途中の合成は**リニアのまま**やりたいからです ―
ぼかしも、明るさの足し算も、リニアでないと正しく計算できません
（[](#/ch/q02-color)でやった「$sRGB$ のまま足すと白飛びする」と同じ話）。

そのために \`OutputPass\` という専用のパスがあり、
**これを付け忘れると、この章で見た「暗くて濃い」がそのまま出ます。**

原因も症状も、**まったく同じもの**です。
`,
    },
  ],
  exercises: [
    {
      prompt: `画面全体が白っぽく薄いので、\`renderer.outputColorSpace\` を疑いました。

これは正しい判断ですか。`,
      hint: '出口の変換が抜けると、どちらの方向へ動きますか。',
      answer: `**逆です。「白っぽい」のは入口の問題です。**

**数値で確かめる**

$\\#4fd6ff$ で見ると、

- 出口が抜けた … $\\#14abff$（**暗い**）
- 入口が抜けた … $\\#97ecff$（**白っぽい**）

出口の変換はリニア $\\to sRGB$ で、**値を大きくする**方向です。
それが抜ければ、値は小さいまま出るので**暗く**なります。

**では何を疑うか**

- テクスチャの \`colorSpace\` を指定し忘れている
- リニアで作った数値を、色として直接出している
- 別のライブラリが作ったテクスチャを、変換なしで渡している

いちばん多いのは $1$ つめです。

**確かめ方**

\`MeshBasicMaterial\` の板に \`0x4fd6ff\` を出し、$CSS$ の \`#4fd6ff\` と並べます。

- **境目が見えない** … 色管理は正しい。原因は別（ライトや露出）
- **板のほうが明るい** … 入口が抜けている
- **板のほうが暗い** … 出口が抜けている

**$1$ 枚の板で、$3$ 通りに切り分けられます。**`,
    },
    {
      prompt: `「出口の変換が抜けた」と「二重に変換した」が同じ色になるのは、なぜですか。`,
      hint: '変換の回数を数えてください。',
      answer: `**どちらも「リニア $\\to sRGB$ の変換が $1$ 回足りない」状態だからです。**

**正しい通り道**

入口で $1$ 回（$sRGB \\to$ リニア）、出口で $1$ 回（リニア $\\to sRGB$）。
**行って戻るので、差し引き $0$。**

**出口が抜けた場合**

入口で $1$ 回だけ。**リニア方向へ $1$ 回ぶん余っています。**

**二重に変換した場合**

入口で $2$ 回、出口で $1$ 回。**やはりリニア方向へ $1$ 回ぶん余ります。**

**同じ状態**

どちらも「$sRGB \\to$ リニアが $1$ 回、多く効いている」ので、
出てくる色は同じ $\\#14abff$ です。

**これが切り分けを難しくしている**

症状が同じなので、**画面を見ても $2$ つを区別できません。**

だから、

- まず \`renderer.outputColorSpace\` を確かめる（$1$ 行）
- 次にテクスチャの \`colorSpace\` を確かめる

**確かめる順番を、症状ではなく「確かめやすさ」で決めます。**
$1$ 行で見られるものから見るのが速い。`,
    },
    {
      prompt: `デザインツールで決めた \`#4fd6ff\` と、three の画面の色が違います。

色管理は正しく通っていました。何を疑いますか。`,
      hint: '色管理のほかに、色を変えるものがありました。',
      answer: `**トーンマッピングと露出です。**

**なぜ違うのか**

$ACES$ は $1$ 未満の値も動かします（[](#/ch/y07-tonemapping)）。

リニア $0.0782$（$= \\#4f$）を通すと、$0.0782 \\to$ より暗い値へ ―
**指定した色より暗く、コントラストが付いた色**になります。

$1$ を超えていなくても効くので、「白飛びしていないから関係ない」は誤りです。

**比べるときは、切る**

\`renderer.toneMapping = THREE.NoToneMapping\`

これで初めて、デザインツールと同じ土俵になります。

**それでも合わないなら**

- \`toneMappingExposure\` が $1$ 以外になっていないか
- ライトが当たっていないか（\`MeshBasicMaterial\` で確かめる）
- ポストプロセスが入っていないか

**そもそも合わせるべきか**

$UI$ の色（ボタン、文字）は合わせるべきです。

一方、$3$ 次元の物体の色は**光を受けた結果**なので、
デザインツールの色と一致するほうが不自然です。

**「どの色が仕様なのか」を先に決めてください。**
全部を合わせようとすると、トーンマッピングを捨てることになります。`,
    },
  ],
  quiz: [
    {
      q: '画面全体が白っぽく薄いとき、疑うべきはどちらですか。',
      choices: [
        '入口の変換（テクスチャの colorSpace）が抜けている',
        '出口の変換（outputColorSpace）が抜けている',
        'トーンマッピングが強すぎる',
        'ライトが強すぎる',
      ],
      answer: 0,
      explain:
        '#4fd6ff で見ると、入口が抜けたときは #97ecff（白っぽい）、出口が抜けたときは #14abff（暗い）です。出口の変換はリニア → sRGB で値を大きくする方向なので、抜ければ暗くなります。逆に覚えていると、直すつもりで逆方向へ動かすことになります。',
    },
    {
      q: '「出口の変換が抜けた」と「入口で二重に変換した」が同じ色になるのはなぜですか。',
      choices: [
        'どちらも sRGB → リニアの変換が 1 回多く効いた状態だから',
        '偶然',
        'three が同じ処理をしているから',
        '実際は違う色になる',
      ],
      answer: 0,
      explain:
        '正しい通り道は入口で 1 回、出口で 1 回で差し引き 0 です。出口が抜ければリニア方向へ 1 回余り、入口で二重にかけてもやはり 1 回余ります。症状が同じなので画面では区別できず、確かめる順番は「症状」ではなく「1 行で確かめられるか」で決めることになります。',
    },
    {
      q: 'デザインツールの色と three の色を比べるとき、何をしてから比べますか。',
      choices: [
        'トーンマッピングを NoToneMapping に戻す。ACES は 1 未満の値も動かすから',
        '露出を 2 倍にする',
        'ライトを全部消す',
        '何もしない。そのまま比べてよい',
      ],
      answer: 0,
      explain:
        'ACES は 1 を超えていない値も動かします（1.0 → 0.763、0.5 → 0.558）。だから白飛びしていなくても、トーンマッピングが入っていればデザインツールとは一致しません。そもそも 3 次元の物体の色は光を受けた結果なので、一致するほうが不自然です ― どの色が仕様なのかを先に決めてください。',
    },
  ],
};
