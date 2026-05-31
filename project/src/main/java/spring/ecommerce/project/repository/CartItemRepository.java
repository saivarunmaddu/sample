package spring.ecommerce.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import spring.ecommerce.project.model.CartItem;

import java.util.List;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserId(Long userId);
}

