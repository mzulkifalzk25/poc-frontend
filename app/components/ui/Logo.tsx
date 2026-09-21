interface LogoProps {
  variant?: "gold" | "navy";
  size?: number;
  className?: string;
}

const ACCENT = "#F4B43C";

export function Logo({ variant = "gold", size = 36, className }: LogoProps) {
  const height = Math.round((size * 56) / 64);
  const bodyColor = variant === "navy" ? "#0F2742" : ACCENT;

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 64 56"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="MartDesk"
      className={className}
    >
      <path d="M4 6h9l7 30h29l7-22H15" stroke={bodyColor} strokeWidth={5} />
      <path d="M21 25h30" stroke={bodyColor} strokeWidth={4} />
      <path d="M56 14l-7 22" stroke={ACCENT} strokeWidth={5} />
      <circle cx={24} cy={47} r={4.2} fill={ACCENT} />
      <circle cx={45} cy={47} r={4.2} fill={ACCENT} />
    </svg>
  );
}

interface WordmarkProps {
  tone?: "light" | "dark";
  className?: string;
}

export function Wordmark({ tone = "dark", className }: WordmarkProps) {
  return (
    <span
      className={`font-heading font-bold ${tone === "light" ? "text-white" : "text-navy"} ${className ?? ""}`}
    >
      Mart<span className="text-gold">Desk</span>
    </span>
  );
}
