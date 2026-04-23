package com.st6.weeklycommit.service;

import com.st6.weeklycommit.domain.StrategicNode;
import com.st6.weeklycommit.domain.enums.StrategicNodeType;
import com.st6.weeklycommit.repository.StrategicNodeRepository;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Resolves the breadcrumb path from a node up to the Rally Cry root. Used:
 *
 * <ul>
 *   <li>by the lock action to snapshot {@code locked_outcome_path / titles}
 *       onto each commit
 *   <li>by the strategic-tree endpoint that powers the picker UI
 * </ul>
 */
@Service
public class StrategicPathResolver {

  private final StrategicNodeRepository nodes;

  public StrategicPathResolver(StrategicNodeRepository nodes) {
    this.nodes = nodes;
  }

  public record PathSegment(UUID id, StrategicNodeType type, String title) {}

  public record ResolvedPath(LinkedList<PathSegment> segments) {
    public String breadcrumb() {
      var sb = new StringBuilder();
      var first = true;
      for (var seg : segments) {
        if (!first) sb.append(" › ");
        sb.append(seg.title());
        first = false;
      }
      return sb.toString();
    }

    public Map<String, String> titlesById() {
      var out = new LinkedHashMap<String, String>();
      for (var seg : segments) {
        out.put(seg.id().toString(), seg.title());
      }
      return out;
    }
  }

  @Transactional(readOnly = true)
  public ResolvedPath resolve(UUID nodeId) {
    var rows = nodes.resolvePathRaw(nodeId);
    if (rows.isEmpty()) {
      throw new IllegalArgumentException("Strategic node not found: " + nodeId);
    }
    var segments = new LinkedList<PathSegment>();
    for (var row : rows) {
      var id = (UUID) row[0];
      var type = StrategicNodeType.valueOf((String) row[2]);
      var title = (String) row[3];
      segments.add(new PathSegment(id, type, title));
    }
    return new ResolvedPath(segments);
  }

  @Transactional(readOnly = true)
  public StrategicNode requireSupportingOutcome(UUID id) {
    var node = nodes.findById(id).orElseThrow(() -> new IllegalArgumentException("Node not found: " + id));
    if (node.getType() != StrategicNodeType.SUPPORTING_OUTCOME) {
      throw new IllegalArgumentException(
          "Commits must reference SUPPORTING_OUTCOME nodes; got " + node.getType());
    }
    return node;
  }
}
