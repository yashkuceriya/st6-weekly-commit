package com.st6.weeklycommit.web;

import com.st6.weeklycommit.repository.ChessLayerCategoryRepository;
import com.st6.weeklycommit.web.dto.ChessLayerDto;
import com.st6.weeklycommit.web.dto.Mappers;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chess-layers")
@Tag(name = "Chess layers", description = "Admin-configurable categorisation taxonomy.")
public class ChessLayerController {

  private final ChessLayerCategoryRepository repo;

  public ChessLayerController(ChessLayerCategoryRepository repo) {
    this.repo = repo;
  }

  @GetMapping
  @Operation(summary = "All active chess layer categories, in display order.")
  public List<ChessLayerDto> list() {
    return repo.findByActiveTrueOrderByDisplayOrderAscNameAsc().stream().map(Mappers::toDto).toList();
  }
}
