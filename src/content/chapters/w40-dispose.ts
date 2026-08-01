import type { Chapter } from '../types.ts';

export const chapterW40: Chapter = {
  slug: 'w40-dispose',
  part: 'threejs',
  number: 40,
  title: '後片付け ― remove では消えない',
  goal: 'GPU 側のメモリが自動では解放されないことが分かり、木ごと安全に片付ける手順を書けるようになります。',
  requires: ['w39-find-traverse'],
  mathRecall: [
    { slug: 'b11-distance', note: '積もる量も、掛け算で見積もれる' },
  ],
  threeApis: [
    'BufferGeometry.dispose',
    'Material.dispose',
    'Texture.dispose',
    'WebGLRenderer.dispose',
    'WebGLRenderer.info',
    'Object3D.removeFromParent',
    'Object3D.visible',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## remove は、画面から外すだけ

ここが Three.js でいちばん見落とされるところです。

**\`scene.remove(mesh)\` は、木のつながりを切るだけ。**
ジオメトリもテクスチャも、**GPU のメモリに残り続けます。**

自動では消えません。JavaScript のガベージコレクタは、
**GPU 側のメモリを知らない**からです。

JS のオブジェクトが回収されても、GPU に確保されたバッファはそのまま。
**\`dispose()\` を呼ぶまで、永遠に残ります。**

$1$ 回きりのページなら気づきません。
**問題は、シーンを作り直すページ**です ―
画面を切り替えるたびに積もり、やがて動かなくなります。
`,
    },
    {
      kind: 'formula',
      tex: 'M_{\\text{漏れ}} \\;=\\; m \\times n',
      readAloud:
        '$1$ 回の作り直しで漏れる量 $m$ に、作り直した回数 $n$ を掛けたものが、たまっている量です。**$m$ が小さくても、$n$ は際限なく増えます。**',
      worked: {
        given:
          '画面を切り替えるたびにシーンを作り直しています。$1$ 画面ぶんは、テクスチャ $4$ 枚（各 $1024 \\times 1024$）とジオメトリ $30$ 個（各 $200$ KB）。**片付けを忘れたまま $20$ 回**切り替えました。',
        steps: [
          { calc: 'テクスチャ 1 枚', note: '1024 x 1024 x 4 x 4/3' },
          { calc: '  = 5.59 MB' },
          { calc: '4 枚で 22.37 MB' },
          { calc: 'ジオメトリ 30 x 200KB = 6.0 MB' },
          { calc: '1 画面ぶん m = 28.37 MB' },
          { calc: '20 回ぶん = 28.37 x 20' },
          { calc: '          = 567 MB' },
        ],
        result:
          '**$567$ MB。** スマートフォンなら、$8$ 回目あたりでタブが落ちます。ここで効くのは「$1$ 画面ぶんを軽くすること」ではありません ― **$28.37$ MB を半分にしても、$40$ 回切り替えれば同じところに着きます。** 掛かっているのは回数のほうで、**そちらには上限がない。** だから軽くするのではなく、**$0$ にする**（片付ける）以外に解決がありません。**漏れは、性能の問題ではなく正しさの問題です。**',
      },
    },
    {
      kind: 'md',
      text: `
## 何を dispose するのか

片付けが要るのは **$3$ 種類**だけです。

- **\`geometry.dispose()\`** … 頂点バッファ
- **\`material.dispose()\`** … シェーダプログラム
- **\`texture.dispose()\`** … 画像

**\`Mesh\` や \`Group\` には \`dispose()\` がありません。** 必要ないからです ―
それらはただの入れ物で、GPU 側に何も持っていません。

**テクスチャはマテリアルの中にいます。** \`map\`、\`normalMap\`、\`roughnessMap\`、
\`envMap\`… 名前を全部覚えるより、**マテリアルのプロパティを走査して
\`isTexture\` のものを探す**ほうが確実です。
`,
    },
    {
      kind: 'code',
      title: '木ごと片付ける',
      code: `function disposeTree(root) {
  const materials = new Set();

  root.traverse((object) => {
    if (object.geometry) object.geometry.dispose();

    if (object.material) {
      // 配列のこともある。共有されていることもあるので Set にためる
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of list) materials.add(material);
    }
  });

  for (const material of materials) {
    // マテリアルが持つテクスチャも解放する
    for (const value of Object.values(material)) {
      if (value && value.isTexture) value.dispose();
    }
    material.dispose();
  }

  root.removeFromParent();
}

// ページごと畳むときは、こちらも
renderer.dispose();
controls.dispose();
renderer.setAnimationLoop(null);`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '共有しているものを捨てない',
      text: `
車 3 台が同じジオメトリとマテリアルを使っているとき、
1 台ぶんだけ dispose すると、残りの 2 台が壊れます。

three は「もう捨てた」ことを知らないので、
真っ黒になったり、エラーがコンソールに出続けたりします。

上の関数が Set を使っているのは重複を避けるためですが、
「この木の外でも使われているか」までは分かりません。

作るときに決めてください ――
共有する素材は、シーンより長生きする場所（モジュールの定数など）に置き、
片付けの対象にしない。木ごと捨ててよいものだけを木に持たせる。
`,
    },
    {
      kind: 'sandbox',
      title: '片付けを、数字で見る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// false にすると、片付けをやめます。数字が積もっていくのが見えます
const DISPOSE = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.6, 8.6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.95, 0);

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(3, 6, 6);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.8));
scene.add(new THREE.GridHelper(14, 14, 0x3a3a5c, 0x26263c));

