import type { Chapter } from '../types.ts';

export const chapterM28: Chapter = {
  slug: 'm28-ndc',
  part: 'math3d',
  number: 28,
  title: '画面に出るまで ― 正規化デバイス座標とピクセル',
  goal: '3D の点が画面のどのピクセルに来るかを計算でき、マウスの位置を 3D 側に渡せるようになります。',
  requires: ['m27-frustum', 'b34-inverse-lerp'],
  threeApis: [
    'Vector3.project',
    'Vector3.unproject',
    'Raycaster.setFromCamera',
    'WebGLRenderer.getSize',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 画面の大きさを知らないまま、位置を決める

透視除算まで終わると、点は $-1$ から $+1$ の範囲に収まります。
これを{{正規化デバイス座標}}（NDC）と呼びます。

- **左端が $-1$、右端が $+1$**
- **下端が $-1$、上端が $+1$**（$y$ は上が正）
- 奥行きも $-1$ から $+1$（WebGL の場合）

ここが賢いところで、**この段階では画面の大きさを一切知りません。**

1920 ピクセルでも 375 ピクセルでも、NDC は同じ値です。
だから**同じシーンが、どんな画面でも同じ構図で写ります。**
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '割合で言っておく',
      text: `
「右から 3 割のところ」と言えば、
紙が A4 でも模造紙でも、貼る場所は決まります。

センチメートルで言ってしまうと、紙のサイズごとに指示を変えなければなりません。

NDC は、この「割合で言っておく」に当たります。
実寸に直すのは、いちばん最後の 1 回だけです。
`,
    },
    {
      kind: 'md',
      text: `
## ピクセルに直す ― 最後の 1 手

NDC から実際のピクセルに直すのは、**ただの目盛りの張り替え**です。

$-1$ から $+1$ を、$0$ から幅へ。[](#/ch/b34-inverse-lerp)でやった「割合に直して、別の範囲に置き直す」そのものです。

$y$ だけ 1 か所ひっくり返ります。
**NDC は上が正、画面のピクセルは下が正**だからです（[](#/ch/b07-plane)で見た画面座標です）。
`,
    },
    {
      kind: 'formula',
      tex: 'x_{\\text{px}} = \\frac{x_{\\text{ndc}} + 1}{2}\\, W, \\qquad y_{\\text{px}} = \\frac{1 - y_{\\text{ndc}}}{2}\\, H',
      readAloud:
        'NDC を 0 から 1 の割合に直してから、画面の幅と高さを掛けます。y だけは 1 から引くことで、上下をひっくり返しています。画面のピクセルは下向きが正だからです。',
      worked: {
        given:
          '$1280 \\times 720$ の画面で、NDC が $(0.5,\\; -0.25)$ の点はどのピクセルに来るでしょう。',
        steps: [
          { calc: '横 : (0.5 + 1) / 2 = 0.75', note: '左から 75% の位置' },
          { calc: '    0.75 x 1280 = 960' },
          { calc: '縦 : (1 - (-0.25)) / 2 = 0.625', note: '上から 62.5% の位置' },
          { calc: '    0.625 x 720 = 450' },
          { calc: '【確認】中央 (0,0) なら : 640, 360', note: '画面のちょうど真ん中' },
        ],
        result:
          '**$(960,\\; 450)$** ピクセルです。NDC の $y$ が負（下寄り）なのに、ピクセルの $y$ が中央の 360 より大きい 450 になっているのが、上下反転の効いているところです。',
      },
    },
    {
      kind: 'md',
      text: `
## 逆向きが、実務では重要

実務でよく使うのは、実は**逆向き**です。

**「クリックされた場所に、何があるか」** を知りたい。
これは画面のピクセルから 3D の世界へ、道をさかのぼることになります。

手順は 2 段階です。

1. **ピクセル → NDC** … 上の式を逆に解く。$y$ の反転も忘れずに
2. **NDC → 3D の直線** … カメラから伸びる 1 本の光線に直す

2 のところで「点」ではなく「直線」になるのが要点です。
画面上の 1 点に写るものは、**奥行き方向に無数にある**からです
（[](#/ch/m26-perspective)で見たとおり、奥行きの違う点が同じ場所に写ります）。

だから当たり判定は、**その直線と物体の交わりを調べる**ことになります。
three の \`Raycaster\` がやっているのは、これです。
`,
    },
    {
      kind: 'code',
      title: '画面と 3D を行き来する',
      code: `import * as THREE from 'three';

// 3D の点が、画面のどこに写るか
const p = new THREE.Vector3(1, 2, 3);
p.project(camera);                       // NDC になる（-1 〜 +1）

const rect = renderer.domElement.getBoundingClientRect();
const px = ((p.x + 1) / 2) * rect.width;
const py = ((1 - p.y) / 2) * rect.height;

// クリックされた場所を NDC に直す
function toNdc(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,   // 上下反転
  );
}

// その方向へ光線を飛ばして、当たったものを調べる
const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(toNdc(event), camera);
const hits = raycaster.intersectObjects(scene.children, true);
if (hits.length > 0) console.log(hits[0].object.name, hits[0].point);

// NDC から 3D の点に戻す（奥行きを自分で指定する）
const nearPoint = new THREE.Vector3(ndc.x, ndc.y, -1).unproject(camera);
const farPoint = new THREE.Vector3(ndc.x, ndc.y, 1).unproject(camera);`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'ウィンドウの大きさではなく、キャンバスの大きさで割る',
      text: `
window.innerWidth で割っている例をよく見かけますが、
キャンバスが画面いっぱいでない場合はずれます。

サイドバーがある、余白がある、キャンバスがページの一部 ―
どれも実務では当たり前の状況です。

getBoundingClientRect() で実際の位置と大きさを取り、
左上からの相対位置で計算してください。
「クリックした場所と少しずれたところが選ばれる」の原因は、ほぼこれです。
`,
    },
    {
      kind: 'md',
      text: `
## ピクセル比という、もう 1 段

もう 1 つ、実機で引っかかるものがあります。

高解像度の画面では、**CSS の 1 ピクセルが、実際の 1 ピクセルとは限りません。**
\`devicePixelRatio\` が 2 なら、CSS の 100 ピクセルは実際には 200 ピクセルです。

three ではこれを \`renderer.setPixelRatio()\` で扱います。
**当たり判定の計算には関係ありません**（CSS ピクセルどうしで割るので比が消えます）が、
**描画の解像度には効きます。**

- 設定しないと … 高解像度の画面でぼやける
- 大きくしすぎると … 描くピクセル数が 4 倍になり、重くなる

**$\\min(\\text{devicePixelRatio},\\; 2)$ で頭打ちにする**のが定番です。
3 以上にしても、人の目にはほとんど違いが分からないからです。
`,
    },
  ],
  exercises: [
    {
      prompt: `$1920 \\times 1080$ の画面で、NDC が $(-0.5,\\; 0.5)$ の点はどのピクセルに来ますか。手で計算してください。`,
      hint: '$y$ の反転を忘れないでください。',
      answer: `**横** … $\\frac{-0.5 + 1}{2} = 0.25$ → $0.25 \\times 1920 = 480$

**縦** … $\\frac{1 - 0.5}{2} = 0.25$ → $0.25 \\times 1080 = 270$

答えは **$(480,\\; 270)$** ピクセルです。

NDC では「左寄り・上寄り」の点でした。
ピクセルでも左上寄り（幅の 1/4、高さの 1/4）に来ているので、合っています。

$y$ を反転していなければ $0.75 \\times 1080 = 810$ となり、
**上下が逆の位置**を指してしまいます。
「クリックした位置と上下対称なところが選ばれる」という症状は、この反転の抜けです。`,
    },
    {
      prompt: `キャンバスがページの一部（左に 300px のサイドバーがある）に置かれています。
\`event.clientX / window.innerWidth\` で NDC を計算したら、選択がずれました。
どう直しますか。また、ずれ方はどうなりますか。`,
      hint: 'キャンバスの左端は、ウィンドウの左端と同じ位置ですか。',
      answer: `**キャンバスの実際の位置と大きさで計算し直します。**

\`getBoundingClientRect()\` で左上の位置と幅・高さを取り、
**キャンバスの左上からの相対位置**を使います。

**ずれ方** … 2 つのずれが同時に起きます。

- **原点のずれ** … キャンバスの左端は \`clientX = 300\` なので、
  そこをクリックしても 0 にならず、$300 / 1920 = 0.156$ ぶん右にずれた扱いになる
- **倍率のずれ** … キャンバスの幅は $1920 - 300 = 1620$ なのに 1920 で割っているので、
  右へ行くほどずれが大きくなる

結果として「左端では少しずれ、右端では大きくずれる」という、
**位置によってずれ方が変わる**症状になります。
これが「ずれの量が一定でない」ときの見分け方です。`,
      answerCode: `function toNdc(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
}`,
    },
    {
      prompt: `3D 空間に置いた物体の真上に、HTML のラベルを重ねて表示したい。
どう計算しますか。また、物体がカメラの後ろに回ったときの手当ても答えてください。`,
      hint: '`project()` で NDC にしてからピクセルに直します。後ろにある点の NDC は、どうなりますか。',
      answer: `**\`project()\` で NDC に直し、ピクセルに換算して CSS の位置に入れます。**

カメラの後ろに回ったときが問題です。
$z$ が正の点を \`project()\` に通すと、透視除算で**負の数で割る**ことになり、
$x$ と $y$ の符号が反転します。

結果として、**物体が背後にあるのにラベルが画面内に出てしまい、しかも左右が逆**になります。

対策は、NDC の $z$ を見て判定することです。
$-1$ から $+1$ の範囲に収まっていなければ、視錐台の外なので隠します。

なお three には \`CSS2DRenderer\` があり、この処理を丸ごと引き受けてくれます
（このサイトのデモのラベルもそれです）。自分で書くのは、細かく制御したいときだけで足ります。`,
      answerCode: `const v = new THREE.Vector3();

function updateLabel() {
  target.getWorldPosition(v);
  v.y += 1.2;                    // 物体の少し上に出す
  v.project(camera);

  // 視錐台の外なら隠す（背後に回ったときの反転も、これで防げる）
  const inside = v.z > -1 && v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1;
  label.style.display = inside ? 'block' : 'none';
  if (!inside) return;

  const rect = renderer.domElement.getBoundingClientRect();
  label.style.left = \`\${((v.x + 1) / 2) * rect.width}px\`;
  label.style.top = \`\${((1 - v.y) / 2) * rect.height}px\`;
}`,
    },
  ],
  quiz: [
    {
      q: '正規化デバイス座標（NDC）の範囲はどれですか。',
      choices: [
        '左端が −1、右端が +1（上が正）',
        '左端が 0、右端が画面の幅',
        '0 から 1',
        'カメラからの距離',
      ],
      answer: 0,
      explain:
        'この段階では画面の大きさを知りません。だから同じシーンが、どんな解像度でも同じ構図で写ります。実寸に直すのは、いちばん最後の 1 回だけです。',
    },
    {
      q: 'NDC からピクセルに直すとき、$y$ で特別なことをするのはなぜですか。',
      choices: [
        'NDC は上が正、画面のピクセルは下が正だから',
        '縦横比を補正するため',
        '奥行きを考慮するため',
        'ピクセル比のため',
      ],
      answer: 0,
      explain:
        '$\\frac{1 - y}{2}$ とすることで上下がひっくり返ります。この反転を忘れると、クリックした位置と上下対称なところが選ばれます。',
    },
    {
      q: 'クリック位置を NDC に直すとき、何で割るべきですか。',
      choices: [
        'キャンバスの実際の位置と大きさ（getBoundingClientRect）',
        'window.innerWidth と innerHeight',
        'screen.width と height',
        'devicePixelRatio',
      ],
      answer: 0,
      explain:
        'キャンバスが画面いっぱいでないとずれます。しかも原点と倍率の両方がずれるので、「左端では少し、右端では大きく」という位置によって変わるずれ方になります。',
    },
  ],
};
