package com.healthcore.media.interfaces.rest;

import com.healthcore.media.application.dto.UploadMediaRequest;
import com.healthcore.media.application.dto.UploadMediaResponse;
import com.healthcore.media.application.usecase.GenerateUploadUrlUseCase;
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

/**
 * REST endpoint for delegated media files generation
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final GenerateUploadUrlUseCase generateUploadUrlUseCase;

    @PostMapping("/upload-request")
    public ResponseEntity<UploadMediaResponse> requestUploadUrl(
            @Valid @RequestBody UploadMediaRequest request,
            @AuthenticationPrincipal String userId) {

        log.warn("Solicitud de URL firmada recibida. UserID: {}", userId);

        UploadMediaResponse response = generateUploadUrlUseCase.execute(userId, request.fileName());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}