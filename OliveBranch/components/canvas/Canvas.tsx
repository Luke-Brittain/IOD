"use client";

import React, { useRef, useCallback, useState, useEffect } from 'react';
// prefer design-system Toast when available
import Toast, { tokens } from '@local/design-system';
import styles from './Canvas.module.css';

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
  onNodeMove?: (id: string, pos: { x: number; y: number }) => void;
  className?: string;
}

export default function Canvas({ nodes = [], onNodeDoubleClick, onNodeSelect, onNodeMove, className }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [hoveringId, setHoveringId] = useState<string | null>(null);
  const [persistStatus, setPersistStatus] = useState<Record<string, { status: 'pending' | 'failed' | 'ok'; attempts: number }>>({});
  const [localNodes, setLocalNodes] = useState<NodeItem[]>(nodes);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onNodeSelect?.(selected);
  }, [selected, onNodeSelect]);

  // sync incoming nodes when prop changes
  useEffect(() => {
    setLocalNodes(nodes);
  }, [nodes]);

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
    // if pointerdown on empty viewport -> start panning
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsPanning(true);
    setOrigin({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId) {
      // update dragged node position relative to viewport/pan/scale
      const id = draggingId;
      const offset = dragOffsetRef.current ?? { x: 0, y: 0 };
      const clientX = e.clientX;
      const clientY = e.clientY;
      const newX = (clientX - origin.x - offset.x) / scale + translate.x / scale;
      const newY = (clientY - origin.y - offset.y) / scale + translate.y / scale;
      setLocalNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: newX, y: newY } : n)));
      // move ghost preview if present
      if (ghostRef.current) {
        ghostRef.current.style.left = `${clientX + 12}px`;
        ghostRef.current.style.top = `${clientY + 12}px`;
        ghostRef.current.style.opacity = '0.95';
      }
      return;
    }
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

  // Node pointer handlers for dragging
  const handleNodePointerDown = (e: React.PointerEvent, node: NodeItem) => {
    e.stopPropagation();
    const target = e.target as Element;
    try { target.setPointerCapture(e.pointerId); } catch {}
    setDraggingId(node.id);
    // compute offset between pointer and node position
    dragOffsetRef.current = { x: e.clientX - node.x * scale - translate.x, y: e.clientY - node.y * scale - translate.y };
    // create ghost preview element
      try {
      if (!ghostRef.current) {
        const g = document.createElement('div');
        g.style.position = 'fixed';
        g.style.pointerEvents = 'none';
        g.style.padding = `${tokens.spacing.xs}px ${tokens.spacing.sm}px`;
        g.style.background = 'rgba(255,255,255,0.98)';
        g.style.border = '1px solid rgba(0,0,0,0.06)';
        g.style.borderRadius = '8px';
        g.style.boxShadow = '0 12px 28px rgba(2,18,22,0.12)';
        g.style.zIndex = '2000';
        g.style.left = `${e.clientX + 12}px`;
        g.style.top = `${e.clientY + 12}px`;
        g.style.opacity = '0.9';
        g.style.transition = 'transform 120ms ease, opacity 120ms ease';
        g.textContent = node.label;
        document.body.appendChild(g);
        ghostRef.current = g;
      }
    } catch {}
  };

  const handleNodePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
    const finishedId = draggingId;
    // compute final position from the event coordinates to avoid reading stale state
      if (finishedId) {
      const offset = dragOffsetRef.current ?? { x: 0, y: 0 };
      const clientX = (e as any).clientX ?? 0;
      const clientY = (e as any).clientY ?? 0;
      const finalX = (clientX - origin.x - offset.x) / scale + translate.x / scale;
      const finalY = (clientY - origin.y - offset.y) / scale + translate.y / scale;
      // update local state immediately
      setLocalNodes((prev) => prev.map((n) => (n.id === finishedId ? { ...n, x: finalX, y: finalY } : n)));
      // call provided callback or persist to API by default (with retry/backoff)
      try {
        if (typeof onNodeMove === 'function') {
          onNodeMove(finishedId, { x: finalX, y: finalY });
        } else {
          // default persistence with optimistic UI and retry/backoff
          startPersist(finishedId, finalX, finalY);
        }
      } catch {}
    }
    setDraggingId(null);
    dragOffsetRef.current = null;
    // remove ghost preview
    try {
      if (ghostRef.current) {
        ghostRef.current.remove();
        ghostRef.current = null;
      }
    } catch {}
  };

  const handleNodeKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleDoubleClick(id);
    } else if (e.key === ' ') {
      e.preventDefault();
      setSelected((s) => (s === id ? null : id));
    }
  };

  // persistence with retry/backoff
  const startPersist = (id: string, x: number, y: number) => {
    // set optimistic pending state
    setPersistStatus((p) => ({ ...p, [id]: { status: 'pending', attempts: 0 } }));

    (async () => {
      let attempts = 0;
      let delay = 500;
      while (attempts < 4) {
        try {
          attempts += 1;
          setPersistStatus((p) => ({ ...p, [id]: { status: 'pending', attempts } }));
          const res = await fetch(`/api/nodes/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x, y }),
          });
          if (res.ok) {
            setPersistStatus((p) => ({ ...p, [id]: { status: 'ok', attempts } }));
            // clear indicator after short delay
            setTimeout(() => setPersistStatus((p) => { const copy = { ...p }; delete copy[id]; return copy; }), 800);
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        } catch (err) {
          // last attempt -> mark failed
          if (attempts >= 4) {
            setPersistStatus((p) => ({ ...p, [id]: { status: 'failed', attempts } }));
            return;
          }
          // wait then retry
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
        }
      }
    })();
  };

  const retryPersist = (id: string) => {
    const node = localNodes.find((n) => n.id === id);
    if (!node) return;
    startPersist(id, node.x, node.y);
  };

  return (
    <div ref={containerRef} className={[className ?? '', styles.canvasRoot].filter(Boolean).join(' ')}>
      <div
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={styles.viewport}
        style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})` }}
      >
        {localNodes.map((n) => {
          const isDragging = draggingId === n.id;
          const nodeClass = [
            styles.node,
            isDragging ? styles.nodeDragging : '',
            hoveringId === n.id && !isDragging ? styles.nodeHover : '',
            selected === n.id ? styles.nodeSelected : '',
          ].filter(Boolean).join(' ');

          return (
            <div
              key={n.id}
              onDoubleClick={() => handleDoubleClick(n.id)}
              onClick={() => handleClickNode(n.id)}
              onPointerDown={(e) => handleNodePointerDown(e, n)}
              onPointerUp={handleNodePointerUp}
              onPointerCancel={handleNodePointerUp}
              onMouseEnter={() => setHoveringId(n.id)}
              onMouseLeave={() => setHoveringId((hid) => (hid === n.id ? null : hid))}
              onKeyDown={(e) => handleNodeKeyDown(e as any, n.id)}
              tabIndex={0}
              className={nodeClass}
              style={{ left: n.x, top: n.y, cursor: isDragging ? 'grabbing' : hoveringId === n.id ? 'grab' : 'pointer', zIndex: isDragging ? 999 : undefined }}
              data-node-id={n.id}
            >
              <div className={styles.nodeContent}>
                <div className={styles.nodeDot} />
                <div style={{ flex: 1 }}>{n.label}</div>
                {/* persistence indicator moved to global toast */}
              </div>
            </div>
          );
        })}
      </div>
      {/* Global persistence toast */}
      {/* Global persistence toast (extracted to Toast component) */}
      <Toast
        pendingCount={Object.values(persistStatus).filter((s) => s.status === 'pending').length}
        failedIds={Object.entries(persistStatus).filter(([, v]) => v.status === 'failed').map(([k]) => k)}
        onRetryAll={() => { Object.entries(persistStatus).filter(([, v]) => v.status === 'failed').forEach(([k]) => retryPersist(k)); }}
        onDismissFailed={() => { setPersistStatus((p) => { const copy = { ...p }; Object.entries(p).filter(([, v]) => v.status === 'failed').forEach(([k]) => delete copy[k]); return copy; }); }}
      />
    </div>
  );
}
