import type { Chapter } from '../types.ts';

export const chapterW22: Chapter = {
  slug: 'w22-light-cost',
  part: 'threejs',
  number: 22,
  title: 'ライトの費用 ― 何個まで置けるか',
  goal: 'ライトを増やすと何が起きるかが分かり、増やす以外の手で明るさを作れるようになります。',
  requires: ['w21-shadow-quality'],
  threeApis: [
    'WebGLRenderer.info',
    'Material.needsUpdate',
    'MeshStandardMaterial.emissive',
    'MeshBasicMaterial',
    'Object3D.layers',
    'WebGLRenderer.compile',
  ],
  mathRecall: [{ slug: 'b05-ratio', note: '「1 画素あたり × 画素数」で総量が決まる' }],
  blocks: [
    {
      kind: 'md',
      text: `
## ライトを 1 つ足すと、2 か所で高くなる

「暗いからライトを足そう」は、いちばん自然な発想です。
そして**いちばんやってはいけない**手でもあります。

ライトを 1 つ増やすと、2 つのことが起きます。

**1. すべてのマテリアルのシェーダが作り直される**

three は「ライトが何個あるか」をシェーダのコードに**埋め込みます。**
$3$ 個用のプログラムと $4$ 個用のプログラムは、**別物**です。

だからライトを追加した瞬間、シーン中の全マテリアルについて
GPU 用プログラムのコンパイルが走ります。**数十ミリ秒〜数百ミリ秒、画面が止まります。**

**2. 画素ごとの計算が増える**

ライト $1$ つにつき、法線との内積・距離の減衰・鏡面反射が計算されます。
それを**画面の全画素で**やります。

$1920 \\times 1080$ で $200$ 万画素。ライトが $8$ 個なら $1600$ 万回です。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '会議に人を 1 人足す',
      text: `
参加者が 1 人増えると、話す量が 1 人分増えるだけではありません。

全員がその人と話す必要が出てきます。
そして「4 人用の会議室」から「5 人用の会議室」へ移らなければならない。

ライトも同じで、増やした 1 個ぶんの計算だけでなく、
すべてのマテリアルの作り直しが付いてきます。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{ライトの計算量} \\;\\propto\\; N_{\\text{light}} \\times W \\times H \\times \\text{dpr}^{2}',
      readAloud:
        'ライトの数と、実際に描く画素の数の掛け算です。画素の数は横幅・縦幅・ピクセル比の 2 乗で決まるので、ライトを 2 個増やすのと、ピクセル比を上げるのは、同じくらい効きます。',
      worked: {
        given:
          '$1280 \\times 720$ をピクセル比 $2$ で描いています。**ライト $3$ 個**と**$8$ 個**で、内積の回数を比べます。',
        steps: [
          { calc: '画素数 : 1280 x 720 x 2^2 = 3,686,400' },
          { calc: 'ライト 3 個 : 3,686,400 x 3 = 11,059,200' },
          { calc: 'ライト 8 個 : 3,686,400 x 8 = 29,491,200' },
          { calc: '差 : 18,432,000 回 / フレーム' },
          { calc: '毎秒 60 回なら : 11 億回 / 秒' },
          { calc: '【ピクセル比を 1.5 に下げると】' },
          { calc: '1280 x 720 x 2.25 x 8 = 16,588,800', note: 'ライト 4.5 個ぶんに相当' },
        ],
        result:
          '**ライトを $3$ から $8$ に増やすのは、毎秒 $11$ 億回の計算を足すこと**です。しかも各回に内積だけでなく、減衰・鏡面反射・影の判定まで含まれます。**逆に読むと**、ピクセル比を $2 \\to 1.5$ に下げるだけで、$8$ 個のライトが実質 $4.5$ 個ぶんの費用になります。**ライトを減らすのと、描く画素を減らすのは、同じ効き方**をします。どちらが見た目を保てるかで選んでください。',
      },
    },
    {
      kind: 'sandbox',
      title: 'ライトを増やして、シェーダの作り直しを見る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 200 個のものを並べる。マテリアルは 1 つで共有
const geometry = new THREE.SphereGeometry(0.3, 20, 14);
const material = new THREE.MeshStandardMaterial({ color: 0xd8d8e8, roughness: 0.5 });

for (let i = 0; i < 200; i++) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    THREE.MathUtils.randFloatSpread(14),
    THREE.MathUtils.randFloat(0.3, 3),
    THREE.MathUtils.randFloatSpread(10),
  );
  scene.add(mesh);
}

scene.add(new THREE.HemisphereLight(0x99bbff, 0x101020, 0.4));

// 1 秒ごとに PointLight を 1 つ足す。そのたびに何が起きるか
const bulbs = [];
let count = 0;

function addLight() {
  const color = new THREE.Color().setHSL(count * 0.13, 0.8, 0.6);
  const light = new THREE.PointLight(color, 25, 14);
  light.position.set(
    THREE.MathUtils.randFloatSpread(12),
    THREE.MathUtils.randFloat(1, 4),
    THREE.MathUtils.randFloatSpread(8),
  );
  scene.add(light);
  bulbs.push(light);
  count++;

  // 追加の直前と直後で、シェーダのコンパイル回数を見る
  const before = renderer.info.programs.length;
  renderer.compile(scene, camera);          // 作り直しを、この場で起こす
  console.log(
    'ライト', count, '個 /',
    'プログラム', before, '→', renderer.info.programs.length,
    '/ 描画呼び出し', renderer.info.render.calls,
  );
}

const clock = new THREE.Clock();
let next = 0.5;

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  if (t > next && count < 8) { addLight(); next = t + 1.2; }

  for (let i = 0; i < bulbs.length; i++) {
    bulbs[i].position.y = 2 + Math.sin(t * 0.8 + i) * 1.2;
  }

  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**ライトが 1 つ増えるたびに、コンソールに 1 行出ます。** 描画呼び出しの回数は変わりません（マテリアルは 1 つのまま）。変わるのは**シェーダのプログラム**で、ライトの数が変わるたびに作り直されています。実行中に足すと、そのたびに画面がわずかに止まるのが分かります。',
    },
    {
      kind: 'md',
      text: `
## シェーダは「ライトの数」ごとに別物

three が組むシェーダには、こういうコードが入っています。

**「\`DirectionalLight\` が $2$ 個、\`PointLight\` が $3$ 個ある前提のループ」。**

数はコンパイル時に決まる定数です。だから $1$ 個増えると別のプログラムになり、
**そのマテリアルは作り直しになります。**

作り直しは重い処理で、**$50$〜$300$ ミリ秒**かかることもあります。
毎フレーム起きれば、当然まともに動きません。

**だから避けるべきパターンがあります。**

- **実行中にライトを足したり消したりする**
- **\`light.visible = false\` で消す** … これも数が変わるので作り直しが走ります

**代わりに \`intensity = 0\` にしてください。**
数は変わらないので、作り直しは起きません。
`,
    },
    {
      kind: 'code',
      title: 'ライトを「消す」正しい方法',
      code: `import * as THREE from 'three';

// 悪い : シェーダの作り直しが走る
light.visible = false;
scene.remove(light);

// 良い : 数は変えず、強さだけ 0 にする
light.intensity = 0;

// 良い : 最初から必要な数だけ用意して、強さで出し入れする
const lamps = [];
for (let i = 0; i < 4; i++) {
  const l = new THREE.PointLight(0xffeecc, 0, 12);   // 強さ 0 で作っておく
  scene.add(l);
  lamps.push(l);
}

function turnOn(index, power = 25) {
  lamps[index].intensity = power;      // 作り直しは起きない
}

// 起動時に、あらかじめコンパイルしておく
// （最初のフレームで固まるのを防ぐ）
renderer.compile(scene, camera);`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '最初の 1 フレームが固まる、の原因',
      text: `
シェーダのコンパイルは、そのマテリアルが最初に描かれるときに起きます。

だから「開いた瞬間に 1 秒固まる」「途中で新しいものが出た瞬間にカクつく」
というのは、たいていこれです。

renderer.compile(scene, camera) を読み込み中に呼んでおくと、
コンパイルを前倒しにできます。ローディング画面のあいだに済ませてください。
`,
    },
    {
      kind: 'md',
      text: `
## 明るくしたいとき、ライト以外の手

「暗い」と感じたとき、ライトを足す前に試せることが 4 つあります。

**1. 環境光を上げる**

\`HemisphereLight\` の強さを上げる。**費用はほぼゼロ**です
（法線との内積を 1 回するだけで、影も減衰も無い）。

**2. マテリアルの色を明るくする**

暗い色は暗く写ります。当たり前ですが見落とされます。
\`color\` を上げるのはタダです。

**3. \`emissive\` を使う**

光を受けなくても、その色だけは出す設定です。
**光源そのものではない**ので、他のものは照らしません。

看板、モニタ、光る鉱石 ―「光って見えるが、まわりは照らさない」ものに最適です。
**費用はゼロ**（色を足すだけ）。

**4. 環境マップ**（[](#/ch/q01-environment)）

まわりの景色を映す。**ライト何個分にも相当する自然さ**が、$1$ つで得られます。
金属を使うなら、そもそも必須です。

**この 4 つを尽くしてから、ライトを足してください。**
`,
    },
    {
      kind: 'code',
      title: 'emissive ― 光って見えるが、照らさない',
      code: `import * as THREE from 'three';

// ネオン看板。自分は光って見えるが、まわりは照らさない
const sign = new THREE.MeshStandardMaterial({
  color: 0x111122,
  emissive: 0x4fd6ff,           // この色は、光が無くても出る
  emissiveIntensity: 2.0,       // 1 を超えると、ブルームが乗りやすくなる
});

// 実際に「まわりも照らす」ようにしたいなら、光源も置く
// ただし、そのぶんだけ高くなる
const glow = new THREE.PointLight(0x4fd6ff, 8, 6);
glow.position.copy(signMesh.position);
scene.add(glow);

// emissiveMap で、場所ごとに光る部分を変えられる
sign.emissiveMap = windowsTexture;    // ビルの窓だけ光らせる
sign.emissive = new THREE.Color(0xffffff);   // マップと掛け算されるので白に

// 注意 : emissive の既定は黒。emissiveMap だけ設定しても光りません`,
    },
    {
      kind: 'md',
      text: `
## 実務での目安

**ライトは $3$〜$4$ 個。影を落とすのは $1$ つ。**

これが多くの場面での上限です。

- **キー・フィル・リムの 3 点照明**（[](#/ch/t05-light-shadow)）
- **弱い \`HemisphereLight\` で底上げ**（これは安いので数に入れなくてよい）
- **影を落とすのはキーだけ**

「もっとライトが要る」と感じたら、たいてい別の問題があります。

- 環境マップを使っていない
- マテリアルの色が暗すぎる
- トーンマッピングを入れていない（明るい部分が白飛びして見える）

**大量の光源が本当に要る場面**（夜の街に窓が $1000$ 個）では、
ライトではなく \`emissive\` で作ります。
**光って見えれば十分**で、まわりを照らす必要はほとんどありません。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'ライトには上限があります',
      text: `
WebGL のシェーダには、使えるユニフォームの数に上限があります。

ライトが多すぎると、シェーダのコンパイルそのものが失敗します。
症状は「真っ黒」または「マテリアルが白くなる」で、
コンソールにコンパイルエラーが出ます。

環境によりますが、目安として 16 個を超えたあたりから危険です。
モバイルではもっと少なくなります。

そこまで置く前に、必ず別の手を検討してください。
`,
    },
  ],
  exercises: [
    {
      prompt: `$1920 \\times 1080$ をピクセル比 $2$ で描いています。
**ライト $4$ 個**のときの、1 フレームあたりのライト計算の回数を求めてください。
毎秒 $60$ フレームなら、1 秒あたり何回ですか。`,
      hint: 'ピクセル比は縦にも横にも効きます。',
      answer: `**1 フレームで $3318$ 万回。1 秒で約 $20$ 億回**です。

**画素数**

$1920 \\times 1080 = 2{,}073{,}600$

ピクセル比 $2$ なので $\\times 4$ … $8{,}294{,}400$ 画素

**ライト 4 個ぶん**

$8{,}294{,}400 \\times 4 = 33{,}177{,}600$ 回 / フレーム

**毎秒 60 フレーム**

$33{,}177{,}600 \\times 60 = 1{,}990{,}656{,}000$ ― **約 $20$ 億回 / 秒**

**この「1 回」の中身**

内積 1 回ではありません。ライト 1 つにつき、

- 法線と光の内積（拡散）
- 反射ベクトルとカメラの内積を何乗か（鏡面）
- 距離による減衰（点光源なら）
- 影の判定（影を落とすなら、シャドウマップの読み込み）

**実質、数十回の演算**です。$20$ 億 $\\times$ 数十。

**GPU はこれをこなします。** 並列に何千も走らせられるからです。
だからといって無制限ではありません。

**効かせ方の順番**

- **ピクセル比を $2 \\to 1.5$** … $8{,}294{,}400 \\to 4{,}665{,}600$。**44% 減**
- **ライトを $4 \\to 3$** … **25% 減**
- **両方** … $58$% 減

**ピクセル比のほうが効きます。** しかも見た目の差は、
ライトを 1 つ減らすより小さいことがほとんどです。`,
    },
    {
      prompt: `部屋の照明を、スイッチで消せるようにしたい。
\`light.visible = false\` ではなく \`light.intensity = 0\` を使うべきなのはなぜですか。`,
      hint: 'three はライトの数を、どこに持っていますか。',
      answer: `**\`visible = false\` は、シェーダの作り直しを引き起こすからです。**

three は「ライトが何個あるか」を**シェーダのコードに埋め込みます。**

$\\text{PointLight}$ が $3$ 個なら、シェーダには
「$3$ 回まわるループ」が生成されます。$2$ 個になれば、**別のプログラム**です。

\`visible = false\` にすると、three はそのライトを数から外します。
つまり**ライトの数が変わり、全マテリアルのコンパイルが走ります。**

**その費用は $50$〜$300$ ミリ秒。** スイッチを押すたびに画面が固まります。

**\`intensity = 0\` なら**

ライトは数に入ったままで、シェーダは変わりません。
計算は行われますが、**結果に $0$ を掛けるだけ**です。

無駄といえば無駄ですが、**カクつくよりはるかにまし**です。

**設計として**

必要な最大数のライトを**最初に用意して**、強さで出し入れするのが定石です。

**同じ型の落とし穴**

- \`material.needsUpdate = true\` を毎フレーム立てる
- 実行中にマテリアルの \`side\` や \`vertexColors\` を切り替える
- 実行中にマップを付け外しする

どれも**シェーダの作り直し**を招きます。
[](#/ch/t03-material)で見た「値を変えるだけか、プログラムが変わるか」の区別が、
そのまま速さに効いてきます。

**起動時のカクつきも同じ原因**です。
\`renderer.compile(scene, camera)\` を読み込み中に呼んでおけば、前倒しにできます。`,
      answerCode: `import * as THREE from 'three';

// 必要な数を最初に用意する（強さ 0 で）
const lamps = [];
for (let i = 0; i < 6; i++) {
  const l = new THREE.PointLight(0xffeecc, 0, 12);
  l.position.copy(lampPositions[i]);
  scene.add(l);
  lamps.push(l);
}

// スイッチ。シェーダの作り直しは起きない
function toggle(index, on) {
  lamps[index].intensity = on ? 25 : 0;
}

// なめらかに消したいなら、補間する
function fade(index, target, dt) {
  const l = lamps[index];
  l.intensity += (target - l.intensity) * (1 - Math.exp(-6 * dt));
}

// 起動時のカクつきを防ぐ
renderer.compile(scene, camera);`,
    },
    {
      prompt: `夜の街を作ります。ビルの窓が **$2000$ 個**光っています。
どう作りますか。**\`PointLight\` を $2000$ 個置く**のはなぜ駄目ですか。`,
      hint: '窓は「光って見える」必要がありますが、「まわりを照らす」必要はありますか。',
      answer: `**\`emissive\` で作ります。\`PointLight\` は $2000$ 個どころか $16$ 個で破綻します。**

**なぜ \`PointLight\` が駄目か**

**1. コンパイルが通りません。**
WebGL のシェーダにはユニフォームの数に上限があり、
$16$ 個を超えたあたりから危険域です。$2000$ 個では確実に失敗します。
症状は真っ黒か、マテリアルが白くなる、です。

**2. 通ったとしても、動きません。**
$1920 \\times 1080$ をピクセル比 $2$ で描くと $829$ 万画素。
$\\times 2000 = 166$ 億回 / フレーム。毎秒 $60$ なら **$1$ 兆回**。

**3. そもそも要りません。**
窓は「光って見える」だけでよく、**まわりを照らす必要はありません。**
$100$ メートル先のビルの窓が、手前の道路を照らすでしょうか。

**正しい作り方**

**\`emissive\` と \`emissiveMap\`。**

ビルの壁に「窓だけ白い」テクスチャを貼り、\`emissiveMap\` に指定します。
すると窓の部分だけが、光を受けなくても明るく出ます。

**費用はゼロ**です。色を足すだけで、内積も減衰も影も無い。

**さらに良くするなら**

- **ブルーム**（[](#/ch/q03-postprocess)）… 明るい部分がにじむ。
  「光っている」感が一気に出ます。$\\text{emissiveIntensity}$ を $1$ より大きくすると乗りやすい
- **窓ごとに色と明るさを変える** … \`emissiveMap\` にランダムなむらを入れる
- **ちらつかせる** … テクスチャを差し替えるのではなく、
  \`emissiveIntensity\` を数個のビルで別々に動かす

**本当に照らす必要がある光源だけ、\`PointLight\` にします。**
主人公の手元のランタン、車のヘッドライト ― せいぜい数個です。

**これは第4部の「夜の街」で実際にやります。**`,
      answerCode: `import * as THREE from 'three';

// 窓だけ白いテクスチャを作る（CanvasTexture で描く）
const windows = makeWindowTexture();

const building = new THREE.MeshStandardMaterial({
  color: 0x1a1a24,              // 壁は暗い
  roughness: 0.8,

  emissiveMap: windows,         // 窓の部分だけ光る
  emissive: 0xffddaa,           // ← 既定は黒。忘れると光らない
  emissiveIntensity: 2.5,       // 1 超えでブルームが乗りやすくなる
});

// 本当に照らす必要があるものだけ、光源にする
const lantern = new THREE.PointLight(0xffcc88, 20, 8);
player.add(lantern);            // 主人公について回る`,
    },
  ],
  quiz: [
    {
      q: 'ライトを 1 つ増やすと、なぜ一瞬画面が止まることがありますか。',
      choices: [
        'ライトの数がシェーダに埋め込まれているので、全マテリアルが作り直されるから',
        'メモリの確保に時間がかかるから',
        'ジオメトリが再送信されるから',
        '影が再計算されるから',
      ],
      answer: 0,
      explain:
        '「PointLight が 3 個ある前提のループ」がシェーダに生成されます。数が変われば別のプログラムなので、コンパイルが走ります。50〜300 ミリ秒かかることもあります。',
    },
    {
      q: '照明をスイッチで消すとき、推奨される方法はどれですか。',
      choices: [
        '`light.intensity = 0` にする',
        '`light.visible = false` にする',
        '`scene.remove(light)` する',
        'ライトを作り直す',
      ],
      answer: 0,
      explain:
        'visible や remove はライトの数を変えるので、シェーダの作り直しが走ります。intensity を 0 にすれば数は変わらず、計算結果に 0 を掛けるだけで済みます。',
    },
    {
      q: '夜の街のビルの窓 2000 個を光らせたい。適切な方法はどれですか。',
      choices: [
        '`emissiveMap` で、窓の部分だけ光らせる',
        '`PointLight` を 2000 個置く',
        '`AmbientLight` を強くする',
        '窓を `MeshBasicMaterial` の白にする',
      ],
      answer: 0,
      explain:
        '窓は「光って見える」必要はありますが、「まわりを照らす」必要はありません。emissive なら費用ゼロです。なお emissive の既定は黒なので、emissiveMap だけ設定しても光りません。',
    },
  ],
};
