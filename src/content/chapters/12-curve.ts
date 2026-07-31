import type { Chapter } from '../types.ts';

export const chapter12: Chapter = {
  slug: '12-curve',
  part: 'math3d',
  number: 35,
  title: '曲線とパス',
  goal: '数点を置くだけでなめらかな道を作れるようになり、その上を物体やカメラに走らせられるようになります。',
  requires: ['02-vector', '08-interp'],
  threeApis: [
    'CatmullRomCurve3',
    'CubicBezierCurve3',
    'QuadraticBezierCurve3',
    'Curve.getPoint',
    'Curve.getTangent',
    'Curve.getSpacedPoints',
    'TubeGeometry',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## まず、どこで困るか

カメラを A から B へ動かすだけなら lerp で足ります。
けれど「建物のまわりをぐるりと回り込みながら寄る」となると、直線をつないだだけでは
角でカクッと折れて、いかにも安っぽくなります。

必要なのは、数点を置くだけで**勝手になめらかにつながってくれる道**です。それが曲線です。
`,
    },
    {
      kind: 'md',
      text: `
## 考え方は lerp の延長

[第8章](#/ch/08-interp)の lerp は、2 点のあいだを直線で結ぶものでした。
曲線は、その lerp を**入れ子にする**ことで作られます。

3 点 A・B・C があるとき、

- A と B を t で混ぜた点 P を作る
- B と C を t で混ぜた点 Q を作る
- さらに P と Q を t で混ぜる

これだけで、t を 0 から 1 まで動かしたときに描かれる軌跡は曲線になります。
これが 2 次の{{ベジェ曲線}}の正体で、点を増やせば次数が上がります。
難しい式に見えても、やっていることは lerp の繰り返しです。
`,
    },
    {
      kind: 'formula',
      tex: 'B(t) = (1-t)^2 P_0 + 2(1-t)t\\,P_1 + t^2 P_2',
      readAloud:
        '2 次ベジェ曲線の式です。3 つの制御点に、t によって変わる重みを掛けて足しています。t が 0 のとき最初の点、1 のとき最後の点がちょうど重み 1 になるので、両端は必ず通ります。',
      worked: {
        given: '$P_0 = (0,\; 0)$、$P_1 = (2,\; 4)$、$P_2 = (4,\; 0)$ で、$t = 0.5$（ちょうど真ん中）のとき。',
        steps: [
          { calc: '(1-t)の2乗 = 0.5の2乗 = 0.25   → P0 の重み' },
          { calc: '2(1-t)t    = 2x0.5x0.5 = 0.5  → P1 の重み' },
          { calc: 'tの2乗     = 0.5の2乗 = 0.25   → P2 の重み' },
          { calc: '重みの合計 : 0.25 + 0.5 + 0.25 = 1', note: '3 つの重みは必ず 1 になる' },
          { calc: 'x : 0.25x0 + 0.5x2 + 0.25x4 = 2' },
          { calc: 'y : 0.25x0 + 0.5x4 + 0.25x0 = 2' },
        ],
        result: '$B(0.5) = (2,\; 2)$。制御点 $P_1$ は $(2, 4)$ にあるのに、曲線が通るのはその**半分の高さ**です。ベジェ曲線が「両端しか通らない」のはこのため ― 真ん中の点は**引っぱるだけ**で、通過点ではありません。',
      },
    },
    {
      kind: 'md',
      text: `
## ベジェと Catmull-Rom ― 通るか、引き寄せられるか

3D で使う曲線は、実質この 2 種類です。

**ベジェ曲線** … **始点と終点だけを通り**、途中の{{制御点}}には引き寄せられるだけで通りません。
「引っぱる磁石」を置く感覚で形を作ります。フォントや Illustrator のペンツールと同じ考え方です。

**Catmull-Rom スプライン** … **置いた点をすべて通ります**。
「ここを通ってほしい」という位置が決まっているときはこちらです。
カメラのパスや、乗り物の軌道に向いています。

迷ったら Catmull-Rom です。通ってほしい場所を並べるだけで済むので、直感どおりに扱えます。
`,
    },
    {
      kind: 'demo',
      id: 'curve-editor',
      caption:
        '白い点をドラッグすると形が変わります。曲線の種類を切り替えて、Catmull-Rom がすべての点を通り、ベジェが真ん中の2点を通らないことを見比べてください。',
    },
    {
      kind: 'md',
      text: `
## 位置と向き ― getPoint と getTangent

曲線から取り出せるものは、実質この 2 つです。

- \`getPoint(t)\` … その位置
- \`getTangent(t)\` … その場所で曲線が進んでいる向き

2 つ目が重要です。乗り物を曲線に沿って走らせるとき、位置だけ合わせても
機首が明後日を向いていたら台無しです。接線を向きに使えば、自然にカーブを曲がってくれます。

向きを合わせるには [第7章](#/ch/07-rotation) の \`lookAt\` か、クォータニオンを使います。
`,
    },
    {
      kind: 'code',
      title: '曲線に沿って走らせる',
      code: `import * as THREE from 'three';

// 通ってほしい点を並べるだけ
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-4, 0, 2.5),
  new THREE.Vector3(-1.5, 1, -3),
  new THREE.Vector3(1.5, 0, 3),
  new THREE.Vector3(4, 2, -2),
]);
curve.closed = true; // 端をつないで輪にする

// 道そのものを見せたいなら、線か管にする
const points = curve.getSpacedPoints(200);
const line = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(points),
  new THREE.LineBasicMaterial({ color: 0xffd166 }),
);
scene.add(line);

let t = 0;
function animate(dt) {
  t = (t + dt * 0.1) % 1;

  const position = curve.getPoint(t);
  const tangent = curve.getTangent(t);

  car.position.copy(position);
  // 進む先を見るように向ける
  car.lookAt(position.clone().add(tangent));
}`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 't は「進んだ距離」ではありません',
      text: `
\`getPoint(t)\` の t は、曲線のパラメータであって道のりの割合ではありません。
制御点の間隔がばらばらだと、t を等速で進めても**カーブのきついところで速くなったり遅くなったり**します。

等速で走らせたいときは \`getSpacedPoints()\` で距離が等しい点をあらかじめ取り出すか、
\`CatmullRomCurve3\` の \`curveType\` に \`'centripetal'\` を指定して、
不自然なふくらみを抑えてください。
`,
    },
    {
      kind: 'md',
      text: `
## 曲線の使い道

- **カメラワーク** … 見どころを数点置いて、そのあいだをなめらかに巡る
- **乗り物・弾の軌道** … レール、コース、ミサイルの誘導
- **形を作る** … \`TubeGeometry\` に曲線を渡すとパイプになる。ケーブルや道路が作れる
- **配置の下敷き** … 曲線上に等間隔で木や柱を並べる

とくに最後の使い方は地味に便利です。\`getSpacedPoints(n)\` を使えば、
うねった道に沿って等間隔でオブジェクトを並べられます。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '制御点は少なくてよい',
      text: `
なめらかにしたいからと点を増やすと、かえってガタつきます。
曲線は少ない点から自然な形を作るための道具です。
まず 4〜6 点で大まかな流れを作り、足りないところだけ足してください。
`,
    },
  ],
  exercises: [
    {
      prompt: `デモで制御点をドラッグして、**間隔の広いところと狭いところ**を作ってください。
そのうえで「自動で走らせる」を入れ、球の速さを見てください。何が起きますか。`,
      hint: 't は「道のりの割合」ではなく「何番目の区間のどのあたりか」を表しています。',
      answer: `間隔の広い区間では**速く**、狭い区間では**遅く**なります。
\`getPoint(t)\` の $t$ は道のりではなく曲線のパラメータなので、区間の長さが違うと速さも変わってしまいます。
**一定の速さで走らせたいときは \`getPointAt(t)\` を使います**。こちらは道のりで測り直してくれます（弧長パラメータ化）。`,
      answerCode: `// 速さがばらつく
const p = curve.getPoint(t);

// 道のりで測るので、速さが一定になる
const p = curve.getPointAt(t);`,
    },
    {
      prompt: '曲線に沿って走る物体を、**進行方向に向かせて**ください。',
      hint: 'その点での曲線の向きを返してくれるものがあります。',
      answer: `\`getTangentAt(t)\` で進行方向を取り、いま居る点にそれを足した先を \`lookAt\` します。
気をつけるのは、**\`lookAt\` はカメラ以外では +Z をその方向に向ける**ことです（カメラだけが −Z）。
モデルの正面が +Z でないなら、あらかじめ回しておくか、親の Group を挟んで補正します。`,
      answerCode: `const p = curve.getPointAt(t);
const tangent = curve.getTangentAt(t);

mesh.position.copy(p);
mesh.lookAt(p.clone().add(tangent));`,
    },
  ],
  quiz: [
    {
      q: '置いた制御点を**すべて通る**曲線はどれですか。',
      choices: ['Catmull-Rom スプライン', '3次ベジェ曲線', '2次ベジェ曲線', 'どちらも通らない'],
      answer: 0,
      explain:
        'ベジェは始点と終点だけを通り、途中の制御点には引き寄せられるだけです。通ってほしい位置が決まっているなら Catmull-Rom を選びます。',
    },
    {
      q: '曲線に沿って走る乗り物を、進行方向に向けたいときに使うのはどれですか。',
      choices: ['`curve.getTangent(t)`', '`curve.getPoint(t)`', '`curve.getLength()`', '`curve.closed`'],
      answer: 0,
      explain:
        '接線がその場所での進行方向です。位置は getPoint、向きは getTangent、と役割が分かれています。',
    },
    {
      q: '`getPoint(t)` の t を等速で増やしたのに、乗り物の速さが場所によって変わります。理由はどれですか。',
      choices: [
        't は道のりの割合ではなく、曲線のパラメータだから',
        'フレームレートが不安定だから',
        '曲線が閉じていないから',
        '制御点の数が多すぎるから',
      ],
      answer: 0,
      explain:
        '制御点の間隔がばらつくと、同じ t の増分でも進む距離が変わります。等速にしたいときは `getSpacedPoints()` で距離が等しい点を取り出してください。',
    },
  ],
};
