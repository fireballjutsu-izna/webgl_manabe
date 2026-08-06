import { PARTS, type Chapter, type Part, type PartInfo } from './types.ts';

import { chapterB01 } from './chapters/b01-number-line.ts';
import { chapterB02 } from './chapters/b02-variable.ts';
import { chapterB03 } from './chapters/b03-function-graph.ts';
import { chapterB04 } from './chapters/b04-power-root.ts';
import { chapterB05 } from './chapters/b05-ratio.ts';
import { chapterB06 } from './chapters/b06-float.ts';
import { chapterB07 } from './chapters/b07-plane.ts';
import { chapter01 } from './chapters/01-space.ts';
import { chapterB09 } from './chapters/b09-handedness.ts';
import { chapterB10 } from './chapters/b10-pythagoras.ts';
import { chapterB11 } from './chapters/b11-distance.ts';
import { chapter02 } from './chapters/02-vector.ts';
import { chapterB13 } from './chapters/b13-vector-add.ts';
import { chapterB14 } from './chapters/b14-vector-sub.ts';
import { chapterB15 } from './chapters/b15-vector-scale.ts';
import { chapterB16 } from './chapters/b16-vector-length.ts';
import { chapterB17 } from './chapters/b17-normalize.ts';
import { chapter03 } from './chapters/03-dot.ts';
import { chapterB25 } from './chapters/b25-dot-angle.ts';
import { chapterB26 } from './chapters/b26-dot-facing.ts';
import { chapterB27 } from './chapters/b27-lambert.ts';
import { chapterB28 } from './chapters/b28-projection.ts';
import { chapter04 } from './chapters/04-cross.ts';
import { chapterB30 } from './chapters/b30-cross-area.ts';
import { chapterB31 } from './chapters/b31-triangle-normal.ts';
import { chapterB32 } from './chapters/b32-cross-side.ts';
import { chapterB18 } from './chapters/b18-angle.ts';
import { chapter05 } from './chapters/05-trig.ts';
import { chapterB20 } from './chapters/b20-sin-cos.ts';
import { chapterB21 } from './chapters/b21-circular-motion.ts';
import { chapterB22 } from './chapters/b22-wave.ts';
import { chapterB23 } from './chapters/b23-atan2.ts';
import { chapter06 } from './chapters/06-matrix.ts';
import { chapterM02 } from './chapters/m02-matrix-vector.ts';
import { chapterM03 } from './chapters/m03-basis.ts';
import { chapterM04 } from './chapters/m04-homogeneous.ts';
import { chapterM05 } from './chapters/m05-matrix-order.ts';
import { chapterM06 } from './chapters/m06-trs.ts';
import { chapterM07 } from './chapters/m07-inverse.ts';
import { chapterM08 } from './chapters/m08-normal-matrix.ts';
import { chapter07 } from './chapters/07-rotation.ts';
import { chapterM10 } from './chapters/m10-euler.ts';
import { chapterM11 } from './chapters/m11-gimbal.ts';
import { chapterM12 } from './chapters/m12-axis-angle.ts';
import { chapterM13 } from './chapters/m13-quaternion.ts';
import { chapterM14 } from './chapters/m14-slerp.ts';
import { chapterM15 } from './chapters/m15-lookat.ts';
import { chapter08 } from './chapters/08-interp.ts';
import { chapterB34 } from './chapters/b34-inverse-lerp.ts';
import { chapterB35 } from './chapters/b35-easing.ts';
import { chapterB36 } from './chapters/b36-smoothstep.ts';
import { chapterB37 } from './chapters/b37-follow.ts';
import { chapterB39 } from './chapters/b39-seed.ts';
import { chapterB40 } from './chapters/b40-distribution.ts';
import { chapterB41 } from './chapters/b41-noise.ts';
import { chapterB42 } from './chapters/b42-fbm.ts';
import { chapter09 } from './chapters/09-hierarchy.ts';
import { chapterM17 } from './chapters/m17-local-world.ts';
import { chapterM18 } from './chapters/m18-matrix-world.ts';
import { chapterM19 } from './chapters/m19-pivot.ts';
import { chapterM20 } from './chapters/m20-attach.ts';
import { chapterM21 } from './chapters/m21-polar.ts';
import { chapterM22 } from './chapters/m22-spherical.ts';
import { chapterM23 } from './chapters/m23-sphere-uniform.ts';
import { chapterM24 } from './chapters/m24-orbit.ts';
import { chapter10 } from './chapters/10-camera.ts';
import { chapterM26 } from './chapters/m26-perspective.ts';
import { chapterM27 } from './chapters/m27-frustum.ts';
import { chapterM28 } from './chapters/m28-ndc.ts';
import { chapterM29 } from './chapters/m29-ortho.ts';
import { chapter11 } from './chapters/11-normal-light.ts';
import { chapterM31 } from './chapters/m31-reflect.ts';
import { chapterM32 } from './chapters/m32-specular.ts';
import { chapterM33 } from './chapters/m33-fresnel.ts';
import { chapterM34 } from './chapters/m34-refract.ts';
import { chapter12 } from './chapters/12-curve.ts';
import { chapterM36 } from './chapters/m36-catmull.ts';
import { chapterM37 } from './chapters/m37-arclength.ts';
import { chapterM38 } from './chapters/m38-frame.ts';
import { chapterM39 } from './chapters/m39-recursion.ts';
import { chapterM40 } from './chapters/m40-subdivision.ts';
import { chapterM41 } from './chapters/m41-fractal.ts';
import { chapter13 } from './chapters/13-random.ts';
import { chapter14 } from './chapters/14-capstone.ts';

