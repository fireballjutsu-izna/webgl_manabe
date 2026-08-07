import type { Chapter } from '../types.ts';

export const chapterQ05R3F: Chapter = {
  slug: 'q05-r3f',
  part: 'polish',
  number: 8,
  title: 'React Three Fiber ― もうひとつの書き方',
  goal: 'R3F のコードを読めるようになり、自分の作品に入れるべきか・入れなくてよいかを、理由を持って判断できるようになります。',
  requires: ['t10-scene-graph', 't06-loop-clock', 'q04-custom-pass'],
  threeApis: ['Scene', 'Mesh', 'Object3D', 'WebGLRenderer', 'PerspectiveCamera', 'Clock'],
  mathRecall: [
    { slug: 't10-scene-graph', note: 'Group で組み立てる。R3F はこの木を JSX で書く' },
    { slug: 't06-loop-clock', note: '描画ループと dt。R3F では useFrame になる' },
    { slug: 't09-loader', note: '読み込みの非同期。R3F では useLoader と Suspense' },
  ],
  blocks: [
    {
      kind: 'callout',
      tone: 'warn',
      title: 'この章のコードは、このページでは動きません',
      text: `
理由を先に書きます。**JSX はブラウザがそのまま実行できない書き方**で、
\`<mesh>\` のようなタグを JavaScript に変換する工程がビルド時に必要です。
このサイトのサンドボックスは、書かれたコードを**そのまま ES モジュールとして読むだけ**で、
変換器を積んでいません。

積むこともできます（Babel を丸ごと持ってくれば動きます）。
ただしそれは「依存は three だけ」「バンドルを 1 バイトも増やさない」という、
このサイトが最初に決めた土台を崩します。R3F の 1 章のために全読者に数百 KB を配るのは割に合いません。

なので**この章だけは、第1部と同じ「読むための章」**です。
手元で試すなら、\`npm create vite@latest\` で React のひな形を作って、
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

React Three Fiber（以下 R3F）は、これを**あるべき姿**の記述に変えます。

- 「このシーンには、赤い箱が 1 つある」と書く。**そうなるように誰かがやってくれる**

やっていることは変わりません。R3F の中では、これまで書いてきたのとまったく同じ
\`THREE.Mesh\` が作られ、同じ \`WebGLRenderer\` が回っています。
**新しい 3D の仕組みではなく、three の組み立て方を React に任せるための層**です。
`,
    },
    {
      kind: 'md',
      text: `
## 同じシーンを、2 通りで

回る箱を 1 つ置くだけの、いちばん小さな例です。まず、ここまで書いてきた形。
`,
    },
    {
      kind: 'code',
      title: '素の three（2-01 と同じ形）',
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
同じものを R3F で書くと、こうなります。
`,
    },
    {
      kind: 'code',
      title: 'React Three Fiber',
      code: `import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';

function Box() {
  const ref = useRef();

  // 描画ループの中身。dt は前のフレームからの秒数（2-06 の dt そのもの）
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
**行数はだいたい半分**になりましたが、減ったのは 3D の話ではありません。
消えたのは、レンダラの生成、canvas の設置、リサイズの購読、ループの \`requestAnimationFrame\`、
そして書かれてすらいなかった \`dispose\` です。**全部、毎回まったく同じ定型**でした。
`,
    },
    {
      kind: 'md',
      text: `
## 対応表 ― 読み替えるための地図

R3F のコードを読むとき、必要なのはこの対応だけです。
`,
    },
    {
      kind: 'md',
      text: `
- \`new THREE.Mesh(geometry, material)\` → \`<mesh>\` の**子に**ジオメトリとマテリアルを書く
- \`new THREE.BoxGeometry(1, 1, 1)\` → \`<boxGeometry args={[1, 1, 1]} />\`（\`args\` が**コンストラクタの引数**）
- \`material.color.set('#4fd6ff')\` → \`color="#4fd6ff"\`（属性がそのままプロパティ）
- \`mesh.position.set(1, 2, 3)\` → \`position={[1, 2, 3]}\`
- \`scene.add(a); a.add(b)\` → タグの**入れ子**がそのまま親子関係
- \`new THREE.Group()\` → \`<group>\`
- \`requestAnimationFrame\` のループ → \`useFrame((state, dt) => { ... })\`
- \`new GLTFLoader().load(...)\` → \`useLoader(GLTFLoader, url)\`
- \`renderer\` / \`camera\` / \`scene\` の生成 → \`<Canvas>\` が全部やる
- \`geometry.dispose()\` / \`material.dispose()\` → **書かない。**外れたときに自動で解放される
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'タグ名は three のクラス名を小文字始まりにしただけ',
      text: `
\`<meshStandardMaterial>\` \`<torusKnotGeometry>\` \`<directionalLight>\` ―
これらは R3F が 1 つずつ用意しているのではなく、**\`THREE\` の名前空間を自動で引いて**います。
つまり \`THREE.SomeThing\` が存在すれば \`<someThing>\` と書けます。

そのため、**タグの一覧を探しても見つかりません。**
見るべきは three の公式ドキュメントのほうで、
R3F 側で覚えることは「小文字始まりにする」「引数は \`args\`」の 2 つだけです。
`,
    },
    {
      kind: 'md',
      text: `
## \`<Canvas>\` が何をしているのか

これ 1 つで、[](#/ch/t01-first-scene) でやった 3 点セットが全部立ち上がります。

- \`WebGLRenderer\` を作り、\`canvas\` を DOM に置く
- \`PerspectiveCamera\` を作る（\`camera={{ ... }}\` で設定を渡せる）
- \`Scene\` を作り、その中に子の JSX を組み立てる
- 親要素の大きさを見張って、\`camera.aspect\` と \`setSize\` を追従させる
- \`requestAnimationFrame\` のループを回す
- **画面から外れたら、掴んでいた WebGL のものを解放する**

最後の 1 つは、地味ですがいちばん効きます。
[](#/ch/t10-scene-graph) で見たとおり、\`dispose\` 漏れは SPA では致命傷になります。
このサイト自身、\`src/three/stage.ts\` という**同じ役割の入れ物を自前で書いて**、
41 章ぶんのデモを回しています。R3F はそれを既製品として持ってきているだけ、とも言えます。
`,
    },
    {
      kind: 'md',
      text: `
## R3F が本当に効く場面

**React の状態と 3D をつなぐとき**です。ここが唯一にして最大の理由になります。

たとえば「サイドバーで選んだ色が、3D の物体に反映される」を素の three で書くと、
DOM のイベントを購読して、対応する \`Mesh\` を探して、\`material.color.set()\` を呼ぶ、
という**橋渡しのコードを自分で書き、しかも同期を保ち続ける**ことになります。

R3F なら、色を持っているのは React の状態ひとつだけで、
3D 側はそれを読むだけになります。
`,
    },
    {
      kind: 'code',
      title: 'UI の状態が、そのまま 3D になる',
      code: `function Scene() {
  const [color, setColor] = useState('#4fd6ff');
  const [count, setCount] = useState(3);

  return (
    <>
      {/* ふつうの HTML の UI */}
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      <input type="range" min={1} max={20} value={count}
             onChange={(e) => setCount(Number(e.target.value))} />

      <Canvas>
        <directionalLight position={[3, 4, 5]} intensity={2.5} />
        {/* 数が変われば、増えた分の Mesh が作られ、減った分は解放される */}
        {Array.from({ length: count }, (_, i) => (
          <mesh key={i} position={[(i - (count - 1) / 2) * 1.4, 0, 0]}>
            <boxGeometry />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      </Canvas>
    </>
  );
}`,
    },
    {
      kind: 'md',
      text: `
\`count\` を変えるだけで、\`Mesh\` の生成も破棄も起きます。
**「いま何個あるか」を自分で数えて差分を取る**、というコードが 1 行も要りません。

もう 1 つの利点は**エコシステム**です。\`@react-three/drei\` には、
OrbitControls・環境マップ・テキスト・影・読み込み表示といった定型が揃っていて、
第4部で自分で組んだものの多くが 1 行で置き換わります。
`,
    },
    {
      kind: 'md',
      text: `
## 効かない場面 ― 入れないほうがよいとき

- **React を使っていないなら、React ごと持ち込む理由はありません。**
  R3F は three を楽にする道具ではなく、**React と three をつなぐ**道具です
- **UI がほとんど無い作品**（このサイトの惑星ビューアーやローポリの街のような）。
  状態と同期させるものが無いので、得られるのは \`dispose\` の自動化くらいです
- **1 フレームに数千回、細かく物を触るもの**。R3F でも \`useFrame\` の中では
  \`ref.current.position.x = ...\` と**素の three をそのまま書きます**。
  ここを React の状態でやると、毎フレーム再描画が走って遅くなります
- **three の仕組みそのものを学んでいる最中**。
  \`<Canvas>\` は便利ですが、便利さは中で何が起きているかを隠します。
  隠れているものが分かっている人にとってだけ、便利です

最後の 1 点が、この章を第4部の終わり近くに置いた理由です。
**先に R3F から入ると、「何も映らない」ときに見るところが分かりません。**
シーンに add されているか、光はあるか、カメラは手前か ―
[逆引き](#/help)に並べたあの順番は、R3F でもそのまま必要になります。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '自動車の運転と、整備',
      text: `
R3F は「オートマ車」です。楽で、速く、日常の用途には明らかに向いています。

ただし、坂道で止まったときに何が起きているのかは、
**変速機がどう動いているかを知っている人にしか分かりません。**
このサイトが 41 章かけてやってきたのは、その中身のほうです。

だから順番はこれでよいのです。**まず中身、それから道具。** 逆はできません。
`,
    },
    {
      kind: 'md',
      text: `
## この章で分かったこと

- R3F は**新しい 3D の仕組みではない**。中で動いているのは、これまでと同じ three
- タグ名は three のクラス名を小文字始まりにしたもの。引数は \`args\`
- \`<Canvas>\` が、レンダラ・カメラ・シーン・ループ・リサイズ・解放を引き受ける
- \`useFrame\` の中身は、これまで書いてきた描画ループの中身そのまま
- **効くのは、React の状態と 3D を同期させたいとき。** それが無いなら、入れる理由も無い
`,
    },
  ],
  exercises: [
    {
      prompt: `この章の R3F のコードを、**素の three に読み替えて**ください。
\`<mesh>\` \`<boxGeometry args={[1, 1, 1]} />\` \`<meshStandardMaterial color="#4fd6ff" />\` の 3 つが、
それぞれ元のコードのどの行にあたるかを対応づけます。`,
      hint: '入れ子は親子関係、ではありません。ジオメトリとマテリアルは Mesh の「子」ではなく「材料」です。',
      answer: `\`<mesh>\` の中に置いたジオメトリとマテリアルは、**シーングラフの子にはなりません**。
R3F は「\`<mesh>\` の子がジオメトリなら \`geometry\` に、マテリアルなら \`material\` に入れる」という
決まりで動いています。だから \`new THREE.Mesh(geometry, material)\` の引数 2 つと同じことです。
一方、\`<group>\` の中に \`<mesh>\` を置いた場合は**本当に親子**（\`group.add(mesh)\`）になります。
**入れ子が親子になるとは限らない**のが、読むときの最初のつまずきどころです。`,
      answerCode: `// R3F
// <mesh ref={ref}>
//   <boxGeometry args={[1, 1, 1]} />
//   <meshStandardMaterial color="#4fd6ff" />
// </mesh>

// 素の three で書くと、この 1 文
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff }),
);`,
    },
    {
      prompt: `\`useFrame\` の中で \`setPosition(x + dt)\` のように **React の状態を毎フレーム更新する**コードを見かけたとします。
何が問題ですか。どう書き直しますか。`,
      hint: '状態を変えると、React はその部分を作り直します。それが毎秒 60 回起きるとどうなるでしょう。',
      answer: `**毎フレーム React の再描画が走ります。** 60fps なら毎秒 60 回、木をたどって差分を取る仕事が増えます。
3D の中で動かすだけなら、React に知らせる必要はありません。
\`ref\` を掴んで、**素の three と同じように直接書き換えます**。
「状態にするのは、UI に出す値だけ」が目安です。
位置や回転のように毎フレーム変わるものは、状態にしてはいけません。`,
      answerCode: `// 遅い: 毎フレーム React が作り直す
useFrame((state, dt) => setX(x + dt));

// 速い: three のオブジェクトを直接触る（これまでと同じ書き方）
useFrame((state, dt) => {
  ref.current.position.x += dt;
});`,
    },
    {
      prompt: `いま作ろうとしているものに R3F を入れるべきか、**3 つの問いで**決めてください。
その 3 つを自分の言葉で書き出してみましょう。`,
      hint: 'この章の「効く場面」と「効かない場面」を、判断の形に直します。',
      answer: `たとえばこの 3 つです。

1. **すでに React を使っているか。** 使っていないなら、React ごと持ち込む理由がまず無い
2. **UI の状態と 3D を同期させる必要があるか。** 無いなら、得るのは \`dispose\` の自動化くらい
3. **中で何が起きているか説明できるか。** できないなら、詰まったときに調べる先が二重になる

3 つとも「はい」なら入れる価値があります。**1 つでも「いいえ」なら、素の three のままで困りません。**`,
    },
  ],
  quiz: [
    {
      q: '`<boxGeometry args={[1, 1, 1]} />` の `args` は何を表していますか。',
      choices: [
        'コンストラクタに渡す引数',
        'ジオメトリの位置',
        'React に渡す props の一覧',
        'シェーダの uniform',
      ],
      answer: 0,
      explain:
        '`args` は `new THREE.BoxGeometry(1, 1, 1)` の引数そのものです。値を変えると、書き換えではなく作り直しが起きます（コンストラクタの引数なので、当然そうなります）。',
    },
    {
      q: 'R3F で `geometry.dispose()` を書かなくてよいのはなぜですか。',
      choices: [
        '木から外れたときに、R3F が解放してくれるから',
        'R3F は WebGL を使わないから',
        'ブラウザが自動で解放してくれるから',
        'ジオメトリは GPU のメモリを使わないから',
      ],
      answer: 0,
      explain:
        'R3F が生成と破棄の両方を持っているので、外れたときに解放まで面倒を見ます。素の three では自分で書く必要があり、書き忘れが SPA での黒画面につながります（[](#/ch/t10-scene-graph)）。',
    },
    {
      q: '`useFrame` の中で、物体の位置を毎フレーム動かしたい。正しいのはどれですか。',
      choices: [
        '`ref.current.position.x += dt` のように、three のオブジェクトを直接触る',
        '`setPosition(x + dt)` で React の状態を更新する',
        '`<mesh position={...}>` の値を毎フレーム書き換える',
        '`useEffect` の中で動かす',
      ],
      answer: 0,
      explain:
        '毎フレーム変わる値を React の状態にすると、毎秒 60 回の再描画が起きます。3D の中だけで完結する動きは、`ref` を掴んで直接書き換えます ― つまり、これまで書いてきたコードとまったく同じです。',
    },
    {
      q: 'R3F を入れる理由として、いちばん強いものはどれですか。',
      choices: [
        'React の状態と 3D を同期させたいとき',
        'three より速く動くから',
        'three より少ない数学で書けるから',
        'シェーダを書かなくてよくなるから',
      ],
      answer: 0,
      explain:
        '速さも数学もシェーダも、R3F では何も変わりません。中で動いているのは同じ three です。変わるのは「React の世界と 3D の世界をつなぐ手間」で、そこに用が無いなら入れる理由もありません。',
    },
  ],
};
