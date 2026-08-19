package com.smartcart.product.service;

import com.smartcart.common.dto.PageResponse;
import com.smartcart.product.dto.ProductRequest;
import com.smartcart.product.dto.ProductResponse;

import java.math.BigDecimal;

public interface ProductService {
    ProductResponse createProduct(ProductRequest request);
    ProductResponse getProductById(Long id);
    ProductResponse getProductBySku(String sku);
    PageResponse<ProductResponse> getAllProducts(
            String keyword,
            String categorySlug,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean active,
            int page,
            int size,
            String sortBy,
            String sortDir
    );
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
}
