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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
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
        objectMapper.registerModule(new JavaTimeModule());
    }

    // --- TESTS ORIGINALES ---

    @Test
    @DisplayName("Should return 200 OK and food nutrients when barcode exists")
    void getFoodFromCatalog_Success() throws Exception {
        FoodNutrients mockNutrients = new FoodNutrients(
                "75017618", "Avena Integral", "Quaker", null,
                389.0, 16.9, 66.3, 6.9, 10.6, 2.0, 0.0, 429.0
        );

        when(trackingUseCase.getFoodFromCatalog("75017618")).thenReturn(mockNutrients);

        mockMvc.perform(get("/api/v1/tracking/catalog/75017618")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Avena Integral"))
                .andExpect(jsonPath("$.calories").value(389.0));
    }

    @Test
    @DisplayName("Should return 404 NOT FOUND when GlobalExceptionHandler catches ResourceNotFoundException")
    void getFoodFromCatalog_NotFound() throws Exception {
        when(trackingUseCase.getFoodFromCatalog(anyString()))
                .thenThrow(new ResourceNotFoundException("Food item not found in catalog"));

        mockMvc.perform(get("/api/v1/tracking/catalog/000000000")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Food item not found in catalog"));
    }

    @Test
    @DisplayName("Should return 400 BAD REQUEST when GlobalExceptionHandler catches InvalidDomainDataException")
    void searchCatalog_BadRequest() throws Exception {
        when(trackingUseCase.searchCatalog("ab"))
                .thenThrow(new InvalidDomainDataException("Search query must contain at least 3 characters."));

        mockMvc.perform(get("/api/v1/tracking/catalog/search?query=ab")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("Should return 201 CREATED when meal log is successfully processed")
    void logMealConsumption_Created() throws Exception {
        MealLogRequest.FoodItemRequest foodItemRequest = new MealLogRequest.FoodItemRequest("75017618", 150.0);
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

        MealLog mockSavedLog = MealLog.builder()
                .userId("user-123")
                .mealName("Desayuno de Avena")
                .mealType(MealType.BREAKFAST)
                .photoKey("avena-photo.jpg")
                .consumedAt(requestBody.consumedAt())
                .totalCalories(583.5)
                .items(List.of(mockItem))
                .build();

        when(trackingUseCase.logMealConsumption(any(), anyString(), eq(MealType.BREAKFAST), any(), any(), any()))
                .thenReturn(mockSavedLog);

        mockMvc.perform(post("/api/v1/tracking/logs/meal")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mealName").value("Desayuno de Avena"))
                .andExpect(jsonPath("$.totalCalories").value(583.5));
    }

    @Test
    @DisplayName("Should return 200 OK and a list of meal logs for today")
    void getTodayLogs_Success() throws Exception {
        MealItem item1 = MealItem.builder().foodName("Manzana").build();
        MealLog log1 = MealLog.builder().mealName("Snack ligero").mealType(MealType.SNACK).items(List.of(item1)).build();

        when(trackingUseCase.getTodayLogs(any())).thenReturn(List.of(log1));

        mockMvc.perform(get("/api/v1/tracking/logs/today")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].mealName").value("Snack ligero"));
    }

    // --- NUEVOS TESTS (COBERTURA AL 100%) ---

    @Test
    @DisplayName("Should return 200 OK and search results when query is valid")
    void searchCatalog_Success() throws Exception {
        FoodNutrients mockNutrients = new FoodNutrients("123", "Manzana", "Genérico", null, 52.0, 0.3, 14.0, 10.4, 2.4, 0.2, 0.0, 1.0);
        when(trackingUseCase.searchCatalog(anyString())).thenReturn(List.of(mockNutrients));

        mockMvc.perform(get("/api/v1/tracking/catalog/search?query=Manzana")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Manzana"));
    }

    @Test
    @DisplayName("Should return 200 OK for logs by specific date")
    void getLogsByDate_Success() throws Exception {
        LocalDate date = LocalDate.of(2026, 5, 17);
        MealLog log = MealLog.builder().mealName("Cena especial").build();

        when(trackingUseCase.getDailyLogs(any(), eq(date))).thenReturn(List.of(log));

        mockMvc.perform(get("/api/v1/tracking/logs/daily")
                        .param("date", date.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].mealName").value("Cena especial"));
    }

    @Test
    @DisplayName("Should return 200 OK when Nutritionist requests linked patient logs")
    void getNutritionistPatientLogsByDate_Success() throws Exception {
        LocalDate date = LocalDate.of(2026, 5, 17);
        MealLog log = MealLog.builder().mealName("Dieta del paciente").build();

        Authentication auth = new UsernamePasswordAuthenticationToken("nutri-123", null,
                List.of(new SimpleGrantedAuthority("ROLE_NUTRITIONIST")));

        when(clinicalServiceClient.validateLink(any(), any())).thenReturn(true);
        when(trackingUseCase.getDailyLogs(any(), eq(date))).thenReturn(List.of(log));

        mockMvc.perform(get("/api/v1/tracking/nutritionist/patients/patient-123/logs/daily")
                        .param("date", date.toString())
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].mealName").value("Dieta del paciente"));
    }

    @Test
    @DisplayName("Should throw AccessDeniedException if user lacks NUTRITIONIST role")
    void getNutritionistPatientLogsByDate_InvalidRole_ThrowsAccessDenied() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("patient-123", null,
                List.of(new SimpleGrantedAuthority("ROLE_PATIENT")));

        mockMvc.perform(get("/api/v1/tracking/nutritionist/patients/patient-123/logs/daily")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(result -> assertThat(result.getResolvedException())
                        .isInstanceOf(AccessDeniedException.class)
                        .hasMessageContaining("Only nutritionists can access"));
    }

    @Test
    @DisplayName("Should throw AccessDeniedException if patient is not linked to nutritionist")
    void getNutritionistPatientLogsByDate_InvalidLink_ThrowsAccessDenied() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("nutri-123", null,
                List.of(new SimpleGrantedAuthority("ROLE_NUTRITIONIST")));

        when(clinicalServiceClient.validateLink(any(), any())).thenReturn(false);

        mockMvc.perform(get("/api/v1/tracking/nutritionist/patients/patient-123/logs/daily")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(result -> assertThat(result.getResolvedException())
                        .isInstanceOf(AccessDeniedException.class)
                        .hasMessageContaining("Patient is not linked"));
    }
}