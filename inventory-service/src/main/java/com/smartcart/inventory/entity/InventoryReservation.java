package com.smartcart.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_reservations", indexes = {
        @Index(name = "idx_inv_res_order", columnList = "order_number"),
        @Index(name = "idx_inv_res_sku", columnList = "sku")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, length = 64)
    private String orderNumber;

    @Column(nullable = false, length = 64)
    private String sku;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReservationStatus status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
