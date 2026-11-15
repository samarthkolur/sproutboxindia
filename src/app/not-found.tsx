import { NotFoundView } from "@/components/shared/NotFoundView";

// Keep this file free of server-side session or cookie reads: they would make every
// route in the app render dynamically (see NotFoundView).
export default function NotFound() {
  return <NotFoundView />;
}
