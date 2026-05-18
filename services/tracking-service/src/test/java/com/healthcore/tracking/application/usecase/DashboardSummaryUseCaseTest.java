package com.healthcore.tracking.application.usecase;

import com.healthcore.tracking.application.dto.TodayDashboardSummary;
import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.model.DailyMacroSummary;
import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.port.MealLogPort;
import com.healthcore.tracking.domain.port.WaterLogPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardSummaryUseCaseTest {

    @Mock
    private MealLogPort mealLogPort;

    @Mock
    private WaterLogPort waterLogPort;

    @InjectMocks
    private DashboardSummaryUseCase useCase;

    private final String VALID_USER_ID = "user-123";
    private final LocalDate TODAY = LocalDate.of(2026, 5, 17);

    // --- Tests para getTodaySummary ---

    @Test
    void getTodaySummary_WithValidData_ReturnsAggregatedSummary() {
        // Arrange
        MealLog mockMeal1 = mock(MealLog.class);
        when(mockMeal1.getTotalCalories()).thenReturn(500.0);
        when(mockMeal1.getTotalProteins()).thenReturn(30.0);
        when(mockMeal1.getTotalCarbs()).thenReturn(40.0);
        when(mockMeal1.getTotalFats()).thenReturn(15.0);

        MealLog mockMeal2 = mock(MealLog.class);
        when(mockMeal2.getTotalCalories()).thenReturn(300.0);
        when(mockMeal2.getTotalProteins()).thenReturn(10.0);
        when(mockMeal2.getTotalCarbs()).thenReturn(50.0);
        when(mockMeal2.getTotalFats()).thenReturn(5.0);

        when(mealLogPort.findByUserIdAndDateRange(eq(VALID_USER_ID), any(), any()))
                .thenReturn(List.of(mockMeal1, mockMeal2));

        when(waterLogPort.getConsumedWaterBetween(eq(VALID_USER_ID), any(), any()))
                .thenReturn(750);

        // Act
        TodayDashboardSummary result = useCase.getTodaySummary(VALID_USER_ID, TODAY);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.totalCalories()).isEqualTo(800.0); // 500 + 300
        assertThat(result.totalProteins()).isEqualTo(40.0);  // 30 + 10
        assertThat(result.totalCarbs()).isEqualTo(90.0);     // 40 + 50
        assertThat(result.totalFats()).isEqualTo(20.0);      // 15 + 5
        assertThat(result.totalWaterMl()).isEqualTo(750);

        verify(mealLogPort, times(1)).findByUserIdAndDateRange(eq(VALID_USER_ID), any(), any());
        verify(waterLogPort, times(1)).getConsumedWaterBetween(eq(VALID_USER_ID), any(), any());
    }

    @Test
    void getTodaySummary_WithNullUserId_ThrowsException() {
        // Act & Assert
        assertThatThrownBy(() -> useCase.getTodaySummary(null, TODAY))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("User identification is required");

        verifyNoInteractions(mealLogPort, waterLogPort);
    }

    @Test
    void getTodaySummary_WithBlankUserId_ThrowsException() {
        // Act & Assert
        assertThatThrownBy(() -> useCase.getTodaySummary("   ", TODAY))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("User identification is required");

        verifyNoInteractions(mealLogPort, waterLogPort);
    }

    // --- Tests para getHistoricalMacros ---

    @Test
    void getHistoricalMacros_WithValidDateRange_ReturnsList() {
        // Arrange
        LocalDate startDate = LocalDate.of(2026, 5, 1);
        LocalDate endDate = LocalDate.of(2026, 5, 7);

        DailyMacroSummary summary = new DailyMacroSummary(startDate.toString(), 2000.0, 150.0, 200.0, 50.0);
        when(mealLogPort.aggregateHistoricalMacros(eq(VALID_USER_ID), any(), any()))
                .thenReturn(List.of(summary));

        // Act
        List<DailyMacroSummary> result = useCase.getHistoricalMacros(VALID_USER_ID, startDate, endDate);

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).date()).isEqualTo(startDate.toString());
        verify(mealLogPort, times(1)).aggregateHistoricalMacros(eq(VALID_USER_ID), any(), any());
    }

    @Test
    void getHistoricalMacros_WithStartDateAfterEndDate_ThrowsException() {
        // Arrange
        LocalDate startDate = LocalDate.of(2026, 5, 10);
        LocalDate endDate = LocalDate.of(2026, 5, 1); // Rango invertido

        // Act & Assert
        assertThatThrownBy(() -> useCase.getHistoricalMacros(VALID_USER_ID, startDate, endDate))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("Start date must be provided and cannot be after end date");

        verifyNoInteractions(mealLogPort, waterLogPort);
    }

    @Test
    void getHistoricalMacros_WithNullDates_ThrowsException() {
        // Act & Assert
        assertThatThrownBy(() -> useCase.getHistoricalMacros(VALID_USER_ID, null, TODAY))
                .isInstanceOf(InvalidDomainDataException.class);

        assertThatThrownBy(() -> useCase.getHistoricalMacros(VALID_USER_ID, TODAY, null))
                .isInstanceOf(InvalidDomainDataException.class);

        verifyNoInteractions(mealLogPort, waterLogPort);
    }
}