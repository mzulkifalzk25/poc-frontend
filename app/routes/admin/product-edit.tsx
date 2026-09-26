import { useCallback } from "react";
import { useParams } from "react-router";

import { ProductEditForm } from "~/components/admin/products/ProductEditForm";
import { useProductsOutlet } from "~/components/admin/products/productsOutlet";
import { useProductEditor } from "~/components/admin/products/useProductEditor";
import { Drawer } from "~/components/ui/Drawer";
import { ErrorState, LoadingState } from "~/components/ui/StateBlocks";
import { useToast } from "~/components/ui/ToastProvider";
import { useAsyncData, type AsyncState } from "~/components/ui/useAsyncData";
import type { ProductDetail } from "~/domain/product";
import { t } from "~/i18n/t";
import { isApiError } from "~/infrastructure/api/errors";
import { categoryRepository } from "~/infrastructure/api/category-repository";
import { productRepository } from "~/infrastructure/api/product-repository";

function useProductData(productId: number) {
  const loadProduct = useCallback(
    () => productRepository.get(productId),
    [productId],
  );
  const loadHistory = useCallback(
    () => productRepository.priceHistory(productId),
    [productId],
  );
  return {
    product: useAsyncData(loadProduct),
    history: useAsyncData(loadHistory),
    categories: useAsyncData(categoryRepository.list),
  };
}

function LoadingDrawer(props: {
  state: AsyncState<ProductDetail>;
  onRetry: () => void;
  onClose: () => void;
}) {
  const strings = t().productEdit;
  const notFound =
    props.state.status === "error" &&
    isApiError(props.state.error) &&
    props.state.error.status === 404;
  return (
    <Drawer title={strings.title} onClose={props.onClose}>
      {props.state.status === "loading" && <LoadingState />}
      {props.state.status === "error" &&
        (notFound ? (
          <ErrorState
            title={strings.notFound.title}
            hint={strings.notFound.hint}
          />
        ) : (
          <ErrorState onRetry={props.onRetry} />
        ))}
    </Drawer>
  );
}

export default function ProductEditRoute() {
  const productId = Number(useParams().id);
  const { reloadList, closeDrawer } = useProductsOutlet();
  const { showToast } = useToast();
  const data = useProductData(productId);
  const editor = useProductEditor({
    repo: productRepository,
    productId,
    onSaved: (product) => {
      showToast(t().productEdit.saved(product.name));
      reloadList();
      closeDrawer();
    },
  });
  const { state } = data.product;

  if (state.status !== "ready") {
    return (
      <LoadingDrawer
        state={state}
        onRetry={data.product.reload}
        onClose={closeDrawer}
      />
    );
  }
  return (
    <ProductEditForm
      key={state.data.id}
      product={state.data}
      categories={
        data.categories.state.status === "ready"
          ? data.categories.state.data
          : []
      }
      history={data.history.state}
      pending={editor.pending}
      error={editor.error}
      errors={editor.errors}
      onSubmit={(draft) => void editor.submit(draft)}
      onClose={closeDrawer}
    />
  );
}
