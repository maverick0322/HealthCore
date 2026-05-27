package com.healthcore.tracking.interfaces.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.healthcore.tracking.application.usecase.FoodTrackingUseCase;
import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.exception.ResourceNotFoundException;
import com.healthcore.tracking.domain.model.FoodNutrients;
import com.healthcore.tracking.domain.model.MealItem;
import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.model.MealType;
import com.healthcore.tracking.infrastructure.grpc.client.GrpcClinicalServiceClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = FoodTrackingController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class}
)
@TestPropertySource(properties = "jwt.secret=ThisIsAVerySecureSecretKeyForTestingTheFilter2026!")
class FoodTrackingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private FoodTrackingUseCase trackingUseCase;

    @MockitoBean
    private GrpcClinicalServiceClient clinicalServiceClient;

    @BeforeEach
    void setUp() {
        // Ensure ObjectMapper can serialize/deserialize LocalDateTime gracefully
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("Should return 200 OK and food nutrients when barcode exists")
    void getFoodFromCatalog_Success() throws Exception {
        // Arrange
        FoodNutrients mockNutrients = new FoodNutrients(
                "75017618", "Avena Integral", "Quaker", null,
                389.0, 16.9, 66.3, 6.9, 10.6, 2.0, 0.0, 429.0
        );

        when(trackingUseCase.getFoodFromCatalog("75017618")).thenReturn(mockNutrients);

        // Act & Assert
        mockMvc.perform(get("/api/v1/tracking/catalog/75017618")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Avena Integral"))
                .andExpect(jsonPath("$.calories").value(389.0));
    }

    @Test
    @DisplayName("Should return 404 NOT FOUND when GlobalExceptionHandler catches ResourceNotFoundException")
    void getFoodFromCatalog_NotFound() throws Exception {
        // Arrange
        when(trackingUseCase.getFoodFromCatalog(anyString()))
                .thenThrow(new ResourceNotFoundException("Food item not found in catalog"));

        // Act & Assert
        mockMvc.perform(get("/api/v1/tracking/catalog/000000000")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Food item not found in catalog"));
    }

    @Test
    @DisplayName("Should return 400 BAD REQUEST when GlobalExceptionHandler catches InvalidDomainDataException")
    void searchCatalog_BadRequest() throws Exception {
        // Arrange
        when(trackingUseCase.searchCatalog("ab"))
                .thenThrow(new InvalidDomainDataException("Search query must contain at least 3 characters."));

        // Act & Assert
        mockMvc.perform(get("/api/v1/tracking/catalog/search?query=ab")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Search query must contain at least 3 characters."));
    }

    @Test
    @DisplayName("Should return 201 CREATED when meal log is successfully processed")
    void logMealConsumption_Created() throws Exception {
        // Arrange
        MealLogRequest.FoodItemRequest foodItemRequest = new MealLogRequest.FoodItemRequest("75017618", 150.0);

        // CORRECCIÓN: Inyectando el parámetro mealName ("Desayuno de Avena") en el record
        MealLogRequest requestBody = new MealLogRequest(
                "Desayuno de Avena",
                MealType.BREAKFAST,
                LocalDateTime.now(),
                "avena-photo.jpg",
                List.of(foodItemRequest)
        );

        MealItem mockItem = MealItem.builder()
                .barcode("75017618")
                .foodName("Avena Integral")
                .consumedGrams(150.0)
                .calories(583.5)
                .build();

        // CORRECCIÓN: Asegurándonos de que el mock también devuelva el mealName
        MealLog mockSavedLog = MealLog.builder()
                .userId("user-123")
                .mealName("Desayuno de Avena")
                .mealType(MealType.BREAKFAST)
                .photoKey("avena-photo.jpg")
                .consumedAt(requestBody.consumedAt())
                .totalCalories(583.5)
                .items(List.of(mockItem))
                .build();

        // CORRECCIÓN: Se actualizó el 'any()' que fallaba a 'anyString()' en la segunda posición (mealName)
        when(trackingUseCase.logMealConsumption(any(), anyString(), eq(MealType.BREAKFAST), any(), any(), any()))
                .thenReturn(mockSavedLog);

        // Act & Assert
        mockMvc.perform(post("/api/v1/tracking/logs/meal")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mealName").value("Desayuno de Avena")) // NUEVA ASERCIÓN
                .andExpect(jsonPath("$.mealType").value("BREAKFAST"))
                .andExpect(jsonPath("$.totalCalories").value(583.5))
                .andExpect(jsonPath("$.items[0].foodName").value("Avena Integral")); // Asserting nested data
    }

    @Test
    @DisplayName("Should return 200 OK and a list of meal logs for today")
    void getTodayLogs_Success() throws Exception {
        // Arrange
        MealItem item1 = MealItem.builder().foodName("Manzana").build();
        MealLog log1 = MealLog.builder().mealName("Snack ligero").mealType(MealType.SNACK).items(List.of(item1)).build();

        MealItem item2 = MealItem.builder().foodName("Pera").build();
        MealLog log2 = MealLog.builder().mealName("Comida fuerte").mealType(MealType.LUNCH).items(List.of(item2)).build();

        when(trackingUseCase.getTodayLogs(any())).thenReturn(List.of(log1, log2));

        // Act & Assert
        mockMvc.perform(get("/api/v1/tracking/logs/today")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].mealName").value("Snack ligero"))
                .andExpect(jsonPath("$[0].items[0].foodName").value("Manzana"))
                .andExpect(jsonPath("$[1].mealName").value("Comida fuerte"))
                .andExpect(jsonPath("$[1].items[0].foodName").value("Pera"));
    }
}