const readout = document.createElement('div');
readout.style.cssText =
  'position:fixed;left:12px;top:12px;padding:8px 12px;border-radius:8px;' +
  'background:rgba(10,10,18,.82);color:#e8e8f2;font:13px/1.7 monospace;' +
  'border:1px solid #3a3a5c;white-space:pre';
document.body.appendChild(readout);

// 毎回、専用のテクスチャとジオメトリを作る（＝共有していない）
function makeScreen(seed) {
  const group = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'hsl(' + ((seed * 47) % 360) + ' 45% 22%)';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = 'hsl(' + ((seed * 47 + i * 6) % 360) + ' 70% 60%)';
    ctx.fillRect((i * 53) % 480, (i * 91) % 480, 32, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  for (let i = 0; i < 6; i++) {
    const geo = new THREE.TorusKnotGeometry(0.5, 0.16, 90 + i, 16);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.45 }));
    mesh.position.set((i % 3 - 1) * 2.2, 1 + Math.floor(i / 3) * 1.9, 0);
    group.add(mesh);
  }
  return group;
}

function disposeTree(root) {
  const materials = new Set();
  root.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const m of list) materials.add(m);
    }
  });
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value && value.isTexture) value.dispose();
    }
    material.dispose();
  }
  root.removeFromParent();
}

let current = null;
let count = 0;

function swap() {
  if (current) {
    if (DISPOSE) disposeTree(current);
    else current.removeFromParent();     // 木から外すだけ。GPU には残る
  }
  current = makeScreen(++count);
  scene.add(current);
}

swap();
setInterval(swap, 1200);

