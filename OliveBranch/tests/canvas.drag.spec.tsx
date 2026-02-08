import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Canvas from '../components/canvas/Canvas';

// jsdom in this environment may not implement PointerEvent; polyfill with MouseEvent
if (typeof (global as any).PointerEvent === 'undefined') {
  (global as any).PointerEvent = MouseEvent as any;
}

describe('Canvas drag', () => {
  it('drags a node and calls onNodeMove with final position', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const nodes = [ { id: 'n1', x: 10, y: 20, label: 'Node 1' } ];
    const onMove = vi.fn();

    root.render(<Canvas nodes={nodes} onNodeMove={onMove} />);
    await new Promise((r) => setTimeout(r, 0));

    const el = container.querySelector('[data-node-id="n1"]') as HTMLElement;
    expect(el).toBeTruthy();

    // pointerdown at the node's current position
    const downX = 10 + 5; // slight offset inside
    const downY = 20 + 5;
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: downX, clientY: downY }));
    // allow React state to update
    await new Promise((r) => setTimeout(r, 0));

    // move by 120x, 60y
    const moveX = downX + 120;
    const moveY = downY + 60;
    document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: moveX, clientY: moveY }));
    await new Promise((r) => setTimeout(r, 0));

    // pointer up to finish drag - dispatch on the node so its handler runs
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: moveX, clientY: moveY }));

    // allow effects to flush
    await new Promise((r) => setTimeout(r, 0));

    expect(onMove).toHaveBeenCalled();
    const call = onMove.mock.calls[0];
    expect(call[0]).toBe('n1');
    // final position should roughly equal original + delta
    const pos = call[1];
    expect(Math.round(pos.x)).toBeGreaterThanOrEqual(10 + 100);
    expect(Math.round(pos.y)).toBeGreaterThanOrEqual(20 + 40);

    root.unmount();
  });
});
