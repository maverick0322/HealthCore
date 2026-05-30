package com.healthcore.clinical.infrastructure.rest.mapper;

import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressRequest;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpsertNutritionistProfileRequest;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ClinicalProfileRestMapperTest {

    private final ClinicalProfileRestMapper mapper = new ClinicalProfileRestMapper();

    @Test
    void shouldMapCreateProfileRequestToPatientProfile() {
        CreateProfileRequest request = new CreateProfileRequest(
                "Carlos",
                "Gomez",
                null,
                70.0,
                175.0,
                LocalDate.of(1990, 1, 1),
                "male",
                "moderately_active",
                "weight-loss",
                "omnivore",
                List.of("gluten"),
                List.of("cebolla")
        );

        PatientProfile profile = mapper.toPatientProfile("user-123", request);

        assertEquals("user-123", profile.getUserId());
        assertEquals("Carlos", profile.getFirstName());
        assertEquals("MALE", profile.getGender().name());
        assertEquals("MODERATELY_ACTIVE", profile.getActivityLevel().name());
        assertEquals(List.of("gluten"), profile.getAllergies());
        assertEquals(List.of("cebolla"), profile.getExcludedFoods());
    }

    @Test
    void shouldMapNutritionistRequestToDomainProfile() {
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

        NutritionistProfile profile = mapper.toNutritionistProfile("nutri-123", request);

        assertEquals("nutri-123", profile.getUserId());
        assertEquals("Daniel", profile.getFirstName());
        assertEquals(List.of("CLINICAL"), profile.getSpecializations());
        assertEquals("12345678", profile.getProfessionalLicense());
        assertEquals("03100", profile.getClinicAddress().getPostalCode());
    }

    @Test
    void shouldMapNutritionistProfileResponseWithoutPhoto() {
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

        var response = mapper.toNutritionistProfileResponse(profile, null);

        assertEquals("Daniel Martinez", response.fullName());
        assertNull(response.profilePhotoUrl());
        assertEquals("03100", response.clinicAddress().postalCode());
    }
}
