import { useCallback, useMemo, useState } from 'react';
import { BasisCoordinatesControls } from './components/controls/BasisCoordinatesControls';
import { CoefficientControls } from './components/controls/CoefficientControls';
import { ProjectionControls } from './components/ProjectionControls';
import { SceneControls } from './components/controls/SceneControls';
import { VectorEditor } from './components/controls/VectorEditor';
import { ExplanationPanel } from './components/ExplanationPanel';
import { Header } from './components/Header';
import { Legend } from './components/Legend';
import { StatusPanel } from './components/StatusPanel';
import { VectorPlane, type PlaneVector } from './components/visualization/VectorPlane';
import { WorkspaceFooter } from './components/WorkspaceFooter';
import { analyzeVectorSet, evaluateBasisCoordinates, evaluateLinearCombination, evaluateProjection, formatNumber } from './math';
import { vectorVisualDefinition } from './scene';
import { usePlaygroundState } from './state/usePlaygroundState';

async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the legacy clipboard path when permissions are unavailable.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

function App() {
  const { state, actions } = usePlaygroundState();
  const [shareCopied, setShareCopied] = useState(false);
  const copyShareLink = useCallback(async () => {
    const copied = await copyText(window.location.href);
    if (!copied) return;
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1800);
  }, []);
  const activeVectors = useMemo(() => state.vectors.filter((vector) => vector.visible), [state.vectors]);
  const values = useMemo(() => activeVectors.map((vector) => vector.value), [activeVectors]);
  const names = useMemo(() => activeVectors.map((vector) => vector.label), [activeVectors]);
  const analysis = useMemo(() => analyzeVectorSet(values), [values]);
  const pairOptions = useMemo(() => activeVectors.map((vector) => ({ id: vector.id, label: vector.label })), [activeVectors]);
  const firstCombinationVector = activeVectors.find((vector) => vector.id === state.combinationPair.firstId);
  const secondCombinationVector = activeVectors.find((vector) => vector.id === state.combinationPair.secondId);
  const combinationEvaluation = useMemo(() => {
    if (!firstCombinationVector || !secondCombinationVector) return null;
    return evaluateLinearCombination(firstCombinationVector.value, secondCombinationVector.value, state.coefficients);
  }, [firstCombinationVector, secondCombinationVector, state.coefficients]);
  const combinationOverlay = combinationEvaluation && firstCombinationVector && secondCombinationVector
    ? {
      enabled: state.showCombination,
      evaluation: combinationEvaluation,
      firstLabel: firstCombinationVector.label,
      secondLabel: secondCombinationVector.label,
    }
    : undefined;
  const projectionSourceVector = activeVectors.find((vector) => vector.id === state.projectionPair.firstId);
  const projectionTargetVector = activeVectors.find((vector) => vector.id === state.projectionPair.secondId);
  const projectionEvaluation = useMemo(() => {
    if (!projectionSourceVector || !projectionTargetVector) return null;
    return evaluateProjection(projectionSourceVector.value, projectionTargetVector.value);
  }, [projectionSourceVector, projectionTargetVector]);
  const projectionOverlay = projectionEvaluation && projectionSourceVector && projectionTargetVector
    ? {
      enabled: state.showProjection,
      evaluation: projectionEvaluation,
      sourceLabel: projectionSourceVector.label,
      ontoLabel: projectionTargetVector.label,
    }
    : undefined;
  const firstCoordinateBasisVector = activeVectors.find((vector) => vector.id === state.basisCoordinateSelection.firstId);
  const secondCoordinateBasisVector = activeVectors.find((vector) => vector.id === state.basisCoordinateSelection.secondId);
  const coordinateTargetVector = activeVectors.find((vector) => vector.id === state.basisCoordinateSelection.targetId);
  const basisCoordinateEvaluation = useMemo(() => {
    if (!firstCoordinateBasisVector || !secondCoordinateBasisVector || !coordinateTargetVector) return null;
    return evaluateBasisCoordinates(firstCoordinateBasisVector.value, secondCoordinateBasisVector.value, coordinateTargetVector.value);
  }, [firstCoordinateBasisVector, secondCoordinateBasisVector, coordinateTargetVector]);
  const basisCoordinatesOverlay = basisCoordinateEvaluation && firstCoordinateBasisVector && secondCoordinateBasisVector && coordinateTargetVector
    ? {
      enabled: state.showBasisCoordinates,
      evaluation: basisCoordinateEvaluation,
      firstLabel: firstCoordinateBasisVector.label,
      secondLabel: secondCoordinateBasisVector.label,
      targetLabel: coordinateTargetVector.label,
    }
    : undefined;
  const planeVectors: PlaneVector[] = state.vectors.map((vector, index) => ({
    ...vector,
    color: vectorVisualDefinition(vector.id, index).color,
  }));
  const legendVectors = state.vectors
    .filter((vector) => vector.visible)
    .map((vector, index) => ({
      id: vector.id,
      label: vector.label,
      legendClass: vectorVisualDefinition(vector.id, index).legendClass,
    }));

  return <div className="app-shell">
    <Header theme={state.theme} onToggleTheme={() => actions.setTheme(state.theme === 'dark' ? 'light' : 'dark')} />
    <main className="app-main">
      <div className="workspace-heading">
        <div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>R² vector lab</strong></div>
        <div className="workspace-heading-row"><div><h1>Vectors are the <em>starting point.</em></h1><p>Manipulate the arrows. See the mathematics change in real time.</p></div><div className="workspace-badge"><span className="badge-glyph">∑</span><span className="workspace-badge-copy"><strong>R² visual playground</strong><small>vectors · span · basis</small></span><button className="share-button" type="button" onClick={copyShareLink} aria-label={shareCopied ? 'Share link copied' : 'Copy share link'}>{shareCopied ? 'Copied' : 'Copy link'}</button></div></div>
      </div>
      <div className="workspace-grid">
        <section className="visualization-column" aria-label="Vector visualization">
          <VectorPlane vectors={planeVectors} analysis={analysis} onChange={actions.setVector} showStandardBasis={state.showStandardBasis} combination={combinationOverlay} projection={projectionOverlay} basisCoordinates={basisCoordinatesOverlay} />
          <div className="visualization-underbar"><Legend vectors={legendVectors} showCombination={state.showCombination && combinationEvaluation !== null} showProjection={state.showProjection && projectionEvaluation !== null} showBasisCoordinates={state.showBasisCoordinates && basisCoordinateEvaluation?.isBasis === true} /><div className="plane-status-pills"><span><i className="pulse-dot" /> {analysis.spanKind === 'plane' ? 'Full plane span' : analysis.spanKind === 'line' ? 'Line span' : 'No span yet'}</span><span className="coordinate-readout">det <strong>{analysis.determinant === null ? '—' : formatNumber(analysis.determinant)}</strong></span></div></div>
          <div className="intuition-callout"><span className="callout-icon">✦</span><div><strong>Make a theorem visible.</strong><p>Try placing u₂ on the line of u₁, then pull it away. Watch a line open into a plane.</p></div></div>
        </section>
        <aside className="control-rail" aria-label="Vector controls and mathematical explanation">
          <StatusPanel vectors={values} names={names} analysis={analysis} />
          <VectorEditor vectors={state.vectors} onChange={actions.setVector} onToggleVisible={actions.toggleVisible} onToggleLocked={actions.toggleLocked} onAdd={actions.addVector} onRemove={actions.removeVector} />
          <CoefficientControls coefficients={state.coefficients} evaluation={combinationEvaluation} enabled={state.showCombination} firstLabel={firstCombinationVector?.label} secondLabel={secondCombinationVector?.label} pairOptions={pairOptions} firstId={firstCombinationVector?.id} secondId={secondCombinationVector?.id} onPairChange={actions.setCombinationVector} onToggle={actions.toggleCombination} onChange={actions.setCoefficient} />
          <ProjectionControls evaluation={projectionEvaluation} enabled={state.showProjection} sourceLabel={projectionSourceVector?.label} ontoLabel={projectionTargetVector?.label} pairOptions={pairOptions} sourceId={projectionSourceVector?.id} ontoId={projectionTargetVector?.id} onPairChange={actions.setProjectionVector} onToggle={actions.toggleProjection} />
          <BasisCoordinatesControls evaluation={basisCoordinateEvaluation} enabled={state.showBasisCoordinates} options={pairOptions} firstId={firstCoordinateBasisVector?.id} secondId={secondCoordinateBasisVector?.id} targetId={coordinateTargetVector?.id} firstLabel={firstCoordinateBasisVector?.label} secondLabel={secondCoordinateBasisVector?.label} targetLabel={coordinateTargetVector?.label} onPairChange={actions.setCoordinateBasisVector} onTargetChange={actions.setCoordinateTarget} onToggle={actions.toggleBasisCoordinates} />
          <SceneControls showStandardBasis={state.showStandardBasis} onToggleStandardBasis={actions.toggleStandardBasis} onReset={actions.reset} onLoadExample={actions.loadExample} theme={state.theme} onToggleTheme={() => actions.setTheme(state.theme === 'dark' ? 'light' : 'dark')} />
          <ExplanationPanel vectors={values} names={names} analysis={analysis} />
        </aside>
      </div>
    </main>
    <WorkspaceFooter />
  </div>;
}

export default App;
