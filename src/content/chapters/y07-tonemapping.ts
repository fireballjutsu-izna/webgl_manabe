import type { Chapter } from '../types.ts';

export const chapterY07: Chapter = {
  slug: 'y07-tonemapping',
  part: 'polish',
  number: 7,
  title: 'トーンマッピング ― 1 を超えた明るさを、畳む',
  goal: '$1$ を超えた明るさが白く潰れる仕組みを説明できるようになり、$5$ つの曲線と露出を、目的から選べるようになります。',
  requires: ['y06-hex-colorspace', 'x12-additive', 'y04-env-intensity'],
  threeApis: ['WebGLRenderer.toneMapping', 'WebGLRenderer.toneMappingExposure'],
  mathRecall: [
    { slug: 'x12-additive', note: '足し算は $1$ で止まらない' },
    { slug: 'b35-easing', note: '入力を、ひとひねりして出す' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## もう 1 つの関門

色管理とは別に、関門がもう $1$ つあります。

環境マップを入れたり（[](#/ch/q01-environment)）、強いライトを置いたりすると、
計算の結果が**平気で $1$ を超えます。** ところが画面が出せる最大は $1$（＝真っ白）です。

何もしなければ、$1$ を超えた部分は**まとめて真っ白に切り捨てられます。**
明るい部分の形が消え、のっぺりした白い塊になります。

**{{トーンマッピング}}は、この「はみ出した明るさ」を $0$〜$1$ に畳み直す変換**です。
写真の現像でハイライトを抑えるのと、同じ仕事をします。
`,
    },
    {
      kind: 'demo',
      id: 'tonemap-compare',
      caption:
        '左右で同じシーンを別のトーンマッピングで描いています。「なし」では光源も球のハイライトも真っ白な塊になりますが、$ACES$ $Filmic$ では明るい部分に階調が残り、球の丸みが消えません。光の強さを下げていくと差はほとんど無くなります ― **トーンマッピングは「明るすぎるとき」にだけ効く**設定です。',
    },
    {
      kind: 'formula',
      tex: "c' \\;=\\; f\\bigl(c \\times E\\bigr)",
      readAloud:
        'まず露出 $E$ を掛けてから、トーンマッピングの曲線 $f$ に通します。$E$ がカメラの絞り、$f$ が現像の焼き方にあたります。順番が決まっているので、$2$ つは別々のつまみとして働きます。',
      worked: {
        given: 'three の $ACES$ $Filmic$ に、いろいろな明るさを通します（$E = 1$ と $E = 0.5$）。',
        steps: [
          { calc: '入力  クリップ  ACES   ACES(E=0.5)' },
          { calc: '0.25   0.250   0.312   0.131' },
          { calc: '0.50   0.500   0.558   0.312' },
          { calc: '1.00   1.000   0.763   0.558' },
          { calc: '2.00   1.000   0.888   0.763' },
          { calc: '4.00   1.000   0.952   0.888' },
        ],
        result:
          '**$2$ つのことが同時に起きています。** ひとつは $1$ を超えた $2.0$ と $4.0$ が、$0.888$ と $0.952$ という**別々の値**になっていること ― クリップならどちらも $1.000$ で、区別が消えていました。もうひとつは、**$1$ 未満の値も動かされている**こと（$0.5 \\to 0.558$、$1.0 \\to 0.763$）。$ACES$ は全体をやや暗く、コントラストを付ける曲線なので、**白飛びしていない絵に入れると「眠くなった」と感じる**ことがあります。$E = 0.5$ の列は、$E = 1$ の列を $1$ 段ずらしただけ ― **露出は曲線の上を滑らせるつまみ**です。',
      },
    },
    {
      kind: 'md',
      text: `
## 5 つの選び方

three が用意しているものを、実際の選び方の順に並べます。

- **\`NoToneMapping\`** … 何もしない。既定値。**$1$ を超えたら白く潰れます**
- **\`LinearToneMapping\`** … 全体を一律に暗くするだけ。潰れは残る
- **\`CineonToneMapping\`** … フィルム風。やや眠い見た目
- **\`ACESFilmicToneMapping\`** … **迷ったらこれ。** 映画の現場から来た曲線で、明るい部分がきれいに残る
- **\`NeutralToneMapping\`** … 色相のずれが小さい。**素材の色を正確に見せたいとき**（商品など）

最後の $2$ つの違いが分かりにくいので、$1$ 行で言うと、

- **$ACES$** … 見栄えがする。明るい部分が**わずかに色相をずらしながら**白へ寄る
- **$Neutral$** … 素直。**色相を保ったまま**明るさだけを畳む

商品の色を正確に見せたい場面では、$ACES$ の色相のずれが問題になります。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '露出は「取り込む量」、トーンマッピングは「焼き方」',
      text: `
\`toneMappingExposure\` が{{露出}}です。カメラの絞りに当たります。

**役割が違うので、両方触れます。**

- 全体が明るすぎる → **まず露出を下げる**
- 明るい部分だけ潰れる → **トーンマッピングを変える**

ライトの強さを全部書き換えるより、露出を $0.6$ にするほうが**ずっと速い**です。
そして、ライトどうしの比は変わりません ―
**シーンの構成を保ったまま、全体の明るさだけを動かせます。**

逆に言えば、**個々のライトのバランスは露出では直りません。**
「片方だけ明るすぎる」なら、そのライトを触ってください。
`,
    },
    {
      kind: 'sandbox',
      title: '5 つの曲線を、同じシーンで見比べる',
      guide: { focus: ['5 つのトーンマッピングを並べる', '明るいものを置く'] },
      code: `import * as THREE from 'three';

const EXPOSURE = 1.0;   // 0.5 や 2.0 も試してください

const MODES = [
  { name: 'NoToneMapping', value: THREE.NoToneMapping },
  { name: 'Linear', value: THREE.LinearToneMapping },
  { name: 'Cineon', value: THREE.CineonToneMapping },
  { name: 'ACESFilmic', value: THREE.ACESFilmicToneMapping },
  { name: 'Neutral', value: THREE.NeutralToneMapping },
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1016);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMappingExposure = EXPOSURE;
renderer.setScissorTest(true);
document.body.appendChild(renderer.domElement);

/* ---- 明るいものを置く ---- */
// 強いライトと、色の付いた球。1 を大きく超える明るさを作る

const key = new THREE.DirectionalLight(0xffffff, 6.0);
key.position.set(2, 3, 4);
const warm = new THREE.PointLight(0xffb060, 60, 20);
warm.position.set(-2.4, 0.4, 2);
scene.add(key, warm, new THREE.AmbientLight(0x223046, 0.5));

[
  { x: -1.6, color: 0xff5a4a },
  { x: 0, color: 0xdedede },
  { x: 1.6, color: 0x4fd6ff },
].forEach((spec) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 48, 32),
    new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.28, metalness: 0.1 }),
  );
  mesh.position.x = spec.x;
  scene.add(mesh);
});

/* ---- 5 つのトーンマッピングを並べる ---- */
// 同じシーン・同じカメラを、設定だけ変えて 5 回描く

MODES.forEach((mode, index) => {
  const div = document.createElement('div');
  div.textContent = mode.name;
  div.style.cssText =
    'position:absolute; bottom:10px; transform:translateX(-50%);' +
    'color:#e8e8f2; font:11px ui-monospace, monospace; pointer-events:none; white-space:nowrap;' +
    'background:rgba(10,12,18,0.7); padding:3px 6px; border-radius:4px;';
  div.style.left = ((index + 0.5) / MODES.length * 100) + '%';
  document.body.appendChild(div);
});

renderer.setAnimationLoop(() => {
  const w = Math.floor(renderer.domElement.clientWidth / MODES.length);
  const h = renderer.domElement.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  for (let i = 0; i < MODES.length; i++) {
    renderer.toneMapping = MODES[i].value;   // ここだけが違う
    renderer.setViewport(i * w, 0, w, h);
    renderer.setScissor(i * w, 0, w, h);
    renderer.render(scene, camera);
  }
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**いちばん左（$NoToneMapping$）のハイライトを見てください** ― 球の光っている部分が**白い塊**になり、丸みが消えています。$Linear$ は全体を暗くするだけなので、潰れはそのまま残ります。$ACES$ と $Neutral$ ではハイライトに階調が戻ります。**赤い球の白飛びした部分**を見比べると、$ACES$ は白へ寄り、$Neutral$ は赤みを保ったまま明るくなるのが分かります。`EXPOSURE` を $0.5$ にすると、**左の $2$ つだけが劇的に変わります** ― もともと潰れていたぶんが戻るからです。',
    },
    {
      kind: 'md',
      text: `
## 入れるべきかどうか

**白飛びしていないなら、入れる必要はありません。**

[](#/ch/x12-additive)で見たとおり、$ACES$ は $1.0$ を $0.763$ に、
$0.5$ を $0.558$ に動かします ―
**画面全体が少し暗く、少しコントラストが付いた**状態になります。

だから、

- 環境マップを入れた … **ほぼ必ず要る**
- 加算ブレンドで光を重ねた … **要る**
- ライトが $1$ つで、明るさが $1$ を超えない … **要らない**

$3$ つめで入れると「なんとなく眠い」だけの結果になります。

**まず、白飛びしているかを確かめてください。**
明るい部分を拡大して、**階調があるか、真っ白な塊か**を見るのがいちばん早い判断です。
`,
    },
  ],
  exercises: [
    {
      prompt: `明るさ $2.0$ と $4.0$ の $2$ か所が、$NoToneMapping$ ではどう見えますか。

$ACES$ ではどうですか。`,
      hint: '表の値を読んでください。',
      answer: `**$NoToneMapping$ では区別が付きません。$ACES$ では $0.888$ と $0.952$ に分かれます。**

**クリップの場合**

$2.0 \\to 1.000$、$4.0 \\to 1.000$。

**$2$ 倍の差が、完全に消えます。**

見た目には、$2$ つの領域が**同じ真っ白の塊**として繋がって見えます。

**$ACES$ の場合**

$0.888$ と $0.952$。$sRGB$ に直すと $0.949$ と $0.979$ ―
**$8$ ビットでは $242$ と $250$ で、$8$ 段の差**があります。

**わずかですが、境目が見えます。**

**なぜ「わずか」でよいのか**

$4$ 倍の明るさの差が $8$ 段にしかならないのは、乱暴に見えます。

でも、**人の目も同じことをしています。**
太陽と電球の明るさは何千倍も違いますが、どちらも「白い」としか見えません。

**大事なのは、差が $0$ でないこと**です。
$0$ なら形が消えますが、$8$ 段あれば輪郭が読めます。`,
    },
    {
      prompt: `全体が明るすぎます。露出を下げるのと、ライトを全部弱めるのは、どう違いますか。`,
      hint: 'ライトどうしの比は、それぞれどうなりますか。',
      answer: `**結果はほぼ同じですが、手間と壊れやすさが違います。**

**露出を下げる**

$1$ 行です。\`renderer.toneMappingExposure = 0.6\`

- ライトどうしの**比は変わりません**
- 環境マップの寄与も、同じ割合で下がります
- **シーンの構成が保たれます**

**ライトを全部弱める**

$5$ つのライトがあれば $5$ か所です。

- 書き間違えれば**比が崩れます**
- 環境マップの寄与は**下がりません**（別の設定なので）
- あとで $1$ つ足したとき、**同じ割合を掛け忘れます**

$2$ つめが効きます。**環境マップとライトの比が変わってしまう**ので、
「全体を暗くしたつもりが、映り込みだけ相対的に強くなった」ことになります。

**使い分け**

- **全体の明るさ** … 露出
- **個々のバランス** … それぞれのライト

「片方のライトだけ明るすぎる」は露出では直りません。
**症状が「全体」か「一部」かで、触る場所が決まります。**`,
    },
    {
      prompt: `商品の色を正確に見せたいページで、$ACES$ を使うと何が問題になりますか。`,
      hint: '$ACES$ が明るい部分でしていることを思い出してください。',
      answer: `**明るい部分の色相がずれ、指定した色と違って見えます。**

**$ACES$ がしていること**

$ACES$ は映画の現像から来た曲線で、
**明るい部分をわずかに色相をずらしながら白へ寄せます。**

これは「見栄えがする」方向の加工です。
夕焼けも、金属のハイライトも、$ACES$ を通すと**それらしく**なります。

**商品では困る**

赤い鞄の明るい部分が、わずかにオレンジ寄りの白へ抜ける ―
**「実物と色が違う」という苦情になります。**

$3$ 次元で商品を見せる場合、色は**仕様**です。

**$Neutral$ を使う**

\`NeutralToneMapping\` は色相を保ったまま明るさだけを畳みます。

- ハイライトの潰れは防げる
- 色相はずれない
- そのかわり、$ACES$ ほど「映画っぽく」はならない

**どちらが正しいという話ではありません。**
**その絵が「作品」なのか「仕様」なのか**で選びます。

**確かめ方**

彩度の高い色（純赤、純青）の球を置いて、
ハイライトの色を見比べてください。$ACES$ では白へ、$Neutral$ では色を保ったまま抜けます。`,
    },
  ],
  quiz: [
    {
      q: '`NoToneMapping` で明るさ 2.0 と 4.0 はどう表示されますか。',
      choices: [
        'どちらも 1.000 に切り捨てられ、区別が付かなくなる',
        '2.0 と 4.0 の比が保たれる',
        'エラーになる',
        '自動で 1 以下に収まる',
      ],
      answer: 0,
      explain:
        '1 を超えた値はまとめて 1 に切られるので、4 倍の差が完全に消えます。ACES なら 0.888 と 0.952 で、sRGB では 242 と 250 ― わずか 8 段ですが、差が 0 でないので輪郭が読めます。人の目も太陽と電球をどちらも「白い」としか感じないので、わずかでよいのです。',
    },
    {
      q: '`toneMappingExposure` と `toneMapping` の役割の違いはどれですか。',
      choices: [
        '露出は「取り込む量」、トーンマッピングは「焼き方」。露出はライトの比を保ったまま全体を動かす',
        '同じもの。片方だけ使えばよい',
        '露出は色相を、トーンマッピングは明るさを変える',
        '露出はポストプロセスでのみ効く',
      ],
      answer: 0,
      explain:
        '式は c\' = f(c × E) で、順番が決まっています。全体が明るすぎるなら露出を下げるのが 1 行で済み、しかもライトどうしの比も環境マップとの比も保たれます。ライトを 5 つとも弱めると、環境マップの寄与だけが下がらないので比が崩れます。',
    },
    {
      q: '商品の色を正確に見せたいとき、どのトーンマッピングを選びますか。',
      choices: [
        'NeutralToneMapping。色相を保ったまま明るさだけを畳むから',
        'ACESFilmicToneMapping',
        'NoToneMapping',
        'CineonToneMapping',
      ],
      answer: 0,
      explain:
        'ACES は明るい部分をわずかに色相をずらしながら白へ寄せる、見栄え重視の曲線です。作品なら長所ですが、商品では「実物と色が違う」という問題になります。Neutral なら潰れを防ぎつつ色相が保たれます。その絵が「作品」なのか「仕様」なのかで選びます。',
    },
  ],
};