renderer.setAnimationLoop(() => {
  const info = renderer.info.memory;
  readout.textContent =
    (DISPOSE ? 'dispose する' : 'dispose しない') + '\\n' +
    '切り替えた回数  ' + count + '\\n' +
    'ジオメトリ      ' + info.geometries + '\\n' +
    'テクスチャ      ' + info.textures + '\\n' +
    '画面にあるのは常に 6 個';

  if (current) current.rotation.y += 0.006;
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**画面に出ているのは、いつでも $6$ 個です。** `DISPOSE` が `true` なら、$1$ 分放っておいても数字は **ジオメトリ $7$・テクスチャ $2$** のまま動きません。`false` にすると、$1.2$ 秒ごとに増え続けます ― $13$ 回で **ジオメトリ $79$・テクスチャ $14$**。**見えないところに積もっている量**が、そのまま数字になって出ます。（グリッドとレンダラ内部のぶんが $1$ ずつ乗っているので、見るのは絶対値ではなく**増えるかどうか**です。）',
    },
    {
      kind: 'md',
      text: `
## 数えているものを見る

\`renderer.info.memory\` は、**いま GPU に載っている数**を教えてくれます。

- \`geometries\` … ジオメトリの数
- \`textures\` … テクスチャの数

**バイト数ではありません**が、漏れを見つけるにはこれで十分です。

**使い方はひとつ。** 画面を切り替える前後で数を比べてください。
**戻っていなければ、漏れています。**

$1$ 回で $10$ 増えるなら、$100$ 回で $1{,}000$ です。
**バグは $1$ 回目から見えています** ― 増え方を見れば、落ちる前に分かります。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '消すより visible のほうが速い',
      text: `
「一時的に見せたくないだけ」なら、消して作り直すのは無駄です。

object.visible = false にすれば、その木ごと描画から外れます。

作り直しの費用（ジオメトリの構築、シェーダの用意、テクスチャの転送）が
丸ごと不要になるので、出したり消したりを繰り返すものは
visible で切り替えてください。

そして、visible なら片付けの心配もありません。
捨てていないので、漏れようがない。
`,
    },
    {
      kind: 'md',
      text: `
## 片付けは、作るときに決める

あとから「これは捨ててよいのか」を判断するのは、とても難しい。
**作るときに決めておいてください。**

- **使い捨てのもの** … その画面のためだけに作ったジオメトリ・テクスチャ。
  木にぶら下げて、木ごと \`disposeTree\` する
- **共有するもの** … 全画面で使い回す素材。
  モジュールの定数に置き、**片付けの対象にしない**

この $2$ つを混ぜなければ、片付けは機械的な作業になります。

**そして「片付ける関数」は、作る関数と一緒に書いてください。**
$1$ 週間後に別のファイルへ書きに行くと、必ず取りこぼします。
`,
    },
    {
      kind: 'code',
      title: '作る関数が、片付け方も返す',
      code: `// 作ると同時に、片付け方も返す
function createScene(root) {
  const geo = new THREE.SphereGeometry(1, 32, 20);
  const texture = new THREE.CanvasTexture(makeCanvas());
  const mat = new THREE.MeshStandardMaterial({ map: texture });

  const mesh = new THREE.Mesh(geo, mat);
  root.add(mesh);

  const onResize = () => { /* ... */ };
  window.addEventListener('resize', onResize);

  return {
    dispose() {
      window.removeEventListener('resize', onResize);
      mesh.removeFromParent();
      geo.dispose();
      texture.dispose();
      mat.dispose();
    },
  };
}

const view = createScene(scene);
// 画面を離れるとき
view.dispose();`,
    },
    {
      kind: 'md',
      text: `
## GPU 以外にも漏れる

\`dispose\` で片付くのは GPU 側だけです。**JS 側にも同じ問題があります。**

- \`addEventListener\` … 外し忘れると、消したはずの画面が動き続けます
- \`setInterval\` / \`setTimeout\` … 同じく、止めるまで走り続けます
- \`renderer.setAnimationLoop(cb)\` … \`null\` を渡して止めます
- \`ResizeObserver\` / \`IntersectionObserver\` … \`disconnect()\`
- **配列に持ったままの参照** … \`enemies\` 配列から消し忘れると、
  \`removeFromParent\` しても JS 側で生き続けます

**症状は同じ**です ― 画面を行き来するうちに、だんだん重くなる。

**「あとで走るもの」と「あとで参照するもの」を作ったら、
片付ける段取りも同じ場所に書いてください。**
`,
    },
  ],
  exercises: [
    {
      prompt: `画面を切り替えるたびに、テクスチャ $6$ 枚（各 $2048 \\times 2048$）を作り直しています。
片付けを忘れたまま **$12$ 回**切り替えました。

1. GPU 上にたまっている量はおよそ何 MB ですか（ミップマップ込み）。
2. **$1$ 枚を $1024$ に落とせば**解決しますか。`,
      hint: '$1$ 枚 $= w \\times h \\times 4 \\times \\frac{4}{3}$。そのあと枚数と回数を掛けます。',
      answer: `**1. 約 $1{,}610$ MB。2. 解決しません。**

**1 ― たまっている量**

$1$ 枚あたり。

$2048 \\times 2048 \\times 4 = 16{,}777{,}216$ B $= 16.8$ MB

ミップマップ込みで $\\frac{4}{3}$ 倍。

$16.8 \\times \\frac{4}{3} = 22.4$ MB

$1$ 画面ぶんは $6$ 枚。

$22.4 \\times 6 = 134$ MB

$12$ 回ぶん。

$134 \\times 12 = 1{,}610$ MB

**約 $1.6$ GB。** とっくに落ちています ―
実際には $4$〜$5$ 回目でタブが死ぬはずです。

**2 ― 解像度を下げれば解決するか**

**しません。**

$1024$ に落とせば $1$ 枚 $5.6$ MB、$1$ 画面 $33.6$ MB。$4$ 分の $1$ です。

$12$ 回で $403$ MB。**まだ落ちます。**

そして $48$ 回切り替えれば、$1{,}610$ MB に戻ります。

**なぜ解決しないのか**

$M_{\\text{漏れ}} = m \\times n$ で、**$n$ に上限が無い**からです。

$m$ を半分にしても、$n$ が $2$ 倍になれば同じところに着きます。
ユーザーがページを何回操作するかは、こちらで決められません。

**$m$ を小さくするのは「落ちるまでの時間を延ばす」だけ**で、
落ちること自体は変わりません。

**唯一の解決**

**片付けること。** $m = 0$ にすれば、$n$ がいくつでも $0$ です。

\`texture.dispose()\` を呼ぶ。それだけです。

**漏れは、性能の問題ではなく正しさの問題です。**
「軽くする」の枠で考えているかぎり、直りません。

**確かめ方**

画面を切り替える前後で \`renderer.info.memory.textures\` を出力してください。
**戻っていなければ漏れています。** $1$ 回目から分かります。`,
    },
    {
      prompt: `車が $3$ 台あり、**同じジオメトリとマテリアル**を共有しています。
$1$ 台だけ消したいので、\`disposeTree(car)\` を呼びました。

**何が起きますか。** どうすべきでしたか。`,
      hint: 'ジオメトリは、何台で使われていますか。',
      answer: `**残りの $2$ 台が壊れます。**

**何が起きるか**

\`geometry.dispose()\` は、GPU 上のバッファを解放します。

そのジオメトリは残り $2$ 台も**指しています。**
three は「もう捨てた」ことを知らないので、次の描画で解放済みのバッファを使おうとし、
**何も出ない・真っ黒になる・コンソールにエラーが出続ける**といった形で壊れます。

マテリアルも同じです。シェーダプログラムを捨てられて、$2$ 台とも描けなくなります。

**しかも $1$ 台目は無事に消えている**ので、原因が分かりにくい。
「$1$ 台消したら、なぜか他の車まで消えた」という報告になります。

**どうすべきだったか**

**共有しているものは捨てない。**

$1$ 台だけ消すなら、木から外すだけで十分です。

\`car.removeFromParent()\`

ジオメトリもマテリアルも、まだ $2$ 台が使っているので**残しておくのが正しい。**
漏れではありません ― **使われているのだから、残っていて当然**です。

**$3$ 台とも消すときは**

そのときは捨ててよい。ただし \`disposeTree\` を $3$ 回呼ぶと、
$1$ 回目で捨てたものを $2$ 回目・$3$ 回目でもう一度捨てることになります
（\`dispose\` の二度呼びは無害ですが、意味はありません）。

**共有素材を持っている親（\`fleet\`）に対して $1$ 回だけ**呼ぶか、
そもそも共有素材を木の外で管理してください。

**作るときに決める**

- **使い捨て** … その木のためだけに作った。木ごと捨てる
- **共有** … モジュールの定数などに置き、**片付けの対象にしない**

この区別を作るときに付けておけば、
「捨ててよいか」を後から悩まずに済みます。`,
      answerCode: `// 共有素材は、木の外（モジュールの定数）に置く
const bodyGeo = new THREE.BoxGeometry(2, 0.7, 1);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4fd6ff });

// 1 台だけ消す ― 木から外すだけ
car.removeFromParent();

// ページごと畳むときに、共有素材をまとめて捨てる
function disposeShared() {
  bodyGeo.dispose();
  bodyMat.dispose();
}`,
    },
    {
      prompt: `画面を切り替えるたびに \`disposeTree()\` を呼んでいます。
\`renderer.info.memory\` の数字は**ちゃんと戻ります。**

それでも、$20$ 回ほど行き来すると**だんだん重くなり、操作が引っかかります。**

**何が残っていますか。** $4$ つ挙げてください。`,
      hint: '`dispose` が片付けるのは、GPU 側だけです。',
      answer: `**JS 側の「あとで走るもの」と「あとで参照するもの」が残っています。**

\`renderer.info.memory\` が戻っているなら、GPU 側は正しく片付いています。
残るのはこの $4$ 種類です。

**$1$. イベントリスナ**

\`window.addEventListener('resize', onResize)\` を外していない。

$20$ 回切り替えれば、リスナが $20$ 個。
ウィンドウを $1$ 回リサイズするたびに $20$ 個の関数が走ります。

しかも**それぞれが古いカメラとレンダラを掴んだまま**なので、
JS 側のメモリも解放されません。

\`removeEventListener\` を呼んでください。**同じ関数参照が必要**なので、
無名関数ではなく変数に入れておきます。

**$2$. タイマー**

\`setInterval\` を \`clearInterval\` していない。

$20$ 個のタイマーが同時に走り、消えたはずの画面を更新し続けます。

**$3$. 描画ループ**

\`renderer.setAnimationLoop(cb)\` を \`null\` にしていない ―
あるいは \`requestAnimationFrame\` の再帰を止めていない。

\`requestAnimationFrame\` のほうが厄介で、
**止める仕組みを自分で書かないかぎり回り続けます**（フラグを $1$ つ持つ）。

$20$ 個のループが毎フレーム走れば、それだけで引っかかります。

**$4$. 配列やマップに残った参照**

\`enemies.push(mesh)\` したまま、消すときに配列から抜いていない。

\`removeFromParent()\` しても、配列が掴んでいるので JS 側では生き続けます。
毎フレーム \`for (const e of enemies)\` を回していれば、
**もう見えない敵の更新に時間を使っています。**

\`Map\` や \`Set\`、\`userData.owner\` のような相互参照も同じです。

**共通する形**

**「あとで走るもの」と「あとで参照するもの」を作ったら、
片付ける段取りを同じ場所に書く。**

作る関数が \`dispose()\` を返す形にしておけば、
足したときに片付けも足すのが自然になります。

**離れた場所に片付けを書くと、必ず取りこぼします。**`,
      answerCode: `function createView(root) {
  const onResize = () => { /* ... */ };
  window.addEventListener('resize', onResize);

  const timer = setInterval(tick, 1000);
  const enemies = [];

  renderer.setAnimationLoop(render);

  return {
    dispose() {
      window.removeEventListener('resize', onResize);  // 1
      clearInterval(timer);                            // 2
      renderer.setAnimationLoop(null);                 // 3
      enemies.length = 0;                              // 4
      disposeTree(root);                               // GPU 側
    },
  };
}`,
    },
  ],
  quiz: [
    {
      q: '`scene.remove(mesh)` を呼んだあと、GPU 側のメモリはどうなりますか。',
      choices: [
        '解放されない。geometry と material を自分で dispose する必要がある',
        '自動的に解放される',
        'ガベージコレクタが後で解放する',
        '`renderer.render` を呼んだときに解放される',
      ],
      answer: 0,
      explain:
        'JavaScript のガベージコレクタは GPU 側のメモリを知りません。シーンを作り直すページでは、これが積み重なってやがて動かなくなります。',
    },
    {
      q: '3 台の車が同じジオメトリを共有しています。1 台だけ消したい。どうしますか。',
      choices: [
        '`car.removeFromParent()` だけ。ジオメトリは捨てない',
        '`disposeTree(car)` を呼ぶ',
        '`car.geometry.dispose()` を呼ぶ',
        '`car.visible = false` にして放置する',
      ],
      answer: 0,
      explain:
        '共有しているものを捨てると、残りの 2 台が壊れます。まだ使われているのだから、残っていて当然です ― 漏れではありません。共有素材は木の外で管理してください。',
    },
    {
      q: '`renderer.info.memory` の数字は戻るのに、行き来するうちに重くなります。何を疑いますか。',
      choices: [
        'イベントリスナ・タイマー・描画ループ・配列に残った参照',
        'GPU のドライバ',
        'テクスチャの解像度',
        'ジオメトリの三角形数',
      ],
      answer: 0,
      explain:
        '`dispose` が片付けるのは GPU 側だけです。JS 側の「あとで走るもの」と「あとで参照するもの」は、自分で外す必要があります。作る関数が dispose() を返す形にしておくと、取りこぼしません。',
    },
  ],
};
