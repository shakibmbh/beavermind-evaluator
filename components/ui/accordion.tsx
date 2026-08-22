"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const AccordionContext = React.createContext<{ open: string | null; setOpen: (id: string | null) => void }>({
  open: null, setOpen: () => {},
});

function Accordion({ children, className }: { children: React.ReactNode; className?: string }) {
  const [open, setOpen] = React.useState<string | null>(null);
  return (
    <AccordionContext.Provider value={{ open, setOpen }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ children, value, className }: { children: React.ReactNode; value: string; className?: string }) {
  return <div className={cn("border rounded-lg", className)}>{children}</div>;
}

function AccordionTrigger({ children, value, className }: { children: React.ReactNode; value: string; className?: string }) {
  const { open, setOpen } = React.useContext(AccordionContext);
  const isOpen = open === value;
  return (
    <button onClick={() => setOpen(isOpen ? null : value)} className={cn("flex w-full items-center justify-between p-4 text-sm font-medium transition-all hover:underline", className)}>
      {children}
      <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
    </button>
  );
}

function AccordionContent({ children, value, className }: { children: React.ReactNode; value: string; className?: string }) {
  const { open } = React.useContext(AccordionContext);
  if (open !== value) return null;
  return <div className={cn("px-4 pb-4 text-sm", className)}>{children}</div>;
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
