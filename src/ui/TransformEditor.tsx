import React, { useCallback, useMemo, useRef, useState } from 'react';
import useStore from '../state/useStore';
import { normToScreen, screenToNorm } from '../utils/mapCoords';
import { clamp } from '../utils/clamp';

const TransformEditor: React.FC = () => {
  const { width, height, zoom, pan, setPan, uiVisible } = useStore();
  const { transforms, updateTransform, draggingId, setDragging } =
    useStore();

  const [showGrid, setShowGrid] = useState(false);
  const [panning, setPanning] = useState(false);
  const panStart = useRef<[number, number]>([0, 0]);
  const pointerStart = useRef<[number, number]>([0, 0]);

  const layerRef = useRef<HTMLDivElement | null>(null);

  const onPointerDownHandle = useCallback(
    (id: string, e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      if (!uiVisible) return; // hide handles when UI hidden
      setDragging(id);
      setShowGrid(true);
    },
    [setDragging, uiVisible]
  );

  const onPointerDownLayer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!e.altKey) return;
      if (!layerRef.current) return;
      // Start panning if clicking on the layer background
      if (e.target !== layerRef.current) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setPanning(true);
      panStart.current = pan;
      pointerStart.current = [e.clientX, e.clientY];
    },
    [pan]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (panning) {
        const dx = e.clientX - pointerStart.current[0];
        const dy = e.clientY - pointerStart.current[1];
        const aspect = width / Math.max(1, height);
        const dSx = (dx / width) * aspect;
        const dSy = -(dy / height);
        setPan([panStart.current[0] + dSx, panStart.current[1] + dSy]);
        return;
      }
      if (!draggingId || !layerRef.current) return;
      const rect = layerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const [nx, ny] = screenToNorm(x, y, width, height);
      updateTransform(draggingId, {
        pos: [clamp(nx, -2, 2), clamp(ny, -2, 2)],
      });
    },
    [draggingId, updateTransform, width, height, setPan, panning]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      if (panning) {
        setPanning(false);
        return;
      }
      if (!draggingId) return;
      setDragging(null);
      setShowGrid(false);
    },
    [draggingId, setDragging, panning]
  );

  const handles = useMemo(() => {
    return transforms.map((t) => {
      const [x, y] = normToScreen(t.pos[0], t.pos[1], width, height);
      return { id: t.id, x, y, color: t.color };
    });
  }, [transforms, width, height]);

  return (
    <div className="transform-overlay" aria-hidden>
      <div
        ref={layerRef}
        className="transform-layer"
        onPointerDown={onPointerDownLayer}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {showGrid && <div className="grid" />}
        {uiVisible &&
          handles.map((h) => (
            <div
              key={h.id}
              className="handle"
              style={{
                left: h.x,
                top: h.y,
                background: `rgb(${Math.round(
                  h.color[0] * 255
                )}, ${Math.round(h.color[1] * 255)}, ${Math.round(
                  h.color[2] * 255
                )})`,
              }}
              onPointerDown={(e) => onPointerDownHandle(h.id, e)}
            />
          ))}
      </div>
    </div>
  );
};

export default TransformEditor;
