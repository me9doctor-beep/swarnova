import { useRef, useState } from "react";
import PropTypes from "prop-types";
import Button from "../ui/Button.jsx";
import Select from "../ui/Select.jsx";
import Textarea from "../ui/Textarea.jsx";

/**
 * The studio's creation form — natural language first. The prompt is the
 * centrepiece; the four design-direction selects are optional context, and
 * the inspiration examples fill the prompt rather than generating silently,
 * so the customer stays in control.
 */
export default function AiStudioPrompt({ copy, busy = false, onCreate }) {
  const [draft, setDraft] = useState("");
  const [jewelleryType, setJewelleryType] = useState("");
  const [style, setStyle] = useState("");
  const [occasion, setOccasion] = useState("");
  const [purity, setPurity] = useState("");
  const promptRef = useRef(null);

  const { prompt: promptCopy, context, inspirations } = copy;
  const canCreate = draft.trim().length > 0 && !busy;

  const submitDraft = () => {
    if (!canCreate) return;
    onCreate({
      prompt: draft.trim(),
      jewelleryType: jewelleryType || undefined,
      style: style || undefined,
      occasion: occasion || undefined,
      purity: purity || undefined,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitDraft();
  };

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      submitDraft();
    }
  };

  const useInspiration = (example) => {
    setDraft(example.prompt);
    promptRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} aria-labelledby="ai-studio-create-title">
      <h2 id="ai-studio-create-title" className="font-serif text-h2 leading-[1.2]">
        {promptCopy.heading}
      </h2>

      <div className="mt-6">
        <Textarea
          ref={promptRef}
          label={promptCopy.label}
          placeholder={promptCopy.placeholder}
          hint={promptCopy.hint}
          rows={5}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          required
        />
      </div>

      <fieldset className="mt-6">
        <legend className="font-sans text-label uppercase tracking-[0.18em] text-text-secondary">
          {context.heading}
        </legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Select
            label={context.fields.jewelleryType}
            value={jewelleryType}
            onChange={(event) => setJewelleryType(event.target.value)}
          >
            <option value="">{context.anyOption}</option>
            {context.jewelleryTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            label={context.fields.style}
            value={style}
            onChange={(event) => setStyle(event.target.value)}
          >
            <option value="">{context.anyOption}</option>
            {context.styles.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            label={context.fields.occasion}
            value={occasion}
            onChange={(event) => setOccasion(event.target.value)}
          >
            <option value="">{context.anyOption}</option>
            {context.occasions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            label={context.fields.purity}
            value={purity}
            onChange={(event) => setPurity(event.target.value)}
          >
            <option value="">{context.anyOption}</option>
            {context.purities.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </fieldset>

      <div className="mt-6">
        <p className="font-sans text-label uppercase tracking-[0.18em] text-text-secondary">
          {inspirations.heading}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {inspirations.examples.map((example) => (
            <Button
              key={example.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => useInspiration(example)}
              aria-label={`Use the ${example.label} inspiration in the prompt`}
            >
              {example.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <Button type="submit" disabled={!canCreate} className="w-full sm:w-auto">
          {promptCopy.submit}
        </Button>
      </div>
    </form>
  );
}

AiStudioPrompt.propTypes = {
  /** The atelier content model. */
  copy: PropTypes.shape({
    prompt: PropTypes.shape({
      heading: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      placeholder: PropTypes.string.isRequired,
      hint: PropTypes.string,
      submit: PropTypes.string.isRequired,
    }).isRequired,
    context: PropTypes.shape({
      heading: PropTypes.string.isRequired,
      fields: PropTypes.shape({
        jewelleryType: PropTypes.string.isRequired,
        style: PropTypes.string.isRequired,
        occasion: PropTypes.string.isRequired,
        purity: PropTypes.string.isRequired,
      }).isRequired,
      anyOption: PropTypes.string.isRequired,
      jewelleryTypes: PropTypes.array.isRequired,
      styles: PropTypes.array.isRequired,
      occasions: PropTypes.array.isRequired,
      purities: PropTypes.array.isRequired,
    }).isRequired,
    inspirations: PropTypes.shape({
      heading: PropTypes.string.isRequired,
      examples: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          prompt: PropTypes.string.isRequired,
        })
      ).isRequired,
    }).isRequired,
  }).isRequired,
  busy: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
};
