package com.smartcart.user.service;

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
import com.smartcart.user.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private AddressRepository addressRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private UserProfile sampleProfile;

    @BeforeEach
    void setUp() {
        sampleProfile = UserProfile.builder()
                .id(1L)
                .authUserId(10L)
                .email("alex@smartcart.com")
                .firstName("Alex")
                .lastName("Taylor")
                .phone("1234567890")
                .addresses(new ArrayList<>())
                .build();
    }

    @Test
    void shouldCreateProfileSuccessfully() {
        CreateUserProfileRequest request = CreateUserProfileRequest.builder()
                .authUserId(10L)
                .email("alex@smartcart.com")
                .firstName("Alex")
                .lastName("Taylor")
                .phone("1234567890")
                .build();

        when(userProfileRepository.existsByAuthUserId(10L)).thenReturn(false);
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(sampleProfile);

        UserProfileResponse response = userService.createProfile(request);

        assertNotNull(response);
        assertEquals(10L, response.getAuthUserId());
        assertEquals("Alex", response.getFirstName());
        verify(userProfileRepository, times(1)).save(any(UserProfile.class));
    }

    @Test
    void shouldThrowConflictWhenProfileAlreadyExists() {
        CreateUserProfileRequest request = CreateUserProfileRequest.builder()
                .authUserId(10L)
                .email("alex@smartcart.com")
                .build();

        when(userProfileRepository.existsByAuthUserId(10L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> userService.createProfile(request));
        verify(userProfileRepository, never()).save(any(UserProfile.class));
    }

    @Test
    void shouldGetProfileByAuthUserId() {
        when(userProfileRepository.findByAuthUserId(10L)).thenReturn(Optional.of(sampleProfile));

        UserProfileResponse response = userService.getProfileByAuthUserId(10L);

        assertNotNull(response);
        assertEquals("alex@smartcart.com", response.getEmail());
    }

    @Test
    void shouldThrowNotFoundWhenProfileMissing() {
        when(userProfileRepository.findByAuthUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getProfileByAuthUserId(99L));
    }

    @Test
    void shouldUpdateProfileSuccessfully() {
        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .firstName("Alexander")
                .lastName("Smith")
                .phone("9876543210")
                .build();

        when(userProfileRepository.findByAuthUserId(10L)).thenReturn(Optional.of(sampleProfile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(sampleProfile);

        UserProfileResponse response = userService.updateProfile(10L, request);

        assertNotNull(response);
        assertEquals("Alexander", sampleProfile.getFirstName());
        assertEquals("Smith", sampleProfile.getLastName());
    }

    @Test
    void shouldAddAddressSuccessfully() {
        AddressDto addressDto = AddressDto.builder()
                .street("123 Market St")
                .city("San Francisco")
                .state("CA")
                .postalCode("94103")
                .country("USA")
                .isDefault(true)
                .build();

        Address savedAddress = Address.builder()
                .id(5L)
                .userProfile(sampleProfile)
                .street("123 Market St")
                .city("San Francisco")
                .state("CA")
                .postalCode("94103")
                .country("USA")
                .isDefault(true)
                .build();

        when(userProfileRepository.findByAuthUserId(10L)).thenReturn(Optional.of(sampleProfile));
        when(addressRepository.save(any(Address.class))).thenReturn(savedAddress);

        AddressDto result = userService.addAddress(10L, addressDto);

        assertNotNull(result);
        assertEquals(5L, result.getId());
        assertEquals("123 Market St", result.getStreet());
    }
}
