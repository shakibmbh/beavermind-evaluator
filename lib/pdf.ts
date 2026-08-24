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
const GREEN = "#2E6F61";

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
  if (normalized.includes("elite") || normalized.includes("strong")) return GREEN;
  if (normalized.includes("inconsistent") || normalized.includes("mid")) return AMBER;
  if (normalized.includes("at risk") || normalized.includes("weak")) return FLAG;
  return INK_MUTED;
}

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

function drawOverallScore(doc: PDFKit.PDFDocument, report: ScoredReport, x = MARGIN, y = 80) {
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(8.2).text("OVERALL SCORE", x, y);
  const scoreY = y + 18;
  doc.fillColor(AMBER).font("Helvetica-Bold").fontSize(30).text(`${pdfText(report.totalScore)}/100`, x, scoreY);

  const bandColor = getBandColor(report.gradeBand);
  doc.fillColor(bandColor).font("Helvetica-Bold").fontSize(9).text(pdfText(report.gradeBand).toUpperCase(), x, scoreY + 30);

  const barWidth = 150;
  const barX = x;
  const barY = scoreY + 44;
  const fillWidth = (report.totalScore / 100) * barWidth;
  doc.rect(barX, barY, barWidth, 8).fillColor("#E5E2DA").fill();
  doc.rect(barX, barY, fillWidth, 8).fillColor(TEAL).fill();

  doc.fillColor(INK_MUTED).font("Helvetica").fontSize(8).text(
    `Projected score ${pdfText(report.oneThing.projectedScore)} / 100   +${(report.oneThing.projectedScore - report.totalScore).toFixed(1)}`,
    barX,
    barY + 14,
    { width: 220 }
  );

  doc.y = barY + 38;
}

function drawOneThing(doc: PDFKit.PDFDocument, report: ScoredReport, x = MARGIN, y = 140, width = 300) {
  const blockY = y;
  const blockHeight = 120;
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(8.2).text("THE ONE THING", x, blockY);
  doc.roundedRect(x, blockY + 14, width, blockHeight, 6).fillColor(GREY_SOFT).fill();
  doc.fillColor(INK).font("Helvetica-Oblique").fontSize(15).text(`“${pdfText(report.oneThing.change)}”`, x + 12, blockY + 28, { width: width - 24, lineGap: 4 });

  const projectedText = `Projected score    ${pdfText(report.oneThing.projectedScore)}    ↑ +${(report.oneThing.projectedScore - report.totalScore).toFixed(1)}`;
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(8).text(projectedText, x + 12, blockY + 92, { width: width - 24 });

  doc.y = blockY + blockHeight + 18;
}

function drawBrief(doc: PDFKit.PDFDocument, brief: string, x = MARGIN, y = 96, width = 260) {
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(8.2).text("THE BRIEF", x, y);
  doc.fillColor(INK).font("Helvetica").fontSize(9.5).text(brief, x, y + 20, { width, lineGap: 4 });
}

function drawRedFlags(doc: PDFKit.PDFDocument, redFlags: string[], x = MARGIN, y = 340, width = 300) {
  if (redFlags.length === 0) {
    doc.roundedRect(x, y, width, 76, 6).fillColor(GREY_SOFT).fill();
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(8.2).text("RED FLAGS", x + 12, y + 12);
    doc.fillColor(INK_MUTED).font("Helvetica").fontSize(9.5).text("None identified in this call.", x + 12, y + 30, { width: width - 24 });
    return;
  }

  const boxHeight = Math.max(82, 26 + redFlags.length * 18);
  doc.roundedRect(x, y, width, boxHeight, 6).fillColor(FLAG_SOFT).fill();
  doc.fillColor(FLAG).font("Helvetica-Bold").fontSize(8.2).text(`RED FLAGS · ${redFlags.length}`, x + 12, y + 12);

  redFlags.forEach((flag, index) => {
    const lineY = y + 30 + index * 17;
    doc.fillColor(FLAG).font("Helvetica-Bold").fontSize(10).text("•", x + 12, lineY);
    doc.fillColor(INK).font("Helvetica").fontSize(8.8).text(flag, x + 20, lineY, { width: width - 32, lineGap: 2 });
  });
}

function drawCaps(doc: PDFKit.PDFDocument, caps: AppliedCap[], x = MARGIN + 310, y = 320, width = 245) {
  const binding = caps.filter((cap) => cap.binding);
  const nonBinding = caps.filter((cap) => !cap.binding);
  const totalHeight = 70 + (binding.length > 0 ? binding.length * 34 : 0) + (nonBinding.length > 0 ? 88 : 0);

  doc.roundedRect(x, y, width, totalHeight, 6).fillColor(GREY_SOFT).fill();

  if (nonBinding.length > 0) {
    doc.fillColor(INK_MUTED).font("Helvetica-Bold").fontSize(8.2).text("CAP CONDITIONS MET · NO SCORE PENALTY", x + 12, y + 12);
    doc.fillColor(INK_MUTED).font("Helvetica").fontSize(8.2).text(`${nonBinding.length} condition${nonBinding.length === 1 ? "" : "s"} met`, x + 12, y + 28, { width: width - 24 });

    let itemY = y + 45;
    nonBinding.forEach((cap) => {
      doc.fillColor(INK).font("Helvetica").fontSize(8.6).text(`• ${cap.label}`, x + 12, itemY, { width: width - 24 });
      itemY += 16;
    });

    doc.fillColor(INK_MUTED).font("Helvetica").fontSize(8.2).text(
      "No penalty applied because these conditions did not further reduce an already-limited dimension score.",
      x + 12,
      itemY + 6,
      { width: width - 24, lineGap: 2 }
    );
  }

  if (binding.length > 0) {
    doc.fillColor(FLAG).font("Helvetica-Bold").fontSize(8.2).text("CAP APPLIED · SCORE PENALTY", x + 12, y + 12);
    let currentY = y + 26;
    binding.forEach((cap) => {
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(8.6).text(cap.label, x + 12, currentY, { width: width - 24 });
      currentY += 18;
      doc.fillColor(INK_MUTED).font("Helvetica").fontSize(8.2).text(cap.note, x + 12, currentY, { width: width - 24, lineGap: 2 });
      currentY += 22;
    });
  }
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

    const leftColWidth = 300;
    const rightColX = MARGIN + leftColWidth + 22;
    const rightColWidth = PAGE_WIDTH - rightColX - MARGIN;

    drawOverallScore(document, report, rightColX - 8, 68);
    drawBrief(document, report.brief, rightColX, 120, rightColWidth);
    drawCaps(document, report.capsApplied, rightColX, 300, rightColWidth);

    drawOneThing(document, report, MARGIN, 118, leftColWidth);
    drawRedFlags(document, report.redFlags, MARGIN, 310, leftColWidth);

    document.y = 410;
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