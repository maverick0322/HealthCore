package com.healthcore.clinical;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

import static org.mockito.Mockito.mockStatic;

class ClinicalServiceApplicationTest {

    @Test
    void shouldDelegateMainMethodToSpringApplicationRun() {
        String[] args = new String[]{"--spring.profiles.active=test"};

        try (MockedStatic<SpringApplication> springApplication = mockStatic(SpringApplication.class)) {
            ClinicalServiceApplication.main(args);

            springApplication.verify(() -> SpringApplication.run(ClinicalServiceApplication.class, args));
        }
    }
}
