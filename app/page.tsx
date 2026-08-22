import { SubmitForm } from "@/components/SubmitForm";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <p className="font-mono text-xs tracking-widest uppercase text-inkMuted mb-3">
          Call Evaluator
        </p>
        <h1 className="font-display text-4xl italic text-teal mb-3">
          Paste a call, get a scored report.
        </h1>
        <p className="text-inkMuted mb-10 leading-relaxed">
          Drop in a kick-off or coaching call transcript. Every dimension score
          carries the transcript lines it rests on -- nothing is inferred from
          tone or general impression.
        </p>
        <SubmitForm />
      </div>
    </main>
  );
}
