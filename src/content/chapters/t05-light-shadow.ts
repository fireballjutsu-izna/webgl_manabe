import type { Chapter } from '../types.ts';

export const chapterT05: Chapter = {
  slug: 't05-light-shadow',
  part: 'threejs',
  number: 5,
  title: 'ライトと影',
  goal: '5種類のライトを目的で選べるようになり、影が出ないときの原因を順番に潰せるようになります。',
  requires: ['t03-material', '11-normal-light'],
  threeApis: [
    'AmbientLight',
    'HemisphereLight',
    'DirectionalLight',
    'PointLight',
    'SpotLight',
    'WebGLRenderer',
    'Object3D.castShadow',
    'Object3D.receiveShadow',
    'DirectionalLightShadow',
  ],
  mathRecall: [
    { slug: '11-normal-light', note: '明るさ＝法線と光の内積' },
    { slug: '10-camera', note: '影は「光から見たカメラ」で作られる' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 光がないと、何も見えない

[1-11 法線とライティング](#/ch/11-normal-light)でやったとおり、
面の明るさは**法線と光の向きの内積**で決まります。
つまり光を置かない限り、内積の相手がおらず、計算しようがありません。

Three.js のライトは 5 種類あります。違いは結局のところ
**「どこから、どの向きに、どれくらい届くか」**の 3 点だけです。
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
## 5種類の使い分け

- **AmbientLight** … 全体を一律に持ち上げるだけ。**立体感は出ません**。
  影の中が真っ黒に潰れるのを防ぐ「底上げ」として、弱めに使う
- **HemisphereLight** … 上から空の色、下から地面の色。屋外の環境光として自然。
  こちらも影は落ちない
- **DirectionalLight** … 太陽。**位置ではなく向きだけ**が意味を持ちます
  （\`position\` は「どちらから照らすか」を決めるためだけに使われ、距離では暗くなりません）
- **PointLight** … 電球。位置があり、離れるほど暗くなる
- **SpotLight** … 懐中電灯。円錐状に照らし、外側にはまったく当たらない

**基本の組み合わせは「DirectionalLight 1 つ ＋ 弱い HemisphereLight」**です。
これで屋外らしい見た目になります。迷ったらここから始めてください。
`,
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'ライトは置くほど重くなります',
      text: `
ライトを 1 つ増やすと、**すべてのマテリアルのシェーダが作り直され**、
描画のたびに計算が増えます。5 個 10 個と置くと目に見えて重くなります。

暗い場所を明るくしたいときは、ライトを足す前に
**環境光を上げる・マテリアルの色を明るくする・emissive を使う**を検討してください。
`,
    },
    {
      kind: 'md',
      text: `
## 影 ― 3か所すべてを設定する

影はライトを置いただけでは出ません。**3 か所**の設定が必要です。

- **レンダラ**：\`renderer.shadowMap.enabled = true\`
- **落とすもの**：\`mesh.castShadow = true\`
- **受けるもの**：\`floor.receiveShadow = true\`

さらに、**影を作れるのは向きを持つライトだけ**（Directional / Point / Spot）です。
ひとつでも欠けると影は出ません。「影が出ない」の原因は、ほぼこの 4 つのどれかです。
`,
    },
    {
      kind: 'sandbox',
      title: '影を出す',
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(4, 3.5, 5);
camera.lookAt(0, 0.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;                    // (1) レンダラで有効にする
renderer.shadowMap.type = THREE.PCFSoftShadowMap;     // 影のふちを少し柔らかく
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.5, 0);

// 床（影を受ける側）
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 14),
  new THREE.MeshStandardMaterial({ color: 0x8b93a8, roughness: 0.9 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;                           // (2) 受ける
scene.add(floor);

// 箱（影を落とす側）
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 1.2, 1.2),
  new THREE.MeshStandardMaterial({ color: 0x4fd6ff, roughness: 0.5 }),
);
box.position.y = 0.6;
box.castShadow = true;                                // (3) 落とす
scene.add(box);

// 向きを持つライトだけが影を作れる
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(3, 5, 2);
sun.castShadow = true;                                // (4) このライトが影を作る
sun.shadow.mapSize.set(1024, 1024);                   // 影の解像度
// 影を描く範囲。狭いほどきれいだが、はみ出すと影が切れる
sun.shadow.camera.left = -5;
sun.shadow.camera.right = 5;
sun.shadow.camera.top = 5;
sun.shadow.camera.bottom = -5;
scene.add(sun);

// 影の中が真っ黒に潰れないよう、弱い環境光を足す
scene.add(new THREE.HemisphereLight(0x99bbff, 0x101020, 0.5));

// 影の範囲を目で見る（不要なら消してください）
scene.add(new THREE.CameraHelper(sun.shadow.camera));

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  box.position.y = 0.6 + Math.sin(clock.getElapsedTime() * 1.5) * 0.4;
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
        '4行のうちどれか1つをコメントアウトすると、影が消えます。`sun.shadow.camera.left` などを ±1 にすると、範囲からはみ出した影が四角く切り取られる様子が見えます。',
    },
    {
      kind: 'md',
      text: `
## 影の正体は「光から見た写真」

影は難しそうに見えますが、仕組みは単純です。

1. **光の位置にカメラを置いて**、シーンを一度描く
2. そのとき記録するのは色ではなく、**光からの距離**だけ
3. 本番の描画で、各点について「光から見て、自分より手前に何かあったか」を調べる
4. 何かあったなら、その点は影の中

つまり影の品質は、この**「光から見たカメラ」の設定**でほぼ決まります。
[1-10 カメラと投影](#/ch/10-camera)の near / far / 写す範囲が、そのまま効いてきます。
`,
    },
    {
      kind: 'formula',
      tex: '\\text{影の中} \\iff d_{\\text{光からこの点まで}} > d_{\\text{記録された最短距離}}',
      readAloud:
        '光からその点までの距離が、記録されていた「その方向で最も手前にあるものまでの距離」より大きければ、あいだに何かが挟まっている、つまり影の中だ、という意味です。',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: '影の範囲は狭いほどきれい',
      text: `
影の記録は決まった大きさの画像に収められます（既定は 512×512）。
広い範囲を写そうとすると、そのぶん 1 ピクセルあたりが受け持つ面積が広がり、
影のふちがギザギザになります。

**\`shadow.camera\` の範囲は、影が要る場所ぎりぎりまで狭めてください。**
解像度を上げる（\`shadow.mapSize\`）より、まず範囲を狭めるほうがずっと効きます。
`,
    },
    {
      kind: 'md',
      text: `
## 影のよくある不具合

- **影が縞模様になる（シャドウアクネ）** … 自分自身の影が誤って落ちている状態。
  \`light.shadow.bias\` を -0.0005 くらいの小さな負の値にすると消えます
- **影が浮いて見える（ピーターパン現象）** … bias を下げすぎたときに起きます。戻してください
- **影のふちがギザギザ** … 範囲が広すぎます。\`shadow.camera\` を狭めるか、
  \`shadowMap.type\` を \`THREE.PCFSoftShadowMap\` にします
- **影が四角く切れる** … \`shadow.camera\` の範囲から物体がはみ出しています
- **PointLight の影が重い** … 全方向に 6 枚ぶん記録するためです。数を絞ってください
`,
    },
    {
      kind: 'md',
      text: `
## 影を使わないという選択

影は重い処理です。**本当に必要かは一度立ち止まって考える価値があります。**

- 床に半透明の黒い円を置くだけの「丸影」で足りる場面は多い
- 動かないものの影は、あらかじめテクスチャに焼き込める
- 環境光を上下で変える（HemisphereLight）だけでも、接地感はかなり出る

実際、モバイル向けでは影を切ってしまうことも珍しくありません。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: '光の強さの目安',
      text: `
Three.js は物理的に正しい単位で光を扱います。
DirectionalLight なら 2〜4、環境光は 0.3〜1 くらいから始めると、たいてい妥当な明るさになります。
値を大きくして白飛びするようなら、\`renderer.toneMapping = THREE.ACESFilmicToneMapping\` を
試してみてください。明るい部分の階調が保たれます。
`,
    },
  ],
  quiz: [
    {
      q: '影を落とせる**ない**ライトはどれですか。',
      choices: ['AmbientLight', 'DirectionalLight', 'PointLight', 'SpotLight'],
      answer: 0,
      explain:
        'AmbientLight は全体を一律に明るくするだけで、向きも位置も持ちません。影は「光から見て手前に何があるか」で作られるので、向きが無いライトでは作れません。HemisphereLight も同様です。',
    },
    {
      q: '影が出ません。設定すべき3か所として正しい組み合わせはどれですか。',
      choices: [
        'renderer.shadowMap.enabled / 落とす側の castShadow / 受ける側の receiveShadow',
        'ライトの intensity / マテリアルの色 / カメラの fov',
        'geometry の分割数 / material.side / scene.background',
        'renderer.setSize / camera.aspect / controls.update',
      ],
      answer: 0,
      explain:
        'この3つに加えて、そのライト自身の `castShadow` も必要です。「影が出ない」の原因はほぼこの4つのどれかです。',
    },
    {
      q: '影のふちがギザギザになっています。**まず**試すべきことはどれですか。',
      choices: [
        '`shadow.camera` の範囲を、影が要る場所まで狭める',
        'ライトの数を増やす',
        'カメラの far を大きくする',
        'マテリアルを Basic に変える',
      ],
      answer: 0,
      explain:
        '影は決まった大きさの画像に記録されるので、広い範囲を写すほど粗くなります。解像度を上げるより、範囲を狭めるほうが効果も効率も上です。',
    },
  ],
};
