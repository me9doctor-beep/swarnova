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
            (tone === "wine" ? "text-champagne" : "italic text-gold")
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
  className,
  headingLevel = 2,
}) {
  const Tag = `h${headingLevel}`;
  const isWine = tone === "wine";

  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        align === "left" && "text-left",
        className
      )}
    >
      {eyebrow && (
        <Eyebrow tone={isWine ? "wine" : "gold"} className="mb-4 block">
          {eyebrow}
        </Eyebrow>
      )}
      <Tag
        className={cn(
          "text-balance text-[34px] leading-[1.14] sm:text-4xl lg:text-[44px]",
          isWine ? "text-cream" : "text-ink"
        )}
      >
        <TitleLines title={title} tone={tone} />
      </Tag>
      {ornament && (
        <div
          className={cn(
            "mt-5 flex items-center gap-3",
            isWine ? "text-champagne" : "text-gold",
            align === "center" && "justify-center"
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              "h-px w-12",
              isWine ? "bg-champagne/45" : "bg-gold/50"
            )}
          />
          <span className="h-[7px] w-[7px] rotate-45 border border-current" />
          <span
            className={cn(
              "h-px w-12",
              isWine ? "bg-champagne/45" : "bg-gold/50"
            )}
          />
        </div>
      )}
      {description && (
        <p
          className={cn(
            "mt-5 text-[15px] leading-relaxed",
            isWine ? "text-cream/70" : "text-ash"
          )}
        >
          {description}
        </p>
      )}
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
  className: PropTypes.string,
  headingLevel: PropTypes.number,
};
