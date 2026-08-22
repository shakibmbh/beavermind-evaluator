import { supabaseServer } from "./supabase/server";

const BUCKET = "reports";

async function ensureReportsBucket() {
  const supabase = supabaseServer();
  const { data: bucket, error: lookupError } = await supabase.storage.getBucket(BUCKET);

  if (bucket) return supabase;
  if (lookupError && !lookupError.message.toLowerCase().includes("not found")) {
    throw new Error(`Failed to check report PDF bucket: ${lookupError.message}`);
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(`Failed to create report PDF bucket: ${createError.message}`);
  }

  return supabase;
}

export async function uploadReportPdf(runId: string, pdf: Buffer): Promise<string> {
  const supabase = await ensureReportsBucket();
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
