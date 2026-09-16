import PropTypes from "prop-types";
import Eyebrow from "../ui/Eyebrow.jsx";
import { cn } from "../../utils/cn.js";

/**
 * PAGE HEADER — the page's own identity inside the console shell: the single
 * `<h1>` of a screen, its optional description and its page-level actions.
 *
 * The topbar carries global chrome (location, session, notifications); this
 * carries the page. Every console screen uses it, so heading level, type scale
 * and the action alignment stay identical across Admin, Super Admin and
 * Employee without any page repeating the markup.
 */
export default function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border-default pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <Eyebrow tone="gold" className="text-label tracking-[0.28em]">
            {eyebrow}
          </Eyebrow>
        ) : null}
        <h1 className="mt-2.5 text-h2 text-text-primary">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl font-sans text-body-sm text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

PageHeader.propTypes = {
  eyebrow: PropTypes.node,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  /** Page-level actions (Button, IconButton, …). */
  actions: PropTypes.node,
  className: PropTypes.string,
};
