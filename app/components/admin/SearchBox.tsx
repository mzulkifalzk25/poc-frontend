import { useEffect, useEffectEvent, useState } from "react";

const SEARCH_DELAY_MS = 300;

export function SearchBox(props: {
  label: string;
  value: string;
  onSearch: (value: string) => void;
}) {
  const { value, onSearch } = props;
  const [text, setText] = useState(value);
  const commit = useEffectEvent((next: string) => {
    if (next !== value) {
      onSearch(next);
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      commit(text);
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [text]);

  return (
    <label className="flex h-11 w-[340px] items-center gap-2 rounded-input border border-border bg-white px-3.5 text-text-secondary focus-within:ring-2 focus-within:ring-blue">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
      <input
        type="search"
        aria-label={props.label}
        placeholder={props.label}
        value={text}
        className="h-full min-w-0 flex-grow bg-transparent text-sm text-text outline-none"
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
    </label>
  );
}
