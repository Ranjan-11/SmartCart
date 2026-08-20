package com.smartcart.payment.service;

import com.smartcart.common.dto.PageResponse;
import com.smartcart.common.event.InventoryReservedEvent;
import com.smartcart.payment.dto.PaymentRequest;
import com.smartcart.payment.dto.PaymentResponse;
import com.smartcart.payment.dto.RefundRequest;

public interface PaymentService {

    void processPaymentForOrder(InventoryReservedEvent event);

    PaymentResponse processDirectPayment(Long userId, String userEmail, PaymentRequest request);

    PaymentResponse getPaymentByOrderNumber(Long userId, String orderNumber, boolean isAdmin);

    PaymentResponse getPaymentByTransactionId(Long userId, String transactionId, boolean isAdmin);

    PageResponse<PaymentResponse> getUserPayments(Long userId, int page, int size);

    PageResponse<PaymentResponse> getAllPayments(int page, int size);

    PaymentResponse processRefund(Long userId, String orderNumber, RefundRequest request, boolean isAdmin);
}
