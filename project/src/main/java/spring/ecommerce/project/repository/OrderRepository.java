package spring.ecommerce.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import spring.ecommerce.project.model.OrderEntity;

import java.util.List;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    List<OrderEntity> findByUserId(Long userId);
}

