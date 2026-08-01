/**
 * 逆引き。「起きている症状」から、確かめる順に並べた手順と、詳しい章へ。
 *
 * 用語集は言葉から、前提知識マップは章から引くものだが、
 * 実際に詰まったときに知りたいのは「この症状は何が原因か」で、そこへの入口が無かった。
 *
 * 載せるのは、このサイトの中に答えがあるものだけにする。
 * checks は**上から順に確かめる**並びで書く（安く確かめられるものを先に）。
 */

export interface SymptomCheck {
  /** 確かめること。md と同じ軽量マークアップが使える。 */
  text: string;
  /** 詳しく説明している章の slug。 */
  chapter?: string;
}

export interface Symptom {
  id: string;
  /** 症状。読者が口に出しそうな言い方にする。 */
  title: string;
  /** 検索で引っかけたい別の言い方。 */
  aliases?: string[];
  checks: SymptomCheck[];
}

export const symptoms: Symptom[] = [
  {
    id: 'black-screen',
    title: '画面が真っ黒で、何も映らない',
    aliases: ['何も表示されない', '真っ暗', '出ない'],
    checks: [
      { text: '`scene.add(mesh)` を呼んでいますか。作っただけの Mesh は存在しないのと同じです。', chapter: 't01-first-scene' },
      { text: 'ライトはありますか。`MeshStandardMaterial` や `MeshPhongMaterial` は、光がないと真っ黒です。', chapter: 't03-material' },
      { text: 'カメラは原点の**手前**にいますか。Three.js は z のプラスが手前です。', chapter: '01-space' },
      { text: '物体がカメラの `near` より手前、あるいは `far` より奥に出ていませんか。範囲の外は写りません。', chapter: '10-camera' },
      { text: '`renderer.render(scene, camera)` を呼んでいますか。描画ループを回し忘れていませんか。', chapter: 't06-loop-clock' },
      { text: 'canvas を `document.body` に足していますか（`appendChild`）。', chapter: 't01-first-scene' },
    ],
  },
  {
    id: 'metal-black',
    title: '金属やガラスが黒いまま。ライトを足しても直らない',
    aliases: ['メタリックが暗い', 'metalness', '鏡にならない'],
    checks: [
      { text: '`scene.environment` を設定していますか。金属は**まわりを映す**素材なので、映る先が無ければ黒です。ライトをいくら足しても直りません。', chapter: 'q01-environment' },
      { text: '環境マップが、のっぺりしたグラデーションだけになっていませんか。明暗の**境目**が無いと金属に見えません。', chapter: 'q01-environment' },
      { text: 'ガラス（`transmission`）は `MeshPhysicalMaterial` でしか使えません。`MeshStandardMaterial` では効きません。', chapter: 'q01-environment' },
      { text: '`envMapIntensity` が 0 に近くなっていませんか。', chapter: 'q01-environment' },
    ],
  },
  {
    id: 'wrong-color',
    title: 'デザインツールで決めた色と、画面に出る色が違う',
    aliases: ['色が違う', '色がおかしい', '白っぽい', 'くすむ'],
    checks: [
      { text: 'テクスチャに `colorSpace = THREE.SRGBColorSpace` を指定していますか。**色として使う画像には必要**です。', chapter: 't04-texture' },
      { text: '逆に、法線マップや粗さマップに `colorSpace` を指定していませんか。**データとして使う画像には不要**で、指定すると値が歪みます。', chapter: 'q02-color' },
      { text: 'トーンマッピングが入っていませんか。あれは色を意図的に作り変える工程です。色を突き合わせるときはいったん切ってください。', chapter: 'q02-color' },
      { text: '`renderer.outputColorSpace` を自分で書き換えていませんか。既定のままが正しい設定です。', chapter: 'q02-color' },
      { text: '`new THREE.Color(0x4fd6ff).r` が 0.31 でなく 0.077 なのは正常です。`Color` は線形の値を持ちます。', chapter: 'q02-color' },
    ],
  },
  {
    id: 'no-shadow',
    title: '影がまったく出ない',
    aliases: ['シャドウ', '影が出ない', 'castShadow'],
    checks: [
      { text: '`renderer.shadowMap.enabled = true` にしていますか。', chapter: 't05-light-shadow' },
      { text: '影を落とす側に `castShadow = true` を付けていますか。', chapter: 't05-light-shadow' },
      { text: '影を受ける側に `receiveShadow = true` を付けていますか。', chapter: 't05-light-shadow' },
      { text: 'ライトに `castShadow = true` を付けていますか。しかも影を作れるのは**向きを持つライト**だけです（`AmbientLight` や `HemisphereLight` では作れません）。', chapter: 't05-light-shadow' },
      { text: '物体が `shadow.camera` の範囲の外に出ていませんか。`CameraHelper` を足すと範囲が見えます。', chapter: 'p07-city-light' },
    ],
  },
  {
    id: 'ugly-shadow',
    title: '影のふちがギザギザ・ぼやける',
    aliases: ['影が汚い', '影が粗い', 'シャドウアクネ'],
    checks: [
      { text: 'まず `shadow.camera` の範囲を**必要なぶんまで狭めて**ください。ただで効きます。', chapter: 'p07-city-light' },
      { text: 'それでも足りなければ `shadow.mapSize` を上げます（重くなります）。', chapter: 't05-light-shadow' },
      { text: '広い世界なら、影の範囲をカメラに追従させて、見ているあたりだけに絞ってください。', chapter: 'p07-city-light' },
      { text: '`shadow.camera` を書き換えたら `updateProjectionMatrix()` を呼びましたか。', chapter: '10-camera' },
    ],
  },
  {
    id: 'face-missing',
    title: '面の一部が消える。内側から見ると壁が透ける',
    aliases: ['ポリゴンが消える', '裏面', 'カリング', '片面'],
    checks: [
      { text: '頂点を並べた向き（巻き順）が逆になっていませんか。反時計回りに見える側が表です。', chapter: 't02-geometry' },
      { text: '両面を見せたいなら `side: THREE.DoubleSide` を付けます。ただし描く量が増えます。', chapter: 't02-geometry' },
      { text: '法線が裏を向いていませんか。外積の順番を入れ替えると裏返ります。', chapter: '04-cross' },
    ],
  },
  {
    id: 'model-huge',
    title: '読み込んだモデルが巨大・極小・横倒し',
    aliases: ['glTF', 'モデルが出ない', 'サイズが合わない', 'スケール'],
    checks: [
      { text: '`Box3.setFromObject()` で測って、望む大きさとの比を `scale` に入れてください。単位は作った人しだいです。', chapter: 't09-loader' },
      { text: '巨大すぎてカメラの `far` の外に出ている、ということもあります。', chapter: '10-camera' },
      { text: '横倒しなら、Z-up で作られたものです。親の `Group` をかぶせて x 軸まわりに −90 度回してください。', chapter: 't09-loader' },
      { text: '読み込みは非同期です。`load` のコールバックの外で使おうとしていませんか。', chapter: 't09-loader' },
    ],
  },
  {
    id: 'texture-seam',
    title: 'テクスチャに継ぎ目が出る・極が渦を巻く',
    aliases: ['シーム', 'UV', '球のテクスチャ', '継ぎ目'],
    checks: [
      { text: '球なら、ノイズを **UV ではなく方向ベクトルで**引いてください。継ぎ目も極の歪みも原理的に消えます。', chapter: 'x08-sphere-seam' },
      { text: '`repeat` を 1 より大きくしたなら、`wrapS` と `wrapT` も設定が要ります。**この 2 つは組です。**', chapter: 't04-texture' },
      { text: '模様が細かすぎてちらつくなら、それはエイリアシングです。測る点より細かい模様は正しく測れません。', chapter: 't14-fragment-shader' },
    ],
  },
  {
    id: 'gimbal',
    title: '回転させると、途中で軸が 1 つ効かなくなる',
    aliases: ['ジンバルロック', 'オイラー角', '回転がおかしい'],
    checks: [
      { text: 'ジンバルロックです。ピッチが ±90 度になると、ヨーとロールが同じ回り方になります。', chapter: '07-rotation' },
      { text: '姿勢の補間には `Quaternion.slerp` を使ってください。最短の回り方で、しかも等速になります。', chapter: '07-rotation' },
      { text: '向きだけ合わせてひねりを残したいなら `setFromUnitVectors` が向いています。', chapter: '07-rotation' },
    ],
  },
  {
    id: 'tilted-axis',
    title: '傾けてから回すと、回転軸まで一緒に寝てしまう',
    aliases: ['軸が傾く', '自転', '傾き'],
    checks: [
      { text: '**傾き用の `Group` を 1 枚かぶせて**、傾きはそちらに持たせ、中の物体は自分の y 軸で回してください。', chapter: 'p04-planet-orbits' },
      { text: '親の座標系の中では、親のことを忘れて素直に書けます。', chapter: '09-hierarchy' },
    ],
  },
  {
    id: 'lookat-backwards',
    title: '`lookAt` で向けたのに、後ろを向いている',
    aliases: ['向きが逆', 'lookAt', '正面'],
    checks: [
      { text: '`lookAt` はカメラ以外では **+Z** を対象に向けます（カメラだけが −Z）。モデルの正面が +Z でないなら、親の `Group` で補正してください。', chapter: '12-curve' },
      { text: '進行方向を向かせたいなら、`getTangentAt` で向きを取り、いまの点にそれを足した先を見せます。', chapter: '12-curve' },
    ],
  },
  {
    id: 'speed-varies',
    title: '曲線に沿って動かすと、速さが一定にならない',
    aliases: ['カーブ', 'パス', '速度が変わる'],
    checks: [
      { text: '`getPoint` ではなく `getPointAt` を使ってください。後者は**道のり**で測ります。', chapter: '12-curve' },
      { text: '経路の長さが物によって違うなら、速さを `getLength()` で割ってください。', chapter: 'p08-city-motion' },
    ],
  },
  {
    id: 'framerate-dependent',
    title: '端末によって動く速さが違う',
    aliases: ['fps', 'フレームレート', '速すぎる', '120Hz'],
    checks: [
      { text: '`+= 0.02` のように「1 フレームあたり」で書いていませんか。経過時間 `dt` を掛けてください。', chapter: 't06-loop-clock' },
      { text: '`clock.getDelta()` は呼ぶたびに計測がリセットされます。**ループの先頭で 1 回だけ**呼んでください。', chapter: 't06-loop-clock' },
      { text: '毎フレームの `lerp(target, 0.1)` も同じ問題を持ちます。係数を `dt` から作り直してください。', chapter: '08-interp' },
    ],
  },
  {
    id: 'resize-distorted',
    title: 'ウィンドウの大きさを変えると、映像が伸びる',
    aliases: ['リサイズ', 'アスペクト', '歪む'],
    checks: [
      { text: '`camera.aspect` を更新し、そのあと `camera.updateProjectionMatrix()` を呼んでください。**この 2 つは組です。**', chapter: '10-camera' },
      { text: '`renderer.setSize()` だけでは、カメラは自分の縦横比を知りません。', chapter: 't01-first-scene' },
    ],
  },
  {
    id: 'click-misses',
    title: 'クリックが効かない・少しずれたところが選ばれる',
    aliases: ['Raycaster', '当たり判定', 'ピッキング', 'マウス'],
    checks: [
      { text: '`getBoundingClientRect()` を使って、**キャンバス自身の**位置と大きさで正規化していますか。画面いっぱいとは限りません。', chapter: 't08-raycaster' },
      { text: '`Group` で組んだものを触るなら、`intersectObjects(targets, true)` で子孫までたどる必要があります。', chapter: 't08-raycaster' },
      { text: '視点を回しただけで選択されてしまうなら、押してから離すまでの距離を測って、数ピクセル以内のときだけクリックとみなしてください。', chapter: 'p04-planet-orbits' },
    ],
  },
  {
    id: 'slow',
    title: '重い・カクつく',
    aliases: ['遅い', 'パフォーマンス', 'fps が出ない', '最適化'],
    checks: [
      { text: 'まず `renderer.info.render.calls`（ドローコール）を見てください。数百を超えていたら、そこが原因です。', chapter: 't11-performance' },
      { text: '同じものを大量に置いているなら `InstancedMesh`、動かないものなら `mergeGeometries` でまとめます。', chapter: 'p06-city-buildings' },
      { text: 'まとめすぎると視錐台カリングが効かなくなります。**ほどよく分けて**両方を取ってください。', chapter: 'p08-city-motion' },
      { text: '画素の数がいちばん効きます。`setPixelRatio` の上限を下げてみてください。', chapter: 'q05-ship-it' },
      { text: '球やトーラスの分割数を下げるのは、そのあとで構いません。', chapter: 't02-geometry' },
    ],
  },
  {
    id: 'aliased-after-compose',
    title: 'ポストプロセスを入れたら、輪郭がギザギザになった',
    aliases: ['アンチエイリアス', 'ジャギー', 'composer'],
    checks: [
      { text: '`antialias: true` は**画面に直接描くときだけ**効きます。composer が描く先はレンダーターゲットなので通りません。', chapter: 'q03-postprocess' },
      { text: 'レンダーターゲットに `samples: 4` を指定して MSAA を効かせてください。', chapter: 'q03-postprocess' },
      { text: '使えない環境向けには `SMAAPass` を後ろのほうに挟むという手もあります。', chapter: 'q03-postprocess' },
    ],
  },
  {
    id: 'washed-after-compose',
    title: 'ポストプロセスを入れたら、色が白っぽく浅くなった',
    aliases: ['色が変わった', 'OutputPass', 'composer'],
    checks: [
      { text: '`OutputPass` を最後に足していますか。**composer を使ったら最後に OutputPass**、が組です。', chapter: 'q03-postprocess' },
      { text: '素で描いていたときは、レンダラが最後にトーンマッピングと sRGB への変換をしていました。composer を挟むとそれが飛びます。', chapter: 'q03-postprocess' },
    ],
  },
  {
    id: 'bloom-wrong',
    title: 'ブルームが効かない、または画面全体が滲む',
    aliases: ['光らせたい', '発光', 'UnrealBloomPass', 'グロー'],
    checks: [
      { text: '光らせたいものの明るさが 1 を超えていますか。`emissiveIntensity` を上げてください。', chapter: 'q03-postprocess' },
      { text: 'レンダーターゲットを `HalfFloatType` にしていますか。8 ビットだと 1 で頭打ちになり、「特別に明るいもの」の区別が消えます。', chapter: 'q03-postprocess' },
      { text: '全体が滲むならしきい値が低すぎます。上げてください。', chapter: 'q03-postprocess' },
    ],
  },
  {
    id: 'context-lost',
    title: '章やページを行き来していると、黒くなる・メモリが増え続ける',
    aliases: ['WebGL コンテキスト', 'メモリリーク', 'dispose', 'context lost'],
    checks: [
      { text: 'ブラウザが同時に持てる WebGL コンテキストは 8〜16 程度です。使い終わったら `renderer.dispose()` を呼んでください。', chapter: 't10-scene-graph' },
      { text: '`scene.remove()` はつながりを外すだけです。`geometry.dispose()` `material.dispose()` テクスチャの `dispose()` は別に要ります。', chapter: 't10-scene-graph' },
      { text: 'ただし**共有しているものは捨てないでください**。残ったほうが壊れます。', chapter: 't10-scene-graph' },
      { text: 'イベントリスナと `requestAnimationFrame` も止めてください。', chapter: 't06-loop-clock' },
    ],
  },
  {
    id: 'z-fighting',
    title: '2 つの面が重なってちらつく',
    aliases: ['Zファイティング', 'ちらつく', 'z-fighting', '深度'],
    checks: [
      { text: 'カメラの `near` が小さすぎませんか。深度の精度は near のすぐ手前に集中して配られます。**near を大きくする**のが正解で、far を減らすことではありません。', chapter: '10-camera' },
      { text: '面どうしをわずかに離してください。大気のシェルを惑星より少し大きくするのと同じ理屈です。', chapter: 'p03-planet-atmosphere' },
    ],
  },
  {
    id: 'flat-shading',
    title: '丸いはずのものがカクカクに見える／逆になめらかすぎる',
    aliases: ['flatShading', '法線', 'なめらか'],
    checks: [
      { text: '頂点を動かしたあと `computeVertexNormals()` を呼びましたか。法線は位置に自動で付いてきません。', chapter: '11-normal-light' },
      { text: '見た目のなめらかさを決めているのは、頂点の数ではなく**法線の配り方**です。`flatShading` を切り替えて確かめてください。', chapter: '11-normal-light' },
      { text: '頂点シェーダで頂点を動かしたら、**法線も同じだけ動かして**ください。', chapter: 't13-vertex-shader' },
    ],
  },
  {
    id: 'shader-error',
    title: 'シェーダを書いたら、何も描かれない',
    aliases: ['GLSL', 'コンパイルエラー', 'ShaderMaterial'],
    checks: [
      { text: '数値に小数点は付いていますか。GLSL では `20` と `20.0` は別の型で、暗黙の変換をしてくれません。', chapter: 't12-shader-intro' },
      { text: '`varying` の名前と型が、頂点側とフラグメント側で一致していますか。', chapter: 't12-shader-intro' },
      { text: '`attribute` の `itemSize` は、GLSL 側の型と合っていますか（`float` なら 1、`vec3` なら 3）。', chapter: 't12-shader-intro' },
      { text: '自作のパスなら、uniform の名前は `tDiffuse` になっていますか。決め打ちです。', chapter: 'q04-custom-pass' },
    ],
  },
  {
    id: 'camera-inside',
    title: '視点を動かすと、床の下や物体の中に入ってしまう',
    aliases: ['OrbitControls', 'めり込む', '床下'],
    checks: [
      { text: '`controls.maxPolarAngle` を π/2 より少し手前で止めてください。', chapter: 't07-controls' },
      { text: '`controls.minDistance` で寄りすぎを防いでください。', chapter: 'p01-planet-setup' },
      { text: '**壊れた見え方は、直すのではなく到達できなくする**のがいちばん確実です。', chapter: 't07-controls' },
    ],
  },
  {
    id: 'controls-dead',
    title: 'OrbitControls の慣性が効かない',
    aliases: ['damping', '滑らない', 'update'],
    checks: [
      { text: '描画ループの中で `controls.update()` を呼んでいますか。`enableDamping` を使うなら必須です。', chapter: 't07-controls' },
    ],
  },
];

const byId = new Map(symptoms.map((symptom) => [symptom.id, symptom]));

export function symptomById(id: string): Symptom | undefined {
  return byId.get(id);
}
