package com.smartcart.user.controller;

import com.smartcart.common.dto.ApiResponse;
import com.smartcart.common.security.SecurityConstants;
import com.smartcart.user.dto.AddressDto;
import com.smartcart.user.dto.CreateUserProfileRequest;
import com.smartcart.user.dto.UpdateUserProfileRequest;
import com.smartcart.user.dto.UserProfileResponse;
import com.smartcart.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Endpoints for managing user profiles and addresses")
public class UserController {

    private final UserService userService;

    @PostMapping("/profile")
    @Operation(summary = "Create user profile", description = "Creates a profile linked to an authenticated user ID")
    public ResponseEntity<ApiResponse<UserProfileResponse>> createProfile(@Valid @RequestBody CreateUserProfileRequest request) {
        UserProfileResponse response = userService.createProfile(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User profile created successfully", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile", description = "Retrieves profile for the calling user")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(Authentication authentication,
                                                                          @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId) {
        Long userId = extractUserId(authentication, headerUserId);
        UserProfileResponse response = userService.getProfileByAuthUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved", response));
    }

    @GetMapping("/{authUserId}")
    @PreAuthorize("hasRole('ADMIN') or #authUserId == authentication.principal")
    @Operation(summary = "Get user profile by Auth User ID", description = "Admin access or self lookup")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable Long authUserId) {
        UserProfileResponse response = userService.getProfileByAuthUserId(authUserId);
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved", response));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile", description = "Updates profile attributes")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(Authentication authentication,
                                                                          @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
                                                                          @Valid @RequestBody UpdateUserProfileRequest request) {
        Long userId = extractUserId(authentication, headerUserId);
        UserProfileResponse response = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("User profile updated successfully", response));
    }

    @PostMapping("/me/addresses")
    @Operation(summary = "Add shipping address", description = "Attaches a new address to current user profile")
    public ResponseEntity<ApiResponse<AddressDto>> addAddress(Authentication authentication,
                                                              @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
                                                              @Valid @RequestBody AddressDto addressDto) {
        Long userId = extractUserId(authentication, headerUserId);
        AddressDto response = userService.addAddress(userId, addressDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Address added successfully", response));
    }

    @GetMapping("/me/addresses")
    @Operation(summary = "Get user addresses", description = "Retrieves all addresses for current user")
    public ResponseEntity<ApiResponse<List<AddressDto>>> getAddresses(Authentication authentication,
                                                                      @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId) {
        Long userId = extractUserId(authentication, headerUserId);
        List<AddressDto> addresses = userService.getUserAddresses(userId);
        return ResponseEntity.ok(ApiResponse.success("Addresses retrieved", addresses));
    }

    @DeleteMapping("/me/addresses/{addressId}")
    @Operation(summary = "Delete address", description = "Deletes an address belonging to current user")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(Authentication authentication,
                                                           @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long headerUserId,
                                                           @PathVariable Long addressId) {
        Long userId = extractUserId(authentication, headerUserId);
        userService.deleteAddress(userId, addressId);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully", null));
    }

    private Long extractUserId(Authentication authentication, Long headerUserId) {
        if (headerUserId != null) {
            return headerUserId;
        }
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        throw new com.smartcart.common.exception.UnauthorizedException("User context not authenticated");
    }
}
