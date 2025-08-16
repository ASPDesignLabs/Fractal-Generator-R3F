// src/utils/presets.ts
import type useStore from '../state/useStore';
import type { Transform } from '../types';

export interface ScenePresetV1 {
  version: 1;
  zoom: number;
  pan: [number, number];
  loopPeriod: number;
  iterationsBase: number;
  quality: string;
  fractalWeights: {
    mandelbrot: number;
    julia: number;
    burningShip: number;
    multibrot: number;
    phoenix: number;
  };
  juliaC: [number, number];
  multibrotPower: number;
  phoenixP: number;
  usePerTransformWeights: boolean;
  transforms: Transform[];
}

export interface ScenePresetV2 extends ScenePresetV1 {
  version: 2;
  renderMode: '2d' | '3d';
  loopMode: 'linear' | 'pingpong' | 'ease' | 'wavy';
}

export type ScenePreset = ScenePresetV1 | ScenePresetV2;

export interface MasterPreset {
  version: 1;
  master: ReturnType<typeof getMasterForExport>;
}

const getMasterForExport = (m: any) => ({
  exposure: m.exposure,
  gamma: m.gamma,
  contrast: m.contrast,
  saturation: m.saturation,
  hue: m.hue,
  vibrance: m.vibrance,
  vignette: m.vignette,
  vignetteSoftness: m.vignetteSoftness,
  caStrength: m.caStrength,
  grain: m.grain,
  posterize: m.posterize,
  pixelizeEnabled: m.pixelizeEnabled,
  pixelSize: m.pixelSize,
  rainbowEnabled: m.rainbowEnabled,
  rainbowStrength: m.rainbowStrength,
  rainbowSpeed: m.rainbowSpeed,
  rainbowScale: m.rainbowScale,
  warpEnabled: m.warpEnabled,
  warpAmount: m.warpAmount,
  warpFreq: m.warpFreq,
  glitchEnabled: m.glitchEnabled,
  glitchStrength: m.glitchStrength,
  glitchBlock: m.glitchBlock,
  glitchSpeed: m.glitchSpeed,
  glitchRGBSplit: m.glitchRGBSplit,
});

export const exportScenePreset = (
  getState: typeof useStore.getState
): ScenePresetV2 => {
  const s = getState();
  return {
    version: 2,
    renderMode: s.renderMode,
    loopMode: s.loopMode,
    zoom: s.zoom,
    pan: s.pan,
    loopPeriod: s.loopPeriod,
    iterationsBase: s.iterationsBase,
    quality: s.quality,
    fractalWeights: { ...s.fractalWeights },
    juliaC: s.juliaC,
    multibrotPower: s.multibrotPower,
    phoenixP: s.phoenixP,
    usePerTransformWeights: s.usePerTransformWeights,
    transforms: s.transforms,
  };
};

export const applyScenePreset = (
  setState: typeof useStore.setState,
  p: ScenePreset
) => {
  if (!p || (p.version !== 1 && p.version !== 2)) return;

  // Base (v1 + v2 common)
  setState({
    zoom: p.zoom,
    pan: p.pan,
    loopPeriod: p.loopPeriod,
    iterationsBase: p.iterationsBase,
    quality: p.quality as any,
    fractalWeights: { ...p.fractalWeights },
    juliaC: p.juliaC,
    multibrotPower: p.multibrotPower,
    phoenixP: p.phoenixP,
    usePerTransformWeights: p.usePerTransformWeights,
    transforms: p.transforms,
  });

  // v2 extras
  if (p.version === 2) {
    setState({
      renderMode: p.renderMode,
      loopMode: p.loopMode,
    });
  }
};

export const exportMasterPreset = (
  getState: typeof useStore.getState
): MasterPreset => {
  const m = getState().master;
  return { version: 1, master: getMasterForExport(m) };
};

export const applyMasterPreset = (
  setState: typeof useStore.setState,
  p: MasterPreset
) => {
  if (!p || p.version !== 1) return;
  setState((s) => ({ master: { ...s.master, ...p.master } }));
};

// Helpers for file and clipboard
export const downloadJSON = (obj: any, filename: string) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: 'application/json',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

export const readFileAsText = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsText(file);
  });
