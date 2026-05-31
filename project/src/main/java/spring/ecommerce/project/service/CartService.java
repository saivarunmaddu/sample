package spring.ecommerce.project.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import spring.ecommerce.project.dto.CartRequest;
import spring.ecommerce.project.dto.UpdateQuantityRequest;
import spring.ecommerce.project.exception.ApiException;
import spring.ecommerce.project.model.CartItem;
import spring.ecommerce.project.model.Product;
import spring.ecommerce.project.model.UserEntity;
import spring.ecommerce.project.repository.CartItemRepository;
import spring.ecommerce.project.repository.ProductRepository;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(CartItemRepository cartItemRepository, ProductRepository productRepository) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    public CartItem addToCart(UserEntity user, CartRequest request) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ApiException("Product not found"));

        CartItem item = new CartItem();
        item.setUser(user);
        item.setProduct(product);
        item.setQuantity(request.quantity());
        item.setTotalPrice(product.getPrice().multiply(BigDecimal.valueOf(request.quantity())));

        return cartItemRepository.save(item);
    }

    public Map<String, Object> viewCart(UserEntity user) {
        List<CartItem> items = cartItemRepository.findByUserId(user.getId());
        BigDecimal total = items.stream()
                .map(CartItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> response = new HashMap<>();
        response.put("cartId", user.getId());
        response.put("userId", user.getId());
        response.put("items", items);
        response.put("totalPrice", total);
        return response;
    }

    @Transactional
    public CartItem updateQuantity(UserEntity user, Long itemId, UpdateQuantityRequest request) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ApiException("Cart item not found"));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new ApiException("Cannot update another user's cart item");
        }

        item.setQuantity(request.quantity());
        item.setTotalPrice(item.getProduct().getPrice().multiply(BigDecimal.valueOf(request.quantity())));
        return item;
    }

    public void removeItem(UserEntity user, Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ApiException("Cart item not found"));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new ApiException("Cannot remove another user's cart item");
        }

        cartItemRepository.delete(item);
    }

    public List<CartItem> getCartItems(UserEntity user) {
        return cartItemRepository.findByUserId(user.getId());
    }

    public void clearCart(UserEntity user) {
        List<CartItem> items = cartItemRepository.findByUserId(user.getId());
        cartItemRepository.deleteAll(items);
    }
}

