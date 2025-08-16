// src/ui/MasterPanel.tsx
import React from 'react';
import useStore from '../state/useStore';
import PresetIO from './PresetIO';

const RowR: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="row" style={{ justifyContent: 'flex-end' }}>
    <div className="label" style={{ textAlign: 'right' }}>
      {label}
    </div>
    {children}
  </div>
);

const MasterPanel: React.FC = () => {
  const {
    master,
    setMaster,
    uiScale,
    setUiScale,
    usePerTransformWeights,
    setUsePerTransformWeights,
  } = useStore();

  return (
    <div className="ui ui-right">
      <div style={{ fontWeight: 700, marginBottom: 8, textAlign: 'right' }}>
        Master Shader
      </div>

      <PresetIO mode="master" />

      <RowR label="UI Scale">
        <input
          className="input"
          type="range"
          min={0.6}
          max={2}
          step={0.05}
          value={uiScale}
          onChange={(e) => setUiScale(parseFloat(e.target.value))}
        />
      </RowR>

      <RowR label="Per-transform weights">
        <input
          type="checkbox"
          checked={usePerTransformWeights}
          onChange={(e) => setUsePerTransformWeights(e.target.checked)}
          style={{ transform: 'translateY(1px)' }}
        />
      </RowR>

      <RowR label="Exposure">
        <input
          className="input"
          type="range"
          min={-2}
          max={2}
          step={0.01}
          value={master.exposure}
          onChange={(e) => setMaster({ exposure: parseFloat(e.target.value) })}
        />
      </RowR>
      <RowR label="Gamma">
        <input
          className="input"
          type="range"
          min={0.5}
          max={2.5}
          step={0.01}
          value={master.gamma}
          onChange={(e) => setMaster({ gamma: parseFloat(e.target.value) })}
        />
      </RowR>
      <RowR label="Contrast">
        <input
          className="input"
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={master.contrast}
          onChange={(e) => setMaster({ contrast: parseFloat(e.target.value) })}
        />
      </RowR>
      <RowR label="Saturation">
        <input
          className="input"
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={master.saturation}
          onChange={(e) =>
            setMaster({ saturation: parseFloat(e.target.value) })
          }
        />
      </RowR>
      <RowR label="Hue">
        <input
          className="input"
          type="range"
          min={-180}
          max={180}
          step={1}
          value={master.hue}
          onChange={(e) => setMaster({ hue: parseFloat(e.target.value) })}
        />
      </RowR>
      <RowR label="Vibrance">
        <input
          className="input"
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={master.vibrance}
          onChange={(e) =>
            setMaster({ vibrance: parseFloat(e.target.value) })
          }
        />
      </RowR>

      <RowR label="Vignette">
        <input
          className="input"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={master.vignette}
          onChange={(e) => setMaster({ vignette: parseFloat(e.target.value) })}
        />
      </RowR>
      <RowR label="Vignette Soft">
        <input
          className="input"
          type="range"
          min={0.1}
          max={1}
          step={0.01}
          value={master.vignetteSoftness}
          onChange={(e) =>
            setMaster({ vignetteSoftness: parseFloat(e.target.value) })
          }
        />
      </RowR>

      <RowR label="Chrom. Aber.">
        <input
          className="input"
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={master.caStrength}
          onChange={(e) =>
            setMaster({ caStrength: parseFloat(e.target.value) })
          }
        />
      </RowR>
      <RowR label="Grain">
        <input
          className="input"
          type="range"
          min={0}
          max={0.5}
          step={0.005}
          value={master.grain}
          onChange={(e) => setMaster({ grain: parseFloat(e.target.value) })}
        />
      </RowR>
      <RowR label="Posterize">
        <input
          className="input"
          type="range"
          min={0}
          max={32}
          step={1}
          value={master.posterize}
          onChange={(e) =>
            setMaster({ posterize: parseFloat(e.target.value) })
          }
        />
      </RowR>

      <hr
        style={{
          border: 'none',
          borderTop: '1px solid #333',
          margin: '10px 0',
        }}
      />

      <RowR label="Pixelize">
        <input
          type="checkbox"
          checked={master.pixelizeEnabled}
          onChange={(e) => setMaster({ pixelizeEnabled: e.target.checked })}
        />
        <input
          className="input"
          type="range"
          min={2}
          max={48}
          step={1}
          value={master.pixelSize}
          onChange={(e) => setMaster({ pixelSize: parseFloat(e.target.value) })}
        />
      </RowR>

      <RowR label="Rainbow">
        <input
          type="checkbox"
          checked={master.rainbowEnabled}
          onChange={(e) => setMaster({ rainbowEnabled: e.target.checked })}
        />
        <input
          className="input"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={master.rainbowStrength}
          onChange={(e) =>
            setMaster({ rainbowStrength: parseFloat(e.target.value) })
          }
        />
      </RowR>
      <RowR label="Rainbow Speed">
        <input
          className="input"
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={master.rainbowSpeed}
          onChange={(e) =>
            setMaster({ rainbowSpeed: parseFloat(e.target.value) })
          }
        />
      </RowR>
      <RowR label="Rainbow Scale">
        <input
          className="input"
          type="range"
          min={0.5}
          max={10}
          step={0.1}
          value={master.rainbowScale}
          onChange={(e) =>
            setMaster({ rainbowScale: parseFloat(e.target.value) })
          }
        />
      </RowR>

      <RowR label="Warp">
        <input
          type="checkbox"
          checked={master.warpEnabled}
          onChange={(e) => setMaster({ warpEnabled: e.target.checked })}
        />
        <input
          className="input"
          type="range"
          min={0}
          max={0.1}
          step={0.001}
          value={master.warpAmount}
          onChange={(e) =>
            setMaster({ warpAmount: parseFloat(e.target.value) })
          }
        />
      </RowR>
      <RowR label="Warp Freq">
        <input
          className="input"
          type="range"
          min={1}
          max={20}
          step={0.1}
          value={master.warpFreq}
          onChange={(e) =>
            setMaster({ warpFreq: parseFloat(e.target.value) })
          }
        />
      </RowR>

      <RowR label="Glitch">
        <input
          type="checkbox"
          checked={master.glitchEnabled}
          onChange={(e) => setMaster({ glitchEnabled: e.target.checked })}
        />
        <input
          className="input"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={master.glitchStrength}
          onChange={(e) =>
            setMaster({ glitchStrength: parseFloat(e.target.value) })
          }
        />
      </RowR>
      <RowR label="Glitch Block">
        <input
          className="input"
          type="range"
          min={8}
          max={64}
          step={1}
          value={master.glitchBlock}
          onChange={(e) =>
            setMaster({ glitchBlock: parseFloat(e.target.value) })
          }
        />
      </RowR>
      <RowR label="Glitch Speed">
        <input
          className="input"
          type="range"
          min={0}
          max={5}
          step={0.01}
          value={master.glitchSpeed}
          onChange={(e) =>
            setMaster({ glitchSpeed: parseFloat(e.target.value) })
          }
        />
      </RowR>
      <RowR label="RGB Split">
        <input
          className="input"
          type="range"
          min={0}
          max={0.02}
          step={0.0005}
          value={master.glitchRGBSplit}
          onChange={(e) =>
            setMaster({ glitchRGBSplit: parseFloat(e.target.value) })
          }
        />
      </RowR>
    </div>
  );
};

export default MasterPanel;
