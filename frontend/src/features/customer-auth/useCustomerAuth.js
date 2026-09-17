import { useContext } from "react";
import { CustomerAuthContext } from "./CustomerAuthProvider.jsx";

/**
 * Access the customer session.
 *
 *   const { customer, isAuthenticated, isLoading, signOut } = useCustomerAuth();
 *
 * This is the ONLY customer identity hook — pages never hold their own copy
 * of "currentUser". Staff sessions live in `useAuth()` and are untouched.
 */
export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}

export default useCustomerAuth;
