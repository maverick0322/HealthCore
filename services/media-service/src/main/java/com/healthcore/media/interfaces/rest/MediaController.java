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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

/**
 * REST endpoint for delegated media file management.
 * Includes rate limiting protection to prevent storage API billing abuse.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@Tag(name = "Media Management", description = "Endpoints para la gestión delegada de archivos multimedia")
public class MediaController {

    private final GenerateUploadUrlUseCase generateUploadUrlUseCase;
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    @Operation(
            summary = "Solicitar URL firmada de subida",
            description = "Genera una URL criptográfica de un solo uso para que el cliente (Frontend) suba el archivo directamente a Cloudflare R2. Limitado a 3 peticiones por minuto por usuario."
    )
    @SecurityRequirement(name = "Bearer Authentication")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "URL firmada generada exitosamente"),
            @ApiResponse(responseCode = "400", description = "El nombre del archivo es inválido o contiene caracteres maliciosos"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente, inválido o expirado"),
            @ApiResponse(responseCode = "429", description = "Se excedió la cuota de peticiones (Rate Limit)"),
            @ApiResponse(responseCode = "422", description = "Error de comunicación con Cloudflare S3")
    })
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
     * @return A Bucket instance configured for this user.
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