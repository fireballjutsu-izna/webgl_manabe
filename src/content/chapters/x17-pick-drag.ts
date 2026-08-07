import type { Chapter } from '../types.ts';

export const chapterX17: Chapter = {
  slug: 'x17-pick-drag',
  part: 'project',
  number: 17,
  title: 'クリックで選ぶ ― ドラッグと区別する',
  goal: '画面のクリックから天体を選べるようになり、視点を回しただけのドラッグをクリックと誤認しない書き方を、閾値の根拠込みで説明できるようになります。',
  requires: ['x16-orbit-motion', 't08-raycaster', 'w29-controls-ux'],
  threeApis: [
    'Raycaster',
    'Raycaster.setFromCamera',
    'Raycaster.intersectObjects',
    'Vector2',
    'Object3D.name',
  ],
  mathRecall: [
    { slug: 'm28-ndc', note: '画面の座標を $-1$〜$1$ に直す' },
    { slug: 't08-raycaster', note: '光線を飛ばして、当たったものを調べる' },
    { slug: 'b11-distance', note: '$2$ 点の距離。ここでは画面の上で測る' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 触れるようにする

見るだけの惑星に、**選ぶ**という動作を足します。

やることは[](#/ch/t08-raycaster)でやったとおりです。

- 画面の座標を $-1$〜$1$ の{{正規化デバイス座標}}に直す
- そこからカメラ越しに光線を $1$ 本飛ばす
- 何に当たったかを調べる

$3$ 行で書けます。**問題は、そのあとに起きます。**
`,
    },
    {
      kind: 'md',
      text: `
## OrbitControls と、けんかする

この画面には[](#/ch/t07-controls)の \`OrbitControls\` が付いています。
つまり**ドラッグは「視点を回す」ための操作**です。

ところが素直に \`click\` を待つと、こうなります。

- 惑星の上で押して、ぐるっと視点を回して、離す
- ブラウザはそれを**クリックとして通知します**
- 「回そうとしただけなのに、知らない星に寄っていった」

この事故は、$3$ 次元の画面ではほぼ必ず起きます。
**同じ入力（押す・動かす・離す）に、$2$ つの意味を載せている**からです。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '紙の上のペンと同じ区別',
      text: `
紙にペンを置いて、そのまま離せば「点を打った」。
置いてから動かして離せば「線を引いた」。

**人間は、押してから離すまでに動いたかどうかで、意図を区別しています。**

画面でも同じ区別をすればよく、
必要なのは「**どれだけ動いたら線とみなすか**」の $1$ 数だけです。

紙のペンなら $0$ に近い値でよいのですが、
画面では**指もマウスも必ず数ピクセル揺れます。**
だから $0$ ではなく、揺れより大きく、意図的な移動より小さい値を選びます。
`,
    },
    {
      kind: 'md',
      text: `
## 押した場所と、離した場所の距離を測る

直し方は拍子抜けするほど簡単です。

- \`pointerdown\` で座標を覚える
- \`pointerup\` で、そこからの距離を測る
- **数ピクセル以内ならクリック、それ以上ならドラッグ**

距離は[](#/ch/b11-distance)のとおり \`Math.hypot(dx, dy)\` で出ます。
この作品では閾値を **$4$ ピクセル**にしています。
`,
    },
    {
      kind: 'code',
      title: 'クリックとドラッグを分ける ― これだけ',
      code: `let downX = 0;
let downY = 0;

renderer.domElement.addEventListener('pointerdown', (event) => {
  downX = event.clientX;
  downY = event.clientY;
});

renderer.domElement.addEventListener('pointerup', (event) => {
  // 押した場所から動いていたら、視点を回しただけなのでクリックとみなさない
  const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
  if (moved > 4) return;

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(targets, false);
  if (hits.length > 0) select(hits[0].object);
});`,
    },
    {
      kind: 'md',
      text: `
## 4 は、どれくらいの量なのか

閾値を決めるとき、$4$ という数字が大きいのか小さいのか分かりません。
**世界の単位に翻訳すると、感覚がつかめます。**

画面の $1$ ピクセルが、カメラから距離 $z$ のところで
世界のどれだけの幅にあたるか ― これは[](#/ch/m26-perspective)の式から出ます。
`,
    },
    {
      kind: 'formula',
      tex: 'w_{\\text{px}} \\;=\\; \\dfrac{2\\,z\\,\\tan(\\mathrm{fov}/2)}{H}',
      readAloud:
        '距離 $z$ のところで画面に写る高さは $2z\\tan(\\mathrm{fov}/2)$ です。それを画面の高さ $H$ ピクセルで割れば、$1$ ピクセルが受け持つ世界の幅になります。',
      worked: {
        given: '画角 $45$ 度、画面の高さ $900$ ピクセル、惑星までの距離 $8$ のとき。',
        steps: [
          { calc: 'tan(45/2 度) = tan(22.5 度) = 0.4142' },
          { calc: '写る高さ = 2 x 8 x 0.4142 = 6.627' },
          { calc: '1 px = 6.627 / 900 = 0.00736' },
          { calc: '4 px = 0.02945' },
          { calc: '惑星の半径 1.6 に対する比' },
          { calc: '  = 0.02945 / 1.6 = 1.84%' },
        ],
        result:
          '**$4$ ピクセルは、惑星の半径の $1.84\\%$ にあたります。** 直径で言えば $1\\%$ 弱 ― 「同じ場所を押して離した」と言ってよい範囲です。逆に $40$ ピクセルにすると半径の $18\\%$ になり、惑星の端から端へ指を滑らせてもクリック扱いになってしまいます。**$4$ は、手の揺れより大きく、意図的な移動より十分小さい**という位置にあります。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'それでも、閾値は世界の単位で決めてはいけません',
      text: `
上で世界の単位に翻訳したのは、**$4$ という数の感覚をつかむため**だけです。

**判定そのものは、必ず画面のピクセルで行ってください。**

理由は、揺れているのが**手**だからです。

- 手の揺れは「画面の上で何ピクセル」で決まります
- 世界の単位に直すと、**カメラが寄っているときだけ閾値が厳しくなります**

寄って見ているときほど、わずかな指の揺れが大きな世界座標の移動になります。
世界の単位で $0.03$ と決めてしまうと、
**寄るとクリックが効かなくなる**という、原因のつかめない不具合になります。

**入力の判定は、入力の起きた空間で行う。**
`,
    },
    {
      kind: 'md',
      text: `
## タッチは、もっと揺れます

指はマウスより不器用です。押したつもりでも $10$ ピクセル動くことがあります。

\`pointerup\` のイベントには \`pointerType\` が入っているので、分けられます。

- \`'mouse'\` … $4$ ピクセル
- \`'touch'\` / \`'pen'\` … $10$ ピクセル前後

**この作品では分けていません。** 遠景の天体 $2$ つを選ぶだけなので、
取りこぼしても押し直せば済むからです。

分ける価値があるのは、**押し直しに費用があるとき**です。
「ボタンを $1$ 回押すと購入が確定する」ような場面では、
むしろ閾値を厳しくして、取りこぼすほうを選びます。
`,
    },
    {
      kind: 'sandbox',
      title: '閾値のある・なしを、並べて触る',
      guide: { focus: ['クリックとドラッグを分ける', '選んだものを光らせる'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const THRESHOLD = 4;   // ピクセル。0 にすると、視点を回しただけで選ばれる

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 100);
camera.position.set(0, 2.6, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const sun = new THREE.DirectionalLight(0xfff2e0, 3.2);
sun.position.set(6, 4, 5);
scene.add(sun, new THREE.AmbientLight(0x22334a, 0.4));

const targets = [];
[
  { name: '惑星', x: -2.4, r: 1.3, color: 0x3d6a8f },
  { name: '月', x: 1.6, r: 0.7, color: 0x9aa3b2 },
  { name: '衛星', x: 3.6, r: 0.4, color: 0xb08f6a },
].forEach((spec) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(spec.r, 48, 32),
    new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.85 }),
  );
  mesh.position.x = spec.x;
  mesh.name = spec.name;
  scene.add(mesh);
  targets.push(mesh);
});

/* ---- 選んだものを光らせる ---- */
// 選択そのものは「色を変える」だけ。寄る動きは次の章で足す

let selected = null;

function select(object) {
  if (selected) selected.material.emissive.setHex(0x000000);
  selected = object;
  if (selected) selected.material.emissive.setHex(0x3a2a10);
  say(object ? object.name + ' を選びました' : '選択を外しました');
}

/* ---- クリックとドラッグを分ける ---- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downX = 0;
let downY = 0;

renderer.domElement.addEventListener('pointerdown', (event) => {
  downX = event.clientX;
  downY = event.clientY;
});

renderer.domElement.addEventListener('pointerup', (event) => {
  // 押した場所からどれだけ動いたか。画面のピクセルで測るのが要点
  const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
  if (moved > THRESHOLD) {
    say('ドラッグ（' + moved.toFixed(1) + ' px 動いた）― 選ばない');
    return;
  }

  // 画面の座標を -1〜1 の正規化デバイス座標へ
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(targets, false);
  select(hits.length > 0 ? hits[0].object : null);
});

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; bottom:16px; left:16px; color:#9fb4d8;' +
  'font:12px/1.7 ui-monospace, monospace; pointer-events:none;';
readout.textContent = '球を押して離すと選べます（閾値 ' + THRESHOLD + ' px）';
document.body.appendChild(readout);

function say(text) {
  readout.textContent = text + '（閾値 ' + THRESHOLD + ' px）';
}

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
        '球を押して離すと選ばれ、うっすら光ります。押したまま視点をぐるっと回して離すと「ドラッグ」と表示され、選ばれません ― 何ピクセル動いたかも出ます。`THRESHOLD` を $0$ にすると、**視点を回すたびに勝手に選ばれる**あの不具合が再現できます。$200$ にすると、画面の端から端まで振り回してもクリック扱いになります。',
    },
    {
      kind: 'md',
      text: `
## 何も無いところを押したときも、意味がある

\`intersectObjects\` が空の配列を返したとき、
**「何も起きない」にするか「選択を外す」にするか**は、自分で決めることです。

この作品では**外します。** そして次の章では、
それを「引いて全体を見る」という動きにつなげます。

**空振りを操作として扱う**と、
「戻る」ボタンを画面に置かずに済みます。
地図アプリでピンを閉じるとき、たいてい何も無い場所を押していると思います。
`,
    },
  ],
  exercises: [
    {
      prompt: `閾値を $4$ ピクセルではなく「世界の距離で $0.03$」にしたとします。

カメラが惑星に寄って、距離が $8$ から $3$ になったとき、
実質的な閾値は画面の何ピクセルになりますか。`,
      hint: '$1$ ピクセルの受け持つ世界の幅は、距離に比例します。',
      answer: `**約 $10.9$ ピクセルになります。閾値が $2.7$ 倍ゆるくなります。**

**計算**

距離 $3$ のときの $1$ ピクセル

$w = \\dfrac{2 \\times 3 \\times 0.4142}{900} = 0.00276$

$0.03 \\div 0.00276 = 10.9$ ピクセル

**逆に、引くと厳しくなる**

距離 $20$ まで引くと $w = 0.01842$ なので、$0.03$ は **$1.6$ ピクセル**です。

手の揺れが $2$ ピクセルあれば、**引いた状態ではクリックがほとんど通りません。**

**症状としてどう出るか**

- 寄っているときは、雑に触っても選べる
- 引いているときは、丁寧に押しても選べない

使う人は「**なんとなく反応が悪いときがある**」としか言えません。
再現手順が書けないので、報告も来ません。

**教訓**

**入力の判定は、入力の起きた空間で。**

指が揺れるのは画面の上なので、閾値も画面の上で決めます。
世界の単位への翻訳は、**数の大きさを感じるためだけ**に使ってください。`,
    },
    {
      prompt: `\`pointerdown\` を \`renderer.domElement\` ではなく \`window\` に付けたとします。

どんなときに困りますか。`,
      hint: 'このページには、キャンバス以外の要素もあります。',
      answer: `**キャンバスの外で押した操作まで拾ってしまいます。**

**何が起きるか**

- 説明文を選択しようとしてドラッグ → \`pointerdown\` が走る
- そのまま指がキャンバスに入って離す → \`pointerup\` も走る
- 移動量が小さければ、**触っていない天体が選ばれます**

このサイトのように、$3$ 次元の画面がページの一部に埋まっている場合、
**キャンバスの外はまったく別の文脈**です。

**逆に window に付けたい場合もある**

\`pointerup\` だけは \`window\` に付けるのが有効なことがあります。
**キャンバスの外で指を離したときに、押しっぱなしの状態が残らない**ようにするためです。

ドラッグ中に画面の外へ出て離す ― これは日常的に起きます。

**使い分け**

| イベント | 付ける先 | 理由 |
|---|---|---|
| \`pointerdown\` | キャンバス | ここで始まった操作だけを扱いたい |
| \`pointerup\` | キャンバス（または window） | 外で離されたときの後始末が要るなら window |
| \`pointermove\` | window | ドラッグ中は外へ出ても追いたい |

**始まりは狭く、続きは広く**が目安です。`,
    },
    {
      prompt: `\`raycaster.intersectObjects(targets, false)\` の第 $2$ 引数が \`false\` です。

これを \`true\` にすると何が変わりますか。この作品ではどちらが正しいですか。`,
      hint: '第 $2$ 引数は「子まで調べるか」です。天体には何が付いていましたか。',
      answer: `**\`true\` にすると、子オブジェクトまで判定の対象になります。**

**この作品では \`false\` が正しい**

天体には子が付いています。

- ラベル（\`CSS2DObject\`）
- 前の章では、向きを示すオレンジの印

\`true\` にすると、**印を押したときに「印」が返ってきます。**
返ってきた \`hits[0].object\` は月ではないので、
「月に寄る」処理が動かないか、印の位置に寄ってしまいます。

**それでも true が要る場面**

読み込んだモデルは、たいてい**入れ子の塊**です。

\`glTF\` を読み込んで \`intersectObjects([model], false)\` とすると、
model 自身は Group で面を持たないので**何にも当たりません。**

そのときは \`true\` にして子を掘り、
当たった面から \`object.parent\` をたどって「どの部品か」を決めます。

**判断の基準**

- **自分で組み立てたもの** … \`false\` にして、判定させたいものだけを配列に入れる
- **読み込んだもの** … \`true\` にして、当たった先から親をたどる

前者のほうが速く、意図もはっきりします。
**判定に出したいものを、自分で列挙できるなら列挙してください。**`,
    },
  ],
  quiz: [
    {
      q: '`OrbitControls` のある画面で、ドラッグとクリックを区別する簡単な方法はどれですか。',
      choices: [
        'pointerdown の座標を覚えておき、pointerup までの移動が数ピクセル以内ならクリックとみなす',
        'OrbitControls を一時的に無効にする',
        'click イベントの代わりに dblclick を使う',
        'Raycaster の精度を上げる',
      ],
      answer: 0,
      explain:
        '押してから離すまでに動いたかどうかで意図を分ける、という人間の区別をそのまま写します。数ピクセルの閾値を置くだけで、視点を回したつもりが選択になる事故が消えます。この作品では 4 ピクセルで、カメラ距離 8・画角 45 度・高さ 900px なら惑星の半径の 1.84% にあたります。',
    },
    {
      q: 'ドラッグ判定の閾値を「世界の距離」で決めると、何が起きますか。',
      choices: [
        'カメラが引いているときほど閾値が厳しくなり、クリックが通りにくくなる',
        'どの距離でも同じ操作感になる',
        'タッチだけが効かなくなる',
        '何も変わらない。画面のピクセルと等価だから',
      ],
      answer: 0,
      explain:
        '1 ピクセルが受け持つ世界の幅は距離に比例します。世界の距離で 0.03 と決めると、距離 3 では 10.9 ピクセル、距離 20 では 1.6 ピクセル相当になります。手が揺れるのは画面の上なので、判定も画面のピクセルで行います。入力の判定は、入力の起きた空間で。',
    },
    {
      q: '`intersectObjects(targets, false)` の `false` は何を意味しますか。',
      choices: [
        '子オブジェクトは判定しない。自分で並べた targets の要素だけを調べる',
        '当たり判定を無効にする',
        '最初の 1 つで打ち切らない',
        '裏面を無視する',
      ],
      answer: 0,
      explain:
        '第 2 引数は「子まで再帰的に調べるか」です。天体にラベルや印が子として付いていると、true では印のほうが返ってきてしまいます。自分で組み立てたシーンなら、判定に出したいものを配列で列挙して false にするのが速く、意図もはっきりします。読み込んだモデルのように中身が入れ子なら true にして、当たった面から親をたどります。',
    },
  ],
};
