import type { Chapter } from '../types.ts';

export const chapterX36: Chapter = {
  slug: 'x36-curve-orientation',
  part: 'project',
  number: 36,
  title: '曲線に沿った姿勢 ― 接線から、向きを作る',
  goal: '曲線の上を動くものに正しい向きを持たせられるようになり、等速に見せるための $\\mathrm{getPointAt}$ と $\\mathrm{getPoint}$ の違いを説明できるようになります。',
  requires: ['p08-city-motion', 'm38-frame', 'm37-arclength'],
  threeApis: [
    'CatmullRomCurve3',
    'Curve.getPointAt',
    'Curve.getTangentAt',
    'Object3D.lookAt',
    'CurvePath',
  ],
  mathRecall: [
    { slug: 'm38-frame', note: '進む向きだけでは、姿勢は決まらない' },
    { slug: 'm37-arclength', note: '曲線の上を、等速で進む' },
    { slug: 'm15-lookat', note: '向きを $1$ 行で決める' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 位置だけでは、横向きに滑る

経路ができたので、車をその上に置きます。

\`curve.getPointAt(u)\` で位置が出ます。それを \`car.position\` に入れれば、
車は経路の上を進みます。

**それだけだと、車は横を向いたまま滑っていきます。**

位置は決まっても、**向き**は誰も決めていないからです。
`,
    },
    {
      kind: 'md',
      text: `
## 向きは、接線から

進んでいる方向は、曲線の**接線**です。
\`curve.getTangentAt(u)\` が、その向き（長さ $1$）を返します。

あとは[](#/ch/m15-lookat)の \`lookAt\` に、
**いまの位置 ＋ 接線**を見させれば、車は進む方向を向きます。
`,
    },
    {
      kind: 'formula',
      tex: '\\mathbf{p} = C(u),\\quad \\mathbf{t} = C\'(u),\\quad \\text{向き} = \\mathrm{lookAt}(\\mathbf{p} + \\mathbf{t})',
      readAloud:
        '位置は曲線の $u$ 番目の点、接線はその微分です。姿勢は「いまの位置に接線を足した点」を見ることで決まります。接線は長さ $1$ に正規化されているので、$1$ だけ先を見ていることになります。',
      worked: {
        given:
          '半径 $10$ の円を経路として、$u = 0$ と $u = 0.25$ での位置・接線・見る先を出します（円は $(10\\cos\\phi,\\, 0,\\, 10\\sin\\phi)$、$\\phi = 2\\pi u$）。',
        steps: [
          { calc: 'u = 0    : φ = 0' },
          { calc: '  位置 p = (10, 0, 0)' },
          { calc: '  接線 t = (0, 0, 1)', note: '進む向きは +z' },
          { calc: '  見る先 = (10, 0, 1)' },
          { calc: 'u = 0.25 : φ = π/2' },
          { calc: '  位置 p = (0, 0, 10)' },
          { calc: '  接線 t = (-1, 0, 0)' },
          { calc: '  見る先 = (-1, 0, 10)' },
        ],
        result:
          '**接線は、常に位置と直交しています**（円の場合）。$u$ が進むにつれて $\\mathbf{t}$ も回るので、車は自然に曲がります。見る先を $\\mathbf{p} + \\mathbf{t}$ ではなく**次のフレームの位置**にしてもほぼ同じ結果になりますが、そちらは速度に依存します ― 止まった瞬間に向きが決まらなくなるので、**接線を使うほうが安全**です。',
      },
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'getPoint と getPointAt は別物です',
      text: `
名前が似ていますが、**引数の意味がまったく違います。**

- \`getPoint(t)\` … 曲線の**媒介変数**で $0$〜$1$。制御点の間隔がばらばらだと、**速さが変わります**
- \`getPointAt(u)\` … **弧長**で $0$〜$1$。曲線の上を**等速で進みます**

[](#/ch/m37-arclength)でやった話です。

$4$ 隅を繋いだ矩形の経路では、辺の長さが違うので、
\`getPoint\` を使うと**短い辺で速く、長い辺で遅く**なります。

見た目にはっきり出るので、**動かすものには \`getPointAt\` と \`getTangentAt\`** を使ってください。
名前の \`At\` が「弧長で」を意味している、と覚えると間違えません。
`,
    },
    {
      kind: 'sandbox',
      title: '1台だけ、街区のまわりを走らせる',
      guide: { focus: ['街区の外周をなぞる閉じた経路', '走らせる'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ba6cc);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 300);
camera.position.set(-14, 12, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);
controls.maxPolarAngle = Math.PI * 0.495;

const sun = new THREE.DirectionalLight(0xfff0d8, 2.6);
sun.position.set(12, 16, 8);
scene.add(sun, new THREE.HemisphereLight(0xbcd4ff, 0x44444e, 0.7));

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshStandardMaterial({ color: 0x3a3d47, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---- 街区を1つ置く ---- */

const lot = { x: -7, z: -5, w: 14, d: 10 };

const block = new THREE.Mesh(
  new THREE.BoxGeometry(lot.w, 5, lot.d),
  new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.85 }),
);
block.position.set(lot.x + lot.w / 2, 2.5, lot.z + lot.d / 2);
scene.add(block);

/* ---- 街区の外周をなぞる閉じた経路 ---- */
// 角だけだと Catmull-Rom が丸く膨らむので、辺の中点も入れて直線を保つ

function lotLoop(lot, offset, y) {
  const x0 = lot.x - offset;
  const x1 = lot.x + lot.w + offset;
  const z0 = lot.z - offset;
  const z1 = lot.z + lot.d + offset;
  const mx = (x0 + x1) / 2;
  const mz = (z0 + z1) / 2;

  const points = [
    new THREE.Vector3(x0, y, z0), new THREE.Vector3(mx, y, z0),
    new THREE.Vector3(x1, y, z0), new THREE.Vector3(x1, y, mz),
    new THREE.Vector3(x1, y, z1), new THREE.Vector3(mx, y, z1),
    new THREE.Vector3(x0, y, z1), new THREE.Vector3(x0, y, mz),
  ];
  // true = 閉じた曲線。tension を下げると角が四角く、上げると丸くなる
  return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.25);
}

const route = lotLoop(lot, 1.6, 0.05);

// 経路を線で見せる（確認用）
scene.add(new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(route.getSpacedPoints(160)),
  new THREE.LineBasicMaterial({ color: 0xffd166 }),
));

/* ---- 車。長い辺を Z 軸方向にしておく ---- */

const car = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.BoxGeometry(1.1, 0.5, 2.4),   // 幅・高さ・長さ（Z が長い）
  new THREE.MeshStandardMaterial({ color: 0xff6b8a, roughness: 0.5 }),
);
body.position.y = 0.35;
car.add(body);

