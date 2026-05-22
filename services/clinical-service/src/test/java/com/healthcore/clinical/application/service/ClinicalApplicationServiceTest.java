package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.domain.port.out.NutritionistProfileRepositoryPort;
import com.healthcore.clinical.domain.port.out.PostalCodeCatalogPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClinicalApplicationServiceTest {

    @Mock
    private ClinicalRepositoryPort repositoryPort;

    @Mock
    private NutritionistProfileRepositoryPort nutritionistRepositoryPort;

    @Mock
    private PostalCodeCatalogPort postalCodeCatalogPort;

    @InjectMocks
    private ClinicalApplicationService service;

    @Test
    void shouldCreateProfile() {
        PatientProfile profile = createPatientProfile("user-123");

        when(repositoryPort.save(any(PatientProfile.class))).thenReturn(profile);

        PatientProfile savedProfile = service.createProfile(profile);

        assertNotNull(savedProfile);
        assertEquals("user-123", savedProfile.getUserId());
        verify(repositoryPort).save(profile);
    }

    @Test
    void shouldGetProfileByUserId() {
        PatientProfile profile = createPatientProfile("user-123");
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        Optional<PatientProfile> result = service.getProfileByUserId("user-123");

        assertTrue(result.isPresent());
        assertEquals("user-123", result.get().getUserId());
    }

    @Test
    void shouldUpdateWeightAndRecalculateGoals() {
        PatientProfile profile = createPatientProfile("user-123");
        LocalDate targetDate = LocalDate.now();
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        HealthGoal newGoal = service.updateWeight("user-123", 75.0, targetDate);

        assertNotNull(newGoal);
        assertEquals(75.0, profile.getWeightKg());
        assertEquals(2, profile.getWeightHistory().size());
        assertEquals(targetDate, profile.getWeightHistory().get(1).date());
        assertTrue(newGoal.targetWaterGlasses() > 0);
        verify(repositoryPort).save(profile);
    }

    @Test
    void shouldThrowProfileNotFoundExceptionWhenUpdatingUnknownUser() {
        when(repositoryPort.findByUserId("ghost-user")).thenReturn(Optional.empty());

        assertThrows(ProfileNotFoundException.class, () -> service.updateWeight("ghost-user", 80.0, LocalDate.now()));
        verify(repositoryPort, never()).save(any());
    }

    @Test
    void shouldGetWeightHistory() {
        PatientProfile profile = createPatientProfile("user-123");
        profile.registerWeight(68.0, LocalDate.now());

        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        List<WeightRecord> history = service.getWeightHistory("user-123");

        assertNotNull(history);
        assertEquals(2, history.size());
        assertEquals(68.0, history.get(1).weightKg());
    }

    @Test
    void shouldKeepCurrentWeightWhenRegisteringHistoricalWeight() {
        PatientProfile profile = createPatientProfile("user-123");
        LocalDate initialDate = profile.getWeightHistory().get(0).date();
        profile.registerWeight(74.0, LocalDate.now());
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        HealthGoal goal = service.updateWeight("user-123", 68.0, initialDate.minusDays(10));

        assertNotNull(goal);
        assertEquals(74.0, profile.getWeightKg());
        assertEquals(3, profile.getWeightHistory().size());
        verify(repositoryPort).save(profile);
    }

    @Test
    void shouldEditWeightAndRecalculateCurrentProfileState() {
        PatientProfile profile = createPatientProfile("user-123");
        LocalDate initialDate = profile.getWeightHistory().get(0).date();
        LocalDate latestDate = LocalDate.now();
        profile.registerWeight(74.0, latestDate);
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        HealthGoal goal = service.editWeight("user-123", latestDate, 73.0, latestDate.minusDays(1));

        assertNotNull(goal);
        assertEquals(73.0, profile.getWeightKg());
        assertEquals(2, profile.getWeightHistory().size());
        assertEquals(initialDate, profile.getWeightHistory().get(0).date());
        verify(repositoryPort).save(profile);
    }

    @Test
    void shouldDeleteLatestWeightAndRestorePreviousCurrentWeight() {
        PatientProfile profile = createPatientProfile("user-123");
        LocalDate latestDate = LocalDate.now();
        profile.registerWeight(74.0, latestDate);
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        HealthGoal goal = service.deleteWeight("user-123", latestDate);

        assertNotNull(goal);
        assertEquals(70.0, profile.getWeightKg());
        assertEquals(1, profile.getWeightHistory().size());
        verify(repositoryPort).save(profile);
    }

    @Test
    void shouldUpdatePatientProfile() {
        PatientProfile existingProfile = createPatientProfile("user-123");
        PatientProfile updatedProfile = new PatientProfile(
                "user-123",
                "Elena",
                "Solis",
                "Ramos",
                68.0,
                168.0,
                LocalDate.of(1994, 6, 10),
                Gender.FEMALE,
                ActivityLevel.VERY_ACTIVE,
                "performance",
                "vegan",
                List.of("gluten"),
                List.of("cebolla")
        );

        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(existingProfile));
        when(repositoryPort.save(existingProfile)).thenReturn(existingProfile);

        PatientProfile result = service.updateProfile("user-123", updatedProfile);

        assertEquals("Elena", result.getFirstName());
        assertEquals("performance", result.getGoal());
        verify(repositoryPort).save(existingProfile);
    }

    @Test
    void shouldCreateNutritionistProfile() {
        NutritionistProfile profile = createNutritionistProfile("nutri-123");
        when(postalCodeCatalogPort.findByPostalCode("03100")).thenReturn(Optional.of(createPostalCodeEntry("03100")));
        when(nutritionistRepositoryPort.save(profile)).thenReturn(profile);

        NutritionistProfile savedProfile = service.createNutritionistProfile(profile);

        assertEquals("nutri-123", savedProfile.getUserId());
        verify(nutritionistRepositoryPort).save(profile);
    }

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
                "Bio actualizada"
        );

        when(nutritionistRepositoryPort.findByUserId("nutri-123")).thenReturn(Optional.of(existingProfile));
        when(postalCodeCatalogPort.findByPostalCode("03100")).thenReturn(Optional.of(createPostalCodeEntry("03100")));
        when(nutritionistRepositoryPort.save(existingProfile)).thenReturn(existingProfile);

        NutritionistProfile result = service.updateNutritionistProfile("nutri-123", updatedProfile);

        assertEquals("Daniela", result.getFirstName());
        assertEquals(List.of("ONLINE"), result.getConsultationTypes());
        verify(nutritionistRepositoryPort).save(existingProfile);
    }

    @Test
    void shouldAllowManualClinicAddressWhenPostalCodeIsUnknown() {
        NutritionistProfile profile = new NutritionistProfile(
                "nutri-123",
                "Daniel",
                "Martinez",
                null,
                List.of("CLINICAL"),
                null,
                "12345678",
                List.of("PRESENTIAL"),
                "5512345678",
                new ClinicAddress(
                        "99999",
                        "Estado Manual",
                        "Ciudad Manual",
                        "Municipio Manual",
                        "Colonia Manual",
                        "Calle Uno",
                        "123",
                        null
                ),
                "Especialista en nutricion clinica."
        );

        when(postalCodeCatalogPort.findByPostalCode("99999")).thenReturn(Optional.empty());
        when(nutritionistRepositoryPort.save(profile)).thenReturn(profile);

        NutritionistProfile savedProfile = service.createNutritionistProfile(profile);

        assertEquals("99999", savedProfile.getClinicAddress().getPostalCode());
        verify(nutritionistRepositoryPort).save(profile);
    }

    @Test
    void shouldRejectClinicAddressThatDoesNotMatchKnownPostalCode() {
        NutritionistProfile profile = new NutritionistProfile(
                "nutri-123",
                "Daniel",
                "Martinez",
                null,
                List.of("CLINICAL"),
                null,
                "12345678",
                List.of("PRESENTIAL"),
                "5512345678",
                new ClinicAddress(
                        "03100",
                        "Ciudad de Mexico",
                        "Ciudad de Mexico",
                        "Benito Juarez",
                        "Colonia Invalida",
                        "Xola",
                        "123",
                        null
                ),
                "Especialista en nutricion clinica."
        );

        when(postalCodeCatalogPort.findByPostalCode("03100")).thenReturn(Optional.of(createPostalCodeEntry("03100")));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.createNutritionistProfile(profile)
        );

        assertEquals("Clinic address does not match the postal code catalog.", exception.getMessage());
        verify(nutritionistRepositoryPort, never()).save(any());
    }

    private PatientProfile createPatientProfile(String userId) {
        return PatientProfile.rehydrate(
                userId,
                "Carlos",
                "Gomez",
                null,
                70.0,
                175.0,
                LocalDate.now().minusYears(25),
                Gender.MALE,
                ActivityLevel.SEDENTARY,
                "weight-loss",
                "omnivore",
                List.of(),
                List.of(),
                List.of(new WeightRecord(70.0, LocalDate.now().minusDays(7))),
                null
        );
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
                "Especialista en nutricion clinica."
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
