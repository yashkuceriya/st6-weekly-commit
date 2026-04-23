import { useState } from 'react';
import { useGetRollupHistoryQuery, useGetTeamExceptionsQuery } from '@st6/api-client';
import { Card, CardBody, EmptyState, SectionHeader, Spinner } from '@st6/shared-ui';
import { ExceptionCardView } from '../components/ExceptionCardView';
import { RollupBar } from '../components/RollupBar';
import { currentWeekStartIso, formatWeekRange } from '../lib/format';

// Seeded Engineering team — see V9__seed.sql.
// In a real deployment this comes from /api/users/me, which lists the teams the
// current user manages. Hardcoded for the take-home demo.
const DEMO_TEAM_ID = '00000000-0000-0000-0000-000000000010';

export function ManagerQueuePage() {
  const [weekStart] = useState(currentWeekStartIso());
  const { data, isLoading, error } = useGetTeamExceptionsQuery({
    teamId: DEMO_TEAM_ID,
    weekStartDate: weekStart,
  });
  const { data: history } = useGetRollupHistoryQuery({
    teamId: DEMO_TEAM_ID,
    endingWeek: weekStart,
    weeks: 8,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Couldn't load the team queue"
        description="The /teams/{id}/exceptions endpoint didn't respond. Make sure the API is running."
      />
    );
  }

  const cards = data.exceptions.content;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={`Engineering · ${formatWeekRange(weekStart)}`}
        title="Exception queue"
        subtitle="The cards below answer 'who needs my attention right now?'. Not a passive dashboard."
      />

      <RollupBar rollup={data.rollup} history={history} />

      {cards.length === 0 ? (
        <Card variant="soft">
          <CardBody className="py-12 text-center">
            <p className="font-serif text-2xl text-success">All clear.</p>
            <p className="mt-2 text-sm text-ink-muted">
              No overdue locks, SLA misses, repeated carry-forwards, or coverage gaps this week.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <ExceptionCardView key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
