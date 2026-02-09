import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import DetailsPanel from '../components/details/DetailsPanel';

describe('DetailsPanel UI', () => {
  let originalFetch: typeof fetch | undefined;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    if (originalFetch) globalThis.fetch = originalFetch;
  });

  it('loads node details and performs PATCH on save', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const sample = { success: true, data: { id: 'n1', name: 'Node 1' } };

    const fetchMock = vi.fn((url: string, opts?: unknown) => {
      const method = (opts as Record<string, unknown>)?.['method'] as string | undefined;
      if (method === 'PATCH') {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { id: 'n1', name: 'Updated' } }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(sample), { status: 200 }));
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await new Promise<void>((resolve) => {
      root.render(<DetailsPanel nodeId={'n1'} onClose={resolve} />);
      // allow effect to run
      setTimeout(resolve, 50);
    });

    // click the Edit button to show the form
    const btns = container.querySelectorAll('button');
    if (btns && btns[1]) {
      btns[1].click();
      // allow edit UI to render
      await new Promise((r) => setTimeout(r, 0));
    }

    // simulate edit + submit by calling the form's submit via DOM
    const form = container.querySelector('form') as HTMLFormElement | null;
    if (form) {
      // change input and dispatch input event so React picks it up
      const input = container.querySelector('input') as HTMLInputElement | null;
      if (input) {
        input.value = 'Updated';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      // allow submit handler to run
      await new Promise((r) => setTimeout(r, 0));
    }

    // PATCH should have been called
    // assert against the mocked function we installed
    const fm = fetchMock as unknown as { mock?: { calls?: unknown[][] } };
    const calls = fm.mock?.calls ?? [];
    expect(calls.some((c) => (c[1] as Record<string, unknown>)?.['method'] === 'PATCH')).toBe(true);

    root.unmount();
  });
});
