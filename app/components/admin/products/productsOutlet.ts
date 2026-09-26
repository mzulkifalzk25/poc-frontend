import { useLocation, useNavigate, useOutletContext } from "react-router";

export interface ProductsOutletContext {
  reloadList: () => void;
}

export function useProductsOutlet() {
  const { reloadList } = useOutletContext<ProductsOutletContext>();
  const navigate = useNavigate();
  const { search } = useLocation();
  return {
    reloadList,
    closeDrawer: () => {
      void navigate(`/admin/products${search}`);
    },
  };
}
