import { useMemo } from 'react';
import { CoefficientControls } from './components/controls/CoefficientControls';
import { SceneControls } from './components/controls/SceneControls';
import { VectorEditor } from './components/controls/VectorEditor';
import { ExplanationPanel } from './components/ExplanationPanel';
import { Header } from './components/Header';
import { Legend } from './components/Legend';
import { StatusPanel } from './components/StatusPanel';
import { VectorPlane, type PlaneVector } from './components/visualization/VectorPlane';
import { WorkspaceFooter } from './components/WorkspaceFooter';
import { analyzeVectorSet, formatNumber, linearCombination } from './math';
import { usePlaygroundState } from './state/usePlaygroundState';

const VECTOR_COLORS = ['#ffb86b', '#9b8cff', '#5eead4'];

function App() {
  const { state, actions } = usePlaygroundState();
  const values = useMemo(() => state.vectors.map((vector) => vector.value), [state.vectors]);
  const names = useMemo(() => state.vectors.map((vector) => vector.label), [state.vectors]);
  const analysis = useMemo(() => analyzeVectorSet(values), [values]);
  const combinationResult = useMemo(() => linearCombination(values.slice(0, 2), [state.coefficients.a, state.coefficients.b]), [values, state.coefficients]);
  const planeVectors: PlaneVector[] = state.vectors.map((vector, index) => ({ ...vector, color: VECTOR_COLORS[index] ?? VECTOR_COLORS[0]! }));

  return <div className="app-shell">
    <Header theme={state.theme} onToggleTheme={() => actions.setTheme(state.theme === 'dark' ? 'light' : 'dark')} />
    <main className="app-main">
      <div className="workspace-heading">
        <div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>R² vector lab</strong></div>
        <div className="workspace-heading-row"><div><h1>Vectors are the <em>starting point.</em></h1><p>Manipulate the arrows. See the mathematics change in real time.</p></div><div className="workspace-badge"><span className="badge-glyph">∑</span><span><strong>R² visual playground</strong><small>vectors · span · basis</small></span></div></div>
      </div>
      <div className="workspace-grid">
        <section className="visualization-column" aria-label="Vector visualization">
          <VectorPlane vectors={planeVectors} analysis={analysis} onChange={actions.setVector} showStandardBasis={state.showStandardBasis} combination={{ enabled: state.showCombination, coefficients: state.coefficients, result: combinationResult }} />
          <div className="visualization-underbar"><Legend showCombination={state.showCombination} /><div className="plane-status-pills"><span><i className="pulse-dot" /> {analysis.spanKind === 'plane' ? 'Full plane span' : analysis.spanKind === 'line' ? 'Line span' : 'No span yet'}</span><span className="coordinate-readout">det <strong>{analysis.determinant === null ? '—' : formatNumber(analysis.determinant)}</strong></span></div></div>
          <div className="intuition-callout"><span className="callout-icon">✦</span><div><strong>Make a theorem visible.</strong><p>Try placing u₂ on the line of u₁, then pull it away. Watch a line open into a plane.</p></div></div>
        </section>
        <aside className="control-rail" aria-label="Vector controls and mathematical explanation">
          <StatusPanel vectors={values} names={names} analysis={analysis} />
          <VectorEditor vectors={state.vectors} onChange={actions.setVector} onToggleVisible={actions.toggleVisible} onToggleLocked={actions.toggleLocked} onAdd={actions.addVector} onRemove={actions.removeVector} />
          <CoefficientControls vectors={values} coefficients={state.coefficients} enabled={state.showCombination} result={combinationResult} onToggle={actions.toggleCombination} onChange={actions.setCoefficient} />
          <SceneControls showStandardBasis={state.showStandardBasis} onToggleStandardBasis={actions.toggleStandardBasis} onReset={actions.reset} theme={state.theme} onToggleTheme={() => actions.setTheme(state.theme === 'dark' ? 'light' : 'dark')} />
          <ExplanationPanel vectors={values} names={names} analysis={analysis} />
        </aside>
      </div>
    </main>
    <WorkspaceFooter />
  </div>;
}

export default App;
