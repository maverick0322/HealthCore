package com.healthcore.notification_service.infrastructure.email;

public interface ResendEmailClient {

    void sendEmail(ResendEmailRequest request);
}
