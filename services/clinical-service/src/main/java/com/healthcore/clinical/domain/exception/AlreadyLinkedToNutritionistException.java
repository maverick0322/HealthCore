package com.healthcore.clinical.domain.exception;

public class AlreadyLinkedToNutritionistException extends RuntimeException {
    private final String currentNutritionistId;

    public AlreadyLinkedToNutritionistException(String message, String currentNutritionistId) {
        super(message);
        this.currentNutritionistId = currentNutritionistId;
    }

    public String getCurrentNutritionistId() {
        return currentNutritionistId;
    }
}
