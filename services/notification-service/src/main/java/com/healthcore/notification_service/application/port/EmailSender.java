package com.healthcore.notification_service.application.port;

import com.healthcore.notification_service.domain.model.EmailMessage;

public interface EmailSender {

    void send(EmailMessage message);
}
