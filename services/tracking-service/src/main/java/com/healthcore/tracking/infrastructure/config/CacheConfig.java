package com.healthcore.tracking.infrastructure.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Global Cache Configuration.
 * Isolated here so that sliced tests (like @WebMvcTest) don't attempt to load Redis.
 */
@Configuration
@EnableCaching
public class CacheConfig {
        // No explicit Redis configuration needed here since Spring Boot configures it based on properties.
        // This class serves as a marker to enable caching and can be extended in the future if needed.
}