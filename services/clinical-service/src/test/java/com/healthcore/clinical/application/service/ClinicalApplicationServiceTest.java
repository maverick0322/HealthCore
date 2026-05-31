package com.healthcore.clinical.application.service;

import com.healthcore.clinical.application.service.support.ClinicAddressCatalogValidator;
import com.healthcore.clinical.application.service.support.NutritionistWeightProgressReportFactory;
import com.healthcore.clinical.application.service.support.ProfilePhotoKeyValidator;
import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicalTime;
import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.domain.port.out.NutritionistProfileRepositoryPort;
import com.healthcore.clinical.domain.port.out.PostalCodeCatalogPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

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

    private ClinicalApplicationService service;

    @BeforeEach
    void setUp() {
        PatientProfileAccessService patientProfileAccessService = new PatientProfileAccessService(repositoryPort);
        ProfilePhotoKeyValidator profilePhotoKeyValidator = new ProfilePhotoKeyValidator();
        service = new ClinicalApplicationService(
                new PatientProfileApplicationService(patientProfileAccessService, profilePhotoKeyValidator),
                new PatientWeightApplicationService(patientProfileAccessService),
                new NutritionistProfileApplicationService(
                        nutritionistRepositoryPort,
                        new ClinicAddressCatalogValidator(postalCodeCatalogPort),
                        profilePhotoKeyValidator
                ),
                new NutritionistWeightProgressApplicationService(
                        patientProfileAccessService,
                        new NutritionistWeightProgressReportFactory()
                )
        );
    }

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
    void shouldGetProfilesByNutritionistId() {
        List<PatientProfile> profiles = List.of(
                createPatientProfile("patient-1"),
                createPatientProfile("patient-2")
        );
        when(repositoryPort.findAllByNutritionistId("nutri-123")).thenReturn(profiles);

        List<PatientProfile> result = service.getProfilesByNutritionistId("nutri-123");

        assertEquals(2, result.size());
        verify(repositoryPort).findAllByNutritionistId("nutri-123");
    }

    @Test
    void shouldUpdateWeightAndRecalculateGoals() {
        PatientProfile profile = createPatientProfile("user-123");
        LocalDate targetDate = ClinicalTime.today();
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

        assertThrows(ProfileNotFoundException.class, () -> service.updateWeight("ghost-user", 80.0, ClinicalTime.today()));
        verify(repositoryPort, never()).save(any());
    }

    @Test
    void shouldGetWeightHistory() {
        PatientProfile profile = createPatientProfile("user-123");
        profile.registerWeight(68.0, ClinicalTime.today());

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
        profile.registerWeight(74.0, ClinicalTime.today());
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
        LocalDate latestDate = ClinicalTime.today();
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
        LocalDate latestDate = ClinicalTime.today();
        profile.registerWeight(74.0, latestDate);
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        HealthGoal goal = service.deleteWeight("user-123", latestDate);

        assertNotNull(goal);
        assertEquals(70.0, profile.getWeightKg());
        assertEquals(1, profile.getWeightHistory().size());
        verify(repositoryPort).save(profile);
    }

    @Test
    void shouldBuildNutritionistWeightProgressReportForRange() {
        String nutritionistId = "nutri-123";
        LocalDate from = LocalDate.of(2026, 5, 1);
        LocalDate to = LocalDate.of(2026, 5, 31);

        PatientProfile patientOne = PatientProfile.rehydrate(
                "patient-1",
                "Ana",
                "Lopez",
                null,
                71.0,
                165.0,
                LocalDate.of(1994, 3, 12),
                Gender.FEMALE,
                ActivityLevel.LIGHTLY_ACTIVE,
                "health",
                "omnivore",
                List.of(),
                List.of(),
                List.of(
                        new WeightRecord(74.0, LocalDate.of(2026, 4, 28)),
                        new WeightRecord(72.0, LocalDate.of(2026, 5, 10)),
                        new WeightRecord(71.0, LocalDate.of(2026, 5, 21))
                ),
                nutritionistId,
                null
        );
        PatientProfile patientTwo = PatientProfile.rehydrate(
                "patient-2",
                null,
                null,
                null,
                80.0,
                178.0,
                LocalDate.of(1990, 8, 2),
                Gender.MALE,
                ActivityLevel.SEDENTARY,
                "weight-loss",
                "omnivore",
                List.of(),
                List.of(),
                List.of(new WeightRecord(80.0, LocalDate.of(2026, 4, 15))),
                nutritionistId,
                null
        );

        when(repositoryPort.findAllByNutritionistId(nutritionistId)).thenReturn(List.of(patientOne, patientTwo));

        NutritionistWeightProgressReport report = service.getNutritionistWeightProgressReport(nutritionistId, from, to);

        assertEquals(2, report.activePatients());
        assertEquals(1, report.patientsWithoutWeightInRange());
        assertEquals("Ana Lopez", report.rows().get(0).fullName());
        assertEquals(LocalDate.of(2026, 5, 21), report.rows().get(0).latestRecordDateInRange());
        assertEquals(-1.0, report.rows().get(0).netChangeKg());
        assertEquals("patient-2", report.rows().get(1).fullName());
        assertFalse(report.rows().get(1).hasRecordsInRange());
    }

    @Test
    void shouldRejectInvalidNutritionistWeightProgressReportRange() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.getNutritionistWeightProgressReport(
                        "nutri-123",
                        LocalDate.of(2026, 5, 31),
                        LocalDate.of(2026, 5, 1)
                )
        );

        assertEquals("Invalid report range.", exception.getMessage());
        verify(repositoryPort, never()).findAllByNutritionistId(any());
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
    void shouldAllowNutritionistToUpdateLinkedPatientMetrics() {
        String nutritionistId = "nutri-123";
        String patientId = "patient-123";
        PatientProfile profile = createPatientProfile(patientId);
        profile.assignNutritionist(nutritionistId);

        when(repositoryPort.findByUserId(patientId)).thenReturn(Optional.of(profile));
        when(repositoryPort.save(profile)).thenReturn(profile);

        PatientProfile result = service.updatePatientMetricsForNutritionist(nutritionistId, patientId, 74.5, 180.0);

        assertEquals(74.5, result.getWeightKg());
        assertEquals(180.0, result.getHeightCm());
        assertEquals(2, result.getWeightHistory().size());
        verify(repositoryPort).save(profile);
    }

    @Test
    void shouldThrowAccessDeniedWhenNutritionistRequestsPatientLinkedToAnotherNutritionist() {
        PatientProfile profile = createPatientProfile("patient-123");
        profile.assignNutritionist("nutri-999");
        when(repositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(profile));

        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> service.getProfileForNutritionist("nutri-123", "patient-123")
        );

        assertEquals("Action denied: Patient is not linked to this nutritionist.", exception.getMessage());
    }

    @Test
    void shouldReturnWeightHistoryForLinkedPatientWhenNutritionistOwnsProfile() {
        String nutritionistId = "nutri-123";
        PatientProfile profile = createPatientProfile("patient-123");
        profile.assignNutritionist(nutritionistId);
        profile.registerWeight(72.5, ClinicalTime.today());
        when(repositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(profile));

        List<WeightRecord> history = service.getWeightHistoryForNutritionist(nutritionistId, "patient-123");

        assertEquals(2, history.size());
        assertEquals(72.5, history.get(1).weightKg());
    }

    @Test
    void shouldUpdatePatientProfilePhoto() {
        PatientProfile profile = createPatientProfile("user-123");

        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));
        when(repositoryPort.save(profile)).thenReturn(profile);

        PatientProfile result = service.updateProfilePhoto("user-123", "user-123/uuid-avatar.webp");

        assertEquals("user-123/uuid-avatar.webp", result.getProfilePhotoKey());
        verify(repositoryPort).save(profile);
    }

    @Test
    void shouldRejectPatientProfilePhotoKeyThatDoesNotBelongToAuthenticatedUser() {
        PatientProfile profile = createPatientProfile("user-123");
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> service.updateProfilePhoto("user-123", "other-user/uuid-avatar.webp")
        );

        assertEquals("Profile photo key does not belong to the authenticated user.", exception.getMessage());
        verify(repositoryPort, never()).save(any());
    }

    @Test
    void shouldRejectPatientProfilePhotoKeyWithInvalidFormat() {
        PatientProfile profile = createPatientProfile("user-123");
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.updateProfilePhoto("user-123", "user-123/not-an-image.txt")
        );

        assertEquals("Profile photo key format is invalid.", exception.getMessage());
        verify(repositoryPort, never()).save(any());
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
                "Bio actualizada",
                null
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
    void shouldReturnNutritionistProfileByUserId() {
        NutritionistProfile profile = createNutritionistProfile("nutri-123");
        when(nutritionistRepositoryPort.findByUserId("nutri-123")).thenReturn(Optional.of(profile));

        Optional<NutritionistProfile> result = service.getNutritionistProfileByUserId("nutri-123");

        assertTrue(result.isPresent());
        assertEquals("nutri-123", result.get().getUserId());
    }

    @Test
    void shouldUpdateNutritionistProfilePhoto() {
        NutritionistProfile profile = createNutritionistProfile("nutri-123");

        when(nutritionistRepositoryPort.findByUserId("nutri-123")).thenReturn(Optional.of(profile));
        when(nutritionistRepositoryPort.save(profile)).thenReturn(profile);

        NutritionistProfile result = service.updateNutritionistProfilePhoto(
                "nutri-123",
                "nutri-123/uuid-avatar.webp"
        );

        assertEquals("nutri-123/uuid-avatar.webp", result.getProfilePhotoKey());
        verify(nutritionistRepositoryPort).save(profile);
    }

    @Test
    void shouldRejectNutritionistProfilePhotoKeyThatDoesNotBelongToAuthenticatedUser() {
        NutritionistProfile profile = createNutritionistProfile("nutri-123");
        when(nutritionistRepositoryPort.findByUserId("nutri-123")).thenReturn(Optional.of(profile));

        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> service.updateNutritionistProfilePhoto("nutri-123", "other-user/uuid-avatar.webp")
        );

        assertEquals("Profile photo key does not belong to the authenticated user.", exception.getMessage());
        verify(nutritionistRepositoryPort, never()).save(any());
    }

    @Test
    void shouldRejectBlankPatientProfilePhotoKey() {
        PatientProfile profile = createPatientProfile("user-123");
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.updateProfilePhoto("user-123", " ")
        );

        assertEquals("Profile photo key is required.", exception.getMessage());
        verify(repositoryPort, never()).save(any());
    }

    @Test
    void shouldRejectNestedPatientProfilePhotoKeyPath() {
        PatientProfile profile = createPatientProfile("user-123");
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.updateProfilePhoto("user-123", "user-123/folder/avatar.webp")
        );

        assertEquals("Profile photo key format is invalid.", exception.getMessage());
        verify(repositoryPort, never()).save(any());
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
                "Especialista en nutricion clinica.",
                null
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
                "Especialista en nutricion clinica.",
                null
        );

        when(postalCodeCatalogPort.findByPostalCode("03100")).thenReturn(Optional.of(createPostalCodeEntry("03100")));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.createNutritionistProfile(profile)
        );

        assertEquals("Clinic address does not match the postal code catalog.", exception.getMessage());
        verify(nutritionistRepositoryPort, never()).save(any());
    }

    @Test
    void shouldRejectIncompleteClinicAddress() {
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
                ClinicAddress.rehydrate(
                        "03100",
                        "Ciudad de Mexico",
                        null,
                        "Benito Juarez",
                        "Narvarte Oriente",
                        "Xola",
                        "123",
                        null
                ),
                "Especialista en nutricion clinica.",
                null
        );

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.createNutritionistProfile(profile)
        );

        assertEquals("Clinic address must be complete when provided.", exception.getMessage());
        verify(postalCodeCatalogPort, never()).findByPostalCode(any());
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
                ClinicalTime.today().minusYears(25),
                Gender.MALE,
                ActivityLevel.SEDENTARY,
                "weight-loss",
                "omnivore",
                List.of(),
                List.of(),
                List.of(new WeightRecord(70.0, ClinicalTime.today().minusDays(7))),
                null,
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
