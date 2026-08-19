package com.smartcart.user.service;

import com.smartcart.user.dto.AddressDto;
import com.smartcart.user.dto.CreateUserProfileRequest;
import com.smartcart.user.dto.UpdateUserProfileRequest;
import com.smartcart.user.dto.UserProfileResponse;

import java.util.List;

public interface UserService {
    UserProfileResponse createProfile(CreateUserProfileRequest request);
    UserProfileResponse getProfileByAuthUserId(Long authUserId);
    UserProfileResponse updateProfile(Long authUserId, UpdateUserProfileRequest request);
    AddressDto addAddress(Long authUserId, AddressDto addressDto);
    List<AddressDto> getUserAddresses(Long authUserId);
    void deleteAddress(Long authUserId, Long addressId);
}
