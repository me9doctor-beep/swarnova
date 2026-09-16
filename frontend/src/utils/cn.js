import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Lightweight className merge utility used across the design system.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
