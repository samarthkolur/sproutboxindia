import { PageHeader } from "@/components/ui/page-header";
import { parseCrop, parseRecurrence } from "@/lib/restaurant";
import { NewOrderClient } from "./NewOrderClient";

// ?crop=radish preselects a crop (the dashboard's crop cards and "Order again" use it),
// ?kg= its quantity and ?recurrence= the repeat preference.
export default function NewOrderPage({ searchParams }: { searchParams: { crop?: string; kg?: string; recurrence?: string } }) {
  const crop = parseCrop(searchParams.crop);
  const kg = Number(searchParams.kg);
  return (
    <>
      <PageHeader title="New order" subtitle="Choose your microgreens, set a delivery date and we start growing them for you." />
      <NewOrderClient
        initialCart={crop ? [{ cropType: crop, quantityKg: kg > 0 && kg <= 500 ? Math.round(kg * 2) / 2 || 1 : 1 }] : []}
        initialRecurrence={parseRecurrence(searchParams.recurrence)}
      />
    </>
  );
}
