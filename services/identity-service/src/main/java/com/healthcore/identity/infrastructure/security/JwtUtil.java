package com.healthcore.identity.infrastructure.security;

import com.healthcore.identity.domain.exception.UnauthorizedException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long accessTokenValidity;
    private final long refreshTokenValidity;

    public JwtUtil(
            @Value("${jwt.secret:ThisIsAVerySecureSecretKeyForHealthCore2026!}") String secret,
            @Value("${jwt.access-token.validity:300000}") long accessTokenValidity,
            @Value("${jwt.refresh-token.validity:86400000}") long refreshTokenValidity) {

        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenValidity = accessTokenValidity;
        this.refreshTokenValidity = refreshTokenValidity;
    }

    public String generateAccessToken(String email, String role) {
        log.debug("Generating access token for user: {}", email);
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenValidity))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(String email) {
        log.debug("Generating refresh token for user: {}", email);
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenValidity))
                .signWith(key)
                .compact();
    }


    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    private Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

        } catch (ExpiredJwtException e) {
            log.warn("JWT validation failed: Token is expired for subject: {}", e.getClaims().getSubject());
            throw new UnauthorizedException("Token has expired");

        } catch (SignatureException | MalformedJwtException e) {
            log.error("JWT validation failed: Security tampering detected or malformed token");
            throw new UnauthorizedException("Invalid token");

        } catch (Exception e) {
            log.error("Unexpected error during JWT validation", e);
            throw new UnauthorizedException("Authentication processing failed");
        }
    }
}