import type { Chapter } from '../types.ts';

export const chapterT06: Chapter = {
  slug: 't06-loop-clock',
  part: 'threejs',
  number: 6,
  title: '動かす ― ループと時間',
  goal: 'フレームレートに左右されない動かし方が身につき、どの端末でも同じ速さで動くアニメーションを書けるようになります。',
  requires: ['t01-first-scene', '08-interp'],
  threeApis: [
    'Clock',
    'Clock.getDelta',
    'Clock.getElapsedTime',
    'MathUtils.lerp',
    'Vector3.lerp',
    'Object3D.rotation',
  ],
  mathRecall: [
    { slug: '05-trig', note: 'sin と cos で往復と円運動を作る' },
    { slug: '08-interp', note: 'lerp とイージング。t は「進み具合」' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 1フレームぶんの時間を使う

いちばんよく見かける書き方が \`mesh.rotation.y += 0.01\` です。

短くて分かりやすいのですが、**端末によって速さが変わります**。
60fps の画面では毎秒 0.6 ラジアン回りますが、144fps の画面では 1.44 ラジアン——
2 倍以上の速さで回ってしまいます。

直し方は簡単で、**「1 フレームぶんの時間」を掛ける**だけです。
`,
    },
    {
      kind: 'formula',
      tex: '\\Delta\\theta = \\omega \\times \\Delta t',
      readAloud:
        '回る量は、毎秒あたりの速さ（ω、オメガ）に、前のフレームからの経過秒数（Δt、デルタ t）を掛けたものになる、という意味です。距離＝速さ×時間と同じ形です。',
    },
    {
      kind: 'md',
      text: `
この Δt を教えてくれるのが \`THREE.Clock\` です。
\`getDelta()\` は「前に呼んでからの秒数」、\`getElapsedTime()\` は「開始からの秒数」を返します。

**\`getDelta()\` は呼ぶたびに計測をリセットします。**
1 フレームに 2 回呼ぶと、2 回目はほぼ 0 になります。
**必ずループの先頭で 1 回だけ呼び、その値を使い回してください。**
`,
    },
    {
      kind: 'sandbox',
      title: 'フレームレートに左右されない動かし方',
      code: `import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 7);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(3, 4, 5);
scene.add(key, new THREE.HemisphereLight(0x99bbff, 0x101020, 0.6));

const geometry = new THREE.BoxGeometry(1, 1, 1);
const bad = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xff7ad9 }));
const good = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x4fd6ff }));
bad.position.set(-1.6, 0.8, 0);
good.position.set(1.6, 0.8, 0);
scene.add(bad, good);

// 上下にゆれる球。sin に「経過時間」を渡すと、時間の進みがそのまま波になる
const bob = new THREE.Mesh(
  new THREE.SphereGeometry(0.45, 32, 20),
  new THREE.MeshStandardMaterial({ color: 0xffd166 }),
);
bob.position.set(0, 0.8, 0);
scene.add(bob);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // getDelta はループの先頭で1回だけ。呼ぶたびに計測がリセットされる
  const dt = clock.getDelta();
  const time = clock.getElapsedTime();

  bad.rotation.y += 0.02;          // フレームレート次第で速さが変わる書き方
  good.rotation.y += 1.2 * dt;     // 毎秒 1.2 ラジアン。どの端末でも同じ速さ

  bob.position.y = 0.8 + Math.sin(time * 2) * 0.5;

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
      caption:
        'ピンクの箱（フレーム依存）と水色の箱（時間ベース）が並んでいます。いまは同じ速さに見えるかもしれませんが、120Hz の画面ではピンクだけが倍速になります。`0.02` を `2.0 * dt` に直すのが正解です。',
    },
    {
      kind: 'callout',
      tone: 'warn',
      title: 'タブを離れて戻ると、一気に飛ぶことがあります',
      text: `
タブが裏に回ると \`requestAnimationFrame\` は止まりますが、時計は進み続けます。
戻ってきた瞬間の \`getDelta()\` が数秒ぶんになり、物体が一気に飛びます。

対策は上限を設けることです。\`const dt = Math.min(clock.getDelta(), 0.05);\` のように
1 フレームぶんを 50ms 程度で頭打ちにしておくと、飛びが起きません。
`,
    },
    {
      kind: 'md',
      text: `
## 時間の使い方は2通り

- **経過時間を使う**（\`getElapsedTime\`）… 位置を**直接決める**。
  \`y = sin(time)\` のように書くので、**何があっても軌道が狂いません**。
  往復・円運動・波など、繰り返す動きに向いています
- **差分を使う**（\`getDelta\`）… 現在の値に**足していく**。
  入力で向きが変わるものや、物理的な動きに向いています。
  誤差が積もる可能性はありますが、柔軟です

**繰り返す動きなら経過時間、積み上げる動きなら差分**、と覚えておくと迷いません。
`,
    },
    {
      kind: 'md',
      text: `
## 追いかける動き ― lerp の落とし穴

カメラを目標へなめらかに寄せるとき、\`camera.position.lerp(target, 0.1)\` という書き方をよく見ます。

「毎フレーム、残り距離の 10% を詰める」という意味で、勝手に減速してくれるので見栄えがします。
ですが**これもフレームレート依存**です。120fps では 60fps の 2 倍の回数呼ばれるので、
2 倍の速さで寄ります。

直すには、割合そのものを時間から計算します。
`,
    },
    {
      kind: 'formula',
      tex: 'k = 1 - r^{\\,\\Delta t}',
      readAloud:
        'r は「1 秒たったときに残っている割合」です。たとえば r = 0.001 なら、1 秒で 99.9% 詰まります。これを Δt 乗することで、1 フレームぶんの正しい割合 k が求まります。',
    },
    {
      kind: 'code',
      title: 'フレームレートに左右されない追従',
      code: `// だめな例：呼ばれる回数で速さが変わる
camera.position.lerp(target, 0.1);

// よい例：1秒あたりの「残る割合」から、そのフレームぶんの割合を出す
const remainPerSecond = 0.001;              // 1秒で 99.9% 詰まる
const k = 1 - Math.pow(remainPerSecond, dt);
camera.position.lerp(target, k);

// 時間を決めて動かすなら、進み具合を自分で数える
let elapsed = 0;
const duration = 1.2;

function animate(dt) {
  elapsed = Math.min(elapsed + dt, duration);
  const t = elapsed / duration;             // 0 → 1
  const eased = t * t * (3 - 2 * t);        // smoothstep
  mesh.position.lerpVectors(start, end, eased);
}`,
    },
    {
      kind: 'md',
      text: `
## 描かなくていいときは描かない

\`requestAnimationFrame\` は、タブが裏に回ると自動で止まります。これは助かります。
ですが**画面に何も動きがないときも描き続けている**のは、単なる電池の無駄です。

動きが止まっているあいだは描画を省く、という作りにできます。
\`OrbitControls\` の \`change\` イベントで描き直す、といった形です。
静的なモデルビューアなどでは、これだけで消費電力が大きく変わります。
`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'renderer.setAnimationLoop も使えます',
      text: `
\`renderer.setAnimationLoop(fn)\` は \`requestAnimationFrame\` とほぼ同じですが、
**VR / AR に対応するときは必須**です（ヘッドセットは別の更新周期で動くため）。
将来 WebXR に進む予定があるなら、最初からこちらで書いておくと移行が楽になります。
停止は \`setAnimationLoop(null)\` です。
`,
    },
  ],
  quiz: [
    {
      q: '`mesh.rotation.y += 0.01` という書き方の問題はどれですか。',
      choices: [
        '画面のリフレッシュレートによって回る速さが変わる',
        '回転が累積して誤差が出る',
        'ジンバルロックが起きる',
        'メモリを消費し続ける',
      ],
      answer: 0,
      explain:
        '1フレームあたりの量を直接足しているので、呼ばれる回数が増えるぶんだけ速くなります。`+= 速さ * dt` と書けば、どの端末でも同じ速さになります。',
    },
    {
      q: '`clock.getDelta()` を1つのフレームの中で2回呼ぶと、どうなりますか。',
      choices: [
        '2回目はほぼ 0 が返る',
        '同じ値が2回返る',
        '2倍の値が返る',
        'エラーになる',
      ],
      answer: 0,
      explain:
        '`getDelta()` は呼ぶたびに計測を測り直します。ループの先頭で1回だけ呼び、その値を使い回してください。',
    },
    {
      q: '上下に往復する動きを作るとき、より安全なのはどちらですか。',
      choices: [
        '`y = Math.sin(clock.getElapsedTime())` のように経過時間から位置を決める',
        '`y += 0.01` を続け、端に着いたら符号を反転する',
        '毎フレーム乱数を足す',
        'setInterval で位置を更新する',
      ],
      answer: 0,
      explain:
        '経過時間から位置を直接決めると、フレームが飛んでも軌道が狂いません。積み上げる方式は誤差がたまり、タブを離れて戻ったときに範囲を飛び出すこともあります。',
    },
  ],
};
