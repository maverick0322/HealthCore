package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.application.usecase.WaterTrackingUseCase;
import com.healthcore.tracking.domain.model.WaterLog;
import com.healthcore.tracking.infrastructure.security.JwtValidationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = WaterTrackingController.class)
@AutoConfigureMockMvc(addFilters = false)
class WaterTrackingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WaterTrackingUseCase waterUseCase;

    @MockitoBean
    private JwtValidationFilter jwtValidationFilter;

    @Test
    void logWaterConsumption_WithValidPayload_Returns201Created() throws Exception {
        // Arrange
        LocalDateTime consumedAt = LocalDateTime.of(2026, 5, 17, 10, 30);

        WaterLog mockSavedLog = WaterLog.create("user-123", 250, consumedAt);

        when(waterUseCase.logWaterConsumption(any(), eq(250), any())).thenReturn(mockSavedLog);

        String requestPayload = """
                {
                    "amountMl": 250,
                    "consumedAt": "2026-05-17T10:30:00"
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/v1/tracking/logs/water")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestPayload))
                .andExpect(status().isCreated()) // HTTP 201
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.amountMl").value(250));
    }

    @Test
    void logWaterConsumption_WithMissingBody_ReturnsError() throws Exception {
        // Act & Assert:
        mockMvc.perform(post("/api/v1/tracking/logs/water")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }
}