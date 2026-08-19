package com.smartcart.product.repository;

import com.smartcart.product.entity.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    public static Specification<Product> filterProducts(String keyword, String categorySlug, BigDecimal minPrice, BigDecimal maxPrice, Boolean active) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (active != null) {
                predicates.add(criteriaBuilder.equal(root.get("active"), active));
            } else {
                predicates.add(criteriaBuilder.isTrue(root.get("active")));
            }

            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate nameMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern);
                Predicate descMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern);
                Predicate skuMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("sku")), pattern);
                predicates.add(criteriaBuilder.or(nameMatch, descMatch, skuMatch));
            }

            if (categorySlug != null && !categorySlug.trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("slug"), categorySlug.trim().toLowerCase()));
            }

            if (minPrice != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
