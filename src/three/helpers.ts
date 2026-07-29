/**
 * デモで繰り返し使う可視化パーツ。
 *
 * 矢印や補助線は MeshBasicMaterial / LineBasicMaterial（ライティングの影響を受けない）で
 * 描く。パレットの色がそのまま出るので、章をまたいでも「シアン＝入力 a」の意味が崩れない。
 */

import * as THREE from 'three';
import { cssVar } from '../ui/dom.ts';

export type VectorRole = 'a' | 'b' | 'result' | 'normal' | 'guide' | 'negative';

const ROLE_VAR: Record<VectorRole, string> = {
  a: '--vec-a',
  b: '--vec-b',
  result: '--vec-result',
  normal: '--vec-normal',
  guide: '--vec-guide',
  negative: '--vec-negative',
};

/** 役割に対応する色を、現在のテーマから取り出す。 */
export function vecColor(role: VectorRole): string {
  return cssVar(ROLE_VAR[role], '#ffffff');
}

const UP = new THREE.Vector3(0, 1, 0);

/* ---- 矢印 ---- */

export interface Arrow {
  object: THREE.Group;
  /** 原点から vec の向き・長さに合わせる。 */
  set(vec: THREE.Vector3, origin?: THREE.Vector3): void;
  setColor(color: string): void;
  setVisible(visible: boolean): void;
  dispose(): void;
}

export function createArrow(
  color: string,
  options: { radius?: number; headLength?: number; headRadius?: number } = {},
): Arrow {
  const radius = options.radius ?? 0.028;
  const headLength = options.headLength ?? 0.22;
  const headRadius = options.headRadius ?? 0.075;

  const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), fog: false });

  const shaftGeo = new THREE.CylinderGeometry(radius, radius, 1, 12);
  shaftGeo.translate(0, 0.5, 0); // 根元が原点に来るようにする
  const shaft = new THREE.Mesh(shaftGeo, material);

  const headGeo = new THREE.ConeGeometry(headRadius, headLength, 16);
  const head = new THREE.Mesh(headGeo, material);

  const group = new THREE.Group();
  group.add(shaft, head);

  const dir = new THREE.Vector3();
  const quat = new THREE.Quaternion();

  return {
    object: group,
    set(vec, origin) {
      const length = vec.length();
      if (origin) group.position.copy(origin);
      if (length < 1e-6) {
        group.visible = false;
        return;
      }
      group.visible = true;
      dir.copy(vec).divideScalar(length);
      quat.setFromUnitVectors(UP, dir);
      group.quaternion.copy(quat);

      const shaftLength = Math.max(length - headLength, length * 0.05);
      shaft.scale.set(1, shaftLength, 1);
      head.position.set(0, length - headLength / 2, 0);
    },
    setColor(next) {
      material.color.set(next);
    },
    setVisible(visible) {
      group.visible = visible;
    },
    dispose() {
      shaftGeo.dispose();
      headGeo.dispose();
      material.dispose();
    },
  };
}

/* ---- 線分（実線・破線） ---- */

export interface Segment {
  object: THREE.Line;
  set(from: THREE.Vector3, to: THREE.Vector3): void;
  setColor(color: string): void;
  setVisible(visible: boolean): void;
  dispose(): void;
}

export function createSegment(color: string, dashed = false): Segment {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const material = dashed
    ? new THREE.LineDashedMaterial({
        color: new THREE.Color(color),
        dashSize: 0.14,
        gapSize: 0.1,
        fog: false,
      })
    : new THREE.LineBasicMaterial({ color: new THREE.Color(color), fog: false });

  const line = new THREE.Line(geometry, material);

  return {
    object: line,
    set(from, to) {
      const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
      positions.setXYZ(0, from.x, from.y, from.z);
      positions.setXYZ(1, to.x, to.y, to.z);
      positions.needsUpdate = true;
      geometry.computeBoundingSphere();
      if (dashed) line.computeLineDistances();
    },
    setColor(next) {
      material.color.set(next);
    },
    setVisible(visible) {
      line.visible = visible;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

/* ---- 折れ線 / 曲線 ---- */

export interface Polyline {
  object: THREE.Line;
  set(points: THREE.Vector3[]): void;
  setColor(color: string): void;
  dispose(): void;
}

export function createPolyline(color: string, capacity = 512, dashed = false): Polyline {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(capacity * 3), 3),
  );
  geometry.setDrawRange(0, 0);

  const material = dashed
    ? new THREE.LineDashedMaterial({
        color: new THREE.Color(color),
        dashSize: 0.12,
        gapSize: 0.09,
        fog: false,
      })
    : new THREE.LineBasicMaterial({ color: new THREE.Color(color), fog: false });

  const line = new THREE.Line(geometry, material);
  line.frustumCulled = false;

  return {
    object: line,
    set(points) {
      const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
      const count = Math.min(points.length, capacity);
      for (let i = 0; i < count; i += 1) {
        const p = points[i]!;
        attr.setXYZ(i, p.x, p.y, p.z);
      }
      attr.needsUpdate = true;
      geometry.setDrawRange(0, count);
      if (dashed) line.computeLineDistances();
    },
    setColor(next) {
      material.color.set(next);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

/* ---- 点 ---- */

export function createPoint(color: string, radius = 0.07): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 20, 14);
  const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), fog: false });
  return new THREE.Mesh(geometry, material);
}

