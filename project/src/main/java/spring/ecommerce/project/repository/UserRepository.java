package spring.ecommerce.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import spring.ecommerce.project.model.UserEntity;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
}

