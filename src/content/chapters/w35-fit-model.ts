import type { Chapter } from '../types.ts';

export const chapterW35: Chapter = {
  slug: 'w35-fit-model',
  part: 'threejs',
  number: 35,
  title: '届いたモデルを直す ― 大きさ・向き・原点',
  goal: '読み込んだモデルを測って揃える手順が身につき、巨大・横倒し・宙に浮くという 3 つの定番を自分で直せるようになります。',
  requires: ['t09-loader', '09-hierarchy'],
  mathRecall: [
    { slug: '06-matrix', note: '大きさと向きの調整は、変換そのもの' },
    { slug: '09-hierarchy', note: '親を 1 枚かぶせれば、子に触らずに直せる' },
  ],
  threeApis: [
    'Box3',
    'Box3.setFromObject',
    'Box3.getSize',
    'Box3.getCenter',
    'Object3D.scale',
    'Object3D.position',
    'Object3D.rotation',
    'Group',
    'Vector3',
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 届くものは、そろっていない

前の章で読み込んだモデルは、大きさが $67 \\times 34 \\times 70$、平たく寝ていて、
中心も原点からずれていました。**壊れていたわけではありません。**
書き出した人にとっては、それが正しい形です。

理由は単純で、**共通の約束が無い**からです。

- **単位** … ミリメートルで作る人、メートルで作る人、インチの人がいます。
  glTF は「$1$ ＝ $1$ メートル」を推奨していますが、**強制ではありません**
- **上の向き** … Blender は $z$ 軸が上、Three.js は $y$ 軸が上
- **原点** … 足元に置く人、重心に置く人、$3$ ソフトの初期位置のままの人

だから、**読み込んだら測って揃える。** これが定型作業になります。
`,
    },
    {
      kind: 'md',
      text: `
## 測る道具 ― Box3

\`Box3\` は「軸に沿った、外接する箱」です。

\`Box3.setFromObject(model)\` と書くと、**子まで全部たどって**
その木全体を囲む最小の箱を作ります。ワールド座標での実寸です。

そこから取り出すのは $2$ つだけ。

- \`getSize(v)\` … 箱の $x, y, z$ の辺の長さ
- \`getCenter(v)\` … 箱の中心

**引数に受け皿の \`Vector3\` を渡す形**なのは、
毎回新しいオブジェクトを作らないためです（three ではよく出てくる書き方です）。
`,
    },
    {
      kind: 'formula',
      tex: 's \\;=\\; \\frac{L_{\\text{目標}}}{\\max(w,\\, h,\\, d)}',
      readAloud:
        '揃えるための倍率 $s$ は、**望む長さ**を**いちばん長い辺**で割ったものです。いちばん長い辺を基準にすれば、どの向きから来ても必ずその大きさに収まります。',
      worked: {
        given:
          '前の章のモデルを測ったところ、大きさ $(67.5,\\; 34.0,\\; 70.4)$、中心 $(3.25,\\; 0,\\; 0)$ でした。**いちばん長い辺が $1.6$** になるように揃え、さらに**足元を $y = 0$ に**置きます。',
        steps: [
          { calc: '最大辺 = max(67.5, 34.0, 70.4) = 70.4' },
          { calc: 's = 1.6 / 70.4 = 0.022727' },
          { calc: '揃えたあとの大きさ' },
          { calc: '  67.5 x 0.022727 = 1.534' },
          { calc: '  34.0 x 0.022727 = 0.773' },
          { calc: '  70.4 x 0.022727 = 1.600', note: 'ちょうど目標どおり' },
          { calc: '揃えたあとの中心' },
          { calc: '  3.25 x 0.022727 = 0.0739', note: 'scale は原点まわりに効く' },
          { calc: '足元 = 中心y - 高さ/2' },
          { calc: '     = 0 - 0.773 / 2 = -0.386' },
          { calc: 'position = (-0.0739, +0.386, 0)' },
        ],
        result:
          '倍率は **$0.0227$**、そのあと \\`position\\` を **$(-0.0739,\\; 0.386,\\; 0)$** にすれば、いちばん長い辺が $1.6$・足元が $y = 0$・中心が原点の真上に来ます。**注目してほしいのは、中心の $3.25$ も $0.0739$ に縮んでいること。** \\`scale\\` は**原点まわり**に効くので、位置も一緒に縮みます。だから**倍率を決めてから、もう一度測る**のが確実です ― 手で計算せずに \\`Box3\\` をもう一度当てれば、この掛け算を間違えずに済みます。',
      },
    },
    {
      kind: 'md',
      text: `
## 手順は、いつも同じ

1. **測る** … \`Box3.setFromObject\`
2. **倍率を決めて掛ける** … \`model.scale.setScalar(s)\`
3. **もう一度測る** … 縮んだあとの実寸を得る
4. **位置をずらす** … 中心を原点へ、足元を $y = 0$ へ

**$3$ を飛ばさないでください。** $2$ で形が変わっているので、
$1$ で測った値は使えません。計算例で見たとおり、中心の座標も一緒に縮んでいます。

$2$ 回測るのはもったいなく見えますが、\`Box3.setFromObject\` は
頂点ではなく**各メッシュの境界箱**をたどるだけなので、そこまで高くつきません。
`,
    },
    {
      kind: 'sandbox',
      title: '測って、揃える ― FIT を切り替える',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// false にすると、届いたままの姿になります
const FIT = true;

const TARGET = 1.6;   // いちばん長い辺を、この長さに揃える

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(2.4, 1.8, 3.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.8, 0);

const key = new THREE.DirectionalLight(0xffffff, 2.8);
key.position.set(3, 5, 4);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.9));

