package com.healthcore.identity.infrastructure.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.identity.infrastructure.config.MessagingProperties;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMessagingConfig {

    @Bean
    public TopicExchange identityExchange(MessagingProperties messagingProperties) {
        return new TopicExchange(messagingProperties.exchange(), true, false);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter(ObjectMapper objectMapper) {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);
        // Use INFERRED precedence so the consumer uses its own parameter type 
        // instead of the __TypeId__ header sent by the producer.
        org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper typeMapper = 
            new org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper();
        typeMapper.setTypePrecedence(org.springframework.amqp.support.converter.Jackson2JavaTypeMapper.TypePrecedence.INFERRED);
        typeMapper.setTrustedPackages("*");
        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, Jackson2JsonMessageConverter messageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter);
        return rabbitTemplate;
    }
}
