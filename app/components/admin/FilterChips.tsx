const chipBase =
  "flex h-9 items-center rounded-pill px-3.5 text-[13px] transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none";
const chipIdle = `${chipBase} border border-border bg-white font-medium hover:bg-off-white active:bg-border`;
const chipActive = `${chipBase} bg-navy font-semibold text-white`;

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  label: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          className={value === option.value ? chipActive : chipIdle}
          onClick={() => {
            onChange(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
