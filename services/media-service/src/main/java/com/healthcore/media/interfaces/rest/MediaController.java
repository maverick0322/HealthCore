package com.healthcore.media.interfaces.rest;

import com.healthcore.media.application.dto.UploadMediaRequest;
import com.healthcore.media.application.dto.UploadMediaResponse;
import com.healthcore.media.application.usecase.GenerateUploadUrlUseCase;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * REST endpoint for delegated media file management.
 * Includes rate limiting protection to prevent storage API billing abuse.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final GenerateUploadUrlUseCase generateUploadUrlUseCase;

    // In-memory cache to track rate limits per user.
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    @PostMapping("/upload-request")
    public ResponseEntity<UploadMediaResponse> requestUploadUrl(
            @Valid @RequestBody UploadMediaRequest request,
            @AuthenticationPrincipal String userId) {

        if (userId == null || userId.isBlank()) {
            log.error("Security alert: Attempted to access media endpoint without a valid principal.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("Incoming signed URL request. UserID: {}", userId);
        Bucket bucket = resolveBucket(userId);

        if (!bucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for UserID: {}. Rejecting request to prevent billing abuse.", userId);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

        UploadMediaResponse response = generateUploadUrlUseCase.execute(userId, request.fileName());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Resolves the rate limit bucket for a specific user.
     * Grants 3 requests per minute. Refills 3 tokens every 1 minute.
     * * @param userId The unique identifier of the authenticated user.
     * @return A Bucket4j instance configured for this user.
     */
    private Bucket resolveBucket(String userId) {
        return cache.computeIfAbsent(userId, this::createNewBucket);
    }

    private Bucket createNewBucket(String key) {
        Bandwidth limit = Bandwidth.classic(3, Refill.greedy(3, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}