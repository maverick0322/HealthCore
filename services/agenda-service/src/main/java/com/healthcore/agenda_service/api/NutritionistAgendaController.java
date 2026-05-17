package com.healthcore.agenda_service.api;

import com.healthcore.agenda_service.api.dto.AppointmentResponse;
import com.healthcore.agenda_service.api.dto.AvailabilitySlotResponse;
import com.healthcore.agenda_service.api.dto.GenerateSlotsRequest;
import com.healthcore.agenda_service.application.GenerateSlotsCommand;
import com.healthcore.agenda_service.application.NutritionistAvailabilityService;
import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.TimeSlot;
import com.healthcore.agenda_service.domain.exception.BadRequestException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Tag(name = "Agenda Nutriólogo", description = "Operaciones de configuración de disponibilidad y agenda para nutriólogos")
@RestController
@RequestMapping("/api/v1/agenda/nutritionist")
@RequiredArgsConstructor
public class NutritionistAgendaController {

    private final NutritionistAvailabilityService nutritionistAvailabilityService;

    @Value("${agenda.default-time-zone:America/Mexico_City}")
    private String defaultTimeZone;

    @Operation(summary = "Generar slots de disponibilidad", description = "Genera en bloque los horarios de atención (TimeSlots) para el nutriólogo autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Horarios generados exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
        @ApiResponse(responseCode = "401", description = "No autorizado")
    })
    @PostMapping("/slots/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public List<AvailabilitySlotResponse> generateSlots(
        Authentication authentication,
        @Valid @RequestBody GenerateSlotsRequest request
    ) {
        String nutritionistId = currentNutritionistId(authentication);
        return nutritionistAvailabilityService.generateTimeSlots(
            nutritionistId,
            toGenerateSlotsCommand(request)
        ).stream().map(this::toAvailabilityResponse).toList();
    }

    @Operation(summary = "Consultar mis slots", description = "Devuelve la lista de horarios que el nutriólogo ha configurado en un rango de fechas.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista de horarios obtenida exitosamente"),
        @ApiResponse(responseCode = "400", description = "Rango de fechas inválido"),
        @ApiResponse(responseCode = "401", description = "No autorizado")
    })
    @GetMapping("/slots")
    public List<AvailabilitySlotResponse> getMySlots(
        Authentication authentication,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        if (from == null || to == null || !from.isBefore(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rango de fechas invalido");
        }
        String nutritionistId = currentNutritionistId(authentication);
        return nutritionistAvailabilityService.getNutritionistSlots(nutritionistId, from, to)
            .stream()
            .map(this::toAvailabilityResponse)
            .toList();
    }

    @Operation(summary = "Desactivar un slot", description = "Deshabilita un horario. Si está reservado y faltan más de 24 hrs, cancela la cita automáticamente.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Horario desactivado exitosamente"),
        @ApiResponse(responseCode = "400", description = "No se puede desactivar un horario a menos de 24 horas de ocurrir"),
        @ApiResponse(responseCode = "401", description = "No autorizado"),
        @ApiResponse(responseCode = "403", description = "El horario no pertenece al nutriólogo"),
        @ApiResponse(responseCode = "404", description = "Horario no encontrado")
    })
    @PatchMapping("/slots/{id}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateSlot(
        Authentication authentication,
        @PathVariable("id") String slotId
    ) {
        String nutritionistId = currentNutritionistId(authentication);
        nutritionistAvailabilityService.deactivateTimeSlot(nutritionistId, slotId);
    }

    @Operation(summary = "Consultar mis citas", description = "Devuelve las citas que han sido reservadas con el nutriólogo autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista de citas obtenida exitosamente"),
        @ApiResponse(responseCode = "400", description = "Rango de fechas inválido"),
        @ApiResponse(responseCode = "401", description = "No autorizado")
    })
    @GetMapping("/appointments")
    public List<AppointmentResponse> getMyAppointments(
        Authentication authentication,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        if (from == null || to == null || !from.isBefore(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rango de fechas invalido");
        }
        String nutritionistId = currentNutritionistId(authentication);
        return nutritionistAvailabilityService.getNutritionistAppointments(nutritionistId, from, to)
            .stream()
            .map(this::toAppointmentResponse)
            .toList();
    }

    private String currentNutritionistId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalido o ausente");
        }
        return authentication.getName();
    }

    private GenerateSlotsCommand toGenerateSlotsCommand(GenerateSlotsRequest request) {
        if (request == null) {
            throw new BadRequestException("Payload invalido");
        }

        ZoneId timeZone = resolveTimeZone(request.timeZone());
        Integer durationMinutes = request.durationMinutes();
        if (durationMinutes == null) {
            throw new BadRequestException("La duracion del slot es requerida");
        }

        List<GenerateSlotsCommand.DaySchedule> days = request.days() != null && !request.days().isEmpty()
            ? mapExplicitDays(request)
            : mapLegacyRange(request);

        return new GenerateSlotsCommand(timeZone, durationMinutes, days);
    }

    private ZoneId resolveTimeZone(String requestedTimeZone) {
        String zone = requestedTimeZone == null || requestedTimeZone.isBlank()
            ? defaultTimeZone
            : requestedTimeZone.trim();
        try {
            return ZoneId.of(zone);
        } catch (DateTimeException ex) {
            throw new BadRequestException("Zona horaria invalida");
        }
    }

    private List<GenerateSlotsCommand.DaySchedule> mapExplicitDays(GenerateSlotsRequest request) {
        return request.days().stream()
            .map(day -> day == null
                ? new GenerateSlotsCommand.DaySchedule(null, List.of())
                : new GenerateSlotsCommand.DaySchedule(
                    day.date(),
                    day.blocks() == null
                    ? List.of()
                    : day.blocks().stream()
                        .map(block -> block == null
                            ? new GenerateSlotsCommand.TimeBlock(null, null)
                            : new GenerateSlotsCommand.TimeBlock(block.startTime(), block.endTime()))
                        .toList()
                ))
            .toList();
    }

    private List<GenerateSlotsCommand.DaySchedule> mapLegacyRange(GenerateSlotsRequest request) {
        if (request.startDate() == null || request.endDate() == null
            || request.startTime() == null || request.endTime() == null) {
            throw new BadRequestException("Debes enviar dias con bloques o el formato legacy completo");
        }
        if (request.startDate().isAfter(request.endDate())) {
            throw new BadRequestException("La fecha inicial debe ser anterior o igual a la fecha final");
        }

        List<GenerateSlotsCommand.DaySchedule> days = new ArrayList<>();
        LocalDate currentDate = request.startDate();
        while (!currentDate.isAfter(request.endDate())) {
            days.add(new GenerateSlotsCommand.DaySchedule(
                currentDate,
                List.of(new GenerateSlotsCommand.TimeBlock(request.startTime(), request.endTime()))
            ));
            currentDate = currentDate.plusDays(1);
        }
        return days;
    }

    private AppointmentResponse toAppointmentResponse(Appointment appointment) {
        return new AppointmentResponse(
            appointment.getId(),
            appointment.getSlotId(),
            appointment.getNutritionistId(),
            appointment.getPatientId(),
            appointment.getStartTime(),
            appointment.getEndTime(),
            appointment.getStatus(),
            appointment.getVersion()
        );
    }

    private AvailabilitySlotResponse toAvailabilityResponse(TimeSlot slot) {
        return new AvailabilitySlotResponse(
            slot.getId(),
            slot.getNutritionistId(),
            slot.getStartTime(),
            slot.getEndTime(),
            slot.getOrigin(),
            slot.getVersion(),
            slot.isReserved(),
            slot.isActive()
        );
    }
}
