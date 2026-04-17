package com.healthcore.identity.infrastructure.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Slf4j
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/v1/auth/**"
    };

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
            ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider) throws Exception {
        log.info("Initializing SecurityFilterChain for Identity Service...");

        http
                // CSRF is disabled because we use stateless JWT authentication instead of session cookies
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .anyRequest().authenticated()
                );

        if (clientRegistrationRepositoryProvider.getIfAvailable() != null) {
            http.oauth2Login(oauth2 -> oauth2
                    .successHandler(oAuth2LoginSuccessHandler)
            );
            log.info("OAuth2 login integration enabled for configured providers");
        } else {
            log.info("OAuth2 login integration disabled (no client registrations configured)");
        }

        log.debug("SecurityFilterChain configured successfully with {} public endpoints", PUBLIC_ENDPOINTS.length);

        return http.build();
    }
}