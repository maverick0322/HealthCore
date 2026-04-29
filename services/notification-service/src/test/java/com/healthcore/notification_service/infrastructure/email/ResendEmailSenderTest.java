package com.healthcore.notification_service.infrastructure.email;

import com.healthcore.notification_service.domain.model.EmailMessage;
import com.healthcore.notification_service.infrastructure.config.ResendProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ResendEmailSenderTest {

    @Test
    void sendBuildsResendRequest() {
        CapturingResendEmailClient client = new CapturingResendEmailClient();
        ResendProperties properties = new ResendProperties(
                "test-key",
                "no-reply@healthcore.com",
                "HealthCore"
        );
        ResendEmailSender sender = new ResendEmailSender(client, properties);

        sender.send(new EmailMessage("user@healthcore.com", "Welcome", "<p>Hello</p>", "Hello"));

        ResendEmailRequest request = client.request;
        assertNotNull(request);
        assertEquals("HealthCore <no-reply@healthcore.com>", request.from());
        assertEquals("user@healthcore.com", request.to().get(0));
        assertEquals("Welcome", request.subject());
        assertEquals("<p>Hello</p>", request.html());
        assertEquals("Hello", request.text());
    }

    private static class CapturingResendEmailClient implements ResendEmailClient {

        private ResendEmailRequest request;

        @Override
        public void sendEmail(ResendEmailRequest request) {
            this.request = request;
        }
    }
}
