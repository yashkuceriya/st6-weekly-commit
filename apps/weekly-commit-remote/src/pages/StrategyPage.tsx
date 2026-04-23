import { useGetCurrentPlanQuery, useGetStrategicTreeQuery } from '@st6/api-client';
import type { StrategicNodeWithChildren } from '@st6/shared-types';
import { Card, CardBody, SectionHeader, Spinner, cn } from '@st6/shared-ui';

const TYPE_STYLE: Record<string, { badge: string; bg: string; label: string }> = {
  RALLY_CRY: { badge: 'bg-claude-400 text-white', bg: 'border-claude-200 bg-claude-50/30', label: 'Rally Cry' },
  DEFINING_OBJECTIVE: { badge: 'bg-ink text-white', bg: 'border-border', label: 'Defining Objective' },
  OUTCOME: { badge: 'bg-warning text-white', bg: 'border-warning/20 bg-warning-subtle/20', label: 'Outcome' },
  SUPPORTING_OUTCOME: { badge: 'bg-success text-white', bg: 'border-success/20 bg-success-subtle/20', label: 'Supporting Outcome' },
};

export function StrategyPage() {
  const { data: tree, isLoading } = useGetStrategicTreeQuery();
  const { data: plan } = useGetCurrentPlanQuery();

  // Count commits per supporting outcome
  const commitCounts = new Map<string, number>();
  if (plan) {
    for (const c of plan.commits.filter((x) => x.active && x.supportingOutcomeId)) {
      commitCounts.set(c.supportingOutcomeId!, (commitCounts.get(c.supportingOutcomeId!) ?? 0) + 1);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const totalCommits = plan?.commits.filter((c) => c.active).length ?? 0;
  const linkedCommits = plan?.commits.filter((c) => c.active && c.supportingOutcomeId).length ?? 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Strategic alignment"
        title="RCDO Hierarchy"
        subtitle="Every weekly commitment maps to a Supporting Outcome. This is how individual work connects to company strategy."
      />

      {/* Alignment summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-subtle">Alignment</p>
            <p className="mt-1 font-serif text-3xl text-ink">
              {totalCommits > 0 ? Math.round((linkedCommits / totalCommits) * 100) : 0}%
            </p>
            <p className="text-xs text-ink-muted">{linkedCommits} of {totalCommits} commits linked</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-subtle">Outcomes covered</p>
            <p className="mt-1 font-serif text-3xl text-ink">{commitCounts.size}</p>
            <p className="text-xs text-ink-muted">distinct Supporting Outcomes</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-subtle">Hierarchy depth</p>
            <p className="mt-1 font-serif text-3xl text-ink">4</p>
            <p className="text-xs text-ink-muted">RC → DO → O → SO</p>
          </CardBody>
        </Card>
      </div>

      {/* Tree */}
      <Card>
        <CardBody className="space-y-0 p-0">
          {tree?.map((rc) => (
            <TreeNode key={rc.id} node={rc} depth={0} commitCounts={commitCounts} />
          ))}
          {(!tree || tree.length === 0) && (
            <p className="px-6 py-12 text-center text-sm text-ink-muted">No strategic hierarchy configured.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  commitCounts,
}: {
  node: StrategicNodeWithChildren;
  depth: number;
  commitCounts: Map<string, number>;
}) {
  const style = TYPE_STYLE[node.type] ?? TYPE_STYLE.OUTCOME!;
  const count = commitCounts.get(node.id);
  const hasCommits = count != null && count > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center justify-between border-b px-6 py-3 transition-colors hover:bg-cream-50',
          style.bg,
        )}
        style={{ paddingLeft: `${24 + depth * 28}px` }}
      >
        <div className="flex items-center gap-3">
          <span className={cn('rounded px-1.5 py-0.5 font-mono text-[0.55rem] font-semibold uppercase', style.badge)}>
            {node.type === 'RALLY_CRY' ? 'RC' : node.type === 'DEFINING_OBJECTIVE' ? 'DO' : node.type === 'OUTCOME' ? 'O' : 'SO'}
          </span>
          <div>
            <p className={cn('text-sm', depth === 0 ? 'font-serif text-base font-semibold text-ink' : 'text-ink')}>
              {node.title}
            </p>
            {node.description && (
              <p className="text-xs text-ink-muted">{node.description}</p>
            )}
          </div>
        </div>
        {node.type === 'SUPPORTING_OUTCOME' && (
          <span className={cn(
            'rounded-full px-2.5 py-0.5 font-mono text-[0.6rem] font-medium',
            hasCommits ? 'bg-success-subtle text-success' : 'bg-cream-100 text-ink-subtle',
          )}>
            {hasCommits ? `${count} commit${count > 1 ? 's' : ''}` : 'No commits'}
          </span>
        )}
      </div>
      {node.children.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} commitCounts={commitCounts} />
      ))}
    </div>
  );
}
