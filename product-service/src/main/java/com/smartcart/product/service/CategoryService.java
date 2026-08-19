package com.smartcart.product.service;

import com.smartcart.product.dto.CategoryRequest;
import com.smartcart.product.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {
    CategoryResponse createCategory(CategoryRequest request);
    List<CategoryResponse> getAllCategories();
    CategoryResponse getCategoryById(Long id);
    CategoryResponse getCategoryBySlug(String slug);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    void deleteCategory(Long id);
}
