package com.smartcart.user.repository;

import com.smartcart.user.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByAuthUserId(Long authUserId);
    Optional<UserProfile> findByEmail(String email);
    boolean existsByAuthUserId(Long authUserId);
}
