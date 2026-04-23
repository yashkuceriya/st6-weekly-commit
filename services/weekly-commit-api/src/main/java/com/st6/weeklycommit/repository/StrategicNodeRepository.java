package com.st6.weeklycommit.repository;

import com.st6.weeklycommit.domain.StrategicNode;
import com.st6.weeklycommit.domain.enums.StrategicNodeType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface StrategicNodeRepository extends JpaRepository<StrategicNode, UUID> {

  List<StrategicNode> findByTypeAndActiveTrueOrderByDisplayOrderAsc(StrategicNodeType type);

  @Query(value = "SELECT * FROM strategic_node WHERE active = TRUE ORDER BY display_order, title", nativeQuery = true)
  List<StrategicNode> findAllActive();

  /**
   * Resolve the path from RALLY_CRY (root) down to a node, in order. Uses a
   * recursive CTE with an explicit cycle guard — PG warns that recursive
   * traversal must protect against cycles, so we carry a path[] and bail if
   * we see a node twice.
   *
   * <p>Returns rows in root-first order so the caller can build the
   * breadcrumb without re-sorting.
   */
  @Query(
      value =
          """
          WITH RECURSIVE node_path(id, parent_id, type, title, depth, cycle_guard) AS (
              SELECT id, parent_id, type::text, title, 0,
                     ARRAY[id]
                FROM strategic_node WHERE id = :nodeId
              UNION ALL
              SELECT s.id, s.parent_id, s.type::text, s.title, np.depth + 1,
                     np.cycle_guard || s.id
                FROM strategic_node s
                JOIN node_path np ON s.id = np.parent_id
                WHERE NOT s.id = ANY(np.cycle_guard)
          )
          SELECT * FROM node_path ORDER BY depth DESC
          """,
      nativeQuery = true)
  List<Object[]> resolvePathRaw(UUID nodeId);
}
