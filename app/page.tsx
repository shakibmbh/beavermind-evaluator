import { TranscriptForm } from "@/components/transcript-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Halden Method</h1>
        <p className="text-muted-foreground text-lg">Call Quality Evaluator</p>
      </div>
      <TranscriptForm />
    </main>
  );
}
