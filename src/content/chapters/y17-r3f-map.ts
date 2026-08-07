import type { Chapter } from '../types.ts';

export const chapterY17: Chapter = {
  slug: 'y17-r3f-map',
  part: 'polish',
  number: 17,
  title: '読み替えの地図 ― タグ名と args と入れ子',
  goal: '$R3F$ のコードを素の three に読み替えられるようになり、入れ子が親子関係とは限らないという最初のつまずきを、避けられるようになります。',
  requires: ['q05-r3f'],
  threeApis: ['Mesh', 'Group', 'BufferGeometry', 'Material', 'Object3D'],
  mathRecall: [
    { slug: 'q05-r3f', note: '$R3F$ は three の組み立て方を $React$ に任せる層' },
    { slug: 't10-scene-graph', note: '親子関係。ここが $JSX$ の入れ子と一致しません' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 覚えることは、2 つだけ

$R3F$ のコードを読むとき、新しく覚える規則は $2$ つしかありません。

- **タグ名は、three のクラス名を小文字始まりにしたもの**
- **コンストラクタの引数は \`args\` に配列で渡す**

あとはプロパティがそのまま属性になります。これで $9$ 割は読めます。

残りの $1$ 割が、**入れ子の意味**です。ここだけは注意が要ります。
`,
    },
    {
      kind: 'md',
      text: `
## 対応表

読み替えるための地図です。

- \`new THREE.Mesh(geometry, material)\` → \`<mesh>\` の**子に**ジオメトリとマテリアルを書く
- \`new THREE.BoxGeometry(1, 1, 1)\` → \`<boxGeometry args={[1, 1, 1]} />\`
- \`material.color.set('#4fd6ff')\` → \`color="#4fd6ff"\`
- \`mesh.position.set(1, 2, 3)\` → \`position={[1, 2, 3]}\`
- \`mesh.rotation.y = 0.5\` → \`rotation={[0, 0.5, 0]}\`
- \`scene.add(a); a.add(b)\` → タグの**入れ子**がそのまま親子関係
- \`new THREE.Group()\` → \`<group>\`
- \`requestAnimationFrame\` のループ → \`useFrame((state, dt) => { ... })\`
- \`new GLTFLoader().load(...)\` → \`useLoader(GLTFLoader, url)\`
- \`renderer\` / \`camera\` / \`scene\` の生成 → \`<Canvas>\` が全部やる
- \`geometry.dispose()\` / \`material.dispose()\` → **書かない。** 外れたときに自動で解放される
- \`material.map = texture\` → \`<meshStandardMaterial map={texture} />\`
- \`object.visible = false\` → \`visible={false}\`
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'タグの一覧は、探しても見つかりません',
      text: `
\`<meshStandardMaterial>\` \`<torusKnotGeometry>\` \`<directionalLight>\` ―
これらは $R3F$ が $1$ つずつ用意しているのではありません。

**\`THREE\` の名前空間を、実行時に自動で引いています。**

つまり \`THREE.SomeThing\` が存在すれば、\`<someThing>\` と書けます。
逆に言えば、**$R3F$ 側にタグの一覧は存在しません。**

だから、

- **見るべきは three の公式ドキュメント。** タグ名を検索しても出てきません
- **綴りを間違えるとエラーになる。** $R3F$ は名前空間に無い名前を弾きます

$R3F$ 側で覚えることは、$2$ つだけです。
**「小文字始まりにする」「引数は \`args\`」** ― この章の冒頭に書いたとおりです。
`,
    },
    {
      kind: 'md',
      text: `
## \`args\` は、書き換えではなく「作り直し」

\`args\` はコンストラクタの引数です。ここが効いてきます。

**コンストラクタの引数は、あとから変えられません。**
\`new THREE.BoxGeometry(1, 1, 1)\` で作った箱の幅を $2$ にする方法は、three にはありません。
**作り直すしかない。**

$R3F$ も同じです。\`args\` の値が変わると、**そのオブジェクトを捨てて作り直します。**

- \`<boxGeometry args={[1, 1, 1]} />\` → \`args={[2, 1, 1]}\` … **作り直し**
- \`<meshStandardMaterial color="#4fd6ff" />\` → \`color="#ff6b8a"\` … **書き換え**（安い）

見た目は同じ「属性を変えただけ」ですが、**中で起きていることが違います。**

だから、**毎フレーム変わる値を \`args\` に入れてはいけません。**
$60\\ \\mathrm{fps}$ なら、毎秒 $60$ 回ジオメトリを作り直すことになります。
[](#/ch/w44-gpu-cost)で見た「$GPU$ への転送」が、毎フレーム走ります。
`,
    },
    {
      kind: 'md',
      text: `
## 入れ子が、親子とは限らない

いちばんのつまずきどころです。下のコードを見ながら読んでください。

- \`<mesh>\` の中に \`<boxGeometry />\` と \`<meshStandardMaterial />\`
- \`<group>\` の中に \`<mesh>\` が $2$ つ

$2$ つの入れ子は、**まったく別の意味**です。

- **\`<group>\` の中の \`<mesh>\`** … 本当に親子。\`group.add(mesh)\` です。
  親を動かせば子も動きます
- **\`<mesh>\` の中のジオメトリとマテリアル** … 親子では**ありません。**
  \`new THREE.Mesh(geometry, material)\` の**引数 $2$ つ**です

$R3F$ は「\`<mesh>\` の子がジオメトリなら \`geometry\` に、マテリアルなら \`material\` に入れる」
という規則で動いています。**属性に近いものが、たまたま子の形で書かれている**だけです。

見分け方は簡単で、**\`Object3D\` を継承しているかどうか**です。
\`Mesh\` \`Group\` \`Light\` \`Camera\` は継承しているので子になり、
\`BufferGeometry\` と \`Material\` は継承していないので**属性の側**に回ります。
`,
    },
    {
      kind: 'code',
      title: '入れ子の 2 つの意味を、素の three で書き分ける',
      code: `// R3F
// <group position={[0, 1, 0]}>
//   <mesh>
//     <boxGeometry args={[1, 1, 1]} />
//     <meshStandardMaterial color="#4fd6ff" />
//   </mesh>
//   <mesh position={[2, 0, 0]}>
//     <sphereGeometry args={[0.5, 32, 16]} />
//     <meshStandardMaterial color="#ff6b8a" />
//   </mesh>
// </group>

// 素の three
const group = new THREE.Group();
group.position.set(0, 1, 0);

// mesh の「子」は、引数になる
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff }),
);

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 16),
  new THREE.MeshStandardMaterial({ color: 0xff6b8a }),
);
ball.position.set(2, 0, 0);

// group の「子」は、本当に子
group.add(box, ball);
scene.add(group);`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'マテリアルの共有が、消えます',
      text: `
[](#/ch/x27-instancing)や[](#/ch/x37-car-instancing)で、
**マテリアルを $1$ つ作って全部で使い回す**ことをやりました。
$R3F$ でそのまま書くと、**共有が消えます。**

$26$ 個の \`<mesh>\` それぞれの中に \`<meshStandardMaterial />\` を書けば、
**マテリアルが $26$ 個できます。**

材質が同じでも別のオブジェクトなので、three から見れば別のマテリアルです。
[](#/ch/w44-gpu-cost)で見たとおり、**マテリアルが違えばまとめて描けません。**

避け方は $2$ つ。

- **\`useMemo\` で $1$ つ作って、\`material={mat}\` と属性で渡す**
- **\`<instancedMesh>\` を使う。** そもそも $1$ 回で描く

**$JSX$ は「同じものを何個も書く」のが自然な書き方**なので、
うっかり作りすぎるほうへ倒れます。気をつけるところです。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`<mesh>\` の中に書いた \`<boxGeometry />\` は、シーングラフの**子**になりますか。`,
      hint: '$3$ 次元の木に、ジオメトリは並びますか。',
      answer: `**なりません。\`Mesh\` の引数になります。**

**$R3F$ の規則**

「\`<mesh>\` の子がジオメトリなら \`geometry\` に、マテリアルなら \`material\` に入れる」

つまり \`new THREE.Mesh(geometry, material)\` と**まったく同じこと**です。

**見分け方**

**\`Object3D\` を継承しているかどうか**で決まります。

- **継承している** … \`Mesh\` \`Group\` \`Light\` \`Camera\` \`Points\` → **本当の子**
- **継承していない** … \`BufferGeometry\` \`Material\` \`Texture\` → **属性の側**

**なぜ間違えるのか**

$JSX$ では、どちらも同じ「入れ子」の形で書かれるからです。

\`<group><mesh /></group>\` は親子、
\`<mesh><boxGeometry /></mesh>\` は引数 ― **見た目が同じで意味が違います。**

**確かめ方**

親を動かしてみてください。

\`<group position={[0, 5, 0]}>\` の中の \`<mesh>\` は**一緒に上がります。**

ジオメトリには \`position\` がそもそも無いので、動かしようがありません。`,
    },
    {
      prompt: `\`args={[width, 1, 1]}\` の \`width\` を、スライダーで動かせるようにしました。

$60\\ \\mathrm{fps}$ でドラッグすると、何が起きますか。`,
      hint: '$\\mathrm{args}$ はコンストラクタの引数です。',
      answer: `**毎フレーム、ジオメトリが作り直されます。**

**なぜか**

コンストラクタの引数は、あとから変えられません。

\`new THREE.BoxGeometry(1, 1, 1)\` で作った箱の幅を $2$ にする方法は、three にありません。

$R3F$ も同じで、**\`args\` が変われば捨てて作り直します。**

**$1$ 回あたり何が起きるか**

- 古いジオメトリの \`dispose\`
- 頂点・法線・$UV$ の配列を $CPU$ で作る
- $GPU$ へ転送する

これが**毎秒 $60$ 回**。[](#/ch/w44-gpu-cost)で見た転送が、毎フレーム走ります。

**どう書くか**

$2$ つあります。

- **\`scale\` を使う。** \`<mesh scale={[width, 1, 1]}>\` なら、
  ジオメトリはそのままで**行列を書き換えるだけ**。ほぼ無料
- **\`useMemo\` で段階を刻む。** どうしても形を変えるなら、
  連続値ではなく段階にして、作り直しの回数を減らす

$1$ つめでたいてい足ります。

**一般化すると**

**\`args\` に毎フレーム変わる値を入れない。** これだけ覚えてください。`,
    },
    {
      prompt: `$26$ 棟の建物を \`<mesh>\` の並びで書き、それぞれの中に \`<meshStandardMaterial color="#2b303c" />\` を書きました。

何が起きますか。`,
      hint: '同じ見た目でも、同じオブジェクトとは限りません。',
      answer: `**マテリアルが $26$ 個できて、まとめて描けなくなります。**

**なぜか**

$JSX$ で書いた \`<meshStandardMaterial />\` は、**それぞれ独立に \`new\` されます。**

色が同じでも、three から見れば**別のオブジェクト**です。

**何が失われるか**

[](#/ch/w44-gpu-cost)で見たとおり、まとめて描く条件は「同じマテリアル」です。

- **共有していれば** … 状態の切り替えが減る
- **$26$ 個あれば** … $26$ 回ぶん切り替わる

[](#/ch/x27-instancing)でマテリアルを $1$ つにまとめたのは、まさにこのためでした。

**避け方**

- **\`useMemo\` で $1$ つ作って、属性で渡す** ―
  \`const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b303c' }), []);\`
  そして \`<mesh material={mat}>\`
- **\`<instancedMesh>\` を使う。** [](#/ch/x27-instancing)の方法をそのまま

**なぜ引っかかりやすいのか**

**$JSX$ は「同じものを何個も書く」のが自然な書き方**だからです。

素の three なら、マテリアルを $26$ 回 \`new\` するコードは**明らかに変**に見えます。
$JSX$ だと、それが自然な形で書けてしまいます。`,
    },
  ],
  quiz: [
    {
      q: '`<boxGeometry args={[1, 1, 1]} />` の `args` は何ですか。',
      choices: [
        'コンストラクタに渡す引数。値が変わるとオブジェクトが作り直される',
        'ジオメトリの位置',
        'React に渡す props の一覧',
        'シェーダの uniform',
      ],
      answer: 0,
      explain:
        'new THREE.BoxGeometry(1, 1, 1) の引数そのものです。コンストラクタの引数は後から変えられないので、args が変われば捨てて作り直しになります。色のような属性は書き換えで済むのとは、値段がまったく違います ― 毎フレーム変わる値を args に入れてはいけません。',
    },
    {
      q: '`<mesh>` の中に書いた `<boxGeometry />` は、シーングラフの子になりますか。',
      choices: [
        'なりません。Mesh の引数になります',
        'なります。mesh.add(geometry) と同じ',
        '設定によって変わります',
        'エラーになります',
      ],
      answer: 0,
      explain:
        'Object3D を継承しているものだけが本当の子になります。Mesh・Group・Light・Camera は継承しているので子、BufferGeometry と Material は継承していないので属性の側です。JSX ではどちらも同じ入れ子の形で書かれるので、見た目が同じで意味が違う ― 最初のつまずきどころです。',
    },
    {
      q: '26 個の `<mesh>` それぞれの中に同じ `<meshStandardMaterial />` を書くと、何が起きますか。',
      choices: [
        'マテリアルが 26 個作られ、まとめて描けなくなる',
        'R3F が自動で 1 つにまとめてくれる',
        '何も起きない。色が同じなら同じオブジェクト',
        'エラーになる',
      ],
      answer: 0,
      explain:
        'JSX の各タグは独立に new されます。色が同じでも別オブジェクトなので、まとめて描く条件を満たしません。useMemo で 1 つ作って material={mat} と渡すか、instancedMesh を使ってください。JSX は「同じものを何個も書く」のが自然なので、うっかり作りすぎるほうへ倒れます。',
    },
  ],
};
