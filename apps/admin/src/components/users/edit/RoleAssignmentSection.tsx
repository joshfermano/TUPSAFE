'use client';

import { useMemo } from 'react';
import { Control, Controller } from 'react-hook-form';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Check,
  Crown,
  Lock,
  Shield,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import type { UserRole } from '@tupsafe/types';
import { ROLE_HIERARCHY } from '@tupsafe/types';
import { assignableRoles } from '@tupsafe/auth/permissions';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { EditUserFormValues } from '@/lib/schemas/edit-user';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface RoleAssignmentSectionProps {
  control: Control<EditUserFormValues>;
  /** Role stored in the DB before any edits (used for diff + reset) */
  currentStoredRole: UserRole;
  /** Role of the currently-signed-in admin */
  actorRole: UserRole | undefined;
  /** True when the actor is editing their own profile */
  isSelfEdit: boolean;
  /** True when the currently-selected department qualifies for HR/admin roles */
  canAssignHRDept: boolean;
}

type SelectableRole = Exclude<UserRole, 'superadmin'>;

interface RoleCardDef {
  value: SelectableRole;
  title: string;
  tagline: string;
  icon: typeof UserIcon;
  /** Tailwind classes for the tinted icon container */
  iconContainerClass: string;
  iconClass: string;
  can: string[];
  cannot: string[];
  requiresHRDept: boolean;
}

// =============================================================================
// Card Definitions — copy MUST match the spec exactly
// =============================================================================

