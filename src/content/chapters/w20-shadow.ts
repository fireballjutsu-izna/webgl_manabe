import type { Chapter } from '../types.ts';

export const chapterW20: Chapter = {
  slug: 'w20-shadow',
  part: 'threejs',
  number: 20,
  title: '影 ― 4 か所そろって、はじめて出る',
  goal: '影が出る仕組みが分かり、出ないときに 4 つの原因を順番に潰せるようになります。',
  requires: ['t05-light-shadow', 'm27-frustum'],
  threeApis: [
    'WebGLRenderer.shadowMap',
    'Object3D.castShadow',
    'Object3D.receiveShadow',
    'Light.shadow',
    'DirectionalLightShadow',
    'CameraHelper',
  ],
  mathRecall: [
    { slug: '10-camera', note: '影は「光の位置に置いたカメラ」で作られる' },
    { slug: 'm27-frustum', note: '写る範囲の外は、影も計算されない' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 影は、ライトを置いただけでは出ない

ここが Three.js でいちばん多い「書いたのに出ない」かもしれません。

影を出すには **4 か所**の設定が要ります。

1. **レンダラで有効にする** … \`renderer.shadowMap.enabled = true\`
2. **ライトに作らせる** … \`light.castShadow = true\`
3. **落とす側** … \`mesh.castShadow = true\`
4. **受ける側** … \`floor.receiveShadow = true\`

**ひとつでも欠けると、影はまったく出ません。**
しかも 4 通りの欠け方が**すべて同じ症状**（影が無い）になります。

だから当てずっぽうでは直りません。**上から順に 4 つとも確かめる**のが最短です。

そしてもう 1 つ、**影を作れるのは向きを持つライトだけ**です
（\`DirectionalLight\` / \`PointLight\` / \`SpotLight\`）。
\`AmbientLight\` に \`castShadow = true\` を書いても、何も起きません。
`,
    },
    {
      kind: 'callout',
      tone: 'analogy',
      title: '4 つのスイッチが直列につながっている',
      text: `
どれか 1 つでも切れていれば、電気はつきません。
そして「どれが切れているか」は、電気がつかないという事実からは分かりません。

影も同じです。
症状が 1 つしか無いのに、原因が 4 つある。

だから「確かめる順番」を持っていることが、そのまま速さになります。
`,
    },
    {
      kind: 'md',
      text: `
## 影の正体は「光から見た写真」

影は難しそうに見えますが、仕組みは単純です。

1. **光の位置にカメラを置いて**、シーンをもう一度描く
2. そのとき記録するのは色ではなく、**光からの距離**だけ。これが{{シャドウマップ}}です
3. 本番の描画で、各点について
   「光から見て、自分より手前に何かあったか」を調べる
4. 何かあったなら、その点は影の中

つまり**シーンを 2 回描いています。** 影が重い理由がこれです。

そして影の品質は、この**「光から見たカメラ」の設定**でほぼ決まります。
[](#/ch/m27-frustum)でやった near / far / 写す範囲が、そのまま効いてきます。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{影の中} \\iff d_{\\text{光からこの点まで}} \\;>\\; d_{\\text{記録された最短距離}}',
      readAloud:
        '光からその点までの距離が、記録されていた「その方向で最も手前にあるものまでの距離」より大きければ、あいだに何かが挟まっている、つまり影の中だ、という意味です。',
      worked: {
        given: '光から見て、箱までの距離 $5.0$ が記録されているとします。その先の床の 2 点を判定します。',
        steps: [
          { calc: '床の点A : 光からの距離 8.0' },
          { calc: '  8.0 > 5.0  → 影の中', note: 'あいだに箱が挟まっている' },
          { calc: '床の点B : 光からの距離 4.9' },
          { calc: '  4.9 > 5.0 は偽 → 影の外', note: '箱より手前にある' },
          { calc: '【箱そのものの表面は】距離 5.0' },
          { calc: '  5.0 > 5.0 は偽 → 影の外', note: 'ぎりぎり正しい' },
        ],
        result:
          '**問題は最後の行です。** 計算の誤差でわずかに $5.0001$ になると、$5.0001 > 5.0$ が成り立ち、**その面が自分自身の影に入ります。** 面がまだらに縞模様になる ― これが**シャドウアクネ**です。**必ず起きます。** シャドウマップは有限の精度しか持たないからです。だから three は \\`shadow.bias\\` で、比べる前にほんの少しずらしています。次の章で扱います。',
      },
    },
    {
      kind: 'sandbox',
      title: '影を出す ― 4 か所',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(5, 4.5, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;                    // (1) レンダラで有効にする
renderer.shadowMap.type = THREE.PCFSoftShadowMap;     // ふちを少し柔らかく
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.8, 0);

// 床（影を受ける側）
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(16, 16),
  new THREE.MeshStandardMaterial({ color: 0x8b93a8, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;                           // (4) 受ける
scene.add(floor);

// 落とす側を 3 つ。高さが違うと影の付き方の違いが分かる
const shapes = [
  [new THREE.BoxGeometry(1.1, 1.1, 1.1), -2.2, 0.55],
  [new THREE.TorusKnotGeometry(0.5, 0.17, 80, 14), 0, 1.4],
  [new THREE.ConeGeometry(0.7, 1.5, 24), 2.2, 0.75],
];

for (const [geometry, x, y] of shapes) {
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.5 }),
  );
  mesh.position.set(x, y, 0);
  mesh.castShadow = true;                             // (3) 落とす
  mesh.receiveShadow = true;                          // 互いの影も受ける
  scene.add(mesh);
}

// 向きを持つライトだけが影を作れる
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(4, 6, 3);
sun.castShadow = true;                                // (2) このライトが影を作る

// 影を描く範囲。物がある場所ぴったりまで狭めるのが肝
sun.shadow.camera.left = -5;
sun.shadow.camera.right = 5;
sun.shadow.camera.top = 5;
sun.shadow.camera.bottom = -5;
scene.add(sun);

// 影の中が真っ黒に潰れないよう、弱い環境光を足す
scene.add(new THREE.HemisphereLight(0x99bbff, 0x101020, 0.6));

// 影の範囲を目で見る（不要なら消してください）
scene.add(new THREE.CameraHelper(sun.shadow.camera));

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
        '**(1)〜(4) のどれか 1 つをコメントアウトすると、影が消えます。** 4 通りとも同じ症状です。`sun.shadow.camera` の値を ±2 に狭めると、白い枠（`CameraHelper`）が縮み、**枠の外に出た影がばっさり切れます。**',
    },
    {
      kind: 'md',
      text: `
## 影が出ないときの確認順

[](#/ch/w04-blank-screen)と同じで、**順番があれば必ず終わります。**

1. **\`renderer.shadowMap.enabled\` は \`true\` か**
2. **そのライトは影を作れる種類か。** \`castShadow = true\` か
3. **落とす側に \`castShadow = true\` があるか**
4. **受ける側に \`receiveShadow = true\` があるか**
5. **\`shadow.camera\` の範囲に、物体が入っているか**
6. **床が \`MeshBasicMaterial\` になっていないか**（光を見ないので影も出ません）

**5 番目は見落としやすい**ので、\`CameraHelper\` を足して枠を目で見てください。
これは[](#/ch/w04-blank-screen)の \`AxesHelper\` と同じ役割の道具です。
`,
    },
    {
      kind: 'code',
      title: '影の範囲を、目で見る',
      code: `import * as THREE from 'three';

// 影を描くのに使われているカメラを、そのまま可視化する
const helper = new THREE.CameraHelper(sun.shadow.camera);
scene.add(helper);

// 範囲を変えたら、カメラの行列も作り直す
sun.shadow.camera.left = -8;
sun.shadow.camera.right = 8;
sun.shadow.camera.top = 8;
sun.shadow.camera.bottom = -8;
sun.shadow.camera.updateProjectionMatrix();   // ← これを忘れると反映されない
helper.update();

// PointLight と SpotLight の場合は透視投影なので、範囲の指定が違う
spot.shadow.camera.near = 0.5;
spot.shadow.camera.far = 30;
spot.shadow.camera.fov = 50;                  // SpotLight は angle から自動で決まる
spot.shadow.camera.updateProjectionMatrix();`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'shadow.camera を変えたら updateProjectionMatrix',
      text: `
[](#/ch/w03-resize) で出てきたのと同じ話です。

left / right / top / bottom / near / far は「材料」で、
描画に使われるのは、そこから組み立てられた行列のほうです。

値を書き換えただけでは効きません。
shadow.camera.updateProjectionMatrix() を呼んでください。

最初に一度だけ設定するなら不要です（three が初回に作るため）。
あとから変えるときだけ必要になります。
`,
    },
    {
      kind: 'md',
      text: `
## PointLight の影は、6 倍高い

\`PointLight\` は全方向に光を出します。
つまり影を作るには、**上下前後左右の 6 方向すべて**を記録する必要があります。

$1024 \\times 1024$ のシャドウマップなら、実質 $6$ 枚 ― $600$ 万画素以上です。
しかも**シーンを 6 回描き直します。**

- \`DirectionalLight\` … シーンを $1$ 回
- \`SpotLight\` … シーンを $1$ 回（円錐の中だけでよい）
- \`PointLight\` … シーンを **$6$ 回**

だから**影が要るなら、まず \`SpotLight\` で代用できないか**を考えてください。
天井のランプなら、真下だけ照らせば十分なことがほとんどです。
`,
    },
    {
      kind: 'md',
      text: `
## 影を使わない、という選択

影は重い処理です。**本当に必要かは、一度立ち止まって考える価値があります。**

- **丸影** … 床に半透明の黒い円を置くだけ。接地感はこれで十分なことが多い
- **焼き込み** … 動かないものの影は、あらかじめテクスチャに描いておける
  （[](#/ch/w15-uv)で触れた \`aoMap\` がこれです）
- **\`HemisphereLight\`** … 上下で色を変えるだけでも、接地感はかなり出る

モバイル向けでは、影を切ってしまうことも珍しくありません。
**「影があること」より「速いこと」のほうが、体験としては効く**場面が多いからです。
`,
    },
    {
      kind: 'code',
      title: '丸影 ― いちばん安い接地感',
      code: `import * as THREE from 'three';

// 中心が濃く、外へいくほど薄い円を canvas で作る
function blobShadowTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

const blob = new THREE.Mesh(
  new THREE.PlaneGeometry(1.8, 1.8),
  new THREE.MeshBasicMaterial({
    map: blobShadowTexture(),
    transparent: true,
    depthWrite: false,     // 透明なので、奥行きは書かない
  }),
);
blob.rotation.x = -Math.PI / 2;
blob.position.y = 0.01;    // 床とのちらつきを避けるため、わずかに浮かせる

character.add(blob);       // 子にすれば、勝手に付いてくる

// 高さで濃さと大きさを変えると、それらしくなる
blob.material.opacity = THREE.MathUtils.clamp(1 - character.position.y / 4, 0, 1);`,
    },
  ],
  exercises: [
    {
      prompt: `サンドボックスから \`renderer.shadowMap.enabled\` / \`sun.castShadow\` /
\`mesh.castShadow\` / \`floor.receiveShadow\` を**1 つずつ**消して、そのたびに確かめてください
（消したら戻してから次へ）。**何が分かりますか。**`,
      hint: '4 通りの結果を並べてみてください。',
      answer: `**どれ 1 つ欠けても、影はまったく出ません。4 通りとも同じ症状です。**

これがこの章のいちばん大事な点です。

**症状が 1 つしか無いのに、原因が 4 つある。**

だから「影が出ない」という事実からは、どこが悪いのか**まったく分かりません。**
当てずっぽうで直そうとすると、動いていた部分まで壊します。

**必要なのは順番です。**

1. \`renderer.shadowMap.enabled\`
2. ライトの \`castShadow\`（そもそも影を作れる種類か）
3. 落とす側の \`castShadow\`
4. 受ける側の \`receiveShadow\`
5. \`shadow.camera\` の範囲に入っているか
6. 受ける側が \`MeshBasicMaterial\` になっていないか

**微妙に違う結果になるものが 1 つだけあります。**

\`floor.receiveShadow\` を消したときだけ、**物体どうしの影は残ります**
（サンドボックスでは 3 つとも \`receiveShadow = true\` にしてあるので）。
床に影が出ないだけです。

**この違いは切り分けに使えます。** 「床にだけ影が出ない」なら、
原因は 4 番目に絞られます。**1〜3 番なら、どこにも影が出ません。**`,
    },
    {
      prompt: `\`sun.shadow.camera\` の範囲を、すべて **±2** に狭めてください。
何が起きますか。\`CameraHelper\` の白い枠と見比べて説明してください。`,
      hint: '影の計算は、その枠の中だけで行われます。',
      answer: `**白い枠の外に出た影が、ばっさり切れます。**

サンドボックスの物体は $x = -2.2$ から $2.2$ に並んでいるので、
**±2 にすると両端の 2 つが枠の外に出ます。** その影が消えます。

**なぜ切れるのか**

影は「光の位置に置いたカメラで撮った写真」でした。
その写真に写っていないものは、**影を落としようがありません。**

$\\text{shadow.camera}$ は、まさにそのカメラの写す範囲です。
[](#/ch/m27-frustum)の視錐台がそのまま効いています。

**では広げればいいのか。それも違います。**

シャドウマップは**決まった大きさの画像**（既定 $512 \\times 512$）です。
範囲を $2$ 倍に広げれば、同じ画素数をより広い面積に配ることになり、
**1 画素あたりの受け持ちが $4$ 倍**になります。

結果、**影のふちがギザギザ**になります。

**だから「必要な範囲ぴったりまで狭める」のが正解**です。

- 狭すぎる → 影が切れる
- 広すぎる → 影が粗い

**確かめ方は \`CameraHelper\`。** 枠を目で見て、
「影を落としたいものが、ぎりぎり全部入っている」状態に合わせてください。

**動くものがあるなら、その移動範囲まで含める**必要があります。
主人公について回るなら、毎フレーム \`shadow.camera\` の中心を
主人公に合わせる、という手もあります。`,
      answerCode: `// 影の範囲を、主人公に追従させる
const R = 8;   // 主人公のまわり 8 単位ぶんだけ影を出す

function updateShadowArea() {
  const c = sun.shadow.camera;
  c.left = -R; c.right = R; c.top = R; c.bottom = -R;
  c.updateProjectionMatrix();

  // ライトと target を、主人公と一緒に動かす
  sun.target.position.copy(player.position);
  sun.position.copy(player.position).add(new THREE.Vector3(4, 6, 3));
}`,
    },
    {
      prompt: `部屋の天井にランプを付けたい。影も落としたい。
\`PointLight\` と \`SpotLight\`、**どちらを選びますか。** 理由も答えてください。`,
      hint: 'それぞれ、シーンを何回描き直しますか。',
      answer: `**\`SpotLight\` を選びます。影の費用が $6$ 分の 1 で済むからです。**

**\`PointLight\` の影**

全方向に光るので、**上下前後左右の 6 方向すべて**を記録する必要があります。
これは**シーンを 6 回描き直す**ということです。

$1024 \\times 1024$ のシャドウマップなら、実質 $6 \\times 1{,}048{,}576 = 629$ 万画素。

**\`SpotLight\` の影**

円錐の中だけ見ればよいので、**シーンを 1 回**描くだけです。
$1024 \\times 1024 = 105$ 万画素。

**$6$ 分の 1。** しかも描き直しの回数も $6$ 分の 1 です。

**見た目はどう違うか**

天井のランプなら、**光っているのは下向きだけで十分**です。
天井そのものを照らす必要はありません。

\`angle\` を広め（$\\pi/3$ くらい）にして \`penumbra\` を入れれば、
点光源とほとんど区別がつきません。

**\`PointLight\` を選ぶべき場面**

- **本当に全方向へ光る**（裸電球が空中にある、たき火、魔法の球）
- **影が要らない**（そのときは \`PointLight\` のほうが素直で軽い）

**判断の基準** … 「**影が要るか**」と「**本当に全方向か**」の 2 つ。
どちらかが「いいえ」なら \`SpotLight\` です。

**もう 1 つの手** … 影が要るライトを**1 つに絞る。**
部屋に 5 個のランプがあっても、影を落とすのは 1 つだけにして、
残りは影なしにする。見た目の差はほとんど出ません。`,
      answerCode: `import * as THREE from 'three';

// 天井のランプ。SpotLight で下向きに
const lamp = new THREE.SpotLight(0xffeecc, 40);
lamp.position.set(0, 3.2, 0);
lamp.angle = Math.PI / 3;        // 広めにして、点光源っぽく見せる
lamp.penumbra = 0.6;             // ふちをぼかす
lamp.castShadow = true;

lamp.shadow.mapSize.set(1024, 1024);
lamp.shadow.camera.near = 0.5;
lamp.shadow.camera.far = 12;     // 部屋の大きさまで。狭いほど精度が上がる

lamp.target.position.set(0, 0, 0);
scene.add(lamp, lamp.target);

// 同じ部屋の他のランプは、影を落とさない
const sub = new THREE.PointLight(0xffeecc, 12);
sub.position.set(-3, 2.6, 2);
// sub.castShadow はあえて設定しない`,
    },
  ],
  quiz: [
    {
      q: '影が出ません。必要な設定として正しい組み合わせはどれですか。',
      choices: [
        'renderer.shadowMap.enabled / ライトの castShadow / 落とす側の castShadow / 受ける側の receiveShadow',
        'ライトの intensity / マテリアルの色 / カメラの fov',
        'geometry の分割数 / material.side / scene.background',
        'renderer.setSize / camera.aspect / controls.update',
      ],
      answer: 0,
      explain:
        '4 か所すべてが要ります。しかも 4 通りの欠け方がすべて同じ症状になるので、上から順に確かめるしかありません。加えて `shadow.camera` の範囲に物体が入っているかも見てください。',
    },
    {
      q: '影の仕組みとして正しいのはどれですか。',
      choices: [
        '光の位置にカメラを置いてシーンを描き、光からの距離を記録して比べる',
        '物体の下に自動で黒い円を置く',
        '法線が下を向いた面を暗くする',
        'カメラから見て隠れている面を暗くする',
      ],
      answer: 0,
      explain:
        'シャドウマップと呼ばれる仕組みです。記録するのは色ではなく距離だけ。つまりシーンを 2 回描いているので、影は本質的に重い処理です。',
    },
    {
      q: '`PointLight` の影が `SpotLight` より重いのはなぜですか。',
      choices: [
        '全方向を記録するため、シーンを 6 回描き直すから',
        '解像度が固定で高いから',
        '距離で減衰するから',
        'ふちがぼけるから',
      ],
      answer: 0,
      explain:
        '上下前後左右の 6 面ぶんを撮る必要があります。天井のランプのように「下向きだけで十分」なら、`SpotLight` に置き換えると費用が 6 分の 1 になり、見た目もほとんど変わりません。',
    },
  ],
};