// 1 マス = 0.5。揃えたあとの大きさを目で測れるようにする
scene.add(new THREE.GridHelper(8, 16, 0x4fd6ff, 0x26263c));

// ===== 「読み込んだモデル」の代わり。巨大・寝ている・中心がずれている =====
const geo = new THREE.TorusKnotGeometry(20, 7, 100, 20);
geo.rotateX(Math.PI / 2);
const model = new THREE.Mesh(
  geo,
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.35, metalness: 0.1 }),
);
model.name = 'Gem';
// ===== ここまで =====

// モデル自身には触らず、親を 1 枚かぶせてそちらを動かす
const holder = new THREE.Group();
holder.add(model);
scene.add(holder);

const readout = document.createElement('div');
readout.style.cssText =
  'position:fixed;left:12px;top:12px;padding:8px 12px;border-radius:8px;' +
  'background:rgba(10,10,18,.82);color:#e8e8f2;font:13px/1.7 monospace;' +
  'border:1px solid #3a3a5c;white-space:pre';
document.body.appendChild(readout);

const size = new THREE.Vector3();
const center = new THREE.Vector3();

// (1) 測る
const box = new THREE.Box3().setFromObject(holder);
box.getSize(size);
box.getCenter(center);
const before = size.clone();

if (FIT) {
  // (2) 倍率を決めて掛ける
  const s = TARGET / Math.max(size.x, size.y, size.z);
  holder.scale.setScalar(s);

  // (3) もう一度測る ― scale は原点まわりに効くので、位置も縮んでいる
  const fitted = new THREE.Box3().setFromObject(holder);
  fitted.getSize(size);
  fitted.getCenter(center);

  // (4) 中心を原点の真上へ、足元を y = 0 へ
  holder.position.x -= center.x;
  holder.position.z -= center.z;
  holder.position.y -= fitted.min.y;

  // (5) 向きを直す。Z-up で作られたものを Y-up にする場合はこれ
  // holder.rotation.x = -Math.PI / 2;
}

const after = new THREE.Box3().setFromObject(holder);
after.getSize(size);

