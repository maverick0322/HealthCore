package com.healthcore.notification_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.connection.Connection;
import com.rabbitmq.client.Channel;
import org.mockito.Mockito;

@SpringBootTest
class NotificationServiceApplicationTests {

    @TestConfiguration
    static class MockRabbitConfig {
        @Bean
        public ConnectionFactory connectionFactory() {
            ConnectionFactory factory = Mockito.mock(ConnectionFactory.class);
            Connection connection = Mockito.mock(Connection.class);
            Channel channel = Mockito.mock(Channel.class);
            
            Mockito.when(factory.createConnection()).thenReturn(connection);
            Mockito.when(connection.createChannel(Mockito.anyBoolean())).thenReturn(channel);
            
            return factory;
        }
    }

	@Test
	void contextLoads() {
	}
}
