package com.healthcore.tracking.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Slf4j
@Component
public class JwtValidationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ROLE_CLAIM = "role";
    private static final String ROLE_PREFIX = "ROLE_";

    private final SecretKey key;

    public JwtValidationFilter(@Value("${jwt.secret:ThisIsAVerySecureSecretKeyForHealthCore2026!}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader(AUTHORIZATION_HEADER);

        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = header.substring(BEARER_PREFIX.length());

            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String email = claims.getSubject();
            String role = claims.get(ROLE_CLAIM, String.class);

            String authority = (role != null && !role.trim().isEmpty()) ? ROLE_PREFIX + role : ROLE_PREFIX + "USER";

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    email, null, Collections.singletonList(new SimpleGrantedAuthority(authority))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
            log.debug("JWT successfully validated for user: {}", email);

            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException e) {
            log.warn("Security warning: JWT token has expired.");
            SecurityContextHolder.clearContext();
            sendUnauthorizedError(response, "El token ha expirado. Por favor, inicie sesión nuevamente.");

        } catch (SignatureException | MalformedJwtException e) {
            log.error("Security alert: Invalid JWT signature or malformed token.");
            SecurityContextHolder.clearContext();
            sendUnauthorizedError(response, "Token de seguridad inválido o corrupto.");

        } catch (UnsupportedJwtException | IllegalArgumentException e) {
            log.error("Security alert: Unsupported JWT or Illegal Argument.");
            SecurityContextHolder.clearContext();
            sendUnauthorizedError(response, "Token de seguridad inválido o corrupto.");

        } catch (Exception e) {
            log.error("Security error: Unexpected error validating token", e);
            SecurityContextHolder.clearContext();
            sendUnauthorizedError(response, "Error interno de autenticación.");
        }
    }

    private void sendUnauthorizedError(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"status\": 401, \"error\": \"Unauthorized\", \"message\": \"" + message + "\"}");
    }
}