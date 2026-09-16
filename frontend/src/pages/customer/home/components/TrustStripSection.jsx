import PropTypes from "prop-types";
import Icon from "../../../../components/ui/Icon.jsx";
import Container from "../../../../components/ui/Container.jsx";

/** White service/promise strip with gold line icons and hairline dividers. */
export default function TrustStripSection({ content }) {
  return (
    <section aria-label="The Swarnova promise" className="border-b border-border-default bg-surface-primary">
      <Container className="grid grid-cols-2 gap-x-5 gap-y-8 py-10 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10 lg:py-12">
        {content.items.map((item, index) => (
          <div
            key={item.title}
            className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 lg:justify-center lg:px-5 ${
              index !== 0 ? "lg:border-l lg:border-border-default" : ""
            }`}
          >
            <Icon
              name={item.icon}
              size={24}
              className="shrink-0 text-brand-accent sm:mt-0.5"
            />
            <div className="min-w-0">
              <h2 className="font-sans text-label font-medium uppercase tracking-[0.18em] text-text-primary sm:text-nav sm:tracking-[0.22em]">
                {item.title}
              </h2>
              <p className="mt-1.5 font-sans text-caption leading-snug text-text-secondary sm:text-body-sm">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}

TrustStripSection.propTypes = {
  content: PropTypes.shape({
    items: PropTypes.arrayOf(
      PropTypes.shape({
        icon: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        text: PropTypes.string,
      })
    ),
  }).isRequired,
};
