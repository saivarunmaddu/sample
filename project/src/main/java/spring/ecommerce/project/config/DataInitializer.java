package spring.ecommerce.project.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import spring.ecommerce.project.model.Product;
import spring.ecommerce.project.model.Role;
import spring.ecommerce.project.model.UserEntity;
import spring.ecommerce.project.repository.ProductRepository;
import spring.ecommerce.project.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedData(UserRepository userRepository, ProductRepository productRepository) {
        return args -> {
            seedDefaultAdmin(userRepository);
            seedProducts(productRepository);
        };
    }

    private void seedDefaultAdmin(UserRepository userRepository) {
        userRepository.findByEmail("admin@shop.com").orElseGet(() -> {
            UserEntity admin = new UserEntity();
            admin.setName("Default Admin");
            admin.setEmail("admin@shop.com");
            admin.setPassword("admin123");
            admin.setRole(Role.ADMIN);
            admin.setPhone("9999999999");
            admin.setAddress("Head Office");
            return userRepository.save(admin);
        });
    }

    private void seedProducts(ProductRepository productRepository) {
        if (productRepository.count() > 0) {
            return;
        }

        productRepository.saveAll(List.of(
                buildProduct("Wireless Headphones", "Noise-cancelling over-ear headphones", new BigDecimal("199.99"), 30, "Electronics", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"),
                buildProduct("Smart Watch", "Fitness tracker with heart-rate monitor", new BigDecimal("149.00"), 50, "Wearables", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"),
                buildProduct("Gaming Mouse", "Ergonomic RGB gaming mouse", new BigDecimal("59.50"), 100, "Accessories", "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600"),
                buildProduct("Casual Sneakers", "Comfortable everyday sneakers", new BigDecimal("89.99"), 45, "Fashion", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600")
        ));
    }

    private Product buildProduct(String name, String description, BigDecimal price, int stock, String category, String image) {
        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setStock(stock);
        product.setCategory(category);
        product.setImage(image);
        return product;
    }
}

