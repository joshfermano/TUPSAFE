/**
 * Philippine Government Salary Grades 2025
 * SSL V - Second Tranche
 *
 * Source: Department of Budget and Management (DBM)
 * Reference: Salary Standardization Law (SSL) V Implementation
 */

/**
 * Salary Grade Level type (1-33)
 */
export type SalaryGradeLevel =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30
  | 31 | 32 | 33;

/**
 * Salary Grade structure
 */
export interface SalaryGrade {
  monthly: number;
  label: string;
}

/**
 * Complete mapping of 2025 Salary Grades (SSL V - Second Tranche)
 */
export const SALARY_GRADES_2025: Record<SalaryGradeLevel, SalaryGrade> = {
  1: { monthly: 14061, label: "SG 1 - PHP 14,061" },
  2: { monthly: 14925, label: "SG 2 - PHP 14,925" },
  3: { monthly: 15852, label: "SG 3 - PHP 15,852" },
  4: { monthly: 16833, label: "SG 4 - PHP 16,833" },
  5: { monthly: 17866, label: "SG 5 - PHP 17,866" },
  6: { monthly: 18957, label: "SG 6 - PHP 18,957" },
  7: { monthly: 20110, label: "SG 7 - PHP 20,110" },
  8: { monthly: 21448, label: "SG 8 - PHP 21,448" },
  9: { monthly: 23226, label: "SG 9 - PHP 23,226" },
  10: { monthly: 25586, label: "SG 10 - PHP 25,586" },
  11: { monthly: 30024, label: "SG 11 - PHP 30,024" },
  12: { monthly: 32245, label: "SG 12 - PHP 32,245" },
  13: { monthly: 34421, label: "SG 13 - PHP 34,421" },
  14: { monthly: 37024, label: "SG 14 - PHP 37,024" },
  15: { monthly: 40208, label: "SG 15 - PHP 40,208" },
  16: { monthly: 43560, label: "SG 16 - PHP 43,560" },
  17: { monthly: 47247, label: "SG 17 - PHP 47,247" },
  18: { monthly: 51304, label: "SG 18 - PHP 51,304" },
  19: { monthly: 56390, label: "SG 19 - PHP 56,390" },
  20: { monthly: 62967, label: "SG 20 - PHP 62,967" },
  21: { monthly: 70013, label: "SG 21 - PHP 70,013" },
  22: { monthly: 78162, label: "SG 22 - PHP 78,162" },
  23: { monthly: 87315, label: "SG 23 - PHP 87,315" },
  24: { monthly: 98185, label: "SG 24 - PHP 98,185" },
  25: { monthly: 111727, label: "SG 25 - PHP 111,727" },
  26: { monthly: 126252, label: "SG 26 - PHP 126,252" },
  27: { monthly: 142663, label: "SG 27 - PHP 142,663" },
  28: { monthly: 160469, label: "SG 28 - PHP 160,469" },
  29: { monthly: 180492, label: "SG 29 - PHP 180,492" },
  30: { monthly: 203200, label: "SG 30 - PHP 203,200" },
  31: { monthly: 293191, label: "SG 31 - PHP 293,191" },
  32: { monthly: 347888, label: "SG 32 - PHP 347,888" },
  33: { monthly: 438844, label: "SG 33 - PHP 438,844" },
};

/**
 * Format a salary grade number into display string
 * @param grade - Salary grade level (1-33)
 * @returns Formatted string "SG X - PHP XX,XXX" or empty string if invalid
 *
 * @example
 * formatSalaryGrade(15) // Returns "SG 15 - PHP 40,208"
 */
export function formatSalaryGrade(grade: number): string {
  if (grade < 1 || grade > 33 || !Number.isInteger(grade)) {
    return "";
  }

  const salaryGrade = SALARY_GRADES_2025[grade as SalaryGradeLevel];
  return salaryGrade?.label || "";
}

/**
 * Get the monthly salary amount for a specific grade
 * @param grade - Salary grade level (1-33)
 * @returns Monthly salary amount or null if invalid grade
 *
 * @example
 * getSalaryAmount(15) // Returns 40208
 */
export function getSalaryAmount(grade: number): number | null {
  if (grade < 1 || grade > 33 || !Number.isInteger(grade)) {
    return null;
  }

  const salaryGrade = SALARY_GRADES_2025[grade as SalaryGradeLevel];
  return salaryGrade?.monthly ?? null;
}

/**
 * Get salary grade options for dropdown/select components
 * @returns Array of { value, label } objects for all salary grades
 *
 * @example
 * const options = getSalaryGradeOptions();
 * // Returns [{ value: 1, label: "SG 1 - PHP 14,061" }, ...]
 */
export function getSalaryGradeOptions(): Array<{ value: number; label: string }> {
  return Object.entries(SALARY_GRADES_2025).map(([grade, info]) => ({
    value: parseInt(grade, 10),
    label: info.label,
  }));
}

/**
 * Validate if a number is a valid salary grade
 * @param grade - Number to validate
 * @returns True if valid salary grade (1-33)
 *
 * @example
 * isValidSalaryGrade(15) // Returns true
 * isValidSalaryGrade(35) // Returns false
 */
export function isValidSalaryGrade(grade: number): grade is SalaryGradeLevel {
  return Number.isInteger(grade) && grade >= 1 && grade <= 33;
}

/**
 * Get annual salary from monthly amount
 * @param monthlyAmount - Monthly salary amount
 * @returns Annual salary (monthly * 12)
 *
 * @example
 * getAnnualSalary(40208) // Returns 482496
 */
export function getAnnualSalary(monthlyAmount: number): number {
  return monthlyAmount * 12;
}

/**
 * Get annual salary for a specific grade
 * @param grade - Salary grade level (1-33)
 * @returns Annual salary or null if invalid grade
 *
 * @example
 * getAnnualSalaryByGrade(15) // Returns 482496
 */
export function getAnnualSalaryByGrade(grade: number): number | null {
  const monthly = getSalaryAmount(grade);
  return monthly !== null ? getAnnualSalary(monthly) : null;
}

/**
 * Format a salary amount with PHP currency
 * @param amount - Salary amount to format
 * @returns Formatted string "PHP XX,XXX"
 *
 * @example
 * formatSalaryAmount(40208) // Returns "PHP 40,208"
 */
export function formatSalaryAmount(amount: number): string {
  return `PHP ${amount.toLocaleString('en-PH')}`;
}
