import { Icon } from './Icon';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  return <header className="app-header">
    <a className="brand" href="/" aria-label="Linear Algebra Playground home">
      <span className="brand-mark"><span /><span /><span /></span>
      <span className="brand-copy"><strong>linear<span>lab</span></strong><small>visual mathematics</small></span>
    </a>
    <span className="header-context"><Icon name="grid" size={14} /> Playground <span>/</span> R²</span>
    <div className="header-actions"><span className="header-status"><span className="live-dot" /> Local session</span><button className="header-icon-button" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme"><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} /></button><span className="avatar-button" aria-label="Local mode">R²</span></div>
  </header>;
}
