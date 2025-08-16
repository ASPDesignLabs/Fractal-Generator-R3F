// src/renderer/Canvas3D.tsx
import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import useStore from '../state/useStore';
import RenderPipeline from './pipeline/RenderPipeline';

const Canvas3D: React.FC = () => {
  const setSize = useStore((s) => s.setSize);

  useEffect(() => {
    const on = () => setSize(window.innerWidth, window.innerHeight);
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [setSize]);

  // Mouse wheel zoom toward cursor
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const { zoom, pan, setZoom, setPan, width, height } =
        useStore.getState();
      const rect = document.body.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const aspect = width / Math.max(1, height);
      const Sx = (x / width - 0.5) * aspect;
      const Sy = 0.5 - y / height;
      const k = Math.exp(-e.deltaY * 0.0015);
      const newZoom = Math.max(0.1, Math.min(8, zoom * k));
      const newPanX = (1 - k) * Sx + k * pan[0];
      const newPanY = (1 - k) * Sy + k * pan[1];
      setZoom(newZoom);
      setPan([newPanX, newPanY]);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <Canvas
      gl={{ antialias: true }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 1);
      }}
      style={{ position: 'fixed', inset: 0 }}
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
    >
      <RenderPipeline />
    </Canvas>
  );
};

export default Canvas3D;
