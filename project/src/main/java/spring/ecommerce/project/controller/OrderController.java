package spring.ecommerce.project.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import spring.ecommerce.project.dto.UpdateOrderStatusRequest;
import spring.ecommerce.project.model.OrderEntity;
import spring.ecommerce.project.model.UserEntity;
import spring.ecommerce.project.service.AuthService;
import spring.ecommerce.project.service.OrderService;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final AuthService authService;

    public OrderController(OrderService orderService, AuthService authService) {
        this.orderService = orderService;
        this.authService = authService;
    }

    @PostMapping("/place")
    public OrderEntity placeOrder(@RequestHeader("Authorization") String authorization) {
        UserEntity user = authService.requireUser(authorization);
        return orderService.placeOrder(user);
    }

    @GetMapping
    public List<OrderEntity> getByUser(@RequestHeader("Authorization") String authorization) {
        UserEntity user = authService.requireUser(authorization);
        return orderService.getOrdersByUser(user);
    }

    @PutMapping("/{orderId}/status")
    public OrderEntity updateOrderStatus(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        UserEntity user = authService.requireUser(authorization);
        authService.requireAdmin(user);
        return orderService.updateOrderStatus(orderId, request);
    }
}

