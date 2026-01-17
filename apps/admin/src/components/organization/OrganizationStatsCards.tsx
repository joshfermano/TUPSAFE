/**
 * Organization Statistics Cards Component
 *
 * Displays compact statistics for organizational units with icon-enhanced cards.
 * Shows counts for colleges, departments, offices, and total active units.
 */

'use client';

import { Building2, FolderTree, Users, CheckCircle } from 'lucide-react';

interface OrganizationStatsCardsProps {
  /**
   * Total number of colleges
   */
  totalColleges: number;

  /**
   * Total number of departments
   */
  totalDepartments: number;

  /**
   * Total number of administrative offices
   */
  totalOffices: number;

  /**
   * Total number of active organizational units
   */
  totalActive: number;
}

/**
 * Compact statistics cards for organizational overview
 */
export function OrganizationStatsCards({
  totalColleges,
  totalDepartments,
  totalOffices,
  totalActive,
}: OrganizationStatsCardsProps) {
  const stats = [
    {
      label: 'Colleges',
      value: totalColleges,
      icon: Building2,
      bgColor: 'bg-blue-100 dark:bg-blue-700/30',
      iconColor: 'text-blue-600 dark:text-blue-600',
    },
    {
      label: 'Departments',
      value: totalDepartments,
      icon: FolderTree,
      bgColor: 'bg-green-100 dark:bg-green-700/30',
      iconColor: 'text-green-600 dark:text-green-700',
    },
    {
      label: 'Offices',
      value: totalOffices,
      icon: Users,
      bgColor: 'bg-purple-100 dark:bg-purple-700/30',
      iconColor: 'text-purple-600 dark:text-purple-700',
    },
    {
      label: 'Active Units',
      value: totalActive,
      icon: CheckCircle,
      bgColor: 'bg-orange-100 dark:bg-orange-700/30',
      iconColor: 'text-orange-600 dark:text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <div className={`rounded-md ${stat.bgColor} p-2`}>
              <Icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
