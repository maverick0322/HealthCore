package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class NutritionistProfileMongoMapperTest {

    private final NutritionistProfileMongoMapper mapper = new NutritionistProfileMongoMapper();

    @Test
    void shouldMapNutritionistProfileToDocument() {
        NutritionistProfile profile = new NutritionistProfile(
                "nutri-1",
                "Laura",
                "Mendez",
                "Ruiz",
                List.of("CLINICAL", "SPORTS"),
                null,
                "1234567",
                List.of("ONLINE", "PRESENTIAL"),
                "5512345678",
                clinicAddress(),
                "Nutritionist focused on sustainable habits.",
                "nutri-1/profile.webp"
        );

        NutritionistProfileDocument document = mapper.toDocument(profile);

        assertEquals("nutri-1", document.getUserId());
        assertEquals("Laura", document.getFirstName());
        assertEquals(List.of("CLINICAL", "SPORTS"), document.getSpecializations());
        assertNotNull(document.getClinicAddress());
        assertEquals("03100", document.getClinicAddress().getPostalCode());
    }

    @Test
    void shouldMapDocumentToNutritionistProfile() {
        NutritionistProfileDocument document = new NutritionistProfileDocument();
        document.setUserId("nutri-1");
        document.setFirstName("Laura");
        document.setPaternalLastName("Mendez");
        document.setMaternalLastName("Ruiz");
        document.setSpecializations(List.of("CLINICAL", "SPORTS"));
        document.setProfessionalLicense("1234567");
        document.setConsultationTypes(List.of("ONLINE", "PRESENTIAL"));
        document.setPhone("5512345678");
        document.setBio("Nutritionist focused on sustainable habits.");
        document.setProfilePhotoKey("nutri-1/profile.webp");

        ClinicAddressDocument address = new ClinicAddressDocument();
        address.setPostalCode("03100");
        address.setState("Ciudad de Mexico");
        address.setCity("Ciudad de Mexico");
        address.setMunicipality("Benito Juarez");
        address.setNeighborhood("Centro");
        address.setStreet("Av. Reforma");
        address.setExteriorNumber("123");
        address.setInteriorNumber("4B");
        document.setClinicAddress(address);

        NutritionistProfile profile = mapper.toDomain(document);

        assertEquals("nutri-1", profile.getUserId());
        assertEquals("Laura Mendez Ruiz", profile.getFullName());
        assertNotNull(profile.getClinicAddress());
        assertEquals("Av. Reforma", profile.getClinicAddress().getStreet());
    }

    @Test
    void shouldPreserveNullClinicAddress() {
        NutritionistProfile profile = new NutritionistProfile(
                "nutri-2",
                "Marco",
                "Lopez",
                null,
                List.of("OTHER"),
                "Functional Nutrition",
                "7654321",
                List.of("ONLINE"),
                null,
                null,
                "Remote care specialist.",
                null
        );

        NutritionistProfileDocument document = mapper.toDocument(profile);
        NutritionistProfile remappedProfile = mapper.toDomain(document);

        assertNull(document.getClinicAddress());
        assertNull(remappedProfile.getClinicAddress());
    }

    private ClinicAddress clinicAddress() {
        return new ClinicAddress(
                "03100",
                "Ciudad de Mexico",
                "Ciudad de Mexico",
                "Benito Juarez",
                "Centro",
                "Av. Reforma",
                "123",
                "4B"
        );
    }
}
