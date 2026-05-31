package com.healthcore.clinical.infrastructure.rest.support;

import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.PatientProfileResponse;
import com.healthcore.clinical.infrastructure.rest.mapper.ClinicalProfileRestMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClinicalControllerSupportTest {

    @Mock
    private ClinicalProfileRestMapper clinicalProfileRestMapper;

    @Mock
    private ProfilePhotoUrlResolver profilePhotoUrlResolver;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldResolvePhotoUrlAndMapPatientProfileResponse() {
        TestClinicalControllerSupport support = new TestClinicalControllerSupport(
                clinicalProfileRestMapper,
                profilePhotoUrlResolver
        );
        PatientProfile profile = mock(PatientProfile.class);
        PatientProfileResponse expectedResponse = new PatientProfileResponse(
                "patient-1",
                "Carlos",
                "Gomez",
                null,
                "Carlos Gomez",
                70.0,
                175.0,
                LocalDate.of(2000, 1, 1),
                "MALE",
                "SEDENTARY",
                "weight-loss",
                "omnivore",
                List.of(),
                List.of(),
                null,
                "https://cdn.example.com/patient-1/avatar.webp",
                true
        );
        when(profile.getProfilePhotoKey()).thenReturn("patient-1/avatar.webp");
        when(profilePhotoUrlResolver.resolveSingleUrl("patient-1/avatar.webp"))
                .thenReturn("https://cdn.example.com/patient-1/avatar.webp");
        when(clinicalProfileRestMapper.toPatientProfileResponse(
                profile,
                "https://cdn.example.com/patient-1/avatar.webp"
        )).thenReturn(expectedResponse);

        PatientProfileResponse result = support.mapPatient(profile);

        assertSame(expectedResponse, result);
        verify(profilePhotoUrlResolver).resolveSingleUrl("patient-1/avatar.webp");
    }

    @Test
    void shouldUseProvidedPhotoUrlWhenMappingPatientProfileResponse() {
        TestClinicalControllerSupport support = new TestClinicalControllerSupport(
                clinicalProfileRestMapper,
                profilePhotoUrlResolver
        );
        PatientProfile profile = mock(PatientProfile.class);
        PatientProfileResponse expectedResponse = new PatientProfileResponse(
                "patient-1",
                "Carlos",
                "Gomez",
                null,
                "Carlos Gomez",
                70.0,
                175.0,
                LocalDate.of(2000, 1, 1),
                "MALE",
                "SEDENTARY",
                "weight-loss",
                "omnivore",
                List.of(),
                List.of(),
                null,
                "https://cdn.example.com/patient-1/avatar.webp",
                true
        );
        when(clinicalProfileRestMapper.toPatientProfileResponse(
                profile,
                "https://cdn.example.com/patient-1/avatar.webp"
        )).thenReturn(expectedResponse);

        PatientProfileResponse result = support.mapPatient(profile, "https://cdn.example.com/patient-1/avatar.webp");

        assertSame(expectedResponse, result);
        verify(profilePhotoUrlResolver, never()).resolveSingleUrl(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void shouldResolvePhotoUrlAndMapNutritionistProfileResponse() {
        TestClinicalControllerSupport support = new TestClinicalControllerSupport(
                clinicalProfileRestMapper,
                profilePhotoUrlResolver
        );
        NutritionistProfile profile = mock(NutritionistProfile.class);
        NutritionistProfileResponse expectedResponse = new NutritionistProfileResponse(
                "nutri-1",
                "Daniel",
                "Martinez",
                null,
                "Daniel Martinez",
                List.of("CLINICAL"),
                null,
                "12345678",
                List.of("ONLINE"),
                "5512345678",
                null,
                "Bio",
                "https://cdn.example.com/nutri-1/avatar.webp",
                true
        );
        when(profile.getProfilePhotoKey()).thenReturn("nutri-1/avatar.webp");
        when(profilePhotoUrlResolver.resolveSingleUrl("nutri-1/avatar.webp"))
                .thenReturn("https://cdn.example.com/nutri-1/avatar.webp");
        when(clinicalProfileRestMapper.toNutritionistProfileResponse(
                profile,
                "https://cdn.example.com/nutri-1/avatar.webp"
        )).thenReturn(expectedResponse);

        NutritionistProfileResponse result = support.mapNutritionist(profile);

        assertSame(expectedResponse, result);
        verify(profilePhotoUrlResolver).resolveSingleUrl("nutri-1/avatar.webp");
    }

    @Test
    void shouldReadCurrentUserIdFromSecurityContext() {
        TestClinicalControllerSupport support = new TestClinicalControllerSupport(
                clinicalProfileRestMapper,
                profilePhotoUrlResolver
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user-123", "secret")
        );

        assertEquals("user-123", support.currentUserId());
    }

    @Test
    void shouldReturnUnknownHashForNullOrBlankValues() {
        TestClinicalControllerSupport support = new TestClinicalControllerSupport(
                clinicalProfileRestMapper,
                profilePhotoUrlResolver
        );

        assertEquals("unknown", support.hash(null));
        assertEquals("unknown", support.hash("   "));
    }

    @Test
    void shouldReturnStableHashForNonBlankValue() {
        TestClinicalControllerSupport support = new TestClinicalControllerSupport(
                clinicalProfileRestMapper,
                profilePhotoUrlResolver
        );

        assertEquals(Integer.toHexString("patient-1".hashCode()), support.hash("patient-1"));
    }

    private static final class TestClinicalControllerSupport extends ClinicalControllerSupport {

        private TestClinicalControllerSupport(
                ClinicalProfileRestMapper clinicalProfileRestMapper,
                ProfilePhotoUrlResolver profilePhotoUrlResolver
        ) {
            super(clinicalProfileRestMapper, profilePhotoUrlResolver);
        }

        private PatientProfileResponse mapPatient(PatientProfile profile) {
            return toPatientProfileResponse(profile);
        }

        private PatientProfileResponse mapPatient(PatientProfile profile, String profilePhotoUrl) {
            return toPatientProfileResponse(profile, profilePhotoUrl);
        }

        private NutritionistProfileResponse mapNutritionist(NutritionistProfile profile) {
            return toNutritionistProfileResponse(profile);
        }

        private String currentUserId() {
            return getCurrentUserId();
        }

        private String hash(String value) {
            return logHash(value);
        }
    }
}
