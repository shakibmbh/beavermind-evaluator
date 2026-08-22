export type RunStatus = "queued" | "running" | "done" | "failed";
export type CallType = "kickoff" | "coaching";

export interface RunRow {
  id: string;
  call_type: CallType;
  transcript: string;
  status: RunStatus;
  error_message: string | null;
  result: unknown | null; // ScoredReport, see lib/rubrics/types.ts
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      runs: {
        Row: RunRow;
        Insert: Partial<RunRow> & {
          call_type: CallType;
          transcript: string;
        };
        Update: Partial<RunRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
