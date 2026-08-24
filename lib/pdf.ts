// PDFKit's standalone build inlines standard-font metrics for bundled runtimes.
// @ts-expect-error PDFKit does not publish declarations for this browserified entrypoint.
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { splitQuoteIntoTurns, truncateQuoteText } from "./format-quote";
import type { AppliedCap, ScoredReport, CallType } from "./rubrics/types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;

const INK = "#1C1E21";
const INK_MUTED = "#5B5D57";
const TEAL = "#17494B";
const TEAL_SOFT = "#EAF1F1";
const AMBER = "#C98A2C";
const AMBER_SOFT = "#F5E7D1";
const FLAG = "#B4432F";
const FLAG_SOFT = "#F7E8E6";
const LINE = "#D7D5CD";
const GREY_SOFT = "#F3F0EC";

function pdfText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || value == null) {
    return String(value ?? "");
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getBandColor(band: string): string {
  const normalized = band.toLowerCase();
  if (normalized.includes("elite") || normalized.includes("strong")) return TEAL;
  if (normalized.includes("inconsistent") || normalized.includes("mid")) return AMBER;
  if (normalized.includes("at risk") || normalized.includes("weak")) return FLAG;
  return INK_MUTED;
}

function measureParagraph(doc: PDFKit.PDFDocument, text: string, options: { width: number; size?: number; lineGap?: number; font?: string }): number {
  const size = options.size ?? 9.5;
  const lineGap = options.lineGap ?? 3;
  doc.font(options.font ?? "Helvetica").fontSize(size);
  return doc.heightOfString(text, { width: options.width, lineGap });
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(angleRad), y: cy + radius * Math.sin(angleRad) };
}

