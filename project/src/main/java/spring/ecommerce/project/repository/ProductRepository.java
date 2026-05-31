package spring.ecommerce.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import spring.ecommerce.project.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
}

