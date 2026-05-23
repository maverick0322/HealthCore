package com.healthcore.notification_service.infrastructure.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.healthcore.notification_service.infrastructure.config.MessagingProperties;
import org.aopalliance.aop.Advice;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.retry.MessageRecoverer;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.backoff.ExponentialBackOffPolicy;
import org.springframework.retry.interceptor.RetryOperationsInterceptor;
import org.springframework.retry.policy.SimpleRetryPolicy;
import org.springframework.retry.support.RetryTemplate;

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
    public TopicExchange deadLetterExchange(MessagingProperties messagingProperties) {
        return new TopicExchange(messagingProperties.deadLetterExchange(), true, false);
    }

    @Bean
    public Queue welcomeEmailQueue(MessagingProperties messagingProperties) {
        return buildDurableQueueWithDlq(messagingProperties.queues().welcomeEmail(), messagingProperties);
    }

    @Bean
    public Queue passwordResetEmailQueue(MessagingProperties messagingProperties) {
        return buildDurableQueueWithDlq(messagingProperties.queues().passwordResetEmail(), messagingProperties);
    }

    @Bean
    public Queue appointmentConfirmedQueue(MessagingProperties messagingProperties) {
        return buildDurableQueueWithDlq(messagingProperties.queues().appointmentConfirmedEmail(), messagingProperties);
    }

    @Bean
    public Queue appointmentCancelledQueue(MessagingProperties messagingProperties) {
        return buildDurableQueueWithDlq(messagingProperties.queues().appointmentCancelledEmail(), messagingProperties);
    }

    @Bean
    public Queue appointmentReminderQueue(MessagingProperties messagingProperties) {
        return buildDurableQueueWithDlq(messagingProperties.queues().appointmentReminderEmail(), messagingProperties);
    }

    @Bean
    public Queue welcomeEmailDlqQueue(MessagingProperties messagingProperties) {
        return QueueBuilder.durable(dlqName(messagingProperties.queues().welcomeEmail(), messagingProperties)).build();
    }

    @Bean
    public Queue passwordResetDlqQueue(MessagingProperties messagingProperties) {
        return QueueBuilder.durable(dlqName(messagingProperties.queues().passwordResetEmail(), messagingProperties)).build();
    }

    @Bean
    public Queue appointmentConfirmedDlqQueue(MessagingProperties messagingProperties) {
        return QueueBuilder.durable(dlqName(messagingProperties.queues().appointmentConfirmedEmail(), messagingProperties)).build();
    }

    @Bean
    public Queue appointmentCancelledDlqQueue(MessagingProperties messagingProperties) {
        return QueueBuilder.durable(dlqName(messagingProperties.queues().appointmentCancelledEmail(), messagingProperties)).build();
    }

    @Bean
    public Queue appointmentReminderDlqQueue(MessagingProperties messagingProperties) {
        return QueueBuilder.durable(dlqName(messagingProperties.queues().appointmentReminderEmail(), messagingProperties)).build();
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
    public Binding welcomeEmailDlqBinding(TopicExchange deadLetterExchange, Queue welcomeEmailDlqQueue, MessagingProperties messagingProperties) {
        return BindingBuilder.bind(welcomeEmailDlqQueue)
                .to(deadLetterExchange)
                .with(dlqName(messagingProperties.queues().welcomeEmail(), messagingProperties));
    }

    @Bean
    public Binding passwordResetDlqBinding(TopicExchange deadLetterExchange, Queue passwordResetDlqQueue, MessagingProperties messagingProperties) {
        return BindingBuilder.bind(passwordResetDlqQueue)
                .to(deadLetterExchange)
                .with(dlqName(messagingProperties.queues().passwordResetEmail(), messagingProperties));
    }

    @Bean
    public Binding appointmentConfirmedDlqBinding(TopicExchange deadLetterExchange, Queue appointmentConfirmedDlqQueue, MessagingProperties messagingProperties) {
        return BindingBuilder.bind(appointmentConfirmedDlqQueue)
                .to(deadLetterExchange)
                .with(dlqName(messagingProperties.queues().appointmentConfirmedEmail(), messagingProperties));
    }

    @Bean
    public Binding appointmentCancelledDlqBinding(TopicExchange deadLetterExchange, Queue appointmentCancelledDlqQueue, MessagingProperties messagingProperties) {
        return BindingBuilder.bind(appointmentCancelledDlqQueue)
                .to(deadLetterExchange)
                .with(dlqName(messagingProperties.queues().appointmentCancelledEmail(), messagingProperties));
    }

    @Bean
    public Binding appointmentReminderDlqBinding(TopicExchange deadLetterExchange, Queue appointmentReminderDlqQueue, MessagingProperties messagingProperties) {
        return BindingBuilder.bind(appointmentReminderDlqQueue)
                .to(deadLetterExchange)
                .with(dlqName(messagingProperties.queues().appointmentReminderEmail(), messagingProperties));
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter messageConverter, RetryTemplate retryTemplate) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter);
        rabbitTemplate.setRetryTemplate(retryTemplate);
        return rabbitTemplate;
    }

    @Bean
    public RetryTemplate retryTemplate() {
        RetryTemplate retryTemplate = new RetryTemplate();

        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(3);
        retryTemplate.setRetryPolicy(retryPolicy);

        ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
        backOffPolicy.setInitialInterval(1000);
        backOffPolicy.setMultiplier(2.0);
        backOffPolicy.setMaxInterval(10000);
        retryTemplate.setBackOffPolicy(backOffPolicy);

        return retryTemplate;
    }

    @Bean
    public MessageRecoverer messageRecoverer(RabbitTemplate rabbitTemplate, MessagingProperties messagingProperties) {
        return new DeadLetteringMessageRecoverer(rabbitTemplate, messagingProperties);
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter messageConverter,
            RetryTemplate retryTemplate,
            MessageRecoverer messageRecoverer,
            @Value("${app.messaging.listener.prefetch-count:5}") int prefetchCount,
            @Value("${app.messaging.listener.concurrent-consumers:2}") int concurrentConsumers,
            @Value("${app.messaging.listener.max-concurrent-consumers:4}") int maxConcurrentConsumers,
            @Value("${spring.rabbitmq.listener.simple.default-requeue-rejected:false}") boolean defaultRequeueRejected,
            @Value("${spring.rabbitmq.listener.simple.missing-queues-fatal:false}") boolean missingQueuesFatal
    ) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter);
        factory.setPrefetchCount(prefetchCount);
        factory.setConcurrentConsumers(concurrentConsumers);
        factory.setMaxConcurrentConsumers(maxConcurrentConsumers);
        factory.setDefaultRequeueRejected(defaultRequeueRejected);
        factory.setMissingQueuesFatal(missingQueuesFatal);
        RetryOperationsInterceptor interceptor = RetryInterceptorBuilder.stateless()
                .retryOperations(retryTemplate)
                .recoverer(messageRecoverer)
                .build();
        factory.setAdviceChain(new Advice[] { interceptor });
        return factory;
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule()); // required for Java 8 date/time type serialization
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    @Bean
    public MessageConverter messageConverter(ObjectMapper objectMapper) {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);
        // Inferred precedence means we trust the listener's target type over the __TypeId__ header
        // from other services — avoids class-not-found errors on cross-service deserialization.
        org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper typeMapper =
            new org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper();
        typeMapper.setTypePrecedence(org.springframework.amqp.support.converter.Jackson2JavaTypeMapper.TypePrecedence.INFERRED);
        // Restrict to HealthCore packages — prevents deserialization gadget attacks via __TypeId__ header.
        typeMapper.setTrustedPackages("com.healthcore.*");
        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }

    private Queue buildDurableQueueWithDlq(String queueName, MessagingProperties messagingProperties) {
        return QueueBuilder.durable(queueName)
                .withArgument("x-dead-letter-exchange", messagingProperties.deadLetterExchange())
                .withArgument("x-dead-letter-routing-key", dlqName(queueName, messagingProperties))
                .build();
    }

    private String dlqName(String queueName, MessagingProperties messagingProperties) {
        return queueName + messagingProperties.deadLetterQueueSuffix();
    }
}
