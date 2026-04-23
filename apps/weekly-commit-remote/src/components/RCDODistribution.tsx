import { Card, CardBody } from '@st6/shared-ui';

const RCDO_DATA = [
  { name: 'Enterprise-Grade Compliance', commits: 9, color: '#D4603A' },
  { name: 'Enterprise Pipeline', commits: 5, color: '#2A9D8F' },
  { name: 'Monetization Step-Up', commits: 4, color: '#7C3AED' },
  { name: 'Exec Operating Cadence', commits: 6, color: '#6B7280' },
];

export function RCDODistribution() {
  const total = RCDO_DATA.reduce((sum, d) => sum + d.commits, 0);

  return (
    <Card>
      <CardBody className="space-y-5 px-5 py-5">
        {/* Header */}
        <div>
          <h3 className="font-serif text-lg font-medium text-ink">RCDO Distribution</h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            Commit allocation across Defining Objectives
          </p>
        </div>

        {/* Stacked horizontal bar */}
        <div className="flex h-3 overflow-hidden rounded-full">
          {RCDO_DATA.map((item) => (
            <div
              key={item.name}
              className="h-full transition-all duration-300"
              style={{
                width: `${(item.commits / total) * 100}%`,
                backgroundColor: item.color,
              }}
              title={`${item.name}: ${item.commits} commits`}
            />
          ))}
        </div>

        {/* Objective breakdown list */}
        <div className="space-y-3">
          {RCDO_DATA.map((item) => {
            const pct = Math.round((item.commits / total) * 100);
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-ink">{item.name}</span>
                  </div>
                  <span className="font-mono text-xs text-ink-muted">
                    {item.commits} commits &middot; {pct}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-cream-100">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
