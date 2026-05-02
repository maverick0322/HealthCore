package com.healthcore.identity.infrastructure.security;

import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.exception.OAuth2ProviderConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OAuth2LoginSuccessHandlerTest {

    private AuthService authService;
    private OAuth2LoginSuccessHandler handler;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        handler = new OAuth2LoginSuccessHandler(authService);
        ReflectionTestUtils.setField(handler, "redirectUrl", "https://localhost:5173/oauth2/callback");
    }

    @Test
    void should_RedirectWithProviderConflict_When_EmailExistsWithDifferentProvider() throws Exception {
        OAuth2ProviderConflictException conflict = new OAuth2ProviderConflictException(
                "Email is already registered with a different authentication provider",
                AuthProvider.LOCAL,
                AuthProvider.AUTH0
        );
        when(authService.loginWithProvider(any(), any())).thenThrow(conflict);

        DefaultOAuth2User principal = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                Map.of("email", "conflict@healthcore.com"),
                "email"
        );
        OAuth2AuthenticationToken authentication = new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "auth0");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onAuthenticationSuccess(request, response, authentication);

        assertThat(response.getRedirectedUrl()).contains("error=OAUTH2_PROVIDER_CONFLICT");
        assertThat(response.getRedirectedUrl()).contains("existingProvider=LOCAL");
        assertThat(response.getRedirectedUrl()).contains("requestedProvider=AUTH0");
    }
}

