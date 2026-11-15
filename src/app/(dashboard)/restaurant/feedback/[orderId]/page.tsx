import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { FeedbackForm } from "@/components/restaurant/FeedbackForm";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { CROP_DISPLAY_NAMES, type CropType } from "@/lib/constants";
import { parseFeedbackNotes, shortId } from "@/lib/restaurant";
import { getRestaurantOrder } from "@/lib/restaurant-data";

export default async function RestaurantFeedbackPage({ params }: { params: { orderId: string } }) {
  const session = await auth();
  // Someone else's order is a 404, like everywhere else.
  const order = await getRestaurantOrder(session?.user?.id ?? "", params.orderId);
  if (!order) notFound();

  const name = CROP_DISPLAY_NAMES[order.cropType as CropType] ?? order.cropType;
  const delivered = order.status === "DELIVERED";
  const deliveredAt = order.delivery?.deliveredAt ?? order.deliveryDate;
  const existing = order.feedback ? { rating: order.feedback.rating, ...parseFeedbackNotes(order.feedback.notes) } : null;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link href={`/restaurant/orders/${order.id}`} className="rounded hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          {`Order ${shortId(order.id)}`}
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span aria-current="page" className="font-medium text-ink">
          Feedback
        </span>
      </nav>

      <PageHeader
        title="Delivery feedback"
        subtitle={delivered ? `${name}, ${order.quantityKg} kg` : "You can rate an order once it has been delivered."}
      />

      <Panel padding="lg" className="max-w-2xl">
        {delivered ? (
          <>
            <p className="mb-6 text-sm text-ink-muted">
              <span>Delivered on </span>
              <time dateTime={deliveredAt.toISOString()}>{format(deliveredAt, "d MMM yyyy")}</time>
            </p>
            <FeedbackForm orderId={order.id} existing={existing} />
          </>
        ) : (
          <div>
            <p className="text-sm text-ink-soft">This order is not delivered yet. Come back after it arrives to tell us how it went.</p>
            <Link href={`/restaurant/orders/${order.id}`} className="mt-4 inline-flex rounded-full border border-hairline bg-panel/60 px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink">
              Back to the order
            </Link>
          </div>
        )}
      </Panel>
    </>
  );
}
