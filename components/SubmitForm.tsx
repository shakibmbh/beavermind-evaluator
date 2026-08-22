"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CallType } from "@/lib/rubrics/types";

export function SubmitForm() {
  const router = useRouter();
  const [callType, setCallType] = useState<CallType>("kickoff");
  const [transcript, setTranscript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (transcript.trim().length === 0) {
      setError("Paste a transcript before scoring.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callType, transcript })
      });

      const responseText = await res.text();
      let data: { id?: string; error?: string } = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(`The server returned an invalid response (${res.status}).`);
        }
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to start the evaluation.");
      }

      router.push(`/run/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-ink mb-2">Call type</label>
        <div className="flex gap-2" role="radiogroup" aria-label="Call type">
          {(["kickoff", "coaching"] as CallType[]).map((type) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={callType === type}
              onClick={() => setCallType(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                callType === type
                  ? "bg-teal text-paper border-teal"
                  : "bg-transparent text-ink border-line hover:border-teal"
              }`}
            >
              {type === "kickoff" ? "Kick-off call" : "Coaching call"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="transcript" className="block text-sm font-medium text-ink mb-2">
          Transcript
        </label>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="[Coach Name]: Hey, how's it going...&#10;[Client Name]: Good, good..."
          rows={14}
          className="w-full rounded-md border border-line bg-white/60 p-4 font-mono text-sm leading-relaxed text-ink placeholder:text-inkMuted/60 focus:border-teal focus:ring-0"
        />
        <p className="text-xs text-inkMuted mt-1">
          {transcript.length.toLocaleString()} characters
        </p>
      </div>

      {error && (
        <p className="text-sm text-flag bg-flag-light rounded-md px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-teal text-paper font-medium py-3 hover:bg-teal-dark transition-colors disabled:opacity-60"
      >
        {submitting ? "Starting evaluation..." : "Score this call"}
      </button>
    </form>
  );
}
