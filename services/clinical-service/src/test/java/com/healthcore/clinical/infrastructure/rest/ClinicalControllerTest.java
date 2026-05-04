package com.healthcore.clinical.infrastructure.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.clinical.application.service.ClinicalApplicationService;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateWeightRequest;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ClinicalController.class)
class ClinicalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ClinicalApplicationService clinicalApplicationService;

    @Test
    void shouldCreateProfileAndReturnOk() throws Exception {
        CreateProfileRequest request = new CreateProfileRequest(
                75.5, 180.0, LocalDate.of(1995, 1, 1), "MALE", "MODERATELY_ACTIVE"
        );
        PatientProfile mockProfile = Mockito.mock(PatientProfile.class);
        when(clinicalApplicationService.createProfile(any())).thenReturn(mockProfile);

        mockMvc.perform(post("/api/v1/clinical/profile")
                .header("X-User-Id", "user-123") 
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk()); 
    }

    @Test
    void shouldGetGoalsAndReturnOk() throws Exception {
        com.healthcore.clinical.domain.model.HealthGoal mockGoal = Mockito.mock(com.healthcore.clinical.domain.model.HealthGoal.class);
        when(mockGoal.targetCalories()).thenReturn(2500);
        when(mockGoal.targetProtein()).thenReturn(150);
        when(mockGoal.targetCarbs()).thenReturn(250);
        when(mockGoal.targetFat()).thenReturn(70);

        PatientProfile mockProfile = Mockito.mock(PatientProfile.class);
        when(mockProfile.generateHealthGoals()).thenReturn(mockGoal); 
        when(clinicalApplicationService.getProfileByUserId("user-123")).thenReturn(Optional.of(mockProfile));

        mockMvc.perform(get("/api/v1/clinical/goals/me")
                .header("X-User-Id", "user-123"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturnOkWhenUpdatingWeight() throws Exception {
        UpdateWeightRequest request = new UpdateWeightRequest(80.5);

        com.healthcore.clinical.domain.model.HealthGoal mockGoal = Mockito.mock(com.healthcore.clinical.domain.model.HealthGoal.class);
        when(mockGoal.targetCalories()).thenReturn(2600);
        when(mockGoal.targetProtein()).thenReturn(160);
        when(mockGoal.targetCarbs()).thenReturn(260);
        when(mockGoal.targetFat()).thenReturn(75);

        when(clinicalApplicationService.updateWeight(eq("user-123"), eq(80.5))).thenReturn(mockGoal);

        mockMvc.perform(post("/api/v1/clinical/weight")
                .header("X-User-Id", "user-123")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetCalories").value(2600)); // Verifica que regrese la nueva meta calculada

        verify(clinicalApplicationService).updateWeight("user-123", 80.5);
    }

    @Test
    void shouldReturnOkAndListWhenGettingWeightHistory() throws Exception {
        List<WeightRecord> history = List.of(
                new WeightRecord(70.0, LocalDate.now().minusDays(10)),
                new WeightRecord(68.5, LocalDate.now())
        );

        when(clinicalApplicationService.getWeightHistory("user-123")).thenReturn(history);

        mockMvc.perform(get("/api/v1/clinical/weight/history")
                .header("X-User-Id", "user-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].weightKg").value(70.0))
                .andExpect(jsonPath("$[1].weightKg").value(68.5));
    }
}