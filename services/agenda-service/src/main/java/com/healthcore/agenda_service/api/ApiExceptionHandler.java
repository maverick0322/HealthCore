package com.healthcore.agenda_service.api;

import com.healthcore.agenda_service.domain.exception.ConflictException;
import com.healthcore.agenda_service.domain.exception.ForbiddenOperationException;
import com.healthcore.agenda_service.domain.exception.NotFoundException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleNotFound(NotFoundException ex) {
        return error("NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(ForbiddenOperationException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String, Object> handleForbidden(ForbiddenOperationException ex) {
        return error("FORBIDDEN", ex.getMessage());
    }

    @ExceptionHandler({ConflictException.class, OptimisticLockingFailureException.class})
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleConflict(RuntimeException ex) {
        return error("CONFLICT", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException ex) {
        return error("BAD_REQUEST", "Payload invalido");
    }

    private Map<String, Object> error(String code, String message) {
        return Map.of(
            "timestamp", Instant.now().toString(),
            "code", code,
            "message", message
        );
    }
}

