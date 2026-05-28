package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MongoNutritionistProfileRepositoryAdapterTest {

    @Mock
    private SpringDataMongoNutritionistProfileRepository repository;

    @InjectMocks
    private MongoNutritionistProfileRepositoryAdapter adapter;

    @Test
    void shouldMapNutritionistProfileToDocumentWhenSaving() {
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

        adapter.save(profile);

        ArgumentCaptor<NutritionistProfileDocument> captor =
                ArgumentCaptor.forClass(NutritionistProfileDocument.class);
        verify(repository).save(captor.capture());

        NutritionistProfileDocument saved = captor.getValue();
        assertEquals("nutri-1", saved.getUserId());
        assertEquals("Laura", saved.getFirstName());
        assertEquals(List.of("CLINICAL", "SPORTS"), saved.getSpecializations());
        assertEquals("5512345678", saved.getPhone());
        assertEquals("nutri-1/profile.webp", saved.getProfilePhotoKey());
        assertNotNull(saved.getClinicAddress());
        assertEquals("03100", saved.getClinicAddress().getPostalCode());
        assertEquals("Centro", saved.getClinicAddress().getNeighborhood());
    }

    @Test
    void shouldMapDocumentToNutritionistProfileWhenFindingByUserId() {
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

        when(repository.findById("nutri-1")).thenReturn(Optional.of(document));

        Optional<NutritionistProfile> result = adapter.findByUserId("nutri-1");

        assertTrue(result.isPresent());
        assertEquals("nutri-1", result.get().getUserId());
        assertEquals("Laura Mendez Ruiz", result.get().getFullName());
        assertEquals("nutri-1/profile.webp", result.get().getProfilePhotoKey());
        assertNotNull(result.get().getClinicAddress());
        assertEquals("03100", result.get().getClinicAddress().getPostalCode());
        assertEquals("Av. Reforma", result.get().getClinicAddress().getStreet());
    }

    @Test
    void shouldPreserveNullClinicAddressWhenSavingAndReading() {
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

        adapter.save(profile);

        ArgumentCaptor<NutritionistProfileDocument> captor =
                ArgumentCaptor.forClass(NutritionistProfileDocument.class);
        verify(repository).save(captor.capture());
        assertNull(captor.getValue().getClinicAddress());

        NutritionistProfileDocument document = captor.getValue();
        when(repository.findById("nutri-2")).thenReturn(Optional.of(document));

        Optional<NutritionistProfile> result = adapter.findByUserId("nutri-2");

        assertTrue(result.isPresent());
        assertNull(result.get().getClinicAddress());
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
