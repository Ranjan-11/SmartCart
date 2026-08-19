package com.smartcart.product.controller;

import com.smartcart.common.dto.ApiResponse;
import com.smartcart.product.dto.CategoryRequest;
import com.smartcart.product.dto.CategoryResponse;
import com.smartcart.product.service.CategoryService;
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
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Category Management", description = "Endpoints for browsing and managing product categories")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Get all categories", description = "Retrieves all product categories (Redis Cached)")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success("Categories retrieved", categories));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID", description = "Retrieves a category by numeric ID")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable("id") Long id) {
        CategoryResponse response = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success("Category retrieved", response));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get category by slug", description = "Retrieves a category by URL slug")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryBySlug(@PathVariable("slug") String slug) {
        CategoryResponse response = categoryService.getCategoryBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success("Category retrieved", response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create category (Admin)", description = "Creates a new category and evicts category cache")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update category (Admin)", description = "Updates category details and evicts category cache")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(@PathVariable("id") Long id, @Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete category (Admin)", description = "Deletes a category and evicts category cache")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable("id") Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully", null));
    }
}