const ROLE_CARDS: RoleCardDef[] = [
  {
    value: 'employee',
    title: 'Employee',
    tagline: 'Regular staff member without admin-portal access.',
    icon: UserIcon,
    iconContainerClass:
      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    iconClass: '',
    can: ['Submit own PDS & SALN', 'View own records'],
    cannot: ['Cannot access admin portal'],
    requiresHRDept: false,
  },
  {
    value: 'hr',
    title: 'HR Personnel',
    tagline: 'Reviews submissions and manages employee records.',
    icon: Briefcase,
    iconContainerClass:
      'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    iconClass: '',
    can: [
      'Approve/reject PDS & SALN',
      'Create/edit employees',
      'Approve registrations',
    ],
    cannot: ['Cannot delete submissions, create admins, or change roles'],
    requiresHRDept: true,
  },
  {
    value: 'admin',
    title: 'Administrator',
    tagline: 'Full admin-portal access including destructive actions.',
    icon: ShieldCheck,
    iconContainerClass:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    iconClass: '',
    can: [
      'Everything HR can do',
      'Delete submissions',
      'Create HR accounts, manage organization',
    ],
    cannot: ['Cannot create or demote superadmins'],
    requiresHRDept: true,
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Administrator',
  hr: 'HR Personnel',
  employee: 'Employee',
};

// =============================================================================
// Sub-components
// =============================================================================

function RoleBadge({
  role,
  highlighted = false,
}: {
  role: UserRole;
  highlighted?: boolean;
}) {
  return (
    <Badge
      variant={highlighted ? 'default' : 'secondary'}
      className={cn(
        'gap-1',
        highlighted
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <ShieldCheck className="h-3 w-3" aria-hidden />
      {ROLE_LABELS[role]}
    </Badge>
  );
}

/**
 * Live diff surfaced whenever the selected role differs from the stored role.
 * Elevations (privilege increases) show a warning; demotions/laterals show a
 * neutral info state.
 */
function RoleChangePreview({
  fromRole,
  toRole,
}: {
  fromRole: UserRole;
  toRole: UserRole;
}) {
  const isElevation = ROLE_HIERARCHY[toRole] > ROLE_HIERARCHY[fromRole];
  const isDemotion = ROLE_HIERARCHY[toRole] < ROLE_HIERARCHY[fromRole];

  return (
    <div
      role="status"
      className={cn(
        'rounded-lg border p-3 text-sm',
        isElevation
          ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200'
          : 'border-border bg-muted/40 text-foreground'
      )}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <RoleBadge role={fromRole} />
        <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        <RoleBadge role={toRole} highlighted />
      </div>
      <p
        className={cn(
          'flex items-start gap-1.5 text-xs',
          isElevation ? '' : 'text-muted-foreground'
        )}
      >
        {isElevation && (
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <span>
          {isElevation
            ? 'Elevation — additional permissions will be granted.'
            : isDemotion
              ? 'Demotion — permissions will be reduced.'
              : 'Lateral change — review carefully.'}
        </span>
      </p>
    </div>
  );
}

/**
 * Read-only card rendered when the target user is a superadmin. Superadmin
 * role changes live in a dedicated promotion flow, not this page.
 */
function SuperadminLockedCard() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-border bg-muted/40 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <Crown className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">Superadmin role</p>
            <Lock
              className="h-3.5 w-3.5 text-muted-foreground"
              aria-label="Locked"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Superadmin role can only be changed via the dedicated promotion
            flow. Edit other fields freely.
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function RoleAssignmentSection({
  control,
  currentStoredRole,
  actorRole,
  isSelfEdit,
  canAssignHRDept,
}: RoleAssignmentSectionProps) {
  // Which roles can the actor assign? Never includes superadmin.
  const allowedRoles = useMemo<Set<SelectableRole>>(() => {
    const assignable = assignableRoles(actorRole).filter(
      (r): r is SelectableRole => r !== 'superadmin'
    );
    return new Set(assignable);
  }, [actorRole]);

  const targetIsSuperadmin = currentStoredRole === 'superadmin';
  const isHrActor = actorRole === 'hr';

  // Visible cards = spec-defined card order, filtered to what the actor can assign.
  const visibleCards = useMemo(
    () => ROLE_CARDS.filter((card) => allowedRoles.has(card.value)),
    [allowedRoles]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" aria-hidden />
          <CardTitle>Role &amp; Access</CardTitle>
        </div>
        <CardDescription>
          Determines what this user can do across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Self-edit warning — disables role selection below */}
        {isSelfEdit && !targetIsSuperadmin && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <p className="font-medium">You cannot change your own role.</p>
            <p className="mt-1 text-xs text-destructive/80">
              Contact another superadmin if elevation is needed.
            </p>
          </div>
        )}

        {/* HR actors cannot modify roles at all */}
        {isHrActor && !targetIsSuperadmin && (
          <div
            role="status"
            className="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground"
          >
            HR users do not change roles. Contact an administrator for role changes.
          </div>
        )}

        {/* Superadmin target — no selector, locked read-only state */}
        {targetIsSuperadmin ? (
          <SuperadminLockedCard />
        ) : (
          <Controller
            control={control}
            name="role"
            render={({ field }) => {
              const selected = field.value as UserRole;
              const disabledAll = isSelfEdit || isHrActor;
              const showDiff = selected !== currentStoredRole;

              return (
                <div className="space-y-4">
                  <RadioGroup
                    value={selected}
                    onValueChange={(v) => field.onChange(v as UserRole)}
                    disabled={disabledAll}
                    aria-label="User role"
                    className="gap-3"
                  >
                    {visibleCards.map((card) => {
                      const Icon = card.icon;
                      const hrGatedOut = card.requiresHRDept && !canAssignHRDept;
                      const cardDisabled = disabledAll || hrGatedOut;
                      const isSelected = selected === card.value;
                      const inputId = `role-card-${card.value}`;
                      const titleId = `${inputId}-title`;
                      const descId = `${inputId}-desc`;

                      return (
                        <label
                          key={card.value}
                          htmlFor={inputId}
                          aria-disabled={cardDisabled || undefined}
                          className={cn(
                            'group relative flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors',
                            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/60',
                            cardDisabled &&
                              'pointer-events-none cursor-not-allowed opacity-50'
                          )}
                        >
                          <RadioGroupItem
                            id={inputId}
                            value={card.value}
                            disabled={cardDisabled}
                            aria-labelledby={titleId}
                            aria-describedby={descId}
                            className="mt-1"
                          />

                          <div className="flex-1 space-y-2.5">
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                                  card.iconContainerClass
                                )}
                                aria-hidden
                              >
                                <Icon className={cn('h-5 w-5', card.iconClass)} />
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    id={titleId}
                                    className="font-medium text-foreground"
                                  >
                                    {card.title}
                                  </span>
                                  {currentStoredRole === card.value && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] uppercase tracking-wide"
                                    >
                                      Current
                                    </Badge>
                                  )}
                                </div>
                                <p
                                  id={descId}
                                  className="text-sm text-muted-foreground"
                                >
                                  {card.tagline}
                                </p>
                              </div>
                            </div>

                            {/* Permission bullets */}
                            <ul className="space-y-1 pl-1 text-xs">
                              {card.can.map((line) => (
                                <li
                                  key={`can-${line}`}
                                  className="flex items-start gap-1.5 text-muted-foreground"
                                >
                                  <Check
                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                                    aria-hidden
                                  />
                                  <span>{line}</span>
                                </li>
                              ))}
                              {card.cannot.map((line) => (
                                <li
                                  key={`cannot-${line}`}
                                  className="flex items-start gap-1.5 text-muted-foreground"
                                >
                                  <span
                                    className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60"
                                    aria-hidden
                                  />
                                  <span>{line}</span>
                                </li>
                              ))}
                            </ul>

                            {/* HR-gating caption */}
                            {hrGatedOut && (
                              <p className="text-xs text-amber-700 dark:text-amber-300">
                                Assign an HR-prefixed department before
                                selecting this role.
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>

                  {/* Live diff callout */}
                  {showDiff && (
                    <RoleChangePreview
                      fromRole={currentStoredRole}
                      toRole={selected}
                    />
                  )}
                </div>
              );
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
