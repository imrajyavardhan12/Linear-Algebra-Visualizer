export interface VectorVisualDefinition {
  id: string;
  label: string;
  color: string;
  editorClass: string;
  legendClass: string;
}

export const VECTOR_DEFINITIONS: readonly VectorVisualDefinition[] = [
  { id: 'u1', label: 'u₁', color: '#ffb86b', editorClass: 'vector-orange', legendClass: 'legend-u1' },
  { id: 'u2', label: 'u₂', color: '#9b8cff', editorClass: 'vector-violet', legendClass: 'legend-u2' },
  { id: 'u3', label: 'u₃', color: '#5eead4', editorClass: 'vector-teal', legendClass: 'legend-u3' },
];

export const VECTOR_IDS = VECTOR_DEFINITIONS.map((definition) => definition.id);

export function vectorVisualDefinition(id: string, fallbackIndex = 0): VectorVisualDefinition {
  return VECTOR_DEFINITIONS.find((definition) => definition.id === id)
    ?? VECTOR_DEFINITIONS[fallbackIndex]
    ?? VECTOR_DEFINITIONS[0]!;
}
