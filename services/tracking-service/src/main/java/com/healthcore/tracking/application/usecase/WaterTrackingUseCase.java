package com.healthcore.tracking.application.usecase;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.model.WaterLog;
import com.healthcore.tracking.domain.port.WaterLogPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Application Service for managing water consumption.
 * Orchestrates domain logic and persistence without exposing infrastructure details.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WaterTrackingUseCase {

    private final WaterLogPort waterLogPort;

    public WaterLog logWaterConsumption(String userId, int amountMl, LocalDateTime consumedAt) {
        if (userId == null || userId.isBlank()) {
            log.warn("Attempted to log water consumption with null or empty userId.");
            throw new InvalidDomainDataException("User identification is required to log water.");
        }

        log.info("Processing water consumption log. userHash={}", logHash(userId));

        WaterLog waterLog = WaterLog.create(userId, amountMl, consumedAt);

        return waterLogPort.save(waterLog);
    }

    public void removeLatestWaterLog(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new InvalidDomainDataException("User identification is required to remove water logs.");
        }

        log.info("Removing latest water log for userHash={}", logHash(userId));

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        waterLogPort.deleteLatest(userId, startOfDay, endOfDay);
    }

    private String logHash(String value) {
        return value == null || value.isBlank() ? "unknown" : Integer.toHexString(value.hashCode());
    }
}
