package com.healthcore.identity.application;

import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.PasswordResetCode;
import com.healthcore.identity.domain.RefreshTokenOwnership;
import com.healthcore.identity.domain.Role;
import com.healthcore.identity.domain.User;
import com.healthcore.identity.domain.VerificationCode;
import com.healthcore.identity.domain.exception.BadRequestException;
import com.healthcore.identity.domain.exception.ConflictException;
import com.healthcore.identity.domain.exception.TooManyRequestsException;
import com.healthcore.identity.domain.exception.UnauthorizedException;
import com.healthcore.identity.domain.repository.PasswordResetCodeRepository;
import com.healthcore.identity.domain.repository.RefreshTokenRepository;
import com.healthcore.identity.domain.repository.UserRepository;
import com.healthcore.identity.domain.repository.VerificationCodeRepository;
import com.healthcore.identity.infrastructure.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private VerificationCodeRepository verificationCodeRepository;

    @Mock
    private PasswordResetCodeRepository passwordResetCodeRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private LoginAttemptService loginAttemptService;

    @Mock
    private ActiveUserMetricsTracker activeUserMetricsTracker;

    @Mock
    private com.healthcore.identity.application.ports.IdentityEventPublisher identityEventPublisher;

    @InjectMocks
    private AuthService authService;

    @Test
    void should_ThrowConflictException_When_EmailAlreadyExistsDuringRegistration() {
        // Arrange
        String email = "existing@healthcore.com";
        String password = "StrongPass123!";
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(User.builder().build()));

        // Act & Assert
        assertThatThrownBy(() -> authService.registerPatient(email, password))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Email is already registered in HealthCore");
    }

    @Test
    void should_RejectWeakPassword_When_Registering() {
        assertThatThrownBy(() -> authService.registerPatient("weak@healthcore.com", "weakpass"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Password does not meet complexity requirements");
    }

    @Test
    void should_ReturnSavedUser_When_RegistrationIsSuccessful() {
        // Arrange
        String email = "new@healthcore.com";
        String rawPassword = "StrongPass123!";
        String encodedPassword = "encodedPassword123";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(rawPassword)).thenReturn(encodedPassword);

        User expectedSavedUser = User.builder()
                .id("12345")
                .email(email)
                .passwordHash(encodedPassword)
                .role(Role.PATIENT)
                .provider(AuthProvider.LOCAL)
                .enabled(true)
                .createdAt(Instant.now())
                .build();

        when(userRepository.save(any(User.class))).thenReturn(expectedSavedUser);

        // Act
        User result = authService.registerPatient(email, rawPassword);

        // Assert
        assertThat(result.getId()).isEqualTo("12345");
        assertThat(result.getEmail()).isEqualTo(email);
        assertThat(result.getRole()).isEqualTo(Role.PATIENT);
        assertThat(result.getProvider()).isEqualTo(AuthProvider.LOCAL);
        assertThat(result.isEnabled()).isTrue();

        verify(userRepository).save(any(User.class));
    }

    @Test
    void should_RegisterNutritionist_When_RoleIsNutritionist() {
        String email = "nutritionist@healthcore.com";
        String rawPassword = "StrongPass123!";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(rawPassword)).thenReturn("encodedPassword123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = authService.registerLocalUser(email, rawPassword, Role.NUTRITIONIST, null);

        assertThat(result.getRole()).isEqualTo(Role.NUTRITIONIST);
        assertThat(result.getProvider()).isEqualTo(AuthProvider.LOCAL);
    }

    @Test
    void should_RejectAdminSelfRegistration() {
        assertThatThrownBy(() -> authService.registerLocalUser("admin@healthcore.com", "StrongPass123!", Role.ADMIN, null))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Self-registration with ADMIN role is not allowed");
    }

    @Test
    void should_RejectAdminCreation_When_ProvisionedByAdmin() {
        String email = "new.admin@healthcore.com";
        String rawPassword = "StrongPass123!";

        assertThatThrownBy(() -> authService.createUserByAdmin(email, rawPassword, Role.ADMIN, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Admins cannot create other administrators");
    }

    @Test
    void should_CreateUser_When_ProvisionedByAdmin() {
        String email = "new.nutri@healthcore.com";
        String rawPassword = "StrongPass123!";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(rawPassword)).thenReturn("encodedPassword123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = authService.createUserByAdmin(email, rawPassword, Role.NUTRITIONIST, null);

        assertThat(result.getRole()).isEqualTo(Role.NUTRITIONIST);
        assertThat(result.getProvider()).isEqualTo(AuthProvider.LOCAL);
    }

    @Test
    void should_ThrowUnauthorizedException_When_EmailNotFoundDuringLogin() {
        // Arrange
        String email = "ghost@healthcore.com";
        when(loginAttemptService.isBlocked(email)).thenReturn(false);
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> authService.login(email, "anyPassword"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid credentials");
    }

    @Test
    void should_ThrowUnauthorizedException_When_PasswordMismatchDuringLogin() {
        // Arrange
        String email = "patient@healthcore.com";
        String wrongPassword = "WrongPass123!";
        User existingUser = User.builder()
                .email(email)
                .passwordHash("correctHashedPassword")
                .enabled(true)
                .build();

        when(loginAttemptService.isBlocked(email)).thenReturn(false);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches(wrongPassword, existingUser.getPasswordHash())).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> authService.login(email, wrongPassword))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid credentials");
    }

    @Test
    void should_ReturnTokens_When_LoginCredentialsAreCorrect() {
        // Arrange
        String email = "patient@healthcore.com";
        String rawPassword = "StrongPass123!";
        User existingUser = User.builder()
                .email(email)
                .passwordHash("hashedPassword")
                .role(Role.PATIENT)
                .enabled(true)
                .build();

        when(loginAttemptService.isBlocked(email)).thenReturn(false);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches(rawPassword, existingUser.getPasswordHash())).thenReturn(true);
        when(jwtUtil.generateAccessToken(email, Role.PATIENT.name())).thenReturn("mockedAccessToken");
        when(jwtUtil.generateRefreshToken(email)).thenReturn("mockedRefreshToken");

        // Act
        AuthService.AuthTokens result = authService.login(email, rawPassword);

        // Assert
        assertThat(result.accessToken()).isEqualTo("mockedAccessToken");
        assertThat(result.refreshToken()).isEqualTo("mockedRefreshToken");
        assertThat(result.tokenType()).isEqualTo("Bearer");
        verify(loginAttemptService).recordSuccessfulAttempt(email);
    }

    @Test
    void should_ThrowTooManyRequests_When_LoginIsBlocked() {
        String email = "blocked@healthcore.com";
        when(loginAttemptService.isBlocked(email)).thenReturn(true);

        assertThatThrownBy(() -> authService.login(email, "StrongPass123!"))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessage("Too many failed login attempts. Please try again later.");
    }

    @Test
    void should_ProvisionSocialUser_And_ReturnTokens_When_FirstOAuth2Login() {
        // Arrange
        String email = "social@healthcore.com";

        User savedUser = User.builder()
                .id("oauth-1")
                .email(email)
                .role(Role.PATIENT)
                .provider(AuthProvider.AUTH0)
                .enabled(true)
                .emailVerified(true)
                .build();

        when(userRepository.findByEmailAndProvider(email, AuthProvider.AUTH0)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtil.generateAccessToken(email, Role.PATIENT.name())).thenReturn("social-access");
        when(jwtUtil.generateRefreshToken(email)).thenReturn("social-refresh");

        // Act
        AuthService.AuthTokens result = authService.loginWithProvider(email, AuthProvider.AUTH0);

        // Assert
        assertThat(result.accessToken()).isEqualTo("social-access");
        assertThat(result.refreshToken()).isEqualTo("social-refresh");
        assertThat(result.tokenType()).isEqualTo("Bearer");
    }

    @Test
    void should_ThrowConflict_When_EmailAlreadyExistsWithDifferentProvider_DuringOAuth2Login() {
        // Arrange
        String email = "existing@healthcore.com";
        User localUser = User.builder()
                .email(email)
                .provider(AuthProvider.LOCAL)
                .build();

        when(userRepository.findByEmailAndProvider(email, AuthProvider.AUTH0)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(localUser));

        // Act & Assert
        assertThatThrownBy(() -> authService.loginWithProvider(email, AuthProvider.AUTH0))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Email is already registered with a different authentication provider");
    }

    @Test
    void should_ThrowException_When_LogoutWithDuplicateTokens() {
        String refreshToken = "refresh-token-123";
        when(refreshTokenRepository.findByTokenHash(any()))
                .thenThrow(new org.springframework.dao.IncorrectResultSizeDataAccessException(1, 2));

        assertThatThrownBy(() -> authService.logout(refreshToken))
                .isInstanceOf(org.springframework.dao.IncorrectResultSizeDataAccessException.class);
    }

    @Test
    void should_ThrowUnauthorized_When_RefreshTokenIsRevoked() {
        String refreshToken = "refresh-token-123";
        RefreshTokenOwnership revoked = RefreshTokenOwnership.builder()
                .tokenHash("hash")
                .revoked(true)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();

        when(jwtUtil.extractEmail(refreshToken)).thenReturn("user@healthcore.com");
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> authService.refresh(refreshToken))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid refresh token");
    }

    @Test
    void should_ThrowUnauthorized_When_RefreshTokenIsExpired() {
        String refreshToken = "refresh-token-123";
        RefreshTokenOwnership expired = RefreshTokenOwnership.builder()
                .tokenHash("hash")
                .revoked(false)
                .expiresAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();

        when(jwtUtil.extractEmail(refreshToken)).thenReturn("user@healthcore.com");
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> authService.refresh(refreshToken))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid refresh token");
    }

    @Test
    void should_ThrowUnauthorized_When_RefreshTokenCannotBeRevoked() {
        String refreshToken = "refresh-token-123";
        RefreshTokenOwnership active = RefreshTokenOwnership.builder()
                .tokenHash("hash")
                .revoked(false)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .build();

        when(jwtUtil.extractEmail(refreshToken)).thenReturn("user@healthcore.com");
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(active));
        when(userRepository.findByEmail("user@healthcore.com")).thenReturn(Optional.of(User.builder().email("user@healthcore.com").role(Role.PATIENT).enabled(true).build()));
        when(jwtUtil.generateAccessToken(any(), any())).thenReturn("access");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");
        when(refreshTokenRepository.revokeIfActive(any(), any())).thenReturn(false);

        assertThatThrownBy(() -> authService.refresh(refreshToken))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid refresh token");
    }

    @Test
    void should_ThrowUnauthorized_When_VerificationCodeIsExpired() {
        VerificationCode expiredCode = VerificationCode.builder()
                .email("patient@healthcore.com")
                .codeHash("hash")
                .expiresAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();

        when(verificationCodeRepository.findByEmailAndCodeHash(any(), any())).thenReturn(Optional.of(expiredCode));

        assertThatThrownBy(() -> authService.verifyCode("patient@healthcore.com", "123456"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid or expired verification code");
    }

    @Test
    void should_DoNothing_When_PasswordResetRequestedForUnknownEmail() {
        when(userRepository.findByEmailAndProvider(any(), any())).thenReturn(Optional.empty());

        authService.requestPasswordReset("unknown@healthcore.com", null);

        verify(passwordResetCodeRepository, org.mockito.Mockito.never()).save(any(PasswordResetCode.class));
    }

    @Test
    void should_ResetPassword_When_CodeIsValid() {
        String email = "patient@healthcore.com";
        String code = "123456";
        PasswordResetCode stored = PasswordResetCode.builder()
                .email(email)
                .codeHash("hash")
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .build();
        User user = User.builder().email(email).provider(AuthProvider.LOCAL).build();

        when(passwordResetCodeRepository.findByEmailAndCodeHash(any(), any())).thenReturn(Optional.of(stored));
        when(userRepository.findByEmailAndProvider(email, AuthProvider.LOCAL)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(any())).thenReturn("encoded");

        authService.resetPassword(email, code, "StrongPass123!", null);

        verify(userRepository).save(any(User.class));
        verify(passwordResetCodeRepository).deleteByEmail(email);
    }

    @Test
    void should_AllowOnlyOneRefresh_When_ConcurrentRequests() throws Exception {
        String refreshToken = "refresh-token-123";
        RefreshTokenOwnership active = RefreshTokenOwnership.builder()
                .tokenHash("hash")
                .revoked(false)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .build();

        when(jwtUtil.extractEmail(refreshToken)).thenReturn("user@healthcore.com");
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(active));
        when(userRepository.findByEmail("user@healthcore.com")).thenReturn(Optional.of(User.builder().email("user@healthcore.com").role(Role.PATIENT).enabled(true).build()));

        AtomicInteger tokenCounter = new AtomicInteger();
        when(jwtUtil.generateAccessToken(any(), any())).thenAnswer(invocation -> "access-" + tokenCounter.incrementAndGet());
        when(jwtUtil.generateRefreshToken(any())).thenAnswer(invocation -> "refresh-" + tokenCounter.incrementAndGet());

        AtomicBoolean first = new AtomicBoolean(true);
        when(refreshTokenRepository.revokeIfActive(any(), any())).thenAnswer(invocation -> first.getAndSet(false));

        CountDownLatch latch = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);

        CompletableFuture<Boolean> firstCall = CompletableFuture.supplyAsync(() -> {
            try {
                latch.await(2, TimeUnit.SECONDS);
                authService.refresh(refreshToken);
                return true;
            } catch (Exception ex) {
                return false;
            }
        }, executor);

        CompletableFuture<Boolean> secondCall = CompletableFuture.supplyAsync(() -> {
            try {
                latch.await(2, TimeUnit.SECONDS);
                authService.refresh(refreshToken);
                return true;
            } catch (Exception ex) {
                return false;
            }
        }, executor);

        latch.countDown();

        boolean firstResult = firstCall.get(2, TimeUnit.SECONDS);
        boolean secondResult = secondCall.get(2, TimeUnit.SECONDS);
        executor.shutdownNow();

        assertThat(firstResult ^ secondResult).isTrue();
    }
}
