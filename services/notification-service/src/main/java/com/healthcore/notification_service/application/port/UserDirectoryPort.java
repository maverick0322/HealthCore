package com.healthcore.notification_service.application.port;

import java.util.List;
import java.util.Map;

public interface UserDirectoryPort {

    Map<String, String> getEmailsByUserIds(List<String> userIds);
}
