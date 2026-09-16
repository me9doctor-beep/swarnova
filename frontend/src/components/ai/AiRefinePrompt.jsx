import { useState } from "react";
import PropTypes from "prop-types";
import Button from "../ui/Button.jsx";
import Textarea from "../ui/Textarea.jsx";

/**
 * The refinement form — the customer's second conversation with the atelier.
 * Submitting passes the words up to the session hook; the provider owns the
 * re-render. Ctrl + Enter submits from the field, as with the main prompt.
 */
export default function AiRefinePrompt({ copy, busy = false, onSubmit, onCancel }) {
  const [feedback, setFeedback] = useState("");
  const canSubmit = feedback.trim().length > 0 && !busy;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(feedback.trim());
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="ai-refine-title"
      className="border border-border-default bg-surface-primary p-5 sm:p-6"
    >
      <h3 id="ai-refine-title" className="font-serif text-h3">
        {copy.heading}
      </h3>

      <div className="mt-4">
        <Textarea
          label={copy.label}
          placeholder={copy.placeholder}
          hint={copy.hint}
          rows={3}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!canSubmit}>
          {copy.submit}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          {copy.cancel}
        </Button>
      </div>
    </form>
  );
}

AiRefinePrompt.propTypes = {
  copy: PropTypes.shape({
    heading: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
    hint: PropTypes.string,
    submit: PropTypes.string.isRequired,
    cancel: PropTypes.string.isRequired,
  }).isRequired,
  busy: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
