# SALN Validation Schema - Quick Reference Card

## Import Schemas

```typescript
import {
  // Main schemas
  declarantInfoSchema,
  realPropertySchema,
  personalPropertySchema,
  liabilitySchema,
  businessInterestSchema,
  relativeInGovernmentSchema,
  salnSummarySchema,
  completeSalnSchema,

  // Helper functions
  createEmptySaln,
  calculateSalnSummary,
  compareSalnYears,
  isSalnReadyForSubmission,
  formatCurrency,

  // Types
  type CompleteSalnData,
  type RealProperty,
  type PersonalProperty,
} from '@/lib/validations/saln-schema';
```

## Quick Start

### 1. Create Empty SALN
```typescript
const emptySaln = createEmptySaln(2024, userId);
```

### 2. Add Real Property
```typescript
emptySaln.realProperties.push({
  description: 'House and Lot',
  kind: 'residential',
  exactLocation: 'Quezon City',
  assessedValue: 2500000,
  currentFairMarketValue: 4500000,
  acquisitionYear: 2015,
  acquisitionMode: 'Purchase',
  acquisitionCost: 3200000,
});
```

### 3. Calculate Summary
```typescript
const summary = calculateSalnSummary(emptySaln);
console.log(formatCurrency(summary.netWorth));
```

### 4. Validate
```typescript
const result = completeSalnSchema.safeParse(emptySaln);
if (result.success) {
  // Submit
} else {
  console.error(result.error);
}
```

## Common Patterns

### React Hook Form
```typescript
const form = useForm({
  resolver: zodResolver(realPropertySchema),
  defaultValues: { /* ... */ },
});
```

### Progress Tracking
```typescript
const progress = getOverallSalnProgress(salnData);
// Returns: 0-100
```

### Year Comparison
```typescript
const comparison = compareSalnYears(current, previous);
console.log(formatPercentChange(comparison.netWorthPercentChange));
```

## Field Requirements

### Declarant Info ✅ Required
- userId (UUID)
- year (number)
- filingType (enum)
- If joint: spouseName required

### Assets ✅ At least 1 required
- Real Property OR
- Personal Property

### Optional Sections ⚪
- Liabilities
- Business Interests
- Relatives in Government

## Enums

```typescript
// Property Kind
'residential' | 'commercial' | 'industrial' | 'agricultural' | 'mixed'

// Acquisition Mode
'Purchase' | 'Inheritance' | 'Donation' | 'Homestead' | 'Other'

// Filing Type
'joint' | 'separate' | 'not_applicable'

// Status
'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected'
```

## Helper Functions Cheat Sheet

| Function | Purpose | Returns |
|----------|---------|---------|
| `createEmptySaln(year, userId)` | Create new SALN | Partial<CompleteSalnData> |
| `calculateSalnSummary(data)` | Calculate all totals | SalnSummary |
| `calculateTotalAssets(real, personal)` | Sum assets | number |
| `calculateTotalLiabilities(liabilities)` | Sum debts | number |
| `calculateNetWorth(assets, liabilities)` | Calculate net | number |
| `compareSalnYears(current, previous)` | YoY comparison | Comparison object |
| `isSalnReadyForSubmission(data)` | Check if valid | boolean |
| `formatCurrency(amount)` | Format PHP | string |
| `formatPercentChange(percent)` | Format % | string |

## Currency Validation

```typescript
// Valid range: 0 to 9,999,999,999,999.99
// Max 2 decimal places
// Always positive
```

## Year Validation

```typescript
// Range: 1950 to current year
// Integer only
// Cannot be future
```

## Typical Workflow

```typescript
// 1. Create
const saln = createEmptySaln(2024, userId);

// 2. Add data
saln.realProperties.push({ /* ... */ });
saln.personalProperties.push({ /* ... */ });
saln.liabilities.push({ /* ... */ });

// 3. Calculate
const summary = calculateSalnSummary(saln);

// 4. Check progress
const progress = getOverallSalnProgress(saln);

// 5. Validate
if (isSalnReadyForSubmission(saln)) {
  const result = completeSalnSchema.safeParse(saln);
  if (result.success) {
    await submitSaln(result.data);
  }
}
```

## Common Errors

### "At least one asset required"
**Solution**: Add either real property or personal property

### "Spouse name is required for joint filing"
**Solution**: Provide spouseName when filingType is 'joint'

### "Amount exceeds maximum allowed value"
**Solution**: Ensure currency values < 9,999,999,999,999.99

### "Year cannot be in the future"
**Solution**: Use current year or earlier

## Database Compatibility

### Current Phase (Mock Data)
```typescript
import { useSaln } from '@tupsafe/mock-data/api/hooks';
```

### Production Phase (Database)
```typescript
import { useSaln } from '@tupsafe/database/hooks';
// Schema works the same! No changes needed.
```

### Currency Conversion
```typescript
// Reading from DB
const value = parseCurrencyFromDb(dbRecord.totalAssets);

// Writing to DB
const dbValue = formatCurrencyForDb(calculatedTotal);
```

## File Locations

- **Schema**: `src/lib/validations/saln-schema.ts`
- **Tests**: `src/lib/validations/__tests__/saln-schema.test.ts`
- **Full Guide**: `src/lib/validations/SALN_SCHEMA_GUIDE.md`
- **This Card**: `src/lib/validations/SALN_QUICK_REFERENCE.md`

## Need Help?

1. Check inline JSDoc comments in schema file
2. Read comprehensive guide: SALN_SCHEMA_GUIDE.md
3. See test file for examples: __tests__/saln-schema.test.ts
4. Review mock data: packages/mock-data/src/data/saln.ts
