// src/types.ts
export type TransformType =
  | 'translate'
  | 'rotate'
  | 'swirl'
  | 'sinbend'
  | 'star'
  | 'diamond'
  | 'heart'
  | 'explode'
  | 'mirrorX'
  | 'mirrorY';

export interface Transform {
  id: string;
  type: TransformType;
  pos: [number, number]; // normalized domain position
  weight: number; // spatial influence (0..1 typical)
  params: [number, number, number, number]; // extra params per transform
  color: [number, number, number]; // 0..1 RGB (UI + optional blend mod)
  // Per-transform fractal-set weights [M, J, BShip, Multibrot, Phoenix]
  setWeights: [number, number, number, number, number];
}

export type FractalSet =
  | 'mandelbrot'
  | 'julia'
  | 'burningship'
  | 'multibrot'
  | 'phoenix';