function describeGaugeArc(cx: number, cy: number, radius: number, sweepDeg: number): string {
  const clamped = Math.min(sweepDeg, 359.9);
  const top = polarToCartesian(cx, cy, radius, 0);
  if (clamped <= 180) {
    const end = polarToCartesian(cx, cy, radius, clamped);
    return `M ${top.x} ${top.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
  }
  const mid = polarToCartesian(cx, cy, radius, 180);
  const end = polarToCartesian(cx, cy, radius, clamped);
  return `M ${top.x} ${top.y} A ${radius} ${radius} 0 0 1 ${mid.x} ${mid.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}

const GAUGE_BAND_STROKE: Record<string, string> = {
  Elite: TEAL,
  Strong: TEAL,
  Inconsistent: AMBER,
  "At Risk": FLAG,
  Fail: FLAG
};

const GAUGE_BAND_CHIP: Record<string, { bg: string; text: string }> = {
  Elite: { bg: TEAL_SOFT, text: TEAL },
  Strong: { bg: TEAL_SOFT, text: TEAL },
  Inconsistent: { bg: AMBER_SOFT, text: AMBER },
  "At Risk": { bg: FLAG_SOFT, text: FLAG },
  Fail: { bg: FLAG_SOFT, text: FLAG }
};

function drawPageHeader(doc: PDFKit.PDFDocument, report: ScoredReport, callType: CallType, pageNumber: number) {
  const headerY = 26;
  doc.fillColor(INK_MUTED).font("Helvetica-Bold").fontSize(7.5).text("BEAVERMIND", MARGIN, headerY, { width: 170 });
  doc.fillColor(INK_MUTED).font("Helvetica").fontSize(7).text(
    callType === "kickoff" ? "KICK-OFF CALL EVALUATION" : "CALL EVALUATION",
    MARGIN + 130,
    headerY
  );

  const rightX = PAGE_WIDTH - MARGIN - 140;
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(8.5).text(
    `${pdfText(report.clientName ?? "Unknown client")} · ${pdfText(report.coachName)}`,
    rightX,
    headerY,
    { align: "right", width: 140 }
  );

  const generatedText = `Generated ${new Date(report.scoredAt).toLocaleString()}`;
  doc.fillColor(INK_MUTED).font("Helvetica").fontSize(7).text(generatedText, rightX, headerY + 11, { align: "right", width: 140 });

  doc.moveTo(MARGIN, 56).lineTo(PAGE_WIDTH - MARGIN, 56).strokeColor(LINE).lineWidth(1).stroke();
}

function drawPageFooter(doc: PDFKit.PDFDocument, pageNumber: number) {
  const footerY = PAGE_HEIGHT - 18;
  doc.fillColor(INK_MUTED).font("Helvetica-Bold").fontSize(7).text("BEAVERMIND • CALL EVALUATION", MARGIN, footerY, { characterSpacing: 1.2 });
  doc.fillColor(INK_MUTED).font("Helvetica-Bold").fontSize(7).text(String(pageNumber), PAGE_WIDTH - MARGIN - 10, footerY, { align: "right", width: 20 });
}

function addSectionGap(doc: PDFKit.PDFDocument, amount = 12) {
  doc.moveDown(amount / 10);
}

function drawLabel(doc: PDFKit.PDFDocument, label: string, color = TEAL, size = 8.5) {
  doc.fillColor(color).font("Helvetica-Bold").fontSize(size).text(label.toUpperCase());
}

function drawParagraph(doc: PDFKit.PDFDocument, text: string, options: { width?: number; size?: number; color?: string; lineGap?: number; indent?: number } = {}) {
  const width = options.width ?? PAGE_WIDTH - MARGIN * 2;
  const size = options.size ?? 9.5;
  const color = options.color ?? INK;
  const indent = options.indent ?? 0;
  const lineGap = options.lineGap ?? 3;

  doc.fillColor(color).font("Helvetica").fontSize(size).text(text, { width, lineGap, indent });
}

function maybeAddPageBefore(doc: PDFKit.PDFDocument, requiredHeight: number, addHeader: () => void) {
  const remaining = doc.page.height - doc.y - 36;
  if (remaining < requiredHeight) {
    doc.addPage();
    addHeader();
  }
}

function drawGauge(doc: PDFKit.PDFDocument, score: number, gradeBand: string, cx: number, cy: number): void {
  const radius = 46;
  const strokeWidth = 9;
  const pct = Math.max(0, Math.min(100, score));

  doc.save();
  doc.circle(cx, cy, radius).lineWidth(strokeWidth).strokeColor("#DEDDD6").stroke();
  if (pct > 0) {
    const stroke = GAUGE_BAND_STROKE[gradeBand] ?? INK_MUTED;
    doc.path(describeGaugeArc(cx, cy, radius, (pct / 100) * 360))
      .lineWidth(strokeWidth)
      .lineCap("round")
      .strokeColor(stroke)
      .stroke();
  }
  doc.restore();

  doc.fillColor(INK).font("Helvetica-Bold").fontSize(20).text(String(Math.round(score)), cx - radius, cy - 12, {
    width: radius * 2,
    align: "center"
  });
  doc.fillColor(INK_MUTED).font("Helvetica").fontSize(8).text("/100", cx - radius, cy + 10, { width: radius * 2, align: "center" });

  const chip = GAUGE_BAND_CHIP[gradeBand] ?? { bg: "#EFEDE7", text: INK_MUTED };
  const chipY = cy + radius + 12;
  const chipText = gradeBand.toUpperCase();
  doc.font("Helvetica-Bold").fontSize(7.5);
  const chipWidth = doc.widthOfString(chipText) + 16;
  doc.roundedRect(cx - chipWidth / 2, chipY, chipWidth, 16, 8).fillColor(chip.bg).fill();
  doc.fillColor(chip.text).text(chipText, cx - chipWidth / 2, chipY + 4, { width: chipWidth, align: "center" });
}

function drawOverallScore(doc: PDFKit.PDFDocument, report: ScoredReport, x: number, y: number, width: number): number {
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(8.2).text("OVERALL SCORE", x, y);
  const centerX = x + width / 2;
  const centerY = y + 62;
  drawGauge(doc, report.totalScore, report.gradeBand, centerX, centerY);
  const projectedText = `Projected score ${pdfText(report.oneThing.projectedScore)} / 100   +${(report.oneThing.projectedScore - report.totalScore).toFixed(1)}`;
  const projectedHeight = measureParagraph(doc, projectedText, { width, size: 8, lineGap: 2 });
  doc.fillColor(INK_MUTED).font("Helvetica").fontSize(8).text(projectedText, x, centerY + 74, { width });
  return centerY + 74 + projectedHeight + 10;
}

function drawOneThing(doc: PDFKit.PDFDocument, report: ScoredReport, x: number, y: number, width: number): number {
  const contentWidth = width - 24;
  const quote = `“${pdfText(report.oneThing.change)}”`;
  const quoteHeight = measureParagraph(doc, quote, { width: contentWidth, size: 15, lineGap: 4, font: "Helvetica-Oblique" });
  const boxY = y + 14;
  const boxHeight = quoteHeight + 44;

  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(8.2).text("THE ONE THING", x, y);
  doc.roundedRect(x, boxY, width, boxHeight, 6).fillColor(GREY_SOFT).fill();
  doc.fillColor(INK).font("Helvetica-Oblique").fontSize(15).text(quote, x + 12, boxY + 14, { width: contentWidth, lineGap: 4 });

  const projectedY = boxY + 14 + quoteHeight + 10;
  const projectedText = `Projected score    ${pdfText(report.oneThing.projectedScore)}    +${(report.oneThing.projectedScore - report.totalScore).toFixed(1)}`;
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(8).text(projectedText, x + 12, projectedY, { width: contentWidth });
  return boxY + boxHeight + 12;
}

function drawBrief(doc: PDFKit.PDFDocument, brief: string, x: number, y: number, width: number): number {
  const textHeight = measureParagraph(doc, brief, { width, size: 9.5, lineGap: 4 });
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(8.2).text("THE BRIEF", x, y);
  doc.fillColor(INK).font("Helvetica").fontSize(9.5).text(brief, x, y + 20, { width, lineGap: 4 });
  return y + 20 + textHeight + 12;
}

function drawRedFlags(doc: PDFKit.PDFDocument, redFlags: string[], x: number, y: number, width: number): number {
  if (redFlags.length === 0) {
    const boxHeight = 76;
    doc.roundedRect(x, y, width, boxHeight, 6).fillColor(GREY_SOFT).fill();
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(8.2).text("RED FLAGS", x + 12, y + 12);
    doc.fillColor(INK_MUTED).font("Helvetica").fontSize(9.5).text("None identified in this call.", x + 12, y + 30, { width: width - 24 });
    return y + boxHeight + 12;
  }

  const itemWidth = width - 32;
  const itemHeights = redFlags.map((flag) => measureParagraph(doc, flag, { width: itemWidth, size: 8.8, lineGap: 2 }));
  const boxHeight = Math.max(82, 30 + itemHeights.reduce((sum, height) => sum + height + 5, 0) + 8);
  doc.roundedRect(x, y, width, boxHeight, 6).fillColor(FLAG_SOFT).fill();
  doc.fillColor(FLAG).font("Helvetica-Bold").fontSize(8.2).text(`RED FLAGS · ${redFlags.length}`, x + 12, y + 12);

  let itemY = y + 30;
  redFlags.forEach((flag, index) => {
    doc.fillColor(FLAG).font("Helvetica-Bold").fontSize(10).text("•", x + 12, itemY);
    doc.fillColor(INK).font("Helvetica").fontSize(8.8).text(flag, x + 20, itemY, { width: itemWidth, lineGap: 2 });
    itemY += itemHeights[index] + 5;
  });
  return y + boxHeight + 12;
}

function drawCaps(doc: PDFKit.PDFDocument, caps: AppliedCap[], x: number, y: number, width: number): number {
  const binding = caps.filter((cap) => cap.binding);
  const nonBinding = caps.filter((cap) => !cap.binding);
  const contentWidth = width - 24;
  const nonBindingHeights = nonBinding.map((cap) => measureParagraph(doc, `• ${cap.label}`, { width: contentWidth, size: 8.6, lineGap: 2 }));
  const bindingLabelHeights = binding.map((cap) => measureParagraph(doc, cap.label, { width: contentWidth, size: 8.6, lineGap: 2 }));
  const bindingNoteHeights = binding.map((cap) => measureParagraph(doc, cap.note, { width: contentWidth, size: 8.2, lineGap: 2 }));
  const noPenaltyText = "No penalty applied because these conditions did not further reduce an already-limited dimension score.";
  const noPenaltyHeight = measureParagraph(doc, noPenaltyText, { width: contentWidth, size: 8.2, lineGap: 2 });
  const conditionsHeight = nonBinding.length > 0
    ? 16 + 17 + nonBindingHeights.reduce((sum, height) => sum + height + 5, 0) + noPenaltyHeight + 11
    : 0;
  const appliedHeight = binding.length > 0
    ? 14 + binding.reduce((sum, _, index) => sum + bindingLabelHeights[index] + 6 + bindingNoteHeights[index] + 10, 0)
    : 0;
  const totalHeight = Math.max(70, 24 + conditionsHeight + appliedHeight);

  doc.roundedRect(x, y, width, totalHeight, 6).fillColor(GREY_SOFT).fill();
  let currentY = y + 12;

  if (nonBinding.length > 0) {
    doc.fillColor(INK_MUTED).font("Helvetica-Bold").fontSize(8.2).text("CAP CONDITIONS MET · NO SCORE PENALTY", x + 12, currentY, { width: contentWidth });
    currentY += 16;
    doc.fillColor(INK_MUTED).font("Helvetica").fontSize(8.2).text(`${nonBinding.length} condition${nonBinding.length === 1 ? "" : "s"} met`, x + 12, currentY, { width: contentWidth });
    currentY += 17;

    nonBinding.forEach((cap, index) => {
      doc.fillColor(INK).font("Helvetica").fontSize(8.6).text(`• ${cap.label}`, x + 12, currentY, { width: contentWidth, lineGap: 2 });
      currentY += nonBindingHeights[index] + 5;
    });

    doc.fillColor(INK_MUTED).font("Helvetica").fontSize(8.2).text(noPenaltyText, x + 12, currentY + 3, { width: contentWidth, lineGap: 2 });
    currentY += noPenaltyHeight + 11;
  }

  if (binding.length > 0) {
    doc.fillColor(FLAG).font("Helvetica-Bold").fontSize(8.2).text("CAP APPLIED · SCORE PENALTY", x + 12, currentY, { width: contentWidth });
    currentY += 14;
    binding.forEach((cap, index) => {
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(8.6).text(cap.label, x + 12, currentY, { width: contentWidth, lineGap: 2 });
      currentY += bindingLabelHeights[index] + 6;
      doc.fillColor(INK_MUTED).font("Helvetica").fontSize(8.2).text(cap.note, x + 12, currentY, { width: contentWidth, lineGap: 2 });
      currentY += bindingNoteHeights[index] + 10;
    });
  }

  return y + totalHeight + 12;
}

function drawDimension(doc: PDFKit.PDFDocument, dimension: ScoredReport["dimensions"][number], index: number, report: ScoredReport, pageNumber: number) {
  const labelY = doc.y;
  const headerWidth = PAGE_WIDTH - MARGIN * 2;
  const status = dimension.disabled ? "N/A" : dimension.band;
  const statusColor = dimension.disabled ? INK_MUTED : getBandColor(status);
  const scoreText = dimension.disabled ? "N/A" : `${dimension.score} / ${dimension.max}`;
  const title = `${String(index).padStart(2, "0")}  ${dimension.name}`;

  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10.5).text(title, MARGIN, labelY, { width: headerWidth - 100 });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(scoreText, PAGE_WIDTH - MARGIN - 80, labelY, { align: "right", width: 80 });

  doc.fillColor(statusColor).font("Helvetica-Bold").fontSize(7.7).text(status.toUpperCase(), MARGIN + 24, labelY + 20);
  doc.moveTo(MARGIN + 20, labelY + 32).lineTo(PAGE_WIDTH - MARGIN, labelY + 32).strokeColor(LINE).lineWidth(0.8).stroke();
  doc.y = labelY + 42;

  if (!dimension.disabled) {
    const reasoning = pdfText(dimension.reasoning);
    doc.fillColor(INK).font("Helvetica").fontSize(9.5).text(reasoning, { width: PAGE_WIDTH - MARGIN * 2, lineGap: 4 });
    addSectionGap(doc, 10);

    const quotes = Array.isArray(dimension.quotes) ? dimension.quotes : [];
    if (quotes.length > 0) {
      drawLabel(doc, "Evidence", TEAL, 8.5);
      addSectionGap(doc, 6);
      quotes.forEach((quote) => {
        const turns = splitQuoteIntoTurns(quote, report.coachName, report.clientName);
        turns.forEach((turn) => {
          const lineText = `L${turn.lineId}  ${turn.speakerLabel}`;
          const quoteText = truncateQuoteText(turn.text, 180).text;
          const lineWidth = PAGE_WIDTH - MARGIN * 2;

          doc.fillColor(INK_MUTED).font("Helvetica-Bold").fontSize(7.5).text(lineText, MARGIN + 10, doc.y + 1, { width: 90 });
          doc.moveTo(MARGIN, doc.y + 10).lineTo(MARGIN + 4, doc.y + 10).strokeColor(TEAL).lineWidth(1).stroke();
          doc.fillColor(INK).font("Helvetica").fontSize(8.8).text(quoteText, MARGIN + 100, doc.y, { width: lineWidth - 108, lineGap: 2 });
          doc.y += 18;
        });
      });
      addSectionGap(doc, 8);
    }

    drawLabel(doc, "Quick fix", TEAL, 8.5);
    addSectionGap(doc, 4);
    const quickFixText = pdfText(dimension.quickFix);
    const quickFixY = doc.y;
    const boxY = quickFixY;
    const quickFixHeight = 30 + (quickFixText.length > 120 ? 12 : 0);
    doc.roundedRect(MARGIN, boxY, PAGE_WIDTH - MARGIN * 2, quickFixHeight, 5).fillColor(GREY_SOFT).fill();
    doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(9).text("→", MARGIN + 10, boxY + 9);
    doc.fillColor(INK).font("Helvetica").fontSize(9.1).text(quickFixText, MARGIN + 22, boxY + 9, { width: PAGE_WIDTH - MARGIN * 2 - 32, lineGap: 2 });
    doc.y = boxY + quickFixHeight + 12;
  } else {
    doc.fillColor(INK_MUTED).font("Helvetica").fontSize(9).text(pdfText(dimension.disabledReason ?? "Not applicable to this call."), { width: PAGE_WIDTH - MARGIN * 2, lineGap: 4 });
    doc.y += 12;
  }

  doc.y += 8;
}

export async function renderReportPdf(report: ScoredReport, callType: CallType): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const chunks: Buffer[] = [];
    let pageNumber = 1;

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const addHeader = () => drawPageHeader(document, report, callType, pageNumber);
    addHeader();
    document.y = 78;

    const leftColWidth = 260;
    const rightColX = 330;
    const rightColWidth = 210;
    let leftY = 118;
    let rightY = 68;

    rightY = drawOverallScore(document, report, rightColX - 8, rightY, rightColWidth);
    rightY = drawBrief(document, report.brief, rightColX, rightY + 16, rightColWidth);
    rightY = drawCaps(document, report.capsApplied, rightColX, rightY + 16, rightColWidth);

    leftY = drawOneThing(document, report, MARGIN, leftY, leftColWidth);
    leftY = drawRedFlags(document, report.redFlags, MARGIN, leftY + 16, leftColWidth);

    document.y = Math.max(leftY, rightY) + 12;
    drawPageFooter(document, pageNumber);

    pageNumber += 1;
    document.addPage();
    drawPageHeader(document, report, callType, pageNumber);
    document.y = 80;

    drawLabel(document, "Dimensions", TEAL, 9);
    addSectionGap(document, 6);

    report.dimensions.forEach((dimension, index) => {
      maybeAddPageBefore(document, 140, () => {
        document.addPage();
        pageNumber += 1;
        drawPageHeader(document, report, callType, pageNumber);
      });
      drawDimension(document, dimension, index + 1, report, pageNumber);
    });

    drawPageFooter(document, pageNumber);
    document.end();
  });
}
