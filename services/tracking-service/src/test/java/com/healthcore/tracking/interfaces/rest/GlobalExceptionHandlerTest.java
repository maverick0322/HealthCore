package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.domain.exception.ExternalCatalogUnavailableException;
import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.exception.ResourceNotFoundException;
import com.healthcore.tracking.domain.exception.TrackingDomainException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void handleNotFoundException_Returns404() {
        // Arrange
        String errorMessage = "El alimento no fue encontrado en la base de datos.";
        ResourceNotFoundException ex = new ResourceNotFoundException(errorMessage);

        // Act
        ResponseEntity<GlobalExceptionHandler.ApiErrorResponse> response = exceptionHandler.handleNotFoundException(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(404);
        assertThat(response.getBody().error()).isEqualTo("Not Found");
        assertThat(response.getBody().message()).isEqualTo(errorMessage);
        assertThat(response.getBody().timestamp()).isNotNull();
    }

    @Test
    void handleInvalidDomainDataException_Returns400() {
        // Arrange
        String errorMessage = "Los mililitros de agua no pueden ser negativos.";
        InvalidDomainDataException ex = new InvalidDomainDataException(errorMessage);

        // Act
        ResponseEntity<GlobalExceptionHandler.ApiErrorResponse> response = exceptionHandler.handleInvalidDomainDataException(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(400);
        assertThat(response.getBody().error()).isEqualTo("Bad Request");
        assertThat(response.getBody().message()).isEqualTo(errorMessage);
        assertThat(response.getBody().timestamp()).isNotNull();
    }

    @Test
    void handleServiceUnavailableException_Returns503() {
        // Arrange
        String errorMessage = "El catálogo externo (FatSecret) no responde.";
        ExternalCatalogUnavailableException ex = new ExternalCatalogUnavailableException(errorMessage);

        // Act
        ResponseEntity<GlobalExceptionHandler.ApiErrorResponse> response = exceptionHandler.handleServiceUnavailableException(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(503);
        assertThat(response.getBody().error()).isEqualTo("Service Unavailable");
        assertThat(response.getBody().message()).isEqualTo(errorMessage);
        assertThat(response.getBody().timestamp()).isNotNull();
    }

    @Test
    void handleGenericDomainException_Returns422() {
        // Arrange
        String errorMessage = "Regla de negocio genérica violada.";
        TrackingDomainException ex = new TrackingDomainException(errorMessage) {}; // Anónimo porque asumo que es abstracta o clase base

        // Act
        ResponseEntity<GlobalExceptionHandler.ApiErrorResponse> response = exceptionHandler.handleGenericDomainException(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(422);
        assertThat(response.getBody().error()).isEqualTo("Unprocessable Entity");
        assertThat(response.getBody().message()).isEqualTo(errorMessage);
        assertThat(response.getBody().timestamp()).isNotNull();
    }

    @Test
    void handleGeneralError_Returns500AndHidesInternalMessage() {
        // Arrange
        Exception ex = new NullPointerException("Null reference at line 42 in DatabaseAdapter");

        // Act
        ResponseEntity<GlobalExceptionHandler.ApiErrorResponse> response = exceptionHandler.handleGeneralError(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(500);
        assertThat(response.getBody().error()).isEqualTo("Internal Server Error");

        assertThat(response.getBody().message()).doesNotContain("Null reference");
        assertThat(response.getBody().message()).isEqualTo("An unexpected internal error occurred in the Tracking Service. Please try again later.");
        assertThat(response.getBody().timestamp()).isNotNull();
    }
}