package com.healthcore.identity.application.ports;

import com.healthcore.identity.application.events.PasswordResetRequestedEvent;
import com.healthcore.identity.application.events.UserRegisteredEvent;

public interface IdentityEventPublisher {

    void publishUserRegistered(UserRegisteredEvent event);

    void publishPasswordResetRequested(PasswordResetRequestedEvent event);
}
