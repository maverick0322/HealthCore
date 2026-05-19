package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;
import com.healthcore.clinical.domain.port.in.LookupPostalCodeUseCase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PostalCodeReferenceController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class PostalCodeReferenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LookupPostalCodeUseCase lookupPostalCodeUseCase;

    private void setSecurityContext(String userId, String... roles) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        Stream.of(roles)
                                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                                .collect(Collectors.toList())
                )
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldReturnPostalCodeLookupWhenFound() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        when(lookupPostalCodeUseCase.lookupPostalCode("03100")).thenReturn(Optional.of(
                new PostalCodeCatalogEntry(
                        "03100",
                        "Ciudad de Mexico",
                        "Ciudad de Mexico",
                        "Benito Juarez",
                        List.of("Narvarte Oriente", "Narvarte Poniente")
                )
        ));

        mockMvc.perform(get("/api/v1/clinical/reference/postal-codes/03100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postalCode").value("03100"))
                .andExpect(jsonPath("$.municipality").value("Benito Juarez"))
                .andExpect(jsonPath("$.colonies[0]").value("Narvarte Oriente"));
    }

    @Test
    void shouldReturnNotFoundWhenPostalCodeDoesNotExist() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        when(lookupPostalCodeUseCase.lookupPostalCode("99999")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/clinical/reference/postal-codes/99999"))
                .andExpect(status().isNotFound());
    }
}
