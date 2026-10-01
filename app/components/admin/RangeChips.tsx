import { FilterChips, type ChipOption } from "./FilterChips";
import { fieldClass } from "./FormField";

interface RangeChipsProps<T extends string> {
  label: string;
  fromLabel: string;
  toLabel: string;
  options: ChipOption<T>[];
  value: T;
  from: string;
  to: string;
  showDates: boolean;
  onPreset: (preset: T) => void;
  onDates: (from: string, to: string) => void;
  trailing?: string;
}

// Period chips plus, for the custom preset, two date inputs.
export function RangeChips<T extends string>(props: RangeChipsProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilterChips
        label={props.label}
        options={props.options}
        value={props.value}
        onChange={props.onPreset}
      />
      {props.showDates && (
        <>
          <input
            type="date"
            aria-label={props.fromLabel}
            className={`${fieldClass} h-9 w-auto`}
            value={props.from}
            onChange={(event) => {
              if (event.target.value) {
                props.onDates(event.target.value, props.to);
              }
            }}
          />
          <input
            type="date"
            aria-label={props.toLabel}
            className={`${fieldClass} h-9 w-auto`}
            value={props.to}
            onChange={(event) => {
              if (event.target.value) {
                props.onDates(props.from, event.target.value);
              }
            }}
          />
        </>
      )}
      {props.trailing && (
        <span className="text-[13px] text-text-secondary">
          {props.trailing}
        </span>
      )}
    </div>
  );
}
