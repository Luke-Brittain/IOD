"use client";

import React, { useRef, useCallback } from 'react';

interface NodeItem {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface CanvasProps {
  nodes: NodeItem[];
  onNodeDoubleClick?: (id: string) => void;
  className?: string;
}

export default function Canvas({ nodes = [], onNodeDoubleClick, className }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleDoubleClick = useCallback(
    (id: string) => {
      onNodeDoubleClick?.(id);
    },
    [onNodeDoubleClick]
  );

  return (
    <div ref={containerRef} className={className ?? 'canvas-root'} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {nodes.map((n) => (
        <div
          key={n.id}
          onDoubleClick={() => handleDoubleClick(n.id)}
          style={{ position: 'absolute', left: n.x, top: n.y, padding: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}
          data-node-id={n.id}
        >
          {n.label}
        </div>
      ))}
    </div>
  );
}
