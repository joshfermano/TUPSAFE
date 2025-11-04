# PDS Edit Page

**Location:** `/home/joshfermano/Thesis/smart-gov/apps/employee/src/app/dashboard/pds/edit/[id]/page.tsx`

## Overview

The PDS Edit page allows users to edit existing Personal Data Sheet (PDS) submissions. It reuses all components from the Create page while adding edit-specific logic for loading, validating, and updating existing submissions.

## Features

### Core Functionality

1. **Dynamic Route Parameter**
   - Accepts `[id]` as route parameter
   - Uses Next.js 15's `use()` hook to unwrap params
   - Example URL: `/dashboard/pds/edit/pds-123456`

2. **Data Loading**
   - Fetches existing PDS data using `usePds().getCompleteSubmission(id)`
   - Shows loading state while fetching
   - Handles errors gracefully (not found, network errors)
   - Pre-fills all form fields with existing data

3. **Edit Authorization**
   - **Editable:** Draft and Rejected submissions
   - **Read-Only:** Submitted, Reviewing, and Approved submissions
   - **Unauthorized:** Cannot edit PDS belonging to other users
   - Shows appropriate error messages for each case

4. **Form Reuse**
   - Imports all step components from `../create/steps/`
   - Same validation schemas and form structure
   - Same multi-step navigation and progress tracking
   - Same Magic UI components for consistent design

5. **Auto-Save**
   - Uses edit-specific localStorage key: `pds-edit-${id}`
   - Auto-saves every 30 seconds (configurable)
   - Debounced save after 2 seconds of inactivity
   - Disabled during submission and in read-only mode

6. **Smart Step Navigation**
   - Calculates progress using `getPdsSectionProgress()`
   - Starts at first incomplete step
   - Shows completion badges for finished steps
   - Allows jumping between completed steps

## Edit Authorization States

### Editable States

#### 1. Draft
- Full editing allowed
- Auto-save continues
- Can be submitted for review
- No special indicators

#### 2. Rejected
- Full editing allowed to fix issues
- Shows rejection alert with feedback
- Can be resubmitted for review
- Prominent red alert banner

### Read-Only States

#### 1. Submitted
- Cannot edit (awaiting review)
- Shows "Cannot Edit Submitted PDS" message
- Current status badge displayed
- Redirect to view mode available

#### 2. Reviewing
- Cannot edit (under review)
- Shows "Cannot Edit Submitted PDS" message
- Current status badge: "Under Review"
- Redirect to view mode available

#### 3. Approved
- Cannot edit (finalized)
- Shows "Cannot Edit Submitted PDS" message
- Current status badge: "Approved"
- Redirect to view mode available

### Unauthorized Access

- User doesn't own the PDS
- Shows "Unauthorized Access" message
- Shield alert icon
- Redirect to dashboard only

### Not Found

- PDS doesn't exist
- Shows "PDS Not Found" message
- Question icon
- Redirect to dashboard only

## Component Structure

```tsx
PDSEditPage
├── Background Particles
├── Header (Sticky)
│   ├── Title ("Edit Personal Data Sheet")
│   ├── Badge ("CS Form No. 212 Revised 2025")
│   ├── Save Status Indicator
│   ├── "Save Now" Button
│   ├── Edit Badges
│   │   ├── "Editing" Badge
│   │   └── Current Status Badge
│   └── FormStepIndicator
├── Multi-Step Form
│   ├── Step Components (1-8)
│   │   ├── Step1PersonalBasic
│   │   ├── Step2Addresses
│   │   ├── Step3Contact
│   │   ├── Step4Family
│   │   ├── Step5Education
│   │   ├── Step6EligibilityWork
│   │   ├── Step7VoluntaryTraining
│   │   └── Step8OtherReview
│   └── Navigation Buttons
│       ├── "Previous" Button
│       ├── "Save Draft" Button
│       └── "Next" / "Update PDS" Button
└── Exit Confirmation Dialog
```

## Key Differences from Create Page

