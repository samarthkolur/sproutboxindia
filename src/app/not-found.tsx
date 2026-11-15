import { NotFoundView } from "@/components/shared/NotFoundView";
import { auth } from "@/lib/auth";

export default async function NotFound() {
  // A failed session lookup must never turn a 404 into a 500.
  const session = await auth().catch(() => null);
  return <NotFoundView signedIn={Boolean(session?.user)} />;
}
