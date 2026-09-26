import { useId, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { useProductsOutlet } from "~/components/admin/products/productsOutlet";
import { CameraScanner } from "~/components/admin/scan/CameraScanner";
import { NewProductForm } from "~/components/admin/scan/NewProductForm";
import { ScanTabs, type ScanTab } from "~/components/admin/scan/ScanTabs";
import { ScanStatus } from "~/components/admin/scan/ScanStatus";
import { UsbScanner } from "~/components/admin/scan/UsbScanner";
import { useScanToAdd } from "~/components/admin/scan/useScanToAdd";
import { Button } from "~/components/ui/Button";
import { Drawer } from "~/components/ui/Drawer";
import { useToast } from "~/components/ui/ToastProvider";
import { useAsyncData } from "~/components/ui/useAsyncData";
import { t } from "~/i18n/t";
import { categoryRepository } from "~/infrastructure/api/category-repository";
import { productRepository } from "~/infrastructure/api/product-repository";

function ScanIcon() {
  return (
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
  );
}

function initialTab(state: unknown): ScanTab {
  const wanted =
    typeof state === "object" && state !== null && "tab" in state
      ? state.tab
      : null;
  return wanted === "usb" ? "usb" : "camera";
}

export default function ScanAddRoute() {
  const strings = t().scanAdd;
  const formId = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(() => initialTab(location.state));
  const { showToast } = useToast();
  const { reloadList, closeDrawer } = useProductsOutlet();
  const categories = useAsyncData(categoryRepository.list);
  const scanner = useScanToAdd({
    repo: productRepository,
    onKnown: (product) => {
      showToast(strings.known(product.name), "info");
      void navigate(`/admin/products/${String(product.id)}`);
    },
    onCreated: (product, scanNext) => {
      showToast(strings.saved(product.name));
      reloadList();
      if (!scanNext) {
        closeDrawer();
      }
    },
  });
  const isNew = scanner.phase === "new";

  return (
    <Drawer
      title={strings.title}
      subtitle={strings.added(scanner.addedCount)}
      onClose={closeDrawer}
      footer={
        <>
          <Button variant="secondary" size="lg" onClick={closeDrawer}>
            {t().common.cancel}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[1.5px]"
            disabled={!isNew || scanner.pending}
            onClick={() => void scanner.save(false)}
          >
            {strings.save}
          </Button>
          <Button
            type="submit"
            form={formId}
            size="lg"
            className="flex-grow"
            disabled={!isNew || scanner.pending}
          >
            {scanner.pending ? t().common.saving : strings.saveNext}
            <ScanIcon />
          </Button>
        </>
      }
    >
      <ScanTabs value={tab} onChange={setTab} />
      {tab === "camera" ? (
        <CameraScanner
          detected={isNew ? scanner.draft.barcode : null}
          onScan={(code) => void scanner.scan(code)}
        />
      ) : (
        <UsbScanner
          busy={scanner.phase === "looking"}
          focusSignal={scanner.addedCount}
          onScan={(code) => void scanner.scan(code)}
        />
      )}
      <ScanStatus
        phase={scanner.phase}
        error={scanner.scanError}
        categoryKept={scanner.categoryKept}
      />
      {isNew && (
        <NewProductForm
          key={scanner.draft.barcode}
          formId={formId}
          draft={scanner.draft}
          categories={
            categories.state.status === "ready" ? categories.state.data : []
          }
          errors={scanner.errors}
          error={scanner.error}
          onChange={scanner.update}
          onSubmit={() => void scanner.save(true)}
        />
      )}
    </Drawer>
  );
}
