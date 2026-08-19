package com.smartcart.product.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories", indexes = {
        @Index(name = "idx_category_slug", columnList = "slug", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(length = 500)
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = false)
    @Builder.Default
    private List<Product> products = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
