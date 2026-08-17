import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to the Brandex standard display format.
 * Output: DD-MMM-YY HH:MM AM/PM  e.g. "18-Aug-26 02:10 AM"
 *
 * Handles:
 *  - ISO strings: "2026-08-18T02:10:00"
 *  - Date-only:   "2026-08-18"
 *  - Google Sheets date strings
 *  - null / undefined / empty → returns "—"
 */
export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    let date: Date;
    if (d instanceof Date) {
      date = d;
    } else {
      // Try ISO parse first
      date = parseISO(d);
      if (!isValid(date)) date = new Date(d);
    }
    if (!isValid(date)) return String(d);
    return format(date, "dd-MMM-yy hh:mm aa");
  } catch {
    return String(d);
  }
}

/**
 * Format a date string for display in short form.
 * Output: DD-MMM-YY  e.g. "18-Aug-26"
 */
export function formatDateShort(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    let date: Date;
    if (d instanceof Date) {
      date = d;
    } else {
      date = parseISO(d);
      if (!isValid(date)) date = new Date(d);
    }
    if (!isValid(date)) return String(d);
    return format(date, "dd-MMM-yy");
  } catch {
    return String(d);
  }
}

/**
 * Normalize a TM number for comparison (strips whitespace, trailing .0, quotes)
 */
export function normalizeTmNo(val: string | null | undefined): string {
  return String(val ?? "")
    .trim()
    .replace(/\.0$/, "")
    .replace(/^["']|["']$/g, "");
}
