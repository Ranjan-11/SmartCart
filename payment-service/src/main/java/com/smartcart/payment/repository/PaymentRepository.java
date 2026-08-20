package com.smartcart.payment.repository;

import com.smartcart.payment.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderNumber(String orderNumber);

    Optional<Payment> findByTransactionId(String transactionId);

    Optional<Payment> findByOrderNumberAndUserId(String orderNumber, Long userId);

    Page<Payment> findByUserId(Long userId, Pageable pageable);

    boolean existsByOrderNumber(String orderNumber);
}
