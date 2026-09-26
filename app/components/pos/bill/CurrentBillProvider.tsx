import {
  createContext,
  use,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import {
  currentBillReducer,
  EMPTY_BILL,
  type CurrentBillAction,
  type CurrentBillState,
} from "./currentBillReducer";

const STORAGE_KEY = "martdesk.currentBill";

interface CurrentBillContextValue {
  state: CurrentBillState;
  dispatch: (action: CurrentBillAction) => void;
}

const CurrentBillContext = createContext<CurrentBillContextValue | null>(null);

// A reload keeps the bill being scanned; completed bills live in Dexie, not here.
function loadBill(): CurrentBillState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? { ...EMPTY_BILL, ...(JSON.parse(raw) as Partial<CurrentBillState>) }
      : EMPTY_BILL;
  } catch {
    return EMPTY_BILL;
  }
}

export function CurrentBillProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(currentBillReducer, undefined, loadBill);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <CurrentBillContext value={value}>{children}</CurrentBillContext>;
}

export function useCurrentBill(): CurrentBillContextValue {
  const context = use(CurrentBillContext);
  if (!context) {
    throw new Error("useCurrentBill must be used within a CurrentBillProvider");
  }
  return context;
}
