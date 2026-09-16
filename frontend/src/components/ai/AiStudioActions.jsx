import PropTypes from "prop-types";
import { Check } from "lucide-react";
import Button from "../ui/Button.jsx";

/**
 * The concept's action row — refine, vary, save, share — plus the studio's
 * single live status channel. Busy, error and confirmation messages all
 * render in the one `aria-live` region, so assistive technology hears the
 * generation state without any animation.
 */
export default function AiStudioActions({
  copy,
  hasConcept = true,
  busyMessage,
  error,
  note,
  isSaved = false,
  onOpenRefine,
  onVary,
  onSave,
  onShare,
}) {
  const busy = Boolean(busyMessage);
  const disabled = busy || !hasConcept;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" disabled={disabled} onClick={onOpenRefine}>
          {copy.actions.refine}
        </Button>
        <Button variant="outline" disabled={disabled} onClick={onVary}>
          {copy.actions.vary}
        </Button>
        <Button
          variant={isSaved ? "secondary" : "primary"}
          disabled={disabled || isSaved}
          onClick={onSave}
        >
          {isSaved ? (
            <>
              <Check size={13} strokeWidth={1.8} aria-hidden="true" />
              {copy.actions.saved}
            </>
          ) : (
            copy.actions.save
          )}
        </Button>
        <Button variant="outline" disabled={disabled} onClick={onShare}>
          {copy.actions.share}
        </Button>
      </div>

      <div className="mt-4" aria-live="polite">
        {busyMessage ? (
          <p role="status" className="eyebrow eyebrow-light">
            {busyMessage}
          </p>
        ) : error ? (
          <p role="alert" className="text-body text-state-error">
            {error.message}
          </p>
        ) : note ? (
          <p role="status" className="text-body-sm text-brand-accent-strong">
            {note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

AiStudioActions.propTypes = {
  /** The atelier content model — reads `actions` from it. */
  copy: PropTypes.shape({
    actions: PropTypes.shape({
      refine: PropTypes.string.isRequired,
      vary: PropTypes.string.isRequired,
      save: PropTypes.string.isRequired,
      saved: PropTypes.string.isRequired,
      share: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  hasConcept: PropTypes.bool,
  /** The static generation message while an action is rendering. */
  busyMessage: PropTypes.string,
  error: PropTypes.shape({ message: PropTypes.string }),
  /** Quiet confirmation (save / share). */
  note: PropTypes.string,
  isSaved: PropTypes.bool,
  onOpenRefine: PropTypes.func.isRequired,
  onVary: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
};
