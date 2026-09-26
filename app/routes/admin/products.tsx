import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

import { PageHeader } from "~/components/admin/PageHeader";
import { Paging } from "~/components/admin/Paging";
import { ProductFilters } from "~/components/admin/products/ProductFilters";
import { ProductTable } from "~/components/admin/products/ProductTable";
import {
  paramsFromQuery,
  queryFromParams,
} from "~/components/admin/products/productQuery";
import { Button } from "~/components/ui/Button";
import { ButtonLink } from "~/components/ui/ButtonLink";
import { Card } from "~/components/ui/Card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "~/components/ui/StateBlocks";
import { useAsyncData, type AsyncState } from "~/components/ui/useAsyncData";
import { totalProductCount } from "~/domain/category";
import type { ProductPage, ProductQuery } from "~/domain/product";
import { t } from "~/i18n/t";
import { categoryRepository } from "~/infrastructure/api/category-repository";
import { productRepository } from "~/infrastructure/api/product-repository";
import { PRODUCT_PAGE_SIZE } from "~/use_cases/manage-products";

function HeaderActions() {
  const strings = t().products;
  return (
    <>
      <Button variant="secondary" disabled title={strings.comingLater}>
        {strings.importCsv}
      </Button>
      <Button variant="secondary" disabled title={strings.comingLater}>
        {strings.export}
      </Button>
      <ButtonLink to="scan" variant="navy">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16" />
        </svg>
        {strings.scanToAdd}
      </ButtonLink>
      <ButtonLink to="scan" state={{ tab: "usb" }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        {strings.addProduct}
      </ButtonLink>
    </>
  );
}

interface ProductResultsProps {
  state: AsyncState<ProductPage>;
  query: ProductQuery;
  search: string;
  onRetry: () => void;
  onPage: (page: number) => void;
}

function ProductResults(props: ProductResultsProps) {
  const { state, query } = props;
  const strings = t().products.empty;
  if (state.status === "loading") {
    return (
      <Card>
        <LoadingState />
      </Card>
    );
  }
  if (state.status === "error") {
    return (
      <Card>
        <ErrorState onRetry={props.onRetry} />
      </Card>
    );
  }
  if (state.data.count === 0) {
    return (
      <Card>
        <EmptyState title={strings.title} hint={strings.hint} />
      </Card>
    );
  }
  return (
    <ProductTable
      products={state.data.results}
      archived={query.filter === "archived"}
      editHref={(product) => `${String(product.id)}${props.search}`}
      footer={
        <Paging
          page={query.page}
          pageSize={PRODUCT_PAGE_SIZE}
          total={state.data.count}
          onPageChange={props.onPage}
        />
      }
    />
  );
}

export default function ProductsRoute() {
  const strings = t().products;
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const query = useMemo(
    () => queryFromParams(new URLSearchParams(paramsKey)),
    [paramsKey],
  );
  const loadProducts = useCallback(
    () => productRepository.list(query),
    [query],
  );
  const products = useAsyncData(loadProducts);
  const categories = useAsyncData(categoryRepository.list);
  const categoryList =
    categories.state.status === "ready" ? categories.state.data : [];

  function update(changes: Partial<ProductQuery>) {
    setSearchParams(paramsFromQuery({ ...query, page: 1, ...changes }));
  }

  return (
    <div className="flex max-w-[1136px] flex-col gap-5">
      <PageHeader
        title={strings.title}
        subtitle={
          categories.state.status === "ready"
            ? strings.subtitle(
                totalProductCount(categoryList),
                categoryList.length,
              )
            : undefined
        }
        actions={<HeaderActions />}
      />
      <ProductFilters
        query={query}
        categories={categoryList}
        onChange={update}
      />
      <ProductResults
        state={products.state}
        query={query}
        search={paramsKey ? `?${paramsKey}` : ""}
        onRetry={products.reload}
        onPage={(page) => {
          update({ page });
        }}
      />
    </div>
  );
}
