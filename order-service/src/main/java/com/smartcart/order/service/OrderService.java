package com.smartcart.order.service;

import com.smartcart.common.dto.PageResponse;
import com.smartcart.common.event.InventoryFailedEvent;
import com.smartcart.common.event.InventoryReservedEvent;
import com.smartcart.common.event.PaymentFailedEvent;
import com.smartcart.common.event.PaymentSuccessEvent;
import com.smartcart.order.dto.CancelOrderRequest;
import com.smartcart.order.dto.CheckoutRequest;
import com.smartcart.order.dto.OrderResponse;

public interface OrderService {

    OrderResponse createOrder(Long userId, String userEmail, CheckoutRequest request);

    OrderResponse getOrderByOrderNumber(Long userId, String orderNumber, boolean isAdmin);

    PageResponse<OrderResponse> getUserOrders(Long userId, int page, int size);

    PageResponse<OrderResponse> getAllOrders(int page, int size);

    OrderResponse cancelOrder(Long userId, String orderNumber, CancelOrderRequest request, boolean isAdmin);

    void processInventoryReserved(InventoryReservedEvent event);

    void processInventoryFailed(InventoryFailedEvent event);

    void processPaymentSuccess(PaymentSuccessEvent event);

    void processPaymentFailed(PaymentFailedEvent event);
}
