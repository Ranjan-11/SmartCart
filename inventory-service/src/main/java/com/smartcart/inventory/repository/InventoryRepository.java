package com.smartcart.inventory.repository;

import com.smartcart.inventory.entity.Inventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findBySku(String sku);

    boolean existsBySku(String sku);

    List<Inventory> findBySkuIn(List<String> skus);

    @Query("SELECT i FROM Inventory i WHERE i.availableQuantity <= i.lowStockThreshold")
    Page<Inventory> findLowStock(Pageable pageable);
}
