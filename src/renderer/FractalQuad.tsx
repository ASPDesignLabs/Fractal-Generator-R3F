import React, { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../state/useStore';
import { buildTransformTexture } from '../utils/transformTexture';
import frag from '../shaders/fractal.frag';

const FractalQuad: React.FC = () => {
  const { size } = useThree();
  const {
    transforms,
    zoom,
    pan,
    loopPeriod,
    timeScale,
    iterationsBase,
    quality,
    fractalWeights,
    juliaC,
    multibrotPower,
    phoenixP,
    usePerTransformWeights,
    master,
  } = useStore();

  const uniforms = useMemo(
    () => ({
      uResolution: {
        value: new THREE.Vector2(size.width, size.height),
      },
      uTime: { value: 0 },
      uLoopPeriod: { value: loopPeriod },
      uZoom: { value: zoom },
      uPan: { value: new THREE.Vector2(pan[0], pan[1]) },
      uAspect: {
        value: size.width / Math.max(1, size.height),
      },
      uTransformTex: { value: buildTransformTexture(transforms) },
      uTransformCount: { value: transforms.length },
      uIterations: { value: iterationsBase },

      // Blend uniforms
      uFWeights: { value: new Float32Array(5) },
      uJuliaC: { value: new THREE.Vector2(juliaC[0], juliaC[1]) },
      uMultiPower: { value: multibrotPower },
      uPhoenixP: { value: phoenixP },
      uUsePerTransformWeights: { value: usePerTransformWeights ? 1 : 0 },

      // Master uniforms
      uMExposure: { value: master.exposure },
      uMGamma: { value: master.gamma },
      uMContrast: { value: master.contrast },
      uMSaturation: { value: master.saturation },
      uMHue: { value: master.hue },
      uMVibrance: { value: master.vibrance },
      uMVignette: { value: master.vignette },
      uMVignetteSoft: { value: master.vignetteSoftness },
      uMCAberration: { value: master.caStrength },
      uMGrain: { value: master.grain },
      uMPosterize: { value: master.posterize },
    }),
    [] // create once
  );

  // Size/aspect updates
  React.useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
    uniforms.uAspect.value = size.width / Math.max(1, size.height);
  }, [size, uniforms]);

  // Camera + loop
  React.useEffect(() => {
    uniforms.uZoom.value = zoom;
  }, [zoom, uniforms]);

  React.useEffect(() => {
    uniforms.uPan.value.set(pan[0], pan[1]);
  }, [pan, uniforms]);

  React.useEffect(() => {
    uniforms.uLoopPeriod.value = loopPeriod;
  }, [loopPeriod, uniforms]);

  // Transforms
  React.useEffect(() => {
    uniforms.uTransformTex.value = buildTransformTexture(transforms);
    uniforms.uTransformCount.value = transforms.length;
  }, [transforms, uniforms]);

  // Quality -> iterations
  React.useEffect(() => {
    const scaleMap: Record<string, number> = {
      '20%': 0.2,
      '50%': 0.5,
      '100%': 1.0,
      '200%': 2.0,
      '1000%': 10.0,
      '2000%': 20.0,
    };
    const scale = scaleMap[quality] ?? 1.0;
    uniforms.uIterations.value = Math.floor(iterationsBase * scale);
  }, [quality, iterationsBase, uniforms]);

  // Blend uniforms
  React.useEffect(() => {
    const arr = uniforms.uFWeights.value as Float32Array;
    arr[0] = fractalWeights.mandelbrot;
    arr[1] = fractalWeights.julia;
    arr[2] = fractalWeights.burningShip;
    arr[3] = fractalWeights.multibrot;
    arr[4] = fractalWeights.phoenix;
  }, [fractalWeights, uniforms]);

  React.useEffect(() => {
    uniforms.uJuliaC.value.set(juliaC[0], juliaC[1]);
  }, [juliaC, uniforms]);

  React.useEffect(() => {
    uniforms.uMultiPower.value = multibrotPower;
  }, [multibrotPower, uniforms]);

  React.useEffect(() => {
    uniforms.uPhoenixP.value = phoenixP;
  }, [phoenixP, uniforms]);

  React.useEffect(() => {
    uniforms.uUsePerTransformWeights.value = usePerTransformWeights ? 1 : 0;
  }, [usePerTransformWeights, uniforms]);

  // Master updates
  React.useEffect(() => {
    uniforms.uMExposure.value = master.exposure;
    uniforms.uMGamma.value = master.gamma;
    uniforms.uMContrast.value = master.contrast;
    uniforms.uMSaturation.value = master.saturation;
    uniforms.uMHue.value = master.hue;
    uniforms.uMVibrance.value = master.vibrance;
    uniforms.uMVignette.value = master.vignette;
    uniforms.uMVignetteSoft.value = master.vignetteSoftness;
    uniforms.uMCAberration.value = master.caStrength;
    uniforms.uMGrain.value = master.grain;
    uniforms.uMPosterize.value = master.posterize;
  }, [master, uniforms]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime() * timeScale;
  });

  const vertex = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  return (
    <shaderMaterial
      attach="material"
      vertexShader={vertex}
      fragmentShader={frag}
      uniforms={uniforms}
      transparent={false}
    />
  );
};

export default FractalQuad;
