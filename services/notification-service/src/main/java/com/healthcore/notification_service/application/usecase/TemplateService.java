package com.healthcore.notification_service.application.usecase;

import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class TemplateService {

    private final MessageSource messageSource;
    private static final Locale DEFAULT_LOCALE = Locale.of("es");

    public TemplateService(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    public Locale getLocale(String localeTag) {
        if (localeTag == null || localeTag.isBlank()) {
            return DEFAULT_LOCALE;
        }
        try {
            return Locale.forLanguageTag(localeTag);
        } catch (Exception e) {
            return DEFAULT_LOCALE;
        }
    }

    public String getMessage(String code, Locale locale, Object... args) {
        String template = messageSource.getMessage(code, null, locale);
        if (args == null || args.length == 0) {
            return template;
        }
        return String.format(template, args);
    }
}
