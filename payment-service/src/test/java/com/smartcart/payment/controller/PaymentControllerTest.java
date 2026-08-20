package com.smartcart.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcart.payment.dto.PaymentRequest;
import com.smartcart.payment.dto.PaymentResponse;
import com.smartcart.payment.dto.RefundRequest;
import com.smartcart.payment.entity.PaymentStatus;
import com.smartcart.payment.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Test
    @WithMockUser(username = "1", roles = "CUSTOMER")
    void testProcessPayment_ReturnsCreated() throws Exception {
        PaymentRequest request = PaymentRequest.builder()
                .orderNumber("ORD-1001")
                .amount(new BigDecimal("99.99"))
                .currency("USD")
                .paymentMethod("CARD")
                .build();

        PaymentResponse response = PaymentResponse.builder()
                .id(1L)
                .orderNumber("ORD-1001")
                .transactionId("TXN-1001")
                .userId(1L)
                .amount(new BigDecimal("99.99"))
                .currency("USD")
                .paymentMethod("CARD")
                .status(PaymentStatus.SUCCESS)
                .build();

        when(paymentService.processDirectPayment(eq(1L), any(), any(PaymentRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/payments/process")
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber").value("ORD-1001"))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"));
    }

    @Test
    @WithMockUser(username = "1", roles = "CUSTOMER")
    void testGetPaymentByOrderNumber_ReturnsOk() throws Exception {
        PaymentResponse response = PaymentResponse.builder()
                .id(1L)
                .orderNumber("ORD-1001")
                .transactionId("TXN-1001")
                .userId(1L)
                .amount(new BigDecimal("99.99"))
                .status(PaymentStatus.SUCCESS)
                .build();

        when(paymentService.getPaymentByOrderNumber(eq(1L), eq("ORD-1001"), anyBoolean())).thenReturn(response);

        mockMvc.perform(get("/api/v1/payments/order/ORD-1001")
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.transactionId").value("TXN-1001"));
    }

    @Test
    @WithMockUser(username = "1", roles = "CUSTOMER")
    void testRefundPayment_ReturnsOk() throws Exception {
        RefundRequest request = RefundRequest.builder().reason("Damaged item").build();

        PaymentResponse response = PaymentResponse.builder()
                .id(1L)
                .orderNumber("ORD-1001")
                .transactionId("TXN-1001")
                .userId(1L)
                .status(PaymentStatus.REFUNDED)
                .build();

        when(paymentService.processRefund(eq(1L), eq("ORD-1001"), any(RefundRequest.class), anyBoolean()))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/payments/order/ORD-1001/refund")
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("REFUNDED"));
    }
}
