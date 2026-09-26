import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex min-h-14 items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[32px] leading-tight font-bold tracking-[-0.02em] text-text">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
