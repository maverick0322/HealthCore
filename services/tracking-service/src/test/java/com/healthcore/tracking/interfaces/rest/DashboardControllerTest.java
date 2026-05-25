package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.application.dto.TodayDashboardSummary;
import com.healthcore.tracking.application.usecase.DashboardSummaryUseCase;
import com.healthcore.tracking.domain.model.DailyMacroSummary;
import com.healthcore.tracking.infrastructure.grpc.client.GrpcClinicalServiceClient;
import com.healthcore.tracking.infrastructure.security.JwtValidationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = DashboardController.class)
@AutoConfigureMockMvc(addFilters = false)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DashboardSummaryUseCase dashboardUseCase;

    @MockitoBean
    private JwtValidationFilter jwtValidationFilter;

    @MockitoBean
    private GrpcClinicalServiceClient clinicalServiceClient;


    @Test
    void getTodaySummary_WithDateParam_Returns200AndSummary() throws Exception {
        // Arrange
        LocalDate targetDate = LocalDate.of(2026, 5, 17);
        TodayDashboardSummary mockSummary = new TodayDashboardSummary(1800.0, 120.0, 150.0, 50.0, 1500, 2, 5);

        when(dashboardUseCase.getTodaySummary(any(), eq(targetDate))).thenReturn(mockSummary);

        // Act & Assert
        mockMvc.perform(get("/api/v1/tracking/dashboard/today")
                        .param("date", targetDate.toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalCalories").value(1800.0))
                .andExpect(jsonPath("$.totalProteins").value(120.0))
                .andExpect(jsonPath("$.totalWaterMl").value(1500));
    }

    @Test
    void getTodaySummary_WithoutDateParam_DefaultsToTodayAndReturns200() throws Exception {
        // Arrange
        TodayDashboardSummary mockSummary = new TodayDashboardSummary(0.0, 0.0, 0.0, 0.0, 0, 0, 0);

        when(dashboardUseCase.getTodaySummary(any(), any(LocalDate.class))).thenReturn(mockSummary);

        // Act & Assert
        mockMvc.perform(get("/api/v1/tracking/dashboard/today")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCalories").value(0.0));

        verify(dashboardUseCase).getTodaySummary(any(), any(LocalDate.class));
    }


    @Test
    void getHistoricalMacros_WithValidDates_Returns200AndList() throws Exception {
        // Arrange
        LocalDate startDate = LocalDate.of(2026, 5, 1);
        LocalDate endDate = LocalDate.of(2026, 5, 7);

        DailyMacroSummary summary = new DailyMacroSummary(startDate.toString(), 2000.0, 150.0, 200.0, 50.0);

        when(dashboardUseCase.getHistoricalMacros(any(), eq(startDate), eq(endDate)))
                .thenReturn(List.of(summary));

        // Act & Assert
        mockMvc.perform(get("/api/v1/tracking/dashboard/history")
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].date").value(startDate.toString()))
                .andExpect(jsonPath("$[0].totalCalories").value(2000.0));
    }

    @Test
    void getHistoricalMacros_MissingRequiredParam_ThrowsInternalErrorByGlobalHandler() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/v1/tracking/dashboard/history")
                        .param("startDate", "2026-05-01")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void getHistoricalMacros_WithInvalidDateFormat_ThrowsInternalErrorByGlobalHandler() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/v1/tracking/dashboard/history")
                        .param("startDate", "01-05-2026")
                        .param("endDate", "2026-05-07")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }
}
