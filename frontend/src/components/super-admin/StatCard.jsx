import PropTypes from "prop-types";
import Badge from "../ui/Badge.jsx";

/**
 * STAT CARD — the command-centre metric tile.
 *
 * One number, one meaning, one status direction. Deliberately static: no
 * animated counters, no charts — a Super Admin reads the platform state at
 * a glance, not through decoration.
 */
export default function StatCard({ label, value, detail, badge, icon: Icon, tone = "default" }) {
  const tones = {
    default: "border-border-default",
    attention: "border-state-warning/50 bg-state-warning-soft/50",
    good: "border-state-success/40 bg-state-success-soft/40",
  };

  return (
    <article className={`flex flex-col border bg-surface-primary p-5 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">{label}</p>
        {Icon ? <Icon size={17} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand-accent-strong" /> : null}
      </div>
      <p className="mt-3 font-serif text-h2 leading-none text-text-primary">{value}</p>
      {badge ? (
        <p className="mt-3">
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </p>
      ) : null}
      {detail ? <p className="mt-2.5 font-sans text-caption text-text-muted">{detail}</p> : null}
    </article>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  detail: PropTypes.node,
  badge: PropTypes.shape({
    label: PropTypes.string.isRequired,
    variant: PropTypes.oneOf(["neutral", "brand", "success", "warning", "error", "info"]),
  }),
  icon: PropTypes.elementType,
  tone: PropTypes.oneOf(["default", "attention", "good"]),
};
