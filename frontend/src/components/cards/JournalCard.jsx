import PropTypes from "prop-types";
import Card from "../ui/Card.jsx";
import ContentLink from "../ui/ContentLink.jsx";
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
          <Eyebrow className="text-label tracking-[0.28em]">{article.category}</Eyebrow>
          <span className="shrink-0 font-sans text-caption tracking-wide text-text-muted">
            {article.readTime}
          </span>
        </div>

        <h3 className="mt-3 font-serif text-h3 leading-tight">
          <ContentLink href={article.href} className="transition-colors duration-200 hover:text-brand-primary">
            {article.title}
          </ContentLink>
        </h3>

        <p className="mt-3 text-body leading-relaxed text-text-secondary">{article.excerpt}</p>

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
