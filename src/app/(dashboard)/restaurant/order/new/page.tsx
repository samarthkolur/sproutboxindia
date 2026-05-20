import { NewOrderClient } from "./NewOrderClient";

export default function NewOrderPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">New Order</h1>
        <p className="text-text-secondary mt-1">Select microgreens and place your order</p>
      </div>

      <NewOrderClient />
    </div>
  );
}
