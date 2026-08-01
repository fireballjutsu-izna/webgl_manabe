import type { Chapter } from '../types.ts';

export const chapterW33: Chapter = {
  slug: 'w33-pick-cost',
  part: 'threejs',
  number: 33,
  title: '当たり判定の費用 ― 何を調べないか',
  goal: '光線判定の重さがどこから来るのかを見積もれるようになり、対象を絞る・代役を置くという 2 つの手で軽くできるようになります。',
  requires: ['w32-drag', 'w22-light-cost'],
  mathRecall: [
    { slug: 'b11-distance', note: '粗い判定は「光線と中心の距離」を測っているだけ' },
    { slug: 'b16-vector-length', note: '境界球の半径は、いちばん遠い頂点までの長さ' },
  ],
  threeApis: [
    'Raycaster.intersectObjects',
    'Raycaster.layers',
    'Raycaster.params',
    'BufferGeometry.boundingSphere',
    'BufferGeometry.computeBoundingSphere',
    'Object3D.layers',
    'Layers',
    'Object3D.visible',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 光線判定は、三角形を 1 枚ずつ調べている

[](#/ch/t08-raycaster)から 3 章にわたって、光線でものを拾ってきました。
書き味は軽いのに、実際には**かなり重い処理**が走っています。

\`intersectObjects\` は、最後には**三角形を 1 枚ずつ**調べます。

球ひとつが $32 \\times 20$ 分割なら約 $1{,}200$ 三角形。
読み込んだモデルなら $50{,}000$ 三角形もざらです。
それを $100$ 個並べたシーンで、毎フレーム光線を飛ばしたら ―
**カーソルを動かすだけで画面が固まります。**

**ただし、three は最初から全部を調べてはいません。**
`,
    },
    {
      kind: 'md',
      text: `
## 3 段階で、ふるいにかける

three の \`Mesh.raycast()\` は、上から順に安い判定でふるい落とします。

1. **境界球**（\`geometry.boundingSphere\`）… 光線と球の判定。**1 回だけ**
2. **境界箱**（\`geometry.boundingBox\`）… 光線と直方体の判定。これも 1 回
3. **三角形**… ここで初めて $1{,}200$ 回や $50{,}000$ 回になる

1 と 2 で落ちれば、**三角形は 1 枚も見ません。**
だから「画面の隅にある巨大なモデル」はほとんど費用になりません。

**境界球は、初回に自動で計算されます。**
[](#/ch/b16-vector-length)でやった長さの計算で、
中心からいちばん遠い頂点までの距離を測っているだけです。

**頂点を書き換えたら、自分で作り直してください。**
[](#/ch/w09-geometry-edit)で波打たせた水面のように位置を動かすと、
境界球が古いまま残り、**当たるはずのところで当たらなくなります。**
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '頂点を動かしたら、境界球を作り直す',
      text: `
geometry.computeBoundingSphere() を呼んでください。

境界球は「最初に必要になったとき」に一度だけ計算され、
そのあとは使い回されます。

頂点を動かしても自動では更新されないので、
物体が画面の右に動いているのに、当たり判定だけ左に残る ―
という気づきにくい不具合になります。

同じことが boundingBox にも言えます。
`,
    },
    {
      kind: 'formula',
      tex: 'C \\;\\approx\\; N \\;+\\; \\sum_{i \\in H} T_i',
      readAloud:
        '当たり判定の費用 $C$ は、**候補の数 $N$**（境界球の判定回数）と、**粗い判定を通ってしまったものの三角形数の合計**を足したものでおおよそ決まります。$H$ は「境界球に当たった物体」の集まりです。',
      worked: {
        given:
          '物体が $200$ 個あり、それぞれ $5{,}000$ 三角形。カーソルの光線が**境界球に当たるのは $3$ 個**だったとします。',
        steps: [
          { calc: '粗い判定  N = 200 回', note: '全部の境界球を調べる' },
          { calc: '細かい判定 = 3 x 5,000 = 15,000 回' },
          { calc: 'C = 200 + 15,000 = 15,200 回' },
          { calc: '（粗い判定が無ければ）', note: '全部の三角形を調べた場合' },
          { calc: '  200 x 5,000 = 1,000,000 回' },
          { calc: '  1,000,000 / 15,200 = 65.8 倍' },
        ],
        result:
          '**約 $15{,}200$ 回**です。粗い判定のおかげで、素朴に全部調べる場合の**約 $66$ 分の $1$** で済んでいます。**ここから読み取ってほしいのは、費用のほとんどが $15{,}000$ のほうにあるということです。** 候補を $200$ 個から $12$ 個に絞っても $12 + 15{,}000 = 15{,}012$ で、**ほとんど変わりません。** 効くのは**三角形のほうを減らすこと** ― たとえば当たり判定を $12$ 三角形の箱で代用すれば $200 + 3 \\times 12 = 236$ 回、**さらに $64$ 倍速く**なります。',
      },
    },
    {
      kind: 'md',
      text: `
## 手その 1 ― 対象を、配列で渡す

いちばん多い書き方が、これです。

\`raycaster.intersectObjects(scene.children, true)\`

**シーン全部**が対象になります。床も、グリッドヘルパーも、
$200{,}000$ 三角形の地形も、ライトも全部です。

拾いたいものが $8$ 個しかないなら、**その $8$ 個だけを渡してください。**
\`raycaster.intersectObjects(pieces, false)\` です。

第 2 引数の \`false\` は「**子まで降りない**」という意味です。
既定は \`true\` なので、\`Group\` を渡すと中身を全部たどります。

**計算例で見たとおり、これだけでは劇的には効きません。**
効くのは「$200{,}000$ 三角形の地形を候補から外せる」ときです ―
つまり**重いものを外せたときだけ、大きく効く**。
`,
    },
    {
      kind: 'md',
      text: `
## 手その 2 ― 代役を置く（いちばん効く）

**見えているものと、当たり判定に使うものは、別でよい。**

これがゲームエンジンでは当たり前の考え方で、three でも同じことができます。

- 見た目 … $6{,}000$ 三角形の精密なモデル
- 当たり判定 … それを囲む、**見えない箱**（$12$ 三角形）

$500$ 倍の差です。しかも「腕の先の $1$ ドット」を正確に拾う必要は、
たいていの場面でありません。**箱で十分**です。

代役は \`visible = false\` にすると描画されませんが、
**\`raycast\` は呼ばれます**（\`visible\` を見るのは描画側だけ）。
だから「見えないのに拾える」がそのまま作れます。

拾えたら \`userData\` から本体へ戻ります ―
[](#/ch/w31-hover-click)で使った印の付け方と同じ手です。
`,
      },
    {
      kind: 'sandbox',
      title: '代役コライダー ― 判定にかかる時間を測る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// false にすると、精密なモデルそのものを当たり判定に使います
const USE_PROXY = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.Fog(0x0a0a12, 14, 30);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 13);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const canvas = renderer.domElement;
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0x99bbff, 0x241f2e, 1.2));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(5, 8, 6);
scene.add(key);

