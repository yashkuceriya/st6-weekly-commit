package com.st6.weeklycommit.web;

import com.st6.weeklycommit.web.dto.UserMeDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/me")
@Tag(name = "Me", description = "Current user identity + role.")
public class UserMeController {

  private final CurrentUserService currentUser;

  public UserMeController(CurrentUserService currentUser) {
    this.currentUser = currentUser;
  }

  @GetMapping
  @Operation(summary = "Identity of the authenticated principal + roles.")
  public UserMeDto me() {
    var u = currentUser.require();
    var roles = new java.util.ArrayList<String>();
    roles.add("IC");
    if (u.isManager()) roles.add("MANAGER");
    if (u.isAdmin()) roles.add("ADMIN");
    return new UserMeDto(
        u.getId(),
        u.getEmail(),
        u.getDisplayName(),
        u.getManager() == null ? null : u.getManager().getId(),
        u.getTeam() == null ? null : u.getTeam().getId(),
        List.copyOf(roles));
  }
}
