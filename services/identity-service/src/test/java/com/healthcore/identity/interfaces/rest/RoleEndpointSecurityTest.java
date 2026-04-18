package com.healthcore.identity.interfaces.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.Role;
import com.healthcore.identity.domain.User;
import com.healthcore.identity.infrastructure.persistence.SpringDataMongoPasswordResetCodeRepository;
import com.healthcore.identity.infrastructure.persistence.SpringDataMongoRefreshTokenRepository;
import com.healthcore.identity.infrastructure.persistence.SpringDataMongoUserRepository;
import com.healthcore.identity.infrastructure.persistence.SpringDataMongoVerificationCodeRepository;
import com.healthcore.identity.infrastructure.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("context")
class RoleEndpointSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private SpringDataMongoUserRepository springDataMongoUserRepository;

    @MockitoBean
    private SpringDataMongoVerificationCodeRepository springDataMongoVerificationCodeRepository;

    @MockitoBean
    private SpringDataMongoPasswordResetCodeRepository springDataMongoPasswordResetCodeRepository;

    @MockitoBean
    private SpringDataMongoRefreshTokenRepository springDataMongoRefreshTokenRepository;

    @Test
    void should_AllowPatientEndpoint_When_RoleIsPatient() throws Exception {
        String token = jwtUtil.generateAccessToken("patient@healthcore.com", "PATIENT");

        mockMvc.perform(get("/api/v1/patients/home")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void should_RejectPatientEndpoint_When_RoleIsNutritionist() throws Exception {
        String token = jwtUtil.generateAccessToken("nutritionist@healthcore.com", "NUTRITIONIST");

        mockMvc.perform(get("/api/v1/patients/home")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void should_AllowNutritionistEndpoint_When_RoleIsNutritionist() throws Exception {
        String token = jwtUtil.generateAccessToken("nutritionist@healthcore.com", "NUTRITIONIST");

        mockMvc.perform(get("/api/v1/nutritionists/home")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void should_RejectNutritionistEndpoint_When_RoleIsPatient() throws Exception {
        String token = jwtUtil.generateAccessToken("patient@healthcore.com", "PATIENT");

        mockMvc.perform(get("/api/v1/nutritionists/home")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void should_AllowAdminEndpoint_When_RoleIsAdmin() throws Exception {
        String token = jwtUtil.generateAccessToken("admin@healthcore.com", "ADMIN");

        mockMvc.perform(get("/api/v1/admin/home")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void should_RejectAdminEndpoint_When_RoleIsPatient() throws Exception {
        String token = jwtUtil.generateAccessToken("patient@healthcore.com", "PATIENT");

        mockMvc.perform(get("/api/v1/admin/home")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void should_RejectProtectedRoleEndpoints_When_TokenIsMissing() throws Exception {
        mockMvc.perform(get("/api/v1/patients/home"))
                .andExpect(status().isForbidden());
    }

    @Test
    void should_AllowAdminProvisioningEndpoint_When_RoleIsAdmin() throws Exception {
        String token = jwtUtil.generateAccessToken("admin@healthcore.com", "ADMIN");
        AdminCreateUserRequest request = new AdminCreateUserRequest("new.patient@healthcore.com", "password123", Role.PATIENT);
        when(authService.createUserByAdmin(anyString(), anyString(), any()))
                .thenReturn(User.builder().email("new.patient@healthcore.com").role(Role.PATIENT).build());

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void should_RejectAdminProvisioningEndpoint_When_RoleIsPatient() throws Exception {
        String token = jwtUtil.generateAccessToken("patient@healthcore.com", "PATIENT");
        AdminCreateUserRequest request = new AdminCreateUserRequest("new.patient@healthcore.com", "password123", Role.PATIENT);

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}


