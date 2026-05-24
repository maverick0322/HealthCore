package com.healthcore.clinical.infrastructure.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.clinical.domain.model.ClinicalObservation;
import com.healthcore.clinical.domain.port.in.ManageObservationsUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.CreateObservationRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateObservationRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ObservationController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class ObservationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ManageObservationsUseCase manageObservationsUseCase;

    private void setSecurityContext(String userId, String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                )
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void recordObservation_ReturnsCreated() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        CreateObservationRequest request = new CreateObservationRequest("patient-123", "Nota clínica.");
        ClinicalObservation observation = new ClinicalObservation(
                "obs-1",
                "patient-123",
                "nutri-123",
                "Nota clínica.",
                LocalDateTime.now()
        );

        when(manageObservationsUseCase.recordObservation("patient-123", "nutri-123", "Nota clínica."))
                .thenReturn(observation);

        mockMvc.perform(post("/api/v1/clinical/observations")
                        .header("X-User-Id", "spoofed-user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("obs-1"))
                .andExpect(jsonPath("$.patientId").value("patient-123"));
    }

    @Test
    void getPatientObservations_ReturnsOkForOwnerNutritionist() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        List<ClinicalObservation> observations = List.of(
                new ClinicalObservation("obs-1", "patient-123", "nutri-123", "Nota clínica.", LocalDateTime.now())
        );

        when(manageObservationsUseCase.getPatientObservations("patient-123", "nutri-123"))
                .thenReturn(observations);

        mockMvc.perform(get("/api/v1/clinical/observations/patient/patient-123")
                        .header("X-User-Id", "spoofed-user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].nutritionistId").value("nutri-123"));

        verify(manageObservationsUseCase).getPatientObservations("patient-123", "nutri-123");
    }

    @Test
    void updateObservation_ReturnsUpdatedObservation() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        UpdateObservationRequest request = new UpdateObservationRequest("Nota actualizada");
        ClinicalObservation observation = new ClinicalObservation(
                "obs-1",
                "patient-123",
                "nutri-123",
                "Nota actualizada",
                LocalDateTime.now()
        );

        when(manageObservationsUseCase.updateObservation("obs-1", "nutri-123", "Nota actualizada"))
                .thenReturn(observation);

        mockMvc.perform(put("/api/v1/clinical/observations/obs-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("obs-1"))
                .andExpect(jsonPath("$.note").value("Nota actualizada"));
    }

    @Test
    void updateObservation_ReturnsBadRequest_WhenNoteExceedsMaxLength() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        UpdateObservationRequest request = new UpdateObservationRequest("a".repeat(501));

        mockMvc.perform(put("/api/v1/clinical/observations/obs-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteObservation_ReturnsNoContent() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");

        mockMvc.perform(delete("/api/v1/clinical/observations/obs-1"))
                .andExpect(status().isNoContent());

        verify(manageObservationsUseCase).deleteObservation("obs-1", "nutri-123");
    }

    @Test
    void getPatientObservations_ReturnsForbidden_WhenPatientDoesNotBelongToNutritionist() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        when(manageObservationsUseCase.getPatientObservations(anyString(), anyString()))
                .thenThrow(new AccessDeniedException("Action denied: Patient is not linked to this nutritionist."));

        mockMvc.perform(get("/api/v1/clinical/observations/patient/patient-123")
                        .header("X-User-Id", "spoofed-user"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    void getMyObservations_ReturnsPatientObservations() throws Exception {
        setSecurityContext("patient-123", "PATIENT");
        List<ClinicalObservation> observations = List.of(
                new ClinicalObservation("obs-1", "patient-123", "nutri-123", "Nota clínica.", LocalDateTime.now())
        );

        when(manageObservationsUseCase.getPatientObservations("patient-123"))
                .thenReturn(observations);

        mockMvc.perform(get("/api/v1/clinical/observations/me")
                        .header("X-User-Id", "spoofed-user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].patientId").value("patient-123"))
                .andExpect(jsonPath("$[0].nutritionistId").value("nutri-123"));

        verify(manageObservationsUseCase).getPatientObservations("patient-123");
    }
}
