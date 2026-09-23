import PropTypes from "prop-types";
import { OperationsBaseProvider } from "./operationsBase.jsx";

/**
 * Mounts a shared operational page inside the Super Admin console.
 * The page is the Admin screen; the base path keeps every link in
 * `/super-admin`. Authority stays organization-wide because the provider
 * methods these pages call are the unscoped canonical book.
 */
export default function OperationalRoute({ page: Page }) {
  return (
    <OperationsBaseProvider base="/super-admin">
      <Page />
    </OperationsBaseProvider>
  );
}

OperationalRoute.propTypes = {
  page: PropTypes.elementType.isRequired,
};
