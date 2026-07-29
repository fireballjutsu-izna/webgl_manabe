import type { Chapter } from './types.ts';

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

/** 学ぶ順に並べた全14章。目次・前提知識マップ・検索索引はここから作られる。 */
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
];

const bySlug = new Map(chapters.map((chapter) => [chapter.slug, chapter]));

export function chapterBySlug(slug: string): Chapter | undefined {
  return bySlug.get(slug);
}
