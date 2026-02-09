import React, { useState } from 'react';
import GraphCanvas from './components/GraphCanvas';
import DetailsPanel from '../../OliveBranch/components/details/DetailsPanel';
import { Badge, Modal } from '@local/design-system';
import { sampleGraph } from './data/sampleGraph';

export default function App() {
  const [showDemo, setShowDemo] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const nodes = sampleGraph.nodes;
  const edges = sampleGraph.edges;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, borderRight: '1px solid #ddd' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8 }}>
          <h2 style={{ margin: 0 }}>Canvas</h2>
          <div>
            <Badge variant="gold">Demo</Badge>
            <button style={{ marginLeft: 12 }} onClick={() => setShowDemo((s) => !s)}>{showDemo ? 'Hide' : 'Show'} Demo</button>
            <button style={{ marginLeft: 8 }} onClick={() => setModalOpen(true)}>Open Modal</button>
          </div>
        </div>

        <div style={{ width: '100%', height: '80vh' }}>
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            onNodeDoubleClick={(id) => alert('dbl ' + id)}
            onNodeSelect={(id) => setSelectedNode(id)}
            highlightNodeId={selectedNode}
          />
        </div>

        {showDemo && (
          <div style={{ padding: 12 }}>
            <h3>Design System Demo</h3>
            <p>Here are the new components:</p>
            <Badge>Default Badge</Badge>
            <Badge variant="muted" style={{ marginLeft: 8 }}>Muted</Badge>
            <Badge variant="outline" style={{ marginLeft: 8 }}>Outline</Badge>
          </div>
        )}
      </div>
      <div style={{ width: 380 }}>
        <h2 style={{ margin: 8 }}>Details</h2>
        <DetailsPanel nodeId={selectedNode} onClose={() => setSelectedNode(null)} onSelectNode={(id) => setSelectedNode(id)} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Demo Modal">
        <p>This is a demo modal from the design system.</p>
        <button onClick={() => setModalOpen(false)}>Close</button>
      </Modal>
    </div>
  );
}
