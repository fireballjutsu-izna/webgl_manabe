import type { Chapter } from '../types.ts';

export const chapterX32: Chapter = {
  slug: 'x32-shadow-range',
  part: 'project',
  number: 32,
  title: '影の範囲 ― 街全体は、写せない',
  goal: '影の記録が「光から見たカメラ」であることから粗さの原因を計算できるようになり、範囲・解像度・見える距離の $3$ つを取引できるようになります。',
  requires: ['x31-sun-height', 't05-light-shadow', 'w21-shadow-quality'],
  threeApis: [
    'DirectionalLight.shadow',
    'DirectionalLightShadow.mapSize',
    'DirectionalLightShadow.camera',
    'Object3D.castShadow',
    'CameraHelper',
  ],
  mathRecall: [
    { slug: 'w21-shadow-quality', note: '縞・ギザギザ・浮き。原因は $3$ つとも別' },
    { slug: 'm27-frustum', note: '写る範囲の外は、影も計算されない' },
    { slug: 'b05-ratio', note: '$1$ テクセルが受け持つ広さ ＝ 範囲 ÷ 解像度' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 影の記録は、1 枚の画像しかない

影で必ずぶつかる壁があります。

**街は $120$ の広さなのに、影の記録は $1$ 枚の画像しかありません。**

[](#/ch/t05-light-shadow)でやったとおり、影は「光から見たカメラ」で撮った
**距離の記録**です。そのカメラが覆う範囲を広げるほど、
$1$ テクセルが受け持つ面積が広くなります。

どれくらい粗くなるのかは、割り算 $1$ つで出ます。
`,
    },
    {
      kind: 'formula',
      tex: '\\ell_{\\text{texel}} \;=\; \\dfrac{W_{\\text{camera}}}{N_{\\text{map}}}',
      readAloud:
        '影の $1$ テクセルが世界で受け持つ長さは、影のカメラが覆う幅を、影の記録の $1$ 辺の画素数で割ったものです。範囲を広げれば粗くなり、解像度を上げれば細かくなります ― それだけの関係です。',
      worked: {
        given: '街の一辺は $120$。$1$ 単位を $1$ メートルとして、いくつかの組み合わせを比べます。',
        steps: [
          { calc: '範囲 92（±46） / 2048 px' },
          { calc: '  92 / 2048 = 0.0449 m = 4.5 cm' },
          { calc: '範囲 140（±70） / 2048 px' },
          { calc: '  140 / 2048 = 0.0684 m = 6.8 cm' },
          { calc: '範囲 92 / 1024 px' },
          { calc: '  92 / 1024 = 0.0898 m = 9.0 cm' },
          { calc: '範囲 28（±14） / 1024 px' },
          { calc: '  28 / 1024 = 0.0273 m = 2.7 cm', note: 'いちばん細かい' },
        ],
        result:
          '**範囲を半分にするのと、解像度を $2$ 倍にするのは、まったく同じ効果**です。ただし費用が違います ― 解像度を $2$ 倍にすると、記録は $2048^2 \\times 4 = 16$ メガバイト（$1024^2$ なら $4$ MB）で**$4$ 倍**になり、毎フレームそこへ描き直す時間も増えます。**範囲を狭めるほうはタダ**です。だから最初に絞るのは範囲のほうです。',
      },
    },
    {
      kind: 'md',
      text: `
## 打つ手は 3 つ

- **範囲を狭めて、見ている場所のまわりだけ影を出す。** いちばん効きます
- **フォグで遠くを隠す。** 影が無いことに気づかせない
- **遠くの影を諦める。** ゲームでも普通にやっています

このコードでは $1$ つめを採り、\`sun.target\` を
**\`controls.target\`（＝いま見ている場所）に追従させて**います。
カメラを動かすと、影の範囲もついてきます。

$3$ つを組み合わせるのが実際のやり方です。
影の範囲をカメラの近くに絞り、その外はフォグで霞ませ、
さらに外は**そもそも影を出さない** ― どこで切り替わったか気づかせなければ勝ちです。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'DirectionalLight の影は position だけでは決まりません',
      text: `
\`DirectionalLight\` の光は「\`position\` から \`target\` へ向かう向き」です。
既定の \`target\` は原点に置かれています。

影の範囲（\`shadow.camera\`）は **target を中心に**取られるので、
target を動かさないまま position だけを動かすと、
**影の範囲は原点のまわりから動きません。**

\`light.target.position\` を書き換えたら、**\`light.target.updateMatrixWorld()\` を呼んでください。**
target は \`scene\` に追加されていないので、three が自動では更新してくれません。

これは「動かしたのに動かない」種類の不具合の代表格で、
しかもエラーが出ないので、原因にたどり着くのに時間がかかります。
`,
    },
    {
      kind: 'sandbox',
      title: '影の範囲を切り替えて、粗さを見比べる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ba6cc);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 400);
camera.position.set(-16, 13, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2, 0);
controls.maxPolarAngle = Math.PI * 0.495;

// 影の記録はわざと小さめにして、差を分かりやすくする
const SHADOW_MAP = 1024;

const sun = new THREE.DirectionalLight(0xfff0d8, 3);
sun.position.set(14, 18, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(SHADOW_MAP, SHADOW_MAP);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 120;
sun.shadow.bias = -0.0005;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xbcd4ff, 0x44444e, 0.7));

const helper = new THREE.CameraHelper(sun.shadow.camera);
scene.add(helper);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ color: 0x6f7480, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 手前に数棟、確認用に置く
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xc9cdd6, roughness: 0.8 });
const layout = [
  [0, 6, 0, 4], [-7, 9, 3, 3.4], [6, 4, -5, 4.6], [-4, 3.5, -7, 3], [8, 7, 6, 3.2],
];
for (const item of layout) {
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.scale.set(item[3], item[1], item[3]);
  box.position.set(item[0], item[1] / 2, item[2]);
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
}

/* ---- 範囲の切り替え ---- */

const readout = document.createElement('div');
readout.style.cssText =
  'position:absolute; left:12px; bottom:12px; color:#0b1220; font:12px monospace;' +
  'pointer-events:none; white-space:pre;';
document.body.appendChild(readout);

function setRange(half) {
  sun.shadow.camera.left = -half;
  sun.shadow.camera.right = half;
  sun.shadow.camera.top = half;
  sun.shadow.camera.bottom = -half;
  // 投影の設定を変えたら、必ず組み直す（1-10 と同じ話）
  sun.shadow.camera.updateProjectionMatrix();
  helper.update();

  const meters = (half * 2) / SHADOW_MAP;
  readout.textContent =
    '影の範囲 ±' + half + '\\n記録 ' + SHADOW_MAP + 'x' + SHADOW_MAP +
    '\\n1 画素が受け持つ幅 ' + meters.toFixed(3);
}

function addButton(text, left, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText =
    'position:absolute; bottom:82px; left:' + left + 'px; padding:6px 10px;' +
    'background:#12121f; color:#e8e8f2; border:1px solid #3a3a5c; border-radius:6px;' +
    'font:12px sans-serif; cursor:pointer;';
  button.addEventListener('click', onClick);
  document.body.appendChild(button);
}

addButton('街全体をカバー（±70）', 12, () => setRange(70));
addButton('見ている場所だけ（±14）', 186, () => setRange(14));

setRange(70);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        '±70 では影のふちがギザギザで、箱の足元がにじみます。±14 に切り替えると、同じ 1024×1024 の記録でくっきりします。白い枠が「光から見たカメラ」の範囲です。±14 では枠の外に出た箱の影が消えることにも注目してください ― これが「遠くの影を諦める」の正体です。',
    },
    {
      kind: 'md',
      text: `
## 影のカメラも、カメラです

\`shadow.camera\` は \`OrthographicCamera\` です。
つまり[](#/ch/m29-ortho)でやった正射影そのもので、
\`left\`・\`right\`・\`top\`・\`bottom\`・\`near\`・\`far\` を持っています。

だから、ふつうのカメラと同じ注意がそのまま当てはまります。

- **値を書き換えたら \`updateProjectionMatrix()\`。** 忘れると反映されません
- **\`near\` と \`far\` の外は写らない。** far を短くしすぎると、
  高いビルの影が上のほうだけ消えます
- **範囲の外は「影が無い」ことになる。** 影が消えるのであって、
  「影に入らない」わけではありません

$3$ つめが、サンドボックスで枠の外の箱の影が消える理由です。
`,
    },
  ],
  exercises: [
    {
      prompt: `影の記録を $1024$ から $4096$ に上げると、テクセルの細かさと記録の大きさはどうなりますか（範囲は $\\pm 46$ のまま）。`,
      hint: '長さは $1$ 辺に比例し、記録の大きさは面積に比例します。',
      answer: `**細かさは $4$ 倍（$9.0 \\to 2.2$ cm）、記録は $16$ 倍（$4 \\to 64$ MB）です。**

**計算**

$\\ell = 92 / 4096 = 0.0225$ m $= 2.2$ cm

記録の大きさ … $4096^2 \\times 4$ バイト $= 64$ MB

**割に合うか**

$4$ 倍細かくするために **$60$ メガバイト**を払っています。

同じ効果は、**範囲を $\\pm 46$ から $\\pm 11.5$ に絞れば $0$ 円**で得られます。

そして範囲を絞ったときに失うのは「遠くの影」だけで、
それはフォグで隠せます。

**解像度を上げるのは、最後の手段**です。

**それでも上げる場面**

- **範囲を絞れない。** 街全体を俯瞰で見せる作品（絞ると画面内に影の境目が見える）
- **すでに絞ってある。** $\\pm 10$ まで絞ってなお粗いなら、解像度しかありません

**順番は「範囲 $\\to$ 解像度」**です。逆にやると、
$64$ メガバイト払ったあとで「範囲を絞れば済んだ」と気づきます。`,
    },
    {
      prompt: `\`sun.target\` を \`controls.target\` に追従させています。

追従させないと、視点を街の端へ動かしたとき何が見えますか。`,
      hint: '影の範囲は target を中心に取られます。',
      answer: `**街の端では、影がまったく出なくなります。**

**何が起きるか**

target が原点のままなら、影の範囲も原点のまわり（$\\pm 46$）に固定です。

視点を端（$x = 60$ あたり）へ動かすと、**そこは範囲の外**です。

- 建物は見える
- **影だけが $1$ つも無い**

影の無い街は、**建物が地面に浮いて見えます。**
接地感を出しているのは、ほとんど影の役目だからです。

**しかも、境目が見えます**

視点をゆっくり動かすと、$x = 46$ のあたりで
**影がすっぱり途切れる線**が地面に現れます。

これはフォグでも隠せません ― 手前にあるからです。

**追従させたときの注意**

追従させると、影の範囲は常にカメラの見ている場所にあります。

その代わり、**視点を動かすたびに影の記録を作り直す**ことになります。
静止しているときは変わらないので、
「動いたときだけ更新する」最適化が効く場所でもあります。

**そして \`light.target.updateMatrixWorld()\` を忘れないでください。**
これを忘れると、追従のコードを書いたのに何も起きません。`,
    },
    {
      prompt: `影の \`bias\` に $-0.0006$ を入れています。

これを $0$ にすると何が起きますか。逆に $-0.05$ のような大きな値にすると？`,
      hint: '[](#/ch/w21-shadow-quality)でやった、縞と浮きの話です。',
      answer: `**$0$ にすると縞が出て、大きくしすぎると影が浮きます。**

**$0$ のとき ― 縞（シャドウアクネ）**

影の記録は有限の精度なので、
「その面が自分自身の影に入っている」と誤判定することがあります。

床のように光と浅い角度で交わる面で、**縞模様**として現れます。

$bias$ は、その誤判定を避けるために**比較の位置を少しずらす**値です。

**大きすぎるとき ― 浮き（ピーターパン）**

ずらしすぎると、影が物から**離れます。**

建物の足元に隙間ができ、**建物が地面から浮いて見えます。**
影の役割（接地感）が壊れるので、縞より目立つこともあります。

**ちょうどよい値は、場面ごとに違います**

$bias$ に効くのは、

- 影のカメラの範囲（テクセルの大きさ）
- \`near\` と \`far\`（深度の刻み）
- 面と光の角度

**だから「この値が正解」はありません。** 範囲を変えたら、$bias$ も見直します。

three には \`normalBias\` もあり、面の法線方向にずらすので
浅い角度の面に効きます。$2$ つを併用するのが定石です。`,
    },
  ],
  quiz: [
    {
      q: '影の 1 テクセルが世界で受け持つ長さは、どう決まりますか。',
      choices: [
        '影のカメラが覆う幅 ÷ 影の記録の 1 辺の画素数',
        '影の記録の画素数だけで決まる',
        'カメラの画角で決まる',
        '光の強さで決まる',
      ],
      answer: 0,
      explain:
        '範囲 92 を 2048 で割れば 4.5 cm、140 を 2048 で割れば 6.8 cm です。範囲を半分にするのと解像度を 2 倍にするのは同じ効果ですが、費用が違います ― 解像度を 2 倍にすると記録は 4 倍（4 MB から 16 MB）になり、範囲を狭めるほうはタダです。だから先に絞るのは範囲です。',
    },
    {
      q: '`DirectionalLight` の影の範囲は、何を中心に取られますか。',
      choices: [
        'light.target の位置。position を動かしても範囲は動かない',
        'light.position',
        'シーンの原点で固定',
        'カメラの位置',
      ],
      answer: 0,
      explain:
        '光の向きは position から target へのベクトルですが、影のカメラは target を中心に置かれます。だから target を動かさずに position だけ動かしても、影の範囲は元の場所から動きません。target は scene に追加されていないので、位置を書き換えたら light.target.updateMatrixWorld() を自分で呼ぶ必要があります。',
    },
    {
      q: '影の `bias` を 0 にすると何が起きますか。',
      choices: [
        '面が自分自身の影に入ったと誤判定され、床などに縞模様が出る',
        '影が消える',
        '影が濃くなる',
        '影が物から離れて浮く',
      ],
      answer: 0,
      explain:
        '影の記録は有限の精度なので、光と浅い角度で交わる面では自己遮蔽の誤判定が起きます。bias は比較の位置をずらしてそれを避ける値ですが、ずらしすぎると今度は影が物から離れて建物が浮いて見えます。範囲や near/far を変えたら bias も見直す必要があり、「この値が正解」というものはありません。',
    },
  ],
};
