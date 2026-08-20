package com.smartcart.inventory.repository;

import com.smartcart.inventory.entity.InventoryReservation;
import com.smartcart.inventory.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, Long> {

    List<InventoryReservation> findByOrderNumber(String orderNumber);

    List<InventoryReservation> findByOrderNumberAndStatus(String orderNumber, ReservationStatus status);
}
