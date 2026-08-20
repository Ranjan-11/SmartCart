package com.smartcart.inventory.controller;

import com.smartcart.common.dto.ApiResponse;
import com.smartcart.common.dto.PageResponse;
import com.smartcart.inventory.dto.*;
import com.smartcart.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Authoritative Inventory Management and Stock APIs")
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Initialize inventory for SKU (Admin)")
    public ResponseEntity<ApiResponse<InventoryResponse>> addInventory(@Valid @RequestBody InventoryRequest request) {
        log.info("REST request to add inventory for SKU: {}", request.getSku());
        InventoryResponse response = inventoryService.addInventory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Inventory initialized successfully", response));
    }

    @PutMapping("/{sku}/restock")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Restock inventory for SKU (Admin)")
    public ResponseEntity<ApiResponse<InventoryResponse>> restock(
            @PathVariable(name = "sku") String sku,
            @Valid @RequestBody RestockRequest request) {
        log.info("REST request to restock SKU: {} by quantity: {}", sku, request.getQuantity());
        InventoryResponse response = inventoryService.restock(sku, request);
        return ResponseEntity.ok(ApiResponse.success("Inventory restocked successfully", response));
    }

    @GetMapping("/{sku}")
    @Operation(summary = "Get authoritative stock level for SKU")
    public ResponseEntity<ApiResponse<InventoryResponse>> getInventoryBySku(@PathVariable(name = "sku") String sku) {
        log.debug("REST request to get inventory for SKU: {}", sku);
        InventoryResponse response = inventoryService.getInventoryBySku(sku);
        return ResponseEntity.ok(ApiResponse.success("Inventory retrieved successfully", response));
    }

    @PostMapping("/batch-check")
    @Operation(summary = "Batch check stock for multiple SKUs")
    public ResponseEntity<ApiResponse<List<StockCheckResponse>>> batchCheckStock(@Valid @RequestBody BatchStockCheckRequest request) {
        log.debug("REST request to batch check stock for {} SKUs", request.getSkus().size());
        List<StockCheckResponse> response = inventoryService.batchCheckStock(request.getSkus());
        return ResponseEntity.ok(ApiResponse.success("Batch stock checked successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all inventory (Admin)")
    public ResponseEntity<ApiResponse<PageResponse<InventoryResponse>>> getAllInventory(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.debug("REST request to get all inventory, page: {}, size: {}", page, size);
        PageResponse<InventoryResponse> response = inventoryService.getAllInventory(page, size);
        return ResponseEntity.ok(ApiResponse.success("Inventory retrieved successfully", response));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get low-stock inventory alerts (Admin)")
    public ResponseEntity<ApiResponse<PageResponse<InventoryResponse>>> getLowStockInventory(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.debug("REST request to get low stock inventory, page: {}, size: {}", page, size);
        PageResponse<InventoryResponse> response = inventoryService.getLowStockInventory(page, size);
        return ResponseEntity.ok(ApiResponse.success("Low stock inventory retrieved successfully", response));
    }
}
