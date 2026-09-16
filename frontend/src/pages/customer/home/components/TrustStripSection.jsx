import PropTypes from "prop-types";
import Icon from "../../../../components/ui/Icon.jsx";
import Container from "../../../../components/ui/Container.jsx";

/** White service/promise strip with gold line icons and hairline dividers. */
export default function TrustStripSection({ content }) {
  return (
    <section aria-label="The Swarnova promise" className="border-b border-line bg-paper">
      <Container className="grid grid-cols-2 gap-x-5 gap-y-8 py-10 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-9 lg:py-12">
        {content.items.map((item, index) => (
          <div
            key={item.title}
            className={`flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-4 lg:justify-center lg:px-5 ${
              index !== 0 ? "lg:border-l lg:border-line" : ""
            }`}
          >
            <Icon
              name={item.icon}
              size={28}
              className="shrink-0 text-gold sm:mt-0.5 sm:size-[30px]"
            />
            <div className="min-w-0">
              <h2 className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-ink sm:text-[11px] sm:tracking-[0.22em]">
                {item.title}
              </h2>
              <p className="mt-1.5 font-sans text-[12.5px] leading-snug text-ash sm:text-[13px]">
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
