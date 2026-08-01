import type { Chapter } from '../types.ts';

export const chapterT05: Chapter = {
  slug: 't05-light-shadow',
  part: 'threejs',
  number: 19,
  title: 'ライト ― 5 種類の光を、目的で選ぶ',
  goal: '5 種類のライトの違いが分かり、目的に応じて選び、強さを妥当な範囲で決められるようになります。',
  requires: ['w18-normal-map', '11-normal-light'],
  threeApis: [
    'AmbientLight',
    'HemisphereLight',
    'DirectionalLight',
    'PointLight',
    'SpotLight',
    'Light.intensity',
    'PointLight.distance',
    'SpotLight.angle',
  ],
  mathRecall: [
    { slug: '11-normal-light', note: '明るさ ＝ 法線と光の内積' },
    { slug: 'b05-ratio', note: '点光源は距離の 2 乗に反比例して弱まる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 光がないと、何も見えない

[](#/ch/11-normal-light)でやったとおり、
面の明るさは**法線と光の向きの内積**で決まります。

つまり光を置かない限り、内積の相手がおらず、計算しようがありません。
これが[](#/ch/w04-blank-screen)の「真っ黒」の 2 番目に多い原因でした。

Three.js のライトは 5 種類あります。違いは結局のところ 3 点だけです。

**どこから、どの向きに、どれくらい届くか。**
`,
    },
    {
      kind: 'demo',
      id: 'light-compare',
      caption:
        '種類を切り替えると、当たり方だけでなく「影が落ちるかどうか」も変わります。AmbientLight と HemisphereLight には向きが無いので、影は原理的に作れません。',
    },
    {
      kind: 'md',
      text: `
## 5 種類の性格

| ライト | 何を表すか | 位置 | 向き | 距離で減衰 | 影 |
|---|---|---|---|---|---|
| \`AmbientLight\` | 一律の底上げ | ― | ― | ― | **落とせない** |
| \`HemisphereLight\` | 空と地面の色 | ― | 上下のみ | ― | **落とせない** |
| \`DirectionalLight\` | 太陽 | 向きの指定用 | **あり** | **しない** | 落とせる |
| \`PointLight\` | 電球 | **あり** | 全方向 | **する** | 落とせる（重い） |
| \`SpotLight\` | 懐中電灯 | **あり** | **円錐** | **する** | 落とせる |

**基本の組み合わせは「DirectionalLight 1 つ ＋ 弱い HemisphereLight」**です。
これで屋外らしい見た目になります。迷ったらここから始めてください。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'DirectionalLight の position は「場所」ではありません',
      text: `
太陽は無限に遠いものとして扱われるので、位置には意味がありません。

position が決めているのは向きだけです。
position.set(3, 5, 2) は「(3,5,2) の方向から照らす」であって、
「(3,5,2) にある電球」ではありません。

だから距離を変えても明るさは変わりません。
近づけたのに明るくならない、と困ったらこれです。
`,
    },
    {
      kind: 'md',
      text: `
## 距離で暗くなるのは、点光源だけ

\`PointLight\` と \`SpotLight\` は位置を持つので、**離れるほど暗くなります。**

減り方には物理的な決まりがあります。**距離の 2 乗に反比例する。**

光は球状に広がるので、距離が 2 倍になれば同じ量の光が
$4$ 倍の面積に散ります。だから明るさは $1/4$ です。
`,
    },
    {
      kind: 'formula',
      tex: 'I(d) \\;=\\; \\frac{P}{d^{2}}',
      readAloud:
        '点光源の明るさは、光の強さを距離の 2 乗で割ったものです。距離が 2 倍になれば 4 分の 1、3 倍になれば 9 分の 1。逆に半分に近づければ 4 倍になります。',
      worked: {
        given: '強さ $P = 20$ の \\`PointLight\\` から、**距離 $1$ / $2$ / $5$** の点の明るさを比べます。',
        steps: [
          { calc: 'd = 1 : 20 / 1^2  = 20' },
          { calc: 'd = 2 : 20 / 2^2  = 5', note: '半分の距離ではなく 4 分の 1' },
          { calc: 'd = 5 : 20 / 5^2  = 0.8' },
          { calc: '1 → 2 の変化 : 20 / 5 = 4 分の 1' },
          { calc: '2 → 5 の変化 : 5 / 0.8 = 6.25 分の 1' },
        ],
        result:
          '**距離 $1$ から $5$ へ離れるだけで、明るさは $25$ 分の 1** になります。ここが「点光源の置き場所が難しい」理由です。**近すぎると白飛びし、少し離すと一気に暗くなります。** 実務では、まず光源を置きたい場所に置いてから、$P$ を調整します。「$P$ を決めてから場所を探す」と、たいてい合いません。なお \\`distance\\` を設定すると、そこで完全に $0$ になる別の減り方になります（物理的ではありませんが、影響範囲を切れるので速くなります）。',
      },
    },
    {
      kind: 'sandbox',
      title: '5 種類を切り替えて、当たり方を見る',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 'ambient' | 'hemisphere' | 'directional' | 'point' | 'spot'
const KIND = 'directional';
const POWER = 3;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 4.5, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.5, 0);

// 床と、横一列に並べた球。距離による減衰が読めるように広く置く
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 12),
  new THREE.MeshStandardMaterial({ color: 0x8b93a8, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const sphere = new THREE.SphereGeometry(0.55, 32, 20);
const material = new THREE.MeshStandardMaterial({ color: 0xd8d8e8, roughness: 0.6 });

for (let i = -3; i <= 3; i++) {
  const mesh = new THREE.Mesh(sphere, material);
  mesh.position.set(i * 1.5, 0.55, 0);
  scene.add(mesh);
}

// 光源の位置を目で見るための小さな球
const bulb = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 16, 12),
  new THREE.MeshBasicMaterial({ color: 0xffd166 }),
);
bulb.position.set(0, 3, 1.5);

const lights = {
  ambient:     () => new THREE.AmbientLight(0xffffff, POWER * 0.4),
  hemisphere:  () => new THREE.HemisphereLight(0x99bbff, 0x443322, POWER),
  directional: () => {
    const l = new THREE.DirectionalLight(0xffffff, POWER);
    l.position.set(3, 5, 2);        // 位置ではなく「向き」を決めている
    return l;
  },
  point: () => {
    const l = new THREE.PointLight(0xffffff, POWER * 12);   // 減衰するぶん強くする
    l.position.copy(bulb.position);
    scene.add(bulb);
    return l;
  },
  spot: () => {
    const l = new THREE.SpotLight(0xffffff, POWER * 20, 0, Math.PI / 9, 0.4);
    l.position.copy(bulb.position);
    l.target.position.set(0, 0, 0);
    scene.add(l.target, bulb);
    return l;
  },
};

scene.add(lights[KIND]());
console.log('ライトの種類', KIND);

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
        '**`KIND` を書き換えて 5 つとも試してください。** `ambient` は全部が同じ明るさの円になり、立体感がまったく出ません。`directional` は 7 個とも同じ明るさ。`point` と `spot` は**中央が明るく、端が暗くなります** ― これが距離による減衰です。`spot` は円錐の外にはまったく届きません。',
    },
    {
      kind: 'md',
      text: `
## AmbientLight が「立体感を消す」理由

\`AmbientLight\` を強くすると、物体が**平らな円**に見えます。

理由は明快で、[](#/ch/b27-lambert)の内積を**使っていない**からです。

環境光は、法線がどちらを向いていようと同じ量を足します。
つまり「向きによる明暗の差」を作らない。
それどころか、他のライトが作った差を**薄めてしまいます。**

だから環境光は「影の中を真っ黒にしないための底上げ」として、**弱く**使います。
$0.3$〜$1$ くらい。それ以上入れると、シーン全体が眠たくなります。

**より良い代わりが 2 つあります。**

- **\`HemisphereLight\`** … 上から空の色、下から地面の色。
  上下の差があるぶん、**わずかに立体感が残ります。** 屋外なら断然こちら
- **環境マップ**（[](#/ch/q01-environment)）… まわりの景色を映す。いちばん自然
`,
    },
    {
      kind: 'md',
      text: `
## SpotLight の 2 つの角度

\`SpotLight\` には角度が 2 つあります。混同しやすいところです。

- **\`angle\`** … 円錐の**半頂角**（中心からふちまで）。ラジアン。最大 $\\pi/2$
- **\`penumbra\`** … ふちのぼかし具合。$0$ で切り立ち、$1$ でふんわり

\`angle\` は「全体の広がり」ではなく**半分**なので、
$\\pi/4$（$45°$）と書けば全体では $90°$ 広がります。

もう 1 つ、**\`target\` を忘れないでください。**
\`SpotLight\` は \`target\` の方向を照らしますが、
**\`target\` もシーンに追加しないと動きません**（既定は原点にあります）。
`,
    },
    {
      kind: 'code',
      title: 'SpotLight の設定',
      code: `import * as THREE from 'three';

const spot = new THREE.SpotLight(0xffffff, 60);
spot.position.set(0, 6, 2);

spot.angle = Math.PI / 8;      // 半頂角 22.5 度 → 全体で 45 度
spot.penumbra = 0.35;          // ふちを少しぼかす
spot.decay = 2;                // 距離の 2 乗で減衰（物理的に正しい既定値）
spot.distance = 0;             // 0 なら無限まで届く

// target を動かすなら、シーンに追加する必要がある
spot.target.position.set(0, 0, 0);
scene.add(spot, spot.target);

// 追いかけさせるなら、target を対象に付ける
player.add(spot.target);       // これで自動的に player を照らし続ける

// 目で見るヘルパー（範囲を決めるときに便利）
scene.add(new THREE.SpotLightHelper(spot));`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '光の強さの目安',
      text: `
three は物理的に正しい単位で光を扱います。目安はこのあたりです。

DirectionalLight … 2 〜 4
HemisphereLight / AmbientLight … 0.3 〜 1
PointLight … 10 〜 60（距離の 2 乗で割られるので大きめ）
SpotLight … 20 〜 100

値を大きくして白飛びするようなら、強さを上げる前に
renderer.toneMapping = THREE.ACESFilmicToneMapping を試してください。
明るい部分の階調が保たれます（第5部で詳しく扱います）。
`,
    },
    {
      kind: 'md',
      text: `
## 3 点照明 ― 迷ったときの型

写真や映画で使われる型が、そのまま 3D でも使えます。

- **キーライト** … 主役。斜め前上から。いちばん強い（$3$ くらい）
- **フィルライト** … 反対側から弱く。影の中を持ち上げる（キーの $\\frac{1}{3}$ ほど）
- **リムライト** … 後ろから。輪郭を光らせて背景から浮かせる（キーと同程度）

**この 3 つで、たいていのものは「それらしく」見えます。**
そして**ライト 3 個は、費用としてもちょうどよい上限**です（次の章）。
`,
    },
    {
      kind: 'code',
      title: '3 点照明',
      code: `import * as THREE from 'three';

// キー：主役を作る
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(4, 5, 4);
key.castShadow = true;

// フィル：影の中を持ち上げる。色は少し寒色に
const fill = new THREE.DirectionalLight(0x99bbff, 1.0);
fill.position.set(-5, 1, 2);
// 影は落とさない（2 枚焼くのは高い）

// リム：後ろから輪郭を光らせる
const rim = new THREE.DirectionalLight(0xffeecc, 2.5);
rim.position.set(-2, 3, -5);

scene.add(key, fill, rim);

// 底上げ。これは「4 つ目のライト」だが、計算がほぼ無いので安い
scene.add(new THREE.HemisphereLight(0x99bbff, 0x332211, 0.4));`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスの \`KIND\` を \`'ambient'\` にしてください。
球はどう見えますか。**なぜそう見えるのか**を、内積の言葉で説明してください。`,
      hint: '環境光は、法線をどう扱っていますか。',
      answer: `**平らな円**に見えます。7 個とも、まったく同じ単色の円です。

**理由は「内積を使っていないから」です。**

[](#/ch/b27-lambert)でやったとおり、ふつうのライトの明るさは

$\\text{明るさ} = \\max(0,\\; \\mathbf{n} \\cdot \\mathbf{l})$

法線 $\\mathbf{n}$ が光の向き $\\mathbf{l}$ を向いているほど明るい。
**だから球の表面で明暗の差が生まれ、丸く見えます。**

**\`AmbientLight\` は、この計算をしません。**
法線がどちらを向いていようと、同じ量を足すだけです。

$\\text{明るさ} = I_{\\text{ambient}}$

差が生まれないので、球のどこも同じ明るさ ―
つまり**シルエットしか見えない**状態になります。

**さらに悪いことに、他のライトの効果も薄めます。**
キーライトが作った $0.2$ と $0.9$ の差に、環境光 $0.5$ を足すと
$0.7$ と $1.4$。**比では $4.5$ 倍だったものが $2$ 倍に**縮みます。

**だから環境光は弱く使う。** $0.3$〜$1$ が目安です。
**上下で色を変える \`HemisphereLight\` なら、わずかに立体感が残ります。**`,
    },
    {
      prompt: `強さ $P = 50$ の \`PointLight\` があります。
**距離 $3$ の点の明るさ**を求めてください。
また、同じ明るさを距離 $6$ で得るには、$P$ をいくつにすればよいですか。`,
      hint: '$I = P / d^2$ です。',
      answer: `**距離 $3$ で $5.56$。距離 $6$ で同じにするには $P = 200$** です。

**距離 $3$ の明るさ**

$I = \\dfrac{50}{3^2} = \\dfrac{50}{9} = 5.56$

**距離 $6$ で $5.56$ を得るには**

$5.56 = \\dfrac{P}{6^2} = \\dfrac{P}{36}$

$P = 5.56 \\times 36 = 200$

**距離が 2 倍になると、必要な強さは 4 倍**です。

**実務での意味**

これは「光源を少し動かすだけで、明るさが激変する」ということです。

- 距離 $3 \\to 3.5$（$17\\%$ 遠ざける）→ 明るさは $73\\%$ に
- 距離 $3 \\to 2$（$33\\%$ 近づける）→ 明るさは $2.25$ 倍に

**だから手順が大事です。**

1. **光源を、置きたい場所に置く**（部屋の天井、ランプの中）
2. **そこから強さを調整する**

逆順にすると、「ちょうどいい明るさになる位置」を探すことになり、
その位置は物理的におかしな場所（壁の中、床の下）になりがちです。

**\`distance\` を設定すると別の減り方になります。**
$0$ 以外にすると、そこで完全に $0$ になるよう補正が入ります。
物理的ではありませんが、**影響範囲を切れるので速くなります** ―
遠くのものについてこの光源の計算を省けるからです。`,
    },
    {
      prompt: `\`SpotLight\` を作って \`angle = Math.PI / 6\` にしました。
**照らされる円錐は、全体で何度**広がりますか。
そして、真下 $5$ の高さから床を照らすと、**明るい円の半径**はいくつですか。`,
      hint: '`angle` は半頂角です。半径は $\\tan$ で出ます。',
      answer: `**全体で $60°$。床の円の半径は $2.89$** です。

**広がり**

\`angle\` は**半頂角**（中心軸からふちまでの角度）です。

$\\pi/6 = 30°$ なので、**全体では $60°$**。

ここは間違えやすいところで、「$60°$ に広げたい」と思って
\`angle = Math.PI / 3\` と書くと、実際には $120°$ になります。

**床の円の半径**

高さ $5$ から $30°$ の角度で広がるので、

$r = 5 \\times \\tan(30°) = 5 \\times 0.5774 = 2.89$

**直径 $5.77$ の明るい円**ができます。

**逆算もよく使います。** 「半径 $4$ の円を照らしたい、高さは $5$」なら

$\\tan(\\theta) = 4/5 = 0.8$ → $\\theta = \\arctan(0.8) = 38.7°= 0.675$ ラジアン

\`spot.angle = 0.675\` です。

**\`penumbra\` はふちのぼかし。** $0$ だと円の境界がくっきり切れて、
安っぽく見えます。$0.2$〜$0.5$ くらい入れると自然になります。

**\`target\` の追加を忘れないこと。** \`scene.add(spot, spot.target)\` の
2 つ目が抜けていると、\`target.position\` を変えても向きが変わりません。`,
      answerCode: `import * as THREE from 'three';

const HEIGHT = 5;
const WANT_RADIUS = 4;

const spot = new THREE.SpotLight(0xffffff, 60);
spot.position.set(0, HEIGHT, 0);

// 照らしたい半径から、角度を逆算する
spot.angle = Math.atan(WANT_RADIUS / HEIGHT);   // 0.675 ラジアン = 38.7 度
spot.penumbra = 0.35;

spot.target.position.set(0, 0, 0);
scene.add(spot, spot.target);                    // target も追加する`,
    },
  ],
  quiz: [
    {
      q: '影を落とせ**ない**ライトはどれですか。',
      choices: ['AmbientLight', 'DirectionalLight', 'PointLight', 'SpotLight'],
      answer: 0,
      explain:
        'AmbientLight は全体を一律に明るくするだけで、向きも位置も持ちません。影は「光から見て手前に何があるか」で作られるので、向きが無いライトでは作れません。HemisphereLight も同様です。',
    },
    {
      q: '`DirectionalLight` を物体に近づけたのに、明るくなりません。なぜですか。',
      choices: [
        '太陽を表すライトなので、position は向きだけを決めていて、距離は関係ないから',
        'intensity が 0 だから',
        'castShadow を設定していないから',
        'マテリアルが Basic だから',
      ],
      answer: 0,
      explain:
        '無限に遠いものとして扱われるため、position は「どちらから照らすか」の指定でしかありません。距離で暗くなるのは PointLight と SpotLight だけです。',
    },
    {
      q: '`PointLight` の明るさは、距離が 2 倍になるとどうなりますか。',
      choices: ['4 分の 1', '2 分の 1', '変わらない', '8 分の 1'],
      answer: 0,
      explain:
        '光は球状に広がるので、距離が 2 倍なら同じ量が 4 倍の面積に散ります。$I = P/d^2$ です。だから「光源を置きたい場所に置いてから、強さを調整する」の順で作業してください。',
    },
  ],
};
