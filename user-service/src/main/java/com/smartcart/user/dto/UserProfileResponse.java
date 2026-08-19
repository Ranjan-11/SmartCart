package com.smartcart.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private Long authUserId;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private List<AddressDto> addresses;
    private LocalDateTime createdAt;
}
