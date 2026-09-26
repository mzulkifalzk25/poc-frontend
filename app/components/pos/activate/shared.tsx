export const bigButtonClass =
  "flex h-16 w-full items-center justify-center gap-2.5 rounded-lg bg-blue text-[19px] font-bold text-white transition hover:brightness-[.92] focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:outline-none active:brightness-[.85] disabled:cursor-not-allowed disabled:opacity-50";

export function ArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="rtl:-scale-x-100"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
