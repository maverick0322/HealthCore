package com.healthcore.clinical.infrastructure.rest.exception;

import com.healthcore.clinical.domain.exception.AgendaServiceUnavailableException;
import com.healthcore.clinical.domain.exception.AlreadyLinkedToNutritionistException;
import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void shouldReturnValidationErrorsGroupedByField() {
        MethodArgumentNotValidException exception = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        when(exception.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(
                new FieldError("request", "weightKg", 20.0, false, null, null, "Weight must be at least 40.0 kg."),
                new FieldError("request", "weightKg", 20.0, false, null, null, "Weight must use at most one decimal place."),
                new FieldError("request", "heightCm", 90.0, false, null, null, "Height must be between 100 cm and 250 cm.")
        ));

        ResponseEntity<Map<String, Object>> response = handler.handleValidationException(exception);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Validation Error", response.getBody().get("error"));
        assertInstanceOf(Map.class, response.getBody().get("errors"));
        Map<?, ?> errors = (Map<?, ?>) response.getBody().get("errors");
        assertTrue(errors.get("weightKg").toString().contains(";"));
        assertEquals("Height must be between 100 cm and 250 cm.", errors.get("heightCm"));
    }

    @Test
    void shouldReturnNotFoundWhenProfileIsMissing() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleProfileNotFound(new ProfileNotFoundException("Patient profile not found."));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Not Found", response.getBody().get("error"));
        assertEquals("Patient profile not found.", response.getBody().get("message"));
    }

    @Test
    void shouldReturnBadRequestForIllegalArgument() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleIllegalArgument(new IllegalArgumentException("Height must be between 100 cm and 250 cm."));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Bad Request", response.getBody().get("error"));
    }

    @Test
    void shouldReturnConflictForIllegalState() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleIllegalState(new IllegalStateException("At least one weight record must remain in the profile."));

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Conflict", response.getBody().get("error"));
    }

    @Test
    void shouldReturnConflictWhenPatientIsAlreadyLinked() {
        AlreadyLinkedToNutritionistException exception =
                new AlreadyLinkedToNutritionistException("Already linked.", "nutri-999");

        ResponseEntity<Map<String, Object>> response = handler.handleAlreadyLinked(exception);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Already Linked", response.getBody().get("error"));
        assertEquals("nutri-999", response.getBody().get("currentNutritionistId"));
    }

    @Test
    void shouldReturnForbiddenForAccessDenied() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleAccessDenied(new AccessDeniedException("Action denied."));

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("Forbidden", response.getBody().get("error"));
    }

    @Test
    void shouldReturnServiceUnavailableWhenAgendaIsDown() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleAgendaUnavailable(
                        new AgendaServiceUnavailableException("Agenda unavailable.", new IllegalStateException("timeout"))
                );

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertEquals("Service Unavailable", response.getBody().get("error"));
    }

    @Test
    void shouldReturnInternalServerErrorForUnexpectedException() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleGenericException(new RuntimeException("Unexpected error."));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("Internal Server Error", response.getBody().get("error"));
        assertEquals("RuntimeException", response.getBody().get("exceptionType"));
    }
}
