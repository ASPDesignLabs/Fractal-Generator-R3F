// src/renderer/pipeline/RenderPipeline.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../state/useStore';
import { buildTransformTexture } from '../../utils/transformTexture';
import fractalFrag2D from '../../shaders/fractal.frag';
import fractalFrag3D from '../../shaders/fractal3d.frag';
import masterFrag from '../../shaders/master.frag';

const RenderPipeline: React.FC = () => {
  const { gl, size } = useThree();

  const {
    // fractal state
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
    renderMode,
    loopMode,
    // master state
    master,
  } = useStore();

  const getRTDims = () => {
    const dpr = gl.getPixelRatio();
    const w = Math.max(1, Math.floor(size.width * dpr));
    const h = Math.max(1, Math.floor(size.height * dpr));
    return { w, h };
  };

  const { w: initW, h: initH } = getRTDims();

  // Offscreen target at DPR resolution
  const target = useMemo(() => {
    const pars: THREE.WebGLRenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    };
    return new THREE.WebGLRenderTarget(initW, initH, pars);
  }, [initW, initH]);

  useEffect(() => {
    const { w, h } = getRTDims();
    target.setSize(w, h);
  }, [size, gl, target]);

  // Fractal scene (offscreen quad in clip-space)
  const sceneFractal = useMemo(() => new THREE.Scene(), []);
  const quadGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const fullScreenVSClip = `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  // Shared fractal uniforms (2D shader will use more of them than 3D)
  const fractalUniforms = useMemo(() => {
    const { w, h } = getRTDims();
    return {
      uResolution: { value: new THREE.Vector2(w, h) },
      uTime: { value: 0 }, // will be set to phase*period
      uLoopPeriod: { value: loopPeriod },
      uZoom: { value: zoom },
      uPan: { value: new THREE.Vector2(pan[0], pan[1]) },
      uAspect: { value: w / Math.max(1, h) },
      uTransformTex: { value: buildTransformTexture(transforms) },
      uTransformCount: { value: transforms.length },
      uIterations: { value: iterationsBase },

      // 2D-only blend uniforms (harmless if unused by 3D shader)
      uFWeights: { value: new Float32Array(5) },
      uJuliaC: { value: new THREE.Vector2(juliaC[0], juliaC[1]) },
      uMultiPower: { value: multibrotPower },
      uPhoenixP: { value: phoenixP },
      uUsePerTransformWeights: { value: usePerTransformWeights ? 1 : 0 },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // create once

  // Fractal mesh + material; rebuild when renderMode changes
  const fractalMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    // Dispose previous
    if (fractalMeshRef.current) {
      sceneFractal.remove(fractalMeshRef.current);
      fractalMeshRef.current.geometry.dispose();
      (
        fractalMeshRef.current.material as THREE.ShaderMaterial
      ).dispose();
      fractalMeshRef.current = null;
    }

    const fragmentShader =
      renderMode === '3d' ? fractalFrag3D : fractalFrag2D;

    const mat = new THREE.ShaderMaterial({
      vertexShader: fullScreenVSClip,
      fragmentShader,
      uniforms: fractalUniforms,
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(quadGeo, mat);
    mesh.frustumCulled = false;
    sceneFractal.add(mesh);
    fractalMeshRef.current = mesh;

    return () => {
      if (fractalMeshRef.current === mesh) {
        sceneFractal.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
        fractalMeshRef.current = null;
      }
    };
  }, [renderMode, sceneFractal, quadGeo, fractalUniforms]);

  // Master material shown as part of the main R3F scene
  const masterUniforms = useMemo(() => {
    const { w, h } = getRTDims();
    return {
      uInputTex: { value: target.texture },
      uResolution: { value: new THREE.Vector2(w, h) },
      uTime: { value: 0 }, // real elapsed * timeScale (not loop-shaped)

      uExposure: { value: master.exposure },
      uGamma: { value: master.gamma },
      uContrast: { value: master.contrast },
      uSaturation: { value: master.saturation },
      uHue: { value: master.hue },
      uVibrance: { value: master.vibrance },

      uVignette: { value: master.vignette },
      uVignetteSoft: { value: master.vignetteSoftness },
      uCA: { value: master.caStrength },
      uGrain: { value: master.grain },
      uPosterize: { value: master.posterize },

      uPixelizeEnabled: { value: master.pixelizeEnabled ? 1 : 0 },
      uPixelSize: { value: master.pixelSize },

      uRainbowEnabled: { value: master.rainbowEnabled ? 1 : 0 },
      uRainbowStrength: { value: master.rainbowStrength },
      uRainbowSpeed: { value: master.rainbowSpeed },
      uRainbowScale: { value: master.rainbowScale },

      uWarpEnabled: { value: master.warpEnabled ? 1 : 0 },
      uWarpAmount: { value: master.warpAmount },
      uWarpFreq: { value: master.warpFreq },

      uGlitchEnabled: { value: master.glitchEnabled ? 1 : 0 },
      uGlitchStrength: { value: master.glitchStrength },
      uGlitchBlock: { value: master.glitchBlock },
      uGlitchSpeed: { value: master.glitchSpeed },
      uGlitchRGBSplit: { value: master.glitchRGBSplit },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // create once

  // Present master quad in the main R3F scene
  const fullScreenVSClipMat = fullScreenVSClip;

  // React to size/DPR changes
  useEffect(() => {
    const { w, h } = getRTDims();
    target.setSize(w, h);
    fractalUniforms.uResolution.value.set(w, h);
    fractalUniforms.uAspect.value = w / Math.max(1, h);
    masterUniforms.uResolution.value.set(w, h);
  }, [size, gl, target, fractalUniforms, masterUniforms]);

  // Bind fractal state -> uniforms
  useEffect(() => {
    fractalUniforms.uZoom.value = zoom;
  }, [zoom, fractalUniforms]);
  useEffect(() => {
    fractalUniforms.uPan.value.set(pan[0], pan[1]);
  }, [pan, fractalUniforms]);
  useEffect(() => {
    fractalUniforms.uLoopPeriod.value = loopPeriod;
  }, [loopPeriod, fractalUniforms]);
  useEffect(() => {
    fractalUniforms.uTransformTex.value = buildTransformTexture(transforms);
    fractalUniforms.uTransformCount.value = transforms.length;
  }, [transforms, fractalUniforms]);
  useEffect(() => {
    const scaleMap: Record<string, number> = {
      '20%': 0.2,
      '50%': 0.5,
      '100%': 1.0,
      '200%': 2.0,
      '1000%': 10.0,
      '2000%': 20.0,
    };
    fractalUniforms.uIterations.value = Math.floor(
      iterationsBase * (scaleMap[quality] ?? 1)
    );
  }, [quality, iterationsBase, fractalUniforms]);
  useEffect(() => {
    const arr = fractalUniforms.uFWeights.value as Float32Array;
    arr[0] = fractalWeights.mandelbrot;
    arr[1] = fractalWeights.julia;
    arr[2] = fractalWeights.burningShip;
    arr[3] = fractalWeights.multibrot;
    arr[4] = fractalWeights.phoenix;
  }, [fractalWeights, fractalUniforms]);
  useEffect(() => {
    fractalUniforms.uJuliaC.value.set(juliaC[0], juliaC[1]);
  }, [juliaC, fractalUniforms]);
  useEffect(() => {
    fractalUniforms.uMultiPower.value = multibrotPower;
  }, [multibrotPower, fractalUniforms]);
  useEffect(() => {
    fractalUniforms.uPhoenixP.value = phoenixP;
  }, [phoenixP, fractalUniforms]);
  useEffect(() => {
    fractalUniforms.uUsePerTransformWeights.value = usePerTransformWeights
      ? 1
      : 0;
  }, [usePerTransformWeights, fractalUniforms]);

  // Bind master state -> uniforms
  useEffect(() => {
    masterUniforms.uExposure.value = master.exposure;
    masterUniforms.uGamma.value = master.gamma;
    masterUniforms.uContrast.value = master.contrast;
    masterUniforms.uSaturation.value = master.saturation;
    masterUniforms.uHue.value = master.hue;
    masterUniforms.uVibrance.value = master.vibrance;
    masterUniforms.uVignette.value = master.vignette;
    masterUniforms.uVignetteSoft.value = master.vignetteSoftness;
    masterUniforms.uCA.value = master.caStrength;
    masterUniforms.uGrain.value = master.grain;
    masterUniforms.uPosterize.value = master.posterize;

    masterUniforms.uPixelizeEnabled.value = master.pixelizeEnabled ? 1 : 0;
    masterUniforms.uPixelSize.value = master.pixelSize;

    masterUniforms.uRainbowEnabled.value = master.rainbowEnabled ? 1 : 0;
    masterUniforms.uRainbowStrength.value = master.rainbowStrength;
    masterUniforms.uRainbowSpeed.value = master.rainbowSpeed;
    masterUniforms.uRainbowScale.value = master.rainbowScale;

    masterUniforms.uWarpEnabled.value = master.warpEnabled ? 1 : 0;
    masterUniforms.uWarpAmount.value = master.warpAmount;
    masterUniforms.uWarpFreq.value = master.warpFreq;

    masterUniforms.uGlitchEnabled.value = master.glitchEnabled ? 1 : 0;
    masterUniforms.uGlitchStrength.value = master.glitchStrength;
    masterUniforms.uGlitchBlock.value = master.glitchBlock;
    masterUniforms.uGlitchSpeed.value = master.glitchSpeed;
    masterUniforms.uGlitchRGBSplit.value = master.glitchRGBSplit;
  }, [master, masterUniforms]);

  // Compute loop phase based on selected loopMode
  const phaseFromLoop = (
    elapsed: number,
    period: number,
    mode: 'linear' | 'pingpong' | 'ease' | 'wavy'
  ) => {
    const p = (elapsed / Math.max(0.001, period)) % 1;
    if (mode === 'linear') return p;
    if (mode === 'pingpong') return 1 - Math.abs(2 * p - 1); // triangle
    if (mode === 'ease') return p * p * (3 - 2 * p); // smoothstep
    // wavy: phase with slight sinusoidal wobble
    return (p + 0.1 * Math.sin(2 * Math.PI * p)) % 1;
  };

  // Offscreen render each frame; R3F will present the master quad automatically
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime() * timeScale;

    // Fractal time shaped by loop mode (so loopT() in shader=phase)
    const phase = phaseFromLoop(elapsed, loopPeriod, loopMode);
    fractalUniforms.uTime.value = phase * loopPeriod;

    // Master post uses real elapsed time for effects
    masterUniforms.uTime.value = elapsed;

    gl.setRenderTarget(target);
    gl.clear(true, false, false);
    // Render full-screen quad in our offscreen scene
    const dummyCamera = new THREE.Camera();
    gl.render(sceneFractal, dummyCamera);
    gl.setRenderTarget(null);
  });

  // Present master quad
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={fullScreenVSClipMat}
        fragmentShader={masterFrag}
        uniforms={masterUniforms}
        depthTest={false}
        depthWrite={false}
        transparent={false}
      />
    </mesh>
  );
};

export default RenderPipeline;
