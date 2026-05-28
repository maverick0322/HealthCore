package com.healthcore.tracking.application.usecase;

import com.healthcore.tracking.application.dto.TodayDashboardSummary;
import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.model.DailyMacroSummary;
import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.port.MealLogPort;
import com.healthcore.tracking.domain.port.WaterLogPort;
import com.healthcore.tracking.infrastructure.grpc.client.MediaGrpcClientAdapter;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardSummaryUseCaseTest {

    @Mock
    private MealLogPort mealLogPort;

    @Mock
    private WaterLogPort waterLogPort;

    @Mock
    private MediaGrpcClientAdapter mediaGrpcClient; // NUEVO: Para probar la asignación de URLs

    @InjectMocks
    private DashboardSummaryUseCase useCase;

    private final String VALID_USER_ID = "user-123";
    private final LocalDate TODAY = LocalDate.of(2026, 5, 17);

    // --- Tests para getTodaySummary (Éxito y sumatorias) ---

    @Test
    @DisplayName("Debe sumar los macros correctamente cuando hay varios registros")
    void getTodaySummary_WithValidData_ReturnsAggregatedSummary() {
        // CORRECCIÓN: Usamos el builder real para que el método toBuilder() funcione en el UseCase
        MealLog meal1 = MealLog.builder()
                .userId(VALID_USER_ID)
                .totalCalories(500.0)
                .totalProteins(30.0)
                .totalCarbs(40.0)
                .totalFats(15.0)
                .build();

        MealLog meal2 = MealLog.builder()
                .userId(VALID_USER_ID)
                .totalCalories(300.0)
                .totalProteins(10.0)
                .totalCarbs(50.0)
                .totalFats(5.0)
                .build();

        when(mealLogPort.findByUserIdAndDateRange(eq(VALID_USER_ID), any(), any()))
                .thenReturn(List.of(meal1, meal2));
        when(waterLogPort.getConsumedWaterBetween(eq(VALID_USER_ID), any(), any()))
                .thenReturn(750);
        when(mealLogPort.findDistinctLoggedDatesByUserId(VALID_USER_ID))
                .thenReturn(Set.of()); // Sin racha

        TodayDashboardSummary result = useCase.getTodaySummary(VALID_USER_ID, TODAY);

        assertThat(result).isNotNull();
        assertThat(result.totalCalories()).isEqualTo(800.0); // 500 + 300
        assertThat(result.totalProteins()).isEqualTo(40.0);  // 30 + 10
        assertThat(result.totalCarbs()).isEqualTo(90.0);     // 40 + 50
        assertThat(result.totalFats()).isEqualTo(20.0);      // 15 + 5
        assertThat(result.totalWaterMl()).isEqualTo(750);
    }

    @Test
    void getTodaySummary_WithNullUserId_ThrowsException() {
        assertThatThrownBy(() -> useCase.getTodaySummary(null, TODAY))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("User identification is required");
    }

    @Test
    void getTodaySummary_WithBlankUserId_ThrowsException() {
        assertThatThrownBy(() -> useCase.getTodaySummary("   ", TODAY))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("User identification is required");
    }

    // --- Tests para el Mapeo de Fotos con gRPC ---

    @Test
    @DisplayName("Debe enriquecer el registro con la URL de la foto si tiene photoKey")
    void getTodaySummary_WithValidPhotoKey_EnrichesUrl() {
        MealLog log = MealLog.builder().userId(VALID_USER_ID).photoKey("my-photo.jpg").totalCalories(100.0).build();
        when(mealLogPort.findByUserIdAndDateRange(any(), any(), any())).thenReturn(List.of(log));
        when(mediaGrpcClient.getPresignedReadUrl("my-photo.jpg")).thenReturn("https://s3.com/my-photo.jpg");

        useCase.getTodaySummary(VALID_USER_ID, TODAY);
        verify(mediaGrpcClient, times(1)).getPresignedReadUrl("my-photo.jpg");
    }

    @Test
    @DisplayName("No debe romperse si el microservicio de Media lanza StatusRuntimeException")
    void getTodaySummary_WhenGrpcThrowsStatusRuntimeException_LogsAndContinues() {
        MealLog log = MealLog.builder().userId(VALID_USER_ID).photoKey("key.jpg").build();
        when(mealLogPort.findByUserIdAndDateRange(any(), any(), any())).thenReturn(List.of(log));
        when(mediaGrpcClient.getPresignedReadUrl("key.jpg")).thenThrow(new StatusRuntimeException(Status.UNAVAILABLE));

        TodayDashboardSummary result = useCase.getTodaySummary(VALID_USER_ID, TODAY);
        assertThat(result).isNotNull(); // El dashboard sigue cargando a pesar del fallo
    }

    @Test
    @DisplayName("No debe romperse si el formato de la key es inválido")
    void getTodaySummary_WhenGrpcThrowsIllegalArgumentException_LogsAndContinues() {
        MealLog log = MealLog.builder().userId(VALID_USER_ID).photoKey("invalid-key").build();
        when(mealLogPort.findByUserIdAndDateRange(any(), any(), any())).thenReturn(List.of(log));
        when(mediaGrpcClient.getPresignedReadUrl("invalid-key")).thenThrow(new IllegalArgumentException("Bad format"));

        TodayDashboardSummary result = useCase.getTodaySummary(VALID_USER_ID, TODAY);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("No debe romperse ante un error inesperado genérico del cliente gRPC")
    void getTodaySummary_WhenGrpcThrowsGenericException_LogsAndContinues() {
        MealLog log = MealLog.builder().userId(VALID_USER_ID).photoKey("key.jpg").build();
        when(mealLogPort.findByUserIdAndDateRange(any(), any(), any())).thenReturn(List.of(log));
        when(mediaGrpcClient.getPresignedReadUrl("key.jpg")).thenThrow(new RuntimeException("Oops"));

        TodayDashboardSummary result = useCase.getTodaySummary(VALID_USER_ID, TODAY);
        assertThat(result).isNotNull();
    }

    // --- Tests para el cálculo de Rachas (Streaks) ---

    @Test
    @DisplayName("Racha vigente: Incluye el día de hoy y los anteriores")
    void getTodaySummary_WithStreakEndingToday_CalculatesCorrectly() {
        when(mealLogPort.findDistinctLoggedDatesByUserId(VALID_USER_ID))
                .thenReturn(Set.of(LocalDate.now(), LocalDate.now().minusDays(1), LocalDate.now().minusDays(2)));

        TodayDashboardSummary result = useCase.getTodaySummary(VALID_USER_ID, TODAY);
        assertThat(result.currentStreak()).isEqualTo(3);
    }

    @Test
    @DisplayName("Racha en pausa: Aún no registra hoy, pero registró ayer")
    void getTodaySummary_WithStreakEndingYesterday_CalculatesCorrectly() {
        when(mealLogPort.findDistinctLoggedDatesByUserId(VALID_USER_ID))
                .thenReturn(Set.of(LocalDate.now().minusDays(1), LocalDate.now().minusDays(2)));

        TodayDashboardSummary result = useCase.getTodaySummary(VALID_USER_ID, TODAY);
        assertThat(result.currentStreak()).isEqualTo(2);
    }

    @Test
    @DisplayName("Racha perdida: No ha registrado ni hoy ni ayer")
    void getTodaySummary_WithNoRecentStreak_ReturnsZero() {
        when(mealLogPort.findDistinctLoggedDatesByUserId(VALID_USER_ID))
                .thenReturn(Set.of(LocalDate.now().minusDays(2), LocalDate.now().minusDays(3)));

        TodayDashboardSummary result = useCase.getTodaySummary(VALID_USER_ID, TODAY);
        assertThat(result.currentStreak()).isEqualTo(0);
    }

    // --- Tests para getHistoricalMacros ---

    @Test
    void getHistoricalMacros_WithValidDateRange_ReturnsList() {
        LocalDate startDate = LocalDate.of(2026, 5, 1);
        LocalDate endDate = LocalDate.of(2026, 5, 7);

        DailyMacroSummary summary = new DailyMacroSummary(startDate.toString(), 2000.0, 150.0, 200.0, 50.0);
        when(mealLogPort.aggregateHistoricalMacros(eq(VALID_USER_ID), any(), any()))
                .thenReturn(List.of(summary));

        List<DailyMacroSummary> result = useCase.getHistoricalMacros(VALID_USER_ID, startDate, endDate);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).date()).isEqualTo(startDate.toString());
    }

    @Test
    void getHistoricalMacros_WithStartDateAfterEndDate_ThrowsException() {
        LocalDate startDate = LocalDate.of(2026, 5, 10);
        LocalDate endDate = LocalDate.of(2026, 5, 1); // Rango invertido

        assertThatThrownBy(() -> useCase.getHistoricalMacros(VALID_USER_ID, startDate, endDate))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("Start date must be provided and cannot be after end date");
    }

    @Test
    void getHistoricalMacros_WithNullDates_ThrowsException() {
        assertThatThrownBy(() -> useCase.getHistoricalMacros(VALID_USER_ID, null, TODAY))
                .isInstanceOf(InvalidDomainDataException.class);

        assertThatThrownBy(() -> useCase.getHistoricalMacros(VALID_USER_ID, TODAY, null))
                .isInstanceOf(InvalidDomainDataException.class);
    }

    // --- Test por Reflexión para métodos privados inalcanzables (100% Coverage) ---
    @Test
    @DisplayName("Forzar cobertura del método privado logHash para cadenas nulas o vacías")
    void logHash_Coverage() throws Exception {
        java.lang.reflect.Method method = DashboardSummaryUseCase.class.getDeclaredMethod("logHash", String.class);
        method.setAccessible(true);
        assertEquals("unknown", method.invoke(useCase, (String) null));
        assertEquals("unknown", method.invoke(useCase, "   "));
        assertNotNull(method.invoke(useCase, "user-123"));
    }
}