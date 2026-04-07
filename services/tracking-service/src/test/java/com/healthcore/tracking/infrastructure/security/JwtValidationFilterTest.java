package com.healthcore.tracking.infrastructure.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtValidationFilterTest {

    private JwtValidationFilter jwtValidationFilter;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain filterChain;

    private static final String TEST_SECRET = "ThisIsAVerySecureSecretKeyForTestingTheFilter2026!";
    private SecretKey key;

    @BeforeEach
    void setUp() {
        jwtValidationFilter = new JwtValidationFilter(TEST_SECRET);
        key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));

        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        filterChain = new MockFilterChain();

        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private String generateTestToken(String email, String role, long expirationMillis) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(key)
                .compact();
    }

    @Test
    void should_AuthenticateUser_When_TokenIsValid() throws ServletException, IOException {
        // Arrange
        String validToken = generateTestToken("patient@healthcore.com", "PATIENT", 300000); // 5 minutos
        request.addHeader("Authorization", "Bearer " + validToken);

        // Act
        jwtValidationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("patient@healthcore.com", SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        assertTrue(SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT")));
    }

    @Test
    void should_NotAuthenticate_When_AuthorizationHeaderIsMissing() throws ServletException, IOException {
        // Arrange

        // Act
        jwtValidationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void should_ClearContext_When_TokenIsExpired() throws ServletException, IOException, InterruptedException {
        // Arrange
        String expiredToken = generateTestToken("slow@healthcore.com", "PATIENT", 1); // 1 milisegundo de vida
        Thread.sleep(50);
        request.addHeader("Authorization", "Bearer " + expiredToken);

        // Act
        jwtValidationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void should_ClearContext_When_SignatureIsInvalid() throws ServletException, IOException {
        // Arrange
        String validToken = generateTestToken("hacker@healthcore.com", "ADMIN", 300000);
        String tamperedToken = validToken.substring(0, validToken.length() - 1) + "X";
        request.addHeader("Authorization", "Bearer " + tamperedToken);

        // Act
        jwtValidationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void should_ClearContext_When_TokenIsMalformed() throws ServletException, IOException {
        // Arrange
        request.addHeader("Authorization", "Bearer esto.no.es.un.jwt.real");

        // Act
        jwtValidationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void should_ClearContext_When_TokenIsEmpty() throws ServletException, IOException {
        // Arrange
        request.addHeader("Authorization", "Bearer ");

        // Act
        jwtValidationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}