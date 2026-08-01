import type { Chapter } from '../types.ts';

export const chapterT10: Chapter = {
  slug: 't10-scene-graph',
  part: 'threejs',
  number: 38,
  title: 'シーンを組み立てる ― Group で、まとまりを作る',
  goal: 'Group で意味のまとまりを作れるようになり、回転の中心をずらす・親を差し替えるといった定番の手が使えるようになります。',
  requires: ['w37-asset-cost', '09-hierarchy'],
  threeApis: [
    'Group',
    'Object3D.add',
    'Object3D.attach',
    'Object3D.remove',
    'Object3D.removeFromParent',
    'Object3D.matrixWorld',
    'Object3D.updateMatrixWorld',
    'Object3D.localToWorld',
  ],
  mathRecall: [
    { slug: '09-hierarchy', note: '親の変換は子に丸ごとかぶさる' },
    { slug: '06-matrix', note: 'ワールド行列は、親のものとの積' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## シーンは木

Three.js のシーンは、根がひとつの**木**です。\`Scene\` が根で、
その下にオブジェクトがぶら下がり、さらにその下にも……という入れ子になります。

[](#/ch/09-hierarchy)でやったとおり、
**親の変換は子に丸ごとかぶさります**。この性質があるからこそ、
「車体を動かせば車輪もついてくる」が無料で手に入ります。

シーンが小さいうちは、何も考えずに \`scene.add()\` していて構いません。
問題になるのは、ものが増えてからです。
`,
    },
    {
      kind: 'md',
      text: `
## Group ― 意味のまとまりを作る

\`THREE.Group\` は形を持たない入れ物です。ただの入れ物ですが、効き目は大きい。

- **まとめて動かす・消す** … 部品ごとに触らなくてよくなります
- **回転の中心をずらす** … 物体の回転は必ず自分の原点まわりですが、
  Group の中でずらして置けば、**任意の点を中心に回せます**
- **読み込んだものに触らずに直す** … [](#/ch/w35-fit-model)でやった手です

**「一緒に動くもの」「一緒に消えるもの」は同じ Group に入れる。**
この基準で分けておくと、後から困りません。

**中身が空でも構いません。** あとで足すつもりの \`Group\` を先に置いておけば、
参照が先に決まるので、コードの見通しがよくなります。
`,
    },
    {
      kind: 'sandbox',
      title: 'Group でまとめる ― 隊列ごと回す',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(6, 4.2, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.3, 0);

const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(4, 6, 3);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.6));
scene.add(new THREE.GridHelper(16, 16, 0x3a3a5c, 0x26263c));

// 使い回すジオメトリとマテリアル（1 つずつで足りる）
const bodyGeo = new THREE.BoxGeometry(2, 0.7, 1);
const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 20);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.4 });
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x2b3040, roughness: 0.8 });

function makeCar(x) {
  // 車 1 台ぶんのまとまり。これを動かせば全部ついてくる
  const car = new THREE.Group();
  car.position.x = x;

  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.85;
  car.add(body);

  // 車輪だけ独立して回せるように、もう 1 枚まとめる
  const wheels = new THREE.Group();
  for (const [wx, wz] of [[-0.7, 0.6], [0.7, 0.6], [-0.7, -0.6], [0.7, -0.6]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.35, wz);
    wheels.add(wheel);
  }
  car.add(wheels);

  // あとで触りたいものは、返すときに持たせておく
  car.userData.wheels = wheels;
  return car;
}

// 隊列。3 台まとめて 1 つの入れ物に入れる
const fleet = new THREE.Group();
const cars = [makeCar(-3), makeCar(0), makeCar(3)];
fleet.add(...cars);
scene.add(fleet);

// 旗ざお。棒そのものは回さない
const pole = new THREE.Mesh(
  new THREE.CylinderGeometry(0.05, 0.05, 3.2, 10),
  new THREE.MeshStandardMaterial({ color: 0xc8ccd8, roughness: 0.6 }),
);
pole.position.y = 1.6;
fleet.add(pole);

