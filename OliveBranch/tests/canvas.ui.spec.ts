import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Canvas from '../components/canvas/Canvas';

describe('Canvas UI', () => {
  it('renders nodes and handles selection/double-click', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const nodes = [
      { id: 'n1', x: 10, y: 20, label: 'A' },
      { id: 'n2', x: 120, y: 40, label: 'B' },
    ];

    const onDouble = vi.fn();
    const onSelect = vi.fn();

    root.render(<Canvas nodes={nodes} onNodeDoubleClick={onDouble} onNodeSelect={onSelect} />);

    // nodes should exist in DOM
    const n1 = container.querySelector('[data-node-id="n1"]') as HTMLElement;
    const n2 = container.querySelector('[data-node-id="n2"]') as HTMLElement;
    expect(n1).toBeTruthy();
    expect(n2).toBeTruthy();

    // simulate click to select
    n1.click();
    expect(onSelect).toHaveBeenCalled();

    // simulate double click
    const dbl = new MouseEvent('dblclick', { bubbles: true });
    n2.dispatchEvent(dbl);
    expect(onDouble).toHaveBeenCalledWith('n2');

    root.unmount();
  });
});
