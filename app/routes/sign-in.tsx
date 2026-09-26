import { useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router";

import { AdminSignInForm } from "~/components/auth/AdminSignInForm";
import { CashierSignInForm } from "~/components/auth/CashierSignInForm";
import { RoleCard } from "~/components/auth/RoleCard";
import { SignInBrandPanel } from "~/components/auth/SignInBrandPanel";
import { useCountdown } from "~/components/auth/useCountdown";
import { Logo } from "~/components/ui/Logo";
import { useOnlineStatus } from "~/components/ui/useOnlineStatus";
import { t } from "~/i18n/t";
import { cashierAuthRepository } from "~/infrastructure/api/cashier-auth-repository";
import { ownerAuthRepository } from "~/infrastructure/api/owner-auth-repository";
import { getDeviceCounter } from "~/infrastructure/session/device-store";
import { signInCashier } from "~/use_cases/sign-in-cashier";
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

function OnlineIndicator() {
  const online = useOnlineStatus();

  return (
    <span
      className={`flex items-center gap-2 font-medium ${online ? "text-success" : "text-warning"}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-success" : "bg-warning"}`}
      />
      {online ? t().common.online : t().common.offline}
    </span>
  );
}

function RoleDescription({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line, index) => (
        <span key={line} className="block">
          {line}
          {index < lines.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

function NotActivatedNotice() {
  return (
    <p className="rounded-input bg-warning-bg px-3.5 py-2.5 text-sm text-warning">
      {t().signIn.cashier.notActivatedHint}{" "}
      <Link
        to="/pos/activate"
        className="rounded font-semibold underline focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none"
      >
        {t().signIn.cashier.activateLink}
      </Link>
    </p>
  );
}

export async function clientLoader() {
  return { counter: await getDeviceCounter() };
}

export default function SignInRoute() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("cashier");
  const [adminPending, setAdminPending] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [cashierPending, setCashierPending] = useState(false);
  const [cashierError, setCashierError] = useState<string | null>(null);
  const throttle = useCountdown();
  const { counter } = useLoaderData<typeof clientLoader>();

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
      setAdminError(t().signIn.admin.invalidCredentials);
    } else {
      setAdminError(t().signIn.offline);
    }
  }

  async function handleCashierSubmit(name: string, pin: string) {
    setCashierPending(true);
    setCashierError(null);
    throttle.clear();
    const result = await signInCashier(cashierAuthRepository, name, pin);
    setCashierPending(false);
    const strings = t().signIn;
    if (result.status === "success") {
      void navigate("/pos/sign-in");
    } else if (result.status === "name_not_found") {
      setCashierError(strings.cashier.nameNotFound);
    } else if (result.status === "invalid_pin") {
      setCashierError(strings.cashier.wrongPin);
    } else if (result.status === "throttled") {
      throttle.start(result.retryAfterSeconds);
    } else {
      setCashierError(strings.offline);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#C9D3E0] via-[#E4E9F0] to-[#B8C4D4] p-6">
      <div className="flex overflow-hidden rounded-xl shadow-2xl">
        <SignInBrandPanel />
        <div className="flex w-[592px] flex-col bg-off-white px-11 py-[22px]">
          <div className="h-4 text-end text-xs text-text-secondary">
            {t().signIn.version}
          </div>

          <div className="mt-2 flex flex-col items-center gap-1">
            <Logo variant="navy" size={58} />
            <div className="mt-1 font-heading text-[42px] leading-tight font-bold">
              Mart<span className="text-gold">Desk</span>
            </div>
            <div className="text-sm text-[#34445A]">{t().brand.tagline}</div>
          </div>

          <div className="mt-5 flex flex-col items-center gap-1 text-center">
            <div className="font-heading text-3xl font-bold tracking-tight">
              {t().signIn.welcome}
            </div>
            <div className="text-sm text-text-secondary">
              {t().signIn.chooseRole}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <RoleCard
              label={t().signIn.roles.cashier.label}
              description={
                <RoleDescription lines={t().signIn.roles.cashier.description} />
              }
              icon={cashierIcon}
              selected={role === "cashier"}
              onSelect={() => {
                setRole("cashier");
              }}
            />
            <RoleCard
              label={t().signIn.roles.admin.label}
              description={
                <RoleDescription lines={t().signIn.roles.admin.description} />
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
                counterLabel={
                  counter
                    ? t().signIn.cashier.thisPc(counter.name)
                    : t().signIn.cashier.notActivated
                }
                disabled={!counter}
                notice={counter ? null : <NotActivatedNotice />}
                onSubmit={(name, pin) => {
                  void handleCashierSubmit(name, pin);
                }}
                pending={cashierPending}
                error={cashierError}
                throttledSecondsRemaining={throttle.secondsRemaining}
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
            <OnlineIndicator />
            <span>{t().brand.footer}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
