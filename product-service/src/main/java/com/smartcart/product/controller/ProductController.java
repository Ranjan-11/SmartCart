package com.smartcart.product.controller;

import com.smartcart.common.dto.ApiResponse;
import com.smartcart.common.dto.PageResponse;
import com.smartcart.product.dto.ProductRequest;
import com.smartcart.product.dto.ProductResponse;
import com.smartcart.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@Slf4j
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Product Catalog", description = "Endpoints for searching, filtering, and managing products")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Search and filter products", description = "Paginated product search by keyword, category, price range, and sorting")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getAllProducts(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(name = "maxPrice", required = false) BigDecimal maxPrice,
            @RequestParam(name = "active", required = false) Boolean active,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "asc") String sortDir
    ) {
        PageResponse<ProductResponse> response = productService.getAllProducts(
                keyword, category, minPrice, maxPrice, active, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(ApiResponse.success("Products retrieved", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID", description = "Retrieves product details (Redis Cached)")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable("id") Long id) {
        ProductResponse response = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success("Product retrieved", response));
    }

    @GetMapping("/sku/{sku}")
    @Operation(summary = "Get product by SKU", description = "Retrieves product details by SKU (Redis Cached, used by Feign)")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductBySku(@PathVariable("sku") String sku) {
        ProductResponse response = productService.getProductBySku(sku);
        return ResponseEntity.ok(ApiResponse.success("Product retrieved", response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create product (Admin)", description = "Creates a new product with stockQuantity and evicts product caches")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update product (Admin)", description = "Updates product details/price/stock and evicts product caches")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(@PathVariable("id") Long id, @Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete product (Admin)", description = "Deletes a product and evicts product caches")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
    }
}
