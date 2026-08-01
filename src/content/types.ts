/**
 * 章は「データ」として書き、共通のレンダラが描画する。
 * 本文・デモ・クイズ・用語・検索索引・前提知識マップは、すべてこの型から導出される。
 */

/** 本文を構成する塊。上から順に描画される。 */
export type Block =
  /**
   * 軽量マークアップ。対応するのは次だけ:
   *   ## 見出し / ### 小見出し / 空行区切りの段落 / - 箇条書き
   *   **強調** / `コード` / $数式$ / {{用語}}
   */
  | { kind: 'md'; text: string }
  /** 数式。readAloud（日本語での読み方）と worked（実際の数字での計算）を必ず添える。 */
  | { kind: 'formula'; tex: string; readAloud: string; worked?: WorkedExample }
  /** 3D デモの埋め込み。id は demos/registry.ts のキー。 */
  | { kind: 'demo'; id: string; caption?: string }
  /** Three.js のコード片。表示とコピーのみ。 */
  | { kind: 'code'; title?: string; code: string }
  /** その場で編集して実行できるコード。第2部で使う。 */
  | {
      kind: 'sandbox';
      title?: string;
      code: string;
      caption?: string;
      /**
       * コードの地図。区切りコメント（スラッシュ＋アスタリスクで囲んだ
       * `---- 見出し ----`）は実行時に走査して並べるので、ここには書かない。
       * focus に**見出し名**（行番号ではない）を並べると、その区切りだけ
       * 「この章で新しいところ」として強調される。
       * 見出し名が実在するかは check-content が検査する。
       */
      guide?: { focus?: string[] };
    }
  /** 補足カード。 */
  | { kind: 'callout'; tone: CalloutTone; title: string; text: string };

export type CalloutTone = 'tip' | 'warn' | 'analogy';

/**
 * 数式に添える「実際に計算してみる」。
 *
 * 式の意味が分かることと、自分で回せることは別。
 * 読んで頷けても、一度も数字を入れたことがなければ、次の章で止まる。
 * だから数式には必ずこれを付ける（`npm run check` が強制する）。
 *
 * 数値は小さい整数で、割り切れて、**答えが意味を持つ**ものを選ぶ。
 * 途中の行は飛ばさない ― 飛ばした行が、その人の詰まっているところかもしれない。
 */
export interface WorkedExample {
  /** 前提。「a = (2, 0, 0)、b = (0, 3, 0) のとき」 */
  given: string;
  /** 1 行ずつの計算。calc は等幅で出る。note は「この行で何をしたか」。 */
  steps: { calc: string; note?: string }[];
  /** 答えと、その意味。「0 になった。つまり直角」 */
  result: string;
}

/**
 * 章末の演習。読むだけで終わらせないための課題。
 * 正誤の判定はしない（自己申告になるので、進捗にも絡めない）。
 */
export interface Exercise {
  /** 課題文。md と同じ軽量マークアップが使える。 */
  prompt: string;
  /** 詰まったときの手がかり。答えそのものは書かない。 */
  hint?: string;
  /** 解答例の説明。「なぜそうなるか」まで書く。 */
  answer: string;
  /** 解答例のコード。書き換えたあとの断片を置く（差分の目印は本文側で示す）。 */
  answerCode?: string;
}

export interface QuizQuestion {
  /** 設問文。md と同じ軽量マークアップが使える。 */
  q: string;
  /** 選択肢。 */
  choices: string[];
  /** 正解の添字（0 起点）。 */
  answer: number;
  /** 正誤どちらでも表示する解説。 */
  explain: string;
}

/**
 * 部。数学の土台を 2 つに分けている。
 *
 * 土台がいちばん薄いと、実践編で概念が理解できないまま手が止まる。
 * 「数と形の基礎」は 3D 固有でないもの、「3D の数学」はそこから先。
 */
export type Part = 'basics' | 'math3d' | 'threejs' | 'project' | 'polish';

export interface PartInfo {
  id: Part;
  /** 表示に使う部番号（1 起点）。章番号は `2-05` のように部番号と組み合わせる。 */
  index: number;
  title: string;
  lead: string;
  /**
   * この部を終えると何ができるようになるか。ホームの部見出しに 1 行で出る。
   * 42 章の先が見えないと走れないので、各部の出口を先に見せる。
   */
  payoff: string;
}

export const PARTS: PartInfo[] = [
  {
    id: 'basics',
    index: 1,
    title: '第1部　数と形の基礎',
    lead: '3D に固有でない土台から始めます。座標・ベクトル・角度・内積・外積・乱数を、手で計算しながら身につけます。',
    payoff: 'ここまでで ― 3 つの数字が空間のどこを指すかが読め、2 本の矢印から角度と垂直な向きを自分で計算できるようになります。',
  },
  {
    id: 'math3d',
    index: 2,
    title: '第2部　3D の数学',
    lead: '土台の上に、3D を動かすための数学を積みます。行列・回転・階層・投影・法線・曲線。',
    payoff: 'ここまでで ― 箱を思った場所に置き、思った軸で回し、光の当たり方とカメラの写り方まで説明できるようになります。',
  },
  {
    id: 'threejs',
    index: 3,
    title: '第3部　Three.js 編',
    lead: '手に入れた数学を実際のコードにします。各章のコードはその場で書き換えて動かせます。',
    payoff: 'ここまでで ― 何も見ずに Three.js のシーンを 1 つ書き上げ、シェーダにも手を入れられるようになります。',
  },
  {
    id: 'project',
    index: 4,
    title: '第4部　実践編',
    lead: '作品を 2 つ、最初から最後まで作ります。素材は 1 つも用意せず、すべてコードで生み出します。',
    payoff: 'ここまでで ― 画像もモデルも使わずに、惑星ひとつと街ひとつを最初から最後まで作れるようになります。',
  },
  {
    id: 'polish',
    index: 5,
    title: '第5部　仕上げ編',
    lead: '作ったものを「見せられるもの」にします。映り込み、色の通り道、画面全体への効果、そして公開。',
    payoff: 'ここまでで ― 作ったものを人に見せられる形に仕上げ、URL ひとつで公開できるようになります。',
  },
];

export interface Chapter {
  /** URL に出るキー。例: '03-dot' → #/ch/03-dot */
  slug: string;
  /** 所属する部。 */
  part: Part;
  /** 部の中での通し番号（1 起点）。表示は `2-05` の形になる。 */
  number: number;
  title: string;
  /** 「この章を読むとできるようになること」。目次カードと章頭に出る。 */
  goal: string;
  /** 前提となる章の slug。前提知識マップの辺になる。 */
  requires: string[];
  /** 対応する Three.js の API。章末に一覧で出る。 */
  threeApis: string[];
  /**
   * 章冒頭に出す呼び戻し。第2部では「この章で使う数学」、第3部では「この章で使う道具」として出る。
   * 前の部を読んでいない人でも、どこへ戻ればよいかが分かるようにする。
   */
  mathRecall?: { slug: string; note: string }[];
  blocks: Block[];
  /** 章末の演習。クイズの直前に出る。 */
  exercises?: Exercise[];
  quiz: QuizQuestion[];
}

export interface GlossaryEntry {
  /** 本文中で {{...}} と書いたときのキー。 */
  term: string;
  /** ふりがな・英語表記など。 */
  reading?: string;
  /** 1〜3 文の短い定義。ホバーでそのまま出る。 */
  def: string;
  /** 詳しく説明している章の slug。 */
  chapter?: string;
}
