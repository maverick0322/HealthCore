package com.healthcore.identity.infrastructure.security;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    @NotBlank(message = "jwt.secret must be configured")
    private String secret;

    @Min(value = 1, message = "jwt.access-token-validity must be greater than 0")
    private long accessTokenValidity;

    @Min(value = 1, message = "jwt.refresh-token-validity must be greater than 0")
    private long refreshTokenValidity;
}
