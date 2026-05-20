package com.healthcore.agenda_service.api;

import com.healthcore.agenda_service.domain.exception.BadRequestException;
import com.healthcore.agenda_service.domain.exception.ClinicalServiceUnavailableException;
import com.healthcore.agenda_service.domain.exception.ConflictException;
import com.healthcore.agenda_service.domain.exception.ForbiddenOperationException;
import com.healthcore.agenda_service.domain.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Unit tests for {@link ApiExceptionHandler}.
 * Each exception type must map to the correct error code.
 */
class ApiExceptionHandlerTest {

    private ApiExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new ApiExceptionHandler();
    }

    @Test
    void handleNotFound_shouldReturnNotFoundCode() {
        Map<String, Object> body = handler.handleNotFound(new NotFoundException("Resource missing"));

        assertThat(body.get("code")).isEqualTo("NOT_FOUND");
        assertThat(body.get("message")).isEqualTo("Resource missing");
        assertThat(body).containsKey("timestamp");
    }

    @Test
    void handleForbidden_shouldReturnForbiddenCode() {
        Map<String, Object> body = handler.handleForbidden(new ForbiddenOperationException("Access denied"));

        assertThat(body.get("code")).isEqualTo("FORBIDDEN");
        assertThat(body.get("message")).isEqualTo("Access denied");
    }

    @Test
    void handleConflict_shouldReturnConflictCode_forConflictException() {
        Map<String, Object> body = handler.handleConflict(new ConflictException("Slot taken"));

        assertThat(body.get("code")).isEqualTo("CONFLICT");
        assertThat(body.get("message")).isEqualTo("Slot taken");
    }

    @Test
    void handleConflict_shouldReturnConflictCode_forOptimisticLockingFailure() {
        Map<String, Object> body = handler.handleConflict(new OptimisticLockingFailureException("Version mismatch"));

        assertThat(body.get("code")).isEqualTo("CONFLICT");
    }

    @Test
    void handleClinicalUnavailable_shouldReturnServiceUnavailableCode() {
        Map<String, Object> body = handler.handleClinicalUnavailable(
                new ClinicalServiceUnavailableException("clinical down"));

        assertThat(body.get("code")).isEqualTo("CLINICAL_UNAVAILABLE");
        assertThat(body.get("message")).isEqualTo("clinical down");
    }

    @Test
    void handleBadRequest_shouldReturnBadRequestCode() {
        Map<String, Object> body = handler.handleBadRequest(new BadRequestException("Invalid input"));

        assertThat(body.get("code")).isEqualTo("BAD_REQUEST");
        assertThat(body.get("message")).isEqualTo("Invalid input");
    }

    @Test
    void handleValidation_shouldReturnBadRequestCode_withGenericMessage() {
        // MethodArgumentNotValidException cannot be instantiated cleanly in unit scope;
        // use a mock to verify the handler produces the correct code without needing
        // MVC context.
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);

        Map<String, Object> body = handler.handleValidation(ex);

        assertThat(body.get("code")).isEqualTo("BAD_REQUEST");
        assertThat(body.get("message")).isEqualTo("Payload invalido");
    }

    @Test
    void errorBody_shouldAlwaysIncludeTimestampKey() {
        Map<String, Object> body = handler.handleNotFound(new NotFoundException("x"));

        assertThat(body).containsKey("timestamp");
        // Timestamp must be a non-blank ISO-8601 string parseable by Instant
        assertThat((String) body.get("timestamp")).isNotBlank();
    }
}
