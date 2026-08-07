import type { Chapter } from '../types.ts';

export const chapterY04: Chapter = {
  slug: 'y04-env-intensity',
  part: 'polish',
  number: 4,
  title: '強さを合わせる ― envMapIntensity と、粗さ',
  goal: '環境マップを入れて明るくなりすぎたときに触る場所を順番に判断できるようになり、粗さと金属度が映り込みをどう変えるかを説明できるようになります。',
  requires: ['y03-env-background', 'w11-pbr', 't03-material'],
  threeApis: [
    'MeshStandardMaterial.envMapIntensity',
    'MeshStandardMaterial.roughness',
    'MeshStandardMaterial.metalness',
    'WebGLRenderer.toneMapping',
  ],
  mathRecall: [
    { slug: 'w11-pbr', note: '粗さと金属度。$2$ つのつまみ' },
    { slug: 'x12-additive', note: '$1$ を超えた明るさを、どう畳むか' },
  ],
  blocks: [
    {
      kind: 'md',
      text: `
## 入れた瞬間、明るすぎる

環境マップを入れると、たいてい**明るくなりすぎます。**

理由は単純で、**光源が増えたから**です。
環境マップは「あらゆる方向から来る光」なので、
これまでライト $2$ つで照らしていたシーンに、**全方向ぶんの光が足された**ことになります。

このとき触る場所には、**順番があります。**
`,
    },
    {
      kind: 'md',
      text: `
## 触る順番

- **$1$ 番目 … ライトを弱める。** 環境マップが入ったぶん、
  もともとのライトは強すぎます。半分にしても足りないことがあります
- **$2$ 番目 … \`material.envMapIntensity\`。** マテリアルごとに、
  映り込みの強さを $0$〜$2$ くらいで調整します
- **$3$ 番目 … トーンマッピング。** $1$ を超えた部分を畳みます（次の章）

**$1$ 番目を飛ばすと、$2$ 番目で辻褄を合わせることになります。**
そうすると「環境マップは弱いのに全体は明るい」という、
どこを触っても直らない状態になります。

環境マップを入れたら、**まずライトを疑ってください。**
`,
    },
    {
      kind: 'formula',
      tex: 'L \\;=\\; L_{\\text{light}} + I_{\\text{env}}\\,L_{\\text{env}}',
      readAloud:
        '面に届く光は、ライトからの寄与と、環境マップからの寄与に $\\mathrm{envMapIntensity}$ を掛けたものの和です。$I_{\\text{env}}$ はマテリアルごとの倍率で、既定は $1$ です。',
      worked: {
        given:
          '$L_{\\text{light}} = 0.8$、$L_{\\text{env}} = 0.6$ の面で、環境マップを入れる前後を比べます。',
        steps: [
          { calc: '入れる前 : 0.8', note: 'ライトだけ' },
          { calc: '入れた直後 : 0.8 + 1.0 x 0.6 = 1.4' },
          { calc: '  75% 明るくなった' },
          { calc: 'ライトを半分に : 0.4 + 0.6 = 1.0' },
          { calc: 'さらに I を 0.6 に : 0.4 + 0.36 = 0.76' },
          { calc: 'もとの 0.8 とほぼ同じ' },
        ],
        result:
          '**ライトを半分にするだけでは、まだ $1.0$ で明るすぎます。** ライトと環境の $2$ つが足し算で効くので、$1$ つを半分にしても全体は $71\\%$ にしかなりません。**$2$ つとも下げて、ようやくもとの明るさ**に戻ります。逆に言えば、環境マップを入れたあとに「なんとなく明るい」と感じたら、**下げる場所が $2$ か所ある**ということです。片方だけ触って諦めないでください。',
      },
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'envMapIntensity は、マテリアルごとの設定です',
      text: `
\`scene.environment\` は全体に効きますが、
**\`envMapIntensity\` はマテリアルごと**です。

だから「**金属だけ強く、床は弱く**」ができます。

- 金属 … $1.0$〜$1.5$。映り込みが身上なので、強めでよい
- 床・壁 … $0.3$〜$0.6$。$4\\%$ の照りが強すぎると、全部が濡れて見えます
- 布・木 … $0.2$ 以下。ほとんど映り込まない材質です

**現実の材質差を、この $1$ 数で表している**ことになります。

$0$ にすると、その材質だけ環境マップの影響を受けません ―
[](#/ch/q01-environment)の「金属が黒い」状態に、狙って戻せます。
`,
    },
    {
      kind: 'md',
      text: `
## 粗さは、映り込みの「形」を変える

強さと並んで効くのが**粗さ**です。$2$ つは別のことをしています。

- **\`envMapIntensity\`** … 映り込みの**明るさ**
- **\`roughness\`** … 映り込みの**ぼけ具合**

粗さ $0$ の金属は環境をそのまま映すので、**環境マップの解像度がそのまま見えます。**
[](#/ch/y02-pmrem)で $256$ 四方と書いたのは、ここに効きます。

粗さを $0.3$ に上げると、$\\mathrm{PMREM}$ の下の段を引くようになり、
**解像度の粗さは見えなくなります。**

**「映り込みがぼやけている」と「映り込みが弱い」は別のこと**です。
どちらを直したいのかを決めてから、触るつまみを選んでください。
`,
    },
    {
      kind: 'sandbox',
      title: '粗さと金属度の格子で、環境マップの効き方を見る',
      guide: { focus: ['環境マップを作る', '粗さ × 金属度の格子'] },
      code: `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ENV_INTENSITY = 1.0;   // 0.3 や 2.0 も試してください

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14161d);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.5, 13);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* ---- 環境マップを作る ---- */
// 明るい帯を 1 本入れておくと、粗さの違いが「形のぼけ方」として見える

function makeEnvTexture() {
  const source = new THREE.Scene();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(50, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: [
        'varying vec3 vPos;',
        'void main() {',
        '  vPos = position;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}',
      ].join('\\n'),
      fragmentShader: [
        'varying vec3 vPos;',
        'void main() {',
        '  vec3 d = normalize(vPos);',
        '  vec3 color = mix(vec3(0.08, 0.08, 0.09), vec3(0.26, 0.34, 0.5),',
        '                   smoothstep(-0.2, 0.4, d.y));',
        // 横に走る明るい帯。映り込むと「線」として見える
        '  color += vec3(2.2) * smoothstep(0.18, 0.24, d.y) * (1.0 - smoothstep(0.24, 0.32, d.y));',
        '  gl_FragColor = vec4(color, 1.0);',
        '}',
      ].join('\\n'),
    }),
  );
  source.add(sky);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(source, 0.02).texture;
  pmrem.dispose();
  sky.geometry.dispose();
  sky.material.dispose();
  return texture;
}

scene.environment = makeEnvTexture();

// ライトは弱めに。環境マップが入ったぶん、もとのライトは強すぎる
scene.add(new THREE.DirectionalLight(0xffffff, 0.6).translateX(4).translateY(5).translateZ(4));

/* ---- 粗さ × 金属度の格子 ---- */
// 横が粗さ、縦が金属度。同じ環境マップの下で、材質だけが違う

const ROUGHNESS = [0.0, 0.15, 0.35, 0.6, 1.0];
const METALNESS = [1.0, 0.0];

for (let row = 0; row < METALNESS.length; row++) {
  for (let col = 0; col < ROUGHNESS.length; col++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 48, 32),
      new THREE.MeshStandardMaterial({
        color: 0xc8c8cc,
        metalness: METALNESS[row],
        roughness: ROUGHNESS[col],
        envMapIntensity: ENV_INTENSITY,
      }),
    );
    mesh.position.set((col - 2) * 2.1, (0.5 - row) * 2.2, 0);
    scene.add(mesh);
  }
}

// 目盛り
const legend = document.createElement('div');
legend.innerHTML =
  '上の列 : metalness 1（金属）<br>' +
  '下の列 : metalness 0（非金属）<br>' +
  '左から roughness 0 / 0.15 / 0.35 / 0.6 / 1<br>' +
  'envMapIntensity ' + ENV_INTENSITY;
legend.style.cssText =
  'position:absolute; bottom:14px; left:16px; color:#9fb4d8;' +
  'font:12px/1.7 ui-monospace, monospace; pointer-events:none;' +
  'background:rgba(10,12,18,0.78); padding:8px 10px; border-radius:5px;';
document.body.appendChild(legend);

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
        '**上の列（金属）を左から右へ追ってください。** 粗さ $0$ では環境の帯が細い線として映り、$0.35$ ではぼんやりした帯に、$1$ では全体がのっぺりします ― **明るさはあまり変わらず、形だけがぼけていきます。** 下の列（非金属）は、どれも $4\\%$ の照りしか無いので、変化はずっと控えめです。`ENV_INTENSITY` を $0.3$ にすると**上の列だけが暗くなり**、$2.0$ にすると金属がぎらつきます。',
    },
    {
      kind: 'md',
      text: `
## それでも足りないときは、トーンマッピング

$2$ つのつまみを下げても、**明るい部分だけが白く飛ぶ**ことがあります。

環境マップの明るい部分（窓、空、照明）が、そのまま金属に映るからです。
映り込みは $1$ を軽く超えます。

そこで[](#/ch/x12-additive)でやった**トーンマッピング**が要ります。

\`renderer.toneMapping = THREE.ACESFilmicToneMapping\`

環境マップを入れたら、**ほぼ必ずこれが要る**と思っておいてください。

そして、これは**シーン全体の見え方を変える設定**です。
だから次の章では、色がどこでどう変換されているのか ―
**色の通り道**そのものを追いかけます。
`,
    },
  ],
  exercises: [
    {
      prompt: `環境マップを入れたら明るくなったので、\`envMapIntensity\` を $0.2$ まで下げました。

それでも全体が明るいままです。何が起きていますか。`,
      hint: '明るさの式には、項が $2$ つありました。',
      answer: `**ライトが強すぎるままです。**

**式で見る**

$L = L_{\\text{light}} + I_{\\text{env}} L_{\\text{env}}$

$I_{\\text{env}}$ を下げても、**第 $1$ 項には何も起きません。**

環境マップを入れる前に「ちょうどよい」と調整したライトは、
環境マップが加わった時点で**強すぎ**になっています。

**症状の見分け方**

- $I_{\\text{env}}$ を $0$ にしても明るい … **ライトが原因**
- $0$ にすると急に暗くなる … 環境マップが原因

$1$ 行で切り分けられます。

**$0.2$ まで下げると、別の害が出ます**

映り込みがほとんど無くなるので、**金属がまた黒くなりはじめます。**

明るさを直したくて、**金属を直す仕組みのほうを殺している** ―
触る場所を間違えると、こういうことが起きます。

**順番を守る**

$1$ 番目にライト、$2$ 番目に $I_{\\text{env}}$、$3$ 番目にトーンマッピング。

$2$ 番目は「材質ごとの差を付ける」ために取っておくと、
全体の明るさとは別に扱えます。`,
    },
    {
      prompt: `金属の球の映り込みが「ぼやけていて安っぽい」と言われました。

どのつまみを触りますか。`,
      hint: 'ぼけ具合を決めているのは何でしたか。',
      answer: `**\`roughness\` を下げます。$\\mathrm{envMapIntensity}$ ではありません。**

**$2$ つのつまみの役割**

- \`envMapIntensity\` … 映り込みの**明るさ**
- \`roughness\` … 映り込みの**ぼけ具合**

「ぼやけている」は形の話なので、粗さです。

$I_{\\text{env}}$ を上げると、**ぼやけたまま明るくなる**だけ ―
むしろ安っぽさが増します。

**下げたあとに出る問題**

粗さを $0$ に近づけると、**環境マップの解像度がそのまま見えます。**

$256$ 四方の環境マップを大きな球に映すと、
**映り込みの中に四角い画素が見えることがあります。**

そのときは[](#/ch/y02-pmrem)の $S$ を $512$ に上げます ―
**粗さを下げて初めて、解像度が問題になります。**

**順番がある**

- ぼやけている → 粗さを下げる
- 下げたら画素が見えた → 環境マップの解像度を上げる
- それでも暗い → $I_{\\text{env}}$ を上げる

**「安っぽい」の中身を特定してから触る。**
どのつまみも、別のものを直しています。`,
    },
    {
      prompt: `床の \`envMapIntensity\` を $1.0$ のままにすると、どう見えますか。

なぜ $0.3$〜$0.6$ に下げるのでしょう。`,
      hint: '非金属の反射率と、フレネルの効果を思い出してください。',
      answer: `**床全体が濡れたように見えます。**

**なぜそうなるか**

非金属の反射率は正面で $4\\%$ ですが、[](#/ch/y03-env-background)でやったとおり
**かすめる角度では $40\\%$ を超えます。**

床は、視点から見てほとんどが浅い角度です ―
**床のほとんどの面積が、強い映り込みを受けます。**

$I_{\\text{env}} = 1$ だと、その全部がそのまま出るので、
**乾いたコンクリートも磨いた大理石のように**なります。

**下げると何が起きるか**

$0.4$ にすれば、遠くの映り込みが $40\\% \\to 16\\%$ に落ちます。

「わずかに照っている」が残り、「濡れている」は消えます。

**材質差を、この $1$ 数で表している**

現実の材質差は、細かく言えば粗さの分布や表面の微細構造の違いです。

それを全部モデル化する代わりに、
**「この材質はまわりをどれくらい映すか」を $1$ 数で言い切っている** ―
物理的には乱暴ですが、**絵としては十分**です。

そして調整が速い。**触るのが $1$ 数だけなら、見ながら決められます。**`,
    },
  ],
  quiz: [
    {
      q: '環境マップを入れて明るくなりすぎたとき、最初に触るべきものはどれですか。',
      choices: [
        'ライトの強さ。環境マップが加わったぶん、もとのライトは強すぎる',
        'envMapIntensity',
        'トーンマッピング',
        'カメラの露出',
      ],
      answer: 0,
      explain:
        '明るさは「ライトからの寄与 + envMapIntensity × 環境からの寄与」の和です。envMapIntensity をいくら下げても第 1 項は動きません。切り分けは簡単で、envMapIntensity を 0 にしても明るいならライトが原因です。envMapIntensity は材質ごとの差を付けるために取っておきます。',
    },
    {
      q: '`envMapIntensity` と `roughness` は、それぞれ映り込みの何を変えますか。',
      choices: [
        'envMapIntensity は明るさ、roughness はぼけ具合',
        'どちらも明るさ',
        'envMapIntensity はぼけ具合、roughness は明るさ',
        'どちらもぼけ具合',
      ],
      answer: 0,
      explain:
        '「映り込みがぼやけている」は形の話なので粗さを下げます。envMapIntensity を上げても、ぼやけたまま明るくなるだけです。粗さを 0 に近づけると今度は環境マップの解像度がそのまま見えるので、そこで初めて PMREM の S を上げる判断になります。',
    },
    {
      q: '床の `envMapIntensity` を 0.3〜0.6 に下げるのはなぜですか。',
      choices: [
        '床は視点から浅い角度で見えるので、フレネルで反射が 40% を超え、1.0 だと濡れて見えるから',
        '床は環境マップの影響を受けないから',
        '床を暗くしたいから',
        '描画を速くするため',
      ],
      answer: 0,
      explain:
        '非金属の反射率は正面で 4% ですが、かすめる角度では 40% を超えます。床は面積のほとんどが浅い角度なので、1.0 のままだと乾いたコンクリートも磨いた大理石のように見えます。0.4 にすれば遠くの映り込みが 16% に落ち、「わずかに照っている」だけが残ります。',
    },
  ],
};
