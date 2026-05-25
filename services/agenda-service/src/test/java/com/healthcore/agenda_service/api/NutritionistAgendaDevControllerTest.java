package com.healthcore.agenda_service.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.agenda_service.application.NutritionistAvailabilityService;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = NutritionistAgendaDevController.class,
    properties = {
        "jwt.secret=test-secret-key-at-least-32-characters-long",
        "agenda.dev-tools.enabled=true"
    }
)
@org.springframework.test.context.ContextConfiguration(classes = com.healthcore.agenda_service.AgendaServiceApplication.class)
@AutoConfigureMockMvc
class NutritionistAgendaDevControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private NutritionistAvailabilityService nutritionistAvailabilityService;

    @MockitoBean
    private com.healthcore.agenda_service.domain.repository.AppointmentRepository appointmentRepository;

    @MockitoBean
    private com.healthcore.agenda_service.domain.repository.TimeSlotRepository timeSlotRepository;

    @MockitoBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @MockitoBean
    private com.healthcore.agenda_service.infrastructure.clinical.ClinicalServiceClient clinicalServiceClient;

    @Test
    @WithMockUser(username = "nutri-1", roles = "NUTRITIONIST")
    void applyReportingSeedAdjustments_shouldReturnUpdatedCount() throws Exception {
        when(nutritionistAvailabilityService.applyReportingSeedAdjustments(eq("nutri-1"), anyList()))
            .thenReturn(2);

        Map<String, Object> request = Map.of(
            "appointments",
            List.of(
                Map.of(
                    "appointmentId", "app-1",
                    "startTime", "2026-05-10T16:00:00Z",
                    "endTime", "2026-05-10T16:30:00Z",
                    "status", AppointmentStatus.ATTENDED.name()
                ),
                Map.of(
                    "appointmentId", "app-2",
                    "startTime", "2026-05-12T17:00:00Z",
                    "endTime", "2026-05-12T17:30:00Z",
                    "status", AppointmentStatus.CANCELLED.name()
                )
            )
        );

        mockMvc.perform(post("/api/v1/agenda/nutritionist/dev/appointments/reporting-adjustments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.updatedCount").value(2));

        verify(nutritionistAvailabilityService).applyReportingSeedAdjustments(eq("nutri-1"), anyList());
    }
}
