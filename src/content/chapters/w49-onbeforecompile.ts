import type { Chapter } from '../types.ts';

export const chapterW49: Chapter = {
  slug: 'w49-onbeforecompile',
  part: 'threejs',
  number: 49,
  title: '既存のマテリアルに割り込む ― onBeforeCompile',
  goal: 'ライトも影も効いたまま、頂点や色だけを自分のコードで書き換えられるようになります。',
  requires: ['w48-shader-debug'],
  mathRecall: [
    { slug: 'b22-wave', note: '揺らす計算は、位相をずらした正弦波' },
  ],
  threeApis: [
    'Material.onBeforeCompile',
    'Material.customProgramCacheKey',
    'MeshStandardMaterial',
    'ShaderMaterial',
    'Material.needsUpdate',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 自作シェーダには、ライトも影も付いてこない

[](#/ch/t13-vertex-shader)で頂点を波打たせ、
[](#/ch/t14-fragment-shader)で陰影を自分で書きました。

書けはします。**けれど \`ShaderMaterial\` を使った瞬間、
three が用意していたものを全部手放しています。**

- ライト $5$ 種類の計算
- 影の受け取り
- 環境マップ、フォグ、トーンマッピング
- 色空間の変換

草を風で揺らしたいだけなのに、**ライティングを全部自分で書き直す** ―
割に合いません。

**\`onBeforeCompile\` は、その中間です。**
\`MeshStandardMaterial\` の中身を借りたまま、**一部だけを差し替えます。**
`,
    },
    {
      kind: 'md',
      text: `
## 仕組み ― 文字列の置換

three は、マテリアルを**初めて描くとき**にシェーダのソースを組み立てます。

\`material.onBeforeCompile = (shader) => { ... }\` を設定しておくと、
**組み立てたあと、コンパイルする直前**に呼ばれます。

渡ってくる \`shader\` は、こうなっています。

- \`shader.vertexShader\` … 頂点シェーダの**文字列**
- \`shader.fragmentShader\` … フラグメントシェーダの文字列
- \`shader.uniforms\` … 渡される値の一覧

**文字列なので、\`replace()\` で書き換えられます。**

乱暴に聞こえますが、three 自身がこの仕組みで組み立てています。
差し込む目印になる名前（\`#include <begin_vertex>\` など）も決まっていて、
**バージョンをまたいでもそう簡単には変わりません。**
`,
    },
    {
      kind: 'code',
      title: '草を風で揺らす ― ライトはそのまま',
      code: `import * as THREE from 'three';

const material = new THREE.MeshStandardMaterial({ color: 0x4a7c59, roughness: 0.8 });

// 自分で持っておく uniform。three の uniforms に混ぜてもらう
const uniforms = { uTime: { value: 0 } };

material.onBeforeCompile = (shader) => {
  // three 側の uniforms に足す
  shader.uniforms.uTime = uniforms.uTime;

  // 宣言を先頭に差し込む
  shader.vertexShader = 'uniform float uTime;\\n' + shader.vertexShader;

  // transformed（＝これから変換される頂点）が用意された直後に割り込む
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    \`#include <begin_vertex>

     // 根元（y=0）では動かさず、先端ほど大きく揺らす
     float sway = sin(uTime * 1.6 + position.x * 0.7 + position.z * 0.5);
     transformed.x += sway * 0.25 * position.y;
     transformed.z += sway * 0.12 * position.y;
    \`,
  );
};

// 同じソースになるマテリアルは 1 つにまとめられる。
// 別扱いにしたいときは、鍵を変える
material.customProgramCacheKey = () => 'grass-sway';

// 描画ループ
renderer.setAnimationLoop(() => {
  uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
});`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'replace が空振りしても、エラーは出ません',
      text: `
String.replace は、見つからなければ何もせずに元の文字列を返します。

目印の綴りを 1 文字間違えても、警告は出ません。
「書いたのに何も変わらない」という形で出ます。

心配なら、置換の前後で長さを比べてください。

const before = shader.vertexShader.length;
shader.vertexShader = shader.vertexShader.replace(...);
if (shader.vertexShader.length === before) console.warn('置換できていません');

これを 1 行入れておくだけで、無駄な 30 分が消えます。
`,
    },
    {
      kind: 'md',
      text: `
## 差し込む場所

three のシェーダは \`#include <...>\` という断片の集まりでできています。
よく使う目印は、これくらいです。

| 目印 | どこ | 何ができるか |
|---|---|---|
| \`#include <common>\` | 先頭 | 関数や定数を足す |
| \`#include <begin_vertex>\` | 頂点 | \`transformed\` が用意された直後。**位置を動かす** |
| \`#include <beginnormal_vertex>\` | 頂点 | \`objectNormal\` の直後。**法線を直す** |
| \`#include <dithering_fragment>\` | 最後 | \`gl_FragColor\` が決まったあと。**色を足す** |
| \`#include <map_fragment>\` | 色 | \`diffuseColor\` が決まった直後 |

**\`begin_vertex\` の直後で \`transformed\` を動かす**のが、いちばんよく使う形です。

\`transformed\` は「これから \`modelViewMatrix\` を掛けられる頂点」なので、
ここを動かせば、**そのあとの変換・ライティング・影がすべて追随します。**
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '影も揺らしたいなら、影用のマテリアルにも同じ細工が要る',
      text: `
影は、光から見たシーンを別に描いて作ります。
そのときに使われるのは MeshDepthMaterial / MeshDistanceMaterial であって、
いま細工したマテリアルではありません。

だから「草は揺れているのに、影だけ元の位置に立っている」ということが起きます。

mesh.customDepthMaterial に、同じ onBeforeCompile を仕掛けた
MeshDepthMaterial を入れてください。

面倒ですが、これを知らないと原因が絶対に分かりません。
`,
    },
    {
      kind: 'sandbox',
      title: '風で揺れる草 ― ライトと影はそのまま',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// false にすると、割り込みをやめます（ただの棒立ちになります）
const SWAY = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.Fog(0x0a0a12, 26, 64);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 10, 27);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// 影を落とす太陽。範囲は狭く取る
const sun = new THREE.DirectionalLight(0xffe6bd, 3.2);
sun.position.set(7, 11, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;
sun.shadow.camera.far = 40;
sun.shadow.bias = -0.0015;
scene.add(sun, new THREE.HemisphereLight(0x9ec8ff, 0x2a2418, 1.1));

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({ color: 0x223026, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// 揺らす細工。頂点シェーダの transformed を書き換えるだけ
const uniforms = { uTime: { value: 0 } };

const SWAY_GLSL = /* glsl */\`
  #include <begin_vertex>

  // instanceMatrix の 4 列目が、その株の立っている位置
  vec3 base = instanceMatrix[3].xyz;
  float phase = base.x * 0.45 + base.z * 0.32;
  float sway = sin(uTime * 1.7 + phase) + 0.4 * sin(uTime * 3.1 + phase * 1.7);

  // 根元は動かさず、先端ほど大きく振る
  float h = max(position.y, 0.0);
  transformed.x += sway * 0.11 * h;
  transformed.z += sway * 0.06 * h;
\`;

function addSway(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = 'uniform float uTime;\\n' + shader.vertexShader;

    const before = shader.vertexShader.length;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', SWAY_GLSL);
    if (shader.vertexShader.length === before) console.warn('置換できていません');
  };
  // 中身を変えたので、素の同型マテリアルと同じ扱いにされないようにする
  material.customProgramCacheKey = () => 'sway';
  return material;
}

const bladeGeo = new THREE.ConeGeometry(0.11, 1.7, 5);
bladeGeo.translate(0, 0.85, 0);         // 根元を y = 0 に

const grassMat = new THREE.MeshStandardMaterial({ color: 0x63a35a, roughness: 0.85 });
if (SWAY) addSway(grassMat);

const COUNT = 1800;
const grass = new THREE.InstancedMesh(bladeGeo, grassMat, COUNT);
grass.castShadow = true;
grass.receiveShadow = true;

// 影も揺らす。影は別のマテリアルで描かれるので、同じ細工が要る
if (SWAY) {
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  grass.customDepthMaterial = addSway(depth);
}

const dummy = new THREE.Object3D();
for (let i = 0; i < COUNT; i++) {
  const a = i * 2.399;
  const r = Math.sqrt(i / COUNT) * 11;
  dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  dummy.rotation.y = a;
  dummy.scale.setScalar(0.7 + ((i * 37) % 11) / 14);
  dummy.updateMatrix();
  grass.setMatrixAt(i, dummy.matrix);
}
grass.instanceMatrix.needsUpdate = true;
scene.add(grass);

// 比較用。ふつうの MeshStandardMaterial のまま
const rock = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.1, 1),
  new THREE.MeshStandardMaterial({ color: 0x6b6f7d, roughness: 0.9, flatShading: true }),
);
rock.position.set(4.2, 1, 1.2);
rock.castShadow = true;
scene.add(rock);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  uniforms.uTime.value = clock.getElapsedTime();
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '**草は揺れていて、しかも影が落ち、太陽の色も乗っています。** これを `ShaderMaterial` で書くなら、ライト・影・フォグ・トーンマッピングを全部自分で書く必要がありました。ここで書いたのは**$6$ 行の GLSL だけ**です。`SWAY` を `false` にすると、割り込みが消えて棒立ちになります。',
    },
    {
      kind: 'md',
      text: `
## 何が起きているか、もう一度

**$1$. 宣言を足す**

\`shader.vertexShader = 'uniform float uTime;\\n' + shader.vertexShader;\`

先頭に足すだけです。three が組み立てたソースの前に置きます。

**$2$. 目印を、目印＋自分のコードに置き換える**

\`replace('#include <begin_vertex>', '#include <begin_vertex>' + 自分のコード)\`

**元の \`#include\` を残すのが大事です。** 消してしまうと
\`transformed\` そのものが定義されなくなります。

**$3$. uniform を共有する**

\`shader.uniforms.uTime = uniforms.uTime;\`

**同じオブジェクトを指させます。** コピーではありません ―
外側の \`uniforms.uTime.value\` を書き換えれば、そのまま届きます。

**$4$. キャッシュの鍵を変える**

three は「同じソースになるマテリアル」をまとめて $1$ つのプログラムにします。
細工したことを three は知らないので、**素のマテリアルと同一視されることがあります。**

\`customProgramCacheKey\` で別の鍵を返せば、別扱いになります。
`,
    },
    {
      kind: 'md',
      text: `
## いつ、どれを使うか

| やりたいこと | 使うもの |
|---|---|
| 色や粗さを変えるだけ | ふつうの \`MeshStandardMaterial\` |
| **ライトを効かせたまま、頂点や色をいじる** | **\`onBeforeCompile\`** |
| ライティングごと自分で作る（水面・炎・特殊効果） | \`ShaderMaterial\` |
| 画面全体に効果をかける | ポストプロセス |

**$2$ 番目が今回です。** 実務でいちばんよく使うのは、実はここ ―
草・旗・水面の揺れ、キャラクタの輪郭線、頂点カラーでの汚し。

**弱点もあります。**

- **three の内部に依存します。** 目印の名前が変わったら直す必要がある
  （実際にはめったに変わりませんが、$0$ ではありません）
- **書いたシェーダの全体像が見えません。**
  デバッグには \`console.log(shader.vertexShader)\` で全文を出してください
`,
    },
  ],
  exercises: [
    {
      prompt: `\`onBeforeCompile\` で草を揺らしました。**草は揺れています。**
ところが**影だけが、元の位置に立ったまま**です。

原因と、直し方を書いてください。`,
      hint: '影を描くとき、three はどのマテリアルを使いますか。',
      answer: `**影は別のマテリアルで描かれていて、そちらに細工が入っていないからです。**

**何が起きているか**

影は、**光から見たシーンをもう一度描いて**作ります（シャドウマップ）。

そのとき使われるのは、いま細工した \`MeshStandardMaterial\` **ではありません。**
three が内部で用意する \`MeshDepthMaterial\`（点光源なら \`MeshDistanceMaterial\`）です。

深度だけを書き込めばよいので、色もライトも要らない ―
だから軽いマテリアルに差し替えられています。

**そのマテリアルには \`onBeforeCompile\` を仕掛けていません。**
頂点は元のまま。だから影だけ棒立ちになります。

**直し方**

\`mesh.customDepthMaterial\` に、**同じ細工をした \`MeshDepthMaterial\`** を入れます。

\`depthPacking: THREE.RGBADepthPacking\` を忘れないでください
（three が既定で使う形式です。これが違うと影が壊れます）。

点光源の影を使うなら \`customDistanceMaterial\` も同様です。

**細工を関数にまとめる**

$2$ か所に同じコードを書くと、必ず片方だけ直して食い違います。

\`addSway(material)\` のような関数を $1$ つ作り、
**本体用と深度用の両方に同じ関数を通してください。**

**なぜ気づけないのか**

**エラーが $1$ つも出ないから**です。

「草が揺れる」も「影が落ちる」も、どちらも正しく動いています。
$2$ つが別々に正しく動いているだけ。

**この構図は three のあちこちにあります** ―
影・環境マップ・ポストプロセスは、それぞれ独立した描画です。
$1$ か所を直したら、**同じものを描いている他の経路がないか**を疑ってください。`,
      answerCode: `import * as THREE from 'three';

// 細工を 1 つの関数にまとめる
function addSway(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = 'uniform float uTime;\\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', SWAY_GLSL);
  };
  material.customProgramCacheKey = () => 'sway';
  return material;
}

// 本体
addSway(grassMaterial, uniforms);

// 影用。同じ関数を通す
mesh.customDepthMaterial = addSway(
  new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }),
  uniforms,
);`,
    },
    {
      prompt: `\`onBeforeCompile\` を書いたのに、**何も変わりません。** エラーも警告も出ません。

**$3$ つの原因**を挙げ、それぞれの確かめ方を書いてください。`,
      hint: '`replace` は、見つからなかったときどうしますか。',
      answer: `**置換の空振り・関数を設定した時期・キャッシュの同一視です。**

**原因 $1$ ― \`replace\` が空振りしている**

\`String.replace\` は、**見つからなければ何もせずに元の文字列を返します。**

目印を \`'#include <begin_vertex>'\` ではなく
\`'#include<begin_vertex>'\`（空白なし）と書いた ―
それだけで、警告も出ずに無視されます。

**確かめ方**

置換の前後で長さを比べます。

\`const before = shader.vertexShader.length;\` … 置換 …
\`if (shader.vertexShader.length === before) console.warn('置換できていません');\`

**$1$ 行入れておくだけで、無駄な $30$ 分が消えます。**

**原因 $2$ ― \`onBeforeCompile\` が呼ばれる前に、もう描かれていた**

\`onBeforeCompile\` が呼ばれるのは、**そのマテリアルを初めて描くとき $1$ 回だけ**です。

すでに $1$ フレーム描いたあとに設定しても、二度と呼ばれません。

**確かめ方**

関数の中に \`console.log('compile')\` を置きます。出なければこれ。

**直し方**

\`material.needsUpdate = true;\` を立てると、次の描画で組み立て直されます。

**原因 $3$ ― 素のマテリアルと同一視されている**

three は「同じ型・同じ設定のマテリアル」を $1$ つのシェーダプログラムにまとめます。

細工したことを three は知らないので、
**同じ設定の素のマテリアルが先に描かれていると、そちらのプログラムが使い回されます。**

**確かめ方**

そのシーンに、同じ型・同じ設定のマテリアルが他にありませんか。

**直し方**

\`material.customProgramCacheKey = () => 'sway';\`

別の鍵を返せば、別のプログラムとして扱われます。

**全部だめなら**

\`console.log(shader.vertexShader)\` で**全文を出してください。**

自分のコードが入っているかどうかが、$1$ 秒で分かります。
入っていれば置換は成功していて、問題は GLSL の中身のほうです。`,
    },
    {
      prompt: `草を揺らす式を、こう書きました。

\`transformed.x += sin(uTime * 1.7) * 0.16 * position.y;\`

**$2{,}500$ 本が、完全に同じ動きで揺れます。** 波打ちません。

1. **なぜ**ですか。
2. どう直しますか。$2$ 通り書いてください。`,
      hint: 'この式の中に、株ごとに違う値はありますか。',
      answer: `**式の中に「その株がどこに立っているか」が入っていないからです。**

**1 ― なぜ揃うのか**

\`sin(uTime * 1.7)\` は、**時刻だけの関数**です。

同じ瞬間には、どの株でも同じ値になります。

\`position.y\` は株の中での高さなので、
「先端ほど大きく振れる」は正しく効きます ―
けれど**株どうしの違い**はどこにもありません。

だから $2{,}500$ 本が**軍隊のように同時に**振れます。

**風は波として渡っていくもの**なので、これでは風に見えません。

**2 ― 直し方 A：位置で位相をずらす**

\`InstancedMesh\` なら、\`instanceMatrix[3].xyz\` がその株の立っている位置です。

\`vec3 base = instanceMatrix[3].xyz;\`
\`float phase = base.x * 0.45 + base.z * 0.32;\`
\`float sway = sin(uTime * 1.7 + phase);\`

$x$ と $z$ で位相がずれるので、**風が斜めに渡っていく**ように見えます。

係数（$0.45$、$0.32$）が**波の細かさ**です。
大きくすると波が細かく、小さくすると大きなうねりになります。

**直し方 B：周期の違う波を重ねる**

$1$ 本の \`sin\` だけだと、規則正しすぎて機械的に見えます。

\`float sway = sin(uTime * 1.7 + phase) + 0.4 * sin(uTime * 3.1 + phase * 1.7);\`

**周期が整数比にならない**ようにするのがこつです
（$1.7$ と $3.1$ は割り切れない）。
整数比だと、短い周期でぴったり繰り返してしまいます。

[](#/ch/b22-wave)でやった波の重ね合わせが、そのまま効きます。

**A と B は組み合わせて使ってください。** A で空間のばらつき、B で時間のばらつき。
$2$ つそろって、はじめて風に見えます。

**根元を止めるのを忘れずに**

\`position.y\` を掛けているので根元（$y = 0$）は動きません。
これがないと**草が地面から浮いて滑ります。**

\`max(position.y, 0.0)\` にしておくと、
原点より下に頂点があるジオメトリでも安全です。`,
      answerCode: `const SWAY_GLSL = /* glsl */\`
  #include <begin_vertex>

  // A: その株の位置で位相をずらす
  vec3 base = instanceMatrix[3].xyz;
  float phase = base.x * 0.45 + base.z * 0.32;

  // B: 周期の違う波を重ねる（1.7 と 3.1 は割り切れない）
  float sway = sin(uTime * 1.7 + phase)
             + 0.4 * sin(uTime * 3.1 + phase * 1.7);

  // 根元は動かさない
  float h = max(position.y, 0.0);
  transformed.x += sway * 0.11 * h;
  transformed.z += sway * 0.06 * h;
\`;`,
    },
  ],
  quiz: [
    {
      q: 'ライトと影を効かせたまま、頂点だけを動かしたい。使うのはどれですか。',
      choices: [
        '`MeshStandardMaterial` に `onBeforeCompile` で割り込む',
        '`ShaderMaterial` で全部書く',
        '`RawShaderMaterial` を使う',
        'ポストプロセスで動かす',
      ],
      answer: 0,
      explain:
        '`ShaderMaterial` にした瞬間、ライト・影・フォグ・トーンマッピングを全部自分で書くことになります。onBeforeCompile なら、three が組み立てたソースの一部だけを replace で差し替えられます。',
    },
    {
      q: '`onBeforeCompile` を書いたのに何も変わりません。エラーも出ません。まず何を確かめますか。',
      choices: [
        '`replace` が空振りしていないか（前後で長さを比べる）',
        'GPU のドライバ',
        'ライトの強さ',
        'カメラの位置',
      ],
      answer: 0,
      explain:
        '`String.replace` は見つからなければ黙って元の文字列を返します。目印の綴りが 1 文字違うだけで、警告も出ずに無視されます。長さを比べる 1 行を入れておいてください。',
    },
    {
      q: '草は揺れているのに、影だけ元の位置に立っています。なぜですか。',
      choices: [
        '影は MeshDepthMaterial で別に描かれ、そちらに細工が入っていないから',
        'シャドウマップの解像度が足りないから',
        '`bias` の設定が悪いから',
        'ライトの位置が悪いから',
      ],
      answer: 0,
      explain:
        '`mesh.customDepthMaterial` に、同じ onBeforeCompile を仕掛けた MeshDepthMaterial（depthPacking: RGBADepthPacking）を入れてください。細工は関数にまとめて、両方に通すのが確実です。',
    },
  ],
};
