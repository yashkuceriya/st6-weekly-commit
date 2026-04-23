import { Navigate, Route, Routes } from 'react-router-dom';
import { PlannerPage } from './pages/PlannerPage';
import { ReconciliationPage } from './pages/ReconciliationPage';
import { ManagerQueuePage } from './pages/ManagerQueuePage';

export interface WeeklyCommitAppProps {
  /** Base path under which the remote's internal router operates. */
  basePath?: string;
}

/**
 * Federated entry point. The host mounts this under any subpath; the remote
 * uses relative routes so it doesn't care what base path it lives at.
 */
export default function WeeklyCommitApp(_props: WeeklyCommitAppProps) {
  return (
    <Routes>
      <Route index element={<Navigate to="me" replace />} />
      <Route path="me" element={<PlannerPage />} />
      <Route path="me/reconcile" element={<ReconciliationPage />} />
      <Route path="team" element={<ManagerQueuePage />} />
      <Route path="*" element={<Navigate to="me" replace />} />
    </Routes>
  );
}
