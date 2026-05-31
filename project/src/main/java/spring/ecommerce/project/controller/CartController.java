package spring.ecommerce.project.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import spring.ecommerce.project.dto.CartRequest;
import spring.ecommerce.project.dto.UpdateQuantityRequest;
import spring.ecommerce.project.model.CartItem;
import spring.ecommerce.project.model.UserEntity;
import spring.ecommerce.project.service.AuthService;
import spring.ecommerce.project.service.CartService;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final AuthService authService;

    public CartController(CartService cartService, AuthService authService) {
        this.cartService = cartService;
        this.authService = authService;
    }

    @PostMapping("/add")
    public CartItem addToCart(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody CartRequest request
    ) {
        UserEntity user = authService.requireUser(authorization);
        return cartService.addToCart(user, request);
    }

    @GetMapping
    public Map<String, Object> viewCart(@RequestHeader("Authorization") String authorization) {
        UserEntity user = authService.requireUser(authorization);
        return cartService.viewCart(user);
    }

    @PutMapping("/{itemId}")
    public CartItem updateQuantity(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateQuantityRequest request
    ) {
        UserEntity user = authService.requireUser(authorization);
        return cartService.updateQuantity(user, itemId, request);
    }

    @DeleteMapping("/{itemId}")
    public String removeItem(@RequestHeader("Authorization") String authorization, @PathVariable Long itemId) {
        UserEntity user = authService.requireUser(authorization);
        cartService.removeItem(user, itemId);
        return "Item removed from cart";
    }
}

