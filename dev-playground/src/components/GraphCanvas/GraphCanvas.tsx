import React, { useRef, useState, useEffect } from 'react';
import type { NodeData, EdgeData } from '../../data/sampleGraph';
import styles from './GraphCanvas.module.css';

interface GraphCanvasProps {
  nodes: NodeData[];
  edges: EdgeData[];
  width?: number;
  height?: number;
  onNodeSelect?: (id: string) => void;
  onNodeDoubleClick?: (id: string) => void;
  highlightNodeId?: string | null;
}

export default function GraphCanvas({ nodes: initialNodes, edges, width = 800, height = 600, onNodeSelect, onNodeDoubleClick, highlightNodeId }: GraphCanvasProps) {
  const [nodes, setNodes] = useState(initialNodes);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [haloFading, setHaloFading] = useState(false);
  const dragState = useRef<{ id: string | null; offsetX: number; offsetY: number } | null>(null);
  const fadeTimers = useRef<{ fadeStart?: ReturnType<typeof setTimeout>; remove?: ReturnType<typeof setTimeout> } | null>(null);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    const svg = (e.target as Element).closest('svg') as SVGSVGElement | null;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const node = nodes.find((n) => n.id === id)!;
    dragState.current = { id, offsetX: cursorPt.x - node.x, offsetY: cursorPt.y - node.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const svg = (e.target as Element).closest('svg') as SVGSVGElement | null;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const { id, offsetX, offsetY } = dragState.current;
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: cursorPt.x - offsetX, y: cursorPt.y - offsetY } : n)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    dragState.current = null;
  };

  useEffect(() => {
    // display the halo, then start fade and finally remove it
    if (!highlightNodeId) return;
    // clear any existing timers
    if (fadeTimers.current) {
      clearTimeout(fadeTimers.current.fadeStart as any);
      clearTimeout(fadeTimers.current.remove as any);
      fadeTimers.current = null;
    }
    setActiveHighlightId(highlightNodeId);
    setHaloFading(false);
    const displayDuration = 300; // ms before starting fade
    const fadeDuration = 800; // ms fade-out duration (matches CSS)
    const fadeStart = setTimeout(() => setHaloFading(true), displayDuration);
    const remove = setTimeout(() => {
      setActiveHighlightId(null);
      setHaloFading(false);
    }, displayDuration + fadeDuration);
    fadeTimers.current = { fadeStart, remove };
    return () => {
      if (fadeTimers.current) {
        clearTimeout(fadeTimers.current.fadeStart as any);
        clearTimeout(fadeTimers.current.remove as any);
        fadeTimers.current = null;
      }
    };
  }, [highlightNodeId]);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ border: '1px solid #e6e6e6', background: '#fff' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* edges */}
      {edges.map((e) => {
        const s = nodes.find((n) => n.id === e.source)!;
        const t = nodes.find((n) => n.id === e.target)!;
        return <line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#7c7c7c" strokeWidth={2} />;
      })}

      {/* nodes */}
      {nodes.map((n) => {
        const isHighlighted = Boolean(activeHighlightId && activeHighlightId === n.id);
        return (
          <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
            {isHighlighted && (() => {
              // minimal halo just outside the node
              const nodeR = 28;
              const ringR = nodeR + 6; // slightly larger so halo peeks around node edge
              return (
                <circle
                  r={ringR}
                  className={`${styles.pulseRing} ${haloFading ? styles.fading : ''}`}
                  stroke="none"
                />
              );
            })()}
            <circle
              r={28}
              fill={n.type === 'org' ? '#FFD580' : '#7AD3FF'}
              stroke="#213547"
              strokeWidth={1}
              onPointerDown={(e) => handlePointerDown(e, n.id)}
              onDoubleClick={() => onNodeDoubleClick?.(n.id)}
              onClick={() => onNodeSelect?.(n.id)}
              style={{ cursor: 'grab' }}
            />
            <text x={0} y={4} textAnchor="middle" fontSize={12} fill="#102027">
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
