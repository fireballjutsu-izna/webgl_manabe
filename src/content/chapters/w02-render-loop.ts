import type { Chapter } from '../types.ts';

export const chapterW02: Chapter = {
  slug: 'w02-render-loop',
  part: 'threejs',
  number: 2,
  title: '描画ループ ― 1 枚ずつ、描き直す',
  goal: 'アニメーションが「静止画の描き直し」だと分かり、フレームレートに依らない動きを書けるようになります。',
  requires: ['t01-first-scene', 'b37-follow'],
  threeApis: [
    'WebGLRenderer.setAnimationLoop',
    'Clock',
    'Clock.getDelta',
    'Clock.getElapsedTime',
    'Object3D.rotation',
  ],
  mathRecall: [
    { slug: 'b37-follow', note: '毎フレームの変化量を、経過時間に比例させる' },
    { slug: 'b22-wave', note: 'sin で、行って戻る動きを作る' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 動く絵は、存在しない

前の章の絵は動きませんでした。当たり前で、\`renderer.render()\` を 1 回しか呼んでいないからです。

そして実は、**「動く絵」というものはどこにも無い**のです。
あるのは、少しずつ違う静止画を、速く描き直しているだけ。

パラパラ漫画とまったく同じです。
1 枚目を描く。何かを少しずらす。2 枚目を描く。またずらす。3 枚目を描く。

だから Three.js でアニメーションを書くとき、やることは 2 つしかありません。

1. **何かを少し変える**（\`box.rotation.y += ...\`）
2. **描き直す**（\`renderer.render(scene, camera)\`）

この 2 つを繰り返す仕掛けが{{描画ループ}}です。
`,
    },
    {
      kind: 'md',
      text: `
## ループを回す ― setAnimationLoop

three には、そのための入口が用意されています。

\`renderer.setAnimationLoop(fn)\` に関数を渡すと、**画面が更新されるたびに呼ばれます。**
多くの環境で毎秒 60 回、120Hz のディスプレイなら 120 回です。

自分で \`requestAnimationFrame\` を書いても同じことができますし、
世の中のコードはそちらのほうが多く見つかります。どちらでも動きます。

ただ **three では \`setAnimationLoop\` を使うのが素直**です。理由は 2 つあります。

- \`setAnimationLoop(null)\` で**止められる**（片付けのときに要ります）
- VR / AR では \`requestAnimationFrame\` が使えず、この形でないと動きません
`,
    },
    {
      kind: 'sandbox',
      title: '回る箱',
      code: `import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.2, 4);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.4 }),
);
scene.add(box);

const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(3, 4, 5);
scene.add(light, new THREE.HemisphereLight(0x8899ff, 0x101020, 0.6));

// 時計。前の呼び出しからの経過秒を教えてくれる
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();          // 前フレームからの秒数。だいたい 0.016
  const t = clock.getElapsedTime();     // 始まってからの秒数

  box.rotation.y += dt * 0.8;           // 毎秒 0.8 ラジアン回す
  box.position.y = Math.sin(t * 2) * 0.3;   // 上下に揺らす

  renderer.render(scene, camera);       // 描き直す
});`,
      caption:
        '`dt * 0.8` の 0.8 を変えると回転の速さが変わります。`Math.sin(t * 2)` の 2 を変えると揺れの速さが、`0.3` を変えると揺れ幅が変わります。[](#/ch/b22-wave) でやった振幅と周波数がそのまま出てきます。',
    },
    {
      kind: 'md',
      text: `
## $dt$ を掛ける理由

上のコードで、なぜ \`box.rotation.y += 0.02\` と書かずに \`dt * 0.8\` と書いたのか。

**書き手のパソコンで気持ちよく見えても、他人の画面では速さが変わってしまうからです。**

\`+= 0.02\` は「1 フレームあたり 0.02 進む」という意味です。
60Hz の画面なら毎秒 1.2 ラジアン。ところが 120Hz の画面では**毎秒 2.4 ラジアン**、つまり 2 倍速で回ります。
逆に処理が重くて 30 フレームしか出ない環境では、半分の速さになります。

\`dt\` を掛けると、この差が消えます。
`,
    },
    {
      kind: 'formula',
      tex: '\\Delta\\theta \\;=\\; \\omega \\, \\Delta t',
      readAloud:
        'このフレームで進める角度は、「毎秒の角速度」に「このフレームにかかった秒数」を掛けたものです。フレームが長ければ多く進み、短ければ少し進むので、1 秒あたりの結果は同じになります。',
      worked: {
        given:
          '毎秒 $0.8$ ラジアン回したい。**60Hz** の画面と **120Hz** の画面で、1 フレームあたり何ラジアン進むでしょう。そして 1 秒後にはどちらもいくつになるでしょう。',
        steps: [
          { calc: '60Hz  : dt = 1/60  = 0.01667 秒' },
          { calc: '        0.8 x 0.01667 = 0.01333 ラジアン / フレーム' },
          { calc: '        60 フレームで 0.01333 x 60 = 0.8', note: '1 秒で 0.8' },
          { calc: '120Hz : dt = 1/120 = 0.00833 秒' },
          { calc: '        0.8 x 0.00833 = 0.00667 ラジアン / フレーム' },
          { calc: '        120 フレームで 0.00667 x 120 = 0.8', note: '同じく 1 秒で 0.8' },
        ],
        result:
          '**1 フレームあたりの量は 2 倍違うのに、1 秒後はどちらも $0.8$ です。** これが $dt$ を掛ける効果です。もし $dt$ を掛けずに $0.0133$ を固定で足していたら、120Hz の画面では $1.6$ ラジアン ― **2 倍速**になっていました。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'getDelta は、1 フレームに 1 回だけ',
      text: `
Clock.getDelta() は「前に呼んだときからの経過」を返し、呼んだ瞬間に基準時刻を更新します。

だから 1 フレームの中で 2 回呼ぶと、2 回目はほぼ 0 が返ります。
「なぜか一部だけ動かない」の原因になります。

ループの先頭で 1 回だけ受け取り、あとはその値を使い回してください。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'setInterval で回してはいけません',
      text: `
setInterval はブラウザの描画タイミングと無関係に走ります。

描画の途中で割り込んだり、1 回の描画のあいだに 2 回走ったりするので、
指定どおりの間隔で呼ばれてもカクついて見えます。

さらに、タブが裏に回っても止まりません。
見ていない絵のために電池を使い続けることになります。

setAnimationLoop（および requestAnimationFrame）は、タブが非表示になると自動で止まります。
`,
    },
    {
      kind: 'md',
      text: `
## 止める ― 片付けのときに要る

ループは、放っておくと永久に回り続けます。

1 ページの中でシーンを作り直すような場合、古いループを止め忘れると
**見えないシーンを描き続けたまま、新しいシーンも描く**ことになります。
2 つ、3 つと増えれば、そのぶんだけ重くなります。

止め方は簡単です。
`,
    },
    {
      kind: 'code',
      title: 'ループを止める・再開する',
      code: `// 止める
renderer.setAnimationLoop(null);

// 再開する（同じ関数をもう一度渡すだけ）
renderer.setAnimationLoop(tick);

// requestAnimationFrame で書いている場合は、id を覚えておいて cancel する
let id = 0;
function tick() {
  id = requestAnimationFrame(tick);
  renderer.render(scene, camera);
}
tick();

cancelAnimationFrame(id);   // 止める`,
    },
    {
      kind: 'md',
      text: `
## 毎フレーム描かなくてよい場合もある

視点を動かしたときだけ絵が変わる ― たとえば商品を回して見るビューアーのようなものは、
**動きがないあいだ描き直す意味がありません。**

そういうときは、ループを回さず「変わったときだけ描く」書き方にします。
これを**オンデマンド描画**と呼びます。ノートパソコンの電池が目に見えて長持ちします。
`,
    },
    {
      kind: 'code',
      title: '変わったときだけ描く',
      code: `let needsRender = true;

function renderIfNeeded() {
  if (!needsRender) return;
  needsRender = false;
  renderer.render(scene, camera);
}

// 何かが変わったら印を付けるだけ
controls.addEventListener('change', () => { needsRender = true; });
window.addEventListener('resize', () => { needsRender = true; });

renderer.setAnimationLoop(renderIfNeeded);`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスの \`box.rotation.y += dt * 0.8\` を \`box.rotation.y += 0.0133\` に変えてください。
見た目は**ほとんど変わらないはず**です。では、なぜこの書き方が良くないのでしょう。`,
      hint: 'いま見ている画面が 60Hz だとして、120Hz の画面では 1 秒間に何回このコードが走りますか。',
      answer: `**いまの画面では同じに見えます。それが厄介なところです。**

$0.0133 \\times 60 = 0.8$ なので、60Hz の画面では狙いどおり毎秒 0.8 ラジアンです。

ところが 120Hz の画面では 1 秒間に 120 回走るので、$0.0133 \\times 120 = 1.6$ ―
**2 倍の速さで回ります。**

逆に、重い処理が入って 30 フレームしか出なくなると、半分の速さになります。
**「他の人の環境だけ速い（遅い）」というバグ**は、たいていこれです。

しかも自分の環境では絶対に再現しないので、原因にたどり着くのが非常に難しくなります。

$dt$ を掛けておけば、フレーム数が変わっても 1 秒あたりの結果は変わりません。
**移動も、回転も、色の変化も、すべて $dt$ を掛けてください。**`,
    },
    {
      prompt: `箱を「**3 秒で 1 回転**」させたい。\`dt\` に掛ける数はいくつですか。手で計算してください。`,
      hint: '1 回転は $2\\pi$ ラジアンです。',
      answer: `**$2.094$** です。

1 回転 $= 2\\pi = 6.2832$ ラジアン。それを 3 秒で回るので、

$\\omega = 6.2832 / 3 = 2.0944$ ラジアン毎秒

コードでは \`box.rotation.y += dt * (Math.PI * 2 / 3)\` と書きます。
**割り切れない数を手で丸めて書かない**のが大事です。
$2.09$ と書くと、100 回転するころには目に見えてずれます。

**確かめ方** … 3 秒後の合計は $2.0944 \\times 3 = 6.2832 = 2\\pi$。ちょうど 1 周です。`,
      answerCode: `const PERIOD = 3;                              // 秒
const speed = (Math.PI * 2) / PERIOD;          // ラジアン毎秒

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  box.rotation.y += dt * speed;
  renderer.render(scene, camera);
});`,
    },
    {
      prompt: `箱を「$y = 0$ と $y = 2$ のあいだを、**4 秒周期**で行き来」させたい。
\`Math.sin\` を使って 1 行で書いてください。`,
      hint: '$\\sin$ は $-1$ から $1$ を返します。0 から 2 にするには、どう直しますか。',
      answer: `**\`box.position.y = 1 + Math.sin(t * Math.PI / 2)\`** です。

3 つに分けて考えます。

**周期** … $\\sin$ の周期は $2\\pi$ です。4 秒で 1 周させたいので、
$t$ に $2\\pi/4 = \\pi/2 = 1.5708$ を掛けます。

**振れ幅** … $\\sin$ は $-1 \\sim 1$、欲しいのは $0 \\sim 2$。**幅は 2 ぶん**なので、掛ける数は 1 です。

**中心** … $-1 \\sim 1$ の中心は 0、欲しい範囲の中心は 1。だから **1 を足します**。

一般化すると、$\\min$ から $\\max$ を周期 $T$ で行き来する式は

$y = \\dfrac{\\min + \\max}{2} + \\dfrac{\\max - \\min}{2}\\sin\\!\\left(\\dfrac{2\\pi t}{T}\\right)$

です。[](#/ch/b22-wave)でやった「中心・振幅・周波数」の 3 つが、そのまま並んでいます。

**なお \`getDelta\` ではなく \`getElapsedTime\` を使うこと。**
$\\sin$ には「始まってからの通算時間」が要ります。`,
      answerCode: `const MIN = 0, MAX = 2, PERIOD = 4;
const center = (MIN + MAX) / 2;
const amp = (MAX - MIN) / 2;

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  box.position.y = center + amp * Math.sin((Math.PI * 2 * t) / PERIOD);
  renderer.render(scene, camera);
});`,
    },
  ],
  quiz: [
    {
      q: '毎フレーム `box.position.x += 0.05` と書きました。何が問題ですか。',
      choices: [
        '画面のリフレッシュレートによって速さが変わってしまう',
        '数値が大きすぎてあふれる',
        '`position` は読み取り専用なのでエラーになる',
        '`+=` ではなく `=` を使うべき',
      ],
      answer: 0,
      explain:
        '「1 フレームあたり」で書いているからです。120Hz の画面では 60Hz の 2 倍速く動きます。`dt` を掛けて「1 秒あたり」で書けば、フレーム数が変わっても結果は同じになります。',
    },
    {
      q: '`Clock.getDelta()` を 1 フレームの中で 2 回呼ぶと、2 回目は何が返りますか。',
      choices: [
        'ほぼ 0（1 回目で基準時刻が更新されるため）',
        '1 回目と同じ値',
        '1 回目の 2 倍',
        'エラーになる',
      ],
      answer: 0,
      explain:
        'getDelta は「前に呼んだときから」の経過を返し、呼んだ瞬間に基準を更新します。ループの先頭で 1 回受け取り、その値を使い回してください。「一部だけ動かない」の原因になります。',
    },
    {
      q: 'アニメーションに `setInterval` を使うと何が起きますか。',
      choices: [
        '描画タイミングとずれてカクつき、タブが裏でも回り続ける',
        '`requestAnimationFrame` より正確に動く',
        '何も問題はない',
        'WebGL では動かない',
      ],
      answer: 0,
      explain:
        'ブラウザの描画と無関係に走るため、指定どおりの間隔で呼ばれても表示はカクつきます。`setAnimationLoop`（と `requestAnimationFrame`）は画面の更新に同期し、タブが非表示になると自動で止まります。',
    },
  ],
};
