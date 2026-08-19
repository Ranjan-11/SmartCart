package com.smartcart.cart.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcart.cart.dto.AddToCartRequest;
import com.smartcart.cart.dto.CartItemResponse;
import com.smartcart.cart.dto.CartResponse;
import com.smartcart.cart.dto.UpdateCartItemRequest;
import com.smartcart.cart.service.CartService;
import com.smartcart.common.security.SecurityConstants;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CartControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CartService cartService;

    @Test
    void shouldGetCartForAuthenticatedUser() throws Exception {
        CartResponse response = CartResponse.builder()
                .userId(1L)
                .items(List.of(CartItemResponse.builder()
                        .sku("PHONE-01")
                        .productName("Smart Phone")
                        .unitPrice(new BigDecimal("500.00"))
                        .quantity(1)
                        .subtotal(new BigDecimal("500.00"))
                        .build()))
                .totalItemCount(1)
                .totalPrice(new BigDecimal("500.00"))
                .build();

        when(cartService.getCart(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/cart")
                        .header(SecurityConstants.HEADER_USER_ID, "1")
                        .header(SecurityConstants.HEADER_USER_ROLES, "ROLE_CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].sku").value("PHONE-01"))
                .andExpect(jsonPath("$.data.totalPrice").value(500.00));
    }

    @Test
    void shouldAddItemToCart() throws Exception {
        AddToCartRequest request = AddToCartRequest.builder()
                .sku("PHONE-01")
                .quantity(2)
                .build();

        CartResponse response = CartResponse.builder()
                .userId(1L)
                .items(List.of(CartItemResponse.builder()
                        .sku("PHONE-01")
                        .productName("Smart Phone")
                        .unitPrice(new BigDecimal("500.00"))
                        .quantity(2)
                        .subtotal(new BigDecimal("1000.00"))
                        .build()))
                .totalItemCount(2)
                .totalPrice(new BigDecimal("1000.00"))
                .build();

        when(cartService.addItemToCart(eq(1L), any(AddToCartRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/cart/items")
                        .header(SecurityConstants.HEADER_USER_ID, "1")
                        .header(SecurityConstants.HEADER_USER_ROLES, "ROLE_CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalItemCount").value(2));
    }

    @Test
    void shouldRejectUnauthenticatedCartAccess() throws Exception {
        mockMvc.perform(get("/api/v1/cart"))
                .andExpect(status().isForbidden());
    }
}