import { chapterT01 } from './chapters/t01-first-scene.ts';
import { chapterW02 } from './chapters/w02-render-loop.ts';
import { chapterW03 } from './chapters/w03-resize.ts';
import { chapterW04 } from './chapters/w04-blank-screen.ts';
import { chapterT02 } from './chapters/t02-geometry.ts';
import { chapterW06 } from './chapters/w06-buffer-geometry.ts';
import { chapterW07 } from './chapters/w07-index.ts';
import { chapterW08 } from './chapters/w08-attributes.ts';
import { chapterW09 } from './chapters/w09-geometry-edit.ts';
import { chapterT03 } from './chapters/t03-material.ts';
import { chapterW11 } from './chapters/w11-pbr.ts';
import { chapterW12 } from './chapters/w12-transparent.ts';
import { chapterW13 } from './chapters/w13-color-space.ts';
import { chapterT04 } from './chapters/t04-texture.ts';
import { chapterW15 } from './chapters/w15-uv.ts';
import { chapterW16 } from './chapters/w16-repeat.ts';
import { chapterW17 } from './chapters/w17-filter.ts';
import { chapterW18 } from './chapters/w18-normal-map.ts';
import { chapterT05 } from './chapters/t05-light-shadow.ts';
import { chapterW20 } from './chapters/w20-shadow.ts';
import { chapterW21 } from './chapters/w21-shadow-quality.ts';
import { chapterW22 } from './chapters/w22-light-cost.ts';
import { chapterW23 } from './chapters/w23-fill-light.ts';
import { chapterT06 } from './chapters/t06-loop-clock.ts';
import { chapterW25 } from './chapters/w25-damping.ts';
import { chapterW26 } from './chapters/w26-sequence.ts';
import { chapterT07 } from './chapters/t07-controls.ts';
import { chapterW28 } from './chapters/w28-camera-move.ts';
import { chapterW29 } from './chapters/w29-controls-ux.ts';
import { chapterT08 } from './chapters/t08-raycaster.ts';
import { chapterW31 } from './chapters/w31-hover-click.ts';
import { chapterW32 } from './chapters/w32-drag.ts';
import { chapterW33 } from './chapters/w33-pick-cost.ts';
import { chapterT09 } from './chapters/t09-loader.ts';
import { chapterW35 } from './chapters/w35-fit-model.ts';
import { chapterW36 } from './chapters/w36-loading-ui.ts';
import { chapterW37 } from './chapters/w37-asset-cost.ts';
import { chapterT10 } from './chapters/t10-scene-graph.ts';
import { chapterW39 } from './chapters/w39-find-traverse.ts';
import { chapterW40 } from './chapters/w40-dispose.ts';
import { chapterT11 } from './chapters/t11-performance.ts';
import { chapterW42 } from './chapters/w42-draw-calls.ts';
import { chapterW43 } from './chapters/w43-instancing.ts';
import { chapterW44 } from './chapters/w44-gpu-cost.ts';
import { chapterT12 } from './chapters/t12-shader-intro.ts';
import { chapterT13 } from './chapters/t13-vertex-shader.ts';
import { chapterT14 } from './chapters/t14-fragment-shader.ts';

import { chapterW48 } from './chapters/w48-shader-debug.ts';
import { chapterW49 } from './chapters/w49-onbeforecompile.ts';
import { chapterW50 } from './chapters/w50-small-forest.ts';

