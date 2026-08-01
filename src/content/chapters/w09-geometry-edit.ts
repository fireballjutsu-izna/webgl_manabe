import type { Chapter } from '../types.ts';

export const chapterW09: Chapter = {
  slug: 'w09-geometry-edit',
  part: 'threejs',
  number: 9,
  title: 'ジオメトリを書き換える ― 波打つ水面',
  goal: '既にあるジオメトリの頂点を毎フレーム動かせるようになり、その代償がどこに出るかが分かります。',
  requires: ['w08-attributes', 'b22-wave'],
  threeApis: [
    'BufferAttribute.needsUpdate',
    'BufferAttribute.setY',
    'BufferAttribute.getX',
    'PlaneGeometry',
    'BufferGeometry.computeVertexNormals',
    'BufferGeometry.computeBoundingSphere',
  ],
  mathRecall: [
    { slug: 'b22-wave', note: '$\\sin$ の振幅・周波数・位相で、波の形が決まる' },
    { slug: 'b21-circular-motion', note: '位相を時間で進めると、波が流れて見える' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 作ったあとの形を、動かす

前の章までで「頂点を並べて形を作る」ができました。
こんどは、**すでにある形の頂点を、あとから動かします。**

やることは 3 つだけです。

1. \`geometry.attributes.position\` を取り出す
2. 値を書き換える（\`setY\` など）
3. **\`needsUpdate = true\` を立てる**

3 番目が肝心です。書き換えただけでは画面は変わりません。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '手元の紙は書き換えた。まだ送っていない',
      text: `
頂点のデータは、CPU 側（JavaScript の配列）と GPU 側の 2 か所にあります。
描画に使われるのは GPU 側です。

配列を書き換えるのは、手元の紙を直しただけの状態。
GPU 側にはまだ古いものが載っています。

needsUpdate = true は「送り直してくれ」の合図です。
毎フレーム自動で送らないのは、送るのに費用がかかるからです。
`,
    },
    {
      kind: 'code',
      title: '頂点を書き換える 3 手順',
      code: `const pos = geometry.attributes.position;

// 1 頂点ずつ、y だけを書き換える
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getZ(i);
  pos.setY(i, Math.sin(x + z));
}

pos.needsUpdate = true;          // ← これを忘れると、画面は変わらない

geometry.computeVertexNormals(); // 形が変われば、明るさも変わる
// 大きく動かすなら、当たり判定の球も作り直す
geometry.computeBoundingSphere();`,
    },
    {
      kind: 'md',
      text: `
## 平面を、水面にする

\`PlaneGeometry\` は既定で **xy 平面**に立っています。
水面にするには $-90°$ 回して寝かせます。

**このとき $y$ ではなく $z$ を書き換えます。**
回すのは Mesh のほうで、ジオメトリの頂点は寝る前の座標のままだからです。
ここは必ず一度は間違えるところです。

波の形は[](#/ch/b22-wave)そのままです。
振幅・周波数・位相の 3 つで決まり、**位相を時間で進めると波が流れます。**
`,
    },
    {
      kind: 'formula',
      tex: 'h(x, z, t) \\;=\\; A \\sin\\!\\bigl(k\\,(x\\cos\\theta + z\\sin\\theta) - \\omega t\\bigr)',
      readAloud:
        '進む向きを持った波の式です。カッコの中は「波の進む向きに、その点がどれだけ進んだか」で、内積そのものです。そこから時間に比例する量を引くと、波が前へ流れます。',
      worked: {
        given:
          '振幅 $A = 0.4$、波数 $k = 1.5$、角速度 $\\omega = 2$、向き $\\theta = 0$（$x$ 方向）の波。**点 $(2,\\,0)$ の高さ**を、$t = 0$ と $t = 1$ で求めます。',
        steps: [
          { calc: 'theta = 0 なので cos0 = 1, sin0 = 0' },
          { calc: '向きへの進み = x x 1 + z x 0 = 2', note: '内積。z は効かない' },
          { calc: 't = 0 : 0.4 x sin(1.5 x 2 - 0)' },
          { calc: '      = 0.4 x sin(3) = 0.4 x 0.1411 = 0.0564' },
          { calc: 't = 1 : 0.4 x sin(3 - 2)' },
          { calc: '      = 0.4 x sin(1) = 0.4 x 0.8415 = 0.3366' },
        ],
        result:
          '**$0.056 \\to 0.337$** と上がりました。$-\\omega t$ を引いているので、時間が進むと**波の山が $+x$ 方向へ移動**します。符号を $+\\omega t$ にすると逆向きに流れます。**1 周する時間**は $2\\pi/\\omega = 3.14$ 秒、**山と山の間隔**は $2\\pi/k = 4.19$ です。この 2 つを別々に決められるのが、この書き方の利点です。',
      },
    },
    {
      kind: 'sandbox',
      title: '波打つ水面',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.Fog(0x0a0a12, 14, 34);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 6.5, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, -0.6, 0);

const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(4, 6, 3);
scene.add(key, new THREE.HemisphereLight(0x88aaff, 0x101020, 0.9));

// PlaneGeometry は xy 平面に立っている。寝かせるのは Mesh 側
const SEGS = 90;
const geometry = new THREE.PlaneGeometry(14, 14, SEGS, SEGS);

const water = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
  color: 0x2f7fd0,
  roughness: 0.25,
  metalness: 0.1,
  side: THREE.DoubleSide,
}));
water.rotation.x = -Math.PI / 2;      // 寝かせる
scene.add(water);

