import { supabaseServer } from "./supabase/server";

const BUCKET = "reports";

export async function uploadReportPdf(runId: string, pdf: Buffer): Promise<string> {
  const supabase = supabaseServer();
  const path = `${runId}.pdf`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, pdf, {
    contentType: "application/pdf",
    upsert: true
  });

  if (error) {
    throw new Error(`Failed to upload report PDF: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