// 1 個あたり 128 x 24 x 2 = 6,144 三角形。ジオメトリは全員で共有する
const knotGeo = new THREE.TorusKnotGeometry(0.34, 0.12, 128, 24);
const proxyGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95);   // 12 三角形

const base = new THREE.MeshStandardMaterial({ color: 0x5f6b96, roughness: 0.45 });
const lit = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.3 });

const targets = [];    // 光線を当てる相手
const knots = [];

let n = 0;
for (let x = 0; x < 6; x++) {
  for (let y = 0; y < 4; y++) {
    for (let z = 0; z < 5; z++) {
      const knot = new THREE.Mesh(knotGeo, base);
      knot.position.set((x - 2.5) * 1.1, (y - 1.5) * 1.1, (z - 2) * 1.1);
      scene.add(knot);
      knots.push(knot);

      if (USE_PROXY) {
        // 見えない代役。visible = false でも raycast は呼ばれる
        const proxy = new THREE.Mesh(proxyGeo, base);
        proxy.position.copy(knot.position);
        proxy.visible = false;
        proxy.userData.owner = knot;      // 拾えたら本体へ戻れるようにする
        scene.add(proxy);
        targets.push(proxy);
      } else {
        knot.userData.owner = knot;
        targets.push(knot);
      }
      n++;
    }
  }
}

const readout = document.createElement('div');
readout.style.cssText =
  'position:fixed;left:12px;top:12px;padding:8px 12px;border-radius:8px;' +
  'background:rgba(10,10,18,.82);color:#e8e8f2;font:13px/1.7 monospace;' +
  'border:1px solid #3a3a5c;white-space:pre';
document.body.appendChild(readout);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;
let avg = 0;

function report(ms) {
  readout.textContent =
    (USE_PROXY ? '代役の箱で判定' : '精密モデルで判定') + '\\n' +
    '対象 ' + targets.length + ' 個 / 1 個あたり ' +
    (USE_PROXY ? '12' : '6,144') + ' 三角形\\n' +
    '1 回の判定 ' + ms;
}
report('― カーソルを塊の上で動かしてください');

