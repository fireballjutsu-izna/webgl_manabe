import type { Chapter } from '../types.ts';

export const chapterW04: Chapter = {
  slug: 'w04-blank-screen',
  part: 'threejs',
  number: 4,
  title: '何も映らない ― 上から順に確かめる',
  goal: '真っ黒な画面を前にしたときに、当てずっぽうではなく決まった順番で原因を絞り込めるようになります。',
  requires: ['w03-resize'],
  threeApis: [
    'MeshBasicMaterial',
    'AxesHelper',
    'Box3',
    'Box3.setFromObject',
    'WebGLRenderer.info',
  ],
  mathRecall: [
    { slug: '10-camera', note: 'near と far の外は写らない' },
    { slug: 'b27-lambert', note: '明るさは法線と光の内積。光がなければ 0' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 真っ黒は、いちばん情報が少ない

Three.js を書いていて、いちばん多く出会う画面が真っ黒です。

そして真っ黒は**何も教えてくれません。**
エラーも出ません。コンソールもきれいなままです。
どこが悪いのかを示す手がかりが、画面上に一つもない。

だから**当てずっぽうで直そうとすると、いつまでも終わりません。**
「カメラかな、いや光かな」と行ったり来たりして、
そのうち動いていた部分まで壊れます。

必要なのは、**決まった順番**です。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '電気がつかないとき、どこから見ますか',
      text: `
部屋の電気がつかないとき、いきなり配線を疑う人はいません。

まずスイッチ。次に電球。次にブレーカー。最後に配線。
「起こりやすい順」かつ「確かめるのが簡単な順」に見ていきます。

真っ黒な画面も同じです。順番が決まっていれば、必ず終わります。
`,
    },
    {
      kind: 'md',
      text: `
## 確認の順番 ― 上から 6 つ

**上から順に**確かめてください。この並びは「起こりやすさ」と「確かめやすさ」で決めてあります。

1. **キャンバスは画面にあるか** … \`document.body.appendChild(renderer.domElement)\` を呼んだか
2. **\`renderer.render()\` を呼んでいるか** … ループを回し忘れていないか
3. **\`scene.add()\` を呼んだか** … 作っただけでは存在しません
4. **ライトを置いたか** … \`MeshStandardMaterial\` は光がないと真っ黒です
5. **カメラは対象を向いているか** … \`lookAt()\` は**位置を決めたあとに**呼びます
6. **near と far のあいだにいるか** … [](#/ch/10-camera)の視錐台の話です

1 と 2 は「絵そのものが出ていない」、3 から 6 は「絵は出ているが中身が見えない」です。
まずこの 2 つのどちらかを見分けるのが、いちばん大きな分かれ道になります。
`,
    },
    {
      kind: 'md',
      text: `
## 分かれ道を作る ― 背景色を変える

「絵が出ていない」のか「絵は出ているが中身が空」なのか。
これを 1 行で見分けられます。

**\`scene.background\` を、目立つ色にしてください。**
`,
    },
    {
      kind: 'code',
      title: '1 行で、大きく切り分ける',
      code: `scene.background = new THREE.Color(0xff00ff);   // どぎついマゼンタ

// 画面がマゼンタになった → キャンバスも描画も動いている。
//                          問題は「中身」（3〜6）
// 真っ黒のまま         → そもそも描けていない。
//                          問題は「入れ物」（1〜2）`,
    },
    {
      kind: 'md',
      text: `
## 3 つの道具

順番を絞ったあと、原因を確定させるための道具が 3 つあります。

**光を見ないマテリアルに差し替える**

\`MeshBasicMaterial\` は光を一切見ません。
これに変えて映るなら、原因はライトです。映らないなら、原因はライト以外です。

**軸を出す**

\`scene.add(new THREE.AxesHelper(5))\` で、原点に赤緑青の軸が出ます。
**軸が見えるならカメラは正しく原点を向いています。**
軸すら見えないなら、カメラが明後日の方向を向いているか、near/far の外です。

**大きさを測る**

読み込んだモデルが映らないときは、たいてい大きさが想定と違います。
\`Box3\` で囲んで、実際の寸法を数字で見てください。
`,
    },
    {
      kind: 'code',
      title: '大きさと位置を、数字で確かめる',
      code: `const box = new THREE.Box3().setFromObject(model);

const size = box.getSize(new THREE.Vector3());
const center = box.getCenter(new THREE.Vector3());

console.log('大きさ', size);     // (0.01, 0.01, 0.01) や (5000, 5000, 5000) なら、これが原因
console.log('中心',   center);   // 原点から遠く離れていないか

// 描いている量も見られる（0 なら、そもそも何も描いていない）
console.log(renderer.info.render);   // { calls, triangles, points, lines, frame }`,
    },
    {
      kind: 'md',
      text: `
## 直してみる ― その 1

次のコードは**わざと壊してあります**。真っ黒な画面が出るはずです。

上の並びを**上から順に**たどって、原因を見つけて直してください。
足りないものは **2 つ**あります。
`,
    },
    {
      kind: 'sandbox',
      title: '直してみる 1 ―「作った」と「置いた」',
      code: `import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 4);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 20),
  new THREE.MeshStandardMaterial({ color: 0xffd166 }),
);

// ヒント：ここまでで足りないものが 2 つあります。
//   ひとつは「世界に置く」こと、もうひとつは「光」です。

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});`,
      caption:
        '答え：`scene.add(sphere)` と、ライトの追加（たとえば `scene.add(new THREE.DirectionalLight(0xffffff, 2.5))`）の 2 行が抜けています。**1 つずつ足して**、どちらが何を担っていたか確かめてください。ライトの代わりに材質を `MeshBasicMaterial` に変えても映ります。',
    },
    {
      kind: 'md',
      text: `
## 直してみる ― その 2

こんどは別の原因です。今度は \`scene.add\` もライトもちゃんとあります。
それでも真っ黒です。

**上の順番の、どこで引っかかりますか。**
`,
    },
    {
      kind: 'sandbox',
      title: '直してみる 2 ― 映っているのに見えない',
      code: `import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 5);
camera.position.set(0, 1, 4);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const model = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1, 0.3, 100, 16),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.4 }),
);
model.scale.setScalar(120);        // 書き出したモデルの単位が違った、という想定
scene.add(model);

const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(3, 4, 5);
scene.add(light, new THREE.HemisphereLight(0x8899ff, 0x101020, 0.6));

// ヒント：AxesHelper を足すと、カメラは正しく原点を向いていると分かります。
//   では、なぜ見えないのでしょう。Box3 で大きさを測ってみてください。

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});`,
      caption:
        '答え：物体が大きすぎて（外接球の半径が 228 ほど）、カメラの内側を丸ごと包んでしまっています。しかも far が 5 なので、遠くの面も写りません。`model.scale.setScalar(1)` に戻すか、カメラを `camera.position.set(0, 200, 700)` へ下げて far を `3000` にすれば映ります。**どちらでも正解**で、実務では「モデル側を直す」ほうが後々楽です。',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '「内側から見ている」は気づきにくい',
      text: `
物体がカメラを包んでいるとき、真っ黒になる理由は 2 つ重なっています。

ひとつは、面の裏側は既定で描かれないこと（背面カリング）。
もうひとつは、たとえ描かれても near より手前にあれば切り取られること。

大きすぎるモデルは、この 2 つに同時に引っかかります。
「読み込んだのに何も出ない」の典型で、Box3 で測るのがいちばん速い解決法です。
`,
    },
    {
      kind: 'md',
      text: `
## 真っ黒ではなく、真っ白のとき

たまに、真っ黒ではなく**画面全体が単色**になることがあります。

これはたいてい「物体がカメラのすぐ目の前にある」状態です。
1 つの面が画面いっぱいに広がっているので、単色の板に見えます。

見分け方は簡単で、**カメラを大きく後ろに下げてみる**ことです。
形が見えてくれば、それが原因でした。
`,
    },
    {
      kind: 'md',
      text: `
## この順番を、身体で覚える

ここまでの手順を 1 つにまとめます。困ったらここへ戻ってきてください。

- **背景色をマゼンタにする** → 入れ物の問題か、中身の問題かが分かれる
- **\`MeshBasicMaterial\` に差し替える** → 光の問題かどうかが分かれる
- **\`AxesHelper\` を足す** → カメラの向きが正しいかが分かれる
- **\`Box3\` で測る** → 大きさと位置が想定どおりかが分かれる
- **\`renderer.info.render\` を出す** → そもそも描いているかが分かる

**5 つとも「二択に割る」道具**です。当てずっぽうで直すのと違い、
1 回試すたびに候補が半分になるので、必ず終わります。

このサイトには症状から引ける[逆引きのページ](#/help)もあります。
「色が違う」「影が出ない」「重い」なども、同じように順番で並べてあります。
`,
    },
  ],
  exercises: [
    {
      prompt: `1 つ目のサンドボックス（直してみる 1）を、球が見えるように直してください。
足りないものは 2 つです。**1 つずつ足して、どちらが何を担っていたか**を確かめてください。`,
      hint: '片方を足しただけでは、まだ真っ暗のままか、何も出ないままです。両方いります。',
      answer: `\`scene.add(sphere)\` と、**ライト**の 2 つです。

**\`add\` を忘れると** … Mesh は作られていても**シーンに存在しない**ので描かれません。
three は追加されたものだけを描きます。

**ライトを忘れると** … \`MeshStandardMaterial\` は光を受けてはじめて色を出すマテリアルなので、
**真っ黒**になります。[](#/ch/b27-lambert)でやったとおり、明るさは法線と光の内積です。
光が無ければ、掛ける相手が無いので 0 です。

**1 つずつ足すと、違いがはっきりします。**

- \`add\` だけ足す → 黒い球のシルエットも出ない（背景と同じ色なので分からない）
- ライトだけ足す → 何も変わらない（描く相手がいない）
- 両方 → 見える

**切り分けの技** … マテリアルを \`MeshBasicMaterial\` に変えてから \`add\` だけ足すと、
球がはっきり出ます。これで「add は効いた、あとは光だ」と確定できます。`,
      answerCode: `scene.add(sphere);

const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(3, 4, 5);
scene.add(light, new THREE.HemisphereLight(0x8899ff, 0x101020, 0.6));`,
    },
    {
      prompt: `2 つ目のサンドボックス（直してみる 2）で、\`Box3\` を使って物体の大きさを測り、
コンソールに出してください。**いくつになりますか。**`,
      hint: '`new THREE.Box3().setFromObject(model)` のあと、`getSize` を呼びます。',
      answer: `**およそ $(393,\\; 410,\\; 191)$** です。

\`TorusKnotGeometry(1, 0.3, ...)\` は、だいたい $3.3 \\times 3.4 \\times 1.6$ ほどの箱に収まります。
それを 120 倍したので、**400 に迫る巨大な物体**になっていました。

カメラは $z = 4$ にいて、far は 5 です。
つまり **写せる範囲は奥行き 5 まで**なのに、物体は 400 近くあります。
カメラは物体の内側にすっぽり入っている状態です。

**内側から見ると 2 つの理由で見えません。**

- 面の裏側は既定で描かれない（背面カリング）
- 描かれたとしても、near = 0.1 より手前は切り取られる

**直し方は 2 通り。**

- 物体を直す … \`model.scale.setScalar(1)\`
- カメラを合わせる … 遠くへ下げて far を広げる

実務では**モデル側を直す**ほうが良いです。カメラを合わせると、
影の範囲・ライトの届く距離・near/far の精度まで全部そのスケールに引きずられます。`,
      answerCode: `const bbox = new THREE.Box3().setFromObject(model);
const size = bbox.getSize(new THREE.Vector3());
const center = bbox.getCenter(new THREE.Vector3());

console.log('大きさ', size.x.toFixed(1), size.y.toFixed(1), size.z.toFixed(1));
console.log('中心',   center.x.toFixed(1), center.y.toFixed(1), center.z.toFixed(1));

// 読み込んだモデルを、高さ 2 に揃える定番の書き方
const scale = 2 / size.y;
model.scale.multiplyScalar(scale);`,
    },
    {
      prompt: `ある人が「箱が映らない」と言っています。コードを見ると、
\`scene.add(box)\` もライトもあり、\`renderer.render\` も呼んでいます。
背景色をマゼンタにしたら、**画面はマゼンタになりました。**
次に何を確かめますか。**残っている候補を挙げてください。**`,
      hint: 'マゼンタになった時点で、消えた候補は何ですか。',
      answer: `**消えた候補** … 「キャンバスが画面にない」と「render を呼んでいない」の 2 つです。
マゼンタが見えている以上、キャンバスは貼られていて、描画も走っています。

**残っている候補は 3 つ**です。

- **カメラの向き** … \`lookAt\` を position より先に呼んでいないか。あるいは全然別の方向を向いている
- **near と far** … 物体がその範囲の外にある
- **物体の位置と大きさ** … 遠すぎる、小さすぎる、あるいは大きすぎてカメラを包んでいる

**次の一手は \`AxesHelper\`** です。

\`scene.add(new THREE.AxesHelper(5))\` を足して、原点の軸が見えるかを確かめます。

- **軸が見える** → カメラは正しく原点を向いている。残るのは物体の位置と大きさ → \`Box3\` で測る
- **軸が見えない** → カメラの向きか near/far → \`camera.position\` と \`lookAt\` の順番を見る

**1 回試すごとに候補が半分になる**ので、多くても 3 回で原因にたどり着きます。
これが「順番で確かめる」ということです。`,
    },
  ],
  quiz: [
    {
      q: '真っ黒な画面で、`scene.background` を目立つ色にしました。**色が付いた**とき、何が分かりますか。',
      choices: [
        'キャンバスも描画も動いている。問題は「中身」のほう',
        'カメラの向きが正しい',
        'ライトが足りている',
        '物体が near/far の内側にある',
      ],
      answer: 0,
      explain:
        '背景が見えるということは、キャンバスが画面に貼られていて render も走っているということです。つまり残る候補は scene.add・ライト・カメラの向き・near/far の 4 つに絞られます。1 行で候補を半分にできます。',
    },
    {
      q: '読み込んだモデルが映りません。原因を確かめるのにいちばん有効なのはどれですか。',
      choices: [
        '`Box3` で大きさと中心を測って、数字で見る',
        'ピクセル比を上げる',
        'アンチエイリアスを切る',
        '背景を透明にする',
      ],
      answer: 0,
      explain:
        '書き出した単位の違いで、想定の 100 倍や 100 分の 1 になっていることがよくあります。`Box3().setFromObject()` で実際の寸法と中心を出せば、大きすぎるのか小さすぎるのか遠いのかが一目で分かります。',
    },
    {
      q: '巨大なモデルがカメラを包んでいるとき、真っ黒になる理由は何ですか。',
      choices: [
        '面の裏側が描かれず、かつ near より手前が切り取られるため',
        'メモリが足りないため',
        'マテリアルが対応していないため',
        'ジオメトリが壊れているため',
      ],
      answer: 0,
      explain:
        '既定では背面カリングで裏面は描かれません。加えて、内側にいるということは面がカメラのすぐ手前にあるので、near でも切り取られます。2 つが同時に効くので、手がかりが何も残りません。',
    },
  ],
};
