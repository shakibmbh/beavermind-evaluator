// PDFKit's standalone build inlines standard-font metrics for bundled runtimes.
// @ts-expect-error PDFKit does not publish declarations for this browserified entrypoint.
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import type { ScoredReport, CallType } from "./rubrics/types";

const INK = "#1C1E21";
const INK_MUTED = "#5B5D57";
const TEAL = "#17494B";
const AMBER = "#C98A2C";
const FLAG = "#B4432F";

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

export async function renderReportPdf(report: ScoredReport, callType: CallType): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margins: { top: 40, bottom: 40, left: 40, right: 40 } });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.font("Helvetica").fontSize(9).fillColor(INK_MUTED).text(
      callType === "kickoff" ? "KICK-OFF CALL EVALUATION" : "COACHING CALL EVALUATION"
    );
    document.moveDown(0.3).font("Helvetica-Bold").fontSize(20).fillColor(TEAL).text("Call Evaluation Report");
    document.moveDown(0.8).font("Helvetica-Bold").fontSize(22).fillColor(AMBER)
      .text(`${pdfText(report.totalScore)}/100`);
    document.font("Helvetica").fontSize(9).fillColor(INK_MUTED).text(pdfText(report.gradeBand));
    document.moveDown(0.5).text(
      `Scored ${pdfText(report.rawScore)} of ${pdfText(report.rawMax)} available points across ` +
      `${pdfText(report.dimensions.filter((dimension) => !dimension.disabled).length)} active dimensions.`
    );

    document.font("Helvetica-Bold").fontSize(12).fillColor(TEAL).moveDown(1).text("The one thing");
    document.font("Helvetica").fontSize(10).fillColor(INK).text(pdfText(report.oneThing.change));
    document.fontSize(9).fillColor(TEAL).text(
      `Projected score with this change: ${pdfText(report.oneThing.projectedScore)}/100`
    );

    document.font("Helvetica-Bold").fontSize(12).fillColor(TEAL).moveDown(1).text("The brief");
    document.font("Helvetica").fontSize(10).fillColor(INK).text(pdfText(report.brief));

    document.font("Helvetica-Bold").fontSize(12).fillColor(TEAL).moveDown(1).text("Red flags");
    if (report.redFlags.length === 0) {
      document.font("Helvetica").fontSize(10).fillColor(INK).text("None identified in this call.");
    } else {
      report.redFlags.forEach((flag) => {
        document.font("Helvetica").fontSize(10).fillColor(FLAG).text(`- ${pdfText(flag)}`);
      });
    }

    if (report.capsApplied.length > 0) {
      document.moveDown(0.5).fontSize(8.5).fillColor(INK_MUTED).text(
        `Automatic caps applied: ${pdfText(report.capsApplied.map((cap) => cap.label).join(" | "))}`
      );
    }

    document.font("Helvetica-Bold").fontSize(12).fillColor(TEAL).moveDown(1).text("Dimensions");
    report.dimensions.forEach((dimension) => {
      document.moveDown(0.5).font("Helvetica-Bold").fontSize(10.5).fillColor(INK).text(
        `${pdfText(dimension.name)}  ${dimension.disabled ? "N/A" : `${dimension.score}/${dimension.max}`}`
      );
      document.font("Helvetica").fontSize(8.5).fillColor(INK_MUTED).text(
        pdfText(dimension.disabled ? dimension.disabledReason ?? "Not applicable to this call" : dimension.band)
      );
      if (!dimension.disabled) {
        document.fontSize(9.5).fillColor(INK).text(pdfText(dimension.reasoning));
        dimension.quotes.forEach((quote) => {
          document.font("Courier").fontSize(8.5).fillColor(INK_MUTED).text(`"${pdfText(quote)}"`);
        });
        if (dimension.quotes.length === 0) {
          document.font("Helvetica-Oblique").fontSize(8.5).text("No verbatim transcript evidence for this claim.");
        }
        document.font("Helvetica").fontSize(9).fillColor(TEAL).text(`Quick fix: ${pdfText(dimension.quickFix)}`);
      }
    });

    document.font("Helvetica").fontSize(8).fillColor(INK_MUTED).moveDown(1)
      .text(`Generated ${new Date(report.scoredAt).toLocaleString()}`, { align: "center" });
    document.end();
  });
}