package spring.ecommerce.project.dto;

import jakarta.validation.constraints.NotNull;
import spring.ecommerce.project.model.PaymentMethod;

public record PaymentRequest(
        @NotNull(message = "Order ID is required") Long orderId,
        @NotNull(message = "Payment method is required") PaymentMethod paymentMethod
) {
}

