package com.healthcore.notification_service.infrastructure.email;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;

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
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }
}
