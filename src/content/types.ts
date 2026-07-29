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

export interface Chapter {
  /** URL に出るキー。例: '03-dot' → #/ch/03-dot */
  slug: string;
  number: number;
  title: string;
  /** 「この章を読むとできるようになること」。目次カードと章頭に出る。 */
  goal: string;
  /** 前提となる章の slug。前提知識マップの辺になる。 */
  requires: string[];
  /** 対応する Three.js の API。章末に一覧で出る。 */
  threeApis: string[];
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
