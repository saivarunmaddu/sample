package spring.ecommerce.project.dto;

import spring.ecommerce.project.model.Role;

public record AuthResponse(Long userId, String name, String email, Role role, String token) {
}

