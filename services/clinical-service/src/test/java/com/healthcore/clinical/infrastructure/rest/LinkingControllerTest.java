package com.healthcore.clinical.infrastructure.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.clinical.domain.model.LinkingCode;
import com.healthcore.clinical.domain.port.in.LinkingUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.LinkPatientRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = LinkingController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false) 
class LinkingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private LinkingUseCase linkingUseCase;

    private void setSecurityContext(String userId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, null)
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void generateCode_ReturnsOkAndCode() throws Exception {
        setSecurityContext("nutri-123");
        LinkingCode mockCode = new LinkingCode("AB12CD", "nutri-123", LocalDateTime.now());
        when(linkingUseCase.generateLinkingCode("nutri-123")).thenReturn(mockCode);

        mockMvc.perform(post("/api/v1/clinical/linking/generate")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("AB12CD"))
                .andExpect(jsonPath("$.expiresInSeconds").value(900));
    }

    @Test
    void connectPatient_ReturnsOk() throws Exception {
        setSecurityContext("patient-789");
        LinkPatientRequest request = new LinkPatientRequest("AB12CD");

        mockMvc.perform(post("/api/v1/clinical/linking/connect")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(linkingUseCase).linkPatient("patient-789", "AB12CD");
    }

    @Test
    void disconnectByPatient_ReturnsOk() throws Exception {
        setSecurityContext("patient-789");

        mockMvc.perform(post("/api/v1/clinical/linking/disconnect/patient")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(linkingUseCase).unlinkPatient("patient-789");
    }

    @Test
    void disconnectByNutritionist_ReturnsOk() throws Exception {
        setSecurityContext("nutri-123");

        mockMvc.perform(post("/api/v1/clinical/linking/disconnect/nutritionist/patient-789")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(linkingUseCase).unlinkNutritionist("nutri-123", "patient-789");
    }
}