package com.healthcore.tracking.application.usecase;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.exception.ResourceNotFoundException;
import com.healthcore.tracking.domain.model.FoodNutrients;
import com.healthcore.tracking.domain.model.MealItem;
import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.model.MealType;
import com.healthcore.tracking.domain.port.FoodCatalogPort;
import com.healthcore.tracking.domain.port.MealLogPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoodTrackingUseCaseTest {

    @Mock
    private FoodCatalogPort catalogPort;

    @Mock
    private MealLogPort logPort;

    @InjectMocks
    private FoodTrackingUseCase useCase;

    @Test
    @DisplayName("logMealConsumption should orchestrate fetch, calculation, and save successfully for a complete meal")
    void logMealConsumption_Success() {
        // Arrange
        String userId = "user-123";
        String barcode = "7622300336738";
        double grams = 200.0;
        String photoKey = "my-lunch-photo.jpg";

        FoodNutrients mockNutrients = new FoodNutrients(
                barcode, "Oreo", "Nabisco", null,
                472.0, 5.5, 67.0, 19.0, // Macros
                3.0, 400.0, 38.0, 150.0 // Micros
        );

        FoodTrackingUseCase.MealItemCommand command = new FoodTrackingUseCase.MealItemCommand(barcode, grams);

        when(catalogPort.getNutrientsByBarcode(barcode)).thenReturn(Optional.of(mockNutrients));
        when(logPort.save(any(MealLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        MealLog result = useCase.logMealConsumption(userId, MealType.LUNCH, LocalDateTime.now(), photoKey, List.of(command));

        // Assert - Structural checks
        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(userId, result.getUserId());
        assertEquals(MealType.LUNCH, result.getMealType());
        assertEquals(photoKey, result.getPhotoKey());
        assertEquals(1, result.getItems().size());

        // Assert - Mathematical checks (Should be doubled because grams = 200)
        MealItem item = result.getItems().get(0);
        assertEquals("Oreo", item.getFoodName());
        assertEquals(944.0, item.getCalories());
        assertEquals(134.0, item.getCarbohydrates());
        assertEquals(800.0, item.getSodiumMg());

        // Assert - Aggregate totals
        assertEquals(944.0, result.getTotalCalories());

        // Verify ports
        verify(catalogPort, times(1)).getNutrientsByBarcode(barcode);
        verify(logPort, times(1)).save(any(MealLog.class));
    }

    @Test
    @DisplayName("logMealConsumption should throw ResourceNotFoundException if any barcode doesn't exist")
    void logMealConsumption_ThrowsNotFound() {
        // Arrange
        FoodTrackingUseCase.MealItemCommand command = new FoodTrackingUseCase.MealItemCommand("invalid-code", 100.0);
        when(catalogPort.getNutrientsByBarcode(anyString())).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                useCase.logMealConsumption("user", MealType.SNACK, LocalDateTime.now(), null, List.of(command))
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
        FoodNutrients mockNutrients = new FoodNutrients(
                "7622300336738", "Oreo", "Nabisco", null,
                472.0, 5.5, 67.0, 19.0, 3.0, 400.0, 38.0, 150.0
        );
        when(catalogPort.searchFoodByName(query)).thenReturn(List.of(mockNutrients));

        // Act
        var results = useCase.searchCatalog(query);

        // Assert
        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        assertEquals("Oreo", results.get(0).name());
        verify(catalogPort, times(1)).searchFoodByName(query);
    }

    @Test
    @DisplayName("getFoodFromCatalog should return nutrients directly")
    void getFoodFromCatalog_Success() {
        // Arrange
        String barcode = "12345";
        FoodNutrients mockNutrients = new FoodNutrients(
                barcode, "Apple", "Generic", null,
                52.0, 0.3, 14.0, 0.2, 2.4, 1.0, 10.0, 107.0
        );
        when(catalogPort.getNutrientsByBarcode(barcode)).thenReturn(Optional.of(mockNutrients));

        // Act
        FoodNutrients result = useCase.getFoodFromCatalog(barcode);

        // Assert
        assertNotNull(result);
        assertEquals(barcode, result.barcode());
    }

    @Test
    @DisplayName("getTodayLogs should request logs from start to end of current day")
    void getTodayLogs_Success() {
        // Arrange
        String userId = "user-123";
        MealLog mockLog = MealLog.builder()
                .userId(userId)
                .mealType(MealType.BREAKFAST)
                .build();

        when(logPort.findByUserIdAndDateRange(eq(userId), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(mockLog));

        // Act
        var results = useCase.getTodayLogs(userId);

        // Assert
        assertFalse(results.isEmpty());
        assertEquals(userId, results.get(0).getUserId());
        assertEquals(MealType.BREAKFAST, results.get(0).getMealType());
        verify(logPort, times(1)).findByUserIdAndDateRange(eq(userId), any(LocalDateTime.class), any(LocalDateTime.class));
    }
}