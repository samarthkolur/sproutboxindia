const steps = ["PACKED", "IN_TRANSIT", "DELIVERED"];

export function DeliveryTracker({ status }: { status: string }) {
  const current = steps.indexOf(status);
  return (
    <div className="flex gap-2">
      {steps.map((step, index) => (
        <div key={step} className="flex-1">
          <div className={`h-2 rounded-full ${index <= current ? "bg-sprout-600" : "bg-sprout-100"}`} />
          <p className="mt-2 text-[11px] font-semibold text-text-muted">{step.replace("_", " ")}</p>
        </div>
      ))}
    </div>
  );
}
