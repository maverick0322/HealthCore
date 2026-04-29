package com.healthcore.notification_service.infrastructure.config;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.usecase.SendPasswordResetEmailUseCase;
import com.healthcore.notification_service.application.usecase.SendWelcomeEmailUseCase;
import com.healthcore.notification_service.infrastructure.email.ResendEmailClient;
import com.healthcore.notification_service.infrastructure.email.ResendEmailSender;
import com.healthcore.notification_service.infrastructure.email.ResendSdkEmailClient;
import com.resend.Resend;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
    public SendWelcomeEmailUseCase sendWelcomeEmailUseCase(EmailSender emailSender) {
        return new SendWelcomeEmailUseCase(emailSender);
    }

    @Bean
    public SendPasswordResetEmailUseCase sendPasswordResetEmailUseCase(EmailSender emailSender) {
        return new SendPasswordResetEmailUseCase(emailSender);
    }
}
