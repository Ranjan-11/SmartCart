package com.smartcart.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserProfileRequest {

    @NotNull(message = "Auth user ID is required")
    private Long authUserId;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String firstName;
    private String lastName;
    private String phone;
}
