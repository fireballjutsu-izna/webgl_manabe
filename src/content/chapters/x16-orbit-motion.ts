import type { Chapter } from '../types.ts';

export const chapterX16: Chapter = {
  slug: 'x16-orbit-motion',
  part: 'project',
  number: 16,
  title: '公転 ― 親を回すか、位置を計算するか',
  goal: '軌道を「親の回転」と「三角関数で置く位置」の $2$ 通りで書けるようになり、どちらを選ぶべきかを、あとで何を変えたくなるかから決められるようになります。',
  requires: ['p04-planet-orbits', 'm24-orbit', 'b21-circular-motion'],
  threeApis: ['Group', 'Object3D.position', 'BufferGeometry.setFromPoints', 'Line', 'LineBasicMaterial'],
  mathRecall: [
    { slug: 'b21-circular-motion', note: '$\\cos$ と $\\sin$ で、物を円周に置く' },
    { slug: 'm24-orbit', note: '何かのまわりを回る、の基本形' },
    { slug: 'b22-wave', note: '位相をずらすと、同じ式で別の動きになる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 同じ動きを、2 通りで書ける

月を惑星のまわりに回します。書き方は $2$ つあり、**どちらも正しい**です。

**（A）親を回す。**
月を入れた Group の \`rotation.y\` を毎フレーム増やすだけ。
月は原点から $R$ だけ離れた場所に置いておきます。

**（B）位置を自分で計算する。**
\`moon.position.set(R * Math.cos(a), 0, R * Math.sin(a))\`。
入れ物は要りません。

A のほうが短く、B のほうが自由です。
**この章では B を選びます** ― 理由は、選んだあとで説明します。
`,
    },
    {
      kind: 'formula',
      tex: '(x, z) \\;=\\; \\bigl(R\\cos(\\omega t + \\varphi),\\; R\\sin(\\omega t + \\varphi)\\bigr)',
      readAloud:
        '$R$ が軌道の半径、$\\omega$（オメガ）が回る速さ、$\\varphi$（ファイ）が最初の位置のずれ（位相）です。$t$ が時間。単位円をそのまま $R$ 倍に広げて、角度を時間で進めているだけです。',
      worked: {
        given: '$R = 4.6$、$\\omega = 0.35$、$\\varphi = 1.1$ で、$t = 2$ 秒のとき。',
        steps: [
          { calc: '角度 : 0.35 x 2 + 1.1 = 1.8 ラジアン' },
          { calc: 'cos(1.8) = -0.227' },
          { calc: 'sin(1.8) =  0.974' },
          { calc: 'x = 4.6 x (-0.227) = -1.045' },
          { calc: 'z = 4.6 x   0.974  =  4.479' },
          { calc: '確かめ : ルート(1.045の2乗 + 4.479の2乗)' },
          { calc: '       = 4.6', note: '軌道半径どおり。円の上にいる' },
        ],
        result:
          '$\\varphi$ を $0$ にすると、$t = 0$ のとき $(4.6,\\; 0)$ から始まります。**月を $3$ つ置くなら、$\\varphi$ だけを $0$・$2.1$・$4.2$ と変えれば、同じ軌道の別々の場所から回りはじめます。** $R$ も $\\omega$ もそのままで、変えるのは $1$ 数だけです。',
      },
    },
    {
      kind: 'md',
      text: `
## B を選ぶ理由は、「まだ書いていないコード」にある

いま欲しいのは円軌道の月 $1$ つだけです。それなら A のほうが短い。

それでも B を選ぶのは、**このあと必ず出てくる要求**があるからです。

| 変えたいこと | A（親を回す） | B（位置を計算する） |
|---|---|---|
| 半径を変える | 月の \`position.x\` | $R$ を変える |
| 速さを変える | 増やす量を変える | $\\omega$ を変える |
| **開始位置をずらす** | Group の初期 \`rotation.y\` | $\\varphi$ を変える |
| **月を $3$ つにする** | **Group を $3$ 枚** | $\\varphi$ を $3$ つ |
| **楕円にする** | **できない** | $x$ と $z$ の係数を変える |
| **軌道の線を引く** | 別に書く | **同じ式から引ける** |

上の $3$ つはどちらでも大差ありません。**下の $3$ つで差が付きます。**

とくに最後が効きます。
`,
    },
    {
      kind: 'md',
      text: `
## 軌道の線は、同じ式から引く

軌道を線で見せておくと、動きがぐっと読みやすくなります。

引き方は簡単で、**位置を出す式に、時間の代わりに $0$〜$2\\pi$ を入れて点を並べる**だけです。

**同じ $R$ を使っているので、線と月がずれる余地がありません。**

これは見た目の問題ではなく、**壊れ方の問題**です。
線を別の場所に $4.6$ と書き写すと、半径を $5.2$ に変えた日に線だけが取り残されます。
そして**線のほうが正しいように見える**ので、月の位置を疑ってしばらく溶かします。
`,
    },
    {
      kind: 'code',
      title: '軌道の線 ― 位置と同じ式に、時間の代わりに 0〜2π を入れる',
      code: `const points = [];
for (let i = 0; i <= 160; i++) {
  const a = (i / 160) * Math.PI * 2;
  points.push(new THREE.Vector3(Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R));
}
scene.add(new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(points),
  new THREE.LineBasicMaterial({ color: 0x39395c }),
));`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '数字を 2 回書いたら、それは事故の予約です',
      text: `
**同じ意味の数字が $2$ か所にあるなら、必ずいつか食い違います。**

この章で言えば、月の軌道半径がそれです。

- 月の位置の計算
- 軌道の線の点の並べ方
- （増やすなら）カメラが寄る距離の計算

$1$ つの \`const MOON_R = 4.6;\` から $3$ か所が導かれていれば、
半径を変えるのは $1$ 行の編集で終わります。

**「あとで直せばいい」は、直す場所を全部覚えていられる場合にだけ成り立ちます。**
`,
    },
    {
      kind: 'md',
      text: `
## いつも同じ面を、こちらに向ける

月をよく見ると、$1$ つ足りないものがあります。**向き**です。

位置だけを毎フレーム置き換えると、月は**まったく回転しません。**
すると惑星から見た月は、$1$ 周のあいだに全周を見せてしまいます。

本物の月はそうなっていません。いつも同じ面をこちらに向けています
― {{潮汐固定}}です。

やることは $1$ 行だけです。
`,
    },
    {
      kind: 'formula',
      tex: '\\theta_{\\text{自転}} \\;=\\; -a, \\qquad a = \\omega t + \\varphi',
      readAloud:
        '月の $y$ まわりの回転を、公転の角度の符号を変えたものにする、と読みます。マイナスが付くのは、three では $y$ まわりの回転が $+x$ を $-z$ へ動かすのに対し、この軌道の式は $+x$ から $+z$ へ進むからです。',
      worked: {
        given:
          '$R = 4.6$ の軌道で、月の**局所 $-x$ の面**が惑星のほうを向き続けるかを、$3$ か所で確かめます（内積が $-1$ なら、局所 $+x$ の反対、つまり $-x$ 面が惑星を向いています）。',
        steps: [
          { calc: 'a = 0 度 : 位置 (4.600, 0, 0)' },
          { calc: '  局所+x の向き ( 1.000, 0,  0.000)' },
          { calc: '  惑星の方向    (-1.000, 0, -0.000)' },
          { calc: '  内積 = -1.0000', note: '同じ面が向いている' },
          { calc: 'a = 90 度: 位置 (0, 0, 4.600)' },
          { calc: '  局所+x の向き ( 0.000, 0,  1.000)' },
          { calc: '  惑星の方向    (-0.000, 0, -1.000)' },
          { calc: '  内積 = -1.0000' },
          { calc: 'a = 180 度: 内積 = -1.0000' },
        ],
        result:
          '**どこでも内積がぴったり $-1$。** つまり月は、公転のあいだずっと同じ面を惑星に向け続けます。$\\theta_{\\text{自転}} = -a$ を消すと（$0$ のまま固定すると）、月は世界に対して向きを変えないので、**惑星から見ると $1$ 周につき $1$ 回、裏側まで見えます。** 「回さない」ことが「$1$ 周に $1$ 回転して見える」になる ― 直感と逆なので、実際に消して確かめる価値があります。',
      },
    },
    {
      kind: 'sandbox',
      title: '位相をずらした 3 つの月と、潮汐固定',
      guide: { focus: ['月を 3 つ ― 変えるのは位相だけ', '軌道の線 ― 同じ式から引く'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MOON_R = 3.6;      // 軌道の半径。線も位置も、この 1 つから導く
const MOON_SPEED = 0.45; // 回る速さ

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 4.2, 8.4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const sun = new THREE.DirectionalLight(0xfff2e0, 3.2);
sun.position.set(6, 3, 4);
scene.add(sun, new THREE.AmbientLight(0x22334a, 0.35));

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(1.2, 64, 48),
  new THREE.MeshStandardMaterial({ color: 0x3d6a8f, roughness: 0.85 }),
);
scene.add(planet);

/* ---- 軌道の線 ― 同じ式から引く ---- */
// 時間の代わりに 0〜2π を入れるだけ。MOON_R を書き写さないので、ずれない

const orbitPoints = [];
for (let i = 0; i <= 160; i++) {
  const a = (i / 160) * Math.PI * 2;
  orbitPoints.push(new THREE.Vector3(Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R));
}
scene.add(new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(orbitPoints),
  new THREE.LineBasicMaterial({ color: 0x39395c }),
));

/* ---- 月を 3 つ ― 変えるのは位相だけ ---- */
// R も速さも同じ。φ を 0・2.1・4.2 と変えるだけで、別々の場所から回る

const moons = [0, 2.1, 4.2].map((phase, index) => {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 40, 28),
    new THREE.MeshStandardMaterial({ color: 0x9aa3b2, roughness: 1 }),
  );
  // どちらを向いているかが見えるよう、-x の面に印を貼る
  const mark = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xffb457 }),
  );
  mark.position.x = -0.32;
  moon.add(mark);
  scene.add(moon);
  // いちばん外側の月だけ、潮汐固定を切ってある
  return { mesh: moon, phase: phase, locked: index < 2 };
});

