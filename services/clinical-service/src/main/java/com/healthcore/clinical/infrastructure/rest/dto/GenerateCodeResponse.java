package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "GenerateCodeResponse", description = "Response returned when a linking code is generated or queried.")
public class GenerateCodeResponse {
    @Schema(description = "Temporary linking code", example = "AB12CD")
    private String code;
    @Schema(description = "Seconds remaining before the linking code expires", example = "900")
    private long expiresInSeconds; 

    public GenerateCodeResponse(String code, long expiresInSeconds) {
        this.code = code;
        this.expiresInSeconds = expiresInSeconds;
    }

    public String getCode() { return code; }
    public long getExpiresInSeconds() { return expiresInSeconds; }
}