import { chapterP01 } from './chapters/p01-planet-setup.ts';
import { chapterX02 } from './chapters/x02-depth-precision.ts';
import { chapterX03 } from './chapters/x03-uniform-sphere.ts';
import { chapterX04 } from './chapters/x04-star-look.ts';
import { chapterP02 } from './chapters/p02-planet-surface.ts';
import { chapterX06 } from './chapters/x06-value-noise.ts';
import { chapterX07 } from './chapters/x07-fbm-terrain.ts';
import { chapterX08 } from './chapters/x08-sphere-seam.ts';
import { chapterX09 } from './chapters/x09-surface-bake.ts';
import { chapterP03 } from './chapters/p03-planet-atmosphere.ts';
import { chapterX11 } from './chapters/x11-atmosphere-rim.ts';
import { chapterX12 } from './chapters/x12-additive.ts';
import { chapterX13 } from './chapters/x13-clouds.ts';
import { chapterX14 } from './chapters/x14-terminator.ts';
import { chapterP04 } from './chapters/p04-planet-orbits.ts';
import { chapterP05 } from './chapters/p05-city-layout.ts';
import { chapterP06 } from './chapters/p06-city-buildings.ts';
import { chapterP07 } from './chapters/p07-city-light.ts';
import { chapterP08 } from './chapters/p08-city-motion.ts';

import { chapterQ01 } from './chapters/q01-environment.ts';
import { chapterQ02 } from './chapters/q02-color.ts';
import { chapterQ03 } from './chapters/q03-postprocess.ts';
import { chapterQ04 } from './chapters/q04-custom-pass.ts';
import { chapterQ05R3F } from './chapters/q05-r3f.ts';
import { chapterQ06 } from './chapters/q05-ship-it.ts';

/** 学ぶ順に並べた全章。目次・前提知識マップ・検索索引はここから作られる。 */
export const chapters: Chapter[] = [
  chapterB01,
  chapterB02,
  chapterB03,
  chapterB04,
  chapterB05,
  chapterB06,
  chapterB07,
  chapter01,
  chapterB09,
  chapterB10,
  chapterB11,
  chapter02,
  chapterB13,
  chapterB14,
  chapterB15,
  chapterB16,
  chapterB17,
  chapterB18,
  chapter05,
  chapterB20,
  chapterB21,
  chapterB22,
  chapterB23,
  chapter03,
  chapterB25,
  chapterB26,
  chapterB27,
  chapterB28,
  chapter04,
  chapterB30,
  chapterB31,
  chapterB32,
  chapter08,
  chapterB34,
  chapterB35,
  chapterB36,
  chapterB37,
  chapter13,
  chapterB39,
  chapterB40,
  chapterB41,
  chapterB42,

  chapter06,
  chapterM02,
  chapterM03,
  chapterM04,
  chapterM05,
  chapterM06,
  chapterM07,
  chapterM08,
  chapter07,
  chapterM10,
  chapterM11,
  chapterM12,
  chapterM13,
  chapterM14,
  chapterM15,
  chapter09,
  chapterM17,
  chapterM18,
  chapterM19,
  chapterM20,
  chapterM21,
  chapterM22,
  chapterM23,
  chapterM24,
  chapter10,
  chapterM26,
  chapterM27,
  chapterM28,
  chapterM29,
  chapter11,
  chapterM31,
  chapterM32,
  chapterM33,
  chapterM34,
  chapter12,
  chapterM36,
  chapterM37,
  chapterM38,
  chapterM39,
  chapterM40,
  chapterM41,
  chapter14,

  chapterT01,
  chapterW02,
  chapterW03,
  chapterW04,
  chapterT02,
  chapterW06,
  chapterW07,
  chapterW08,
  chapterW09,
  chapterT03,
  chapterW11,
  chapterW12,
  chapterW13,
  chapterT04,
  chapterW15,
  chapterW16,
  chapterW17,
  chapterW18,
  chapterT05,
  chapterW20,
  chapterW21,
  chapterW22,
  chapterW23,
  chapterT06,
  chapterW25,
  chapterW26,
  chapterT07,
  chapterW28,
  chapterW29,
  chapterT08,
  chapterW31,
  chapterW32,
  chapterW33,
  chapterT09,
  chapterW35,
  chapterW36,
  chapterW37,
  chapterT10,
  chapterW39,
  chapterW40,
  chapterT11,
  chapterW42,
  chapterW43,
  chapterW44,
  chapterT12,
  chapterT13,
  chapterT14,
  chapterW48,
  chapterW49,
  chapterW50,

  chapterP01,
  chapterX02,
  chapterX03,
  chapterX04,
  chapterP02,
  chapterX06,
  chapterX07,
  chapterX08,
  chapterX09,
  chapterP03,
  chapterX11,
  chapterX12,
  chapterX13,
  chapterX14,
  chapterP04,
  chapterP05,
  chapterP06,
  chapterP07,
  chapterP08,

  chapterQ01,
  chapterQ02,
  chapterQ03,
  chapterQ04,
  chapterQ05R3F,
  chapterQ06,
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
