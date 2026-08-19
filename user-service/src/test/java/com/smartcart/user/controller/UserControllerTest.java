package com.smartcart.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcart.common.security.SecurityConstants;
import com.smartcart.user.dto.CreateUserProfileRequest;
import com.smartcart.user.dto.UpdateUserProfileRequest;
import com.smartcart.user.dto.UserProfileResponse;
import com.smartcart.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    void shouldCreateProfile() throws Exception {
        CreateUserProfileRequest request = CreateUserProfileRequest.builder()
                .authUserId(1L)
                .email("alex@smartcart.com")
                .firstName("Alex")
                .lastName("Taylor")
                .build();

        UserProfileResponse response = UserProfileResponse.builder()
                .id(1L)
                .authUserId(1L)
                .email("alex@smartcart.com")
                .firstName("Alex")
                .lastName("Taylor")
                .addresses(List.of())
                .build();

        when(userService.createProfile(any(CreateUserProfileRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/users/profile")
                        .header(SecurityConstants.HEADER_USER_ID, "1")
                        .header(SecurityConstants.HEADER_USER_ROLES, "ROLE_CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("alex@smartcart.com"));
    }

    @Test
    void shouldGetCurrentUserProfile() throws Exception {
        UserProfileResponse response = UserProfileResponse.builder()
                .id(1L)
                .authUserId(1L)
                .email("alex@smartcart.com")
                .firstName("Alex")
                .lastName("Taylor")
                .addresses(List.of())
                .build();

        when(userService.getProfileByAuthUserId(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/users/me")
                        .header(SecurityConstants.HEADER_USER_ID, "1")
                        .header(SecurityConstants.HEADER_USER_ROLES, "ROLE_CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.firstName").value("Alex"));
    }

    @Test
    void shouldUpdateCurrentUserProfile() throws Exception {
        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .firstName("Alexander")
                .lastName("Taylor")
                .phone("9998887777")
                .build();

        UserProfileResponse response = UserProfileResponse.builder()
                .id(1L)
                .authUserId(1L)
                .email("alex@smartcart.com")
                .firstName("Alexander")
                .lastName("Taylor")
                .phone("9998887777")
                .addresses(List.of())
                .build();

        when(userService.updateProfile(eq(1L), any(UpdateUserProfileRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/users/me")
                        .header(SecurityConstants.HEADER_USER_ID, "1")
                        .header(SecurityConstants.HEADER_USER_ROLES, "ROLE_CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.firstName").value("Alexander"));
    }
}
