// src/App.tsx
import React, { useEffect } from 'react';
import Canvas3D from './renderer/Canvas3D';
import ControlPanel from './ui/ControlPanel';
import TransformEditor from './ui/TransformEditor';
import MasterPanel from './ui/MasterPanel';
import useStore from './state/useStore';
import './styles.css';

const App: React.FC = () => {
  const uiVisible = useStore((s) => s.uiVisible);
  const setUiVisible = useStore((s) => s.setUiVisible);
  const uiScale = useStore((s) => s.uiScale);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Backquote') setUiVisible(!uiVisible);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [uiVisible, setUiVisible]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--ui-scale',
      String(uiScale)
    );
  }, [uiScale]);

  return (
    <>
      <Canvas3D />
      {uiVisible && <ControlPanel />}
      {uiVisible && <MasterPanel />}
      <TransformEditor />
    </>
  );
};

export default App;
