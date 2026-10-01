import { useLocation, useNavigate, useOutletContext } from "react-router";

export interface InventoryOutletContext {
  reload: () => void;
}

export function useInventoryOutlet() {
  const { reload } = useOutletContext<InventoryOutletContext>();
  const navigate = useNavigate();
  return {
    reload,
    close: () => {
      void navigate("/admin/inventory");
    },
  };
}

export function useAdjustProductId(): number | null {
  const { search } = useLocation();
  const id = Number(new URLSearchParams(search).get("product"));
  return Number.isInteger(id) && id > 0 ? id : null;
}
