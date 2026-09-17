import PropTypes from "prop-types";
import BrandMark from "../ui/BrandMark.jsx";
import Button from "../ui/Button.jsx";
import Container from "../ui/Container.jsx";

/**
 * AUTH SHELL (Phase 11)
 * ----------------------------------------------------------------------------
 * The shared editorial gateway for `/login`, `/register`, `/forgot-password`
 * and `/reset-password` — a centred, ivory-set card in the customer visual
 * language (serif display, champagne hairlines, premium whitespace), never
 * the console chrome of the staff surfaces. A functional gateway, not a
 * marketing page: brand lockup, one heading, the form, related auth links.
 *
 * Deliberately static — no imagery, no motion, no marketing panels.
 */
export default function AuthShell({ eyebrow, title, lede, children, footer }) {
  return (
    <div className="bg-surface-secondary/40 pb-20 pt-[132px] sm:pb-28 sm:pt-[152px] lg:pt-[168px]">
      <Container className="max-w-md">
        <section
          aria-label={title}
          className="border border-border-default bg-surface-primary p-panel sm:p-10"
        >
          <div className="flex justify-center">
            <BrandMark />
          </div>

          <p className="mt-8 text-center font-sans text-label uppercase tracking-[0.28em] text-brand-accent-strong">
            {eyebrow}
          </p>
          <h1 className="mt-2.5 text-center font-serif text-h2 font-medium text-text-primary">
            {title}
          </h1>
          {lede ? (
            <p className="mx-auto mt-3 max-w-sm text-center font-serif text-body italic leading-relaxed text-text-secondary">
              {lede}
            </p>
          ) : null}

          <div
            aria-hidden="true"
            className="mx-auto mt-6 h-px w-16 bg-brand-accent/60"
          />

          <div className="mt-6">{children}</div>
        </section>

        {footer ? <div className="mt-5">{footer}</div> : null}

        <p className="mt-6 text-center">
          <Button variant="link" size="sm" href="/">
            Return to Storefront
          </Button>
        </p>
      </Container>
    </div>
  );
}

AuthShell.propTypes = {
  eyebrow: PropTypes.node.isRequired,
  title: PropTypes.node.isRequired,
  lede: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
};
