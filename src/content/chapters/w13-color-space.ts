import type { Chapter } from '../types.ts';

export const chapterW13: Chapter = {
  slug: 'w13-color-space',
  part: 'threejs',
  number: 13,
  title: '色 ― 16 進数から、目に届く明るさまで',
  goal: '色の値が画面に出るまでに何が起きるかが分かり、明るさを正しく測れるようになります。',
  requires: ['w12-transparent', 'b04-power-root'],
  threeApis: [
    'Color',
    'Color.set',
    'Color.setHSL',
    'Color.getHexString',
    'Color.lerpColors',
    'SRGBColorSpace',
  ],
  mathRecall: [
    { slug: 'b04-power-root', note: '2.2 乗・0.4545 乗という、整数でない指数' },
    { slug: '08-interp', note: '色を混ぜるのも lerp。ただし「どの空間で」が効く' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 「$128$ は、$255$ の半分の明るさ」ではない

いきなり直感に反する話から始めます。

\`#808080\` は、$255$ のちょうど半分の $128$ です。
ところが、この灰色は**白の半分の明るさではありません。**

実際の明るさは、**白のおよそ 22%** です。

なぜこうなるのか。そして、これを知らないと何が壊れるのか。
この章はその話です。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '目盛りが等間隔でない物差し',
      text: `
人の目は、暗いところの違いにはとても敏感で、明るいところの違いには鈍感です。

真っ暗な部屋でろうそくを 1 本から 2 本にすると、はっきり明るくなったと感じます。
昼の屋外でろうそくを 1 本増やしても、誰も気づきません。

だから「見た目の明るさが等間隔に並ぶ」ように 0〜255 を割り振ると、
物理的な光の量としては等間隔になりません。暗い側に目盛りが密に寄ります。

画像や色コードは、この「見た目の目盛り」で書かれています。
`,
    },
    {
      kind: 'md',
      text: `
## 2 つの目盛り

色には**2 通りの数え方**があります。

- **sRGB** … 見た目の明るさで刻んだ目盛り。**画像ファイル・CSS・色コードはこちら**
- **リニア** … 物理的な光の量で刻んだ目盛り。**計算はこちらでやらないと合わない**

なぜ計算はリニアでないといけないか。

**光は足し算だから**です。ろうそく 2 本の明るさは、1 本の明るさのちょうど 2 倍。
[](#/ch/b27-lambert)でやった「法線と光の内積」も、
[](#/ch/w12-transparent)でやった $\\alpha$ 合成も、**足し算と掛け算**でできています。

見た目の目盛りのまま足し算すると、答えが狂います。

だから three は、こう動いています。

1. 色コードや画像を受け取ったら、**リニアに直す**
2. リニアで、ライティングも合成も全部やる
3. 画面に出す直前に、**sRGB に戻す**

これが{{リニアワークフロー}}です。**ふつうに書いていれば、three が全部やってくれます。**
`,
    },
    {
      kind: 'formula',
      tex: 'L \\;\\approx\\; \\left(\\frac{S}{255}\\right)^{2.2}',
      readAloud:
        'sRGB の値 $S$ を $0$〜$1$ に直し、2.2 乗するとリニアな光の量 $L$ になります。逆にリニアから sRGB に戻すには 2.2 の逆数、つまり 0.4545 乗します。厳密な式は暗い側だけ直線にした少し複雑なものですが、この近似で十分です。',
      worked: {
        given: '**$\\#808080$（$S = 128$）は、白の何%の明るさ**でしょう。',
        steps: [
          { calc: 'S / 255 = 128 / 255 = 0.502' },
          { calc: '0.502 の 2.2 乗 = 0.2195', note: '2.2 乗すると、大きく小さくなる' },
          { calc: '白は : (255/255) の 2.2 乗 = 1.0' },
          { calc: '0.2195 / 1.0 = 22.0%' },
          { calc: '【逆に、光の量が半分の色は】' },
          { calc: '0.5 の 0.4545 乗 = 0.7297' },
          { calc: '0.7297 x 255 = 186', note: '#BABABA' },
        ],
        result:
          '**$\\#808080$ は白の 22%**、そして**光の量がちょうど半分なのは $\\#BABABA$ 前後**（three の厳密な式では $\\#BCBCBC$）です。$128$ ではありません。**この差が、色を扱うときのほぼすべての混乱の元**です。デザインツールで「$50\\%$ の灰色」と思って選んだ色は、光の量としては $22\\%$ しかありません。なお three が使う厳密な sRGB の式（暗い側だけ直線にしたもの）では $21.6\\%$ になります。$2.2$ 乗はその近似です。',
      },
    },
    {
      kind: 'md',
      text: `
## 明るさは、RGB の平均ではない

もう 1 つ、直感に反することがあります。

**純粋な緑と、純粋な青は、明るさがまったく違います。**

同じ「$255$」なのに、緑はまぶしく、青は暗く見えます。
人の目の感度が、色によって大きく違うからです。

だから「この色の明るさはいくつか」を求めるとき、
$(R + G + B) / 3$ **では正しく出ません。**

正しくは、色ごとに重みを付けて足します。
`,
    },
    {
      kind: 'formula',
      tex: 'Y \\;=\\; 0.2126\\,R + 0.7152\\,G + 0.0722\\,B',
      readAloud:
        '色の明るさ ― 輝度と呼びます ― は、赤・緑・青を別々の重みで足したものです。緑がおよそ 7 割を占め、青は 7% しかありません。3 つの重みを足すと 1 になるので、白は輝度 1 になります。値はリニアなものを入れてください。',
      worked: {
        given:
          '**純粋な赤・緑・青**（それぞれリニアで $1.0$）の{{輝度}}を求め、単純平均と比べます。',
        steps: [
          { calc: '赤 : 0.2126x1 + 0.7152x0 + 0.0722x0 = 0.2126' },
          { calc: '緑 : 0.2126x0 + 0.7152x1 + 0.0722x0 = 0.7152' },
          { calc: '青 : 0.2126x0 + 0.7152x0 + 0.0722x1 = 0.0722' },
          { calc: '緑 / 青 = 0.7152 / 0.0722 = 9.9 倍' },
          { calc: '【単純平均だと】どれも 1/3 = 0.333' },
          { calc: '白 : 0.2126 + 0.7152 + 0.0722 = 1.0', note: '重みの合計は 1' },
        ],
        result:
          '**緑は青のおよそ 10 倍明るく見えます。** 単純平均だと 3 つとも $0.333$ になり、**この 10 倍の差が完全に消えてしまいます。** グレースケール化でこれをやると、緑が暗く沈み、青が明るく浮いた、**まったく別物の画像**になります。$0.2126$ / $0.7152$ / $0.0722$ の 3 つは、実務で何度も出てくるので**そのまま覚えて構いません。** 目の中で緑を感じる細胞がいちばん多い、というのがこの重みの由来です。',
      },
    },
    {
      kind: 'sandbox',
      title: '3 とおりのグレースケール',
      code: `import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.OrthographicCamera(-5.4, 5.4, 3.05, -3.05, 0.1, 10);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 元の色。ここを変えてみてください
const SOURCE = [0xff2244, 0x22cc44, 0x2255ff, 0xffcc22, 0x22cccc, 0xdddddd];

// A. 輝度の重み（正しい）
function luminance(c) {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

// B. 単純平均（よくある間違い）
function average(c) {
  return (c.r + c.g + c.b) / 3;
}

const rows = [
  ['もとの色',           (c) => c.clone()],
  ['輝度の重み（正しい）', (c) => new THREE.Color().setScalar(luminance(c))],
  ['単純平均（間違い）',   (c) => new THREE.Color().setScalar(average(c))],
];

const geometry = new THREE.PlaneGeometry(1.5, 1.4);

rows.forEach(([label, convert], row) => {
  console.log('段', row, label);

  SOURCE.forEach((hex, col) => {
    const src = new THREE.Color(hex);        // Color がリニアに直してくれる
    const out = convert(src);

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: out }),   // 光を見ないので色がそのまま出る
    );
    mesh.position.set((col - (SOURCE.length - 1) / 2) * 1.6, (1 - row) * 1.55, 0);
    scene.add(mesh);

    if (row > 0) {
      console.log('  ', '#' + src.getHexString(), '→', out.r.toFixed(3));
    }
  });
});

renderer.render(scene, camera);`,
      caption:
        '**真ん中の段（正しい）と下の段（単純平均）を見比べてください。** 単純平均では**緑が暗くなりすぎ、青が明るくなりすぎ**ています。もとの色を見ると、緑はいちばん明るく、青はいちばん暗いはずです。真ん中の段だけが、その関係を保っています。コンソールに数値も出ています。',
    },
    {
      kind: 'md',
      text: `
## どこで使うか

輝度の重み付けは、思ったよりあちこちで要ります。

- **グレースケール化** … 白黒にする効果。上のとおり
- **セピア・色調補正** … いったん輝度を出してから色を乗せる
- **ブルーム** … 「明るいところだけ光らせる」の「明るい」を判定する（[](#/ch/q03-postprocess)）
- **文字の色を決める** … 背景の輝度が高ければ黒文字、低ければ白文字
- **露出の自動調整** … 画面全体の平均輝度を測って明るさを合わせる

**このサイトの配色も、この計算で決めています。**
本文が背景に対して $7:1$ 以上のコントラストになっているかを、
輝度から計算して確かめています。
`,
    },
    {
      kind: 'code',
      title: 'GLSL でも、three でも同じ式',
      code: `// --- シェーダの中（第3部の後半・第5部で書きます）---
// vec3 rgb = texture2D(tDiffuse, vUv).rgb;
// float y = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
// gl_FragColor = vec4(vec3(y), 1.0);
//
// 内積 1 回で書けます。3 つの重みを並べたベクトルとの dot です

// --- JavaScript 側 ---
import * as THREE from 'three';

const LUMA = new THREE.Vector3(0.2126, 0.7152, 0.0722);

function luminance(color) {
  return LUMA.x * color.r + LUMA.y * color.g + LUMA.z * color.b;
}

// 背景に対して読める文字色を選ぶ
function readableText(bg) {
  return luminance(bg) > 0.18 ? 0x000000 : 0xffffff;
}

// コントラスト比（WCAG の式）。4.5 以上が本文の基準
function contrast(a, b) {
  const la = luminance(a) + 0.05;
  const lb = luminance(b) + 0.05;
  return Math.max(la, lb) / Math.min(la, lb);
}`,
    },
    {
      kind: 'md',
      text: `
## Color が、裏でやっていること

\`new THREE.Color(0xff8800)\` と書いたとき、three は何をしているか。

**16 進数を sRGB の値として解釈し、リニアに直して保持しています。**

だから \`color.r\` を読むと、$\\text{0xff} / 255 = 1.0$ ではなく
**リニアに直された値**が返ります。
`,
    },
    {
      kind: 'code',
      title: '入れるときと、取り出すとき',
      code: `import * as THREE from 'three';

const c = new THREE.Color(0x808080);

console.log(c.r);                  // 0.2158  ← リニアに直されている
console.log(c.getHexString());     // '808080' ← 戻すと元どおり

// 数値を直接入れるときは、リニアの値を渡すことになる
const linear = new THREE.Color(0.5, 0.5, 0.5);
console.log(linear.getHexString());   // 'bcbcbc' ← 128 ではない

// sRGB の数値として入れたいなら、明示する
const srgb = new THREE.Color().setRGB(0.5, 0.5, 0.5, THREE.SRGBColorSpace);
console.log(srgb.getHexString());     // '808080'

// 色を混ぜるのは、リニアで行われる（これが正しい）
const mixed = new THREE.Color().lerpColors(
  new THREE.Color(0x000000),
  new THREE.Color(0xffffff),
  0.5,
);
console.log(mixed.getHexString());    // 'bcbcbc' ← 光の量で真ん中`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '「黒と白の中間が #808080 にならない」は、正しい動作です',
      text: `
黒と白を 0.5 で混ぜると #BCBCBC になります。バグではありません。

光の量として真ん中を取っているからで、
これが物理的に正しい混ざり方です。

デザインツールの #808080 と一致しないのは、
そちらが「見た目の目盛り」の中間を返しているためです。

どちらが欲しいかは場面によります。
グラデーションを目で見て自然にしたいなら sRGB の中間、
実際の光量を半分にしたいならリニアの中間です。
`,
    },
    {
      kind: 'md',
      text: `
## 画像を貼るときだけ、明示が要る

three は色コードについては自動でやってくれますが、
**画像テクスチャは自動で判断できません。**

同じ画像ファイルが、色として使われることも、データとして使われることもあるからです。

- **色として使う**（\`map\`、\`emissiveMap\`）→ \`texture.colorSpace = THREE.SRGBColorSpace\`
- **データとして使う**（\`normalMap\`、\`roughnessMap\`、\`metalnessMap\`、\`aoMap\`）→ **指定しない**

指定を忘れると全体が**明るく白っぽく**なり、
逆にデータに指定すると**値が歪みます**（法線マップなら凹凸の向きが狂います）。

詳しくは[](#/ch/t04-texture)から続く 5 章で扱い、
画面に出るまでの通り道の全体像は[](#/ch/q02-color)で最後まで追いかけます。
`,
    },
  ],
  exercises: [
    {
      prompt: `色 $\\#40C080$（$R=64$、$G=192$、$B=128$）の**輝度**を求めてください。
sRGB からリニアへの変換を含めて、手で計算してください。`,
      hint: 'まず 3 つとも $0$〜$1$ に直して $2.2$ 乗し、それから重みを掛けます。',
      answer: `**約 $0.409$** です。

**1. $0$〜$1$ に直す**

$R = 64/255 = 0.2510$
$G = 192/255 = 0.7529$
$B = 128/255 = 0.5020$

**2. リニアに直す（$2.2$ 乗）**

$R_L = 0.2510^{2.2} = 0.0478$
$G_L = 0.7529^{2.2} = 0.5356$
$B_L = 0.5020^{2.2} = 0.2195$

**3. 重みを掛けて足す**

$Y = 0.2126 \\times 0.0478 + 0.7152 \\times 0.5356 + 0.0722 \\times 0.2195$

$= 0.01016 + 0.38309 + 0.01585 = 0.4091$

**約 $0.41$** です。

**順番を間違えると答えが変わります。**
リニアに直さずに $Y = 0.2126 \\times 0.251 + 0.7152 \\times 0.753 + 0.0722 \\times 0.502 = 0.628$ ―
**5 割も違います。**

**輝度の式は、リニアな値に対して定義されています。**
「明るさを測る」のは光の量の話なので、見た目の目盛りのまま計算してはいけません。

**確かめ方** … 緑の寄与が $0.383$ で、全体の **94%** を占めています。
緑が支配的だという感覚と一致します。`,
    },
    {
      prompt: `画面の平均輝度を測って露出を自動調整したい。
1 枚の画像から輝度の平均を出すとき、**単純平均でグレースケール化してから平均を取る**のと、
**輝度の重みで測ってから平均を取る**のでは、どんな違いが出ますか。`,
      hint: '空の写真と、森の写真で考えてみてください。',
      answer: `**単純平均だと、色の偏った画面で露出が大きく外れます。**

**森の写真**（緑が支配的）

緑はリニアで $0.7152$ の重みを持ちますが、単純平均だと $0.333$ に落とされます。
つまり**実際より暗いと判定されます。**

自動露出は「暗いから明るくしよう」と働き、**白飛びした森**ができあがります。

**青空の写真**（青が支配的）

青の重みは $0.0722$ ですが、単純平均だと $0.333$ ―
**実際の 4.6 倍**に見積もられます。

「明るすぎる」と判定されて露出が下げられ、**暗く沈んだ空**になります。

**色の偏りが小さい画面では、差はほとんど出ません。**
灰色に近い画面なら $R \\approx G \\approx B$ なので、どちらの式でも同じ値になります。

**だから厄介です。** 手元のテスト画像では合っているのに、
特定の場面だけ露出が外れる ― という形で現れます。

**もう 1 つの落とし穴** … 平均を取る前に**リニアに直すこと**。
sRGB のまま平均すると、明るい画素の寄与が過小評価されます。
$Y$ を出す時点でリニアにしてあれば、そのまま平均して構いません。`,
      answerCode: `// 画面の平均輝度（リニアで測る）
const LUMA = [0.2126, 0.7152, 0.0722];

function averageLuminance(pixels) {   // Uint8Array, RGBA
  let sum = 0;
  const n = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    // sRGB → リニア → 輝度、の順
    const r = (pixels[i]     / 255) ** 2.2;
    const g = (pixels[i + 1] / 255) ** 2.2;
    const b = (pixels[i + 2] / 255) ** 2.2;
    sum += LUMA[0] * r + LUMA[1] * g + LUMA[2] * b;
  }
  return sum / n;
}

// 目標の明るさに合わせて露出を動かす（急に変えるとちらつくので追従させる）
const target = 0.18;                    // 中間灰の輝度
const wanted = target / Math.max(averageLuminance(px), 0.001);
renderer.toneMappingExposure += (wanted - renderer.toneMappingExposure) * 0.05;`,
    },
    {
      prompt: `\`new THREE.Color(0x000000)\` と \`new THREE.Color(0xffffff)\` を
\`lerpColors(..., 0.5)\` で混ぜたら \`#BCBCBC\` が返りました。
デザイナーは「$\\#808080$ になるはず」と言っています。**どちらが正しいですか。**`,
      hint: '「半分」が何の半分かを、それぞれ確かめてください。',
      answer: `**どちらも正しく、指しているものが違います。**

**three が返した $\\#BCBCBC$** … **光の量が半分**の色です。

three はリニアで混ぜるので、$0$ と $1$ の中間は $0.5$。
それを sRGB に戻すと $0.5^{0.4545} = 0.7297$、$\\times 255 = 186 = \\text{0xBA}$
（three の厳密な式では $\\text{0xBC}$ になります）。

**デザイナーの $\\#808080$** … **見た目の目盛りの中間**です。

$0$ と $255$ の真ん中は $128$。人の目には「ちょうど中間の灰色」に見えます。
リニアに直すと $0.216$ ― **光の量では 2 割ちょっとしかありません。**

**どちらが欲しいかは、用途で決まります。**

| 欲しいもの | 使う空間 | 例 |
|---|---|---|
| 目に自然なグラデーション | sRGB | UI のグラデーション、色の帯 |
| 物理的に正しい混ざり | リニア | ライティング、$\\alpha$ 合成、ブルーム |

**3D の中では、ほぼ常にリニアが正解**です。
半透明を重ねるのも、光を足すのも、物理的な足し算だからです。

**UI のグラデーションで「真ん中が暗く感じる」ときは**、
リニアで混ざっているのが原因なので、sRGB で混ぜ直します。

**説明の仕方** … 「バグではなく、光の量で半分を取っています。
見た目の中間が欲しいなら、こちらで sRGB のまま混ぜます」と伝えれば済みます。`,
      answerCode: `import * as THREE from 'three';

// リニアで混ぜる（three の既定。物理的に正しい）
const linearMid = new THREE.Color()
  .lerpColors(new THREE.Color(0x000000), new THREE.Color(0xffffff), 0.5);
console.log(linearMid.getHexString());   // 'bcbcbc'

// sRGB のまま混ぜる（見た目の中間が欲しいとき）
function mixSRGB(hexA, hexB, t) {
  const a = new THREE.Color(), b = new THREE.Color(), out = new THREE.Color();
  a.setHex(hexA, THREE.SRGBColorSpace);
  b.setHex(hexB, THREE.SRGBColorSpace);

  // sRGB の成分として取り出してから混ぜる
  const ac = a.clone().convertLinearToSRGB();
  const bc = b.clone().convertLinearToSRGB();
  out.setRGB(
    ac.r + (bc.r - ac.r) * t,
    ac.g + (bc.g - ac.g) * t,
    ac.b + (bc.b - ac.b) * t,
  );
  return out.convertSRGBToLinear();
}

console.log(mixSRGB(0x000000, 0xffffff, 0.5).getHexString());   // '808080'`,
    },
  ],
  quiz: [
    {
      q: '色の明るさ（輝度）を求めるとき、`(R + G + B) / 3` では正しくない理由はどれですか。',
      choices: [
        '人の目は色ごとに感度が違い、緑は青のおよそ 10 倍明るく見えるから',
        '3 で割ると誤差が出るから',
        'RGB は足し算できないから',
        '順番が違うから',
      ],
      answer: 0,
      explain:
        '正しくは $0.2126R + 0.7152G + 0.0722B$ です。単純平均だと緑が暗く沈み、青が明るく浮いた、まったく別物の画像になります。この 3 つの重みは実務で何度も出てきます。',
    },
    {
      q: '`#808080` の明るさは、白のおよそ何%ですか。',
      choices: ['22%', '50%', '75%', '35%'],
      answer: 0,
      explain:
        '$(128/255)^{2.2} = 0.216$ です。色コードは「見た目の明るさ」で刻まれているので、数値の半分は光の量の半分になりません。光の量がちょうど半分なのは `#BABABA` あたりです。',
    },
    {
      q: 'three が黒と白を lerp すると `#BCBCBC` が返ります。これは何ですか。',
      choices: [
        '正しい動作。リニア（光の量）で中間を取っているから',
        'バグ。`#808080` になるべき',
        '丸め誤差',
        'テーマ設定の影響',
      ],
      answer: 0,
      explain:
        'three は計算をリニアで行うので、光の量として真ん中を取ります。これが物理的に正しい混ざり方です。見た目の中間が欲しい場合は sRGB のまま混ぜます。どちらが欲しいかは用途で決まります。',
    },
  ],
};
