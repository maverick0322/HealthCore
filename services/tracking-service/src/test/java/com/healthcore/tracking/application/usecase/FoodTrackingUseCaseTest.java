package com.healthcore.tracking.application.usecase;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.exception.ResourceNotFoundException;
import com.healthcore.tracking.domain.model.FoodNutrients;
import com.healthcore.tracking.domain.model.MealItem;
import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.model.MealType;
import com.healthcore.tracking.domain.port.FoodCatalogPort;
import com.healthcore.tracking.domain.port.MealLogPort;
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

    @Mock
    private MediaGrpcClientAdapter mediaGrpcClient;

    @InjectMocks
    private FoodTrackingUseCase useCase;

    // --- TESTS ORIGINALES INTACTOS ---

    @Test
    @DisplayName("logMealConsumption should orchestrate fetch, calculation, and save successfully for a complete meal")
    void logMealConsumption_Success() {
        String userId = "user-123";
        String mealName = "Snack de media tarde";
        String barcode = "7622300336738";
        double grams = 200.0;
        String photoKey = "my-lunch-photo.jpg";

        FoodNutrients mockNutrients = new FoodNutrients(
                barcode, "Oreo", "Nabisco", null,
                472.0, 5.5, 67.0, 19.0,
                3.0, 400.0, 38.0, 150.0
        );

        FoodTrackingUseCase.MealItemCommand command = new FoodTrackingUseCase.MealItemCommand(barcode, grams);

        when(catalogPort.getNutrientsByBarcode(barcode)).thenReturn(Optional.of(mockNutrients));
        when(logPort.save(any(MealLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MealLog result = useCase.logMealConsumption(userId, mealName, MealType.LUNCH, LocalDateTime.now(), photoKey, List.of(command));

        assertNotNull(result);
        assertEquals(userId, result.getUserId());
        assertEquals(mealName, result.getMealName());
        assertEquals(MealType.LUNCH, result.getMealType());
        assertEquals(photoKey, result.getPhotoKey());
        assertEquals(1, result.getItems().size());
        assertEquals(944.0, result.getTotalCalories());

        verify(catalogPort, times(1)).getNutrientsByBarcode(barcode);
        verify(logPort, times(1)).save(any(MealLog.class));
    }

    @Test
    @DisplayName("logMealConsumption should throw ResourceNotFoundException if any barcode doesn't exist")
    void logMealConsumption_ThrowsNotFound() {
        FoodTrackingUseCase.MealItemCommand command = new FoodTrackingUseCase.MealItemCommand("invalid-code", 100.0);
        when(catalogPort.getNutrientsByBarcode(anyString())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                useCase.logMealConsumption("user", "Comida fallida", MealType.SNACK, LocalDateTime.now(), null, List.of(command))
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
        String query = "Oreo";
        FoodNutrients mockNutrients = new FoodNutrients(
                "7622300336738", "Oreo", "Nabisco", null,
                472.0, 5.5, 67.0, 19.0, 3.0, 400.0, 38.0, 150.0
        );
        when(catalogPort.searchFoodByName(query)).thenReturn(List.of(mockNutrients));

        var results = useCase.searchCatalog(query);

        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        assertEquals("Oreo", results.get(0).name());
    }

    @Test
    @DisplayName("getFoodFromCatalog should return nutrients directly")
    void getFoodFromCatalog_Success() {
        String barcode = "12345";
        FoodNutrients mockNutrients = new FoodNutrients(
                barcode, "Apple", "Generic", null,
                52.0, 0.3, 14.0, 0.2, 2.4, 1.0, 10.0, 107.0
        );
        when(catalogPort.getNutrientsByBarcode(barcode)).thenReturn(Optional.of(mockNutrients));

        FoodNutrients result = useCase.getFoodFromCatalog(barcode);

        assertNotNull(result);
        assertEquals(barcode, result.barcode());
    }

    @Test
    @DisplayName("getTodayLogs should request logs from start to end of current day")
    void getTodayLogs_Success() {
        String userId = "user-123";
        MealLog mockLog = MealLog.builder().userId(userId).mealName("Desayuno de prueba").mealType(MealType.BREAKFAST).build();

        when(logPort.findByUserIdAndDateRange(eq(userId), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(mockLog));

        var results = useCase.getTodayLogs(userId);

        assertFalse(results.isEmpty());
        assertEquals(userId, results.get(0).getUserId());
        verify(logPort, times(1)).findByUserIdAndDateRange(eq(userId), any(LocalDateTime.class), any(LocalDateTime.class));
    }


    // --- NUEVOS TESTS (COBERTURA 100%) ---

    // 1. Validaciones extra en logMealConsumption
    @Test
    @DisplayName("logMealConsumption should validate user ID and meal name strictly")
    void logMealConsumption_Validations_ThrowsException() {
        // userId nulo o vacío
        assertThrows(InvalidDomainDataException.class, () ->
                useCase.logMealConsumption(null, "Comida", MealType.LUNCH, LocalDateTime.now(), null, List.of()));
        assertThrows(InvalidDomainDataException.class, () ->
                useCase.logMealConsumption("   ", "Comida", MealType.LUNCH, LocalDateTime.now(), null, List.of()));

        // mealName nulo, vacío o muy largo (> 30)
        assertThrows(InvalidDomainDataException.class, () ->
                useCase.logMealConsumption("user-1", null, MealType.LUNCH, LocalDateTime.now(), null, List.of()));
        assertThrows(InvalidDomainDataException.class, () ->
                useCase.logMealConsumption("user-1", "   ", MealType.LUNCH, LocalDateTime.now(), null, List.of()));

        String tooLongName = "Esta es una comida con un nombre sumamente largo que debería fallar";
        assertThrows(InvalidDomainDataException.class, () ->
                useCase.logMealConsumption("user-1", tooLongName, MealType.LUNCH, LocalDateTime.now(), null, List.of()));
    }

    // 2. Validaciones extra en getFoodFromCatalog
    @Test
    @DisplayName("getFoodFromCatalog should throw exception if barcode is null or empty")
    void getFoodFromCatalog_WithInvalidBarcode_ThrowsException() {
        assertThrows(InvalidDomainDataException.class, () -> useCase.getFoodFromCatalog(null));
        assertThrows(InvalidDomainDataException.class, () -> useCase.getFoodFromCatalog("   "));
    }

    // 3. Validaciones extra en getDailyLogs
    @Test
    @DisplayName("getDailyLogs should throw exception if parameters are missing")
    void getDailyLogs_WithInvalidParams_ThrowsException() {
        assertThrows(InvalidDomainDataException.class, () -> useCase.getDailyLogs(null, LocalDate.now()));
        assertThrows(InvalidDomainDataException.class, () -> useCase.getDailyLogs("user-1", null));
    }

    // 4. Mapeo de fotos con gRPC en getDailyLogs (y por ende en getTodayLogs)
    @Test
    @DisplayName("getDailyLogs should enrich logs with pre-signed URLs via gRPC")
    void getDailyLogs_WithValidPhotoKey_EnrichesUrl() {
        MealLog log = MealLog.builder().userId("user-1").photoKey("my-photo.jpg").build();
        when(logPort.findByUserIdAndDateRange(any(), any(), any())).thenReturn(List.of(log));
        when(mediaGrpcClient.getPresignedReadUrl("my-photo.jpg")).thenReturn("https://s3.com/my-photo.jpg");

        var result = useCase.getDailyLogs("user-1", LocalDate.now());

        assertEquals("https://s3.com/my-photo.jpg", result.get(0).getPhotoKey());
        verify(mediaGrpcClient, times(1)).getPresignedReadUrl("my-photo.jpg");
    }

    @Test
    @DisplayName("getDailyLogs should not break if gRPC throws StatusRuntimeException")
    void getDailyLogs_WhenGrpcThrowsStatusRuntimeException_LogsAndContinues() {
        MealLog log = MealLog.builder().userId("user-1").photoKey("key.jpg").build();
        when(logPort.findByUserIdAndDateRange(any(), any(), any())).thenReturn(List.of(log));
        when(mediaGrpcClient.getPresignedReadUrl("key.jpg")).thenThrow(new StatusRuntimeException(Status.UNAVAILABLE));

        var result = useCase.getDailyLogs("user-1", LocalDate.now());
        assertEquals("key.jpg", result.get(0).getPhotoKey()); // Conserva el original
    }

    @Test
    @DisplayName("getDailyLogs should not break if gRPC throws IllegalArgumentException")
    void getDailyLogs_WhenGrpcThrowsIllegalArgumentException_LogsAndContinues() {
        MealLog log = MealLog.builder().userId("user-1").photoKey("invalid").build();
        when(logPort.findByUserIdAndDateRange(any(), any(), any())).thenReturn(List.of(log));
        when(mediaGrpcClient.getPresignedReadUrl("invalid")).thenThrow(new IllegalArgumentException("Bad format"));

        var result = useCase.getDailyLogs("user-1", LocalDate.now());
        assertEquals("invalid", result.get(0).getPhotoKey());
    }

    @Test
    @DisplayName("getDailyLogs should not break if gRPC throws generic Exception")
    void getDailyLogs_WhenGrpcThrowsGenericException_LogsAndContinues() {
        MealLog log = MealLog.builder().userId("user-1").photoKey("key.jpg").build();
        when(logPort.findByUserIdAndDateRange(any(), any(), any())).thenReturn(List.of(log));
        when(mediaGrpcClient.getPresignedReadUrl("key.jpg")).thenThrow(new RuntimeException("Oops"));

        var result = useCase.getDailyLogs("user-1", LocalDate.now());
        assertEquals("key.jpg", result.get(0).getPhotoKey());
    }

    // 5. Cobertura del método oculto logHash
    @Test
    @DisplayName("Forzar cobertura del método privado logHash para cadenas nulas o vacías")
    void logHash_Coverage() throws Exception {
        java.lang.reflect.Method method = FoodTrackingUseCase.class.getDeclaredMethod("logHash", String.class);
        method.setAccessible(true);
        assertEquals("unknown", method.invoke(useCase, (String) null));
        assertEquals("unknown", method.invoke(useCase, "   "));
        assertNotNull(method.invoke(useCase, "user-123"));
    }
}