/**
 * Top-of-page metrics on the manager view. Each maps to an impact metric in the brief:
 *  - alignmentPercent      → strategic alignment visibility (locked commits)
 *  - planningCompletion    → weekly planning completion rate
 *  - reconciliationAccuracy → planned vs actual disposition (delivered share)
 *  - reviewSlaMetPercent   → manager review turnaround within SLA
 *  - timeToPlanMedianMinutes → time-to-plan median (first edit → lock)
 */
export interface TeamWeekRollup {
  teamId: string;
  weekStartDate: string;
  totalReports: number;
  alignmentPercent: number;
  planningCompletionPercent: number;
  reconciliationAccuracyPercent: number;
  reviewSlaMetPercent: number;
  carryForwardRate: number;
  timeToPlanMedianMinutes: number | null;
  outcomeCoverageCount: number;
}
