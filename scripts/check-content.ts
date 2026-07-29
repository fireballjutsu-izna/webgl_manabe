/**
 * コンテンツの整合性チェック。
 *   npm run check
 *
 * 章のデータは本文・デモ・用語・前提マップの唯一の出どころなので、
 * ここが食い違うとリンク切れやデモ欠けになる。機械的に潰しておく。
 */

import { chapters, chaptersOfPart, PARTS } from '../src/content/index.ts';
import { glossary } from '../src/content/glossary.ts';
import { docsUrl, isKnownUnlinked } from '../src/content/three-docs.ts';
import { demos } from '../src/demos/registry.ts';

/** 1 章に置けるサンドボックスの上限。WebGL コンテキストを使い切らないための歯止め。 */
const MAX_SANDBOXES = 3;

const errors: string[] = [];
const warnings: string[] = [];

const slugs = new Set(chapters.map((chapter) => chapter.slug));
const demoIds = new Set(Object.keys(demos));
const terms = new Set(glossary.map((entry) => entry.term));

const usedDemos = new Set<string>();
const usedTerms = new Set<string>();

// 章番号は部の中で 1 から連番になっていること
for (const part of PARTS) {
  for (const [index, chapter] of chaptersOfPart(part.id).entries()) {
    if (chapter.number !== index + 1) {
      errors.push(
        `${chapter.slug}: number が ${chapter.number} ですが、${part.title}では ${index + 1} 章目です`,
      );
    }
  }
}

for (const chapter of chapters) {
  const where = `${chapter.slug}`;
  let sandboxes = 0;
  if (chapter.goal.trim().length === 0) {
    errors.push(`${where}: goal が空です`);
  }
  if (chapter.quiz.length === 0) {
    errors.push(`${where}: 確認クイズが 1 問もありません`);
  }
  if (chapter.blocks.length === 0) {
    errors.push(`${where}: 本文が空です`);
  }

  for (const required of chapter.requires) {
    if (!slugs.has(required)) {
      errors.push(`${where}: requires に存在しない章 "${required}" が指定されています`);
    }
    // 「前提」は読む順で先に来ていること。部をまたぐので、並び順そのもので比べる
    const here = chapters.findIndex((c) => c.slug === chapter.slug);
    const there = chapters.findIndex((c) => c.slug === required);
    if (there >= 0 && there >= here) {
      warnings.push(
        `${where}: 前提として指定された ${required} が、この章より後ろにあります`,
      );
    }
  }

  for (const question of chapter.quiz) {
    if (question.choices.length < 2) {
      errors.push(`${where}: 選択肢が 2 つ未満の設問があります`);
    }
    if (question.answer < 0 || question.answer >= question.choices.length) {
      errors.push(`${where}: answer(${question.answer}) が選択肢の範囲外です`);
    }
    if (question.explain.trim().length === 0) {
      errors.push(`${where}: 解説が空の設問があります`);
    }
  }

  const texts: string[] = [chapter.goal];

  for (const block of chapter.blocks) {
    if (block.kind === 'demo') {
      usedDemos.add(block.id);
      if (!demoIds.has(block.id)) {
        errors.push(`${where}: デモ "${block.id}" が registry.ts に登録されていません`);
      }
    }
    if (block.kind === 'md') texts.push(block.text);
    if (block.kind === 'callout') texts.push(block.text, block.title);
    if (block.kind === 'formula' && block.readAloud.trim().length === 0) {
      errors.push(`${where}: 数式 "${block.tex}" に readAloud（日本語での読み方）がありません`);
    }
    if (block.kind === 'code' && block.code.trim().length === 0) {
      errors.push(`${where}: 空のコードブロックがあります`);
    }
    if (block.kind === 'sandbox') {
      sandboxes += 1;
      if (block.code.trim().length === 0) {
        errors.push(`${where}: 空のサンドボックスがあります`);
      }
      if (block.caption) texts.push(block.caption);
      if (!/\bimport\b/.test(block.code)) {
        warnings.push(`${where}: サンドボックスに import がありません（意図どおりか確認）`);
      }
    }
  }

  if (sandboxes > MAX_SANDBOXES) {
    errors.push(
      `${where}: サンドボックスが ${sandboxes} 個あります（1 章 ${MAX_SANDBOXES} 個まで）`,
    );
  }

  // 章冒頭の「この章で使う数学」
  for (const recall of chapter.mathRecall ?? []) {
    if (!slugs.has(recall.slug)) {
      errors.push(`${where}: mathRecall に存在しない章 "${recall.slug}" が指定されています`);
    }
    if (recall.note.trim().length === 0) {
      errors.push(`${where}: mathRecall の note が空です`);
    }
  }

  // API チップが公式ドキュメントへ飛べるか
  for (const api of chapter.threeApis) {
    if (docsUrl(api) === null && !isKnownUnlinked(api)) {
      warnings.push(
        `${where}: "${api}" は three-docs.ts に載っていないため、リンクになりません`,
      );
    }
  }
  for (const question of chapter.quiz) texts.push(question.q, question.explain);

  for (const text of texts) {
    for (const match of text.matchAll(/\{\{([^}]+)\}\}/g)) {
      const body = match[1] ?? '';
      const key = (body.includes('|') ? body.split('|', 2)[1] : body)?.trim() ?? '';
      usedTerms.add(key);
      if (!terms.has(key)) {
        errors.push(`${where}: 用語 "${key}" が glossary.ts にありません`);
      }
    }
    // 本文中の章リンクが実在するか
    for (const match of text.matchAll(/\(#\/ch\/([^)]+)\)/g)) {
      const target = match[1] ?? '';
      if (!slugs.has(target)) {
        errors.push(`${where}: リンク先の章 "${target}" が存在しません`);
      }
    }
  }
}

for (const entry of glossary) {
  if (entry.chapter && !slugs.has(entry.chapter)) {
    errors.push(`glossary "${entry.term}": 存在しない章 "${entry.chapter}" を参照しています`);
  }
  if (entry.def.trim().length === 0) {
    errors.push(`glossary "${entry.term}": 定義が空です`);
  }
}

for (const id of demoIds) {
  if (!usedDemos.has(id)) {
    warnings.push(`デモ "${id}" はどの章からも参照されていません`);
  }
}

for (const term of terms) {
  if (!usedTerms.has(term)) {
    warnings.push(`用語 "${term}" は本文のどこからも参照されていません`);
  }
}

console.log(`章: ${chapters.length}　デモ: ${demoIds.size}　用語: ${terms.size}`);

for (const warning of warnings) console.warn(`  warn  ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`  ERROR ${error}`);
  console.error(`\n${errors.length} 件の問題が見つかりました。`);
  process.exit(1);
}

console.log('コンテンツの整合性チェック: 問題なし');
