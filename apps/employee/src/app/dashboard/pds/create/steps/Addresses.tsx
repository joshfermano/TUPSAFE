'use client';

import { memo } from 'react';
import { Home } from 'lucide-react';
import { FormSection } from '../../../../../components/forms/shared/FormSection';
import { AddressInput } from '../../../../../components/forms/shared/AddressInput';

/**
 * Step 2: Personal Information - Addresses
 * Includes residential and permanent addresses with "Same as" option
 */
export const Addresses = memo(function Addresses() {
  return (
    <FormSection
      title="Residential & Permanent Addresses"
      description="Provide your complete Philippine addresses"
      icon={Home}
      required={true}
      stepNumber={2}>
      <div className="space-y-12">
        <AddressInput
          name="personalInfo.residentialAddress"
          label="Residential Address"
          required={true}
        />

        <AddressInput
          name="personalInfo.permanentAddress"
          label="Permanent Address"
          required={true}
          sameAsField="personalInfo.residentialAddress"
        />
      </div>
    </FormSection>
  );
});
