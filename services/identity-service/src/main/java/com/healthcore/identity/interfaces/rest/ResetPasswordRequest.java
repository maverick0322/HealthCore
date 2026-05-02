package com.healthcore.identity.interfaces.rest;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Reset code is required")
        @Pattern(regexp = "^\\d{6}$", message = "Reset code must contain 6 digits")
        String code,

        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 72, message = "New password must be between 8 and 72 characters long")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,72}$",
                message = "New password must include upper, lower, number, and symbol")
        String newPassword
) {}

