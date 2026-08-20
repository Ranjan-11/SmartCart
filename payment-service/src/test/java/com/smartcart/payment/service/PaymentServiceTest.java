package com.smartcart.payment.service;

import com.smartcart.common.dto.OrderItemDto;
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
import com.smartcart.payment.service.impl.PaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentKafkaProducer kafkaProducer;

    @Mock
    private IdempotencyService idempotencyService;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private Payment payment;

    @BeforeEach
    void setUp() {
        payment = Payment.builder()
                .id(1L)
                .orderNumber("ORD-1001")
                .transactionId("TXN-1001")
                .userId(1L)
                .userEmail("test@smartcart.com")
                .amount(new BigDecimal("199.98"))
                .currency("USD")
                .paymentMethod("CARD")
                .status(PaymentStatus.SUCCESS)
                .build();
    }

    @Test
    void testProcessPaymentForOrder_Success() {
        InventoryReservedEvent event = InventoryReservedEvent.builder()
                .orderNumber("ORD-1001")
                .userId(1L)
                .userEmail("test@smartcart.com")
                .totalAmount(new BigDecimal("199.98"))
                .items(List.of(OrderItemDto.builder().sku("SKU-1").quantity(1).build()))
                .build();

        when(idempotencyService.tryAcquire("ORD-1001", 300)).thenReturn(true);
        when(paymentRepository.findByOrderNumber("ORD-1001")).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));

        paymentService.processPaymentForOrder(event);

        verify(paymentRepository).save(any(Payment.class));
        verify(idempotencyService).markCompleted("ORD-1001", 86400);
        verify(kafkaProducer).publishPaymentSuccess(any(PaymentSuccessEvent.class));
    }

    @Test
    void testProcessPaymentForOrder_InvalidAmount_PublishesPaymentFailed() {
        InventoryReservedEvent event = InventoryReservedEvent.builder()
                .orderNumber("ORD-1002")
                .userId(1L)
                .userEmail("test@smartcart.com")
                .totalAmount(BigDecimal.ZERO)
                .items(List.of(OrderItemDto.builder().sku("SKU-1").quantity(1).build()))
                .build();

        when(idempotencyService.tryAcquire("ORD-1002", 300)).thenReturn(true);
        when(paymentRepository.findByOrderNumber("ORD-1002")).thenReturn(Optional.empty());

        paymentService.processPaymentForOrder(event);

        verify(kafkaProducer).publishPaymentFailed(any(PaymentFailedEvent.class));
    }

    @Test
    void testProcessPaymentForOrder_DuplicateEvent_IdempotentCheckSkips() {
        InventoryReservedEvent event = InventoryReservedEvent.builder()
                .orderNumber("ORD-1001")
                .userId(1L)
                .totalAmount(new BigDecimal("199.98"))
                .build();

        when(idempotencyService.tryAcquire("ORD-1001", 300)).thenReturn(false);

        paymentService.processPaymentForOrder(event);

        verify(paymentRepository, never()).save(any());
        verify(kafkaProducer, never()).publishPaymentSuccess(any());
    }

    @Test
    void testProcessPaymentForOrder_AlreadyCompletedInDb_RePublishesSuccess() {
        InventoryReservedEvent event = InventoryReservedEvent.builder()
                .orderNumber("ORD-1001")
                .userId(1L)
                .totalAmount(new BigDecimal("199.98"))
                .build();

        when(idempotencyService.tryAcquire("ORD-1001", 300)).thenReturn(true);
        when(paymentRepository.findByOrderNumber("ORD-1001")).thenReturn(Optional.of(payment));

        paymentService.processPaymentForOrder(event);

        verify(kafkaProducer).publishPaymentSuccess(any(PaymentSuccessEvent.class));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void testProcessDirectPayment_Success() {
        PaymentRequest request = PaymentRequest.builder()
                .orderNumber("ORD-2001")
                .amount(new BigDecimal("50.00"))
                .paymentMethod("CARD")
                .currency("USD")
                .build();

        when(paymentRepository.existsByOrderNumber("ORD-2001")).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(2L);
            return p;
        });

        PaymentResponse response = paymentService.processDirectPayment(1L, "test@smartcart.com", request);

        assertThat(response).isNotNull();
        assertThat(response.getOrderNumber()).isEqualTo("ORD-2001");
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        verify(kafkaProducer).publishPaymentSuccess(any(PaymentSuccessEvent.class));
    }

    @Test
    void testProcessDirectPayment_AlreadyExists_ThrowsConflict() {
        PaymentRequest request = PaymentRequest.builder()
                .orderNumber("ORD-1001")
                .amount(new BigDecimal("50.00"))
                .build();

        when(paymentRepository.existsByOrderNumber("ORD-1001")).thenReturn(true);

        assertThatThrownBy(() -> paymentService.processDirectPayment(1L, "test@smartcart.com", request))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void testGetPaymentByOrderNumber_Owner_Success() {
        when(paymentRepository.findByOrderNumber("ORD-1001")).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.getPaymentByOrderNumber(1L, "ORD-1001", false);

        assertThat(response.getOrderNumber()).isEqualTo("ORD-1001");
        assertThat(response.getUserId()).isEqualTo(1L);
    }

    @Test
    void testGetPaymentByOrderNumber_NotOwner_ThrowsForbidden() {
        when(paymentRepository.findByOrderNumber("ORD-1001")).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.getPaymentByOrderNumber(2L, "ORD-1001", false))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void testGetPaymentByOrderNumber_NotFound_ThrowsNotFound() {
        when(paymentRepository.findByOrderNumber("ORD-NONEXISTENT")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getPaymentByOrderNumber(1L, "ORD-NONEXISTENT", false))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void testProcessRefund_Success() {
        when(paymentRepository.findByOrderNumber("ORD-1001")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);

        RefundRequest request = RefundRequest.builder().reason("Customer return").build();
        PaymentResponse response = paymentService.processRefund(1L, "ORD-1001", request, false);

        assertThat(response.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
        verify(paymentRepository).save(payment);
    }

    @Test
    void testProcessRefund_NotSuccess_ThrowsBadRequest() {
        payment.setStatus(PaymentStatus.FAILED);
        when(paymentRepository.findByOrderNumber("ORD-1001")).thenReturn(Optional.of(payment));

        RefundRequest request = RefundRequest.builder().reason("Customer return").build();

        assertThatThrownBy(() -> paymentService.processRefund(1L, "ORD-1001", request, false))
                .isInstanceOf(BadRequestException.class);
    }
}
