package com.healthcore.tracking.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;

/**
 * Intercepts incoming HTTP requests to validate JWT access tokens.
 * Establishes the Security Context if the token is valid, otherwise rejects the request securely.
 */
@Slf4j
@Component
public class JwtValidationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ROLE_CLAIM = "role";
    private static final String ROLE_PREFIX = "ROLE_";
    private static final String DEFAULT_ROLE = "USER";

    private final SecretKey key;
    private final ObjectMapper objectMapper;

    // Fail-fast architecture: No default fallback string allowed for security secrets.
    // If jwt.secret is missing in the environment, the application will correctly crash on startup.
    public JwtValidationFilter(
            @Value("${jwt.secret}") String secret,
            ObjectMapper objectMapper) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader(AUTHORIZATION_HEADER);

        // Skip filter if no Bearer token is present (SecurityConfig whitelist handles public endpoints)
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

            authenticateUserFromClaims(claims);
            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException e) {
            log.warn("Security warning: JWT token has expired for incoming request.");
            sendUnauthorizedError(response, "Token has expired. Please log in again.");
        } catch (SignatureException | MalformedJwtException e) {
            log.error("Security alert: Invalid JWT signature or malformed token detected.");
            sendUnauthorizedError(response, "Invalid or corrupted security token.");
        } catch (UnsupportedJwtException | IllegalArgumentException e) {
            log.error("Security alert: Unsupported JWT or Illegal Argument.");
            sendUnauthorizedError(response, "Invalid or corrupted security token.");
        } catch (Exception e) {
            log.error("Security error: Unexpected error validating token.", e);
            sendUnauthorizedError(response, "Internal authentication error.");
        }
    }

    private void authenticateUserFromClaims(Claims claims) {
        String email = claims.getSubject();
        String role = claims.get(ROLE_CLAIM, String.class);

        String authority = (role != null && !role.trim().isEmpty())
                ? ROLE_PREFIX + role
                : ROLE_PREFIX + DEFAULT_ROLE;

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                email, null, Collections.singletonList(new SimpleGrantedAuthority(authority))
        );

        SecurityContextHolder.getContext().setAuthentication(auth);
        log.debug("JWT successfully validated and context set for user: {}", email);
    }

    private void sendUnauthorizedError(HttpServletResponse response, String message) throws IOException {
        SecurityContextHolder.clearContext();

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorDetails = Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", HttpServletResponse.SC_UNAUTHORIZED,
                "error", "Unauthorized",
                "message", message
        );

        objectMapper.writeValue(response.getWriter(), errorDetails);
    }
}