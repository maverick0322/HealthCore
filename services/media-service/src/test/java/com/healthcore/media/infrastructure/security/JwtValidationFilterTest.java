package com.healthcore.media.infrastructure.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for JwtValidationFilter.
 * Validates the stateless security chain, token parsing, and robust error translation.
 */
class JwtValidationFilterTest {

    private JwtValidationFilter filter;
    private ObjectMapper objectMapper;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private FilterChain filterChain;

    // A valid 256-bit secret key strictly for testing purposes
    private static final String TEST_SECRET = "esta-es-una-llave-falsa-super-larga-solo-para-que-pase-el-test-de-spring-boot";
    private SecretKey validKey;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        filter = new JwtValidationFilter(TEST_SECRET, objectMapper);

        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        filterChain = new MockFilterChain();

        validKey = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));

        // Ensure clean state before each test
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        // Prevent SecurityContext leakage between tests
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_WhenNoAuthorizationHeader_PassesToNextFilterWithoutAuthenticating() throws Exception {
        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(response.getStatus()).isEqualTo(200); // Filter did not block the request
    }

    @Test
    void doFilterInternal_WhenHeaderDoesNotStartWithBearer_PassesToNextFilter() throws Exception {
        // Arrange
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");

        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void doFilterInternal_WithValidTokenAndRole_SetsSecurityContext() throws Exception {
        // Arrange
        String validToken = Jwts.builder()
                .subject("usr-123")
                .claim("role", "ADMIN")
                .signWith(validKey)
                .compact();

        request.addHeader("Authorization", "Bearer " + validToken);

        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo("usr-123");
        assertThat(auth.getAuthorities()).extracting("authority").containsExactly("ROLE_ADMIN");
    }

    @Test
    void doFilterInternal_WithValidTokenButNoRole_AppliesDefaultRole() throws Exception {
        // Arrange
        String validToken = Jwts.builder()
                .subject("usr-456")
                // Missing the 'role' claim intentionally
                .signWith(validKey)
                .compact();

        request.addHeader("Authorization", "Bearer " + validToken);

        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getAuthorities()).extracting("authority").containsExactly("ROLE_USER");
    }

    @Test
    void doFilterInternal_WhenTokenIsExpired_Returns401Unauthorized() throws Exception {
        // Arrange
        String expiredToken = Jwts.builder()
                .subject("usr-123")
                .expiration(new Date(System.currentTimeMillis() - 10000)) // Expired 10 seconds ago
                .signWith(validKey)
                .compact();

        request.addHeader("Authorization", "Bearer " + expiredToken);

        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        assertUnauthorizedResponse(response, "Token has expired. Please authenticate again.");
    }

    @Test
    void doFilterInternal_WhenSignatureIsInvalid_Returns401Unauthorized() throws Exception {
        // Arrange
        SecretKey forgedKey = Keys.hmacShaKeyFor("esta-es-otra-llave-completamente-distinta-para-falsificar".getBytes(StandardCharsets.UTF_8));
        String forgedToken = Jwts.builder()
                .subject("usr-hacker")
                .signWith(forgedKey) // Signed with a different key
                .compact();

        request.addHeader("Authorization", "Bearer " + forgedToken);

        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        assertUnauthorizedResponse(response, "Invalid security token.");
    }

    @Test
    void doFilterInternal_WhenTokenIsMalformed_Returns401Unauthorized() throws Exception {
        // Arrange
        request.addHeader("Authorization", "Bearer este.no.es.un.token.jwt.valido");

        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        assertUnauthorizedResponse(response, "Invalid security token.");
    }

    @Test
    void doFilterInternal_WhenTokenIsEmpty_Returns401Unauthorized() throws Exception {
        // Arrange
        request.addHeader("Authorization", "Bearer "); // Triggers IllegalArgumentException in parser

        // Act
        filter.doFilter(request, response, filterChain);

        // Assert
        assertUnauthorizedResponse(response, "Unsupported security token.");
    }

    @Test
    void doFilterInternal_WhenUnexpectedExceptionOccurs_Returns401InternalAuthError() throws Exception {
        // Arrange
        String validToken = Jwts.builder().subject("usr-123").signWith(validKey).compact();
        request.addHeader("Authorization", "Bearer " + validToken);

        // To trigger the generic Exception catch block, we mock the FilterChain to throw a RuntimeException
        // during its execution, which sits inside the try-catch block of the filter.
        FilterChain mockChain = mock(FilterChain.class);
        doThrow(new RuntimeException("Simulated unexpected internal failure"))
                .when(mockChain).doFilter(request, response);

        // Act
        filter.doFilter(request, response, mockChain);

        // Assert
        assertUnauthorizedResponse(response, "Internal authentication error.");
        verify(mockChain).doFilter(request, response); // Verify the chain was actually called
    }

    /**
     * Helper method to centralize the assertions for standard 401 JSON error responses.
     */
    private void assertUnauthorizedResponse(MockHttpServletResponse response, String expectedMessage) throws IOException {
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).startsWith("application/json");

        Map<String, Object> responseBody = objectMapper.readValue(
                response.getContentAsString(),
                new TypeReference<>() {}
        );

        assertThat(responseBody.get("status")).isEqualTo(401);
        assertThat(responseBody.get("error")).isEqualTo("Unauthorized");
        assertThat(responseBody.get("message")).isEqualTo(expectedMessage);
        assertThat(responseBody.get("timestamp")).isNotNull();
    }
}