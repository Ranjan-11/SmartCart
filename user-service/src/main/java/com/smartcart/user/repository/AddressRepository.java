package com.smartcart.user.repository;

import com.smartcart.user.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserProfileId(Long userProfileId);
    Optional<Address> findByIdAndUserProfileId(Long id, Long userProfileId);
}
