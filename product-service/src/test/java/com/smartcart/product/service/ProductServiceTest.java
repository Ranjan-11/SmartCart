package com.smartcart.product.service;

import com.smartcart.common.dto.PageResponse;
import com.smartcart.common.exception.ConflictException;
import com.smartcart.common.exception.ResourceNotFoundException;
import com.smartcart.product.dto.ProductRequest;
import com.smartcart.product.dto.ProductResponse;
import com.smartcart.product.entity.Category;
import com.smartcart.product.entity.Product;
import com.smartcart.product.repository.CategoryRepository;
import com.smartcart.product.repository.ProductRepository;
import com.smartcart.product.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Category sampleCategory;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        sampleCategory = Category.builder()
                .id(1L)
                .name("Electronics")
                .slug("electronics")
                .build();

        sampleProduct = Product.builder()
                .id(100L)
                .sku("SMART-PH-01")
                .name("SmartPhone Pro")
                .description("Flagship mobile device")
                .price(new BigDecimal("899.99"))
                .stockQuantity(50)
                .category(sampleCategory)
                .active(true)
                .build();
    }

    @Test
    void shouldCreateProductSuccessfully() {
        ProductRequest request = ProductRequest.builder()
                .sku("SMART-PH-01")
                .name("SmartPhone Pro")
                .description("Flagship mobile device")
                .price(new BigDecimal("899.99"))
                .stockQuantity(50)
                .categoryId(1L)
                .build();

        when(productRepository.existsBySku("SMART-PH-01")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);

        ProductResponse response = productService.createProduct(request);

        assertNotNull(response);
        assertEquals("SMART-PH-01", response.getSku());
        assertEquals("SmartPhone Pro", response.getName());
        assertEquals(50, response.getStockQuantity());
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void shouldThrowConflictWhenSkuAlreadyExists() {
        ProductRequest request = ProductRequest.builder()
                .sku("SMART-PH-01")
                .name("SmartPhone Pro")
                .price(new BigDecimal("899.99"))
                .categoryId(1L)
                .build();

        when(productRepository.existsBySku("SMART-PH-01")).thenReturn(true);

        assertThrows(ConflictException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void shouldGetProductById() {
        when(productRepository.findById(100L)).thenReturn(Optional.of(sampleProduct));

        ProductResponse response = productService.getProductById(100L);

        assertNotNull(response);
        assertEquals("SMART-PH-01", response.getSku());
        assertEquals(new BigDecimal("899.99"), response.getPrice());
    }

    @Test
    void shouldGetProductBySku() {
        when(productRepository.findBySku("SMART-PH-01")).thenReturn(Optional.of(sampleProduct));

        ProductResponse response = productService.getProductBySku("SMART-PH-01");

        assertNotNull(response);
        assertEquals(100L, response.getId());
    }

    @Test
    void shouldThrowNotFoundOnMissingProduct() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(999L));
    }

    @Test
    void shouldGetAllProductsWithPagination() {
        PageImpl<Product> page = new PageImpl<>(List.of(sampleProduct));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResponse<ProductResponse> response = productService.getAllProducts(
                null, null, null, null, true, 0, 10, "id", "asc"
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("SMART-PH-01", response.getContent().get(0).getSku());
    }
}
