package com.healthcore.tracking.application.usecase;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.model.WaterLog;
import com.healthcore.tracking.domain.port.WaterLogPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WaterTrackingUseCaseTest {

    @Mock
    private WaterLogPort waterLogPort;

    @InjectMocks
    private WaterTrackingUseCase useCase;

    private static final String VALID_USER_ID = "user-123";

    @Test
    void logWaterConsumption_WithValidData_SavesAndReturnsWaterLog() {
        // Arrange
        int amountMl = 250;
        LocalDateTime consumedAt = LocalDateTime.of(2026, 5, 17, 10, 30);

        WaterLog mockSavedLog = mock(WaterLog.class);
        when(waterLogPort.save(any(WaterLog.class))).thenReturn(mockSavedLog);

        // Act
        WaterLog result = useCase.logWaterConsumption(VALID_USER_ID, amountMl, consumedAt);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(mockSavedLog);

        ArgumentCaptor<WaterLog> logCaptor = ArgumentCaptor.forClass(WaterLog.class);
        verify(waterLogPort, times(1)).save(logCaptor.capture());

        WaterLog capturedLog = logCaptor.getValue();
        assertThat(capturedLog).isNotNull();
    }

    @Test
    void logWaterConsumption_WithNullUserId_ThrowsException() {
        // Arrange
        LocalDateTime consumedAt = LocalDateTime.now();

        // Act & Assert
        assertThatThrownBy(() -> useCase.logWaterConsumption(null, 250, consumedAt))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("User identification is required to log water.");

        verifyNoInteractions(waterLogPort);
    }

    @Test
    void logWaterConsumption_WithBlankUserId_ThrowsException() {
        // Arrange
        LocalDateTime consumedAt = LocalDateTime.now();

        // Act & Assert
        assertThatThrownBy(() -> useCase.logWaterConsumption("   ", 250, consumedAt))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("User identification is required to log water.");

        verifyNoInteractions(waterLogPort);
    }

    @Test
    void removeLatestWaterLog_Success() {
        // Act
        useCase.removeLatestWaterLog(VALID_USER_ID);

        // Assert
        verify(waterLogPort, times(1)).deleteLatest(
                eq(VALID_USER_ID),
                any(LocalDateTime.class),
                any(LocalDateTime.class)
        );
    }

    @Test
    void removeLatestWaterLog_ThrowsExceptionIfUserIdIsNull() {
        // Act & Assert
        assertThatThrownBy(() -> useCase.removeLatestWaterLog(null))
                .isInstanceOf(InvalidDomainDataException.class);

        verifyNoInteractions(waterLogPort);
    }
}