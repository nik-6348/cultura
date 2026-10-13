import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return "";
  const d = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(d.getTime())) return "";
  const year = d.getUTCFullYear();
  const month = MONTH_NAMES[d.getUTCMonth()];
  const day = d.getUTCDate();
  return `${month} ${day}, ${year}`;
}
