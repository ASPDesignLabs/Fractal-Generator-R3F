// src/utils/transformTexture.ts
import * as THREE from 'three';
import type { Transform } from '../types';

// GPU layout: 5 RGBA texels per transform (texture width = 5, height = count)
// tex0: [typeId, weight, pos.x, pos.y]
// tex1: [p0, p1, p2, p3]
// tex2: [color.r, color.g, color.b, 0]
// tex3: [setW0, setW1, setW2, setW3]
// tex4: [setW4, 0, 0, 0]

const typeId = (t: Transform): number => {
  switch (t.type) {
    case 'translate':
      return 0;
    case 'rotate':
      return 1;
    case 'swirl':
      return 2;
    case 'sinbend':
      return 3;
    case 'star':
      return 4;
    case 'diamond':
      return 5;
    case 'heart':
      return 6;
    case 'explode':
      return 7;
    case 'mirrorX':
      return 8;
    case 'mirrorY':
      return 9;
    default:
      return 0;
  }
};

export const buildTransformTexture = (
  transforms: Transform[]
): THREE.DataTexture => {
  const count = transforms.length;
  const width = 5;
  const height = Math.max(1, count);
  const data = new Float32Array(width * height * 4);

  for (let i = 0; i < count; i++) {
    const t = transforms[i];
    const base = i * width * 4;

    // tex0
    data[base + 0] = typeId(t);
    data[base + 1] = t.weight;
    data[base + 2] = t.pos[0];
    data[base + 3] = t.pos[1];

    // tex1
    data[base + 4] = t.params[0];
    data[base + 5] = t.params[1];
    data[base + 6] = t.params[2];
    data[base + 7] = t.params[3];

    // tex2
    data[base + 8] = t.color[0];
    data[base + 9] = t.color[1];
    data[base + 10] = t.color[2];
    data[base + 11] = 0;

    // tex3
    data[base + 12] = t.setWeights[0];
    data[base + 13] = t.setWeights[1];
    data[base + 14] = t.setWeights[2];
    data[base + 15] = t.setWeights[3];

    // tex4
    data[base + 16] = t.setWeights[4];
    data[base + 17] = 0;
    data[base + 18] = 0;
    data[base + 19] = 0;
  }

  const tex = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  tex.needsUpdate = true;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
};
