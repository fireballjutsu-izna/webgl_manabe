import type { Chapter } from '../types.ts';

export const chapter11: Chapter = {
  slug: '11-normal-light',
  part: 'math',
  number: 11,
  title: '法線とライティング',
  goal: '面の明るさがどう決まるのかを説明できるようになり、「モデルが真っ黒」「エッジがカクカク」といった不具合の原因を切り分けられるようになります。',
  requires: ['03-dot', '04-cross'],
  threeApis: [
    'BufferGeometry.computeVertexNormals',
    'DirectionalLight',
    'AmbientLight',
    'MeshStandardMaterial.flatShading',
    'Vector3.reflect',
    'Material.side',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## まず、どこで困るか

- 読み込んだモデルが**真っ黒**、あるいは**のっぺり**していて立体に見えない
- なめらかなはずの球が、カクカクした多面体に見える
- 面の裏側だけが消える

いずれも{{法線}}が原因です。逆に言えば、法線の意味さえ分かれば全部説明がつきます。
`,
    },
    {
      kind: 'md',
      text: `
## 法線 ― 面が向いている向き

法線は、面に垂直に立っている長さ 1 のベクトルです。
[第4章](#/ch/04-cross)で見たとおり、三角形の 2 辺の{{外積}}で作れます。

3D のモデルは三角形の集まりですが、法線は面ごとではなく**頂点ごと**に持たされます。
頂点が持つ法線は、その頂点を共有する面の法線を平均したものです。
そして面の内側では、3 頂点の法線がなめらかに混ぜられます（[第8章](#/ch/08-interp)の lerp です）。

これが「カクカクの三角形の集まりが、なめらかな球に見える」種明かしです。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '形はカクカクでも、光の返し方だけ嘘をつく',
      text: `
球のモデルは、実際には数百枚の平らな三角形です。それでもなめらかに見えるのは、
「この面はこっちを向いていることにしてくれ」と法線が嘘をついているからです。
輪郭を見ると多角形なのが分かりますが、面の中はきれいにつながって見えます。
\`flatShading\` を有効にすると、この嘘をやめて面ごとの本当の法線を使うようになります。
`,
    },
    {
      kind: 'md',
      text: `
## 明るさ ― 法線と光の内積

[第3章](#/ch/03-dot)で先取りした式が、そのままライティングの中心です。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{明るさ} = \\max\\!\\left(0,\\; \\mathbf{n}\\cdot\\mathbf{l}\\right)',
      readAloud:
        '面の法線 n と、光が来る向き l の内積を取ります。真正面から当たれば 1、斜めになるほど小さくなり、裏を向くとマイナスになります。マイナスの明るさは存在しないので、max で 0 に止めます。',
    },
    {
      kind: 'md',
      text: `
これが{{ランバート反射}}です。たった 1 回の内積で、球が球らしく見えるようになります。
物理的には「斜めから当たった光は、同じエネルギーが広い面積に薄く広がるから暗くなる」
という話ですが、実装としては内積 1 つです。
`,
    },
    {
      kind: 'demo',
      id: 'normal-lambert',
      caption:
        '光の向きを動かすと、球の明るいところが移動します。「調べる点」のスライダーで赤道上をなぞりながら、n·l の値と実際の明るさが一致していることを確かめてください。',
    },
    {
      kind: 'md',
      text: `
## 反射ベクトル ― 光沢のもと

ざらついた面は光をあらゆる方向に散らしますが、つるつるの面は鏡のように跳ね返します。
その跳ね返る向きが{{反射ベクトル}}です。

そして「反射した光の向き」と「カメラの向き」が近いほど、そこがギラッと光ります。
つまりここでも判定は内積です。ランバートが「光と法線」、
光沢が「反射とカメラ」——使う相手が違うだけで、道具は同じです。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathbf{r} = \\mathbf{d} - 2(\\mathbf{d}\\cdot\\mathbf{n})\\,\\mathbf{n}',
      readAloud:
        '入ってきた向き d から、法線方向の成分を 2 倍ぶん差し引くと、跳ね返った向き r になります。壁に垂直な成分だけが反転し、壁に沿った成分はそのまま、という意味です。',
    },
    {
      kind: 'md',
      text: `
## Three.js のライトの選び方

- **AmbientLight** … すべてを一律に明るくする。影も立体感も作らないが、真っ黒つぶれを防ぐ
- **DirectionalLight** … 太陽。**位置ではなく向きだけ**が意味を持つ（無限に遠い光源）
- **PointLight** … 電球。位置があり、距離で減衰する
- **SpotLight** … 懐中電灯。円錐状に照らす
- **HemisphereLight** … 空と地面から来る光。屋外の環境光として自然

実用上は「DirectionalLight 1 つ ＋ 弱い AmbientLight か HemisphereLight」から始めるのが手堅いです。
`,
    },
    {
      kind: 'code',
      title: 'まず立体に見せる最小構成',
      code: `import * as THREE from 'three';

// 主光源。position は「どこから照らすか」の向きを決めるためだけに使う
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(4, 6, 5);
scene.add(key);

// 影の中が真っ黒に潰れないよう、弱い環境光を足す
const fill = new THREE.HemisphereLight(0xaad4ff, 0x202030, 0.8);
scene.add(fill);

// MeshBasicMaterial は光の影響を受けない（＝陰影がつかない）
const flat = new THREE.MeshBasicMaterial({ color: 0x4fd6ff });

// 陰影が欲しいなら Standard か Lambert
const shaded = new THREE.MeshStandardMaterial({
  color: 0x4fd6ff,
  roughness: 0.5,   // 1 に近いほどざらつく
  metalness: 0.0,
  flatShading: false, // true にすると面ごとの法線を使い、カクカクになる
});

// 自分で頂点を並べて作ったジオメトリは、法線を計算しないと真っ黒になる
geometry.computeVertexNormals();`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '真っ黒なときの3つの容疑者',
      text: `
1. **ライトを置いていない**（\`MeshStandardMaterial\` は光がないと黒です）
2. **法線がない**（自作ジオメトリで \`computeVertexNormals()\` を呼び忘れている）
3. **面が裏を向いている**（頂点の並び順が逆。\`side: THREE.DoubleSide\` で切り分けられます）
`,
    },
    {
      kind: 'md',
      text: `
## 面の裏表

三角形には表と裏があり、頂点をどちら回りに並べたかで決まります。
既定では**裏面は描画されません**（見えない面を捨てて速くするためです）。

モデルの一部だけが消えて見えるときは、その面の頂点の並びが逆になっています。
確認のために \`side: THREE.DoubleSide\` にすると両面が描かれますが、
これは対症療法です。本来は法線と頂点の並びを直すべきところです。
`,
    },
  ],
  quiz: [
    {
      q: '面の明るさを決めるいちばん基本の計算はどれですか。',
      choices: [
        '法線と光の向きの内積',
        '法線と光の向きの外積',
        'カメラからの距離',
        '面の面積',
      ],
      answer: 0,
      explain:
        'ランバート反射です。内積が 1 に近いほど正面から光が当たっており明るく、マイナスになったら裏側なので 0 で止めます。',
    },
    {
      q: '自分で頂点を並べて作ったジオメトリが真っ黒に描画されます。まず試すべきはどれですか。',
      choices: [
        '`geometry.computeVertexNormals()` を呼ぶ',
        'カメラの near を小さくする',
        '`renderer.setPixelRatio` を上げる',
        'ジオメトリの頂点数を減らす',
      ],
      answer: 0,
      explain:
        '法線がないと明るさの計算ができず、どの面も真っ黒になります。ライトを置き忘れていないかも同時に確認してください。',
    },
    {
      q: 'なめらかなはずの球が、カクカクした多面体に見えます。関係が深いのはどれですか。',
      choices: [
        'flatShading が有効になっている（面ごとの法線が使われている）',
        'カメラの FOV が広すぎる',
        'AmbientLight が強すぎる',
        'far が大きすぎる',
      ],
      answer: 0,
      explain:
        'なめらかな見た目は、頂点ごとの法線を面の内側で混ぜることで作られています。flatShading にすると面ごとの実際の法線が使われ、形どおりのカクカクが出ます。',
    },
  ],
};
