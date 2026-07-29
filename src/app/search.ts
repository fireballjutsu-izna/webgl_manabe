/**
 * 章内検索。14 章ぶんのテキストしかないので、索引ライブラリは使わず
 * 素の部分一致で十分に速い。日本語なので分かち書きもしない。
 */

import { chapters } from '../content/index.ts';
import { glossary } from '../content/glossary.ts';
import { toPlainText } from '../ui/markup.ts';
import { escapeHtml } from '../ui/dom.ts';

interface Doc {
  slug: string;
  number: number;
  title: string;
  haystack: string;
  lower: string;
}

export interface Hit {
  href: string;
  number: number;
  title: string;
  /** 一致箇所を <mark> で囲んだ HTML。 */
  snippet: string;
}

let docs: Doc[] | null = null;

function buildIndex(): Doc[] {
  if (docs) return docs;

  docs = chapters.map((chapter) => {
    const parts: string[] = [chapter.title, chapter.goal];
    for (const block of chapter.blocks) {
      if (block.kind === 'md') parts.push(toPlainText(block.text));
      else if (block.kind === 'formula') parts.push(block.readAloud);
      else if (block.kind === 'callout') parts.push(block.title, toPlainText(block.text));
      else if (block.kind === 'demo' && block.caption) parts.push(block.caption);
    }
    for (const question of chapter.quiz) parts.push(toPlainText(question.q));

    const haystack = parts.join(' ');
    return {
      slug: chapter.slug,
      number: chapter.number,
      title: chapter.title,
      haystack,
      lower: haystack.toLowerCase(),
    };
  });

  return docs;
}

function makeSnippet(text: string, at: number, length: number): string {
  const start = Math.max(0, at - 34);
  const end = Math.min(text.length, at + length + 44);
  const before = escapeHtml(text.slice(start, at));
  const hit = escapeHtml(text.slice(at, at + length));
  const after = escapeHtml(text.slice(at + length, end));
  return `${start > 0 ? '…' : ''}${before}<mark>${hit}</mark>${after}${end < text.length ? '…' : ''}`;
}

export function search(query: string, limit = 8): Hit[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return [];

  const hits: (Hit & { score: number })[] = [];

  for (const doc of buildIndex()) {
    const at = doc.lower.indexOf(needle);
    if (at < 0) continue;
    const inTitle = doc.title.toLowerCase().includes(needle);
    hits.push({
      href: `#/ch/${doc.slug}`,
      number: doc.number,
      title: doc.title,
      snippet: makeSnippet(doc.haystack, at, needle.length),
      score: (inTitle ? 1000 : 0) - at,
    });
  }

  // 用語集も一緒に引く
  for (const entry of glossary) {
    const hay = `${entry.term} ${entry.reading ?? ''} ${entry.def}`;
    const at = hay.toLowerCase().indexOf(needle);
    if (at < 0) continue;
    hits.push({
      href: `#/glossary/${encodeURIComponent(entry.term)}`,
      number: 0,
      title: `用語集：${entry.term}`,
      snippet: makeSnippet(hay, at, needle.length),
      score: (entry.term.toLowerCase().includes(needle) ? 800 : 0) - at,
    });
  }

  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...hit }) => hit);
}
