import React, { useRef } from 'react';
import {
  downloadJSON,
  readFileAsText,
  applyScenePreset,
  exportScenePreset,
  exportMasterPreset,
  applyMasterPreset,
  type ScenePreset,
  type MasterPreset,
} from '../utils/presets';
import useStore from '../state/useStore';

type Mode = 'scene' | 'master';

const PresetIO: React.FC<{ mode: Mode }> = ({ mode }) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const getState = useStore.getState;
  const setState = useStore.setState;

  const onExport = () => {
    if (mode === 'scene') {
      downloadJSON(exportScenePreset(getState), 'scene-preset.json');
    } else {
      downloadJSON(exportMasterPreset(getState), 'master-preset.json');
    }
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await readFileAsText(f);
      const data = JSON.parse(text);
      if (mode === 'scene') applyScenePreset(setState, data as ScenePreset);
      else applyMasterPreset(setState, data as MasterPreset);
    } catch (err) {
      alert('Invalid preset file');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onCopy = async () => {
    try {
      const obj =
        mode === 'scene'
          ? exportScenePreset(getState)
          : exportMasterPreset(getState);
      await navigator.clipboard.writeText(JSON.stringify(obj));
    } catch {
      alert('Clipboard copy failed');
    }
  };

  const onPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      if (mode === 'scene') applyScenePreset(setState, data as ScenePreset);
      else applyMasterPreset(setState, data as MasterPreset);
    } catch {
      alert('Clipboard paste failed or data invalid');
    }
  };

  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <div className="label" style={{ width: 120, textAlign: 'left' }}>
        {mode === 'scene' ? 'Scene Preset' : 'Master Preset'}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="button" onClick={onExport}>
          Export
        </button>
        <button
          className="button"
          onClick={() => fileRef.current?.click()}
          title="Import from file"
        >
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={onImportFile}
        />
        <button className="button" onClick={onCopy} title="Copy JSON">
          Copy
        </button>
        <button className="button" onClick={onPaste} title="Paste JSON">
          Paste
        </button>
      </div>
    </div>
  );
};

export default PresetIO;
