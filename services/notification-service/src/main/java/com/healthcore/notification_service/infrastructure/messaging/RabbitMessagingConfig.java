package com.healthcore.notification_service.infrastructure.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.healthcore.notification_service.infrastructure.config.MessagingProperties;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMessagingConfig {

    @Bean
    public TopicExchange identityExchange(MessagingProperties messagingProperties) {
        return new TopicExchange(messagingProperties.exchange(), true, false);
    }

    @Bean
    public Queue welcomeEmailQueue(MessagingProperties messagingProperties) {
        return QueueBuilder.durable(messagingProperties.queues().welcomeEmail()).build();
    }

    @Bean
    public Queue passwordResetEmailQueue(MessagingProperties messagingProperties) {
        return QueueBuilder.durable(messagingProperties.queues().passwordResetEmail()).build();
    }

    @Bean
    public Binding welcomeEmailBinding(TopicExchange identityExchange, Queue welcomeEmailQueue, MessagingProperties messagingProperties) {
        return BindingBuilder.bind(welcomeEmailQueue)
                .to(identityExchange)
                .with(messagingProperties.routingKeys().userRegistered());
    }

    @Bean
    public Binding passwordResetBinding(TopicExchange identityExchange, Queue passwordResetEmailQueue, MessagingProperties messagingProperties) {
        return BindingBuilder.bind(passwordResetEmailQueue)
                .to(identityExchange)
                .with(messagingProperties.routingKeys().passwordResetRequested());
    }


    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter messageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter);
        return rabbitTemplate;
    }

     @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule()); // soporte para fechas modernas (LocalDate, etc.)
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    @Bean
    public MessageConverter messageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }
}
