import type { Chapter } from '../types.ts';

export const chapterW12: Chapter = {
  slug: 'w12-transparent',
  part: 'threejs',
  number: 12,
  title: '透明 ― 描く順番という難問',
  goal: '透明が「順番の問題」であることが分かり、消し合いやちらつきを自分で直せるようになります。',
  requires: ['w11-pbr'],
  threeApis: [
    'Material.transparent',
    'Material.opacity',
    'Material.depthWrite',
    'Material.alphaTest',
    'Object3D.renderOrder',
    'Material.blending',
  ],
  mathRecall: [{ slug: '08-interp', note: '半透明の合成は、色どうしの lerp そのもの' }],
  blocks: [
    {
      kind: 'md',
      text: `
## 2 つ書かないと、透けない

まず書き方から。透明にするには **2 つ**設定が要ります。

- \`transparent: true\` … 透明として扱うことを宣言する
- \`opacity: 0.35\` … どれくらい透けるか

**片方だけでは効きません。** \`opacity\` だけ書いても、まったく透けません。
これは three でいちばんよくある「書いたのに効かない」です。

\`transparent\` は「宣言」で、\`opacity\` は「量」です。
宣言が無ければ、three はそのマテリアルを不透明なものとして扱います。

そして**宣言した瞬間から、まったく別の描かれ方をします。**
ここからが、この章の本題です。
`,
    },
    {
      kind: 'md',
      text: `
## 不透明なものは、順番が要らない

なぜ透明だけが特別なのか。**不透明なものがどう描かれているか**を先に見ます。

three は物体を描くとき、画素ごとに「そこに何があるか」の**奥行き**を記録します。
これを**深度バッファ**と呼びます。

- ある画素を塗ろうとする
- そこに記録されている奥行きより**手前**なら → 塗って、奥行きを更新
- **奥**なら → 何もしない

**この仕組みのおかげで、描く順番はどうでもよくなります。**
奥のものを先に描いても、あとから手前のものが上書きします。
手前を先に描いても、奥のものは「奥だから」と弾かれます。

**どの順で描いても、結果は同じ。** これが深度バッファの偉いところです。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '不透明は上書き、透明は混ぜる',
      text: `
不透明な絵の具は、下に何が塗ってあっても上から塗りつぶせます。
だから塗る順番を気にする必要がありません。

半透明の絵の具は、下の色と混ざります。
青の上に薄い赤を塗るのと、赤の上に薄い青を塗るのでは、違う色になります。

「混ぜる」という操作は、順番を入れ替えられません。
透明の問題は、突き詰めるとこれだけです。
`,
    },
    {
      kind: 'formula',
      tex: 'C_{\\text{out}} \\;=\\; \\alpha\\, C_{\\text{src}} + (1 - \\alpha)\\, C_{\\text{dst}}',
      readAloud:
        'いま塗ろうとしている色と、すでにそこにある色を、不透明度で混ぜます。これは [](#/ch/08-interp) の lerp とまったく同じ式です。ただし混ぜる順番を変えると、結果が変わります。',
      worked: {
        given:
          '**赤** $(1,\\,0,\\,0)$ と**青** $(0,\\,0,\\,1)$ の板を、どちらも $\\alpha = 0.5$ で重ねます。**背景は黒。** 順番を変えると、どう変わるでしょう。',
        steps: [
          { calc: '【赤が奥・青が手前】' },
          { calc: '  赤を黒に : 0.5x(1,0,0) + 0.5x(0,0,0) = (0.5, 0, 0)' },
          { calc: '  青を上に : 0.5x(0,0,1) + 0.5x(0.5,0,0)' },
          { calc: '          = (0.25, 0, 0.5)', note: '青が濃い' },
          { calc: '【青が奥・赤が手前】' },
          { calc: '  青を黒に : (0, 0, 0.5)' },
          { calc: '  赤を上に : 0.5x(1,0,0) + 0.5x(0,0,0.5)' },
          { calc: '          = (0.5, 0, 0.25)', note: '赤が濃い' },
        ],
        result:
          '**$(0.25,\\,0,\\,0.5)$ と $(0.5,\\,0,\\,0.25)$ ― まったく違う色**になりました。**手前にあるほうの色が濃く出ます。** だから three は、透明なものを**奥から順に**描かなければなりません。$\\alpha$ 合成は交換法則が成り立たないので、順番が結果を決めてしまいます。**そして「奥から順」を決められない配置** ― 交差した 2 枚の板、入れ子になった球 ― では、**正しい絵が原理的に描けません。**',
      },
    },
    {
      kind: 'md',
      text: `
## three が実際にやっていること

three は毎フレーム、こう描いています。

1. **不透明なものを、手前から順に描く**（手前を先に描くと、奥のものが早く弾かれて速い）
2. **透明なものを、奥から順に描く**（混ぜるので、順番が結果を決める）

2 の並べ替えは、**物体ごと**におこなわれます。
各物体の中心とカメラの距離を測って、遠い順に並べるだけです。

**ここに 2 つの限界があります。**

- **物体の中心でしか比べられない。** 交差した 2 枚の板は、
  「どちらが手前か」が場所によって違うので、1 つの順番では表せません
- **1 つの物体の中は並べ替えられない。** 半透明な球は、
  自分の裏側の面と表側の面を正しい順で描けません
`,
    },
    {
      kind: 'sandbox',
      title: '透明が消し合うところと、直したところ',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ここを true にすると、右側だけ直ります
const FIX = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.2, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(
  new THREE.DirectionalLight(0xffffff, 2.4).translateY(4),
  new THREE.HemisphereLight(0x99bbff, 0x101020, 0.8),
);

// 半透明の殻を 3 枚、入れ子にする。中心が同じなので前後が決まらない
function makeOrb(x, fix) {
  const group = new THREE.Group();
  group.position.x = x;

  const shells = [
    [1.30, 0x4fd6ff],   // 外
    [0.95, 0xffd166],   // 中
    [0.60, 0xff6b8a],   // 内
  ];

  for (const [radius, color] of shells) {
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(radius, 40, 26),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.2,
        transparent: true,      // 宣言
        opacity: 0.45,          // 量
        side: THREE.DoubleSide, // 内側の面も見せる
        depthWrite: !fix,       // ← ここが直しどころ
      }),
    ));
  }

  return group;
}

scene.add(makeOrb(-2.0, false));   // 左：depthWrite そのまま
scene.add(makeOrb(2.0, FIX));      // 右：FIX が true なら depthWrite: false

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**1 行目の `FIX` を `true` にして実行してください。** 左は 3 枚の殻のうち手前のものしか見えず、内側の 2 枚が消えています。右は 3 層がちゃんと重なって見えます。差は `depthWrite` の 1 つだけです。ドラッグして回すと、左の消え方が向きによって変わるのも見えます。',
    },
    {
      kind: 'md',
      text: `
## depthWrite ― 透明なものは、奥行きを書かない

左の球で何が起きていたか。

**いちばん手前の殻が、奥行きを書き込んでいました。**

外側の殻を描くと、その画素の奥行きが「外側の殻の位置」に更新されます。
すると、そのあとに描かれる**内側の 2 枚**は「奥だから」と弾かれます。
同じ殻の裏側の面も、同じ理由で消えます。

**透明なのに、後ろのものを遮っている。** これが消し合いの正体です。

直し方は \`depthWrite: false\` です。
「奥行きは読むけれど、書かない」状態になり、後ろのものが弾かれなくなります。

- **\`depthTest\`**（既定 true）… 奥行きを**読む**。不透明なものに隠れるために必要
- **\`depthWrite\`** … 奥行きを**書く**。透明なものは false にする

**半透明なものには、ほぼ常に \`depthWrite: false\`** と覚えて構いません。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'depthWrite: false にも代償があります',
      text: `
奥行きを書かなくなるので、透明どうしの前後関係は
「物体の中心の距離」だけで決まります。

だから交差した 2 枚の半透明の板は、やはり正しく描けません。
ちらついたり、視点を回した瞬間に前後がひっくり返ったりします。

これは three の不出来ではなく、この描き方（ラスタライズ）の原理的な限界です。
完全に解くには重い手法が要るので、実務では次の逃げ方を選びます。
`,
    },
    {
      kind: 'md',
      text: `
## 逃げ方 4 つ

順番が決まらない透明は、**正面から解かずに避ける**のが実務です。

**1. alphaTest ― 透明をやめて、穴にする**

葉っぱ、金網、髪の毛のように「透けている」のではなく「**穴が空いている**」ものは、
半透明にする必要がありません。

\`alphaTest: 0.5\` を指定すると、$\\alpha$ がその値未満の画素を**完全に捨てます。**
捨てられた画素は存在しないのと同じなので、**不透明として扱えます。**
順番の問題が丸ごと消えます。

**2. renderOrder ― 順番を手で指定する**

\`mesh.renderOrder = 1\` で、three の並べ替えより優先して順番を決められます。
「この霧は必ず最後」のように、答えが分かっている場合に使います。

**3. 加算合成 ― 順番に依存しない混ぜ方にする**

光・炎・魔法のエフェクトは、{{加算ブレンド}}（\`AdditiveBlending\`）で作れます。
足し算は順番を入れ替えても結果が同じなので、**そもそも問題が起きません。**

**4. そもそも重ねない**

いちばん強い手です。半透明のものを 2 つ以上重ねなければ、順番は問題になりません。
`,
    },
    {
      kind: 'code',
      title: '4 つの逃げ方',
      code: `import * as THREE from 'three';

// 1. 穴として扱う（葉・金網・髪）。順番の問題が消える
const leaf = new THREE.MeshStandardMaterial({
  map: leafTexture,
  alphaTest: 0.5,          // これ未満の画素は捨てる
  side: THREE.DoubleSide,
  // transparent は書かない。不透明として扱われる
});

// 2. 順番を手で決める
water.renderOrder = 1;     // 大きいほど後に描かれる
fog.renderOrder = 2;

// 3. 加算合成。足し算なので順番に依存しない
const flame = new THREE.MeshBasicMaterial({
  color: 0xff8844,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  // 暗いところは足しても変わらないので、黒が自然に透ける
});

// 4. 半透明の定番の組み合わせ
const glassPane = new THREE.MeshStandardMaterial({
  color: 0x88ccff,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,       // 透明なら、ほぼ常にこれ
  side: THREE.DoubleSide,
});

// 完全に消したいだけなら、透明より visible のほうが軽い
mesh.visible = false;`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'alphaTest は、影も正しくします',
      text: `
半透明なものは、影の計算でも扱いが面倒です。
「半分だけ影を落とす」ということができないので、たいてい全部落とすか、全部落とさないかになります。

alphaTest なら「穴の部分は光を通す」がそのまま影にも効きます。
木の葉ごしの木漏れ日は、この方法でしか作れません。

透明にする前に、まず「これは穴ではないか」と考えてください。
`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスの \`FIX\` を \`true\` にして、左右を見比べてください。
そのうえで、**左の球で何が起きているか**を説明してください。`,
      hint: '外側の殻を描いたあと、その内側にあるものはどう扱われますか。',
      answer: `**外側の殻が、自分の後ろにあるものを全部遮っています。**

順を追うと、こうです。

1. 3 枚の殻はすべて中心が同じなので、three の「中心の距離で並べ替える」が効かない
2. たまたま**外側の殻が先に**描かれる
3. このとき \`depthWrite: true\`（既定）だと、**その画素の奥行きが「外側の殻の位置」に更新される**
4. 続いて内側の 2 枚を描こうとすると、「もう手前に何かある」と判定されて**まるごと捨てられる**

結果、シアンの殻 1 枚しか見えません。**アンバーとピンクは描かれてすらいません。**

**視点を回すと消え方が変わる**のも、これで説明できます。
どの面が先に描かれるかは、面の向きとカメラの位置で変わるからです。

**直し方は \`depthWrite: false\`。**
「奥行きは読むが、書かない」状態になります。

- **読む（\`depthTest\`）は残す** … 不透明な壁の後ろに回れば、ちゃんと隠れてほしい
- **書く（\`depthWrite\`）だけやめる** … 自分の後ろのものを遮らない

**半透明なら、ほぼ常に \`depthWrite: false\`。** これは定番の組み合わせです。`,
    },
    {
      prompt: `**緑** $(0,\\,1,\\,0)$ と**赤** $(1,\\,0,\\,0)$ の板を、どちらも $\\alpha = 0.6$ で重ねます。
背景は黒。**緑が奥・赤が手前**のときの最終的な色を、手で計算してください。
順番を逆にすると、どうなりますか。`,
      hint: '$C_{\\text{out}} = \\alpha C_{\\text{src}} + (1-\\alpha) C_{\\text{dst}}$ を 2 回使います。',
      answer: `**$(0.6,\\; 0.24,\\; 0)$** です。逆順なら **$(0.24,\\; 0.6,\\; 0)$**。

**緑が奥・赤が手前**

奥から描くので、まず緑を黒の上に。

$0.6 \\times (0,1,0) + 0.4 \\times (0,0,0) = (0,\\; 0.6,\\; 0)$

次に赤をその上に。

$0.6 \\times (1,0,0) + 0.4 \\times (0,\\,0.6,\\,0) = (0.6,\\; 0.24,\\; 0)$

**赤が奥・緑が手前**

$0.6 \\times (1,0,0) + 0.4 \\times (0,0,0) = (0.6,\\; 0,\\; 0)$

$0.6 \\times (0,1,0) + 0.4 \\times (0.6,\\,0,\\,0) = (0.24,\\; 0.6,\\; 0)$

**手前の色が $0.6$、奥の色が $0.24$。** きれいに入れ替わりました。

**なぜ順番が効くのか** … $\\alpha$ 合成は $\\text{lerp}$ で、
**交換法則が成り立たない**からです。$\\text{lerp}(a, b, t) \\neq \\text{lerp}(b, a, t)$。

**足し算なら成り立ちます。** $a + b = b + a$。
だから \`AdditiveBlending\` は順番に依存せず、
炎や光のエフェクトで並べ替えの心配が要りません。
**「順番が問題になるなら、順番に依存しない混ぜ方に変える」** ―
これが逃げ方 3 の理屈です。`,
    },
    {
      prompt: `木の葉を、1 枚の板に葉の絵を貼って作りたい。
葉の外側は透明にします。\`transparent: true, opacity: 1\` ではなく
\`alphaTest: 0.5\` を使うべきなのはなぜですか。**3 つ**挙げてください。`,
      hint: '木には葉が何千枚もあります。',
      answer: `**1. 順番の問題が丸ごと消える**

\`alphaTest\` は「$\\alpha$ が $0.5$ 未満の画素を**完全に捨てる**」処理です。
捨てられた画素は描かれないので、その面は**不透明として扱えます。**

つまり深度バッファがふつうに働き、並べ替えが要りません。
**葉が何千枚あっても、順番の心配がゼロ**です。

\`transparent: true\` だと、three は毎フレーム何千枚を距離で並べ替えます。
しかも重なった葉どうしは、どうやっても正しく描けません。

**2. 影が正しく落ちる**

半透明なものは影の計算で扱いが面倒で、たいてい「全部落とす」か「全部落とさない」になります。

\`alphaTest\` なら「穴の部分は光が通る」がそのまま影に効きます。
**木の葉ごしの木漏れ日は、この方法でしか作れません。**

**3. 速い**

並べ替えのコストが無く、捨てられた画素はそれ以降の計算（ライティング）もしません。
数千枚の葉では、これが効きます。

**使い分けの基準**

- **穴が空いている**（葉・金網・髪・柵）→ \`alphaTest\`
- **本当に透けている**（ガラス・水・煙・霧）→ \`transparent\`

**「透けている」と「穴が空いている」は別物**です。
まず「これは穴ではないか」と考えてください。`,
      answerCode: `// 葉。穴として扱う
const leafMat = new THREE.MeshStandardMaterial({
  map: leafTexture,
  alphaTest: 0.5,
  side: THREE.DoubleSide,
  // transparent は書かない
});

leafMesh.castShadow = true;      // 葉の形どおりの影が落ちる

// 境目がギザギザになるときは、この 2 つで和らげる
leafMat.alphaTest = 0.3;                 // 少し下げる
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));`,
    },
  ],
  quiz: [
    {
      q: '`opacity: 0.5` を指定したのに、まったく透けません。足りないのはどれですか。',
      choices: ['`transparent: true`', '`side: THREE.DoubleSide`', 'ライトの追加', '`depthTest: false`'],
      answer: 0,
      explain:
        'opacity は「transparent が true のときにどれくらい透けるか」の指定です。宣言が無いと不透明のまま扱われます。透明と宣言した瞬間から、描かれ方そのものが変わります。',
    },
    {
      q: '半透明な球の内側の面が抜け落ちます。直すのはどれですか。',
      choices: [
        '`depthWrite: false`',
        '`depthTest: false`',
        '`side: THREE.FrontSide`',
        '`opacity` を上げる',
      ],
      answer: 0,
      explain:
        '透明な面が奥行きを書き込むと、その後ろに描かれるものが「奥だから」と弾かれます。読む（depthTest）は残し、書く（depthWrite）だけをやめさせます。',
    },
    {
      q: '木の葉のように「穴が空いている」ものに `alphaTest` が向いている理由はどれですか。',
      choices: [
        '不透明として扱えるので、並べ替えが不要になり、影も正しく落ちる',
        '色がきれいになる',
        'メモリが減る',
        '`transparent` が使えないから',
      ],
      answer: 0,
      explain:
        '閾値未満の画素を完全に捨てるので、その面は不透明と同じ扱いになります。深度バッファがふつうに働き、数千枚の葉でも順番の心配が要りません。木漏れ日の影もこの方法でしか作れません。',
    },
  ],
};
