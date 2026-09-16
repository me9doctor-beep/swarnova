import PropTypes from "prop-types";
import Card from "../ui/Card.jsx";
import Eyebrow from "../ui/Eyebrow.jsx";
import TextLink from "../ui/TextLink.jsx";

/** Magazine-like editorial card. */
export default function JournalCard({ article }) {
  return (
    <article className="group flex h-full flex-col">
      <Card.Media
        ratio="3/2"
        href={article.href}
        ariaLabel={`Read ${article.title}`}
        className="border border-border-default"
      >
        <img
          src={article.image?.src}
          alt={article.image?.alt ?? article.title}
          loading="lazy"
          className="h-full w-full object-cover transition-colors duration-200"
        />
      </Card.Media>

      <Card.Body className="pt-5">
        <div className="flex items-center justify-between gap-4">
          <Eyebrow className="text-[10px] tracking-[0.28em]">{article.category}</Eyebrow>
          <span className="shrink-0 font-sans text-[11px] tracking-wide text-mist">
            {article.readTime}
          </span>
        </div>

        <h3 className="mt-3 font-serif text-[24px] leading-tight">
          <a href={article.href} className="transition-colors duration-200 hover:text-wine">
            {article.title}
          </a>
        </h3>

        <p className="mt-3 text-[14px] leading-relaxed text-ash">{article.excerpt}</p>

        <TextLink tone="gold" href={article.href} className="mt-5">
          Read Story
        </TextLink>
      </Card.Body>
    </article>
  );
}

JournalCard.propTypes = {
  article: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string,
    excerpt: PropTypes.string,
    readTime: PropTypes.string,
    href: PropTypes.string,
    image: PropTypes.shape({ src: PropTypes.string, alt: PropTypes.string }),
  }).isRequired,
};
