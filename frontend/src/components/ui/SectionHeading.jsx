import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";
import Eyebrow from "./Eyebrow.jsx";

function TitleLines({ title, tone }) {
  const lines = Array.isArray(title?.lines)
    ? title.lines
    : [{ text: title, emphasis: false }];

  return lines.map((line, index) => (
    <span key={`${line.text}-${index}`} className="block">
      <span
        className={cn(
          line.emphasis &&
            (tone === "wine" ? "text-brand-accent-soft" : "italic text-brand-accent")
        )}
      >
        {line.text}
      </span>
    </span>
  ));
}

/**
 * Eyebrow + serif display heading + optional ornamental divider and copy.
 * Used for the consistent centered editorial rhythm across sections.
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "ink",
  ornament = true,
  action,
  className,
  headingLevel = 2,
}) {
  const Tag = `h${headingLevel}`;
  const isWine = tone === "wine";
  /* With an action the heading becomes the left column of a two-up row — the
     editorial pattern for "section title … quiet action" on one line. */
  const isRow = Boolean(action);

  const block = (
    <div
      className={cn(
        "max-w-2xl",
        isRow ? "text-left" : align === "center" && "mx-auto text-center",
        !isRow && align === "left" && "text-left",
        !isRow && className
      )}
    >
      {eyebrow && (
        <Eyebrow tone={isWine ? "wine" : "gold"} className="mb-4 block">
          {eyebrow}
        </Eyebrow>
      )}
      <Tag
        className={cn(
          "text-balance text-h2 leading-[1.14] sm:text-h1 lg:text-display",
          isWine ? "text-text-inverse" : "text-text-primary"
        )}
      >
        <TitleLines title={title} tone={tone} />
      </Tag>
      {ornament && (
        <div
          className={cn(
            "mt-5 flex items-center gap-3",
            isWine ? "text-brand-accent-soft" : "text-brand-accent",
            !isRow && align === "center" && "justify-center"
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              "h-px w-12",
              isWine ? "bg-brand-accent-soft/45" : "bg-brand-accent/50"
            )}
          />
          <span className="h-[7px] w-[7px] rotate-45 border border-current" />
          <span
            className={cn(
              "h-px w-12",
              isWine ? "bg-brand-accent-soft/45" : "bg-brand-accent/50"
            )}
          />
        </div>
      )}
      {description && (
        <p
          className={cn(
            "mt-5 text-body-lg",
            isWine ? "text-text-inverse/70" : "text-text-secondary"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );

  if (!isRow) {
    return block;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10",
        className
      )}
    >
      {block}
      <div className="shrink-0">{action}</div>
    </div>
  );
}

SectionHeading.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      lines: PropTypes.arrayOf(
        PropTypes.shape({
          text: PropTypes.string,
          emphasis: PropTypes.bool,
        })
      ),
    }),
  ]).isRequired,
  description: PropTypes.string,
  align: PropTypes.oneOf(["center", "left"]),
  tone: PropTypes.oneOf(["ink", "wine"]),
  ornament: PropTypes.bool,
  /** Quiet action rendered on the heading's line (usually a TextLink). */
  action: PropTypes.node,
  className: PropTypes.string,
  headingLevel: PropTypes.number,
};
