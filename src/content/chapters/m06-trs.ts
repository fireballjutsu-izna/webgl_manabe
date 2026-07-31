import type { Chapter } from '../types.ts';

export const chapterM06: Chapter = {
  slug: 'm06-trs',
  part: 'math3d',
  number: 6,
  title: 'TRS ― Three.js が内部でやっている合成',
  goal: 'position・rotation・scale が 1 つの行列にまとまる順番と、その順番が選ばれている理由が分かります。',
  requires: ['m05-matrix-order'],
  threeApis: [
    'Object3D.updateMatrix',
    'Matrix4.compose',
    'Matrix4.decompose',
    'Object3D.matrixAutoUpdate',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## まず、どこで困るか

Three.js に書くのは \`position\`・\`rotation\`・\`scale\` の 3 つだけです。
この 3 つが、いつ・どんな順番で 1 つの行列になるのか ―
それを知らないと、次のようなときに手が止まります。

- 拡大したら、なぜか回転の中心がずれた（ように見える）
- 位置を設定した直後に \`matrixWorld\` を読んだら、古い値だった
- 自分で行列を組んだら、three と違う結果になった

答えは 1 行で言えます。**拡大 → 回転 → 移動**の順です。
`,
    },
    {
      kind: 'formula',
      tex: 'M = T \\cdot R \\cdot S',
      readAloud:
        '変換行列は、移動・回転・拡大をこの順に並べたものです。点にはいちばん右の拡大が先に効き、次に回転、最後に移動が効きます。',
      worked: {
        given:
          '$S$ を 2 倍の拡大、$R$ を y 軸まわり 90 度、$T$ を x に 3 の移動として、点 $(1,\\; 0,\\; 0)$ を追います。',
        steps: [
          { calc: 'S : (1, 0, 0) → (2, 0, 0)', note: '原点から見て 2 倍の距離へ' },
          { calc: 'R : (2, 0, 0) → (0, 0, -2)', note: '原点を中心に 90 度' },
          { calc: 'T : (0, 0, -2) → (3, 0, -2)', note: '最後に置きたい場所へ運ぶ' },
        ],
        result:
          '**$(3,\\; 0,\\; -2)$**。まず原点で大きさを決め、次に向きを決め、最後に置く ― という素直な流れです。順番を変えると、拡大が移動量に掛かったり、移動が回転半径になったりします。',
      },
    },
    {
      kind: 'md',
      text: `
## なぜこの順番なのか

この順番が選ばれているのは、**いちばん直感どおりに動くから**です。

**拡大を最初に**やる理由 ― 拡大は原点からの距離を倍にします。
移動したあとに拡大すると、**移動量まで倍になります**。
「2 倍にしたら、置いた場所も遠くなった」では困ります。

**移動を最後に**やる理由 ― 回転は原点を中心に起きます。
移動したあとに回転すると、**原点を中心に振り回されます**。
「向きを変えたら、どこかへ飛んでいった」では困ります。

つまりこの順番は、
**「大きさ・向き・場所を、互いに干渉させずに指定できる」**ように選ばれています。

だから \`scale\` を変えても \`position\` は動かず、
\`rotation\` を変えても \`position\` は動きません。**3 つが独立して効きます。**
`,
    },
    {
      kind: 'md',
      text: `
## いつ合成されるか

three は**描画の直前**に、シーンを上からたどって行列を組み立てます
（\`updateMatrixWorld()\` が呼ばれます）。

つまり **\`position\` を設定した直後の \`matrixWorld\` は、まだ古い値**です。
これがよくある引っかかりで、

- 位置を設定
- すぐに \`getWorldPosition()\` で読む
- **1 フレーム前の値が返る**

という形で表に出ます。描画を待たずに正しい値が欲しいときは、
自分で \`updateMatrixWorld()\` を呼んでください。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '拡大が入ると、行列から角度を取り出しにくくなる',
      text: `
\`decompose()\` は行列を位置・回転・拡大に分解してくれますが、
**せん断（斜めに倒す変換）が入っていると正しく分解できません**。

TRS の形で組んだ行列なら問題ありませんが、
親子に非一様な拡大が混ざると、子の行列にせん断が生じることがあります。
「拡大した親の下で子を回すと、形がゆがむ」のはこれが原因です。

**非一様な拡大は、できるだけ末端の物体だけに使う**のが安全です。
`,
    },
    {
      kind: 'code',
      title: 'TRS の合成と分解',
      code: `import * as THREE from 'three';

mesh.position.set(3, 0, 0);
mesh.rotation.y = Math.PI / 2;
mesh.scale.setScalar(2);

// 描画の直前に、three が内部でこれをやっている
mesh.updateMatrix();

// 自分で同じものを組むなら
const m = new THREE.Matrix4().compose(
  mesh.position,
  mesh.quaternion,   // rotation ではなく quaternion を使う
  mesh.scale,
);

// 逆に、行列から 3 つを取り出す
const p = new THREE.Vector3();
const q = new THREE.Quaternion();
const s = new THREE.Vector3();
m.decompose(p, q, s);

// 設定した直後は matrixWorld がまだ古い
mesh.position.set(5, 0, 0);
mesh.updateMatrixWorld(true);   // 明示的に更新する

// 行列を自分で管理したいときは自動更新を切る
mesh.matrixAutoUpdate = false;
mesh.matrix.copy(m);`,
    },
    {
      kind: 'md',
      text: `
## 回転の中心を変えたいとき

TRS の順番は固定なので、**回転の中心は必ず物体の原点**になります。
「端を軸にして回したい」ときは、そのままでは書けません。

やり方は 2 つあります。

- **ジオメトリをずらす** … 形のほうを移動しておき、回したい点を原点に置く
- **入れ物を用意する** … 親の \`Object3D\` を回し、子をその中でずらしておく

後者のほうが柔軟で、three ではよく使われます。
**回転の中心を変えたいなら、階層を 1 段増やす** ―
これは階層の章でもう一度出てきます。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`mesh.position\` \`mesh.rotation\` \`mesh.scale\` を設定したとき、Three.js はそれをいつ 1 つの行列にまとめていますか。
自分で今すぐ反映させたいときはどうしますか。`,
      hint: '毎フレームの描画の直前に、シーン全体をたどって計算されています。',
      answer: `描画のたびに \`Scene\` を上からたどって \`updateMatrixWorld()\` が呼ばれ、
そこで 3 つが 1 つの行列に合成されます。

つまり**設定した直後の \`matrixWorld\` は、まだ 1 フレーム前のまま**ということです。
描画を待たずにワールド座標を知りたいときは、自分で \`updateMatrixWorld()\` を呼びます
（親子関係があるときに、これが効いてきます）。`,
      answerCode: `mesh.position.set(3, 0, 0);
mesh.rotation.y = Math.PI / 2;

// この時点の matrixWorld はまだ更新されていない
mesh.updateMatrixWorld(true);

const world = new THREE.Vector3();
mesh.getWorldPosition(world); // 中で matrixWorld を読んでいる`,
    },
    {
      prompt: `もし three が「移動 → 回転 → 拡大」の順（$S \\cdot R \\cdot T$）で合成していたら、
\`position.set(3, 0, 0)\` と \`scale.setScalar(2)\` を書いたとき、物体はどこに行きますか。
現在の順番との違いを説明してください。`,
      hint: '右から効くので、この順だと移動が最初に効きます。',
      answer: `**$(6,\\; 0,\\; 0)$** に行きます。先に 3 動かしてから 2 倍に拡大するので、
**移動量まで 2 倍になる**からです。

現在の順（$T \\cdot R \\cdot S$）なら、拡大は物体の大きさだけに効き、
移動は $(3, 0, 0)$ のまま。**指定した場所にちゃんと置かれます。**

「拡大率を変えたら、物体が遠くへ動いた」というのは直感に反します。
だから three は移動を最後にしています。

同じ理屈で、回転も移動より先に効かせています。
そうしないと、向きを変えるだけで場所が変わってしまいます。`,
    },
    {
      prompt: `ドアを「蝶番の側を軸にして」開きたい。
ドアの \`Mesh\` は中心が原点にあります。そのまま \`rotation.y\` を変えると、
ドアが真ん中で回ってしまいます。どう直しますか。`,
      hint: 'TRS の順番は変えられません。回転の中心は必ず物体の原点です。',
      answer: `**階層を 1 段増やします。**

1. 空の \`Object3D\`（蝶番）を、ドアの端の位置に置く
2. ドアの \`Mesh\` をその子にして、幅の半分だけ横にずらす
3. **蝶番のほうを回す**

こうすると、ドアは蝶番を中心に回ります。
ドア自身の原点は変わっていませんが、**その原点ごと親に運ばれる**からです。

もう 1 つの手は、\`geometry.translate()\` で形のほうをずらすことです。
こちらは階層が増えませんが、**ジオメトリを共有している他の物体にも影響します**。
使い回しているジオメトリには使えません。`,
      answerCode: `const hinge = new THREE.Object3D();
hinge.position.set(-1, 0, 0);      // 蝶番の位置
scene.add(hinge);

door.position.set(1, 0, 0);        // 蝶番から見た、ドアの中心
hinge.add(door);

hinge.rotation.y = Math.PI / 3;    // 蝶番を回すと、ドアが開く`,
    },
  ],
  quiz: [
    {
      q: 'Three.js が `position`・`rotation`・`scale` から行列を組み立てるとき、変換が効く順番はどれですか。',
      choices: ['拡大 → 回転 → 移動', '移動 → 回転 → 拡大', '回転 → 拡大 → 移動', '毎回ランダム'],
      answer: 0,
      explain:
        'まず原点で大きさを決め、次に向きを決め、最後に置きたい場所へ運ぶ、という順です。この順番だと、3 つが互いに干渉せず独立して効きます。',
    },
    {
      q: '`mesh.position.set(...)` の直後に `getWorldPosition()` を呼ぶと、どうなりますか。',
      choices: [
        '更新前の古い値が返ることがある',
        '必ず新しい値が返る',
        'エラーになる',
        '常に原点が返る',
      ],
      answer: 0,
      explain:
        '行列の合成は描画の直前に行われます。すぐに正しい値が欲しいときは、自分で `updateMatrixWorld()` を呼んでください。',
    },
    {
      q: '物体の端を軸にして回したいとき、いちばん柔軟な方法はどれですか。',
      choices: [
        '親の Object3D を用意して、そちらを回す',
        '`rotation` の順番を変える',
        '`scale` を調整する',
        'TRS の合成順を変更する',
      ],
      answer: 0,
      explain:
        'TRS の順番は固定なので、回転の中心は必ず物体の原点です。階層を 1 段増やせば、その親の原点を回転の中心にできます。ジオメトリ自体をずらす方法もありますが、共有しているときは使えません。',
    },
  ],
};