// 中身が空の Group を先に置いておく使い方。これが旗の回転の中心になる
const flagPole = new THREE.Group();
flagPole.position.set(0, 2.55, 0);
fleet.add(flagPole);
const flag = new THREE.Mesh(
  new THREE.PlaneGeometry(1.5, 0.9),
  new THREE.MeshStandardMaterial({ color: 0xffd166, side: THREE.DoubleSide, roughness: 0.6 }),
);
flag.position.x = 0.75;             // 旗ざおの右に出す = 左端が回転の中心になる
flagPole.add(flag);

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const time = clock.getElapsedTime();

  // 隊列ごと回す。子は何も知らないままついてくる
  fleet.rotation.y = time * 0.3;

  // 車輪だけ、それぞれの車の中で回す
  for (const car of cars) car.userData.wheels.rotation.x = time * 4;

  // 旗は、旗ざお（左端）を中心に揺れる
  flagPole.rotation.y = Math.sin(time * 1.6) * 0.6;

  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**$3$ つの回転が、$3$ つの階層で同時に動いています。** `fleet` が全体を回し、その中で `wheels` が回り、`flagPole` が揺れる ― どれも自分の親のことを知りません。旗は板の中心ではなく**左端を軸に**振れています。`flag.position.x` を $0$ にすると、真ん中を軸に回るようになります。',
    },
    {
      kind: 'md',
      text: `
## 回転の中心をずらす

物体の回転は、**必ず自分の原点まわり**です。これは変えられません。

扉を蝶番で開きたい、腕を肩から振りたい ―
どちらも「原点ではないところ」を中心に回したい場面です。

**やり方は $1$ つだけ。** 中心にしたい点に \`Group\` を置き、
その中で物体を**ずらして**入れます。あとは \`Group\` を回すだけです。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathbf{p}_{\\text{world}} \\;=\\; \\mathbf{c} + R\\,(\\mathbf{p} - \\mathbf{c})',
      readAloud:
        '点 $\\mathbf{c}$ を中心に回すというのは、**$\\mathbf{c}$ を原点に持ってきて（$\\mathbf{p} - \\mathbf{c}$）、回して（$R$）、戻す（$+\\,\\mathbf{c}$）**ということです。Group に「位置 $\\mathbf{c}$」、子に「位置 $\\mathbf{p} - \\mathbf{c}$」を入れれば、three がこの式をそのまま実行してくれます。',
      worked: {
        given:
          '幅 $1$ の扉があります。中心は原点、**蝶番は左端の $x = -0.5$**。この扉を蝶番まわりに **$y$ 軸で $90°$** 開いたとき、扉の中心はどこへ行くでしょうか。',
        steps: [
          { calc: 'c = (-0.5, 0, 0)', note: '蝶番＝回転の中心' },
          { calc: 'p = (0, 0, 0)', note: '扉の中心' },
          { calc: 'p - c = (0.5, 0, 0)', note: 'Group の中に入れる位置' },
          { calc: 'y 軸まわり 90 度の回転' },
          { calc: "  x' = x cos + z sin = 0" },
          { calc: "  z' = -x sin + z cos = -0.5" },
          { calc: 'R(p - c) = (0, 0, -0.5)' },
          { calc: 'world = c + (0, 0, -0.5)' },
          { calc: '      = (-0.5, 0, -0.5)' },
        ],
        result:
          '扉の中心は **$(-0.5,\\; 0,\\; -0.5)$** へ移ります。**蝶番からの距離は $0.5$ のまま** ― ちゃんと蝶番を軸に回っています。コードで書くと $3$ 行です。「\\`Group\\` を $x = -0.5$ に置き、扉を $x = +0.5$ に入れ、\\`Group\\` の \\`rotation.y\\` を回す」。**式を自分で書く必要はありません** ― 親子関係が、この式そのものだからです。',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'ジオメトリをずらす手もある',
      text: `
geometry.translate(0.5, 0, 0) と書くと、頂点そのものが動きます。

Group を増やさずに済むぶん軽く、部品の数が多いときは有利です。

ただし後から中心を変えられません。
また、そのジオメトリを共有している他のメッシュも全部ずれます。

迷ったら Group を使ってください。あとから直せるほうが、たいてい安上がりです。
`,
    },
    {
      kind: 'md',
      text: `
## 親を差し替える ― add と attach

**\`parent.add(child)\`** は、子の \`position\` や \`rotation\` を**そのまま**にして
親を付け替えます。親が違えば、当然**見た目は飛びます。**

**\`parent.attach(child)\`** は、**見た目を保ったまま**親を付け替えます。
新しい親の中で同じワールド位置になるよう、\`position\` などを計算し直してくれます。

- 拾ったものを手に持たせる … \`hand.attach(item)\`
- 手放して床に置く … \`scene.attach(item)\`

**この $2$ つを取り違えると、物が瞬間移動します。**
「掴んだ瞬間に足元へ飛ぶ」のは、たいてい \`add\` を使っているからです。
`,
    },
    {
      kind: 'code',
      title: 'add と attach の違い',
      code: `import * as THREE from 'three';

// 手（プレイヤーの子）は、ワールドの (2, 1.4, 0) にあるとする
const hand = new THREE.Object3D();
player.add(hand);

// 床に落ちているアイテム。ワールドの (5, 0, 3)
const item = new THREE.Mesh(geo, mat);
item.position.set(5, 0, 3);
scene.add(item);

// --- add ―― position はそのまま。手の中で (5, 0, 3) の意味になる
hand.add(item);
// → 見た目が手から遠く離れたところへ飛ぶ

// --- attach ―― 見た目を保つ。position が自動で計算し直される
hand.attach(item);
// → その場に留まったまま、手の子になる

// 手放すときも attach
scene.attach(item);

// なお attach は matrixWorld を使うので、
// 直前に position を書き換えたなら更新しておく
player.updateMatrixWorld(true);`,
    },
    {
      kind: 'md',
      text: `
## どう分けるか

木の形は自由ですが、**迷わない基準**が $2$ つあります。

**$1$. 一緒に動くものは、同じ親の下に。**
車体と車輪、人と持ち物、部屋と家具。
**「これを動かしたとき、一緒に動いてほしいか」**だけで決まります。

**$2$. 一緒に消えるものは、同じ親の下に。**
場面を切り替えるとき、\`removeFromParent()\` を $1$ 回で済ませられます。

**逆に、混ぜてはいけないもの**があります。

**見た目の階層と、意味の階層を混ぜないこと。**
「回転の中心をずらすために作った \`Group\`」に、ゲームの状態を持たせない。
あとで見た目を変えたくなったとき、状態まで巻き込んで壊れます。

見た目のための \`Group\` は**見た目のためだけ**に使ってください。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '深くしすぎない',
      text: `
ワールド行列は、根から順に親のものを掛けて作られます。

深さ 20 の木にぶら下がったメッシュは、
毎フレーム 20 個ぶんの行列の積を経て位置が決まります。

意味のあるまとまりのために深くするのは正しい。
ただ「なんとなく Group で包む」を繰り返すと、
気づくと 10 段になっていて、原因の分かりにくい遅さになります。

3〜5 段でたいていの構造は表せます。それ以上になったら、一度見直してください。
`,
    },
    {
      kind: 'md',
      text: `
## 動かないなら、行列を疑う

\`position\` を書き換えた**直後**に \`getWorldPosition()\` を呼ぶと、
**古い値が返ってきます。**

\`matrixWorld\` が更新されるのは、次に \`render()\` が呼ばれたときだからです。

\`object.updateMatrixWorld(true)\` を挟めば、その場で更新できます。
[](#/ch/w35-fit-model)で \`Box3\` を当てる前に呼んだのと同じ理由です。

**毎フレーム呼ぶ必要はありません。**「書き換えた直後に読む」ときだけです。
`,
    },
  ],
  exercises: [
    {
      prompt: `幅 $2$ の扉があります。中心は原点、**蝶番は左端の $x = -1$**。

1. \`Group\` と扉の \`position\` に、それぞれ何を入れますか。
2. 蝶番まわりに $y$ 軸で $90°$ 開いたとき、扉の**右端**（元の $x = +1$）はどこへ行きますか。`,
      hint: '$\\mathbf{p}_{\\text{world}} = \\mathbf{c} + R(\\mathbf{p} - \\mathbf{c})$ です。',
      answer: `**1. Group に $(-1, 0, 0)$、扉に $(1, 0, 0)$。2. 右端は $(-1,\\; 0,\\; -2)$。**

**1 ― 置き方**

回転の中心にしたいのは蝶番なので、\`Group\` をそこへ置きます。

$\\mathbf{c} = (-1, 0, 0)$

扉は、その \`Group\` の中で「蝶番から見た位置」に入れます。

$\\mathbf{p} - \\mathbf{c} = (0,0,0) - (-1,0,0) = (1, 0, 0)$

**足すと元の位置に戻る**ことを確かめてください。$-1 + 1 = 0$。合っています。

**2 ― 右端の行き先**

扉の右端は、元のワールド座標で $(1, 0, 0)$ です。

$\\mathbf{p} - \\mathbf{c} = (1,0,0) - (-1,0,0) = (2, 0, 0)$

$y$ 軸まわりに $90°$ 回します。

$x' = x\\cos\\theta + z\\sin\\theta = 2 \\times 0 + 0 \\times 1 = 0$

$z' = -x\\sin\\theta + z\\cos\\theta = -2 \\times 1 + 0 \\times 0 = -2$

$R(\\mathbf{p} - \\mathbf{c}) = (0, 0, -2)$

戻します。

$\\mathbf{c} + (0,0,-2) = (-1,\\; 0,\\; -2)$

**確かめ**

蝶番 $(-1, 0, 0)$ から右端 $(-1, 0, -2)$ までの距離は $2$。
回す前も $(-1,0,0)$ から $(1,0,0)$ で距離 $2$ でした。**変わっていません。**

回転で距離が変わったら、どこかを間違えています。**必ずこれで検算してください。**

**なぜ $z$ が負なのか**

three の $y$ 軸まわりの回転は、**上から見て反時計回り**が正です。
$+x$ を向いていた扉は $-z$ のほうへ開きます。

符号で迷ったら、**小さい角度（$10°$ など）を入れて、どちらへ動くか見る**のがいちばん早い。`,
      answerCode: `import * as THREE from 'three';

const hinge = new THREE.Group();
hinge.position.x = -1;
scene.add(hinge);

const door = new THREE.Mesh(new THREE.BoxGeometry(2, 2.2, 0.1), mat);
door.position.x = 1;       // 蝶番から見た、扉の中心
hinge.add(door);

// 開く
hinge.rotation.y = Math.PI / 2;`,
    },
    {
      prompt: `床に落ちているアイテム（ワールド座標 $(5, 0, 3)$）を、
プレイヤーの手（ワールド座標 $(2,\\; 1.4,\\; 0)$）に持たせます。

\`hand.add(item)\` と書きました。**何が起きますか。** 正しくはどう書きますか。`,
      hint: '`add` は子の `position` を書き換えますか。',
      answer: `**アイテムが手から遠く離れたところへ瞬間移動します。**

**何が起きるか**

\`add\` は親子のつながりを変えるだけで、**\`position\` には触りません。**

アイテムの位置は $(5, 0, 3)$ のまま。
ところが、その値の**意味**が変わります ―
「ワールドでの $(5,0,3)$」から「**手から見た** $(5,0,3)$」へ。

だから新しいワールド位置は、手が回っていなければ

$(2,\\; 1.4,\\; 0) + (5,\\; 0,\\; 3) = (7,\\; 1.4,\\; 3)$

**手から $5.8$ ほど離れたところ**に飛びます
（手が回転していれば、もっと分かりにくい場所へ行きます）。

**正しくは \`attach\`**

\`attach\` は「**見た目を保ったまま**親を付け替える」ものです。
新しい親の中で同じワールド位置になるよう、位置と回転を計算し直してくれます。

アイテムはその場に留まったまま、手の子になります。
そのあと手を動かせば、ちゃんとついてきます。

**手放すときも \`attach\`**

\`scene.attach(item)\` と書けば、その場に置いたまま親をシーンに戻せます。

\`scene.add(item)\` にすると、こんどは**手から見た座標がワールド座標として解釈され**、
また飛びます。**掴むときも放すときも \`attach\`** と覚えてください。

**落とし穴**

\`attach\` は \`matrixWorld\` を見ます。
直前にプレイヤーの位置を書き換えたなら、
\`player.updateMatrixWorld(true)\` を挟んでください。

そうしないと、**$1$ フレーム前の位置**を基準に計算されます。`,
      answerCode: `// 掴む ― その場に留まったまま、手の子になる
player.updateMatrixWorld(true);
hand.attach(item);

// 放す ― その場に留まったまま、シーンの子に戻る
scene.attach(item);`,
    },
    {
      prompt: `敵キャラを作ります。次の $5$ つをどう組みますか。**木の形を書いてください。**

体・体力バー（頭の上に浮かぶ板）・持っている剣・足元の影の丸・「いま何 HP か」という数値

**どこを 1 つの \`Group\` にまとめ、何を \`Group\` に入れないか**を、理由とともに書いてください。`,
      hint: '「一緒に動くか」「一緒に消えるか」と、「それは見た目か」で分けます。',
      answer: `**入れ物は $2$ つ。数値は木に入れません。**

**木の形**

- \`enemy\`（Group）
  - \`body\`（Mesh）
  - \`healthBar\`（板）… 頭の上
  - \`shadow\`（Mesh）… 足元の丸
  - \`hand\`（Group）
    - \`sword\`（Mesh）

**なぜこう分けたか**

**$1$. 全部が一緒に動く。** 敵が歩けば、体も体力バーも影も剣もついてくる。
だから同じ親（\`enemy\`）の下です。

**$2$. 全部が一緒に消える。** 倒したら $5$ つとも消えます。
\`enemy.removeFromParent()\` の $1$ 行で済みます。

**$3$. 剣だけ、もう $1$ 段深い。** 手を振れば剣も振れてほしいからです。
そして**剣は取り外せる** ― 落としたときに \`scene.attach(sword)\` で外せます。

**数値を木に入れない理由**

HP は**見た目ではありません。** 位置も向きも持たないので、
\`Object3D\` にする理由がありません。

\`enemy.userData.hp = 100\` として持たせるか、
そもそも three の外（自分のデータ構造）に置きます。

**混ぜると何が困るか**

「体力バーを画面の隅に移そう」と決めたとき、
バーを \`enemy\` から外すことになります。

このとき HP をバーが持っていたら、**HP まで一緒に外れます。**

見た目の都合で場所を変えただけなのに、ゲームの状態が壊れる ―
**見た目の階層と、意味の階層を混ぜたときに必ず起きること**です。

**迷ったときの $1$ 行**

**「これを動かしたら、一緒に動いてほしいか」**

はいなら子にする。いいえなら兄弟か、そもそも \`Object3D\` にしない。`,
    },
  ],
  quiz: [
    {
      q: '扉を左端の蝶番まわりに開きたい。どうしますか。',
      choices: [
        '蝶番の位置に `Group` を置き、その中で扉を右へずらして入れ、`Group` を回す',
        '扉の `rotation.y` を直接回す',
        '扉の `position` を毎フレーム計算する',
        '`geometry.rotateY()` を使う',
      ],
      answer: 0,
      explain:
        '物体の回転は必ず自分の原点まわりです。中心をずらしたければ、親を挟んでその中でずらします。これは c + R(p − c) という式そのもので、親子関係が計算を代わりにやってくれます。',
    },
    {
      q: '床のアイテムを、見た目を保ったまま手の子にしたい。使うのはどれですか。',
      choices: [
        '`hand.attach(item)`',
        '`hand.add(item)`',
        '`item.parent = hand`',
        '`hand.children.push(item)`',
      ],
      answer: 0,
      explain:
        '`add` は position をそのまま残すので、その値が「手から見た座標」として解釈され直し、物が飛びます。`attach` は新しい親の中で同じワールド位置になるよう計算し直してくれます。放すときも `scene.attach()` です。',
    },
    {
      q: '`position` を書き換えた直後に `getWorldPosition()` を呼ぶと、古い値が返ります。なぜですか。',
      choices: [
        '`matrixWorld` が更新されるのは、次に `render()` が呼ばれたときだから',
        '`getWorldPosition` にバグがあるから',
        '`position` の書き換えが非同期だから',
        'GPU の同期待ちが要るから',
      ],
      answer: 0,
      explain:
        '`updateMatrixWorld(true)` を挟めばその場で更新できます。`Box3.setFromObject` や `attach` も matrixWorld を見るので、同じ手当てが要ります。',
    },
  ],
};
