import { describe, it, expect } from 'vitest';
import { greet } from '../src';

describe('greet', () => {
  it('returns greeting', () => {
    expect(greet('World')).toBe('Hello, World');
  });
});
