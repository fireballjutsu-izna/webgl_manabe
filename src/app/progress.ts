/** 学習の進捗。サーバは使わず localStorage だけで完結する。 */

const KEY = 'webgl-manabe:progress:v1';
const THEME_KEY = 'webgl-manabe:theme';

export interface ChapterProgress {
  read: boolean;
  /** 章末クイズを全問正解したか。 */
  quizPassed: boolean;
}

type ProgressMap = Record<string, ChapterProgress>;

let cache: ProgressMap | null = null;

const listeners = new Set<() => void>();

function load(): ProgressMap {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    // プライベートブラウジング等で localStorage が使えない場合もそのまま動かす
    cache = {};
  }
  return cache;
}

function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(load()));
  } catch {
    /* 保存できなくても学習の妨げにはしない */
  }
  for (const fn of listeners) fn();
}

export function onProgressChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getProgress(slug: string): ChapterProgress {
  return load()[slug] ?? { read: false, quizPassed: false };
}

export function setRead(slug: string, read: boolean): void {
  const map = load();
  map[slug] = { ...getProgress(slug), read };
  save();
}

export function setQuizPassed(slug: string, passed: boolean): void {
  const map = load();
  const cur = getProgress(slug);
  // 一度通った記録は、あとで間違えても取り消さない
  map[slug] = { ...cur, quizPassed: cur.quizPassed || passed };
  save();
}

export function countRead(slugs: string[]): number {
  return slugs.filter((s) => getProgress(s).read).length;
}

export function resetProgress(): void {
  cache = {};
  save();
}

/* ---- テーマ ---- */

export type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* 保存できなくても表示は切り替わる */
  }
  for (const fn of themeListeners) fn(theme);
}

const themeListeners = new Set<(t: Theme) => void>();

export function onThemeChange(fn: (t: Theme) => void): () => void {
  themeListeners.add(fn);
  return () => themeListeners.delete(fn);
}
