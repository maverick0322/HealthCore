package com.healthcore.tracking.domain.model;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WaterLogTest {

    private static final String USER_ID = "user-123";
    private static final LocalDateTime FIXED_DATE = LocalDateTime.of(2026, 5, 17, 10, 30);

    @Test
    void create_WithValidData_ReturnsWaterLogWithGeneratedId() {
        // Arrange
        int validAmount = 250;

        // Act
        WaterLog waterLog = WaterLog.create(USER_ID, validAmount, FIXED_DATE);

        // Assert
        assertThat(waterLog).isNotNull();
        assertThat(waterLog.getId()).isNotBlank(); // El UUID debe generarse
        assertThat(waterLog.getUserId()).isEqualTo(USER_ID);
        assertThat(waterLog.getAmountMl()).isEqualTo(validAmount);
        assertThat(waterLog.getConsumedAt()).isEqualTo(FIXED_DATE);
    }

    @Test
    void create_WithNullConsumedAt_DefaultsToNow() {
        // Arrange
        int validAmount = 500;
        LocalDateTime beforeCreation = LocalDateTime.now();

        // Act
        WaterLog waterLog = WaterLog.create(USER_ID, validAmount, null);

        // Assert
        LocalDateTime afterCreation = LocalDateTime.now();
        assertThat(waterLog).isNotNull();
        // Validamos que la fecha generada esté en el rango de tiempo de la prueba
        assertThat(waterLog.getConsumedAt()).isBetween(beforeCreation.minusSeconds(1), afterCreation.plusSeconds(1));
    }

    @Test
    void create_WithAmountExactlyAtLowerBound_CreatesSuccessfully() {
        // Arrange
        int minAmount = 1;

        // Act
        WaterLog waterLog = WaterLog.create(USER_ID, minAmount, FIXED_DATE);

        // Assert
        assertThat(waterLog.getAmountMl()).isEqualTo(minAmount);
    }

    @Test
    void create_WithAmountExactlyAtUpperBound_CreatesSuccessfully() {
        // Arrange
        int maxAmount = 5000;

        // Act
        WaterLog waterLog = WaterLog.create(USER_ID, maxAmount, FIXED_DATE);

        // Assert
        assertThat(waterLog.getAmountMl()).isEqualTo(maxAmount);
    }

    @Test
    void create_WithAmountBelowMinimum_ThrowsException() {
        // Arrange
        int invalidAmount = 0;

        // Act & Assert
        assertThatThrownBy(() -> WaterLog.create(USER_ID, invalidAmount, FIXED_DATE))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("Water amount must be between 1 and 5000 ml.");
    }

    @Test
    void create_WithAmountAboveMaximum_ThrowsException() {
        // Arrange
        int invalidAmount = 5001;

        // Act & Assert
        assertThatThrownBy(() -> WaterLog.create(USER_ID, invalidAmount, FIXED_DATE))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("Water amount must be between 1 and 5000 ml.");
    }
}