import PropTypes from "prop-types";
import Icon from "../../../../components/ui/Icon.jsx";
import Container from "../../../../components/ui/Container.jsx";

/** White service/promise strip with gold line icons and hairline dividers. */
export default function TrustStripSection({ content }) {
  return (
    <section aria-label="The Swarnova promise" className="border-b border-line bg-paper">
      <Container className="grid grid-cols-1 gap-x-6 gap-y-9 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:py-12">
        {content.items.map((item, index) => (
          <div
            key={item.title}
            className={`flex items-start gap-4 lg:justify-center lg:px-5 ${
              index !== 0 ? "lg:border-l lg:border-line" : ""
            }`}
          >
            <Icon
              name={item.icon}
              size={30}
              className="mt-0.5 shrink-0 text-gold"
            />
            <div>
              <h2 className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-ink">
                {item.title}
              </h2>
              <p className="mt-1.5 font-sans text-[13px] leading-snug text-ash">
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
