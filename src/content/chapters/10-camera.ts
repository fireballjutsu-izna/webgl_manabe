import type { Chapter } from '../types.ts';

export const chapter10: Chapter = {
  slug: '10-camera',
  part: 'math3d',
  number: 25,
  title: 'カメラと投影',
  goal: '「なぜ映らないのか」を自分で切り分けられるようになり、画角や near / far を目的に合わせて選べるようになります。',
  requires: ['05-trig', '06-matrix'],
  threeApis: [
    'PerspectiveCamera',
    'OrthographicCamera',
    'Camera.near',
    'Camera.far',
    'PerspectiveCamera.fov',
    'Camera.updateProjectionMatrix',
    'Object3D.lookAt',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## まず、どこで困るか

3D で最初に出会う理不尽が「何も映らない」です。エラーも出ず、真っ黒な画面だけが残ります。

原因はほぼこの 3 つに絞れます。

- カメラの向いている先に物体がない
- 物体が **near より手前**、または **far より奥**にある
- 物体が画角の外にいる

どれも「カメラに写る範囲」を知っていれば一瞬で切り分けられます。その範囲が{{視錐台}}です。
`,
    },
    {
      kind: 'md',
      text: `
## 視錐台 ― 写る範囲は「先を切った四角錐」

カメラから前方に広がる四角錐を思い浮かべてください。ただし先端は切り落とされ、
奥にも底があります。この閉じた立体の**中に入っているものだけ**が画面に描かれます。

- **near** … 手前の切り口。これより近いものは写らない
- **far** … 奥の底。これより遠いものは写らない
- **{{画角}}（FOV）** … 錐がどれだけ大きく開いているか
- **アスペクト比** … 画面の横縦比。ふつうはキャンバスのサイズに合わせる
`,
    },
    {
      kind: 'demo',
      id: 'frustum-viewer',
      caption:
        '外から見た視錐台の中に、左下の子画面としてそのカメラの映像を重ねています。near を大きくすると手前の箱が消え、far を小さくすると奥の箱が消えるのを、2つの画面で同時に確かめてください。範囲から外れた箱は薄く表示されます。',
    },
    {
      kind: 'md',
      text: `
## 画角 ― 広さと遠近感はセット

{{画角}}（FOV）は縦方向の視野角を度で指定します。Three.js の既定は 50 度です。

- **狭い（20〜35 度）** … 望遠。遠近感が弱まり、平たく落ち着いた画になる
- **ふつう（45〜60 度）** … 自然な見え方
- **広い（80 度以上）** … 広角。遠近感が強調され、端が引き伸ばされる

大事なのは、**画角を変えると「写る範囲」と「遠近感の強さ」が同時に変わる**ことです。
被写体の大きさを保ったまま遠近感だけを変えたいなら、画角とカメラの距離を同時に動かします
（映画でいうドリーズームです）。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'near を極端に小さくしてはいけません',
      text: `
「手前が切れるのが嫌だから \`near = 0.0001\`」——これは深刻な不具合を生みます。
奥行きの情報は限られた精度で記録されており、near と far の**比**が大きいほど精度が落ちます。
結果、遠くの面がちらついたり、重なり順が入れ替わったりします（Z ファイティング）。
near はシーンで意味のある最小距離まで大きくしてください。0.1 で足りることがほとんどです。
`,
    },
    {
      kind: 'md',
      text: `
## 透視投影と正射影

{{透視投影}}は、遠くのものほど小さく写る、目やカメラと同じ写し方です。
3D らしい絵が欲しいならこちらです。

{{正射影}}は、距離にかかわらず同じ大きさで写します。遠近感がまったくないので、
設計図や、2D 風のゲーム、アイソメトリックな見た目に使われます。
正射影に画角はありません。かわりに「写す範囲の幅と高さ」を直接指定します。
`,
    },
    {
      kind: 'code',
      title: '2種類のカメラ',
      code: `import * as THREE from 'three';

// 透視投影：画角・アスペクト比・near・far
const camera = new THREE.PerspectiveCamera(
  50,                                  // FOV（度で指定する。ここだけ度）
  window.innerWidth / window.innerHeight,
  0.1,                                 // near
  1000,                                // far
);
camera.position.set(0, 2, 6);
camera.lookAt(0, 0, 0);

// 正射影：左右上下の範囲を直接決める
const height = 6;
const aspect = window.innerWidth / window.innerHeight;
const ortho = new THREE.OrthographicCamera(
  (-height * aspect) / 2,
  (height * aspect) / 2,
  height / 2,
  -height / 2,
  0.1,
  100,
);

// 画面サイズが変わったら、必ずこの2行をセットで
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();   // これを忘れると反映されない
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'updateProjectionMatrix を忘れない',
      text: `
\`fov\`・\`near\`・\`far\`・\`aspect\` を書き換えても、それだけでは何も起きません。
これらは行列を作るための材料であって、実際に使われるのは
組み立て済みの投影行列だからです。変えたら必ず \`camera.updateProjectionMatrix()\` を呼びます。
`,
    },
    {
      kind: 'md',
      text: `
## 投影は「行列で潰す」こと

[第6章](#/ch/06-matrix)で見た行列が、ここでも働いています。
3D の点が画面に出るまでには、行列が 3 回かかります。

- **ワールド行列** … 物体をシーンの中に配置する（[第9章](#/ch/09-hierarchy)）
- **ビュー行列** … カメラを原点に置いた座標系に世界ごと移す（カメラのワールド行列の逆）
- **投影行列** … 視錐台を、都合のよい立方体に潰す

3 つ目が投影です。「遠くのものを小さくする」という遠近感は、
この行列の中で座標を奥行きで割ることによって作られています。
`,
    },
    {
      kind: 'md',
      text: `
## lookAt ― 向きだけを決める

カメラをどこかへ向けたいときは \`lookAt\` を使います。位置は動かさず、姿勢だけを変えます。

注意点が 2 つあります。

- **位置を変えたあとに呼ぶこと**。順番が逆だと古い位置を基準に向きが決まります
- **OrbitControls などを使っているときは効きません**。毎フレーム上書きされるためです。
  この場合は \`controls.target\` を動かします
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '「映らない」ときの確認順',
      text: `
1. カメラと物体の位置を \`console.log\` で見る（そもそも同じ場所にいないか）
2. \`near\` を 0.1、\`far\` を 1000 にして、範囲の問題かを切り分ける
3. \`scene.add()\` を呼んだか確認する
4. マテリアルの色が背景と同じでないか、ライトを置いたかを確認する
`,
    },
  ],
  exercises: [
    {
      prompt: `デモで FOV を 20 度と 100 度にして見比べてください。**写る範囲**と**手前の物の大きさ**がどう変わりますか。
そのうえで「FOV を上げる」と「カメラを引く」は何が違うのかを説明してください。`,
      hint: '両方とも「たくさん写る」ようになりますが、奥行きの見え方が違います。',
      answer: `FOV を上げると写る範囲は広がりますが、**手前のものが極端に大きく、奥が急に小さく**なります（遠近が強調される）。
カメラを引いた場合は、遠近の付き方はほとんど変わらないまま、全体が小さくなります。
広角レンズと望遠レンズの違いそのもので、**同じ「引いた絵」でも印象がまったく変わります**。`,
    },
    {
      prompt: 'near を 0.001 のように極端に小さくすると、遠くの面がちらついて重なりが入れ替わることがあります。なぜでしょう。',
      hint: '奥行きの値は、near と far のあいだに均等には配られていません。',
      answer: `深度バッファの精度が **near のすぐ手前に集中して配られる**からです。
near を小さくすればするほど、遠くに回せる精度が減り、奥行きの近い面どうしを区別できなくなります
（この、ちらつきながら重なりが入れ替わる現象を Z ファイティングと呼びます）。
直し方は far を減らすことではなく、**near をできるだけ大きくする**ことです。`,
    },
    {
      prompt: 'ウィンドウの大きさが変わったとき、映像が縦に伸びてしまいました。何を忘れていますか。',
      hint: 'レンダラの大きさだけ変えても、カメラは自分の縦横比を知りません。',
      answer: `\`camera.aspect\` の更新と、\`updateProjectionMatrix()\` の呼び出しです。
投影行列は毎フレーム作り直されるわけではなく、**明示的に更新するまで古いまま**使われます。
\`setSize\` だけを直して \`aspect\` を忘れる、というのがいちばんよくある形です。`,
      answerCode: `window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); // これを忘れると伸びたまま
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
    },
  ],
  quiz: [
    {
      q: '物体がカメラのすぐ目の前にあるのに映りません。まず疑うべきはどれですか。',
      choices: [
        '`near` の値が、物体までの距離より大きい',
        '`far` の値が小さすぎる',
        'FOV が狭すぎる',
        'アスペクト比が間違っている',
      ],
      answer: 0,
      explain:
        'near より手前にあるものは切り落とされます。近すぎて消えているときは near を小さく（ただし小さくしすぎない）してください。',
    },
    {
      q: '`camera.fov` を書き換えたのに見え方が変わりません。原因はどれですか。',
      choices: [
        '`camera.updateProjectionMatrix()` を呼んでいない',
        'fov はラジアンで指定する必要がある',
        'PerspectiveCamera では fov を変更できない',
        'renderer を作り直す必要がある',
      ],
      answer: 0,
      explain:
        'fov は投影行列を作るための材料です。書き換えたあとに行列を組み直さないと、描画には反映されません。なお fov は例外的に「度」で指定します。',
    },
    {
      q: '遠くのものも近くのものも同じ大きさで写したいとき、使うカメラはどれですか。',
      choices: ['OrthographicCamera', 'PerspectiveCamera', 'ArrayCamera', 'CubeCamera'],
      answer: 0,
      explain:
        '正射影のカメラです。遠近感がないので、設計図的な見た目やアイソメトリックなゲームに向いています。画角ではなく、写す範囲の幅と高さを指定します。',
    },
  ],
};
