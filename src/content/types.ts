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
  /** 数式。readAloud（日本語での読み方）を必ず添える。 */
  | { kind: 'formula'; tex: string; readAloud: string }
  /** 3D デモの埋め込み。id は demos/registry.ts のキー。 */
  | { kind: 'demo'; id: string; caption?: string }
  /** Three.js のコード片。表示とコピーのみ。 */
  | { kind: 'code'; title?: string; code: string }
  /** その場で編集して実行できるコード。第2部で使う。 */
  | { kind: 'sandbox'; title?: string; code: string; caption?: string }
  /** 補足カード。 */
  | { kind: 'callout'; tone: CalloutTone; title: string; text: string };

export type CalloutTone = 'tip' | 'warn' | 'analogy';

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

/** 部。第1部が数学編、第2部が Three.js 編、第3部が実践編。 */
export type Part = 'math' | 'threejs' | 'project';

export interface PartInfo {
  id: Part;
  /** 表示に使う部番号（1 起点）。章番号は `2-05` のように部番号と組み合わせる。 */
  index: number;
  title: string;
  lead: string;
}

export const PARTS: PartInfo[] = [
  {
    id: 'math',
    index: 1,
    title: '第1部　数学編',
    lead: 'Three.js を書くために必要な数学だけを、3D デモを触りながら順番に身につけます。',
  },
  {
    id: 'threejs',
    index: 2,
    title: '第2部　Three.js 編',
    lead: '手に入れた数学を実際のコードにします。各章のコードはその場で書き換えて動かせます。',
  },
  {
    id: 'project',
    index: 3,
    title: '第3部　実践編',
    lead: '作品を 2 つ、最初から最後まで作ります。素材は 1 つも用意せず、すべてコードで生み出します。',
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
