"use client";

import React, { useRef, useCallback, useState, useEffect } from 'react';

interface NodeItem {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface CanvasProps {
  nodes: NodeItem[];
  onNodeDoubleClick?: (id: string) => void;
  onNodeSelect?: (id: string | null) => void;
  className?: string;
}

export default function Canvas({ nodes = [], onNodeDoubleClick, onNodeSelect, className }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    onNodeSelect?.(selected);
  }, [selected, onNodeSelect]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.08 : 0.92;
    setScale((s) => Math.min(4, Math.max(0.25, s * zoomFactor)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel as any);
  }, [handleWheel]);

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsPanning(true);
    setOrigin({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    setTranslate({ x: e.clientX - origin.x, y: e.clientY - origin.y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
    setIsPanning(false);
  };

  const handleDoubleClick = useCallback(
    (id: string) => {
      onNodeDoubleClick?.(id);
    },
    [onNodeDoubleClick]
  );

  const handleClickNode = (id: string) => {
    setSelected((s) => (s === id ? null : id));
  };

  return (
    <div ref={containerRef} className={className ?? 'canvas-root'} style={{ width: '100%', height: '100%', overflow: 'hidden', touchAction: 'none' }}>
      <div
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, transformOrigin: '0 0', width: '100%', height: '100%', position: 'relative' }}
      >
        {nodes.map((n) => (
          <div
            key={n.id}
            onDoubleClick={() => handleDoubleClick(n.id)}
            onClick={() => handleClickNode(n.id)}
            style={{ position: 'absolute', left: n.x, top: n.y, padding: 8, background: selected === n.id ? '#e6f7ff' : '#fff', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}
            data-node-id={n.id}
          >
            {n.label}
          </div>
        ))}
      </div>
    </div>
  );
}
