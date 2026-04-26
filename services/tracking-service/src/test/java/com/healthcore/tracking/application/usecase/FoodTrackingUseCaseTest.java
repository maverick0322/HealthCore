package com.healthcore.tracking.application.usecase;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.exception.ResourceNotFoundException;
import com.healthcore.tracking.domain.model.FoodLog;
import com.healthcore.tracking.domain.model.FoodNutrients;
import com.healthcore.tracking.domain.port.FoodCatalogPort;
import com.healthcore.tracking.domain.port.FoodLogPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoodTrackingUseCaseTest {

    @Mock
    private FoodCatalogPort catalogPort;

    @Mock
    private FoodLogPort logPort;

    @InjectMocks
    private FoodTrackingUseCase useCase;

    @Test
    @DisplayName("logFoodConsumption should orchestrate fetch, calculation, and save successfully")
    void logFoodConsumption_Success() {
        // Arrange
        String userId = "user-123";
        String barcode = "7622300336738";
        double grams = 200.0;

        FoodNutrients mockNutrients = FoodNutrients.builder()
                .barcode(barcode)
                .name("Oreo")
                .calories(472.0)
                .proteins(5.5)
                .carbohydrates(67.0)
                .fats(19.0)
                .build();

        when(catalogPort.getNutrientsByBarcode(barcode)).thenReturn(Optional.of(mockNutrients));
        when(logPort.save(any(FoodLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        FoodLog result = useCase.logFoodConsumption(userId, barcode, grams);

        // Assert
        assertNotNull(result);
        assertEquals(userId, result.getUserId());
        assertEquals("Oreo", result.getFoodName());
        assertEquals(944.0, result.getTotalCalories()); // 472 * 2

        // Verify ports were called
        verify(catalogPort, times(1)).getNutrientsByBarcode(barcode);
        verify(logPort, times(1)).save(any(FoodLog.class));
    }

    @Test
    @DisplayName("logFoodConsumption should throw ResourceNotFoundException if barcode doesn't exist")
    void logFoodConsumption_ThrowsNotFound() {
        // Arrange
        when(catalogPort.getNutrientsByBarcode(anyString())).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                useCase.logFoodConsumption("user", "invalid-code", 100.0)
        );

        verify(logPort, never()).save(any());
    }

    @Test
    @DisplayName("searchCatalog should throw InvalidDomainDataException for short queries")
    void searchCatalog_ThrowsExceptionForShortQuery() {
        assertThrows(InvalidDomainDataException.class, () -> useCase.searchCatalog("ab"));
        assertThrows(InvalidDomainDataException.class, () -> useCase.searchCatalog("  "));
        assertThrows(InvalidDomainDataException.class, () -> useCase.searchCatalog(null));

        verify(catalogPort, never()).searchFoodByName(anyString());
    }

    @Test
    @DisplayName("searchCatalog should return list of nutrients for valid query")
    void searchCatalog_Success() {
        // Arrange
        String query = "Oreo";
        FoodNutrients mockNutrients = FoodNutrients.builder().name("Oreo").build();
        when(catalogPort.searchFoodByName(query)).thenReturn(java.util.List.of(mockNutrients));

        // Act
        var results = useCase.searchCatalog(query);

        // Assert
        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        verify(catalogPort, times(1)).searchFoodByName(query);
    }

    @Test
    @DisplayName("getFoodFromCatalog should return nutrients directly")
    void getFoodFromCatalog_Success() {
        // Arrange
        String barcode = "12345";
        FoodNutrients mockNutrients = FoodNutrients.builder().barcode(barcode).build();
        when(catalogPort.getNutrientsByBarcode(barcode)).thenReturn(Optional.of(mockNutrients));

        // Act
        FoodNutrients result = useCase.getFoodFromCatalog(barcode);

        // Assert
        assertNotNull(result);
        assertEquals(barcode, result.getBarcode());
    }

    @Test
    @DisplayName("getTodayLogs should request logs from start to end of current day")
    void getTodayLogs_Success() {
        // Arrange
        String userId = "user-123";
        FoodLog mockLog = FoodLog.builder().userId(userId).build();

        when(logPort.findByUserIdAndDateRange(eq(userId), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(java.util.List.of(mockLog));

        // Act
        var results = useCase.getTodayLogs(userId);

        // Assert
        assertFalse(results.isEmpty());
        assertEquals(userId, results.get(0).getUserId());
        verify(logPort, times(1)).findByUserIdAndDateRange(eq(userId), any(LocalDateTime.class), any(LocalDateTime.class));
    }
}