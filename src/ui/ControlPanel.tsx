// src/ui/ControlPanel.tsx
import React from 'react';
import useStore from '../state/useStore';
import PresetIO from './PresetIO';
import ModeToggle from './ModeToggle';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const ControlPanel: React.FC = () => {
  const {
    zoom,
    setZoom,
    pan,
    setPan,
    loopMode,
    setLoopMode,
    loopPeriod,
    quality,
    setQuality,
    transforms,
    addTransform,
    removeTransform,
    updateTransform,

    fractalWeights,
    setFractalWeight,
    juliaC,
    setJuliaC,
    multibrotPower,
    setMultibrotPower,
    phoenixP,
    setPhoenixP,

    renderMode,
  } = useStore();

  const qualityOptions = ['20%', '50%', '100%', '200%', '1000%', '2000%'];
  const warn =
    quality === '200%' || quality === '1000%' || quality === '2000%';

  // Keys remain the same in state; in 3D they map to different sets:
  // 2D: [Mandelbrot, Julia, Burning Ship, Multibrot, Phoenix]
  // 3D: [Bulb, Julia Bulb, Mandelbox, Menger, Sierpinski]
  const weightKeys = [
    'mandelbrot',
    'julia',
    'burningShip',
    'multibrot',
    'phoenix',
  ] as const;

  const labels2D = [
    'Mandelbrot',
    'Julia',
    'Burning Ship',
    'Multibrot',
    'Phoenix',
  ];
  const labels3D = [
    'Bulb',
    'Julia Bulb',
    'Mandelbox',
    'Menger',
    'Sierpinski',
  ];

  const labels = renderMode === '3d' ? labels3D : labels2D;

  const sumW =
    fractalWeights.mandelbrot +
      fractalWeights.julia +
      fractalWeights.burningShip +
      fractalWeights.multibrot +
      fractalWeights.phoenix || 1;

  return (
    <div className="ui ui-left">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Fractal Studio</div>

      <PresetIO mode="scene" />

      {/* Mode toggle (2D / 3D) */}
      <ModeToggle />

      <div className="row">
        <div className="label">Zoom</div>
        <input
          className="input"
          type="range"
          min={0.1}
          max={6}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
        />
      </div>

      <div className="row">
        <div className="label">Pan X</div>
        <input
          className="input"
          type="range"
          min={-1.5}
          max={1.5}
          step={0.001}
          value={pan[0]}
          onChange={(e) =>
            setPan([parseFloat(e.target.value), pan[1]])
          }
        />
      </div>
      <div className="row">
        <div className="label">Pan Y</div>
        <input
          className="input"
          type="range"
          min={-1.5}
          max={1.5}
          step={0.001}
          value={pan[1]}
          onChange={(e) =>
            setPan([pan[0], parseFloat(e.target.value)])
          }
        />
      </div>

      {/* Loop Mode selector (above Loop Period) */}
      <div className="row">
        <div className="label">Loop Mode</div>
        <select
          className="input"
          value={loopMode}
          onChange={(e) => setLoopMode(e.target.value as any)}
        >
          <option value="linear">Linear (default)</option>
          <option value="pingpong">Ping-Pong (triangle)</option>
          <option value="ease">Ease In-Out</option>
          <option value="wavy">Wavy (phase wobble)</option>
        </select>
      </div>

      <div className="row">
        <div className="label">Loop Period</div>
        <input
          className="input"
          type="range"
          min={2}
          max={20}
          step={0.1}
          value={loopPeriod}
          onChange={(e) =>
            useStore.setState({ loopPeriod: parseFloat(e.target.value) })
          }
        />
      </div>

      <div className="row">
        <div className="label">Quality</div>
        <select
          className="input"
          value={quality}
          onChange={(e) => setQuality(e.target.value as any)}
        >
          {qualityOptions.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </div>
      {warn && (
        <div className="warn">
          Warning: Values over 100% can cause performance issues.
        </div>
      )}

      <div style={{ marginTop: 12, fontWeight: 700 }}>
        {renderMode === '3d'
          ? '3D Sets (Blend)'
          : 'Fractal Sets (Blend)'}
      </div>

      {weightKeys.map((k, i) => (
        <div key={k} className="row">
          <div className="label">{labels[i]}</div>
          <input
            className="input"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={fractalWeights[k]}
            onChange={(e) =>
              setFractalWeight(k, clamp01(parseFloat(e.target.value)))
            }
          />
          <div style={{ width: 40, textAlign: 'right' }}>
            {Math.round(
              ((fractalWeights[k] || 0) / sumW) * 100
            )}
            %
          </div>
        </div>
      ))}

      {/* These params are reused in 3D for Bulb/Julia Bulb */}
      <div className="row">
        <div className="label">Julia Cx</div>
        <input
          className="input"
          type="range"
          min={-1.5}
          max={1.5}
          step={0.001}
          value={juliaC[0]}
          onChange={(e) =>
            setJuliaC([parseFloat(e.target.value), juliaC[1]])
          }
        />
      </div>
      <div className="row">
        <div className="label">Julia Cy</div>
        <input
          className="input"
          type="range"
          min={-1.5}
          max={1.5}
          step={0.001}
          value={juliaC[1]}
          onChange={(e) =>
            setJuliaC([juliaC[0], parseFloat(e.target.value)])
          }
        />
      </div>

      <div className="row">
        <div className="label">
          {renderMode === '3d' ? 'Bulb Power' : 'Multibrot Power'}
        </div>
        <input
          className="input"
          type="range"
          min={2}
          max={10}
          step={0.1}
          value={multibrotPower}
          onChange={(e) => setMultibrotPower(parseFloat(e.target.value))}
        />
      </div>

      {/* Phoenix P is not used in 3D; keep visible for 2D */}
      {renderMode === '2d' && (
        <div className="row">
          <div className="label">Phoenix P</div>
          <input
            className="input"
            type="range"
            min={-1.5}
            max={1.5}
            step={0.01}
            value={phoenixP}
            onChange={(e) => setPhoenixP(parseFloat(e.target.value))}
          />
        </div>
      )}

      <div style={{ marginTop: 8, fontWeight: 700 }}>Transforms</div>
      {transforms.map((t) => (
        <details
          key={t.id}
          className="row"
          style={{
            alignItems: 'stretch',
            gap: 6,
            borderBottom: '1px solid #333',
            paddingBottom: 8,
            width: '100%',
          }}
        >
          <summary style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              title="Color"
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                background: `rgb(${Math.round(
                  t.color[0] * 255
                )}, ${Math.round(t.color[1] * 255)}, ${Math.round(
                  t.color[2] * 255
                )})`,
                border: '1px solid #222',
              }}
            />
            <select
              value={t.type}
              onChange={(e) =>
                updateTransform(t.id, { type: e.target.value as any })
              }
            >
              <option value="translate">translate</option>
              <option value="rotate">rotate</option>
              <option value="swirl">swirl</option>
              <option value="sinbend">sinbend</option>
              <option value="star">star</option>
              <option value="diamond">diamond</option>
              <option value="heart">heart</option>
              <option value="explode">explode</option>
              <option value="mirrorX">mirrorX</option>
              <option value="mirrorY">mirrorY</option>
            </select>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={t.weight}
              onChange={(e) =>
                updateTransform(t.id, { weight: parseFloat(e.target.value) })
              }
            />
            <button
              className="button"
              onClick={() =>
                updateTransform(t.id, {
                  color: [Math.random(), Math.random(), Math.random()],
                })
              }
              title="Randomize color"
            >
              🎲
            </button>
            <button
              className="button"
              onClick={() => removeTransform(t.id)}
              title="Remove"
            >
              ✕
            </button>
          </summary>

          <div style={{ width: '100%' }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              Per-transform set weights (influence local blend)
              {renderMode === '3d' ? ' (Bulb/Julia/Mandelbox/Menger/Sierpinski)' : ''}
            </div>
            {['M', 'J', 'B', 'Mb', 'P'].map((label, idx) => (
              <div key={idx} className="row">
                <div className="label">{labels[idx]}</div>
                <input
                  className="input"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={t.setWeights[idx as 0 | 1 | 2 | 3 | 4]}
                  onChange={(e) => {
                    const w = [...t.setWeights] as [
                      number,
                      number,
                      number,
                      number,
                      number
                    ];
                    w[idx as 0 | 1 | 2 | 3 | 4] = clamp01(
                      parseFloat(e.target.value)
                    );
                    updateTransform(t.id, { setWeights: w });
                  }}
                />
              </div>
            ))}
          </div>
        </details>
      ))}

      <div className="row">
        <button className="button" onClick={() => addTransform()}>
          + Add Transform
        </button>
      </div>

      <div className="row" style={{ fontSize: 12 }}>
        Press "~" to toggle UI. Mouse wheel = zoom. Alt + drag = pan.
      </div>
    </div>
  );
};

export default ControlPanel;
