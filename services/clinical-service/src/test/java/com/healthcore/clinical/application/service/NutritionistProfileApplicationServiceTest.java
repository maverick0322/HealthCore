package com.healthcore.clinical.application.service;

import com.healthcore.clinical.application.service.support.ClinicAddressCatalogValidator;
import com.healthcore.clinical.application.service.support.ProfilePhotoKeyValidator;
import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;
import com.healthcore.clinical.domain.port.out.NutritionistProfileRepositoryPort;
import com.healthcore.clinical.domain.port.out.PostalCodeCatalogPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NutritionistProfileApplicationServiceTest {

    @Mock
    private NutritionistProfileRepositoryPort nutritionistRepositoryPort;

    @Mock
    private PostalCodeCatalogPort postalCodeCatalogPort;

    @Test
    void shouldUpdateNutritionistProfile() {
        NutritionistProfile existingProfile = createNutritionistProfile("nutri-123");
        NutritionistProfile updatedProfile = new NutritionistProfile(
                "nutri-123",
                "Daniela",
                "Lopez",
                "Mora",
                List.of("SPORTS", "OTHER"),
                "Nutricion funcional",
                "123456789",
                List.of("ONLINE"),
                "5512345678",
                new ClinicAddress(
                        "03100",
                        "Ciudad de Mexico",
                        "Ciudad de Mexico",
                        "Benito Juarez",
                        "Narvarte Oriente",
                        "Xola",
                        "456",
                        "7B"
                ),
                "Bio actualizada",
                null
        );
        NutritionistProfileApplicationService service = new NutritionistProfileApplicationService(
                nutritionistRepositoryPort,
                new ClinicAddressCatalogValidator(postalCodeCatalogPort),
                new ProfilePhotoKeyValidator()
        );

        when(nutritionistRepositoryPort.findByUserId("nutri-123")).thenReturn(Optional.of(existingProfile));
        when(postalCodeCatalogPort.findByPostalCode("03100")).thenReturn(Optional.of(createPostalCodeEntry("03100")));
        when(nutritionistRepositoryPort.save(existingProfile)).thenReturn(existingProfile);

        NutritionistProfile result = service.updateNutritionistProfile("nutri-123", updatedProfile);

        assertEquals("Daniela", result.getFirstName());
        assertEquals(List.of("ONLINE"), result.getConsultationTypes());
        verify(nutritionistRepositoryPort).save(existingProfile);
    }

    private NutritionistProfile createNutritionistProfile(String userId) {
        return new NutritionistProfile(
                userId,
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
    }

    private PostalCodeCatalogEntry createPostalCodeEntry(String postalCode) {
        return new PostalCodeCatalogEntry(
                postalCode,
                "Ciudad de Mexico",
                "Ciudad de Mexico",
                "Benito Juarez",
                List.of("Narvarte Oriente", "Narvarte Poniente")
        );
    }
}