### 1. Data Loading

**Create Page:**
```typescript
// Starts with empty form
const form = useForm({
  defaultValues: createEmptyPds(),
});
```

**Edit Page:**
```typescript
// Loads existing data
const existingData = getCompleteSubmission(id);
useEffect(() => {
  if (existingData) {
    const formattedData = convertApiToFormData(existingData);
    form.reset(formattedData);
  }
}, [existingData]);
```

### 2. Auto-Save Key

**Create Page:**
```typescript
const { saveStatus } = useAutoSave({
  key: `pds-draft-${userId}`,
  data: formData,
});
```

**Edit Page:**
```typescript
const { saveStatus } = useAutoSave({
  key: `pds-edit-${id}`, // Different key
  data: formData,
});
```

### 3. Submission Handler

**Create Page:**
```typescript
const handleSubmit = async (data) => {
  await createSubmission(data);
  toast.success('PDS Created Successfully!');
  clearDraft(`pds-draft-${userId}`);
  router.push('/dashboard/pds');
};
```

**Edit Page:**
```typescript
const handleSubmit = async (data) => {
  await updateSubmission(id, data); // Update instead of create
  toast.success('PDS Updated Successfully!');
  clearDraft(`pds-edit-${id}`); // Clear edit draft
  router.push('/dashboard/pds');
};
```

### 4. Page Title

**Create Page:**
```tsx
<AnimatedGradientText>
  Create Personal Data Sheet
</AnimatedGradientText>
```

**Edit Page:**
```tsx
<AnimatedGradientText>
  Edit Personal Data Sheet
</AnimatedGradientText>
```

### 5. Additional UI Elements

**Edit Page Only:**
- Edit badge with pencil icon
- Current status badge
- Rejection alert (for rejected submissions)
- Read-only mode UI
- Unauthorized access UI
- Not found UI

## API Integration

### usePds Hook

```typescript
const { getCompleteSubmission, updateSubmission } = usePds(userId);

// Get existing PDS
const existingData = getCompleteSubmission(id);

// Update PDS
const success = await updateSubmission(id, updatedData);
```

### Data Type Conversion

The edit page handles two different `CompletePdsData` types:

1. **API Type** (`@tupsafe/database`):
   - `familyBackground` instead of `family`
   - `civilService` instead of `eligibility`
   - `training` instead of `learningDevelopment`
   - Used for fetching and updating

2. **Form Type** (`@/lib/validations/pds-schema`):
   - Matches form schema structure
   - Used for validation and form state
   - Converted from API type on load

```typescript
const convertApiToFormData = (apiData: ApiPdsData): Partial<FormPdsData> => {
  return {
    personalInfo: apiData.personalInfo,
    family: apiData.familyBackground,
    education: apiData.education,
    eligibility: apiData.civilService,
    workExperience: apiData.workExperience,
    voluntaryWork: apiData.voluntaryWork,
    learningDevelopment: apiData.training,
    otherInfo: apiData.otherInfo,
  };
};
```

## Error Handling

### Loading State
```tsx
if (isLoading) {
  return (
    <div className="text-center">
      <Loader2 className="animate-spin" />
      <p>Loading PDS data...</p>
    </div>
  );
}
```

### Not Found
```tsx
if (!existingData) {
  return (
    <div className="text-center">
      <FileQuestion />
      <h3>PDS Not Found</h3>
      <p>The PDS you're trying to edit doesn't exist.</p>
      <Button onClick={() => router.push('/dashboard/pds')}>
        Back to Dashboard
      </Button>
    </div>
  );
}
```

### Unauthorized
```tsx
if (isUnauthorized) {
  return (
    <div className="text-center">
      <ShieldAlert />
      <h3>Unauthorized Access</h3>
      <p>You don't have permission to edit this PDS.</p>
      <Button onClick={() => router.push('/dashboard/pds')}>
        Back to Dashboard
      </Button>
    </div>
  );
}
```

