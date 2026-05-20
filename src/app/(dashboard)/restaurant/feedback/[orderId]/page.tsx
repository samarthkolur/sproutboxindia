import { FeedbackForm } from "@/components/restaurant/FeedbackForm";

export default function RestaurantFeedbackPage({ params }: { params: { orderId: string } }) {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-black text-text-primary">Delivery Feedback</h1>
      <FeedbackForm orderId={params.orderId} />
    </div>
  );
}
