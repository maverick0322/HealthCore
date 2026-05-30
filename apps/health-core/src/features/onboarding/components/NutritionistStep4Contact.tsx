import { useTranslation } from 'react-i18next';

import type { NutritionistStep4ContactProps } from '@/features/onboarding/components/nutritionistOnboardingSteps.types';
import { CounterField, StepFrame } from '@/features/onboarding/components/NutritionistOnboardingStepShared';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

export const NutritionistStep4Contact = ({
  contact,
  errors,
  postalLookup,
  isPostalLookupLoading,
  postalLookupMessage,
  isCatalogPostalCode,
  onBack,
  onNext,
  onPhoneChange,
  onPostalCodeChange,
  onClinicAddressChange,
}: NutritionistStep4ContactProps) => {
  const { t } = useTranslation('onboarding');

  return (
    <StepFrame
      title={t('nutritionist.contact.title')}
      subtitle={t('nutritionist.contact.subtitle')}
      onBack={onBack}
      onNext={onNext}
      nextLabel={t('common.continue')}
    >
      <CounterField
        id="nutri-phone"
        label={t('nutritionist.contact.fields.phoneOptional')}
        value={contact.phone}
        maxLength={10}
        error={errors.phone}
        onChange={onPhoneChange}
      />
      <CounterField
        id="nutri-postal-code"
        label={t('nutritionist.contact.fields.postalCodeOptional')}
        value={contact.clinicAddress.postalCode}
        maxLength={5}
        error={errors.postalCode}
        inputMode="numeric"
        onChange={onPostalCodeChange}
      />
      {isPostalLookupLoading ? (
        <p className="text-xs text-muted-foreground">{t('nutritionist.contact.lookup.loading')}</p>
      ) : postalLookupMessage ? (
        <p className="text-xs text-muted-foreground">{postalLookupMessage}</p>
      ) : null}
      <CounterField
        id="nutri-state"
        label={t('nutritionist.contact.fields.state')}
        value={contact.clinicAddress.state}
        maxLength={80}
        error={errors.state}
        disabled={isCatalogPostalCode}
        onChange={(value) => onClinicAddressChange({ state: value })}
      />
      <CounterField
        id="nutri-city"
        label={t('nutritionist.contact.fields.city')}
        value={contact.clinicAddress.city}
        maxLength={80}
        error={errors.city}
        disabled={isCatalogPostalCode}
        onChange={(value) => onClinicAddressChange({ city: value })}
      />
      <CounterField
        id="nutri-municipality"
        label={t('nutritionist.contact.fields.municipality')}
        value={contact.clinicAddress.municipality}
        maxLength={80}
        error={errors.municipality}
        disabled={isCatalogPostalCode}
        onChange={(value) => onClinicAddressChange({ municipality: value })}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="nutri-neighborhood" className="text-sm font-semibold text-foreground">
            {t('nutritionist.contact.fields.neighborhood')}
          </label>
          {isCatalogPostalCode && postalLookup ? (
            <span className="text-xs text-muted-foreground">{postalLookup.colonies.length}</span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {contact.clinicAddress.neighborhood.length}/80
            </span>
          )}
        </div>
        {isCatalogPostalCode && postalLookup ? (
          <Select
            value={contact.clinicAddress.neighborhood}
            onValueChange={(value) => onClinicAddressChange({ neighborhood: value })}
          >
            <SelectTrigger
              id="nutri-neighborhood"
              aria-invalid={Boolean(errors.neighborhood)}
              className="h-12 bg-card"
            >
              <SelectValue placeholder={t('nutritionist.contact.lookup.neighborhoodPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {postalLookup.colonies.map((colony) => (
                <SelectItem key={colony} value={colony}>
                  {colony}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="nutri-neighborhood"
            value={contact.clinicAddress.neighborhood}
            maxLength={80}
            aria-invalid={Boolean(errors.neighborhood)}
            onChange={(event) => onClinicAddressChange({ neighborhood: event.target.value })}
            className="h-12 bg-card"
          />
        )}
        {errors.neighborhood ? <p className="text-xs text-destructive">{errors.neighborhood}</p> : null}
      </div>
      <CounterField
        id="nutri-street"
        label={t('nutritionist.contact.fields.street')}
        value={contact.clinicAddress.street}
        maxLength={120}
        error={errors.street}
        onChange={(value) => onClinicAddressChange({ street: value })}
      />
      <div className="grid grid-cols-2 gap-4">
        <CounterField
          id="nutri-exterior-number"
          label={t('nutritionist.contact.fields.exteriorNumber')}
          value={contact.clinicAddress.exteriorNumber}
          maxLength={20}
          error={errors.exteriorNumber}
          onChange={(value) => onClinicAddressChange({ exteriorNumber: value })}
        />
        <CounterField
          id="nutri-interior-number"
          label={t('nutritionist.contact.fields.interiorNumberOptional')}
          value={contact.clinicAddress.interiorNumber ?? ''}
          maxLength={20}
          error={errors.interiorNumber}
          onChange={(value) => onClinicAddressChange({ interiorNumber: value })}
        />
      </div>
    </StepFrame>
  );
};
