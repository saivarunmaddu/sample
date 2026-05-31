package spring.ecommerce.project.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import spring.ecommerce.project.dto.UpdateOrderStatusRequest;
import spring.ecommerce.project.model.OrderEntity;
import spring.ecommerce.project.model.UserEntity;
import spring.ecommerce.project.service.AuthService;
import spring.ecommerce.project.service.OrderService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final AuthService authService;

    @Autowired
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

    // CHANGED: Admin endpoint to fetch ALL orders across all users
    @GetMapping("/all")
    public List<OrderEntity> getAllOrders(@RequestHeader("Authorization") String authorization) {
        UserEntity user = authService.requireUser(authorization);
        authService.requireAdmin(user);
        return orderService.getAllOrders();
    }

    // CHANGED: Admin endpoint to cancel (delete) an order
    @PutMapping("/{orderId}/cancel")
    public OrderEntity cancelOrder(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long orderId
    ) {
        UserEntity user = authService.requireUser(authorization);
        authService.requireAdmin(user);
        return orderService.cancelOrder(orderId);

    }
}


