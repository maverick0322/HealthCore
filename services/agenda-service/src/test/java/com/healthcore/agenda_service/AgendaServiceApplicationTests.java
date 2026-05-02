package com.healthcore.agenda_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.healthcore.agenda_service.domain.repository.AppointmentRepository;
import com.healthcore.agenda_service.domain.repository.TimeSlotRepository;

import static org.assertj.core.api.Assertions.assertThat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

@SpringBootTest(classes = AgendaServiceApplication.class, properties = "jwt.secret=test-secret-key-at-least-32-characters-long")
class AgendaServiceApplicationTests {

    @Autowired
    private ApplicationContext applicationContext;

    @MockitoBean
    private AppointmentRepository appointmentRepository;

    @MockitoBean
    private TimeSlotRepository timeSlotRepository;

    @MockitoBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @MockitoBean
    private com.healthcore.agenda_service.infrastructure.clinical.ClinicalServiceClient clinicalServiceClient;

	@Test
	void contextLoads() {
        assertThat(applicationContext).isNotNull();
	}

}