const readout = document.createElement('div');
readout.innerHTML =
  'オレンジの印が、月の -x の面です。<br>' +
  '2 つは印が常に内側を向き（潮汐固定）、1 つは向きが変わりません。';
readout.style.cssText =
  'position:absolute; bottom:16px; left:16px; color:#9fb4d8;' +
  'font:12px/1.7 sans-serif; pointer-events:none;';
document.body.appendChild(readout);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();

  for (const moon of moons) {
    const a = t * MOON_SPEED + moon.phase;
    moon.mesh.position.set(Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R);
    // -a で、公転と同じだけ自分も回る。だから同じ面が内側を向き続ける
    if (moon.locked) moon.mesh.rotation.y = -a;
  }

  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '$3$ つの月は、$1$ つの式に $\\varphi$ を $3$ つ渡しただけです。オレンジの印を追ってください ― $2$ つは印が常に惑星のほうを向いたまま回り、$1$ つ（位相 $4.2$ の月）は印が外を向いたり内を向いたりします。`MOON_R` を $5$ に変えると、**線も月も同時に**広がります。楕円にしたければ `Math.cos(a) * MOON_R` の片方だけを `* 1.6` してください ― 線の式も同じなので、線もちゃんと楕円になります。',
    },
    {
      kind: 'md',
      text: `
## それでも A が勝つ場面

B を選びましたが、A（親を回す）が明確に有利な場面もあります。

**回るものが「$1$ つの塊」のとき**です。

たとえば土星の輪と本体、あるいは編隊を組んだ $20$ 機の宇宙船。
**まとめて回したいものが複数あるなら、入れ物を $1$ つ回すほうが速く、間違えません。**

B で書くと、$20$ 機ぶんの位置計算が毎フレーム走ります。
A なら行列が $1$ つ更新されるだけで、子は勝手に付いてきます。

**判断の基準**

- **中身が独立に動く**（位相・半径・速さが違う）… **B**
- **中身がひとかたまりで動く**（相対位置が変わらない）… **A**

この月は $1$ つですが、あとで惑星を増やしたくなったときに
それぞれ違う軌道を持たせたいので、**B にしてあります。**
`,
    },
  ],
  exercises: [
    {
      prompt: `月を楕円軌道にしたい。$x$ 方向の半径を $R$、$z$ 方向を $0.6R$ にします。

位置の式はどうなりますか。軌道の線は、どこを直せばよいですか。`,
      hint: '線の点も、位置と同じ式から並べています。',
      answer: `**位置の式の $z$ に $0.6$ を掛け、線の式にも同じ $0.6$ を掛けます。**

**位置**

$(x,\\; z) = (R\\cos a,\\; 0.6\\,R\\sin a)$

**線**

線の点を並べるところでも、$z$ に同じ $0.6$ を掛けます。

**2 か所になってしまった**

ここで、さきほどの「同じ数字を $2$ 回書かない」に引っかかります。

$0.6$ が $2$ か所に出てきました。

$1$ つの定数（\`const MOON_FLAT = 0.6;\`）にまとめてください。

**式そのものを共有するのが、いちばん確実**

もっと良いのは、**位置を返す関数を $1$ つ作り、線も月もそれを呼ぶ**ことです。

そうすれば、楕円にしようが $8$ の字にしようが、**直すのは $1$ か所**です。

**楕円は等速ではありません**

$a$ を等速で進めると、**遠いところで速く、近いところで遅く**なります。

本物の惑星は逆（近いほど速い）なので、
それらしくしたければ角度の進み方も変える必要があります。
[](#/ch/m37-arclength)でやった弧長の話が、そのまま効いてきます。`,
      answerCode: `// 位置も線も、この 1 つの関数から
const MOON_R = 3.6;
const MOON_FLAT = 0.6;

function orbitAt(a) {
  return new THREE.Vector3(Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R * MOON_FLAT);
}

// 線
for (let i = 0; i <= 160; i++) orbitPoints.push(orbitAt((i / 160) * Math.PI * 2));

// 毎フレーム
moon.position.copy(orbitAt(t * MOON_SPEED + phase));`,
    },
    {
      prompt: `潮汐固定の行 \`moon.rotation.y = -a\` を消すと、惑星から見た月はどう見えますか。

「回転を止めた」のに、なぜそうなるのでしょう。`,
      hint: '月は世界に対して向きを変えません。でも、月を見ている側は動いています。',
      answer: `**$1$ 周につき $1$ 回、月の全周が見えます。**

**なぜか**

\`rotation.y\` を $0$ に固定した月は、**世界に対して向きを変えません。**
北を向いた面は、軌道のどこにいても北を向いたままです。

ところが、**惑星から見た方向は $1$ 周で $360$ 度変わります。**

だから惑星の上の人には、月が $1$ 周につき $1$ 回転しているように見えます。

**言い方を変えると**

「回っていない」には $2$ つの意味があります。

- **世界に対して回っていない**（\`rotation.y = 0\`）
- **相手に対して回っていない**（\`rotation.y = -a\`、＝潮汐固定）

**日常で「回っていない」と言うとき、たいてい後者を指しています。**
だから前者を書くと、直感に反する結果になります。

**本物の月**

本物の月も、**世界（恒星）に対しては $27.3$ 日で $1$ 回転しています。**

「月は自転していない」はよくある誤解で、
正しくは「**自転周期と公転周期が一致している**」です。

$-a$ の $1$ 行は、その一致をそのまま書いたものです。`,
    },
    {
      prompt: `土星のような輪を持つ惑星を $3$ つ、それぞれ別の軌道に置きたい。

輪と本体はどう組み立て、軌道はどちらの方式にしますか。`,
      hint: '「独立に動くもの」と「ひとかたまりで動くもの」を見分けてください。',
      answer: `**輪と本体は Group で $1$ つにまとめ、その Group を位置計算（B）で動かします。**

**構造**

各惑星について

\`planetGroup\`（Group）
　├ 本体（Mesh）
　└ 輪（Mesh）

そして \`planetGroup.position\` を毎フレーム計算します。

**なぜ混ぜるのか**

- **輪と本体はひとかたまり** … 相対位置が変わらないので、$1$ つの入れ物に入れる（A の考え方）
- **$3$ つの惑星は独立** … 半径も速さも位相も違うので、位置を計算する（B）

**A か B か、は「どの階層の話か」で変わります。**

$1$ つの正解を全体に適用するのではなく、**階層ごとに選びます。**

**費用の話**

$3$ つの Group の位置を毎フレーム計算しても、**$3$ 回の代入**です。

輪の中に $2000$ 個の岩を置いたとしても、
それらは Group の子なので**計算は増えません** ― 親の行列が $1$ つ変わるだけです。

**「動かすものの数」は、見えている物の数ではなく、
自分で位置を書き換えている物の数**です。`,
    },
  ],
  quiz: [
    {
      q: '公転を「位置を三角関数で計算する」ほうで書くと、明確に有利になるのはどれですか。',
      choices: [
        '楕円にする・位相をずらして複数置く・軌道の線を同じ式から引く',
        '描画が速くなる',
        '回転の順番を気にしなくてよくなる',
        '子オブジェクトが自動で付いてくる',
      ],
      answer: 0,
      explain:
        '半径・速さ・開始位置を変えるだけならどちらでも大差ありません。差が出るのは、軌道の形を変えたいとき、同じ軌道に複数を違う位相で置きたいとき、そして軌道の線を引きたいときです。線は位置と同じ式から点を並べれば、半径を変えても永久にずれません。',
    },
    {
      q: '月の `rotation.y = -a` を消すと、惑星から見た月はどうなりますか。',
      choices: [
        '1 周につき 1 回、全周が見える。世界に対して向きを変えないから',
        '見た目は変わらない。位置しか動かしていないから',
        '月が高速で自転して見える',
        '月が軌道から外れる',
      ],
      answer: 0,
      explain:
        '「回転を止める」と「相手に対して向きを変えない」は別のことです。rotation.y を 0 に固定すると世界に対しては静止しますが、見ている側の方向が 1 周で 360 度変わるので、全周が見えてしまいます。本物の月も恒星に対しては 27.3 日で 1 回転していて、それが公転周期と一致しているのが潮汐固定です。',
    },
    {
      q: '「親の Group を回す」ほうが向いているのはどんな場面ですか。',
      choices: [
        '相対位置の変わらない塊（輪と本体、編隊など）をまとめて回すとき',
        '楕円軌道にしたいとき',
        '同じ軌道に複数を違う位相で置きたいとき',
        '軌道の線を引きたいとき',
      ],
      answer: 0,
      explain:
        '中身がひとかたまりで動くなら、入れ物を 1 つ回すのがいちばん速く、書き間違えようもありません。子が何個あっても更新されるのは親の行列 1 つです。逆に、中身が独立に動く（位相・半径・速さが違う）なら位置計算のほうが自由です。階層ごとに選べばよく、どちらか一方に統一する必要はありません。',
    },
  ],
};
