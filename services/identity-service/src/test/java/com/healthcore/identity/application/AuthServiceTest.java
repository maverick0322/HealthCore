package com.healthcore.identity.application;

import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.Role;
import com.healthcore.identity.domain.User;
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

import java.time.LocalDateTime;
import java.util.Optional;

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

    @InjectMocks
    private AuthService authService;

    @Test
    void should_ThrowConflictException_When_EmailAlreadyExistsDuringRegistration() {
        // Arrange
        String email = "existing@healthcore.com";
        String password = "password123";
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(User.builder().build()));

        // Act & Assert
        assertThatThrownBy(() -> authService.registerPatient(email, password))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Email is already registered in HealthCore");
    }

    @Test
    void should_ReturnSavedUser_When_RegistrationIsSuccessful() {
        // Arrange
        String email = "new@healthcore.com";
        String rawPassword = "password123";
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
                .createdAt(LocalDateTime.now())
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
        String rawPassword = "password123";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(rawPassword)).thenReturn("encodedPassword123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = authService.registerLocalUser(email, rawPassword, Role.NUTRITIONIST);

        assertThat(result.getRole()).isEqualTo(Role.NUTRITIONIST);
        assertThat(result.getProvider()).isEqualTo(AuthProvider.LOCAL);
    }

    @Test
    void should_RejectAdminSelfRegistration() {
        assertThatThrownBy(() -> authService.registerLocalUser("admin@healthcore.com", "password123", Role.ADMIN))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Self-registration with ADMIN role is not allowed");
    }

    @Test
    void should_CreateAdminUser_When_ProvisionedByAdmin() {
        String email = "new.admin@healthcore.com";
        String rawPassword = "password123";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(rawPassword)).thenReturn("encodedPassword123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = authService.createUserByAdmin(email, rawPassword, Role.ADMIN);

        assertThat(result.getRole()).isEqualTo(Role.ADMIN);
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
        String wrongPassword = "wrongPassword";
        User existingUser = User.builder()
                .email(email)
                .passwordHash("correctHashedPassword")
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
        String rawPassword = "correctPassword";
        User existingUser = User.builder()
                .email(email)
                .passwordHash("hashedPassword")
                .role(Role.PATIENT)
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

        assertThatThrownBy(() -> authService.login(email, "password123"))
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
}