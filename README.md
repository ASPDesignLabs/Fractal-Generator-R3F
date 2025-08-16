Fractal Studio (React + Three.js + GLSL)


Full-screen, modular fractal art generator with a two-pass render pipeline, transform-based domain warping, UI overlays, presets, 2D and 3D modes, and post effects (pixelize, rainbow sweep, warp, glitch, CA, film grain, posterize, etc).


- React + Vite + TypeScript
- Three.js via React Three Fiber
- Two-pass pipeline: fractal offscreen -> master post pass on screen
- 2D fractal blend: Mandelbrot, Julia, Burning Ship, Multibrot, Phoenix
- 3D fractal blend: Bulb, Julia Bulb, Mandelbox, Menger, Sierpinski
- Interactive transforms with draggable handles and grid overlay
- Per-transform set weights and colors
- Presets: independent Scene and Master export/import (file or clipboard)
- UI DPI scaling; toggle UI with "~"
- Mouse wheel zoom (toward cursor), Alt + drag for panning

Quick Start (Windows 11)

1. Install Node.js (LTS 18+ or 20+ recommended)

- With nvm-windows:

	nvm install 20.11.1
	nvm use 20.11.1


1. Clone and install

	git clone https://github.com/ASPDesignLabs/Fractal-Generator-R3F
	cd fractal-studio
	npm install


1. Start dev server

	npm run dev
	# Open http://localhost:5173


1. Build for production

	npm run build
	npm run preview


Requirements

- Node.js 18+ (or 20+)
- npm (or pnpm/yarn)
- Git (optional, for version control)
- Windows 11 tested; macOS/Linux should work similarly

Project Structure

	src/
	  App.tsx
	  main.tsx
	  styles.css
	  types.ts
	
	  state/
	    useStore.ts              # Global state (Zustand)
	
	  renderer/
	    Canvas3D.tsx             # R3F <Canvas>, wheel zoom, size handling
	    pipeline/
	      RenderPipeline.tsx     # Two-pass: offscreen fractal, screen master
	
	  shaders/
	    fractal.frag             # 2D fractal renderer
	    fractal3d.frag           # 3D fractal (raymarch) renderer
	    master.frag              # Post-processing pass
	    raymarch.glsl            # (helpers for DE raymarching if used)
	
	  ui/
	    ControlPanel.tsx         # Left panel: scene controls
	    MasterPanel.tsx          # Right panel: post controls
	    TransformEditor.tsx      # Drag handles + grid
	    ModeToggle.tsx           # 2D/3D switch
	    PresetIO.tsx             # Import/Export/Copy/Paste JSON
	
	  utils/
	    transformTexture.ts      # Packs transforms into a DataTexture (GPU)
	    presets.ts               # Import/export helpers
	    mapCoords.ts, clamp.ts   # Small utilities

Dev Environment Notes


This project imports GLSL shaders as modules. Ensure vite.config.ts includes the GLSL plugin:


	// vite.config.ts
	import { defineConfig } from 'vite';
	import react from '@vitejs/plugin-react';
	import glsl from 'vite-plugin-glsl';
	
	export default defineConfig({
	  plugins: [react(), glsl()],
	});

Prettier formatting (optional but recommended):


	{
	  "printWidth": 80,
	  "singleQuote": true,
	  "trailingComma": "es5",
	  "semi": true
	}

Controls

- "~" toggles all UI
- Mouse wheel: zoom toward cursor
- Alt + drag: pan the view
- Drag transform dots to move them; grid appears while dragging
- Quality dropdown: 20%, 50%, 100%, 200%, 1000%, 2000%
	- Warning: values > 100% can be heavy

Panels Overview


Left: Scene (Fractal) Panel


- Mode: 2D or 3D (button toggle)
- Zoom / Pan
- Loop Mode (Linear, Ping-Pong, Ease In-Out, Wavy)
- Loop Period
- Quality
- Fractal Sets (blend sliders)
	- 2D: Mandelbrot, Julia, Burning Ship, Multibrot, Phoenix
	- 3D: Bulb, Julia Bulb, Mandelbox, Menger, Sierpinski
- Julia C (Cx, Cy)
- Power (Multibrot in 2D, Bulb power in 3D)
- Phoenix P (2D only)
- Transforms:
	- Types: translate, rotate, swirl, sinbend, star, diamond, heart, explode, mirrorX, mirrorY
	- Per-transform: weight, color, and per-set weights
- Presets: Scene export/import/copy/paste
Right: Master (Post) Panel


- UI Scale (DPI)
- Per-transform weights toggle (for 2D spatial blending; harmless in 3D)
- Exposure, Gamma, Contrast, Saturation, Hue, Vibrance
- Vignette and Softness
- Chromatic Aberration, Grain, Posterize
- Pixelize (enable + pixel size)
- Rainbow (enable + strength/speed/scale)
- Warp (enable + amount/frequency)
- Glitch (enable + strength/block/ speed/RGB split)
- Presets: Master export/import/copy/paste

2D vs 3D

- 2D: Full-screen domain-warped complex iteration with orbit-trap coloring.
	- Blends across 5 sets via uFWeights, and can modulate per-transform locality.
- 3D: Raymarched Distance-Estimator fractals.
	- Blends across 5 sets (Bulb, Julia Bulb, Mandelbox, Menger, Sierpinski).
	- 2D transforms are applied to the XY domain before evaluating 3D DEs.
	- Heavier than 2D; reduce Quality or disable costly effects if performance dips.

Saving and Loading

- Scene Preset: Saves camera/loop/quality/sets/transforms. Independent of Master.
- Master Preset: Saves post-processing options only.
- Use Export/Import buttons for files, or Copy/Paste to/from clipboard.

Known Issues & Troubleshooting

- 


Vite “crypto.hash is not a function”


	- Pin to Vite 5.3.x or disable optimizeDeps:

	export default defineConfig({
	  plugins: [react(), glsl()],
	  // optimizeDeps: { disabled: true }
	});



	- Ensure Node 18.20+ or 20.11+.
- 
TypeScript “does not provide an export named …” for types


	- Use type-only imports:

	import type { Transform } from '../types';



- 
Black screen after two-pass change


	- Ensure the master pass samples using vUv (not gl_FragCoord alone).
	- Ensure the render target is DPR-sized and uResolution matches it (handled in the pipeline provided).
	- Temporarily set master.frag main to output a gradient to verify pass:

	gl_FragColor = vec4(vUv, 0.0, 1.0);



- 
Shader compile errors


	- Check console for “THREE.WebGLShader: Shader Error”.
	- The shaders are GLSL ES 1.00 compatible (WebGL 1) and avoid glslify pragmas.
	- If using a custom plugin setup, ensure vite-plugin-glsl is active.

Performance Tips

- 3D mode is heavier. Start with:
	- Quality 50% or 100%
	- Disable glitch/CA/pixelize if FPS is low
	- Reduce Bulb power iterations by lowering Quality
- 2D at 1000% or 2000% can be very heavy; increase gradually.

Scripts

	{
	  "scripts": {
	    "dev": "vite",
	    "build": "vite build",
	    "preview": "vite preview"
	  }
	}

License


MIT (or your preferred license)

Credits & References

- React Three Fiber, Drei — pmndrs
- Inigo Quilez — palettes and raymarching best practices
- Various DE approximations (Mandelbulb, Mandelbox, Menger, Sierpinski) adapted for brevity in GLSL ES 1.00
Enjoy creating fractal art in 2D and 3D!
