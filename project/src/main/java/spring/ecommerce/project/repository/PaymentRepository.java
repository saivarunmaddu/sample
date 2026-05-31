package spring.ecommerce.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import spring.ecommerce.project.model.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
}

