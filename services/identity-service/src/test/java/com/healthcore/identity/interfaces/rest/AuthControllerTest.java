package com.healthcore.identity.interfaces.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.Role;
import com.healthcore.identity.domain.User;
import com.healthcore.identity.domain.exception.ConflictException;
import com.healthcore.identity.domain.exception.UnauthorizedException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = AuthController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @Test
    void should_Return201Created_When_RegistrationIsSuccessful() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest("new@healthcore.com", "password123");
        User mockUser = User.builder().email("new@healthcore.com").role(Role.PATIENT).build();

        when(authService.registerPatient(anyString(), anyString())).thenReturn(mockUser);

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Patient registered successfully"))
                .andExpect(jsonPath("$.email").value("new@healthcore.com"));
    }

    @Test
    void should_Return400BadRequest_When_EmailIsInvalid() throws Exception {
        // Arrange
        RegisterRequest badRequest = new RegisterRequest("not-an-email", "123");

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.email").exists())
                .andExpect(jsonPath("$.password").exists());
    }

    @Test
    void should_Return409Conflict_When_EmailAlreadyExists() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest("existing@healthcore.com", "password123");
        when(authService.registerPatient(anyString(), anyString()))
                .thenThrow(new ConflictException("Email is already registered in HealthCore"));

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Email is already registered in HealthCore"));
    }


    @Test
    void should_Return200Ok_And_Tokens_When_LoginIsSuccessful() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest("patient@healthcore.com", "password123");
        Map<String, String> tokens = Map.of(
                "accessToken", "mocked-access-token",
                "refreshToken", "mocked-refresh-token"
        );

        when(authService.login(anyString(), anyString())).thenReturn(tokens);

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("mocked-access-token"))
                .andExpect(jsonPath("$.refreshToken").value("mocked-refresh-token"));
    }

    @Test
    void should_Return401Unauthorized_When_CredentialsAreInvalid() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest("ghost@healthcore.com", "wrongpassword");
        when(authService.login(anyString(), anyString()))
                .thenThrow(new UnauthorizedException("Invalid credentials"));

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid credentials"));
    }

    @Test
    void should_Return200Ok_When_RefreshIsSuccessful() throws Exception {
        // Arrange
        RefreshRequest request = new RefreshRequest("refresh-token-123");
        Map<String, String> tokens = Map.of(
                "accessToken", "new-access-token",
                "refreshToken", "new-refresh-token"
        );

        when(authService.refresh(request.refreshToken())).thenReturn(tokens);

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new-access-token"))
                .andExpect(jsonPath("$.refreshToken").value("new-refresh-token"));
    }

    @Test
    void should_Return401Unauthorized_When_VerificationCodeIsInvalid() throws Exception {
        // Arrange
        VerifyCodeRequest request = new VerifyCodeRequest("patient@healthcore.com", "123456");
        doThrow(new UnauthorizedException("Invalid or expired verification code"))
                .when(authService).verifyCode(request.email(), request.code());

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid or expired verification code"));
    }
}