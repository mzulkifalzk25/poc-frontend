export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="font-heading text-2xl font-bold text-text">{title}</h1>
      <p className="text-text-secondary">This screen is coming soon.</p>
    </div>
  );
}
