package com.smartcart.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcart.inventory.dto.*;
import com.smartcart.inventory.service.InventoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InventoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InventoryService inventoryService;

    @MockBean
    private org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate;

    @Test
    @WithMockUser(roles = "ADMIN")
    void testAddInventory_Admin_ReturnsCreated() throws Exception {
        InventoryRequest request = InventoryRequest.builder()
                .sku("PHONE-01")
                .availableQuantity(50)
                .build();

        InventoryResponse response = InventoryResponse.builder()
                .id(1L)
                .sku("PHONE-01")
                .availableQuantity(50)
                .build();

        when(inventoryService.addInventory(any(InventoryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sku").value("PHONE-01"))
                .andExpect(jsonPath("$.data.availableQuantity").value(50));
    }

    @Test
    void testGetInventoryBySku_Public_ReturnsOk() throws Exception {
        InventoryResponse response = InventoryResponse.builder()
                .id(1L)
                .sku("PHONE-01")
                .availableQuantity(50)
                .build();

        when(inventoryService.getInventoryBySku("PHONE-01")).thenReturn(response);

        mockMvc.perform(get("/api/v1/inventory/PHONE-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sku").value("PHONE-01"));
    }

    @Test
    void testBatchCheckStock_Public_ReturnsOk() throws Exception {
        BatchStockCheckRequest request = BatchStockCheckRequest.builder()
                .skus(List.of("PHONE-01"))
                .build();

        StockCheckResponse checkResponse = StockCheckResponse.builder()
                .sku("PHONE-01")
                .availableQuantity(50)
                .inStock(true)
                .build();

        when(inventoryService.batchCheckStock(any())).thenReturn(List.of(checkResponse));

        mockMvc.perform(post("/api/v1/inventory/batch-check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].inStock").value(true));
    }
}
