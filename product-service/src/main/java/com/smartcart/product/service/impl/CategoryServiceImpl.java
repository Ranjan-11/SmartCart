package com.smartcart.product.service.impl;

import com.smartcart.common.exception.ConflictException;
import com.smartcart.common.exception.ResourceNotFoundException;
import com.smartcart.product.dto.CategoryRequest;
import com.smartcart.product.dto.CategoryResponse;
import com.smartcart.product.entity.Category;
import com.smartcart.product.repository.CategoryRepository;
import com.smartcart.product.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse createCategory(CategoryRequest request) {
        log.info("Creating category: {}", request.getName());

        if (categoryRepository.existsByName(request.getName().trim())) {
            throw new ConflictException("Category already exists with name: " + request.getName());
        }

        String slug = toSlug(request.getName());
        if (categoryRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        Category category = Category.builder()
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .build();

        Category savedCategory = categoryRepository.save(category);
        return mapToResponse(savedCategory);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories")
    public List<CategoryResponse> getAllCategories() {
        log.info("Fetching all categories from database (cache miss)");
        return categoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return mapToResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "slug", slug));
        return mapToResponse(category);
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        log.info("Updating category with ID: {}", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());

        Category updatedCategory = categoryRepository.save(category);
        return mapToResponse(updatedCategory);
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(Long id) {
        log.info("Deleting category with ID: {}", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        categoryRepository.delete(category);
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .imageUrl(category.getImageUrl())
                .createdAt(category.getCreatedAt())
                .build();
    }

    private String toSlug(String input) {
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}
