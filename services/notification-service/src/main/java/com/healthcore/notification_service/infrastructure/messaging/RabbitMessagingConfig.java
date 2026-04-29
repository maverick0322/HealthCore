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
    public TopicExchange agendaExchange(MessagingProperties messagingProperties) {
        return new TopicExchange(messagingProperties.agendaExchange(), true, false);
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
    public Queue appointmentConfirmedQueue(MessagingProperties messagingProperties) {
        return QueueBuilder.durable(messagingProperties.queues().appointmentConfirmedEmail()).build();
    }

    @Bean
    public Queue appointmentCancelledQueue(MessagingProperties messagingProperties) {
        return QueueBuilder.durable(messagingProperties.queues().appointmentCancelledEmail()).build();
    }

    @Bean
    public Queue appointmentReminderQueue(MessagingProperties messagingProperties) {
        return QueueBuilder.durable(messagingProperties.queues().appointmentReminderEmail()).build();
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
    public Binding appointmentConfirmedBinding(TopicExchange agendaExchange, Queue appointmentConfirmedQueue, MessagingProperties messagingProperties) {
        return BindingBuilder.bind(appointmentConfirmedQueue)
                .to(agendaExchange)
                .with(messagingProperties.routingKeys().appointmentConfirmed());
    }

    @Bean
    public Binding appointmentCancelledBinding(TopicExchange agendaExchange, Queue appointmentCancelledQueue, MessagingProperties messagingProperties) {
        return BindingBuilder.bind(appointmentCancelledQueue)
                .to(agendaExchange)
                .with(messagingProperties.routingKeys().appointmentCancelled());
    }

    @Bean
    public Binding appointmentReminderBinding(TopicExchange agendaExchange, Queue appointmentReminderQueue, MessagingProperties messagingProperties) {
        return BindingBuilder.bind(appointmentReminderQueue)
                .to(agendaExchange)
                .with(messagingProperties.routingKeys().appointmentReminder());
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
