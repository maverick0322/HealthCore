package com.healthcore.media.infrastructure.security;

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
 * Intercepts incoming HTTP requests to enforce stateless JWT authentication.
 * Fails fast on invalid signatures or missing configuration.
 */
@Slf4j
@Component
public class JwtValidationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ROLE_CLAIM = "role";
    private static final String ROLE_PREFIX = "ROLE_";
    private static final String DEFAULT_ROLE = "USER";
    private static final String CONTENT_TYPE_JSON = "application/json";
    private static final String ENCODING_UTF8 = "UTF-8";

    private final SecretKey key;
    private final ObjectMapper objectMapper;

    // Fails fast if jwt.secret is missing. Prevents silent security downgrades.
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

        // Delegation: If no bearer token, pass to Spring Security to handle rejection based on HttpSecurity rules.
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
            log.warn("Authentication rejected: JWT token has expired.");
            sendUnauthorizedError(response, "Token has expired. Please authenticate again.");
        } catch (SignatureException | MalformedJwtException e) {
            log.error("Authentication alert: Invalid signature or malformed token detected.");
            sendUnauthorizedError(response, "Invalid security token.");
        } catch (UnsupportedJwtException | IllegalArgumentException e) {
            log.error("Authentication alert: Unsupported token format provided.");
            sendUnauthorizedError(response, "Unsupported security token.");
        } catch (Exception e) {
            log.error("Authentication error: Unexpected failure during JWT processing.", e);
            sendUnauthorizedError(response, "Internal authentication error.");
        }
    }

    private void authenticateUserFromClaims(Claims claims) {
        String userId = claims.getSubject();
        String role = claims.get(ROLE_CLAIM, String.class);

        String authority = (role != null && !role.isBlank())
                ? ROLE_PREFIX + role
                : ROLE_PREFIX + DEFAULT_ROLE;

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userId, null, Collections.singletonList(new SimpleGrantedAuthority(authority))
        );

        SecurityContextHolder.getContext().setAuthentication(auth);
        log.debug("Security context established for user ID: {}", userId);
    }

    private void sendUnauthorizedError(HttpServletResponse response, String message) throws IOException {
        SecurityContextHolder.clearContext();

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(CONTENT_TYPE_JSON);
        response.setCharacterEncoding(ENCODING_UTF8);

        Map<String, Object> errorDetails = Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", HttpServletResponse.SC_UNAUTHORIZED,
                "error", "Unauthorized",
                "message", message
        );

        objectMapper.writeValue(response.getWriter(), errorDetails);
    }
}