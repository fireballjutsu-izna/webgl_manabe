import type { Chapter } from '../types.ts';

export const chapterM17: Chapter = {
  slug: 'm17-local-world',
  part: 'math3d',
  number: 17,
  title: 'ローカルとワールド ― どちらの座標で言っているか',
  goal: '座標には必ず「どこから見た」が付くことが分かり、ローカルとワールドを取り違えたバグを自分で見つけられるようになります。',
  requires: ['09-hierarchy', 'm07-inverse'],
  threeApis: [
    'Object3D.getWorldPosition',
    'Object3D.localToWorld',
    'Object3D.worldToLocal',
    'Object3D.getWorldQuaternion',
    'Object3D.updateWorldMatrix',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## まず、どこで困るか

前の章の演習で見たとおり、\`mesh.position\` を読んでも画面上の位置とは違う値が返ります。
これが原因のバグは、いつも同じ顔をしています。

- 2 つの物体の距離を測ったら、まったく違う数字が出た
- 「敵のほうを向く」処理が、あさっての方向を向いた
- クリックした場所に物を置いたら、少しずれた場所に出た

すべて **「どこから見た座標か」を混ぜてしまった**ことが原因です。
`,
    },
    {
      kind: 'md',
      text: `
## 座標には、必ず「どこから見た」が付く

$(3,\\; 0,\\; 5)$ という数字だけでは、場所は決まりません。
**どの座標系から見て $(3, 0, 5)$ なのか**が要ります。

three で出てくるのは、主に次の 2 つです。

- **{{ローカル座標}}** … 親から見た座標。\`position\` \`rotation\` \`scale\` はすべてこれ
- **{{ワールド座標}}** … 世界の原点から見た座標。画面に出る場所を決めるのはこちら

親がいない物体（\`scene\` の直下）では、この 2 つが一致します。
**だから最初のうちは違いに気づかず、階層を作った瞬間に噴き出す**わけです。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '変数名に、どちらかを書いてしまう',
      text: `
この種のバグに効く対策は、実はコードの書き方です。

const pos = ... ではなく、const worldPos = ... と書く。
localTip、worldTip のように、変数名に座標系を入れてしまう。

たったこれだけで、取り違えは目で見えるようになります。
足し算や引き算をする直前に、両辺の名前を見比べる癖をつけてください。
名前が違っていたら、そこがバグです。
`,
    },
    {
      kind: 'md',
      text: `
## 行き来する 2 つの向き

ローカルとワールドは、行列で行き来できます。[](#/ch/m07-inverse)でやった話そのものです。

- **ローカル → ワールド** … \`matrixWorld\` を掛ける
- **ワールド → ローカル** … \`matrixWorld\` の**逆行列**を掛ける

three ではそれぞれ \`localToWorld()\` と \`worldToLocal()\` という名前で用意されています。
中でやっているのは、この掛け算だけです。
`,
    },
    {
      kind: 'formula',
      tex: 'p_{\\text{world}} = M_{\\text{world}}\\, p_{\\text{local}} \\qquad p_{\\text{local}} = M_{\\text{world}}^{-1}\\, p_{\\text{world}}',
      readAloud:
        'ローカル座標にワールド行列を掛けるとワールド座標になり、逆にワールド座標にその逆行列を掛けるとローカル座標に戻ります。2 つは行きと帰りの関係で、片方が分かればもう片方も分かります。',
      worked: {
        given:
          '物体が $(10,\\; 0,\\; 0)$ にあり、y 軸まわりに 90 度回っています。その物体から見た点 $(2,\\; 0,\\; 0)$ は、世界のどこでしょう。',
        steps: [
          { calc: '【ローカル → ワールド】まず回して、次に動かす' },
          { calc: '回転 : (2,0,0) を y 軸 90度 → (0, 0, -2)', note: '+x が -z へ倒れる' },
          { calc: '移動 : (0,0,-2) + (10,0,0) = (10, 0, -2)' },
          { calc: '【確かめ】逆をたどると戻るか' },
          { calc: '移動を戻す : (10,0,-2) - (10,0,0) = (0,0,-2)' },
          { calc: '回転を戻す : y 軸 -90度 → (2, 0, 0)', note: '元に戻った' },
        ],
        result:
          'ワールドでは **$(10,\\; 0,\\; -2)$** です。**$(12, 0, 0)$ ではありません。** 物体が回っているので、その物体にとっての「前 2」は、世界では別の向きを指しています。行きと帰りが往復できることも確かめました。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '「前に 2 進む」が期待どおりにならないとき',
      text: `
mesh.position.x += 2 は、ワールドの x 方向に 2 動かします。
物体がどちらを向いていようと関係ありません。

物体にとっての前へ進めたいなら、まず物体の向きを取り出して、
その向きに 2 を掛けて足す必要があります。

「キャラクタが横に滑る」「弾があさっての方向へ飛ぶ」の正体は、
たいていこの取り違えです。
`,
    },
    {
      kind: 'code',
      title: 'ローカルとワールドを行き来する',
      code: `import * as THREE from 'three';

// これは「親から見た位置」。親が動いても値は変わらない
console.log(child.position);

// 世界での位置。引数に受け皿の Vector3 を渡す作りになっている
const worldPos = new THREE.Vector3();
child.getWorldPosition(worldPos);

// 姿勢や大きさも同じように取り出せる
const worldQuat = new THREE.Quaternion();
child.getWorldQuaternion(worldQuat);

// ローカルの点をワールドへ（引数そのものが書き換わるので clone する）
const worldTip = child.localToWorld(new THREE.Vector3(0, 1, 0));

// ワールドの点を、別の物体から見た座標へ
const inOtherSpace = other.worldToLocal(worldTip.clone());

// 「物体にとっての前」に進める
const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(child.quaternion);
child.position.addScaledVector(forward, 2);

// 2 つの物体の距離は、必ずワールドどうしで測る
const a = new THREE.Vector3();
const b = new THREE.Vector3();
mesh1.getWorldPosition(a);
mesh2.getWorldPosition(b);
console.log(a.distanceTo(b));`,
    },
    {
      kind: 'md',
      text: `
## 「その場で」正しい値が欲しいとき

ひとつ落とし穴があります。**\`matrixWorld\` は、描画の直前にまとめて更新されます。**

親の \`position\` を書き換えた直後に子のワールド座標を読むと、
**まだ更新されていない、1 フレーム前の値**が返ります。

その場で正しい値が欲しいときは、先に更新を頼みます。

- \`object.updateWorldMatrix(true, false)\` … 自分と、その親をたどって更新
- \`scene.updateMatrixWorld(true)\` … シーン全体を更新（重いので毎フレームは避ける）

**「1 フレームだけ遅れる」種類のバグは、ほぼこれです。**
物がカクカク遅れて追従する、判定が一拍ずれる ― 見つけにくいので覚えておいてください。
`,
    },
    {
      kind: 'md',
      text: `
## どちらで考えるべきか

迷ったときの目安を置いておきます。

- **物を置く・動かす** … ローカル（\`position\` に代入する）
- **距離を測る・当たりを判定する・向きを比べる** … ワールド
- **画面のクリック位置から場所を求める** … ワールドで求めてから、必要ならローカルへ

原則は 1 つ ― **比べるときは、必ず同じ座標系に揃えてから比べる。**
足し算・引き算・内積・距離、どれも「同じ座標系の 2 つ」でなければ意味を持ちません。
`,
    },
  ],
  exercises: [
    {
      prompt: `物体が $(0,\\; 0,\\; 6)$ にあり、y 軸まわりに $-90$ 度回っています。
その物体から見た点 $(0,\\; 0,\\; 3)$ は、世界のどこですか。手で計算してください。

y 軸まわりの回転は $x' = x\\cos\\theta + z\\sin\\theta$、$z' = -x\\sin\\theta + z\\cos\\theta$ です。`,
      hint: 'まず回して、そのあと動かします（TRS の順）。',
      answer: `$\\theta = -90^\\circ$ なので $\\cos = 0$、$\\sin = -1$ です。

**回転** … $x' = 0 \\times 0 + 3 \\times (-1) = -3$、$z' = -0 \\times (-1) + 3 \\times 0 = 0$
→ $(-3,\\; 0,\\; 0)$

**移動** … $(-3, 0, 0) + (0, 0, 6) = (-3,\\; 0,\\; 6)$

答えは **$(-3,\\; 0,\\; 6)$** です。

物体は $-90$ 度回っているので、その物体にとっての「前（$+z$）」は
世界では $-x$ の方向を指しています。だから前に 3 進むと、世界では x が 3 減ります。

**$(0, 0, 9)$ にはなりません。** これが「前に進めたつもりが横に滑る」の正体です。`,
    },
    {
      prompt: `2 つの物体の距離を \`a.position.distanceTo(b.position)\` で測ったところ、
画面の見た目とまったく違う値が出ました。原因と直し方を答えてください。`,
      hint: '`position` はどちらの座標でしたか。2 つは同じ親を持っていますか。',
      answer: `**親が違う 2 つの物体の、ローカル座標どうしを比べている**からです。

たとえば車の中の車輪（車から見て $(0.8, 0.3, 1.2)$）と、
地面に置いた石（世界で $(0.8, 0, 1.2)$）を比べると、
数字はほとんど同じなのに、実際には車の位置ぶん離れています。

**ローカル座標は、親が違えば比較できません。**
測る前に、両方をワールドへ揃えてください。

なお 2 つが**同じ親**を持っているなら、ローカルどうしの比較でも正しく出ます。
同じ座標系の中の話になるからです。ただし「たまたま同じ親だから動いている」コードは、
あとで階層を変えたときに静かに壊れます。**測るときはワールドに揃える**を習慣にしてください。`,
      answerCode: `const pa = new THREE.Vector3();
const pb = new THREE.Vector3();
a.getWorldPosition(pa);
b.getWorldPosition(pb);
console.log(pa.distanceTo(pb));`,
    },
    {
      prompt: `\`parent.position.x = 100\` と書いた直後に \`child.getWorldPosition(v)\` を呼んだところ、
100 が反映されていない値が返りました。なぜですか。`,
      hint: '`matrixWorld` は、いつ計算されますか。',
      answer: `**\`matrixWorld\` はまだ更新されていない**からです。

three は毎フレームの描画直前に、シーン全体の \`matrixWorld\` をまとめて計算します。
\`position\` に代入しただけでは、その値はまだ行列に反映されていません。
\`getWorldPosition\` は行列から読み出すので、**1 フレーム前の値**が返ります。

その場で正しい値が欲しいときは、先に更新を頼みます。

引数の \`(true, false)\` は「親はたどる・子はたどらない」の意味です。
自分のワールド座標を知りたいだけなら、子まで更新する必要はありません。

**この症状は「一拍遅れて追従する」という形で出ます。**
毎フレーム走るコードだと 1 フレームぶんのずれなので、動いているときだけカクつきます。`,
      answerCode: `parent.position.x = 100;
child.updateWorldMatrix(true, false);   // 親をたどって、いま計算する
child.getWorldPosition(v);              // これで 100 が入る`,
    },
  ],
  quiz: [
    {
      q: '`mesh.position` はどの座標系の値ですか。',
      choices: [
        '親から見たローカル座標',
        '世界から見たワールド座標',
        'カメラから見た座標',
        '画面上のピクセル座標',
      ],
      answer: 0,
      explain:
        '`position` `rotation` `scale` はすべてローカルです。親がいない物体ではワールドと一致するので、階層を作るまで違いに気づかないのが厄介なところです。',
    },
    {
      q: 'ワールド座標をローカル座標に直すには、何を掛けますか。',
      choices: [
        'matrixWorld の逆行列',
        'matrixWorld そのもの',
        '親の position',
        '単位行列',
      ],
      answer: 0,
      explain:
        '`localToWorld` と `worldToLocal` は行きと帰りの関係で、後者が逆行列を使います。逆行列が「変換を巻き戻す装置」だったことの、いちばん実用的な使い道です。',
    },
    {
      q: '親の position を変えた直後にワールド座標を読むと、古い値が返ります。どうしますか。',
      choices: [
        '`updateWorldMatrix(true, false)` を先に呼ぶ',
        '1 フレーム待つ',
        'position を 2 回代入する',
        'ワールド座標は読めないので諦める',
      ],
      answer: 0,
      explain:
        '`matrixWorld` は描画直前にまとめて更新されるので、代入した直後はまだ反映されていません。「一拍遅れて追従する」バグの多くがこれです。',
    },
  ],
};
