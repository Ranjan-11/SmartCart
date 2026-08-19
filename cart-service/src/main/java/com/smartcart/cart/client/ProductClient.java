package com.smartcart.cart.client;

import com.smartcart.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "product-service", path = "/api/v1/products")
public interface ProductClient {

    @GetMapping("/sku/{sku}")
    ResponseEntity<ApiResponse<ProductDto>> getProductBySku(@PathVariable("sku") String sku);
}
