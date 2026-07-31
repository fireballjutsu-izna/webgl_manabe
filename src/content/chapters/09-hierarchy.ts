import type { Chapter } from '../types.ts';

export const chapter09: Chapter = {
  slug: '09-hierarchy',
  part: 'math3d',
  number: 10,
  title: '座標空間の階層 ― ローカルとワールド',
  goal: '親子関係のある物体の位置を正しく読み解けるようになり、「ローカルでは動いていないのに世界では動く」状況を自分で説明できるようになります。',
  requires: ['06-matrix'],
  threeApis: [
    'Object3D.add',
    'Object3D.attach',
    'Object3D.matrixWorld',
    'Object3D.getWorldPosition',
    'Object3D.localToWorld',
    'Object3D.worldToLocal',
    'Group',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## まず、どこで困るか

- 車体に車輪をくっつけたら、車体を動かしたときだけ車輪が置き去りになった
- \`mesh.position\` を読んだのに、画面上の位置とまるで違う値が返ってきた
- 親を回したら、子が思ってもいない軌道でぶん回された

原因はほぼ 1 つです。**position は「親から見た位置」であって、世界での位置ではない**。
この章でその区別をつけます。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '船の中を歩く人',
      text: `
船の甲板を、船首に向かって 3 歩進んだところに立っている人がいます。
その人の「船から見た位置」は、船がどこにいようと 3 歩のままです。
けれど「地球から見た位置」は、船が進めば刻々と変わります。
前者が{{ローカル座標}}、後者が{{ワールド座標}}です。
`,
    },
    {
      kind: 'md',
      text: `
## 親子関係とは、座標系の入れ子

Three.js で \`parent.add(child)\` と書くと、子は親の座標系の中に住むことになります。
親を動かせば、子の \`position\` の値はまったく変わらないまま、実際の位置だけが動きます。

しかも親の**回転と拡大も**引き継がれます。親が 2 倍になれば子も 2 倍になり、
親が 45 度回れば、子は親を中心に 45 度ぶん振り回されます。
`,
    },
    {
      kind: 'demo',
      id: 'parent-child',
      caption:
        '「子のローカル位置」のスライダーは動かさず、親の位置・回転・拡大だけを動かしてみてください。読み出しの上段（ローカル）は固定されたまま、下段（ワールド）だけが変わります。',
    },
    {
      kind: 'md',
      text: `
## ワールド行列 ― 親をさかのぼって合成したもの

物体が最終的に画面のどこに描かれるかは、**自分の変換行列に、親の、その親の…と
すべてを掛け合わせた行列**で決まります。これが \`matrixWorld\` です。
`,
    },
    {
      kind: 'formula',
      tex: 'M_{\\text{world}} = M_{\\text{parent}} \\times M_{\\text{local}}',
      readAloud:
        'ある物体のワールド行列は、親のワールド行列に、自分のローカルな変換行列を掛けたものになります。親の親がいれば、それがさらに左に積み重なっていきます。',
      worked: {
        given: '親を $x$ に 5 動かし、y 軸まわりに 90 度回します。子は親の中で $x$ に 2 の位置にいます。子のワールド座標はどこでしょう。',
        steps: [
          { calc: '子のローカル位置      : (2, 0, 0)' },
          { calc: '親の回転を先に適用     : (0, 0, -2)', note: 'y 軸まわり 90 度で、x 方向が z 方向へ倒れる' },
          { calc: '親の移動を足す        : (0+5, 0, -2+0)' },
          { calc: '                    = (5, 0, -2)' },
        ],
        result: 'ワールドでは $(5,\; 0,\; -2)$。**単純な足し算（5+2=7）にはなりません。** 親が回っていると、子のローカル座標そのものが向きを変えて運ばれるからです。これを毎回手で追うのは無理なので、行列の掛け算に任せます。',
      },
    },
    {
      kind: 'md',
      text: `
[第6章](#/ch/06-matrix)で見たとおり、行列のかけ算は右から効きます。
つまり **まず自分のローカルな変換が効き、そのあとで親の変換が丸ごとかぶさる**、
という順序です。「船の中を 3 歩進んでから、船ごと運ばれる」の順です。
`,
    },
    {
      kind: 'md',
      text: `
## ワールド座標を取り出す

\`mesh.position\` はローカル座標なので、世界での位置が欲しいときは専用の取り出し方をします。
`,
    },
    {
      kind: 'code',
      title: 'ローカルとワールドを行き来する',
      code: `import * as THREE from 'three';

// これは「親から見た位置」。親が動いても値は変わらない
console.log(child.position);

// 世界での位置。引数に受け皿の Vector3 を渡す作りになっている
const worldPosition = new THREE.Vector3();
child.getWorldPosition(worldPosition);

// 姿勢や大きさも同じように取り出せる
const worldQuaternion = new THREE.Quaternion();
child.getWorldQuaternion(worldQuaternion);

// ローカル座標 → ワールド座標（点を変換する）
const tip = child.localToWorld(new THREE.Vector3(0, 1, 0));

// ワールド座標 → 別の物体のローカル座標
const inOtherSpace = other.worldToLocal(tip.clone());`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '同じフレーム内で読むときは、更新が要ります',
      text: `
\`matrixWorld\` はレンダリングの直前にまとめて更新されます。
親の position を書き換えた直後に子のワールド座標を読むと、**1 フレーム前の値**が返ります。
その場で正しい値が欲しいときは \`object.updateWorldMatrix(true, false)\` を呼んでください。
「1フレームだけ遅れる」種類のバグは、たいていこれです。
`,
    },
    {
      kind: 'md',
      text: `
## add と attach ― 付け替えのときの落とし穴

親を変えるとき、方法が 2 つあります。

- \`newParent.add(child)\` … **ローカル座標を保つ**。値はそのままなので、見た目の位置が飛ぶ
- \`newParent.attach(child)\` … **ワールド座標を保つ**。見た目の位置は変わらず、ローカル値が計算し直される

「キャラクタが持っていた剣を地面に落とす」のように、
**見た目を保ったまま親を変えたいときは \`attach\`** です。
デモの「親から切り離す」チェックボックスは attach を使っているので、
切り離しても箱がその場に留まります。
`,
    },
    {
      kind: 'md',
      text: `
## Group ― 意味のまとまりを作る

\`THREE.Group\` は、形を持たない「入れ物」です。
これを使うと、複数の物体をひとかたまりとして扱えます。

- 車体・車輪・窓をまとめて 1 台の車として動かす
- 回転の中心をずらす（物体を Group の中でずらして置き、Group を回す）
- 太陽系のように、入れ子の回転を重ねる

とくに 2 つ目は覚えておくと便利です。物体の回転はつねに自分の原点まわりですが、
Group を親にしてその中で物体をずらしておけば、任意の点を中心に回せます。
`,
    },
    {
      kind: 'code',
      title: '軌道運動を階層で作る',
      code: `import * as THREE from 'three';

const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// 公転用の入れ物。これ自体は形を持たない
const orbit = new THREE.Group();
sun.add(orbit);

// 入れ物の中で、中心から離して惑星を置く
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.x = 5;
orbit.add(planet);

// 月は惑星の子にする。惑星について回る
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.x = 1.2;
planet.add(moon);

function animate(dt) {
  orbit.rotation.y += dt * 0.5;   // 公転（惑星が太陽のまわりを回る）
  planet.rotation.y += dt * 2;    // 自転。月も一緒に回る
}`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '拡大は階層と相性が悪い',
      text: `
親を非等倍で拡大（x だけ 2 倍など）すると、回転した子は歪みます。
親に \`scale\` を使うなら、3 軸とも同じ倍率にしておくのが安全です。
`,
    },
  ],
  exercises: [
    {
      prompt: `デモで親を動かして回してから、「親から切り離す」を入れてください。
**子のローカル位置**と**子のワールド座標**の読み出しが、それぞれどう変わりましたか。`,
      hint: '2 つの数字のうち、片方だけが変わります。',
      answer: `ローカル位置は変わらず、**ワールド座標のほうが飛びます**（親のぶんが効かなくなるため）。
\`add\` は「ローカル座標をそのままに、親を付け替える」操作だからです。
見た目を保ったまま親を移したいときは、代わりに \`attach()\` を使います。`,
      answerCode: `// 見た目が飛ぶ: ローカル座標をそのまま持っていく
scene.add(child);

// 見た目が変わらない: ワールドでの位置を保つようローカル座標を計算し直す
scene.attach(child);`,
    },
    {
      prompt: '親の拡大率を 2 倍にすると、子の見た目の大きさと、子のワールド座標はどうなりますか。「子だけ拡大したくない」ときはどうしますか。',
      hint: '親の変換は、位置だけでなく大きさも子へ伝わります。',
      answer: `子も 2 倍になり、親からの距離も 2 倍に伸びます。**拡大は位置ごと引き伸ばす**からです。
子だけ元の大きさに戻したいなら、子の \`scale\` を 0.5 にして打ち消せますが、これは壊れやすい書き方です。
素直なのは、**拡大したいものを別の Group に分けて、位置を担う親と大きさを担う親を分ける**ことです。`,
    },
  ],
  quiz: [
    {
      q: '`child.position` が返す値はどれですか。',
      choices: [
        '親から見た位置（ローカル座標）',
        'シーンの原点から見た位置（ワールド座標）',
        '画面上のピクセル位置',
        'カメラから見た位置',
      ],
      answer: 0,
      explain:
        'position は常にローカル座標です。世界での位置が欲しいときは `getWorldPosition()` を使ってください。',
    },
    {
      q: '見た目の位置を変えずに、物体の親だけを付け替えたいときに使うのはどれですか。',
      choices: ['`newParent.attach(child)`', '`newParent.add(child)`', '`child.remove()`', '`scene.clear()`'],
      answer: 0,
      explain:
        '`add` はローカル座標を保つので、親が変わると見た目の位置が飛びます。`attach` はワールド座標を保つように、ローカル値を計算し直してくれます。',
    },
    {
      q: '親の position を書き換えた直後に、子の `getWorldPosition()` が古い値を返すのはなぜですか。',
      choices: [
        'ワールド行列の更新が、レンダリング直前にまとめて行われるから',
        '子のローカル座標が壊れているから',
        'getWorldPosition が非同期だから',
        '親子関係が切れているから',
      ],
      answer: 0,
      explain:
        '同じフレーム内で正しい値が欲しいときは、`updateWorldMatrix(true, false)` を呼んで先に計算させてください。',
    },
  ],
};
