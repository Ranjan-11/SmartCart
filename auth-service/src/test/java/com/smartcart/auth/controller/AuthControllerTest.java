package com.smartcart.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcart.auth.dto.AuthResponse;
import com.smartcart.auth.dto.LoginRequest;
import com.smartcart.auth.dto.RegisterRequest;
import com.smartcart.auth.service.AuthService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    void shouldReturn201OnRegister() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@smartcart.com")
                .password("password123")
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("access_token_123")
                .refreshToken("refresh_token_123")
                .tokenType("Bearer")
                .userId(1L)
                .email("test@smartcart.com")
                .roles(List.of("ROLE_CUSTOMER"))
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("access_token_123"))
                .andExpect(jsonPath("$.data.email").value("test@smartcart.com"));
    }

    @Test
    void shouldReturn200OnLogin() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("test@smartcart.com")
                .password("password123")
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("access_token_123")
                .refreshToken("refresh_token_123")
                .tokenType("Bearer")
                .userId(1L)
                .email("test@smartcart.com")
                .roles(List.of("ROLE_CUSTOMER"))
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("access_token_123"));
    }

    @Test
    void shouldRejectInvalidEmailFormat() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("invalid-email-format")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
