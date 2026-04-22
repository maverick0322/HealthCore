package com.healthcore.agenda_service.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "time_slots")
@CompoundIndex(name = "uq_nutritionist_start", def = "{'nutritionistId': 1, 'startTime': 1}", unique = true)
public class TimeSlot {

    @Id
    private String id;
    private String nutritionistId;
    private Instant startTime;
    private Instant endTime;
    private boolean reserved;
    private String reservedByPatientId;
    private boolean active;
    private TimeSlotOrigin origin;

    @Version
    private Long version;
}