canvas.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const t0 = performance.now();
  const hits = raycaster.intersectObjects(targets, false);
  const ms = performance.now() - t0;
  avg = avg === 0 ? ms : avg * 0.9 + ms * 0.1;   // ならして見やすくする

  const next = hits.length > 0 ? hits[0].object.userData.owner : null;
  if (next !== hovered) {
    if (hovered) hovered.material = base;
    if (next) next.material = lit;
    hovered = next;
  }

  report(avg.toFixed(3) + ' ms');
});

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
        '**カーソルを塊の上でゆっくり動かして、左上の数字を見てください。** そのあと `USE_PROXY` を `false` にして、同じところを動かします。**見た目はまったく同じで、時間だけが変わります。** 手元で測ったところ、精密モデルが約 $1.7$ ms、代役の箱が約 $0.05$ ms ― **$30$ 倍前後**でした（端末によって変わります）。三角形の数は $500$ 倍違うのに時間が $30$ 倍にとどまるのは、**境界球で落ちるぶんと、$1$ 個ずつの手間が残るから**です。',
    },
    {
      kind: 'md',
      text: `
## 手その 3 ― layers で、拾えるものを分ける

配列を作らずに「これは拾える／拾えない」を切り替えたいときは
\`layers\` を使います。

すべての \`Object3D\` は $32$ 本のレイヤーを持っていて、
既定では第 $0$ レイヤーだけが有効です。

\`raycaster.layers.set(1)\` と書くと、
**第 $1$ レイヤーが有効な物体だけ**が光線の相手になります。

配列を渡す方法との違いは、**物体側で決められる**ことです。
「拾える状態／拾えない状態」がゲーム中に変わるなら、こちらが楽になります。

**カメラも同じ \`layers\` を持っています。**
代役の箱を第 $1$ レイヤーだけに置けば、
\`visible = false\` を使わずに「描画されないが拾える」が作れます。
`,
    },
    {
      kind: 'code',
      title: '絞り方の 3 つ',
      code: `import * as THREE from 'three';

// --- 1. 配列で渡す（いちばん簡単）
raycaster.intersectObjects(pieces, false);   // false = 子まで降りない

// --- 2. layers（物体側で切り替えたいとき）
const PICKABLE = 1;

box.layers.enable(PICKABLE);          // 拾える相手にする
box.layers.disable(PICKABLE);         // 一時的に外す

raycaster.layers.set(PICKABLE);       // 第 1 レイヤーだけを見る
// camera.layers.disable(PICKABLE) にすると、描画からは外れる

// --- 3. 代役コライダー（いちばん効く）
const proxy = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),     // 12 三角形
  new THREE.MeshBasicMaterial(),
);
proxy.visible = false;                // 描画されないが raycast は呼ばれる
proxy.userData.owner = detailedModel; // 拾えたら本体へ戻る
scene.add(proxy);

const hit = raycaster.intersectObjects([proxy], false)[0];
if (hit) select(hit.object.userData.owner);

// --- 頂点を動かしたら、境界球を作り直す
geometry.attributes.position.needsUpdate = true;
geometry.computeBoundingSphere();`,
    },
    {
      kind: 'md',
      text: `
## 点と線には、太さが無い

\`Points\` と \`Line\` は、数学的には**太さが $0$** です。
光線がぴったり通ることは、まずありません。

そこで three は「どれくらい近ければ当たったことにするか」を
\`raycaster.params\` で持っています。

- \`params.Points.threshold\` … 既定 $1$
- \`params.Line.threshold\` … 既定 $1$

**この $1$ はワールド座標の距離**です。
星空のように広い空間なら $1$ では細かすぎて拾えず、
小さな模型なら $1$ では大ざっぱすぎて隣まで拾ってしまいます。

**扱っているものの大きさに合わせて変えてください。**
点の間隔のおよそ半分が目安です。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '毎フレーム飛ばさない',
      text: `
いちばん安上がりな最適化は、判定の回数そのものを減らすことです。

ホバーの判定は pointermove のときだけでよく、
毎フレーム飛ばす必要はありません。

カーソルが止まっているあいだ、結果は変わらないからです。

カメラが動いているときは結果が変わりますが、
それでも「カメラが動いたフレームだけ」で足ります。

判定を 1 回減らすのは、判定を 100 倍速くするより簡単です。
`,
    },
    {
      kind: 'md',
      text: `
## 順番に試す

重いと感じたら、上から順に確かめてください。

1. **回数を減らす** … 毎フレームではなく \`pointermove\` のときだけ
2. **対象を絞る** … \`scene.children\` ではなく、拾いたい配列
3. **代役を置く** … 精密なモデルではなく、囲む箱
4. **境界を疑う** … 頂点を動かしたのに \`computeBoundingSphere()\` を忘れていないか

**$1$ と $3$ が効きます。** $2$ は「重いものを候補から外せるとき」だけです。

それでも足りない規模（$10{,}000$ 個以上）になったら、
空間を格子に区切って「近くの候補だけ」を取り出す仕組みが要ります。
その頃には、当たり判定より先に**描画のほうが重くなっている**はずなので、
[](#/ch/t11-performance)を先に読んでください。
`,
    },
  ],
  exercises: [
    {
      prompt: `物体が $60$ 個あり、それぞれ $20{,}000$ 三角形。
カーソルの光線が**境界球に当たるのは $2$ 個**でした。

1. いまの判定回数はおよそ何回ですか。
2. 全部を $12$ 三角形の箱で代用すると何回になり、**何倍**速くなりますか。`,
      hint: '$C \\approx N + \\sum T_i$ です。$N$ は候補の数（境界球の判定回数）。',
      answer: `**1. 約 $40{,}060$ 回。2. $84$ 回で、約 $477$ 倍。**

**1 ― いまの費用**

粗い判定は候補の数だけ走ります。

$N = 60$ 回

境界球を通ったのは $2$ 個なので、そこだけ三角形を見ます。

$2 \\times 20{,}000 = 40{,}000$ 回

$C = 60 + 40{,}000 = 40{,}060$ 回

**2 ― 代役に置き換えたら**

粗い判定の回数は変わりません（候補は $60$ 個のまま）。

$N = 60$ 回

三角形の判定だけが軽くなります。

$2 \\times 12 = 24$ 回

$C = 60 + 24 = 84$ 回

$40{,}060 \\div 84 = 476.9$ ― **約 $477$ 倍**

**ここで確かめてほしいこと**

$60$ 個という**候補の数はまったく変えていません。**
それでも $477$ 倍になりました。

逆に、代役を置かずに候補を $60 \\to 10$ に絞ったとしたらどうでしょう。

$10 + 40{,}000 = 40{,}010$ 回 ― **$0.1\\%$ しか変わりません。**

**費用は「候補の数」ではなく「実際に調べた三角形の数」で決まります。**
絞り込みを頑張る前に、まず三角形を減らしてください。`,
    },
    {
      prompt: `地形（$200{,}000$ 三角形）の上に、拾いたい箱が $8$ 個あります。
いまは \`raycaster.intersectObjects(scene.children, true)\` と書いています。

**何が起きていますか。** 対象を $8$ 個の配列に絞ると、判定回数はどうなりますか。`,
      hint: '`scene.children` には地形も入っています。地形は画面いっぱいなので、境界球には必ず当たります。',
      answer: `**地形の $200{,}000$ 三角形を、カーソルを動かすたびに調べています。**

**いま起きていること**

\`scene.children\` には、拾いたい箱 $8$ 個のほかに、地形・床・グリッド・
ライトまで全部入っています。

地形は画面いっぱいに広がっているので、**境界球には必ず当たります。**
だから毎回、三角形の判定に落ちます。

$C \\approx 12 + 200{,}000 + (\\text{箱の分}) \\approx 200{,}000$ 回

これを $1$ 秒に何十回もやれば、**カーソルを動かすだけで画面が固まります。**

**絞ったあと**

$8$ 個の箱だけを渡します ― \`raycaster.intersectObjects(pieces, false)\`。

粗い判定 $8$ 回。そのうち当たるのは普通 $1$ 個なので、

$C \\approx 8 + 12 = 20$ 回

$200{,}000 \\div 20 = 10{,}000$ ― **約 $1$ 万倍**です。

**なぜここでは絞り込みがこれほど効いたのか**

前の演習では、絞り込みは $0.1\\%$ しか効きませんでした。
違いは「**外したものが重かったかどうか**」です。

- 前の演習 … 外したのは境界球で落ちる軽い候補 → 効かない
- この演習 … 外したのは $200{,}000$ 三角形の地形 → 劇的に効く

**「候補を減らす」ではなく「重いものを候補から外す」と考えてください。**

**第 2 引数の \`false\` も大事です。**
既定は \`true\` で、渡した配列の**子まで全部たどります。**
箱に飾りの子オブジェクトがぶら下がっていると、そこまで調べに行きます。`,
    },
    {
      prompt: `[](#/ch/w09-geometry-edit)で作った波打つ水面の上で、クリックした場所に波紋を出したい。
ところが**動かす前の位置**でしか当たりません。

原因と、直し方を書いてください。`,
      hint: '境界球は、いつ計算されますか。',
      answer: `**境界球（と境界箱）が、最初の形のまま残っているからです。**

**何が起きているか**

\`geometry.boundingSphere\` は、**最初に必要になったとき $1$ 度だけ**計算され、
そのあとは使い回されます。

頂点の位置を書き換えても、**自動では更新されません。**

水面を上下に $\\pm 1$ 揺らすと、実際の形は元の境界球からはみ出します。
はみ出した部分に光線を飛ばすと、**粗い判定の段階で落とされて**
三角形まで届きません。

逆に、境界球の内側でも実際には水面が下がっているところでは、
三角形の判定まで進んで「当たらない」と正しく返ります ―
**だから「たまに当たり、たまに当たらない」という、いちばん厄介な出方**になります。

**直し方**

頂点を書き換えたあとに \`geometry.computeBoundingSphere()\` を呼びます
（下の解答例にまとめてあります）。

\`boundingBox\` も使っているなら \`computeBoundingBox()\` も。

**毎フレーム呼ぶのが惜しいなら**

\`computeBoundingSphere()\` は全頂点を走査するので、
$100 \\times 100$ の水面なら $10{,}000$ 頂点ぶんかかります。

揺れ幅が分かっているなら、**最初に少し大きめの境界球を手で入れておく**ほうが安上がりです。
\`geometry.boundingSphere.radius += 1.0\` のように、揺れ幅ぶんだけ広げておきます。

粗い判定は「落としてよいものを落とす」ためのものなので、
**大きめに見積もるぶんには正しさが壊れません**（少し遅くなるだけです）。
逆に小さすぎると、当たるはずのものを落とします。`,
      answerCode: `import * as THREE from 'three';

const pos = geometry.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getZ(i);
  pos.setY(i, Math.sin(x * 0.6 + t) * 0.5 + Math.cos(z * 0.5 + t) * 0.5);
}
pos.needsUpdate = true;

// これを忘れると、当たり判定だけ古い形のまま残る
geometry.computeBoundingSphere();

// 毎フレームが惜しければ、最初に大きめに取っておく
// geometry.boundingSphere.radius += 1.0;`,
    },
  ],
  quiz: [
    {
      q: '`intersectObjects` が三角形を 1 枚ずつ調べる前に、three は何をしていますか。',
      choices: [
        '境界球と境界箱で、光線が当たりうるかを先に確かめている',
        '物体を距離順に並べ替えている',
        '画面外の物体を `visible = false` にしている',
        'GPU に判定を投げている',
      ],
      answer: 0,
      explain:
        '`Mesh.raycast()` は 境界球 → 境界箱 → 三角形 の順にふるいます。粗い判定で落ちれば三角形は 1 枚も見ません。だから費用は「候補の数」より「粗い判定を通った物体の三角形数」で決まります。',
    },
    {
      q: '当たり判定を軽くしたい。いちばん効くのはどれですか。',
      choices: [
        '精密なモデルの代わりに、見えない箱を当たり判定に使う',
        '候補の配列を 200 個から 150 個に減らす',
        '`Raycaster` を毎回 `new` する代わりに使い回す',
        'カメラの `far` を小さくする',
      ],
      answer: 0,
      explain:
        '6,000 三角形が 12 三角形になれば 500 倍です。候補を少し減らしても、境界球で落ちる相手を減らしただけなのでほとんど変わりません。「重いものを候補から外せるとき」だけ絞り込みが効きます。',
    },
    {
      q: '頂点を書き換えて水面を波立たせたら、当たり判定が元の位置のままになりました。何を呼びますか。',
      choices: [
        '`geometry.computeBoundingSphere()`',
        '`renderer.render()` をもう一度',
        '`raycaster.setFromCamera()` を毎フレーム',
        '`material.needsUpdate = true`',
      ],
      answer: 0,
      explain:
        '境界球は最初に 1 度だけ計算され、そのあとは使い回されます。頂点を動かしたら作り直してください。`boundingBox` を使っているなら `computeBoundingBox()` も同様です。',
    },
  ],
};
