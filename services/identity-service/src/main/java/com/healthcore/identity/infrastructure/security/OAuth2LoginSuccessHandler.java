package com.healthcore.identity.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.exception.UnauthorizedException;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final ObjectMapper objectMapper;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
            throw new UnauthorizedException("Invalid OAuth2 authentication context");
        }

        OAuth2User oauth2User = oauthToken.getPrincipal();
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();
        String email = extractEmail(oauth2User, registrationId);
        AuthProvider provider = AuthProvider.fromRegistrationId(registrationId);

        Map<String, String> tokens = authService.loginWithProvider(email, provider);

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), tokens);

        log.info("OAuth2 login completed for provider: {} and email: {}", provider, email);
    }

    private String extractEmail(OAuth2User oauth2User, String registrationId) {
        Object emailValue = oauth2User.getAttributes().get("email");

        if (emailValue == null && "facebook".equalsIgnoreCase(registrationId)) {
            // Facebook may not return email when permission was not granted.
            throw new UnauthorizedException("Facebook account email is required for login");
        }

        if (emailValue == null) {
            throw new UnauthorizedException("OAuth2 provider did not return a valid email");
        }

        String email = String.valueOf(emailValue).trim();
        if (email.isEmpty()) {
            throw new UnauthorizedException("OAuth2 provider did not return a valid email");
        }

        return email;
    }
}

