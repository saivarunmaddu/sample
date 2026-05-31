package spring.ecommerce.project.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import spring.ecommerce.project.dto.PaymentRequest;
import spring.ecommerce.project.model.Payment;
import spring.ecommerce.project.model.UserEntity;
import spring.ecommerce.project.service.AuthService;
import spring.ecommerce.project.service.PaymentService;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final AuthService authService;

    public PaymentController(PaymentService paymentService, AuthService authService) {
        this.paymentService = paymentService;
        this.authService = authService;
    }

    @PostMapping("/process")
    public Payment processPayment(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody PaymentRequest request
    ) {
        UserEntity user = authService.requireUser(authorization);
        return paymentService.processPayment(user, request);
    }

    @GetMapping("/{paymentId}")
    public Payment checkPaymentStatus(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long paymentId
    ) {
        authService.requireUser(authorization);
        return paymentService.checkPaymentStatus(paymentId);
    }

    // CHANGED: Admin endpoint — marks the payment for an order as SUCCESS (called when admin marks order Delivered)
    @PutMapping("/admin/order/{orderId}/complete")
    public Map<String, String> completePaymentForOrder(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long orderId
    ) {
        UserEntity user = authService.requireUser(authorization);
        authService.requireAdmin(user);
        paymentService.markPaymentSuccessForOrder(orderId);
        return Map.of("message", "Payment status updated to SUCCESS");
    }
}

