package com.smartcart.product.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcart.common.dto.PageResponse;
import com.smartcart.common.security.SecurityConstants;
import com.smartcart.product.dto.ProductRequest;
import com.smartcart.product.dto.ProductResponse;
import com.smartcart.product.service.ProductService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @Test
    void shouldAllowPublicGetAllProducts() throws Exception {
        ProductResponse response = ProductResponse.builder()
                .id(1L)
                .sku("LAPTOP-01")
                .name("Pro Laptop")
                .price(new BigDecimal("1200.00"))
                .stockQuantity(10)
                .active(true)
                .build();

        PageResponse<ProductResponse> pageResponse = PageResponse.<ProductResponse>builder()
                .content(List.of(response))
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1)
                .totalPages(1)
                .build();

        when(productService.getAllProducts(
                nullable(String.class),
                nullable(String.class),
                nullable(BigDecimal.class),
                nullable(BigDecimal.class),
                nullable(Boolean.class),
                anyInt(),
                anyInt(),
                anyString(),
                anyString()
        )).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/products"))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].sku").value("LAPTOP-01"));
    }

    @Test
    void shouldAllowAdminCreateProduct() throws Exception {
        ProductRequest request = ProductRequest.builder()
                .sku("LAPTOP-01")
                .name("Pro Laptop")
                .price(new BigDecimal("1200.00"))
                .stockQuantity(15)
                .categoryId(1L)
                .build();

        ProductResponse response = ProductResponse.builder()
                .id(1L)
                .sku("LAPTOP-01")
                .name("Pro Laptop")
                .price(new BigDecimal("1200.00"))
                .stockQuantity(15)
                .categoryId(1L)
                .active(true)
                .build();

        when(productService.createProduct(any(ProductRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/products")
                        .header(SecurityConstants.HEADER_USER_ID, "1")
                        .header(SecurityConstants.HEADER_USER_ROLES, "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sku").value("LAPTOP-01"))
                .andExpect(jsonPath("$.data.stockQuantity").value(15));
    }

    @Test
    void shouldRejectCustomerOnCreateProduct() throws Exception {
        ProductRequest request = ProductRequest.builder()
                .sku("LAPTOP-01")
                .name("Pro Laptop")
                .price(new BigDecimal("1200.00"))
                .categoryId(1L)
                .build();

        mockMvc.perform(post("/api/v1/products")
                        .header(SecurityConstants.HEADER_USER_ID, "2")
                        .header(SecurityConstants.HEADER_USER_ROLES, "ROLE_CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
