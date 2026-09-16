import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Lightweight className merge utility used across the design system.
 *
 * tailwind-merge is taught the Swarnova token names (typography, spacing,
 * radius, elevation) so a design token behaves exactly like the Tailwind
 * utility it is built from. Without this, `text-h1` and `text-text-primary`
 * look like the same class group and one of them would silently disappear.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display",
        "h1",
        "h2",
        "h3",
        "h4",
        "body-lg",
        "body",
        "body-sm",
        "caption",
        "nav",
        "label",
        "price",
      ],
      spacing: ["gutter", "panel"],
      radius: ["pill"],
      shadow: ["subtle", "medium"],
    },
  },
});

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
