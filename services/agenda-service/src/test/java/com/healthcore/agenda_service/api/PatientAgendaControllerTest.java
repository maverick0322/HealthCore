package com.healthcore.agenda_service.api;

import com.healthcore.agenda_service.application.CreateAppointmentCommand;
import com.healthcore.agenda_service.application.PatientAppointmentService;
import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.TimeSlot;
import com.healthcore.agenda_service.domain.TimeSlotOrigin;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PatientAgendaController.class, properties = "jwt.secret=test-secret-key-at-least-32-characters-long")
@org.springframework.test.context.ContextConfiguration(classes = com.healthcore.agenda_service.AgendaServiceApplication.class)
class PatientAgendaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PatientAppointmentService service;

    @MockitoBean
    private com.healthcore.agenda_service.domain.repository.AppointmentRepository appointmentRepository;

    @MockitoBean
    private com.healthcore.agenda_service.domain.repository.TimeSlotRepository timeSlotRepository;

    @MockitoBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @MockitoBean
    private com.healthcore.agenda_service.infrastructure.clinical.ClinicalServiceClient clinicalServiceClient;

    @Test
    @WithMockUser(username = "patient-1")
    void postAppointments_shouldCreatePendingAppointment() throws Exception {
        Appointment created = Appointment.builder()
            .id("app-1")
            .slotId("slot-1")
            .patientId("patient-1")
            .nutritionistId("nutri-1")
            .status(AppointmentStatus.PENDING)
            .startTime(Instant.parse("2026-04-22T10:00:00Z"))
            .endTime(Instant.parse("2026-04-22T10:30:00Z"))
            .locale("es")
            .build();

        when(service.createAppointment(eq("patient-1"), eq(new CreateAppointmentCommand("slot-1", 1L, "es"))))
            .thenReturn(created);

        mockMvc.perform(post("/api/v1/agenda/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"slotId\":\"slot-1\",\"slotVersion\":1,\"nutritionistId\":\"nutri-1\",\"locale\":\"es\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value("app-1"))
            .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @WithMockUser(username = "patient-1")
    void getAvailability_shouldReturnSlots() throws Exception {
        TimeSlot slot = TimeSlot.builder()
            .id("slot-1")
            .nutritionistId("nutri-1")
            .startTime(Instant.parse("2026-04-22T10:00:00Z"))
            .endTime(Instant.parse("2026-04-22T10:30:00Z"))
            .version(1L)
            .origin(TimeSlotOrigin.PREDEFINED)
            .active(true)
            .reserved(false)
            .build();

        when(service.getAvailability(
            eq("nutri-1"),
            eq(Instant.parse("2026-04-22T00:00:00Z")),
            eq(Instant.parse("2026-04-23T00:00:00Z"))
        )).thenReturn(List.of(slot));

        mockMvc.perform(get("/api/v1/agenda/availability/nutri-1")
                .param("from", "2026-04-22T00:00:00Z")
                .param("to", "2026-04-23T00:00:00Z"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("slot-1"))
            .andExpect(jsonPath("$[0].version").value(1));
    }

    @Test
    @WithMockUser(username = "patient-1")
    void patchCancel_shouldCancelAppointment() throws Exception {
        mockMvc.perform(patch("/api/v1/agenda/appointments/app-1/cancel").with(csrf()))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "patient-1")
    void putReschedule_shouldRescheduleAppointment() throws Exception {
        Appointment updated = Appointment.builder()
            .id("app-1")
            .slotId("slot-2")
            .patientId("patient-1")
            .nutritionistId("nutri-1")
            .status(AppointmentStatus.PENDING)
            .startTime(Instant.parse("2026-04-22T11:00:00Z"))
            .endTime(Instant.parse("2026-04-22T11:30:00Z"))
            .locale("es")
            .build();

        when(service.rescheduleAppointment(eq("patient-1"), eq("app-1"), eq(new CreateAppointmentCommand("slot-2", 1L, "es"))))
            .thenReturn(updated);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/agenda/appointments/app-1/reschedule")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newSlotId\":\"slot-2\",\"newSlotVersion\":1,\"locale\":\"es\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("app-1"))
            .andExpect(jsonPath("$.slotId").value("slot-2"));
    }
}
