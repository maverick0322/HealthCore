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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
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
        LocalDate targetDate = LocalDate.of(2026, 5, 17);
        TodayDashboardSummary mockSummary = new TodayDashboardSummary(1800.0, 120.0, 150.0, 50.0, 1500, 2, 5);

        when(dashboardUseCase.getTodaySummary(any(), eq(targetDate))).thenReturn(mockSummary);

        mockMvc.perform(get("/api/v1/tracking/dashboard/today")
                        .param("date", targetDate.toString())
                        .principal(new UsernamePasswordAuthenticationToken("user-123", null))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalCalories").value(1800.0))
                .andExpect(jsonPath("$.totalProteins").value(120.0))
                .andExpect(jsonPath("$.totalWaterMl").value(1500));
    }

    @Test
    void getTodaySummary_WithoutDateParam_DefaultsToTodayAndReturns200() throws Exception {
        TodayDashboardSummary mockSummary = new TodayDashboardSummary(0.0, 0.0, 0.0, 0.0, 0, 0, 0);
        when(dashboardUseCase.getTodaySummary(any(), any(LocalDate.class))).thenReturn(mockSummary);

        mockMvc.perform(get("/api/v1/tracking/dashboard/today")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCalories").value(0.0));

        verify(dashboardUseCase).getTodaySummary(any(), any(LocalDate.class));
    }

    @Test
    void getHistoricalMacros_WithValidDates_Returns200AndList() throws Exception {
        LocalDate startDate = LocalDate.of(2026, 5, 1);
        LocalDate endDate = LocalDate.of(2026, 5, 7);

        DailyMacroSummary summary = new DailyMacroSummary(startDate.toString(), 2000.0, 150.0, 200.0, 50.0);

        when(dashboardUseCase.getHistoricalMacros(any(), eq(startDate), eq(endDate)))
                .thenReturn(List.of(summary));

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
        mockMvc.perform(get("/api/v1/tracking/dashboard/history")
                        .param("startDate", "2026-05-01")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void getHistoricalMacros_WithInvalidDateFormat_ThrowsInternalErrorByGlobalHandler() throws Exception {
        mockMvc.perform(get("/api/v1/tracking/dashboard/history")
                        .param("startDate", "01-05-2026")
                        .param("endDate", "2026-05-07")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void getNutritionistPatientTodaySummary_Success() throws Exception {
        LocalDate targetDate = LocalDate.of(2026, 5, 17);
        TodayDashboardSummary mockSummary = new TodayDashboardSummary(1800.0, 120.0, 150.0, 50.0, 1500, 2, 5);

        Authentication auth = new UsernamePasswordAuthenticationToken("nutri-123", null,
                List.of(new SimpleGrantedAuthority("ROLE_NUTRITIONIST")));

        // FIX: Usamos any() en lugar de strings duros para evadir el nulo de @AuthenticationPrincipal en tests
        when(clinicalServiceClient.validateLink(any(), any())).thenReturn(true);
        when(dashboardUseCase.getTodaySummary(any(), eq(targetDate))).thenReturn(mockSummary);

        mockMvc.perform(get("/api/v1/tracking/nutritionist/patients/patient-123/dashboard/today")
                        .param("date", targetDate.toString())
                        .principal(auth)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCalories").value(1800.0));
    }

    @Test
    void getNutritionistPatientTodaySummary_WithoutNutritionistRole_ThrowsAccessDenied() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("patient-123", null,
                List.of(new SimpleGrantedAuthority("ROLE_PATIENT")));

        mockMvc.perform(get("/api/v1/tracking/nutritionist/patients/patient-123/dashboard/today")
                        .principal(auth)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(result -> assertThat(result.getResolvedException())
                        .isInstanceOf(AccessDeniedException.class)
                        .hasMessageContaining("Only nutritionists can access"));
    }

    @Test
    void getNutritionistPatientTodaySummary_WithInvalidLink_ThrowsAccessDenied() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("nutri-123", null,
                List.of(new SimpleGrantedAuthority("ROLE_NUTRITIONIST")));

        // Verificamos el bloqueo explícito forzando a falso
        when(clinicalServiceClient.validateLink(any(), any())).thenReturn(false);

        mockMvc.perform(get("/api/v1/tracking/nutritionist/patients/patient-123/dashboard/today")
                        .principal(auth)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(result -> assertThat(result.getResolvedException())
                        .isInstanceOf(AccessDeniedException.class)
                        .hasMessageContaining("Patient is not linked to this nutritionist"));
    }

    @Test
    void getNutritionistPatientHistoricalMacros_Success() throws Exception {
        LocalDate startDate = LocalDate.of(2026, 5, 1);
        LocalDate endDate = LocalDate.of(2026, 5, 7);
        DailyMacroSummary summary = new DailyMacroSummary(startDate.toString(), 2000.0, 150.0, 200.0, 50.0);

        Authentication auth = new UsernamePasswordAuthenticationToken("nutri-123", null,
                List.of(new SimpleGrantedAuthority("ROLE_NUTRITIONIST")));

        // FIX: Usamos any() aquí también
        when(clinicalServiceClient.validateLink(any(), any())).thenReturn(true);
        when(dashboardUseCase.getHistoricalMacros(any(), eq(startDate), eq(endDate))).thenReturn(List.of(summary));

        mockMvc.perform(get("/api/v1/tracking/nutritionist/patients/patient-123/dashboard/history")
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .principal(auth)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].totalCalories").value(2000.0));
    }
}