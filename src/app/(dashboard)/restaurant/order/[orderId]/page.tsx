import { redirect } from "next/navigation";

// This path used to re-export the detail page with the wrong parameter name, and nothing links
// to it. Anything that still points here lands on the real order page.
export default function OrderRedirect({ params }: { params: { orderId: string } }) {
  redirect(`/restaurant/orders/${encodeURIComponent(params.orderId)}`);
}
