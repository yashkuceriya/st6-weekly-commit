package com.st6.weeklycommit.web;

import com.st6.weeklycommit.domain.StrategicNode;
import com.st6.weeklycommit.domain.enums.StrategicNodeType;
import com.st6.weeklycommit.repository.StrategicNodeRepository;
import com.st6.weeklycommit.web.dto.Mappers;
import com.st6.weeklycommit.web.dto.StrategicNodeDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/strategic-nodes")
@Tag(name = "Strategic nodes", description = "RCDO hierarchy queries.")
public class StrategicNodeController {

  private final StrategicNodeRepository nodes;

  public StrategicNodeController(StrategicNodeRepository nodes) {
    this.nodes = nodes;
  }

  @GetMapping("/tree")
  @Operation(summary = "Full RCDO tree, root-first, with nested children for the picker UI.")
  public List<StrategicNodeDto> tree() {
    var all = nodes.findAllActive();
    var byParent = new HashMap<UUID, List<StrategicNode>>();
    var roots = new ArrayList<StrategicNode>();
    for (var n : all) {
      if (n.getType() == StrategicNodeType.RALLY_CRY) {
        roots.add(n);
      } else if (n.getParent() != null) {
        byParent.computeIfAbsent(n.getParent().getId(), k -> new ArrayList<>()).add(n);
      }
    }
    var result = new ArrayList<StrategicNodeDto>();
    for (var root : roots) {
      result.add(toTree(root, byParent));
    }
    return result;
  }

  private StrategicNodeDto toTree(StrategicNode n, Map<UUID, List<StrategicNode>> byParent) {
    var children = new ArrayList<StrategicNodeDto>();
    // Take a mutable copy so the in-place sort works even when the map yielded
    // our placeholder empty list.
    var kids = new ArrayList<>(byParent.getOrDefault(n.getId(), List.of()));
    kids.sort((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()));
    for (var child : kids) {
      children.add(toTree(child, byParent));
    }
    return Mappers.toDtoWithChildren(n, children);
  }
}
