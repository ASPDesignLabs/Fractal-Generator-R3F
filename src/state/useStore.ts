// src/state/useStore.ts
import { create } from 'zustand';
import { nanoid } from 'nanoid/non-secure';
import type { Transform } from '../types';

type Quality = '20%' | '50%' | '100%' | '200%' | '1000%' | '2000%';
type RenderMode = '2d' | '3d';
type LoopMode = 'linear' | 'pingpong' | 'ease' | 'wavy';

const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const randColor = (): [number, number, number] => [
  rand(0.2, 1.0),
  rand(0.2, 1.0),
  rand(0.2, 1.0),
];

export interface MasterSettings {
  exposure: number;
  gamma: number;
  contrast: number;
  saturation: number;
  hue: number;
  vibrance: number;
  vignette: number;
  vignetteSoftness: number;
  caStrength: number;
  grain: number;
  posterize: number;

  pixelizeEnabled: boolean;
  pixelSize: number;

  rainbowEnabled: boolean;
  rainbowStrength: number;
  rainbowSpeed: number;
  rainbowScale: number;

  warpEnabled: boolean;
  warpAmount: number;
  warpFreq: number;

  glitchEnabled: boolean;
  glitchStrength: number;
  glitchBlock: number;
  glitchSpeed: number;
  glitchRGBSplit: number;
}

interface Store {
  // UI
  uiVisible: boolean;
  uiScale: number;
  setUiVisible: (v: boolean) => void;
  setUiScale: (s: number) => void;

  // Canvas size
  width: number;
  height: number;
  setSize: (w: number, h: number) => void;

  // Camera / View
  zoom: number;
  pan: [number, number];
  setZoom: (z: number) => void;
  setPan: (p: [number, number]) => void;

  // Time / Loop
  loopPeriod: number;
  timeScale: number;
  loopMode: LoopMode;
  setLoopMode: (m: LoopMode) => void;

  // Quality
  iterationsBase: number;
  quality: Quality;
  setQuality: (q: Quality) => void;

  // Render mode (2D or 3D)
  renderMode: RenderMode;
  setRenderMode: (m: RenderMode) => void;

  // Fractal blend controls (2D pass uses them; 3D ignores)
  fractalWeights: {
    mandelbrot: number;
    julia: number;
    burningShip: number;
    multibrot: number;
    phoenix: number;
  };
  setFractalWeight: (k: keyof Store['fractalWeights'], v: number) => void;

  juliaC: [number, number];
  setJuliaC: (c: [number, number]) => void;

  multibrotPower: number;
  setMultibrotPower: (p: number) => void;

  phoenixP: number;
  setPhoenixP: (p: number) => void;

  usePerTransformWeights: boolean;
  setUsePerTransformWeights: (v: boolean) => void;

  // Transforms
  transforms: Transform[];
  addTransform: (t?: Partial<Transform>) => void;
  updateTransform: (id: string, t: Partial<Transform>) => void;
  removeTransform: (id: string) => void;

  draggingId: string | null;
  setDragging: (id: string | null) => void;

  // Master post settings
  master: MasterSettings;
  setMaster: (m: Partial<MasterSettings>) => void;
}

const initialTransforms: Transform[] = [
  {
    id: 't1',
    type: 'swirl',
    pos: [-0.3, 0.1],
    weight: 0.6,
    params: [2.0, 0, 0, 0],
    color: [0.9, 0.3, 0.35],
    setWeights: [1, 0.2, 0.0, 0.0, 0.1],
  },
  {
    id: 't2',
    type: 'sinbend',
    pos: [0.35, -0.2],
    weight: 0.35,
    params: [3.0, 0.15, 0, 0],
    color: [0.3, 0.8, 0.9],
    setWeights: [0.6, 0.4, 0.2, 0.3, 0.0],
  },
];

const useStore = create<Store>((set, get) => ({
  // UI
  uiVisible: true,
  uiScale: 1.0,
  setUiVisible: (v) => set({ uiVisible: v }),
  setUiScale: (s) => set({ uiScale: Math.max(0.6, Math.min(2, s)) }),

  // Size
  width: window.innerWidth,
  height: window.innerHeight,
  setSize: (w, h) => set({ width: w, height: h }),

  // View
  zoom: 1.0,
  pan: [0, 0],
  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(8, z)) }),
  setPan: (p) => set({ pan: p }),

  // Time / Loop
  loopPeriod: 8.0,
  timeScale: 1.0,
  loopMode: 'linear',
  setLoopMode: (m) => set({ loopMode: m }),

  // Quality
  iterationsBase: 140,
  quality: '100%',
  setQuality: (q) => set({ quality: q }),

  // Render mode
  renderMode: '2d',
  setRenderMode: (m) => set({ renderMode: m }),

  // Fractal blends (2D)
  fractalWeights: {
    mandelbrot: 1.0,
    julia: 0.0,
    burningShip: 0.0,
    multibrot: 0.0,
    phoenix: 0.0,
  },
  setFractalWeight: (k, v) =>
    set({
      fractalWeights: { ...get().fractalWeights, [k]: Math.max(0, v) },
    }),

  juliaC: [-0.73, 0.19],
  setJuliaC: (c) => set({ juliaC: c }),

  multibrotPower: 3.0,
  setMultibrotPower: (p) => set({ multibrotPower: Math.max(1, p) }),

  phoenixP: -0.5,
  setPhoenixP: (p) => set({ phoenixP: p }),

  usePerTransformWeights: true,
  setUsePerTransformWeights: (v) => set({ usePerTransformWeights: v }),

  // Transforms
  transforms: initialTransforms,
  addTransform: (t) =>
    set({
      transforms: [
        ...get().transforms,
        {
          id: t?.id ?? nanoid(),
          type:
            t?.type ??
            'translate', // 'translate' | 'rotate' | 'swirl' | 'sinbend' | 'star' | 'diamond' | 'heart' | 'explode' | 'mirrorX' | 'mirrorY'
          pos: t?.pos ?? [0, 0],
          weight: t?.weight ?? 0.25,
          params: t?.params ?? [0, 0, 0, 0],
          color: t?.color ?? randColor(),
          setWeights: t?.setWeights ?? [1, 0, 0, 0, 0],
        },
      ],
    }),
  updateTransform: (id, t) =>
    set({
      transforms: get().transforms.map((x) =>
        x.id === id ? { ...x, ...t } : x
      ),
    }),
  removeTransform: (id) =>
    set({ transforms: get().transforms.filter((x) => x.id !== id) }),

  draggingId: null,
  setDragging: (id) => set({ draggingId: id }),

  // Master settings
  master: {
    exposure: 0.0,
    gamma: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    hue: 0.0,
    vibrance: 1.0,
    vignette: 0.35,
    vignetteSoftness: 0.6,
    caStrength: 0.0,
    grain: 0.05,
    posterize: 0.0,

    pixelizeEnabled: false,
    pixelSize: 6.0,

    rainbowEnabled: false,
    rainbowStrength: 0.4,
    rainbowSpeed: 0.2,
    rainbowScale: 2.0,

    warpEnabled: false,
    warpAmount: 0.03,
    warpFreq: 5.0,

    glitchEnabled: false,
    glitchStrength: 0.25,
    glitchBlock: 24.0,
    glitchSpeed: 1.0,
    glitchRGBSplit: 0.004,
  },
  setMaster: (m) => set({ master: { ...get().master, ...m } }),
}));

export default useStore;
