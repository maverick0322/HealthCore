package com.healthcore.tracking.interfaces.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.tracking.application.usecase.FoodTrackingUseCase;
import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.exception.ResourceNotFoundException;
import com.healthcore.tracking.domain.model.FoodNutrients;
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

    @Test
    @DisplayName("Should return 200 OK and food nutrients when barcode exists")
    void getFoodFromCatalog_Success() throws Exception {
        // Arrange
        FoodNutrients mockNutrients = FoodNutrients.builder()
                .name("Avena Integral")
                .brand("Quaker")
                .calories(389.0)
                .build();

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
    @DisplayName("Should return 201 CREATED when food log is successfully processed")
    void logFoodConsumption_Created() throws Exception {
        // Arrange
        MealLogRequest requestBody = new MealLogRequest("75017618", 150.0);

        FoodLog mockSavedLog = FoodLog.builder()
                .userId("user-123")
                .barcode("75017618")
                .foodName("Avena Integral")
                .consumedGrams(150.0)
                .totalCalories(583.5)
                .consumedAt(LocalDateTime.now())
                .build();

        when(trackingUseCase.logFoodConsumption(any(), eq("75017618"), eq(150.0)))
                .thenReturn(mockSavedLog);

        // Act & Assert
        mockMvc.perform(post("/api/v1/tracking/logs/food")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.foodName").value("Avena Integral"))
                .andExpect(jsonPath("$.totalCalories").value(583.5));
    }

    @Test
    @DisplayName("Should return 200 OK and a list of logs for today")
    void getTodayLogs_Success() throws Exception {
        // Arrange
        FoodLog log1 = FoodLog.builder().foodName("Manzana").build();
        FoodLog log2 = FoodLog.builder().foodName("Pera").build();

        when(trackingUseCase.getTodayLogs(any())).thenReturn(List.of(log1, log2));

        // Act & Assert
        mockMvc.perform(get("/api/v1/tracking/logs/today")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].foodName").value("Manzana"))
                .andExpect(jsonPath("$[1].foodName").value("Pera"));
    }
}