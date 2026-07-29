import { PARTS, type Chapter, type Part, type PartInfo } from './types.ts';

import { chapter01 } from './chapters/01-space.ts';
import { chapter02 } from './chapters/02-vector.ts';
import { chapter03 } from './chapters/03-dot.ts';
import { chapter04 } from './chapters/04-cross.ts';
import { chapter05 } from './chapters/05-trig.ts';
import { chapter06 } from './chapters/06-matrix.ts';
import { chapter07 } from './chapters/07-rotation.ts';
import { chapter08 } from './chapters/08-interp.ts';
import { chapter09 } from './chapters/09-hierarchy.ts';
import { chapter10 } from './chapters/10-camera.ts';
import { chapter11 } from './chapters/11-normal-light.ts';
import { chapter12 } from './chapters/12-curve.ts';
import { chapter13 } from './chapters/13-random.ts';
import { chapter14 } from './chapters/14-capstone.ts';

import { chapterT01 } from './chapters/t01-first-scene.ts';
import { chapterT02 } from './chapters/t02-geometry.ts';
import { chapterT03 } from './chapters/t03-material.ts';
import { chapterT04 } from './chapters/t04-texture.ts';
import { chapterT05 } from './chapters/t05-light-shadow.ts';
import { chapterT06 } from './chapters/t06-loop-clock.ts';
import { chapterT07 } from './chapters/t07-controls.ts';
import { chapterT08 } from './chapters/t08-raycaster.ts';
import { chapterT09 } from './chapters/t09-loader.ts';
import { chapterT10 } from './chapters/t10-scene-graph.ts';
import { chapterT11 } from './chapters/t11-performance.ts';

/** 学ぶ順に並べた全章。目次・前提知識マップ・検索索引はここから作られる。 */
export const chapters: Chapter[] = [
  chapter01,
  chapter02,
  chapter03,
  chapter04,
  chapter05,
  chapter06,
  chapter07,
  chapter08,
  chapter09,
  chapter10,
  chapter11,
  chapter12,
  chapter13,
  chapter14,

  chapterT01,
  chapterT02,
  chapterT03,
  chapterT04,
  chapterT05,
  chapterT06,
  chapterT07,
  chapterT08,
  chapterT09,
  chapterT10,
  chapterT11,
];

const bySlug = new Map(chapters.map((chapter) => [chapter.slug, chapter]));

export function chapterBySlug(slug: string): Chapter | undefined {
  return bySlug.get(slug);
}

export { PARTS };

export function partInfo(part: Part): PartInfo {
  return PARTS.find((info) => info.id === part) ?? PARTS[0]!;
}

export function chaptersOfPart(part: Part): Chapter[] {
  return chapters.filter((chapter) => chapter.part === part);
}

/** 目次や見出しに出す章番号。`2-05` の形。 */
export function chapterLabel(chapter: Chapter): string {
  return `${partInfo(chapter.part).index}-${String(chapter.number).padStart(2, '0')}`;
}