readout.textContent =
  (FIT ? '揃えたあと' : '届いたまま') + '\\n' +
  '元の大きさ ' + before.toArray().map((v) => v.toFixed(1)).join(' x ') + '\\n' +
  'いまの大きさ ' + size.toArray().map((v) => v.toFixed(2)).join(' x ') + '\\n' +
  '倍率 ' + holder.scale.x.toFixed(5) + '\\n' +
  '足元の y ' + after.min.y.toFixed(3) + '\\n' +
  'グリッドの 1 マスは 0.5';

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
        '**グリッドの 1 マスは $0.5$ です。** 揃えたあとは、いちばん長い辺がちょうど $3$ マス強（$1.6$）に収まり、足元が床にぴったり乗っています。`FIT` を `false` にすると届いたままの姿になり、**カメラのすぐ前を巨大な面が横切るだけ**になります。`(5)` のコメントを外すと、向きの直しも効きます。',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'モデル自身ではなく、親を動かす',
      text: `
model.rotation.x = -Math.PI / 2 と直接書くと、あとで困ります。

アニメーションを再生すると、そのトラックが rotation を上書きするからです。
苦労して直した向きが、再生の 1 フレーム目で消えます。

Group を 1 枚かぶせて、そちらを回してください。
親の変換は子に丸ごとかぶさるので、効き目は同じです。

同じことが scale と position にも言えます。
「読み込んだものには触らない」を原則にしておくと、あとで裏切られません。
`,
    },
    {
      kind: 'md',
      text: `
## 向きを直す

**$z$ 軸が上のソフトから来たものは、$x$ 軸まわりに $-90°$ 回す**と起き上がります。

$-\\pi/2$ です。符号を間違えると前後が逆になるので、
**起こしてみて、前後が逆なら $+\\pi/2$** と覚えておけば十分です。

そもそも直さずに済むのが最善で、**書き出しの設定に $Y$-up の項目があるなら
そちらで直してください。** Blender の glTF 書き出しは既定で $Y$-up に変換します
（明示的に切っていなければ、横倒しにはなりません）。

**前後が逆**（背中を向けている）ときは $y$ 軸まわりに $\\pi$ です。
こちらは書き出し側の「前」の定義の違いなので、直すしかありません。
`,
    },
    {
      kind: 'code',
      title: '整える関数を、1 つ作っておく',
      code: `import * as THREE from 'three';

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();

/**
 * 読み込んだモデルを、いちばん長い辺が targetSize になるように揃え、
 * 足元を y = 0、中心を原点の真上に置く。
 * モデル自身には触らず、包んだ Group を返す。
 */
function fitModel(model, targetSize = 1.6, { zUp = false } = {}) {
  const holder = new THREE.Group();
  holder.add(model);

  if (zUp) holder.rotation.x = -Math.PI / 2;
  holder.updateMatrixWorld(true);      // 回転を反映してから測る

  // 1. 測る
  _box.setFromObject(holder).getSize(_size);
  const longest = Math.max(_size.x, _size.y, _size.z);
  if (longest === 0) return holder;    // 中身が空のモデルもある

  // 2. 揃える
  holder.scale.setScalar(targetSize / longest);

  // 3. もう一度測る（scale は原点まわりに効く）
  _box.setFromObject(holder).getCenter(_center);

  // 4. 置き直す
  holder.position.x -= _center.x;
  holder.position.z -= _center.z;
  holder.position.y -= _box.min.y;

  return holder;
}

// 使うとき
const gltf = await loader.loadAsync('/models/robot.glb');
scene.add(fitModel(gltf.scene, 2));`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '測る前に、行列を更新する',
      text: `
Box3.setFromObject は matrixWorld を見ます。

rotation や position を書き換えた直後は、matrixWorld がまだ古いままです。
更新されるのは、次に render が呼ばれたときだからです。

だから「回してから測る」ときは updateMatrixWorld(true) を挟んでください。

これを忘れると、回す前の箱で測ってしまい、
「向きは直ったのに大きさが合わない」という分かりにくい形で出ます。
`,
    },
    {
      kind: 'md',
      text: `
## 何を基準に揃えるか

\`\\max(w, h, d)\` で揃えるのは**万能だが、乱暴**でもあります。

- **人や建物** … **高さ**（$y$）で揃えるほうが自然です。
  横に腕を広げた人形が、最大辺で揃えると小さくなってしまいます
- **並べる部品** … **最大辺**で揃えると、どれも同じ枠に収まって整います
- **地形や床** … 揃えないほうがよいこともあります。実寸に意味があるからです

**目的で選んでください。** 迷ったら最大辺です ―
少なくとも「画面に入らない」ことは無くなります。
`,
    },
  ],
  exercises: [
    {
      prompt: `読み込んだ人形を測ったら、大きさ $(0.8,\\; 2.4,\\; 0.6)$、中心 $(0,\\; 1.5,\\; 0)$ でした。

**高さ**を $1.8$ に揃え、**足元を $y = 0$** に置きます。
倍率と、最後に設定する \`position.y\` を求めてください。`,
      hint: '高さで揃えるので、$s = 1.8 / 2.4$ です。そのあと中心も $s$ 倍になります。',
      answer: `**倍率 $0.75$、\`position.y\` は $-0.225$ です。**

**倍率**

高さで揃えるので、分母は $y$ の辺です。

$s = \\dfrac{1.8}{2.4} = 0.75$

**揃えたあとの大きさ**

$(0.8,\\; 2.4,\\; 0.6) \\times 0.75 = (0.6,\\; 1.8,\\; 0.45)$

高さがちょうど $1.8$ になりました。

**揃えたあとの中心**

\`scale\` は**原点まわり**に効くので、中心の座標も $0.75$ 倍になります。

$(0,\\; 1.5,\\; 0) \\times 0.75 = (0,\\; 1.125,\\; 0)$

**足元**

$\\text{中心}_y - \\dfrac{\\text{高さ}}{2} = 1.125 - \\dfrac{1.8}{2} = 1.125 - 0.9 = 0.225$

**$0.225$ だけ宙に浮いています。**

**置き直す**

足元を $y = 0$ にしたいので、その $0.225$ を引きます。

\`holder.position.y -= 0.225\` ― つまり \`position.y\` は $-0.225$。

$x$ と $z$ の中心は $0$ なので、ずらす必要がありません。

**確かめ**

新しい足元 $= 0.225 + (-0.225) = 0$。合っています。

**元のモデルが浮いていたことに注目してください。**
中心が $1.5$ で高さが $2.4$ なら、足元は $1.5 - 1.2 = 0.3$ ―
最初から $0.3$ 浮いていました。書き出し時の位置がそのまま来ています。

**だから「測って置き直す」を毎回やります。** 作った人を信用しない、ということではなく、
**同じ約束を共有していない**からです。`,
      answerCode: `const box = new THREE.Box3().setFromObject(holder);
const size = box.getSize(new THREE.Vector3());

// 高さで揃える
holder.scale.setScalar(1.8 / size.y);

// 揃えたあとに、もう一度測る
const fitted = new THREE.Box3().setFromObject(holder);
holder.position.y -= fitted.min.y;
holder.position.x -= fitted.getCenter(new THREE.Vector3()).x;`,
    },
    {
      prompt: `**手順を逆にしたら**どうなるでしょう。

中心 $(3.25,\\; 0,\\; 0)$ のモデルに対して、**先に** \`holder.position.x = -3.25\` で中心を合わせ、
**そのあと** \`holder.scale.setScalar(0.0227)\` を掛けました。

最終的に中心はどこに来ますか。`,
      hint: '`scale` はモデルの中身に効き、`position` はその外側で足されます。どちらが先に適用されますか。',
      answer: `**$x = -3.176$** ― まったく合っていません。

**なぜか**

\`Object3D\` の変換は、**拡大 → 回転 → 移動**の順に適用されます。
コードに書いた順番ではありません。

だから最終的なワールド座標はこうなります。

$\\text{中心}_{\\text{world}} = \\text{中心}_{\\text{local}} \\times s + \\text{position}$

$= 3.25 \\times 0.0227 + (-3.25)$

$= 0.0738 - 3.25 = -3.176$

**$-3.176$。** 目標の $0$ から、モデルの大きさ（$1.6$）の $2$ 倍も離れたところです。
**画面から消えます。**

**何を間違えたのか**

\`position.x = -3.25\` は「$3.25$ という**縮む前の**距離を打ち消す」つもりの値でした。
ところが \`position\` は縮みません。**縮むのは中身のほうだけ**です。

打ち消したい相手が $0.0738$ に縮んだのに、打ち消す側は $3.25$ のまま残った ―
これが $-3.176$ の正体です。

**正しくは**

倍率を掛けたあとに、**もう一度測ってから**位置を決めます。

$\\text{position}_x = -0.0738$

**あるいは、手で計算するなら $-3.25 \\times 0.0227$。** 同じ答えになります。

**教訓**

**測ってから変換するのではなく、変換してから測る。**

\`Box3.setFromObject\` は \`matrixWorld\` を見るので、
変換を反映させたあとに当てれば、掛け算を自分でやらずに済みます。
**手で掛け算をしないほうが、間違えません。**`,
    },
    {
      prompt: `Blender から書き出したモデルが横倒しでした。
\`model.rotation.x = -Math.PI / 2\` で直したところ、見た目は正しくなりました。

ところが**アニメーションを再生した瞬間、また横倒しに戻ります。**
なぜですか。どう直しますか。`,
      hint: 'アニメーションのトラックは、何を書き換えていますか。',
      answer: `**アニメーションが \`model.rotation\` を上書きするからです。**

**起きていること**

glTF のアニメーションは「このノードの \`rotation\` を、時刻ごとにこの値にする」
という形で入っています。\`AnimationMixer\` はそれを毎フレーム**代入**します。

手で入れた $-\\pi/2$ は、再生の $1$ フレーム目で消えます。

**同じことが \`position\` と \`scale\` にも起きます。** 移動するアニメーションがあれば、
足元を合わせた位置も上書きされます。

**直し方 ― 親を 1 枚かぶせる**

\`Group\` を作り、その中にモデルを入れて、**\`Group\` のほうを回します。**

アニメーションが触るのはモデル側の \`rotation\` なので、
親の変換は無傷のまま残ります。

親の変換は子に丸ごとかぶさるので、**見た目の結果は同じ**です。

**さらに良いのは、直さないこと**

Blender の glTF 書き出しには「$+Y$ Up」という項目があり、**既定で有効**です。
横倒しで出てくるなら、そこが切れている可能性が高い。

書き出し側で直せば、読み込み側に補正コードを持たずに済みます。
**補正コードはモデルごとに違うので、増えると必ず取り違えます。**

**原則**

**読み込んだものには触らない。** 包んで、外側を動かす。

大きさも、向きも、位置も同じです。
そうしておけば、\`gltf.scene\` はいつでも「書き出されたままの姿」でいてくれます。`,
      answerCode: `import * as THREE from 'three';

const gltf = await loader.loadAsync('/models/robot.glb');

// モデル自身には触らない
const holder = new THREE.Group();
holder.rotation.x = -Math.PI / 2;   // Z-up を Y-up に
holder.add(gltf.scene);
scene.add(holder);

// アニメーションは、これまでどおりモデル側に効く
const mixer = new THREE.AnimationMixer(gltf.scene);
mixer.clipAction(gltf.animations[0]).play();`,
    },
  ],
  quiz: [
    {
      q: '読み込んだモデルの実寸を知りたい。使うのはどれですか。',
      choices: [
        '`new THREE.Box3().setFromObject(model).getSize(v)`',
        '`model.scale`',
        '`model.geometry.parameters`',
        '`model.children.length`',
      ],
      answer: 0,
      explain:
        '`setFromObject` は子まで全部たどって、木全体を囲む最小の箱を作ります。`model.scale` は「掛けた倍率」であって大きさではありません。読み込んだ直後はたいてい 1 のままです。',
    },
    {
      q: '倍率を掛けたあと、位置を合わせる前にもう一度測るのはなぜですか。',
      choices: [
        '`scale` は原点まわりに効くので、中心の座標も一緒に縮むから',
        '`Box3` は 1 回しか使えないから',
        '測定に誤差があるから',
        'GPU の都合',
      ],
      answer: 0,
      explain:
        '中心が (3.25, 0, 0) で倍率が 0.0227 なら、揃えたあとの中心は (0.0739, 0, 0) です。縮む前の 3.25 で位置を決めると、モデルの大きさの何倍も外れます。',
    },
    {
      q: 'Z-up のモデルを起こしたのに、アニメーションを再生すると横倒しに戻ります。どう直しますか。',
      choices: [
        '`Group` を 1 枚かぶせて、`Group` のほうを回す',
        '毎フレーム `rotation.x` を代入し直す',
        'アニメーションを使わない',
        '`matrixAutoUpdate = false` にする',
      ],
      answer: 0,
      explain:
        'アニメーションのトラックはノードの rotation を毎フレーム代入するので、手で入れた値は上書きされます。親をかぶせれば、アニメーションが触らないところで補正できます。',
    },
  ],
};
