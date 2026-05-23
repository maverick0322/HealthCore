package com.healthcore.notification_service.infrastructure.email;

import com.healthcore.notification_service.application.exception.EmailDeliveryException;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ResendSdkEmailClient implements ResendEmailClient {

    private final Resend resend;

    public ResendSdkEmailClient(Resend resend) {
        this.resend = resend;
    }

    @Override
    public void sendEmail(ResendEmailRequest request) {
        CreateEmailOptions options = CreateEmailOptions.builder()
                .from(request.from())
                .to(request.to())
                .subject(request.subject())
                .html(request.html())
                .text(request.text())
                .build();

        try {
            resend.emails().send(options);
        } catch (ResendException e) {
            log.warn("Failed to send email through Resend. recipients={}", request.to().size(), e);
            throw new EmailDeliveryException("Failed to send email through Resend", e);
        }
    }
}
