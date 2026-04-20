package com.healthcore.identity.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class AuthRateLimitFilterTest {

    private AuthRateLimitFilter filter;

    @BeforeEach
    void setUp() {
        AuthSecurityProperties properties = new AuthSecurityProperties();
        properties.getRateLimit().setEnabled(true);
        properties.getRateLimit().setAuthRequestsPerMinute(2);
        filter = new AuthRateLimitFilter(properties, new ObjectMapper());
    }

    @Test
    void should_AllowRequestsWithinLimit() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("127.0.0.1");

        MockHttpServletResponse response1 = new MockHttpServletResponse();
        filter.doFilterInternal(request, response1, new MockFilterChain());

        MockHttpServletResponse response2 = new MockHttpServletResponse();
        filter.doFilterInternal(request, response2, new MockFilterChain());

        assertThat(response1.getStatus()).isNotEqualTo(429);
        assertThat(response2.getStatus()).isNotEqualTo(429);
    }

    @Test
    void should_Return429_WhenLimitExceeded() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("127.0.0.1");

        filter.doFilterInternal(request, new MockHttpServletResponse(), new MockFilterChain());
        filter.doFilterInternal(request, new MockHttpServletResponse(), new MockFilterChain());

        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
        filter.doFilterInternal(request, blockedResponse, new MockFilterChain());

        assertThat(blockedResponse.getStatus()).isEqualTo(429);
        assertThat(blockedResponse.getContentAsString()).contains("TOO_MANY_REQUESTS");
    }
}

