import { useState } from "react";
import { useNavigate } from "react-router";

import { AdminSignInForm } from "~/components/auth/AdminSignInForm";
import { CashierSignInForm } from "~/components/auth/CashierSignInForm";
import { RoleCard } from "~/components/auth/RoleCard";
import { SignInBrandPanel } from "~/components/auth/SignInBrandPanel";
import { Logo } from "~/components/ui/Logo";
import { ownerAuthRepository } from "~/infrastructure/api/owner-auth-repository";
import { signInOwner } from "~/use_cases/sign-in-owner";

type Role = "cashier" | "admin";

const cashierIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const adminIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
  </svg>
);

const OFFLINE_MESSAGE = "You are offline. Check your connection and try again.";

export default function SignInRoute() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("cashier");
  const [adminPending, setAdminPending] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  async function handleAdminSubmit(
    login: string,
    password: string,
    remember: boolean,
  ) {
    setAdminPending(true);
    setAdminError(null);
    const result = await signInOwner(
      ownerAuthRepository,
      login,
      password,
      remember,
    );
    setAdminPending(false);
    if (result.status === "success") {
      void navigate("/admin");
    } else if (result.status === "invalid_credentials") {
      setAdminError("Wrong email, username or password.");
    } else {
      setAdminError(OFFLINE_MESSAGE);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#C9D3E0] via-[#E4E9F0] to-[#B8C4D4] p-6">
      <div className="flex overflow-hidden rounded-xl shadow-2xl">
        <SignInBrandPanel />
        <div className="flex w-[592px] flex-col bg-off-white px-11 py-[22px]">
          <div className="h-4 text-right text-xs text-text-secondary">
            Version 1.0 (POC)
          </div>

          <div className="mt-2 flex flex-col items-center gap-1">
            <Logo variant="navy" size={58} />
            <div className="mt-1 font-heading text-[42px] leading-tight font-bold">
              Mart<span className="text-gold">Desk</span>
            </div>
            <div className="text-sm text-[#34445A]">
              POS &amp; Store Management
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center gap-1 text-center">
            <div className="font-heading text-3xl font-bold tracking-tight">
              Welcome back!
            </div>
            <div className="text-sm text-text-secondary">
              Please select your role and sign in to continue.
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <RoleCard
              label="Cashier"
              description={
                <>
                  Access the POS and
                  <br />
                  manage sales
                </>
              }
              icon={cashierIcon}
              selected={role === "cashier"}
              onSelect={() => {
                setRole("cashier");
              }}
            />
            <RoleCard
              label="Admin"
              description={
                <>
                  Manage store, inventory,
                  <br />
                  staff and reports
                </>
              }
              icon={adminIcon}
              selected={role === "admin"}
              onSelect={() => {
                setRole("admin");
              }}
            />
          </div>

          <div className="mt-[18px] flex flex-grow flex-col justify-center">
            {role === "cashier" ? (
              <CashierSignInForm
                counterLabel="Not activated on this PC"
                onSubmit={() => {
                  // wired to the cashier sign-in use case in a later commit
                }}
                pending={false}
                error={null}
              />
            ) : (
              <AdminSignInForm
                onSubmit={(login, password, remember) => {
                  void handleAdminSubmit(login, password, remember);
                }}
                pending={adminPending}
                error={adminError}
              />
            )}
          </div>

          <div className="mt-3.5 flex items-center justify-between border-t border-border pt-3.5 text-xs text-text-secondary">
            <span className="flex items-center gap-2 font-medium text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              Online
            </span>
            <span>MartDesk POS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
