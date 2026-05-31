package spring.ecommerce.project.dto;

import jakarta.validation.constraints.NotNull;
import spring.ecommerce.project.model.OrderStatus;

public record UpdateOrderStatusRequest(@NotNull(message = "Status is required") OrderStatus status) {
}

