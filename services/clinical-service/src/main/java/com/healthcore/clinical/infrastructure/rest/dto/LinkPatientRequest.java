package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.constraints.NotBlank;

public class LinkPatientRequest {
    @NotBlank(message = "El código de vinculación es requerido.")
    private String code;

    public LinkPatientRequest() {}
    public LinkPatientRequest(String code) { this.code = code; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}