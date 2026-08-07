import type { Chapter } from '../types.ts';

export const chapterQ05R3F: Chapter = {
  slug: 'q05-r3f',
  part: 'polish',
  number: 16,
  title: 'React Three Fiber ― 手順ではなく、あるべき姿を書く',
  goal: '$R3F$ が three の何を引き受けているのかを説明できるようになり、コードが短くなる理由が「$3$ 次元が簡単になったから」ではないことを、行数を数えて確かめられるようになります。',
  requires: ['t10-scene-graph', 't06-loop-clock', 'y15-pass-order'],
  threeApis: ['Scene', 'Mesh', 'WebGLRenderer', 'PerspectiveCamera', 'Clock'],
  mathRecall: [
    { slug: 't10-scene-graph', note: '$\\mathrm{Group}$ で組み立てる。$R3F$ はこの木を $JSX$ で書く' },
    { slug: 't06-loop-clock', note: '描画ループと $dt$。$R3F$ では $\\mathrm{useFrame}$ になる' },
    { slug: 't09-loader', note: '読み込みの非同期。$R3F$ では $\\mathrm{useLoader}$ と $\\mathrm{Suspense}$' },
  ],
  blocks: [
    {
      kind: 'callout',
      tone: 'warn',
      title: 'この 3 章のコードは、このページでは動きません',
      text: `
理由を先に書きます。**$JSX$ はブラウザがそのまま実行できない書き方**で、
\`<mesh>\` のようなタグを $JavaScript$ に変換する工程がビルド時に必要です。
このサイトのサンドボックスは、書かれたコードを**そのまま $ES$ モジュールとして読むだけ**で、
変換器を積んでいません。

積むこともできます（$Babel$ を丸ごと持ってくれば動きます）。
ただしそれは「依存は three だけ」「バンドルを $1$ バイトも増やさない」という、
このサイトが最初に決めた土台を崩します。
**$R3F$ の $3$ 章のために全読者に数百 $KB$ を配るのは割に合いません。**

なので**ここからの $3$ 章だけは、第1部と同じ「読むための章」**です。
手元で試すなら、\`npm create vite@latest\` で $React$ のひな形を作って、
\`npm i three @react-three/fiber @react-three/drei\` してください。
`,
    },
    {
      kind: 'md',
      text: `
## 何が違うのか ― 「手順」ではなく「あるべき姿」を書く

ここまでのコードは、すべて**手順**でした。

- シーンを作る → カメラを作る → メッシュを作る → \`scene.add\` する →
  ループを回す → 要らなくなったら \`dispose\` する

$React$ $Three$ $Fiber$（以下 $R3F$）は、これを**あるべき姿**の記述に変えます。

- 「このシーンには、赤い箱が $1$ つある」と書く。**そうなるように誰かがやってくれる**

やっていることは変わりません。$R3F$ の中では、これまで書いてきたのとまったく同じ
\`THREE.Mesh\` が作られ、同じ \`WebGLRenderer\` が回っています。
**新しい $3$ 次元の仕組みではなく、three の組み立て方を $React$ に任せるための層**です。
`,
    },
    {
      kind: 'md',
      text: `
## 同じシーンを、2 通りで

回る箱を $1$ つ置くだけの、いちばん小さな例です。まず、ここまで書いてきた形。
`,
    },
    {
      kind: 'code',
      title: '素の three（3-01 と同じ形）',
      code: `import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 1, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff }),
);
scene.add(box);

const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(3, 4, 5);
scene.add(light);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  box.rotation.y += clock.getDelta() * 0.8;
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
    },
    {
      kind: 'md',
      text: `
同じものを $R3F$ で書くと、こうなります。
`,
    },
    {
      kind: 'code',
      title: 'React Three Fiber',
      code: `import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';

function Box() {
  const ref = useRef();

  // 描画ループの中身。dt は前のフレームからの秒数（3-06 の dt そのもの）
  useFrame((state, dt) => {
    ref.current.rotation.y += dt * 0.8;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4fd6ff" />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 1, 4], fov: 50 }}>
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      <Box />
    </Canvas>
  );
}`,
    },
    {
      kind: 'md',
      text: `
## 何行減ったのか、数える

「半分になる」とよく言われます。**数えてみましょう。**

- **素の three** … $38$ 行。空行とコメントを除くと **$32$ 行**
- **$R3F$** … $27$ 行。空行とコメントを除くと **$22$ 行**

**$10$ 行、$31\\%$ 減。半分ではありません。**

しかも $R3F$ 版には \`function Box()\` と \`export default function App()\` という
**$2$ つの関数の枠**が増えています。
つまり**消えた行はもっと多く、そのぶん枠が足されて差し引き $10$ 行**という内訳です。

**消えたもの**を並べます。

- \`new THREE.WebGLRenderer\` と \`setSize\` と \`appendChild\`
- \`new THREE.Scene\` と \`new THREE.PerspectiveCamera\`
- \`requestAnimationFrame\` の再帰と \`renderer.render\`
- \`new THREE.Clock\` と \`getDelta\`
- \`resize\` の購読 $5$ 行
- そして、**書かれてすらいなかった \`dispose\`**

**$3$ 次元の話は $1$ 行も消えていません。** 箱もマテリアルもライトも、そのまま残っています。
消えたのは**毎回まったく同じ定型**だけです。
`,
    },
    {
      kind: 'md',
      text: `
## \`<Canvas>\` が何をしているのか

これ $1$ つで、[](#/ch/t01-first-scene)でやった $3$ 点セットが全部立ち上がります。

- \`WebGLRenderer\` を作り、\`canvas\` を $DOM$ に置く
- \`PerspectiveCamera\` を作る（\`camera={{ ... }}\` で設定を渡せる）
- \`Scene\` を作り、その中に子の $JSX$ を組み立てる
- 親要素の大きさを見張って、\`camera.aspect\` と \`setSize\` を追従させる
- \`requestAnimationFrame\` のループを回す
- **画面から外れたら、掴んでいた $WebGL$ のものを解放する**

最後の $1$ つは、地味ですがいちばん効きます。
[](#/ch/t10-scene-graph)で見たとおり、\`dispose\` 漏れは $SPA$ では致命傷になります。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'このサイトも、同じものを自前で書いています',
      text: `
\`src/three/stage.ts\` ― **$265$ 行**のファイルが $1$ つあります。

やっていることは \`<Canvas>\` とほぼ同じです。

- レンダラとシーンとカメラを作る
- \`ResizeObserver\` で親要素を見張り、\`aspect\` と \`setSize\` を追従させる
- \`requestAnimationFrame\` を回し、章を離れたら止める
- **シーンの木をたどって、ジオメトリ・マテリアル・テクスチャを全部 \`dispose\` する**

これで**デモとサンドボックス合わせて $158$ 個**を、同じタブで回しています。
$4$ つめが $18$ か所に散らばっているのが、書いてみて分かることです。

**$R3F$ は、この $265$ 行を既製品として持ってきている** ― そう考えると、
何を得て何を手放すのかが見えやすくなります。
`,
    },
    {
      kind: 'md',
      text: `
## この先の 2 章

- **[](#/ch/y17-r3f-map)** … 読み替えの地図。タグ名・\`args\`・入れ子の落とし穴
- **[](#/ch/y18-r3f-decide)** … 入れるか入れないか。$3$ つの問いで決める

$2$ つめが本題です。**$R3F$ は「three を楽にする道具」ではありません。**
`,
    },
  ],
  exercises: [
    {
      prompt: `$R3F$ にすると、なぜコードが短くなるのですか。

**$3$ 次元の記述は短くなっていますか。**`,
      hint: '消えた行を $1$ つずつ見てください。',
      answer: `**$3$ 次元の記述は $1$ 行も短くなっていません。**

**数える**

- 素の three … $32$ 行（空行とコメントを除く）
- $R3F$ … $22$ 行

$10$ 行、$31\\%$ 減。

**残っているもの**

- 箱 … \`<boxGeometry args={[1, 1, 1]} />\`。素の \`new THREE.BoxGeometry(1, 1, 1)\` と同じ
- マテリアル … 同じ
- ライト … 位置も強さも同じ
- 回転 … \`ref.current.rotation.y += dt * 0.8\`。**まったく同じ式**

**消えたもの**

- レンダラの生成と \`appendChild\`
- シーンとカメラの生成
- \`requestAnimationFrame\` の再帰
- \`Clock\` と \`getDelta\`
- \`resize\` の購読
- \`dispose\`

**全部、$3$ 次元とは関係ない配線**です。

**だから、こう言えます**

$R3F$ が短くするのは**定型**であって、$3$ 次元の難しさではありません。

「$R3F$ なら $3$ 次元が簡単になる」と期待して入れると、
**箱を回すところで同じだけ悩みます。**`,
    },
    {
      prompt: `\`<Canvas>\` がやっている $6$ つの仕事のうち、**素の three で書き忘れやすい**のはどれですか。`,
      hint: '書き忘れても、その場では何も起きないものはどれでしょう。',
      answer: `**\`dispose\` です。**

**なぜ書き忘れるのか**

ほかの $5$ つは、**書かないとその場で動きません。**

- レンダラを作らなければ、何も出ない
- ループを回さなければ、止まったまま
- \`resize\` を書かなければ、窓を変えたときに歪む

$1$ 度書けば気づきます。

**\`dispose\` だけが違う**

書かなくても**動きます。**

問題が出るのは、**章を $20$ 個渡り歩いたあと**です。

$WebGL$ のコンテキストや $GPU$ のメモリが尽きて、
**そこから先が黒画面**になります。原因の章と症状の出る章が違うので、追いにくい。

**どれだけ散らばるか**

このサイトの \`src/three/stage.ts\` は $265$ 行ですが、
\`dispose\` は**$18$ か所**に出てきます。

ジオメトリ、マテリアル、マテリアルが持つテクスチャ、コントロール、レンダラ ―
**それぞれ別に解放が要る**からです。

**$R3F$ が引き受けるもののうち、いちばん値打ちがあるのがここ**です。`,
    },
    {
      prompt: `このサイトが $R3F$ を使っていないのは、なぜだと思いますか。

$2$ つ挙げてください。`,
      hint: 'このサイトが何をしようとしているかを考えてください。',
      answer: `**$2$ つあります。**

**$1$ つめ ― 中身を見せるのが目的だから**

このサイトは three の**使い方**ではなく、**中で何が起きているか**を扱っています。

\`<Canvas>\` は便利ですが、便利さは中身を隠します。

「レンダラとシーンとカメラの $3$ 点セット」を隠したら、
[](#/ch/t01-first-scene)は書けません。

**$2$ つめ ― 依存を three だけに保つと決めたから**

$React$ と $R3F$ を入れると、**読者が読むバンドルが数百 $KB$ 増えます。**

$3$ 章のために全読者に配るのは割に合いません。

冒頭の警告は、その判断の結果です。

**代わりに何をしたか**

\`src/three/stage.ts\` を $265$ 行書きました。
$R3F$ が引き受けるのと同じ仕事を、自前で持っています。

**「使わない」は「知らない」ではありません。**

$265$ 行を書いたからこそ、$R3F$ が何を引き受けているかを具体的に書けます。`,
    },
  ],
  quiz: [
    {
      q: 'R3F にすると、なぜコードが短くなりますか。',
      choices: [
        '3 次元の記述はそのままで、レンダラ・ループ・resize・dispose という定型が消えるから',
        '3 次元の計算を R3F が代わりにやってくれるから',
        'three より少ない機能しか使えないから',
        'JSX が短く書ける記法だから',
      ],
      answer: 0,
      explain:
        '数えると 32 行が 22 行、31% 減です（半分ではありません）。箱もマテリアルもライトも回転の式も、そのまま残っています。消えたのはレンダラの生成、シーンとカメラの生成、requestAnimationFrame の再帰、Clock、resize の購読、そして dispose ― どれも 3 次元とは関係ない配線です。',
    },
    {
      q: '`<Canvas>` の仕事のうち、素の three でいちばん書き忘れやすいのはどれですか。',
      choices: [
        'dispose。書かなくてもその場は動くので、気づくのが遅れる',
        'レンダラの生成',
        'requestAnimationFrame のループ',
        'カメラの生成',
      ],
      answer: 0,
      explain:
        'ほかは書かないとその場で動きません。dispose だけは書かなくても動き、章を 20 個渡り歩いたあとで黒画面になります。このサイトの stage.ts は 265 行ですが、dispose は 18 か所に散らばっています ― ジオメトリ、マテリアル、テクスチャ、コントロール、レンダラがそれぞれ別に解放を要るからです。',
    },
    {
      q: 'R3F の中で動いているのは何ですか。',
      choices: [
        'これまで書いてきたのと同じ THREE.Mesh と WebGLRenderer',
        'R3F 独自の描画エンジン',
        'React のバーチャル DOM だけ',
        'WebGPU',
      ],
      answer: 0,
      explain:
        'R3F は新しい 3 次元の仕組みではなく、three の組み立て方を React に任せるための層です。だから three の知識はそのまま通用し、逆に three を知らないまま R3F を使うと、何も映らないときに見る場所が分かりません。',
    },
  ],
};
