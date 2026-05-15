package com.healthcore.agenda_service.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.agenda_service.application.GenerateSlotsCommand;
import com.healthcore.agenda_service.application.NutritionistAvailabilityService;
import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.TimeSlot;
import com.healthcore.agenda_service.domain.TimeSlotOrigin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentCaptor.forClass;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = NutritionistAgendaController.class, properties = "jwt.secret=test-secret-key-at-least-32-characters-long")
@org.springframework.test.context.ContextConfiguration(classes = com.healthcore.agenda_service.AgendaServiceApplication.class)
@AutoConfigureMockMvc
class NutritionistAgendaControllerTest {

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

    private TimeSlot slot;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        slot = TimeSlot.builder()
            .id("slot-1")
            .nutritionistId("nutri-1")
            .startTime(Instant.parse("2027-04-22T10:00:00Z"))
            .endTime(Instant.parse("2027-04-22T10:30:00Z"))
            .reserved(false)
            .active(true)
            .version(1L)
            .origin(TimeSlotOrigin.PREDEFINED)
            .build();

        appointment = Appointment.builder()
            .id("app-1")
            .slotId("slot-1")
            .nutritionistId("nutri-1")
            .patientId("patient-1")
            .startTime(slot.getStartTime())
            .endTime(slot.getEndTime())
            .status(AppointmentStatus.CONFIRMED)
            .version(1L)
            .build();
    }

    @Test
    @WithMockUser(username = "nutri-1")
    void generateSlots_shouldReturnCreatedSlots() throws Exception {
        Map<String, Object> request = Map.of(
            "timeZone", "America/Mexico_City",
            "durationMinutes", 30,
            "days", List.of(Map.of(
                "date", "2027-05-10",
                "blocks", List.of(
                    Map.of("startTime", "10:00", "endTime", "11:00")
                )
            ))
        );

        when(nutritionistAvailabilityService.generateTimeSlots(eq("nutri-1"), any())).thenReturn(List.of(slot));

        mockMvc.perform(post("/api/v1/agenda/nutritionist/slots/generate")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$[0].id").value("slot-1"))
            .andExpect(jsonPath("$[0].reserved").value(false))
            .andExpect(jsonPath("$[0].active").value(true));

        var captor = forClass(GenerateSlotsCommand.class);
        verify(nutritionistAvailabilityService).generateTimeSlots(eq("nutri-1"), captor.capture());
        GenerateSlotsCommand command = captor.getValue();
        org.assertj.core.api.Assertions.assertThat(command.timeZone()).isEqualTo(ZoneId.of("America/Mexico_City"));
        org.assertj.core.api.Assertions.assertThat(command.days()).hasSize(1);
        org.assertj.core.api.Assertions.assertThat(command.days().getFirst().blocks()).hasSize(1);
    }

    @Test
    @WithMockUser(username = "nutri-1")
    void generateSlots_shouldAcceptLegacyPayloadWithDefaultTimeZone() throws Exception {
        Map<String, Object> request = Map.of(
            "durationMinutes", 30,
            "startDate", "2027-05-10",
            "endDate", "2027-05-11",
            "startTime", "10:00",
            "endTime", "11:00"
        );

        when(nutritionistAvailabilityService.generateTimeSlots(eq("nutri-1"), any())).thenReturn(List.of(slot));

        mockMvc.perform(post("/api/v1/agenda/nutritionist/slots/generate")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$[0].id").value("slot-1"));

        var captor = forClass(GenerateSlotsCommand.class);
        verify(nutritionistAvailabilityService).generateTimeSlots(eq("nutri-1"), captor.capture());
        org.assertj.core.api.Assertions.assertThat(captor.getValue().timeZone())
            .isEqualTo(ZoneId.of("America/Mexico_City"));
        org.assertj.core.api.Assertions.assertThat(captor.getValue().days()).hasSize(2);
    }

    @Test
    @WithMockUser(username = "nutri-1")
    void deactivateSlot_shouldReturnNoContent() throws Exception {
        mockMvc.perform(patch("/api/v1/agenda/nutritionist/slots/slot-1/deactivate")
                .with(csrf()))
            .andExpect(status().isNoContent());

        verify(nutritionistAvailabilityService).deactivateTimeSlot("nutri-1", "slot-1");
    }

    @Test
    @WithMockUser(username = "nutri-1")
    void getMySlots_shouldReturnSlots() throws Exception {
        when(nutritionistAvailabilityService.getNutritionistSlots(eq("nutri-1"), any(), any()))
            .thenReturn(List.of(slot));

        mockMvc.perform(get("/api/v1/agenda/nutritionist/slots")
                .param("from", "2027-04-20T00:00:00Z")
                .param("to", "2027-04-25T00:00:00Z"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("slot-1"));
    }

    @Test
    @WithMockUser(username = "nutri-1")
    void getMyAppointments_shouldReturnAppointments() throws Exception {
        when(nutritionistAvailabilityService.getNutritionistAppointments(eq("nutri-1"), any(), any()))
            .thenReturn(List.of(appointment));

        mockMvc.perform(get("/api/v1/agenda/nutritionist/appointments")
                .param("from", "2027-04-20T00:00:00Z")
                .param("to", "2027-04-25T00:00:00Z"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("app-1"));
    }
}
