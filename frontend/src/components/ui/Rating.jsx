import PropTypes from "prop-types";
import { Star } from "lucide-react";
import { cn } from "../../utils/cn.js";

/** Static five-star rating (no motion). */
export default function Rating({ average, count, className, showCount = false, size = 12 }) {
  const full = Math.round(average);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${average} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            strokeWidth={1.4}
            className={i < full ? "fill-brand-accent text-brand-accent" : "text-brand-accent/35"}
            aria-hidden="true"
          />
        ))}
      </span>
      {showCount && count != null && (
        <span className="font-sans text-[11px] tracking-wide text-text-muted">
          ({count})
        </span>
      )}
    </span>
  );
}

Rating.propTypes = {
  average: PropTypes.number.isRequired,
  count: PropTypes.number,
  className: PropTypes.string,
  showCount: PropTypes.bool,
  size: PropTypes.number,
};
