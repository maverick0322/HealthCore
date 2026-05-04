package com.healthcore.clinical.infrastructure.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.clinical.application.service.ClinicalApplicationService;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
                75.5,
                180.0,
                LocalDate.of(1995, 1, 1),
                "MALE",
                "MODERATELY_ACTIVE"
        );

        PatientProfile mockProfile = Mockito.mock(PatientProfile.class);
        when(clinicalApplicationService.createProfile(any())).thenReturn(mockProfile);

        mockMvc.perform(post("/api/v1/clinical/profile")
                .header("X-User-Id", "user-123") 
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk()); 

        verify(clinicalApplicationService).createProfile(any());
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
}