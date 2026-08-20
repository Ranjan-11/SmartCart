package com.smartcart.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcart.order.dto.CancelOrderRequest;
import com.smartcart.order.dto.CheckoutRequest;
import com.smartcart.order.dto.OrderItemResponse;
import com.smartcart.order.dto.OrderResponse;
import com.smartcart.order.entity.OrderStatus;
import com.smartcart.order.service.OrderService;
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
import java.util.List;

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
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Test
    @WithMockUser(username = "1", roles = "CUSTOMER")
    void testCheckout_ReturnsCreated() throws Exception {
        CheckoutRequest request = CheckoutRequest.builder()
                .shippingAddress("123 Test Street")
                .paymentMethod("CARD")
                .build();

        OrderItemResponse item = OrderItemResponse.builder()
                .id(1L)
                .sku("PHONE-01")
                .productName("Smartphone X")
                .unitPrice(new BigDecimal("99.99"))
                .quantity(1)
                .subtotal(new BigDecimal("99.99"))
                .build();

        OrderResponse response = OrderResponse.builder()
                .id(1L)
                .orderNumber("ORD-1001")
                .userId(1L)
                .totalAmount(new BigDecimal("99.99"))
                .status(OrderStatus.CREATED)
                .shippingAddress("123 Test Street")
                .paymentMethod("CARD")
                .items(List.of(item))
                .build();

        when(orderService.createOrder(eq(1L), any(), any(CheckoutRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/orders/checkout")
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber").value("ORD-1001"))
                .andExpect(jsonPath("$.data.status").value("CREATED"));
    }

    @Test
    @WithMockUser(username = "1", roles = "CUSTOMER")
    void testGetOrderByOrderNumber_ReturnsOk() throws Exception {
        OrderResponse response = OrderResponse.builder()
                .id(1L)
                .orderNumber("ORD-1001")
                .userId(1L)
                .status(OrderStatus.CREATED)
                .totalAmount(new BigDecimal("99.99"))
                .shippingAddress("123 Test Street")
                .build();

        when(orderService.getOrderByOrderNumber(eq(1L), eq("ORD-1001"), anyBoolean())).thenReturn(response);

        mockMvc.perform(get("/api/v1/orders/ORD-1001")
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber").value("ORD-1001"));
    }

    @Test
    @WithMockUser(username = "1", roles = "CUSTOMER")
    void testCancelOrder_ReturnsOk() throws Exception {
        CancelOrderRequest request = CancelOrderRequest.builder()
                .reason("Customer requested")
                .build();

        OrderResponse response = OrderResponse.builder()
                .id(1L)
                .orderNumber("ORD-1001")
                .userId(1L)
                .status(OrderStatus.CANCELLED)
                .cancelReason("Customer requested")
                .build();

        when(orderService.cancelOrder(eq(1L), eq("ORD-1001"), any(CancelOrderRequest.class), anyBoolean()))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/orders/ORD-1001/cancel")
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }
}
