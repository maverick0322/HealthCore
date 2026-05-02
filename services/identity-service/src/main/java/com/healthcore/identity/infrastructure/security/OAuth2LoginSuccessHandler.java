package com.healthcore.identity.infrastructure.security;

import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.exception.OAuth2ProviderConflictException;
import com.healthcore.identity.domain.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;

    @Value("${app.oauth2.success-redirect-url:https://localhost:5173/oauth2/callback}")
    private String redirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {
        try {
            if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
                throw new UnauthorizedException("Invalid OAuth2 authentication context");
            }

            OAuth2User oauth2User = oauthToken.getPrincipal();
            String registrationId = oauthToken.getAuthorizedClientRegistrationId();
            String email = extractEmail(oauth2User);
            AuthProvider provider = AuthProvider.fromRegistrationId(registrationId);

            AuthService.AuthTokens tokens = authService.loginWithProvider(email, provider);

            String finalUrl = org.springframework.web.util.UriComponentsBuilder.fromUriString(redirectUrl)
                    .queryParam("accessToken", tokens.accessToken())
                    .queryParam("refreshToken", tokens.refreshToken())
                    .build().toUriString();

            log.info("OAuth2 login completed for provider: {} and email: {}", provider, email);
            response.sendRedirect(finalUrl);
        } catch (OAuth2ProviderConflictException ex) {
            log.warn("OAuth2 login conflict: {}", ex.getMessage());
            writeErrorRedirect(response, "OAUTH2_PROVIDER_CONFLICT", ex.getMessage(), ex.getExistingProvider().name(), ex.getRequestedProvider().name());
        } catch (UnauthorizedException ex) {
            log.warn("OAuth2 login rejected: {}", ex.getMessage());
            writeErrorRedirect(response, "UNAUTHORIZED", ex.getMessage());
        } catch (Exception ex) {
            log.error("Unexpected OAuth2 success-handler error", ex);
            writeErrorRedirect(response, "INTERNAL_ERROR", "Authentication processing failed");
        }
    }

    private String extractEmail(OAuth2User oauth2User) {
        Object emailValue = oauth2User.getAttributes().get("email");

        if (emailValue == null) {
            throw new UnauthorizedException("OAuth2 provider did not return a valid email");
        }

        String email = String.valueOf(emailValue).trim();
        if (email.isEmpty()) {
            throw new UnauthorizedException("OAuth2 provider did not return a valid email");
        }

        return email;
    }

    private void writeErrorRedirect(HttpServletResponse response, String code, String message) throws IOException {
        String finalUrl = org.springframework.web.util.UriComponentsBuilder.fromUriString(redirectUrl)
                .queryParam("error", code)
                .queryParam("message", message)
                .build().toUriString();
        response.sendRedirect(finalUrl);
    }

    private void writeErrorRedirect(HttpServletResponse response, String code, String message, String existingProvider, String requestedProvider) throws IOException {
        String finalUrl = org.springframework.web.util.UriComponentsBuilder.fromUriString(redirectUrl)
                .queryParam("error", code)
                .queryParam("message", message)
                .queryParam("existingProvider", existingProvider)
                .queryParam("requestedProvider", requestedProvider)
                .build().toUriString();
        response.sendRedirect(finalUrl);
    }
}
