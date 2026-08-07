import type { Chapter } from '../types.ts';

export const chapterY21: Chapter = {
  slug: 'y21-reach',
  part: 'polish',
  number: 21,
  title: '届く相手を増やす ― 触り方と、壊れない備え',
  goal: 'マウスが使えない人・動きがつらい人・$WebGL$ が動かない環境に、それぞれ何を用意すればよいか言えるようになります。',
  requires: ['y20-loading'],
  threeApis: ['WebGLRenderer', 'OrbitControls', 'Clock'],
  mathRecall: [
    { slug: 'y20-loading', note: '待たせ方。ここでは「届かせ方」です' },
    { slug: 't10-scene-graph', note: '$WebGL$ のコンテキストは有限' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 触れることが、見た目から分からない

$3$ 次元の画面は、**ただの絵と区別が付きません。**

動画かもしれない、画像かもしれない ―
**ドラッグできると知らない人は、ドラッグしません。**

少なくとも、この $3$ つを入れてください。

- **一言の案内。** 「ドラッグで回転」の $1$ 行があるだけで、触ってもらえる率が変わります
  （このサイトのデモが右下に出しているものです）
- **キーボードでも動かせるように。** マウスが使えない人がいます。
  矢印キーでカメラを回すだけでも、まったく触れないよりずっとよい
- **\`prefers-reduced-motion\` を尊重する。** 自動で動き続ける画面が
  つらい人がいます

$3$ つめは「配慮」ではなく**設計の問題**です。
**自動回転しないと何も分からない画面は、そもそも情報が足りていません。**
`,
    },
    {
      kind: 'code',
      title: '動きを減らす設定を見る',
      code: `const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // 自動で動くものだけを止める。手で操作するぶんは残す
  if (!reduceMotion) {
    planet.rotation.y += dt * 0.05;
  }

  controls.update();
  renderer.render(scene, camera);
}`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '止めるのは「勝手に動くもの」だけ',
      text: `
\`prefers-reduced-motion\` で全部止めてしまうと、**ただ使えない画面**になります。

- **止める** … 自動回転、自動でめぐるカメラ、ゆらぐ雲、脈打つ光
- **残す** … ドラッグへの反応、クリックへの反応、キー操作

境目は「**その人が起こした動きか**」です。
自分で回したものが動くのは、酔いの原因になりません。

そして止めたときに、**中身が伝わるかを確かめてください。**

- 自動回転していた惑星 … 止めても、球であることは分かる。**問題なし**
- 自動でめぐるカメラで街を見せていた … 止めると、**$1$ 方向からしか見えない**

$2$ つめは作りの問題です。
**最初の視点だけで作品が成立するように**組み直してください。
`,
    },
    {
      kind: 'md',
      text: `
## キーボードで動かす

\`OrbitControls\` は、\`listenToKeyEvents\` を呼べば矢印キーで**平行移動**できます。
ただし**回転はできません。**

回転させたいなら、自分で数行書きます。
[](#/ch/m22-spherical)でやった球面座標が、そのまま使えます。

書くときに $2$ つ注意があります。

- **キャンバスに \`tabindex="0"\` を付ける。** そうしないと、
  そもそもフォーカスが当たりません
- **フォーカスが分かるようにする。** 枠線を消さないでください。
  どこが操作対象か見えないと、キーボードだけの人は迷子になります
`,
    },
    {
      kind: 'code',
      title: '矢印キーで、カメラを回す',
      code: `renderer.domElement.tabIndex = 0;   // フォーカスを受け取れるようにする

// m22 の球面座標。角度を持って、そこから位置を作る
let theta = Math.PI * 0.25;   // 水平方向
let phi = Math.PI * 0.35;     // 天頂からの角度
const radius = 6;

function applyCamera() {
  camera.position.set(
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta),
  );
  camera.lookAt(0, 0, 0);
}
applyCamera();

renderer.domElement.addEventListener('keydown', (event) => {
  const step = 0.08;
  if (event.key === 'ArrowLeft') theta -= step;
  else if (event.key === 'ArrowRight') theta += step;
  else if (event.key === 'ArrowUp') phi = Math.max(0.15, phi - step);
  else if (event.key === 'ArrowDown') phi = Math.min(Math.PI - 0.15, phi + step);
  else return;                 // 知らないキーは、ブラウザに任せる

  event.preventDefault();      // 矢印キーでのスクロールを止める
  applyCamera();
});`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'preventDefault は、処理したキーだけ',
      text: `
上のコードで \`else return;\` を先に書いているのは、そのためです。

**全部のキーで \`preventDefault\` を呼ぶと、$\\mathrm{Tab}$ で抜けられなくなります。**

キーボードだけで操作している人にとって、これは**閉じ込め**です。
$3$ 次元のキャンバスに入ったら最後、ページのどこへも行けません。

守ることは $2$ つ。

- **自分が使うキーだけ \`preventDefault\`**
- **$\\mathrm{Tab}$ と $\\mathrm{Esc}$ は、絶対に奪わない**

$\\mathrm{Tab}$ は脱出口、$\\mathrm{Esc}$ は中止です。
`,
    },
    {
      kind: 'md',
      text: `
## 動かない環境で、壊れないようにする

$WebGL$ が使えない環境は、いまでも存在します。
古い端末、無効化された設定、省電力モード、$GPU$ のドライバの問題。

**何も出ないより、理由が出るほうがずっとよい**です。

\`WebGLRenderer\` の生成は、使えない環境では例外を投げます。
囲っておいて、代わりのものを出してください。
`,
    },
    {
      kind: 'code',
      title: '使えないときに、何か見せる',
      code: `let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (error) {
  const notice = document.createElement('p');
  notice.textContent =
    'この環境では 3D を表示できませんでした。' +
    'ブラウザの設定でハードウェアアクセラレーションが有効か確認してください。';
  document.body.appendChild(notice);
  throw error;   // ここで止める（以降のコードは動かせない）
}

// コンテキストが途中で失われることもある（タブの復帰、GPU の再起動など）
renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();   // これを呼ぶと、復帰の望みが残る
  console.warn('WebGL のコンテキストが失われました');
});

renderer.domElement.addEventListener('webglcontextrestored', () => {
  // three が資源を作り直す。こちら側でやることは、たいてい無い
  console.info('WebGL のコンテキストが戻りました');
});`,
    },
    {
      kind: 'md',
      text: `
## コンテキストは、有限です

[](#/ch/t10-scene-graph)で見たとおり、
ブラウザが同時に持てる $WebGL$ のコンテキストは**$8$〜$16$ 個**しかありません。

$1$ ページに $3$ 次元を埋め込むなら、**離れるときに解放**してください。

\`renderer.dispose()\` だけでは足りません。
ジオメトリ・マテリアル・テクスチャも \`scene.traverse()\` でたどって解放します。

このサイトの \`src/three/stage.ts\` が、まさにそれをやっている実物です ―
$265$ 行のうち、\`dispose\` が**$18$ か所**に出てきます。

そして、**上限を超えたときの挙動は静かです。**
古いコンテキストが黙って失われ、**そちらの画面が黒くなります。**
エラーは出ません。$4$ つめの章を開いたら $1$ つめが黒い、という形で気づきます。
`,
    },
  ],
  exercises: [
    {
      prompt: `\`prefers-reduced-motion: reduce\` のとき、\`controls.update()\` も止めるべきですか。`,
      hint: 'その動きは、誰が起こしたものですか。',
      answer: `**止めてはいけません。**

**境目は「誰が起こした動きか」**

- **止める** … 自動回転、自動でめぐるカメラ、ゆらぐ雲、脈打つ光
- **残す** … ドラッグへの反応、クリック、キー操作

\`controls.update()\` は**その人がドラッグした結果**を反映する処理です。

止めれば、**ただ操作できない画面**になります。

**なぜ自分の動きは大丈夫なのか**

酔いや不快感は、**予期しない動き**から起きます。

自分でドラッグして回るのは予期した動きなので、原因になりません。

**ただし $1$ つ注意**

\`enableDamping\` の余韻（手を離したあとも少し回り続ける）は、
**予期しない動き寄り**です。

気になるなら、\`reduceMotion\` のとき \`enableDamping = false\` にしてください。

**そして、止めたあとを確かめる**

自動回転を止めても中身が伝わるか。

- 惑星 … 止めても球だと分かる。**問題なし**
- 自動でめぐるカメラで見せていた街 … **$1$ 方向からしか見えない**

$2$ つめは作りの問題です。**最初の視点だけで成立するように**組み直してください。`,
    },
    {
      prompt: `キー操作を足すとき、\`preventDefault\` を**すべての \`keydown\` で呼ぶ**と何が起きますか。`,
      hint: 'キーボードだけでページを操作している人を想像してください。',
      answer: `**$\\mathrm{Tab}$ で抜け出せなくなります。**

**何が起きるか**

$\\mathrm{Tab}$ はフォーカスを次の要素へ移すキーです。

\`preventDefault\` で潰すと、**フォーカスがキャンバスに居座ります。**

キーボードだけで操作している人は、$3$ 次元の画面に入ったら最後、
**ページのどこへも行けません。**

これは**閉じ込め**です。

**正しい書き方**

自分が使うキー**だけ**を処理し、それ以外は素通しします。

- \`if (知らないキー) return;\` を**先に**書く
- そのあとで \`preventDefault()\`

上のコードで \`else return;\` が \`preventDefault\` より前にあるのは、これです。

**絶対に奪ってはいけないキー**

- **$\\mathrm{Tab}$** … 脱出口
- **$\\mathrm{Esc}$** … 中止

ついでに、**$\\mathrm{Ctrl}$ や $\\mathrm{Cmd}$ と一緒に押されたとき**も素通しします。
ブラウザの操作を奪わないためです。

**確かめ方**

**マウスを使わずに、自分のページを端から端まで操作**してみてください。

$1$ 分やれば、たいてい見つかります。`,
    },
    {
      prompt: `$1$ ページに $3$ 次元のデモを $20$ 個埋め込みました。

何が起きますか。`,
      hint: 'ブラウザが同時に持てる $WebGL$ のコンテキストは、いくつでしたか。',
      answer: `**古いものから黙って黒くなります。**

**上限**

ブラウザが同時に持てる $WebGL$ のコンテキストは**$8$〜$16$ 個**です。

$20$ 個作れば、超えます。

**超えたときの挙動**

**静かです。**

- 例外は出ない
- \`console.error\` も出ない（環境によっては警告が出ます）
- **古いコンテキストが失われ、その画面が黒くなる**

$4$ つめのデモを開いたら $1$ つめが黒い、という形で気づきます。
**原因の場所と症状の場所が違う**ので、追いにくい。

**どうするか**

$3$ つあります。

- **画面に入ったときだけ作り、出たら捨てる。**
  \`IntersectionObserver\` で見えているかを判定します
- **$1$ つのレンダラを共有し、\`setViewport\` / \`setScissor\` で描き分ける。**
  [](#/ch/y03-env-background)でやった手です
- **そもそも数を減らす**

**このサイトがやっていること**

$1$ 章に $1$ つのステージだけを持ち、章を移るときに \`dispose\` します。

\`src/three/stage.ts\` の $265$ 行のうち、\`dispose\` は**$18$ か所**。

ジオメトリ、マテリアル、マテリアルが持つテクスチャ、コントロール、レンダラ ―
**それぞれ別に解放が要る**からです。

そして \`npm run smoke\` が、
**全章を同じタブで連続して開いてもコンテキストが生きているか**を毎回確かめています。`,
    },
  ],
  quiz: [
    {
      q: '`prefers-reduced-motion: reduce` のとき、止めるべきものはどれですか。',
      choices: [
        '自動で動き続けるもの。手で操作する動きは残す',
        'すべての描画',
        'マウス操作への反応',
        '影とポストプロセス',
      ],
      answer: 0,
      explain:
        '境目は「誰が起こした動きか」です。酔いや不快感は予期しない動きから起きるので、自分でドラッグして回るぶんには原因になりません。操作への反応まで止めると、ただ使えない画面になります。あわせて、動きを止めても中身が伝わるかを確認してください。',
    },
    {
      q: 'キー操作を足すとき、すべての keydown で preventDefault を呼ぶと何が起きますか。',
      choices: [
        'Tab でフォーカスを抜けられなくなり、キーボードだけの人が閉じ込められる',
        '何も起きない',
        'スクロールが速くなる',
        'キー入力が二重になる',
      ],
      answer: 0,
      explain:
        '自分が使うキーだけを処理し、それ以外は先に return して素通しします。Tab は脱出口、Esc は中止で、この 2 つは絶対に奪ってはいけません。確かめ方は簡単で、マウスを使わずに自分のページを端から端まで操作してみることです。',
    },
    {
      q: '1 ページに 3 次元のデモを 20 個埋め込むと、何が起きますか。',
      choices: [
        'コンテキストの上限（8〜16 個）を超え、古いものから黙って黒くなる',
        'エラーが出て止まる',
        '全部動くが遅くなるだけ',
        'ブラウザが自動でまとめてくれる',
      ],
      answer: 0,
      explain:
        '例外も console.error も出ないまま、古いコンテキストが失われます。原因の場所と症状の場所が違うので追いにくい ― 4 つめを開いたら 1 つめが黒い、という形で気づきます。見えているときだけ作るか、1 つのレンダラを setViewport / setScissor で分けるか、数を減らしてください。',
    },
  ],
};
