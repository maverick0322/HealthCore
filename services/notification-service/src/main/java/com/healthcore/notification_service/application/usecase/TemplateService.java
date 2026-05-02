package com.healthcore.notification_service.application.usecase;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
public class TemplateService {

    private final MessageSource messageSource;
    private final TemplateEngine templateEngine;
    private static final Locale DEFAULT_LOCALE = Locale.of("es");

    public TemplateService(MessageSource messageSource, TemplateEngine templateEngine) {
        this.messageSource = messageSource;
        this.templateEngine = templateEngine;
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
        try {
            String template = messageSource.getMessage(code, null, locale);
            if (args == null || args.length == 0) {
                return template;
            }
            return String.format(template, args);
        } catch (Exception e) {
            log.warn("Could not find message for code: {} in locale: {}", code, locale);
            return code;
        }
    }

    public String render(String templateName, Map<String, Object> variables, Locale locale) {
        try {
            log.debug("Rendering template: {} with locale: {}", templateName, locale);
            Context context = new Context(locale);
            context.setVariables(variables);
            String result = templateEngine.process(templateName, context);
            log.debug("Template rendered successfully. Length: {}", result.length());
            return result;
        } catch (Exception e) {
            log.error("Error rendering Thymeleaf template: {}", templateName, e);
            return null; // Returning null will trigger the fallback to textBody in the use case
        }
    }
}