const pos = geometry.attributes.position;

// もとの平らな座標を、先に控えておく
// （書き換えた値の上にさらに書き換えると、どんどんずれていく）
const flatX = Float32Array.from({ length: pos.count }, (_, i) => pos.getX(i));
const flatY = Float32Array.from({ length: pos.count }, (_, i) => pos.getY(i));

// 3 つの波を足し合わせる。1 本だと規則的すぎて水に見えない
const waves = [
  { amp: 0.30, k: 0.80, omega: 1.1, dir: 0.0 },
  { amp: 0.16, k: 1.70, omega: 1.9, dir: 1.1 },
  { amp: 0.07, k: 3.30, omega: 3.0, dir: 2.4 },
];

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();

  for (let i = 0; i < pos.count; i++) {
    const x = flatX[i];
    const y = flatY[i];       // 寝かせる前なので、これが奥行きになる

    let h = 0;
    for (const w of waves) {
      // 波の進む向きへの、その点の進み具合（内積）
      const along = x * Math.cos(w.dir) + y * Math.sin(w.dir);
      h += w.amp * Math.sin(w.k * along - w.omega * t);
    }

    pos.setZ(i, h);           // 寝かせる前なので z。ここが引っかかりどころ
  }

  pos.needsUpdate = true;           // 送り直す
  geometry.computeVertexNormals();  // 形が変われば明るさも変わる

  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '`pos.needsUpdate = true` を消すと、水面が平らなまま止まります（計算はしているのに送っていない）。`computeVertexNormals()` を消すと、動いてはいるのに**光り方が平らなまま**で、のっぺりします。`waves` の 3 行を 1 行に減らすと、規則的すぎて水に見えなくなります。',
    },
    {
      kind: 'md',
      text: `
## もとの座標を、控えておく

上のコードで \`flatX\` / \`flatY\` に元の座標を控えているのには理由があります。

**書き換えた値を、次のフレームでまた読んでしまうと、変形が積み重なります。**

$x$ を読んで $x + 0.1$ を書く、を毎フレームやれば、$x$ はどこまでも増えていきます。
一度でもこれをやると、形が壊れて戻せません。

だから**「元の形」と「いま表示している形」を分けて持ちます。**
上のコードでは $z$ しか書き換えていないので $x$ / $y$ は無事ですが、
$x$ も動かす波にした瞬間に壊れます。先に控えておくのが安全です。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '毎フレーム computeVertexNormals は、重い',
      text: `
全部の面について外積を取り、共有する頂点ぶんを足し合わせて正規化します。
頂点が 8281 個（90 x 90）なら、それを毎フレームです。

動けば動くのですが、これは CPU の仕事です。
分割数を上げていくと、まずここで頭打ちになります。

もっと良いやり方があり、それが頂点シェーダです。
同じ計算を GPU が並列でやるので、けた違いに速くなります。
`,
    },
    {
      kind: 'md',
      text: `
## この方法の限界と、次の一手

毎フレームの頂点書き換えには、はっきりした費用があります。

- **JavaScript のループ** … 頂点数ぶん回る。$90 \\times 90$ なら 8281 回、毎フレーム
- **CPU から GPU への転送** … 書き換えた配列を毎フレーム送り直す
- **法線の再計算** … さらに全部の面ぶん

$100 \\times 100$ くらいまでは平気ですが、$500 \\times 500$ にすると目に見えて重くなります。

**同じ見た目を、はるかに安く作る方法があります。**
頂点の移動を GPU にやらせる ― [](#/ch/t13-vertex-shader)の頂点シェーダです。

そちらなら転送は 0、計算は数千の頂点が同時に走ります。

**ではなぜ、この章のやり方を先にやるのか。**
2 つ理由があります。

- **CPU 側に結果が残る**（シェーダで動かすと、JavaScript からは頂点の位置が分からない）
- **当たり判定に使える**（波の上に浮かぶ船の高さは、この方法なら読み取れる）

「見せるだけ」ならシェーダ、「読み返す必要がある」ならこちらです。
`,
    },
    {
      kind: 'code',
      title: '波の高さを読み返す ― 船を浮かべる',
      code: `// 高さを返す関数を、1 つだけ用意して両方から呼ぶ
function waveHeight(x, z, t) {
  let h = 0;
  for (const w of waves) {
    const along = x * Math.cos(w.dir) + z * Math.sin(w.dir);
    h += w.amp * Math.sin(w.k * along - w.omega * t);
  }
  return h;
}

// 頂点の書き換えにも、船の高さにも、同じ関数を使う
// → ずれようがない
boat.position.y = waveHeight(boat.position.x, boat.position.z, t);

// 傾きも出せる。少し離れた 2 点の高さの差が、そのまま傾き
const eps = 0.3;
const hx = waveHeight(boat.position.x + eps, boat.position.z, t) - boat.position.y;
const hz = waveHeight(boat.position.x, boat.position.z + eps, t) - boat.position.y;

boat.rotation.z = -Math.atan2(hx, eps);
boat.rotation.x = Math.atan2(hz, eps);`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '境界球も作り直す',
      text: `
頂点を大きく動かすと、three が持っている「この形を包む球」が古くなります。

この球は「画面の外にあるものを描かずに済ませる」判定に使われるので、
古いままだと、画面内にあるのに消える（あるいはその逆）ことがあります。

大きく動かしたなら geometry.computeBoundingSphere() を呼んでください。
波の高さくらいなら要りませんが、頂点を遠くへ飛ばす演出では必要になります。
`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスで \`pos.needsUpdate = true\` の行を消してください。何が起きますか。
そして、**なぜ three は自動でやってくれないのでしょう。**`,
      hint: '書き換えた配列は、どこにあるものでしたか。',
      answer: `**水面が平らなまま止まります。** ループは毎フレーム回り、計算もされているのに、です。

頂点のデータは 2 か所にあります。

- **CPU 側** … JavaScript の \`Float32Array\`。あなたが書き換えているのはこちら
- **GPU 側** … 実際に描画に使われるコピー

\`setZ()\` は CPU 側の配列を書き換えるだけです。
\`needsUpdate = true\` が「GPU へ送り直せ」の合図になります。

**なぜ自動でないのか**

送るのに費用がかかるからです。
$90 \\times 90$ の平面なら $8281 \\times 3 \\times 4 = 99{,}372$ バイト。
毎フレーム送れば毎秒 6MB になります。

そして**ほとんどのジオメトリは動きません。** 建物も地面も木も、一度送れば終わりです。
自動で送る作りにすると、動かないもののぶんまで毎フレーム転送することになります。

だから three は「送れと言われたときだけ送る」形にしています。

**似た形の落とし穴** … \`material.needsUpdate\`、\`texture.needsUpdate\` も同じ考え方です。
「作り直しに費用がかかるものは、明示的に頼む」という一貫した設計です。`,
    },
    {
      prompt: `波の**山と山の間隔を 2 倍**にし、**流れる速さは変えない**ようにしたい。
$k$ と $\\omega$ をどう変えますか。手で計算して確かめてください。`,
      hint: '波長は $2\\pi/k$、波の進む速さは $\\omega/k$ です。',
      answer: `**$k$ を半分にし、$\\omega$ も半分にします。**

**波長**（山と山の間隔）… $\\lambda = \\dfrac{2\\pi}{k}$

$k$ を半分にすれば $\\lambda$ は 2 倍。ここまでは素直です。

**ところが、速さも変わってしまいます。**

波の進む速さ … $v = \\dfrac{\\omega}{k}$

$k$ だけを半分にすると $v$ は **2 倍**になります。
波長を伸ばしたつもりが、倍速で流れる別物になってしまいます。

**だから $\\omega$ も半分にします。**

$v = \\dfrac{\\omega/2}{k/2} = \\dfrac{\\omega}{k}$ ― **速さは変わりません。**

**数字で確かめる**（1 本目の波：$k = 0.8$、$\\omega = 1.1$）

- 変更前 … $\\lambda = 6.283/0.8 = 7.85$、$v = 1.1/0.8 = 1.375$
- 変更後 … $k = 0.4$、$\\omega = 0.55$
- $\\lambda = 6.283/0.4 = 15.71$（**2 倍**）、$v = 0.55/0.4 = 1.375$（**同じ**）

**周期は変わります** … $T = 2\\pi/\\omega$ なので $5.71 \\to 11.42$ 秒。
これは当然で、2 倍長い波が同じ速さで通り過ぎるには 2 倍の時間がかかります。`,
      answerCode: `// 波長を 2 倍にして、速さは保つ
const waves = [
  { amp: 0.30, k: 0.40, omega: 0.55, dir: 0.0 },   // 0.80 / 1.1 の半分ずつ
  { amp: 0.16, k: 0.85, omega: 0.95, dir: 1.1 },
  { amp: 0.07, k: 1.65, omega: 1.50, dir: 2.4 },
];`,
    },
    {
      prompt: `\`PlaneGeometry\` を \`rotation.x = -Math.PI / 2\` で寝かせた水面で、
高さを付けるのに書き換えるのは $y$ ですか、$z$ ですか。**なぜ**でしょう。`,
      hint: 'ジオメトリの頂点座標は、Mesh を回すと変わりますか。',
      answer: `**$z$ です。**

\`PlaneGeometry\` は **xy 平面**に作られます。頂点は $(x,\\,y,\\,0)$ の形で、$z$ はすべて 0 です。

\`mesh.rotation.x\` を変えても、**ジオメトリの頂点座標そのものは 1 ミリも変わりません。**
回転は Mesh が持つ行列の話で、描画のときに掛けられるだけです（[](#/ch/m17-local-world)）。

つまり、あなたが書き換えているのは**寝かせる前のローカル座標**です。

- 平面のローカルでは、面は xy に広がり、**法線方向は $z$**
- だから「面から浮き上がる高さ」は $z$

$-90°$ 回されたあと、ローカルの $+z$ はワールドの $+y$ を向きます。
結果として、狙いどおり上下に波打ちます。

**間違えて $y$ を書き換えると** … 面が奥行き方向に伸び縮みするだけで、
水面は平らなまま、輪郭がぐにゃぐにゃ動く奇妙な見た目になります。

**確実な見分け方** … 迷ったら回転を一時的に外してください。
立った状態で正しく波打っていれば、軸は合っています。

**回さずに済ませる手もあります** … \`geometry.rotateX(-Math.PI / 2)\` は
**頂点そのものを回します。** そうすれば以後は素直に $y$ を書き換えられます。
一度きりの費用で、あとがずっと分かりやすくなります。`,
      answerCode: `// A. Mesh を回す（頂点は xy のまま → z を書き換える）
water.rotation.x = -Math.PI / 2;
pos.setZ(i, h);

// B. ジオメトリごと回す（頂点が xz に寝る → y を書き換える）
geometry.rotateX(-Math.PI / 2);      // 最初に1回だけ
pos.setY(i, h);                      // 以後は素直`,
    },
  ],
  quiz: [
    {
      q: '頂点の座標を書き換えたのに画面が変わりません。足りないのはどれですか。',
      choices: [
        '`attribute.needsUpdate = true`',
        '`scene.add()` の呼び直し',
        'マテリアルの作り直し',
        'カメラの更新',
      ],
      answer: 0,
      explain:
        '書き換えたのは CPU 側の配列で、描画に使われるのは GPU 側のコピーです。ほとんどのジオメトリは動かないので、three は毎フレーム自動で送ることはせず、頼まれたときだけ送ります。',
    },
    {
      q: '頂点を動かしたあと `computeVertexNormals()` を呼ばないと、どうなりますか。',
      choices: [
        '形は変わるが、光り方が元のままで、のっぺり見える',
        '何も変わらない',
        'エラーになる',
        '面が消える',
      ],
      answer: 0,
      explain:
        '明るさは法線と光の内積で決まります。形だけ変えて法線を古いままにすると、山の斜面が平らだったときの明るさで描かれ、立体感が出ません。',
    },
    {
      q: '毎フレーム頂点を書き換える方法と、頂点シェーダで動かす方法。CPU 側の書き換えを選ぶ理由はどれですか。',
      choices: [
        '動かした結果を JavaScript から読み返せる（当たり判定などに使える）',
        '常に速い',
        'コードが短い',
        'シェーダでは波を作れない',
      ],
      answer: 0,
      explain:
        '速さでは頂点シェーダが圧倒的です。ただしシェーダで動かした頂点の位置は GPU の中にしかなく、JavaScript からは読めません。波の上に船を浮かべるなら、高さを CPU 側でも知っている必要があります。',
    },
  ],
};
