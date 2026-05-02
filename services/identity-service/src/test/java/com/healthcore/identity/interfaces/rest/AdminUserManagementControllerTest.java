package com.healthcore.identity.interfaces.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.Role;
import com.healthcore.identity.domain.User;
import com.healthcore.identity.domain.exception.ConflictException;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminUserManagementController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@org.springframework.test.context.ContextConfiguration(classes = com.healthcore.identity.IdentityServiceApplication.class)
@Import(AdminUserManagementControllerTest.TestConfig.class)
class AdminUserManagementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @Test
    void should_Return201Created_When_AdminCreatesUser() throws Exception {
        AdminCreateUserRequest request = new AdminCreateUserRequest("new.nutri@healthcore.com", "StrongPass123!", Role.NUTRITIONIST, null);
        User created = User.builder().email("new.nutri@healthcore.com").role(Role.NUTRITIONIST).build();

        when(authService.createUserByAdmin(anyString(), anyString(), any(), any())).thenReturn(created);

        mockMvc.perform(post("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("User created successfully"))
                .andExpect(jsonPath("$.email").value("new.nutri@healthcore.com"));
    }

    @Test
    void should_Return400BadRequest_When_RoleIsMissing() throws Exception {
        String payload = "{\"email\":\"new.user@healthcore.com\",\"password\":\"StrongPass123!\"}";

        mockMvc.perform(post("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.role").exists());
    }

    @Test
    void should_Return409Conflict_When_EmailAlreadyExists() throws Exception {
        AdminCreateUserRequest request = new AdminCreateUserRequest("existing@healthcore.com", "StrongPass123!", Role.PATIENT, null);

        when(authService.createUserByAdmin(anyString(), anyString(), any(), any()))
                .thenThrow(new ConflictException("Email is already registered in HealthCore"));

        mockMvc.perform(post("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Email is already registered in HealthCore"));
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        AuthSecurityProperties authSecurityProperties() {
            return new AuthSecurityProperties();
        }
    }
}
