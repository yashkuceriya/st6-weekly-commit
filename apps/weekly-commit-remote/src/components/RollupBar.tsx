import type { RollupHistoryPoint } from '@st6/api-client';
import type { TeamWeekRollup } from '@st6/shared-types';
import { Card, CardBody, Sparkline, cn } from '@st6/shared-ui';

interface RollupBarProps {
  rollup: TeamWeekRollup;
  history?: RollupHistoryPoint[];
}

export function RollupBar({ rollup, history }: RollupBarProps) {
  const trends = pickTrends(history ?? []);
  return (
    <Card variant="soft">
      <CardBody>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-6">
          <Metric
            label="Aligned"
            value={`${rollup.alignmentPercent}%`}
            good={rollup.alignmentPercent >= 95}
            trend={trends.alignment}
          />
          <Metric
            label="Locked"
            value={`${rollup.planningCompletionPercent}%`}
            good={rollup.planningCompletionPercent >= 95}
            trend={trends.lock}
          />
          <Metric
            label="Delivered"
            value={`${rollup.reconciliationAccuracyPercent}%`}
            good={rollup.reconciliationAccuracyPercent >= 75}
          />
          <Metric
            label="Review SLA"
            value={`${rollup.reviewSlaMetPercent}%`}
            good={rollup.reviewSlaMetPercent >= 90}
            trend={trends.reviewSla}
          />
          <Metric
            label="Carry-fwd"
            value={`${rollup.carryForwardRate}%`}
            good={rollup.carryForwardRate <= 15}
            invertGood
            trend={trends.carry}
            trendGoodLow
          />
          <Metric
            label="Time-to-plan"
            value={rollup.timeToPlanMedianMinutes != null ? `${rollup.timeToPlanMedianMinutes}m` : '—'}
            good={true}
          />
        </div>
        <p className="mt-4 text-xs text-ink-subtle">
          Reports: {rollup.totalReports} · Distinct outcomes covered: {rollup.outcomeCoverageCount}
          {history && history.length > 0 && ` · Trend window: last ${history.length} weeks`}
        </p>
      </CardBody>
    </Card>
  );
}

function pickTrends(history: RollupHistoryPoint[]): {
  alignment: number[];
  lock: number[];
  reviewSla: number[];
  carry: number[];
} {
  return {
    alignment: history.map((h) => h.alignmentPercent),
    lock: history.map((h) => h.lockRate),
    reviewSla: history.map((h) => h.reviewSlaPercent),
    carry: history.map((h) => h.carryRate),
  };
}

interface MetricProps {
  label: string;
  value: string;
  good: boolean;
  invertGood?: boolean;
  trend?: number[];
  trendGoodLow?: boolean;
}

function Metric({ label, value, good, invertGood, trend, trendGoodLow }: MetricProps) {
  const positive = invertGood ? !good : good;
  return (
    <div>
      <p className="font-mono text-[0.65rem] uppercase tracking-wider text-ink-subtle">{label}</p>
      <p className={cn('mt-1 font-serif text-2xl', positive ? 'text-ink' : 'text-warning')}>{value}</p>
      {trend && trend.length > 0 && (
        <Sparkline values={trend} className="mt-1" goodLow={trendGoodLow} />
      )}
    </div>
  );
}
