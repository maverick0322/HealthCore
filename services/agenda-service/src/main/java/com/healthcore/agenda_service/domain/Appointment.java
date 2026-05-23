package com.healthcore.agenda_service.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "appointments")
public class Appointment {

    @Id
    private String id;
    private String slotId;
    private String nutritionistId;
    private String patientId;
    private Instant startTime;
    private Instant endTime;
    private AppointmentStatus status;
    private String locale;
    private Instant cancelledAt;
    private String cancelledBy;
    private String cancellationReason;
    private Instant attendedAt;
    private Instant createdAt;
    private Instant updatedAt;

    @Version
    private Long version;
}

