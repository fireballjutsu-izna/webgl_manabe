import type { Chapter } from '../types.ts';

export const chapterQ02: Chapter = {
  slug: 'q02-color',
  part: 'polish',
  number: 2,
  title: '色の通り道',
  goal: '指定した色が画面に出るまでの道筋が分かり、「色が思ったとおりに出ない」を自分で切り分けられるようになります。',
  requires: ['q01-environment', 't04-texture'],
  threeApis: [
    'ColorManagement',
    'WebGLRenderer.outputColorSpace',
    'WebGLRenderer.toneMapping',
    'WebGLRenderer.toneMappingExposure',
    'Texture.colorSpace',
    'Color',
    'Color.getHexString',
    'MeshBasicMaterial',
  ],
  mathRecall: [
    { slug: 't04-texture', note: 'テクスチャの colorSpace 指定' },
    { slug: 'p07-city-light', note: 'トーンマッピングを 1 行入れた、あの設定' },
    { slug: 'q01-environment', note: '環境マップを入れると明るくなりすぎる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 「色が違う」は、いちばんよくある詰まり方

デザインツールで決めた \`#4fd6ff\` をそのままコードに書いたのに、**画面では違う色に見える。**
3D を始めた人が必ず一度は踏みます。

原因はほぼ 3 つのどれかです。

- **テクスチャの \`colorSpace\` 指定を忘れている**（[](#/ch/t04-texture)でやりました）
- **トーンマッピングがかかっている**（[](#/ch/p07-city-light)で 1 行入れました）
- **そもそも「色の通り道」を知らない**

3 つめをここで潰します。**指定した色が画面に出るまでに何が起きているか**を、順番に見ます。
`,
    },
    {
      kind: 'md',
      text: `
## 計算は暗い世界で、表示は明るい世界で

光の計算（足す・掛ける・内積を取る）は、**光の量に比例した数値**でないと正しく行えません。
「2 倍明るい光は数値も 2 倍」でなければ、足し算が意味を持たないからです。これを**リニア**と言います。

ところが、画面に出す色（\`#4fd6ff\` のような 16 進数）は**リニアではありません。**
人間の目は暗いところの差に敏感なので、**暗い側に目盛りを多く割り当てた**目盛り（sRGB）になっています。

だから three の中ではこうなっています。

- **入口** … 16 進数やテクスチャを、sRGB からリニアへ**変換して取り込む**
- **計算** … ぜんぶリニアで行う（ライティング・環境マップ・混色）
- **出口** … リニアから sRGB へ**戻して**画面に出す

この入口と出口の変換を{{リニアワークフロー}}と呼びます。
**three は既定で全部やってくれます。**問題は、片方だけ忘れたときに起きます。
`,
    },
    {
      kind: 'formula',
      tex: 'c_{\\text{linear}} \\approx c_{\\text{sRGB}}^{\\,2.2}, \\qquad c_{\\text{sRGB}} \\approx c_{\\text{linear}}^{\\,1/2.2}',
      readAloud:
        'sRGB の値を 2.2 乗するとリニアになり、リニアの値を 2.2 分の 1 乗すると sRGB に戻る、と読みます。実際の変換は暗い側だけ直線にした折れ線ですが、感覚としてはこの「2.2 乗」で十分です。0.5 を 2.2 乗すると約 0.22 ― 半分の明るさに見える色は、実際の光の量では 2 割ほどしかない、ということです。',
      worked: {
        given: 'サイトのシアン `#4fd6ff` の R 成分 `0x4f` が、three の中でどんな数値になるかを追います。',
        steps: [
          { calc: '0x4f = 79' },
          { calc: '79 / 255 = 0.3098', note: 'これが sRGB としての値' },
          { calc: '0.3098 の 2.2 乗 = 0.076', note: 'リニアに直す' },
          { calc: '（three の正確な変換では 0.078）' },
          { calc: '戻すとき : 0.078 の 1/2.2 乗 = 0.31', note: '元に戻る' },
        ],
        result: '`new THREE.Color(0x4fd6ff).r` が **0.31 ではなく 0.078** なのは、これです。**バグではありません。** 光の足し算は線形でないと合わないので、three は受け取った時点でリニアに直して持ち、画面に出す最後の瞬間に sRGB へ戻します。sRGB の値がほしいときは `getHexString()` を使ってください。',
      },
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: 'なぜ目盛りが偏っているのか',
      text: `
真っ暗な部屋でろうそくを 1 本から 2 本にすると、はっきり明るくなったと感じます。
ところが 100 本から 101 本に増やしても、まず気づきません。

**人間の目は「差」ではなく「比」で明るさを感じます。** だから暗い側に目盛りを厚く配ると、
同じビット数でも段差が見えにくくなります。sRGB はそのための目盛りです。

一方、光そのものは足し算で増えます。**計算には計算用の目盛り（リニア）が要る** ―
2 つの世界を行き来しているのは、そういう理由です。
`,
    },
    {
      kind: 'md',
      text: `
## 確かめる ― CSS と three で同じ色を並べる

理屈より、一致するかどうかを見たほうが早いです。

次のコードは、**同じ 16 進数**を 2 か所で使っています。

- 画面上半分 … three の \`MeshBasicMaterial\`（光の影響を受けない材質）
- 画面下半分 … ただの HTML の \`div\` に CSS で背景色を指定したもの

**設定が正しければ、境目が見えなくなります。**
ボタンで \`outputColorSpace\` を切り替えると、あからさまにずれます。
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
## 16進数は「sRGB として」解釈される

\`new THREE.Color(0x4fd6ff)\` と書いたとき、three はこれを
**「人が見る色（sRGB）」として受け取り、内部でリニアに変換して保持します。**

だから \`color.r\` を読むと、\`0x4f / 255 = 0.31\` ではなく **0.077** くらいの値が返ってきます。
これはバグではなく、**リニアの世界での値**です。

元の 16 進数に戻したいときは \`color.getHexString()\` を使ってください。
入口で変換したぶんを、ちゃんと戻して返してくれます。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '色ではない数値に、色の変換をかけない',
      text: `
[](#/ch/t04-texture)と[](#/ch/x09-surface-bake)で繰り返した話が、ここに効いてきます。

- **色として見せるもの**（\`map\`、\`emissiveMap\`、環境マップ）… \`colorSpace = THREE.SRGBColorSpace\`
- **数値として使うもの**（\`normalMap\`、\`roughnessMap\`、\`metalnessMap\`、\`bumpMap\`、\`alphaMap\`、\`aoMap\`）… **指定しない**

粗さの 0.5 は「明るさの 0.5」ではなく「粗さの 0.5」です。
そこに sRGB の変換をかけると、0.22 くらいの別の粗さになってしまいます。
**「これは人が見る色か、計算に使う数値か」**で決めてください。
`,
    },
    {
      kind: 'md',
      text: `
## トーンマッピング ― 1 を超えた明るさをどう畳むか

色管理とは別に、もう 1 つの関門があります。

環境マップを入れたり（[](#/ch/q01-environment)）、強いライトを置いたりすると、
計算の結果が**平気で 1 を超えます。** ところが画面が出せる最大は 1（＝真っ白）です。

何もしなければ、1 を超えた部分は**まとめて真っ白に切り捨てられます。**
明るい部分の形が消え、のっぺりした白い塊になります。

**{{トーンマッピング}}は、この「はみ出した明るさ」を 0〜1 に畳み直す変換**です。
写真の現像でハイライトを持ち上げたり抑えたりするのと同じ仕事をします。
`,
    },
    {
      kind: 'demo',
      id: 'tonemap-compare',
      caption:
        '左右で同じシーンを別のトーンマッピングで描いています。「なし」では光源も球のハイライトも真っ白な塊になりますが、ACES Filmic では明るい部分に階調が残り、球の丸みが消えません。光の強さを下げていくと差はほとんど無くなります ― **トーンマッピングは「明るすぎるとき」にだけ効く**設定です。',
    },
    {
      kind: 'md',
      text: `
## 5つの選び方

three が用意しているものを、実際の選び方の順に並べます。

- **\`NoToneMapping\`** … 何もしない。既定値。**1 を超えたら白く潰れます**
- **\`LinearToneMapping\`** … 全体を一律に暗くするだけ。潰れは残る
- **\`CineonToneMapping\`** … フィルム風。やや眠い見た目
- **\`ACESFilmicToneMapping\`** … **迷ったらこれ。** 映画の現場から来た曲線で、明るい部分がきれいに残る
- **\`NeutralToneMapping\`** … 色相のずれが小さい。**素材の色を正確に見せたいとき**（商品など）

そして \`toneMappingExposure\` が{{露出}}です。カメラの絞りに当たります。
**トーンマッピングが「焼き方」、露出が「光の取り込み量」**。役割が違うので、両方触れます。

明るすぎるときはまず露出を下げてください。ライトの強さを全部書き換えるより、ずっと速いです。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ポストプロセスを足すと、ここが移動します',
      text: `
次の章で \`EffectComposer\` を導入すると、**トーンマッピングと sRGB への変換は
「いちばん最後」に一度だけ**行う必要が出てきます。途中の合成はリニアのままやりたいからです。

そのために \`OutputPass\` という専用のパスがあり、**これを付け忘れると色が壊れます。**
この章の内容を知っていれば、その理由がそのまま分かります。
`,
    },
    {
      kind: 'md',
      text: `
## 切り分けの順番

「色がおかしい」と思ったとき、上から順に見てください。

- **全体が白っぽくて薄い** … 出口の変換が抜けている（\`outputColorSpace\`）か、
  リニアで作った数値を色として出している
- **全体が濃くて暗い** … 逆に二重に変換している。テクスチャの \`colorSpace\` を
  指定しなくてよいものに指定していないか
- **明るいところだけ白い塊になる** … トーンマッピングが無い
- **法線マップや粗さだけおかしい** … データのテクスチャに \`colorSpace\` を指定してしまっている
- **デザインツールと色が違う** … トーンマッピングと露出が効いている。
  比べるときは \`NoToneMapping\` に戻して確かめる

**まず 1 つだけ変えて、変化を見る。** 色の問題は原因が重なりやすいので、
複数を同時に触ると何が効いたのか分からなくなります。
`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスの \`renderer.outputColorSpace\` を \`THREE.LinearSRGBColorSpace\` にしてください。
three が描いた板と、CSS で塗った領域は、まだ同じ色に見えますか。`,
      hint: '出口の変換を止めると、線形の数値がそのまま画面に出ます。',
      answer: `three 側だけが**暗く沈み**、CSS 側とはっきりずれます。
\`Color\` は 16 進数を sRGB として受け取り、内部では線形に直して持っています。
その線形の値を、sRGB に戻さずそのまま画面へ出したので、暗くなりました。
**\`outputColorSpace\` は「最後に sRGB へ戻す」係**で、既定で正しく設定されています。
自分で書き換える理由は、ほぼありません。`,
    },
    {
      prompt: '\`renderer.toneMapping\` を \`ACESFilmicToneMapping\` にしてください。色の比較はどうなりますか。この課題では、なぜ \`NoToneMapping\` にしてあるのでしょう。',
      hint: 'トーンマッピングは「明るさをどう焼くか」の工程です。',
      answer: `板の色が変わり、CSS とずれます。トーンマッピングは**色を意図的に作り変える**工程だからです。
「同じ 16 進数が同じ色に出るか」を確かめたいこの課題では、それが邪魔なので切ってあります。
実際の作品では入れるべきものですが、**色を突き合わせて調べるときはいったん切る**のが手順です。
入れたまま調べると、色管理の問題かトーンマッピングの効果かが区別できません。`,
    },
    {
      prompt: 'デザインツールで決めた \`#4fd6ff\` を、three で「見たとおりの色」で出したい。\`new THREE.Color(0x4fd6ff)\` の \`.r\` を \`console.log\` すると 0.31 ではなく 0.077 になります。バグでしょうか。',
      hint: 'Color が持っているのは、sRGB の値ではありません。',
      answer: `**バグではありません。** \`0x4f\` は 255 分の 79 で約 0.31 ですが、それは sRGB の値です。
\`Color\` はそれを線形に直して 0.077 として持っています（計算は線形でしないと、光の足し算が合わないため）。
sRGB の値がほしいときは \`getStyle()\` や \`getHexString()\` を使ってください。
**「入れた値と読み出した値が違う」のは正しい動作**で、ここを知らないと延々と悩みます。`,
    },
  ],
  quiz: [
    {
      q: '`new THREE.Color(0x4fd6ff).r` を読むと 0.31 ではなく 0.077 くらいが返ります。これはなぜですか。',
      choices: [
        '16 進数は sRGB として受け取られ、内部ではリニアに変換して保持されているから',
        'three のバグ',
        '色が正規化されているから',
        'トーンマッピングがかかっているから',
      ],
      answer: 0,
      explain:
        '光の計算はリニアでないと正しく行えないので、入口で変換されています。元の 16 進数が欲しいときは `getHexString()` を使うと、変換を戻して返してくれます。',
    },
    {
      q: '`roughnessMap` に `colorSpace = THREE.SRGBColorSpace` を指定すると何が起きますか。',
      choices: [
        '粗さの数値が変換されてしまい、意図と違う粗さになる',
        '何も起きない',
        'テクスチャが表示されなくなる',
        '描画が軽くなる',
      ],
      answer: 0,
      explain:
        'sRGB の指定は「これは人が見る色なので、明るさの変換をしてから使ってください」という意味です。粗さは色ではなく計算に使う数値なので、変換されると 0.5 が 0.22 のように別の値に変わってしまいます。色に使う map と emissiveMap、環境マップにだけ指定します。',
    },
    {
      q: '強いライトを入れたら、明るい部分がのっぺりした白い塊になりました。まず試すべきことはどれですか。',
      choices: [
        '`renderer.toneMapping` を `ACESFilmicToneMapping` にする',
        '`outputColorSpace` を Linear にする',
        'テクスチャの `colorSpace` を外す',
        'ピクセル比を上げる',
      ],
      answer: 0,
      explain:
        '1 を超えた明るさが切り捨てられている状態です。トーンマッピングは、はみ出した明るさを 0〜1 に畳み直す変換で、ACES Filmic は明るい部分の階調をよく残します。さらに `toneMappingExposure` で全体の明るさを調整できます。',
    },
  ],
};
