import type { Chapter } from '../types.ts';

export const chapterT01: Chapter = {
  slug: 't01-first-scene',
  part: 'threejs',
  number: 1,
  title: '最初のシーン ― 3 つ揃えて、1 枚描く',
  goal: 'シーン・カメラ・レンダラの分担が分かり、自分の手で 1 枚の絵を出せるようになります。',
  requires: ['01-space', '10-camera'],
  threeApis: [
    'Scene',
    'PerspectiveCamera',
    'WebGLRenderer',
    'Mesh',
    'BoxGeometry',
    'MeshStandardMaterial',
    'DirectionalLight',
    'WebGLRenderer.render',
  ],
  mathRecall: [
    { slug: '01-space', note: '数字 3 つが空間のどこを指すか' },
    { slug: '10-camera', note: '視錐台・画角・near と far' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 3 つ揃わないと、何も映らない

Three.js の絵は、必ずこの 3 つが揃ってはじめて出ます。

- **シーン**（\`Scene\`）… ものを置く世界そのもの。ここに追加しないと、存在しないのと同じ
- **カメラ**（\`PerspectiveCamera\`）… どこから、どれくらいの広さで見るか
- **{{レンダラ}}**（\`WebGLRenderer\`）… 実際に絵を描いて、キャンバスに出す係

**「シーンに何を置いたか」と「カメラがどこから見ているか」は、完全に別の話です。**
ここが分かれていることが、最初につまずく一番の理由になります。

置いたのに映らない。映っているのに真っ黒。
どちらも「3 つのうち、どれの問題か」を切り分けられれば、すぐ終わります。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '舞台・カメラマン・映写機',
      text: `
シーンは舞台、カメラはカメラマン、レンダラは映写機です。

舞台に役者を立たせても、カメラマンが客席の外を向いていたら何も写りません。
逆にカメラマンが正しく構えていても、映写機を回さなければスクリーンは真っ黒のままです。

3 つは互いに独立しています。だから 1 つずつ確かめられます。
`,
    },
    {
      kind: 'md',
      text: `
## 動かしながら読む

下のコードは実際に動いています。**書き換えて「実行する」を押せば、その場で結果が変わります。**
壊しても「最初に戻す」でいつでも元通りになるので、遠慮なくいじってください。

このサイトの第3部は、ずっとこの形で進みます。読むだけの章はありません。

まずは \`camera.position.set(0, 1.2, 4)\` の数字を変えてみるのがおすすめです。
[](#/ch/01-space)でやったとおり、z のプラスが手前でした。
`,
    },
    {
      kind: 'sandbox',
      title: '最初のシーン ― 静止画を 1 枚',
      code: `import * as THREE from 'three';

// 1. シーン ― ものを置く世界
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

// 2. カメラ ― どこから、どれくらいの広さで見るか
const camera = new THREE.PerspectiveCamera(
  50,                                     // 画角（ここだけ度で指定する）
  window.innerWidth / window.innerHeight, // 横縦比
  0.1,                                    // near : これより手前は写らない
  100,                                    // far  : これより奥は写らない
);
camera.position.set(0, 1.2, 4);
camera.lookAt(0, 0, 0);                   // 位置を決めたあとに呼ぶ

// 3. レンダラ ― 実際に絵を描く係
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);   // これを忘れると画面に出ない

// 箱を1つ置く。scene.add を忘れると存在しないのと同じ
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.4 }),
);
box.rotation.y = 0.6;
scene.add(box);

// 光がないと MeshStandardMaterial は真っ黒になる
const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(3, 4, 5);
scene.add(light, new THREE.HemisphereLight(0x8899ff, 0x101020, 0.6));

// 描く。これは「いまの状態を1枚描く」命令なので、1回で終わり
renderer.render(scene, camera);`,
      caption:
        '画角を 20 にすると望遠になって箱が大きく写り、100 にすると広角になって歪みます。near を 5 にすると箱がまるごと消えます。**この絵は動きません** ― 動かす方法は次の章です。',
    },
    {
      kind: 'md',
      text: `
## いま書いた 4 行が、何をしていたか

コードの並びは長く見えますが、要は 4 つのことしかしていません。

- **世界を作る** … \`new THREE.Scene()\`
- **見る人を置く** … \`new THREE.PerspectiveCamera(...)\` と \`camera.position.set(...)\`
- **描く係を用意して、画面に貼る** … \`new THREE.WebGLRenderer()\` と \`appendChild\`
- **中身を置いて、描く** … \`scene.add(box)\` と \`renderer.render(scene, camera)\`

この 4 つは、どんなに複雑なシーンでも変わりません。
1000 個のものが動く作品でも、いちばん外側の骨格はこれと同じです。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'lookAt は、位置を決めたあとに呼びます',
      text: `
camera.lookAt は「いまの自分の位置から、そこを向く」計算をします。
だから position を変えるより先に呼ぶと、古い位置を基準にした向きが残ります。

順番を逆にしても例外は出ません。ただ、狙いから外れた絵が出るだけです。
「なぜか少しずれている」の原因になりやすいところです。
`,
    },
    {
      kind: 'md',
      text: `
## カメラは、写す範囲を持っている

\`PerspectiveCamera\` の引数 4 つは、[](#/ch/10-camera)で見た視錐台そのものです。

- **画角**（50）… どれくらいの広さを写すか。**ここだけ度で指定します**
- **横縦比**（\`innerWidth / innerHeight\`）… 表示領域の形。ずれると絵が伸びます
- **near**（0.1）… これより手前は写らない
- **far**（100）… これより奥は写らない

初学者がいちばん引っかかるのは far です。
読み込んだモデルが 5000 単位の大きさだったりすると、**far の外に出て丸ごと消えます。**
「何も映らない」の原因の 3 割くらいはこれです。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{写る高さ} \\;=\\; 2 \\, z \\, \\tan\\!\\left(\\frac{\\text{fov}}{2}\\right)',
      readAloud:
        'カメラから距離 z のところで、画面の上端から下端までに何単位ぶんが写るか、という式です。[](#/ch/m26-perspective) で出した式と同じもので、こんどはカメラの引数を決めるために使います。',
      worked: {
        given: '画角 $50°$ のカメラを $z = 4$ に置きました。**大きさ 1 の箱**は、画面の何割を占めるでしょう。',
        steps: [
          { calc: 'fov / 2 = 25 度 = 0.4363 ラジアン' },
          { calc: 'tan(0.4363) = 0.4663' },
          { calc: '写る高さ = 2 x 4 x 0.4663 = 3.73', note: 'カメラから 4 の距離での縦の視野' },
          { calc: '1 / 3.73 = 0.268' },
        ],
        result:
          '**画面の高さのおよそ 27%** です。実際に上のサンドボックスを見ると、箱は画面の 4 分の 1 ほどの高さで写っています。**「もう少し大きく写したい」ときは、カメラを近づけるか、画角を小さくするかの 2 通り**があり、どちらを選ぶかで遠近の付き方が変わります（画角を小さくすると望遠レンズのように平べったくなります）。',
      },
    },
    {
      kind: 'md',
      text: `
## ライトの話は、ここでは 1 行だけ

\`MeshStandardMaterial\` は**光を受けて色が決まる**マテリアルです。
ライトを 1 つも置かなければ、色を指定していても真っ黒になります。

ここでは「置かないと黒い」とだけ覚えてください。
ライトの種類と使い分けは、[](#/ch/t05-light-shadow)からの 5 章でまとめて扱います。

黒いのがライトのせいかどうかを切り分けたいときは、
マテリアルを \`MeshBasicMaterial\` に差し替えてください。
**これは光を一切見ないマテリアル**なので、それで映れば原因はライトです。
`,
    },
    {
      kind: 'code',
      title: '真っ黒の切り分け ― 光を見ないマテリアルに差し替える',
      code: `// 光の影響を受けないので、ライトが無くても必ず色が出る
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0x4fd6ff }),
);

// これで映る  → 原因はライト
// これでも黒い → 原因はライト以外（scene.add 忘れ、カメラ、near/far …）`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスの \`scene.add(box)\` の行を、コメントアウトして実行してください。
何が起きますか。**エラーは出ますか。**`,
      hint: '`box` という変数自体は、ちゃんと作られています。',
      answer: `**箱が消えます。そしてエラーは出ません。**

ここが最初の関門です。\`new THREE.Mesh(...)\` は、ただ JavaScript のオブジェクトを 1 つ作っただけです。
**シーンに追加してはじめて「世界に存在するもの」になります。**

three はあなたが作ったものを勝手に探しません。追加されたものだけを描きます。
だから追加し忘れても、three からすれば「何も置かれていない世界を正しく描いた」だけで、
エラーを出す理由がありません。

**「エラーが出ないのに映らない」は、Three.js でいちばん多いつまずき方**です。
つねに「作った」と「置いた」を別々に確かめてください。`,
    },
    {
      prompt: `カメラの 4 番目の引数（far）を \`100\` から \`3\` に変えてください。
何が起きますか。**なぜ**でしょう。`,
      hint: 'カメラは z = 4 のあたりに立っていて、箱は原点にあります。',
      answer: `**箱が消えます。**

カメラから箱までの距離は約 4 です。far を 3 にすると「これより奥は写さない」の外に出ます。

near と far は「写す奥行きの範囲」を決めていて、その外にあるものは**存在しないのと同じ扱い**になります。
[](#/ch/m27-frustum)で見たとおり、この 2 つは深度の精度も決めているので、
やみくもに広げるのも良くありません。

実務では「モデルを読み込んだのに何も出ない」ときに真っ先に疑います。
書き出したモデルの単位がセンチメートルだと、**1.7m の人が 170 単位**になり、
far = 100 のカメラからは丸ごとはみ出します。`,
    },
    {
      prompt: `画角 $60°$ のカメラで、**高さ 2 の物体を画面いっぱい（高さの 100%）に写したい**。
カメラを距離いくつに置けばよいですか。手で計算してください。`,
      hint: '写る高さ $= 2z\\tan(\\text{fov}/2)$ を、$z$ について解きます。',
      answer: `**$z = 1.73$** です。

写る高さが 2 になればよいので、

$2 = 2z\\tan(30°)$

$\\tan(30°) = 0.5774$ なので、

$2 = 2z \\times 0.5774 = 1.1547z$

$z = 2 / 1.1547 = 1.732$

**$\\sqrt{3}$ です。** 画角 60 度は正三角形の角なので、こういうきれいな数になります。

実際には、ぴったり 100% にすると端が切れて見えるので、
**1 割ほど余裕を持たせて $z = 1.9$ あたり**に置きます。
読み込んだモデルにカメラを自動で合わせる処理（フレーミング）は、この計算そのものです。`,
      answerCode: `// 物体の高さ h を、画面いっぱいに収めるカメラ距離
const h = 2;
const fov = 60;
const z = (h / 2) / Math.tan(THREE.MathUtils.degToRad(fov) / 2);

camera.position.set(0, 0, z * 1.1);   // 1割の余裕
camera.lookAt(0, 0, 0);`,
    },
  ],
  quiz: [
    {
      q: '`new THREE.Mesh(...)` で箱を作ったのに、画面に出ません。エラーも出ていません。まず疑うのはどれですか。',
      choices: [
        '`scene.add()` を呼び忘れている',
        'ブラウザが WebGL に対応していない',
        'ジオメトリの大きさが 0',
        '`Mesh` の綴りが違う',
      ],
      answer: 0,
      explain:
        '作ることと、世界に置くことは別です。three は追加されたものだけを描くので、追加し忘れても「空の世界を正しく描いた」だけになり、エラーを出しません。「エラーが出ないのに映らない」の代表格です。',
    },
    {
      q: '`MeshStandardMaterial` を使った物体が真っ黒に映ります。**まず**確認すべきはどれですか。',
      choices: [
        'シーンにライトを置いたか',
        'カメラの far が小さすぎないか',
        'ピクセル比の設定',
        'ブラウザの拡大率',
      ],
      answer: 0,
      explain:
        '`MeshStandardMaterial` は光を受けて色が決まる材質なので、ライトがないと真っ黒です。切り分けには、光の影響を受けない `MeshBasicMaterial` に一時的に差し替えるのが手早い方法です。',
    },
    {
      q: '`renderer.render(scene, camera)` を 1 回だけ呼んだ場合、どうなりますか。',
      choices: [
        'その瞬間の状態が 1 枚描かれるだけで、以降は動かない',
        'エラーになる',
        '自動的に毎フレーム描き続ける',
        '何も描かれない',
      ],
      answer: 0,
      explain:
        'render は「いまの状態を 1 枚描く」命令です。静止画でよければ 1 回で十分で、そのほうがずっと軽くなります。動かすには呼び続ける必要があり、その方法が次の章です。',
    },
  ],
};
