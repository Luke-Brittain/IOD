export const sampleGraph = {
  nodes: [
    { id: 'n1', x: 100, y: 120, label: 'Alice', type: 'person' },
    { id: 'n2', x: 320, y: 80, label: 'Bob', type: 'person' },
    { id: 'n3', x: 220, y: 260, label: 'Company X', type: 'org' },
    { id: 'n4', x: 520, y: 200, label: 'Carol', type: 'person' }
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', label: 'knows' },
    { id: 'e2', source: 'n1', target: 'n3', label: 'works_at' },
    { id: 'e3', source: 'n2', target: 'n3', label: 'consults' },
    { id: 'e4', source: 'n4', target: 'n3', label: 'owner' }
  ]
};

export type NodeData = { id: string; x: number; y: number; label: string; type?: string };
export type EdgeData = { id: string; source: string; target: string; label?: string };
