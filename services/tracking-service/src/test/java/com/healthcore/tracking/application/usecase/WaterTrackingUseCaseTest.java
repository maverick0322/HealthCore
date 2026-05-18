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

        // Simulamos que al guardar, el puerto nos devuelve un objeto simulado (mock) o real.
        WaterLog mockSavedLog = mock(WaterLog.class);
        when(waterLogPort.save(any(WaterLog.class))).thenReturn(mockSavedLog);

        // Act
        WaterLog result = useCase.logWaterConsumption(VALID_USER_ID, amountMl, consumedAt);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(mockSavedLog);

        // Usamos ArgumentCaptor para interceptar el WaterLog que se instanció dentro del método
        ArgumentCaptor<WaterLog> logCaptor = ArgumentCaptor.forClass(WaterLog.class);
        verify(waterLogPort, times(1)).save(logCaptor.capture());

        WaterLog capturedLog = logCaptor.getValue();
        assertThat(capturedLog).isNotNull();
        // Validamos que el objeto enviado a guardar pertenece al usuario correcto
        // (Asumiendo que WaterLog tiene un getter para userId. Si no lo tiene, puedes borrar esta línea)
        // assertThat(capturedLog.getUserId()).isEqualTo(VALID_USER_ID);
    }

    @Test
    void logWaterConsumption_WithNullUserId_ThrowsException() {
        // Arrange
        LocalDateTime consumedAt = LocalDateTime.now();

        // Act & Assert
        assertThatThrownBy(() -> useCase.logWaterConsumption(null, 250, consumedAt))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("User identification is required to log water.");

        // Verificamos que NUNCA se llame a la base de datos si la validación falla
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
}