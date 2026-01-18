"""Formatting utilities for TUPSAFE AI Agent.

Provides helper functions for calculating ages, tenure, and formatting names
used by listing and age-related tools.
"""

from datetime import date, datetime
from typing import Optional, Union


def calculate_age(date_of_birth: Union[str, date, None]) -> Optional[int]:
    """Calculate age from date of birth.

    Args:
        date_of_birth: Date of birth as string (YYYY-MM-DD), date object, or None

    Returns:
        Age in years, or None if date_of_birth is invalid/None

    Example:
        >>> calculate_age("1990-05-15")
        34  # If current date is 2025-01-18
        >>> calculate_age(None)
        None
    """
    if date_of_birth is None:
        return None

    try:
        # Convert string to date if needed
        if isinstance(date_of_birth, str):
            # Handle ISO format with or without time
            if "T" in date_of_birth:
                date_of_birth = date_of_birth.split("T")[0]
            dob = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
        elif isinstance(date_of_birth, datetime):
            dob = date_of_birth.date()
        elif isinstance(date_of_birth, date):
            dob = date_of_birth
        else:
            return None

        today = date.today()

        # Calculate age, accounting for whether birthday has occurred this year
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        # Validate reasonable age range
        if age < 0 or age > 150:
            return None

        return age

    except (ValueError, TypeError, AttributeError):
        return None


def calculate_tenure_years(hire_date: Union[str, date, None]) -> Optional[float]:
    """Calculate years of service from hire date.

    Args:
        hire_date: Hire date as string (YYYY-MM-DD), date object, or None

    Returns:
        Years of service as float (rounded to 2 decimal places),
        or None if hire_date is invalid/None

    Example:
        >>> calculate_tenure_years("2020-01-15")
        5.01  # If current date is 2025-01-18
        >>> calculate_tenure_years(None)
        None
    """
    if hire_date is None:
        return None

    try:
        # Convert string to date if needed
        if isinstance(hire_date, str):
            # Handle ISO format with or without time
            if "T" in hire_date:
                hire_date = hire_date.split("T")[0]
            hd = datetime.strptime(hire_date, "%Y-%m-%d").date()
        elif isinstance(hire_date, datetime):
            hd = hire_date.date()
        elif isinstance(hire_date, date):
            hd = hire_date
        else:
            return None

        today = date.today()

        # Calculate tenure in days, then convert to years
        tenure_days = (today - hd).days

        # Validate reasonable tenure range (not in the future, not more than 100 years)
        if tenure_days < 0 or tenure_days > 36500:  # ~100 years
            return None

        tenure_years = tenure_days / 365.25  # Account for leap years

        return round(tenure_years, 2)

    except (ValueError, TypeError, AttributeError):
        return None


def format_full_name(
    first_name: Optional[str],
    last_name: Optional[str],
    middle_name: Optional[str] = None,
    format_style: str = "standard",
) -> str:
    """Format a full name from component parts.

    Args:
        first_name: First/given name
        last_name: Last/family name
        middle_name: Optional middle name
        format_style: Formatting style - 'standard' (First M. Last),
                     'formal' (Last, First M.), or 'full' (First Middle Last)

    Returns:
        Formatted full name, or "Unknown" if both first and last names are missing

    Example:
        >>> format_full_name("John", "Doe", "Robert")
        'John R. Doe'
        >>> format_full_name("John", "Doe", "Robert", format_style="formal")
        'Doe, John R.'
        >>> format_full_name("John", "Doe", "Robert", format_style="full")
        'John Robert Doe'
    """
    # Handle missing names
    fn = (first_name or "").strip()
    ln = (last_name or "").strip()
    mn = (middle_name or "").strip()

    if not fn and not ln:
        return "Unknown"

    # Format middle name initial if provided
    middle_initial = f"{mn[0]}." if mn else ""

    if format_style == "formal":
        # Last, First M.
        if ln and fn:
            if middle_initial:
                return f"{ln}, {fn} {middle_initial}"
            return f"{ln}, {fn}"
        return ln or fn

    elif format_style == "full":
        # First Middle Last
        parts = [fn, mn, ln]
        return " ".join(p for p in parts if p)

    else:  # standard
        # First M. Last
        if fn and ln:
            if middle_initial:
                return f"{fn} {middle_initial} {ln}"
            return f"{fn} {ln}"
        return fn or ln


def parse_date_string(date_string: Optional[str]) -> Optional[date]:
    """Parse a date string into a date object.

    Handles multiple date formats commonly returned by Supabase.

    Args:
        date_string: Date as string in various formats

    Returns:
        date object, or None if parsing fails

    Example:
        >>> parse_date_string("2025-01-18")
        datetime.date(2025, 1, 18)
        >>> parse_date_string("2025-01-18T10:30:00Z")
        datetime.date(2025, 1, 18)
    """
    if not date_string:
        return None

    try:
        # Handle ISO format with time
        if "T" in date_string:
            date_string = date_string.split("T")[0]

        return datetime.strptime(date_string, "%Y-%m-%d").date()

    except (ValueError, TypeError):
        return None


def format_age_bracket(age: Optional[int]) -> str:
    """Convert age to standard age bracket.

    Args:
        age: Age in years

    Returns:
        Age bracket string (e.g., "25-34", "Under 25", "65+")

    Example:
        >>> format_age_bracket(28)
        '25-34'
        >>> format_age_bracket(67)
        '65+'
    """
    if age is None:
        return "Unknown"

    if age < 25:
        return "Under 25"
    elif age < 35:
        return "25-34"
    elif age < 45:
        return "35-44"
    elif age < 55:
        return "45-54"
    elif age < 65:
        return "55-64"
    else:
        return "65+"
