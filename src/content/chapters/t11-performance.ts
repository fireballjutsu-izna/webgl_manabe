import type { Chapter } from '../types.ts';

export const chapterT11: Chapter = {
  slug: 't11-performance',
  part: 'threejs',
  number: 11,
  title: '速くする',
  goal: '重さの原因を数字で切り分けられるようになり、ドローコールとメモリの両方を計画的に減らせるようになります。',
  requires: ['t10-scene-graph', '13-random'],
  threeApis: [
    'InstancedMesh',
    'InstancedMesh.setMatrixAt',
    'BufferGeometryUtils',
    'WebGLRenderer',
    'Object3D.frustumCulled',
    'LOD',
    'BufferGeometry',
  ],
  mathRecall: [
    { slug: '06-matrix', note: 'インスタンスの配置は 4x4 行列そのもの' },
    { slug: '13-random', note: '大量配置はノイズや乱数で作る' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## まず、どこが重いのかを知る

「重い」には主に 3 つの原因があり、**対処法がまったく違います**。
当てずっぽうで直そうとすると、時間だけが溶けます。

- **CPU が忙しい** … 命令を送る回数（{{ドローコール}}）が多すぎる。**いちばん多い原因**
- **GPU が忙しい** … 画素あたりの計算が重い。大きな画面、透明の重ね、重いシェーダ
- **メモリが足りない** … テクスチャが大きすぎる、解放漏れ

見分け方は簡単です。**ウィンドウを小さくして軽くなるなら GPU 側**、
変わらないなら CPU 側（ドローコール）です。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'renderer.info が教えてくれます',
      text: `
\`renderer.info.render.calls\` が 1 フレームのドローコール数、
\`renderer.info.render.triangles\` が三角形の数です。
**まずこれを画面に出してください。** 数字を見ずに最適化を始めてはいけません。

目安として、ドローコールが 100 を超えたら気にしはじめ、
1000 を超えていたら確実に減らす価値があります。
`,
    },
    {
      kind: 'md',
      text: `
## ドローコール ― 回数を減らす

GPU に「これを描いて」と命令を送るたびに、CPU 側で準備の費用がかかります。
**三角形 1000 個を 1 回で送る**のと、**1 個を 1000 回送る**のとでは、
描く量は同じでも後者が圧倒的に重くなります。

Three.js では、おおまかに**「メッシュ 1 つ＝ドローコール 1 回」**です。
木を 1000 本置いたら 1000 回になります。

そこで、**同じ形・同じ材質のものは 1 回にまとめます**。これを{{インスタンス化}}と呼び、\`InstancedMesh\` が担います。
`,
    },
    {
      kind: 'demo',
      id: 'instancing-compare',
      caption:
        '「描き方」を切り替えると、ドローコールの数字が跳ね上がったり 1 に戻ったりします。三角形の数はどちらも同じであることに注目してください。減っているのは命令の回数だけです。',
    },
    {
      kind: 'md',
      text: `
## InstancedMesh ― 同じものを大量に置く

使い方は素直です。**個数を先に決めて作り、1 つずつの配置を行列で渡す**だけ。

[1-06 行列と変換](#/ch/06-matrix)でやった 4x4 行列が、そのまま出てきます。
位置・回転・拡大をまとめて 1 つの行列にする、あの形です。
`,
    },
    {
      kind: 'code',
      title: 'InstancedMesh で 1000 本の木を置く',
      code: `const geometry = new THREE.ConeGeometry(0.4, 1.6, 8);
const material = new THREE.MeshStandardMaterial({ color: 0x4a7c59 });

const trees = new THREE.InstancedMesh(geometry, material, 1000);

// 配置を組み立てるための使い捨てオブジェクト
const dummy = new THREE.Object3D();

for (let i = 0; i < 1000; i++) {
  dummy.position.set(
    THREE.MathUtils.randFloatSpread(80),
    0.8,
    THREE.MathUtils.randFloatSpread(80),
  );
  dummy.rotation.y = Math.random() * Math.PI * 2;
  dummy.scale.setScalar(0.8 + Math.random() * 0.5);

  dummy.updateMatrix();               // position/rotation/scale から行列を作る
  trees.setMatrixAt(i, dummy.matrix); // i 番目の配置として登録する
}

scene.add(trees);

// 途中で配置を変えたら、必ずこれを立てる
trees.instanceMatrix.needsUpdate = true;

// 1つずつ色を変えることもできる
trees.setColorAt(0, new THREE.Color(0xffd166));
trees.instanceColor.needsUpdate = true;`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'needsUpdate を忘れると変化が届きません',
      text: `
\`setMatrixAt\` はメモリ上の配列を書き換えるだけです。
GPU へ送り直すには \`instanceMatrix.needsUpdate = true\` が必要です。

逆に、**毎フレーム全部を更新するのは無駄**です。動かないものは最初に 1 回だけ設定し、
動くものだけを別の InstancedMesh に分けると、更新の範囲を絞れます。
`,
    },
    {
      kind: 'md',
      text: `
## まとめる方法はもう1つ

**まったく動かないもの**なら、そもそも 1 つのジオメトリに合体させてしまえます。
\`BufferGeometryUtils.mergeGeometries()\` を使います。

- **InstancedMesh** … 同じ形が大量にあり、**1 つずつ動かしたい**とき
- **mergeGeometries** … 形はばらばらでもよく、**もう二度と動かさない**とき（建物・地形・柵）

合体させると 1 つのメッシュになるので、個別に動かすことも、
個別に消すこともできなくなります。そのかわり、いちばん軽くなります。
`,
    },
    {
      kind: 'code',
      title: '動かないものを合体させる',
      code: `import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const parts = [];

for (let i = 0; i < 200; i++) {
  const box = new THREE.BoxGeometry(1, 1, 1);
  // 合体前に、それぞれの位置へ動かしておく
  box.translate(
    THREE.MathUtils.randFloatSpread(40),
    0.5,
    THREE.MathUtils.randFloatSpread(40),
  );
  parts.push(box);
}

// 200個 → 1個のジオメトリへ。ドローコールも 200 → 1
const merged = BufferGeometryUtils.mergeGeometries(parts);
scene.add(new THREE.Mesh(merged, material));

// 元のジオメトリはもう要らない
for (const part of parts) part.dispose();`,
    },
    {
      kind: 'md',
      text: `
## GPU 側が重いとき

ウィンドウを小さくすると軽くなるなら、画素あたりの計算が重すぎます。

- **ピクセル比を下げる。** \`setPixelRatio(Math.min(devicePixelRatio, 2))\`。
  1.5 まで落としても、たいてい見分けはつきません
- **透明の重ねを減らす。** 透明な面が何枚も重なると、同じ画素を何度も塗り直します
- **影の範囲と解像度を見直す。** [2-05](#/ch/t05-light-shadow) でやったとおり、
  範囲を狭めるのがいちばん効きます
- **ライトを減らす。** ライト 1 つごとに全マテリアルの計算が増えます
- **ポストプロセスを疑う。** 画面全体をもう一度処理するので、素直に重い

**{{アンチエイリアス}}を切る**（\`antialias: false\`）のも、効果のわりに見た目の劣化が小さい手です。
`,
    },
    {
      kind: 'md',
      text: `
## 描かなくていいものを描かない

- **{{視錐台カリング}}** … 画面の外にあるものは自動で省かれます（既定で有効）。
  ただし、**動かさない大きなものを 1 つに合体させると効かなくなる**ことに注意してください。
  地形をいくつかの塊に分けておくと、見えていない部分を省けます
- **LOD** … 遠くにあるものを、粗いモデルに差し替える仕組み。\`THREE.LOD\` が用意されています
- **描画そのものを止める** … [2-06](#/ch/t06-loop-clock) で触れたとおり、
  動きがないときは \`render\` を呼ばない
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'メモリの解放漏れは、あとから効いてきます',
      text: `
最初は快適でも、シーンを何度も作り直すうちに重くなっていくなら、
[2-10](#/ch/t10-scene-graph) の \`dispose()\` 漏れを疑ってください。

\`renderer.info.memory.geometries\` と \`.textures\` を出してみると、
**使っていないはずのものが増え続けている**のが見えます。ここが増え続けたら赤信号です。
`,
    },
    {
      kind: 'md',
      text: `
## 手をつける順番

効果が大きい順に並べると、たいていこうなります。

1. **モデルとテクスチャを軽くする**（読み込み時間にも効く。いちばん効果が大きい）
2. **ドローコールをまとめる**（InstancedMesh / mergeGeometries）
3. **ピクセル比と影の設定を見直す**
4. **シェーダやポストプロセスを削る**

そして最後にもう一度。**必ず数字を見てから始めてください。**
思い込みで直したところは、たいてい原因ではありません。
`,
    },
  ],
  quiz: [
    {
      q: 'ウィンドウを小さくすると軽くなります。原因はどちら側にありますか。',
      choices: [
        'GPU 側（画素あたりの計算が重い）',
        'CPU 側（ドローコールが多い）',
        'メモリ不足',
        'ネットワーク',
      ],
      answer: 0,
      explain:
        '画素の数が減って軽くなったということは、画素あたりの処理が効いています。ピクセル比・透明の重ね・ポストプロセス・影を疑ってください。ドローコールが原因なら、大きさを変えても変わりません。',
    },
    {
      q: '同じ木を1000本置きたいとき、ドローコールを1回に抑える方法はどれですか。',
      choices: [
        '`InstancedMesh` で1つにまとめる',
        'ジオメトリとマテリアルを共有した Mesh を1000個作る',
        '`visible` を切り替える',
        'ピクセル比を下げる',
      ],
      answer: 0,
      explain:
        'ジオメトリを共有しても、メッシュが1000個あればドローコールは1000回です。InstancedMesh は「同じものを、違う配置で、まとめて1回」描く仕組みです。',
    },
    {
      q: '`setMatrixAt()` で配置を変えたのに、画面が変わりません。足りないのはどれですか。',
      choices: [
        '`instanceMatrix.needsUpdate = true`',
        '`scene.add()` のやり直し',
        '`renderer.render()` の呼び直し',
        '`material.needsUpdate = true`',
      ],
      answer: 0,
      explain:
        '`setMatrixAt` はメモリ上の配列を書き換えるだけです。GPU へ送り直すことを明示しないと反映されません。',
    },
  ],
};
