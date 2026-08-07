import type { Chapter } from '../types.ts';

export const chapterY06: Chapter = {
  slug: 'y06-hex-colorspace',
  part: 'polish',
  number: 6,
  title: '同じ 16 進数が、同じ色に出るか',
  goal: '$CSS$ と three で同じ色を並べて確かめられるようになり、テクスチャに $\\mathrm{colorSpace}$ を指定すべきかどうかを、用途から判断できるようになります。',
  requires: ['q02-color', 't04-texture', 'x09-surface-bake'],
  threeApis: [
    'WebGLRenderer.outputColorSpace',
    'Texture.colorSpace',
    'Color.getHexString',
    'MeshBasicMaterial',
  ],
  mathRecall: [
    { slug: 'w13-color-space', note: '入口と出口の変換' },
    { slug: 't04-texture', note: 'テクスチャの colorSpace 指定' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## いちばん確実な検査

色管理が正しいかどうかは、**同じ $16$ 進数を $2$ か所に出して並べる**のがいちばん確実です。

- $CSS$ の \`background\` に \`#4fd6ff\`
- three の \`MeshBasicMaterial\` に \`0x4fd6ff\`

正しく通っていれば、**境目が見えません。**

\`MeshBasicMaterial\` を使うのが要点です ―
光の影響を受けないので、**色管理だけを取り出して見られます。**
`,
    },
    {
      kind: 'sandbox',
      title: '同じ16進数が、同じ色に出るか',
      code: `import * as THREE from 'three';

const HEX = 0x4fd6ff;   // この色ひとつを、three と CSS の両方で使う

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight / 2);   // 上半分だけ three
// トーンマッピングは「その後の焼き方」なので、色を比べるあいだは切っておく
renderer.toneMapping = THREE.NoToneMapping;
renderer.domElement.style.display = 'block';
document.body.appendChild(renderer.domElement);

// 画面いっぱいの板。MeshBasicMaterial は光の影響を受けないので、色がそのまま出る
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshBasicMaterial({ color: HEX }),
);
scene.add(plane);

/* ---- 下半分は、ただの CSS ---- */

const swatch = document.createElement('div');
swatch.style.cssText =
  'height:50vh; display:flex; align-items:center; justify-content:center;' +
  'font:12px monospace; color:#0b1220;';
// three に渡したのと同じ値を、CSS の色として書く
swatch.style.background = '#' + new THREE.Color(HEX).getHexString();
swatch.textContent =
  '↑ 上半分は three が描いた面／↓ ここは CSS の背景色（#' + new THREE.Color(HEX).getHexString() + '）';
document.body.appendChild(swatch);

/* ---- 切り替えボタン ---- */

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#0b1220; font:12px monospace;' +
  'pointer-events:none; white-space:pre;';
document.body.appendChild(readout);

function addButton(text, left, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText =
    'position:absolute; bottom:56px; left:' + left + 'px; padding:6px 10px;' +
    'background:#12121f; color:#e8e8f2; border:1px solid #3a3a5c; border-radius:6px;' +
    'font:12px sans-serif; cursor:pointer;';
  button.addEventListener('click', onClick);
  document.body.appendChild(button);
}

function apply(space, label) {
  renderer.outputColorSpace = space;
  readout.textContent = 'outputColorSpace: ' + label + '\\n上と下の境目は見えますか？';
  renderer.render(scene, camera);
}

addButton('SRGBColorSpace（正しい）', 12, () => apply(THREE.SRGBColorSpace, 'SRGBColorSpace'));
addButton('LinearSRGBColorSpace', 196, () => apply(THREE.LinearSRGBColorSpace, 'LinearSRGBColorSpace'));

apply(THREE.SRGBColorSpace, 'SRGBColorSpace');

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / (window.innerHeight / 2);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight / 2);
  renderer.render(scene, camera);
});`,
      caption:
        '既定の `SRGBColorSpace` では、上（three）と下（CSS）の境目が見えません。**同じ 16 進数が同じ色になっています。** `LinearSRGBColorSpace` に切り替えると、上半分だけが明るく白っぽくなります ― 出口の変換を飛ばしたので、リニアの数値がそのまま sRGB として表示されたためです。この「なんとなく白っぽい」が、色管理を間違えたときの典型的な見た目です。',
    },
    {
      kind: 'md',
      text: `
## 16 進数は「sRGB として」解釈される

\`new THREE.Color(0x4fd6ff)\` と書いたとき、three はこれを
**「人が見る色（$sRGB$）」として受け取り、内部でリニアに変換して保持します。**

だから \`color.r\` を読むと、$0\\text{x}4f / 255 = 0.31$ ではなく **$0.0782$** が返ってきます。
これはバグではなく、**リニアの世界での値**です。

元の $16$ 進数に戻したいときは \`color.getHexString()\` を使ってください。
入口で変換したぶんを、ちゃんと戻して返してくれます。

**\`color.r\` を $CSS$ にそのまま渡さないこと。**
$0.0782 \\times 255 = 20$ なので、\`#14...\` という別の色になります。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '色ではない数値に、色の変換をかけない',
      text: `
[](#/ch/t04-texture)と[](#/ch/x09-surface-bake)で繰り返した話が、ここに効いてきます。

- **色として見せるもの**（\`map\`、\`emissiveMap\`、環境マップ）
  … \`colorSpace = THREE.SRGBColorSpace\`
- **数値として使うもの**（\`normalMap\`、\`roughnessMap\`、\`metalnessMap\`、
  \`bumpMap\`、\`alphaMap\`、\`aoMap\`）… **指定しない**

粗さの $0.5$ は「明るさの $0.5$」ではなく「粗さの $0.5$」です。
そこに $sRGB$ の変換をかけると、**$0.214$ という別の粗さ**になってしまいます。

**「これは人が見る色か、計算に使う数値か」**で決めてください。
`,
    },
    {
      kind: 'formula',
      tex: 'r_{\\text{誤}} \;=\; \\left(\\dfrac{r + 0.055}{1.055}\\right)^{2.4}',
      readAloud:
        '粗さのテクスチャに $sRGB$ の変換をかけてしまったときに、実際に使われる値です。書いたつもりの粗さ $r$ が、この式を通った値にすり替わります。',
      worked: {
        given:
          '粗さ $0.2$・$0.5$・$0.8$ を意図して書いたテクスチャに、誤って \`colorSpace = SRGBColorSpace\` を付けた場合。',
        steps: [
          { calc: 'r = 0.2 → 0.0331' },
          { calc: '  ほぼ鏡になる', note: '意図の 6 分の 1' },
          { calc: 'r = 0.5 → 0.2140' },
          { calc: '  つやつやした表面' },
          { calc: 'r = 0.8 → 0.6038' },
          { calc: '  まだマシだが、ずれている' },
        ],
        result:
          '**どの値も小さいほうへずれます。** 粗さが小さい ＝ 鏡に近いので、**全体がやたらとテカった見た目**になります。しかもテクスチャは正しく読まれ、エラーも出ません。「粗さマップを入れたら、なぜか全部つやつやになった」は、ほぼこれです。**ずれ方が一様でない**（$0.2$ は $6$ 分の $1$、$0.8$ は $0.75$ 倍）ので、値を一律に補正しても直りません ― **指定を外す**のが唯一の直し方です。',
      },
    },
    {
      kind: 'md',
      text: `
## 自分で作ったテクスチャでも同じ

[](#/ch/x09-surface-bake)で $3$ 枚のテクスチャを焼いたとき、
**色のテクスチャにだけ \`colorSpace\` を指定**していました。

\`colorMap.colorSpace = THREE.SRGBColorSpace;\` と書いたのは色のテクスチャだけで、
雲と街明かりのテクスチャには何も指定していません。

雲のテクスチャは \`alphaMap\` として使うので、**数値**です。
街明かりのテクスチャも、シェーダの中で明るさとして使うので**数値**です。

**画像ファイルを読み込むときだけの話ではありません。**
自分でキャンバスに描いたテクスチャでも、まったく同じ判断が要ります。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`renderer.outputColorSpace\` を \`LinearSRGBColorSpace\` にすると、
\`#4fd6ff\` の面はどんな色で表示されますか。`,
      hint: 'リニアの値 $(0.0782,\\, 0.6724,\\, 1.0)$ が、そのまま $sRGB$ として表示されます。',
      answer: `**$\\#14abff$ ― 暗く、青に寄った色になります。**

**計算**

$0.0782 \\times 255 = 20 = 0\\text{x}14$

$0.6724 \\times 255 = 171 = 0\\text{x}ab$

$1.0 \\times 255 = 255 = 0\\text{x}ff$

**なぜ色相まで変わるのか**

各成分が**それぞれ違う割合で**暗くなるからです。

- $R$ … $79 \\to 20$（$4$ 分の $1$）
- $G$ … $214 \\to 171$（$0.8$ 倍）
- $B$ … $255 \\to 255$（変わらない）

明るい成分ほど影響が小さいので、**暗い成分だけが強く沈み**、色が偏ります。

**症状としての見え方**

「全体が暗く、コントラストが強く、彩度が高い」

写真で言えば、**現像を忘れた $RAW$ のような見た目**です。

**逆の間違いもある**

入口の変換を忘れると、逆に**明るく白っぽく**なります
（$\\#4fd6ff \\to \\#97ecff$）。

$2$ つは正反対の症状なので、**どちらに寄っているかで、
どちらの変換が抜けているかが分かります。**`,
    },
    {
      prompt: `法線マップに \`colorSpace = THREE.SRGBColorSpace\` を付けてしまいました。

見た目にどう出ますか。`,
      hint: '法線マップの $(0.5,\\, 0.5,\\, 1)$ は「平ら」を意味します。',
      answer: `**凹凸が強調され、しかも向きが歪みます。**

**何が起きるか**

法線マップは $(x,\\, y,\\, z)$ を $0$〜$1$ に押し込んだものです。
平らな面は $(0.5,\\, 0.5,\\, 1.0)$。

$sRGB$ の変換をかけると、

- $0.5 \\to 0.214$
- $1.0 \\to 1.0$

つまり $(0.214,\\, 0.214,\\, 1.0)$ ―
これを $-1$〜$1$ に戻すと $(-0.572,\\, -0.572,\\, 1.0)$ です。

**「平ら」であるはずの場所が、斜めを向きます。**

**見え方**

- 全体に、**左下方向へ傾いた**陰影が乗る
- 凹凸のコントラストが**強すぎる**
- 平らな部分が、なぜか光っている・陰っている

**気づきにくい理由**

法線マップは元々「なんとなく凹凸がある」ものなので、
**強すぎるのか間違っているのかが、目で分かりません。**

**確かめ方**

法線マップを外してみて、陰影の向きが変わるかを見ます。
外したときのほうが自然なら、指定を疑ってください。

**規則で覚える**

**\`Map\` で終わる名前のうち、色でないものには指定しない。**
迷ったら「これは人が見る色か」と自問します。`,
    },
    {
      prompt: `キャンバスに自分で描いたテクスチャを \`map\` に使います。

\`colorSpace\` は指定しますか。`,
      hint: '\`map\` は何に使われますか。',
      answer: `**指定します（\`THREE.SRGBColorSpace\`）。**

**理由**

\`map\` は**人が見る色**として使われます。

そしてキャンバスに \`fillStyle = '#4fd6ff'\` と書いて描いた画素は、
**$sRGB$ の値**として入っています（$CSS$ の色はすべて $sRGB$）。

だから three に「これは $sRGB$ です」と伝える必要があります。

**指定を忘れると**

three はデータをリニアだと思って扱うので、
**変換なしで計算に入ります** ― 値が大きすぎるので、
最終的に**白っぽく明るい**絵になります。

**例外もある**

同じキャンバスでも、

- \`alphaMap\` に使う … **指定しない**（数値）
- \`roughnessMap\` に使う … **指定しない**（数値）
- \`emissiveMap\` に使う … **指定する**（色）

**同じ画像でも、使い道で変わります。**

$1$ 枚のテクスチャを \`map\` と \`roughnessMap\` の両方に使いたい場合は、
**別のインスタンスを作って別々に指定する**ことになります
（\`colorSpace\` はテクスチャの持ち物なので）。`,
    },
  ],
  quiz: [
    {
      q: '色管理が正しいかを確かめる、いちばん確実な方法はどれですか。',
      choices: [
        '同じ 16 進数を CSS と MeshBasicMaterial に出して並べ、境目が見えないか確かめる',
        'スクリーンショットの画素値を測る',
        'console.log で color.r を確かめる',
        'デザインツールと見比べる',
      ],
      answer: 0,
      explain:
        'MeshBasicMaterial は光の影響を受けないので、色管理だけを取り出して見られます。境目が見えなければ、入口と出口の変換が正しく通っています。color.r を読むのは、リニアの値が返るので確認には向きません（0x4f は 0.31 ではなく 0.0782 です）。',
    },
    {
      q: '粗さマップに `colorSpace = SRGBColorSpace` を付けてしまうと、どう見えますか。',
      choices: [
        '全体がやたらとテカる。粗さ 0.2 が 0.033 に、0.5 が 0.214 にずれるから',
        '全体がざらつく',
        '色が変わる',
        'エラーになる',
      ],
      answer: 0,
      explain:
        'sRGB → リニアの変換は値を小さいほうへ動かします。粗さが小さいということは鏡に近いということなので、全部つやつやになります。ずれ方が一様でない（0.2 は 6 分の 1、0.8 は 0.75 倍）ので、値を一律に補正しても直りません ― 指定を外すのが唯一の直し方です。',
    },
    {
      q: '自分でキャンバスに描いたテクスチャを `map` に使うとき、`colorSpace` は指定しますか。',
      choices: [
        '指定する。CSS の色で描いた画素は sRGB の値だから',
        '指定しない。自分で作ったものだから',
        'three が自動で判定する',
        'キャンバスの場合は関係ない',
      ],
      answer: 0,
      explain:
        'fillStyle に書く色はすべて sRGB なので、キャンバスの画素も sRGB です。map は人が見る色として使われるので、指定が要ります。ただし同じキャンバスでも alphaMap や roughnessMap に使うなら数値なので指定しません ― 同じ画像でも使い道で変わります。',
    },
  ],
};
