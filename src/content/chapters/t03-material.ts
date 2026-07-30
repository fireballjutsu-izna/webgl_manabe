import type { Chapter } from '../types.ts';

export const chapterT03: Chapter = {
  slug: 't03-material',
  part: 'threejs',
  number: 3,
  title: '見た目を決める ― マテリアル',
  goal: 'マテリアルを目的に応じて選べるようになり、粗さ・金属度・透明の扱いで迷わなくなります。',
  requires: ['t02-geometry', '11-normal-light'],
  threeApis: [
    'MeshBasicMaterial',
    'MeshLambertMaterial',
    'MeshPhongMaterial',
    'MeshStandardMaterial',
    'MeshNormalMaterial',
    'Material.transparent',
    'Material.opacity',
    'Material.side',
    'Material.depthWrite',
  ],
  mathRecall: [
    { slug: '11-normal-light', note: '明るさ＝法線と光の内積' },
    { slug: '03-dot', note: 'てかりも「反射とカメラの内積」' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## マテリアルは「光にどう応じるか」の決めごと

同じ球でも、粘土に見えたり、金属に見えたり、発光しているように見えたりします。
違いを生むのは形ではなくマテリアルです。

そしてマテリアルがやっていることは、結局のところ
**「この面に光が当たったとき、どんな色を返すか」を決める**ことに尽きます。
[1-11 法線とライティング](#/ch/11-normal-light)でやった内積の計算が、その中心にいます。
`,
    },
    {
      kind: 'md',
      text: `
## 5つを並べて見る

言葉で説明するより並べたほうが早いので、同じ形・同じ光で見比べます。
**光の強さを 0 にしてみてください。** 消えずに残るものが「光を無視する材質」です。
`,
    },
    {
      kind: 'demo',
      id: 'material-compare',
      caption:
        '粗さ（roughness）を 0 に近づけるとハイライトが小さく鋭くなり、1 に近づけると広がって消えます。金属度を上げると、映り込むものが無い場面では逆に暗くなります。',
    },
    {
      kind: 'md',
      text: `
## 使い分けの指針

- **MeshBasicMaterial** … 光を一切受けず、指定した色がそのまま出る。
  UI 的な線・補助表示・自分で明るさを計算したいときに使う。**いちばん軽い**
- **MeshLambertMaterial** … ざらついた面。内積 1 回ぶんの素直な陰影。軽い
- **MeshPhongMaterial** … Lambert にてかり（ハイライト）を足したもの。
  プラスチックや濡れた面らしさが出る
- **MeshStandardMaterial** … 現在の標準。**粗さ**と**金属度**という
  直感的な 2 つのつまみで、たいていの質感が出せる
- **MeshNormalMaterial** … 法線の向きをそのまま色にしたもの。
  見た目のためではなく、**法線が正しいかを確かめる道具**として使う

迷ったら Standard を選んでください。速度が問題になったときだけ Lambert や Basic を検討します。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '真っ黒なときの切り分けに Basic を使う',
      text: `
物体が真っ黒で「ライトが無いのか、法線が壊れているのか、そもそも映っていないのか」が
分からないときは、いったん \`MeshBasicMaterial\` に差し替えてください。
光を無視するので、**映っていれば形と位置は正しい**と分かり、原因をライトか法線に絞り込めます。
`,
    },
    {
      kind: 'md',
      text: `
## 粗さと金属度 ― 2つのつまみ

\`MeshStandardMaterial\` の中心はこの 2 つです。

- **roughness（粗さ）** … 0 なら鏡のよう、1 ならつや消し。
  上げるほどハイライトが広がってぼやけます
- **metalness（金属度）** … 0 なら非金属（塗装・木・布）、1 なら金属

大事な注意が 1 つあります。**金属は「まわりの景色を映すもの」**です。
映り込む対象（{{環境マップ}}）がない空っぽのシーンで金属度を 1 にすると、
金属らしくなるどころか**ただ暗くなります**。金属を使うなら環境マップ（\`scene.environment\`）を
用意するか、明るい背景を置いてください。

なお中間の値（0.5 など）は物理的にはあまり意味がありません。
**0 か 1 のどちらかにして、質感は粗さで作る**のが定石です。
`,
    },
    {
      kind: 'sandbox',
      title: '粗さと金属度をいじる',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(3, 4, 4);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.6));

// 横に粗さ、縦に金属度を変えて並べる
const geometry = new THREE.SphereGeometry(0.42, 32, 20);
const COLS = 5;
const ROWS = 3;

for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      roughness: col / (COLS - 1),      // 左が 0（つるつる）、右が 1（ざらざら）
      metalness: row / (ROWS - 1),      // 下が 0（非金属）、上が 1（金属）
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((col - (COLS - 1) / 2) * 1.1, (row - (ROWS - 1) / 2) * 1.1, 0);
    scene.add(mesh);
  }
}

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
        '上の段（金属度 1）が暗く沈んでいるのが分かります。映り込む景色が無いためです。`scene.background` を明るい色に変えると、上の段だけ大きく印象が変わります。',
    },
    {
      kind: 'md',
      text: `
## 透明 ― つまずきが多いところ

透明にするには **2 つ**設定が要ります。片方だけでは効きません。

- \`transparent: true\` … 透明として扱うことを宣言する
- \`opacity: 0.5\` … どれくらい透けるか

そして透明を使うと、**描く順番の問題**が必ずついてきます。
Three.js は不透明なものを先に描き、透明なものを奥から順に描きますが、
交差していたり入れ子になっていたりすると、正しい順番が決まりません。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '透明なものが互いを消し合うとき',
      text: `
透明な面どうしが重なって、手前のものが奥のものを消してしまうことがあります。
これは、透明な面が**奥行きを書き込んでしまう**ために起きます。
\`depthWrite: false\` を指定すると書き込みをやめさせられます。
ガラスの箱や煙のような、重なることが前提のものではこれが定番です。
`,
    },
    {
      kind: 'code',
      title: '透明の指定',
      code: `const glass = new THREE.MeshStandardMaterial({
  color: 0x88ccff,
  transparent: true,   // これが無いと opacity は効かない
  opacity: 0.35,
  depthWrite: false,   // 透明どうしが消し合うときに外す
  side: THREE.DoubleSide, // 裏側も描く（箱の内側が見える）
});

// 完全に消したいだけなら透明より visible のほうが軽い
mesh.visible = false;`,
    },
    {
      kind: 'md',
      text: `
## 面の裏表 ― side

既定では**裏面は描かれません**。見えない面を捨てて速くするためです。

- \`THREE.FrontSide\`（既定）… 表だけ
- \`THREE.BackSide\` … 裏だけ。空を表す大きな球の内側を見せるときに使う
- \`THREE.DoubleSide\` … 両面。板・葉・布など、厚みのないものに

\`DoubleSide\` は 2 倍描くことになるので、必要なところだけにしてください。
`,
    },
    {
      kind: 'md',
      text: `
## 色の指定と、色空間

色は 16 進数（\`0xff6b8a\`）でも文字列（\`'tomato'\`）でも \`THREE.Color\` でも渡せます。

ひとつ知っておくとよいのが、**色は「見た目の明るさ」で扱われている**ということです。
Three.js は内部では計算しやすい形に変換し、最後に画面用に戻しています。
自分で色を作って渡すぶんには意識する必要はありませんが、
テクスチャを読み込むときには関係してきます（[2-04 テクスチャ](#/ch/t04-texture)で扱います）。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'マテリアルは共有し、使い終えたら捨てる',
      text: `
同じ見た目のものが 100 個あるなら、マテリアルは 1 つで足ります。
100 個作ると、そのぶん GPU 側にプログラムと設定が積まれます。
逆に、途中で作って捨てるなら \`material.dispose()\` を忘れないでください。
`,
    },
  ],
  quiz: [
    {
      q: 'ライトを 1 つも置いていないシーンで、色が見える材質はどれですか。',
      choices: [
        'MeshBasicMaterial',
        'MeshStandardMaterial',
        'MeshLambertMaterial',
        'MeshPhongMaterial',
      ],
      answer: 0,
      explain:
        'Basic は光の計算をせず、指定した色をそのまま出します（MeshNormalMaterial も光を必要としません）。他の3つは光がないと真っ黒です。',
    },
    {
      q: '`opacity: 0.5` を指定したのに、まったく透けません。足りないのはどれですか。',
      choices: ['`transparent: true`', '`side: THREE.DoubleSide`', 'ライトの追加', '`depthTest: false`'],
      answer: 0,
      explain:
        'opacity は「transparent が true のときにどれくらい透けるか」の指定です。宣言が無いと不透明のまま扱われます。',
    },
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
        '金属の見た目は反射でできています。環境マップ（`scene.environment`）や明るい背景を用意すると、初めて金属らしくなります。',
    },
  ],
};
