import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { COMPANY } from "@/lib/company";
import { format } from "date-fns";
import { inr, type InvoiceDoc, type Party } from "@/lib/invoices";

// Draws an InvoiceDoc as an A4 PDF. It decides nothing about the numbers; it only lays out
// what the builders in lib/invoices.ts hand it. Standard fonts only, so no files to bundle.

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const INNER = PAGE.width - MARGIN * 2;

const INK = rgb(0.13, 0.16, 0.14);
const MUTED = rgb(0.4, 0.44, 0.41);
const LEAF = rgb(0.4, 0.61, 0.37);
const LINE = rgb(0.84, 0.87, 0.83);
const WASH = rgb(0.95, 0.97, 0.94);
const GOOD = rgb(0.18, 0.43, 0.24);
const WATCH = rgb(0.6, 0.37, 0.11);

interface Ctx {
  pdf: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
  doc: InvoiceDoc;
}

/** Standard PDF fonts cover Latin text only: spell out the rupee sign and drop anything else they cannot draw. */
function safe(text: string, font: PDFFont) {
  const supported = new Set(font.getCharacterSet());
  return Array.from(text.replace(/₹/g, "Rs. ").replace(/→/g, "to"))
    .map((char) => (supported.has(char.codePointAt(0)!) ? char : "?"))
    .join("");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  // Measure the text that will actually be drawn: widthOfTextAtSize throws on characters the font cannot encode.
  for (const word of safe(text, font).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function text(ctx: Ctx, value: string, x: number, y: number, size: number, opts: { bold?: boolean; color?: ReturnType<typeof rgb>; align?: "left" | "right"; maxWidth?: number } = {}) {
  const font = opts.bold ? ctx.bold : ctx.regular;
  const clean = safe(value, font);
  const width = font.widthOfTextAtSize(clean, size);
  ctx.page.drawText(clean, { x: opts.align === "right" ? x - width : x, y, size, font, color: opts.color ?? INK });
}

function newPage(ctx: Ctx) {
  ctx.page = ctx.pdf.addPage([PAGE.width, PAGE.height]);
  ctx.page.drawRectangle({ x: 0, y: PAGE.height - 6, width: PAGE.width, height: 6, color: LEAF });
  ctx.y = PAGE.height - MARGIN - 8;
  text(ctx, `${ctx.doc.title} ${ctx.doc.number} (continued)`, MARGIN, ctx.y, 9, { color: MUTED });
  ctx.y -= 28;
}

function ensure(ctx: Ctx, height: number) {
  if (ctx.y - height < MARGIN + 30) newPage(ctx);
}

function party(ctx: Ctx, label: string, who: Party, x: number, width: number, top: number) {
  text(ctx, label.toUpperCase(), x, top, 8, { bold: true, color: MUTED });
  let y = top - 15;
  for (const line of wrap(who.name, ctx.bold, 11, width)) {
    text(ctx, line, x, y, 11, { bold: true });
    y -= 14;
  }
  for (const raw of who.lines) {
    for (const line of wrap(raw, ctx.regular, 9.5, width)) {
      text(ctx, line, x, y, 9.5, { color: MUTED });
      y -= 12.5;
    }
  }
  return y;
}

export async function renderInvoicePdf(doc: InvoiceDoc): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${doc.title} ${doc.number}`);
  pdf.setAuthor(COMPANY.name);
  pdf.setCreator(COMPANY.name);
  pdf.setProducer(COMPANY.name);
  pdf.setCreationDate(doc.issuedOn);

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([PAGE.width, PAGE.height]);
  const ctx: Ctx = { pdf, page, y: 0, regular, bold, doc };

  // Header
  page.drawRectangle({ x: 0, y: PAGE.height - 6, width: PAGE.width, height: 6, color: LEAF });
  text(ctx, COMPANY.name, MARGIN, PAGE.height - 64, 24, { bold: true });
  text(ctx, COMPANY.tagline, MARGIN, PAGE.height - 80, 9.5, { color: MUTED });
  text(ctx, doc.title.toUpperCase(), PAGE.width - MARGIN, PAGE.height - 62, 18, { bold: true, align: "right" });
  const badgeColor = doc.status.paid ? GOOD : WATCH;
  const badgeWidth = bold.widthOfTextAtSize(doc.status.label, 9) + 18;
  page.drawRectangle({ x: PAGE.width - MARGIN - badgeWidth, y: PAGE.height - 90, width: badgeWidth, height: 18, borderColor: badgeColor, borderWidth: 1 });
  text(ctx, doc.status.label, PAGE.width - MARGIN - badgeWidth / 2 - bold.widthOfTextAtSize(doc.status.label, 9) / 2, PAGE.height - 84, 9, { bold: true, color: badgeColor });

  // Parties and reference details
  const top = PAGE.height - 124;
  const colWidth = (INNER - 40) / 3;
  const leftEnd = party(ctx, doc.fromLabel, doc.from, MARGIN, colWidth, top);
  const midEnd = party(ctx, doc.toLabel, doc.to, MARGIN + colWidth + 20, colWidth, top);

  const metaX = MARGIN + (colWidth + 20) * 2;
  text(ctx, "DETAILS", metaX, top, 8, { bold: true, color: MUTED });
  let metaY = top - 15;
  for (const item of doc.meta) {
    text(ctx, item.label, metaX, metaY, 8.5, { color: MUTED });
    text(ctx, item.value, metaX, metaY - 11, 9.5, { bold: true });
    metaY -= 27;
  }
  ctx.y = Math.min(leftEnd, midEnd, metaY) - 14;

  // Table
  const colAmount = PAGE.width - MARGIN - 8;
  const colRate = colAmount - 92;
  const colQty = colRate - 92;
  const descWidth = colQty - 70 - MARGIN - 8;

  const header = () => {
    ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 6, width: INNER, height: 22, color: WASH });
    text(ctx, doc.columns.description, MARGIN + 8, ctx.y, 9, { bold: true, color: MUTED });
    text(ctx, doc.columns.quantity, colQty, ctx.y, 9, { bold: true, color: MUTED, align: "right" });
    text(ctx, doc.columns.rate, colRate, ctx.y, 9, { bold: true, color: MUTED, align: "right" });
    text(ctx, doc.columns.amount, colAmount, ctx.y, 9, { bold: true, color: MUTED, align: "right" });
    ctx.y -= 24;
  };
  header();

  for (const row of doc.rows) {
    const nameLines = wrap(row.description, bold, 10.5, descWidth);
    const detailLines = row.detail ? wrap(row.detail, regular, 8.5, descWidth) : [];
    const height = nameLines.length * 13 + detailLines.length * 11 + 14;
    if (ctx.y - height < MARGIN + 30) {
      newPage(ctx);
      header();
    }
    let y = ctx.y;
    for (const line of nameLines) {
      text(ctx, line, MARGIN + 8, y, 10.5, { bold: true });
      y -= 13;
    }
    for (const line of detailLines) {
      text(ctx, line, MARGIN + 8, y, 8.5, { color: MUTED });
      y -= 11;
    }
    text(ctx, row.quantity, colQty, ctx.y, 10, { align: "right" });
    text(ctx, row.rate, colRate, ctx.y, 10, { align: "right" });
    text(ctx, inr(row.amount), colAmount, ctx.y, 10, { align: "right" });
    ctx.y -= height - 4;
    ctx.page.drawLine({ start: { x: MARGIN, y: ctx.y + 6 }, end: { x: MARGIN + INNER, y: ctx.y + 6 }, thickness: 0.6, color: LINE });
  }

  // Totals
  ctx.y -= 12;
  const totalsLeft = colRate - 70;
  for (const total of doc.totals) {
    ensure(ctx, 26);
    if (total.strong) {
      ctx.page.drawLine({ start: { x: totalsLeft, y: ctx.y + 15 }, end: { x: MARGIN + INNER, y: ctx.y + 15 }, thickness: 1, color: INK });
    }
    text(ctx, total.label, totalsLeft, ctx.y, total.strong ? 11 : 9.5, { bold: total.strong, color: total.strong ? INK : MUTED });
    text(ctx, inr(total.amount), colAmount, ctx.y, total.strong ? 11 : 9.5, { bold: total.strong, align: "right" });
    ctx.y -= total.strong ? 24 : 18;
  }

  // Notes
  ctx.y -= 12;
  for (const note of doc.notes) {
    for (const line of wrap(note, regular, 9, INNER)) {
      ensure(ctx, 14);
      text(ctx, line, MARGIN, ctx.y, 9, { color: MUTED });
      ctx.y -= 12.5;
    }
  }

  // Footer on every page
  const pages = pdf.getPages();
  pages.forEach((p, index) => {
    p.drawLine({ start: { x: MARGIN, y: MARGIN }, end: { x: MARGIN + INNER, y: MARGIN }, thickness: 0.6, color: LINE });
    const draw = (value: string, x: number, align: "left" | "right") => {
      const clean = safe(value, regular);
      const width = regular.widthOfTextAtSize(clean, 8);
      p.drawText(clean, { x: align === "right" ? x - width : x, y: MARGIN - 14, size: 8, font: regular, color: MUTED });
    };
    draw(`${COMPANY.name}  |  ${COMPANY.email}  |  Issued ${format(doc.issuedOn, "d MMM yyyy")}`, MARGIN, "left");
    draw(`Page ${index + 1} of ${pages.length}`, MARGIN + INNER, "right");
  });

  return pdf.save();
}
