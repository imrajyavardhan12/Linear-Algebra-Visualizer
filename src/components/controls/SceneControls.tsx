import { Icon } from '../Icon';

interface SceneControlsProps {
  showStandardBasis: boolean;
  onToggleStandardBasis: () => void;
  onReset: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function SceneControls({ showStandardBasis, onToggleStandardBasis, onReset, theme, onToggleTheme }: SceneControlsProps) {
  return <section className="scene-actions" aria-label="Scene options">
    <label className="check-control">
      <input type="checkbox" checked={showStandardBasis} onChange={onToggleStandardBasis} />
      <span className="custom-check"><Icon name="check" size={13} /></span>
      <span><strong>Show standard basis</strong><small>e₁ = (1, 0) · e₂ = (0, 1)</small></span>
    </label>
    <div className="scene-action-buttons">
      <button className="small-action" type="button" onClick={onReset}><Icon name="refresh" size={14} /> Reset scene</button>
      <button className="small-action" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} /> {theme === 'dark' ? 'Light' : 'Dark'}</button>
    </div>
  </section>;
}
