import { Button } from "~/components/ui/Button";
import type { Category } from "~/domain/category";
import { t } from "~/i18n/t";

interface DeleteBlockedNoticeProps {
  category: Category;
  onMove: () => void;
}

export function DeleteBlockedNotice({
  category,
  onMove,
}: DeleteBlockedNoticeProps) {
  const strings = t().categories.remove;
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg bg-warning-bg px-4 py-3.5 text-sm leading-normal text-[#6E3A06]"
    >
      <p>{strings.blocked(category.name, category.productCount)}</p>
      <Button variant="secondary" className="self-start" onClick={onMove}>
        {strings.moveButton}
      </Button>
    </div>
  );
}