### Read-Only Mode
```tsx
if (isReadOnly) {
  return (
    <div className="text-center">
      <ShieldAlert />
      <h3>Cannot Edit Submitted PDS</h3>
      <p>This PDS has been submitted and is under review.</p>
      <StatusBadge status={submissionMetadata?.status} />
      <div className="flex gap-3">
        <Button onClick={() => router.push('/dashboard/pds')}>
          Back to Dashboard
        </Button>
        <Button onClick={() => router.push(`/dashboard/pds/view?id=${id}`)}>
          View PDS
        </Button>
      </div>
    </div>
  );
}
```

## Testing

### Manual Testing Scenarios

1. **Edit Draft PDS**
   - Navigate to `/dashboard/pds/edit/[draft-id]`
   - Verify form is pre-filled
   - Make changes
   - Verify auto-save works
   - Submit and verify update

2. **Edit Rejected PDS**
   - Navigate to `/dashboard/pds/edit/[rejected-id]`
   - Verify rejection alert is shown
   - Make corrections
   - Resubmit

3. **Try Editing Submitted PDS**
   - Navigate to `/dashboard/pds/edit/[submitted-id]`
   - Verify read-only message is shown
   - Verify redirect options work

4. **Try Editing Another User's PDS**
   - Navigate to `/dashboard/pds/edit/[other-user-id]`
   - Verify unauthorized message is shown
   - Verify redirect works

5. **Try Editing Non-Existent PDS**
   - Navigate to `/dashboard/pds/edit/invalid-id`
   - Verify not found message is shown
   - Verify redirect works

### Automated Testing (TODO)

```typescript
describe('PDS Edit Page', () => {
  it('loads and pre-fills existing PDS data', async () => {
    // Test implementation
  });

  it('prevents editing of submitted PDS', async () => {
    // Test implementation
  });

  it('prevents unauthorized access', async () => {
    // Test implementation
  });

  it('handles not found PDS', async () => {
    // Test implementation
  });

  it('auto-saves changes', async () => {
    // Test implementation
  });

  it('updates PDS successfully', async () => {
    // Test implementation
  });
});
```

## Accessibility

- **WCAG 2.1 AA Compliant**
- Keyboard navigation support
- Screen reader friendly
- Focus management
- ARIA labels on all interactive elements
- Error announcements
- Loading state announcements

## Performance

- **Code Splitting:** Step components lazy-loaded
- **Optimistic UI:** Form updates instantly
- **Auto-Save:** Debounced to reduce writes
- **Memoization:** Progress calculations memoized
- **Smart Loading:** Only loads when needed

## Related Files

- **Create Page:** `/apps/employee/src/app/dashboard/pds/create/page.tsx`
- **Step Components:** `/apps/employee/src/app/dashboard/pds/create/steps/`
- **Validation Schema:** `/apps/employee/src/lib/validations/pds-schema.ts`
- **Auto-Save Hook:** `/apps/employee/src/hooks/useAutoSave.ts`
- **Mock API:** `/packages/mock-data/src/api/hooks/usePds.ts`
- **Database Types:** `/packages/database/src/types.ts`

## Styling

- TUP Manila crimson theme
- Magic UI components (Particles, AnimatedGradientText, ShimmerButton, BlurFade)
- Tailwind CSS 4
- shadcn/ui components
- Consistent with Create page design
- Mobile-responsive
- Dark mode support (via system theme)

## Future Enhancements

1. **Version History**
   - Show previous versions of PDS
   - Allow comparing versions
   - Restore previous version

2. **Collaborative Editing**
   - Real-time presence indicators
   - Live cursor positions
   - Conflict resolution

3. **Advanced Validation**
   - Cross-field validation
   - Warning before leaving with unsaved changes
   - Duplicate detection

4. **Enhanced Feedback**
   - Inline comments from reviewers
   - Suggestions for improvement
   - Field-level history

## License

Part of the TUPSAFE project - TUP Manila e-PDS and e-SALN Compliance System.
