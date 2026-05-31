package spring.ecommerce.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import spring.ecommerce.project.model.Payment;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // CHANGED: Used by PaymentService to update payment status when admin marks order as Delivered
    Optional<Payment> findByOrderId(Long orderId);

}