/* ---- 2 ベクトルのなす角の弧 ---- */

export interface Arc {
  object: THREE.Line;
  set(a: THREE.Vector3, b: THREE.Vector3, radius?: number): void;
  setColor(color: string): void;
  dispose(): void;
}

export function createArc(color: string, segments = 48): Arc {
  const polyline = createPolyline(color, segments + 1);
  const points: THREE.Vector3[] = Array.from({ length: segments + 1 }, () => new THREE.Vector3());
  const ua = new THREE.Vector3();
  const ub = new THREE.Vector3();

  return {
    object: polyline.object,
    set(a, b, radius = 0.75) {
      if (a.lengthSq() < 1e-8 || b.lengthSq() < 1e-8) {
        polyline.set([]);
        return;
      }
      ua.copy(a).normalize();
      ub.copy(b).normalize();
      const cos = THREE.MathUtils.clamp(ua.dot(ub), -1, 1);
      const theta = Math.acos(cos);

      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments;
        const p = points[i]!;
        if (theta < 1e-4) {
          p.copy(ua).multiplyScalar(radius);
        } else {
          // 球面線形補間で、2 本のベクトルの間をなめらかに結ぶ
          const s = Math.sin(theta);
          p.copy(ua)
            .multiplyScalar(Math.sin((1 - t) * theta) / s)
            .addScaledVector(ub, Math.sin(t * theta) / s)
            .normalize()
            .multiplyScalar(radius);
        }
      }
      polyline.set(points);
    },
    setColor: polyline.setColor,
    dispose: polyline.dispose,
  };
}

/* ---- 平行四辺形（a と b が張る面） ---- */

export interface Quad {
  object: THREE.Mesh;
  set(a: THREE.Vector3, b: THREE.Vector3, origin?: THREE.Vector3): void;
  setColor(color: string): void;
  setVisible(visible: boolean): void;
  dispose(): void;
}

export function createQuad(color: string, opacity = 0.16): Quad {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);

  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  const corner = new THREE.Vector3();

  return {
    object: mesh,
    set(a, b, origin = new THREE.Vector3()) {
      const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
      attr.setXYZ(0, origin.x, origin.y, origin.z);
      corner.copy(origin).add(a);
      attr.setXYZ(1, corner.x, corner.y, corner.z);
      corner.copy(origin).add(a).add(b);
      attr.setXYZ(2, corner.x, corner.y, corner.z);
      corner.copy(origin).add(b);
      attr.setXYZ(3, corner.x, corner.y, corner.z);
      attr.needsUpdate = true;
      geometry.computeBoundingSphere();
    },
    setColor(next) {
      material.color.set(next);
    },
    setVisible(visible) {
      mesh.visible = visible;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

/* ---- ライティング（題材となる立体に使う） ---- */

export function addStudioLights(scene: THREE.Scene): THREE.Light[] {
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(4, 6, 5);
  const fill = new THREE.HemisphereLight(0x9ad7ff, 0x1a1030, 0.9);
  scene.add(key, fill);
  return [key, fill];
}

/** 題材の立体に使う標準マテリアル。矢印とは違い、光の影響を受ける。 */
export function solidMaterial(color: string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.45,
    metalness: 0.05,
    ...options,
  });
}

/** 数値を等幅表示用に整える。 */
export function fmt(value: number, digits = 2): string {
  const fixed = value.toFixed(digits);
  // -0.00 を 0.00 に寄せる
  return fixed === `-${(0).toFixed(digits)}` ? (0).toFixed(digits) : fixed;
}

export function fmtVec(v: THREE.Vector3, digits = 2): string {
  return `(${fmt(v.x, digits)}, ${fmt(v.y, digits)}, ${fmt(v.z, digits)})`;
}
