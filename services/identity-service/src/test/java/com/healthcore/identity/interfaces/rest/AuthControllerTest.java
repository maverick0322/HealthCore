package com.healthcore.identity.interfaces.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.Role;
import com.healthcore.identity.domain.User;
import com.healthcore.identity.domain.exception.ConflictException;
import com.healthcore.identity.domain.exception.TooManyRequestsException;
import com.healthcore.identity.domain.exception.UnauthorizedException;
import com.healthcore.identity.infrastructure.security.AuthSecurityProperties;
import com.healthcore.identity.infrastructure.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@org.springframework.test.context.ContextConfiguration(classes = com.healthcore.identity.IdentityServiceApplication.class)
@Import(AuthControllerTest.TestConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @Test
    void should_Return201Created_When_RegistrationIsSuccessful() throws Exception {
        RegisterRequest request = new RegisterRequest("new@healthcore.com", "StrongPass123!", Role.PATIENT, null);
        User mockUser = User.builder().email("new@healthcore.com").role(Role.PATIENT).build();

        when(authService.registerLocalUser(anyString(), anyString(), any(), any())).thenReturn(mockUser);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("User registered successfully"))
                .andExpect(jsonPath("$.email").value("new@healthcore.com"));
    }

    @Test
    void should_Return400BadRequest_When_EmailIsInvalid() throws Exception {
        RegisterRequest badRequest = new RegisterRequest("not-an-email", "Weak1!", Role.PATIENT, null);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.email").exists())
                .andExpect(jsonPath("$.password").exists());
    }

    @Test
    void should_Return409Conflict_When_EmailAlreadyExists() throws Exception {
        RegisterRequest request = new RegisterRequest("existing@healthcore.com", "StrongPass123!", Role.PATIENT, null);
        when(authService.registerLocalUser(anyString(), anyString(), any(), any()))
                .thenThrow(new ConflictException("Email is already registered in HealthCore"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Email is already registered in HealthCore"));
    }


    @Test
    void should_Return200Ok_And_Tokens_When_LoginIsSuccessful() throws Exception {
        LoginRequest request = new LoginRequest("patient@healthcore.com", "StrongPass123!");
        AuthService.AuthTokens tokens = new AuthService.AuthTokens(
                "mocked-access-token",
                "mocked-refresh-token",
                "Bearer",
                300000L,
                86400000L
        );

        when(authService.login(anyString(), anyString())).thenReturn(tokens);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("mocked-access-token"))
                .andExpect(jsonPath("$.refreshToken").value("mocked-refresh-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    void should_Return401Unauthorized_When_CredentialsAreInvalid() throws Exception {
        LoginRequest request = new LoginRequest("ghost@healthcore.com", "WrongPass123!");
        when(authService.login(anyString(), anyString()))
                .thenThrow(new UnauthorizedException("Invalid credentials"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid credentials"));
    }

    @Test
    void should_Return429TooManyRequests_When_LoginIsTemporarilyBlocked() throws Exception {
        LoginRequest request = new LoginRequest("blocked@healthcore.com", "StrongPass123!");
        when(authService.login(anyString(), anyString()))
                .thenThrow(new TooManyRequestsException("Too many failed login attempts. Please try again later."));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("TOO_MANY_REQUESTS"));
    }

    @Test
    void should_Return200Ok_When_RefreshIsSuccessful() throws Exception {
        RefreshRequest request = new RefreshRequest("refresh-token-123");
        AuthService.AuthTokens tokens = new AuthService.AuthTokens(
                "new-access-token",
                "new-refresh-token",
                "Bearer",
                300000L,
                86400000L
        );

        when(authService.refresh(request.refreshToken())).thenReturn(tokens);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new-access-token"))
                .andExpect(jsonPath("$.refreshToken").value("new-refresh-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    void should_Return401Unauthorized_When_VerificationCodeIsInvalid() throws Exception {
        VerifyCodeRequest request = new VerifyCodeRequest("patient@healthcore.com", "123456");
        doThrow(new UnauthorizedException("Invalid or expired verification code"))
                .when(authService).verifyCode(request.email(), request.code());

        mockMvc.perform(post("/api/v1/auth/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid or expired verification code"));
    }

    @Test
    void should_Return200Ok_When_LogoutIsSuccessful() throws Exception {
        LogoutRequest request = new LogoutRequest("refresh-token-123");
        doNothing().when(authService).logout(request.refreshToken());

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logout completed successfully"));
    }

    @Test
    void should_Return200Ok_When_MeEndpointHasAuthenticatedPrincipal() throws Exception {
        User currentUser = User.builder()
                .email("patient@healthcore.com")
                .role(Role.PATIENT)
                .provider(com.healthcore.identity.domain.AuthProvider.LOCAL)
                .emailVerified(true)
                .enabled(true)
                .build();

        when(authService.getCurrentUserByEmail("patient@healthcore.com")).thenReturn(currentUser);

        mockMvc.perform(get("/api/v1/auth/me")
                        .principal(new UsernamePasswordAuthenticationToken("patient@healthcore.com", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("patient@healthcore.com"))
                .andExpect(jsonPath("$.provider").value("LOCAL"));
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        AuthSecurityProperties authSecurityProperties() {
            return new AuthSecurityProperties();
        }
    }
}
