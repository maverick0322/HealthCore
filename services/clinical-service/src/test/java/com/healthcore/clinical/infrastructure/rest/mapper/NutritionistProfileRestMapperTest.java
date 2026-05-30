package com.healthcore.clinical.infrastructure.rest.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpsertNutritionistProfileRequest;

class NutritionistProfileRestMapperTest {

    private final NutritionistProfileRestMapper mapper =
            new NutritionistProfileRestMapper(new ClinicAddressRestMapper());

    @Test
    void shouldMapRequestToDomain() {
        UpsertNutritionistProfileRequest request = new UpsertNutritionistProfileRequest(
                "Daniel",
                "Martinez",
                null,
                List.of("CLINICAL"),
                null,
                "12345678",
                List.of("PRESENTIAL", "ONLINE"),
                "5512345678",
                new ClinicAddressRequest(
                        "03100",
                        "Ciudad de Mexico",
                        "Ciudad de Mexico",
                        "Benito Juarez",
                        "Narvarte Oriente",
                        "Xola",
                        "123",
                        null
                ),
                "Especialista en nutricion clinica."
        );

        NutritionistProfile profile = mapper.toDomain("nutri-123", request);

        assertEquals("nutri-123", profile.getUserId());
        assertEquals("03100", profile.getClinicAddress().getPostalCode());
    }

    @Test
    void shouldMapDomainToResponseWithoutPhoto() {
        NutritionistProfile profile = new NutritionistProfile(
                "nutri-123",
                "Daniel",
                "Martinez",
                null,
                List.of("CLINICAL"),
                null,
                "12345678",
                List.of("PRESENTIAL", "ONLINE"),
                "5512345678",
                new ClinicAddress(
                        "03100",
                        "Ciudad de Mexico",
                        "Ciudad de Mexico",
                        "Benito Juarez",
                        "Narvarte Oriente",
                        "Xola",
                        "123",
                        null
                ),
                "Especialista en nutricion clinica.",
                null
        );

        var response = mapper.toResponse(profile, null);

        assertEquals("Daniel Martinez", response.fullName());
        assertNull(response.profilePhotoUrl());
        assertEquals("03100", response.clinicAddress().postalCode());
    }
}
