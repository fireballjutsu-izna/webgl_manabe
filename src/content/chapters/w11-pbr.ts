import type { Chapter } from '../types.ts';

export const chapterW11: Chapter = {
  slug: 'w11-pbr',
  part: 'threejs',
  number: 11,
  title: '粗さと金属度 ― 2 つのつまみで、質感を作る',
  goal: '粗さと金属度が何を表しているかが分かり、狙った質感を数値で作れるようになります。',
  requires: ['t03-material', 'm33-fresnel'],
  threeApis: [
    'MeshStandardMaterial.roughness',
    'MeshStandardMaterial.metalness',
    'MeshStandardMaterial.envMapIntensity',
    'MeshPhysicalMaterial',
    'MeshPhysicalMaterial.clearcoat',
    'MeshPhysicalMaterial.transmission',
  ],
  mathRecall: [
    { slug: 'm33-fresnel', note: '浅い角度ほど強く反射する。金属も非金属も' },
    { slug: 'm32-specular', note: 'てかりの広さは、指数の大きさで決まる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## つまみが 2 つしかない、という設計

古いやり方では、質感を作るのに 5 つも 6 つも数値をいじりました。
拡散色、鏡面色、光沢度、反射率 ― どれも独立していて、
**物理的にありえない組み合わせも作れてしまいます。**

\`MeshStandardMaterial\` はここを大きく変えました。つまみは実質 2 つです。

- **roughness（粗さ）** … 表面がどれくらいでこぼこか。$0$ = 鏡、$1$ = つや消し
- **metalness（金属度）** … 金属か、そうでないか。$0$ か $1$

この 2 つだけで、木も、プラスチックも、金も、錆びた鉄も表せます。
しかも**どう組み合わせても、物理的におかしな見た目にはなりません。**

これが {{物理ベースレンダリング}}（PBR）の考え方で、
いま使われているほぼすべての 3D ツールが同じ 2 つのつまみを持っています。
Blender で作った質感がそのまま three で再現できるのは、このおかげです。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '磨いた金属と、すりガラス',
      text: `
粗さは「表面の細かい凹凸」です。

磨いた面は、当たった光がみな同じ向きに跳ね返るので、景色がくっきり映ります。
すりガラスは、細かい凹凸で光がばらばらの向きに散るので、ぼんやりとしか映りません。

映っているものは同じです。散らばり方だけが違います。
だから粗さを上げるとハイライトが「広がって薄くなる」 ―
消えるのではなく、同じ量の光が広い範囲に散らばるのです。
`,
    },
    {
      kind: 'sandbox',
      title: '粗さと金属度の格子',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 8.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const key = new THREE.DirectionalLight(0xffffff, 3.2);
key.position.set(3, 4, 5);
const fill = new THREE.DirectionalLight(0x88aaff, 1.2);
fill.position.set(-4, -1, 2);
scene.add(key, fill, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.5));

// 横に粗さ、縦に金属度を変えて並べる
const geometry = new THREE.SphereGeometry(0.44, 40, 26);
const COLS = 6;
const ROWS = 2;

for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      roughness: col / (COLS - 1),      // 左が 0（つるつる）、右が 1（ざらざら）
      metalness: row,                   // 下の段が 0（非金属）、上の段が 1（金属）
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((col - (COLS - 1) / 2) * 1.15, (row - 0.5) * 1.3, 0);
    scene.add(mesh);
  }
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
        '**上の段（金属度 1）が暗く沈んでいます。** 映り込む景色が無いためです。`scene.background = new THREE.Color(0x8899bb)` にすると、上の段だけ大きく印象が変わります ― 下の段はほとんど変わりません。ここが金属と非金属のいちばんの違いです。',
    },
    {
      kind: 'md',
      text: `
## 金属が黒いのは、映すものが無いから

上のサンドボックスで、金属度 1 の段が暗く沈んでいるのが見えたはずです。

**金属は自分の色をほとんど返しません。** 当たった光をそのまま跳ね返すだけです。
つまり金属の見た目は、**まわりの景色そのもの**でできています。

だから真っ暗な部屋に置いた鏡は、真っ暗に映ります。
ライトを増やしても、映るのは点の反射だけで、金属らしくはなりません。

必要なのは**まわりの景色** ― {{環境マップ}}（\`scene.environment\`）です。
その作り方は[](#/ch/q01-environment)で扱います。

**金属を使うなら、環境マップとセット。** これは覚えておいてください。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{拡散} = (1 - m)\\,c, \\qquad \\text{反射の基準} = \\text{lerp}(0.04,\\; c,\\; m)',
      readAloud:
        '金属度 $m$ は、マテリアルの色 $c$ を「自分の色として返す量」と「反射の色」のどちらに使うかを切り替えるつまみです。非金属は色を拡散に使い、反射はどんな素材でも 4% で一定。金属は色を反射のほうに使い、拡散は 0 になります。',
      worked: {
        given:
          '色 $c = 1.0$（真っ白）のマテリアルで、**金属度 $m = 0$ / $0.5$ / $1$** のときの拡散と反射の基準値を出します。',
        steps: [
          { calc: 'm = 0   : 拡散 = (1-0) x 1.0 = 1.0' },
          { calc: '          反射 = lerp(0.04, 1.0, 0) = 0.04', note: '非金属の反射はどれも 4%' },
          { calc: 'm = 0.5 : 拡散 = 0.5 x 1.0 = 0.5' },
          { calc: '          反射 = lerp(0.04, 1.0, 0.5) = 0.52' },
          { calc: 'm = 1   : 拡散 = (1-1) x 1.0 = 0' },
          { calc: '          反射 = lerp(0.04, 1.0, 1) = 1.0', note: '色は反射のほうへ移った' },
        ],
        result:
          '**$m$ は「色をどちらに使うか」のスイッチ**です。$0$ なら色は拡散へ、$1$ なら色は反射へ。**中間の $0.5$ は、拡散も反射も半端**という現実には無い状態です。だから **$0$ か $1$ にするのが定石**で、質感は粗さのほうで作ります。中間を使う正当な場面は、**錆びた鉄のように金属と非金属が混ざった面**をテクスチャで表すときだけです。なお非金属の反射 $0.04$ は、[](#/ch/m33-fresnel)で出てきた $F_0$ そのものです。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '中間の金属度は、避ける',
      text: `
metalness: 0.5 は「半分だけ金属の物質」ではありません。そんなものは現実に存在しません。

存在するのは「金属の部分と、非金属の部分が混ざった面」です。
錆びた鉄、剥げた塗装、汚れた金属 ―
これらは metalnessMap で場所ごとに 0 と 1 を切り替えて表します。

1 つの値で 0.5 にするのは、質感が決まらないときの逃げになりがちです。
0 か 1 に決めて、質感は roughness で作ってください。
`,
    },
    {
      kind: 'md',
      text: `
## 粗さの目安

数値と実物の対応を覚えておくと、狙って作れます。

| roughness | 見え方 | 例 |
|---|---|---|
| $0.0 \\sim 0.1$ | 鏡のように映る | 磨いた金属・鏡・水面 |
| $0.2 \\sim 0.3$ | くっきり映るが少しぼける | 車の塗装・磨いた大理石 |
| $0.4 \\sim 0.6$ | ハイライトが広い | プラスチック・塗った木 |
| $0.7 \\sim 0.9$ | ほとんど映らない | 布・紙・つや消し塗装 |
| $1.0$ | 完全に散る | 粉・チョーク |

**$0$ ちょうどは避けてください。** 完全な鏡は現実に無く、
ハイライトが 1 ピクセルに集中してちらつきの原因になります。
最小でも $0.05$ くらいにしておくのが実務の作法です。
`,
    },
    {
      kind: 'md',
      text: `
## その先 ― MeshPhysicalMaterial

粗さと金属度で足りないものが、いくつかあります。

- **車の塗装** … 色の層の上に、透明なクリア層がある
- **ガラス** … 透けるが、透明度とは違う（屈折する）
- **ベルベット** … 縁が明るく光る

これらのために \`MeshPhysicalMaterial\` があります。
\`MeshStandardMaterial\` を継承していて、**つまみが増えただけ**です。

- \`clearcoat\` … 上に透明な層を足す。$0$〜$1$
- \`transmission\` … 光を通す。ガラスはこちらで作る（\`opacity\` ではない）
- \`ior\` … 屈折率（[](#/ch/m34-refract)）。ガラスなら $1.5$
- \`sheen\` … 布の縁の光り方
- \`iridescence\` … シャボン玉のような虹色

**重くなります。** 使わないつまみは $0$ のままにしておけば、
three がそのぶんのコードをシェーダから外してくれます。
`,
    },
    {
      kind: 'code',
      title: 'ガラスと、塗装',
      code: `import * as THREE from 'three';

// ガラス。transparent + opacity ではなく transmission で作る
const glass = new THREE.MeshPhysicalMaterial({
  transmission: 1.0,        // 光を通す
  thickness: 0.5,           // 厚み。屈折の強さに効く
  ior: 1.5,                 // ガラスの屈折率
  roughness: 0.05,
  metalness: 0,             // ガラスは非金属
});

// 車の塗装。色の層の上に、透明なクリア層
const carPaint = new THREE.MeshPhysicalMaterial({
  color: 0xaa1133,
  metalness: 0.9,           // メタリック塗装
  roughness: 0.35,
  clearcoat: 1.0,           // クリア層あり
  clearcoatRoughness: 0.05, // クリア層はつるつる
});

// 布。縁がふわっと光る
const velvet = new THREE.MeshPhysicalMaterial({
  color: 0x223366,
  roughness: 0.9,
  metalness: 0,
  sheen: 1.0,
  sheenColor: new THREE.Color(0x8899ff),
});

// transmission も clearcoat も、環境マップが無いと効果が分かりません`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '質感が決まらないときは、粗さから',
      text: `
狙った見た目にならないとき、いじる順番があります。

1. metalness を 0 か 1 に決める（金属か、そうでないか。迷う余地は少ない）
2. roughness で質感を作る（ここがいちばん効く）
3. それでも足りなければ、環境マップを疑う
4. 最後に MeshPhysicalMaterial のつまみを検討する

色をいじるのは最後です。
PBR では、色よりも粗さのほうが「その素材らしさ」を決めています。
`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスで \`scene.background\` を \`new THREE.Color(0x8899bb)\`（明るい灰青）にしてください。
**上の段と下の段で、変化の大きさが違います。** なぜでしょう。`,
      hint: '金属の見た目は、何でできていましたか。',
      answer: `**上の段（金属）だけが大きく変わります。**

three は \`scene.background\` を、そのまま環境の明るさとしては使いません
（それをするには \`scene.environment\` が要ります）。
ただし**背景が明るくなると、球の輪郭のまわりの明暗差が変わる**ので、
金属の暗さがより際立って見えます。

**もっと大事なのは、なぜ金属だけ環境に依存するか**です。

- **非金属**（下の段）… 当たった光を**自分の色として散らして返す**。
  だからライトさえあれば、まわりに何も無くても色が出ます
- **金属**（上の段）… 自分の色を返しません。**まわりの景色を映すだけ**。
  映すものが無ければ、映るものも無い ― 真っ黒です

**本当に金属らしくするには \`scene.environment = envTexture\` が要ります。**
これで初めて、金属が金属に見えます。

その作り方（画像を 1 枚も使わず、コードで空を作る）は[](#/ch/q01-environment)です。
**このサイトが第5部まで持ち越している宿題**が、まさにこれです。`,
    },
    {
      prompt: `色 $c = 0.8$ のマテリアルで、**金属度 $0.3$** のときの拡散と反射の基準値を求めてください。
そして、なぜこの値を実務で使うべきでないかを説明してください。`,
      hint: '拡散 $= (1-m)c$、反射 $= \\text{lerp}(0.04,\\, c,\\, m)$ です。',
      answer: `**拡散 $= 0.56$、反射の基準 $= 0.268$** です。

**拡散** … $(1 - 0.3) \\times 0.8 = 0.7 \\times 0.8 = 0.56$

**反射** … $\\text{lerp}(0.04,\\; 0.8,\\; 0.3) = 0.04 + (0.8 - 0.04) \\times 0.3$
$= 0.04 + 0.76 \\times 0.3 = 0.04 + 0.228 = 0.268$

**なぜ使うべきでないか**

この値は、**現実のどんな物質にも対応していません。**

物質は「電子が自由に動けるか」で金属か非金属かが決まり、その中間はありません。
金属度 $0.3$ は「拡散も 7 割、反射も 27% 出す」という、
**物理的にありえない状態**を作っています。

見た目としては「なんとなく金属っぽいが、なんとなく濁っている」になり、
**どちらにも見えない中途半端なもの**になります。

**正しい使い方は 2 つだけ。**

- **$0$ か $1$ に決める** … 質感の作り込みは \`roughness\` でやる
- **\`metalnessMap\` で場所ごとに切り替える** … 錆びた鉄、剥げた塗装。
  面の中で金属の部分と非金属の部分が混ざっている場合

**「決まらないから 0.5」は、いちばんやってはいけない選び方**です。`,
    },
    {
      prompt: `ガラスのコップを作りたい。\`transparent: true, opacity: 0.3\` で作ったところ、
「ガラスというより、半分消えた白い物体」になりました。何が違いますか。`,
      hint: '本物のガラスは、向こう側を「薄く」見せますか。それとも「曲げて」見せますか。',
      answer: `**\`opacity\` は「薄める」だけで、ガラスの本質である「曲げる」をしていません。**

**\`opacity: 0.3\` がやっていること** … 手前の色を 30%、奥の色を 70% で混ぜる。
**すりガラスのフィルムを貼った**ような見た目で、向こう側は歪みません。

**本物のガラスがやっていること**

1. **屈折** … 光が曲がる（[](#/ch/m34-refract)）。向こう側が歪んで見える
2. **フレネル** … [](#/ch/m33-fresnel)のとおり、**浅い角度ほど強く映り込む**。
   だからコップの縁が白く光る
3. **厚みによる減衰** … 厚いところほど色が濃くなる

これを \`opacity\` は 1 つも再現できません。

**正しい作り方は \`transmission\`** です。下の解答例を見てください。

**注意点が 2 つ。**

- **環境マップが要ります。** 映り込むものが無ければ、縁の光りが出ません
- **\`transparent: true\` は不要**です。\`transmission\` は別の仕組みで、
  描く順番の問題（次の章）を持ち込みません

**\`opacity\` が正解の場面もあります** ― 煙、ソフトなフェード、UI 的な半透明。
「向こう側が歪まなくてよいもの」なら \`opacity\` のほうが軽くて素直です。`,
      answerCode: `// 悪い : 薄めているだけ
const fake = new THREE.MeshStandardMaterial({
  color: 0xffffff, transparent: true, opacity: 0.3,
});

// 良い : 光を通し、曲げる
const glass = new THREE.MeshPhysicalMaterial({
  transmission: 1.0,
  thickness: 0.5,
  ior: 1.5,               // ガラス。水なら 1.33、ダイヤなら 2.42
  roughness: 0.05,
  metalness: 0,
});

// これは必須。無いと縁の光りが出ない
scene.environment = envTexture;`,
    },
  ],
  quiz: [
    {
      q: '空っぽのシーンで `metalness` を 1 にすると、金属らしくならずに暗くなります。なぜですか。',
      choices: [
        '金属は周囲の景色を映すものだが、映り込む対象が何も無いから',
        'metalness は 1 にしてはいけない値だから',
        'ライトの強さが足りないから',
        'roughness が 0 でないから',
      ],
      answer: 0,
      explain:
        '金属は自分の色を返さず、当たった光を跳ね返すだけです。だから見た目はまわりの景色そのものでできています。`scene.environment` を用意すると、初めて金属らしくなります。',
    },
    {
      q: '`metalness: 0.5` が推奨されないのはなぜですか。',
      choices: [
        '現実にそういう物質が無く、どちらにも見えない中途半端な見た目になるから',
        '計算が重くなるから',
        'three が対応していないから',
        '色が暗くなるから',
      ],
      answer: 0,
      explain:
        '物質は金属か非金属かのどちらかで、中間はありません。錆びた鉄のように「面の中で混ざっている」ものは、`metalnessMap` で場所ごとに 0 と 1 を切り替えて表します。',
    },
    {
      q: 'ガラスを作るとき、`opacity` ではなく `transmission` を使う理由はどれですか。',
      choices: [
        '`opacity` は色を薄めるだけで、光を曲げないから',
        '`opacity` のほうが重いから',
        '`opacity` は非対応だから',
        '色が変わってしまうから',
      ],
      answer: 0,
      explain:
        'ガラスらしさは屈折（向こう側が歪む）とフレネル（縁が白く光る）でできています。`opacity` はどちらもしません。ただし煙や UI 的な半透明なら、`opacity` のほうが軽くて素直です。',
    },
  ],
};
