package com.healthcore.identity.infrastructure.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {
    private final String SECRET = "EstaEsUnaClaveSecretaSuperSeguraParaHealthCore2026!";
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());

    private final long ACCESS_TOKEN_VALIDITY = 5 * 60 * 1000; //Se toman 5 minutos como tiempo máximo del token
    private final long REFRESH_TOKEN_VALIDITY = 24 * 60 * 60 * 1000; //Se toman 24 horas como tiempo máximo del token

    public String generateAccessToken(String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_VALIDITY))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_VALIDITY))
                .signWith(key)
                .compact();
    }

}
