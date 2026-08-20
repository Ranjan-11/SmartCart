package com.smartcart.order.service;

import com.smartcart.common.dto.ApiResponse;
import com.smartcart.common.dto.OrderItemDto;
import com.smartcart.common.event.InventoryFailedEvent;
import com.smartcart.common.event.InventoryReservedEvent;
import com.smartcart.common.event.OrderCancelledEvent;
import com.smartcart.common.event.OrderCreatedEvent;
import com.smartcart.common.event.PaymentFailedEvent;
import com.smartcart.common.event.PaymentSuccessEvent;
import com.smartcart.common.exception.BadRequestException;
import com.smartcart.common.exception.ForbiddenException;
import com.smartcart.common.exception.ResourceNotFoundException;
import com.smartcart.order.client.CartClient;
import com.smartcart.order.client.CartItemResponse;
import com.smartcart.order.client.CartResponse;
import com.smartcart.order.dto.CancelOrderRequest;
import com.smartcart.order.dto.CheckoutRequest;
import com.smartcart.order.dto.OrderResponse;
import com.smartcart.order.entity.Order;
import com.smartcart.order.entity.OrderItem;
import com.smartcart.order.entity.OrderStatus;
import com.smartcart.order.kafka.OrderKafkaProducer;
import com.smartcart.order.repository.OrderRepository;
import com.smartcart.order.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartClient cartClient;

    @Mock
    private OrderKafkaProducer kafkaProducer;

    @InjectMocks
    private OrderServiceImpl orderService;

    private Order order;

    @BeforeEach
    void setUp() {
        order = Order.builder()
                .id(1L)
                .orderNumber("ORD-TEST-12345")
                .userId(1L)
                .userEmail("test@smartcart.com")
                .totalAmount(new BigDecimal("199.98"))
                .status(OrderStatus.CREATED)
                .shippingAddress("123 Test Street")
                .paymentMethod("CARD")
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder()
                .id(1L)
                .order(order)
                .sku("PHONE-01")
                .productName("Smartphone X")
                .unitPrice(new BigDecimal("99.99"))
                .quantity(2)
                .subtotal(new BigDecimal("199.98"))
                .build();

        order.getItems().add(item);
    }

    @Test
    void testCreateOrder_FromCart_Success() {
        CartItemResponse cartItem = CartItemResponse.builder()
                .sku("PHONE-01")
                .productName("Smartphone X")
                .unitPrice(new BigDecimal("99.99"))
                .quantity(2)
                .subtotal(new BigDecimal("199.98"))
                .build();

        CartResponse cartResponse = CartResponse.builder()
                .userId(1L)
                .items(List.of(cartItem))
                .totalItemCount(2)
                .totalPrice(new BigDecimal("199.98"))
                .build();

        when(cartClient.getCart(1L)).thenReturn(ApiResponse.success("Cart retrieved", cartResponse));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            o.setId(1L);
            return o;
        });

        CheckoutRequest request = CheckoutRequest.builder()
                .shippingAddress("123 Test Street")
                .paymentMethod("CARD")
                .build();

        OrderResponse response = orderService.createOrder(1L, "test@smartcart.com", request);

        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(1L);
        assertThat(response.getStatus()).isEqualTo(OrderStatus.CREATED);
        assertThat(response.getTotalAmount()).isEqualByComparingTo("199.98");
        assertThat(response.getItems()).hasSize(1);
        verify(kafkaProducer).publishOrderCreated(any(OrderCreatedEvent.class));
        verify(cartClient).clearCart(1L);
    }

    @Test
    void testCreateOrder_EmptyCart_ThrowsBadRequestException() {
        CartResponse emptyCart = CartResponse.builder()
                .userId(1L)
                .items(Collections.emptyList())
                .build();

        when(cartClient.getCart(1L)).thenReturn(ApiResponse.success("Cart retrieved", emptyCart));

        CheckoutRequest request = CheckoutRequest.builder()
                .shippingAddress("123 Test Street")
                .build();

        assertThatThrownBy(() -> orderService.createOrder(1L, "test@smartcart.com", request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void testCreateOrder_DirectItems_Success() {
        OrderItemDto directItem = OrderItemDto.builder()
                .sku("LAPTOP-01")
                .productName("Laptop Pro")
                .price(new BigDecimal("999.00"))
                .quantity(1)
                .build();

        CheckoutRequest request = CheckoutRequest.builder()
                .shippingAddress("456 Market St")
                .paymentMethod("CARD")
                .items(List.of(directItem))
                .build();

        when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            o.setId(2L);
            return o;
        });

        OrderResponse response = orderService.createOrder(1L, "test@smartcart.com", request);

        assertThat(response).isNotNull();
        assertThat(response.getTotalAmount()).isEqualByComparingTo("999.00");
        verify(kafkaProducer).publishOrderCreated(any(OrderCreatedEvent.class));
        verify(cartClient, never()).getCart(anyLong());
    }

    @Test
    void testGetOrderByOrderNumber_Owner_Success() {
        when(orderRepository.findByOrderNumber("ORD-TEST-12345")).thenReturn(Optional.of(order));

        OrderResponse response = orderService.getOrderByOrderNumber(1L, "ORD-TEST-12345", false);

        assertThat(response.getOrderNumber()).isEqualTo("ORD-TEST-12345");
        assertThat(response.getUserId()).isEqualTo(1L);
    }

    @Test
    void testGetOrderByOrderNumber_NotOwner_ThrowsForbidden() {
        when(orderRepository.findByOrderNumber("ORD-TEST-12345")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.getOrderByOrderNumber(2L, "ORD-TEST-12345", false))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void testGetOrderByOrderNumber_NotFound() {
        when(orderRepository.findByOrderNumber("ORD-NONEXISTENT")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrderByOrderNumber(1L, "ORD-NONEXISTENT", false))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void testCancelOrder_Success() {
        when(orderRepository.findByOrderNumber("ORD-TEST-12345")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        CancelOrderRequest cancelRequest = CancelOrderRequest.builder()
                .reason("Changed my mind")
                .build();

        OrderResponse response = orderService.cancelOrder(1L, "ORD-TEST-12345", cancelRequest, false);

        assertThat(response.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(response.getCancelReason()).isEqualTo("Changed my mind");
        verify(kafkaProducer).publishOrderCancelled(any(OrderCancelledEvent.class));
    }

    @Test
    void testCancelOrder_AlreadyCancelled_ThrowsBadRequest() {
        order.setStatus(OrderStatus.CANCELLED);
        when(orderRepository.findByOrderNumber("ORD-TEST-12345")).thenReturn(Optional.of(order));

        CancelOrderRequest cancelRequest = CancelOrderRequest.builder().reason("Reason").build();

        assertThatThrownBy(() -> orderService.cancelOrder(1L, "ORD-TEST-12345", cancelRequest, false))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void testProcessInventoryReserved_Success() {
        when(orderRepository.findByOrderNumber("ORD-TEST-12345")).thenReturn(Optional.of(order));

        InventoryReservedEvent event = InventoryReservedEvent.builder()
                .orderNumber("ORD-TEST-12345")
                .userId(1L)
                .build();

        orderService.processInventoryReserved(event);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.INVENTORY_RESERVED);
        verify(orderRepository).save(order);
    }

    @Test
    void testProcessInventoryFailed_Success() {
        when(orderRepository.findByOrderNumber("ORD-TEST-12345")).thenReturn(Optional.of(order));

        InventoryFailedEvent event = InventoryFailedEvent.builder()
                .orderNumber("ORD-TEST-12345")
                .reason("Out of stock")
                .build();

        orderService.processInventoryFailed(event);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.FAILED);
        assertThat(order.getCancelReason()).contains("Out of stock");
        verify(orderRepository).save(order);
    }

    @Test
    void testProcessPaymentSuccess_Success() {
        order.setStatus(OrderStatus.INVENTORY_RESERVED);
        when(orderRepository.findByOrderNumber("ORD-TEST-12345")).thenReturn(Optional.of(order));

        PaymentSuccessEvent event = PaymentSuccessEvent.builder()
                .orderNumber("ORD-TEST-12345")
                .transactionId("TXN-123")
                .build();

        orderService.processPaymentSuccess(event);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        verify(orderRepository).save(order);
    }

    @Test
    void testProcessPaymentFailed_CompensatingTransaction_PublishesOrderCancelled() {
        order.setStatus(OrderStatus.INVENTORY_RESERVED);
        when(orderRepository.findByOrderNumber("ORD-TEST-12345")).thenReturn(Optional.of(order));

        PaymentFailedEvent event = PaymentFailedEvent.builder()
                .orderNumber("ORD-TEST-12345")
                .reason("Insufficient funds")
                .build();

        orderService.processPaymentFailed(event);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.getCancelReason()).contains("Insufficient funds");
        verify(orderRepository).save(order);
        verify(kafkaProducer).publishOrderCancelled(any(OrderCancelledEvent.class));
    }
}
