package com.healthcore.notification_service.infrastructure.config;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.port.UserDirectoryPort;
import com.healthcore.notification_service.application.usecase.SendPasswordResetEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendAppointmentCancelledEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendAppointmentConfirmedEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendAppointmentReminderEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendWelcomeEmailUseCase;
import com.healthcore.notification_service.application.usecase.TemplateService;
import com.healthcore.notification_service.infrastructure.email.ResendEmailClient;
import com.healthcore.notification_service.infrastructure.email.ResendEmailSender;
import com.healthcore.notification_service.infrastructure.email.ResendSdkEmailClient;
import com.resend.Resend;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class NotificationServiceConfig {

    @Bean
    public ResendEmailClient resendEmailClient(ResendProperties resendProperties) {
        return new ResendSdkEmailClient(new Resend(resendProperties.apiKey()));
    }

    @Bean
    public EmailSender emailSender(ResendEmailClient resendEmailClient, ResendProperties resendProperties) {
        return new ResendEmailSender(resendEmailClient, resendProperties);
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
