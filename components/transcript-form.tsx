"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function TranscriptForm() {
  const router = useRouter();
  const [callType, setCallType] = useState<"kickoff" | "coaching">("kickoff");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callType, transcript }),
      });
      const data = await res.json();
      if (data.runId) {
        router.push(`/run/${data.runId}`);
      } else {
        alert(data.error || "Failed to submit");
        setLoading(false);
      }
    } catch {
      alert("Network error");
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Evaluate a Call</CardTitle>
        <CardDescription>Paste a transcript and select the call type to generate a scored report.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Call Type</label>
            <Select value={callType} onChange={(e) => setCallType(e.target.value as "kickoff" | "coaching")}>
              <option value="kickoff">Kick-off Call</option>
              <option value="coaching">Coaching Call</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transcript</label>
            <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste the full transcript here..." rows={16} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating evaluation..." : "Evaluate Transcript"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
