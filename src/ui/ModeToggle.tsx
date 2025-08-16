// src/ui/ModeToggle.tsx
import React from 'react';
import useStore from '../state/useStore';

const ModeToggle: React.FC = () => {
  // Expect these to exist in useStore:
  // renderMode: '2d' | '3d'
  // setRenderMode: (m: '2d' | '3d') => void
  const renderMode = useStore((s) => (s as any).renderMode) as
    | '2d'
    | '3d';
  const setRenderMode = useStore(
    (s) => (s as any).setRenderMode
  ) as (m: '2d' | '3d') => void;

  const is2D = renderMode === '2d';
  const is3D = renderMode === '3d';

  const btnStyle = (active: boolean) =>
    ({
      padding: '6px 10px',
      border: active ? '1px solid #5aaefc' : '1px solid #444',
      borderRadius: 4,
      background: active ? '#22344a' : '#1f1f23',
      color: '#eaeaea',
      cursor: 'pointer',
    } as React.CSSProperties);

  return (
    <>
      <div className="row">
        <div className="label">Mode</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={btnStyle(is2D)}
            onClick={() => setRenderMode('2d')}
            title="2D domain-warp fractal"
          >
            2D
          </button>
          <button
            style={btnStyle(is3D)}
            onClick={() => setRenderMode('3d')}
            title="3D raymarched fractal"
          >
            3D
          </button>
        </div>
      </div>
      {is3D && (
        <div className="warn" style={{ marginTop: -6 }}>
          3D raymarching is heavier. Consider lower Quality or fewer effects.
        </div>
      )}
    </>
  );
};

export default ModeToggle;
