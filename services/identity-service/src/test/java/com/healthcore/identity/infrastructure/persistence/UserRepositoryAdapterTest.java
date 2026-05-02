package com.healthcore.identity.infrastructure.persistence;

import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.Role;
import com.healthcore.identity.domain.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserRepositoryAdapterTest {

    @Mock
    private SpringDataMongoUserRepository mongoRepository;

    @InjectMocks
    private UserRepositoryAdapter adapter;

    @Test
    void should_MapDocumentToDomain_When_FindingByEmail() {
        UserDocument document = UserDocument.builder()
                .id("id-1")
                .email("user@healthcore.com")
                .passwordHash("hash")
                .role(Role.PATIENT)
                .provider(AuthProvider.LOCAL)
                .emailVerified(true)
                .verifiedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .enabled(true)
                .createdAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .build();

        when(mongoRepository.findByEmail("user@healthcore.com")).thenReturn(Optional.of(document));

        User result = adapter.findByEmail("user@healthcore.com").orElseThrow();

        assertThat(result.getId()).isEqualTo("id-1");
        assertThat(result.getEmail()).isEqualTo("user@healthcore.com");
        assertThat(result.getRole()).isEqualTo(Role.PATIENT);
        assertThat(result.getProvider()).isEqualTo(AuthProvider.LOCAL);
        assertThat(result.isEmailVerified()).isTrue();
        assertThat(result.isEnabled()).isTrue();
    }

    @Test
    void should_MapDomainToDocument_When_Saving() {
        User user = User.builder()
                .id("id-2")
                .email("save@healthcore.com")
                .passwordHash("hash")
                .role(Role.NUTRITIONIST)
                .provider(AuthProvider.LOCAL)
                .emailVerified(false)
                .enabled(true)
                .createdAt(Instant.now())
                .build();

        UserDocument saved = UserDocument.builder()
                .id("id-2")
                .email("save@healthcore.com")
                .passwordHash("hash")
                .role(Role.NUTRITIONIST)
                .provider(AuthProvider.LOCAL)
                .emailVerified(false)
                .enabled(true)
                .createdAt(user.getCreatedAt())
                .build();

        when(mongoRepository.save(any(UserDocument.class))).thenReturn(saved);

        User result = adapter.save(user);

        assertThat(result.getId()).isEqualTo("id-2");
        assertThat(result.getEmail()).isEqualTo("save@healthcore.com");
        assertThat(result.getRole()).isEqualTo(Role.NUTRITIONIST);
    }
}
