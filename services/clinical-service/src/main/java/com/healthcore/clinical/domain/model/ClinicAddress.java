package com.healthcore.clinical.domain.model;

public class ClinicAddress {

    private String postalCode;
    private String state;
    private String city;
    private String municipality;
    private String neighborhood;
    private String street;
    private String exteriorNumber;
    private String interiorNumber;

    private ClinicAddress() {
    }

    public ClinicAddress(
            String postalCode,
            String state,
            String city,
            String municipality,
            String neighborhood,
            String street,
            String exteriorNumber,
            String interiorNumber
    ) {
        this.postalCode = ProfileFieldValidator.validatePostalCode(postalCode);
        this.state = ProfileFieldValidator.validateRequiredText(state, 80, "State");
        this.city = ProfileFieldValidator.validateRequiredText(city, 80, "City");
        this.municipality = ProfileFieldValidator.validateRequiredText(municipality, 80, "Municipality");
        this.neighborhood = ProfileFieldValidator.validateRequiredText(neighborhood, 80, "Neighborhood");
        this.street = ProfileFieldValidator.validateRequiredText(street, 120, "Street");
        this.exteriorNumber = ProfileFieldValidator.validateRequiredText(exteriorNumber, 20, "Exterior number");
        this.interiorNumber = ProfileFieldValidator.validateOptionalText(interiorNumber, 20, "Interior number");
    }

    public static ClinicAddress rehydrate(
            String postalCode,
            String state,
            String city,
            String municipality,
            String neighborhood,
            String street,
            String exteriorNumber,
            String interiorNumber
    ) {
        if (ProfileFieldValidator.normalizeText(postalCode) == null
                && ProfileFieldValidator.normalizeText(state) == null
                && ProfileFieldValidator.normalizeText(city) == null
                && ProfileFieldValidator.normalizeText(municipality) == null
                && ProfileFieldValidator.normalizeText(neighborhood) == null
                && ProfileFieldValidator.normalizeText(street) == null
                && ProfileFieldValidator.normalizeText(exteriorNumber) == null
                && ProfileFieldValidator.normalizeText(interiorNumber) == null) {
            return null;
        }
        ClinicAddress address = new ClinicAddress();
        address.postalCode = ProfileFieldValidator.normalizeText(postalCode) == null
                ? null
                : ProfileFieldValidator.validatePostalCode(postalCode);
        address.state = ProfileFieldValidator.validateOptionalText(state, 80, "State");
        address.city = ProfileFieldValidator.validateOptionalText(city, 80, "City");
        address.municipality = ProfileFieldValidator.validateOptionalText(municipality, 80, "Municipality");
        address.neighborhood = ProfileFieldValidator.validateOptionalText(neighborhood, 80, "Neighborhood");
        address.street = ProfileFieldValidator.validateOptionalText(street, 120, "Street");
        address.exteriorNumber = ProfileFieldValidator.validateOptionalText(exteriorNumber, 20, "Exterior number");
        address.interiorNumber = ProfileFieldValidator.validateOptionalText(interiorNumber, 20, "Interior number");
        return address;
    }

    public boolean isComplete() {
        return postalCode != null
                && state != null
                && city != null
                && municipality != null
                && neighborhood != null
                && street != null
                && exteriorNumber != null;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public String getState() {
        return state;
    }

    public String getCity() {
        return city;
    }

    public String getMunicipality() {
        return municipality;
    }

    public String getNeighborhood() {
        return neighborhood;
    }

    public String getStreet() {
        return street;
    }

    public String getExteriorNumber() {
        return exteriorNumber;
    }

    public String getInteriorNumber() {
        return interiorNumber;
    }
}
