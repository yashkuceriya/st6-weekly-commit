import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge (golden)', () => {
  const cases = [
    ['DRAFT', 'Draft'],
    ['LOCKED', 'Locked'],
    ['RECONCILING', 'Reconciling'],
    ['RECONCILED', 'Reconciled'],
    ['DELIVERED', 'Delivered'],
    ['PARTIAL', 'Partial'],
    ['MISSED', 'Missed'],
  ] as const;

  cases.forEach(([status, label]) => {
    it(`renders human label "${label}" for status ${status}`, () => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('snapshot — locked badge', () => {
    const { container } = render(<StatusBadge status="LOCKED" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
