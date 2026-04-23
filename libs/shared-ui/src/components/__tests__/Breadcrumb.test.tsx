import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Breadcrumb } from '../Breadcrumb';

describe('Breadcrumb (golden)', () => {
  const segments = [
    { id: 'rc', label: 'Win Q2 in mid-market', type: 'RALLY_CRY' as const },
    { id: 'do', label: 'Activate 50 mid-market accounts', type: 'DEFINING_OBJECTIVE' as const },
    { id: 'o', label: 'Sales pipeline: 200 qualified opps', type: 'OUTCOME' as const },
    { id: 'so', label: 'Build outbound campaign', type: 'SUPPORTING_OUTCOME' as const },
  ];

  it('renders all segments with type badges', () => {
    render(<Breadcrumb segments={segments} />);
    expect(screen.getByText('Win Q2 in mid-market')).toBeInTheDocument();
    expect(screen.getByText('Build outbound campaign')).toBeInTheDocument();
    expect(screen.getByText('RC')).toBeInTheDocument();
    expect(screen.getByText('DO')).toBeInTheDocument();
    expect(screen.getByText('O')).toBeInTheDocument();
    expect(screen.getByText('SO')).toBeInTheDocument();
  });

  it('inserts arrow separators between segments', () => {
    render(<Breadcrumb segments={segments} />);
    const arrows = screen.getAllByText('›');
    expect(arrows.length).toBe(segments.length - 1);
  });

  it('renders nothing when given an empty list', () => {
    const { container } = render(<Breadcrumb segments={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('snapshot — three-segment path renders consistently', () => {
    const { container } = render(<Breadcrumb segments={segments.slice(0, 3)} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
