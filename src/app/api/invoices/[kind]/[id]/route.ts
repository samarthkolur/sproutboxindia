import { auth } from "@/lib/auth";
import { fail } from "@/lib/api";
import { getGrowerStatementInput, getRestaurantInvoiceInput, getSettlementInput, type Viewer } from "@/lib/invoice-data";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { growerStatement, isInvoiceable, restaurantInvoice, settlementStatement, type InvoiceDoc } from "@/lib/invoices";

export const dynamic = "force-dynamic";

// GET /api/invoices/restaurant/<orderId>   the restaurant's invoice (the restaurant, or an admin)
// GET /api/invoices/grower/<taskId>        a grower's payout statement (the grower, or an admin)
// GET /api/invoices/platform/<orderId>     where one order's money went (admin only)
export async function GET(_request: Request, { params }: { params: { kind: string; id: string } }) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    if (!session?.user || (role !== "ADMIN" && role !== "RESTAURANT" && role !== "GROWER")) {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }
    const viewer: Viewer = { id: session.user.id, role };

    let doc: InvoiceDoc | null = null;

    if (params.kind === "restaurant") {
      const input = await getRestaurantInvoiceInput(params.id, viewer);
      if (!input) return fail("Not found", "NOT_FOUND", 404);
      if (!isInvoiceable(input.order.status)) return fail("This order has not been paid yet", "NOT_INVOICEABLE", 409);
      doc = restaurantInvoice(input);
    } else if (params.kind === "grower") {
      const input = await getGrowerStatementInput(params.id, viewer);
      if (!input) return fail("Not found", "NOT_FOUND", 404);
      if (!input.batches.some((b) => b.payout)) return fail("There is no payout for this task yet", "NO_PAYOUT", 409);
      doc = growerStatement(input);
    } else if (params.kind === "platform") {
      if (viewer.role !== "ADMIN") return fail("Not found", "NOT_FOUND", 404);
      const input = await getSettlementInput(params.id);
      if (!input) return fail("Not found", "NOT_FOUND", 404);
      doc = settlementStatement(input);
    } else {
      return fail("Not found", "NOT_FOUND", 404);
    }

    const bytes = await renderInvoicePdf(doc);
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${doc.fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[INVOICE]", error);
    return fail("Could not create the document", "INTERNAL_SERVER_ERROR", 500);
  }
}
