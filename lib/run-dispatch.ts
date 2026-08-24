const DISPATCH_FAILURE_MESSAGE = "The evaluation could not be queued for processing. Please try again.";

type RunUpdateClient = {
  from: (table: "runs") => {
    update: (values: { status: "failed"; error_message: string }) => {
      eq: (column: "id" | "status", value: string) => {
        eq: (column: "id" | "status", value: string) => {
          select: (columns: string) => {
            single: () => PromiseLike<{ data: { id: string } | null; error: { message: string } | null }>;
          };
        };
      };
    };
  };
};

export async function markDispatchFailure(supabase: RunUpdateClient, runId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("runs")
      .update({ status: "failed", error_message: DISPATCH_FAILURE_MESSAGE })
      .eq("id", runId)
      .eq("status", "queued")
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to mark run as failed after event dispatch error", error?.message ?? "Run was not queued.");
    }
  } catch (error) {
    console.error("Failed to mark run as failed after event dispatch error", error instanceof Error ? error.message : "Unknown database error.");
  }
}