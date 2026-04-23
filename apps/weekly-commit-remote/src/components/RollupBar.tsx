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
    <div className="space-y-4">
      {/* Score cards grid — individual cards like the peer's dashboard */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <ScoreCard
          label="Aligned"
          value={`${rollup.alignmentPercent}%`}
          good={rollup.alignmentPercent >= 95}
          trend={trends.alignment}
          icon={<AlignIcon />}
        />
        <ScoreCard
          label="Locked"
          value={`${rollup.planningCompletionPercent}%`}
          good={rollup.planningCompletionPercent >= 95}
          trend={trends.lock}
          icon={<LockIcon />}
        />
        <ScoreCard
          label="Delivered"
          value={`${rollup.reconciliationAccuracyPercent}%`}
          good={rollup.reconciliationAccuracyPercent >= 75}
          icon={<CheckIcon />}
        />
        <ScoreCard
          label="Review SLA"
          value={`${rollup.reviewSlaMetPercent}%`}
          good={rollup.reviewSlaMetPercent >= 90}
          trend={trends.reviewSla}
          icon={<ClockIcon />}
        />
        <ScoreCard
          label="Carry-fwd"
          value={`${rollup.carryForwardRate}%`}
          good={rollup.carryForwardRate <= 15}
          invertGood
          trend={trends.carry}
          trendGoodLow
          icon={<CarryIcon />}
        />
        <ScoreCard
          label="Time-to-plan"
          value={rollup.timeToPlanMedianMinutes != null ? `${rollup.timeToPlanMedianMinutes}m` : '—'}
          good={true}
          icon={<TimerIcon />}
        />
      </div>
      <p className="text-xs text-ink-subtle">
        {rollup.totalReports} reports · {rollup.outcomeCoverageCount} outcomes covered
        {history && history.length > 0 && ` · ${history.length}-week trend`}
      </p>
    </div>
  );
}

function pickTrends(history: RollupHistoryPoint[]) {
  return {
    alignment: history.map((h) => h.alignmentPercent),
    lock: history.map((h) => h.lockRate),
    reviewSla: history.map((h) => h.reviewSlaPercent),
    carry: history.map((h) => h.carryRate),
  };
}

interface ScoreCardProps {
  label: string;
  value: string;
  good: boolean;
  invertGood?: boolean;
  trend?: number[];
  trendGoodLow?: boolean;
  icon?: React.ReactNode;
}

function ScoreCard({ label, value, good, invertGood, trend, trendGoodLow, icon }: ScoreCardProps) {
  const positive = invertGood ? !good : good;
  return (
    <Card className="transition-shadow hover:shadow-lift">
      <CardBody className="space-y-2 px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-subtle">{label}</p>
          {icon && (
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', positive ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning')}>
              {icon}
            </span>
          )}
        </div>
        <p className={cn('font-serif text-[1.75rem] leading-none tracking-tight', positive ? 'text-ink' : 'text-warning')}>
          {value}
        </p>
        {trend && trend.length > 0 && (
          <Sparkline values={trend} className="mt-1" goodLow={trendGoodLow} />
        )}
      </CardBody>
    </Card>
  );
}

// Small inline SVG icons for score cards
function AlignIcon() {
  return <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1v14M1 8h14" strokeLinecap="round" /></svg>;
}
function LockIcon() {
  return <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round" /></svg>;
}
function CheckIcon() {
  return <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8.5l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ClockIcon() {
  return <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5" /><path d="M8 4v4l2.5 1.5" strokeLinecap="round" /></svg>;
}
function CarryIcon() {
  return <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h9m-3-3l3 3-3 3M14 3v10" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function TimerIcon() {
  return <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="9" r="5.5" /><path d="M8 6v3l2 1M6 1h4" strokeLinecap="round" /></svg>;
}
