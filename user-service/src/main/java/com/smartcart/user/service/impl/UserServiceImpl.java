package com.smartcart.user.service.impl;

import com.smartcart.common.exception.ConflictException;
import com.smartcart.common.exception.ResourceNotFoundException;
import com.smartcart.user.dto.AddressDto;
import com.smartcart.user.dto.CreateUserProfileRequest;
import com.smartcart.user.dto.UpdateUserProfileRequest;
import com.smartcart.user.dto.UserProfileResponse;
import com.smartcart.user.entity.Address;
import com.smartcart.user.entity.UserProfile;
import com.smartcart.user.repository.AddressRepository;
import com.smartcart.user.repository.UserProfileRepository;
import com.smartcart.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserProfileRepository userProfileRepository;
    private final AddressRepository addressRepository;

    @Override
    @Transactional
    public UserProfileResponse createProfile(CreateUserProfileRequest request) {
        log.info("Creating profile for auth user ID: {}", request.getAuthUserId());

        if (userProfileRepository.existsByAuthUserId(request.getAuthUserId())) {
            throw new ConflictException("User profile already exists for auth user ID: " + request.getAuthUserId());
        }

        UserProfile profile = UserProfile.builder()
                .authUserId(request.getAuthUserId())
                .email(request.getEmail().trim().toLowerCase())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .build();

        UserProfile savedProfile = userProfileRepository.save(profile);
        return mapToResponse(savedProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfileByAuthUserId(Long authUserId) {
        log.info("Fetching profile for auth user ID: {}", authUserId);
        UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "authUserId", authUserId));
        return mapToResponse(profile);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(Long authUserId, UpdateUserProfileRequest request) {
        log.info("Updating profile for auth user ID: {}", authUserId);
        UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "authUserId", authUserId));

        if (request.getFirstName() != null) {
            profile.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null) {
            profile.setLastName(request.getLastName().trim());
        }
        if (request.getPhone() != null) {
            profile.setPhone(request.getPhone().trim());
        }

        UserProfile updatedProfile = userProfileRepository.save(profile);
        return mapToResponse(updatedProfile);
    }

    @Override
    @Transactional
    public AddressDto addAddress(Long authUserId, AddressDto addressDto) {
        log.info("Adding address for auth user ID: {}", authUserId);
        UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "authUserId", authUserId));

        if (addressDto.isDefault()) {
            profile.getAddresses().forEach(addr -> addr.setDefault(false));
        }

        Address address = Address.builder()
                .userProfile(profile)
                .street(addressDto.getStreet())
                .city(addressDto.getCity())
                .state(addressDto.getState())
                .postalCode(addressDto.getPostalCode())
                .country(addressDto.getCountry())
                .isDefault(addressDto.isDefault() || profile.getAddresses().isEmpty())
                .build();

        profile.addAddress(address);
        Address savedAddress = addressRepository.save(address);
        return mapToAddressDto(savedAddress);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressDto> getUserAddresses(Long authUserId) {
        UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "authUserId", authUserId));
        return profile.getAddresses().stream()
                .map(this::mapToAddressDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAddress(Long authUserId, Long addressId) {
        UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "authUserId", authUserId));

        Address address = addressRepository.findByIdAndUserProfileId(addressId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));

        profile.removeAddress(address);
        addressRepository.delete(address);
    }

    private UserProfileResponse mapToResponse(UserProfile profile) {
        List<AddressDto> addressDtos = profile.getAddresses() != null
                ? profile.getAddresses().stream().map(this::mapToAddressDto).collect(Collectors.toList())
                : List.of();

        return UserProfileResponse.builder()
                .id(profile.getId())
                .authUserId(profile.getAuthUserId())
                .email(profile.getEmail())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .phone(profile.getPhone())
                .addresses(addressDtos)
                .createdAt(profile.getCreatedAt())
                .build();
    }

    private AddressDto mapToAddressDto(Address address) {
        return AddressDto.builder()
                .id(address.getId())
                .street(address.getStreet())
                .city(address.getCity())
                .state(address.getState())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .isDefault(address.isDefault())
                .build();
    }
}
