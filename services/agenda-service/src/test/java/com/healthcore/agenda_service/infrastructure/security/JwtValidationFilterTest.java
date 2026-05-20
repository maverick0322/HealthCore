package com.healthcore.agenda_service.infrastructure.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link JwtValidationFilter}.
 * All branches are exercised without a Spring application context.
 */
class JwtValidationFilterTest {

    private static final String SECRET = "TestSecretKeyForAgendaServiceJWTValidation2026!!";
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        filterChain = mock(FilterChain.class);
    }

    // ── Helper ─────────────────────────────────────────────────────────────

    private JwtValidationFilter filterWithSecret(String secret) {
        return new JwtValidationFilter(secret);
    }

    private String buildToken(String subject, String role, Date expiry) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(subject)
                .claim("role", role)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    // ── Tests ──────────────────────────────────────────────────────────────

    @Test
    void shouldPassThrough_whenNoAuthorizationHeaderPresent() throws Exception {
        // Arrange
        JwtValidationFilter filter = filterWithSecret(SECRET);
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert — chain continued, no authentication set
        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void shouldReturn401_whenSecretIsEmpty() throws Exception {
        // Arrange — filter instantiated with no secret (misconfigured service)
        JwtValidationFilter filter = filterWithSecret("");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer sometoken");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert — chain is NOT continued; 401 is returned
        verify(filterChain, never()).doFilter(any(), any());
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getContentAsString()).contains("JWT secret is not configured");
    }

    @Test
    void shouldAuthenticateAndContinue_whenValidTokenPresent() throws Exception {
        // Arrange
        JwtValidationFilter filter = filterWithSecret(SECRET);
        String token = buildToken("nutritionist@healthcore.com", "NUTRITIONIST",
                new Date(System.currentTimeMillis() + 60_000));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert — authentication populated, chain continued
        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName())
                .isEqualTo("nutritionist@healthcore.com");
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .anyMatch(a -> a.getAuthority().equals("ROLE_NUTRITIONIST"));
    }

    @Test
    void shouldReturn401_whenTokenIsExpired() throws Exception {
        // Arrange
        JwtValidationFilter filter = filterWithSecret(SECRET);
        String token = buildToken("patient@healthcore.com", "PATIENT",
                new Date(System.currentTimeMillis() - 1000)); // already expired

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(filterChain, never()).doFilter(any(), any());
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(response.getContentAsString()).contains("Invalid or expired token");
    }

    @Test
    void shouldReturn401_whenTokenIsGarbage() throws Exception {
        // Arrange
        JwtValidationFilter filter = filterWithSecret(SECRET);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer not.a.jwt");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(filterChain, never()).doFilter(any(), any());
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
    }

    @Test
    void shouldPassThrough_whenAuthenticationAlreadyInContext() throws Exception {
        // Arrange — simulate a request already authenticated upstream
        JwtValidationFilter filter = filterWithSecret(SECRET);
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken existing =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "admin@healthcore.com", null, java.util.Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(existing);

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert — filter passes through without re-authenticating
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldExtractNoAuthorities_whenTokenHasNoRoleClaim() throws Exception {
        // Arrange — token without a role claim
        JwtValidationFilter filter = filterWithSecret(SECRET);
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .subject("service@healthcore.com")
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key)
                .compact();

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert — authenticated but with no granted authorities
        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities()).isEmpty();
    }
}
