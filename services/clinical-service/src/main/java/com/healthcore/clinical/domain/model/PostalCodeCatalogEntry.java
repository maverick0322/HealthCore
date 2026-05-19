package com.healthcore.clinical.domain.model;

import java.util.LinkedHashSet;
import java.util.List;

public record PostalCodeCatalogEntry(
        String postalCode,
        String state,
        String city,
        String municipality,
        List<String> colonies
) {

    public PostalCodeCatalogEntry {
        postalCode = ProfileFieldValidator.validatePostalCode(postalCode);
        state = ProfileFieldValidator.validateRequiredText(state, 80, "State");
        city = ProfileFieldValidator.validateRequiredText(city, 80, "City");
        municipality = ProfileFieldValidator.validateRequiredText(municipality, 80, "Municipality");
        colonies = normalizeColonies(colonies);
    }

    public boolean matches(ClinicAddress address) {
        if (address == null || !address.isComplete()) {
            return false;
        }

        return postalCode.equals(address.getPostalCode())
                && equalsNormalized(state, address.getState())
                && equalsNormalized(city, address.getCity())
                && equalsNormalized(municipality, address.getMunicipality())
                && colonies.stream().anyMatch(colony -> equalsNormalized(colony, address.getNeighborhood()));
    }

    private static List<String> normalizeColonies(List<String> colonies) {
        if (colonies == null || colonies.isEmpty()) {
            throw new IllegalArgumentException("Colonies are required.");
        }

        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String colony : colonies) {
            normalized.add(ProfileFieldValidator.validateRequiredText(colony, 80, "Colony"));
        }
        return List.copyOf(normalized);
    }

    private static boolean equalsNormalized(String expected, String actual) {
        String normalizedExpected = ProfileFieldValidator.normalizeText(expected);
        String normalizedActual = ProfileFieldValidator.normalizeText(actual);
        if (normalizedExpected == null || normalizedActual == null) {
            return false;
        }
        return normalizedExpected.equalsIgnoreCase(normalizedActual);
    }
}
