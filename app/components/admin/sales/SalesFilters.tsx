import type { PaymentMethod } from "~/domain/payment";
import type { SalesQuery } from "~/domain/sale";
import { t } from "~/i18n/t";
import type { StaffMember } from "~/domain/staff";

import { fieldClass } from "../FormField";
import { SearchBox } from "../SearchBox";

interface SalesFiltersProps {
  query: SalesQuery;
  cashiers: StaffMember[];
  onChange: (changes: Partial<SalesQuery>) => void;
}

const METHODS: PaymentMethod[] = ["cash", "card", "wallet"];
const compact = `${fieldClass} h-11 w-auto min-w-40`;

export function SalesFilters({ query, cashiers, onChange }: SalesFiltersProps) {
  const strings = t().sales;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchBox
        label={strings.search}
        value={query.search}
        onSearch={(search) => {
          onChange({ search });
        }}
      />
      <input
        type="date"
        aria-label={strings.date}
        className={compact}
        value={query.date}
        onChange={(event) => {
          if (event.target.value) {
            onChange({ date: event.target.value });
          }
        }}
      />
      <select
        aria-label={strings.cashier}
        className={compact}
        value={query.cashierId === null ? "" : String(query.cashierId)}
        onChange={(event) => {
          onChange({
            cashierId: event.target.value ? Number(event.target.value) : null,
          });
        }}
      >
        <option value="">{strings.allCashiers}</option>
        {cashiers.map((cashier) => (
          <option key={cashier.id} value={cashier.id}>
            {cashier.fullName}
          </option>
        ))}
      </select>
      <select
        aria-label={strings.payment}
        className={compact}
        value={query.payment ?? ""}
        onChange={(event) => {
          onChange({
            payment: (event.target.value || null) as PaymentMethod | null,
          });
        }}
      >
        <option value="">{strings.allPayments}</option>
        {METHODS.map((method) => (
          <option key={method} value={method}>
            {strings.methods[method]}
          </option>
        ))}
      </select>
    </div>
  );
}
