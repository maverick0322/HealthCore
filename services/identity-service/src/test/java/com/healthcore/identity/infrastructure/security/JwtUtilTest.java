package com.healthcore.identity.infrastructure.security;

import com.healthcore.identity.domain.Role;
import com.healthcore.identity.domain.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    private static final String TEST_SECRET = "TestSecretKeyForHealthCoreIdentityService2026!";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(jwtProperties(TEST_SECRET, 300000L, 86400000L));
    }

    @Test
    void should_GenerateValidAccessToken_And_ExtractCorrectClaims() {
        // Arrange
        String email = "patient@healthcore.com";
        String role = Role.PATIENT.name();

        // Act
        String token = jwtUtil.generateAccessToken(email, role);
        String extractedEmail = jwtUtil.extractEmail(token);
        String extractedRole = jwtUtil.extractRole(token);

        // Assert
        assertThat(token).isNotBlank();
        assertThat(extractedEmail).isEqualTo(email);
        assertThat(extractedRole).isEqualTo(role);
    }

    @Test
    void should_GenerateValidRefreshToken_And_ExtractEmail() {
        // Arrange
        String email = "admin@healthcore.com";

        // Act
        String token = jwtUtil.generateRefreshToken(email);
        String extractedEmail = jwtUtil.extractEmail(token);

        // Assert
        assertThat(token).isNotBlank();
        assertThat(extractedEmail).isEqualTo(email);
    }


    @Test
    void should_ThrowUnauthorizedException_When_TokenSignatureIsTampered() {
        // Arrange
        String validToken = jwtUtil.generateAccessToken("victim@healthcore.com", Role.PATIENT.name());

        // Act
        String tamperedToken = validToken.substring(0, validToken.length() - 1) + "X";

        // Assert
        assertThatThrownBy(() -> jwtUtil.extractEmail(tamperedToken))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid token");
    }

    @Test
    void should_ThrowUnauthorizedException_When_TokenIsMalformed() {
        // Arrange
        String malformedToken = "esto.no.es.un.jwt.valido";

        // Act & Assert
        assertThatThrownBy(() -> jwtUtil.extractEmail(malformedToken))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid token");
    }

    @Test
    void should_ThrowUnauthorizedException_When_TokenIsExpired() throws InterruptedException {
        // Arrange
        JwtUtil fastExpiringJwtUtil = new JwtUtil(jwtProperties(TEST_SECRET, 1L, 1L));
        String token = fastExpiringJwtUtil.generateAccessToken("slow@healthcore.com", Role.PATIENT.name());

        Thread.sleep(50);

        // Act & Assert
        assertThatThrownBy(() -> fastExpiringJwtUtil.extractEmail(token))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Token has expired");
    }

    private JwtProperties jwtProperties(String secret, long accessTokenValidity, long refreshTokenValidity) {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret(secret);
        jwtProperties.setAccessTokenValidity(accessTokenValidity);
        jwtProperties.setRefreshTokenValidity(refreshTokenValidity);
        return jwtProperties;
    }
}