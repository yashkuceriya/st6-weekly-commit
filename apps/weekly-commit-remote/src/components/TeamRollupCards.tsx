import { Card, CardBody } from '@st6/shared-ui';

const TEAM_MEMBERS = [
  { name: 'Sarah Chen', role: 'Sr. Engineer', initials: 'SC', color: '#2A9D8F', commits: 5, completion: 80, alignment: 100 },
  { name: 'Marcus Johnson', role: 'Product Lead', initials: 'MJ', color: '#3B82F6', commits: 4, completion: 75, alignment: 100 },
  { name: 'Emily Park', role: 'Designer', initials: 'EP', color: '#EAB308', commits: 3, completion: 67, alignment: 100 },
  { name: 'Alex Rivera', role: 'Engineer', initials: 'AR', color: '#EF4444', commits: 4, completion: 100, alignment: 75 },
  { name: 'Jordan Kim', role: 'Engineering Mgr', initials: 'JK', color: '#3B82F6', commits: 4, completion: 100, alignment: 100 },
  { name: 'Priya Sharma', role: 'Data Analyst', initials: 'PS', color: '#2A9D8F', commits: 4, completion: 88, alignment: 75 },
];

function statusFor(member: typeof TEAM_MEMBERS[number]): { label: string; className: string } {
  if (member.completion === 100 && member.alignment === 100) {
    return { label: 'Reconciled', className: 'bg-success-subtle text-success' };
  }
  if (member.completion >= 75) {
    return { label: 'Locked', className: 'bg-claude-50 text-claude-600' };
  }
  return { label: 'Draft', className: 'bg-cream-100 text-ink-muted' };
}

export function TeamRollupCards() {
  const totalCommits = TEAM_MEMBERS.reduce((sum, m) => sum + m.commits, 0);
  const avgCompletion = Math.round(TEAM_MEMBERS.reduce((sum, m) => sum + m.completion, 0) / TEAM_MEMBERS.length);
  const avgAlignment = Math.round(TEAM_MEMBERS.reduce((sum, m) => sum + m.alignment, 0) / TEAM_MEMBERS.length);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif text-lg font-medium text-ink">Team Members</h3>
        <p className="mt-0.5 text-sm text-ink-muted">Individual progress this week</p>
      </div>

      {/* Member cards grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {TEAM_MEMBERS.map((member) => {
          const status = statusFor(member);
          return (
            <Card key={member.name} className="transition-shadow hover:shadow-lift">
              <CardBody className="px-4 py-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Name + status row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{member.name}</p>
                        <p className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-subtle">{member.role}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.6rem] font-medium uppercase tracking-wider ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="mt-3 flex gap-4">
                      <Stat label="Commits" value={String(member.commits)} />
                      <Stat label="Completion" value={`${member.completion}%`} warn={member.completion < 75} />
                      <Stat label="Alignment" value={`${member.alignment}%`} warn={member.alignment < 90} />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Summary row */}
      <Card variant="soft">
        <CardBody className="px-5 py-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[0.65rem] font-medium uppercase tracking-widest text-ink-subtle">
              Team summary
            </p>
            <div className="flex gap-6">
              <SummaryStat label="Total Commits" value={String(totalCommits)} />
              <SummaryStat label="Avg Completion" value={`${avgCompletion}%`} />
              <SummaryStat label="Avg Alignment" value={`${avgAlignment}%`} />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[0.55rem] uppercase tracking-wider text-ink-subtle">{label}</p>
      <p className={`text-sm font-semibold ${warn ? 'text-warning' : 'text-ink'}`}>{value}</p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="font-mono text-[0.55rem] uppercase tracking-wider text-ink-subtle">{label}</p>
      <p className="font-serif text-base font-semibold text-ink">{value}</p>
    </div>
  );
}
