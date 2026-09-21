import type { ReactNode } from "react";

interface RoleCardProps {
  label: string;
  description: ReactNode;
  icon: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

export function RoleCard({
  label,
  description,
  icon,
  selected,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex h-32 flex-col items-center justify-center gap-1 rounded-card border-[1.5px] p-3 text-center transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:outline-none ${
        selected
          ? "border-2 border-gold bg-[#FFF6E0]"
          : "border-border bg-white"
      }`}
    >
      <span
        className={`mb-0.5 flex h-[46px] w-[46px] items-center justify-center rounded-full ${
          selected ? "bg-[#FCE3B0] text-gold-dark" : "bg-[#E6ECF3] text-blue"
        }`}
      >
        {icon}
      </span>
      <span className="text-[15px] font-bold text-text">{label}</span>
      <span className="text-xs leading-tight font-normal text-text-secondary">
        {description}
      </span>
    </button>
  );
}
