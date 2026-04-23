/**
 * Chess layer = organisation-configurable categorisation/prioritisation taxonomy.
 *
 * Brief is silent on exact semantics — modelled here as an admin-configurable
 * reference table per second-research recommendation, not hard-coded king/queen.
 */
export interface ChessLayerCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  displayOrder: number;
  /**
   * Reporting weight — affects roll-up scoring (0..1). Defaults to 1.
   */
  weight: number;
  isDefault: boolean;
  active: boolean;
}
