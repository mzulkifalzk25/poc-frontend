import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  "primary" | "outline" | "secondary" | "destructive" | "gold";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-input font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-blue text-white hover:brightness-95 active:brightness-90",
  outline:
    "border border-navy text-navy bg-white hover:bg-off-white active:bg-border",
  secondary:
    "border border-border-strong text-text bg-white hover:bg-off-white active:bg-border",
  destructive: "bg-error text-white hover:brightness-95 active:brightness-90",
  gold: "bg-gold text-navy hover:bg-gold-dark active:bg-gold-dark",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-[52px] px-5 text-base",
  xl: "h-16 px-6 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ""}`}
      {...props}
    />
  );
}
