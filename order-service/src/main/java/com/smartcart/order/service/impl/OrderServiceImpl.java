package com.smartcart.order.service.impl;

import com.smartcart.common.dto.OrderItemDto;
import com.smartcart.common.dto.PageResponse;
import com.smartcart.common.event.*;
import com.smartcart.common.exception.BadRequestException;
import com.smartcart.common.exception.ForbiddenException;
import com.smartcart.common.exception.ResourceNotFoundException;
import com.smartcart.order.client.CartClient;
import com.smartcart.order.client.CartItemResponse;
import com.smartcart.order.client.CartResponse;
import com.smartcart.order.dto.*;
import com.smartcart.order.entity.Order;
import com.smartcart.order.entity.OrderItem;
import com.smartcart.order.entity.OrderStatus;
import com.smartcart.order.kafka.OrderKafkaProducer;
import com.smartcart.order.repository.OrderRepository;
import com.smartcart.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartClient cartClient;
    private final OrderKafkaProducer kafkaProducer;

    @Override
    @Transactional
    public OrderResponse createOrder(Long userId, String userEmail, CheckoutRequest request) {
        log.info("Creating order for user ID: {}, email: {}", userId, userEmail);

        List<OrderItemDto> itemDtos = new ArrayList<>();

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            itemDtos = request.getItems();
        } else {
            // Fetch cart from cart-service
            try {
                var cartApiResponse = cartClient.getCart(userId);
                if (cartApiResponse != null && cartApiResponse.getData() != null) {
                    CartResponse cart = cartApiResponse.getData();
                    if (cart.getItems() != null && !cart.getItems().isEmpty()) {
                        for (CartItemResponse ci : cart.getItems()) {
                            BigDecimal price = ci.getUnitPrice() != null ? ci.getUnitPrice() : BigDecimal.ZERO;
                            int qty = ci.getQuantity() != null ? ci.getQuantity() : 1;
                            BigDecimal subtotal = ci.getSubtotal() != null ? ci.getSubtotal() : price.multiply(BigDecimal.valueOf(qty));

                            itemDtos.add(OrderItemDto.builder()
                                    .sku(ci.getSku())
                                    .productName(ci.getProductName())
                                    .price(price)
                                    .quantity(qty)
                                    .subtotal(subtotal)
                                    .build());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch cart from cart-service for user {}: {}", userId, e.getMessage());
            }
        }

        if (itemDtos.isEmpty()) {
            throw new BadRequestException("Cannot create an order with no items. Your shopping cart is empty.");
        }

        String orderNumber = generateOrderNumber();
        BigDecimal totalAmount = BigDecimal.ZERO;

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .userId(userId)
                .userEmail(userEmail)
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CARD")
                .status(OrderStatus.CREATED)
                .totalAmount(BigDecimal.ZERO)
                .build();

        for (OrderItemDto dto : itemDtos) {
            BigDecimal itemPrice = dto.getPrice() != null ? dto.getPrice() : BigDecimal.ZERO;
            int quantity = dto.getQuantity() != null ? dto.getQuantity() : 1;
            BigDecimal subtotal = itemPrice.multiply(BigDecimal.valueOf(quantity));
            dto.setSubtotal(subtotal);
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                    .sku(dto.getSku())
                    .productName(dto.getProductName() != null ? dto.getProductName() : dto.getSku())
                    .unitPrice(itemPrice)
                    .quantity(quantity)
                    .subtotal(subtotal)
                    .build();
            order.addItem(orderItem);
        }

        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);
        log.info("Order {} created with total amount: {}", orderNumber, totalAmount);

        // Clear cart asynchronously or best effort
        try {
            cartClient.clearCart(userId);
        } catch (Exception e) {
            log.warn("Could not clear cart for user {}: {}", userId, e.getMessage());
        }

        // Publish OrderCreatedEvent for Saga orchestration
        OrderCreatedEvent event = OrderCreatedEvent.builder()
                .orderNumber(orderNumber)
                .userId(userId)
                .userEmail(userEmail)
                .totalAmount(totalAmount)
                .shippingAddress(request.getShippingAddress())
                .items(itemDtos)
                .build();
        kafkaProducer.publishOrderCreated(event);

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByOrderNumber(Long userId, String orderNumber, boolean isAdmin) {
        log.debug("Fetching order {} for user ID: {} (admin={})", orderNumber, userId, isAdmin);
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with order number: " + orderNumber));

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to view this order");
        }

        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getUserOrders(Long userId, int page, int size) {
        log.debug("Fetching orders for user ID: {}, page: {}, size: {}", userId, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage = orderRepository.findByUserId(userId, pageable);
        return mapToPageResponse(orderPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAllOrders(int page, int size) {
        log.debug("Fetching all orders (Admin), page: {}, size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage = orderRepository.findAll(pageable);
        return mapToPageResponse(orderPage);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long userId, String orderNumber, CancelOrderRequest request, boolean isAdmin) {
        log.info("Cancelling order {} by user ID: {} (admin={})", orderNumber, userId, isAdmin);
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with order number: " + orderNumber));

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to cancel this order");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }
        if (order.getStatus() == OrderStatus.FAILED) {
            throw new BadRequestException("Order is in FAILED state and cannot be cancelled");
        }
        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException("Cannot cancel an order that is already " + order.getStatus());
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelReason(request.getReason());
        Order saved = orderRepository.save(order);

        List<OrderItemDto> itemDtos = saved.getItems().stream()
                .map(item -> OrderItemDto.builder()
                        .sku(item.getSku())
                        .productName(item.getProductName())
                        .price(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        OrderCancelledEvent event = OrderCancelledEvent.builder()
                .orderNumber(orderNumber)
                .userId(order.getUserId())
                .reason(request.getReason())
                .items(itemDtos)
                .build();

        kafkaProducer.publishOrderCancelled(event);
        log.info("Order {} cancelled successfully, published compensation event", orderNumber);

        return mapToOrderResponse(saved);
    }

    @Override
    @Transactional
    public void processInventoryReserved(InventoryReservedEvent event) {
        log.info("Processing InventoryReservedEvent for order: {}", event.getOrderNumber());
        orderRepository.findByOrderNumber(event.getOrderNumber()).ifPresentOrElse(order -> {
            if (order.getStatus() == OrderStatus.CREATED) {
                order.setStatus(OrderStatus.INVENTORY_RESERVED);
                orderRepository.save(order);
                log.info("Order {} updated to INVENTORY_RESERVED", order.getOrderNumber());
            } else {
                log.debug("Order {} in status {}, skipping INVENTORY_RESERVED transition", order.getOrderNumber(), order.getStatus());
            }
        }, () -> log.warn("Order {} not found for InventoryReservedEvent", event.getOrderNumber()));
    }

    @Override
    @Transactional
    public void processInventoryFailed(InventoryFailedEvent event) {
        log.info("Processing InventoryFailedEvent for order: {}, reason: {}", event.getOrderNumber(), event.getReason());
        orderRepository.findByOrderNumber(event.getOrderNumber()).ifPresentOrElse(order -> {
            if (order.getStatus() != OrderStatus.FAILED && order.getStatus() != OrderStatus.CANCELLED) {
                order.setStatus(OrderStatus.FAILED);
                order.setCancelReason("Inventory reservation failed: " + event.getReason());
                orderRepository.save(order);
                log.info("Order {} updated to FAILED", order.getOrderNumber());
            }
        }, () -> log.warn("Order {} not found for InventoryFailedEvent", event.getOrderNumber()));
    }

    @Override
    @Transactional
    public void processPaymentSuccess(PaymentSuccessEvent event) {
        log.info("Processing PaymentSuccessEvent for order: {}", event.getOrderNumber());
        orderRepository.findByOrderNumber(event.getOrderNumber()).ifPresentOrElse(order -> {
            if (order.getStatus() == OrderStatus.INVENTORY_RESERVED || order.getStatus() == OrderStatus.CREATED) {
                order.setStatus(OrderStatus.CONFIRMED);
                orderRepository.save(order);
                log.info("Order {} updated to CONFIRMED", order.getOrderNumber());
            } else {
                log.debug("Order {} in status {}, skipping CONFIRMED transition", order.getOrderNumber(), order.getStatus());
            }
        }, () -> log.warn("Order {} not found for PaymentSuccessEvent", event.getOrderNumber()));
    }

    @Override
    @Transactional
    public void processPaymentFailed(PaymentFailedEvent event) {
        log.info("Processing PaymentFailedEvent (Compensating Transaction) for order: {}, reason: {}",
                event.getOrderNumber(), event.getReason());
        orderRepository.findByOrderNumber(event.getOrderNumber()).ifPresentOrElse(order -> {
            if (order.getStatus() != OrderStatus.CANCELLED && order.getStatus() != OrderStatus.FAILED) {
                order.setStatus(OrderStatus.CANCELLED);
                order.setCancelReason("Payment failed: " + event.getReason());
                orderRepository.save(order);

                // Publish compensation OrderCancelledEvent so inventory-service releases reserved stock
                List<OrderItemDto> itemDtos = order.getItems().stream()
                        .map(item -> OrderItemDto.builder()
                                .sku(item.getSku())
                                .productName(item.getProductName())
                                .price(item.getUnitPrice())
                                .quantity(item.getQuantity())
                                .subtotal(item.getSubtotal())
                                .build())
                        .collect(Collectors.toList());

                OrderCancelledEvent compensation = OrderCancelledEvent.builder()
                        .orderNumber(order.getOrderNumber())
                        .userId(order.getUserId())
                        .reason("Payment failed: " + event.getReason())
                        .items(itemDtos)
                        .build();
                kafkaProducer.publishOrderCancelled(compensation);
                log.info("Order {} marked CANCELLED and published OrderCancelledEvent compensation", order.getOrderNumber());
            }
        }, () -> log.warn("Order {} not found for PaymentFailedEvent", event.getOrderNumber()));
    }

    private String generateOrderNumber() {
        String randomPart = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "ORD-" + randomPart + "-" + (System.currentTimeMillis() % 100000);
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems() != null
                ? order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .sku(item.getSku())
                        .productName(item.getProductName())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList())
                : new ArrayList<>();

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUserId())
                .userEmail(order.getUserEmail())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .shippingAddress(order.getShippingAddress())
                .paymentMethod(order.getPaymentMethod())
                .cancelReason(order.getCancelReason())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private PageResponse<OrderResponse> mapToPageResponse(Page<Order> page) {
        List<OrderResponse> content = page.getContent().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());

        return PageResponse.<OrderResponse>builder()
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
