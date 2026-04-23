import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sparkline } from '../Sparkline';

describe('Sparkline (golden)', () => {
  it('renders an SVG with one polyline and one trend dot', () => {
    const { container } = render(<Sparkline values={[10, 20, 15, 30, 28, 40]} />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelectorAll('polyline').length).toBe(1);
    expect(container.querySelectorAll('circle').length).toBe(1);
  });

  it('exposes accessible label with all values', () => {
    const values = [50, 60, 55];
    const { container } = render(<Sparkline values={values} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toContain('50, 60, 55');
  });

  it('handles a single-point series without crashing', () => {
    const { container } = render(<Sparkline values={[42]} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders an empty placeholder when values is empty', () => {
    const { container } = render(<Sparkline values={[]} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('inverts trend colour when goodLow is set (carry-forward case)', () => {
    const rising = render(<Sparkline values={[10, 20, 30]} goodLow />);
    const dot = rising.container.querySelector('circle');
    // Rising trend with goodLow=true → bad → warning amber, not green.
    expect(dot?.getAttribute('fill')).toBe('#C68A2E');
  });
});
