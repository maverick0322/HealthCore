package com.healthcore.identity;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.infrastructure.persistence.SpringDataMongoPasswordResetCodeRepository;
import com.healthcore.identity.infrastructure.persistence.SpringDataMongoRefreshTokenRepository;
import com.healthcore.identity.infrastructure.persistence.SpringDataMongoUserRepository;
import com.healthcore.identity.infrastructure.persistence.SpringDataMongoVerificationCodeRepository;
import com.healthcore.identity.infrastructure.persistence.UserRepositoryAdapter;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("context")
class IdentityServiceApplicationTests {

	@Autowired
	private AuthService authService;

	@Autowired
	private UserRepositoryAdapter userRepositoryAdapter;

	@Autowired
	private SecurityFilterChain securityFilterChain;

	@MockitoBean
	private SpringDataMongoUserRepository springDataMongoUserRepository;

	@MockitoBean
	private SpringDataMongoVerificationCodeRepository springDataMongoVerificationCodeRepository;

	@MockitoBean
	private SpringDataMongoPasswordResetCodeRepository springDataMongoPasswordResetCodeRepository;

	@MockitoBean
	private SpringDataMongoRefreshTokenRepository springDataMongoRefreshTokenRepository;

	@Test
	void contextLoads() {
		assertThat(authService).isNotNull();
		assertThat(userRepositoryAdapter).isNotNull();
		assertThat(securityFilterChain).isNotNull();
	}

}
