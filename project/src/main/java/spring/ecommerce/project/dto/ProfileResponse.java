package spring.ecommerce.project.dto;

import spring.ecommerce.project.model.Role;

public record ProfileResponse(Long userId, String name, String email, String phone, String address, Role role) {
}

