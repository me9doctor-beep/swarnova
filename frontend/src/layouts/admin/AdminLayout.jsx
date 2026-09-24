import ConsoleExperience from "../console/ConsoleExperience.jsx";
import { ROLES } from "../../features/authentication/roles.js";
import { useAuth } from "../../features/authentication/useAuth.js";

/**
 * ADMIN LAYOUT — the operational workspace shell for the Admin experience.
 *
 * Admin owns its navigation, brand label and home route in
 * `layouts/console/config.js`; the chrome is the shared ConsoleShell, so this
 * file stays a thin composition point where Admin-only providers and route
 * structure can be added without touching the other experiences.
 *
 * Since Phase 14.3 every administrator is a branch administrator: the branch
 * named next to the experience label comes from the session and is DISPLAY
 * ONLY — the provider resolves the admin's real scope from their account on
 * every call, so nothing rendered here can widen access.
 *
 * Design direction: premium enterprise. Route group: /admin/*
 */
export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <ConsoleExperience
      role={ROLES.ADMIN}
      contextLabel={user?.branchName ?? null}
    />
  );
}
