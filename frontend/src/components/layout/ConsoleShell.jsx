import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Container from "../ui/Container.jsx";
import SkipLink from "../ui/SkipLink.jsx";
import ConsoleSidebar from "./ConsoleSidebar.jsx";
import ConsoleTopbar from "./ConsoleTopbar.jsx";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";

/**
 * CONSOLE SHELL — the shared structural shell for the three management
 * experiences (Super Admin, Admin, Employee).
 *
 *   ConsoleShell
 *   ├── ConsoleSidebar   (brand, experience, navigation groups, utility area)
 *   ├── ConsoleTopbar    (breadcrumb, actions, identity)
 *   └── Main             (the route's page content)
 *
 * Everything an experience needs to differ in arrives as configuration — brand
 * label, navigation data, role, session, topbar actions and content — so this
 * is the only shell implementation in the codebase. Design direction: premium
 * enterprise — calm surfaces, hairlines, wine accents, compact rhythm.
 */
export default function ConsoleShell({
  experience,
  homePath = "/",
  navigation,
  role,
  user,
  onSignOut,
  actions,
  children,
}) {
  const [navOpen, setNavOpen] = useState(false);
  useBodyScrollLock(navOpen);

  const closeNav = () => setNavOpen(false);

  /* The drawer is a dialog: Escape closes it, like the backdrop does. */
  useEffect(() => {
    if (!navOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeNav();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <SkipLink href="#console-main">Skip to workspace</SkipLink>

      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeNav}
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
        />
      )}

      <ConsoleSidebar
        experience={experience}
        homePath={homePath}
        navigation={navigation}
        open={navOpen}
        onClose={closeNav}
      />

      <div className="lg:pl-[264px]">
        <ConsoleTopbar
          experience={experience}
          homePath={homePath}
          role={role}
          user={user}
          onSignOut={onSignOut}
          actions={actions}
          onOpenNav={() => setNavOpen(true)}
        />

        <main id="console-main" data-scroll-container>
          <Container size="wide" className="px-gutter py-8 lg:px-8 lg:py-10">
            {children}
          </Container>
        </main>
      </div>
    </div>
  );
}

ConsoleShell.propTypes = {
  /** Experience label, e.g. "Super Admin". */
  experience: PropTypes.string.isRequired,
  /** The console's own root route. */
  homePath: PropTypes.string,
  /** Navigation groups: [{ label?, items: [{ label, to, end?, icon, capability? }] }]. */
  navigation: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          to: PropTypes.string.isRequired,
          end: PropTypes.bool,
          icon: PropTypes.elementType,
          capability: PropTypes.string,
        })
      ).isRequired,
    })
  ).isRequired,
  role: PropTypes.string,
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  onSignOut: PropTypes.func,
  actions: PropTypes.node,
  children: PropTypes.node,
};
