import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import BrandMark from "../../components/ui/BrandMark.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import { useAuth } from "../../features/authentication/useAuth.js";
import { useStaffLogin } from "../../features/authentication/useStaffLogin.js";
import { roleHomePath } from "../../features/authentication/roles.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";

/**
 * THE ONE STAFF LOGIN (Phase 9)
 * -----------------------------------------------------------------------------
 * A single sign-in for every staff role — Super Admin, Admin and Employee.
 * There is no role selector and there never is one: the credentials decide
 * which account signs in, the account decides the role, and the role decides
 * the console the session lands in:
 *
 *   SUPER_ADMIN → /super-admin     ADMIN → /admin     EMPLOYEE → /employee
 *
 * Frontend role handling is a UX boundary only; a future backend enforces
 * the real authorization.
 */

/** Demo accounts surfaced until a real identity provider lands. */
const DEMO_ACCOUNTS = [
  { label: "Super Admin", email: "superadmin@swarnova.in" },
  { label: "Admin (Bhubaneswar)", email: "arpita.mohanty@swarnova.in" },
  { label: "Employee (Branch Manager)", email: "meera.das@swarnova.in" },
  { label: "Employee (Sales)", email: "ananya.tripathy@swarnova.in" },
];

export default function StaffLoginPage() {
  useDocumentTitle("Staff Sign In — Swarnova");
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const { login, busy, error, clearError } = useStaffLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* An authenticated session belongs in its own console, not on the login. */
  if (isAuthenticated && role) {
    return <Navigate to={roleHomePath(role)} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    try {
      const session = await login({ email, password });
      navigate(roleHomePath(session.role), { replace: true });
    } catch {
      /* login.error renders the provider's message below */
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-gutter py-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <BrandMark />
        </div>

        <section
          aria-label="Staff sign in"
          className="mt-8 border border-border-default bg-surface-primary p-panel sm:p-8"
        >
          <p className="font-sans text-label uppercase tracking-[0.28em] text-brand-accent-strong">
            Staff Workspace
          </p>
          <h1 className="mt-2.5 text-h2 text-text-primary">Staff Sign In</h1>
          <p className="mt-3 font-sans text-body-sm text-text-secondary">
            One sign-in for the whole team. Your account decides the console
            you work in — nothing to choose here.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) clearError();
              }}
              placeholder="name@swarnova.in"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) clearError();
              }}
              placeholder="Your password"
            />

            {error ? (
              <p
                role="alert"
                className="border border-state-error/30 bg-state-error-soft px-4 py-3 font-sans text-caption text-state-error"
              >
                {error.message ?? "Sign in failed. Please try again."}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </section>

        <details className="mt-5 border border-border-default bg-surface-primary px-5 py-4">
          <summary className="cursor-pointer font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
            Demo access
          </summary>
          <p className="mt-3 font-sans text-caption text-text-muted">
            While authentication runs on mock data, every account below signs
            in with the password{" "}
            <code className="text-text-primary">Swarnova@123</code>. A real
            identity provider replaces this in a later phase.
          </p>
          <ul className="mt-3 space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li
                key={account.email}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
              >
                <span className="font-sans text-caption text-text-secondary">
                  {account.label}
                </span>
                <code className="font-sans text-caption text-text-primary">
                  {account.email}
                </code>
              </li>
            ))}
          </ul>
        </details>

        <p className="mt-6 flex items-center justify-center gap-2 font-sans text-caption text-text-muted">
          <KeyRound size={12} strokeWidth={1.5} aria-hidden="true" />
          Frontend role checks are a convenience — the backend remains the
          authority on what any account may do.
        </p>

        <p className="mt-4 text-center">
          <Button variant="link" size="sm" href="/">
            Return to Storefront
          </Button>
        </p>
      </div>
    </div>
  );
}
