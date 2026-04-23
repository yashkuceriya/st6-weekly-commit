export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  managerId: string | null;
  teamId: string | null;
  roles: Array<'IC' | 'MANAGER' | 'ADMIN'>;
}
