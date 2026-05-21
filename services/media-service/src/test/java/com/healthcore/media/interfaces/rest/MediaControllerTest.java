package com.healthcore.media.interfaces.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.media.application.dto.UploadMediaRequest;
import com.healthcore.media.application.dto.UploadMediaResponse;
import org.springframework.context.annotation.Import;
import com.healthcore.media.infrastructure.security.SecurityConfig;
import com.healthcore.media.infrastructure.security.JwtValidationFilter;
import com.healthcore.media.application.usecase.GenerateUploadUrlUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web integration tests for the MediaController.
 * Validates HTTP routing, DTO constraints, and Rate Limiting state machine.
 */
@WebMvcTest(
        controllers = MediaController.class,
        properties = {
                "jwt.secret=esta-es-una-llave-falsa-super-larga-solo-para-que-pase-el-test-de-spring-boot"
        }
)
@Import({SecurityConfig.class, JwtValidationFilter.class})
class MediaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GenerateUploadUrlUseCase useCase;

    private static final String API_ENDPOINT = "/api/v1/media/upload-request";
    private static final String VALID_USER_ID = "usr-dev-999";
    private static final String VALID_FILE_NAME = "study-results.pdf";
    private static final String MOCK_URL = "https://r2.cloudflare.com/secure-link";

    /**
     * Helper method to simulate an authenticated security context.
     */
    private UsernamePasswordAuthenticationToken getMockAuth() {
        return new UsernamePasswordAuthenticationToken(VALID_USER_ID, null, Collections.emptyList());
    }

    @Test
    void requestUploadUrl_WithValidPayloadAndToken_ReturnsCreatedAndResponse() throws Exception {
        // Arrange
        UploadMediaRequest request = new UploadMediaRequest(VALID_FILE_NAME);
        UploadMediaResponse expectedResponse = new UploadMediaResponse(MOCK_URL, "key");

        when(useCase.execute(anyString(), anyString())).thenReturn(expectedResponse);

        // Act & Assert
        mockMvc.perform(post(API_ENDPOINT)
                        .with(authentication(getMockAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.presignedUrl").value(MOCK_URL))
                .andExpect(jsonPath("$.storageKey").value("key"));
    }

    @Test
    void requestUploadUrl_WithMaliciousFileName_ReturnsBadRequest() throws Exception {
        // Arrange
        UploadMediaRequest request = new UploadMediaRequest("../../../etc/passwd");

        // Act & Assert
        mockMvc.perform(post(API_ENDPOINT)
                        .with(authentication(getMockAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    void requestUploadUrl_WhenRateLimitExceeded_ReturnsTooManyRequests() throws Exception {
        // Arrange
        String RATE_LIMIT_USER = "usr-rate-limit-test";
        UsernamePasswordAuthenticationToken rateLimitAuth =
                new UsernamePasswordAuthenticationToken(RATE_LIMIT_USER, null, Collections.emptyList());

        UploadMediaRequest request = new UploadMediaRequest(VALID_FILE_NAME);
        when(useCase.execute(anyString(), anyString())).thenReturn(new UploadMediaResponse(MOCK_URL, "key"));
        String jsonPayload = objectMapper.writeValueAsString(request);

        // Act & Assert

        mockMvc.perform(post(API_ENDPOINT).with(authentication(rateLimitAuth))
                        .contentType(MediaType.APPLICATION_JSON).content(jsonPayload))
                .andExpect(status().isCreated());

        mockMvc.perform(post(API_ENDPOINT).with(authentication(rateLimitAuth))
                        .contentType(MediaType.APPLICATION_JSON).content(jsonPayload))
                .andExpect(status().isCreated());

        mockMvc.perform(post(API_ENDPOINT).with(authentication(rateLimitAuth))
                        .contentType(MediaType.APPLICATION_JSON).content(jsonPayload))
                .andExpect(status().isCreated());

        mockMvc.perform(post(API_ENDPOINT).with(authentication(rateLimitAuth))
                        .contentType(MediaType.APPLICATION_JSON).content(jsonPayload))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void requestUploadUrl_WithNullPrincipal_ReturnsUnauthorized() throws Exception {
        // Arrange
        UploadMediaRequest request = new UploadMediaRequest(VALID_FILE_NAME);

        UsernamePasswordAuthenticationToken nullAuth =
                new UsernamePasswordAuthenticationToken(null, null, Collections.emptyList());

        // Act & Assert
        mockMvc.perform(post(API_ENDPOINT)
                        .with(authentication(nullAuth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}