const roof = new THREE.Mesh(
  new THREE.BoxGeometry(0.95, 0.4, 1.2),
  new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.4 }),
);
roof.position.set(0, 0.78, -0.15);
car.add(roof);

// 前がどちらか分かるように、鼻先に印を付ける
const nose = new THREE.Mesh(
  new THREE.BoxGeometry(0.7, 0.16, 0.16),
  new THREE.MeshBasicMaterial({ color: 0xffffff }),
);
nose.position.set(0, 0.45, 1.25);
car.add(nose);

scene.add(car);

/* ---- 走らせる ---- */

const lookTarget = new THREE.Vector3();
const clock = new THREE.Clock();
let u = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // 道のりで進めるので、速さが一定になる
  u = (u + dt * 0.06) % 1;

  const position = route.getPointAt(u);
  const tangent = route.getTangentAt(u);

  car.position.copy(position);
  // 進行方向の少し先を見る。Object3D は +Z が対象を向く
  lookTarget.copy(position).add(tangent);
  car.lookAt(lookTarget);

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
        '白い印が付いているのが車の前です。角でもきちんと前を向いて曲がります。`car.lookAt(lookTarget)` の行を消すと、車が横向きのまま滑っていくのが見えます。`getPointAt` を `getPoint` に変えると、角のあたりで速さが不自然に変わります。`tension` の 0.25 を 0.02 にすると角がほぼ直角になり、0.8 にすると円に近づきます。',
    },
    {
      kind: 'md',
      text: `
## 傾きまでは、決まらない

\`lookAt\` は「その方向を向く」だけです。
**その軸のまわりの回転（ロール）は、決まっていません。**

three の \`lookAt\` は内部で「上は $+y$」と仮定して埋めるので、
平らな道を走る車なら、これで正しく立ちます。

**上下する経路では破綻します。**

- 急な坂やループを通ると、車が突然回転する
- 真上を向く瞬間に、向きが定まらない（[](#/ch/m11-gimbal)と同じ形の問題）

[](#/ch/m38-frame)でやったとおり、そこまで要るなら
**フレネ枠**や、前フレームの姿勢から少しずつ回す方法を使います。

この街の道は**完全に平ら**なので、\`lookAt\` で足ります ―
**足りるかどうかを、経路の形から判断してください。**
`,
    },
  ],
  exercises: [
    {
      prompt: `\`getPointAt\` を \`getPoint\` に変えると、$14 \\times 11$ の街区を回る車の速さはどう変わりますか。`,
      hint: '媒介変数は、制御点の区間ごとに均等に配られます。',
      answer: `**長い辺でゆっくり、短い辺で速くなります。**

**なぜか**

\`getPoint(t)\` の $t$ は、制御点の区間に**均等**に配られます。

$4$ つの制御点があるなら、

- $t = 0$〜$0.25$ … $1$ 本目の辺
- $0.25$〜$0.5$ … $2$ 本目の辺

$t$ を一定の速さで進めると、**どの辺も同じ時間で通過します。**

長い辺（$19$）と短い辺（$16$）を同じ時間で通るので、
**長い辺のほうが速く**なります。

**待ってください、逆では**

いいえ、速さは「距離 ÷ 時間」です。同じ時間で長い距離を進むので**速い**。

体感としては、**角に近づくとゆっくりになり、辺の途中で加速する**ように見えます。

**$14 \\times 11$ の街区での差**

膨らませた矩形の辺は $19$ と $16$ なので、比は $1.19$。

**$20\\%$ の速さの差**は、隣を走る車と見比べれば気づきます。

**\`getPointAt\` が何をしているか**

曲線を細かく刻んで長さの表を作り、
「弧長 $u$ の位置は、媒介変数でいくつか」を**逆引き**しています。

だから最初の呼び出しで表を作るぶん、少しだけ重い ―
それでも毎フレーム $44$ 回なら、まったく問題になりません。`,
    },
    {
      prompt: `\`car.lookAt(lookTarget)\` の行を消すと、車はどう見えますか。

そして、なぜ「見る先」を位置＋接線にするのでしょう。`,
      hint: '向きを誰も決めていないと、初期の向きのままです。',
      answer: `**車が横を向いたまま、経路の上を滑っていきます。**

**何が起きるか**

\`position\` は毎フレーム更新されるので、**動いてはいます。**

でも \`rotation\` は初期値のままなので、車の鼻先は
ずっと同じ世界の方向（たいてい $-z$）を指しています。

**カーブでも向きが変わらない**ので、横滑りしているように見えます。

**なぜ位置＋接線なのか**

\`lookAt\` は「その点を見る」ので、**見る先が要ります。**

接線は向きしか持っていないので、そのまま渡すと
**原点から見た方向**として解釈されてしまいます。

いまの位置に足すことで、「自分の $1$ 歩先」という点になります。

**次フレームの位置ではだめなのか**

だいたい同じ結果になりますが、$2$ つ弱点があります。

- **止まると向きが決まらない。** 速度が $0$ なら、次の位置は同じ点です
- **フレームレートに依存する。** $120$ fps では $1$ 歩が半分になります

接線は**速度と無関係**に曲線の形だけから決まるので、
どちらの問題も起きません。`,
    },
    {
      prompt: `道が上下する街（坂のある街）にしたとき、\`lookAt\` だけでは何が困りますか。`,
      hint: '\`lookAt\` は「上」をどう決めていますか。',
      answer: `**坂の途中で車がねじれ、真上を向く瞬間に向きが飛びます。**

**three の \`lookAt\` がしていること**

向きは「見る方向」だけでは決まりません。
**その軸のまわりの回転（ロール）**が残ります。

three はそれを「上は世界の $+y$」と仮定して埋めます。

**平らな道なら正しい**

進む向きが常に水平なので、$+y$ を上とすれば車はまっすぐ立ちます。

**坂だと**

進む向きが上を向くと、「世界の $+y$」と接線の関係が変わり、
**車が横に傾いたり、坂の頂点でぐるっと回ったり**します。

真上（接線が $+y$ と平行）になると、**上の向きが決まりません** ―
[](#/ch/m11-gimbal)のジンバルロックと同じ構造です。

**そこまで要るなら**

- **フレネ枠**（接線・法線・従法線）を曲線から作る（[](#/ch/m38-frame)）
- **前フレームの姿勢から、少しずつ回す**（連続性が保証される）

$2$ つめは実装が短く、ジェットコースターのような経路でも破綻しません。

**この街は平らなので、$1$ 行で足ります。**
足りるかどうかは、経路の形が決めます。`,
    },
  ],
  quiz: [
    {
      q: '曲線の上を動くものに向きを持たせるには、何を使いますか。',
      choices: [
        '接線（getTangentAt）を取り、いまの位置に足した点を lookAt で見る',
        '次のフレームの位置を lookAt で見る',
        'rotation.y を毎フレーム少しずつ増やす',
        '曲線の中心を lookAt で見る',
      ],
      answer: 0,
      explain:
        '接線は曲線の形だけから決まるので、速度にもフレームレートにも依存しません。次フレームの位置を使う方法はだいたい同じ結果になりますが、止まると向きが決まらず、フレームレートで 1 歩の長さが変わります。接線は長さ 1 なので、位置に足せば「1 歩先の点」になります。',
    },
    {
      q: '`getPoint` と `getPointAt` の違いはどれですか。',
      choices: [
        'getPoint は媒介変数、getPointAt は弧長。等速で動かしたいなら getPointAt',
        'getPointAt のほうが速い',
        'getPoint は 3D、getPointAt は 2D',
        '同じもの。別名にすぎない',
      ],
      answer: 0,
      explain:
        'getPoint の t は制御点の区間に均等に配られるので、辺の長さが違うと速さが変わります。19 と 16 の辺なら 20% の差になり、隣の車と見比べれば気づきます。getPointAt は曲線を刻んで長さの表を作り、弧長から媒介変数を逆引きするので等速になります。名前の At が「弧長で」を意味すると覚えると間違えません。',
    },
    {
      q: '`lookAt` だけでは足りなくなるのはどんなときですか。',
      choices: [
        '経路が上下するとき。lookAt は「上は +y」と仮定して埋めるので、坂や真上でねじれる',
        '経路が長いとき',
        '動くものが多いとき',
        '曲線が閉じているとき',
      ],
      answer: 0,
      explain:
        '向きは見る方向だけでは決まらず、その軸まわりの回転が残ります。three はそれを「上は世界の +y」で埋めるので、平らな道では正しく立ちますが、坂では傾き、接線が +y と平行になると向きが決まりません ― ジンバルロックと同じ構造です。そこまで要るならフレネ枠か、前フレームの姿勢から少しずつ回す方法を使います。',
    },
  ],
};
