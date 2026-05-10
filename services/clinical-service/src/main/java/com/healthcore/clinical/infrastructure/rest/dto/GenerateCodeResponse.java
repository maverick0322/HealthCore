package com.healthcore.clinical.infrastructure.rest.dto;

public class GenerateCodeResponse {
    private String code;
    private long expiresInSeconds; 

    public GenerateCodeResponse(String code, long expiresInSeconds) {
        this.code = code;
        this.expiresInSeconds = expiresInSeconds;
    }

    public String getCode() { return code; }
    public long getExpiresInSeconds() { return expiresInSeconds; }
}