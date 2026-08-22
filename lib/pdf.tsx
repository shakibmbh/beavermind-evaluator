import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { ScoredReport, CallType } from "./rubrics/types";

const INK = "#1C1E21";
const INK_MUTED = "#5B5D57";
const TEAL = "#17494B";
const TEAL_LIGHT = "#E7EFEE";
const AMBER = "#C98A2C";
const AMBER_LIGHT = "#FBF1E1";
const FLAG = "#B4432F";
const FLAG_LIGHT = "#FBEAE6";
const LINE = "#DEDDD6";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  eyebrow: { fontSize: 9, color: INK_MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: TEAL, marginBottom: 12 },
  gradeRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  gradeBox: { backgroundColor: AMBER_LIGHT, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 14 },
  gradeScore: { fontSize: 22, fontFamily: "Helvetica-Bold", color: AMBER },
  gradeBand: { fontSize: 10, color: INK_MUTED, marginTop: 2 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: TEAL, marginTop: 16, marginBottom: 6 },
  paragraph: { fontSize: 10, lineHeight: 1.5, color: INK, marginBottom: 4 },
  oneThingBox: { backgroundColor: TEAL_LIGHT, borderRadius: 4, padding: 10, marginBottom: 4 },
  redFlagBox: { backgroundColor: FLAG_LIGHT, borderRadius: 4, padding: 8, marginBottom: 6 },
  redFlagText: { fontSize: 10, color: FLAG, lineHeight: 1.4 },
  dimRow: { borderTop: `1px solid ${LINE}`, paddingVertical: 8 },
  dimHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  dimName: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: INK },
  dimScore: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: TEAL },
  dimBand: { fontSize: 8.5, color: INK_MUTED, marginBottom: 3 },
  dimReasoning: { fontSize: 9.5, lineHeight: 1.4, color: INK, marginBottom: 3 },
  quote: { fontSize: 8.5, fontFamily: "Courier", color: INK_MUTED, marginBottom: 2, paddingLeft: 8, borderLeft: `2px solid ${LINE}` },
  quickFix: { fontSize: 9, color: TEAL, marginTop: 3 },
  capsNote: { fontSize: 8.5, color: INK_MUTED, marginTop: 10 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: INK_MUTED, textAlign: "center" }
});

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

export function ReportDocument({ report, callType }: { report: ScoredReport; callType: CallType }) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.eyebrow}>{pdfText(callType === "kickoff" ? "Kick-off call evaluation" : "Coaching call evaluation")}</Text>
        <Text style={styles.title}>Call Evaluation Report</Text>

        <View style={styles.gradeRow}>
          <View style={styles.gradeBox}>
            <Text style={styles.gradeScore}>{pdfText(report.totalScore)}/100</Text>
            <Text style={styles.gradeBand}>{pdfText(report.gradeBand)}</Text>
          </View>
          <Text style={{ fontSize: 9, color: INK_MUTED, flex: 1 }}>
            Scored {pdfText(report.rawScore)} of {pdfText(report.rawMax)} available points across {pdfText(report.dimensions.filter((d) => !d.disabled).length)} active dimensions.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>The one thing</Text>
        <View style={styles.oneThingBox}>
          <Text style={styles.paragraph}>{pdfText(report.oneThing.change)}</Text>
          <Text style={{ fontSize: 9, color: TEAL, marginTop: 2 }}>
            Projected score with this change: {pdfText(report.oneThing.projectedScore)}/100
          </Text>
        </View>

        <Text style={styles.sectionTitle}>The brief</Text>
        <Text style={styles.paragraph}>{pdfText(report.brief)}</Text>

        <Text style={styles.sectionTitle}>Red flags</Text>
        {report.redFlags.length === 0 ? (
          <Text style={styles.paragraph}>None identified in this call.</Text>
        ) : (
          report.redFlags.map((flag, i) => (
            <View key={i} style={styles.redFlagBox}>
              <Text style={styles.redFlagText}>{pdfText(flag)}</Text>
            </View>
          ))
        )}

        {report.capsApplied.length > 0 && (
          <Text style={styles.capsNote}>
            Automatic caps applied: {pdfText(report.capsApplied.map((c) => c.label).join(" | "))}
          </Text>
        )}

        <Text style={styles.sectionTitle}>Dimensions</Text>
        {report.dimensions.map((dim) => (
          <View key={dim.id} style={styles.dimRow} wrap={false}>
            <View style={styles.dimHeader}>
              <Text style={styles.dimName}>{pdfText(dim.name)}</Text>
              <Text style={styles.dimScore}>
                {pdfText(dim.disabled ? "N/A" : `${dim.score}/${dim.max}`)}
              </Text>
            </View>
            <Text style={styles.dimBand}>{pdfText(dim.disabled ? dim.disabledReason ?? "Not applicable to this call" : dim.band)}</Text>
            {!dim.disabled && (
              <View>
                <Text style={styles.dimReasoning}>{pdfText(dim.reasoning)}</Text>
                {dim.quotes.map((q, i) => (
                  <Text key={i} style={styles.quote}>&ldquo;{pdfText(q)}&rdquo;</Text>
                ))}
                {dim.quotes.length === 0 && (
                  <Text style={{ fontSize: 8.5, color: INK_MUTED, fontStyle: "italic" }}>
                    No verbatim transcript evidence for this claim.
                  </Text>
                )}
                <Text style={styles.quickFix}>Quick fix: {pdfText(dim.quickFix)}</Text>
              </View>
            )}
          </View>
        ))}

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages} -- generated ${new Date(report.scoredAt).toLocaleString()}`} fixed />
      </Page>
    </Document>
  );
}

export async function renderReportPdf(report: ScoredReport, callType: CallType): Promise<Buffer> {
  return renderToBuffer(<ReportDocument report={report} callType={callType} />);
}
