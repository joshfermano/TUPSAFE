'use client';

import { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { useDebouncedCallback } from 'use-debounce';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { cn } from '../../../lib/utils';
import {
  PHILIPPINE_REGIONS,
  getProvincesByRegion,
  getCitiesByProvince,
  getBarangaysByCity,
} from '../../../lib/data/philippine-locations';
import { MapPin, Home, Building2, Info } from 'lucide-react';

/**
 * Philippine Address Input Component
 *
 * A comprehensive form component for collecting Philippine addresses
 * with proper validation and cascading location selectors.
 *
 * Features:
 * - Cascading dropdowns (Region → Province → City → Barangay)
 * - Auto-format ZIP code (4 digits)
 * - React Hook Form integration
 * - Light/dark mode support
 * - Accessible WCAG 2.1 AA compliant
 * - Optimized with React.memo and useCallback
 * - TUP Manila crimson theme
 */

export interface AddressInputProps {
  /** Base name for form field (e.g., "permanentAddress") */
  name: string;
  /** Display label (e.g., "Permanent Address") */
  label?: string;
  /** Whether the address is required */
  required?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to show region field */
  showRegion?: boolean;
  /** Name of another address field to copy from (e.g., "permanentAddress") */
  sameAsField?: string;
  /** Callback when "Same as" checkbox changes */
  onSameAsChange?: (checked: boolean) => void;
  /** Additional CSS classes */
  className?: string;
}

const FIELD_NAMES = {
  houseNumber: 'houseNumber',
  streetName: 'streetName',
  subdivision: 'subdivision',
  barangay: 'barangay',
  cityMunicipality: 'cityMunicipality',
  province: 'province',
  zipCode: 'zipCode',
  region: 'region',
} as const;

export const AddressInput = memo(function AddressInput({
  name,
  label = 'Address',
  required = false,
  disabled = false,
  showRegion = false,
  sameAsField,
  onSameAsChange,
  className,
}: AddressInputProps) {
  const {
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext();

  // Watch the "Same as" checkbox if sameAsField is provided
  const [sameAs, setSameAs] = useState(false);

  // Use useWatch for individual field subscriptions (more performant than watch([]))
  const selectedRegion = useWatch({
    control,
    name: `${name}.${FIELD_NAMES.region}`,
    disabled: !showRegion,
  });
  const selectedProvince = useWatch({
    control,
    name: `${name}.${FIELD_NAMES.province}`,
  });
  const selectedCity = useWatch({
    control,
    name: `${name}.${FIELD_NAMES.cityMunicipality}`,
  });

  // Memoized filtered data
  const provinces = useMemo(() => {
    if (!showRegion || !selectedRegion) {
      return [];
    }
    return getProvincesByRegion(selectedRegion);
  }, [selectedRegion, showRegion]);

  const cities = useMemo(() => {
    if (!selectedProvince) return [];
    return getCitiesByProvince(selectedProvince);
  }, [selectedProvince]);

  const barangays = useMemo(() => {
    if (!selectedCity) return [];
    return getBarangaysByCity(selectedCity);
  }, [selectedCity]);

  // Handle "Same as" checkbox
  const handleSameAsChange = useCallback(
    (checked: boolean) => {
      setSameAs(checked);
      if (checked && sameAsField) {
        const sourceAddress = getValues(sameAsField); // Single read instead of watch
        if (sourceAddress && typeof sourceAddress === 'object') {
          requestAnimationFrame(() => {
            Object.entries(FIELD_NAMES).forEach(([_, fieldName]) => {
              const value = sourceAddress[fieldName];
              if (value !== undefined) {
                setValue(`${name}.${fieldName}`, value, {
                  shouldValidate: false,
                  shouldDirty: true,
                });
              }
            });
          });
        }
      }
      onSameAsChange?.(checked);
    },
    [sameAsField, name, setValue, getValues, onSameAsChange]
  );

  // Auto-format ZIP code to 4 digits with debounce
  const handleZipCodeChange = useDebouncedCallback(
    (value: string) => {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
      setValue(`${name}.${FIELD_NAMES.zipCode}`, digitsOnly, {
        shouldValidate: true,
      });
    },
    300,
    { leading: true, trailing: true }
  );

  // Track previous parent values to detect actual user-initiated changes
  // This prevents clearing fields when navigating between form steps
  const [prevRegion, setPrevRegion] = useState<string | undefined>(selectedRegion);
  const [prevProvince, setPrevProvince] = useState<string | undefined>(selectedProvince);
  const [prevCity, setPrevCity] = useState<string | undefined>(selectedCity);

  // Memoize validation checks to avoid recalculating on every render
  const isProvinceValid = useMemo(() => {
    if (!selectedProvince || !provinces.length) return true;
    return provinces.some((p) => p.name === selectedProvince);
  }, [selectedProvince, provinces]);

  const isCityValid = useMemo(() => {
    if (!selectedCity || !cities.length) return true;
    return cities.some((c) => c.name === selectedCity);
  }, [selectedCity, cities]);

  // Reset dependent fields ONLY when parent actually changes (user selects a new value)
  // Compare by name since form stores display names, not codes
  useEffect(() => {
    if (!showRegion || !selectedRegion || selectedRegion === prevRegion) {
      setPrevRegion(selectedRegion);
      return;
    }

    if (!isProvinceValid && selectedProvince) {
      requestAnimationFrame(() => {
        setValue(`${name}.${FIELD_NAMES.province}`, '', { shouldValidate: false });
        setValue(`${name}.${FIELD_NAMES.cityMunicipality}`, '', { shouldValidate: false });
        setValue(`${name}.${FIELD_NAMES.barangay}`, '', { shouldValidate: false });
      });
    }

    setPrevRegion(selectedRegion);
  }, [selectedRegion, showRegion, isProvinceValid, selectedProvince, name, setValue]);

  useEffect(() => {
    if (!selectedProvince || selectedProvince === prevProvince) {
      setPrevProvince(selectedProvince);
      return;
    }

    if (!isCityValid && selectedCity) {
      requestAnimationFrame(() => {
        setValue(`${name}.${FIELD_NAMES.cityMunicipality}`, '', { shouldValidate: false });
        setValue(`${name}.${FIELD_NAMES.barangay}`, '', { shouldValidate: false });
      });
    }

    setPrevProvince(selectedProvince);
  }, [selectedProvince, isCityValid, selectedCity, name, setValue]);

  useEffect(() => {
    if (!selectedCity || selectedCity === prevCity) {
      setPrevCity(selectedCity);
      return;
    }

    const currentBarangay = getValues(`${name}.${FIELD_NAMES.barangay}`);
    const isBarangayValid = barangays.some((b) => b.name === currentBarangay);

    if (!isBarangayValid && currentBarangay) {
      requestAnimationFrame(() => {
        setValue(`${name}.${FIELD_NAMES.barangay}`, '', { shouldValidate: false });
      });
    }

    setPrevCity(selectedCity);
  }, [selectedCity, barangays, name, setValue, getValues]);

  // Memoize error lookup to avoid recalculating on every render
  const errorLookup = useMemo(() => {
    const lookup: Record<string, string | undefined> = {};
    Object.values(FIELD_NAMES).forEach((fieldName) => {
      const fieldPath = `${name}.${fieldName}`;
      const parts = fieldPath.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let error: any = errors;
      for (const part of parts) {
        if (error?.[part]) {
          error = error[part];
        } else {
          error = undefined;
          break;
        }
      }
      lookup[fieldName] = error?.message as string | undefined;
    });
    return lookup;
  }, [errors, name]);

  const getError = useCallback(
    (fieldName: string) => errorLookup[fieldName],
    [errorLookup]
  );

  // Memoize datalists to prevent unnecessary re-renders
  const ProvinceDatalist = useMemo(
    () => (
      <datalist id={`${name}-province-list`}>
        {(showRegion && selectedRegion ? provinces : []).map((province) => (
          <option key={province.code} value={province.name} />
        ))}
      </datalist>
    ),
    [name, provinces, showRegion, selectedRegion]
  );

  const CityDatalist = useMemo(
    () => (
      <datalist id={`${name}-city-list`}>
        {cities.map((city) => (
          <option key={city.code} value={city.name} />
        ))}
      </datalist>
    ),
    [name, cities]
  );

  const BarangayDatalist = useMemo(
    () => (
      <datalist id={`${name}-barangay-list`}>
        {barangays.map((barangay) => (
          <option key={barangay.code} value={barangay.name} />
        ))}
      </datalist>
    ),
    [name, barangays]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </h3>
          <p className="text-xs text-muted-foreground">
            Complete Philippine address information
          </p>
        </div>
      </div>

      {/* Same as Permanent Address Checkbox */}
      {sameAsField && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 dark:bg-muted/30">
          <input
            type="checkbox"
            id={`${name}-same-as`}
            checked={sameAs}
            onChange={(e) => handleSameAsChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          />
          <Label
            htmlFor={`${name}-same-as`}
            className="text-sm cursor-pointer select-none">
            Same as{' '}
            {sameAsField
              .replace(/([A-Z])/g, ' $1')
              .trim()
              .toLowerCase()}
          </Label>
        </div>
      )}

      {/* Street Address Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Home className="h-4 w-4 text-primary" />
          <span>Street Address</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* House/Block/Lot Number */}
          <div className="space-y-2">
            <Label
              htmlFor={`${name}.${FIELD_NAMES.houseNumber}`}
              className="text-sm font-medium">
              House/Block/Lot No.
            </Label>
            <Controller
              name={`${name}.${FIELD_NAMES.houseNumber}`}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={`${name}.${FIELD_NAMES.houseNumber}`}
                  placeholder="e.g., Blk 5 Lot 10"
                  disabled={disabled || sameAs}
                  aria-invalid={!!getError(FIELD_NAMES.houseNumber)}
                  aria-describedby={
                    getError(FIELD_NAMES.houseNumber)
                      ? `${name}.${FIELD_NAMES.houseNumber}-error`
                      : undefined
                  }
                />
              )}
            />
            {getError(FIELD_NAMES.houseNumber) && (
              <p
                id={`${name}.${FIELD_NAMES.houseNumber}-error`}
                className="text-xs text-destructive">
                {getError(FIELD_NAMES.houseNumber)}
              </p>
            )}
          </div>

          {/* Street Name */}
          <div className="space-y-2">
            <Label
              htmlFor={`${name}.${FIELD_NAMES.streetName}`}
              className="text-sm font-medium">
              Street Name
            </Label>
            <Controller
              name={`${name}.${FIELD_NAMES.streetName}`}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={`${name}.${FIELD_NAMES.streetName}`}
                  placeholder="e.g., Ayala Avenue"
                  disabled={disabled || sameAs}
                  aria-invalid={!!getError(FIELD_NAMES.streetName)}
                  aria-describedby={
                    getError(FIELD_NAMES.streetName)
                      ? `${name}.${FIELD_NAMES.streetName}-error`
                      : undefined
                  }
                />
              )}
            />
            {getError(FIELD_NAMES.streetName) && (
              <p
                id={`${name}.${FIELD_NAMES.streetName}-error`}
                className="text-xs text-destructive">
                {getError(FIELD_NAMES.streetName)}
              </p>
            )}
          </div>

          {/* Subdivision/Village */}
          <div className="space-y-2 md:col-span-2">
            <Label
              htmlFor={`${name}.${FIELD_NAMES.subdivision}`}
              className="text-sm font-medium">
              Subdivision/Village
            </Label>
            <Controller
              name={`${name}.${FIELD_NAMES.subdivision}`}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={`${name}.${FIELD_NAMES.subdivision}`}
                  placeholder="e.g., Greenfield Village"
                  disabled={disabled || sameAs}
                  aria-invalid={!!getError(FIELD_NAMES.subdivision)}
                  aria-describedby={
                    getError(FIELD_NAMES.subdivision)
                      ? `${name}.${FIELD_NAMES.subdivision}-error`
                      : undefined
                  }
                />
              )}
            />
            {getError(FIELD_NAMES.subdivision) && (
              <p
                id={`${name}.${FIELD_NAMES.subdivision}-error`}
                className="text-xs text-destructive">
                {getError(FIELD_NAMES.subdivision)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Administrative Divisions Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Building2 className="h-4 w-4 text-primary" />
          <span>
            Administrative Division
            {required && <span className="text-destructive ml-1">*</span>}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Region (Optional) */}
          {showRegion && (
            <div className="space-y-2 md:col-span-2">
              <Label
                htmlFor={`${name}.${FIELD_NAMES.region}`}
                className="text-sm font-medium flex items-center gap-2">
                Region
                <span className="text-xs text-muted-foreground font-normal">
                  (Optional)
                </span>
              </Label>
              <Controller
                name={`${name}.${FIELD_NAMES.region}`}
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || sameAs}>
                    <SelectTrigger
                      id={`${name}.${FIELD_NAMES.region}`}
                      className="w-full"
                      aria-invalid={!!getError(FIELD_NAMES.region)}
                      aria-describedby={
                        getError(FIELD_NAMES.region)
                          ? `${name}.${FIELD_NAMES.region}-error`
                          : undefined
                      }>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {PHILIPPINE_REGIONS.map((region) => (
                        <SelectItem key={region.code} value={region.code}>
                          {region.longName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {getError(FIELD_NAMES.region) && (
                <p
                  id={`${name}.${FIELD_NAMES.region}-error`}
                  className="text-xs text-destructive">
                  {getError(FIELD_NAMES.region)}
                </p>
              )}
            </div>
          )}

          {/* Province */}
          <div className="space-y-2">
            <Label
              htmlFor={`${name}.${FIELD_NAMES.province}`}
              className="text-sm font-medium">
              Province
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={`${name}.${FIELD_NAMES.province}`}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={`${name}.${FIELD_NAMES.province}`}
                  placeholder="e.g., Metro Manila"
                  disabled={disabled || sameAs}
                  list={`${name}-province-list`}
                  aria-invalid={!!getError(FIELD_NAMES.province)}
                  aria-describedby={
                    getError(FIELD_NAMES.province)
                      ? `${name}.${FIELD_NAMES.province}-error`
                      : undefined
                  }
                />
              )}
            />
            {ProvinceDatalist}
            {getError(FIELD_NAMES.province) && (
              <p
                id={`${name}.${FIELD_NAMES.province}-error`}
                className="text-xs text-destructive">
                {getError(FIELD_NAMES.province)}
              </p>
            )}
          </div>

          {/* City/Municipality */}
          <div className="space-y-2">
            <Label
              htmlFor={`${name}.${FIELD_NAMES.cityMunicipality}`}
              className="text-sm font-medium">
              City/Municipality
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={`${name}.${FIELD_NAMES.cityMunicipality}`}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={`${name}.${FIELD_NAMES.cityMunicipality}`}
                  placeholder="e.g., Taguig City"
                  disabled={disabled || sameAs}
                  list={`${name}-city-list`}
                  aria-invalid={!!getError(FIELD_NAMES.cityMunicipality)}
                  aria-describedby={
                    getError(FIELD_NAMES.cityMunicipality)
                      ? `${name}.${FIELD_NAMES.cityMunicipality}-error`
                      : undefined
                  }
                />
              )}
            />
            {CityDatalist}
            {getError(FIELD_NAMES.cityMunicipality) && (
              <p
                id={`${name}.${FIELD_NAMES.cityMunicipality}-error`}
                className="text-xs text-destructive">
                {getError(FIELD_NAMES.cityMunicipality)}
              </p>
            )}
          </div>

          {/* Barangay */}
          <div className="space-y-2">
            <Label
              htmlFor={`${name}.${FIELD_NAMES.barangay}`}
              className="text-sm font-medium">
              Barangay
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={`${name}.${FIELD_NAMES.barangay}`}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={`${name}.${FIELD_NAMES.barangay}`}
                  placeholder="e.g., Fort Bonifacio"
                  disabled={disabled || sameAs}
                  list={`${name}-barangay-list`}
                  aria-invalid={!!getError(FIELD_NAMES.barangay)}
                  aria-describedby={
                    getError(FIELD_NAMES.barangay)
                      ? `${name}.${FIELD_NAMES.barangay}-error`
                      : undefined
                  }
                />
              )}
            />
            {BarangayDatalist}
            {getError(FIELD_NAMES.barangay) && (
              <p
                id={`${name}.${FIELD_NAMES.barangay}-error`}
                className="text-xs text-destructive">
                {getError(FIELD_NAMES.barangay)}
              </p>
            )}
          </div>

          {/* ZIP Code */}
          <div className="space-y-2">
            <Label
              htmlFor={`${name}.${FIELD_NAMES.zipCode}`}
              className="text-sm font-medium">
              ZIP Code
            </Label>
            <Controller
              name={`${name}.${FIELD_NAMES.zipCode}`}
              control={control}
              render={({ field }) => (
                <Input
                  id={`${name}.${FIELD_NAMES.zipCode}`}
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 1634"
                  maxLength={4}
                  disabled={disabled || sameAs}
                  value={field.value || ''}
                  onChange={(e) => {
                    // Update field immediately for visual feedback
                    field.onChange(e.target.value);
                    // Debounce the validation
                    handleZipCodeChange(e.target.value);
                  }}
                  aria-invalid={!!getError(FIELD_NAMES.zipCode)}
                  aria-describedby={
                    getError(FIELD_NAMES.zipCode)
                      ? `${name}.${FIELD_NAMES.zipCode}-error`
                      : undefined
                  }
                />
              )}
            />
            {getError(FIELD_NAMES.zipCode) && (
              <p
                id={`${name}.${FIELD_NAMES.zipCode}-error`}
                className="text-xs text-destructive">
                {getError(FIELD_NAMES.zipCode)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20">
        <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Please provide your complete Philippine address. Required fields are
          marked with an asterisk (*). For government employees, ensure this
          matches your official records.
        </p>
      </div>
    </div>
  );
});
