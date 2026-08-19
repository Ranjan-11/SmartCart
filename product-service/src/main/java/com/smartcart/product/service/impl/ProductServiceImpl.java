package com.smartcart.product.service.impl;

import com.smartcart.common.dto.PageResponse;
import com.smartcart.common.exception.ConflictException;
import com.smartcart.common.exception.ResourceNotFoundException;
import com.smartcart.product.dto.ProductRequest;
import com.smartcart.product.dto.ProductResponse;
import com.smartcart.product.entity.Category;
import com.smartcart.product.entity.Product;
import com.smartcart.product.repository.CategoryRepository;
import com.smartcart.product.repository.ProductRepository;
import com.smartcart.product.repository.ProductSpecification;
import com.smartcart.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "products_sku", allEntries = true)
    })
    public ProductResponse createProduct(ProductRequest request) {
        String sku = request.getSku().trim().toUpperCase();
        log.info("Creating product with SKU: {}", sku);

        if (productRepository.existsBySku(sku)) {
            throw new ConflictException("Product already exists with SKU: " + sku);
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        Product product = Product.builder()
                .sku(sku)
                .name(request.getName().trim())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                .category(category)
                .imageUrl(request.getImageUrl())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Product savedProduct = productRepository.save(product);
        log.info("Product created successfully with ID: {} and SKU: {}", savedProduct.getId(), savedProduct.getSku());
        return mapToResponse(savedProduct);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "products", key = "#id")
    public ProductResponse getProductById(Long id) {
        log.info("Fetching product by ID: {} from database (cache miss)", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return mapToResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "products_sku", key = "#sku")
    public ProductResponse getProductBySku(String sku) {
        String normalizedSku = sku.trim().toUpperCase();
        log.info("Fetching product by SKU: {} from database (cache miss)", normalizedSku);
        Product product = productRepository.findBySku(normalizedSku)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "sku", normalizedSku));
        return mapToResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getAllProducts(
            String keyword,
            String categorySlug,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean active,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Specification<Product> spec = ProductSpecification.filterProducts(keyword, categorySlug, minPrice, maxPrice, active);

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        List<ProductResponse> content = productPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.<ProductResponse>builder()
                .content(content)
                .pageNumber(productPage.getNumber())
                .pageSize(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .isFirst(productPage.isFirst())
                .isLast(productPage.isLast())
                .build();
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "products_sku", allEntries = true)
    })
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        log.info("Updating product ID: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        String newSku = request.getSku().trim().toUpperCase();
        if (!product.getSku().equalsIgnoreCase(newSku) && productRepository.existsBySku(newSku)) {
            throw new ConflictException("Another product already exists with SKU: " + newSku);
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        product.setSku(newSku);
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : product.getStockQuantity());
        product.setCategory(category);
        product.setImageUrl(request.getImageUrl());
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        Product updatedProduct = productRepository.save(product);
        log.info("Product ID: {} updated successfully", id);
        return mapToResponse(updatedProduct);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "products_sku", allEntries = true)
    })
    public void deleteProduct(Long id) {
        log.info("Deleting product ID: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        productRepository.delete(product);
    }

    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                .imageUrl(product.getImageUrl())
                .active(product.isActive())
                .createdAt(product.getCreatedAt())
                .build();
    }
}
