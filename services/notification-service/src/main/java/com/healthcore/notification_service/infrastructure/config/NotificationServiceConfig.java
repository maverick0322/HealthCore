package com.healthcore.notification_service.infrastructure.config;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.port.NotificationIdempotencyStore;
import com.healthcore.notification_service.application.port.UserDirectoryPort;
import com.healthcore.notification_service.application.usecase.IdempotentEmailSender;
import com.healthcore.notification_service.application.usecase.SendPasswordResetEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendAppointmentCancelledEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendAppointmentConfirmedEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendAppointmentReminderEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendWelcomeEmailUseCase;
import com.healthcore.notification_service.application.usecase.TemplateService;
import com.healthcore.notification_service.infrastructure.email.ResendEmailClient;
import com.healthcore.notification_service.infrastructure.email.ResendEmailSender;
import com.healthcore.notification_service.infrastructure.email.ResendSdkEmailClient;
import com.healthcore.notification_service.infrastructure.idempotency.InMemoryNotificationIdempotencyStore;
import com.resend.Resend;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.Duration;

@Configuration
public class NotificationServiceConfig {

    @Bean
    public ResendEmailClient resendEmailClient(ResendProperties resendProperties) {
        return new ResendSdkEmailClient(new Resend(resendProperties.apiKey()));
    }

    @Bean
    public EmailSender emailSender(
            ResendEmailClient resendEmailClient,
            ResendProperties resendProperties,
            NotificationIdempotencyStore notificationIdempotencyStore
    ) {
        EmailSender resendEmailSender = new ResendEmailSender(resendEmailClient, resendProperties);
        return new IdempotentEmailSender(resendEmailSender, notificationIdempotencyStore);
    }

    @Bean
    public NotificationIdempotencyStore notificationIdempotencyStore(
            Clock systemClock,
            @Value("${app.idempotency.sent-ttl:PT24H}") Duration sentTtl,
            @Value("${app.idempotency.in-progress-ttl:PT5M}") Duration inProgressTtl,
            @Value("${app.idempotency.max-entries:10000}") int maxEntries
    ) {
        return new InMemoryNotificationIdempotencyStore(systemClock, sentTtl, inProgressTtl, maxEntries);
    }

    @Bean
    public SendWelcomeEmailUseCase sendWelcomeEmailUseCase(EmailSender emailSender, Clock systemClock, TemplateService templateService) {
        return new SendWelcomeEmailUseCase(emailSender, systemClock, templateService);
    }

    @Bean
    public SendPasswordResetEmailUseCase sendPasswordResetEmailUseCase(EmailSender emailSender, Clock systemClock, TemplateService templateService) {
        return new SendPasswordResetEmailUseCase(emailSender, systemClock, templateService);
    }

    @Bean
    public SendAppointmentConfirmedEmailUseCase sendAppointmentConfirmedEmailUseCase(
            EmailSender emailSender,
            UserDirectoryPort userDirectoryPort,
            TemplateService templateService
    ) {
        return new SendAppointmentConfirmedEmailUseCase(emailSender, userDirectoryPort, templateService);
    }

    @Bean
    public SendAppointmentCancelledEmailUseCase sendAppointmentCancelledEmailUseCase(
            EmailSender emailSender,
            UserDirectoryPort userDirectoryPort,
            TemplateService templateService
    ) {
        return new SendAppointmentCancelledEmailUseCase(emailSender, userDirectoryPort, templateService);
    }

    @Bean
    public SendAppointmentReminderEmailUseCase sendAppointmentReminderEmailUseCase(
            EmailSender emailSender,
            UserDirectoryPort userDirectoryPort,
            TemplateService templateService
    ) {
        return new SendAppointmentReminderEmailUseCase(emailSender, userDirectoryPort, templateService);
    }

    @Bean
    public Clock systemClock() {
        return Clock.systemUTC();
    }
}
