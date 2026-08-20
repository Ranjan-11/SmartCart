package com.smartcart.payment.controller;

import com.smartcart.common.dto.ApiResponse;
import com.smartcart.common.dto.PageResponse;
import com.smartcart.common.security.SecurityConstants;
import com.smartcart.payment.dto.PaymentRequest;
import com.smartcart.payment.dto.PaymentResponse;
import com.smartcart.payment.dto.RefundRequest;
import com.smartcart.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payment Management", description = "Payment Processing, Status Lookup, Refund and Transaction APIs")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/process")
    @Operation(summary = "Process a direct payment transaction")
    public ResponseEntity<ApiResponse<PaymentResponse>> processPayment(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @RequestHeader(value = SecurityConstants.HEADER_USER_EMAIL, required = false) String headerUserEmail,
            @Valid @RequestBody PaymentRequest request) {

        Long userId = extractUserId(authentication, headerUserId);
        String userEmail = extractUserEmail(authentication, headerUserEmail);

        log.info("REST request to process payment for order: {} by user: {}", request.getOrderNumber(), userId);
        PaymentResponse response = paymentService.processDirectPayment(userId, userEmail, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment processed successfully", response));
    }

    @GetMapping("/order/{orderNumber}")
    @Operation(summary = "Get payment details by order number")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByOrderNumber(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ROLES, required = false) String headerUserRoles,
            @PathVariable("orderNumber") String orderNumber) {

        Long userId = extractUserId(authentication, headerUserId);
        boolean isAdmin = checkIsAdmin(authentication, headerUserRoles);

        log.debug("REST request to get payment for order: {} by user: {} (admin={})", orderNumber, userId, isAdmin);
        PaymentResponse response = paymentService.getPaymentByOrderNumber(userId, orderNumber, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Payment details retrieved successfully", response));
    }

    @GetMapping("/transaction/{transactionId}")
    @Operation(summary = "Get payment details by transaction ID")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByTransactionId(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ROLES, required = false) String headerUserRoles,
            @PathVariable("transactionId") String transactionId) {

        Long userId = extractUserId(authentication, headerUserId);
        boolean isAdmin = checkIsAdmin(authentication, headerUserRoles);

        log.debug("REST request to get payment for txn: {} by user: {} (admin={})", transactionId, userId, isAdmin);
        PaymentResponse response = paymentService.getPaymentByTransactionId(userId, transactionId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Payment details retrieved successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get current user's payment history (or all payments for Admin)")
    public ResponseEntity<ApiResponse<PageResponse<PaymentResponse>>> getPayments(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ROLES, required = false) String headerUserRoles,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {

        Long userId = extractUserId(authentication, headerUserId);
        boolean isAdmin = checkIsAdmin(authentication, headerUserRoles);

        log.debug("REST request to get payments for user: {}, page: {}, size: {} (admin={})", userId, page, size, isAdmin);
        PageResponse<PaymentResponse> response = isAdmin
                ? paymentService.getAllPayments(page, size)
                : paymentService.getUserPayments(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved successfully", response));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all payment transactions across system (Admin only)")
    public ResponseEntity<ApiResponse<PageResponse<PaymentResponse>>> getAllPaymentsAdmin(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {

        log.debug("REST admin request to get all payments, page: {}, size: {}", page, size);
        PageResponse<PaymentResponse> response = paymentService.getAllPayments(page, size);
        return ResponseEntity.ok(ApiResponse.success("All payments retrieved successfully", response));
    }

    @PostMapping("/order/{orderNumber}/refund")
    @Operation(summary = "Process refund for an order")
    public ResponseEntity<ApiResponse<PaymentResponse>> refundPayment(
            Authentication authentication,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ROLES, required = false) String headerUserRoles,
            @PathVariable("orderNumber") String orderNumber,
            @Valid @RequestBody RefundRequest request) {

        Long userId = extractUserId(authentication, headerUserId);
        boolean isAdmin = checkIsAdmin(authentication, headerUserRoles);

        log.info("REST request to refund payment for order: {} by user: {} (admin={})", orderNumber, userId, isAdmin);
        PaymentResponse response = paymentService.processRefund(userId, orderNumber, request, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Payment refunded successfully", response));
    }

    private Long extractUserId(Authentication authentication, Long headerUserId) {
        if (headerUserId != null) {
            return headerUserId;
        }
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        throw new com.smartcart.common.exception.UnauthorizedException("User context not authenticated");
    }

    private String extractUserEmail(Authentication authentication, String headerUserEmail) {
        if (headerUserEmail != null && !headerUserEmail.isBlank()) {
            return headerUserEmail;
        }
        if (authentication != null && authentication.getCredentials() instanceof String) {
            return (String) authentication.getCredentials();
        }
        return null;
    }

    private boolean checkIsAdmin(Authentication authentication, String userRolesHeader) {
        if (userRolesHeader != null && userRolesHeader.contains("ADMIN")) {
            return true;
        }
        if (authentication != null) {
            return authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        }
        return false;
    }
}
