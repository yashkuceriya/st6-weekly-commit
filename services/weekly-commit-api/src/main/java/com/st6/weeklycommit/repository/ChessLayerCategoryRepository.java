package com.st6.weeklycommit.repository;

import com.st6.weeklycommit.domain.ChessLayerCategory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChessLayerCategoryRepository extends JpaRepository<ChessLayerCategory, UUID> {

  List<ChessLayerCategory> findByActiveTrueOrderByDisplayOrderAscNameAsc();
}
