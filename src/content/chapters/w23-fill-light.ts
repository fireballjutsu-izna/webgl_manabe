import type { Chapter } from '../types.ts';

export const chapterW23: Chapter = {
  slug: 'w23-fill-light',
  part: 'threejs',
  number: 23,
  title: '影の中を、真っ黒にしない',
  goal: '間接光の代わりになる手段を使い分けられるようになり、暗部が潰れないシーンを作れるようになります。',
  requires: ['w22-light-cost'],
  threeApis: [
    'HemisphereLight',
    'AmbientLight',
    'Scene.environment',
    'MeshStandardMaterial.envMapIntensity',
    'MeshStandardMaterial.aoMap',
    'LightProbe',
  ],
  mathRecall: [
    { slug: 'b27-lambert', note: '内積が 0 以下の面は、まったく光を受けない' },
    { slug: 'w13-color-space', note: '暗部の差は、目にとって大きく見える' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## three のライトは、跳ね返らない

現実の部屋では、窓から入った光が壁や床で跳ね返り、
**光が直接届かない場所も、それなりに明るく**なります。これが**間接光**です。

**three のライトは、跳ね返りません。**

$\\max(0,\\; \\mathbf{n} \\cdot \\mathbf{l})$ を計算するだけで、
内積が $0$ 以下の面 ― つまり光に背を向けた面は、**きっちり $0$** です。

だから何も足さないと、**影の中と、光の当たらない側面が、真っ黒に潰れます。**

写真で言えば「黒つぶれ」。
情報が失われていて、しかも**現実にはあり得ない見え方**です。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '月面の写真',
      text: `
月面の写真では、影の中が本当に真っ黒です。

大気も、まわりに光を跳ね返す壁もないので、
太陽の当たらない場所には光がまったく届かないからです。

three の既定は、この「月面」の状態です。
地球上の見た目にしたいなら、跳ね返りぶんを自分で足す必要があります。
`,
    },
    {
      kind: 'md',
      text: `
## 手は 4 つ。安い順に

**1. \`AmbientLight\` ― いちばん安く、いちばん平板**

すべての面に同じ量を足すだけ。**立体感を消します**（[](#/ch/t05-light-shadow)）。
$0.2$〜$0.4$ くらいで、最低限の底上げに。

**2. \`HemisphereLight\` ― 安くて、上下の差がある**

上から空の色、下から地面の色を当てます。
**法線の $y$ 成分で混ぜるだけ**なので、費用はほぼ \`AmbientLight\` と同じ。

それでいて**上下の差があるぶん、立体感が残ります。**
屋外なら断然こちら。屋内でも、天井と床の色を入れれば使えます。

**3. \`scene.environment\` ― 自然だが、用意が要る**

まわりの景色を、あらゆる方向からの光として使います。**いちばん自然**です。
金属を使うなら、そもそも必須（[](#/ch/w11-pbr)）。

作り方は[](#/ch/q01-environment)で扱います。画像を 1 枚も使わずに作れます。

**4. \`aoMap\` ― 隅の暗がりを、あらかじめ焼き込む**

上の 3 つは「全体を持ち上げる」ものなので、
**本来暗いはずの隅まで明るくなってしまいます。**

\`aoMap\` は逆で、「ここは隅だから暗い」を画像で指定します。
**持ち上げたあとに、暗くすべきところを暗く戻す**役割です。
`,
    },
    {
      kind: 'formula',
      tex: 'C \\;=\\; \\underbrace{\\max(0,\\, \\mathbf{n}\\cdot\\mathbf{l})\\,I_{\\text{key}}}_{\\text{直接光}} \\;+\\; \\underbrace{\\text{lerp}(c_{\\text{ground}},\\, c_{\\text{sky}},\\, \\tfrac{n_y + 1}{2})\\,I_{\\text{hemi}}}_{\\text{半球光}}',
      readAloud:
        '半球光は、法線の $y$ 成分だけを見て、地面の色と空の色を混ぜたものを足します。上を向いた面には空の色、下を向いた面には地面の色。内積を使わないので費用は小さく、それでも上下の差が残ります。',
      worked: {
        given:
          '空 $= 1.0$、地面 $= 0.2$、強さ $0.6$ の \\`HemisphereLight\\` で、**上向き・横向き・下向き**の面が受ける量を求めます。',
        steps: [
          { calc: '上向き n=(0,1,0)  : (1+1)/2 = 1.0' },
          { calc: '  lerp(0.2, 1.0, 1.0) x 0.6 = 0.60' },
          { calc: '横向き n=(1,0,0)  : (0+1)/2 = 0.5' },
          { calc: '  lerp(0.2, 1.0, 0.5) x 0.6 = 0.36' },
          { calc: '下向き n=(0,-1,0) : (-1+1)/2 = 0' },
          { calc: '  lerp(0.2, 1.0, 0) x 0.6 = 0.12' },
          { calc: '上 / 下 = 0.60 / 0.12 = 5 倍' },
        ],
        result:
          '**上向きと下向きで 5 倍の差**があります。これが「立体感が残る」の中身です。**同じ強さの \\`AmbientLight\\` なら、3 つとも $0.6$** ― 差はゼロ。**費用はほとんど変わらないのに、片方は情報を持ち、片方は持ちません。** だから底上げには、まず \\`HemisphereLight\\` を選んでください。なお **$0.12$ という下限が効いています** ― 影の中や下向きの面も、完全な $0$ にはなりません。',
      },
    },
    {
      kind: 'sandbox',
      title: '4 とおりの底上げを、並べて見る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 'none' | 'ambient' | 'hemisphere' の 3 つを試してください
const FILL = 'none';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.4, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.8, 0);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(24, 16),
  new THREE.MeshStandardMaterial({ color: 0x6b7386, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// 光の当たらない側面ができるように、横一列に並べる
const material = new THREE.MeshStandardMaterial({ color: 0xd8d8e8, roughness: 0.65 });
const shapes = [
  new THREE.BoxGeometry(1.2, 1.6, 1.2),
  new THREE.SphereGeometry(0.75, 40, 26),
  new THREE.CylinderGeometry(0.6, 0.6, 1.8, 32),
  new THREE.TorusKnotGeometry(0.5, 0.18, 90, 16),
];

shapes.forEach((geometry, i) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set((i - 1.5) * 2.1, 0.9, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
});

// キーライトは 1 つだけ。右上から
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(5, 6, 3);
key.castShadow = true;
const c = key.shadow.camera;
c.left = -7; c.right = 7; c.top = 7; c.bottom = -7;
c.near = 1; c.far = 25;
c.updateProjectionMatrix();
key.shadow.normalBias = 0.02;
key.shadow.mapSize.set(1024, 1024);
scene.add(key);

// 底上げの手を切り替える
const fills = {
  none:       null,
  ambient:    () => new THREE.AmbientLight(0xffffff, 0.6),
  hemisphere: () => new THREE.HemisphereLight(0xaaccff, 0x332a22, 0.6),
};

if (fills[FILL]) scene.add(fills[FILL]());
console.log('底上げ :', FILL);

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
        '**3 つとも試してください。** `none` は左側の面と影の中が**完全な黒**に潰れ、形が読めません。`ambient` は明るくなりますが、**全体が平板になり、影も薄く**なります。`hemisphere` は暗部が持ち上がりつつ、上下の差が残るので**立体感が保たれます。** 3 つのうち、いちばん自然なのは `hemisphere` です。',
    },
    {
      kind: 'md',
      text: `
## 色を付けると、一気にそれらしくなる

底上げの光を**白**にすると、洗いざらしたような見た目になります。

現実の間接光には**色が付いています。**

- **屋外の昼** … 空の青が上から、地面の茶色や緑が下から
- **夕方** … 空はオレンジ、影は青みがかる
- **室内** … 天井と壁の色が回り込む

**\`HemisphereLight\` の 2 色を、その場に合わせて選ぶ**だけで、
シーンの説得力が大きく変わります。

**定番は「上を寒色、下を暖色」**。
キーライト（太陽）が暖色なら、影の中は寒色になるのが自然です。
**補色に振ると、立体感が強調されます。**
`,
    },
    {
      kind: 'code',
      title: '場面ごとの底上げ',
      code: `import * as THREE from 'three';

// 屋外の昼。空の青 ＋ 地面の土
scene.add(new THREE.HemisphereLight(0x88bbff, 0x604a32, 0.7));

// 夕方。空のオレンジ ＋ 影の青
scene.add(new THREE.HemisphereLight(0xff9955, 0x223355, 0.6));

// 室内。天井の白 ＋ 木の床
scene.add(new THREE.HemisphereLight(0xf0eee8, 0x6b5138, 0.5));

// 夜。月の青白さ ＋ ほぼ真っ黒な地面
scene.add(new THREE.HemisphereLight(0x334466, 0x0a0a12, 0.4));

// 水中。上は水色、下は深い青緑
scene.add(new THREE.HemisphereLight(0x66ddcc, 0x0a3344, 0.8));

// キーライトと補色にすると、立体感が強調される
const key = new THREE.DirectionalLight(0xffddaa, 3);   // 暖色の太陽
scene.add(key, new THREE.HemisphereLight(0x88aaff, 0x443322, 0.5));   // 寒色の空`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '底上げしすぎると、影が消えます',
      text: `
暗部を持ち上げる操作は、そのまま「影と、影でないところの差を縮める」操作です。

強さを上げすぎると、せっかく計算した影がほとんど見えなくなります。
接地感が失われ、物体が浮いて見えます。

目安は、キーライトの 1/5 〜 1/3。
キーが 3 なら、底上げは 0.6 〜 1.0 くらいです。

「暗すぎる」と感じたら、底上げを上げる前に
トーンマッピングと露出（第5部）を確認してください。
そちらの問題であることが、かなりあります。
`,
    },
    {
      kind: 'md',
      text: `
## aoMap ― 持ち上げたあと、隅を戻す

底上げには、避けられない副作用があります。

**本来暗いはずの隅まで、明るくなってしまう。**

部屋の角、机の下、布のしわの奥 ―
現実には間接光も届きにくいので、暗いはずです。
ところが \`HemisphereLight\` は法線しか見ないので、**そこも一律に持ち上げます。**

**\`aoMap\`（アンビエントオクルージョン）は、その戻しです。**

「この画素は、まわりに囲まれている度合いがこれくらい」を画像で持ち、
**間接光の量だけを減らします**（直接光には効きません）。

- **モデリングツールで焼く** … Blender などで計算して画像に出す
- **[](#/ch/w15-uv)の \`uv1\` が要る** … タイルの UV では使えません
- **リアルタイムに計算する手もあります**（SSAO）。addons にありますが重い

**費用対効果は非常に高い**部類です。テクスチャ 1 枚で、
「ものがそこに置かれている」感じが一気に出ます。
`,
    },
    {
      kind: 'md',
      text: `
## まとめ ― 底上げの型

迷ったときの標準形を置いておきます。

- **キーライト** … \`DirectionalLight\`、強さ $3$、影を落とす。**これが主役**
- **底上げ** … \`HemisphereLight\`、強さ $0.6$、上下に色を付ける
- **必要なら環境マップ** … 金属やガラスがあるなら必須
- **仕上げに \`aoMap\`** … 隅を戻す

**ライトは実質 $2$ 個。** [](#/ch/w22-light-cost)で見たとおり、これで十分軽い。

そして「暗い」「のっぺりしている」と感じたときは、
**ライトを足す前に、底上げの色と \`aoMap\` を疑ってください。**
`,
    },
  ],
  exercises: [
    {
      prompt: `空 $= 0.9$、地面 $= 0.3$、強さ $0.8$ の \`HemisphereLight\` があります。
**法線 $\\mathbf{n} = (0.6,\\; 0.8,\\; 0)$ の面**が受ける量を求めてください。`,
      hint: '$y$ 成分だけを見て、$(n_y+1)/2$ で混ぜます。',
      answer: `**$0.664$** です。

**混ぜ具合**

$t = \\dfrac{n_y + 1}{2} = \\dfrac{0.8 + 1}{2} = 0.9$

$y$ 成分が $0.8$ ― かなり上を向いた面なので、空の色に寄ります。

**色を混ぜる**

$\\text{lerp}(0.3,\\; 0.9,\\; 0.9) = 0.3 + (0.9 - 0.3) \\times 0.9 = 0.3 + 0.54 = 0.84$

**強さを掛ける**

$0.84 \\times 0.8 = 0.672$

**約 $0.67$** です。

**注目すべき点が 2 つ。**

**1. $x$ 成分がまったく効いていません。**
$\\mathbf{n} = (0.6, 0.8, 0)$ でも $(0, 0.8, 0.6)$ でも $(-0.6, 0.8, 0)$ でも、
結果は同じ $0.67$ です。

\`HemisphereLight\` が見るのは **$y$ 成分だけ**だからです。
だから「上下の差」しか作れません。左右の差は付きません。

**2. キーライトと違って、向きに $\\max(0, \\cdot)$ が無い。**
下を向いた面（$n_y = -1$）でも $0.3 \\times 0.8 = 0.24$ を受けます。
**完全な $0$ にはならない** ― これが「底上げ」と呼ばれる理由です。

**費用の話**

計算は「$y$ を取り出して、$2$ 色を混ぜて、掛ける」だけ。
内積も、減衰も、影の判定もありません。

**\`AmbientLight\` とほぼ同じ費用で、上下の差が手に入ります。**
だから底上げには \`HemisphereLight\` を選んでください。`,
    },
    {
      prompt: `サンドボックスで \`FILL\` を \`'ambient'\` にしたところ、
暗部は明るくなりましたが、**影がほとんど見えなくなりました。** なぜですか。
どう直しますか。`,
      hint: '影とは、何と何の「差」でしたか。',
      answer: `**影は「明るいところとの差」でしか見えないからです。**

影の中の明るさが $0.1$、影の外が $1.0$ だとします。**比は $10$ 倍**。
はっきり影に見えます。

ここに \`AmbientLight\` を $0.6$ 足すと、

- 影の中 … $0.1 + 0.6 = 0.7$
- 影の外 … $1.0 + 0.6 = 1.6$

**比は $2.3$ 倍。** $10$ 倍から $2.3$ 倍へ、差が $4$ 分の 1 に縮みました。

**足し算は、比を縮めます。** これは色の底上げ全般に言えることです。

**しかも \`AmbientLight\` は立体感も消します。**
[](#/ch/t05-light-shadow)で見たとおり、法線を見ないからです。

**直し方は 3 つ。**

**1. 強さを下げる** … キーライトの $1/5$〜$1/3$ が目安。
キーが $3$ なら $0.6$〜$1.0$。$0.6$ は上限に近い値です。

**2. \`HemisphereLight\` に替える** … 上下の差が残るので、
同じ強さでも影がまだ読めます。**費用はほぼ同じ**です。

**3. \`aoMap\` で隅を戻す** … 底上げで持ち上がりすぎた隅を、
画像で暗くし直します。接地感が戻ります。

**もう 1 つの視点**

「暗すぎる」と感じたとき、**本当に光が足りないのか**を疑ってください。

トーンマッピングを入れていないと、明るい部分が白飛びして
相対的に暗部が沈んで見えます。
\`renderer.toneMapping = THREE.ACESFilmicToneMapping\` を入れるだけで
印象が変わることが、かなりあります（第5部で扱います）。`,
    },
    {
      prompt: `夕方の屋外シーンを作ります。太陽は低く、オレンジ色。
**底上げの \`HemisphereLight\` の 2 色**を、どう選びますか。理由も答えてください。`,
      hint: '空の色と、地面の色です。そして補色を考えてください。',
      answer: `**空を青紫、地面を暖かい茶色。補色に振るのが肝です。**

\`\`new THREE.HemisphereLight(0x5566aa, 0x664433, 0.6)\`\` あたり。

**なぜ空が青紫か**

夕方の空は、太陽の近くはオレンジですが、**反対側と天頂は青紫**です。
そして影の中を照らしているのは、太陽ではなく**その青い空**のほうです。

写真でも絵画でも、「夕日の影は青い」というのは基本の観察です。

**なぜ地面が茶色か**

太陽の低い光が地面で跳ね返り、**下から暖色が回り込みます。**
足元や、物体の下面がわずかに暖かく見えるのは、これです。

**補色に振ると、なぜ立体感が出るのか**

キーライト（オレンジ）と底上げ（青）が**反対の色相**なので、
光の当たる面と当たらない面で、**明るさだけでなく色相も変わります。**

人の目は色の差にも敏感なので、**同じ明るさの差でも、より立体的に見えます。**
これは撮影や絵画で古くから使われている手法です。

**やってはいけないこと**

**両方とも太陽と同じオレンジにする。**
明るさの差しか無くなり、しかも全体がオレンジ一色になって
「セピア写真」のような平板な絵になります。

**強さの目安**

キー（太陽）が $3$ なら、底上げは $0.5$〜$0.8$。
夕方は空が暗いので、昼より**やや弱め**にすると自然です。

**さらに良くするなら**

- **\`fog\` を空と同じ色**にする。遠景が空に溶けて奥行きが出る
- **リムライトを太陽と反対側から**入れる。輪郭が浮く
- **環境マップ**（[](#/ch/q01-environment)）にすれば、この手の色選びは不要になります`,
      answerCode: `import * as THREE from 'three';

// 夕方
const sun = new THREE.DirectionalLight(0xff9944, 3);   // 低く、オレンジ
sun.position.set(-8, 2.5, 4);                          // 低い角度
sun.castShadow = true;

// 底上げ。空は青紫、地面は暖かい茶。補色に振る
const sky = new THREE.HemisphereLight(0x5566aa, 0x664433, 0.6);

scene.add(sun, sky);

// 遠景を空に溶かす
scene.background = new THREE.Color(0x6b5a7a);
scene.fog = new THREE.Fog(0x6b5a7a, 30, 120);`,
    },
  ],
  quiz: [
    {
      q: 'three で影の中が真っ黒に潰れるのはなぜですか。',
      choices: [
        'ライトの光が跳ね返らないので、光の当たらない面は計算上ちょうど 0 になるから',
        'シャドウマップの精度が足りないから',
        'マテリアルの色が暗いから',
        'トーンマッピングが無いから',
      ],
      answer: 0,
      explain:
        '$\\max(0, \\mathbf{n}\\cdot\\mathbf{l})$ を計算するだけなので、光に背を向けた面はきっちり 0 です。現実の間接光にあたるものを、自分で足す必要があります。',
    },
    {
      q: '底上げに `AmbientLight` より `HemisphereLight` が推奨されるのはなぜですか。',
      choices: [
        '費用はほぼ同じなのに、法線の $y$ 成分で上下の差が付き、立体感が残るから',
        '影を落とせるから',
        '距離で減衰するから',
        'メモリを使わないから',
      ],
      answer: 0,
      explain:
        '法線の $y$ を見て 2 色を混ぜるだけなので、内積も減衰も要りません。それでいて上向きと下向きで数倍の差が付きます。AmbientLight は全方向に同じ量を足すので、差がゼロです。',
    },
    {
      q: '底上げを強くしすぎると、何が起きますか。',
      choices: [
        '影との明るさの比が縮み、影が見えなくなって接地感が失われる',
        'ライトの数の上限に達する',
        'シャドウマップの解像度が下がる',
        '色空間が狂う',
      ],
      answer: 0,
      explain:
        '足し算は比を縮めます。影の中 0.1・外 1.0（10 倍）に 0.6 を足すと 0.7 と 1.6 で 2.3 倍。目安はキーライトの 1/5〜1/3 です。',
    },
  ],
};
