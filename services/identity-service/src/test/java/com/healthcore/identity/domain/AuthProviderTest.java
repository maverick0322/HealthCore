package com.healthcore.identity.domain;

import com.healthcore.identity.domain.exception.UnauthorizedException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthProviderTest {

    @Test
    void should_ReturnAuth0_When_RegistrationIdIsAuth0() {
        assertThat(AuthProvider.fromRegistrationId("auth0")).isEqualTo(AuthProvider.AUTH0);
        assertThat(AuthProvider.fromRegistrationId("AUTH0")).isEqualTo(AuthProvider.AUTH0);
    }

    @Test
    void should_ThrowUnauthorizedException_When_RegistrationIdIsUnsupported() {
        assertThatThrownBy(() -> AuthProvider.fromRegistrationId("google"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Unsupported OAuth2 provider");
    }
}

