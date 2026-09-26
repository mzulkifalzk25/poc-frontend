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
    onCreated: (product) => {
      showToast(strings.saved(product.name));
      reloadList();
      closeDrawer();
    },
  });
  const isNew = scanner.phase === "new";

  return (
    <Drawer
      title={strings.title}
      onClose={closeDrawer}
      footer={
        <>
          <Button variant="secondary" size="lg" onClick={closeDrawer}>
            {t().common.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            size="lg"
            className="flex-grow"
            disabled={!isNew || scanner.pending}
          >
            {scanner.pending ? t().common.saving : strings.save}
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
          disabled={scanner.phase === "looking"}
          onScan={(code) => void scanner.scan(code)}
        />
      )}
      <ScanStatus
        phase={scanner.phase}
        error={scanner.scanError}
        categoryKept={false}
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
          onSubmit={() => void scanner.save()}
        />
      )}
    </Drawer>
  );
}
