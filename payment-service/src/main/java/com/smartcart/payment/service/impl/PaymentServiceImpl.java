package com.smartcart.payment.service.impl;

import com.smartcart.common.dto.PageResponse;
import com.smartcart.common.event.InventoryReservedEvent;
import com.smartcart.common.event.PaymentFailedEvent;
import com.smartcart.common.event.PaymentSuccessEvent;
import com.smartcart.common.exception.BadRequestException;
import com.smartcart.common.exception.ConflictException;
import com.smartcart.common.exception.ForbiddenException;
import com.smartcart.common.exception.ResourceNotFoundException;
import com.smartcart.payment.dto.PaymentRequest;
import com.smartcart.payment.dto.PaymentResponse;
import com.smartcart.payment.dto.RefundRequest;
import com.smartcart.payment.entity.Payment;
import com.smartcart.payment.entity.PaymentStatus;
import com.smartcart.payment.kafka.PaymentKafkaProducer;
import com.smartcart.payment.repository.PaymentRepository;
import com.smartcart.payment.service.IdempotencyService;
import com.smartcart.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentKafkaProducer kafkaProducer;
    private final IdempotencyService idempotencyService;

    @Override
    @Transactional
    public void processPaymentForOrder(InventoryReservedEvent event) {
        String orderNumber = event.getOrderNumber();
        log.info("Processing payment for reserved order: {}, user ID: {}, amount: {}",
                orderNumber, event.getUserId(), event.getTotalAmount());

        // Idempotency check 1: Redis / memory lock
        if (!idempotencyService.tryAcquire(orderNumber, 300)) {
            log.warn("Payment for order {} is currently being processed or already handled. Skipping duplicate event.", orderNumber);
            return;
        }

        // Idempotency check 2: DB check
        Optional<Payment> existingOpt = paymentRepository.findByOrderNumber(orderNumber);
        if (existingOpt.isPresent()) {
            Payment existing = existingOpt.get();
            log.info("Payment for order {} already exists in DB with status: {}", orderNumber, existing.getStatus());
            if (existing.getStatus() == PaymentStatus.SUCCESS) {
                // Re-emit success event to guarantee at-least-once downstream delivery
                PaymentSuccessEvent successEvent = PaymentSuccessEvent.builder()
                        .orderNumber(existing.getOrderNumber())
                        .userId(existing.getUserId())
                        .transactionId(existing.getTransactionId())
                        .amount(existing.getAmount())
                        .paymentMethod(existing.getPaymentMethod())
                        .build();
                kafkaProducer.publishPaymentSuccess(successEvent);
            }
            return;
        }

        // Payment Execution
        BigDecimal amount = event.getTotalAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("Invalid payment amount ({}) for order: {}", amount, orderNumber);
            handlePaymentFailure(orderNumber, event.getUserId(), "Invalid order amount: " + amount, event.getItems());
            return;
        }

        try {
            String transactionId = generateTransactionId();
            Payment payment = Payment.builder()
                    .orderNumber(orderNumber)
                    .transactionId(transactionId)
                    .userId(event.getUserId())
                    .userEmail(event.getUserEmail())
                    .amount(amount)
                    .currency("USD")
                    .paymentMethod("CARD")
                    .status(PaymentStatus.SUCCESS)
                    .build();

            Payment saved = paymentRepository.save(payment);
            idempotencyService.markCompleted(orderNumber, 86400);
            log.info("Payment successful for order: {}, txn: {}, amount: {}", orderNumber, transactionId, amount);

            PaymentSuccessEvent successEvent = PaymentSuccessEvent.builder()
                    .orderNumber(orderNumber)
                    .userId(saved.getUserId())
                    .transactionId(transactionId)
                    .amount(amount)
                    .paymentMethod(saved.getPaymentMethod())
                    .build();

            kafkaProducer.publishPaymentSuccess(successEvent);
        } catch (Exception e) {
            log.error("Payment processing failed unexpectedly for order: {}", orderNumber, e);
            handlePaymentFailure(orderNumber, event.getUserId(), "Payment gateway error: " + e.getMessage(), event.getItems());
        }
    }

    private void handlePaymentFailure(String orderNumber, Long userId, String reason, List<com.smartcart.common.dto.OrderItemDto> items) {
        String transactionId = generateTransactionId();
        Payment failedPayment = Payment.builder()
                .orderNumber(orderNumber)
                .transactionId(transactionId)
                .userId(userId)
                .amount(BigDecimal.ZERO)
                .currency("USD")
                .paymentMethod("CARD")
                .status(PaymentStatus.FAILED)
                .failureReason(reason)
                .build();

        try {
            paymentRepository.save(failedPayment);
        } catch (Exception e) {
            log.warn("Could not save failed payment record for order {}: {}", orderNumber, e.getMessage());
        }

        PaymentFailedEvent failedEvent = PaymentFailedEvent.builder()
                .orderNumber(orderNumber)
                .userId(userId)
                .reason(reason)
                .items(items)
                .build();

        kafkaProducer.publishPaymentFailed(failedEvent);
    }

    @Override
    @Transactional
    public PaymentResponse processDirectPayment(Long userId, String userEmail, PaymentRequest request) {
        log.info("Processing direct payment for user: {}, order: {}, amount: {}",
                userId, request.getOrderNumber(), request.getAmount());

        if (paymentRepository.existsByOrderNumber(request.getOrderNumber())) {
            throw new ConflictException("Payment already exists for order number: " + request.getOrderNumber());
        }

        String transactionId = generateTransactionId();
        Payment payment = Payment.builder()
                .orderNumber(request.getOrderNumber())
                .transactionId(transactionId)
                .userId(userId)
                .userEmail(userEmail)
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CARD")
                .status(PaymentStatus.SUCCESS)
                .build();

        Payment saved = paymentRepository.save(payment);
        idempotencyService.markCompleted(request.getOrderNumber(), 86400);

        PaymentSuccessEvent successEvent = PaymentSuccessEvent.builder()
                .orderNumber(saved.getOrderNumber())
                .userId(saved.getUserId())
                .transactionId(saved.getTransactionId())
                .amount(saved.getAmount())
                .paymentMethod(saved.getPaymentMethod())
                .build();
        kafkaProducer.publishPaymentSuccess(successEvent);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderNumber(Long userId, String orderNumber, boolean isAdmin) {
        log.debug("Fetching payment for order: {} by user: {} (admin={})", orderNumber, userId, isAdmin);
        Payment payment = paymentRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order number: " + orderNumber));

        if (!isAdmin && !payment.getUserId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to view this payment");
        }

        return mapToResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByTransactionId(Long userId, String transactionId, boolean isAdmin) {
        log.debug("Fetching payment for txn: {} by user: {} (admin={})", transactionId, userId, isAdmin);
        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with transaction ID: " + transactionId));

        if (!isAdmin && !payment.getUserId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to view this payment");
        }

        return mapToResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> getUserPayments(Long userId, int page, int size) {
        log.debug("Fetching payments for user ID: {}, page: {}, size: {}", userId, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Payment> paymentPage = paymentRepository.findByUserId(userId, pageable);
        return mapToPageResponse(paymentPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> getAllPayments(int page, int size) {
        log.debug("Fetching all payments (Admin), page: {}, size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Payment> paymentPage = paymentRepository.findAll(pageable);
        return mapToPageResponse(paymentPage);
    }

    @Override
    @Transactional
    public PaymentResponse processRefund(Long userId, String orderNumber, RefundRequest request, boolean isAdmin) {
        log.info("Processing refund for order: {} by user: {} (admin={})", orderNumber, userId, isAdmin);
        Payment payment = paymentRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order number: " + orderNumber));

        if (!isAdmin && !payment.getUserId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to refund this payment");
        }

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new BadRequestException("Cannot refund payment with status: " + payment.getStatus());
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setFailureReason("Refunded: " + request.getReason());
        Payment saved = paymentRepository.save(payment);
        log.info("Refund completed for order: {}, txn: {}", orderNumber, payment.getTransactionId());

        return mapToResponse(saved);
    }

    private String generateTransactionId() {
        return "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + (System.currentTimeMillis() % 100000);
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderNumber(payment.getOrderNumber())
                .transactionId(payment.getTransactionId())
                .userId(payment.getUserId())
                .userEmail(payment.getUserEmail())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .failureReason(payment.getFailureReason())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    private PageResponse<PaymentResponse> mapToPageResponse(Page<Payment> page) {
        List<PaymentResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.<PaymentResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isFirst(page.isFirst())
                .isLast(page.isLast())
                .build();
    }
}
