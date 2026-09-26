import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
  trailingSlot?: ReactNode;
  invalid?: boolean;
}

export function Input({
  leadingIcon,
  trailingSlot,
  invalid = false,
  className,
  ...props
}: InputProps) {
  return (
    <div
      className={`flex h-[46px] items-center gap-2.5 rounded-input border bg-white px-3.5 text-text-secondary focus-within:ring-2 focus-within:ring-blue ${invalid ? "border-error" : "border-border"} ${props.disabled ? "opacity-50" : ""} ${className ?? ""}`}
    >
      {leadingIcon}
      <input
        className="h-full min-w-0 flex-grow border-0 bg-transparent font-sans text-sm text-text outline-none"
        {...props}
      />
      {trailingSlot}
    </div>
  );
}
