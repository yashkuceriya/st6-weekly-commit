import type { StrategicNodeType } from './enums';

export interface StrategicNode {
  id: string;
  type: StrategicNodeType;
  parentId: string | null;
  title: string;
  description: string | null;
  owningTeamId: string | null;
  active: boolean;
  activeFrom: string;
  activeUntil: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StrategicNodeWithChildren extends StrategicNode {
  children: StrategicNodeWithChildren[];
}

/**
 * Path from RALLY_CRY (root) down to the selected node, in order.
 * Used for breadcrumb rendering and lock-time snapshotting.
 */
export interface StrategicPath {
  segments: Array<{
    id: string;
    type: StrategicNodeType;
    title: string;
  }>;
}
