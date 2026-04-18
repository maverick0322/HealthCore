package com.healthcore.identity.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@RequiredArgsConstructor
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final int TOO_MANY_REQUESTS_STATUS = 429;

    private static final String[] PROTECTED_PATHS = {
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/verify-code",
            "/api/v1/auth/password-reset/request",
            "/api/v1/auth/password-reset/confirm",
            "/api/v1/admin/users"
    };

    private final AuthSecurityProperties authSecurityProperties;
    private final ObjectMapper objectMapper;

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        if (!shouldLimit(path) || !authSecurityProperties.getRateLimit().isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = resolveClientIp(request) + "|" + path;
        if (isLimitExceeded(key, authSecurityProperties.getRateLimit().getAuthRequestsPerMinute())) {
            writeRateLimitedResponse(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean shouldLimit(String path) {
        for (String protectedPath : PROTECTED_PATHS) {
            if (path.equals(protectedPath)) {
                return true;
            }
        }
        return false;
    }

    private boolean isLimitExceeded(String key, int limitPerMinute) {
        long now = System.currentTimeMillis();
        WindowCounter counter = counters.compute(key, (ignored, current) -> {
            if (current == null || now - current.windowStartedAtMillis >= 60_000L) {
                return new WindowCounter(now, new AtomicInteger(1));
            }
            current.counter.incrementAndGet();
            return current;
        });

        return counter.counter.get() > limitPerMinute;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void writeRateLimitedResponse(HttpServletResponse response) throws IOException {
        response.setStatus(TOO_MANY_REQUESTS_STATUS);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> payload = new HashMap<>();
        payload.put("code", "TOO_MANY_REQUESTS");
        payload.put("message", "Too many requests. Please try again later.");
        payload.put("error", "Too many requests. Please try again later.");
        payload.put("timestamp", OffsetDateTime.now().toString());

        objectMapper.writeValue(response.getWriter(), payload);
    }

    private static class WindowCounter {
        private final long windowStartedAtMillis;
        private final AtomicInteger counter;

        private WindowCounter(long windowStartedAtMillis, AtomicInteger counter) {
            this.windowStartedAtMillis = windowStartedAtMillis;
            this.counter = counter;
        }
    }
}


